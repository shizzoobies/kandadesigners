// Geometry and motion shared by every YouTube video. Fixed, like the brand.
//
// The frame is three bands:
//   top rail     the lockup and ka-performancefl.com at the left, the chapter
//                at the right
//   stage        one 16:9 window; captures, cards and the end screen live in
//                it, and a zoom happens inside it, so the frame never moves
//   bottom rail  the lower third at the left, the pressed key at the right
// Nothing but the "focus is here" mark is ever drawn over a capture, so the
// captures stay whole and the lower third and the keys can never collide.

import { Easing, interpolate } from "remotion";

export const FPS = 30;
export const W = 1920;
export const H = 1080;

/** The stage: 1536x864 is exactly 16:9, 192 px in from each side. */
export const STAGE = { x: 192, y: 100, w: 1536, h: 864 } as const;

/** The top rail's vertical center, and the lockup's height in it. */
export const RAIL_MID = 50;
export const LOCKUP_H = 58;

/** The bottom rail: from the stage's foot to the frame's. */
export const BOTTOM_RAIL = {
  y: STAGE.y + STAGE.h,
  h: H - STAGE.y - STAGE.h,
} as const;

/** Card padding inside the stage. */
export const CARD_PAD_X = 120;

export type Box = { x: number; y: number; w: number; h: number };

/** The one ease-out every entrance uses, the house curve (src/social/*). */
export const easeOut = Easing.bezier(0.2, 0.8, 0.2, 1);
export const easeInOut = Easing.inOut(Easing.cubic);

/** 0 to 1 over `len` frames from `start`, eased out and clamped. */
export function rise(frame: number, start: number, len = 12): number {
  return interpolate(frame, [start, start + len], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
}
