// Frames at which a beat's words are spoken, read off the kept read's own
// transcript (config/voice.json, onescreen.selections[].words). A caption card
// or a tap lands on the word it belongs to rather than on a guess.

import { FPS } from "../timeline";
import type { TutorialBeat } from "../types";
import { wordsFor } from "./voice-log";

/**
 * The frame, relative to the start of the beat, that word `index` of the
 * narration starts on. Falls back to an even spread over `beatFrames` when no
 * read is kept yet or the transcript split the line differently.
 */
export function wordFrame(beat: TutorialBeat, index: number, beatFrames: number): number {
  const spoken = beat.narration.split(/\s+/).filter(Boolean);
  const heard = wordsFor(beat.id);
  if (heard.length === spoken.length && heard[index]) {
    return Math.max(0, Math.round(heard[index].start * FPS));
  }
  return Math.round((index / Math.max(1, spoken.length)) * beatFrames * 0.85);
}
