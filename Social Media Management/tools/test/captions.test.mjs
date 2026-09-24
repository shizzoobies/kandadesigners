import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import { makeTempRoot, makeDay, baseManifest } from "./helpers.mjs";
import { readCaption, splitInstagram } from "../lib/captions.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

describe("captions", () => {
  it("reads and trims a caption file, null when missing", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-01-05", baseManifest(), { "facebook.md": "  Hello there.\n\n" });
    expect(readCaption(dir, "facebook.md")).toBe("Hello there.");
    expect(readCaption(dir, "linkedin.md")).toBeNull();
  });

  it("splits the Instagram caption from the first comment", () => {
    const out = splitInstagram("Line one.\nLine two.\n\n## First comment\n\n#GainesvilleFL #WebDesign\n");
    expect(out.caption).toBe("Line one.\nLine two.");
    expect(out.firstComment).toBe("#GainesvilleFL #WebDesign");
  });

  it("returns an empty first comment when the heading is absent", () => {
    const out = splitInstagram("Just a caption.");
    expect(out).toEqual({ caption: "Just a caption.", firstComment: "" });
  });

  it("matches the heading case insensitively", () => {
    expect(splitInstagram("A\n## first Comment\nB").firstComment).toBe("B");
  });
});
