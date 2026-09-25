// Tutorial 3: give the AI the brief, not the task.
//
// The script is the approved brief for the Thursday 2026-10-01 post, word for
// word: Social Media Management/To Be Released/2026-10-01/brief.md. The first
// approved draft was 58 words and read at 26.8 seconds on eleven_v3, past the
// 600 frame cap, so Alex trimmed it to fit 20 seconds on 2026-09-24. The words
// below are that trim, locked. The full real prompts stay on screen as they
// are; the address is on the end card only and is not spoken.
//
// This tutorial ships only the 15 second vertical cut, read on eleven_v3, so
// the LinkedIn cut is empty and nothing registers it. It does not go through
// src/tutorial/Tutorial.tsx or the scene registry: its beats are drawn by
// BriefReel.tsx from this folder, and its voice is the "briefV3" section of
// config/voice.json, written by src/tutorial/brief/pipeline.ts. See the header
// of that file for why.
//
// No React in here, so the pipeline script can read it.

import type { TutorialBeat, TutorialContent } from "../types";

/**
 * The 15 second cut, which runs as long as its words (timeline.ts rule 4, up
 * to 600 frames). "good" is the stretch beat: the good prompt and the output it
 * earned are the two things the viewer has to read, and any slack is theirs.
 */
const SHORT_BEATS: TutorialBeat[] = [
  {
    id: "weak",
    scene: "brief-board",
    narration: "'Write a follow up email' gets you a form letter.",
    caption: ["'Write a follow up email'", "gets you a form letter."],
    minFrames: 60,
    // The bakery prompt is on screen from this beat on, so its label is too.
    props: { stage: "weak", label: "example" },
  },
  {
    id: "good",
    scene: "brief-board",
    narration:
      "Tell it the bakery owner is nervous about cost, and you get something " +
      "you would actually send.",
    caption: ["The brief gets you something", "you would actually send."],
    minFrames: 120,
    stretch: true,
    props: { stage: "good", label: "example" },
  },
  {
    id: "rule",
    scene: "brief-rule",
    narration: "Give it the brief, not the task.",
    // No caption: the picture is the line itself, as in the hero tutorial's
    // rule beat. The SRT still carries the narration.
    caption: [],
    minFrames: 60,
  },
];

export const BRIEF_TUTORIAL: TutorialContent = {
  id: "brief",
  hook: {
    lines: ["Stop asking AI to write the email.", "Tell it who the email is for."],
    narration: "Stop asking AI to write the email. Tell it who the email is for.",
    shot: { kind: "field", field: "teal" },
  },
  beats: {
    short: SHORT_BEATS,
    linkedin: [],
  },
  cta: {
    short: {
      narration: "Free AI lessons, link in the caption.",
      closingLine: "Free AI lessons",
    },
    linkedin: {
      narration: "",
    },
  },
  music: {
    short: "i-a",
    linkedin: "i-a",
  },
  voice: {
    short: { model: "eleven_v3", mode: "natural", music: "i-a" },
  },
};

/** The page the end card and the captions point to. */
export const BRIEF_URL = "ka-performancefl.com/training/ai";

