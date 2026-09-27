// Beat map for the Sun 2026-09-27 7:30 PM LinkedIn video, "ADDIE got a G"
// (training). Text led, no narration, 30.0 s at 30 fps, 1080x1350.
// Beats and copy from To Be Released/2026-09-27-3/brief.md.

export const FPS = 30;

export const BEATS = {
  hook: { start: 0, end: 90 },
  steps: { start: 90, end: 240 },
  swap: { start: 240, end: 390 },
  roles: { start: 390, end: 660 },
  stat: { start: 660, end: 810 },
  cta: { start: 810, end: 900 },
} as const;

export const TOTAL_FRAMES = BEATS.cta.end;

/** Absolute frames. */
export const CUE = {
  /** Letter tiles flip in from blank, one every LETTER_STAGGER frames. */
  letterStart: 2,
  letterStagger: 5,
  /** Step words flip in row by row. */
  wordStart: BEATS.steps.start + 4,
  wordStagger: 14,
  /** Second headline line. */
  swapLine: BEATS.swap.start,
  /** D to G, one slow flip, then Develop to Generate. */
  dToG: BEATS.swap.start + 14,
  developToGenerate: BEATS.swap.start + 30,
  implementToIndividualize: BEATS.swap.start + 62,
  readsAdgie: BEATS.swap.start + 100,
  /** Who does what: one row every ROLE_STAGGER frames. */
  roleStart: BEATS.roles.start + 12,
  roleStagger: 40,
  /** 91% count up. */
  countStart: BEATS.stat.start + 4,
  countLen: 36,
  statLine: BEATS.stat.start + 18,
  statGood: BEATS.stat.start + 44,
  statSource: BEATS.stat.start + 52,
  /** CTA lines. */
  ctaLines: [BEATS.cta.start, BEATS.cta.start + 8, BEATS.cta.start + 18, BEATS.cta.start + 26] as const,
} as const;

/** Flip length of the hero D to G, in frames. At +5 the tile shows the G top over the D bottom. */
export const HERO_FLIP = 10;

/** Thumbnail: the D tile mid-flip to G, both headline lines in. */
export const THUMB_FRAME = CUE.dToG + HERO_FLIP / 2;

export type Row = { letter: string; word: string; newLetter?: string; newWord?: string };

export const ROWS: Row[] = [
  { letter: "A", word: "ANALYZE" },
  { letter: "D", word: "DESIGN" },
  { letter: "D", word: "DEVELOP", newLetter: "G", newWord: "GENERATE" },
  { letter: "I", word: "IMPLEMENT", newWord: "INDIVIDUALIZE" },
  { letter: "E", word: "EVALUATE" },
];

/** Word cells per row: the longest word, INDIVIDUALIZE. */
export const CELLS = 13;

export type Role = {
  letter: string;
  step: string;
  line: string;
  you: string | null;
  ai: string | null;
  changed?: boolean;
};

export const ROLES: Role[] = [
  { letter: "A", step: "Analysis", line: "AI drafts learner personas from surveys and feedback. You refine them.", you: "Refine", ai: "Draft" },
  { letter: "D", step: "Design", line: "You lead the strategy. AI suggests structure and learning paths.", you: "Lead", ai: "Suggest" },
  {
    letter: "G",
    step: "Generation",
    line: "AI drafts videos, visuals, audio and quizzes. You conduct: review, tweak, rebuild.",
    you: "Conduct",
    ai: "Draft",
    changed: true,
  },
  { letter: "I", step: "Individualization", line: "AI adapts the course to each learner.", you: null, ai: "Adapt", changed: true },
  { letter: "E", step: "Evaluation", line: "Both: a continuous feedback loop with learners.", you: "Both", ai: "Both" },
];

export const COPY = {
  hook: "ADDIE is 50+ years old.",
  swap: "It might be getting a G.",
  reads: "Now it reads ADGIE.",
  roles: "Who does what",
  statNumber: 91,
  stat: "of learning professionals still check the AI's work themselves.",
  good: "Good.",
  source: "A 2025 survey of 90 learning professionals.",
  cta1: "AI drafts.",
  cta2: "Designers decide.",
  cta3: "Custom eLearning, built that way.",
  url: "ka-performancefl.com/training",
} as const;
