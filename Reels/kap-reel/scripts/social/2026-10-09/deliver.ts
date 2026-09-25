/**
 * scripts/social/2026-10-09/deliver.ts
 *
 * Delivers the Friday 2026-10-09 reel, "How we plan a week of posts" (behind
 * the scenes): text led, no narration, music bed music-w1009-r only. A copy of
 * scripts/social/2026-10-09/deliver.ts without the contrast table; shared
 * pieces are imported read-only.
 *
 *   1. Mix: out/candidates/music-w1009-r.mp3, trimmed to the reel with a 0.4 s
 *      tail fade, limiter plus two pass loudnorm to -14 LUFS, verified.
 *   2. Encode: scripts/encode.sh with that mix.
 *   3. Captions: the on-screen text cues from src/social/2026-10-09/timeline.ts.
 *   4. Thumbnail: one frame of the delivered MP4.
 *   5. Copies reel-vertical.mp4, reel-vertical.srt, thumbnail.jpg to media/.
 *
 * Render first, from D:kap-reel:
 *   node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-10-09/index.ts  *     Social1009WeekVertical out/social/2026-10-09/render-vertical.mp4 --concurrency 3
 * then:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-09/deliver.ts
 */

import fs from "node:fs";
import path from "node:path";
import {
  AFORMAT,
  LOUDNORM_TARGET,
  correctLoudness,
  ffmpeg,
  headroomCeilingDb,
  limiter,
  parseLoudnorm,
  verifyLoudness,
} from "../../audio.js";
import { encodeTarget, type DeliveryTarget } from "../../deliver.js";
import { renderSrt } from "../../srt.js";
import { THUMB_FRAME, TOTAL_FRAMES, cueRows } from "../../../src/social/2026-10-09/timeline.js";

const ROOT = process.cwd();
const DAY = "D:\\K & A Performance Site\\Social Media Management\\To Be Released\\2026-10-09";
const DAY_MEDIA = path.join(DAY, "media");
const OUT = path.join(ROOT, "out", "social", "2026-10-09");
const MUSIC = path.join(ROOT, "out", "candidates", "music-w1009-r.mp3");
const MIX = path.join(OUT, "mix-20s.wav");
const RENDER = "out/social/2026-10-09/render-vertical.mp4";
const DELIVERY = "out/social/2026-10-09/reel-vertical.mp4";
const SRT = path.join(OUT, "reel-vertical.srt");
const THUMB = path.join(OUT, "thumbnail.jpg");

const SECONDS = TOTAL_FRAMES / 30;
const FADE = 0.4;
const EM_DASH = String.fromCharCode(0x2014);

function mix(): void {
  const inputs = ["-i", MUSIC];
  const graph = (ceiling: number) =>
    `[0:a]atrim=0:${SECONDS},asetpts=N/SR/TB,` +
    `afade=t=out:st=${SECONDS - FADE}:d=${FADE},${AFORMAT}[bed];` +
    `[bed]anull[premix];[premix]${limiter(ceiling)}[mixed]`;

  const { ceilingDb, measurement: m } = headroomCeilingDb(inputs, graph);
  console.log(`mix: limiter ceiling ${ceilingDb} dBFS; pass 1 I ${m.input_i} LUFS, TP ${m.input_tp} dBTP`);
  fs.mkdirSync(path.dirname(MIX), { recursive: true });
  const pass2 = ffmpeg([
    ...inputs,
    "-filter_complex",
    `${graph(ceilingDb)};[mixed]loudnorm=${LOUDNORM_TARGET}:measured_I=${m.input_i}:` +
      `measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:` +
      `offset=${m.target_offset}:linear=false:print_format=json[norm];[norm]${AFORMAT}[out]`,
    "-map", "[out]", "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2", "-y", MIX,
  ]);
  if (pass2.code !== 0) throw new Error(`loudnorm pass 2 failed:\n${pass2.stderr.slice(-2000)}`);
  const predicted = parseLoudnorm(pass2.stderr);
  const verified = correctLoudness(MIX, verifyLoudness(MIX));
  console.log(
    `mix: predicted I ${predicted.output_i}, verified I ${verified.integrated} LUFS, ` +
      `TP ${verified.truePeak} dBTP, LRA ${verified.lra}`,
  );
}

function main(): void {
  if (!fs.existsSync(path.join(ROOT, "package.json"))) throw new Error("Run from D:\\kap-reel.");
  if (!fs.existsSync(path.join(ROOT, RENDER))) throw new Error(`${RENDER} is missing. Render first.`);
  if (!fs.existsSync(DAY)) throw new Error(`day folder missing: ${DAY}`);

  mix();

  const target: DeliveryTarget = {
    format: "vertical",
    duration: "15s",
    input: RENDER,
    output: DELIVERY,
    frames: TOTAL_FRAMES,
    canvas: "1080x1920",
  };
  if (!encodeTarget(target, () => MIX)) throw new Error("encode failed");

  const srt = renderSrt(cueRows());
  if (srt.includes(EM_DASH)) throw new Error("em dash in the SRT");
  fs.writeFileSync(SRT, srt, "utf8");
  console.log(`wrote ${path.relative(ROOT, SRT)}`);

  const thumb = ffmpeg([
    "-i", path.join(ROOT, DELIVERY),
    "-vf", `select=eq(n\\,${THUMB_FRAME})`,
    "-fps_mode", "passthrough", "-frames:v", "1", "-q:v", "2", "-y", THUMB,
  ]);
  if (thumb.code !== 0) throw new Error(`thumbnail failed:\n${thumb.stderr.slice(-2000)}`);
  console.log(`thumbnail: frame ${THUMB_FRAME}`);

  fs.mkdirSync(DAY_MEDIA, { recursive: true });
  for (const [from, name] of [
    [path.join(ROOT, DELIVERY), "reel-vertical.mp4"],
    [SRT, "reel-vertical.srt"],
    [THUMB, "thumbnail.jpg"],
  ] as const) {
    fs.copyFileSync(from, path.join(DAY_MEDIA, name));
    console.log(`copied ${name} to ${DAY_MEDIA}`);
  }
}

try {
  main();
} catch (err: unknown) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
