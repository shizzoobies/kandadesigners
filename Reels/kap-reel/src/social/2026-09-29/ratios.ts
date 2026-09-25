// Every ratio this reel puts on screen, computed from config/brand.json through
// the shared WCAG 2.x helper in src/lib/contrast.ts. Nothing here types a ratio.
// scripts/social/2026-09-29/deliver.ts writes these same numbers, with the
// luminance working, to the day folder's source/contrast-ratios.md.

import { COLORS } from "../../lib/brand";
import { contrastRatio, formatRatio, hexToRgb, passesAA } from "../../lib/contrast";

export type Pair = { id: string; label: string; fg: string; bg: string };

export const PAIRS = {
  amberOnCream: { id: "amber-on-cream", label: "Amber on cream", fg: COLORS.amber, bg: COLORS.canvas },
  rustOnCream: { id: "rust-on-cream", label: "Rust on cream", fg: COLORS.accent, bg: COLORS.canvas },
  inkOnAmber: { id: "ink-on-amber", label: "Dark text on amber", fg: COLORS.ink, bg: COLORS.amber },
  inkOnCream: { id: "ink-on-cream", label: "K&A text on cream", fg: COLORS.ink, bg: COLORS.canvas },
} satisfies Record<string, Pair>;

export const ratioOf = (p: Pair): number => contrastRatio(p.fg, p.bg);

/** Linear sRGB-code interpolation between two hex colors, t 0 to 1. */
export function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const k = Math.max(0, Math.min(1, t));
  return (
    "#" +
    ca
      .map((v, i) => Math.round(v + (cb[i] - v) * k))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

export const shown = (ratio: number): string => `${formatRatio(ratio)} : 1`;
export const verdict = (ratio: number): string => (passesAA(ratio) ? "PASSES AA" : "FAILS AA");
export { passesAA };
