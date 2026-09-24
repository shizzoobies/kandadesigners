import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { TO_BE_RELEASED, ALREADY_RELEASED } from "../lib/paths.mjs";

/** A fresh temp root with both release folders. Caller removes it in afterEach. */
export function makeTempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ka-social-"));
  fs.mkdirSync(path.join(root, TO_BE_RELEASED));
  fs.mkdirSync(path.join(root, ALREADY_RELEASED));
  return root;
}

/**
 * Write a day folder. `files` maps relative paths to string or Buffer content,
 * e.g. { "facebook.md": "Hi", "media/reel.mp4": Buffer.alloc(16) }.
 */
export function makeDay(root, name, manifest, files = {}, bucket = TO_BE_RELEASED) {
  const dir = path.join(root, bucket, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "post.json"), JSON.stringify(manifest, null, 2) + "\n");
  for (const [rel, content] of Object.entries(files)) {
    const target = path.join(dir, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return dir;
}

/** A complete, valid manifest for a Reel on both networks. Override fields as needed. */
export function baseManifest(overrides = {}) {
  return {
    id: "2026-01-05",
    date: "2026-01-05",
    time: "09:00",
    timezone: "America/New_York",
    status: "planned",
    pillar: "client-spotlight",
    title: "Fixture post",
    platforms: {
      facebook: { type: "REEL", caption: "facebook.md" },
      instagram: { type: "REEL", caption: "instagram.md" }
    },
    media: [
      { file: "media/reel-vertical.mp4", role: "video", origin: "kap-reel", alt: "" },
      { file: "media/thumbnail.jpg", role: "thumbnail", origin: "kap-reel", alt: "A phone showing a website" },
      { file: "media/reel-vertical.srt", role: "captions", origin: "kap-reel" }
    ],
    ai: { voice: false, visuals: false },
    generate: [],
    r2: {},
    metricool: {},
    published: {},
    credits: {},
    lastError: null,
    ...overrides
  };
}

/** Files that satisfy baseManifest(). */
export function baseFiles(overrides = {}) {
  return {
    "facebook.md": "Five real websites in fifteen seconds. ka-performancefl.com\n",
    "instagram.md": "Five real websites in fifteen seconds. Link in bio.\n\n## First comment\n\n#GainesvilleFL #WebDesign\n",
    "media/reel-vertical.mp4": Buffer.alloc(32),
    "media/thumbnail.jpg": Buffer.alloc(32),
    "media/reel-vertical.srt": "1\n00:00:00,000 --> 00:00:01,000\nHello\n",
    ...overrides
  };
}
