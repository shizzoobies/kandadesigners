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

  it("reminds about the Studio checklist for a youtube post whose time has passed until it is marked done", () => {
    root = makeTempRoot();
    const withYoutube = (name, status, youtubeRec, extra = {}) => {
      const m = scheduledDay(name, { status, ...extra });
      m.platforms.youtube = { type: "SHORT", caption: "youtube.md", title: "T", time: "12:00" };
      m.metricool.youtube = youtubeRec;
      return m;
    };
    const archived = withYoutube("2026-01-02", "published", { payload: {}, id: "3", uuid: "yt-3" }, { published: { at: "2026-01-02T14:00:00.000Z" } });
    makeDay(root, "2026-01-02", archived, {}, "Already Released");
    const done = withYoutube("2026-01-03", "published", { payload: {}, id: "4", uuid: "yt-4", studioDoneAt: "t" }, { published: { at: "2026-01-03T14:00:00.000Z" } });
    makeDay(root, "2026-01-03", done, {}, "Already Released");
    const draft = withYoutube("2026-01-04", "scheduled", { payload: {}, id: "5", uuid: "yt-5", draft: true });
    makeDay(root, "2026-01-04", draft, baseFiles());
    // Still listed by Metricool, so it waits, but the Short's 12:00 is what counts for the reminder.
    makeDay(root, "2026-01-05", withYoutube("2026-01-05", "scheduled", { payload: {}, id: "6", uuid: "yt-6" }), baseFiles());
    const response = { data: [{ uuid: "fb-1" }] };

    // 16:00Z is 11:00 in New York: the 2026-01-05 Short is not up yet.
    let r = reconcile({ root, response, now: new Date("2026-01-05T16:00:00Z"), del: () => {} });
    expect(r.studio).toEqual(["2026-01-02"]);
    r = reconcile({ root, response, now: new Date("2026-01-05T17:30:00Z"), del: () => {} });
    expect(r.studio).toEqual(["2026-01-02", "2026-01-05"]);
  });

  // Metricool keeps published posts in getScheduledPosts, each provider marked PUBLISHED (seen 2026-09-28).
  const listed = (uuid, network, status, publicUrl) => ({ uuid, draft: false, providers: [{ network, status, ...(publicUrl ? { publicUrl } : {}) }] });

  it("publishes a folder whose posts are still listed but every provider is PUBLISHED, keeping the permalinks", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", scheduledDay(), baseFiles());
    const response = { data: [
      listed("fb-1", "facebook", "PUBLISHED", "https://facebook.com/p/1"),
      listed("ig-2", "instagram", "PUBLISHED", "https://www.instagram.com/p/2/")
    ] };
    const r = reconcile({ root, response, now: new Date("2026-01-05T15:00:00Z"), del: () => {} });
    expect(r.published).toEqual(["2026-01-05"]);
    const m = readManifest(path.join(root, "Already Released", "2026-01-05"));
    expect(m.status).toBe("published");
    expect(m.published.facebook).toEqual({ permalink: "https://facebook.com/p/1" });
    expect(m.published.instagram).toEqual({ permalink: "https://www.instagram.com/p/2/" });
  });

  it("waits while any of a folder's posts is still PENDING", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", scheduledDay(), baseFiles());
    const response = { data: [listed("fb-1", "facebook", "PUBLISHED", "u"), listed("ig-2", "instagram", "PENDING")] };
    const r = reconcile({ root, response, now: new Date("2026-01-05T15:00:00Z"), del: () => {} });
    expect(r.published).toEqual([]);
    expect(r.waiting).toEqual(["2026-01-05"]);
    expect(r.failed).toEqual([]);
  });

  it("reports a folder whose post failed instead of archiving it", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", scheduledDay(), baseFiles());
    const response = { data: [listed("fb-1", "facebook", "PUBLISHED", "u"), listed("ig-2", "instagram", "ERROR")] };
    const r = reconcile({ root, response, now: new Date("2026-01-05T15:00:00Z"), del: () => {} });
    expect(r.published).toEqual([]);
    expect(r.failed).toEqual([{ folder: "2026-01-05", networks: ["instagram"] }]);
    expect(readManifest(path.join(root, "To Be Released", "2026-01-05")).status).toBe("scheduled");
  });

  it("does not archive a PUBLISHED listing before its own time", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", scheduledDay(), baseFiles());
    const response = { data: [listed("fb-1", "facebook", "PUBLISHED", "u"), listed("ig-2", "instagram", "PUBLISHED", "u")] };
    const r = reconcile({ root, response, now: new Date("2026-01-05T13:00:00Z"), del: () => {} });
    expect(r.waiting).toEqual(["2026-01-05"]);
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

  it("keeps the window in order when every scheduled folder is in the future or in the past", () => {
    root = makeTempRoot();
    const now = new Date("2026-09-25T15:00:00Z");
    const future = makeDay(root, "2026-12-15", scheduledDay("2026-12-15"), baseFiles());
    expect(reconcileWindow(root, now)).toMatchObject({ fromDate: "2026-09-25T00:00:00-04:00", toDate: "2026-12-15T23:59:59-05:00" });
    fs.rmSync(future, { recursive: true, force: true });
    makeDay(root, "2026-09-20", scheduledDay("2026-09-20"), baseFiles());
    expect(reconcileWindow(root, now)).toMatchObject({ fromDate: "2026-09-20T00:00:00-04:00", toDate: "2026-09-26T23:59:59-04:00" });
  });
});
