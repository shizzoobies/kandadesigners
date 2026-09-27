import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { makeTempRoot, makeDay } from "./helpers.mjs";
import { selectHandoffMedia, planMediaNames, formatSuggestedTime, buildHandoff } from "../lib/handoff.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

const CLIENT = { slug: "davids-bbq", name: "David's BBQ", publish: "owner", networks: ["facebook", "instagram"], timezone: "America/New_York" };

function clientManifest(overrides = {}) {
  return {
    id: "2026-10-06", date: "2026-10-06", time: "11:30", timezone: "America/New_York",
    status: "approved", pillar: "menu", title: "Brisket Saturday",
    platforms: {
      facebook: { type: "POST", caption: "facebook.md" },
      instagram: { type: "POST", caption: "instagram.md" }
    },
    media: [
      { file: "media/1.jpg", role: "image", origin: "human", alt: "Brisket plate" },
      { file: "media/2.jpg", role: "image", origin: "human", alt: "Ribs plate" }
    ],
    ai: { voice: false, visuals: false }, generate: [], r2: {}, metricool: {}, published: {}, credits: {}, lastError: null,
    ...overrides
  };
}

function clientFiles(overrides = {}) {
  return {
    "facebook.md": "Brisket Saturday is back. https://davidsbbq.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-06",
    "instagram.md": "Brisket Saturday is back. Link in bio.\n\n## First comment\n\n#Gainesville #BBQ",
    "media/1.jpg": Buffer.alloc(16),
    "media/2.jpg": Buffer.alloc(16),
    "brief.md": "# Brief: Brisket Saturday\n\nApproved: yes\n",
    ...overrides
  };
}

describe("selectHandoffMedia", () => {
  it("drops captions/SRT and thumbnails when there is other media", () => {
    const media = [
      { file: "a.mp4", role: "video" },
      { file: "a.srt", role: "captions" },
      { file: "a-thumb.jpg", role: "thumbnail" }
    ];
    expect(selectHandoffMedia(media)).toEqual([{ file: "a.mp4", role: "video" }]);
  });

  it("falls back to a lone thumbnail when it is the only image there is", () => {
    const media = [{ file: "a-thumb.jpg", role: "thumbnail" }];
    expect(selectHandoffMedia(media)).toEqual(media);
  });

  it("still drops thumbnails when there is more than one", () => {
    const media = [{ file: "a.jpg", role: "thumbnail" }, { file: "b.jpg", role: "thumbnail" }];
    expect(selectHandoffMedia(media)).toEqual([]);
  });
});

describe("planMediaNames", () => {
  it("numbers images in order and keeps extensions; a lone video is video.<ext>", () => {
    const media = [
      { file: "media/1.jpg", role: "image" },
      { file: "media/2.png", role: "image" }
    ];
    expect(planMediaNames(media).map((m) => m.handoffName)).toEqual(["1.jpg", "2.png"]);
    expect(planMediaNames([{ file: "media/reel.mov", role: "video" }])[0].handoffName).toBe("video.mov");
  });

  it("numbers more than one generic video video, video-2, video-3...", () => {
    const media = [
      { file: "a.mp4", role: "video" },
      { file: "b.mp4", role: "video" },
      { file: "c.mov", role: "video" }
    ];
    expect(planMediaNames(media).map((m) => m.handoffName)).toEqual(["video.mp4", "video-2.mp4", "video-3.mov"]);
  });

  it("names a video scoped to exactly one network video-<network>.<ext>", () => {
    const media = [
      { file: "a.mp4", role: "video", platforms: ["facebook"] },
      { file: "b.mp4", role: "video", platforms: ["instagram"] }
    ];
    expect(planMediaNames(media).map((m) => m.handoffName)).toEqual(["video-facebook.mp4", "video-instagram.mp4"]);
  });

  it("treats a video scoped to more than one network as generic, not platform-named", () => {
    const media = [{ file: "a.mp4", role: "video", platforms: ["facebook", "instagram"] }];
    expect(planMediaNames(media)[0].handoffName).toBe("video.mp4");
  });

  it("does not apply platform naming to images", () => {
    const media = [{ file: "a.jpg", role: "image", platforms: ["instagram"] }];
    expect(planMediaNames(media)[0].handoffName).toBe("1.jpg");
  });
});

describe("formatSuggestedTime", () => {
  it("formats a wall-clock date/time with no timezone conversion", () => {
    expect(formatSuggestedTime("2026-10-06", "11:30")).toBe("Tuesday, October 6 at 11:30 AM");
    expect(formatSuggestedTime("2026-10-06", "00:05")).toBe("Tuesday, October 6 at 12:05 AM");
    expect(formatSuggestedTime("2026-10-06", "13:00")).toBe("Tuesday, October 6 at 1:00 PM");
  });
});

describe("buildHandoff", () => {
  it("skips a folder that is neither approved nor handed-off, and touches nothing", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-10-06", clientManifest({ status: "ready" }), clientFiles());
    const r = buildHandoff(dir, { root, client: CLIENT });
    expect(r).toEqual({ name: "2026-10-06", skipped: "status ready" });
    expect(fs.existsSync(dir)).toBe(true);
  });

  it("validates first and refuses (without touching anything) a folder with a real problem", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-10-06", clientManifest({
      media: [{ file: "media/1.jpg", role: "image", origin: "human", alt: "" }]
    }), clientFiles());
    const r = buildHandoff(dir, { root, client: CLIENT });
    expect(r.skipped).toMatch(/^invalid: /);
    expect(r.skipped).toContain("needs alt text");
    expect(fs.existsSync(dir)).toBe(true);
    expect(fs.existsSync(path.join(root, "Handed Off"))).toBe(false);
  });

  it("exempts the 'approved post time is in the past' rule: a late approval still hands off", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-10-06", clientManifest(), clientFiles());
    // Well after 2026-10-06 11:30 America/New_York.
    const r = buildHandoff(dir, { root, client: CLIENT, now: new Date("2026-10-07T00:00:00.000Z") });
    expect(r.skipped).toBeUndefined();
    expect(fs.existsSync(path.join(root, "Handed Off", "2026-10-06"))).toBe(true);
  });

  it("dry-run reports the real destination and writes nothing", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-10-06", clientManifest(), clientFiles());
    const r = buildHandoff(dir, { root, client: CLIENT, dryRun: true });
    expect(r.files).toEqual(["1.jpg", "2.jpg", "Facebook caption.txt", "Instagram caption.txt", "How to post.txt"]);
    expect(r.driveFolder).toBe("2026-10-06 Brisket Saturday");
    expect(r.handoffPath).toBe(path.join(root, "Handed Off", "2026-10-06", "handoff"));
    expect(fs.existsSync(path.join(root, "Handed Off"))).toBe(false);
    expect(fs.existsSync(dir)).toBe(true);
    expect(JSON.parse(fs.readFileSync(path.join(dir, "post.json"), "utf8")).status).toBe("approved");
  });

  it("dry-run still runs the collision check and throws", () => {
    root = makeTempRoot();
    fs.mkdirSync(path.join(root, "Handed Off", "2026-10-06"), { recursive: true });
    const dir = makeDay(root, "2026-10-06", clientManifest(), clientFiles());
    expect(() => buildHandoff(dir, { root, client: CLIENT, dryRun: true })).toThrow(/already exists in Handed Off/);
  });

  it("refuses to overwrite an existing Handed Off folder of the same name", () => {
    root = makeTempRoot();
    fs.mkdirSync(path.join(root, "Handed Off", "2026-10-06"), { recursive: true });
    const dir = makeDay(root, "2026-10-06", clientManifest(), clientFiles());
    expect(() => buildHandoff(dir, { root, client: CLIENT })).toThrow(/already exists in Handed Off/);
  });

  it("builds the hand-off folder, renames first, then sets handed-off in the moved copy", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-10-06", clientManifest(), clientFiles());
    const now = new Date("2026-10-05T12:00:00.000Z");
    const r = buildHandoff(dir, { root, client: CLIENT, now });

    const target = path.join(root, "Handed Off", "2026-10-06");
    expect(fs.existsSync(dir)).toBe(false);
    expect(fs.existsSync(target)).toBe(true);
    expect(r.handoffPath).toBe(path.join(target, "handoff"));
    expect(r.recovered).toBe(false);

    const handoffDir = path.join(target, "handoff");
    expect(fs.readdirSync(handoffDir).sort()).toEqual(["1.jpg", "2.jpg", "Facebook caption.txt", "How to post.txt", "Instagram caption.txt"]);
    expect(fs.readFileSync(path.join(handoffDir, "Facebook caption.txt"), "utf8").trim())
      .toBe("Brisket Saturday is back. https://davidsbbq.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-06");
    const ig = fs.readFileSync(path.join(handoffDir, "Instagram caption.txt"), "utf8");
    expect(ig).toBe("Brisket Saturday is back. Link in bio.\n\nFirst comment (paste right after posting):\n#Gainesville #BBQ\n");
    const howTo = fs.readFileSync(path.join(handoffDir, "How to post.txt"), "utf8");
    expect(howTo).toContain("Brisket Saturday");
    expect(howTo).toContain("Tuesday, October 6 at 11:30 AM");
    expect(howTo).toContain("Facebook: 1.jpg to 2.jpg as a carousel, in order; Instagram: 1.jpg to 2.jpg as a carousel, in order");
    expect(howTo).toContain('Facebook: paste "Facebook caption.txt"');
    expect(howTo).toContain('Instagram: paste the top of "Instagram caption.txt"');

    const manifest = JSON.parse(fs.readFileSync(path.join(target, "post.json"), "utf8"));
    expect(manifest.status).toBe("handed-off");
    expect(manifest.handoff).toEqual({ at: "2026-10-05T12:00:00.000Z", files: r.files });
  });

  it("leaves post.json untouched (still approved) and the folder in place when the rename fails", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-10-06", clientManifest(), clientFiles());
    const failingRename = () => { throw new Error("EBUSY: resource busy or locked"); };
    expect(() => buildHandoff(dir, { root, client: CLIENT, rename: failingRename })).toThrow(/EBUSY/);

    expect(fs.existsSync(dir)).toBe(true);
    expect(fs.existsSync(path.join(root, "Handed Off", "2026-10-06"))).toBe(false);
    expect(JSON.parse(fs.readFileSync(path.join(dir, "post.json"), "utf8")).status).toBe("approved");
    // The handoff/ contents were built (inside the still-approved folder) before the failed rename.
    expect(fs.existsSync(path.join(dir, "handoff", "1.jpg"))).toBe(true);
  });

  it("completes a folder already marked handed-off that is still stuck in To Be Released (recovery)", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-10-06", clientManifest({
      status: "handed-off", handoff: { at: "2026-10-01T00:00:00.000Z", files: ["stale"] }
    }), clientFiles());
    const r = buildHandoff(dir, { root, client: CLIENT, now: new Date("2026-10-05T12:00:00.000Z") });
    expect(r.recovered).toBe(true);
    expect(fs.existsSync(dir)).toBe(false);
    const target = path.join(root, "Handed Off", "2026-10-06");
    expect(fs.existsSync(target)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(path.join(target, "post.json"), "utf8"));
    expect(manifest.handoff).toEqual({ at: "2026-10-05T12:00:00.000Z", files: r.files });
  });

  it("writes a single Reel/video How to post line, and only the caption files for the networks the post has", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-10-06", clientManifest({
      platforms: { facebook: { type: "REEL", caption: "facebook.md" } },
      media: [{ file: "media/reel.mp4", role: "video", origin: "human", alt: "" }]
    }), clientFiles({ "media/reel.mp4": Buffer.alloc(32) }));
    const r = buildHandoff(dir, { root, client: CLIENT });
    expect(r.files).toEqual(["video.mp4", "Facebook caption.txt", "How to post.txt"]);
    const howTo = fs.readFileSync(path.join(root, "Handed Off", "2026-10-06", "handoff", "How to post.txt"), "utf8");
    expect(howTo).toContain("Facebook: video.mp4 as a Reel");
    expect(howTo).not.toContain("Instagram");
    expect(fs.existsSync(path.join(root, "Handed Off", "2026-10-06", "handoff", "Instagram caption.txt"))).toBe(false);
  });

  it("names per-platform videos and per-network carousels, and lists each network's own files", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-10-06", clientManifest({
      platforms: {
        facebook: { type: "REEL", caption: "facebook.md" },
        instagram: { type: "POST", caption: "instagram.md" }
      },
      media: [
        { file: "media/reel-fb.mp4", role: "video", origin: "human", alt: "", platforms: ["facebook"] },
        { file: "media/a.jpg", role: "image", origin: "human", alt: "Brisket 1", platforms: ["instagram"] },
        { file: "media/b.jpg", role: "image", origin: "human", alt: "Brisket 2", platforms: ["instagram"] },
        { file: "media/c.jpg", role: "image", origin: "human", alt: "Brisket 3", platforms: ["instagram"] }
      ]
    }), clientFiles({
      "media/reel-fb.mp4": Buffer.alloc(32), "media/a.jpg": Buffer.alloc(8), "media/b.jpg": Buffer.alloc(8), "media/c.jpg": Buffer.alloc(8)
    }));
    const r = buildHandoff(dir, { root, client: CLIENT });
    expect(r.files).toEqual(["video-facebook.mp4", "1.jpg", "2.jpg", "3.jpg", "Facebook caption.txt", "Instagram caption.txt", "How to post.txt"]);
    const handoffDir = path.join(root, "Handed Off", "2026-10-06", "handoff");
    expect(fs.readdirSync(handoffDir).sort()).toEqual(["1.jpg", "2.jpg", "3.jpg", "Facebook caption.txt", "How to post.txt", "Instagram caption.txt", "video-facebook.mp4"]);
    const howTo = fs.readFileSync(path.join(handoffDir, "How to post.txt"), "utf8");
    expect(howTo).toContain("Facebook: video-facebook.mp4 as a Reel; Instagram: 1.jpg to 3.jpg as a carousel, in order");
  });

  it("Instagram caption.txt has no first-comment block when there are no hashtags", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-10-06", clientManifest(), clientFiles({ "instagram.md": "Brisket Saturday is back. Link in bio." }));
    buildHandoff(dir, { root, client: CLIENT });
    const ig = fs.readFileSync(path.join(root, "Handed Off", "2026-10-06", "handoff", "Instagram caption.txt"), "utf8");
    expect(ig).toBe("Brisket Saturday is back. Link in bio.\n");
    expect(ig).not.toContain("First comment");
  });
});
