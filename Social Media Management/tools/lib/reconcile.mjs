import fs from "node:fs";
import path from "node:path";
import { TO_BE_RELEASED, ALREADY_RELEASED } from "./paths.mjs";
import { listDayFolders, readManifest, writeManifest, assertTransition } from "./manifest.mjs";
import { localToUtc } from "./validate.mjs";
import { isoWithOffset } from "./payload.mjs";
import { todayInNewYork } from "./calendar.mjs";
import { r2Delete } from "./cloudflare.mjs";

const WINDOW_ZONE = "America/New_York";

function itemsIn(response) {
  if (Array.isArray(response)) return response;
  if (response && typeof response === "object" && Array.isArray(response.data)) return response.data;
  throw new Error("getScheduledPosts response is not a list");
}

/** Every uuid string in a getScheduledPosts response. Ids are left out: Metricool changes them on every update. */
export function uuidsIn(response) {
  const out = new Set();
  for (const item of itemsIn(response)) if (item && typeof item.uuid === "string") out.add(item.uuid);
  return out;
}

/** The uuids of the items in a getScheduledPosts response that are still drafts. */
export function draftUuidsIn(response) {
  const out = new Set();
  for (const item of itemsIn(response)) if (item && item.draft === true && typeof item.uuid === "string") out.add(item.uuid);
  return out;
}

function recordedUuids(m) {
  return Object.values(m.metricool || {}).map((rec) => rec && rec.uuid).filter(Boolean).map(String);
}

function hasDraft(m) {
  return Object.values(m.metricool || {}).some((rec) => rec && rec.draft === true);
}

/**
 * The getScheduledPosts arguments that cover every scheduled folder: from the earliest one's date at 00:00:00
 * to tomorrow at 23:59:59, New York time. null when nothing is scheduled.
 */
export function reconcileWindow(root, now = new Date()) {
  const dates = [];
  for (const dir of listDayFolders(root, TO_BE_RELEASED)) {
    let m;
    try {
      m = readManifest(dir);
    } catch {
      continue;
    }
    if (m && m.status === "scheduled" && typeof m.date === "string") dates.push(m.date);
  }
  if (!dates.length) return null;
  dates.sort();
  const tomorrow = todayInNewYork(new Date(now.getTime() + 86400000));
  return {
    fromDate: isoWithOffset(dates[0], "00:00", WINDOW_ZONE),
    toDate: isoWithOffset(tomorrow, "23:59", WINDOW_ZONE).replace("T23:59:00", "T23:59:59"),
    timezone: WINDOW_ZONE,
    extendedRange: true
  };
}

function archiveTarget(root, name) {
  const target = path.join(root, ALREADY_RELEASED, name);
  if (fs.existsSync(target)) throw new Error(`${name}: already exists in ${ALREADY_RELEASED}`);
  return target;
}

/**
 * Move scheduled folders that have published, then clean up old R2 objects.
 * response is the raw JSON Claude saved from getScheduledPosts. del(key) is injectable.
 * One bad folder is recorded in errors and the run goes on.
 */
export function reconcile({ root, response, now = new Date(), del = (key) => r2Delete(key), dryRun = false, retentionDays = 7 }) {
  const stillScheduled = uuidsIn(response);
  const listedDrafts = draftUuidsIn(response);
  const published = [];
  const waiting = [];
  const drafts = [];
  const errors = [];

  for (const dir of listDayFolders(root, TO_BE_RELEASED)) {
    const name = path.basename(dir);
    try {
      const m = readManifest(dir);
      if (m.status === "published") {
        // Published on an earlier run whose move failed: finish the move.
        const target = archiveTarget(root, name);
        if (!dryRun) fs.renameSync(dir, target);
        published.push(name);
        continue;
      }
      if (m.status !== "scheduled") continue;
      const mine = recordedUuids(m);
      if (hasDraft(m) || mine.some((u) => listedDrafts.has(u))) { waiting.push(name); drafts.push(name); continue; }
      const postTime = localToUtc(m.date, m.time, m.timezone);
      const gone = mine.length > 0 && !mine.some((u) => stillScheduled.has(u));
      if (postTime > now || !gone) { waiting.push(name); continue; }
      const target = archiveTarget(root, name);
      if (dryRun) { published.push(name); continue; }
      assertTransition(m.status, "published");
      m.status = "published";
      m.published = { at: postTime.toISOString() };
      for (const n of Object.keys(m.metricool || {})) m.published[n] = { permalink: "" };
      m.lastError = null;
      writeManifest(dir, m);
      fs.renameSync(dir, target);
      published.push(name);
    } catch (err) {
      errors.push({ folder: name, message: err.message });
    }
  }

  const deleted = [];
  const cutoff = now.getTime() - retentionDays * 86400000;
  for (const dir of listDayFolders(root, ALREADY_RELEASED)) {
    const name = path.basename(dir);
    try {
      const m = readManifest(dir);
      if (!m.published || !m.published.at || new Date(m.published.at).getTime() > cutoff) continue;
      for (const rec of Object.values(m.r2 || {})) {
        if (!rec || typeof rec !== "object") continue;
        for (const key of Array.isArray(rec.previous) ? [...rec.previous] : []) {
          deleted.push({ folder: name, key });
          if (dryRun) continue;
          del(key);
          rec.previous = rec.previous.filter((k) => k !== key);
          writeManifest(dir, m);
        }
        if (!rec.key || rec.deletedAt) continue;
        deleted.push({ folder: name, key: rec.key });
        if (dryRun) continue;
        del(rec.key);
        rec.deletedAt = now.toISOString();
        writeManifest(dir, m);
      }
    } catch (err) {
      errors.push({ folder: name, message: err.message });
    }
  }

  return { published, waiting, drafts, deleted, errors };
}
