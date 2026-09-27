import fs from "node:fs";
import path from "node:path";
import { listAllDayDirs, readManifest } from "./manifest.mjs";
import { TO_BE_RELEASED, ALREADY_RELEASED, HANDED_OFF } from "./paths.mjs";

/** Alex, 2026-09-25: a music track never repeats within this many days. */
export const MUSIC_WINDOW_DAYS = 30;

const DAY_MS = 86400000;

/**
 * Every use of a track, from the day folders' top-level `music` field (both
 * release folders) plus music-history.json for posts made before the pipeline,
 * checked pairwise: a later use within MUSIC_WINDOW_DAYS of an earlier one is a
 * problem, reported against the later post.
 */
export function musicConflicts(root) {
  const uses = [];
  const historyPath = path.join(root, "music-history.json");
  if (fs.existsSync(historyPath)) {
    const history = JSON.parse(fs.readFileSync(historyPath, "utf8"));
    for (const h of Array.isArray(history) ? history : []) {
      if (h && h.track && h.published) uses.push({ track: h.track, date: h.published, label: h.post || "history" });
    }
  }
  // Already Released (K&A) and Handed Off (a client) are the same idea: where a
  // published/handed-off post's history lives; a root only ever has one of them.
  for (const dir of [...listAllDayDirs(root, ALREADY_RELEASED), ...listAllDayDirs(root, HANDED_OFF), ...listAllDayDirs(root, TO_BE_RELEASED)]) {
    let m;
    try { m = readManifest(dir); } catch { continue; }
    if (m && typeof m.music === "string" && m.music && m.date) {
      uses.push({ track: m.music, date: m.date, label: path.basename(dir), folder: path.basename(dir) });
    }
  }
  uses.sort((a, b) => a.date.localeCompare(b.date) || (a.folder ? 1 : 0) - (b.folder ? 1 : 0));

  const problems = [];
  for (let i = 0; i < uses.length; i++) {
    const later = uses[i];
    if (!later.folder) continue;
    for (let j = 0; j < i; j++) {
      const earlier = uses[j];
      if (earlier.track !== later.track) continue;
      const days = Math.round((Date.parse(later.date) - Date.parse(earlier.date)) / DAY_MS);
      // Same day means the same video cross-posted (a reel also going to LinkedIn): one use.
      if (days > 0 && days < MUSIC_WINDOW_DAYS) {
        problems.push(`${later.folder}: ${later.track} was already used on ${earlier.date} (${earlier.label}), ${days} days earlier; tracks cannot repeat within ${MUSIC_WINDOW_DAYS} days`);
        break;
      }
    }
  }
  return problems;
}
