import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { buildReview } from "../lib/review.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

function noVideoProxy(src) { return src; } // never touches ffmpeg in tests

describe("buildReview (K&A root)", () => {
  it("builds one post entry per waiting folder, with captions, media and questions", () => {
    root = makeTempRoot();
    const files = baseFiles({ "brief.md": "# Brief: Fixture post\n\n## Questions for Alex\n- Pick a track\n" });
    makeDay(root, "2026-01-05", baseManifest({ status: "ready" }), files);
    const { data, files: fileMap } = buildReview({ root, proxy: noVideoProxy, now: new Date("2026-01-01T00:00:00Z") });

    expect(data.posts).toHaveLength(1);
    const post = data.posts[0];
    expect(post.id).toBe("2026-01-05");
    expect(post.status).toBe("ready");
    expect(post.networks).toEqual(["facebook", "instagram"]);
    expect(post.facebook).toBe("Five real websites in fifteen seconds. ka-performancefl.com");
    expect(post.instagram).toBe("Five real websites in fifteen seconds. Link in bio.");
    expect(post.firstComment).toBe("#GainesvilleFL #WebDesign");
    expect(post.questions).toEqual(["Pick a track"]);
    expect(post.kind).toBe("reel");
    expect(post.media.map((m) => m.role)).toEqual(["video", "thumbnail"]);
    expect(post.media[0].src).toBe("media/2026-01-05/reel-vertical.mp4");
    expect(fileMap["media/2026-01-05/reel-vertical.mp4"]).toBe(
      path.relative(root, path.join(root, "To Be Released", "2026-01-05", "media", "reel-vertical.mp4")).split(path.sep).join("/")
    );
    expect(data.builtAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("carries the youtube fields for a Short riding along with the reel", () => {
    root = makeTempRoot();
    const m = baseManifest({ status: "ready" });
    m.platforms.youtube = {
      type: "SHORT", caption: "youtube.md", title: "Press Tab on your own website", tags: ["website accessibility"],
      playlist: "Quick fixes for your website", time: "12:00"
    };
    makeDay(root, "2026-01-05", m, baseFiles({ "youtube.md": "Press Tab.\nhttps://ka-performancefl.com/?utm_source=youtube\n" }));
    const post = buildReview({ root, proxy: noVideoProxy }).data.posts[0];
    expect(post.networks).toEqual(["facebook", "instagram", "youtube"]);
    expect(post.kind).toBe("reel");
    expect(post).toMatchObject({
      youtubeTitle: "Press Tab on your own website",
      youtube: "Press Tab.\nhttps://ka-performancefl.com/?utm_source=youtube",
      youtubeType: "SHORT",
      youtubeTags: ["website accessibility"],
      youtubePlaylist: "Quick fixes for your website",
      youtubeTime: "12:00"
    });
  });

  it("gives a youtube-only folder the youtube kind, the folder's time, and a hook from the description", () => {
    root = makeTempRoot();
    const m = baseManifest({ status: "ready", time: "11:00" });
    m.platforms = { youtube: { type: "VIDEO", caption: "youtube.md", title: "Make your site accessible" } };
    const files = baseFiles({ "youtube.md": "Make it work for everyone.\nhttps://ka-performancefl.com/?utm_source=youtube\n" });
    delete files["facebook.md"]; delete files["instagram.md"];
    makeDay(root, "2026-01-05", m, files);
    const post = buildReview({ root, proxy: noVideoProxy }).data.posts[0];
    expect(post.kind).toBe("youtube");
    expect(post.hook).toBe("Make it work for everyone.");
    expect(post).toMatchObject({ youtubeType: "VIDEO", youtubeTags: [], youtubePlaylist: null, youtubeTime: "11:00" });
  });

  it("leaves the youtube fields off a post without youtube", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", baseManifest({ status: "ready" }), baseFiles());
    const post = buildReview({ root, proxy: noVideoProxy }).data.posts[0];
    for (const k of ["youtubeTitle", "youtube", "youtubeType", "youtubeTags", "youtubePlaylist", "youtubeTime"]) expect(post[k]).toBeUndefined();
  });

  it("drops approved, scheduled, published and native folders from the desk", () => {
    root = makeTempRoot();
    // review.mjs decides purely from `status` before ever reading id/date, so a
    // mismatched id/date on these (all sharing baseManifest's 2026-01-05) is fine.
    ["approved", "scheduled", "published", "native"].forEach((status, i) => {
      makeDay(root, `2026-02-0${i + 1}`, baseManifest({ status }), baseFiles());
    });
    const { data } = buildReview({ root, proxy: noVideoProxy });
    expect(data.posts).toEqual([]);
  });

  it("skips a folder without post.json and one whose name is not a day", () => {
    root = makeTempRoot();
    fs.mkdirSync(path.join(root, "To Be Released", "not-a-day"), { recursive: true });
    fs.mkdirSync(path.join(root, "To Be Released", "2026-01-06"), { recursive: true });
    const { data } = buildReview({ root, proxy: noVideoProxy });
    expect(data.posts).toEqual([]);
  });

  it("carries stories, the checklist, and asks from the K&A-only folders", () => {
    root = makeTempRoot();
    fs.mkdirSync(path.join(root, "stories"), { recursive: true });
    fs.writeFileSync(path.join(root, "stories", "README.md"), "| date | image | sticker | url |\n| - | 2026-01-06-story.png | Tap here | https://ka-performancefl.com/x |\n");
    fs.writeFileSync(path.join(root, "stories", "SCHEDULE.md"), "| Mon Jan 6, 10:35 AM | 2026-01-06-story.png | Tap here | https://ka-performancefl.com/x |\n");
    fs.writeFileSync(path.join(root, "stories", "2026-01-06-story.png"), Buffer.alloc(8));
    fs.mkdirSync(path.join(root, "review"), { recursive: true });
    fs.writeFileSync(path.join(root, "review", "asks.json"), JSON.stringify([{ id: "ask-1", title: "Pick a track" }]));

    const { data } = buildReview({ root, proxy: noVideoProxy, now: new Date("2026-01-01T00:00:00Z") });
    expect(data.stories).toHaveLength(1);
    expect(data.stories[0].id).toBe("2026-01-06-story");
    expect(data.storyChecklist).toHaveLength(1);
    expect(data.storyChecklist[0].time).toBe("10:35");
    expect(data.storiesPaused).toBe(false);
    expect(data.asks).toEqual([{ id: "ask-1", title: "Pick a track" }]);
  });

  it("marks storiesPaused and reports no stories when stories/PAUSED.md exists", () => {
    root = makeTempRoot();
    fs.mkdirSync(path.join(root, "stories"), { recursive: true });
    fs.writeFileSync(path.join(root, "stories", "PAUSED.md"), "paused");
    const { data } = buildReview({ root, proxy: noVideoProxy });
    expect(data.storiesPaused).toBe(true);
    expect(data.stories).toEqual([]);
    expect(data.storyChecklist).toEqual([]);
  });
});

describe("buildReview (client root)", () => {
  function clientManifest(overrides = {}) {
    return baseManifest({
      platforms: {
        facebook: { type: "POST", caption: "facebook.md" },
        instagram: { type: "POST", caption: "instagram.md" }
      },
      media: [{ file: "media/1.jpg", role: "image", origin: "human", alt: "Brisket plate" }],
      ...overrides
    });
  }
  function clientFiles(overrides = {}) {
    return {
      "facebook.md": "Brisket Saturday is back. https://davidsbbq.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-01-05",
      "instagram.md": "Brisket Saturday is back. Link in bio.\n\n## First comment\n\n#Gainesville #BBQ",
      "media/1.jpg": Buffer.alloc(16),
      "brief.md": "# Brief: Brisket Saturday\n\nApproved: yes\n",
      ...overrides
    };
  }

  it("has no stories folder at all, and still builds posts from facebook/instagram platforms only", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", clientManifest({ status: "ready" }), clientFiles());
    const { data } = buildReview({ root, proxy: noVideoProxy, now: new Date("2026-01-01T00:00:00Z") });

    expect(fs.existsSync(path.join(root, "stories"))).toBe(false);
    expect(data.stories).toEqual([]);
    expect(data.storyChecklist).toEqual([]);
    expect(data.storiesPaused).toBe(false);
    expect(data.asks).toEqual([]);

    expect(data.posts).toHaveLength(1);
    const post = data.posts[0];
    // "networks" is exactly the post's platforms: no manual, no linkedin - the desk
    // shows a Facebook tab and an Instagram tab, and nothing else.
    expect(post.networks).toEqual(["facebook", "instagram"]);
    expect(post.kind).toBe("post");
    expect(post.linkedin).toBe("");
  });

  it("treats a carousel of client images the same way K&A's are counted", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", clientManifest({
      status: "ready",
      media: [
        { file: "media/1.jpg", role: "image", origin: "human", alt: "Brisket plate" },
        { file: "media/2.jpg", role: "image", origin: "human", alt: "Ribs plate" }
      ]
    }), clientFiles({ "media/2.jpg": Buffer.alloc(16) }));
    const { data } = buildReview({ root, proxy: noVideoProxy });
    expect(data.posts[0].kind).toBe("carousel");
  });
});
