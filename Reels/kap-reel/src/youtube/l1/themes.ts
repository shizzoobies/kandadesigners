// L1's working palette, "Test your website with one key".
//
// Stone and evergreen: Alex's pick at the style-frame gate, 2026-09-28, over a
// graphite and focus yellow option. A light, quiet frame one step darker than
// the site's cream, so a capture still reads as a window, and a deep green
// accent: the color of a passed check, which is what the six checks are. Green
// is the complement of the rust ring, so the ring stays the loudest thing on
// screen. No purple, no blue. Ratios are printed by
// scripts/youtube/l1/style-frames.ts, and assertThemeContrast() refuses to
// register the composition if a text pair drops under AA.

import type { YouTubeTheme } from "../theme";

export const L1_THEME: YouTubeTheme = {
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
