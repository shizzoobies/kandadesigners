import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { buildPayloads, isoWithOffset } from "../lib/payload.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

const r2 = {
  "media/reel-vertical.mp4": { key: "k1", url: "https://media.example.com/2026-01-05/aaaaaaaa-reel-vertical.mp4", sha256: "x", uploadedAt: "t" },
  "media/thumbnail.jpg": { key: "k2", url: "https://media.example.com/2026-01-05/bbbbbbbb-thumbnail.jpg", sha256: "y", uploadedAt: "t" }
};

function uploadedDay(overrides = {}, files = baseFiles()) {
  root = makeTempRoot();
  return makeDay(root, "2026-01-05", baseManifest({ status: "approved", r2, ai: { voice: true, visuals: false }, ...overrides }), files);
}

describe("payload", () => {
  it("formats the date with the New York offset", () => {
    expect(isoWithOffset("2026-09-28", "09:00", "America/New_York")).toBe("2026-09-28T09:00:00-04:00");
    expect(isoWithOffset("2026-12-15", "09:00", "America/New_York")).toBe("2026-12-15T09:00:00-05:00");
  });

  it("builds one payload per network with the right media, text, and flags", () => {
    const p = buildPayloads(uploadedDay(), { draft: true });
    expect(Object.keys(p)).toEqual(["facebook", "instagram"]);
    expect(p.facebook.date).toBe("2026-01-05T09:00:00-05:00");
    expect(p.facebook.info).toMatchObject({
      autoPublish: true, draft: true, firstCommentText: "", hasNotReadNotes: false,
      media: ["https://media.example.com/2026-01-05/aaaaaaaa-reel-vertical.mp4"],
      mediaAltText: [""],
      providers: [{ network: "facebook" }],
      publicationDate: { dateTime: "2026-01-05T09:00:00", timezone: "America/New_York" },
      shortener: false, smartLinkData: { ids: [] },
      text: "Five real websites in fifteen seconds. ka-performancefl.com",
      videoThumbnailUrl: "https://media.example.com/2026-01-05/bbbbbbbb-thumbnail.jpg",
      facebookData: { type: "REEL" }
    });
    expect(p.facebook.info.instagramData).toBeUndefined();
    expect(p.instagram.info).toMatchObject({
      text: "Five real websites in fifteen seconds. Link in bio.",
      firstCommentText: "#GainesvilleFL #WebDesign",
      providers: [{ network: "instagram" }],
      instagramData: { type: "REEL", isAiGenerated: true }
    });
    expect(p.instagram.info.facebookData).toBeUndefined();
  });

  it("skips manual networks and the thumbnail when the type does not take one", () => {
    const m = baseManifest({ status: "approved", r2 });
    m.platforms = { facebook: { type: "STORY", caption: "facebook.md" }, linkedin: { manual: true, caption: "linkedin.md" } };
    const files = baseFiles(); delete files["facebook.md"];
    const p = buildPayloads(uploadedDay(m, files));
    expect(Object.keys(p)).toEqual(["facebook"]);
    expect(p.facebook.info.text).toBeUndefined();
    expect(p.facebook.info.firstCommentText).toBeUndefined();
    expect(p.facebook.info.videoThumbnailUrl).toBeUndefined();
    expect(p.facebook.info.facebookData).toEqual({ type: "STORY" });
  });

  it("sends each network only the media that names it", () => {
    const m = baseManifest({ status: "approved", ai: { voice: false, visuals: false } });
    m.platforms = { facebook: { type: "POST", caption: "facebook.md" }, instagram: { type: "POST", caption: "instagram.md" } };
    m.media = [
      { file: "media/slideshow.mp4", role: "video", origin: "kap-reel", alt: "", platforms: ["facebook"] },
      { file: "media/slideshow-cover.jpg", role: "thumbnail", origin: "kap-reel", alt: "Cover", platforms: ["facebook"] },
      { file: "media/slide-01.jpg", role: "image", origin: "kap-reel", alt: "Slide one", platforms: ["instagram"] },
      { file: "media/slide-02.jpg", role: "image", origin: "kap-reel", alt: "Slide two", platforms: ["instagram"] }
    ];
    m.r2 = Object.fromEntries(m.media.map((e) => [e.file, { key: e.file, url: `https://media.example.com/${e.file}` }]));
    const p = buildPayloads(uploadedDay(m));
    expect(p.facebook.info.media).toEqual(["https://media.example.com/media/slideshow.mp4"]);
    expect(p.facebook.info.videoThumbnailUrl).toBe("https://media.example.com/media/slideshow-cover.jpg");
    expect(p.instagram.info.media).toEqual(["https://media.example.com/media/slide-01.jpg", "https://media.example.com/media/slide-02.jpg"]);
    expect(p.instagram.info.mediaAltText).toEqual(["Slide one", "Slide two"]);
    expect(p.instagram.info.videoThumbnailUrl).toBeUndefined();
  });

  it("builds linkedin posts and documents with the first comment split off", () => {
    const m = baseManifest({ status: "approved", title: "Six questions" });
    m.platforms = { linkedin: { type: "DOCUMENT", caption: "linkedin.md", documentTitle: "6 questions before you hire a web designer" } };
    m.media = [
      { file: "media/slide-01.jpg", role: "image", origin: "kap-reel", alt: "One" },
      { file: "media/slide-02.jpg", role: "image", origin: "kap-reel", alt: "Two" }
    ];
    m.r2 = Object.fromEntries(m.media.map((e) => [e.file, { key: e.file, url: `https://media.example.com/${e.file}` }]));
    const files = baseFiles({ "linkedin.md": "A founder's note.\n\n## First comment\n\nhttps://ka-performancefl.com/?utm_source=linkedin\n" });
    const p = buildPayloads(uploadedDay(m, files));
    expect(p.linkedin.info).toMatchObject({
      text: "A founder's note.",
      firstCommentText: "https://ka-performancefl.com/?utm_source=linkedin",
      media: ["https://media.example.com/media/slide-01.jpg", "https://media.example.com/media/slide-02.jpg"],
      providers: [{ network: "linkedin" }],
      linkedinData: { type: "post", documentTitle: "6 questions before you hire a web designer", publishImagesAsPDF: true, previewIncluded: true }
    });

    m.platforms = { linkedin: { type: "POST", caption: "linkedin.md" } };
    const post = buildPayloads(uploadedDay(m, files));
    expect(post.linkedin.info.linkedinData).toEqual({ type: "post", previewIncluded: true });
  });

  it("fails clearly when a url is missing", () => {
    expect(() => buildPayloads(uploadedDay({ r2: {} }))).toThrow("media/reel-vertical.mp4 has no R2 url; run upload first");
  });
});
