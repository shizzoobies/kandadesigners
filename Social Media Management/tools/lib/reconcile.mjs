import fs from "node:fs";
import path from "node:path";
import { TO_BE_RELEASED, ALREADY_RELEASED } from "./paths.mjs";
import { listDayFolders, readManifest, writeManifest, assertTransition } from "./manifest.mjs";
import { localToUtc } from "./validate.mjs";
import { r2Delete } from "./cloudflare.mjs";

/** Every top-level uuid and id of the items in a getScheduledPosts response. */
export function uuidsIn(response) {
  const items = Array.isArray(response) ? response : (response && Array.isArray(response.data) ? response.data : []);
  const out = new Set();
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    for (const k of ["id", "uuid"]) if (item[k] !== undefined && item[k] !== null) out.add(String(item[k]));
  }
  return out;
}

function recordedUuids(m) {
  return Object.values(m.metricool || {}).flatMap((rec) => [rec.uuid, rec.id]).filter(Boolean).map(String);
}

/**
 * Move scheduled folders that have published, then clean up old R2 objects.
 * response is the raw JSON Claude saved from getScheduledPosts. del(key) is injectable.
 */
export function reconcile({ root, response, now = new Date(), del = (key) => r2Delete(key), dryRun = false, retentionDays = 7 }) {
  const stillScheduled = uuidsIn(response);
  const published = [];
  const waiting = [];

  for (const dir of listDayFolders(root, TO_BE_RELEASED)) {
    const m = readManifest(dir);
    if (m.status !== "scheduled") continue;
    const name = path.basename(dir);
    const mine = recordedUuids(m);
    const postTime = localToUtc(m.date, m.time, m.timezone);
    const gone = mine.length > 0 && !mine.some((u) => stillScheduled.has(u));
    if (postTime > now || !gone) { waiting.push(name); continue; }
    published.push(name);
    if (dryRun) continue;
    assertTransition(m.status, "published");
    m.status = "published";
    m.published = { at: postTime.toISOString() };
    for (const n of Object.keys(m.metricool || {})) m.published[n] = { permalink: "" };
    m.lastError = null;
    writeManifest(dir, m);
    const target = path.join(root, ALREADY_RELEASED, name);
    if (fs.existsSync(target)) throw new Error(`${name}: already exists in ${ALREADY_RELEASED}`);
    fs.renameSync(dir, target);
  }

  const deleted = [];
  const cutoff = now.getTime() - retentionDays * 86400000;
  for (const dir of listDayFolders(root, ALREADY_RELEASED)) {
    const m = readManifest(dir);
    if (!m.published || !m.published.at || new Date(m.published.at).getTime() > cutoff) continue;
    const name = path.basename(dir);
    for (const [file, rec] of Object.entries(m.r2 || {})) {
      if (!rec.key || rec.deletedAt) continue;
      deleted.push({ folder: name, key: rec.key });
      if (dryRun) continue;
      del(rec.key);
      m.r2[file] = { ...rec, deletedAt: now.toISOString() };
      writeManifest(dir, m);
    }
  }

  return { published, waiting, deleted };
}
