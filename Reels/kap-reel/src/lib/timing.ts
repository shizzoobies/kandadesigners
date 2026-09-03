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

/**
 * Owner decision 2026-09-03, after watching the first cut: at three projects
 * plus a four cut tour the 15 second master jumped too fast to read. Nothing
 * was wrong with any single beat, there were simply eight hard cuts in fifteen
 * seconds and no line stayed on screen long enough to finish.
 *
 * The fix keeps the fifteen seconds and spends them on fewer things:
 *
 * - The hook holds 54 frames instead of 36. The line still slams on frame 0,
 *   so Section 6's "first frame already moving" is intact, but 1.8s is enough
 *   to read five words rather than daring the viewer to.
 * - Two featured projects instead of three, at 140 frames each instead of 96.
 *   The plate stays at the Section 6b cap of 24 frames, so the whole extra 44
 *   frames goes to the clean capture, which is the shot that has to be
 *   readable. The claim now holds 104 frames instead of 60.
 * - Three tour cuts of 18 frames instead of four of 15. Still under the
 *   Section 7 minimum, still the deliberate exception Section 6 wrote in, but
 *   three cuts of 18 read as three glances rather than four flickers.
 * - Southern Legacy Contractors leaves the featured list in this cut only. It
 *   keeps its site on screen as the third tour cut, and it is unchanged in the
 *   45 second cut, which still features all four projects.
 *
 * Total is still 450 frames: 54 + 140 + 140 + 54 + 62.
 */
export const HOOK: FrameRange = { start: 0, end: 54 };
export const PROJECT_1: FrameRange = { start: 54, end: 194 };
export const PROJECT_2: FrameRange = { start: 194, end: 334 };
export const SURFACES_TOUR: FrameRange = { start: 334, end: 388 };
export const CALL_TO_ACTION: FrameRange = { start: 388, end: 450 };

export const PROJECT_BEATS: FrameRange[] = [PROJECT_1, PROJECT_2];

/**
 * Shot structure inside each 140-frame project beat, from Section 6b.
 * Frames are relative to the start of the project beat.
 */
export const PROJECT_BEAT_SHOTS = {
  /** Human context plate. Real person, real device, screen not expected to be readable. */
  plate: { start: 0, end: 24 } as FrameRange,
  /** Clean capture, straight on, site scrolling. The claim chip appears here. */
  cleanCapture: { start: 24, end: 140 } as FrameRange,
};

/**
 * How the clean capture is played across the 116 frame shot of a re-paced
 * project beat.
 *
 * The captures are 180 source frames of an easeInOutCubic scroll over indices
 * 0 to 179, so both ends are nearly stationary and only the middle carries real
 * velocity. The old 72 frame shot played rate 1 from source frame 54 and ended
 * on source 126, comfortably inside the moving part. Keeping rate 1 from 54
 * across 116 frames would run to source 170, which is deep in the ease-out
 * tail: the derivative there is about one percent of its peak, so the page has
 * visibly stopped before the cut.
 *
 * Rate 0.8 from source frame 40 consumes 92.8 source frames and puts the last
 * output frame on source 132.8. Normalised that is t 0.22 to 0.74, which
 * straddles the midpoint of the ease, so the shot opens at about 20 percent of
 * the ease's peak speed, runs through the peak in the middle, and still carries
 * about 26 percent of peak at the cut. In pixels that is roughly 6 source
 * pixels per source frame at the open, near 31 in the middle and about 8 at the
 * cut. Nothing freezes and nothing loops.
 *
 * The plate shot runs at the same rate, so ProjectShowcase starts its capture
 * at 40 minus round(24 * 0.8) = source frame 21 and it arrives at source 40 on
 * the frame the clean capture takes over. Scroll velocity matches across the
 * cut, which is what Section 6b asks for.
 *
 * The cost of any rate under 1 is duplicated frames: at 0.8 the source index
 * advances on four output frames in five, so the scroll steps at about 24Hz
 * rather than 30. That is a far smaller penalty than the 18Hz the LinkedIn
 * cut pays, and it reads as what it is, a screen recording.
 */
export const SHORT_CLEAN_CAPTURE = {
  trimBefore: 40,
  scrollPlaybackRate: 0.8,
};

/** Length in frames of the plate shot within a project beat. Keep at or under this. */
export const PLATE_SHOT_MAX_FRAMES = 24;

/**
 * Surfaces tour cuts, relative to SURFACES_TOUR.start.
 *
 * Owner decision 2026-09-03: the capability montage is replaced by a surfaces
 * tour. Each cut is a different cleared site, on a different device, held by a
 * different person, with one word of copy over it. The argument moves from
 * "here are features" to "here is one studio across these surfaces". The
 * Payments cut stays dropped because checkout is not live on any cleared site.
 *
 * Re-paced 2026-09-03 with the rest of the 15 second cut: three cuts of 18
 * frames rather than four of 15. Section 7 asks for a 24 frame minimum hold
 * per line and these still hold less. Section 6 specified 15 frame montage
 * cuts from the start and the owner chose this structure with that tradeoff in
 * front of them, so the exception stands, but 18 frames is 20 percent closer
 * to the minimum than 15 and one fewer cut is one fewer thing to read.
 */
export const SURFACES_TOUR_CUTS: FrameRange[] = [
  { start: 0, end: 18 }, // Booking
  { start: 18, end: 36 }, // Yours to edit
  { start: 36, end: 54 }, // No page builder
];

/** Minimum frames the finished CTA card must hold so a screenshot is readable. */
export const CTA_HOLD_MIN_FRAMES = 36;

// ---------------------------------------------------------------------------
// Beat map shape
// ---------------------------------------------------------------------------

/**
 * The scene slots a cut fills. Both cuts render the same scene tree in
 * src/Reel.tsx, so the tree reads one shape and the map decides what exists.
 * A null slot means that scene is not in this cut at all.
 */
export type BeatMap = {
  hook: FrameRange;
  howWeWork: FrameRange | null;
  projects: FrameRange[];
  surfacesTour: FrameRange;
  accessibility: FrameRange | null;
  callToAction: FrameRange;
};

/** The 15 second vertical master, restated as a beat map. Same numbers as above. */
export const SHORT_BEATS: BeatMap = {
  hook: HOOK,
  howWeWork: null,
  projects: PROJECT_BEATS,
  surfacesTour: SURFACES_TOUR,
  accessibility: null,
  callToAction: CALL_TO_ACTION,
};

// ---------------------------------------------------------------------------
// LinkedIn cut, 45 seconds
// ---------------------------------------------------------------------------

// Beat map for the 45 second LinkedIn cut, from kap-reel-handoff.md Section 6,
// "Timeline: LinkedIn cut". 1350 frames at 30fps. Same composition and the same
// scene components as the 15 second master, with two extra beats inserted and
// every project beat opened up from 96 frames to 210.

export const LINKEDIN_TOTAL_FRAMES = 1350;

export const LINKEDIN_HOOK: FrameRange = { start: 0, end: 36 };
export const LINKEDIN_HOW_WE_WORK: FrameRange = { start: 36, end: 156 };
export const LINKEDIN_PROJECT_1: FrameRange = { start: 156, end: 366 };
export const LINKEDIN_PROJECT_2: FrameRange = { start: 366, end: 576 };
export const LINKEDIN_PROJECT_3: FrameRange = { start: 576, end: 786 };
export const LINKEDIN_PROJECT_4: FrameRange = { start: 786, end: 996 };
export const LINKEDIN_SURFACES_TOUR: FrameRange = { start: 996, end: 1076 };
export const LINKEDIN_ACCESSIBILITY: FrameRange = { start: 1076, end: 1226 };
export const LINKEDIN_CALL_TO_ACTION: FrameRange = { start: 1226, end: 1350 };

export const LINKEDIN_PROJECT_BEATS: FrameRange[] = [
  LINKEDIN_PROJECT_1,
  LINKEDIN_PROJECT_2,
  LINKEDIN_PROJECT_3,
  LINKEDIN_PROJECT_4,
];

export const LINKEDIN_BEATS: BeatMap = {
  hook: LINKEDIN_HOOK,
  howWeWork: LINKEDIN_HOW_WE_WORK,
  projects: LINKEDIN_PROJECT_BEATS,
  surfacesTour: LINKEDIN_SURFACES_TOUR,
  accessibility: LINKEDIN_ACCESSIBILITY,
  callToAction: LINKEDIN_CALL_TO_ACTION,
};

/**
 * The three "how we work" lines, as frames relative to the beat start. Each
 * arrives 30 frames after the previous and all three hold to the cut at 120.
 */
export const LINKEDIN_HOW_WE_WORK_LINES = [0, 30, 60];

/**
 * Shot structure inside a 210 frame LinkedIn project beat. The plate stays at
 * the Section 6b cap of 24 frames, so the whole extra 114 frames goes to the
 * clean capture, which is the shot that has to be readable.
 */
export const LINKEDIN_PROJECT_BEAT_SHOTS = {
  plate: { start: 0, end: 24 } as FrameRange,
  cleanCapture: { start: 24, end: 210 } as FrameRange,
};

/**
 * When the context line and the claim occupy the shared copy slot, relative to
 * the beat start. They never overlap: the context line is fully typed on by 40,
 * is cut at 120, and the claim does not arrive until 126. The six frame gap is
 * deliberate slack so no rounding can put both on screen in the same frame.
 */
export const LINKEDIN_PROJECT_COPY = {
  /** Frame the context line finishes typing on. It starts revealing at the cut. */
  contextIn: 40,
  /** Frame the context line cuts out. Holds 80 frames, well over the 24 minimum. */
  contextOut: 120,
  /** Frame the claim cuts in. Holds 84 frames to the end of the beat. */
  claimIn: 126,
};

/**
 * How the clean capture is played across the 186 frame shot.
 *
 * The captures are 180 source frames of an easeInOutCubic scroll over indices
 * 0 to 179, so both ends of the source are nearly stationary and only the
 * middle carries real velocity. 186 output frames of a 180 frame source
 * therefore cannot be played at rate 1, and the obvious fix of slowing to 0.8
 * from source frame 24 runs to source frame 173, which is deep in the ease-out
 * tail: the derivative of the ease there is about 0.6 percent of its peak, so
 * the page is moving a fifth of a pixel per frame and the shot ends frozen.
 *
 * Rate 0.6 from source frame 34 consumes 111.6 source frames and the last
 * output frame of the beat sits on source frame 145. Normalised, that is t
 * 0.19 to 0.81, symmetric about the midpoint of the ease, so the shot starts
 * and ends at exactly the same speed: about 4.5 source pixels per source frame,
 * which is 2.7 pixels of travel between the last two frames of the beat. The
 * middle of the shot runs at the ease's peak, near 31 source pixels per frame.
 * Nothing freezes and nothing loops.
 *
 * The cost of any rate under 1 is duplicated frames: at 0.6 the source index
 * advances on three output frames in five, so the scroll steps at about 18Hz
 * rather than 30. That is unavoidable here, because the source only carries
 * roughly 135 frames of real motion and the beat asks for 186, and it reads as
 * what it is, a screen recording. Slowing further to fit a wider source window
 * makes the stepping worse, not better.
 */
export const LINKEDIN_CLEAN_CAPTURE = {
  trimBefore: 34,
  scrollPlaybackRate: 0.6,
};

/**
 * Surfaces tour cuts for the LinkedIn cut, relative to the beat start. Four
 * cuts of 20 frames rather than the master's 15, which is closer to the
 * Section 7 minimum of 24 without stretching the tour past its 80 frame slot.
 */
export const LINKEDIN_SURFACES_TOUR_CUTS: FrameRange[] = [
  { start: 0, end: 20 }, // Yours to edit
  { start: 20, end: 40 }, // Memberships
  { start: 40, end: 60 }, // Booking a call
  { start: 60, end: 80 }, // Discovery calls
];

/**
 * The three accessibility lines, as frames relative to the beat start. All
 * three hold to the cut at 150.
 */
export const LINKEDIN_ACCESSIBILITY_LINES = [0, 45, 90];
