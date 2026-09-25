// Beat map for the Wednesday 2026-10-07 reel, "When a job aid beats a course".
// Text led, no narration, 19 s at 30 fps. Pure data plus the SRT rows, no
// remotion imports, so scripts/social/2026-10-07/deliver.ts can read it.

export const FPS = 30;

export const BEATS = {
  hook: { start: 0, end: 96 },
  remember: { start: 96, end: 186 },
  rfi: { start: 186, end: 306 },
  card: { start: 306, end: 426 },
  cta: { start: 426, end: 570 },
} as const;

export const TOTAL_FRAMES = BEATS.cta.end;

/** Frames inside a beat, relative to its start. */
export const CUE = {
  /** "Hand it to them." stamps in on the hook. */
  hookStamp: 16,
  /** The four rust weeks fill, one per quarter, from this frame, every 7 frames. */
  weeksIn: 22,
  weeksStep: 7,
  /** Second line of the remember beat. */
  rememberLine2: 30,
  /** A real screen is handed in from the right. */
  handIn: 6,
  handFrames: 16,
  /** CTA lines. */
  ctaUrlIn: 14,
  ctaCallIn: 24,
} as const;

/** The frame the thumbnail is pulled from: the hook, fully built. */
export const THUMB_FRAME = BEATS.hook.start + 80;

export const COPY = {
  hook: ["If they need it once a quarter,", "don't teach it.", "Hand it to them."],
  gridLabel: "52 work weeks. The task comes up in 4.",
  remember1: "A course asks them to remember it for 13 weeks.",
  remember2: "A job aid only has to be there on the day.",
  rfiHead: "Four checks before the RFI goes out.",
  rfiCredit: "Real screen: the job aid in our RFI sample course",
  cardHead: "One card, carried on the site walk.",
  cardCredit: "Real screen: the card our safety sample course builds",
  ctaHead: "We build courses and job aids. Not sure which it needs? Ask us.",
  ctaUrl: "ka-performancefl.com/training",
  ctaCall: "Call Alex 904-210-1071",
} as const;

export type CueRow = { text: string; start: number; end: number; source: string };

/** Every on-screen line, as burned in, for the SRT. */
export function cueRows(): CueRow[] {
  const b = BEATS;
  const src = "src/social/2026-10-07/JobAid.tsx";
  return [
    { text: `${COPY.hook[0]} ${COPY.hook[1]}`, start: b.hook.start, end: b.hook.end, source: src },
    { text: COPY.hook[2], start: b.hook.start + CUE.hookStamp, end: b.hook.end, source: src },
    { text: COPY.remember1, start: b.remember.start, end: b.remember.end, source: src },
    { text: COPY.remember2, start: b.remember.start + CUE.rememberLine2, end: b.remember.end, source: src },
    { text: COPY.rfiHead, start: b.rfi.start, end: b.rfi.end, source: src },
    { text: COPY.cardHead, start: b.card.start, end: b.card.end, source: src },
    { text: COPY.ctaHead, start: b.cta.start, end: b.cta.end, source: src },
    { text: COPY.ctaUrl, start: b.cta.start + CUE.ctaUrlIn, end: b.cta.end, source: src },
    { text: COPY.ctaCall, start: b.cta.start + CUE.ctaCallIn, end: b.cta.end, source: src },
  ];
}
