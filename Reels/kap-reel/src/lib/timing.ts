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
export const CAPABILITY_MONTAGE: FrameRange = { start: 324, end: 384 };
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
 * Capability montage, relative to CAPABILITY_MONTAGE.start.
 *
 * Section 6 specified four cuts at 15 frames. The Payments cut was dropped on
 * 2026-09-03 (see the _decisions block in config/projects.json) because
 * checkout is not live on any cleared site, so the remaining three cuts run
 * 20 frames each and the montage still ends on frame 384.
 */
export const CAPABILITY_MONTAGE_CUTS: FrameRange[] = [
  { start: 0, end: 20 }, // Booking
  { start: 20, end: 40 }, // AI
  { start: 40, end: 60 }, // Yours to edit
];

/** Minimum frames the finished CTA card must hold so a screenshot is readable. */
export const CTA_HOLD_MIN_FRAMES = 36;
