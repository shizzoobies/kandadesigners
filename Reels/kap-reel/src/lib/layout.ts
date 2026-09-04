// Safe zones per output format, from kap-reel-handoff.md Section 8.
// Facebook Reels and LinkedIn vertical both overlay UI. Keep all text and
// the logo inside the safe area returned by safeArea().

export type FormatKey =
  | "vertical"
  | "feedVertical"
  | "square"
  | "landscape";

export type SafeZoneSpec = {
  key: FormatKey;
  width: number;
  height: number;
  /** Fraction of height reserved at the top, 0 to 1. */
  topReserved: number;
  /** Fraction of height reserved at the bottom, 0 to 1. */
  bottomReserved: number;
  /** Fraction of width reserved at the right, 0 to 1. */
  rightReserved: number;
};

export const SAFE_ZONES: Record<FormatKey, SafeZoneSpec> = {
  vertical: {
    key: "vertical",
    width: 1080,
    height: 1920,
    topReserved: 0.15,
    bottomReserved: 0.2,
    rightReserved: 0.1,
  },
  feedVertical: {
    key: "feedVertical",
    width: 1080,
    height: 1350,
    topReserved: 0.08,
    bottomReserved: 0.08,
    rightReserved: 0.05,
  },
  square: {
    key: "square",
    width: 1080,
    height: 1080,
    topReserved: 0.05,
    bottomReserved: 0.05,
    rightReserved: 0.05,
  },
  landscape: {
    key: "landscape",
    width: 1920,
    height: 1080,
    topReserved: 0.05,
    bottomReserved: 0.08,
    rightReserved: 0.05,
  },
};

export type SafeAreaBounds = {
  /** Pixel bounds of the safe area, left/top inclusive, right/bottom exclusive. */
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

/**
 * Returns the pixel bounds of the safe area for a given format: the region
 * inside the canvas that is not covered by a platform's reserved top, bottom,
 * or right zones. Text and the logo must stay inside these bounds.
 */
export function safeArea(format: FormatKey): SafeAreaBounds {
  const spec = SAFE_ZONES[format];
  const top = Math.round(spec.height * spec.topReserved);
  const bottom = spec.height - Math.round(spec.height * spec.bottomReserved);
  const right = spec.width - Math.round(spec.width * spec.rightReserved);
  const left = 0;

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

/**
 * Side padding a full width band is authored with at 1080 canvas width, before
 * the reserved right strip is taken into account. See centeredPadding().
 */
const BAND_PAD = 72;

/**
 * Symmetric side padding for a full width band or column, so the content box
 * inside it is centred on the CANVAS rather than on the safe area.
 *
 * Owner decision 2026-09-04: everything horizontally centred centres on the
 * canvas. A band that pads 72 on the left and 108 on the right centres its copy
 * 18 pixels left of the canvas centre, and the copy centred on the safe area
 * was another 54 left of that in the vertical crop. Both read as a layout that
 * is off axis, because it is.
 *
 * The reserved right strip still matters, so the padding is the larger of the
 * authored margin and the strip's own width. That makes the content box the
 * widest box that is both centred on the canvas and clear of the strip: in the
 * vertical crop it is exactly 108 to 972, whose right edge is safe.right. A
 * line too wide for that box wraps inside it rather than running into the
 * platform UI, and every line, wrapped or not, centres on the canvas.
 */
export function centeredPadding(format: FormatKey, scale: number): number {
  const spec = SAFE_ZONES[format];
  const safe = safeArea(format);
  return Math.max(Math.round(BAND_PAD * scale), spec.width - safe.right);
}

/**
 * A box of a known width, centred on the canvas and then pulled back inside the
 * reserved right strip.
 *
 * The rule, in order:
 *   1. Centre the box on the canvas.
 *   2. If its right edge would pass safe.right, shift it left by exactly that
 *      overflow, so it ends on safe.right and not a pixel further.
 *   3. Never shift it past safe.left.
 *
 * Step 2 only engages for a box wider than twice the distance from the canvas
 * centre to safe.right, which is 864 pixels in the vertical crop and wider than
 * anything the reel draws. Where it does engage the box is no longer centred,
 * which is the trade the owner asked for: clear of the platform UI first,
 * centred second.
 */
export function centeredBox(
  format: FormatKey,
  boxWidth: number,
): { left: number; width: number } {
  const spec = SAFE_ZONES[format];
  const safe = safeArea(format);
  const width = Math.min(Math.round(boxWidth), spec.width);
  let left = Math.round((spec.width - width) / 2);
  const overflow = left + width - safe.right;
  if (overflow > 0) left -= overflow;
  if (left < safe.left) left = safe.left;
  return { left, width };
}

/**
 * How a project beat arranges the clean capture against its lower third.
 *
 * "overlay" is the vertical master: the phone frame runs nearly the full
 * canvas height and the band sits on top of its lower part.
 * "stack" is the feed and square crops: the phone frame shrinks to fit the
 * space above a full width band, so no text ever lands on the capture.
 * "split" is landscape: the phone frame sits left of center and the lower
 * third becomes a panel beside it, because a 9:16 phone at full height plus a
 * band underneath cannot both fit in 1080 pixels of canvas height.
 */
export type ShowcaseMode = "overlay" | "stack" | "split";

export type FormatMetrics = {
  /**
   * Multiplier on every type size and padding authored against a 1080 wide
   * canvas. Section 7's "48px minimum at 1080 width" is a relative rule, so
   * landscape scales up rather than rendering visually smaller type.
   */
  typeScale: number;
  /**
   * Distance from the canvas bottom to the bottom edge of a bottom-anchored
   * band. Clears the reserved bottom zone plus a margin proportional to the
   * safe area, so no band ever sits flush against the reserved edge.
   */
  bandBottom: number;
  showcase: ShowcaseMode;
  /**
   * Viewport the full-bleed hook capture uses in this crop. A 780x1688 mobile
   * capture cropped to fill a 16:9 canvas throws away most of the page, so the
   * wide crops take the desktop capture instead. Both cover, neither letterboxes.
   */
  hookViewport: "mobile" | "desktop";
};

const SHOWCASE_MODES: Record<FormatKey, ShowcaseMode> = {
  vertical: "overlay",
  feedVertical: "stack",
  square: "stack",
  landscape: "split",
};

const HOOK_VIEWPORTS: Record<FormatKey, "mobile" | "desktop"> = {
  vertical: "mobile",
  feedVertical: "mobile",
  square: "desktop",
  landscape: "desktop",
};

/**
 * The per-format numbers every scene lays out from. Nothing in src/scenes may
 * hardcode a pixel position: it comes from here or from safeArea().
 */
export function formatMetrics(format: FormatKey): FormatMetrics {
  const spec = SAFE_ZONES[format];
  const safe = safeArea(format);

  return {
    typeScale: spec.width / 1080,
    bandBottom:
      spec.height - safe.bottom + Math.round(safe.height * 0.06),
    showcase: SHOWCASE_MODES[format],
    hookViewport: HOOK_VIEWPORTS[format],
  };
}
