/**
 * scripts/social/2026-09-29/deliver.ts
 *
 * Delivers the Tuesday 2026-09-29 reel, "Contrast is not a vibe", revision 2:
 * text led, no narration, music bed only. Same pieces as
 * scripts/launch/thrillers-deliver.ts, imported read-only.
 *
 *   1. Ratios: writes source/contrast-ratios.md in the day folder, every pair
 *      the reel shows, computed with src/lib/contrast.ts (WCAG 2.x).
 *   2. Mix: out/candidates/music-i-b.mp3, trimmed to the reel with a 0.4 s
 *      tail fade, limiter plus two pass loudnorm to -14 LUFS, verified.
 *   3. Encode: scripts/encode.sh with that mix.
 *   4. Captions: the on-screen text cues from src/social/2026-09-29/timeline.ts.
 *   5. Thumbnail: one frame of the delivered MP4 (the brand row is in every
 *      frame, so nothing is composited).
 *   6. Copies reel-vertical.mp4, reel-vertical.srt, thumbnail.jpg to media/.
 *
 * Render first, from D:\kap-reel:
 *   node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-09-29/index.ts \
 *     Social0929ContrastVertical out/social/2026-09-29/render-vertical.mp4 --concurrency 3
 * then:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-09-29/deliver.ts
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
import { COLORS } from "../../../src/lib/brand.js";
import { AA_LARGE, AA_NORMAL, contrastRatio, formatRatio, passesAA, relativeLuminance } from "../../../src/lib/contrast.js";
import { PAIRS } from "../../../src/social/2026-09-29/ratios.js";
import { THUMB_FRAME, TOTAL_FRAMES, cueRows } from "../../../src/social/2026-09-29/timeline.js";

const ROOT = process.cwd();
const DAY = "D:\\K & A Performance Site\\Social Media Management\\To Be Released\\2026-09-29";
const DAY_MEDIA = path.join(DAY, "media");
const DAY_SOURCE = path.join(DAY, "source");
const OUT = path.join(ROOT, "out", "social", "2026-09-29");
const MUSIC = path.join(ROOT, "out", "candidates", "music-i-b.mp3");
const MIX = path.join(OUT, "mix-18s.wav");
const RENDER = "out/social/2026-09-29/render-vertical.mp4";
const DELIVERY = "out/social/2026-09-29/reel-vertical.mp4";
const SRT = path.join(OUT, "reel-vertical.srt");
const THUMB = path.join(OUT, "thumbnail.jpg");

const SECONDS = TOTAL_FRAMES / 30;
const FADE = 0.4;
const EM_DASH = String.fromCharCode(0x2014);

function ratiosMarkdown(): string {
  const names: Record<string, string> = {
    [COLORS.canvas]: "cream (canvas)",
    [COLORS.amber]: "amber",
    [COLORS.accent]: "rust (accent)",
    [COLORS.ink]: "ink",
  };
  const lines: string[] = [
    "# Contrast ratios, 2026-09-29 reel (revision 2)",
    "",
    "Computed by scripts/social/2026-09-29/deliver.ts with src/lib/contrast.ts, from the hex",
    "values in D:\\kap-reel\\config\\brand.json. WCAG 2.x (2.1 and 2.2 use the same maths):",
    "",
    "- Channel c = value / 255, linearised: c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ^ 2.4",
    "- Relative luminance L = 0.2126 R + 0.7152 G + 0.0722 B",
    "- Contrast ratio = (L_lighter + 0.05) / (L_darker + 0.05)",
    `- AA: ${AA_NORMAL} : 1 for body text, ${AA_LARGE} : 1 for large text. The reel's pass or fail is against ${AA_NORMAL}.`,
    "",
    "## Relative luminance",
    "",
    "| Color | Hex | L |",
    "|---|---|---|",
  ];
  for (const [hex, name] of Object.entries(names)) {
    lines.push(`| ${name} | ${hex} | ${relativeLuminance(hex).toFixed(5)} |`);
  }
  lines.push("", "## Pairs on screen", "", "| Pair | Text | Background | Ratio (exact) | On screen | AA body text |", "|---|---|---|---|---|---|");
  for (const p of Object.values(PAIRS)) {
    const r = contrastRatio(p.fg, p.bg);
    lines.push(
      `| ${p.label} | ${p.fg} | ${p.bg} | ${r.toFixed(4)} | ${formatRatio(r)} : 1 | ${passesAA(r) ? "passes" : "fails"} |`,
    );
  }
  lines.push(
    "",
    "The brief's figure is confirmed: amber on cream measures " +
      `${formatRatio(contrastRatio(COLORS.amber, COLORS.canvas))} to 1 and fails AA for body text.`,
    "",
    "## The live readout",
    "",
    "While the AFTER panel turns from amber to rust, and while the button fills from cream to",
    "amber, the meter shows contrastRatio() of the two colors actually on screen in that frame",
    "(a straight mix of the 8 bit sRGB channels). So every number the meter passes through is",
    "a real measurement of a real color, and the numbers it lands on are the ones in the table.",
    "The pass or fail label is judged on the one decimal value shown, so the flip happens on the",
    "frame the display first reads 4.5.",
    "",
  );
  return lines.join("\n");
}

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

  const md = ratiosMarkdown();
  if (md.includes(EM_DASH)) throw new Error("em dash in contrast-ratios.md");
  fs.mkdirSync(DAY_SOURCE, { recursive: true });
  fs.writeFileSync(path.join(DAY_SOURCE, "contrast-ratios.md"), md, "utf8");
  console.log("wrote source/contrast-ratios.md");

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
