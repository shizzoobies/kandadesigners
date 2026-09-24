import { readManifest } from "./manifest.mjs";
import { readCaption, splitInstagram } from "./captions.mjs";
import { localToUtc } from "./validate.mjs";

/** Network and type pairs where Metricool accepts a custom video cover. */
const THUMB_TYPES = { facebook: ["POST", "REEL"], instagram: ["REEL", "TRIAL_REEL"] };

/** Local wall time as ISO 8601 with the zone's offset, the format Metricool's date parameter wants. */
export function isoWithOffset(date, time, timezone) {
  const utc = localToUtc(date, time, timezone);
  const asIfUtc = new Date(`${date}T${time}:00Z`);
  const offsetMin = Math.round((asIfUtc - utc) / 60000);
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${date}T${time}:00${sign}${hh}:${mm}`;
}

/** One Metricool createScheduledPost payload per non-manual network. Pure: reads the folder, calls nothing. */
export function buildPayloads(dir, { draft = false } = {}) {
  const m = readManifest(dir);
  const r2 = m.r2 || {};
  const urlOf = (entry) => {
    const rec = r2[entry.file];
    if (!rec || !rec.url) throw new Error(`${entry.file} has no R2 url; run upload first`);
    return rec.url;
  };
  const shown = m.media.filter((e) => e.role === "video" || e.role === "image");
  const thumb = m.media.find((e) => e.role === "thumbnail");
  const media = shown.map(urlOf);
  const mediaAltText = shown.map((e) => e.alt || "");
  const hasVideo = shown.some((e) => e.role === "video");
  const aiFlag = Boolean(m.ai && (m.ai.voice || m.ai.visuals));

  const out = {};
  for (const [network, cfg] of Object.entries(m.platforms)) {
    if (cfg.manual) continue;
    const type = cfg.type || "POST";
    const raw = cfg.caption ? readCaption(dir, cfg.caption) || "" : "";
    let text = raw;
    let firstCommentText = "";
    if (network === "instagram") ({ caption: text, firstComment: firstCommentText } = splitInstagram(raw));

    const info = {
      autoPublish: true,
      descendants: [],
      draft,
      firstCommentText,
      hasNotReadNotes: false,
      media,
      mediaAltText,
      providers: [{ network }],
      publicationDate: { dateTime: `${m.date}T${m.time}:00`, timezone: m.timezone },
      shortener: false,
      smartLinkData: { ids: [] },
      text
    };
    if (type === "STORY") { delete info.text; delete info.firstCommentText; }
    if (hasVideo && thumb && THUMB_TYPES[network].includes(type)) info.videoThumbnailUrl = urlOf(thumb);
    if (network === "facebook") info.facebookData = { type };
    if (network === "instagram") info.instagramData = { type, isAiGenerated: aiFlag };
    out[network] = { date: isoWithOffset(m.date, m.time, m.timezone), info };
  }
  return out;
}
