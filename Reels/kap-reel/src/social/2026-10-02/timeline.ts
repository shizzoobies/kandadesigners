// Friday 2026-10-02: the Thrillers Mobile VR launch reel, revision 2.
//
// Pure data, no Remotion imports, so scripts/social/2026-10-02/deliver.ts reads
// the same frames and strings the picture uses and the SRT cannot drift.
//
// Music: out/candidates/music-i-a.mp3, 120 bpm, strong onsets on every whole
// second (measured 2026-09-25: 0.01, 1.01, 2.01 ... 14.01 s). One beat is 15
// frames, one strong beat is 30. Every cut below lands on a multiple of 15.
//
// Real captures only: the three thrillers-mobile-vr-*-vertical clips recorded
// by scripts/launch/thrillers-capture.ts from the demo site.

export const FPS = 30;
export const TOTAL_FRAMES = 450;
export const BEAT = 15;

export const CAPTURES = {
  home: "thrillers-mobile-vr-home-vertical",
  experiences: "thrillers-mobile-vr-experiences-vertical",
  book: "thrillers-mobile-vr-book-vertical",
} as const;

export const BRAND_LINE = "Built by K&A Performance";
export const KA_URL = "ka-performancefl.com";
export const CLIENT_DOMAIN = "thrillersvr.com";

/** A half-open frame range: [start, end). */
export type Range = { start: number; end: number };

export const BEATS = {
  hook: { start: 0, end: 60 },
  launch: { start: 60, end: 120 },
  rides: { start: 120, end: 240 },
  book: { start: 240, end: 330 },
  next: { start: 330, end: 360 },
  card: { start: 360, end: 450 },
} satisfies Record<string, Range>;

/** Tone of a kinetic label box. */
export type Tone = "cream" | "rust" | "amber" | "ink";

/**
 * One kinetic line: slams in on `at`, holds until `until` (exclusive).
 * `size` is the display size in px at 1080 wide. `row` is the stack slot.
 */
export type Line = {
  text: string;
  at: number;
  until: number;
  tone: Tone;
  size: number;
  row: number;
  /** Body face, sentence case, for the "why it matters" line. */
  body?: boolean;
};

/** Stack origin for each beat: y of row 0, in canvas px. */
export const STACK_TOP = {
  hook: 470,
  show: 930,
  next: 560,
};

export const HOOK: Line[] = [
  { text: "NO VENUE.", at: -3, until: 60, tone: "cream", size: 104, row: 0 },
  { text: "NO GEAR.", at: 6, until: 60, tone: "cream", size: 104, row: 1 },
  { text: "THE ARCADE", at: 15, until: 60, tone: "rust", size: 92, row: 2 },
  { text: "PULLS UP TO", at: 21, until: 60, tone: "rust", size: 92, row: 3 },
  { text: "YOUR DRIVEWAY.", at: 30, until: 60, tone: "amber", size: 92, row: 4 },
];

export const LAUNCH: Line[] = [
  { text: "JUST LAUNCHED", at: 60, until: 120, tone: "amber", size: 56, row: 0 },
  { text: "THRILLERS", at: 60, until: 120, tone: "cream", size: 116, row: 1 },
  { text: "MOBILE VR", at: 66, until: 120, tone: "cream", size: 116, row: 2 },
  { text: CLIENT_DOMAIN, at: 75, until: 120, tone: "rust", size: 60, row: 3 },
  { text: "Sells the fun before the trailer arrives.", at: 90, until: 120, tone: "ink", size: 44, row: 4, body: true },
];

/** Ride cuts: one per strong beat, each playing the capture from its hold. */
export const RIDE_CUTS = [
  { name: "VR RIDES", at: 120, trimBefore: 0 },
  { name: "VR THEATER", at: 150, trimBefore: 33 },
  { name: "THE 360", at: 180, trimBefore: 66 },
  { name: "RACECAR", at: 210, trimBefore: 99 },
] as const;

export const RIDES: Line[] = [
  { text: "PICK A RIDE", at: 120, until: 240, tone: "amber", size: 56, row: 0 },
  ...RIDE_CUTS.map(
    (c, i): Line => ({
      text: c.name,
      at: c.at,
      until: c.at + 30,
      tone: i % 2 === 0 ? "cream" : "rust",
      size: 116,
      row: 1,
    }),
  ),
  { text: "The whole lineup on one page.", at: 135, until: 240, tone: "ink", size: 44, row: 3, body: true },
];

/** Book cuts: capture source frame each cut starts on, played at rate 1. */
export const BOOK_CUTS = [
  { at: 240, trimBefore: 0, zoom: 1 },
  { at: 270, trimBefore: 105, zoom: 1.1 },
  { at: 300, trimBefore: 140, zoom: 1 },
] as const;

export const BOOK: Line[] = [
  { text: "BOOK IT", at: 240, until: 330, tone: "amber", size: 56, row: 0 },
  { text: "PICK A DATE.", at: 240, until: 330, tone: "cream", size: 104, row: 1 },
  { text: "SEND IT.", at: 270, until: 330, tone: "rust", size: 104, row: 2 },
  { text: "Requests land straight in their inbox.", at: 285, until: 330, tone: "ink", size: 44, row: 3, body: true },
];

export const NEXT: Line[] = [
  { text: "YOUR LAUNCH", at: 330, until: 360, tone: "cream", size: 112, row: 0 },
  { text: "COULD BE", at: 336, until: 360, tone: "cream", size: 112, row: 1 },
  { text: "NEXT.", at: 342, until: 360, tone: "amber", size: 180, row: 2 },
];

export const CARD = {
  kicker: "Your launch could be next.",
  url: KA_URL,
  call: "Call Alex, 904-210-1071",
  service: "Web design and AI integration",
  /** LogoDraw clock: draws over 24 frames from the card cut, then holds. */
  drawFrames: 24,
  urlIn: 6,
  callIn: 12,
};

/** Frame the phone punches on (scale bump), every cut. */
export const PUNCHES = [0, 60, 120, 150, 180, 210, 240, 270, 300, 330];

/** Frames for the review stills. */
export const STILLS = { hook: 45, rides: 200, book: 310, card: 440 };

export type CueRow = { text: string; start: number; end: number; source: string };

/** One SRT row per line of burned-in text, absolute frames, end exclusive. */
export function cueRows(): CueRow[] {
  const src = "src/social/2026-10-02/ThrillersBuilt.tsx";
  const c = BEATS.card.start;
  const rows: [string, number, number][] = [
    ["No venue. No gear.", 0, 60],
    ["The arcade pulls up to your driveway.", 15, 60],
    ["Just launched: Thrillers Mobile VR", 60, 120],
    [CLIENT_DOMAIN, 75, 120],
    ["Sells the fun before the trailer arrives.", 90, 120],
    ["Pick a ride", 120, 240],
    ...RIDE_CUTS.map((r): [string, number, number] => [rideCaption(r.name), r.at, r.at + 30]),
    ["The whole lineup on one page.", 135, 240],
    ["Book it. Pick a date.", 240, 330],
    ["Send it.", 270, 330],
    ["Requests land straight in their inbox.", 285, 330],
    [CARD.kicker, BEATS.next.start, TOTAL_FRAMES],
    [`${BRAND_LINE}. ${CARD.url}`, c + CARD.urlIn, TOTAL_FRAMES],
    [CARD.call, c + CARD.callIn, TOTAL_FRAMES],
  ];
  return rows.map(([text, start, end]) => ({ text, start, end, source: src }));
}

function rideCaption(name: string): string {
  return name === "THE 360" ? "The 360" : name === "RACECAR" ? "Racecar" : name.replace("RIDES", "Rides").replace("THEATER", "Theater");
}
