// Frame numbers inside the brief tutorial's beats, shared by the scenes and by
// the pipeline that picks the thumbnail and review frames. No React.
//
// Where an arrival is tied to a word, it is read off the kept read's own word
// timings (briefV3.kept[].words in config/voice.json, from the transcription
// check), so the picture follows the voice if a beat is ever re-read. The
// numbers here are only the fallbacks and the fixed reveal lengths.

/** Both prompt cards slam on this frame of the "weak" beat. */
export const PROMPTS_IN = 0;

/**
 * The thumbnail and the "side by side" review frame: both prompts on screen,
 * neither output yet. The weak output never starts before WEAK_OUTPUT_MIN_START,
 * so this frame is always clean.
 */
export const THUMBNAIL_OFFSET = 12;

/** The weak output never starts before this frame of its beat. */
export const WEAK_OUTPUT_MIN_START = 20;

/** Frames the weak output takes to write itself in. It is short. */
export const WEAK_OUTPUT_REVEAL = 18;

/** Frames the good output takes to write itself in: two long paragraphs. */
export const GOOD_OUTPUT_REVEAL = 75;

/** The good output never starts before this frame of its beat. */
export const GOOD_OUTPUT_MIN_START = 18;

type Word = { text: string; start: number; end: number };

/** The frame (at 30 fps) a word starts on in a beat's read, or null. */
export function wordFrame(words: Word[], match: RegExp, fps = 30): number | null {
  const w = words.find((x) => match.test(x.text));
  return w ? Math.round(w.start * fps) : null;
}

/**
 * The weak output arrives as the verdict starts: "gets you a form letter". The
 * prompt has been said by then, and the output is the form letter.
 */
export function weakOutputStart(words: Word[], beatFrames: number): number {
  const at = wordFrame(words, /^gets$/i);
  const fallback = Math.round(beatFrames * 0.45);
  return Math.max(WEAK_OUTPUT_MIN_START, at === null ? fallback : at - 3);
}

/**
 * The good output finishes writing itself in as "you get something you would
 * actually send" starts, and so starts GOOD_OUTPUT_REVEAL frames before that:
 * it streams in while the prompt is being read, which is how the tool behaves,
 * and it is complete for the line that judges it.
 */
export function goodOutputStart(words: Word[], beatFrames: number): number {
  const at = wordFrame(words, /^get$/i);
  const end = at === null ? Math.round(beatFrames * 0.65) : at;
  return Math.max(GOOD_OUTPUT_MIN_START, end - GOOD_OUTPUT_REVEAL);
}

