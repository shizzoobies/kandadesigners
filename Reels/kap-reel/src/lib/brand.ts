// Typed access to config/brand.json plus the per-project accent rotation from
// Section 6 of the handoff. Nothing here hardcodes a hex value.

import { staticFile } from "remotion";
import brandJson from "../../config/brand.json";

export const brand = brandJson;

export const COLORS = brandJson.colors;

/** Per-project accent rotation: rust, amber, teal on the dark band. */
export const PROJECT_ACCENTS: string[] = [
  COLORS.accent,
  COLORS.amber,
  COLORS.dark_accent,
];

export function projectAccent(index: number): string {
  return PROJECT_ACCENTS[index % PROJECT_ACCENTS.length];
}

/** Font family names, matched to what src/lib/fonts.ts registers. */
export const DISPLAY_FAMILY = brandJson.fonts.display.family;
export const BODY_FAMILY = brandJson.fonts.body.family;

/** Fallback stacks so a missing font file never renders as a serif surprise. */
export const DISPLAY_STACK = `"${DISPLAY_FAMILY}", "Helvetica Neue", Arial, sans-serif`;
export const BODY_STACK = `"${BODY_FAMILY}", "Helvetica Neue", Arial, sans-serif`;

/** Logo PNG as a static file URL. Public dir is ./assets. */
export const LOGO_PNG = staticFile(
  brandJson.logo.png.replace(/^assets\//, ""),
);
