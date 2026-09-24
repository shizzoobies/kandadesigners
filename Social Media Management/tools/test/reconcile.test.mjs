import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { reconcile, uuidsIn, draftUuidsIn, reconcileWindow } from "../lib/reconcile.mjs";
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
  it("collects only uuid strings from a Metricool response", () => {
    expect([...uuidsIn({ data: [{ id: 5, uuid: "a" }, { uuid: "b" }] })]).toEqual(["a", "b"]);
    expect([...uuidsIn([{ id: "7" }])]).toEqual([]);
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

  it("refuses to publish into an existing archive folder without touching the manifest, and goes on", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", scheduledDay(), baseFiles());
    makeDay(root, "2026-01-05", scheduledDay("2026-01-05", { status: "published", published: { at: "2026-01-05T14:00:00.000Z" } }), {}, "Already Released");
    makeDay(root, "2026-01-06", scheduledDay("2026-01-06"), baseFiles());
    const r = reconcile({ root, response: { data: [] }, now: new Date("2026-01-06T15:00:00Z"), del: () => {} });
    expect(r.errors).toEqual([{ folder: "2026-01-05", message: "2026-01-05: already exists in Already Released" }]);
    expect(r.published).toEqual(["2026-01-06"]);
    expect(fs.existsSync(path.join(root, "Already Released", "2026-01-06"))).toBe(true);
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

  it("refuses a response that is not a list", () => {
    expect(() => uuidsIn({ items: [] })).toThrow("getScheduledPosts response is not a list");
    expect(() => uuidsIn(null)).toThrow("getScheduledPosts response is not a list");
    root = makeTempRoot();
    expect(() => reconcile({ root, response: { data: "x" }, del: () => {} })).toThrow(/not a list/);
  });

  it("collects the uuids of listed drafts", () => {
    const res = { data: [{ id: 1, uuid: "a", draft: true }, { id: 2, uuid: "b", draft: false }, { id: 3, draft: true }] };
    expect([...draftUuidsIn(res)]).toEqual(["a"]);
  });

  it("keeps a folder with a draft record waiting, even after post time with nothing listed", () => {
    root = makeTempRoot();
    const m = scheduledDay();
    m.metricool.instagram.draft = true;
    makeDay(root, "2026-01-05", m, baseFiles());
    const r = reconcile({ root, response: { data: [] }, now: new Date("2026-01-06T15:00:00Z"), del: () => {} });
    expect(r.published).toEqual([]);
    expect(r.waiting).toEqual(["2026-01-05"]);
    expect(r.drafts).toEqual(["2026-01-05"]);
    expect(readManifest(path.join(root, "To Be Released", "2026-01-05")).status).toBe("scheduled");
  });

  it("counts a folder whose uuid Metricool still lists as a draft among the drafts", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", scheduledDay(), baseFiles());
    const r = reconcile({ root, response: { data: [{ id: 9, uuid: "fb-1", draft: true }] }, now: new Date("2026-01-06T15:00:00Z"), del: () => {} });
    expect(r.waiting).toEqual(["2026-01-05"]);
    expect(r.drafts).toEqual(["2026-01-05"]);
  });

  it("finishes moving a folder that was marked published by an earlier run", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", scheduledDay("2026-01-05", { status: "published", published: { at: "2026-01-05T14:00:00.000Z" } }), baseFiles());
    const r = reconcile({ root, response: { data: [] }, now: new Date("2026-01-05T15:00:00Z"), del: () => {} });
    expect(r.published).toEqual(["2026-01-05"]);
    expect(r.errors).toEqual([]);
    expect(fs.existsSync(path.join(root, "To Be Released", "2026-01-05"))).toBe(false);
    expect(readManifest(path.join(root, "Already Released", "2026-01-05")).status).toBe("published");
  });

  it("records a folder it cannot read and goes on", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", scheduledDay(), baseFiles());
    fs.writeFileSync(path.join(root, "To Be Released", "2026-01-05", "post.json"), "{ not json");
    makeDay(root, "2026-01-06", scheduledDay("2026-01-06"), baseFiles());
    const r = reconcile({ root, response: { data: [] }, now: new Date("2026-01-06T15:00:00Z"), del: () => {} });
    expect(r.errors.map((e) => e.folder)).toEqual(["2026-01-05"]);
    expect(r.published).toEqual(["2026-01-06"]);
  });

  it("deletes replaced R2 objects along with the current one", () => {
    root = makeTempRoot();
    const m = scheduledDay("2026-01-05", { status: "published", published: { at: "2026-01-05T14:00:00.000Z" } });
    m.r2["media/reel-vertical.mp4"].previous = ["2026-01-05/bbbbbbbb-reel-vertical.mp4"];
    makeDay(root, "2026-01-05", m, {}, "Already Released");
    const deleted = [];
    const r = reconcile({ root, response: { data: [] }, now: new Date("2026-01-13T00:00:00Z"), del: (key) => deleted.push(key) });
    expect(deleted).toEqual(["2026-01-05/bbbbbbbb-reel-vertical.mp4", "2026-01-05/aaaaaaaa-reel-vertical.mp4"]);
    expect(r.deleted).toHaveLength(2);
    const rec = readManifest(path.join(root, "Already Released", "2026-01-05")).r2["media/reel-vertical.mp4"];
    expect(rec.previous).toEqual([]);
    reconcile({ root, response: { data: [] }, now: new Date("2026-01-14T00:00:00Z"), del: (key) => deleted.push(key) });
    expect(deleted).toHaveLength(2);
  });

  it("gives the getScheduledPosts window from the earliest scheduled date to tomorrow", () => {
    root = makeTempRoot();
    expect(reconcileWindow(root, new Date("2026-01-10T15:00:00Z"))).toBeNull();
    makeDay(root, "2026-01-07", scheduledDay("2026-01-07"), baseFiles());
    makeDay(root, "2026-01-05", scheduledDay("2026-01-05"), baseFiles());
    makeDay(root, "2026-01-03", baseManifest({ id: "2026-01-03", date: "2026-01-03", status: "approved" }), baseFiles());
    expect(reconcileWindow(root, new Date("2026-01-10T15:00:00Z"))).toEqual({
      fromDate: "2026-01-05T00:00:00-05:00",
      toDate: "2026-01-11T23:59:59-05:00",
      timezone: "America/New_York",
      extendedRange: true
    });
    // 01:00 UTC on the 11th is still the 10th in New York, so tomorrow is the 11th.
    expect(reconcileWindow(root, new Date("2026-01-11T01:00:00Z")).toDate).toBe("2026-01-11T23:59:59-05:00");
  });
});
