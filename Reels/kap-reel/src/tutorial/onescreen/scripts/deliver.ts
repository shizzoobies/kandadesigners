/**
 * Delivers the one screen, one decision reel into its social day folder.
 *
 *   node node_modules/@remotion/cli/remotion-cli.js render <bundle> TutorialOnescreenVertical out/render-tutorial-onescreen-v3-vertical.mp4
 *   node node_modules/tsx/dist/cli.mjs src/tutorial/onescreen/scripts/deliver.ts [--to <day folder>]
 *
 * Built from the pieces scripts/deliver-tutorial-short.ts uses, so nothing is
 * done differently where it does not have to be:
 *
 *   1. Encodes the render through scripts/encode.sh (deliver.ts's
 *      encodeTarget), muxing assets/audio/mix-tut-onescreen-15s-v3.wav.
 *   2. Writes the SRT with scripts/srt.ts's renderSrt and validateTarget. One
 *      cue per caption card, on the frames the card is on screen; the text is
 *      the narration with its audio tags stripped (content.ts never had any),
 *      except the end card, whose spoken url is written as it is typed.
 *   3. The thumbnail: the frame the hazard hunt's ladder is about to be
 *      tapped, one real screen with a single clear action on it. A plain
 *      frame, no lockup plate: the plate deliver.ts draws would sit on the
 *      device.
 *   4. Three stills for review: the hook, a one decision screen, the end card,
 *      to out/candidates/onescreen-frame-*.png.
 *   5. With --to, copies reel-vertical.mp4, reel-vertical.srt and
 *      thumbnail.jpg into <folder>/media/.
 *
 * Every string that reaches a frame or a file is scanned for an em dash.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ffmpeg } from "../../../../scripts/audio.js";
import { encodeTarget, type DeliveryTarget } from "../../../../scripts/deliver.js";
import { renderSrt, validateTarget, type CueRow, type ReelKey, type SrtTarget } from "../../../../scripts/srt.js";
import { tutorialStrings } from "../../types.js";
import { beatProps, CTA_URL, CTA_WRITTEN, ONESCREEN_TUTORIAL } from "../content.js";
import { onescreenTimeline } from "../layout.js";
import { wordFrame } from "../words.js";
import captures from "../captures.json";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const RENDER = "out/render-tutorial-onescreen-v3-vertical.mp4";
const OUTPUT = "out/kap-tut-onescreen-v3-vertical.mp4";
const MIX = "assets/audio/mix-tut-onescreen-15s-v3.wav";
const EM_DASH = String.fromCharCode(0x2014);

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
}

function frameTo(frame: number, dest: string): void {
  const ext = path.extname(dest).toLowerCase();
  const res = ffmpeg([
    "-i", path.join(ROOT, RENDER),
    "-vf", `select=eq(n\\,${frame})`,
    "-fps_mode", "passthrough",
    "-frames:v", "1",
    ...(ext === ".jpg" ? ["-q:v", "2"] : []),
    "-y", dest,
  ]);
  if (res.code !== 0) throw new Error(`frame ${frame} failed:\n${res.stderr.slice(-1500)}`);
  console.log(`  frame ${frame} -> ${path.relative(ROOT, dest)}`);
}

function main(argv: string[]): void {
  const timeline = onescreenTimeline();
  if (timeline.estimated.length) throw new Error(`no kept read for ${timeline.estimated.join(", ")}.`);
  const byId = Object.fromEntries(timeline.entries.map((e) => [e.beat.id, e]));

  // Nothing with an em dash leaves this script.
  const strings = [...tutorialStrings(ONESCREEN_TUTORIAL), CTA_WRITTEN, CTA_URL];
  for (const beat of ONESCREEN_TUTORIAL.beats.short) strings.push(...beatProps(beat).captions.flatMap((c) => c.lines));
  const dashed = strings.filter((s) => s.includes(EM_DASH));
  if (dashed.length) throw new Error(`em dash in: ${dashed.join(" | ")}`);

  // 1. Encode.
  const target: DeliveryTarget = {
    format: "vertical",
    duration: "15s",
    input: RENDER,
    output: OUTPUT,
    frames: timeline.totalFrames,
    canvas: "1080x1920",
  };
  if (!fs.existsSync(path.join(ROOT, MIX))) throw new Error(`${MIX} is missing. Run voice.ts mix.`);
  if (!encodeTarget(target, () => path.join(ROOT, MIX))) throw new Error("encode failed or was skipped.");

  // 2. Captions: one cue per caption card, the hook and the end card whole.
  const rows: CueRow[] = [];
  for (const entry of timeline.entries) {
    const src = `onescreen/${entry.beat.id}`;
    if (entry.kind === "hook") {
      rows.push({ text: entry.beat.narration, start: entry.start, end: entry.end, source: src });
    } else if (entry.kind === "cta") {
      rows.push({ text: CTA_WRITTEN, start: entry.start, end: entry.end, source: src });
    } else {
      const words = entry.beat.narration.split(/\s+/);
      const phases = beatProps(entry.beat).captions;
      const frames = entry.end - entry.start;
      phases.forEach((p, i) => {
        const next = phases[i + 1];
        const start = entry.start + (p.from === 0 ? 0 : wordFrame(entry.beat, p.from, frames));
        const end = next ? entry.start + wordFrame(entry.beat, next.from, frames) : entry.end;
        const text = words.slice(p.from, next ? next.from : undefined).join(" ");
        rows.push({ text, start, end, source: src });
      });
    }
  }
  const srtTarget: SrtTarget = {
    format: "vertical",
    duration: "15s",
    rows,
    totalFrames: timeline.totalFrames,
    reel: "tutorial-onescreen" as ReelKey,
  };
  const problems = validateTarget(srtTarget);
  if (problems.length) throw new Error(problems.map((p) => p.message).join("\n"));
  const srt = path.join(ROOT, "out", "kap-tut-onescreen-v3-vertical.srt");
  fs.writeFileSync(srt, renderSrt(rows), "utf8");
  if (/\[[^\]]*\]/.test(fs.readFileSync(srt, "utf8"))) throw new Error("an audio tag reached the SRT.");
  console.log(`wrote ${path.relative(ROOT, srt)} (${rows.length} cues)`);

  // 3. Thumbnail: three frames before the ladder is tapped.
  const decide = byId.decide;
  const tapFrame = decide.start + wordFrame(decide.beat, 8, decide.end - decide.start);
  const thumb = path.join(ROOT, "out", "thumbnail-tutorial-onescreen-v3-vertical.jpg");
  frameTo(tapFrame - 3, thumb);

  // 4. Review stills.
  const stills = path.join(ROOT, "out", "candidates");
  fs.mkdirSync(stills, { recursive: true });
  frameTo(Math.round(byId.hook.start + 30), path.join(stills, "onescreen-frame-hook.png"));
  frameTo(tapFrame - 3, path.join(stills, "onescreen-frame-decision.png"));
  frameTo(byId.cta.end - 10, path.join(stills, "onescreen-frame-cta.png"));

  // 5. Copy.
  const to = flag(argv, "to");
  if (to) {
    const dest = path.join(path.resolve(to), "media");
    fs.mkdirSync(dest, { recursive: true });
    for (const [from, name] of [
      [path.join(ROOT, OUTPUT), "reel-vertical.mp4"],
      [srt, "reel-vertical.srt"],
      [thumb, "thumbnail.jpg"],
    ] as const) {
      fs.copyFileSync(from, path.join(dest, name));
      console.log(`copied ${name} to ${dest}`);
    }
  }
  console.log(`${timeline.totalFrames} frames, ${(timeline.totalFrames / 30).toFixed(2)}s. Captured ${captures.capturedAt}.`);
}

try {
  main(process.argv.slice(2));
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
