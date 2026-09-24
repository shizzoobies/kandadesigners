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

  it("fails clearly when a url is missing", () => {
    expect(() => buildPayloads(uploadedDay({ r2: {} }))).toThrow("media/reel-vertical.mp4 has no R2 url; run upload first");
  });
});
