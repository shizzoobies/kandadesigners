// Lenia Mono, the third brand face, registered for the contrast tutorial.
//
// config/brand.json has carried the family and the two files since Phase 0, but
// src/lib/fonts.ts only registers the display and body faces plus the three the
// drawn lockup needs, because nothing in either showcase reel sets a line in
// mono. The contrast tutorial does: the spec sets the ratio in Lenia Mono, and a
// measurement is the one thing in these reels that has to look measured rather
// than written.
//
// It is registered here rather than in src/lib/fonts.ts because that file is
// shared and this is the only place the face is used. loadFont() takes a
// delayRender() of its own, so a render waits for the file the same way it waits
// for Schibsted and Atkinson.

import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { brand } from "../../../lib/brand";

export const MONO_FAMILY = brand.fonts.mono.family;

/**
 * SemiBold rather than Regular. The ratio is a headline sized number sitting
 * alone on an ink ground, and Lenia Mono Regular at 96px reads thin against
 * Schibsted at 800 next to it.
 */
export const monoFontLoaded = loadFont({
  family: MONO_FAMILY,
  url: staticFile("brand/fonts/LeniaMono-SemiBold.ttf"),
  format: "truetype",
  weight: "600",
  display: "block",
});

/** Fallback stack, so a missing file never renders the number proportionally. */
export const MONO_STACK = `"${MONO_FAMILY}", "SFMono-Regular", Consolas, "Liberation Mono", monospace`;
