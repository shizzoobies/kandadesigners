import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { validateFolder, probeMedia, readYoutubeConfig } from "../lib/validate.mjs";

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

  it("checks media rules per network when an entry names its platforms", () => {
    const split = baseManifest();
    split.platforms = { facebook: { type: "POST", caption: "facebook.md" }, instagram: { type: "POST", caption: "instagram.md" } };
    split.media = [
      { file: "media/slideshow.mp4", role: "video", origin: "kap-reel", alt: "", platforms: ["facebook"] },
      { file: "media/slide-01.jpg", role: "image", origin: "kap-reel", alt: "Slide one", platforms: ["instagram"] }
    ];
    const files = baseFiles({ "media/slideshow.mp4": Buffer.alloc(8), "media/slide-01.jpg": Buffer.alloc(8) });
    expect(validateFolder(day(split, files))).toEqual([]);

    const igVideoOnly = baseManifest();
    igVideoOnly.media = [{ file: "media/reel-vertical.mp4", role: "video", origin: "kap-reel", alt: "", platforms: ["facebook"] }];
    expect(validateFolder(day(igVideoOnly))).toContain("2026-01-05: instagram REEL needs a video");
    expect(validateFolder(day(igVideoOnly))).not.toContain("2026-01-05: facebook REEL needs a video");

    const bad = baseManifest();
    bad.media[0] = { ...bad.media[0], platforms: ["tiktok"] };
    expect(validateFolder(day(bad))).toContain('2026-01-05: media/reel-vertical.mp4 names unknown platform "tiktok"');
    const notList = baseManifest();
    notList.media[0] = { ...notList.media[0], platforms: "facebook" };
    expect(validateFolder(day(notList))).toContain("2026-01-05: media/reel-vertical.mp4 platforms must be a list of networks");
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

  it("accepts linkedin through Metricool as a post or a document", () => {
    const li = baseManifest({ platforms: { linkedin: { type: "POST", caption: "linkedin.md" } } });
    const files = baseFiles({ "linkedin.md": "A founder's note.\n\n## First comment\n\nhttps://ka-performancefl.com\n" });
    expect(validateFolder(day(li, files))).toEqual([]);

    const doc = baseManifest({ platforms: { linkedin: { type: "DOCUMENT", caption: "linkedin.md" } } });
    doc.media = [{ file: "media/slide-01.jpg", role: "image", origin: "kap-reel", alt: "Slide one" }];
    const docFiles = baseFiles({ "linkedin.md": "Swipe through.\n", "media/slide-01.jpg": Buffer.alloc(8) });
    expect(validateFolder(day(doc, docFiles))).toContain("2026-01-05: linkedin DOCUMENT needs at least 2 images");

    const bad = baseManifest({ platforms: { linkedin: { type: "REEL", caption: "linkedin.md" } } });
    expect(validateFolder(day(bad, files))).toContain('2026-01-05: linkedin type "REEL" is not one of POST, DOCUMENT');

    const long = baseFiles({ "linkedin.md": "x".repeat(3001) + "\n" });
    expect(validateFolder(day(li, long))).toContain("2026-01-05: linkedin caption is 3001 characters, limit 3000");
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

const OWNER_CLIENT = { slug: "davids-bbq", name: "David's BBQ", publish: "owner", networks: ["facebook", "instagram"] };

function ownerDay(overrides = {}, files = baseFiles()) {
  return day({
    platforms: {
      facebook: { type: "POST", caption: "facebook.md" },
      instagram: { type: "POST", caption: "instagram.md" }
    },
    ...overrides
  }, files);
}

describe("validateFolder for an owner-published client", () => {
  it("accepts a plain feed post naming only the client's networks", () => {
    expect(validateFolder(ownerDay(), { client: OWNER_CLIENT })).toEqual([]);
  });

  it("rejects a network the client does not list, even one K&A itself supports", () => {
    const problems = validateFolder(
      ownerDay({ platforms: { facebook: { type: "POST", caption: "facebook.md" }, linkedin: { type: "POST", caption: "facebook.md" } } }),
      { client: OWNER_CLIENT }
    );
    expect(problems).toContain('2026-01-05: davids-bbq does not post to "linkedin"');
  });

  it("rejects manual: the owner posts every network by hand already", () => {
    const problems = validateFolder(
      ownerDay({ platforms: { facebook: { type: "POST", caption: "facebook.md", manual: true }, instagram: { type: "POST", caption: "instagram.md" } } }),
      { client: OWNER_CLIENT }
    );
    expect(problems).toContain("2026-01-05: facebook must not be manual: an owner-published client posts every network by hand");
  });

  it("rejects a type outside POST/REEL, even one the network would normally allow", () => {
    const problems = validateFolder(
      ownerDay({ platforms: { facebook: { type: "STORY", caption: "facebook.md" }, instagram: { type: "POST", caption: "instagram.md" } } }),
      { client: OWNER_CLIENT }
    );
    expect(problems).toContain('2026-01-05: facebook type "STORY" is not one of POST, REEL');
  });

  it("scopes a media entry's platforms list to the client's own networks too", () => {
    const files = baseFiles();
    const m = baseManifest({
      platforms: { facebook: { type: "POST", caption: "facebook.md" }, instagram: { type: "POST", caption: "instagram.md" } },
      media: [
        { file: "media/reel-vertical.mp4", role: "video", origin: "kap-reel", alt: "", platforms: ["linkedin"] },
        { file: "media/thumbnail.jpg", role: "thumbnail", origin: "kap-reel", alt: "A phone showing a website" }
      ]
    });
    root = makeTempRoot();
    const dir = makeDay(root, "2026-01-05", m, files);
    expect(validateFolder(dir, { client: OWNER_CLIENT })).toContain('2026-01-05: media/reel-vertical.mp4 names unknown platform "linkedin"');
  });

  it("leaves a non-owner client (or no client at all) on the normal K&A rules", () => {
    expect(validateFolder(day())).toEqual([]);
    expect(validateFolder(day(), { client: { slug: "davids-bbq", publish: "metricool", networks: ["facebook"] } })).toEqual([]);
  });

  it("reports a missing/empty networks list, and does not fall back to K&A's own network list", () => {
    const misconfigured = { slug: "davids-bbq", name: "David's BBQ", publish: "owner" };
    const problems = validateFolder(ownerDay(), { client: misconfigured });
    expect(problems).toContain("2026-01-05: davids-bbq has no networks configured");
    // facebook and instagram are perfectly good K&A networks; a misconfigured
    // owner client (no `networks` at all) must not silently fall back to
    // accepting them anyway.
    expect(problems).toContain('2026-01-05: davids-bbq does not post to "facebook"');
    expect(problems).toContain('2026-01-05: davids-bbq does not post to "instagram"');
  });

  it("requires the post's timezone to match the client's own", () => {
    const client = { ...OWNER_CLIENT, timezone: "America/Chicago" };
    expect(validateFolder(ownerDay(), { client })).toContain(
      '2026-01-05: timezone "America/New_York" does not match davids-bbq\'s timezone "America/Chicago"'
    );
    expect(validateFolder(ownerDay({ timezone: "America/Chicago" }), { client })).toEqual([]);
  });
});

describe("validateFolder status handed-off", () => {
  it("K&A (no client) rejects the handed-off status", () => {
    expect(validateFolder(day({ status: "handed-off" }))).toContain('2026-01-05: status "handed-off" is only valid for an owner-published client');
  });

  it("an owner client may carry the handed-off status", () => {
    const problems = validateFolder(ownerDay({ status: "handed-off" }), { client: OWNER_CLIENT });
    expect(problems).not.toContain('2026-01-05: status "handed-off" is only valid for an owner-published client');
  });
});

const YT = { verified: false, playlists: ["Quick fixes for your website", "Practical AI for small business"] };
const YT_LINK = "https://ka-performancefl.com/?utm_source=youtube&utm_medium=social&utm_campaign=2026-01-05";
const MB = 1024 * 1024;

/** A fake probe: file name to {width, height, duration, size}. Anything unnamed is a small 9:16 clip. */
function fakeProbe(table = {}) {
  const calls = [];
  const probe = (file) => {
    calls.push(path.basename(file));
    return { width: 1080, height: 1920, duration: 30, size: MB, ...(table[path.basename(file)] || {}) };
  };
  probe.calls = calls;
  return probe;
}

/** The weekday reel folder with a youtube Short riding along. */
function shortDay(ytOverrides = {}, overrides = {}, fileOverrides = {}) {
  const m = baseManifest(overrides);
  m.platforms = {
    ...m.platforms,
    youtube: {
      type: "SHORT", caption: "youtube.md", title: "Press Tab on your own website",
      tags: ["website accessibility", "small business website"], category: "HOWTO_STYLE",
      playlist: "Quick fixes for your website", time: "12:00", ...ytOverrides
    }
  };
  return day(m, baseFiles({ "youtube.md": `Press Tab on your own website.\n${YT_LINK}\n\nWhat to look for.\n`, ...fileOverrides }));
}

/** A long-form folder: youtube is its only network. */
function videoDay(ytOverrides = {}, overrides = {}, fileOverrides = {}) {
  const m = baseManifest({
    time: "11:00",
    platforms: {
      youtube: {
        type: "VIDEO", caption: "youtube.md", title: "Make your small business website accessible",
        tags: ["website accessibility"], category: "HOWTO_STYLE", playlist: "Quick fixes for your website", ...ytOverrides
      }
    },
    media: [
      { file: "media/video.mp4", role: "video", origin: "kap-reel", alt: "" },
      { file: "media/thumbnail.jpg", role: "thumbnail", origin: "kap-reel", alt: "A laptop showing a website" },
      { file: "media/video.srt", role: "captions", origin: "kap-reel" }
    ],
    ...overrides
  });
  const files = {
    "youtube.md": `Make your website work for everyone.\n${YT_LINK}\n\nChapters\n0:00 Start\n`,
    "media/video.mp4": Buffer.alloc(32),
    "media/thumbnail.jpg": Buffer.alloc(32),
    "media/video.srt": "1\n00:00:00,000 --> 00:00:01,000\nHello\n",
    "brief.md": "# Brief: Long video\n\nApproved: yes\n",
    ...fileOverrides
  };
  return day(m, files);
}

const videoProbe = (table = {}) => fakeProbe({
  "video.mp4": { width: 1920, height: 1080, duration: 600, size: 200 * MB },
  "thumbnail.jpg": { width: 1920, height: 1080, duration: 0, size: MB },
  ...table
});

describe("validateFolder for youtube", () => {
  it("accepts a Short riding along with the reel and a long-form video", () => {
    expect(validateFolder(shortDay(), { youtube: YT })).toEqual([]);
    expect(validateFolder(videoDay(), { youtube: YT })).toEqual([]);
    expect(validateFolder(shortDay({}, { status: "ready" }), { youtube: YT, probe: fakeProbe() })).toEqual([]);
    expect(validateFolder(videoDay({}, { status: "ready" }), { youtube: YT, probe: videoProbe() })).toEqual([]);
  });

  it("rejects a type other than VIDEO or SHORT", () => {
    expect(validateFolder(shortDay({ type: "REEL" }), { youtube: YT })).toContain('2026-01-05: youtube type "REEL" is not one of VIDEO, SHORT');
  });

  it("requires a title of 1 to 100 characters and warns above 70", () => {
    expect(validateFolder(shortDay({ title: undefined }), { youtube: YT })).toContain("2026-01-05: youtube needs a title");
    expect(validateFolder(shortDay({ title: "  " }), { youtube: YT })).toContain("2026-01-05: youtube needs a title");
    expect(validateFolder(shortDay({ title: "x".repeat(101) }), { youtube: YT })).toContain("2026-01-05: youtube title is 101 characters, limit 100");
    const warnings = [];
    expect(validateFolder(shortDay({ title: "x".repeat(71) }), { youtube: YT, warnings })).toEqual([]);
    expect(warnings).toEqual(["2026-01-05: youtube title is 71 characters; feeds cut titles near 70"]);
    const none = [];
    validateFolder(shortDay({ title: "x".repeat(70) }), { youtube: YT, warnings: none });
    expect(none).toEqual([]);
  });

  it("checks the category, the tags, and the playlist", () => {
    expect(validateFolder(shortDay({ category: "HOWTO" }), { youtube: YT })).toContain("2026-01-05: youtube category \"HOWTO\" is not one of Metricool's categories");
    expect(validateFolder(shortDay({ category: undefined }), { youtube: YT })).toEqual([]);
    expect(validateFolder(shortDay({ tags: "a, b" }), { youtube: YT })).toContain("2026-01-05: youtube tags must be a list of strings");
    expect(validateFolder(shortDay({ tags: ["x".repeat(300), "y".repeat(200)] }), { youtube: YT })).toContain("2026-01-05: youtube tags are 501 characters combined, limit 500");
    expect(validateFolder(shortDay({ tags: ["#webdesign"] }), { youtube: YT })).toContain('2026-01-05: youtube tag "#webdesign" has a #');
    expect(validateFolder(shortDay({ tags: undefined }), { youtube: YT })).toEqual([]);
    expect(validateFolder(shortDay({ playlist: "Other" }), { youtube: YT })).toContain('2026-01-05: youtube playlist "Other" is not one of Quick fixes for your website, Practical AI for small business');
  });

  it("requires the tagged link on line 2 of the description", () => {
    expect(validateFolder(shortDay({}, {}, { "youtube.md": `Hook.\n\n${YT_LINK}\n` }), { youtube: YT }))
      .toContain("2026-01-05: youtube.md line 2 needs a ka-performancefl.com link with utm_source=youtube");
    expect(validateFolder(shortDay({}, {}, { "youtube.md": "Hook.\nhttps://ka-performancefl.com/?utm_source=facebook\n" }), { youtube: YT }))
      .toContain("2026-01-05: youtube.md line 2 needs a ka-performancefl.com link with utm_source=youtube");
    expect(validateFolder(shortDay({}, {}, { "youtube.md": "" }), { youtube: YT }))
      .toContain("2026-01-05: youtube caption file youtube.md is missing or empty");
  });

  it("requires the AI line in the description", () => {
    const ai = { ai: { voice: true, visuals: false } };
    const aiFiles = { "facebook.md": "The voice is AI narrated.\n", "instagram.md": "The voice is AI narrated.\n\n## First comment\n\n#a\n" };
    expect(validateFolder(shortDay({}, ai, aiFiles), { youtube: YT })).toEqual(["2026-01-05: youtube caption needs an AI disclosure line"]);
    const ok = { ...aiFiles, "youtube.md": `Hook.\n${YT_LINK}\n\nThe voice is AI narrated.\n` };
    expect(validateFolder(shortDay({}, ai, ok), { youtube: YT })).toEqual([]);
  });

  it("checks a per-network time override on any network", () => {
    expect(validateFolder(shortDay({ time: "noon" }), { youtube: YT })).toContain('2026-01-05: platforms.youtube.time "noon" is not HH:MM');
    const fb = baseManifest(); fb.platforms.facebook.time = "25:00";
    expect(validateFolder(day(fb))).toContain('2026-01-05: platforms.facebook.time "25:00" is not HH:MM');
    // 13:30Z is 08:30 in New York: the folder's 09:00 is ahead, the youtube 08:00 is behind.
    const now = new Date("2026-01-05T13:30:00Z");
    expect(validateFolder(shortDay({ time: "08:00" }, { status: "approved" }), { youtube: YT, now, probe: fakeProbe() }))
      .toEqual(["2026-01-05: approved youtube time 2026-01-05 08:00 America/New_York is in the past"]);
    expect(validateFolder(shortDay({ time: "12:00" }, { status: "approved" }), { youtube: YT, now, probe: fakeProbe() })).toEqual([]);
  });

  it("requires a video, and a thumbnail on a VIDEO", () => {
    const noVideo = baseManifest();
    noVideo.media = noVideo.media.map((e) => e.role === "video" ? { ...e, platforms: ["facebook", "instagram"] } : e);
    noVideo.platforms.youtube = { type: "SHORT", caption: "youtube.md", title: "T" };
    root = makeTempRoot();
    const dir = makeDay(root, "2026-01-05", noVideo, baseFiles({ "youtube.md": `Hook.\n${YT_LINK}\n` }));
    expect(validateFolder(dir, { youtube: YT })).toEqual(["2026-01-05: youtube SHORT needs a video"]);

    const noThumb = videoDay({}, { media: [
      { file: "media/video.mp4", role: "video", origin: "kap-reel", alt: "" },
      { file: "media/video.srt", role: "captions", origin: "kap-reel" }
    ] });
    expect(validateFolder(noThumb, { youtube: { ...YT, verified: true } })).toEqual(["2026-01-05: youtube VIDEO needs a thumbnail"]);
    // Custom thumbnails need a verified channel: until then it is set by hand in Studio.
    const warnings = [];
    expect(validateFolder(noThumb, { youtube: YT, warnings })).toEqual([]);
    expect(warnings).toEqual(["2026-01-05: youtube VIDEO has no thumbnail: channel not verified; set the thumbnail in Studio"]);
  });

  it("gives youtube exactly one video and no images", () => {
    const m = baseManifest({ status: "ready" });
    m.platforms.youtube = { type: "SHORT", caption: "youtube.md", title: "T" };
    m.media.push({ file: "media/wide.mp4", role: "video", origin: "kap-reel", alt: "" });
    m.media.push({ file: "media/slide-01.jpg", role: "image", origin: "kap-reel", alt: "Slide one" });
    root = makeTempRoot();
    const files = baseFiles({ "youtube.md": `Hook.\n${YT_LINK}\n`, "media/wide.mp4": Buffer.alloc(8), "media/slide-01.jpg": Buffer.alloc(8) });
    const dir = makeDay(root, "2026-01-05", m, files);
    const probe = fakeProbe({ "wide.mp4": { width: 1920, height: 1080 } });
    const problems = validateFolder(dir, { youtube: YT, probe });
    expect(problems).toContain('2026-01-05: youtube gets 2 videos; scope the others with "platforms"');
    expect(problems).toContain('2026-01-05: youtube gets 1 image(s); scope them away with "platforms"');
    // No shape message about the wrong file while the scoping is off.
    expect(problems.some((p) => p.includes("vertical or square"))).toBe(false);

    m.media = m.media.map((e) => e.file === "media/reel-vertical.mp4" ? e : { ...e, platforms: ["facebook"] });
    fs.writeFileSync(path.join(dir, "post.json"), JSON.stringify(m));
    expect(validateFolder(dir, { youtube: YT, probe })).toEqual([]);
  });

  it("reports a file with no video stream", () => {
    const probe = fakeProbe({ "reel-vertical.mp4": { width: undefined, height: undefined } });
    expect(validateFolder(shortDay({}, { status: "ready" }), { youtube: YT, probe }))
      .toContain("2026-01-05: media/reel-vertical.mp4 has no video stream");
  });

  it("checks the past only for networks Metricool does not have yet, each at its own time", () => {
    // FB and IG at 10:30 are recorded; the youtube Short at 12:00 is not. 15:45Z is 10:45 in New York.
    const now = new Date("2026-01-05T15:45:00Z");
    const recorded = { facebook: { id: "1", uuid: "u-1" }, instagram: { id: "2", uuid: "u-2" } };
    const staggered = { status: "approved", time: "10:30", metricool: recorded };
    expect(validateFolder(shortDay({ time: "12:00" }, staggered), { youtube: YT, now, probe: fakeProbe() })).toEqual([]);
    expect(validateFolder(shortDay({ time: "10:40" }, staggered), { youtube: YT, now, probe: fakeProbe() }))
      .toEqual(["2026-01-05: approved youtube time 2026-01-05 10:40 America/New_York is in the past"]);
    // Nothing recorded yet: the folder time still counts.
    expect(validateFolder(shortDay({ time: "12:00" }, { status: "approved", time: "10:30" }), { youtube: YT, now, probe: fakeProbe() }))
      .toEqual(["2026-01-05: approved post time 2026-01-05 10:30 America/New_York is in the past"]);
  });

  it("probes only once the post is ready", () => {
    const probe = fakeProbe({ "reel-vertical.mp4": { width: 1920, height: 1080 } });
    expect(validateFolder(shortDay(), { youtube: YT, probe })).toEqual([]);
    expect(probe.calls).toEqual([]);
    expect(validateFolder(shortDay({}, { status: "ready" }), { youtube: YT, probe }))
      .toContain("2026-01-05: media/reel-vertical.mp4 is 1920x1080; a youtube SHORT needs a vertical or square video");
    // Folders without youtube are never probed.
    const other = fakeProbe();
    expect(validateFolder(day({ status: "ready" }), { probe: other })).toEqual([]);
    expect(other.calls).toEqual([]);
  });

  it("checks a Short's aspect and duration", () => {
    const ready = { status: "ready" };
    expect(validateFolder(shortDay({}, ready), { youtube: YT, probe: fakeProbe({ "reel-vertical.mp4": { width: 1080, height: 1080 } }) })).toEqual([]);
    expect(validateFolder(shortDay({}, ready), { youtube: YT, probe: fakeProbe({ "reel-vertical.mp4": { width: 1080, height: 1350 } }) })).toEqual([]);
    expect(validateFolder(shortDay({}, ready), { youtube: YT, probe: fakeProbe({ "reel-vertical.mp4": { width: 1350, height: 1080 } }) }))
      .toContain("2026-01-05: media/reel-vertical.mp4 is 1350x1080; a youtube SHORT needs a vertical or square video");
    expect(validateFolder(shortDay({}, ready), { youtube: YT, probe: fakeProbe({ "reel-vertical.mp4": { duration: 170 } }) })).toEqual([]);
    expect(validateFolder(shortDay({}, ready), { youtube: YT, probe: fakeProbe({ "reel-vertical.mp4": { duration: 171.5 } }) }))
      .toContain("2026-01-05: media/reel-vertical.mp4 runs 171.5s; a youtube SHORT must be 170s or less");
  });

  it("checks a VIDEO's aspect and duration, with the verified switch", () => {
    const ready = { status: "ready" };
    expect(validateFolder(videoDay({}, ready), { youtube: YT, probe: videoProbe({ "video.mp4": { width: 1080, height: 1920, duration: 600, size: MB } }) }))
      .toContain("2026-01-05: media/video.mp4 is 1080x1920; a youtube VIDEO needs 16:9");
    expect(validateFolder(videoDay({}, ready), { youtube: YT, probe: videoProbe({ "video.mp4": { width: 1920, height: 1080, duration: 60, size: MB } }) }))
      .toContain("2026-01-05: media/video.mp4 runs 60s; a youtube VIDEO must be over 60s");
    const long = videoProbe({ "video.mp4": { width: 1920, height: 1080, duration: 901, size: MB } });
    expect(validateFolder(videoDay({}, ready), { youtube: YT, probe: long }))
      .toContain("2026-01-05: media/video.mp4 runs 901s; an unverified channel allows 900s (15 minutes)");
    expect(validateFolder(videoDay({}, ready), { youtube: { ...YT, verified: true }, probe: long })).toEqual([]);
  });

  it("checks a VIDEO thumbnail's size and shape", () => {
    const ready = { status: "ready" };
    expect(validateFolder(videoDay({}, ready), { youtube: YT, probe: videoProbe({ "thumbnail.jpg": { width: 1280, height: 720, size: MB } }) })).toEqual([]);
    expect(validateFolder(videoDay({}, ready), { youtube: YT, probe: videoProbe({ "thumbnail.jpg": { width: 640, height: 360, size: MB } }) }))
      .toContain("2026-01-05: media/thumbnail.jpg is 640x360; a youtube VIDEO thumbnail needs 16:9, 1280 wide or more");
    expect(validateFolder(videoDay({}, ready), { youtube: YT, probe: videoProbe({ "thumbnail.jpg": { width: 1920, height: 1440, size: MB } }) }))
      .toContain("2026-01-05: media/thumbnail.jpg is 1920x1440; a youtube VIDEO thumbnail needs 16:9, 1280 wide or more");
    expect(validateFolder(videoDay({}, ready), { youtube: YT, probe: videoProbe({ "thumbnail.jpg": { width: 1920, height: 1080, size: 1999999 } }) })).toEqual([]);
    expect(validateFolder(videoDay({}, ready), { youtube: YT, probe: videoProbe({ "thumbnail.jpg": { width: 1920, height: 1080, size: 2000000 } }) }))
      .toContain("2026-01-05: media/thumbnail.jpg is 2.0 MB; a youtube thumbnail must be under 2 MB");
  });

  it("caps every file bound for R2 at 280 MB", () => {
    const ready = { status: "ready" };
    expect(validateFolder(videoDay({}, ready), { youtube: YT, probe: videoProbe({ "video.mp4": { width: 1920, height: 1080, duration: 600, size: 280 * MB } }) })).toEqual([]);
    expect(validateFolder(videoDay({}, ready), { youtube: YT, probe: videoProbe({ "video.mp4": { width: 1920, height: 1080, duration: 600, size: 281 * MB } }) }))
      .toContain("2026-01-05: media/video.mp4 is 281.0 MB; files bound for R2 must be 280 MB or less");
    // In a Short's folder the cap covers every R2 file in the folder; the captions file is never probed.
    const probe = fakeProbe({ "thumbnail.jpg": { size: 300 * MB } });
    expect(validateFolder(shortDay({}, ready), { youtube: YT, probe }))
      .toContain("2026-01-05: media/thumbnail.jpg is 300.0 MB; files bound for R2 must be 280 MB or less");
    expect(probe.calls).not.toContain("reel-vertical.srt");
  });

  it("reports a file the probe cannot read", () => {
    const probe = () => { throw new Error("ffprobe failed: invalid data"); };
    expect(validateFolder(shortDay({}, { status: "ready" }), { youtube: YT, probe }))
      .toContain("2026-01-05: cannot probe media/reel-vertical.mp4: ffprobe failed: invalid data");
  });
});

describe("probeMedia", () => {
  it("reads width, height and duration from ffprobe's JSON and the size from disk", () => {
    root = makeTempRoot();
    const file = path.join(root, "clip.mp4");
    fs.writeFileSync(file, Buffer.alloc(64));
    const seen = [];
    const run = (cmd, args) => {
      seen.push([cmd, args.slice(args.indexOf("-select_streams"), args.indexOf("-select_streams") + 2), args[args.length - 1]]);
      return { status: 0, stdout: JSON.stringify({ streams: [{ width: 1080, height: 1920 }], format: { duration: "29.97" } }), stderr: "" };
    };
    expect(probeMedia(file, run)).toEqual({ width: 1080, height: 1920, duration: 29.97, size: 64 });
    expect(seen).toEqual([["ffprobe", ["-select_streams", "v:0"], file]]);
    expect(() => probeMedia(file, () => ({ status: 1, stdout: "", stderr: "bad file" }))).toThrow("ffprobe failed: bad file");
  });

  it("swaps width and height for a phone video stored sideways", () => {
    root = makeTempRoot();
    const file = path.join(root, "clip.mp4");
    fs.writeFileSync(file, Buffer.alloc(8));
    const answer = (stream) => () => ({ status: 0, stdout: JSON.stringify({ streams: [stream], format: { duration: "10" } }), stderr: "" });
    expect(probeMedia(file, answer({ width: 1920, height: 1080, side_data_list: [{ side_data_type: "Display Matrix", rotation: -90 }] })))
      .toMatchObject({ width: 1080, height: 1920 });
    expect(probeMedia(file, answer({ width: 1920, height: 1080, tags: { rotate: "270" } }))).toMatchObject({ width: 1080, height: 1920 });
    expect(probeMedia(file, answer({ width: 1920, height: 1080, tags: { rotate: "180" } }))).toMatchObject({ width: 1920, height: 1080 });
  });

  it("leaves width and height unset when there is no video stream", () => {
    root = makeTempRoot();
    const file = path.join(root, "audio.mp4");
    fs.writeFileSync(file, Buffer.alloc(8));
    const run = () => ({ status: 0, stdout: JSON.stringify({ streams: [], format: { duration: "10" } }), stderr: "" });
    expect(probeMedia(file, run)).toEqual({ width: null, height: null, duration: 10, size: 8 });
  });
});

describe("readYoutubeConfig", () => {
  it("reads the channel config and falls back when the file is missing", () => {
    root = makeTempRoot();
    const file = path.join(root, "youtube.json");
    fs.writeFileSync(file, JSON.stringify(YT));
    expect(readYoutubeConfig(file)).toEqual(YT);
    expect(readYoutubeConfig(path.join(root, "none.json"))).toEqual({ verified: false, playlists: [] });
  });
});

describe("validateFolder instagram audio", () => {
  const withAudio = (audio, igType = "REEL") => {
    const m = baseManifest();
    m.platforms.instagram = { type: igType, caption: "instagram.md", audio };
    return m;
  };

  it("accepts a search term, a numeric id as a string or a number, and volumes from 0 to 100", () => {
    expect(validateFolder(day(withAudio({ term: "Espresso Sabrina Carpenter" })))).toEqual([]);
    expect(validateFolder(day(withAudio({ id: "1234567890" })))).toEqual([]);
    expect(validateFolder(day(withAudio({ id: 1234567890, audioVolume: 0, videoVolume: 100 })))).toEqual([]);
    expect(validateFolder(day(withAudio({ term: "Espresso", audioVolume: 40 })))).toEqual([]);
  });

  it("rejects audio on any network other than instagram", () => {
    const m = baseManifest();
    m.platforms.facebook = { type: "REEL", caption: "facebook.md", audio: { term: "Espresso" } };
    expect(validateFolder(day(m))).toContain("2026-01-05: facebook audio is for instagram only");
  });

  it("rejects audio on an instagram type other than REEL", () => {
    expect(validateFolder(day(withAudio({ term: "Espresso" }, "POST")))).toContain("2026-01-05: instagram audio needs type REEL, not POST");
    expect(validateFolder(day(withAudio({ term: "Espresso" }, "TRIAL_REEL")))).toContain("2026-01-05: instagram audio needs type REEL, not TRIAL_REEL");
    expect(validateFolder(day(withAudio({ term: "Espresso" }, "STORY"), baseFiles({ "instagram.md": "" })))).toContain("2026-01-05: instagram audio needs type REEL, not STORY");
  });

  it("needs exactly one of term or id, in an object", () => {
    expect(validateFolder(day(withAudio({ term: "Espresso", id: "123" })))).toContain("2026-01-05: instagram audio needs exactly one of term or id");
    expect(validateFolder(day(withAudio({ audioVolume: 40 })))).toContain("2026-01-05: instagram audio needs exactly one of term or id");
    expect(validateFolder(day(withAudio("Espresso")))).toContain("2026-01-05: instagram audio is not an object");
  });

  it("rejects an empty term and an id that is not numeric", () => {
    expect(validateFolder(day(withAudio({ term: "  " })))).toContain("2026-01-05: instagram audio term is empty");
    expect(validateFolder(day(withAudio({ id: "espresso" })))).toContain("2026-01-05: instagram audio id \"espresso\" is not a numeric Instagram audio id");
    expect(validateFolder(day(withAudio({ id: 12.5 })))).toContain("2026-01-05: instagram audio id \"12.5\" is not a numeric Instagram audio id");
    expect(validateFolder(day(withAudio({ id: 2 ** 60 })))).toContain(`2026-01-05: instagram audio id ${2 ** 60} is too long for a JSON number; write it as a string`);
    expect(validateFolder(day(withAudio({ id: "17841400123456789012" })))).toEqual([]);
    expect(validateFolder(day(withAudio({ id: -5 })))).toContain("2026-01-05: instagram audio id \"-5\" is not a numeric Instagram audio id");
    expect(validateFolder(day(withAudio({ id: null })))).toContain("2026-01-05: instagram audio id \"null\" is not a numeric Instagram audio id");
    expect(validateFolder(day(withAudio({ term: 5 })))).toContain("2026-01-05: instagram audio term must be a string");
  });

  it("is not supported for an owner-published client yet (the hand-off does not carry it)", () => {
    const m = baseManifest();
    m.platforms.instagram = { type: "REEL", caption: "instagram.md", audio: { term: "Espresso" } };
    const problems = validateFolder(day(m), { client: OWNER_CLIENT });
    expect(problems).toEqual(["2026-01-05: instagram audio is not supported for owner-published clients yet"]);
    delete m.platforms.instagram.audio;
    expect(validateFolder(day(m), { client: OWNER_CLIENT })).toEqual([]);
  });

  it("rejects volumes outside 0 to 100 or not whole numbers, and fields Metricool fills itself", () => {
    expect(validateFolder(day(withAudio({ term: "Espresso", audioVolume: 101 })))).toContain("2026-01-05: instagram audio audioVolume 101 is not a whole number from 0 to 100");
    expect(validateFolder(day(withAudio({ term: "Espresso", videoVolume: -1 })))).toContain("2026-01-05: instagram audio videoVolume -1 is not a whole number from 0 to 100");
    expect(validateFolder(day(withAudio({ term: "Espresso", videoVolume: "20" })))).toContain("2026-01-05: instagram audio videoVolume \"20\" is not a whole number from 0 to 100");
    expect(validateFolder(day(withAudio({ term: "Espresso", audioVolume: 40.5 })))).toContain("2026-01-05: instagram audio audioVolume 40.5 is not a whole number from 0 to 100");
    expect(validateFolder(day(withAudio({ term: "Espresso", title: "Espresso" })))).toContain("2026-01-05: instagram audio has unknown field \"title\"");
  });
});
