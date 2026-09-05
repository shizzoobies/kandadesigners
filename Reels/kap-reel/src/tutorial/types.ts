// The content contract every tutorial reel is written against.
//
// See docs/superpowers/specs/2026-09-04-tutorial-reels-design.md, "Content
// contract". This is the same argument src/reels/types.ts makes for the two
// showcase reels: one scene tree, one content value per reel, never a fork. The
// difference is that a tutorial's picture is driven by its narration rather
// than the other way round, so a beat carries the exact text sent to the voice
// model and src/tutorial/timeline.ts lays the beats out from the measured
// length of that audio.
//
// Nothing in here imports React, and nothing in here may. A beat names its
// scene with a string key that src/tutorial/scenes/registry.ts resolves, which
// is what lets scripts/voice.ts, scripts/srt.ts and scripts/deliver.ts read a
// content file without pulling the whole Remotion tree in, and what lets the
// two Phase B agents add their scenes by registering one key each rather than
// by editing a shared file.

/**
 * Which cut a tutorial is rendering. "short" is the 15 second Facebook Reels
 * cut, 450 frames. "linkedin" is the 45 second cut, 1350 frames. Same names as
 * src/reels/types.ts, and deliberately: the two cuts of a tutorial are two
 * compositions over one scene tree, exactly as they are for the showcase reels.
 */
export type TutorialCut = "short" | "linkedin";

/** Every cut, in order, for anything that has to walk both. */
export const TUTORIAL_CUTS: TutorialCut[] = ["short", "linkedin"];

/**
 * The full bleed shot behind the hook lines, or nothing.
 *
 * The showcase reels always open on a capture, because they are about the work.
 * A tutorial opens on a claim, and not every claim has a shot behind it, so
 * "field" is a first class option here rather than an absence: a flat brand
 * field, teal or canvas, with the kinetic lines on it. Both tutorials open on
 * teal to start.
 */
export type TutorialHookShot =
  | { kind: "field"; field: "teal" | "canvas" }
  | {
      kind: "capture";
      captureId: string;
      trimBefore: number;
      playbackRate: number;
    };

export type TutorialHookContent = {
  /**
   * Two halves of one kinetic line, both slammed on frame 0, the same treatment
   * src/scenes/Hook.tsx gives the showcase reels: the first line in canvas, the
   * second in amber.
   */
  lines: [string, string];
  /** Exactly what is sent to the voice model for the hook. */
  narration: string;
  shot: TutorialHookShot;
};

/**
 * Props a beat hands its scene.
 *
 * Loose on purpose. Phase A ships four shared scenes and a placeholder; the two
 * Phase B agents each add scenes that need their own inputs, and widening a
 * shared union every time would be a shared-file edit that the phase split
 * exists to avoid. The named fields below are the ones a shared scene reads.
 */
export type TutorialBeatProps = {
  /** JamClip: the recording id under assets/captures/jam/<id>.mp4. */
  clipId?: string;
  /** A small caps label over the picture, e.g. "example" on a fictional site. */
  label?: string;
  [key: string]: unknown;
};

/** One beat of a tutorial, in one cut. */
export type TutorialBeat = {
  /** Short id, unique within the cut. Names the voice file and the Sequence. */
  id: string;
  /**
   * Which registered scene draws this beat. Resolved through
   * src/tutorial/scenes/registry.ts, never imported here.
   */
  scene: string;
  /**
   * The exact text sent to the voice model. "K&A" is written "K and A" in here
   * so it is spoken correctly; the ampersand only ever appears on screen.
   */
  narration: string;
  /**
   * The burned in caption, one or two lines of about 32 characters at 1080
   * canvas width. Usually the narration cut down rather than the narration
   * verbatim: a 30 word line does not fit two lines and a caption that scrolls
   * is worse than a caption that summarises. The SRT sidecar carries the full
   * narration, so nothing is lost for a viewer reading rather than listening.
   */
  caption: string[];
  /**
   * The shortest this picture may run, whatever the narration measures. A
   * crossfade, a type-on or a three shot cut needs its own time and the voice
   * does not always pay for it.
   */
  minFrames: number;
  /**
   * The one beat per cut that absorbs the slack between the laid out beats and
   * the cut's exact frame count. Exactly one beat per cut sets this; see
   * src/tutorial/timeline.ts.
   */
  stretch?: boolean;
  props?: TutorialBeatProps;
};

/** The closing beat: the narration over the existing drawn end card. */
export type TutorialCta = {
  narration: string;
  /** One line above the url on the end card. Undefined means no line. */
  closingLine?: string;
};

/**
 * Everything that differs between two tutorials built on the same scene tree.
 * Anything not in here is brand or structure and is the same in both.
 */
export type TutorialContent = {
  /** Short identifier: "contrast" or "hero". Names files and compositions. */
  id: string;
  hook: TutorialHookContent;
  /** The beats between the hook and the end card, per cut. */
  beats: Record<TutorialCut, TutorialBeat[]>;
  cta: Record<TutorialCut, TutorialCta>;
  /**
   * Which existing music take beds under the voice, per cut. The id is the
   * variant in config/audio.json, so "a" resolves to music-a-20s.mp3 for the
   * 15 second cut and music-a-50s.mp3 for the 45 second one.
   */
  music: Record<TutorialCut, string>;
};

/**
 * The beat id the hook always takes. Reserved: a content file may not use it
 * for a beat of its own, because the voice file and the SRT cue are keyed on it.
 */
export const HOOK_BEAT_ID = "hook";

/** The beat id the end card always takes. Reserved, for the same reason. */
export const CTA_BEAT_ID = "cta";

/**
 * The longest a caption line may be at 1080 canvas width.
 *
 * Atkinson at 44px averages a little under 24 pixels a character, so 32
 * characters is about 760 pixels against a copy box that is 864 wide in the
 * vertical crop. Asserted in scripts/qa/tutorial.ts with two characters of
 * slack, because a line of capitals measures wider than the average.
 */
export const CAPTION_MAX_CHARS = 32;

/** A caption is one or two lines. Three would cover the picture. */
export const CAPTION_MAX_LINES = 2;

/**
 * Splits a sentence into caption lines of at most `max` characters, breaking on
 * spaces only.
 *
 * Content files author their captions by hand, because a machine split of a
 * thirty word narration is not a caption. This exists so a short line can be
 * split predictably and so the test has one definition of "too long" to check
 * hand authored lines against.
 */
export function splitCaption(
  text: string,
  max: number = CAPTION_MAX_CHARS,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Every string in a content file that reaches a rendered frame or a delivered
 * file, so the em dash scan in scripts/deliver.ts has one thing to walk.
 */
export function tutorialStrings(content: TutorialContent): string[] {
  const strings: string[] = [content.hook.narration, ...content.hook.lines];
  for (const cut of TUTORIAL_CUTS) {
    for (const beat of content.beats[cut]) {
      strings.push(beat.narration, ...beat.caption);
    }
    const cta = content.cta[cut];
    strings.push(cta.narration);
    if (cta.closingLine) strings.push(cta.closingLine);
  }
  return strings;
}
