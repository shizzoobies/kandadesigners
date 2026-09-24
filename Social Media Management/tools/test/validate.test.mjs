import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { validateFolder } from "../lib/validate.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

function day(overrides = {}, files = baseFiles(), name = "2026-01-05") {
  root = makeTempRoot();
  return makeDay(root, name, baseManifest(overrides), files);
}

describe("validateFolder", () => {
  it("accepts the fixture", () => {
    expect(validateFolder(day())).toEqual([]);
  });

  it("reports unparseable post.json as the only problem", () => {
    root = makeTempRoot();
    const dir = path.join(root, "To Be Released", "2026-01-05");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "post.json"), "{ not json");
    expect(validateFolder(dir)).toEqual(["2026-01-05: cannot parse post.json"]);
  });

  it("requires folder name, id, and date to agree", () => {
    const problems = validateFolder(day({ id: "2026-01-06" }));
    expect(problems).toContain("2026-01-05: id \"2026-01-06\" does not match folder name");
    const p2 = validateFolder(day({ date: "2026-01-09" }));
    expect(p2).toContain("2026-01-05: date \"2026-01-09\" does not match id");
  });

  it("rejects unknown status", () => {
    expect(validateFolder(day({ status: "done" }))).toContain("2026-01-05: unknown status \"done\"");
  });

  it("accepts a native placeholder with no media or captions", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-09-25", {
      id: "2026-09-25", date: "2026-09-25", time: "09:00", timezone: "America/New_York",
      status: "native", title: "Job aids video, scheduled in Facebook",
      platforms: { facebook: { type: "REEL" } }
    });
    expect(validateFolder(dir)).toEqual([]);
  });

  it("rejects media on a native placeholder", () => {
    const problems = validateFolder(day({ status: "native" }));
    expect(problems).toEqual(["2026-01-05: native folders carry no media"]);
  });

  it("checks the time format and future time for approved posts", () => {
    expect(validateFolder(day({ time: "9am" }))).toContain("2026-01-05: time \"9am\" is not HH:MM");
    expect(validateFolder(day({ time: "25:00" }))).toContain("2026-01-05: time \"25:00\" is not HH:MM");
    const past = validateFolder(day({ status: "approved" }), { now: new Date("2027-01-01T00:00:00Z") });
    expect(past).toContain("2026-01-05: approved post time 2026-01-05 09:00 America/New_York is in the past");
    const future = validateFolder(day({ status: "approved" }), { now: new Date("2025-12-01T00:00:00Z") });
    expect(future).toEqual([]);
  });

  it("requires caption files for non manual platforms", () => {
    const files = baseFiles(); delete files["instagram.md"];
    expect(validateFolder(day({}, files))).toContain("2026-01-05: instagram caption file instagram.md is missing or empty");
    const headingOnly = validateFolder(day({}, baseFiles({ "instagram.md": "\n## First comment\n\n#a\n" })));
    expect(headingOnly).toContain("2026-01-05: instagram caption file instagram.md is missing or empty");
    const manual = validateFolder(day({ platforms: { facebook: { type: "REEL", caption: "facebook.md" }, linkedin: { manual: true, caption: "linkedin.md" } } }));
    expect(manual).toEqual([]);
  });

  it("requires alt text on images and thumbnails", () => {
    const m = baseManifest(); m.media[1].alt = "";
    expect(validateFolder(day(m))).toContain("2026-01-05: media/thumbnail.jpg needs alt text");
  });

  it("requires a thumbnail to be jpg, jpeg, or png", () => {
    const webp = baseManifest(); webp.media[1].file = "media/thumbnail.webp";
    expect(validateFolder(day(webp))).toContain("2026-01-05: media/thumbnail.webp thumbnail must be jpg, jpeg, or png");
    for (const file of ["media/thumbnail.PNG", "media/thumbnail.jpeg", "media/thumbnail.JPG"]) {
      const ok = baseManifest(); ok.media[1].file = file;
      expect(validateFolder(day(ok))).toEqual([]);
    }
  });

  it("requires media files to exist once ready", () => {
    const files = baseFiles(); delete files["media/reel-vertical.mp4"];
    expect(validateFolder(day({ status: "planned" }, files))).toEqual([]);
    expect(validateFolder(day({ status: "ready" }, files))).toContain("2026-01-05: media/reel-vertical.mp4 does not exist");
  });

  it("enforces Metricool media rules", () => {
    const noVideo = baseManifest(); noVideo.media = [noVideo.media[1]];
    expect(validateFolder(day(noVideo))).toContain("2026-01-05: facebook REEL needs a video");
    expect(validateFolder(day(noVideo))).toContain("2026-01-05: instagram REEL needs a video");
    const igNoMedia = baseManifest(); igNoMedia.media = [];
    expect(validateFolder(day(igNoMedia))).toContain("2026-01-05: instagram needs an image or video");
    const story = baseManifest(); story.platforms.facebook.type = "STORY";
    expect(validateFolder(day(story))).toContain("2026-01-05: facebook STORY carries no caption");
  });

  it("enforces caption length limits", () => {
    const files = baseFiles({ "instagram.md": "x".repeat(2201) + "\n\n## First comment\n\n#a\n" });
    expect(validateFolder(day({}, files))).toContain("2026-01-05: instagram caption is 2201 characters, limit 2200");
  });

  it("rejects em dashes in any text file", () => {
    const files = baseFiles({ "source/script.md": "Measure every color \u2014 always.\n" });
    expect(validateFolder(day({}, files))).toContain("2026-01-05: source/script.md contains an em dash");
  });

  it("keeps Instagram hashtags in the first comment", () => {
    const files = baseFiles({ "instagram.md": "Great site #WebDesign\n\n## First comment\n\n#a\n" });
    expect(validateFolder(day({}, files))).toContain("2026-01-05: instagram caption has hashtags above the first comment");
  });

  it("requires an AI disclosure when voice or visuals are AI", () => {
    const problems = validateFolder(day({ ai: { voice: true, visuals: false } }));
    expect(problems).toContain("2026-01-05: facebook caption needs an AI disclosure line");
    expect(problems).toContain("2026-01-05: instagram caption needs an AI disclosure line");
    const ok = validateFolder(day({ ai: { voice: true, visuals: false } }, baseFiles({
      "facebook.md": "The voice is AI narrated.\n",
      "instagram.md": "Narration is an AI voice.\n\n## First comment\n\n#a\n"
    })));
    expect(ok).toEqual([]);
  });

  it("requires K and A spelled out in narration scripts", () => {
    const files = baseFiles({ "source/narration-script.md": "K&A builds websites.\n" });
    expect(validateFolder(day({}, files))).toContain("2026-01-05: source/narration-script.md must spell K and A for the voice model");
  });

  it("reports a non-object manifest as the only problem", () => {
    root = makeTempRoot();
    const dir = path.join(root, "To Be Released", "2026-01-05");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "post.json"), "null\n");
    expect(validateFolder(dir)).toEqual(["2026-01-05: post.json is not an object"]);
  });

  it("reports a non-object platform config and still validates the rest", () => {
    const problems = validateFolder(day({
      platforms: { facebook: null, instagram: { type: "REEL", caption: "instagram.md" } }
    }));
    expect(problems).toContain("2026-01-05: platforms.facebook is not an object");
    expect(problems.some((p) => p.includes("instagram"))).toBe(false);
  });

  it("reports a media entry with no file and does not throw", () => {
    const problems = validateFolder(day({ media: [{ role: "video" }], status: "ready" }));
    expect(problems).toContain("2026-01-05: media entry 0 has no file");
  });

  it("reports an invalid IANA timezone and skips the past check", () => {
    const problems = validateFolder(day({ timezone: "Eastern", status: "approved" }));
    expect(problems).toContain('2026-01-05: timezone "Eastern" is not a valid IANA zone');
  });

  it("reports a missing folder", () => {
    root = makeTempRoot();
    const dir = path.join(root, "To Be Released", "2026-01-06");
    expect(validateFolder(dir)).toEqual(["2026-01-06: folder does not exist"]);
  });

  it("reports a missing post.json in an existing folder", () => {
    root = makeTempRoot();
    const dir = path.join(root, "To Be Released", "2026-01-06");
    fs.mkdirSync(dir, { recursive: true });
    expect(validateFolder(dir)).toEqual(["2026-01-06: post.json is missing"]);
  });

  it("accepts a Story with no caption file and an image", () => {
    const files = { "media/photo.jpg": Buffer.alloc(16), "brief.md": "# Brief: Fixture post\n\nApproved: yes\n" };
    const problems = validateFolder(day({
      platforms: { facebook: { type: "STORY" } },
      media: [{ file: "media/photo.jpg", role: "image", origin: "human", alt: "A phone showing the site" }]
    }, files));
    expect(problems).toEqual([]);
  });

  it("rejects a Story that carries a caption", () => {
    const files = { "media/photo.jpg": Buffer.alloc(16), "facebook.md": "Behind the scenes.\n" };
    const problems = validateFolder(day({
      platforms: { facebook: { type: "STORY", caption: "facebook.md" } },
      media: [{ file: "media/photo.jpg", role: "image", origin: "human", alt: "A phone showing the site" }]
    }, files));
    expect(problems).toContain("2026-01-05: facebook STORY carries no caption");
  });

  it("rejects a lowercase type", () => {
    const problems = validateFolder(day({ platforms: { facebook: { type: "reel", caption: "facebook.md" } } }));
    expect(problems).toContain('2026-01-05: facebook type "reel" is not one of POST, REEL, STORY');
  });

  it("rejects an unknown network", () => {
    const problems = validateFolder(day({ platforms: { tiktok: { type: "POST", caption: "facebook.md" } } }));
    expect(problems).toContain('2026-01-05: unknown network "tiktok"');
  });

  it("requires linkedin to be manual", () => {
    const problems = validateFolder(day({ platforms: { linkedin: { caption: "linkedin.md" } } }));
    expect(problems).toContain("2026-01-05: linkedin must be manual until it is connected to Metricool");
  });

  it("rejects an unknown media role", () => {
    const files = { "media/cover.jpg": Buffer.alloc(16) };
    const problems = validateFolder(day({
      platforms: {},
      media: [{ file: "media/cover.jpg", role: "cover", origin: "human" }]
    }, files));
    expect(problems).toContain('2026-01-05: media/cover.jpg has unknown role "cover"');
  });

  it("rejects an unknown media origin", () => {
    const files = { "media/cover.jpg": Buffer.alloc(16) };
    const problems = validateFolder(day({
      platforms: {},
      media: [{ file: "media/cover.jpg", role: "image", origin: "midjourney", alt: "x" }]
    }, files));
    expect(problems).toContain('2026-01-05: media/cover.jpg has unknown origin "midjourney"');
  });

  it("rejects a media file outside media/", () => {
    const problems = validateFolder(day({
      platforms: {},
      media: [{ file: "cover.jpg", role: "image", origin: "human", alt: "x" }]
    }));
    expect(problems).toContain("2026-01-05: cover.jpg must be a relative path inside media/");
  });

  it("rejects a media file that escapes media/ with ..", () => {
    const problems = validateFolder(day({
      platforms: {},
      media: [{ file: "media/../secret.txt", role: "image", origin: "human", alt: "x" }]
    }));
    expect(problems).toContain("2026-01-05: media/../secret.txt must be a relative path inside media/");
  });

  it("requires a timezone string", () => {
    const m = baseManifest(); m.timezone = undefined;
    expect(validateFolder(day(m))).toContain("2026-01-05: timezone is missing");
  });

  it("requires at least one non-manual network on non-native folders", () => {
    expect(validateFolder(day({ platforms: {} }))).toContain("2026-01-05: platforms must name at least one non-manual network");
    expect(validateFolder(day({ platforms: { linkedin: { manual: true, caption: "linkedin.md" } } }))).toContain("2026-01-05: platforms must name at least one non-manual network");
  });

  it("requires a role on every media entry", () => {
    const m = baseManifest(); delete m.media[0].role;
    expect(validateFolder(day(m))).toContain("2026-01-05: media/reel-vertical.mp4 has no role");
  });

  it("reports the missing video even when the caption is missing", () => {
    const m = baseManifest(); m.media = [m.media[1]];
    const files = baseFiles(); delete files["facebook.md"];
    const problems = validateFolder(day(m, files));
    expect(problems).toContain("2026-01-05: facebook caption file facebook.md is missing or empty");
    expect(problems).toContain("2026-01-05: facebook REEL needs a video");
  });

  it("accepts an Instagram Story whose file holds only the first comment heading", () => {
    const m = baseManifest();
    m.platforms = { instagram: { type: "STORY", caption: "instagram.md" } };
    m.media = [{ file: "media/thumbnail.jpg", role: "image", origin: "human", alt: "A phone" }];
    const files = baseFiles({ "instagram.md": "\n## First comment\n\n#a\n" });
    expect(validateFolder(day(m, files))).toEqual([]);
  });

  it("requires a word boundary before AI in the disclosure", () => {
    const files = baseFiles({ "facebook.md": "Our Thai voice actor.\n", "instagram.md": "Narration is an AI voice.\n\n## First comment\n\n#a\n" });
    expect(validateFolder(day({ ai: { voice: true, visuals: false } }, files))).toContain("2026-01-05: facebook caption needs an AI disclosure line");
  });

  it("requires brief.md to exist and be non-empty", () => {
    const files = baseFiles(); delete files["brief.md"];
    expect(validateFolder(day({}, files))).toContain("2026-01-05: brief.md is missing or empty");
    const empty = validateFolder(day({}, baseFiles({ "brief.md": "   \n" })));
    expect(empty).toContain("2026-01-05: brief.md is missing or empty");
  });

  it("requires an approved brief once status moves past planned", () => {
    const files = baseFiles({ "brief.md": "# Brief: Fixture post\n\nApproved: no\n" });
    const problems = validateFolder(day({ status: "ready" }, files));
    expect(problems).toContain("2026-01-05: brief.md is not approved; status ready needs an approved brief");
  });

  it("allows a planned folder with an unapproved brief", () => {
    const files = baseFiles({ "brief.md": "# Brief: Fixture post\n\nApproved: no\n" });
    expect(validateFolder(day({ status: "planned" }, files))).toEqual([]);
  });
});
