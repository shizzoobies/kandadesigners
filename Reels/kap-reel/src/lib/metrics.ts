// Typed access to config/metrics.json, written by scripts/measure.ts.
//
// Section 14 item 2 of kap-reel-handoff.md: every on-screen number traces to
// metrics.json. Nothing in src/scenes may type a measured figure as a literal.
// If a number appears on screen, it is derived here at build time from the
// Lighthouse runs, so a re-measure changes the video rather than silently
// leaving a stale claim in the copy.

import metricsJson from "../../config/metrics.json";

export type MetricResult = {
  project: string;
  url: string;
  runs: number;
  performance: number;
  accessibility: number;
  lcpMs: number;
  cls: number;
  tbtMs: number;
};

export const METRICS_MEASURED_AT: string = metricsJson.measuredAt;

export const METRIC_RESULTS: MetricResult[] = metricsJson.results;

/**
 * How many measured sites score a perfect 100 on Lighthouse accessibility.
 * This is the only number on screen in the LinkedIn cut and it is counted from
 * the measured results, never typed.
 */
export function perfectAccessibilityCount(): number {
  return METRIC_RESULTS.filter((r) => r.accessibility === 100).length;
}

const NUMBER_WORDS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
];

/**
 * Small counts read better as words in a headline than as digits, and "100"
 * is the only figure on that card that should read as a number. Anything past
 * ten falls back to digits rather than growing a spelling table.
 */
export function numberWord(n: number): string {
  return n >= 0 && n < NUMBER_WORDS.length ? NUMBER_WORDS[n] : String(n);
}
