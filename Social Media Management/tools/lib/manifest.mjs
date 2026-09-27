import fs from "node:fs";
import path from "node:path";
import { TO_BE_RELEASED } from "./paths.mjs";

/**
 * One way order. `native` and `handed-off` sit outside it: each is set
 * directly by its own command (never through assertTransition), not moved
 * through by the normal Metricool flow.
 */
export const FLOW = ["planned", "generating", "ready", "approved", "scheduled", "published"];
export const STATUSES = [...FLOW, "native", "handed-off"];
const TERMINAL = new Set(["native", "handed-off"]);

export const DAY_NAME = /^\d{4}-\d{2}-\d{2}(-\d+)?$/;

/**
 * Whether a media entry goes to this network. An entry without `platforms`
 * goes everywhere; one with `platforms: ["facebook"]` goes only there (for
 * example a slideshow video for Facebook beside swipe slides for Instagram).
 */
export function mediaFor(entry, network) {
  return !Array.isArray(entry.platforms) || entry.platforms.includes(network);
}

export function readManifest(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, "post.json"), "utf8"));
}

export function writeManifest(dir, manifest) {
  const target = path.join(dir, "post.json");
  const tmp = target + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2) + "\n");
  fs.renameSync(tmp, target);
}

export function assertTransition(from, to) {
  if (!STATUSES.includes(to)) throw new Error(`unknown status "${to}"`);
  if (TERMINAL.has(from) || TERMINAL.has(to)) {
    const which = TERMINAL.has(from) ? from : to;
    throw new Error(`${which} is set by hand and never changes`);
  }
  if (!FLOW.includes(from)) throw new Error(`unknown status "${from}"`);
  const a = FLOW.indexOf(from);
  const b = FLOW.indexOf(to);
  if (a === b) throw new Error(`already ${from}`);
  if (b < a) throw new Error(`backward transition ${from} -> ${to}`);
}

/** Absolute paths of day folders that contain post.json, sorted by name. */
export function listDayFolders(root, bucket = TO_BE_RELEASED) {
  const base = path.join(root, bucket);
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(base, d.name, "post.json")))
    .map((d) => path.join(base, d.name))
    .sort();
}

/** Every subdirectory of the bucket, sorted, whether or not it has post.json. */
export function listAllDayDirs(root, bucket = TO_BE_RELEASED) {
  const base = path.join(root, bucket);
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => path.join(base, d.name))
    .sort();
}
