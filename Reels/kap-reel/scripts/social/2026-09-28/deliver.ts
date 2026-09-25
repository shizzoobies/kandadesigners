/**
 * scripts/social/2026-09-28/deliver.ts
 *
 * Delivers the Ellenton Family Practice Direct top three reel (revision 2)
 * into its day folder, following scripts/launch/thrillers-deliver.ts:
 *
 *   1. Mix: out/candidates/music-i-c.mp3 (bed C, licensed), no voice, no SFX,
 *      trimmed to 15 s with a 0.4 s tail fade, through the solved limiter
 *      ceiling and two pass loudnorm from scripts/audio.ts (-14 LUFS).
 *   2. Encode: the render through scripts/encode.sh with that mix.
 *   3. Captions: on-screen text cues from src/social/2026-09-28/ellenton.ts
 *      through scripts/srt.ts renderSrt, checked for em dashes.
 *   4. Thumbnail: the hook frame straight from the delivered picture. The K&A
 *      header and the url footer are already in every frame, so no lockup
 *      plate is added.
 *   5. Copies reel-vertical.mp4, reel-vertical.srt and thumbnail.jpg into the
 *      day folder's media/.
 *
 * From D:\kap-reel:
 *   node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-09-28/index.ts \
 *     EllentonTopThree out/social/2026-09-28/render-ellenton-vertical-15s.mp4 --concurrency 3
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-09-28/deliver.ts
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
import { THUMBNAIL_FRAME, TOTAL_FRAMES, cueRows } from "../../../src/social/2026-09-28/ellenton.js";

const ROOT = process.cwd();
const DAY_MEDIA = "D:/K & A Performance Site/Social Media Management/To Be Released/2026-09-28/media";
const OUT = "out/social/2026-09-28";
const MUSIC = path.join(ROOT, "out", "candidates", "music-i-c.mp3");
const MIX = path.join(ROOT, OUT, "mix-ellenton-15s.wav");
const RENDER = `${OUT}/render-ellenton-vertical-15s.mp4`;
const DELIVERY = `${OUT}/ellenton-vertical-15s.mp4`;
const SRT = path.join(ROOT, OUT, "ellenton-vertical-15s.srt");
const THUMB = path.join(ROOT, OUT, "thumbnail-ellenton-vertical.jpg");

const SECONDS = TOTAL_FRAMES / 30;
const FADE = 0.4;

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

function thumbnail(): void {
  const res = ffmpeg([
    "-i", path.join(ROOT, DELIVERY),
    "-vf", `select=eq(n\\,${THUMBNAIL_FRAME})`,
    "-fps_mode", "passthrough",
    "-frames:v", "1",
    "-q:v", "2",
    "-y", THUMB,
  ]);
  if (res.code !== 0) throw new Error(`thumbnail failed:\n${res.stderr.slice(-1500)}`);
  console.log(`wrote ${path.relative(ROOT, THUMB)} (frame ${THUMBNAIL_FRAME})`);
}

async function main(): Promise<void> {
  if (!fs.existsSync(path.join(ROOT, "package.json"))) throw new Error("Run from D:\\kap-reel.");
  if (!fs.existsSync(path.join(ROOT, RENDER))) throw new Error(`${RENDER} is missing. Render first.`);

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
  if (srt.includes(String.fromCharCode(0x2014))) throw new Error("em dash in the SRT");
  fs.writeFileSync(SRT, srt, "utf8");
  console.log(`wrote ${path.relative(ROOT, SRT)}`);

  thumbnail();

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

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
