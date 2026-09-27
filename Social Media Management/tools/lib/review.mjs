// Builds the Post Desk's data.json/files.json for one root: K&A's Social
// Media Management folder, or (with a client slug) a client's own
// `clients/<slug>` folder. See tools/review.mjs for the CLI.
//
// review/data.json is what the page renders: one entry per post in
// To Be Released/, with its captions, media paths (as published next to the
// page), status, and the "## Questions for Alex" bullets from brief.md.
// review/files.json maps each published media path to its source file
// (relative to `root`), in the shape the Artifact tool's `files` parameter
// takes. data.json also carries storyChecklist (every Story dated today or
// later; absent, harmlessly, for a client root with no stories/ folder) and
// asks (from review/asks.json, optional).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

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

/** Re-encodes a video to a 720p review copy. `run` is injectable (tests never call ffmpeg). */
export function makeProxy(src, out, run = spawnSync) {
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) return out;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const r = run("ffmpeg", [
    "-v", "error", "-y", "-i", src,
    "-vf", "scale=720:-2", "-c:v", "libx264", "-preset", "medium", "-crf", "26",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "128k", out,
  ], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`ffmpeg failed on ${src}`);
  return out;
}

/**
 * Builds `{data, files}` for one root. `proxy(src, name)` returns the file
 * actually served for a video entry; the default re-encodes with ffmpeg via
 * makeProxy into `<root>/review/proxies/`, injectable for tests. `now`
 * controls `data.builtAt`.
 */
export function buildReview({ root, proxy, now = new Date() }) {
  const QUEUE = path.join(root, "To Be Released");
  const STORIES = path.join(root, "stories");
  const OUT = path.join(root, "review");
  const PROXIES = path.join(OUT, "proxies");
  const proxyFn = proxy || ((src, name) => makeProxy(src, path.join(PROXIES, `${name}-${path.basename(src)}`)));

  const files = {};
  const posts = [];

  const dayNames = fs.existsSync(QUEUE) ? fs.readdirSync(QUEUE).sort() : [];
  for (const name of dayNames) {
    const m = DAY.exec(name);
    if (!m) continue;
    const dir = path.join(QUEUE, name);
    const manifestPath = path.join(dir, "post.json");
    if (!fs.existsSync(manifestPath)) continue;
    const post = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    // The desk shows only work waiting on Alex; approved and later drop off.
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
      const shown = entry.role === "video" ? proxyFn(src, name) : src;
      files[published] = path.relative(root, shown).split(path.sep).join("/");
      media.push({ src: published, role: entry.role, alt: entry.alt || "", platforms: entry.platforms || null });
    }
    const date = m[1];
    const ig = instagram(read(path.join(dir, "instagram.md")));
    // LinkedIn captions use the same "## First comment" split (the link goes there).
    // A client (no linkedin.md) simply reads as empty; harmless.
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
  // A root with no stories/ folder at all (a client) behaves the same as none upcoming.
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
      files[published] = path.relative(root, path.join(STORIES, f)).split(path.sep).join("/");
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
    const today = now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
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
      files[published] = path.relative(root, path.join(STORIES, f)).split(path.sep).join("/");
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

  // review/asks.json is optional; a client root without one simply has no asks.
  const asks = JSON.parse(read(path.join(root, "review", "asks.json")) || "[]");

  return {
    data: { builtAt: now.toISOString(), posts, stories, storyChecklist, storiesPaused, asks },
    files
  };
}
