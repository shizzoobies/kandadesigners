/**
 * scripts/social/2026-09-30/deliver.ts
 *
 * Delivers the Wednesday 2026-09-30 reel, "One screen, one decision",
 * revision 2 (text led, no narration), into its day folder. Same pieces as
 * scripts/launch/thrillers-deliver.ts:
 *
 *   1. Mix: out/candidates/music-i-c.mp3 (licensed), no voice, no SFX, trimmed
 *      to the reel with a 0.4 s tail fade, through the solved limiter ceiling
 *      and two pass loudnorm from scripts/audio.ts (-14 LUFS).
 *   2. Encode: out/social/2026-09-30/render.mp4 through scripts/encode.sh.
 *   3. Captions: the on-screen text cues from src/social/2026-09-30/beats.ts.
 *   4. Thumbnail: a plain frame of the hook. The logo and url are already on
 *      every frame, so no lockup plate is drawn over it.
 *   5. Copies reel-vertical.mp4, reel-vertical.srt and thumbnail.jpg into the
 *      day folder's media/.
 *
 * Render first, from D:\kap-reel:
 *   node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-09-30/index.ts \
 *     Wed0930OneScreen out/social/2026-09-30/render.mp4 --concurrency 3
 * then:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-09-30/deliver.ts
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
import { TOTAL_FRAMES, allStrings, cueRows } from "../../../src/social/2026-09-30/beats.js";

const ROOT = process.cwd();
const DAY_MEDIA = "D:\\K & A Performance Site\\Social Media Management\\To Be Released\\2026-09-30\\media";
const OUT = path.join(ROOT, "out", "social", "2026-09-30");
const MUSIC = path.join(ROOT, "out", "candidates", "music-i-c.mp3");
const MIX = path.join(OUT, "mix.wav");
const RENDER = "out/social/2026-09-30/render.mp4";
const DELIVERY = "out/social/2026-09-30/reel-vertical.mp4";
const SRT = path.join(OUT, "reel-vertical.srt");
const THUMB = path.join(OUT, "thumbnail.jpg");
const THUMB_FRAME = 60;

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

async function main(): Promise<void> {
  if (!fs.existsSync(path.join(ROOT, "package.json"))) throw new Error("Run from D:\\kap-reel.");
  if (!fs.existsSync(path.join(ROOT, RENDER))) throw new Error(`${RENDER} is missing. Render first.`);
  const dashed = allStrings().filter((s) => s.includes(EM_DASH));
  if (dashed.length) throw new Error(`em dash in: ${dashed.join(" | ")}`);

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

  const res = ffmpeg([
    "-i", path.join(ROOT, DELIVERY),
    "-vf", `select=eq(n\\,${THUMB_FRAME})`,
    "-fps_mode", "passthrough",
    "-frames:v", "1",
    "-q:v", "2",
    "-y", THUMB,
  ]);
  if (res.code !== 0) throw new Error(`thumbnail failed:\n${res.stderr.slice(-1500)}`);
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

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
