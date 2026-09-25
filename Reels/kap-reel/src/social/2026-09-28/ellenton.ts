// Ellenton Family Practice Direct, top three reel, 2026-09-28 day folder.
//
// Pure data, no Remotion imports, so scripts/social/2026-09-28/deliver.ts reads
// the same frames and copy the composition renders from when it writes the SRT.
// Every on-screen string lives here and nowhere else.
//
// Footage is Alex's own incognito recordings from 2026-09-24, 1280x720 at 30fps,
// copied unedited into assets/social/2026-09-28/. Regions and overlay boxes are
// in those 1280x720 source pixels. Nothing on the Google page is altered: the
// ring, pin pulse and highlight are drawn on top, pointing at what is there.

export const FPS = 30;
export const TOTAL_FRAMES = 450;

export const ASSETS = {
  take2: "social/2026-09-28/take2.mp4",
  take1: "social/2026-09-28/take1.mp4",
  /** take2 at 8.6s: the clean map pack, extracted as a still. */
  mapPack: "social/2026-09-28/take2-mappack-8.6s.png",
} as const;

export type Range = { start: number; end: number };

export const BEATS = {
  hook: { start: 0, end: 45 },
  typing: { start: 45, end: 120 },
  map: { start: 120, end: 225 },
  overview: { start: 225, end: 315 },
  build: { start: 315, end: 360 },
  cta: { start: 360, end: 450 },
} satisfies Record<string, Range>;

/** A rectangle in 1280x720 source pixels. */
export type Box = { x: number; y: number; w: number; h: number };

/** Ellenton Family Practice Direct listing block in the take 2 map pack. */
export const LISTING_BOX: Box = { x: 158, y: 518, w: 462, h: 122 };
/** The Ellenton pin on the take 2 map. */
export const PIN = { x: 733, y: 531 };
/** "ELLENTON FAMILY PRACTICE DIRECT" in the take 1 AI Overview text. */
export const OVERVIEW_NAME_BOX: Box = { x: 115, y: 465, w: 146, h: 14 };

/**
 * Card inner aspect: 942 wide inside a 3px rust edge (the card runs x 24 to
 * 972, as wide as the stage allows with the right 10% clear), 734 tall below
 * its chrome strip.
 */
export const CARD_ASPECT = 942 / 734;

/** The AI Overview card is shorter: 942 wide, 540 tall inside. */
export const OVERVIEW_ASPECT = 942 / 540;

const region = (x: number, y: number, w: number): Box => ({ x, y, w, h: Math.round(w / CARD_ASPECT) });

const overviewRegion = (x: number, y: number, w: number): Box => ({ x, y, w, h: Math.round(w / OVERVIEW_ASPECT) });

export const REGIONS = {
  hook: region(140, 270, 510),
  typingFrom: region(330, 170, 620),
  typingTo: region(325, 175, 470),
  mapFrom: region(140, 20, 840),
  mapTo: region(150, 170, 620),
  /** The AI Overview block: its label and the whole sentence naming Ellenton. */
  overviewFrom: overviewRegion(110, 432, 334),
  /** Pushed in on the name line: "ELLENTON FAMILY PRACTICE DIRECT." */
  overviewTo: overviewRegion(100, 415, 200),
};

/** Source windows, in source frames at 30fps. */
export const PLAYBACK = {
  /** Take 2 typing: 2.3s to about 7.0s at 1.9x fits the 75 frame beat. */
  typing: { trimBefore: 69, playbackRate: 1.9 },
  /**
   * Take 1 AI Overview: the text fills in at about 10.9s and stays put to the
   * end of the file (13.9s). 328 + 90 * 0.97 = 415.3, inside the 417 frames.
   */
  overview: { trimBefore: 328, playbackRate: 0.97 },
};

export const COPY = {
  topic: "LOCAL SEO",
  url: "ka-performancefl.com",
  cardStamp: "Recorded Sept 24, incognito",
  hook: ["A two-provider practice.", "Top three on Google."],
  typing: "Real search. Incognito. Sept 24.",
  map: ["In the map's top three", "4.5 stars, 71 reviews"],
  overview: "Google's AI Overview names them first.",
  build: "We build local search into every site.",
  cta: {
    question: "Is your business showing up?",
    url: "ka-performancefl.com",
    call: "Call Alex, 904-210-1071",
  },
};

/** Relative frames inside each beat. */
export const CUES = {
  hookSecond: 6,
  mapSecond: 30,
  ctaUrl: 10,
  ctaCall: 20,
};

/** Frame for the thumbnail: the hook, fully built. */
export const THUMBNAIL_FRAME = 40;

export type CueRow = { text: string; start: number; end: number; source: string };

export function cueRows(): CueRow[] {
  const b = BEATS;
  const src = "src/social/2026-09-28/EllentonReel.tsx";
  return [
    { text: COPY.hook[0], start: b.hook.start, end: b.hook.end, source: src },
    { text: COPY.hook[1], start: b.hook.start + CUES.hookSecond, end: b.hook.end, source: src },
    { text: COPY.typing, start: b.typing.start, end: b.typing.end, source: src },
    { text: COPY.map[0], start: b.map.start, end: b.map.end, source: src },
    { text: COPY.map[1], start: b.map.start + CUES.mapSecond, end: b.map.end, source: src },
    { text: COPY.overview, start: b.overview.start, end: b.overview.end, source: src },
    { text: COPY.build, start: b.build.start, end: b.build.end, source: src },
    { text: COPY.cta.question, start: b.cta.start, end: b.cta.end, source: src },
    { text: COPY.cta.url, start: b.cta.start + CUES.ctaUrl, end: b.cta.end, source: src },
    { text: COPY.cta.call, start: b.cta.start + CUES.ctaCall, end: b.cta.end, source: src },
  ];
}
