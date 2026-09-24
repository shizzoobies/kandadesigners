import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { readManifest, writeManifest } from "./manifest.mjs";
import { validateFolder } from "./validate.mjs";
import { r2Put, publicUrl, readR2Config } from "./cloudflare.mjs";

/** Roles that go to R2. Caption sidecars stay on disk; Metricool has no field for them. */
export const UPLOAD_ROLES = new Set(["video", "image", "thumbnail"]);

export function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

export function objectKey(date, file, sha) {
  return `${date}/${sha.slice(0, 8)}-${path.basename(file)}`;
}

/**
 * Push one approved folder's media to R2 and record the urls. Safe to rerun:
 * a file whose sha256 matches its record is skipped. put(key, absFile) is
 * injectable so tests never touch the network.
 */
export function uploadFolder(dir, { put = (key, file) => r2Put(key, file), config = readR2Config(), now = new Date(), dryRun = false } = {}) {
  const name = path.basename(dir);
  const problems = validateFolder(dir, { now });
  if (problems.length) return { name, skipped: "invalid", problems, uploaded: [], unchanged: [] };
  const m = readManifest(dir);
  if (m.status !== "approved") return { name, skipped: `status ${m.status}`, uploaded: [], unchanged: [] };

  m.r2 = m.r2 || {};
  const uploaded = [];
  const unchanged = [];
  for (const entry of m.media) {
    if (!UPLOAD_ROLES.has(entry.role)) continue;
    const abs = path.join(dir, entry.file);
    const sha = sha256(abs);
    const existing = m.r2[entry.file];
    if (existing && existing.sha256 === sha && !existing.deletedAt) { unchanged.push(entry.file); continue; }
    const key = objectKey(m.date, entry.file, sha);
    if (!dryRun) {
      try {
        put(key, abs);
      } catch (err) {
        m.lastError = `upload: ${err.message}`;
        writeManifest(dir, m);
        throw err;
      }
      m.r2[entry.file] = { key, url: publicUrl(key, config), sha256: sha, uploadedAt: now.toISOString() };
      m.lastError = null;
      writeManifest(dir, m);
    }
    uploaded.push(entry.file);
  }
  return { name, uploaded, unchanged };
}
