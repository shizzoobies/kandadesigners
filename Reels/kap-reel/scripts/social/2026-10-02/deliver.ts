/**
 * scripts/social/2026-10-02/deliver.ts
 *
 * Delivers the Friday 2026-10-02 Thrillers Mobile VR launch reel, revision 2,
 * into its day folder. Same pieces as scripts/launch/thrillers-deliver.ts,
 * imported read-only:
 *
 *   1. Mix: out/candidates/music-i-a.mp3, music only, trimmed to 15 s with a
 *      0.4 s tail fade, through the solved limiter ceiling and the two pass
 *      loudnorm from scripts/audio.ts (-14 LUFS), verified and corrected.
 *   2. Encode: the render through scripts/encode.sh with that mix.
 *   3. Captions: the on-screen text cues from src/social/2026-10-02/timeline.ts
 *      through scripts/srt.ts renderSrt, checked for em dashes.
 *   4. Thumbnail: the Social1002ThrillersThumb still, converted to JPG.
 *   5. Copies reel-vertical.mp4, reel-vertical.srt and thumbnail.jpg into the
 *      day folder's media/.
 *
 * Render first, from D:\kap-reel:
 *   node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-10-02/index.ts \
 *     Social1002ThrillersVertical out/social/2026-10-02/render-vertical.mp4 --concurrency 3
 *   node node_modules/@remotion/cli/remotion-cli.js still src/social/2026-10-02/index.ts \
 *     Social1002ThrillersThumb out/social/2026-10-02/thumbnail.png
 * then:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-02/deliver.ts
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
import { TOTAL_FRAMES, cueRows } from "../../../src/social/2026-10-02/timeline.js";

const ROOT = process.cwd();
const DAY_MEDIA = path.resolve(
  "D:/K & A Performance Site/Social Media Management/To Be Released/2026-10-02/media",
);
const OUT = path.join(ROOT, "out", "social", "2026-10-02");
const MUSIC = path.join(ROOT, "out", "candidates", "music-i-a.mp3");
const MIX = path.join(OUT, "mix-15s.wav");
const RENDER = "out/social/2026-10-02/render-vertical.mp4";
const DELIVERY = "out/social/2026-10-02/reel-vertical.mp4";
const SRT = path.join(OUT, "reel-vertical.srt");
const THUMB_PNG = path.join(OUT, "thumbnail.png");
const THUMB = path.join(OUT, "thumbnail.jpg");

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

function main(): void {
  if (!fs.existsSync(path.join(ROOT, "package.json"))) throw new Error("Run from D:\kap-reel.");
  if (!fs.existsSync(path.join(ROOT, RENDER))) throw new Error(`${RENDER} is missing. Render first.`);
  if (!fs.existsSync(THUMB_PNG)) throw new Error(`${THUMB_PNG} is missing. Render the still first.`);
  if (!fs.existsSync(path.dirname(DAY_MEDIA))) throw new Error(`Day folder not found: ${path.dirname(DAY_MEDIA)}`);

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

  const jpg = ffmpeg(["-i", THUMB_PNG, "-q:v", "2", "-y", THUMB]);
  if (jpg.code !== 0) throw new Error(`thumbnail jpg failed:\n${jpg.stderr.slice(-1000)}`);

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
