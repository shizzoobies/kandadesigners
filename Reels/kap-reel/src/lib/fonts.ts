// Loads the licensed brand fonts out of assets/brand/fonts using @remotion/fonts.
// Importing this module once (from Root.tsx) registers both faces for every
// composition. Both files are variable, so a weight range is declared.

import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { BODY_FAMILY, DISPLAY_FAMILY } from "./brand";

export const displayFontLoaded = loadFont({
  family: DISPLAY_FAMILY,
  url: staticFile("brand/fonts/Schibsted-VF.woff2"),
  format: "woff2",
  weight: "400 900",
  display: "block",
});

export const bodyFontLoaded = loadFont({
  family: BODY_FAMILY,
  url: staticFile("brand/fonts/AtkinsonNext-VF.woff2"),
  format: "woff2",
  weight: "200 800",
  display: "block",
});
