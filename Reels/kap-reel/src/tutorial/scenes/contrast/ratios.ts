// The three measurements the contrast tutorial is built on, computed once.
//
// The non-negotiable in the spec is that every contrast ratio on screen is
// computed by code from the actual hex values and asserted in a test. So no
// scene in this folder may carry a ratio, a "2.9", or a verdict as a literal:
// they all read one of the three constants below, which come from
// config/brand.json through src/lib/brand.ts and src/lib/contrast.ts.
//
// scripts/qa/tutorial.ts asserts the same three numbers independently, and also
// asserts that every ratio quoted in a caption is one of them, so moving a
// color in brand.json fails the build rather than leaving a stale figure burned
// into the picture.

import { COLORS } from "../../../lib/brand";
import { aaVerdict, contrastRatio, ratioLabel } from "../../../lib/contrast";

export type Measured = {
  /** Foreground hex, for the swatch and for the text the scene draws. */
  fg: string;
  /** Background hex. */
  bg: string;
  /** The raw WCAG 2.x ratio. */
  ratio: number;
  /** As it is set on screen in Lenia Mono, e.g. "2.9 : 1". */
  label: string;
  /** "passes AA" or "fails AA". */
  verdict: string;
  /** The small caps interpunct line, e.g. "amber on canvas . fails AA". */
  line: string;
};

/**
 * The interpunct that joins the two halves of a small caps line.
 *
 * Built from its code point rather than typed, the same trick scripts/srt.ts
 * uses for the em dash: this file is source, and source is scanned.
 */
export const INTERPUNCT = String.fromCharCode(0x00b7);

function measure(name: string, fg: string, bg: string): Measured {
  const ratio = contrastRatio(fg, bg);
  const verdict = aaVerdict(ratio);
  return {
    fg,
    bg,
    ratio,
    label: ratioLabel(ratio),
    verdict,
    line: `${name} ${INTERPUNCT} ${verdict}`,
  };
}

/** The mistake: 2.9 to 1, and it fails AA at every text size. */
export const AMBER_ON_CANVAS = measure(
  "amber on canvas",
  COLORS.amber,
  COLORS.canvas,
);

/** The fix, from the same family: 6.7 to 1, and it passes AA for body text. */
export const RUST_ON_CANVAS = measure(
  "rust on canvas",
  COLORS.accent,
  COLORS.canvas,
);

/** Why the button keeps its amber: 5.3 to 1 for the label on top of it. */
export const INK_ON_AMBER = measure("ink on amber", COLORS.ink, COLORS.amber);
