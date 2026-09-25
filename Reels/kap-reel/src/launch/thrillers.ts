// The Thrillers Mobile VR launch reel, 2026-10-02 day folder.
//
// Pure data, no Remotion imports, so scripts/launch/thrillers-deliver.ts can
// read the same frames and copy the composition renders from when it writes
// the SRT. Every on-screen string lives here and nowhere else.
//
// Real captures only: three routes of the demo site recorded by
// scripts/launch/thrillers-capture.ts at 360x640 CSS, device scale 3, so each
// clip is 1080x1920. No context plates, so nothing on screen is AI assisted.

export const THRILLERS_PROJECT_ID = "thrillers-mobile-vr";

/** Capture ids in assets/captures/captures.json. */
export const THRILLERS_CAPTURES = {
  home: "thrillers-mobile-vr-home-vertical",
  experiences: "thrillers-mobile-vr-experiences-vertical",
  book: "thrillers-mobile-vr-book-vertical",
} as const;

export const LAUNCH_FPS = 30;
export const LAUNCH_TOTAL_FRAMES = 450;

/** A half-open frame range: [start, end). */
export type LaunchRange = { start: number; end: number };

/**
 * 66 + 96 + 120 + 90 + 78 = 450. The hook is longer than the showcase's 54
 * because this hook is ten words, not five. The experiences beat is the long
 * one because it has four stops to show. The end card keeps the showcase's 78
 * frames, which is what the drawn lockup needs not to strobe.
 */
export const LAUNCH_BEATS = {
  hook: { start: 0, end: 66 },
  home: { start: 66, end: 162 },
  experiences: { start: 162, end: 282 },
  book: { start: 282, end: 372 },
  cta: { start: 372, end: 450 },
} satisfies Record<string, LaunchRange>;

/** Frame the amber half of the hook slams in, relative to the hook. */
export const HOOK_SECOND_HALF_IN = 12;

export const HOOK_LINES = {
  first: ["No venue.", "No gear."],
  second: ["The arcade", "pulls up to", "your driveway."],
} as const;

/**
 * The hook plays the home capture full bleed, slowly, from the top of the
 * page. The home beat then picks the same scroll up where the hook left it,
 * so the cut to the device reads as a pull out rather than a restart:
 * 20 + 66 * 0.6 = 59.6, and the home beat starts on source frame 60.
 */
export const HOOK_PLAYBACK = { trimBefore: 20, playbackRate: 0.6 };

export type LaunchBeat = {
  key: "home" | "experiences" | "book";
  captureId: string;
  /** Lower third headline. Six words or fewer. */
  name: string;
  /** The one claim, cut in 12 frames after the beat opens and held. */
  claim: string;
  trimBefore: number;
  scrollPlaybackRate: number;
};

/**
 * Source windows, each inside the 180 frame clip:
 * - home: 60 to 141.6 at 0.85, straddling the peak of the eased scroll.
 * - experiences: 0 to 119 at 1. This clip is a stepped scroll with four
 *   stops, one per ride, laid out for exactly this beat (see the capture
 *   script), so it plays at rate 1 from its first frame.
 * - book: 40 to 129 at 1, still moving at the cut.
 *
 * The claims are the site's own words or plain descriptions of what the page
 * does. No numbers.
 */
export const LAUNCH_SHOWCASE: LaunchBeat[] = [
  {
    key: "home",
    captureId: THRILLERS_CAPTURES.home,
    name: "Thrillers Mobile VR",
    claim: "Veteran and family owned",
    trimBefore: 60,
    scrollPlaybackRate: 0.85,
  },
  {
    key: "experiences",
    captureId: THRILLERS_CAPTURES.experiences,
    name: "Pick an experience",
    claim: "Four rides, hundreds of worlds",
    trimBefore: 0,
    scrollPlaybackRate: 1,
  },
  {
    key: "book",
    captureId: THRILLERS_CAPTURES.book,
    name: "Book your event",
    claim: "Request a date online",
    trimBefore: 40,
    scrollPlaybackRate: 1,
  },
];

/** Relative frame the claim cuts in, the same 12 frames the showcase uses. */
export const LAUNCH_CLAIM_IN = 12;

export const LAUNCH_CTA = {
  launchLine: "Thrillers Mobile VR is live.",
  url: "ka-performancefl.com",
  call: "Call Alex, 904-210-1071",
  /** Draw length and copy cue, the showcase end card's 15 second numbers. */
  drawFrames: 66,
  copyIn: 47,
};

/** Frames for the three review stills, absolute. */
export const LAUNCH_STILLS = {
  hook: 40,
  experiences: 245,
  cta: 440,
  /** Home beat, device frame, hero in the screen, before the claim. */
  thumbnail: 72,
};

/** One SRT row per line of burned-in text, absolute frames, end exclusive. */
export type LaunchCueRow = { text: string; start: number; end: number; source: string };

export function launchCueRows(): LaunchCueRow[] {
  const b = LAUNCH_BEATS;
  const rows: LaunchCueRow[] = [
    { text: HOOK_LINES.first.join(" "), start: b.hook.start, end: b.hook.end, source: "LaunchThrillers.tsx" },
    {
      text: HOOK_LINES.second.join(" "),
      start: b.hook.start + HOOK_SECOND_HALF_IN,
      end: b.hook.end,
      source: "LaunchThrillers.tsx",
    },
  ];
  for (const beat of LAUNCH_SHOWCASE) {
    const range = b[beat.key];
    rows.push({ text: beat.name, start: range.start, end: range.end, source: "ProjectShowcase.tsx" });
    rows.push({
      text: beat.claim,
      start: range.start + LAUNCH_CLAIM_IN,
      end: range.end,
      source: "ProjectShowcase.tsx",
    });
  }
  const copyAt = b.cta.start + LAUNCH_CTA.copyIn;
  for (const text of [LAUNCH_CTA.launchLine, LAUNCH_CTA.url, LAUNCH_CTA.call]) {
    rows.push({ text, start: copyAt, end: b.cta.end, source: "LaunchThrillers.tsx" });
  }
  return rows;
}
