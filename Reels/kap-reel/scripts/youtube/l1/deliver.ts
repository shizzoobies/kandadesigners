/**
 * scripts/youtube/l1/deliver.ts
 *
 * Renders YouTube L1 and encodes the delivery file, then checks it.
 *
 *   render  the composition, muted, as a high-quality master
 *           (out/youtube/l1/l1-master.mp4, H.264 CRF 14)
 *   encode  the master plus assets/youtube/l1/mix.wav to the spec in
 *           Social Media Management/README.md "YouTube": 1920x1080, 30 fps,
 *           H.264 High CRF 20 capped at 3.5 Mbps, AAC 192 kbps 48 kHz, 280 MB
 *           or less, into To Be Released/2026-10-02-4/media/video.mp4. The
 *           mix goes straight from the wav, so the audio is AAC-encoded once.
 *           Color is converted the way scripts/encode.sh does it: Remotion's
 *           full-range bt470bg render to limited-range bt709.
 *   check   ffprobe (duration, size, streams) and the delivered loudness
 *   qa      six stills pulled from the delivered file, and a contact sheet,
 *           into out/youtube/l1/qa-final/
 *
 * Run from D:\kap-reel after stage.ts and mix.ts (never npx):
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/deliver.ts [render] [encode] [check] [qa]
 * With no step named, all four run in order.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { cue, slotOf, L1_TOTAL_FRAMES } from "../../../src/youtube/l1/timeline";
import { verifyLoudness } from "../../audio";
import { contactSheet } from "./sheet";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const REAL_ROOT = fs.realpathSync(ROOT);
const FOLDER = path.resolve(
  REAL_ROOT,
  "..",
  "..",
  "Social Media Management",
  "To Be Released",
  "2026-10-02-4",
);
const MASTER = path.join(ROOT, "out", "youtube", "l1", "l1-master.mp4");
const MIX = path.join(ROOT, "assets", "youtube", "l1", "mix.wav");
const VIDEO = path.join(FOLDER, "media", "video.mp4");
const QA_DIR = path.join(ROOT, "out", "youtube", "l1", "qa-final");
const FPS = 30;
const MAX_BYTES = 280 * 1000 * 1000;

function run(cmd: string, args: string[]): string {
  const res = spawnSync(cmd, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0) {
    throw new Error(
      `${cmd} failed (${res.status}):\n${(res.stderr ?? "").slice(-3000)}`,
    );
  }
  return `${res.stdout ?? ""}${res.stderr ?? ""}`;
}

function probe(file: string): {
  format: { duration: string; size: string; bit_rate: string };
  streams: Record<string, string | number>[];
} {
  return JSON.parse(
    run("ffprobe", [
      "-v",
      "error",
      "-show_format",
      "-show_streams",
      "-of",
      "json",
      file,
    ]),
  );
}

async function render(): Promise<void> {
  console.log("render: bundling src/youtube/index.ts");
  const serveUrl = await bundle({
    entryPoint: path.join(ROOT, "src", "youtube", "index.ts"),
    outDir: path.join(ROOT, "out", "youtube", "bundle"),
    publicDir: path.join(ROOT, "assets"),
    rspack: true,
    symlinkPublicDir: true,
  });
  const inputProps = { withAudio: false };
  const composition = await selectComposition({
    serveUrl,
    id: "YouTubeL1",
    inputProps,
  });
  fs.mkdirSync(path.dirname(MASTER), { recursive: true });
  let last = -1;
  const started = Date.now();
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 14,
    muted: true,
    imageFormat: "jpeg",
    jpegQuality: 95,
    outputLocation: MASTER,
    inputProps,
    concurrency: Math.max(2, Math.min(10, os.cpus().length - 4)),
    logLevel: "error",
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 100);
      if (pct >= last + 5) {
        last = pct;
        console.log(
          `render: ${pct}% (${Math.round((Date.now() - started) / 1000)} s)`,
        );
      }
    },
  });
  console.log(`render: wrote ${path.relative(ROOT, MASTER)}`);
}

function encode(): void {
  const v = probe(MASTER).streams.find((s) => s.codec_type === "video");
  if (!v) throw new Error("master has no video stream");
  const frames = Number(v.nb_frames);
  if (frames !== L1_TOTAL_FRAMES) {
    throw new Error(
      `master has ${frames} frames, the timeline ${L1_TOTAL_FRAMES}`,
    );
  }
  const range = String(v.color_range ?? "");
  const inRange =
    /pc|full/.test(range) || String(v.pix_fmt).startsWith("yuvj")
      ? "full"
      : "limited";
  const matrixRaw = String(v.color_space ?? "");
  const inMatrix = ["", "unknown", "N/A", "reserved", "undefined"].includes(
    matrixRaw,
  )
    ? "bt709"
    : matrixRaw;
  const seconds = (frames / FPS).toFixed(6);
  fs.mkdirSync(path.dirname(VIDEO), { recursive: true });
  const filter =
    `[0:v]scale=in_range=${inRange}:out_range=limited:in_color_matrix=${inMatrix}:out_color_matrix=bt709,format=yuv420p[v];` +
    `[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,apad,atrim=0:${seconds},asetpts=N/SR/TB[a]`;
  console.log(
    `encode: master ${inRange} range, ${inMatrix} matrix -> limited bt709`,
  );
  run("ffmpeg", [
    "-hide_banner",
    "-y",
    "-i",
    MASTER,
    "-i",
    MIX,
    "-filter_complex",
    filter,
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-level",
    "4.1",
    "-preset",
    "slow",
    "-crf",
    "20",
    "-maxrate",
    "3500k",
    "-bufsize",
    "7000k",
    "-r",
    "30",
    "-g",
    "60",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-colorspace",
    "bt709",
    "-color_range",
    "tv",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-movflags",
    "+faststart",
    VIDEO,
  ]);
  console.log(`encode: wrote ${VIDEO}`);
}

function check(): void {
  const p = probe(VIDEO);
  const bytes = Number(p.format.size);
  console.log(`check: ${VIDEO}`);
  console.log(
    `  duration ${Number(p.format.duration).toFixed(3)} s, ${bytes} bytes (${(bytes / 1e6).toFixed(1)} MB), ${Math.round(Number(p.format.bit_rate) / 1000)} kbps overall`,
  );
  for (const s of p.streams) {
    if (s.codec_type === "video") {
      console.log(
        `  video ${s.codec_name} ${s.profile} ${s.width}x${s.height} ${s.r_frame_rate} ${s.pix_fmt} ${s.color_range}/${s.color_space}, ${s.nb_frames} frames, ${Math.round(Number(s.bit_rate) / 1000)} kbps`,
      );
    } else if (s.codec_type === "audio") {
      console.log(
        `  audio ${s.codec_name} ${s.sample_rate} Hz ${s.channels} ch ${Math.round(Number(s.bit_rate) / 1000)} kbps`,
      );
    }
  }
  const loud = verifyLoudness(VIDEO);
  console.log(
    `  loudness ${loud.integrated} LUFS integrated, ${loud.truePeak} dBTP, LRA ${loud.lra}`,
  );
  const problems = [
    bytes > MAX_BYTES ? `over 280 MB` : "",
    loud.truePeak > -1 ? `true peak ${loud.truePeak} dBTP is over -1` : "",
    Math.abs(loud.integrated + 14) > 0.5
      ? `loudness ${loud.integrated} LUFS is off -14`
      : "",
  ].filter(Boolean);
  if (problems.length) throw new Error(`check failed: ${problems.join("; ")}`);
  console.log("  check passed");
}

async function qa(): Promise<void> {
  fs.mkdirSync(QA_DIR, { recursive: true });
  const at = (beat: number, t: number) =>
    (slotOf(beat).from + Math.round(t * FPS)) / FPS;
  const stills = [
    {
      name: "hook",
      what: "Hook: test page, Tab pressed, labeled",
      sec: at(1, cue(1, "Tab") + 1.85),
    },
    {
      name: "b6-mark",
      what: "Beat 6: invisible focus, marked",
      sec: at(6, cue(6, "invisible") + 0.5),
    },
    {
      name: "b8-menu",
      what: "Beat 8: menu open, focus on Close menu",
      sec: at(8, cue(8, "The menu opens") + 0.3),
    },
    {
      name: "safari",
      what: "Safari, redrawn for clarity",
      sec: at(4, cue(4, "Advanced") + 0.6),
    },
    {
      name: "b11-checklist",
      what: "Beat 11: the five asks",
      sec: at(11, cue(11, "Three") + 0.6),
    },
    { name: "end-screen", what: "End screen", sec: at(13, 3) },
  ];
  const tiles = stills.map((s, i) => {
    const file = path.join(
      QA_DIR,
      `${String(i + 1).padStart(2, "0")}-${s.name}.png`,
    );
    // Accurate seek: -ss after -i decodes to the exact frame.
    run("ffmpeg", [
      "-hide_banner",
      "-y",
      "-i",
      VIDEO,
      "-ss",
      s.sec.toFixed(3),
      "-frames:v",
      "1",
      file,
    ]);
    console.log(`qa: ${path.basename(file)} at ${s.sec.toFixed(2)} s`);
    return { file, what: `${s.what} (${s.sec.toFixed(1)} s)` };
  });
  const sheet = await contactSheet({
    title: "L1 final: stills from media/video.mp4",
    subtitle: "Pulled from the encoded delivery file with ffmpeg",
    tiles,
    out: path.join(QA_DIR, "contact-qa-final.png"),
  });
  console.log(`qa: ${path.relative(ROOT, sheet)}`);
}

async function main(): Promise<void> {
  const steps = process.argv.slice(2);
  const all = steps.length === 0;
  if (all || steps.includes("render")) await render();
  if (all || steps.includes("encode")) encode();
  if (all || steps.includes("check")) check();
  if (all || steps.includes("qa")) await qa();
}

main().catch((err) => {
  console.error(
    err instanceof Error ? (err.stack ?? err.message) : String(err),
  );
  process.exit(1);
});
