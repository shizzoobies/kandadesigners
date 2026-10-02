import fs from "node:fs";
import path from "node:path";
import { TO_BE_RELEASED, ALREADY_RELEASED } from "./paths.mjs";
import { listDayFolders, readManifest, writeManifest, assertTransition, instagramSound } from "./manifest.mjs";
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

/**
 * Where each listed post stands. Metricool keeps a published post in getScheduledPosts with every provider
 * marked status "PUBLISHED" (and a publicUrl), so a uuid is only pending while some provider is not PUBLISHED.
 * A provider whose status names an error or failure is also collected (failed: uuid -> networks, failedStatus:
 * uuid -> { network: status }), so reconcile can report it.
 */
export function listingStatus(response) {
  const pending = new Set();
  const permalinks = new Map();
  const failed = new Map();
  const failedStatus = new Map();
  for (const item of itemsIn(response)) {
    if (!item || typeof item.uuid !== "string") continue;
    const providers = Array.isArray(item.providers) ? item.providers : [];
    const done = providers.length > 0 && providers.every((p) => p && p.status === "PUBLISHED");
    if (!done) pending.add(item.uuid);
    const links = {};
    for (const p of providers) if (p && p.status === "PUBLISHED" && typeof p.publicUrl === "string") links[p.network] = p.publicUrl;
    permalinks.set(item.uuid, links);
    const badProviders = providers.filter((p) => p && /ERROR|FAIL/i.test(String(p.status || "")));
    if (badProviders.length) {
      failed.set(item.uuid, badProviders.map((p) => p.network));
      failedStatus.set(item.uuid, Object.fromEntries(badProviders.map((p) => [p.network, String(p.status)])));
    }
  }
  return { pending, permalinks, failed, failedStatus };
}

function recordedUuids(m) {
  return Object.values(m.metricool || {}).map((rec) => rec && rec.uuid).filter(Boolean).map(String);
}

function hasDraft(m) {
  return Object.values(m.metricool || {}).some((rec) => rec && rec.draft === true);
}

/**
 * The getScheduledPosts arguments that cover every scheduled folder and today: from the earlier of the earliest
 * folder date and today at 00:00:00 to the later of the latest folder date and tomorrow at 23:59:59, New York time.
 * null when nothing is scheduled.
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
  const today = todayInNewYork(now);
  const tomorrow = todayInNewYork(new Date(now.getTime() + 86400000));
  const from = dates[0] < today ? dates[0] : today;
  const to = dates[dates.length - 1] > tomorrow ? dates[dates.length - 1] : tomorrow;
  return {
    fromDate: isoWithOffset(from, "00:00", WINDOW_ZONE),
    toDate: isoWithOffset(to, "23:59", WINDOW_ZONE).replace("T23:59:00", "T23:59:59"),
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
  const { pending, permalinks, failed: failedListings, failedStatus } = listingStatus(response);
  const listedDrafts = draftUuidsIn(response);
  const published = [];
  const waiting = [];
  const drafts = [];
  const failed = [];
  const errors = [];
  const manualAudio = [];
  const manualAudioErrors = [];

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
      // Sent with autoPublish off (release --record --manual-audio): it waits on a person in the Metricool app,
      // so a status Metricool gives it meanwhile is a reminder, not a failure.
      const ig = m.metricool && m.metricool.instagram;
      const manualUuid = ig && ig.manualAudio === true && ig.uuid ? String(ig.uuid) : null;
      if (manualUuid && pending.has(manualUuid)) {
        manualAudio.push({ folder: name, sound: instagramSound(m) });
        const status = (failedStatus.get(manualUuid) || {}).instagram;
        if (status) manualAudioErrors.push({ folder: name, status });
      }
      if (hasDraft(m) || mine.some((u) => listedDrafts.has(u))) { waiting.push(name); drafts.push(name); continue; }
      const bad = mine.flatMap((u) => (failedListings.get(u) || []).filter((n) => !(u === manualUuid && n === "instagram")));
      if (bad.length) { failed.push({ folder: name, networks: bad }); waiting.push(name); continue; }
      const postTime = localToUtc(m.date, m.time, m.timezone);
      // Gone from the list, or listed with every provider PUBLISHED.
      const done = mine.length > 0 && !mine.some((u) => pending.has(u));
      if (postTime > now || !done) { waiting.push(name); continue; }
      const target = archiveTarget(root, name);
      if (dryRun) { published.push(name); continue; }
      assertTransition(m.status, "published");
      m.status = "published";
      m.published = { at: postTime.toISOString() };
      for (const [n, rec] of Object.entries(m.metricool || {})) {
        const links = (rec && rec.uuid && permalinks.get(String(rec.uuid))) || {};
        m.published[n] = { permalink: links[n] || "" };
      }
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

  return { published, waiting, drafts, failed, deleted, errors, manualAudio, manualAudioErrors, studio: studioPending(root, now) };
}

/**
 * Folders whose youtube post has gone up (sent, not a draft, its own time passed) but whose Studio checklist
 * is not marked done with release --studio-done yet. Both buckets: a published folder has usually moved.
 */
function studioPending(root, now) {
  const out = [];
  for (const bucket of [TO_BE_RELEASED, ALREADY_RELEASED]) {
    for (const dir of listDayFolders(root, bucket)) {
      let m;
      try {
        m = readManifest(dir);
      } catch {
        continue;
      }
      const cfg = m.platforms && m.platforms.youtube;
      const rec = m.metricool && m.metricool.youtube;
      if (!cfg || cfg.manual || !rec || !rec.id || rec.draft === true || rec.studioDoneAt) continue;
      if (m.status !== "scheduled" && m.status !== "published") continue;
      if (localToUtc(m.date, cfg.time || m.time, m.timezone) > now) continue;
      out.push(path.basename(dir));
    }
  }
  return out.sort();
}
