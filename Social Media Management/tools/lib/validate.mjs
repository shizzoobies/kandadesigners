import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { STATUSES, DAY_NAME, readManifest, mediaFor } from "./manifest.mjs";
import { readCaption, splitInstagram } from "./captions.mjs";

export const LIMITS = { facebook: 63206, instagram: 2200, linkedin: 3000, youtube: 5000, firstComment: 2200 };
export const AI_DISCLOSURE = /\bAI (narrated|voice|generated|assisted)/i;
export const NETWORKS = ["facebook", "instagram", "linkedin", "youtube"];
export const TYPES = {
  facebook: ["POST", "REEL", "STORY"],
  instagram: ["POST", "REEL", "STORY", "TRIAL_REEL"],
  // DOCUMENT is ours: the images go up as one swipeable PDF (Metricool publishImagesAsPDF).
  linkedin: ["POST", "DOCUMENT"],
  youtube: ["VIDEO", "SHORT"]
};
// Metricool's youtubeData.category values (the connector's own names, not YouTube's API ones).
export const YOUTUBE_CATEGORIES = [
  "FILM_ANIMATION", "AUTOS_VEHICLES", "MUSIC", "PETS_ANIMALS", "SPORTS", "TRAVEL_EVENTS", "GAMING", "PEOPLE_BLOGS",
  "COMEDY", "ENTERTAINMENT", "NEWS_POLITICS", "HOWTO_STYLE", "EDUCATION", "SCIENCE_TECHNOLOGY", "NONPROFITS_ACTIVISM"
];
// An owner-published client's owner posts by hand from a plain file: no Story, no
// carousel-as-document, nothing Metricool-specific - just a feed POST or a REEL.
export const OWNER_TYPES = ["POST", "REEL"];
export const ROLES = ["video", "image", "thumbnail", "captions"];
export const ORIGINS = ["human", "codex", "elevenlabs", "kap-reel"];
const AUDIO_FIELDS = ["term", "id", "audioVolume", "videoVolume"];
const EM_DASH = "\u2014";
const TEXT_EXT = new Set([".md", ".json", ".srt"]);
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const MB = 1024 * 1024;
// Under wrangler's 300 MiB single put and Metricool's 500 MB, so upload needs no multipart path.
const R2_MAX = 280 * MB;
const YOUTUBE_LINK = /ka-performancefl\.com\S*utm_source=youtube/;
const here = path.dirname(fileURLToPath(import.meta.url));
const YOUTUBE_CONFIG = path.resolve(here, "..", "config", "youtube.json");

/** The channel settings validate needs: { verified, playlists }. A missing file reads as an unverified channel with no playlists. */
export function readYoutubeConfig(file = YOUTUBE_CONFIG) {
  if (!fs.existsSync(file)) return { verified: false, playlists: [] };
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * { width, height, duration, size } for one media file: ffprobe on the first video stream for the first three,
 * the disk for size. width and height are as displayed (a phone video stored sideways is swapped back), and
 * null when the file has no video stream. `run` is injectable.
 */
export function probeMedia(file, run = spawnSync) {
  const res = run("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height:stream_tags=rotate:stream_side_data=rotation:format=duration",
    "-of", "json", file
  ], { encoding: "utf8" });
  if (res.error) throw new Error(`ffprobe could not start: ${res.error.message}`);
  if (res.status !== 0) throw new Error(`ffprobe failed: ${String(res.stderr || "").trim()}`);
  const out = JSON.parse(res.stdout);
  const stream = (out.streams || [])[0] || {};
  const side = (stream.side_data_list || []).find((x) => x && x.rotation !== undefined);
  const rotation = Number(side ? side.rotation : stream.tags && stream.tags.rotate) || 0;
  const sideways = Math.abs(rotation) % 180 === 90;
  const width = stream.width || null;
  const height = stream.height || null;
  return {
    width: sideways ? height : width,
    height: sideways ? width : height,
    duration: Number(out.format && out.format.duration) || 0,
    size: fs.statSync(file).size
  };
}

const isAspect = (p, w, h) => p.width > 0 && p.height > 0 && Math.abs(p.width / p.height - w / h) < 0.01;
const mb = (size) => (size / MB).toFixed(1);
// YouTube's thumbnail limit is 2 MB in decimal bytes.
const THUMB_MAX = 2000000;

/**
 * Every problem in one folder, or [] when it is valid. Never writes, never
 * throws. Pass `client` (from lib/client.mjs's loadClient) for a client
 * folder: for a `publish: "owner"` client, platforms may only name a network
 * in the client's own `networks`, types are POST or REEL only, and `manual`
 * is never set (every network there is posted by the owner by hand).
 *
 * A folder with a youtube platform also has its media probed once it is
 * ready or later: `probe(absFile)` returns { width, height, duration, size }
 * (probeMedia by default; tests inject a fake). `youtube` is the channel
 * config (readYoutubeConfig by default). Advice that is not a problem (a
 * YouTube title long enough to be cut off in feeds) is pushed onto
 * `warnings`, an array the caller passes in to collect it.
 */
export function validateFolder(dir, { now = new Date(), client = null, probe = probeMedia, youtube = null, warnings = [] } = {}) {
  const name = path.basename(dir);
  const problems = [];
  const add = (msg) => problems.push(`${name}: ${msg}`);
  const ownerClient = Boolean(client && client.publish === "owner");
  const clientNetworks = ownerClient ? (Array.isArray(client.networks) ? client.networks : []) : null;
  const allowedNetworks = ownerClient ? clientNetworks : NETWORKS;
  if (ownerClient && clientNetworks.length === 0) add(`${client.slug} has no networks configured`);

  if (!fs.existsSync(dir)) return [`${name}: folder does not exist`];
  if (!fs.existsSync(path.join(dir, "post.json"))) return [`${name}: post.json is missing`];

  let m;
  try {
    m = readManifest(dir);
  } catch {
    return [`${name}: cannot parse post.json`];
  }

  try {
    if (m === null || typeof m !== "object" || Array.isArray(m)) {
      add("post.json is not an object");
      return problems;
    }

    if (!DAY_NAME.test(name)) add(`folder name "${name}" is not YYYY-MM-DD`);
    if (m.id !== name) add(`id "${m.id}" does not match folder name`);
    if (m.date !== String(m.id).slice(0, 10)) add(`date "${m.date}" does not match id`);
    if (!STATUSES.includes(m.status)) add(`unknown status "${m.status}"`);
    if (!ownerClient && m.status === "handed-off") add(`status "handed-off" is only valid for an owner-published client`);

    if (m.status === "native") {
      if (Array.isArray(m.media) && m.media.length > 0) add("native folders carry no media");
      return problems;
    }

    const briefPath = path.join(dir, "brief.md");
    const briefContent = fs.existsSync(briefPath) ? fs.readFileSync(briefPath, "utf8") : null;
    if (!briefContent || !briefContent.trim()) {
      add("brief.md is missing or empty");
    } else if (m.status !== "planned" && !/^Approved:\s*yes/im.test(briefContent)) {
      add(`brief.md is not approved; status ${m.status} needs an approved brief`);
    }

    let tzValid = true;
    if (typeof m.timezone !== "string" || !m.timezone) {
      tzValid = false;
      add("timezone is missing");
    } else {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: m.timezone });
      } catch {
        tzValid = false;
        add(`timezone "${m.timezone}" is not a valid IANA zone`);
      }
    }
    if (tzValid && ownerClient && typeof client.timezone === "string" && m.timezone !== client.timezone) {
      add(`timezone "${m.timezone}" does not match ${client.slug}'s timezone "${client.timezone}"`);
    }

    // Only a network Metricool does not have yet can be late, each at its own time: once the reel is
    // recorded, a later YouTube Short can still be sent after the reel's time has passed.
    const recorded = (network) => Boolean(m.metricool && m.metricool[network] && m.metricool[network].id);
    const pendingOnFolderTime = Object.entries(m.platforms && typeof m.platforms === "object" ? m.platforms : {})
      .some(([n, cfg]) => cfg && typeof cfg === "object" && !cfg.manual && cfg.time === undefined && !recorded(n));
    if (!TIME.test(m.time)) add(`time "${m.time}" is not HH:MM`);
    else if (tzValid && m.status === "approved" && pendingOnFolderTime && localToUtc(m.date, m.time, m.timezone) <= now) {
      add(`approved post time ${m.date} ${m.time} ${m.timezone} is in the past`);
    }

    let media = [];
    if (m.media !== undefined) {
      if (!Array.isArray(m.media)) {
        add("media is not a list");
      } else {
        m.media.forEach((entry, i) => {
          if (!entry || typeof entry !== "object" || Array.isArray(entry) ||
              typeof entry.file !== "string" || entry.file.trim() === "") {
            add(`media entry ${i} has no file`);
            return;
          }
          media.push(entry);
        });
      }
    }

    const roles = new Set(media.map((x) => x.role));
    const statusIndex = STATUSES.indexOf(m.status);
    const readyOrLater = statusIndex >= STATUSES.indexOf("ready");

    for (const entry of media) {
      const normalized = path.posix.normalize(String(entry.file).replace(/\\/g, "/"));
      const isBadPath = path.posix.isAbsolute(normalized) ||
        normalized.split("/").includes("..") ||
        !normalized.startsWith("media/");
      if (isBadPath) {
        add(`${entry.file} must be a relative path inside media/`);
        continue;
      }
      if (entry.role === undefined) {
        add(`${entry.file} has no role`);
      } else if (!ROLES.includes(entry.role)) {
        add(`${entry.file} has unknown role "${entry.role}"`);
      }
      if (entry.origin !== undefined && !ORIGINS.includes(entry.origin)) {
        add(`${entry.file} has unknown origin "${entry.origin}"`);
      }
      if ((entry.role === "image" || entry.role === "thumbnail") && !String(entry.alt || "").trim()) {
        add(`${entry.file} needs alt text`);
      }
      if (entry.role === "thumbnail" && !/\.(jpe?g|png)$/i.test(normalized)) {
        add(`${entry.file} thumbnail must be jpg, jpeg, or png`);
      }
      if (readyOrLater && !fs.existsSync(path.join(dir, normalized))) add(`${entry.file} does not exist`);
      if (entry.platforms !== undefined) {
        if (!Array.isArray(entry.platforms)) add(`${entry.file} platforms must be a list of networks`);
        else for (const p of entry.platforms) if (!allowedNetworks.includes(p)) add(`${entry.file} names unknown platform "${p}"`);
      }
    }
    const rolesFor = (network) => new Set(media.filter((x) => mediaFor(x, network)).map((x) => x.role));

    const aiFlag = Boolean(m.ai && (m.ai.voice || m.ai.visuals));
    const rawPlatforms = (m.platforms && typeof m.platforms === "object" && !Array.isArray(m.platforms))
      ? m.platforms : {};
    const active = Object.entries(rawPlatforms).filter(([, cfg]) => cfg && typeof cfg === "object" && !cfg.manual);
    if (active.length === 0) add("platforms must name at least one non-manual network");
    for (const [network, cfg] of Object.entries(rawPlatforms)) {
      if (cfg === null || typeof cfg !== "object" || Array.isArray(cfg)) {
        add(`platforms.${network} is not an object`);
        continue;
      }
      if (!allowedNetworks.includes(network)) {
        add(ownerClient ? `${client.slug} does not post to "${network}"` : `unknown network "${network}"`);
        continue;
      }
      if (ownerClient && cfg.manual) {
        add(`${network} must not be manual: an owner-published client posts every network by hand`);
        continue;
      }
      if (cfg.manual) continue;

      // A network's own time (the YouTube Short goes up after the reel) overrides the folder's.
      if (cfg.time !== undefined) {
        if (!TIME.test(cfg.time)) add(`platforms.${network}.time "${cfg.time}" is not HH:MM`);
        else if (tzValid && m.status === "approved" && !recorded(network) && localToUtc(m.date, cfg.time, m.timezone) <= now) {
          add(`approved ${network} time ${m.date} ${cfg.time} ${m.timezone} is in the past`);
        }
      }

      const type = cfg.type || "POST";
      const allowedTypes = ownerClient ? OWNER_TYPES : TYPES[network];
      if (allowedTypes && !allowedTypes.includes(type)) {
        add(`${network} type "${type}" is not one of ${allowedTypes.join(", ")}`);
        continue;
      }
      // An owner posts by hand from the hand-off folder, which does not carry a sound yet.
      if (cfg.audio !== undefined && ownerClient && network === "instagram") add("instagram audio is not supported for owner-published clients yet");
      else if (cfg.audio !== undefined) audioProblems(network, type, cfg.audio, add);

      const roles = rolesFor(network);
      if (type === "STORY") {
        if (!roles.has("image") && !roles.has("video")) add(`${network} STORY needs an image or video`);
        const storyRaw = cfg.caption ? readCaption(dir, cfg.caption) : null;
        const storyText = (network === "instagram" && storyRaw !== null) ? splitInstagram(storyRaw).caption : storyRaw;
        if (storyText) add(`${network} STORY carries no caption`);
        continue;
      }

      if ((type === "REEL" || type === "TRIAL_REEL") && !roles.has("video")) add(`${network} REEL needs a video`);
      if (network === "youtube") {
        const warn = (msg) => warnings.push(`${name}: ${msg}`);
        youtube = youtube || readYoutubeConfig();
        // YouTube takes one video and nothing else; a reel folder's other files are scoped away with platforms.
        const videos = media.filter((x) => x.role === "video" && mediaFor(x, network)).length;
        const images = media.filter((x) => x.role === "image" && mediaFor(x, network)).length;
        if (videos === 0) add(`youtube ${type} needs a video`);
        if (videos > 1) add(`youtube gets ${videos} videos; scope the others with "platforms"`);
        if (images > 0) add(`youtube gets ${images} image(s); scope them away with "platforms"`);
        // Custom thumbnails need a verified channel; until then the thumbnail goes up in Studio.
        if (type === "VIDEO" && !roles.has("thumbnail")) {
          if (youtube.verified) add("youtube VIDEO needs a thumbnail");
          else warn("youtube VIDEO has no thumbnail: channel not verified; set the thumbnail in Studio");
        }
        youtubeProblems(cfg, add, warn, youtube);
        if (readyOrLater) probeYoutube(dir, type, media, add, probe, youtube, videos === 1 && images === 0);
      }
      if (network === "instagram" && !roles.has("image") && !roles.has("video")) add("instagram needs an image or video");
      if (network === "linkedin" && type === "DOCUMENT" &&
          media.filter((x) => x.role === "image" && mediaFor(x, network)).length < 2) add("linkedin DOCUMENT needs at least 2 images");

      const raw = cfg.caption ? readCaption(dir, cfg.caption) : null;
      // LinkedIn captions may carry a "## First comment" too (the link goes there).
      const splits = network === "instagram" || network === "linkedin";
      const split = raw === null ? null : (splits ? splitInstagram(raw) : null);
      const text = raw === null ? null : (splits ? split.caption : raw);
      if (!text) {
        add(`${network} caption file ${cfg.caption || "(none)"} is missing or empty`);
        continue;
      }
      if (network === "instagram") {
        const { caption, firstComment } = split;
        if (caption.length > LIMITS.instagram) add(`instagram caption is ${caption.length} characters, limit ${LIMITS.instagram}`);
        if (firstComment.length > LIMITS.firstComment) add(`instagram first comment is ${firstComment.length} characters, limit ${LIMITS.firstComment}`);
        if (/(^|\s)#\w/.test(caption)) add("instagram caption has hashtags above the first comment");
        if (aiFlag && !AI_DISCLOSURE.test(caption)) add("instagram caption needs an AI disclosure line");
      } else {
        const limit = LIMITS[network];
        if (limit && text.length > limit) add(`${network} caption is ${text.length} characters, limit ${limit}`);
        if (aiFlag && !AI_DISCLOSURE.test(text)) add(`${network} caption needs an AI disclosure line`);
        if (network === "youtube" && !YOUTUBE_LINK.test(text.split(/\r?\n/)[1] || "")) {
          add(`${cfg.caption} line 2 needs a ka-performancefl.com link with utm_source=youtube`);
        }
      }
    }

    for (const rel of walkText(dir)) {
      const content = fs.readFileSync(path.join(dir, rel), "utf8");
      if (content.includes(EM_DASH)) add(`${rel} contains an em dash`);
      if (rel.startsWith("source/") && /script|narration/i.test(rel) && rel.endsWith(".md") && content.includes("K&A")) {
        add(`${rel} must spell K and A for the voice model`);
      }
    }
  } catch (err) {
    problems.push(`${name}: validator error: ${err.message}`);
  }

  return problems;
}

/**
 * platforms.instagram.audio, Metricool's audioConfiguration: a REEL only, exactly one of `term` (song title
 * and/or artist) or `id` (numeric Instagram audio id), optional whole-number volumes 0 to 100. Nothing else:
 * Metricool fills the catalog fields itself.
 */
function audioProblems(network, type, audio, add) {
  if (network !== "instagram") { add(`${network} audio is for instagram only`); return; }
  if (type !== "REEL") add(`instagram audio needs type REEL, not ${type}`);
  if (audio === null || typeof audio !== "object" || Array.isArray(audio)) { add("instagram audio is not an object"); return; }
  for (const k of Object.keys(audio)) {
    if (!AUDIO_FIELDS.includes(k)) add(`instagram audio has unknown field "${k}"`);
  }
  if ((audio.term === undefined) === (audio.id === undefined)) add("instagram audio needs exactly one of term or id");
  else if (audio.term !== undefined && typeof audio.term !== "string") add("instagram audio term must be a string");
  else if (audio.term !== undefined && !audio.term.trim()) add("instagram audio term is empty");
  else if (typeof audio.id === "number" && Number.isInteger(audio.id) && !Number.isSafeInteger(audio.id)) {
    // JSON numbers past 2^53 lose digits on parse, so the id Metricool gets would be a different sound.
    add(`instagram audio id ${audio.id} is too long for a JSON number; write it as a string`);
  } else if (audio.id !== undefined && !(typeof audio.id === "string" ? /^\d+$/.test(audio.id) : Number.isSafeInteger(audio.id) && audio.id >= 0)) {
    add(`instagram audio id ${JSON.stringify(String(audio.id))} is not a numeric Instagram audio id`);
  }
  for (const k of ["audioVolume", "videoVolume"]) {
    const v = audio[k];
    if (v !== undefined && !(Number.isInteger(v) && v >= 0 && v <= 100)) add(`instagram audio ${k} ${JSON.stringify(v)} is not a whole number from 0 to 100`);
  }
}

/** The youtube fields Metricool takes (title, tags, category) and the playlist the Studio checklist names. */
function youtubeProblems(cfg, add, warn, config) {
  const title = typeof cfg.title === "string" ? cfg.title.trim() : "";
  if (!title) add("youtube needs a title");
  else if (title.length > 100) add(`youtube title is ${title.length} characters, limit 100`);
  else if (title.length > 70) warn(`youtube title is ${title.length} characters; feeds cut titles near 70`);
  if (cfg.tags !== undefined) {
    if (!Array.isArray(cfg.tags) || !cfg.tags.every((t) => typeof t === "string")) {
      add("youtube tags must be a list of strings");
    } else {
      // YouTube counts the separators too.
      const combined = cfg.tags.join(",").length;
      if (combined > 500) add(`youtube tags are ${combined} characters combined, limit 500`);
      for (const t of cfg.tags) if (t.includes("#")) add(`youtube tag "${t}" has a #`);
    }
  }
  if (cfg.category !== undefined && !YOUTUBE_CATEGORIES.includes(cfg.category)) add(`youtube category "${cfg.category}" is not one of Metricool's categories`);
  const playlists = Array.isArray(config.playlists) ? config.playlists : [];
  if (cfg.playlist !== undefined && !playlists.includes(cfg.playlist)) add(`youtube playlist "${cfg.playlist}" is not one of ${playlists.join(", ")}`);
}

/**
 * The media probe for a folder with youtube: the shape and length of the
 * video it gets, its thumbnail for a VIDEO, and the size of every file bound
 * for R2 (the roles upload sends). A file that does not exist is reported
 * elsewhere, so it is skipped here. Shapes are checked only when `scoped`
 * (youtube gets exactly one video and no images), so a scoping mistake is
 * not reported as the wrong file's shape.
 */
function probeYoutube(dir, type, media, add, probe, config, scoped) {
  const seen = new Map();
  const read = (entry) => {
    if (!seen.has(entry.file)) {
      const abs = path.join(dir, entry.file);
      let result = null;
      if (fs.existsSync(abs)) {
        try {
          result = probe(abs);
        } catch (err) {
          add(`cannot probe ${entry.file}: ${err.message}`);
        }
      }
      seen.set(entry.file, result);
    }
    return seen.get(entry.file);
  };
  for (const entry of scoped ? media.filter((x) => mediaFor(x, "youtube")) : []) {
    const p = entry.role === "video" || (entry.role === "thumbnail" && type === "VIDEO") ? read(entry) : null;
    if (!p) continue;
    if (!(p.width > 0 && p.height > 0)) { add(`${entry.file} has no video stream`); continue; }
    if (entry.role === "video" && type === "SHORT") {
      // Any vertical or square video is a Short to YouTube and Metricool.
      if (p.height < p.width) add(`${entry.file} is ${p.width}x${p.height}; a youtube SHORT needs a vertical or square video`);
      if (p.duration > 170) add(`${entry.file} runs ${p.duration}s; a youtube SHORT must be 170s or less`);
    } else if (entry.role === "video") {
      if (!isAspect(p, 16, 9)) add(`${entry.file} is ${p.width}x${p.height}; a youtube VIDEO needs 16:9`);
      if (p.duration <= 60) add(`${entry.file} runs ${p.duration}s; a youtube VIDEO must be over 60s`);
      if (p.duration > 900 && !config.verified) add(`${entry.file} runs ${p.duration}s; an unverified channel allows 900s (15 minutes)`);
    } else {
      if (!isAspect(p, 16, 9) || p.width < 1280) add(`${entry.file} is ${p.width}x${p.height}; a youtube VIDEO thumbnail needs 16:9, 1280 wide or more`);
      if (p.size >= THUMB_MAX) add(`${entry.file} is ${(p.size / 1e6).toFixed(1)} MB; a youtube thumbnail must be under 2 MB`);
    }
  }
  for (const entry of media.filter((x) => ["video", "image", "thumbnail"].includes(x.role))) {
    const p = read(entry);
    if (p && p.size > R2_MAX) add(`${entry.file} is ${mb(p.size)} MB; files bound for R2 must be 280 MB or less`);
  }
}

/** Relative paths of .md, .json, .srt files under dir, forward slashes. */
function walkText(dir, prefix = "") {
  const out = [];
  for (const d of fs.readdirSync(path.join(dir, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${d.name}` : d.name;
    if (d.isDirectory()) out.push(...walkText(dir, rel));
    else if (TEXT_EXT.has(path.extname(d.name))) out.push(rel);
  }
  return out;
}

/** Local wall time in an IANA zone to a UTC Date, using Intl only. */
export function localToUtc(date, time, timezone) {
  const [h, min] = time.split(":").map(Number);
  const [y, mo, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, min);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
  }).formatToParts(new Date(guess)).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  const asIfUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(guess - (asIfUtc - guess));
}
