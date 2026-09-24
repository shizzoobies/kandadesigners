import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { reconcile, uuidsIn } from "../lib/reconcile.mjs";
import { readManifest } from "../lib/manifest.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

function scheduledDay(name = "2026-01-05", extra = {}) {
  return baseManifest({
    id: name, date: name.slice(0, 10), status: "scheduled",
    r2: { "media/reel-vertical.mp4": { key: `${name}/aaaaaaaa-reel-vertical.mp4`, url: "u", sha256: "x", uploadedAt: "t" } },
    metricool: {
      facebook: { payload: {}, id: "1", uuid: "fb-1", scheduledAt: "t" },
      instagram: { payload: {}, id: "2", uuid: "ig-2", scheduledAt: "t" }
    },
    ...extra
  });
}

describe("reconcile", () => {
  it("collects uuids and ids from a Metricool response", () => {
    expect([...uuidsIn({ data: [{ id: 5, uuid: "a" }, { uuid: "b" }] })]).toEqual(["5", "a", "b"]);
    expect([...uuidsIn([{ id: "7" }])]).toEqual(["7"]);
  });

  it("publishes a folder whose posts are gone and whose time has passed", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", scheduledDay(), baseFiles());
    const r = reconcile({ root, response: { data: [] }, now: new Date("2026-01-05T15:00:00Z"), del: () => {} });
    expect(r.published).toEqual(["2026-01-05"]);
    const moved = path.join(root, "Already Released", "2026-01-05");
    expect(fs.existsSync(moved)).toBe(true);
    expect(fs.existsSync(path.join(root, "To Be Released", "2026-01-05"))).toBe(false);
    const m = readManifest(moved);
    expect(m.status).toBe("published");
    expect(m.published.at).toBe("2026-01-05T14:00:00.000Z");
  });

  it("waits while a post is still scheduled or the time has not passed", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", scheduledDay(), baseFiles());
    const still = reconcile({ root, response: { data: [{ uuid: "ig-2" }] }, now: new Date("2026-01-05T15:00:00Z"), del: () => {} });
    expect(still.waiting).toEqual(["2026-01-05"]);
    const early = reconcile({ root, response: { data: [] }, now: new Date("2026-01-05T13:00:00Z"), del: () => {} });
    expect(early.waiting).toEqual(["2026-01-05"]);
    expect(readManifest(path.join(root, "To Be Released", "2026-01-05")).status).toBe("scheduled");
  });

  it("deletes R2 objects a week after publishing, once", () => {
    root = makeTempRoot();
    const m = scheduledDay("2026-01-05", { status: "published", published: { at: "2026-01-05T14:00:00.000Z" } });
    makeDay(root, "2026-01-05", m, {}, "Already Released");
    const deleted = [];
    const del = (key) => deleted.push(key);
    let r = reconcile({ root, response: { data: [] }, now: new Date("2026-01-10T00:00:00Z"), del });
    expect(r.deleted).toEqual([]);
    r = reconcile({ root, response: { data: [] }, now: new Date("2026-01-13T00:00:00Z"), del });
    expect(r.deleted).toEqual([{ folder: "2026-01-05", key: "2026-01-05/aaaaaaaa-reel-vertical.mp4" }]);
    const rec = readManifest(path.join(root, "Already Released", "2026-01-05")).r2["media/reel-vertical.mp4"];
    expect(rec.deletedAt).toBe("2026-01-13T00:00:00.000Z");
    r = reconcile({ root, response: { data: [] }, now: new Date("2026-01-14T00:00:00Z"), del });
    expect(deleted).toHaveLength(1);
  });

  it("refuses to publish into an existing archive folder without touching the manifest", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", scheduledDay(), baseFiles());
    makeDay(root, "2026-01-05", scheduledDay("2026-01-05", { status: "published", published: { at: "2026-01-05T14:00:00.000Z" } }), {}, "Already Released");
    expect(() => reconcile({ root, response: { data: [] }, now: new Date("2026-01-05T15:00:00Z"), del: () => {} })).toThrow(/already exists in Already Released/);
    const m = readManifest(path.join(root, "To Be Released", "2026-01-05"));
    expect(m.status).toBe("scheduled");
    expect(m.published).toEqual({});
  });

  it("dry run moves and deletes nothing", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", scheduledDay(), baseFiles());
    const r = reconcile({ root, response: { data: [] }, now: new Date("2026-01-05T15:00:00Z"), del: () => { throw new Error("no"); }, dryRun: true });
    expect(r.published).toEqual(["2026-01-05"]);
    expect(fs.existsSync(path.join(root, "To Be Released", "2026-01-05"))).toBe(true);
  });
});
