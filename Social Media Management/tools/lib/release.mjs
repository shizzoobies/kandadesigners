import path from "node:path";
import { readManifest, writeManifest, assertTransition, mediaFor } from "./manifest.mjs";
import { validateFolder, probeMedia, readYoutubeConfig } from "./validate.mjs";
import { buildPayloads } from "./payload.mjs";
import { UPLOAD_ROLES } from "./upload.mjs";

function activeNetworks(m) {
  return Object.entries(m.platforms).filter(([, cfg]) => !cfg.manual).map(([n]) => n);
}

/**
 * What Metricool cannot do for a youtube post, finished by hand in Studio after it publishes, or [] without youtube.
 * Marked done with release --studio-done, which writes metricool.youtube.studioDoneAt. youtube is the channel config:
 * until the channel is verified, a VIDEO's thumbnail is not sent through Metricool and goes up here instead.
 */
export function studioChecklist(m, youtube = readYoutubeConfig()) {
  const cfg = m.platforms && m.platforms.youtube;
  if (!cfg || cfg.manual) return [];
  const out = [cfg.playlist ? `add it to the playlist "${cfg.playlist}"` : "add it to a playlist (post.json names none)"];
  if (cfg.type === "VIDEO") {
    const mine = (role) => (m.media || []).find((e) => e.role === role && mediaFor(e, "youtube"));
    const srt = mine("captions");
    out.push(`upload ${srt ? srt.file : "media/video.srt"} as English captions`);
    if (!youtube.verified) {
      const thumb = mine("thumbnail");
      out.push(`upload ${thumb ? thumb.file : "media/thumbnail.jpg"} as the custom thumbnail`);
    }
  }
  out.push("add the end screen: subscribe plus the latest video");
  return out;
}

/**
 * Build and store the Metricool payloads for one approved, uploaded folder. Returns the packets Claude still has to send.
 * repeated lists networks that were prepared before, with the earlier preparedAt, so a resend can be checked first.
 * studio is the after-publish Studio checklist when a youtube packet is among them. probe goes to validateFolder;
 * youtube (the channel config, readYoutubeConfig by default) goes to validateFolder, buildPayloads and the checklist.
 */
export function prepareRelease(dir, { draft = false, now = new Date(), dryRun = false, probe = probeMedia, youtube = null } = {}) {
  const name = path.basename(dir);
  youtube = youtube || readYoutubeConfig();
  const problems = validateFolder(dir, { now, probe, youtube });
  if (problems.length) return { name, skipped: "invalid", problems, packets: [], repeated: [] };
  const m = readManifest(dir);
  if (m.status !== "approved") return { name, skipped: `status ${m.status}`, packets: [], repeated: [] };
  const r2 = m.r2 || {};
  const missing = m.media.filter((e) => UPLOAD_ROLES.has(e.role) && !(r2[e.file] && r2[e.file].url));
  if (missing.length) return { name, skipped: "media not uploaded", packets: [], repeated: [] };

  const payloads = buildPayloads(dir, { draft, youtube });
  m.metricool = m.metricool || {};
  const packets = [];
  const repeated = [];
  for (const network of activeNetworks(m)) {
    const existing = m.metricool[network] || {};
    if (!existing.id) {
      if (existing.preparedAt) repeated.push({ network, preparedAt: existing.preparedAt });
      m.metricool[network] = { ...existing, payload: payloads[network], draft, preparedAt: now.toISOString() };
      packets.push({ folder: name, network, ...payloads[network] });
    }
  }
  const studio = packets.some((p) => p.network === "youtube") ? studioChecklist(m, youtube) : [];
  if (dryRun) return { name, packets, repeated, studio };
  m.lastError = null;
  writeManifest(dir, m);
  return { name, packets, repeated, studio };
}

/** Mark the youtube Studio checklist done: metricool.youtube.studioDoneAt, beside the record it belongs to. */
export function recordStudioDone(dir, { now = new Date() } = {}) {
  const name = path.basename(dir);
  const m = readManifest(dir);
  const rec = m.metricool && m.metricool.youtube;
  if (!rec) throw new Error(`${name}: youtube has no Metricool record`);
  m.metricool.youtube = { ...rec, studioDoneAt: now.toISOString() };
  writeManifest(dir, m);
  return { name };
}

/** Write the Metricool id and uuid Claude got back for one network. Schedules the folder once every network has one. */
export function recordRelease(dir, { network, id, uuid, now = new Date() }) {
  const name = path.basename(dir);
  const m = readManifest(dir);
  if (m.status !== "approved" && m.status !== "scheduled") throw new Error(`${name}: cannot record on status ${m.status}`);
  const rec = m.metricool && m.metricool[network];
  if (!rec || !rec.payload) throw new Error(`${name}: ${network} has no prepared payload; run release first`);
  m.metricool[network] = { ...rec, id: String(id), uuid: String(uuid), scheduledAt: now.toISOString() };
  const done = activeNetworks(m).every((n) => m.metricool[n] && m.metricool[n].id);
  if (done && m.status !== "scheduled") {
    assertTransition(m.status, "scheduled");
    m.status = "scheduled";
  }
  m.lastError = null;
  writeManifest(dir, m);
  return { name, status: m.status };
}

/** Write a Metricool rejection for one network into lastError. Changes nothing else. */
export function recordError(dir, { network, message }) {
  const name = path.basename(dir);
  const m = readManifest(dir);
  m.lastError = `${network}: ${message}`;
  writeManifest(dir, m);
  return { name };
}

/** The updateScheduledPost packets that turn a scheduled folder's drafts into real posts. Reads only. */
export function promotePackets(dir) {
  const name = path.basename(dir);
  const m = readManifest(dir);
  if (m.status !== "scheduled") throw new Error(`${name}: cannot promote on status ${m.status}`);
  const packets = [];
  for (const [network, rec] of Object.entries(m.metricool || {})) {
    if (!rec || rec.draft !== true || !rec.id) continue;
    const payload = rec.payload || {};
    packets.push({ folder: name, network, id: rec.id, uuid: rec.uuid, date: payload.date, info: { ...payload.info, draft: false } });
  }
  return { name, packets };
}

/** Record a promoted draft: Metricool gave the post a new id and kept its uuid. */
export function recordPromotion(dir, { network, id, now = new Date() }) {
  const name = path.basename(dir);
  const m = readManifest(dir);
  const rec = m.metricool && m.metricool[network];
  if (!rec) throw new Error(`${name}: ${network} has no Metricool record`);
  if (rec.draft !== true) throw new Error(`${name}: ${network} is not a draft`);
  m.metricool[network] = { ...rec, draft: false, id: String(id), promotedAt: now.toISOString() };
  m.lastError = null;
  writeManifest(dir, m);
  return { name };
}
