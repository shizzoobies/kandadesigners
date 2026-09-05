// Tutorial 2: your hero is a promise, not a photo.
//
// The scripts below are the spec's, word for word: see
// docs/superpowers/specs/2026-09-04-tutorial-reels-design.md, "Tutorial 2:
// hero". Narration is exactly what is sent to the voice model, so "K&A" is
// written "K and A" and "six hundred pixels" is spelled out.
//
// Every beat's scene is "placeholder" in Phase A. The Phase B hero agent
// replaces those keys with its own scenes and registers them in
// src/tutorial/scenes/registry.ts, and touches nothing else outside
// src/tutorial/scenes/hero/ and this file.
//
// Two facts about the pictures this tutorial needs, recorded here because they
// are content decisions rather than scene decisions:
//
// 1. The weak example is fictional. Riverside Bakery, consistent with the
//    fictional bakery in the training P&L sample, labelled "example" on screen.
//    A weak hero is never attributed to a real client.
// 2. The good examples are three cleared client sites whose live hero copy
//    states what the visitor gets, checked against the live pages on
//    2026-09-04: PB&J Strategic Accounting (pbjsa.com), MBS Medicine
//    (mbsdoc.com) and Southern Legacy Contractors
//    (southernlegacycontractors.com). Fore Motion Golf and Project Makeover
//    were checked and rejected: their heroes are mood and mission lines, not
//    promises. The beat shows the existing mobile home captures held on the
//    hero, so the headline on screen is the live headline rather than a
//    paraphrase of it, and nothing here retypes one.
//
//    The narration spells the two initialisms out, "P B and J" and "M B S",
//    because a voice model reads "PB&J" as a sandwich and "MBS" as a word. The
//    ampersand never goes to the model at all.

import type { TutorialBeat, TutorialContent } from "../types";

/**
 * The 15 second Facebook cut. Four beats and an end card, 450 frames.
 *
 * "promise" is the stretch beat: the headline rewriting itself by type-on is
 * the whole argument of the cut, and a type-on that is hurried reads as a
 * glitch rather than as a rewrite.
 */
const SHORT_BEATS: TutorialBeat[] = [
  {
    id: "weak",
    scene: "placeholder",
    narration: "Welcome to our website says nothing.",
    caption: ["Welcome to our website", "says nothing."],
    minFrames: 60,
    props: { label: "example" },
  },
  {
    id: "promise",
    scene: "placeholder",
    narration: "Say what they get, in the first six words.",
    caption: ["Say what they get,", "in the first six words."],
    // The headline retypes on the same phone. 78 frames is 2.6 seconds, which
    // is a readable type-on of a nine word line rather than a flicker.
    minFrames: 78,
    stretch: true,
  },
  {
    id: "real",
    scene: "placeholder",
    narration: "These three do.",
    caption: ["These three do."],
    // Three phone frames, fast cut. 60 frames is 20 a piece, which is the
    // surfaces tour's own hold in the 15 second master.
    minFrames: 60,
  },
];

/**
 * The 45 second LinkedIn cut. Five beats and an end card, 1350 frames.
 *
 * "real" is the stretch beat: three real client heroes, each held about three
 * seconds, and the slack in this cut buys that hold rather than a longer line.
 */
const LINKEDIN_BEATS: TutorialBeat[] = [
  {
    id: "fold",
    scene: "placeholder",
    narration:
      "The first screen decides whether anyone scrolls. On a phone that is " +
      "about six hundred pixels. A photo and a logo spend it on nothing.",
    caption: ["The first screen decides", "whether anyone scrolls."],
    minFrames: 120,
    props: { label: "example" },
  },
  {
    id: "rewrite",
    scene: "placeholder",
    narration:
      "Take a weak line. Welcome to our website. Rewrite it: who it is for, " +
      "what they get, why you.",
    caption: ["Who it is for. What they get.", "Why you."],
    // Three type-on passes, one per clause, landing on the finished line.
    minFrames: 120,
  },
  {
    id: "real",
    scene: "placeholder",
    narration:
      "Three real ones. P B and J Accounting, M B S Medicine, Southern " +
      "Legacy. Each tells you what you get before you scroll.",
    caption: ["Each tells you what you get", "before you scroll."],
    // Three phones at about three seconds each, which is what the spec asks
    // for and what a real headline needs to be read rather than glimpsed.
    minFrames: 270,
    stretch: true,
  },
  {
    id: "rule",
    scene: "placeholder",
    narration: "Write the promise. Then pick the photo.",
    caption: ["Write the promise.", "Then pick the photo."],
    minFrames: 60,
  },
];

export const HERO_TUTORIAL: TutorialContent = {
  id: "hero",
  hook: {
    lines: ["Your hero is a promise,", "not a photo."],
    narration: "Your hero is a promise, not a photo.",
    // Teal, like the contrast tutorial. A hero shot behind a line about hero
    // shots would be the joke rather than the point, and the two tutorials
    // open the same way on purpose: they are a series.
    shot: { kind: "field", field: "teal" },
  },
  beats: {
    short: SHORT_BEATS,
    linkedin: LINKEDIN_BEATS,
  },
  cta: {
    short: {
      narration: "Write the promise. Then pick the photo.",
      closingLine: "Write the promise first.",
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
