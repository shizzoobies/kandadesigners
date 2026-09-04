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

// The three faces the drawn logo lockup uses, copied from the live site's
// public/fonts. They are subsets of Playfair Display and Poppins carrying only
// the glyphs K A & P E R F O M N C, which is everything LogoDraw draws, so all
// three together are 6KB. The family names match the site's, so the
// coordinates in LogoDraw stay a straight copy of the site's CSS.

export const logoSerifLoaded = loadFont({
  family: "KA Playfair",
  url: staticFile("brand/fonts/ka-playfair-500.woff2"),
  format: "woff2",
  weight: "500",
  style: "normal",
  display: "block",
});

export const logoSerifItalicLoaded = loadFont({
  family: "KA Playfair",
  url: staticFile("brand/fonts/ka-playfair-italic-600.woff2"),
  format: "woff2",
  weight: "600",
  style: "italic",
  display: "block",
});

export const logoSansLoaded = loadFont({
  family: "KA Poppins",
  url: staticFile("brand/fonts/ka-poppins-500.woff2"),
  format: "woff2",
  weight: "500",
  style: "normal",
  display: "block",
});
