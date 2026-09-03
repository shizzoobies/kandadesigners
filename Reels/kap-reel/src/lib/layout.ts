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
