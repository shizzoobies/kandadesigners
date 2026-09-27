/**
 * scripts/social/2026-09-27-3/deliver.ts
 *
 * Delivers the Sun 2026-09-27 7:30 PM LinkedIn video, "ADDIE got a G"
 * (training): 1080x1350, text led, no narration, music bed music-w0927-li
 * only. A copy of scripts/social/2026-10-09/deliver.ts without the SRT (the
 * LinkedIn post carries no captions file); shared pieces are imported
 * read-only.
 *
 *   1. Mix: out/candidates/music-w0927-li.mp3, trimmed to the video with a
 *      0.8 s tail fade, limiter plus two pass loudnorm to -14 LUFS, verified.
 *   2. Encode: scripts/encode.sh with that mix (H.264, AAC, yuv420p, faststart).
 *   3. Thumbnail: one frame of the delivered MP4, the D tile mid-flip to G.
 *   4. Copies video.mp4 and thumbnail.jpg to the day folder's media/.
 *
 * Render first, from D:kap-reel:
 *   node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-09-27-3/index.ts \
 *     Social0927AdgieFeed out/social/2026-09-27-3/render-feed.mp4 --concurrency 3
 * then:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-09-27-3/deliver.ts
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
import { THUMB_FRAME, TOTAL_FRAMES } from "../../../src/social/2026-09-27-3/timeline.js";

const ROOT = process.cwd();
const DAY = "D:\\K & A Performance Site\\Social Media Management\\To Be Released\\2026-09-27-3";
const DAY_MEDIA = path.join(DAY, "media");
const OUT = path.join(ROOT, "out", "social", "2026-09-27-3");
const MUSIC = path.join(ROOT, "out", "candidates", "music-w0927-li.mp3");
const MIX = path.join(OUT, "mix-30s.wav");
const RENDER = "out/social/2026-09-27-3/render-feed.mp4";
const DELIVERY = "out/social/2026-09-27-3/video.mp4";
const THUMB = path.join(OUT, "thumbnail.jpg");

const SECONDS = TOTAL_FRAMES / 30;
const FADE = 0.8;

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
    format: "feed",
    duration: "45s",
    input: RENDER,
    output: DELIVERY,
    frames: TOTAL_FRAMES,
    canvas: "1080x1350",
  };
  if (!encodeTarget(target, () => MIX)) throw new Error("encode failed");

  const thumb = ffmpeg([
    "-i", path.join(ROOT, DELIVERY),
    "-vf", `select=eq(n\\,${THUMB_FRAME})`,
    "-fps_mode", "passthrough", "-frames:v", "1", "-q:v", "2", "-y", THUMB,
  ]);
  if (thumb.code !== 0) throw new Error(`thumbnail failed:\n${thumb.stderr.slice(-2000)}`);
  console.log(`thumbnail: frame ${THUMB_FRAME}`);

  fs.mkdirSync(DAY_MEDIA, { recursive: true });
  for (const [from, name] of [
    [path.join(ROOT, DELIVERY), "video.mp4"],
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
