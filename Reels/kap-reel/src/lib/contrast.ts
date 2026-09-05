// WCAG 2.x contrast, computed from hex rather than typed.
//
// The tutorial reels' non-negotiables say every contrast ratio on screen is
// computed by code from the actual hex values and asserted in a test. Nothing
// in a scene may carry a ratio as a literal: it reads brand.json through
// src/lib/brand.ts, passes the two hex values through here, and formats what
// comes back. scripts/qa/tutorial.ts asserts the three numbers the contrast
// tutorial is built on.
//
// The maths is WCAG 2.1 relative luminance, unchanged in 2.2:
//   https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
//   https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
// APCA (the WCAG 3 draft measure) is deliberately not used. The claim on screen
// is "fails AA", which is a WCAG 2.x conformance statement, so the number under
// it has to be the WCAG 2.x number.

/** AA needs this for body text. */
export const AA_NORMAL = 4.5;

/** AA needs this for large text, 24px or 18.66px bold and up. */
export const AA_LARGE = 3;

/** AAA needs this for body text. */
export const AAA_NORMAL = 7;

/**
 * The three channels of a "#RRGGBB" or "#RGB" string, 0 to 255.
 *
 * Throws rather than returning a default, because a scene that silently
 * measured black against black would put a plausible wrong number on screen,
 * which is exactly what the non-negotiable exists to prevent.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Not a hex colour: "${hex}".`);
  }
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** One sRGB channel, 0 to 255, linearised per WCAG 2.x. */
function linearise(channel8Bit: number): number {
  const c = channel8Bit / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance of a hex colour, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (
    0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b)
  );
}

/**
 * WCAG 2.x contrast ratio between two hex colours, 1 to 21.
 *
 * Order does not matter: the lighter colour is always the numerator, which is
 * what the specification says and what a checker in a browser reports.
 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The ratio as it is set on screen, one decimal place.
 *
 * One decimal is what Chrome DevTools shows and what the scripts say out loud
 * ("two point nine to one"), so the picture and the narration agree.
 */
export function formatRatio(ratio: number): string {
  return ratio.toFixed(1);
}

/** The ratio as a full label, e.g. "2.9 : 1". Spaced, because it is set in mono. */
export function ratioLabel(ratio: number): string {
  return `${formatRatio(ratio)} : 1`;
}

/**
 * Whether a ratio clears AA at a given text size.
 *
 * Rounded to one decimal first, deliberately: the number on screen is what the
 * viewer is asked to judge, so a 4.47 that prints as "4.5" must not be labelled
 * a pass while its own caption reads like one. Nothing in either tutorial sits
 * that close to a threshold, and this keeps it that way if a colour moves.
 */
export function passesAA(ratio: number, large = false): boolean {
  return Number(formatRatio(ratio)) >= (large ? AA_LARGE : AA_NORMAL);
}

/** The small caps verdict line the contrast tutorial sets under the number. */
export function aaVerdict(ratio: number, large = false): string {
  return passesAA(ratio, large) ? "passes AA" : "fails AA";
}
