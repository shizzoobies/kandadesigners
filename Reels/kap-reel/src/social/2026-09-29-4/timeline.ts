// Beat map for the Tue 2026-09-29 12:00 PM LinkedIn video, "Most courses
// start in the wrong place" (Action Mapping, training). Text led, no
// narration, 30.0 s at 30 fps, 1080x1350.
// Beats and copy from To Be Released/2026-09-29-4/brief.md.

export const FPS = 30;

export const BEATS = {
  hook: { start: 0, end: 120 },
  goal: { start: 120, end: 240 },
  actions: { start: 240, end: 360 },
  scenario: { start: 360, end: 600 },
  know: { start: 600, end: 720 },
  detour: { start: 720, end: 810 },
  cta: { start: 810, end: 900 },
} as const;

export const TOTAL_FRAMES = BEATS.cta.end;

/** Absolute frames. */
export const CUE = {
  /** Hook: the old route draws to Quiz, then to a dead end. */
  oldRoute: [6, 56] as const,
  oldQuiz: 30,
  oldDeadEnd: 58,
  /** The old route fades as the new one starts. */
  oldFade: BEATS.goal.start,
  pin1: BEATS.goal.start + 12,
  goalCallout: BEATS.goal.start + 24,
  seg1: [BEATS.actions.start + 4, BEATS.actions.start + 26] as const,
  pin2: BEATS.actions.start + 24,
  seg2: [BEATS.actions.start + 60, BEATS.actions.start + 82] as const,
  pin3: BEATS.actions.start + 80,
  /** Scenario card. */
  cardIn: BEATS.scenario.start + 4,
  choicesIn: BEATS.scenario.start + 26,
  pointerIn: BEATS.scenario.start + 56,
  pick: BEATS.scenario.start + 74,
  consequence: BEATS.scenario.start + 96,
  consequenceLine: BEATS.scenario.start + 150,
  /** Pin 4 and the shrinking pile. */
  seg3: [BEATS.know.start + 6, BEATS.know.start + 30] as const,
  pin4: BEATS.know.start + 28,
  pileIn: BEATS.know.start + 6,
  pileShrink: BEATS.know.start + 44,
  essentials: BEATS.know.start + 82,
  /** Detour sign and its three boards. */
  sign: BEATS.detour.start + 4,
  boards: [BEATS.detour.start + 16, BEATS.detour.start + 24, BEATS.detour.start + 32] as const,
  /** CTA lines and the credit. */
  ctaLines: [BEATS.cta.start, BEATS.cta.start + 8, BEATS.cta.start + 16, BEATS.cta.start + 24] as const,
  credit: BEATS.cta.start + 28,
} as const;

/** Thumbnail: the hook, with the old route drawn to its dead end. */
export const THUMB_FRAME = 100;

export const COPY = {
  hook: "Most courses start in the wrong place.",
  oldStart: "Everything they should know",
  oldQuiz: "Quiz",
  deadEnd: "Dead end",
  goal: "Action mapping starts with the goal.",
  goalLine: "A measurable business goal",
  goalExample: "e.g. cut lifting injuries 10% this year",
  actions: "What do people need to do?",
  practice: "Practice it.",
  scenarioKicker: "Practice scenario",
  scenario: "A box might be too heavy to lift. No one's around.",
  choiceA: "Lift it anyway",
  choiceB: "Wait for help or find a trolley",
  consequenceKicker: "What happens",
  consequence: "Sharp pain in your lower back.",
  consequenceLine: "Show the consequence. Don't just say wrong.",
  know: "Only then: what do they need to know?",
  essentials: "Just the essentials",
  detour: "Sometimes the answer isn't a course.",
  detourSign: "Detour",
  boards: ["Motivation", "The environment", "A job aid"],
  cta1: "Design for what people do.",
  cta2: "Custom eLearning, built around the job.",
  url: "ka-performancefl.com/training",
  credit: "Action Mapping: Cathy Moore.",
} as const;

export const PIN_LABELS = ["Goal", "Actions", "Practice", "What to know"] as const;
