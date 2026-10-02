import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { prepareRelease, recordRelease, recordError, promotePackets, recordPromotion, studioChecklist, recordStudioDone } from "../lib/release.mjs";
import { readManifest } from "../lib/manifest.mjs";

const r2 = {
  "media/reel-vertical.mp4": { key: "k1", url: "https://media.example.com/a.mp4", sha256: "x", uploadedAt: "t" },
  "media/thumbnail.jpg": { key: "k2", url: "https://media.example.com/b.jpg", sha256: "y", uploadedAt: "t" }
};
const early = new Date("2025-01-01T00:00:00Z");
let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

function uploadedDay(overrides = {}) {
  root = makeTempRoot();
  return makeDay(root, "2026-01-05", baseManifest({ status: "approved", r2, ...overrides }), baseFiles());
}

describe("release", () => {
  it("writes payloads and returns a packet per network", () => {
    const dir = uploadedDay();
    const r = prepareRelease(dir, { draft: true, now: early });
    expect(r.packets.map((p) => p.network)).toEqual(["facebook", "instagram"]);
    expect(r.packets[0]).toMatchObject({ folder: "2026-01-05", network: "facebook", date: "2026-01-05T09:00:00-05:00" });
    expect(r.packets[0].info.draft).toBe(true);
    const m = readManifest(dir);
    expect(m.metricool.facebook.payload.info.providers).toEqual([{ network: "facebook" }]);
    expect(m.metricool.instagram.draft).toBe(true);
    expect(m.status).toBe("approved");
  });

  it("skips folders that are not approved or not uploaded", () => {
    expect(prepareRelease(uploadedDay({ status: "ready" }), { now: early }).skipped).toBe("status ready");
    expect(prepareRelease(uploadedDay({ r2: {} }), { now: early }).skipped).toBe("media not uploaded");
  });

  it("records ids per network and schedules once every network is recorded", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { now: early });
    const now = new Date("2025-12-01T10:00:00Z");
    let r = recordRelease(dir, { network: "facebook", id: "111", uuid: "u-111", now });
    expect(r.status).toBe("approved");
    expect(readManifest(dir).metricool.facebook).toMatchObject({ id: "111", uuid: "u-111", scheduledAt: "2025-12-01T10:00:00.000Z" });
    r = recordRelease(dir, { network: "instagram", id: "222", uuid: "u-222", now });
    expect(r.status).toBe("scheduled");
    expect(readManifest(dir).status).toBe("scheduled");
    expect(prepareRelease(dir, { now: early }).skipped).toBe("status scheduled");
  });

  it("returns packets only for networks still without an id", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { now: early });
    recordRelease(dir, { network: "facebook", id: "111", uuid: "u-111" });
    const r = prepareRelease(dir, { now: early });
    expect(r.packets.map((p) => p.network)).toEqual(["instagram"]);
  });

  it("refuses to record a network with no prepared payload", () => {
    const dir = uploadedDay();
    expect(() => recordRelease(dir, { network: "facebook", id: "1", uuid: "u" })).toThrow(/no prepared payload/);
  });

  it("leaves a recorded network's stored payload alone on a rerun", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { draft: true, now: early });
    recordRelease(dir, { network: "facebook", id: "111", uuid: "u-111" });
    prepareRelease(dir, { draft: false, now: early });
    const m = readManifest(dir);
    expect(m.metricool.facebook.draft).toBe(true);
    expect(m.metricool.facebook.payload.info.draft).toBe(true);
    expect(m.metricool.instagram.draft).toBe(false);
  });

  it("dry run returns packets without writing", () => {
    const dir = uploadedDay();
    const r = prepareRelease(dir, { draft: true, now: early, dryRun: true });
    expect(r.packets.map((p) => p.network)).toEqual(["facebook", "instagram"]);
    expect(readManifest(dir).metricool).toEqual({});
  });

  it("stamps preparedAt and reports an earlier one on a rerun", () => {
    const dir = uploadedDay();
    const first = prepareRelease(dir, { now: early });
    expect(first.repeated).toEqual([]);
    expect(readManifest(dir).metricool.facebook.preparedAt).toBe("2025-01-01T00:00:00.000Z");
    const later = new Date("2025-01-02T00:00:00Z");
    const again = prepareRelease(dir, { now: later });
    expect(again.repeated).toEqual([
      { network: "facebook", preparedAt: "2025-01-01T00:00:00.000Z" },
      { network: "instagram", preparedAt: "2025-01-01T00:00:00.000Z" }
    ]);
    expect(readManifest(dir).metricool.instagram.preparedAt).toBe("2025-01-02T00:00:00.000Z");
  });

  it("refuses to record on a status other than approved or scheduled", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { now: early });
    const m = readManifest(dir);
    m.status = "published";
    fs.writeFileSync(`${dir}/post.json`, JSON.stringify(m));
    expect(() => recordRelease(dir, { network: "facebook", id: "1", uuid: "u" })).toThrow("2026-01-05: cannot record on status published");
  });

  it("records a rejection in lastError and changes nothing else", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { now: early });
    const before = readManifest(dir);
    recordError(dir, { network: "instagram", message: "VIDEO_THUMBNAIL_NOT_APPLICABLE" });
    const after = readManifest(dir);
    expect(after.lastError).toBe("instagram: VIDEO_THUMBNAIL_NOT_APPLICABLE");
    expect({ ...after, lastError: null }).toEqual(before);
  });

  it("builds promotion packets for draft networks with draft false", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { draft: true, now: early });
    expect(() => promotePackets(dir)).toThrow(/cannot promote on status approved/);
    recordRelease(dir, { network: "facebook", id: "111", uuid: "u-111" });
    recordRelease(dir, { network: "instagram", id: "222", uuid: "u-222" });
    const r = promotePackets(dir);
    expect(r.packets.map((p) => [p.network, p.id, p.uuid])).toEqual([["facebook", "111", "u-111"], ["instagram", "222", "u-222"]]);
    expect(r.packets[0]).toMatchObject({ folder: "2026-01-05", date: "2026-01-05T09:00:00-05:00" });
    expect(r.packets.every((p) => p.info.draft === false)).toBe(true);
    expect(readManifest(dir).metricool.facebook.payload.info.draft).toBe(true);
  });

  it("returns the Studio checklist when it prepares a youtube packet", () => {
    const yt = { verified: false, playlists: ["Quick fixes for your website"] };
    const probe = () => ({ width: 1080, height: 1920, duration: 30, size: 1024 });
    const m = baseManifest({ status: "approved", r2 });
    m.platforms.youtube = { type: "SHORT", caption: "youtube.md", title: "Press Tab", playlist: "Quick fixes for your website", time: "12:00" };
    root = makeTempRoot();
    const dir = makeDay(root, "2026-01-05", m, baseFiles({ "youtube.md": "Hook.\nhttps://ka-performancefl.com/?utm_source=youtube\n" }));
    const r = prepareRelease(dir, { now: early, probe, youtube: yt });
    expect(r.packets.map((p) => p.network)).toEqual(["facebook", "instagram", "youtube"]);
    expect(r.studio).toEqual([
      'add it to the playlist "Quick fixes for your website"',
      "add the end screen: subscribe plus the latest video"
    ]);
    // Nothing left to prepare for youtube: no checklist on the rerun.
    recordRelease(dir, { network: "youtube", id: "3", uuid: "u-3" });
    expect(prepareRelease(dir, { now: early, probe, youtube: yt }).studio).toEqual([]);
  });

  it("lists captions for a youtube VIDEO and asks for a playlist when none is set", () => {
    const m = baseManifest({ status: "approved" });
    m.platforms = { youtube: { type: "VIDEO", caption: "youtube.md", title: "Long one" } };
    m.media = [
      { file: "media/video.mp4", role: "video", origin: "kap-reel", alt: "" },
      { file: "media/thumbnail.jpg", role: "thumbnail", origin: "kap-reel", alt: "A laptop" },
      { file: "media/video.srt", role: "captions", origin: "kap-reel" }
    ];
    expect(studioChecklist(m, { verified: true, playlists: [] })).toEqual([
      "add it to a playlist (post.json names none)",
      "upload media/video.srt as English captions",
      "add the end screen: subscribe plus the latest video"
    ]);
    // An unverified channel cannot take the thumbnail through Metricool: it goes up in Studio.
    expect(studioChecklist(m, { verified: false, playlists: [] })).toEqual([
      "add it to a playlist (post.json names none)",
      "upload media/video.srt as English captions",
      "upload media/thumbnail.jpg as the custom thumbnail",
      "add the end screen: subscribe plus the latest video"
    ]);
    expect(studioChecklist(baseManifest(), { verified: false, playlists: [] })).toEqual([]);
  });

  it("sends an unverified channel's VIDEO without the thumbnail and lists it for Studio", () => {
    const m = baseManifest({ status: "approved", time: "11:00" });
    m.platforms = { youtube: { type: "VIDEO", caption: "youtube.md", title: "Long one", playlist: "Quick fixes for your website" } };
    m.media = [
      { file: "media/video.mp4", role: "video", origin: "kap-reel", alt: "" },
      { file: "media/thumbnail.jpg", role: "thumbnail", origin: "kap-reel", alt: "A laptop" }
    ];
    m.r2 = { "media/video.mp4": { url: "https://media.example.com/v.mp4" }, "media/thumbnail.jpg": { url: "https://media.example.com/t.jpg" } };
    root = makeTempRoot();
    const dir = makeDay(root, "2026-01-05", m, baseFiles({
      "youtube.md": "Hook.\nhttps://ka-performancefl.com/?utm_source=youtube\n", "media/video.mp4": Buffer.alloc(8)
    }));
    const probe = (file) => file.endsWith(".mp4") ? { width: 1920, height: 1080, duration: 300, size: 1024 } : { width: 1920, height: 1080, duration: 0, size: 1024 };
    const yt = { verified: false, playlists: ["Quick fixes for your website"] };
    const r = prepareRelease(dir, { now: early, probe, youtube: yt, dryRun: true });
    expect(r.packets[0].info.videoThumbnailUrl).toBeUndefined();
    expect(r.studio).toContain("upload media/thumbnail.jpg as the custom thumbnail");
    const verified = prepareRelease(dir, { now: early, probe, youtube: { ...yt, verified: true }, dryRun: true });
    expect(verified.packets[0].info.videoThumbnailUrl).toBe("https://media.example.com/t.jpg");
    expect(verified.studio).not.toContain("upload media/thumbnail.jpg as the custom thumbnail");
  });

  it("resends a later youtube Short after the reel's own time has passed", () => {
    const yt = { verified: false, playlists: [] };
    const probe = () => ({ width: 1080, height: 1920, duration: 30, size: 1024 });
    const m = baseManifest({ status: "approved", time: "10:30", r2 });
    m.platforms.youtube = { type: "SHORT", caption: "youtube.md", title: "Press Tab", time: "12:00" };
    root = makeTempRoot();
    const dir = makeDay(root, "2026-01-05", m, baseFiles({ "youtube.md": "Hook.\nhttps://ka-performancefl.com/?utm_source=youtube\n" }));
    prepareRelease(dir, { now: early, probe, youtube: yt });
    recordRelease(dir, { network: "facebook", id: "1", uuid: "u-1" });
    recordRelease(dir, { network: "instagram", id: "2", uuid: "u-2" });
    // 15:45Z is 10:45 in New York: past the reel, before the Short.
    const r = prepareRelease(dir, { now: new Date("2026-01-05T15:45:00Z"), probe, youtube: yt });
    expect(r.skipped).toBeUndefined();
    expect(r.packets.map((p) => p.network)).toEqual(["youtube"]);
  });

  it("stamps studioDoneAt on the youtube record, in either bucket", () => {
    const m = baseManifest({ status: "published", metricool: { youtube: { id: "3", uuid: "u-3" } } });
    root = makeTempRoot();
    const dir = makeDay(root, "2026-01-05", m, {}, "Already Released");
    const now = new Date("2026-01-06T10:00:00Z");
    expect(recordStudioDone(dir, { now })).toEqual({ name: "2026-01-05" });
    expect(readManifest(dir).metricool.youtube).toEqual({ id: "3", uuid: "u-3", studioDoneAt: "2026-01-06T10:00:00.000Z" });
    const noYoutube = makeDay(root, "2026-01-06", baseManifest({ id: "2026-01-06", date: "2026-01-06" }), {});
    expect(() => recordStudioDone(noYoutube)).toThrow("2026-01-06: youtube has no Metricool record");
  });

  it("records a promotion: draft off, new id, same uuid", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { draft: true, now: early });
    recordRelease(dir, { network: "facebook", id: "111", uuid: "u-111" });
    recordRelease(dir, { network: "instagram", id: "222", uuid: "u-222" });
    const now = new Date("2025-12-02T10:00:00Z");
    recordPromotion(dir, { network: "facebook", id: 333, now });
    const rec = readManifest(dir).metricool.facebook;
    expect(rec).toMatchObject({ draft: false, id: "333", uuid: "u-111", promotedAt: "2025-12-02T10:00:00.000Z" });
    expect(promotePackets(dir).packets.map((p) => p.network)).toEqual(["instagram"]);
    expect(() => recordPromotion(dir, { network: "facebook", id: "444" })).toThrow(/facebook is not a draft/);
  });

  it("records a manual-audio instagram release with manualAudio true, and refuses it on another network", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { now: early });
    expect(() => recordRelease(dir, { network: "facebook", id: "111", uuid: "u-111", manualAudio: true })).toThrow("2026-01-05: --manual-audio is for instagram only");
    recordRelease(dir, { network: "facebook", id: "111", uuid: "u-111" });
    prepareRelease(dir, { now: early, autoPublish: false });
    const r = recordRelease(dir, { network: "instagram", id: "222", uuid: "u-222", manualAudio: true });
    expect(r.status).toBe("scheduled");
    const m = readManifest(dir);
    expect(m.metricool.instagram).toMatchObject({ id: "222", uuid: "u-222", manualAudio: true });
    expect("manualAudio" in m.metricool.facebook).toBe(false);
  });

  it("refuses --manual-audio that does not match the packet that was sent, either way", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { now: early });
    expect(() => recordRelease(dir, { network: "instagram", id: "2", uuid: "u-2", manualAudio: true })).toThrow("2026-01-05: --manual-audio does not match the packet that was sent");
    prepareRelease(dir, { now: early, autoPublish: false });
    expect(() => recordRelease(dir, { network: "instagram", id: "2", uuid: "u-2" })).toThrow("2026-01-05: --manual-audio does not match the packet that was sent");
    expect(readManifest(dir).metricool.instagram.id).toBeUndefined();
  });

  it("clears a stale manualAudio when a network is recorded again without it", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { now: early });
    const m = readManifest(dir);
    m.metricool.instagram.manualAudio = true;
    fs.writeFileSync(`${dir}/post.json`, JSON.stringify(m));
    recordRelease(dir, { network: "instagram", id: "2", uuid: "u-2" });
    expect("manualAudio" in readManifest(dir).metricool.instagram).toBe(false);
  });
});

describe("release instagram audio", () => {
  const withAudio = (audio) => {
    const m = baseManifest({ status: "approved", r2 });
    m.platforms.instagram = { type: "REEL", caption: "instagram.md", audio };
    return m;
  };
  const audioDay = (audio) => { root = makeTempRoot(); return makeDay(root, "2026-01-05", withAudio(audio), baseFiles()); };
  const plainFacebook = () => {
    const packets = prepareRelease(uploadedDay(), { now: early, dryRun: true }).packets;
    fs.rmSync(root, { recursive: true, force: true });
    return packets.find((p) => p.network === "facebook");
  };

  it("carries audioConfiguration on the instagram packet, shaped exactly, with videoVolume 0 by default", () => {
    const facebook = plainFacebook();
    const dir = audioDay({ term: "Espresso Sabrina Carpenter" });
    const r = prepareRelease(dir, { now: early });
    const ig = r.packets.find((p) => p.network === "instagram");
    expect(ig.info.instagramData).toEqual({
      type: "REEL", isAiGenerated: false,
      audioConfiguration: { audioId: "Espresso Sabrina Carpenter", videoVolume: 0 }
    });
    expect(Object.keys(ig.info.instagramData.audioConfiguration)).toEqual(["audioId", "videoVolume"]);
    expect(ig.info.autoPublish).toBe(true);
    // Facebook's packet is exactly what it is without audio.
    expect(r.packets.find((p) => p.network === "facebook")).toEqual(facebook);
    expect(readManifest(dir).metricool.instagram.payload.info.instagramData.audioConfiguration).toEqual({ audioId: "Espresso Sabrina Carpenter", videoVolume: 0 });
  });

  it("sends an id as a string with both volumes as given, and never the catalog fields", () => {
    const r = prepareRelease(audioDay({ id: 1234567890, audioVolume: 40, videoVolume: 100 }), { now: early, dryRun: true });
    const conf = r.packets.find((p) => p.network === "instagram").info.instagramData.audioConfiguration;
    expect(conf).toEqual({ audioId: "1234567890", videoVolume: 100, audioVolume: 40 });
    for (const k of ["audioType", "title", "displayArtist", "igUsername", "coverArtworkUrl", "durationMs"]) expect(conf[k]).toBeUndefined();
  });

  it("leaves audioConfiguration off when there is no audio", () => {
    const r = prepareRelease(uploadedDay(), { now: early, dryRun: true });
    expect(r.packets.find((p) => p.network === "instagram").info.instagramData).toEqual({ type: "REEL", isAiGenerated: false });
  });

  it("with autoPublish off, prepares only the instagram packet, for the Metricool app, with no audioConfiguration", () => {
    const dir = audioDay({ term: "Espresso" });
    const r = prepareRelease(dir, { now: early, autoPublish: false });
    expect(r.packets.map((p) => p.network)).toEqual(["instagram"]);
    expect(r.packets[0].info.autoPublish).toBe(false);
    expect(r.packets[0].info.instagramData).toEqual({ type: "REEL", isAiGenerated: false });
    expect(r.sound).toBe("Espresso");
    const m = readManifest(dir);
    expect(m.metricool.instagram.payload.info.autoPublish).toBe(false);
    expect(m.metricool.facebook).toBeUndefined();
  });

  it("with autoPublish off, honors dry run and draft", () => {
    const dir = audioDay({ id: "123" });
    const dry = prepareRelease(dir, { now: early, autoPublish: false, dryRun: true });
    expect(dry.packets.map((p) => [p.network, p.info.autoPublish])).toEqual([["instagram", false]]);
    expect(readManifest(dir).metricool).toEqual({});
    const draft = prepareRelease(dir, { now: early, autoPublish: false, draft: true });
    expect(draft.packets.map((p) => [p.network, p.info.autoPublish, p.info.draft])).toEqual([["instagram", false, true]]);
    expect(readManifest(dir).metricool.instagram.draft).toBe(true);
  });

  it("with autoPublish off, needs an Instagram REEL that is not recorded yet", () => {
    const noIg = baseManifest({ status: "approved", r2 });
    delete noIg.platforms.instagram;
    root = makeTempRoot();
    const dir = makeDay(root, "2026-01-05", noIg, baseFiles());
    const msg = "2026-01-05: --auto-publish off needs an Instagram REEL that is not recorded yet";
    expect(() => prepareRelease(dir, { now: early, autoPublish: false })).toThrow(msg);
    fs.rmSync(root, { recursive: true, force: true });
    const recorded = audioDay({ term: "Espresso" });
    prepareRelease(recorded, { now: early });
    recordRelease(recorded, { network: "instagram", id: "2", uuid: "u-2" });
    expect(() => prepareRelease(recorded, { now: early, autoPublish: false })).toThrow(msg);
  });
});
