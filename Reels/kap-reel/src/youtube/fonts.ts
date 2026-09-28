// The type system for the YouTube set, fixed across every video.
//
//   display  Schibsted Grotesk 700      headlines, lower third lines
//   body     Atkinson Hyperlegible Next  list items, sub lines, keycap legends
//   labels   Lenia Mono SemiBold         small caps interpunct lines
//
// src/lib/fonts.ts registers Schibsted, Atkinson and the lockup's own faces
// (KA Playfair, KA Poppins); importing it here is the side effect that does it.
// Lenia Mono is registered here, SemiBold as the channel art uses it
// (Reels/youtube/channel-art/src/common.css), because labels run at 20 to 26 px
// and Regular reads thin at that size.

import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import "../lib/fonts";
import { BODY_STACK, DISPLAY_STACK, brand } from "../lib/brand";

export const MONO_FAMILY = brand.fonts.mono.family;

export const monoLoaded = loadFont({
  family: MONO_FAMILY,
  url: staticFile("brand/fonts/LeniaMono-SemiBold.ttf"),
  format: "truetype",
  weight: "600",
  display: "block",
});

export const DISPLAY = DISPLAY_STACK;
export const BODY = BODY_STACK;
export const MONO = `"${MONO_FAMILY}", "SFMono-Regular", Consolas, monospace`;
