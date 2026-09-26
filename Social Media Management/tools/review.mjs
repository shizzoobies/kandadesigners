#!/usr/bin/env node
// Builds the approval page's data from the day folders.
//
//   node tools/review.mjs            writes review/data.json and review/files.json
//
// review/data.json is what the page renders: one entry per post in
// To Be Released/, with its captions, media paths (as published next to the
// page), status, and the "## Questions for Alex" bullets from brief.md.
// review/files.json maps each published media path to its source file (relative
// to the Social Media Management folder, wherever this runs from), in the
// shape the Artifact tool's `files` parameter takes, so Claude can publish the
// page and its media in one call. Alex's decisions live in the page's db, not
// here; Claude reads them back and applies them with the normal commands.
// data.json also carries storyChecklist (every Story dated today or later); the
// page saves Alex's Posted ticks to its db collection storyChecks/<date>-story.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUEUE = path.join(ROOT, "To Be Released");
const STORIES = path.join(ROOT, "stories");
const OUT = path.join(ROOT, "review");

const DAY = /^(\d{4}-\d{2}-\d{2})(-\d+)?$/;
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8").trim() : "");

function section(md, heading) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim().toLowerCase() === `## ${heading}`.toLowerCase());
  if (start < 0) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^#{1,2} /.test(l));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n").trim();
}

function bullets(text) {
  return text
    .split(/\r?\n/)
    .filter((l) => /^\s*[-*] /.test(l))
    .map((l) => l.replace(/^\s*[-*] /, "").trim());
}

function hookOf(brief) {
  const h = section(brief, "Hook");
  if (h) return h.split(/\r?\n/)[0].replace(/^"|"$/g, "");
  const m = brief.match(/^Hook:\s*(.+)$/im);
  return m ? m[1] : "";
}

function instagram(md) {
  const [caption, comment = ""] = md.split(/^## First comment\s*$/m);
  return { caption: caption.trim(), firstComment: comment.trim() };
}

const PROXIES = path.join(OUT, "proxies");

function proxy(src, name) {
  const out = path.join(PROXIES, `${name}-${path.basename(src)}`);
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) return out;
  fs.mkdirSync(PROXIES, { recursive: true });
  const r = spawnSync("ffmpeg", [
    "-v", "error", "-y", "-i", src,
    "-vf", "scale=720:-2", "-c:v", "libx264", "-preset", "medium", "-crf", "26",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "128k", out,
  ], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`ffmpeg failed on ${src}`);
  return out;
}

const files = {};
const posts = [];

for (const name of fs.readdirSync(QUEUE).sort()) {
  const m = DAY.exec(name);
  if (!m) continue;
  const dir = path.join(QUEUE, name);
  const manifestPath = path.join(dir, "post.json");
  if (!fs.existsSync(manifestPath)) continue;
  const post = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  // The desk shows only work waiting on Alex; approved, scheduled and native posts drop off.
  if (!["planned", "generating", "ready"].includes(post.status)) continue;
  const brief = read(path.join(dir, "brief.md"));
  const types = Object.values(post.platforms || {}).map((p) => p.type).filter(Boolean);
  const media = [];
  for (const entry of post.media || []) {
    if (entry.role === "captions") continue;
    const src = path.join(dir, entry.file);
    if (!fs.existsSync(src)) continue;
    const published = `media/${name}/${path.basename(entry.file)}`;
    // Videos go up as 720p review copies: the page's per-file and per-version
    // size limits are well under a full-quality reel set. The posted file is
    // still the one in media/.
    const shown = entry.role === "video" ? proxy(src, name) : src;
    files[published] = path.relative(ROOT, shown).split(path.sep).join("/");
    media.push({ src: published, role: entry.role, alt: entry.alt || "", platforms: entry.platforms || null });
  }
  const date = m[1];
  const ig = instagram(read(path.join(dir, "instagram.md")));
  // LinkedIn captions use the same "## First comment" split (the link goes there).
  const li = instagram(read(path.join(dir, "linkedin.md")));
  const networks = Object.entries(post.platforms || {}).filter(([, c]) => c && !c.manual).map(([n]) => n);
  posts.push({
    id: name,
    date,
    weekday: WEEKDAY[new Date(`${date}T12:00:00`).getDay()],
    time: post.time,
    kind: post.status === "native" ? "native"
      : networks.length === 1 && networks[0] === "linkedin" ? "linkedin"
      : types.includes("REEL") ? "reel" : media.filter((x) => x.role === "image").length > 1 ? "carousel" : "post",
    status: post.status,
    pillar: post.pillar,
    title: post.title,
    hook: (read(path.join(dir, "facebook.md")) || li.caption).split(/\r?\n/)[0] || hookOf(brief),
    networks,
    facebook: read(path.join(dir, "facebook.md")),
    instagram: ig.caption,
    firstComment: ig.firstComment,
    linkedin: li.caption,
    linkedinComment: li.firstComment,
    repost: read(path.join(dir, "repost.md")),
    questions: bullets(section(brief, "Questions for Alex")),
    ai: post.ai || {},
    music: post.music || null,
    scheduled: Object.fromEntries(
      Object.entries(post.metricool || {}).map(([net, v]) => [net, { id: v.id || null, draft: !!v.draft }]),
    ),
    media,
  });
}

// stories/PAUSED.md turns the hand-posted Stories off: none go to the desk at all.
const storiesPaused = fs.existsSync(path.join(STORIES, "PAUSED.md"));

const stories = [];
if (fs.existsSync(STORIES) && !storiesPaused) {
  const guide = read(path.join(STORIES, "README.md"));
  // stories/approved.json lists story ids Alex already approved; they drop off the desk.
  const done = new Set(JSON.parse(read(path.join(STORIES, "approved.json")) || "[]"));
  for (const f of fs.readdirSync(STORIES).sort()) {
    const s = /^(\d{4}-\d{2}-\d{2})-story\.png$/.exec(f);
    if (!s || done.has(`${s[1]}-story`)) continue;
    const published = `media/stories/${f}`;
    files[published] = path.relative(ROOT, path.join(STORIES, f)).split(path.sep).join("/");
    // stories/README.md has one table row per day: | date | image | sticker text | sticker URL |
    const row = guide.split(/\r?\n/).find((l) => l.includes(f)) || "";
    const cells = row.split("|").map((c) => c.trim());
    const url = (row.match(/https:\/\/ka-performancefl\.com\S*/) || [""])[0];
    stories.push({ id: `${s[1]}-story`, date: s[1], src: published, stickerText: cells[3] || "", stickerUrl: url });
  }
}

// The Stories checklist lists every upcoming Story, approved or not, so Alex can
// tick each one off as he posts it by hand. stories/SCHEDULE.md has one row per day:
// | When | Image | Sticker text | Sticker URL |, where When reads like
// "Fri Oct 2, 10:35 AM (only if thrillersvr.com is live)".
const storyChecklist = [];
if (fs.existsSync(STORIES) && !storiesPaused) {
  const schedule = read(path.join(STORIES, "SCHEDULE.md"));
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  for (const line of schedule.split(/\r?\n/)) {
    const s = /(\d{4}-\d{2}-\d{2})-story\.png/.exec(line);
    if (!s || s[1] < today) continue;
    const f = `${s[1]}-story.png`;
    if (!fs.existsSync(path.join(STORIES, f))) continue;
    const cells = line.split("|").map((c) => c.trim());
    const t = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(cells[1] || "");
    const time = t ? `${String((+t[1] % 12) + (/pm/i.test(t[3]) ? 12 : 0)).padStart(2, "0")}:${t[2]}` : "10:35";
    const cond = /\(([^)]+)\)/.exec(cells[1] || "");
    const published = `media/stories/${f}`;
    files[published] = path.relative(ROOT, path.join(STORIES, f)).split(path.sep).join("/");
    storyChecklist.push({
      id: `${s[1]}-story`,
      date: s[1],
      time,
      condition: cond ? cond[1][0].toUpperCase() + cond[1].slice(1) : "",
      src: published,
      stickerText: cells[3] || "",
      stickerUrl: (line.match(/https:\/\/ka-performancefl\.com\S*/) || [""])[0],
    });
  }
}

const asks = JSON.parse(read(path.join(ROOT, "review", "asks.json")) || "[]");

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(
  path.join(OUT, "data.json"),
  JSON.stringify({ builtAt: new Date().toISOString(), posts, stories, storyChecklist, storiesPaused, asks }, null, 2),
);
fs.writeFileSync(path.join(OUT, "files.json"), JSON.stringify(files, null, 2));
console.log(`${posts.length} posts, ${storiesPaused ? "Stories paused (stories/PAUSED.md)" : `${stories.length} stories, ${storyChecklist.length} on the Stories checklist`}, ${Object.keys(files).length} media files`);
