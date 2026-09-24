import fs from "node:fs";
import path from "node:path";
import { STATUSES, DAY_NAME, readManifest } from "./manifest.mjs";
import { readCaption, splitInstagram } from "./captions.mjs";

export const LIMITS = { facebook: 63206, instagram: 2200, firstComment: 2200 };
export const AI_DISCLOSURE = /\bAI (narrated|voice|generated|assisted)/i;
export const NETWORKS = ["facebook", "instagram", "linkedin"];
export const TYPES = {
  facebook: ["POST", "REEL", "STORY"],
  instagram: ["POST", "REEL", "STORY", "TRIAL_REEL"]
};
export const ROLES = ["video", "image", "thumbnail", "captions"];
export const ORIGINS = ["human", "codex", "elevenlabs", "kap-reel"];
const EM_DASH = "\u2014";
const TEXT_EXT = new Set([".md", ".json", ".srt"]);
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Every problem in one folder, or [] when it is valid. Never writes, never throws. */
export function validateFolder(dir, { now = new Date() } = {}) {
  const name = path.basename(dir);
  const problems = [];
  const add = (msg) => problems.push(`${name}: ${msg}`);

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

    if (m.status === "native") {
      if (Array.isArray(m.media) && m.media.length > 0) add("native folders carry no media");
      return problems;
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

    if (!TIME.test(m.time)) add(`time "${m.time}" is not HH:MM`);
    else if (tzValid && m.status === "approved" && localToUtc(m.date, m.time, m.timezone) <= now) {
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
      if (readyOrLater && !fs.existsSync(path.join(dir, normalized))) add(`${entry.file} does not exist`);
    }

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
      if (!NETWORKS.includes(network)) {
        add(`unknown network "${network}"`);
        continue;
      }
      if (network === "linkedin" && !cfg.manual) {
        add("linkedin must be manual until it is connected to Metricool");
        continue;
      }
      if (cfg.manual) continue;

      const type = cfg.type || "POST";
      const allowedTypes = TYPES[network];
      if (allowedTypes && !allowedTypes.includes(type)) {
        add(`${network} type "${type}" is not one of ${allowedTypes.join(", ")}`);
        continue;
      }

      if (type === "STORY") {
        if (!roles.has("image") && !roles.has("video")) add(`${network} STORY needs an image or video`);
        const storyRaw = cfg.caption ? readCaption(dir, cfg.caption) : null;
        const storyText = (network === "instagram" && storyRaw !== null) ? splitInstagram(storyRaw).caption : storyRaw;
        if (storyText) add(`${network} STORY carries no caption`);
        continue;
      }

      if ((type === "REEL" || type === "TRIAL_REEL") && !roles.has("video")) add(`${network} REEL needs a video`);
      if (network === "instagram" && !roles.has("image") && !roles.has("video")) add("instagram needs an image or video");

      const raw = cfg.caption ? readCaption(dir, cfg.caption) : null;
      const split = raw === null ? null : (network === "instagram" ? splitInstagram(raw) : null);
      const text = raw === null ? null : (network === "instagram" ? split.caption : raw);
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
