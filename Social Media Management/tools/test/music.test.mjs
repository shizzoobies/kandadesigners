import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { musicConflicts, MUSIC_WINDOW_DAYS } from "../lib/music.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

const post = (name, music) => {
  const date = name.slice(0, 10);
  makeDay(root, name, baseManifest({ id: name, date, music }), baseFiles());
};

describe("music reuse", () => {
  it("allows different tracks, and the same track 30 or more days apart", () => {
    root = makeTempRoot();
    post("2026-10-05", "music-x");
    post("2026-10-05-2", "music-y");
    post("2026-11-04", "music-x");
    expect(MUSIC_WINDOW_DAYS).toBe(30);
    expect(musicConflicts(root)).toEqual([]);
  });

  it("flags a track used twice within 30 days, across both release folders", () => {
    root = makeTempRoot();
    post("2026-10-05", "music-x");
    makeDay(root, "2026-10-20", baseManifest({ id: "2026-10-20", date: "2026-10-20", music: "music-x" }), baseFiles(), "Already Released");
    expect(musicConflicts(root)).toEqual([
      "2026-10-20: music-x was already used on 2026-10-05 (2026-10-05), 15 days earlier; tracks cannot repeat within 30 days"
    ]);
  });

  it("checks against music-history.json for posts made before the pipeline", () => {
    root = makeTempRoot();
    fs.writeFileSync(path.join(root, "music-history.json"), JSON.stringify([
      { track: "music-a", published: "2026-09-03", post: "web showcase" }
    ]));
    post("2026-09-28", "music-a");
    expect(musicConflicts(root)).toEqual([
      "2026-09-28: music-a was already used on 2026-09-03 (web showcase), 25 days earlier; tracks cannot repeat within 30 days"
    ]);
  });

  it("counts the same video cross-posted on the same day as one use", () => {
    root = makeTempRoot();
    post("2026-10-05", "music-x");
    post("2026-10-05-3", "music-x");
    expect(musicConflicts(root)).toEqual([]);
  });

  it("ignores posts without a music field", () => {
    root = makeTempRoot();
    post("2026-10-05", undefined);
    post("2026-10-06", undefined);
    expect(musicConflicts(root)).toEqual([]);
  });
});
