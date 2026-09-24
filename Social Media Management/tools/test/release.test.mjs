import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { prepareRelease, recordRelease } from "../lib/release.mjs";
import { readManifest } from "../lib/manifest.mjs";

const r2 = {
  "media/reel-vertical.mp4": { key: "k1", url: "https://media.example.com/a.mp4", sha256: "x", uploadedAt: "t" },
  "media/thumbnail.jpg": { key: "k2", url: "https://media.example.com/b.jpg", sha256: "y", uploadedAt: "t" }
};
const early = new Date("2025-01-01T00:00:00Z");
let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

function uploadedDay(overrides = {}) {
  root = makeTempRoot();
  return makeDay(root, "2026-01-05", baseManifest({ status: "approved", r2, ...overrides }), baseFiles());
}

describe("release", () => {
  it("writes payloads and returns a packet per network", () => {
    const dir = uploadedDay();
    const r = prepareRelease(dir, { draft: true, now: early });
    expect(r.packets.map((p) => p.network)).toEqual(["facebook", "instagram"]);
    expect(r.packets[0]).toMatchObject({ folder: "2026-01-05", network: "facebook", date: "2026-01-05T09:00:00-05:00" });
    expect(r.packets[0].info.draft).toBe(true);
    const m = readManifest(dir);
    expect(m.metricool.facebook.payload.info.providers).toEqual([{ network: "facebook" }]);
    expect(m.metricool.instagram.draft).toBe(true);
    expect(m.status).toBe("approved");
  });

  it("skips folders that are not approved or not uploaded", () => {
    expect(prepareRelease(uploadedDay({ status: "ready" }), { now: early }).skipped).toBe("status ready");
    expect(prepareRelease(uploadedDay({ r2: {} }), { now: early }).skipped).toBe("media not uploaded");
  });

  it("records ids per network and schedules once every network is recorded", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { now: early });
    const now = new Date("2025-12-01T10:00:00Z");
    let r = recordRelease(dir, { network: "facebook", id: "111", uuid: "u-111", now });
    expect(r.status).toBe("approved");
    expect(readManifest(dir).metricool.facebook).toMatchObject({ id: "111", uuid: "u-111", scheduledAt: "2025-12-01T10:00:00.000Z" });
    r = recordRelease(dir, { network: "instagram", id: "222", uuid: "u-222", now });
    expect(r.status).toBe("scheduled");
    expect(readManifest(dir).status).toBe("scheduled");
    expect(prepareRelease(dir, { now: early }).skipped).toBe("status scheduled");
  });

  it("returns packets only for networks still without an id", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { now: early });
    recordRelease(dir, { network: "facebook", id: "111", uuid: "u-111" });
    const r = prepareRelease(dir, { now: early });
    expect(r.packets.map((p) => p.network)).toEqual(["instagram"]);
  });

  it("refuses to record a network with no prepared payload", () => {
    const dir = uploadedDay();
    expect(() => recordRelease(dir, { network: "facebook", id: "1", uuid: "u" })).toThrow(/no prepared payload/);
  });

  it("leaves a recorded network's stored payload alone on a rerun", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { draft: true, now: early });
    recordRelease(dir, { network: "facebook", id: "111", uuid: "u-111" });
    prepareRelease(dir, { draft: false, now: early });
    const m = readManifest(dir);
    expect(m.metricool.facebook.draft).toBe(true);
    expect(m.metricool.facebook.payload.info.draft).toBe(true);
    expect(m.metricool.instagram.draft).toBe(false);
  });

  it("dry run returns packets without writing", () => {
    const dir = uploadedDay();
    const r = prepareRelease(dir, { draft: true, now: early, dryRun: true });
    expect(r.packets.map((p) => p.network)).toEqual(["facebook", "instagram"]);
    expect(readManifest(dir).metricool).toEqual({});
  });
});
