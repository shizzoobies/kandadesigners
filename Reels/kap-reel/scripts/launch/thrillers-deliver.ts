/**
 * scripts/launch/thrillers-deliver.ts
 *
 * Delivers the Thrillers Mobile VR launch reel into its day folder, from the
 * same pieces the showcase delivery uses:
 *
 *   1. Mix: out/candidates/music-i-a.mp3, full mix, no voice and no SFX,
 *      trimmed to 15 s with the showcase's 0.4 s tail fade, through the
 *      solved limiter ceiling and the two pass dynamic loudnorm from
 *      scripts/audio.ts (-14 LUFS, -1.5 dBTP in the wav), verified and, if
 *      needed, corrected. Writes assets/audio/mix-thrillers-launch-15s.wav.
 *   2. Encode: out/render-launch-thrillers-vertical-15s.mp4 through
 *      scripts/encode.sh with that mix (deliver.ts encodeTarget).
 *   3. Captions: the on-screen text cues from src/launch/thrillers.ts, through
 *      scripts/srt.ts renderSrt, checked for em dashes.
 *   4. Thumbnail: deliver.ts thumbnail() at LAUNCH_STILLS.thumbnail, the home
 *      capture in the device frame.
 *   5. Copies reel-vertical.mp4, reel-vertical.srt and thumbnail.jpg into the
 *      day folder's media/.
 *
 * Render first, from D:\kap-reel:
 *   node node_modules/@remotion/cli/remotion-cli.js render src/index.ts \
 *     LaunchThrillersVertical out/render-launch-thrillers-vertical-15s.mp4
 * then:
 *   node node_modules/tsx/dist/cli.mjs scripts/launch/thrillers-deliver.ts
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
} from "../audio.js";
import { SAFE_VERTICAL, encodeTarget, thumbnail, type DeliveryTarget } from "../deliver.js";
import { renderSrt } from "../srt.js";
import { LAUNCH_STILLS, LAUNCH_TOTAL_FRAMES, launchCueRows } from "../../src/launch/thrillers.js";

const ROOT = process.cwd();
const DAY_MEDIA = path.resolve(
  ROOT,
  "..",
  "..",
  "Social Media Management",
  "To Be Released",
  "2026-10-02",
  "media",
);
const MUSIC = path.join(ROOT, "out", "candidates", "music-i-a.mp3");
const MIX = path.join(ROOT, "assets", "audio", "mix-thrillers-launch-15s.wav");
const RENDER = "out/render-launch-thrillers-vertical-15s.mp4";
const DELIVERY = "out/launch-thrillers-vertical-15s.mp4";
const SRT = path.join(ROOT, "out", "launch-thrillers-vertical-15s.srt");
const THUMB = path.join(ROOT, "out", "thumbnail-launch-thrillers-vertical.jpg");

const SECONDS = LAUNCH_TOTAL_FRAMES / 30;
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

async function main(): Promise<void> {
  if (!fs.existsSync(path.join(ROOT, "package.json"))) throw new Error("Run from D:\\kap-reel.");
  if (!fs.existsSync(path.join(ROOT, RENDER))) throw new Error(`${RENDER} is missing. Render first.`);

  mix();

  const target: DeliveryTarget = {
    format: "vertical",
    duration: "15s",
    input: RENDER,
    output: DELIVERY,
    frames: LAUNCH_TOTAL_FRAMES,
    canvas: "1080x1920",
  };
  if (!encodeTarget(target, () => MIX)) throw new Error("encode failed");

  const srt = renderSrt(launchCueRows());
  if (srt.includes(String.fromCharCode(0x2014))) throw new Error("em dash in the SRT");
  fs.writeFileSync(SRT, srt, "utf8");
  console.log(`wrote ${path.relative(ROOT, SRT)}`);

  const scratch = path.join(ROOT, "out", ".thrillers-thumb-scratch.png");
  await thumbnail(path.join(ROOT, RENDER), LAUNCH_STILLS.thumbnail, SAFE_VERTICAL, THUMB, scratch);
  if (fs.existsSync(scratch)) fs.unlinkSync(scratch);

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
