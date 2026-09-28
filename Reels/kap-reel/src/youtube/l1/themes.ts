// The two working palettes proposed for L1, "Test your website with one key".
// Alex picks one at the style-frame gate; the other is deleted then.
//
// Both are built to sit next to the captures, which are the star: K&A's cream
// pages with the rust #9A3412 focus ring and amber buttons, and the plain gray
// test page. Neither uses purple or blue. Ratios are in the style-frame report
// (scripts/youtube/l1/style-frames.ts prints them) and assertThemeContrast()
// refuses to register either one if a text pair drops under AA.

import type { YouTubeTheme } from "../theme";

/**
 * A: graphite and focus yellow. A dark frame, so the cream captures read as a
 * lit screen, and a yellow accent that nods to the best-known focus style on
 * the web (a yellow highlight with a dark edge). The yellow is warm, so it sits
 * with the site's amber rather than fighting its rust.
 */
export const THEME_A: YouTubeTheme = {
  id: "a",
  name: "Graphite and focus yellow",
  bg: "#1A1917",
  surface: "#262420",
  ink: "#F4F1EA",
  muted: "#B8B1A6",
  accent: "#F2C94C",
  onAccent: "#1A1917",
  line: "#45413B",
  stageEdge: "#3A3732",
  shadow: "rgba(0, 0, 0, 0.45)",
  onCapture: "#7A5A00",
  onCaptureInk: "#FFFFFF",
  key: { face: "#F4F1EA", edge: "#9C958B", legend: "#1A1917" },
  lockup: "mono",
};

/**
 * B: stone and evergreen. A light, quiet frame one step darker than the site's
 * cream, so a capture still reads as a window, and a deep green accent: the
 * color of a passed check, which is what the six checks are. Green is the
 * complement of the rust ring, so the ring stays the loudest thing on screen.
 */
export const THEME_B: YouTubeTheme = {
  id: "b",
  name: "Stone and evergreen",
  bg: "#E6E3DD",
  surface: "#FBFAF7",
  ink: "#1D1C1A",
  muted: "#5C5750",
  accent: "#2F6B4F",
  onAccent: "#FFFFFF",
  line: "#CDC8BF",
  stageEdge: "#CFCAC1",
  shadow: "rgba(40, 35, 28, 0.16)",
  onCapture: "#2F6B4F",
  onCaptureInk: "#FFFFFF",
  key: { face: "#FFFFFF", edge: "#B5AFA5", legend: "#1D1C1A" },
  lockup: "light",
};

export const L1_THEMES = { a: THEME_A, b: THEME_B } as const;
export type L1ThemeId = keyof typeof L1_THEMES;
