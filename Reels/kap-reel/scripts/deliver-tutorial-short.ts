/**
 * One tutorial's 15 second vertical cut, delivered on its own.
 *
 *   npx tsx scripts/deliver-tutorial-short.ts --reel tutorial-contrast [--to <dir>]
 *
 * scripts/deliver.ts delivers all six shapes of a tutorial at once. This is the
 * vertical 15 second file alone, for a social day folder that needs only that,
 * built from the same pieces deliver.ts uses so nothing is done differently:
 *
 *   1. Encodes out/render-tutorial-<id>[-v3]-vertical-15s.mp4 through
 *      scripts/encode.sh (encodeTarget), muxing the cut's mix from
 *      tutorialMixPath(): the v3 mix for a cut that ships a v3 read.
 *   2. Writes the vertical 15s SRT from scripts/srt.ts, validated first. Its
 *      cues are the timeline's beats and its text the untagged narration.
 *   3. Extracts the thumbnail with deliver.ts's thumbnail(), at the midpoint
 *      of the stretch beat, exactly as deliver.ts picks it for a tutorial.
 *   4. With --to, copies the three as reel-vertical.mp4, reel-vertical.srt and
 *      thumbnail.jpg into that folder. Refuses Reels/instructional reels/,
 *      whose finals are only ever replaced by hand.
 *
 * A cut that ships a v3 read takes a "-v3" segment in every name under out/,
 * so the v2 render and delivery beside it are not overwritten.
 */

import fs from "node:fs";
import path from "node:path";

import {
  SAFE_VERTICAL,
  encodeTarget,
  thumbnail,
  type DeliveryTarget,
} from "./deliver.js";
import { renderSrt, targetsFor, validateTarget, type ReelKey } from "./srt.js";
import { CONTRAST_TUTORIAL } from "../src/tutorial/reels/contrast.js";
import { HERO_TUTORIAL } from "../src/tutorial/reels/hero.js";
import { tutorialMixPath, tutorialTimeline } from "../src/tutorial/timeline.js";
import type { TutorialContent } from "../src/tutorial/types.js";

const ROOT = process.cwd();
const TUTORIALS: Record<string, TutorialContent> = {
  "tutorial-contrast": CONTRAST_TUTORIAL,
  "tutorial-hero": HERO_TUTORIAL,
};

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
}

async function main(argv: string[]): Promise<void> {
  const reel = flag(argv, "reel") ?? "";
  const content = TUTORIALS[reel];
  if (!content) throw new Error(`--reel must be one of ${Object.keys(TUTORIALS).join(", ")}.`);
  if (!fs.existsSync(path.join(ROOT, "package.json"))) {
    throw new Error("Run this from the project root (D:\\kap-reel).");
  }

  const read = content.voice?.short ? "-v3" : "";
  const timeline = tutorialTimeline(content, "short");
  const stem = `kap-tut-${content.id}${read}-vertical-15s`;
  const target: DeliveryTarget = {
    format: "vertical",
    duration: "15s",
    input: `out/render-${reel}${read}-vertical-15s.mp4`,
    output: `out/${stem}.mp4`,
    frames: timeline.totalFrames,
    canvas: "1080x1920",
  };
  const mix = path.join(ROOT, tutorialMixPath(content, "short"));
  if (!fs.existsSync(mix)) throw new Error(`${path.relative(ROOT, mix)} is missing. Build the mix first.`);
  console.log(
    `${reel} short, ${timeline.totalFrames} frames (${(timeline.totalFrames / 30).toFixed(2)}s), ` +
      `mix ${path.relative(ROOT, mix)}`,
  );

  // 1. Encode.
  if (!encodeTarget(target, () => mix)) throw new Error(`encode of ${target.output} failed or was skipped.`);

  // 2. Captions.
  const srtTarget = targetsFor(reel as ReelKey).find(
    (t) => t.format === "vertical" && t.duration === "15s",
  );
  if (!srtTarget) throw new Error("no vertical 15s caption target.");
  const problems = validateTarget(srtTarget);
  if (problems.length > 0) {
    throw new Error(problems.map((p) => `${p.target}: ${p.message}`).join("\n"));
  }
  const srt = path.join(ROOT, "out", `${stem}.srt`);
  fs.writeFileSync(srt, renderSrt(srtTarget.rows), "utf8");
  console.log(`wrote ${path.relative(ROOT, srt)}`);

  // 3. Thumbnail, at the midpoint of the stretch beat, as deliver.ts picks it.
  const stretch = timeline.entries.find((e) => e.beat.stretch) ?? timeline.entries[1];
  const frame = Math.round((stretch.start + stretch.end) / 2);
  const thumb = path.join(ROOT, "out", `thumbnail-${reel}${read}-vertical.jpg`);
  const scratch = path.join(ROOT, "out", ".deliver-short-scratch.png");
  await thumbnail(path.join(ROOT, target.input), frame, SAFE_VERTICAL, thumb, scratch);
  if (fs.existsSync(scratch)) fs.unlinkSync(scratch);

  // 4. Copy.
  const to = flag(argv, "to");
  if (to) {
    const dest = path.resolve(to);
    if (/instructional reels/i.test(dest)) {
      throw new Error("Refusing to write into Reels/instructional reels/.");
    }
    fs.mkdirSync(dest, { recursive: true });
    const copies: [string, string][] = [
      [path.join(ROOT, target.output), "reel-vertical.mp4"],
      [srt, "reel-vertical.srt"],
      [thumb, "thumbnail.jpg"],
    ];
    for (const [from, name] of copies) {
      fs.copyFileSync(from, path.join(dest, name));
      console.log(`copied ${name} to ${dest}`);
    }
  }
}

main(process.argv.slice(2)).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
