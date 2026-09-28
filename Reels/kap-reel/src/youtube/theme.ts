// The per-video working colors for the YouTube set.
//
// Alex, 2026-09-28 (SPEC.md "Decided by Alex" item 6): branding is fixed, color
// isn't. The K&A frame, the lockup, the type and the shapes and motion of every
// card are the same in every video; the colors those cards are drawn in are a
// theme each video passes in. So nothing in src/youtube/*.tsx names a color:
// every fill, line and text color below comes through this object. The one
// exception is the lockup, whose own colors are the brand mark (Lockup.tsx).
//
// Standing rules a theme must meet: no purple, no cobalt blue, and every text
// color passes WCAG 2.x contrast against what it sits on. assertThemeContrast()
// checks the text pairs the set actually draws and throws on a failure, so a
// theme that does not pass cannot register a composition.

import { AA_LARGE, AA_NORMAL, contrastRatio } from "../lib/contrast";

export type YouTubeTheme = {
  id: string;
  name: string;
  /** The frame: the rail and the margin around the stage. */
  bg: string;
  /** Cards, lower thirds and the end screen. */
  surface: string;
  /** Primary text, on bg and on surface. */
  ink: string;
  /** Secondary text, on bg and on surface. Still body-text contrast. */
  muted: string;
  /** Labels, ticks, progress and markers. Text-safe on bg and on surface. */
  accent: string;
  /** Text or glyphs drawn on an accent fill (the recap ticks). */
  onAccent: string;
  /** Hairlines, empty progress, slot frames. Decorative, no contrast rule. */
  line: string;
  /** The capture window's edge. */
  stageEdge: string;
  /** Drop shadow color for the stage and lower thirds. */
  shadow: string;
  /**
   * Marks drawn on top of a capture (the "focus is here" ring and its tag).
   * Captures are light pages, so this has to read on #F0F0F0 and on the
   * site's cream, whatever the theme's own accent is.
   */
  onCapture: string;
  /** Text on an onCapture fill. */
  onCaptureInk: string;
  /** The keycap the key overlay draws. */
  key: { face: string; edge: string; legend: string };
  /** Which drawing of the lockup reads on bg: "light" on a light frame, "mono" on a dark one. */
  lockup: "light" | "mono";
};

export type ContrastRow = {
  pair: string;
  fg: string;
  bg: string;
  ratio: number;
  needs: number;
  pass: boolean;
};

/**
 * Every text color pair the set draws, with the ratio it needs.
 *
 * 4.5 wherever the text can be small (labels at 20 to 26 px, body lines, the
 * URL in the rail). 3.0 only for the display headlines, which are 72 px and
 * up, and for non-text marks against the page they sit on.
 */
export function themeContrast(t: YouTubeTheme): ContrastRow[] {
  const rows: [string, string, string, number][] = [
    ["ink on bg", t.ink, t.bg, AA_NORMAL],
    ["muted on bg (rail URL, chapter)", t.muted, t.bg, AA_NORMAL],
    ["accent on bg", t.accent, t.bg, AA_NORMAL],
    ["ink on surface", t.ink, t.surface, AA_NORMAL],
    ["muted on surface", t.muted, t.surface, AA_NORMAL],
    ["accent on surface (labels)", t.accent, t.surface, AA_NORMAL],
    ["onAccent on accent (ticks)", t.onAccent, t.accent, AA_NORMAL],
    ["key legend on key face", t.key.legend, t.key.face, AA_NORMAL],
    ["onCaptureInk on onCapture (tag)", t.onCaptureInk, t.onCapture, AA_NORMAL],
    ["onCapture on demo page #F0F0F0 (mark)", t.onCapture, "#F0F0F0", AA_LARGE],
    [
      "onCapture on site cream #F8F5F2 (mark)",
      t.onCapture,
      "#F8F5F2",
      AA_LARGE,
    ],
    ["accent on surface (progress, non-text)", t.accent, t.surface, AA_LARGE],
  ];
  return rows.map(([pair, fg, bg, needs]) => {
    const ratio = contrastRatio(fg, bg);
    return {
      pair,
      fg,
      bg,
      ratio: Number(ratio.toFixed(2)),
      needs,
      pass: ratio >= needs,
    };
  });
}

export function assertThemeContrast(t: YouTubeTheme): void {
  const fails = themeContrast(t).filter((r) => !r.pass);
  if (fails.length > 0) {
    throw new Error(
      `Theme "${t.id}" fails contrast: ${fails
        .map(
          (f) =>
            `${f.pair} ${f.fg} on ${f.bg} = ${f.ratio}:1, needs ${f.needs}:1`,
        )
        .join("; ")}`,
    );
  }
}
