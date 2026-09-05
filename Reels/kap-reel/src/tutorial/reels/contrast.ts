// Tutorial 1: contrast is not a vibe.
//
// The scripts below are the spec's, word for word: see
// docs/superpowers/specs/2026-09-04-tutorial-reels-design.md, "Tutorial 1:
// contrast". Narration is exactly what is sent to the voice model, so "K&A" is
// written "K and A" and every ratio is spelled out ("two point nine to one")
// rather than set as digits, which is how a text to speech model reads a number
// aloud reliably.
//
// Every beat's scene is "placeholder" in Phase A. The Phase B contrast agent
// replaces those keys with its own scenes and registers them in
// src/tutorial/scenes/registry.ts, and touches nothing else outside
// src/tutorial/scenes/contrast/ and this file.
//
// The numbers this tutorial is about are never typed into a scene. They are
// computed from config/brand.json through src/lib/contrast.ts, and
// scripts/qa/tutorial.ts asserts them: amber #D97706 on canvas #F8F5F2 is 2.9
// to 1, rust #9A3412 on canvas is 6.7 to 1, and espresso ink #221C15 on amber
// clears AA. The captions below quote those numbers, and the test also asserts
// that what the captions quote is what the helper computes, so a colour moving
// in brand.json fails the build rather than putting a stale figure on screen.

import type { TutorialBeat, TutorialContent } from "../types";

/**
 * The 15 second Facebook cut. Four beats and an end card, 450 frames.
 *
 * "fix" is the stretch beat: the crossfade from amber to rust is the one shot
 * here that reads better slower, and it is the beat the viewer is asked to
 * look at rather than listen to.
 */
const SHORT_BEATS: TutorialBeat[] = [
  {
    id: "fine",
    scene: "placeholder",
    narration: "This amber on cream looks fine.",
    caption: ["This amber on cream", "looks fine."],
    // Long enough for the eye to accept the page before it is contradicted.
    minFrames: 60,
  },
  {
    id: "fails",
    scene: "placeholder",
    // The ratio is spelled out because the voice model reads "2.9 : 1" as
    // punctuation. On screen it is set as digits in Lenia Mono.
    narration: "It measures two point nine to one. That fails.",
    caption: ["It measures 2.9 to 1.", "That fails."],
    // The number types on, then the verdict line arrives under it.
    minFrames: 66,
  },
  {
    id: "fix",
    scene: "placeholder",
    narration: "Same palette, rust instead. Six point seven. Passes.",
    caption: ["Same palette, rust instead.", "6.7 to 1. Passes."],
    // The crossfade plus both ratios on screen. Takes the cut's slack.
    minFrames: 78,
    stretch: true,
  },
];

/**
 * The 45 second LinkedIn cut. Five beats and an end card, 1350 frames.
 *
 * "inspect" is the stretch beat: it is the Jam recording of Chrome DevTools,
 * and a screen recording of someone clicking through a panel is the one thing
 * here that cannot be hurried. It renders as a stand-in until the recording
 * lands, which is deliberate and impossible to mistake for a finished shot.
 */
const LINKEDIN_BEATS: TutorialBeat[] = [
  {
    id: "real",
    scene: "placeholder",
    narration:
      "Here's a real page. The amber reads as bold, so your eye says it's " +
      "fine. The checker says two point nine to one. Body text needs four " +
      "and a half.",
    caption: ["The amber reads as bold.", "The checker says 2.9 to 1."],
    minFrames: 150,
  },
  {
    id: "inspect",
    scene: "placeholder",
    narration:
      "Open the inspector, click the colour swatch, and the ratio is right " +
      "there with the pass marks under it.",
    caption: ["Open the inspector.", "The ratio is right there."],
    minFrames: 120,
    stretch: true,
    // Alex's Jam recording of Chrome DevTools on ka-performancefl.com. Phase B
    // switches this beat to the "jam" scene; the id is here from Phase A so the
    // asset request and the beat that consumes it are in one place.
    props: { clipId: "contrast-devtools" },
  },
  {
    id: "fix",
    scene: "placeholder",
    narration:
      "The fix is not a new palette. Amber stays on buttons, with dark text " +
      "on top. Words on the page get the rust from the same family. Six " +
      "point seven to one. Passes.",
    caption: ["Amber on buttons, rust in text.", "6.7 to 1. Passes."],
    minFrames: 150,
  },
  {
    id: "rule",
    scene: "placeholder",
    narration: "Every colour that carries text gets measured, not eyeballed.",
    caption: ["Measured, not eyeballed."],
    minFrames: 60,
  },
];

export const CONTRAST_TUTORIAL: TutorialContent = {
  id: "contrast",
  hook: {
    lines: ["Contrast", "is not a vibe."],
    narration: "Contrast is not a vibe.",
    // No capture opens this one. A flat teal field is the brand's dark band
    // from config/brand.json, and it is the right ground for a claim about
    // colour: a screenshot behind the line would be a fifth colour arguing
    // with the four the tutorial is about.
    shot: { kind: "field", field: "teal" },
  },
  beats: {
    short: SHORT_BEATS,
    linkedin: LINKEDIN_BEATS,
  },
  cta: {
    short: {
      narration: "Measure every colour you set text in.",
      closingLine: "Measure every colour.",
    },
    linkedin: {
      // "K and A", never "K&A", in anything the voice model reads.
      narration:
        "K and A Performance. Web design and AI integration, built in " +
        "Gainesville.",
      closingLine: "Taking new projects.",
    },
  },
  music: {
    short: "a",
    linkedin: "a",
  },
};
