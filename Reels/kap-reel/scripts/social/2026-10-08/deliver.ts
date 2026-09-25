/**
 * scripts/social/2026-10-08/deliver.ts
 *
 * Delivers the Thu 2026-10-08 reel "AI drafts, you decide." (tracked changes
 * on a reply document, text led, no narration), following the 2026-10-01 script:
 *
 *   0. Checks every AI line in src/social/2026-10-08/content.ts against the day
 *      folder source/ai-run.md: the draft there must equal AI_FULL exactly.
 *   1. Mix: out/candidates/music-w1008-r.mp3 (its own new bed), no voice, no
 *      SFX, trimmed to the cut with a 1.0 s tail fade, limiter ceiling solved
 *      and two pass loudnorm from scripts/audio.ts (-14 LUFS), verified.
 *   2. Encode: the render through scripts/encode.sh with that mix.
 *   3. Captions: the on-screen text cues from content.ts.
 *   4. Thumbnail: the TrackedDraftThumb still, converted to JPG.
 *   5. Copies reel-vertical.mp4, reel-vertical.srt and thumbnail.jpg into the
 *      day folder media/.
 *
 * From D:kap-reel, render first:
 *   node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-10-08/index.ts TrackedDraftVertical out/social/2026-10-08/render.mp4 --concurrency 3
 *   node node_modules/@remotion/cli/remotion-cli.js still src/social/2026-10-08/index.ts TrackedDraftThumb out/social/2026-10-08/thumb.png
 * then:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-08/deliver.ts
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
import { AI_FULL, FPS, TOTAL_FRAMES, cueRows } from "../../../src/social/2026-10-08/content.js";

const ROOT = process.cwd();
const DAY_MEDIA = "D:/K & A Performance Site/Social Media Management/To Be Released/2026-10-08/media";
const OUT = path.join(ROOT, "out", "social", "2026-10-08");
const MUSIC = path.join(ROOT, "out", "candidates", "music-w1008-r.mp3");
const MIX = path.join(OUT, "mix.wav");
const RENDER = "out/social/2026-10-08/render.mp4";
const DELIVERY = "out/social/2026-10-08/reel-vertical.mp4";
const SRT = path.join(OUT, "reel-vertical.srt");
const THUMB_PNG = path.join(OUT, "thumb.png");
const THUMB = path.join(OUT, "thumbnail.jpg");

const SECONDS = TOTAL_FRAMES / FPS;
const FADE = 1.0;

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
  if (!fs.existsSync(path.join(ROOT, "package.json"))) throw new Error("Run from D:\kap-reel.");
  if (!fs.existsSync(path.join(ROOT, RENDER))) throw new Error(`${RENDER} is missing. Render first.`);
  if (!fs.existsSync(THUMB_PNG)) throw new Error(`${THUMB_PNG} is missing. Render the still first.`);

  const run = fs.readFileSync(path.join(DAY_MEDIA, "..", "source", "ai-run.md"), "utf8").replace(/\r\n/g, "\n");
  const out = /## Output, verbatim[^\n]*\n\n```\n([\s\S]*?)\n```/.exec(run)?.[1];
  if (out !== AI_FULL) throw new Error("content.ts AI text does not match source/ai-run.md word for word");
  console.log("AI text matches source/ai-run.md word for word");

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
  if (jpg.code !== 0) throw new Error(`thumbnail failed:\n${jpg.stderr.slice(-2000)}`);

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
