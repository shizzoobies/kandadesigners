// Beat map for the vertical master, from kap-reel-handoff.md Section 6.
// 450 frames total at 30fps, 15 seconds. Cuts should land on these frame
// numbers so scene transitions land on a musical accent.

export const FPS = 30;
export const TOTAL_FRAMES = 450;

/** A half-open frame range: [start, end). */
export type FrameRange = {
  start: number;
  end: number;
};

export const HOOK: FrameRange = { start: 0, end: 36 };
export const PROJECT_1: FrameRange = { start: 36, end: 132 };
export const PROJECT_2: FrameRange = { start: 132, end: 228 };
export const PROJECT_3: FrameRange = { start: 228, end: 324 };
export const SURFACES_TOUR: FrameRange = { start: 324, end: 384 };
export const CALL_TO_ACTION: FrameRange = { start: 384, end: 450 };

export const PROJECT_BEATS: FrameRange[] = [PROJECT_1, PROJECT_2, PROJECT_3];

/**
 * Shot structure inside each 96-frame project beat, from Section 6b.
 * Frames are relative to the start of the project beat.
 */
export const PROJECT_BEAT_SHOTS = {
  /** Human context plate. Real person, real device, screen not expected to be readable. */
  plate: { start: 0, end: 24 } as FrameRange,
  /** Clean capture, straight on, site scrolling. The claim chip appears here. */
  cleanCapture: { start: 24, end: 96 } as FrameRange,
};

/** Length in frames of the plate shot within a project beat. Keep at or under this. */
export const PLATE_SHOT_MAX_FRAMES = 24;

/**
 * Surfaces tour cuts, relative to SURFACES_TOUR.start.
 *
 * Owner decision 2026-09-03: the capability montage is replaced by a surfaces
 * tour. The 324 to 384 slot stays where it is, but instead of three interaction
 * clips it now carries four cuts of 15 frames. Each cut is a different cleared
 * site, on a different device, held by a different person, with one word of
 * copy over it. The argument moves from "here are features" to "here is one
 * studio across four surfaces". The Payments cut stays dropped because
 * checkout is not live on any cleared site.
 *
 * Section 7 asks for a 24 frame minimum hold per line and these cuts hold 15.
 * Section 6 specified 15 frame montage cuts from the start, and the owner chose
 * the four-cut structure with that tradeoff in front of them, so 15 stands.
 */
export const SURFACES_TOUR_CUTS: FrameRange[] = [
  { start: 0, end: 15 }, // Booking
  { start: 15, end: 30 }, // Yours to edit
  { start: 30, end: 45 }, // Memberships
  { start: 45, end: 60 }, // Booking a call
];

/** Minimum frames the finished CTA card must hold so a screenshot is readable. */
export const CTA_HOLD_MIN_FRAMES = 36;
