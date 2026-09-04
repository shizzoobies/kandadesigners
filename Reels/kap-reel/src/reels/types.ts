// The content contract every reel is written against.
//
// Before 2026-09-04 the featured project list, the hook line, the tour cuts and
// every other string lived inside src/Reel.tsx and the scene components. That
// was fine while there was one reel. A second reel (the training content line)
// is the same fifteen and forty five second structures with different work in
// them, and Section 6 of the handoff is explicit that a second cut is a second
// composition sharing scene components, never a fork.
//
// So the strings and ids moved out here. src/Reel.tsx takes a ReelContent and
// renders it; src/reels/web.ts and src/reels/training.ts are the two values.
// Nothing in src/scenes may hardcode a project id, a capture id, a plate id or
// a line of copy any more: it arrives as a prop from the content config.

/**
 * Which cut a scene tree is rendering. "short" is the 15 second vertical
 * master from Section 6, "linkedin" the 45 second cut. Lives here rather than
 * in Reel.tsx so a content config can key its per-cut fields off it without
 * importing the component.
 */
export type ReelCut = "short" | "linkedin";

/**
 * A rectangle inside a capture's own pixel space, used to push a desktop
 * capture in on the part of the interaction that has to be readable on a
 * phone. A 2880x1800 module screenshot shown whole is unreadable in a 1080
 * wide frame; a 1200x750 region of it is not.
 */
export type ZoomRegion = {
  /** Left edge of the region, in capture pixels. */
  x: number;
  /** Top edge of the region, in capture pixels. */
  y: number;
  /** Width of the region, in capture pixels. */
  w: number;
  /** Height of the region, in capture pixels. */
  h: number;
};

/**
 * Which device the clean shot of a project beat sits inside. Both are drawn
 * devices in the same family: the phone is DeviceFrame, the laptop is
 * LaptopFrame. The third value this used to have, "browser", was a sketched
 * window with no device around it and was retired on 2026-09-04.
 */
export type CleanFrame = "phone" | "laptop";

/**
 * The full bleed shot behind the hook lines.
 *
 * "projectHome" is what the web reel does: look the home page capture up for a
 * project and let the crop decide mobile or desktop, because a 16:9 canvas
 * filled with a 780x1688 mobile capture throws most of the page away.
 * "capture" names one clip outright, which is what an interaction capture
 * needs: there is no mobile twin of "the hazard hunt, being played".
 */
export type HookShot =
  | {
      kind: "projectHome";
      projectId: string;
      trimBefore: number;
      playbackRate: number;
    }
  | {
      kind: "capture";
      captureId: string;
      trimBefore: number;
      playbackRate: number;
      zoom?: ZoomRegion;
    };

export type HookContent = {
  /**
   * Two halves of one kinetic line, both slammed on frame 0. The first is set
   * in canvas, the second in amber.
   */
  lines: [string, string];
  shot: HookShot;
};

/**
 * How the clean capture inside a project beat is played. Tuned per cut against
 * the source clip's own motion, and per beat where the clips differ; see the
 * long notes in src/lib/timing.ts and src/reels/training.ts.
 */
export type CapturePlayback = {
  trimBefore: number;
  scrollPlaybackRate: number;
};

/** One project beat, in either cut. */
export type FeaturedBeat = {
  /** Project id in config/projects.json. Must be cleared_for_public_showcase. */
  projectId: string;
  /** Plate in config/plates.json that fills the beat's first 24 frames. */
  plateId: string;
  /**
   * Capture composited into that plate's screen. Omitted falls back to the
   * plate's own captureId binding in config/plates.json.
   */
  plateCaptureId?: string;
  /**
   * Capture for the clean shot. Omitted falls back to the project's mobile home
   * page capture, which is what every web reel beat uses.
   */
  cleanCaptureId?: string;
  cleanFrame: CleanFrame;
  /**
   * Region of the clean capture to push in on. Only meaningful on a desktop
   * capture: a 16:10 module screen shown whole is not readable on a phone.
   */
  zoom?: ZoomRegion;
  /**
   * Trim and playback rate for this beat's clean shot, overriding the cut's own
   * default in `cleanCapture`.
   *
   * The web reel does not need this: every one of its clean shots is the same
   * 180 frame scripted scroll, so one rate per cut is right for all of them.
   * The training reel's clean shots are interaction recordings of different
   * lengths, each with its own idle stretches, and Section 6b's "nothing may be
   * frozen at the cut" has to be solved against the clip that is actually on
   * screen. See the per-beat notes in src/reels/training.ts.
   */
  cleanPlayback?: CapturePlayback;
  /** Lower third headline. Section 7 caps a text card at six words. */
  name: string;
  /**
   * How many lines that name wraps to at 1080 canvas width. Only used to
   * predict the lower third's height before it lays itself out, so the device
   * above it is sized against the right box in the stacked crops. Defaults to
   * one, which is what every web reel name fits in.
   */
  nameLines?: number;
  /** One line on what the business needed. LinkedIn cut only. */
  contextLine?: string;
  /** The one claim, held to the cut. */
  claim: string;
};

/** One cut of the surfaces tour: a plate, a capture in its screen, one word. */
export type TourCut = {
  /** Capture in assets/captures/captures.json that fills the plate's screen. */
  captureId: string;
  /** Plate in config/plates.json this capture is composited into. */
  plateId: string;
  /** The one word of copy over this cut. */
  word: string;
  /**
   * Source frame the capture starts on. Nonzero and different per cut wherever
   * the clips are the same scripted scroll, so no two surfaces are caught at
   * the same point.
   */
  captureFrameOffset: number;
  /** Seed for the handheld drift. One per cut, so hard cuts do not share a wobble. */
  driftSeed: string;
};

/**
 * Everything that differs between two reels built on the same scene tree.
 * Anything not in here is brand or structure and is the same in both.
 */
export type ReelContent = {
  /** Short identifier, for debugging and Sequence names. */
  id: string;
  hook: HookContent;
  /** Project beats per cut. The short cut takes two, the LinkedIn cut four. */
  featured: Record<ReelCut, FeaturedBeat[]>;
  /** Surfaces tour cuts per cut. Three in the short cut, four in the LinkedIn one. */
  tour: Record<ReelCut, TourCut[]>;
  /** Playback of the clean capture per cut. */
  cleanCapture: Record<ReelCut, CapturePlayback>;
  /** The three "how we work" lines. LinkedIn cut only. */
  howWeWorkLines: string[];
  /**
   * The accessibility beat's lines. LinkedIn cut only. An empty string is a
   * slot that is deliberately not rendered, which is how the web reel drops its
   * measured count when too few sites score 100.
   */
  accessibilityLines: string[];
  /** The line above the url on the CTA card, per cut. Undefined means no line. */
  ctaClosingLine: Record<ReelCut, string | undefined>;
  /** Accent rotation across project beats and tour cuts. */
  accents: string[];
};

/** The accent for the nth beat, wrapping. */
export function contentAccent(content: ReelContent, index: number): string {
  return content.accents[index % content.accents.length];
}
