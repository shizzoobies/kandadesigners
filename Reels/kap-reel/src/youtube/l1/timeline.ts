// L1's layout: thirteen beats from the measured narration.
//
// Durations, gains and word timings come from words.json, which
// scripts/youtube/l1/stage.ts writes from public/youtube/l1/audio/voice.json.
// If the two disagree (a beat was retaken and stage.ts was not rerun), this
// throws rather than lay the cut out against the wrong audio.

import voiceJson from "../../../public/youtube/l1/audio/voice.json";
import {
  END_SCREEN_FRAMES,
  layoutBeats,
  makeCue,
  type BeatAudio,
  type BeatSpec,
} from "../timeline";
import wordsJson from "./words.json";

const AUDIO = (wordsJson as unknown as { beats: Record<string, BeatAudio> })
  .beats;

for (const b of (
  voiceJson as unknown as { beats: { beat: number; durationSeconds: number }[] }
).beats) {
  const w = AUDIO[String(b.beat)];
  if (!w || Math.abs(w.durationSeconds - b.durationSeconds) > 0.001) {
    throw new Error(
      `src/youtube/l1/words.json is stale for beat ${b.beat}: run node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/stage.ts`,
    );
  }
}

const SPECS: BeatSpec[] = [
  { beat: 1 },
  { beat: 2 },
  { beat: 3 },
  { beat: 4 },
  { beat: 5 },
  { beat: 6 },
  { beat: 7 },
  { beat: 8 },
  { beat: 9 },
  { beat: 10 },
  // A longer breath after the ask list, holding the references card.
  { beat: 11, gapAfter: 1.5 },
  { beat: 12 },
  // The end screen is 20 s whatever the line runs; the line starts 0.4 s in.
  { beat: 13, frames: END_SCREEN_FRAMES, voiceAt: 0.4 },
];

export const L1_LAYOUT = layoutBeats(SPECS, AUDIO);
export const L1_TOTAL_FRAMES = L1_LAYOUT.totalFrames;

/** Beat-local seconds a phrase starts at. */
export const cue = makeCue(AUDIO);

export const slotOf = (beat: number) => {
  const s = L1_LAYOUT.slots.find((x) => x.beat === beat);
  if (!s) throw new Error(`No beat ${beat}`);
  return s;
};

/** The chapter line in the rail, and the YouTube chapter title, per beat. */
export const CHAPTERS: Record<number, string> = {
  1: "The one-key test",
  2: "What you’ll learn",
  3: "What focus is and who needs it",
  4: "How to run the test",
  5: "Check 1 · Skip link",
  6: "Check 2 · Visible focus",
  7: "Check 3 · Tab order",
  8: "Check 4 · Menus and popups",
  9: "Check 5 · Keyboard traps",
  10: "Check 6 · Form labels",
  11: "What to ask your web person",
  12: "Recap",
  13: "Thanks for watching",
};
