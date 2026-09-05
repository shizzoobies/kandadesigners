// Everything the QA harness needs to know about where things are supposed to
// be, derived from the same modules the reel renders from.
//
// Nothing here restates a number that src/lib/layout.ts, src/lib/timing.ts,
// src/components/LaptopFrame.tsx or config/*.json already owns. If a layout
// rule changes, this file follows it without an edit, which is the only way a
// measurement harness stays honest.

import { noise2D } from "@remotion/noise";
import { COLORS } from "../../src/lib/brand";
import {
  SAFE_ZONES,
  safeArea,
  formatMetrics,
  type FormatKey,
} from "../../src/lib/layout";
import { getPlate, quadBounds, type PlateEntry } from "../../src/lib/plates";
import { hexToRgb, type Quad, type Rect, type RGB } from "./pixels";

/**
 * LAPTOP_SCREEN_ASPECT in src/components/LaptopFrame.tsx, restated because
 * tsconfig.scripts.json does not set --jsx and so cannot import a .tsx file.
 * It is the rule the owner asked for on 2026-09-04: a laptop screen is 16:10
 * whatever is playing on it, and check (c) exists to hold it. If the component
 * ever changes shape, this number has to change with it or check (c) starts
 * failing every laptop beat, which is the loud failure rather than the quiet
 * one.
 */
const LAPTOP_SCREEN_ASPECT = 16 / 10;

// ---------------------------------------------------------------------------
// Colours the reel paints with
// ---------------------------------------------------------------------------

/** The opaque lower third scrim. Same literal in Hook, ProjectShowcase, SurfacesTour. */
export const SCRIM: RGB = hexToRgb("#14100C");
export const SCRIM_TOL = 6;

/** DeviceFrame and LaptopFrame share this body colour. */
export const DEVICE_BODY: RGB = hexToRgb("#100D0A");
/**
 * Deliberately near exact.
 *
 * Two things sit close to the body colour: the lower third scrim at #14100C,
 * 5.4 away, and the dark pages some of these sites open on, which run within a
 * few code values of it across whole rows. A loose tolerance turns the band
 * into a device and turns a near black hero into bezel, and the second of those
 * broke the screen hole measurement outright: the first pass read the Fore
 * Motion phone's screen as 732x209 because most of the page matched the body.
 *
 * These are PNG stills of a flat CSS fill, so the body colour is exactly the
 * value the component sets and nothing has to be forgiven.
 */
export const DEVICE_TOL = 3;

export const INK: RGB = hexToRgb(COLORS.ink);
export const CANVAS: RGB = hexToRgb(COLORS.canvas);
export const DARK_CANVAS: RGB = hexToRgb(COLORS.dark_canvas);

/** LogoDraw's own palette, from src/components/LogoDraw.tsx. */
export const LOGO_RUST: RGB = hexToRgb("#a93c1c");
export const LOGO_FRAME: RGB = hexToRgb("#8b6f5c");

/**
 * The retired gold "K&A Designs" crest. config/brand.json says in as many
 * words that approved-logo-transparent.png must not be used, so the end card is
 * measured for it rather than trusted.
 */
export const RETIRED_GOLD: RGB = hexToRgb("#C09A5E");

/** Backdrops a page paints its own dead space with, for the screen fill check. */
export const FLAT_DARK: RGB = [0, 0, 0];
export const FLAT_LIGHT: RGB = [255, 255, 255];

// ---------------------------------------------------------------------------
// Formats
// ---------------------------------------------------------------------------

export type CompositionSpec = {
  id: string;
  reel: "web" | "training";
  format: FormatKey;
  cut: "short" | "linkedin";
  width: number;
  height: number;
  durationInFrames: number;
};

export function canvasCentre(format: FormatKey): number {
  return SAFE_ZONES[format].width / 2;
}

export function typeScale(format: FormatKey): number {
  return formatMetrics(format).typeScale;
}

/**
 * The three reserved platform rectangles, straight out of safeArea(). The
 * right strip runs the full canvas height, which is what SafeZoneOverlay draws
 * and what layout.ts derives.
 */
export function reservedZones(format: FormatKey): { name: string; rect: Rect }[] {
  const spec = SAFE_ZONES[format];
  const safe = safeArea(format);
  const zones: { name: string; rect: Rect }[] = [];
  if (safe.top > 0) {
    zones.push({ name: "top", rect: { x: 0, y: 0, w: spec.width, h: safe.top } });
  }
  if (safe.bottom < spec.height) {
    zones.push({
      name: "bottom",
      rect: { x: 0, y: safe.bottom, w: spec.width, h: spec.height - safe.bottom },
    });
  }
  if (safe.right < spec.width) {
    zones.push({
      name: "right",
      rect: { x: safe.right, y: 0, w: spec.width - safe.right, h: spec.height },
    });
  }
  return zones;
}

/**
 * Where the device is meant to be centred.
 *
 * Everywhere but landscape that is the canvas axis, per the owner's 2026-09-04
 * decision. In the landscape split the device sits inside the strip left of the
 * copy panel and centres in that, and the strip is a fraction of the canvas
 * width chosen by ProjectShowcase from whether the shot is a laptop.
 */
export function deviceCentreTarget(
  format: FormatKey,
  laptop: boolean,
): { target: number; note: string } {
  const spec = SAFE_ZONES[format];
  if (formatMetrics(format).showcase !== "split") {
    return { target: spec.width / 2, note: "canvas centre" };
  }
  const boxLeft = Math.round(spec.width * (laptop ? 0.025 : 0.06));
  const boxWidth = Math.round(spec.width * (laptop ? 0.3 : 0.23));
  return { target: boxLeft + boxWidth / 2, note: "split strip centre" };
}

/**
 * The aspect the device's screen hole must measure.
 *
 * A laptop screen is 16:10 whatever is playing on it, which is the rule
 * LAPTOP_SCREEN_ASPECT exists to hold. A phone screen is the shot's own
 * rectangle: the zoom region where a beat declares one, the capture's native
 * size where it does not.
 */
export function expectedScreenAspect(
  laptop: boolean,
  shotWidth: number,
  shotHeight: number,
): { aspect: number; label: string } {
  if (laptop) return { aspect: LAPTOP_SCREEN_ASPECT, label: "16:10" };
  return {
    aspect: shotWidth / shotHeight,
    label: `${shotWidth}x${shotHeight}`,
  };
}

// ---------------------------------------------------------------------------
// The plate quad, mapped from plate pixels onto the canvas
// ---------------------------------------------------------------------------

/**
 * Where a plate's screen quad lands on the canvas, on a given frame.
 *
 * PlateShot puts PlateComposite in a box offset by the quad's own centre and
 * then scales the whole thing about the canvas centre. PlateComposite lays the
 * plate out at its own pixel size, centred on the canvas, and applies
 * translate(drift) scale(cover * ramp) about the plate's centre. Composing
 * those gives, for a plate pixel p:
 *
 *   canvas = canvasCentre + cropScale * (drift - quadOffset + (p - plateCentre) * cover * ramp)
 *
 * The drift is the same @remotion/noise curve the composite uses, evaluated at
 * the frame the composite itself sees, which is the frame relative to the
 * innermost Sequence around it. The ramp is that same relative frame against
 * that Sequence's duration.
 *
 * If PlateComposite or PlateShot ever change how they place the plate, this is
 * the function that has to change with them, and check (d) will start reporting
 * nonsense until it does. That is the intended failure mode: a silent pass
 * would be worse.
 */
export function plateQuadOnCanvas(
  plateId: string,
  canvasWidth: number,
  canvasHeight: number,
  relativeFrame: number,
  shotDurationFrames: number,
  driftSeed?: string,
): { quad: Quad; plate: PlateEntry } {
  const plate = getPlate(plateId);
  const cover = Math.max(canvasWidth / plate.width, canvasHeight / plate.height);
  const bounds = quadBounds(plate.quad);

  // PlateShot.plateCrop, restated from the same inputs.
  const offsetX = (bounds.centerX - plate.width / 2) * cover;
  const offsetY = (bounds.centerY - plate.height / 2) * cover;
  const DRIFT_HEADROOM = 1.02;
  const cropScale =
    Math.max(
      1,
      canvasWidth / (canvasWidth + 2 * offsetX),
      canvasWidth / (2 * (plate.width - bounds.centerX) * cover),
      canvasHeight / (canvasHeight + 2 * offsetY),
      canvasHeight / (2 * (plate.height - bounds.centerY) * cover),
    ) * DRIFT_HEADROOM;

  // PlateComposite layer 1 motion.
  const DRIFT_PX = 5;
  const DRIFT_PERIOD_FRAMES = 90;
  const DEFAULT_SCALE_RAMP = 0.03;
  const seed = driftSeed ?? plate.id;
  const span = Math.max(1, shotDurationFrames - 1);
  const t = Math.min(1, Math.max(0, relativeFrame / span));
  const ramp = 1 + t * DEFAULT_SCALE_RAMP;
  const driftX =
    noise2D(`${seed}-x`, relativeFrame / DRIFT_PERIOD_FRAMES, 0) * DRIFT_PX;
  const driftY =
    noise2D(`${seed}-y`, relativeFrame / DRIFT_PERIOD_FRAMES, 11.3) * DRIFT_PX;

  const s = cover * ramp;
  const map = (p: readonly number[]): [number, number] => [
    canvasWidth / 2 +
      cropScale * (driftX - offsetX + (p[0] - plate.width / 2) * s),
    canvasHeight / 2 +
      cropScale * (driftY - offsetY + (p[1] - plate.height / 2) * s),
  ];

  const quad: Quad = [
    map(plate.quad[0]),
    map(plate.quad[1]),
    map(plate.quad[2]),
    map(plate.quad[3]),
  ];
  return { quad, plate };
}

export { safeArea, SAFE_ZONES, formatMetrics };
export type { FormatKey };
