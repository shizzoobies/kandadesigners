/**
 * Tutorial reel checks.
 *
 *   npx tsx scripts/qa/tutorial.ts
 *
 * The rest of scripts/qa/ is the pixel harness: it renders stills and measures
 * them. This is the other kind of check, the one that needs no picture. It
 * asserts the things the tutorial spec states as facts, so that a script edit,
 * a regenerated voice line or a colour moving in config/brand.json fails here
 * rather than on screen:
 *
 *   1. Every cut lays out to exactly its frame count, and no beat is shorter
 *      than the narration it has to carry.
 *   2. Exactly one beat per cut is marked stretch, which is where the slack
 *      goes.
 *   3. No em dash in any string that reaches a frame or a file, and no "K&A" in
 *      anything sent to the voice model.
 *   4. Captions are one or two lines and fit the copy box.
 *   5. Every beat names a scene the registry has.
 *   6. The three WCAG contrast ratios the contrast tutorial is built on, from
 *      src/lib/contrast.ts over config/brand.json, and that every ratio quoted
 *      in a caption is one of them.
 *
 * Exits 1 on any failure.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import brand from "../../config/brand.json";
import { CONTRAST_TUTORIAL } from "../../src/tutorial/reels/contrast.js";
import { HERO_TUTORIAL } from "../../src/tutorial/reels/hero.js";
import { FPS, tutorialTimeline } from "../../src/tutorial/timeline.js";
import {
  CAPTION_MAX_CHARS,
  CAPTION_MAX_LINES,
  TUTORIAL_CUTS,
  tutorialStrings,
  type TutorialContent,
} from "../../src/tutorial/types.js";
import { TUTORIAL_TOTAL_FRAMES } from "../../src/tutorial/timeline.js";
import {
  contrastRatio,
  formatRatio,
  passesAA,
} from "../../src/lib/contrast.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");

/**
 * Built from a code point rather than typed, so this file does not itself trip
 * the check it runs. Same trick as scripts/srt.ts and scripts/deliver.ts.
 */
const EM_DASH = String.fromCharCode(0x2014);

const TUTORIALS: TutorialContent[] = [CONTRAST_TUTORIAL, HERO_TUTORIAL];

let failures = 0;
let checks = 0;

function ok(name: string, condition: boolean, detail = ""): void {
  checks += 1;
  if (condition) {
    console.log(`  ok   ${name}${detail ? `  ${detail}` : ""}`);
    return;
  }
  failures += 1;
  console.log(`  FAIL ${name}${detail ? `  ${detail}` : ""}`);
}

function between(
  name: string,
  value: number,
  low: number,
  high: number,
): void {
  ok(
    name,
    value >= low && value <= high,
    `${value.toFixed(4)} against ${low} to ${high}`,
  );
}

// ---------------------------------------------------------------------------
// 1, 2. Timeline
// ---------------------------------------------------------------------------

console.log("\n[timeline]");
for (const content of TUTORIALS) {
  for (const cut of TUTORIAL_CUTS) {
    const timeline = tutorialTimeline(content, cut);
    const total = TUTORIAL_TOTAL_FRAMES[cut];
    const last = timeline.entries[timeline.entries.length - 1];

    ok(
      `${content.id} ${cut} totals ${total} frames`,
      last.end === total && timeline.totalFrames === total,
      `laid out to ${last.end}`,
    );

    // No gaps and no overlaps: beat n starts where beat n-1 ended.
    let contiguous = timeline.entries[0].start === 0;
    for (let i = 1; i < timeline.entries.length; i += 1) {
      if (timeline.entries[i].start !== timeline.entries[i - 1].end) {
        contiguous = false;
      }
    }
    ok(`${content.id} ${cut} beats are contiguous from frame 0`, contiguous);

    for (const entry of timeline.entries) {
      const needed = Math.ceil(entry.seconds * FPS);
      ok(
        `${content.id} ${cut} ${entry.beat.id} holds its narration`,
        entry.end - entry.start >= needed,
        `${entry.end - entry.start} frames for ${needed} frames of voice ` +
          `(${entry.source})`,
      );
      ok(
        `${content.id} ${cut} ${entry.beat.id} clears its own minimum`,
        entry.end - entry.start >= entry.beat.minFrames,
      );
    }

    const stretch = timeline.entries.filter((e) => e.beat.stretch);
    ok(
      `${content.id} ${cut} has exactly one stretch beat`,
      stretch.length === 1,
      stretch.map((e) => e.beat.id).join(", "),
    );
    if (stretch.length === 1) {
      ok(
        `${content.id} ${cut} slack went to "${stretch[0].beat.id}"`,
        stretch[0].stretchFrames === timeline.slackFrames,
        `${timeline.slackFrames} frames`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Strings
// ---------------------------------------------------------------------------

console.log("\n[strings]");
for (const content of TUTORIALS) {
  const strings = tutorialStrings(content);
  const dashes = strings.filter((s) => s.includes(EM_DASH));
  ok(
    `${content.id} has no em dash in any string that reaches a file`,
    dashes.length === 0,
    `${strings.length} strings checked`,
  );

  // Anything sent to the voice model says "K and A". The ampersand is only ever
  // on screen, in the drawn lockup, which is a picture and not a string.
  const narrations: string[] = [content.hook.narration];
  for (const cut of TUTORIAL_CUTS) {
    for (const beat of content.beats[cut]) narrations.push(beat.narration);
    narrations.push(content.cta[cut].narration);
  }
  const ampersands = narrations.filter((n) => n.includes("K&A"));
  ok(
    `${content.id} narration never sends "K&A" to the voice model`,
    ampersands.length === 0,
    ampersands.join(" / "),
  );
}

// ---------------------------------------------------------------------------
// 4. Captions
// ---------------------------------------------------------------------------

console.log("\n[captions]");
/**
 * Two characters of slack over CAPTION_MAX_CHARS.
 *
 * The 32 is a rule of thumb about the width of Atkinson at 44px against an 864
 * pixel copy box, not a measurement of any particular line, and refusing a 33
 * character line that fits would be the check bullying the copy. A line that is
 * really too wide wraps inside the card, which the pixel harness sees.
 */
const CAPTION_SLACK = 2;

for (const content of TUTORIALS) {
  for (const cut of TUTORIAL_CUTS) {
    for (const beat of content.beats[cut]) {
      ok(
        `${content.id} ${cut} ${beat.id} caption is 1 or 2 lines`,
        beat.caption.length >= 1 && beat.caption.length <= CAPTION_MAX_LINES,
        `${beat.caption.length} lines`,
      );
      const longest = beat.caption.reduce((a, b) => (b.length > a.length ? b : a), "");
      ok(
        `${content.id} ${cut} ${beat.id} caption fits the copy box`,
        longest.length <= CAPTION_MAX_CHARS + CAPTION_SLACK,
        `longest line ${longest.length} chars: "${longest}"`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Scene keys
// ---------------------------------------------------------------------------

console.log("\n[scenes]");
/**
 * The registered keys, read out of the registry as text rather than imported.
 *
 * Importing src/tutorial/scenes/registry.ts would pull the whole Remotion scene
 * tree into a Node process for the sake of an object's keys. Reading the SCENES
 * table is enough to catch the thing this check exists for, which is a beat
 * naming a scene nobody registered.
 */
function registeredSceneKeys(): string[] {
  const source = fs.readFileSync(
    path.join(ROOT, "src", "tutorial", "scenes", "registry.ts"),
    "utf8",
  );
  const table = /export const SCENES: Record<string, TutorialScene> = \{([\s\S]*?)\n\};/.exec(
    source,
  );
  if (!table) return [];
  return [...table[1].matchAll(/^\s*"?([A-Za-z0-9_-]+)"?:/gm)].map((m) => m[1]);
}

const keys = registeredSceneKeys();
ok("the registry table parses", keys.length > 0, keys.join(", "));
for (const content of TUTORIALS) {
  for (const cut of TUTORIAL_CUTS) {
    for (const beat of content.beats[cut]) {
      ok(
        `${content.id} ${cut} ${beat.id} names a registered scene`,
        keys.includes(beat.scene),
        `"${beat.scene}"`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Contrast
// ---------------------------------------------------------------------------

console.log("\n[contrast]");
const CANVAS = brand.colors.canvas;
const AMBER = brand.colors.amber;
const RUST = brand.colors.accent;
const INK = brand.colors.ink;

ok("brand.json canvas is #F8F5F2", CANVAS === "#F8F5F2", CANVAS);
ok("brand.json amber is #D97706", AMBER === "#D97706", AMBER);
ok("brand.json accent is rust #9A3412", RUST === "#9A3412", RUST);
ok("brand.json ink is #221C15", INK === "#221C15", INK);

const amberOnCanvas = contrastRatio(AMBER, CANVAS);
const rustOnCanvas = contrastRatio(RUST, CANVAS);
const inkOnAmber = contrastRatio(INK, AMBER);

between("amber on canvas", amberOnCanvas, 2.85, 2.95);
between("rust on canvas", rustOnCanvas, 6.6, 6.8);
ok(
  "ink on amber clears AA for button text",
  inkOnAmber >= 4.5,
  inkOnAmber.toFixed(4),
);
ok("amber on canvas fails AA for body text", !passesAA(amberOnCanvas));
ok("rust on canvas passes AA for body text", passesAA(rustOnCanvas));

/**
 * Every ratio quoted in a caption is one the helper computes.
 *
 * The contrast tutorial's captions say "2.9 to 1" and "6.7 to 1", and the
 * non-negotiable is that no ratio on screen is typed by hand. The scene reads
 * the computed value, so this asserts the caption agrees with it: move amber in
 * config/brand.json and this fails rather than leaving a stale figure burned
 * into the picture.
 */
const computed = new Set(
  [amberOnCanvas, rustOnCanvas, inkOnAmber].map((r) => formatRatio(r)),
);
for (const content of TUTORIALS) {
  for (const cut of TUTORIAL_CUTS) {
    for (const beat of content.beats[cut]) {
      for (const line of beat.caption) {
        for (const m of line.matchAll(/\b(\d+\.\d)\b/g)) {
          ok(
            `${content.id} ${cut} ${beat.id} caption ratio ${m[1]} is computed`,
            computed.has(m[1]),
            `computed: ${[...computed].join(", ")}`,
          );
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------

console.log(
  `\n${checks - failures} of ${checks} checks passed, ${failures} failed.`,
);
process.exit(failures === 0 ? 0 : 1);
