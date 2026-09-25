// Tutorial 3: one screen, one decision.
//
// The Wednesday 2026-09-30 social reel. Script approved in
// Social Media Management/To Be Released/2026-09-30/brief.md, as trimmed to fit
// 20 seconds and approved by Alex on 2026-09-24, word for word below. Narration
// is exactly what the voice model is sent once the tags in
// config/onescreen-v3-script.json are stripped. The url is not spoken; it is on
// the end card only.
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
      "Read this, click that, answer this. Three screens pretending to be one.",
    caption: ["Read this, click that,", "answer this."],
    minFrames: 90,
    props: {
      label: "example",
      captions: [
        { from: 0, lines: ["Read this, click that,", "answer this."] },
        { from: 6, lines: ["Three screens", "pretending to be one."] },
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

/**
 * The closing line. Trimmed on 2026-09-24 (Alex) so the reel fits: the url is
 * no longer spoken and lives on the end card only.
 */
export const CTA_SPOKEN = "Free sample courses, link in the caption.";
export const CTA_WRITTEN = CTA_SPOKEN;

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
