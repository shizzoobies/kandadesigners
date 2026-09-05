// The fictional bakery's copy, and the three real client heroes.
//
// Riverside Bakery is not a client and does not exist. The spec's first
// non-negotiable on this point: a weak hero is never attributed to a real
// business, so the weak example is invented, kept consistent with the fictional
// bakery in the training P&L sample, and labeled on screen. LABEL below is
// that label, and every beat that draws the bakery carries it.
//
// The three real ones are the opposite case. Their headlines are their own,
// shown as the capture recorded them and never retyped or paraphrased: nothing
// in this file holds a real client's headline as a string, because a string is
// a paraphrase waiting to drift. What is here is the id of the capture and the
// business name as it is written, which is the only text this reel adds to a
// real client's screen.
//
// Nothing here imports React. It is copy and ids, so the scenes and any check
// that wants to read them can both have it.

import type { TutorialBeatProps } from "../../types";

/** The fictional bakery's name, as it is set in the phone's wordmark. */
export const RIVERSIDE_NAME = "Riverside Bakery";

/** The small caps label every beat that shows the bakery carries. */
export const EXAMPLE_LABEL = "example";

/**
 * The label a beat drawing the bakery is marked with.
 *
 * A beat may name its own through props.label, which is the channel
 * TutorialBeatProps documents for exactly this, but the default is not
 * undefined: a fictional hero attributed to nobody is the one thing the spec's
 * non-negotiables refuse outright, and a scene that could forget to draw the
 * label would eventually forget.
 */
export function exampleLabel(props?: TutorialBeatProps): string {
  return props?.label ?? EXAMPLE_LABEL;
}

/** The small caps label at the right end of the fold rule. */
export const FOLD_LABEL = "the fold";

/** The weak hero: a greeting. It says nothing a visitor could act on. */
export const WEAK_HEADLINE = "Welcome to Riverside Bakery";

/** What the bakery actually offers, in the first six words. */
export const PROMISE_HEADLINE = "Fresh sourdough, baked at five, gone by noon.";

/**
 * The three rewrite passes, one per clause of the 45 second cut's narration:
 * who it is for, what they get, why you.
 *
 * Each pass is the previous one plus its clause, so the beat reads as one line
 * being grown rather than as three unrelated lines being swapped. The last pass
 * is PROMISE_HEADLINE itself, which is what the 15 second cut lands on, so the
 * two cuts end the same sentence.
 */
export const REWRITE_PASSES: string[] = [
  "Sourdough in Riverside.",
  "Fresh sourdough, baked at five.",
  PROMISE_HEADLINE,
];

/** The bakery's supporting line, under the headline. Never the argument. */
export const RIVERSIDE_SUBHEAD = "Riverside Drive, open from six.";

/** The one button on the fictional hero. Amber ground, ink text. */
export const RIVERSIDE_BUTTON = "Order ahead";

/** The small caps section label below the fold, so the fold has a below. */
export const RIVERSIDE_BELOW_FOLD = "our story";

export type RealHero = {
  /** Project id, so getHomeCapture() resolves the mobile home capture. */
  projectId: string;
  /** The business name, set under the phone. The only text this reel adds. */
  name: string;
};

/**
 * The three cleared client sites whose live hero copy states what the visitor
 * gets, checked against the live pages on 2026-09-04 and against the stills the
 * beat actually shows.
 *
 * Ordered as the narration names them: "P B and J Accounting, M B S Medicine,
 * Southern Legacy."
 */
export const REAL_HEROES: RealHero[] = [
  { projectId: "pbj-strategic-accounting", name: "PB&J Strategic Accounting" },
  { projectId: "mbs-medicine", name: "MBS Medicine" },
  {
    projectId: "southern-legacy-contractors",
    name: "Southern Legacy Contractors",
  },
];
