// How a context plate is reframed for a delivery crop.
//
// This was private to src/components/PlateShot.tsx until 2026-09-05, and
// scripts/qa/geometry.ts restated it by hand so check (d) could follow the real
// screen quad. The restatement was already the fragile part of that check, and
// the rule below is longer than the one it replaces, so the arithmetic now
// lives here and both callers import it. Nothing in this file imports Remotion
// or React, which is what makes that possible.
//
// PlateComposite lays the plate out against the live canvas: it centres the
// plate on the canvas and scales it to cover. That is right for the 9:16
// master, where a 1536x2752 plate and a 1080x1920 canvas are within half a
// percent of the same aspect. It is wrong for 1080x1350, 1080x1080 and
// 1920x1080, where covering the canvas throws away the top and bottom of the
// plate and the device can drift out of frame entirely.
//
// This reframes the composite without touching it: it offsets the composite so
// the screen quad's centre lands on the canvas centre, then scales the whole
// thing up by the smallest factor that still covers the canvas after that
// offset. Nothing here knows about plate content. It reads the quad out of
// config/plates.json through src/lib/plates.ts, the same source PlateComposite
// warps the capture into.

import { quadBounds, type PlateEntry } from "./plates";

/**
 * Headroom over the exact coverage scale. PlateComposite drifts the plate a
 * few pixels on a noise curve to fake a handheld operator, and the scale ramp
 * is applied about the plate's own centre rather than the canvas centre, so
 * the exact figure would leave a hairline of background at an edge on some
 * frames. Two percent buys more margin than either can spend.
 */
export const DRIFT_HEADROOM = 1.02;

/**
 * The most of the canvas width the screen quad's bounding box may take.
 *
 * Owner fix 2026-09-05, and the fault that produced it is worth stating because
 * the mechanism is not obvious. Recentring on the quad is not free. Look at
 * where the composite's clip box sits: PlateComposite draws the plate centred
 * on the canvas at its own pixel size, scaled by cover, inside a box whose own
 * origin is the canvas origin. Everything above and to the left of that origin
 * has already been thrown away by the time this function runs. So shifting the
 * shot down, to bring a quad that sits high on the plate onto the canvas
 * centre, opens a gap at the top that no amount of plate can fill, and the only
 * way to close it is to push in.
 *
 * The push-in needed to close a gap of g at the top is h / (h - 2g), which runs
 * away as g approaches half the canvas height. t-desktop-wide in a 1920x1080
 * canvas is the case that ran away: its quad sits 111 plate pixels above the
 * plate centre, which is 139 canvas pixels, and closing that gap took a scale
 * of 1.372. At that scale the quad's bounding box measured 1919 by 1112 on a
 * 1920 by 1080 canvas. The monitor, the desk and the room were all off canvas
 * and the shot was a full bleed web page. Check (d) read 96 percent of the ring
 * as flat page backdrop and failed it, correctly.
 *
 * So the recentring is now capped rather than the push-in: the offsets are
 * taken as far as they can go without driving the quad's bounding box past this
 * fraction of the canvas width, and no further. Where even that is not enough,
 * covering the canvas wins and the quad stays wider than the cap, because a
 * letterboxed plate is not an option. That is a property of the plate rather
 * than of the crop: t-desktop-wide's quad is 1119 of 1536 plate pixels wide, 73
 * percent of the plate, so no framing of it can be 70 percent of a canvas the
 * plate has to cover. plateCrop reports which case each shot is in.
 */
export const QUAD_WIDTH_CAP = 0.7;

export type PlateCrop = {
  /** Offset of the composite's own box from the canvas origin, in canvas px. */
  left: number;
  top: number;
  /** Size of that box. Oversized on purpose: it is the composite's clip rect. */
  width: number;
  height: number;
  /** Push in about the canvas centre, applied after the offset. */
  scale: number;
  /**
   * True when covering the canvas already puts the quad past QUAD_WIDTH_CAP, so
   * the cap could not be met and coverage decided the shot. Reported rather
   * than corrected: the alternative is a letterbox.
   */
  coverBinds: boolean;
  /** The quad's bounding box width on the canvas, as a fraction of it. */
  quadWidthFraction: number;
};

/**
 * The offset and push-in that frame `plate`'s screen quad on a
 * canvasWidth by canvasHeight canvas.
 *
 * Assumes what PlateComposite documents about itself: the plate is drawn at
 * its own pixel size, centred on the canvas, scaled by cover(). If that ever
 * changes, this is the function that has to change with it.
 *
 * The four coverage terms are the four half widths that have to survive the
 * offset: the composite's own clip box on the left and top, because that box
 * begins at the canvas origin and carries no content behind it, and the plate's
 * far edge on the right and bottom, because the box is sized past it there.
 * Each gives a minimum scale, and the shot takes the largest.
 */
export function plateCrop(
  plate: PlateEntry,
  canvasWidth: number,
  canvasHeight: number,
): PlateCrop {
  const cover = Math.max(
    canvasWidth / plate.width,
    canvasHeight / plate.height,
  );
  const quad = quadBounds(plate.quad);

  // Half the plate's rendered size, which is how far its far edges reach past
  // the canvas centre before any push-in.
  const halfPlateWidth = (plate.width * cover) / 2;
  const halfPlateHeight = (plate.height * cover) / 2;

  const coverageScale = (offsetX: number, offsetY: number): number =>
    Math.max(
      1,
      canvasWidth / 2 / (offsetX + canvasWidth / 2),
      canvasWidth / 2 / (halfPlateWidth - offsetX),
      canvasHeight / 2 / (offsetY + canvasHeight / 2),
      canvasHeight / 2 / (halfPlateHeight - offsetY),
    );

  // How far the quad centre sits from the plate centre, in canvas pixels.
  // Undoing all of it is what would recentre the shot on the device.
  const wantX = (quad.centerX - plate.width / 2) * cover;
  const wantY = (quad.centerY - plate.height / 2) * cover;

  // The cap, turned into the largest coverage term the shot may pay for, and
  // then into the widest offset that stays under it on each axis. Both bounds
  // straddle zero for any limit at or above 1, so no plate is ever left with an
  // empty interval and no crop ever letterboxes.
  const capScale = (QUAD_WIDTH_CAP * canvasWidth) / (quad.width * cover);
  const limit = Math.max(1, capScale / DRIFT_HEADROOM);
  const clamp = (v: number, lo: number, hi: number): number =>
    Math.min(hi, Math.max(lo, v));
  const offsetX = clamp(
    wantX,
    (canvasWidth / 2) * (1 / limit - 1),
    halfPlateWidth - canvasWidth / (2 * limit),
  );
  const offsetY = clamp(
    wantY,
    (canvasHeight / 2) * (1 / limit - 1),
    halfPlateHeight - canvasHeight / (2 * limit),
  );

  const scale = coverageScale(offsetX, offsetY) * DRIFT_HEADROOM;

  return {
    left: -offsetX,
    top: -offsetY,
    // The composite clips its own content to this box. It reaches past the
    // plate on the right and the bottom; on the left and the top it begins at
    // the canvas origin, which is the whole reason the cap above exists.
    width: canvasWidth + plate.width * cover,
    height: canvasHeight + plate.height * cover,
    scale,
    coverBinds: capScale < DRIFT_HEADROOM,
    quadWidthFraction: (quad.width * cover * scale) / canvasWidth,
  };
}
