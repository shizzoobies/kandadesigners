import { readManifest, mediaFor } from "./manifest.mjs";
import { readCaption, splitInstagram } from "./captions.mjs";
import { localToUtc, readYoutubeConfig } from "./validate.mjs";

/**
 * Network and type pairs where Metricool accepts a custom video cover. Not a
 * youtube SHORT yet: its cover needs Shorts thumbnails enabled on the channel,
 * and Metricool rejects the whole request when it does not apply.
 */
const THUMB_TYPES = { facebook: ["POST", "REEL"], instagram: ["REEL", "TRIAL_REEL"], linkedin: ["POST"], youtube: ["VIDEO"] };

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

/**
 * Metricool's instagramData.audioConfiguration for platforms.instagram.audio: audioId is the numeric id or the
 * search term, videoVolume defaults to 0 (our own bed would play under the sound), audioVolume only when given.
 * Never the catalog fields (audioType, title, displayArtist, igUsername, coverArtworkUrl, durationMs).
 */
function audioConfiguration(audio) {
  const conf = { audioId: audio.id !== undefined ? String(audio.id) : audio.term.trim(), videoVolume: audio.videoVolume ?? 0 };
  if (audio.audioVolume !== undefined) conf.audioVolume = audio.audioVolume;
  return conf;
}

/**
 * One Metricool createScheduledPost payload per non-manual network. Pure: reads the folder, calls nothing.
 * autoPublish false turns it off on the instagram payload only, for a sound added by hand in the Metricool app.
 */
export function buildPayloads(dir, { draft = false, youtube = null, autoPublish = true } = {}) {
  const m = readManifest(dir);
  const r2 = m.r2 || {};
  const urlOf = (entry) => {
    const rec = r2[entry.file];
    if (!rec || !rec.url) throw new Error(`${entry.file} has no R2 url; run upload first`);
    return rec.url;
  };
  const aiFlag = Boolean(m.ai && (m.ai.voice || m.ai.visuals));

  const out = {};
  for (const [network, cfg] of Object.entries(m.platforms)) {
    if (cfg.manual) continue;
    const mine = m.media.filter((e) => mediaFor(e, network));
    const shown = mine.filter((e) => e.role === "video" || e.role === "image");
    const thumb = mine.find((e) => e.role === "thumbnail");
    const media = shown.map(urlOf);
    const mediaAltText = shown.map((e) => e.alt || "");
    const hasVideo = shown.some((e) => e.role === "video");
    const type = cfg.type || "POST";
    const raw = cfg.caption ? readCaption(dir, cfg.caption) || "" : "";
    let text = raw;
    let firstCommentText = "";
    if (network === "instagram" || network === "linkedin") ({ caption: text, firstComment: firstCommentText } = splitInstagram(raw));
    // A network's own time (the YouTube Short after the reel) overrides the folder's.
    const time = cfg.time || m.time;

    const info = {
      autoPublish: true,
      descendants: [],
      draft,
      firstCommentText,
      hasNotReadNotes: false,
      media,
      mediaAltText,
      providers: [{ network }],
      publicationDate: { dateTime: `${m.date}T${time}:00`, timezone: m.timezone },
      shortener: false,
      smartLinkData: { ids: [] },
      text
    };
    if (type === "STORY") { delete info.text; delete info.firstCommentText; }
    // YouTube custom thumbnails need a verified channel (youtube is the config from readYoutubeConfig).
    const thumbAllowed = network !== "youtube" || (youtube || (youtube = readYoutubeConfig())).verified === true;
    if (hasVideo && thumb && thumbAllowed && (THUMB_TYPES[network] || []).includes(type)) info.videoThumbnailUrl = urlOf(thumb);
    if (network === "facebook") info.facebookData = { type };
    if (network === "instagram") {
      info.instagramData = { type, isAiGenerated: aiFlag };
      // With autoPublish off a person adds the sound natively in the Metricool app, so none is sent.
      if (!autoPublish) info.autoPublish = false;
      else if (cfg.audio && type === "REEL") info.instagramData.audioConfiguration = audioConfiguration(cfg.audio);
    }
    if (network === "linkedin") {
      info.linkedinData = type === "DOCUMENT"
        ? { type: "post", documentTitle: cfg.documentTitle || m.title, publishImagesAsPDF: true, previewIncluded: true }
        : { type: "post", previewIncluded: true };
    }
    if (network === "youtube") {
      // Nothing K&A makes is for children. notifySubscribers is left out so YouTube's default (notify) applies.
      info.youtubeData = {
        title: cfg.title.trim(),
        type: type.toLowerCase(),
        privacy: "public",
        tags: cfg.tags || [],
        category: cfg.category || "HOWTO_STYLE",
        madeForKids: false,
        isAiGeneratedContent: aiFlag
      };
    }
    out[network] = { date: isoWithOffset(m.date, time, m.timezone), info };
  }
  return out;
}
