// Wednesday 2026-09-30, "One screen, one decision", revision 2 (2026-09-25).
//
// Text led, no narration (voice on hold, see Social Media Management/plans/
// 2026-09-28-rework.md). Editorial magazine treatment: cream paper, big
// numerals, pull-quote type, real sample module screens set like photos.
//
// Every picture is a real capture from the live K&A safety sample course
// (src/tutorial/onescreen/captures.json, captured 2026-09-25). Nothing is
// invented. 01 is the real inspection board (the map), 02 the real
// one-location screen a tap opens (one decision), 03 the real feedback.
//
// Pure data: no remotion imports, so the deliver script can read it.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export type BeatId = "hook" | "map" | "decide" | "feedback" | "cta";

export type Beat = { id: BeatId; start: number; end: number };

export const BEATS: Beat[] = [
  { id: "hook", start: 0, end: 96 },
  { id: "map", start: 96, end: 216 },
  { id: "decide", start: 216, end: 336 },
  { id: "feedback", start: 336, end: 456 },
  { id: "cta", start: 456, end: 570 },
];

export const TOTAL_FRAMES = BEATS[BEATS.length - 1].end;

export const URL = "ka-performancefl.com";
export const URL_TRAINING = "ka-performancefl.com/training";
export const PHONE = "904-210-1071";

export const HOOK_QUOTE = "If a screen asks the learner to do two things, it does neither.";

export type Section = {
  id: BeatId;
  numeral: string;
  kicker: string;
  headline: string;
  dek: string;
  credit: string;
  /** Captures in order, with the frame (beat relative) each arrives on. */
  shots: { id: string; from: number }[];
  /** Capture pixel rows shown, top and bottom. */
  crop: [number, number];
  /** Tap mark, beat relative frame, on the first shot's recorded tap box. */
  tapAt?: number;
  tag: string;
};

const CREDIT = "Real screen from our free safety sample course";

export const SECTIONS: Section[] = [
  {
    id: "map",
    numeral: "01",
    kicker: "The map",
    headline: "The board: every location in view.",
    dek: "Learners see the whole job first.",
    credit: CREDIT,
    shots: [{ id: "audit-idle", from: 0 }],
    crop: [290, 850],
    tag: "The map",
  },
  {
    id: "decide",
    numeral: "02",
    kicker: "One decision",
    headline: "Tap one. It asks one thing: hold or go.",
    dek: "One clear call. Your team knows what to do.",
    credit: CREDIT,
    shots: [
      { id: "audit-open", from: 0 },
      { id: "audit-hold", from: 58 },
    ],
    crop: [950, 1510],
    tapAt: 56,
    tag: "One decision",
  },
  {
    id: "feedback",
    numeral: "03",
    kicker: "Feedback",
    headline: "Feedback on that one decision, right away.",
    dek: "Act, get feedback, move on. It sticks.",
    credit: CREDIT,
    shots: [{ id: "hunt-feedback", from: 0 }],
    crop: [1030, 1590],
    tag: "Feedback",
  },
];

export const CTA = {
  kicker: "K&A Performance",
  headline: "We design training people finish.",
  lead: "Try a free sample course",
  url: URL_TRAINING,
  call: `Call Alex ${PHONE}`,
};

/** Masthead and footer text, on every frame. */
export const CHROME = {
  mastKicker: "Field notes",
  mastTitle: "Instructional design",
  footLeft: "Call 904-210-1071",
  footRight: URL_TRAINING,
};

/** The SRT: the on-screen text, cue by cue. */
export type CueRow = { text: string; start: number; end: number; source: string };

export function cueRows(): CueRow[] {
  const rows: CueRow[] = [];
  const at = (id: BeatId) => BEATS.find((b) => b.id === id)!;
  const hook = at("hook");
  rows.push({ text: HOOK_QUOTE, start: hook.start, end: hook.end, source: "social/2026-09-30/hook" });
  for (const s of SECTIONS) {
    const b = at(s.id);
    rows.push({ text: s.headline, start: b.start, end: b.end, source: `social/2026-09-30/${s.id}` });
    rows.push({ text: s.dek, start: b.start + 36, end: b.end, source: `social/2026-09-30/${s.id}` });
  }
  const cta = at("cta");
  rows.push({ text: CTA.headline, start: cta.start, end: cta.start + 45, source: "social/2026-09-30/cta" });
  rows.push({ text: `${CTA.lead}: ${CTA.url}. ${CTA.call}.`, start: cta.start + 45, end: cta.end, source: "social/2026-09-30/cta" });
  return rows;
}

/** Every string that reaches a frame or a file, for the em dash check. */
export function allStrings(): string[] {
  return [
    HOOK_QUOTE,
    ...SECTIONS.flatMap((s) => [s.kicker, s.headline, s.dek, s.credit, s.tag]),
    ...Object.values(CTA),
    ...Object.values(CHROME),
  ];
}
