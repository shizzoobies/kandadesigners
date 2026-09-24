import fs from "node:fs";
import path from "node:path";
import { TO_BE_RELEASED } from "./paths.mjs";

/** One way order. native is terminal and set by hand. */
export const STATUSES = ["planned", "generating", "ready", "approved", "scheduled", "published", "native"];

export const DAY_NAME = /^\d{4}-\d{2}-\d{2}(-\d+)?$/;

export function readManifest(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, "post.json"), "utf8"));
}

export function writeManifest(dir, manifest) {
  fs.writeFileSync(path.join(dir, "post.json"), JSON.stringify(manifest, null, 2) + "\n");
}

export function assertTransition(from, to) {
  if (!STATUSES.includes(to)) throw new Error(`unknown status "${to}"`);
  if (from === "native") throw new Error("native folders never change status");
  const a = STATUSES.indexOf(from);
  const b = STATUSES.indexOf(to);
  if (b <= a) throw new Error(`backward transition ${from} -> ${to}`);
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
