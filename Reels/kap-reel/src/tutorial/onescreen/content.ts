// Tutorial 3: one screen, one decision.
//
// The Wednesday 2026-09-30 social reel. Script approved in
// Social Media Management/To Be Released/2026-09-30/brief.md, 52 words in
// five beats, word for word below. Narration is exactly what the voice model is
// sent once the tags in config/onescreen-v3-script.json are stripped, so the
// url is written the way it should be said and "K&A" is "K and A". Captions
// and the SRT read `caption` and `srt`, never the narration, which is why the
// url is spelled normally in both.
//
// Only the vertical short cut exists (it runs as long as its words; see
// layout.ts). The LinkedIn cut below is the short
// cut's beats again so the shared TutorialContent type is satisfied; nothing
// registers, voices or renders it.
//
// Pictures: the hook is the kinetic line on teal. "clutter" is an invented
// course screen, labeled "example" on screen, that asks for three things at
// once; it is nobody's real work. "decide" and "trick" are real screens from
// the live safety sample (src/tutorial/onescreen/captures.json), each asking
// for one thing.

import type { TutorialBeat, TutorialContent } from "../types";

/**
 * One caption card inside a beat. `from` is the word of the narration the card
 * arrives on, 0 based; the frame is read off the kept take's own transcript
 * timings, so a card changes when the voice gets there rather than at a guess.
 */
export type CaptionPhase = { from: number; lines: string[] };

export type OnescreenBeatProps = {
  /** Caption cards in order. The first one always starts at word 0. */
  captions: CaptionPhase[];
  /** The SRT text for the beat when it differs from the narration. */
  srt?: string;
};

const BEATS: TutorialBeat[] = [
  {
    id: "clutter",
    scene: "onescreen-clutter",
    narration:
      "Read this, then click that, then answer this. That is three screens " +
      "pretending to be one.",
    caption: ["Read this, then click that,", "then answer this."],
    minFrames: 90,
    props: {
      label: "example",
      captions: [
        { from: 0, lines: ["Read this, then click that,", "then answer this."] },
        { from: 8, lines: ["That is three screens", "pretending to be one."] },
      ],
    },
  },
  {
    id: "decide",
    scene: "onescreen-decide",
    narration:
      "We build one decision per screen. The learner acts, gets feedback, " +
      "moves on.",
    caption: ["We build one decision", "per screen."],
    minFrames: 120,
    stretch: true,
    props: {
      captions: [
        { from: 0, lines: ["We build one decision", "per screen."] },
        { from: 6, lines: ["The learner acts,", "gets feedback, moves on."] },
      ],
    },
  },
  {
    id: "trick",
    scene: "onescreen-trick",
    narration: "Fewer clicks. More learning. That is the whole trick.",
    caption: ["Fewer clicks. More learning.", "That is the whole trick."],
    minFrames: 90,
    props: {
      captions: [
        { from: 0, lines: ["Fewer clicks. More learning.", "That is the whole trick."] },
      ],
    },
  },
];

/** The spoken url, and how it is written everywhere a viewer reads it. */
export const CTA_SPOKEN =
  "Free sample courses at K and A Performance F L dot com slash training.";
export const CTA_WRITTEN = "Free sample courses at ka-performancefl.com/training.";

/** The url the end card points at. */
export const CTA_URL = "ka-performancefl.com/training";

export const ONESCREEN_TUTORIAL: TutorialContent = {
  id: "onescreen",
  hook: {
    lines: ["Ask for two things,", "get neither."],
    narration: "If a screen asks the learner to do two things, it does neither.",
    shot: { kind: "field", field: "teal" },
  },
  beats: {
    short: BEATS,
    linkedin: BEATS,
  },
  cta: {
    short: { narration: CTA_SPOKEN, closingLine: "Free sample courses" },
    linkedin: { narration: CTA_SPOKEN, closingLine: "Free sample courses" },
  },
  // The bed is out/candidates/music-i-c.mp3, the warm acoustic take, which is
  // not a variant config/audio.json resolves. The mix script reads it by path.
  music: { short: "i-c", linkedin: "i-c" },
};

/** Where the bed comes from, repo relative. */
export const ONESCREEN_MUSIC = "out/candidates/music-i-c.mp3";

export function beatProps(beat: TutorialBeat): OnescreenBeatProps {
  const props = (beat.props ?? {}) as Partial<OnescreenBeatProps>;
  return {
    captions: props.captions ?? [{ from: 0, lines: beat.caption }],
    srt: props.srt,
  };
}
