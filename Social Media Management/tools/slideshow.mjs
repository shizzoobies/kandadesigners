#!/usr/bin/env node
// Turns a carousel folder's slides into a Facebook video.
//
//   node tools/slideshow.mjs 2026-09-29-2 --music "D:\kap-reel\out\candidates\music-i-b.mp3"
//   node tools/slideshow.mjs --client <slug> <folder id> --music <mp3>   (clients/<slug>)
//
// Facebook shows a multi-photo post as a grid, so the hook slide, the order and
// the closing call to action get lost. The same slides as a short video keep
// all three. Instagram keeps the swipe carousel.
//
// Writes media/slideshow.mp4 (slides in order, SLIDE_SECONDS each with a short
// crossfade, the last slide held LAST_SECONDS, music bed at -14 LUFS fading out)
// and media/slideshow-cover.jpg (slide 1), then marks the manifest: the video
// and cover go to Facebook only, the slides to Instagram only.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { resolveRoot, extractClientFlag } from "./lib/paths.mjs";

const SLIDE_SECONDS = 3.0;
const LAST_SECONDS = 4.0;
const FADE = 0.4;
const FPS = 30;

// Takes the same global --client <slug> as social.mjs, to work in clients/<slug>.
const { client: clientSlug, rest: argv } = extractClientFlag(process.argv.slice(2));
const ROOT = resolveRoot(process.env, clientSlug);
const [id, ...rest] = argv;
const musicAt = rest.indexOf("--music");
const music = musicAt >= 0 ? rest[musicAt + 1] : null;
if (!id || !music) {
  console.error('usage: node tools/slideshow.mjs [--client <slug>] <folder id> --music <mp3>');
  process.exit(2);
}
const dir = path.join(ROOT, "To Be Released", id);
const manifestPath = path.join(dir, "post.json");
const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const slides = m.media.filter((e) => e.role === "image");
if (slides.length < 2) throw new Error(`${id} has ${slides.length} slide(s); a slideshow needs at least 2`);

function run(args, capture = false) {
  const r = spawnSync("ffmpeg", args, { encoding: "utf8", stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit" });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr || ""}`.slice(0, 2000));
  return r.stderr || "";
}

// Each slide input lasts long enough to cover its hold plus the fade into the next.
const holds = slides.map((_, i) => (i === slides.length - 1 ? LAST_SECONDS : SLIDE_SECONDS));
const total = holds.reduce((a, b) => a + b, 0);
const inputs = [];
slides.forEach((s, i) => inputs.push("-loop", "1", "-t", String(holds[i] + FADE), "-i", path.join(dir, s.file)));
inputs.push("-i", music);

let graph = slides
  .map((_, i) => `[${i}:v]scale=1080:1350:force_original_aspect_ratio=decrease,pad=1080:1350:(ow-iw)/2:(oh-ih)/2:color=#F8F5F2,setsar=1,fps=${FPS},format=yuv420p[s${i}]`)
  .join(";");
let prev = "s0";
let offset = 0;
for (let i = 1; i < slides.length; i++) {
  offset += holds[i - 1];
  const out = i === slides.length - 1 ? "v" : `x${i}`;
  graph += `;[${prev}][s${i}]xfade=transition=fade:duration=${FADE}:offset=${(offset - FADE / 2).toFixed(3)}[${out}]`;
  prev = out;
}
const a = slides.length;
const audioChain = `[${a}:a]atrim=0:${total},asetpts=N/SR/TB,afade=t=in:st=0:d=0.3,afade=t=out:st=${total - 1.2}:d=1.2`;

// Two-pass loudness to -14 LUFS, true peak -1.5, like the reels.
const probe = run([...["-hide_banner", "-i", music], "-af", `atrim=0:${total},loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json`, "-f", "null", "-"], true);
const stats = JSON.parse(probe.slice(probe.lastIndexOf("{"), probe.lastIndexOf("}") + 1));
const norm = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true,alimiter=limit=0.8:level=false`;
// linear=true keeps the bed's dynamics; the limiter after it keeps AAC's true
// peak under -1 dBTP on peaky tracks (2026-09-25, Tuesday's bed hit -0.7).

const outVideo = path.join(dir, "media", "slideshow.mp4");
run([
  "-v", "error", "-y", ...inputs,
  "-filter_complex", `${graph};${audioChain},${norm},aresample=48000[a]`,
  "-map", "[v]", "-map", "[a]", "-t", String(total),
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(FPS),
  "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", outVideo,
]);
const cover = path.join(dir, "media", "slideshow-cover.jpg");
run(["-v", "error", "-y", "-i", path.join(dir, slides[0].file), "-q:v", "2", cover]);

// Manifest: slides to Instagram, video and cover to Facebook. Idempotent.
const keep = m.media.filter((e) => !["media/slideshow.mp4", "media/slideshow-cover.jpg"].includes(e.file));
for (const e of keep) if (e.role === "image") e.platforms = ["instagram"];
keep.push(
  { file: "media/slideshow.mp4", role: "video", origin: "kap-reel", platforms: ["facebook"],
    alt: `Video of the ${slides.length} carousel slides in order: ${slides.map((s) => s.alt.split(/\.\s/)[0]).join(" / ")}` },
  { file: "media/slideshow-cover.jpg", role: "thumbnail", origin: "kap-reel", platforms: ["facebook"], alt: slides[0].alt },
);
m.media = keep;
// The track id is the music file's name without extension; validate uses it to
// keep a track from repeating within 30 days.
m.music = path.basename(music, path.extname(music));
fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2) + "\n");
console.log(`${id}: ${slides.length} slides, ${total.toFixed(1)}s, music ${path.basename(music)} -> media/slideshow.mp4`);
