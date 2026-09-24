import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { uploadFolder, objectKey, sha256 } from "../lib/upload.mjs";
import { readManifest } from "../lib/manifest.mjs";

const config = { accountId: "a", bucket: "ka-social", zoneId: "z", hostname: "media.example.com", publicBase: "https://media.example.com" };
const now = new Date("2026-09-27T12:00:00Z");
let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

function approvedDay(overrides = {}, files = baseFiles()) {
  root = makeTempRoot();
  return makeDay(root, "2026-01-05", baseManifest({ status: "approved", ...overrides }), files);
}

describe("uploadFolder", () => {
  it("uploads video and thumbnail, skips the srt, and records urls", () => {
    const dir = approvedDay();
    const puts = [];
    const r = uploadFolder(dir, { put: (key, file) => puts.push({ key, file }), config, now: new Date("2025-12-01T00:00:00Z") });
    expect(r.uploaded).toEqual(["media/reel-vertical.mp4", "media/thumbnail.jpg"]);
    expect(puts.map((p) => p.key)).toEqual([
      objectKey("2026-01-05", "media/reel-vertical.mp4", sha256(path.join(dir, "media/reel-vertical.mp4"))),
      objectKey("2026-01-05", "media/thumbnail.jpg", sha256(path.join(dir, "media/thumbnail.jpg")))
    ]);
    const m = readManifest(dir);
    expect(m.r2["media/reel-vertical.mp4"].url).toMatch(/^https:\/\/media\.example\.com\/2026-01-05\/[0-9a-f]{8}-reel-vertical\.mp4$/);
    expect(m.r2["media/reel-vertical.srt"]).toBeUndefined();
    expect(m.status).toBe("approved");
  });

  it("skips unchanged files on a rerun and re-uploads a changed one", () => {
    const dir = approvedDay();
    const later = new Date("2025-12-01T00:00:00Z");
    uploadFolder(dir, { put: () => {}, config, now: later });
    const puts = [];
    fs.writeFileSync(path.join(dir, "media/thumbnail.jpg"), Buffer.alloc(64, 1));
    const r = uploadFolder(dir, { put: (key) => puts.push(key), config, now: later });
    expect(r.unchanged).toEqual(["media/reel-vertical.mp4"]);
    expect(r.uploaded).toEqual(["media/thumbnail.jpg"]);
    expect(puts).toHaveLength(1);
  });

  it("refuses folders that are not approved or not valid", () => {
    root = makeTempRoot();
    const ready = makeDay(root, "2026-01-05", baseManifest({ status: "ready" }), baseFiles());
    expect(uploadFolder(ready, { put: () => { throw new Error("should not upload"); }, config }).skipped).toBe("status ready");
    const m = baseManifest({ status: "approved" }); m.media[1].alt = "";
    const invalid = makeDay(root, "2026-01-06", { ...m, id: "2026-01-06", date: "2026-01-06" }, baseFiles());
    const r = uploadFolder(invalid, { put: () => { throw new Error("should not upload"); }, config, now: new Date("2025-01-01T00:00:00Z") });
    expect(r.skipped).toBe("invalid");
    expect(r.problems[0]).toContain("needs alt text");
  });

  it("records the error and keeps what was uploaded before the failure", () => {
    const dir = approvedDay();
    let n = 0;
    expect(() => uploadFolder(dir, { put: () => { if (++n === 2) throw new Error("No access"); }, config, now: new Date("2025-12-01T00:00:00Z") })).toThrow(/No access/);
    const m = readManifest(dir);
    expect(m.lastError).toBe("upload: No access");
    expect(m.r2["media/reel-vertical.mp4"]).toBeDefined();
    expect(m.r2["media/thumbnail.jpg"]).toBeUndefined();
  });

  it("dry run uploads nothing and writes nothing", () => {
    const dir = approvedDay();
    const r = uploadFolder(dir, { put: () => { throw new Error("should not upload"); }, config, now: new Date("2025-12-01T00:00:00Z"), dryRun: true });
    expect(r.uploaded).toEqual(["media/reel-vertical.mp4", "media/thumbnail.jpg"]);
    expect(readManifest(dir).r2).toEqual({});
  });
});
