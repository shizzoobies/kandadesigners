import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { prepareRelease, recordRelease, recordError, promotePackets, recordPromotion } from "../lib/release.mjs";
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

  it("stamps preparedAt and reports an earlier one on a rerun", () => {
    const dir = uploadedDay();
    const first = prepareRelease(dir, { now: early });
    expect(first.repeated).toEqual([]);
    expect(readManifest(dir).metricool.facebook.preparedAt).toBe("2025-01-01T00:00:00.000Z");
    const later = new Date("2025-01-02T00:00:00Z");
    const again = prepareRelease(dir, { now: later });
    expect(again.repeated).toEqual([
      { network: "facebook", preparedAt: "2025-01-01T00:00:00.000Z" },
      { network: "instagram", preparedAt: "2025-01-01T00:00:00.000Z" }
    ]);
    expect(readManifest(dir).metricool.instagram.preparedAt).toBe("2025-01-02T00:00:00.000Z");
  });

  it("refuses to record on a status other than approved or scheduled", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { now: early });
    const m = readManifest(dir);
    m.status = "published";
    fs.writeFileSync(`${dir}/post.json`, JSON.stringify(m));
    expect(() => recordRelease(dir, { network: "facebook", id: "1", uuid: "u" })).toThrow("2026-01-05: cannot record on status published");
  });

  it("records a rejection in lastError and changes nothing else", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { now: early });
    const before = readManifest(dir);
    recordError(dir, { network: "instagram", message: "VIDEO_THUMBNAIL_NOT_APPLICABLE" });
    const after = readManifest(dir);
    expect(after.lastError).toBe("instagram: VIDEO_THUMBNAIL_NOT_APPLICABLE");
    expect({ ...after, lastError: null }).toEqual(before);
  });

  it("builds promotion packets for draft networks with draft false", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { draft: true, now: early });
    expect(() => promotePackets(dir)).toThrow(/cannot promote on status approved/);
    recordRelease(dir, { network: "facebook", id: "111", uuid: "u-111" });
    recordRelease(dir, { network: "instagram", id: "222", uuid: "u-222" });
    const r = promotePackets(dir);
    expect(r.packets.map((p) => [p.network, p.id, p.uuid])).toEqual([["facebook", "111", "u-111"], ["instagram", "222", "u-222"]]);
    expect(r.packets[0]).toMatchObject({ folder: "2026-01-05", date: "2026-01-05T09:00:00-05:00" });
    expect(r.packets.every((p) => p.info.draft === false)).toBe(true);
    expect(readManifest(dir).metricool.facebook.payload.info.draft).toBe(true);
  });

  it("records a promotion: draft off, new id, same uuid", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { draft: true, now: early });
    recordRelease(dir, { network: "facebook", id: "111", uuid: "u-111" });
    recordRelease(dir, { network: "instagram", id: "222", uuid: "u-222" });
    const now = new Date("2025-12-02T10:00:00Z");
    recordPromotion(dir, { network: "facebook", id: 333, now });
    const rec = readManifest(dir).metricool.facebook;
    expect(rec).toMatchObject({ draft: false, id: "333", uuid: "u-111", promotedAt: "2025-12-02T10:00:00.000Z" });
    expect(promotePackets(dir).packets.map((p) => p.network)).toEqual(["instagram"]);
    expect(() => recordPromotion(dir, { network: "facebook", id: "444" })).toThrow(/facebook is not a draft/);
  });
});
