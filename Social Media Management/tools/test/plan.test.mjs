import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { makeTempRoot } from "./helpers.mjs";
import { createDay } from "../lib/plan.mjs";
import { readManifest } from "../lib/manifest.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

describe("createDay", () => {
  it("creates a planned folder with manifest and caption files", () => {
    root = makeTempRoot();
    const dir = createDay({ root, date: "2026-10-05", pillar: "tip", title: "Tab through your site" });
    const m = readManifest(dir);
    expect(m).toMatchObject({
      id: "2026-10-05", date: "2026-10-05", time: "09:00", timezone: "America/New_York",
      status: "planned", pillar: "tip", title: "Tab through your site",
      platforms: { facebook: { type: "REEL", caption: "facebook.md" }, instagram: { type: "REEL", caption: "instagram.md" } },
      media: [], ai: { voice: false, visuals: false }, generate: [], r2: {}, metricool: {}, published: {}, credits: {}, lastError: null
    });
    expect(Object.keys(m)[0]).toBe("id");
    expect(fs.readFileSync(path.join(dir, "facebook.md"), "utf8")).toBe("");
    expect(fs.readFileSync(path.join(dir, "instagram.md"), "utf8")).toBe("\n## First comment\n\n");
    expect(fs.existsSync(path.join(dir, "media"))).toBe(true);
  });

  it("refuses to overwrite an existing folder", () => {
    root = makeTempRoot();
    createDay({ root, date: "2026-10-05", pillar: "tip", title: "x" });
    expect(() => createDay({ root, date: "2026-10-05", pillar: "tip", title: "y" })).toThrow("folder already exists: 2026-10-05");
  });

  it("rejects a bad date", () => {
    root = makeTempRoot();
    expect(() => createDay({ root, date: "Oct 5", pillar: "tip", title: "x" })).toThrow("bad date: Oct 5");
  });

  it("copies a finished reel from a Facebook folder", () => {
    root = makeTempRoot();
    const reel = path.join(root, "reel-src");
    fs.mkdirSync(path.join(reel, "Facebook"), { recursive: true });
    fs.writeFileSync(path.join(reel, "Facebook", "kap-reel-vertical-15s.mp4"), Buffer.alloc(8));
    fs.writeFileSync(path.join(reel, "Facebook", "kap-reel-vertical-15s.srt"), "1\n");
    fs.writeFileSync(path.join(reel, "Facebook", "thumbnail-vertical.jpg"), Buffer.alloc(8));
    const dir = createDay({ root, date: "2026-09-28", pillar: "client-spotlight", title: "Web reel", from: reel, ai: { voice: false, visuals: true } });
    const m = readManifest(dir);
    expect(m.media).toEqual([
      { file: "media/reel-vertical.mp4", role: "video", origin: "kap-reel", alt: "" },
      { file: "media/thumbnail.jpg", role: "thumbnail", origin: "kap-reel", alt: "" },
      { file: "media/reel-vertical.srt", role: "captions", origin: "kap-reel" }
    ]);
    expect(m.ai).toEqual({ voice: false, visuals: true });
    for (const f of ["reel-vertical.mp4", "reel-vertical.srt", "thumbnail.jpg"]) {
      expect(fs.existsSync(path.join(dir, "media", f))).toBe(true);
    }
  });

  it("fails clearly when the reel folder has no Facebook cut", () => {
    root = makeTempRoot();
    const reel = path.join(root, "empty-reel");
    fs.mkdirSync(reel);
    expect(() => createDay({ root, date: "2026-09-28", pillar: "x", title: "x", from: reel })).toThrow(/no \.mp4 in/);
  });

  it("accepts a suffixed name for a second post on the same day", () => {
    root = makeTempRoot();
    const dir = createDay({ root, date: "2026-10-05-2", pillar: "tip", title: "Second" });
    const m = readManifest(dir);
    expect(path.basename(dir)).toBe("2026-10-05-2");
    expect(m.id).toBe("2026-10-05-2");
    expect(m.date).toBe("2026-10-05");
  });

  it("removes the folder when the reel import fails", () => {
    root = makeTempRoot();
    const reel = path.join(root, "empty-reel");
    fs.mkdirSync(reel);
    expect(() => createDay({ root, date: "2026-09-28", pillar: "x", title: "x", from: reel })).toThrow(/no \.mp4 in/);
    expect(fs.existsSync(path.join(root, "To Be Released", "2026-09-28"))).toBe(false);
  });

  it("refuses a reel folder with more than one mp4", () => {
    root = makeTempRoot();
    const reel = path.join(root, "two-reel");
    fs.mkdirSync(path.join(reel, "Facebook"), { recursive: true });
    for (const f of ["a.mp4", "b.mp4", "a.srt", "thumbnail-a.jpg"]) fs.writeFileSync(path.join(reel, "Facebook", f), Buffer.alloc(4));
    expect(() => createDay({ root, date: "2026-09-28", pillar: "x", title: "x", from: reel })).toThrow("more than one .mp4 in");
  });
});
