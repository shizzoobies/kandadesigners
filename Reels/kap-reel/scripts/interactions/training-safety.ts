/**
 * scripts/interactions/training-safety.ts
 *
 * "Spot it before it hurts someone." Nine screen deck, 1440x900 authored,
 * body overflow hidden, one section visible at a time.
 *
 * How the deck is driven, read off the live build:
 *   - #next and #prev in nav.pager step through #screen-1 .. #screen-9 by
 *     toggling [hidden]. A meter reads "Screen N of 9".
 *   - #next is disabled on screen 6 until all six hazards are found. Any beat
 *     that has to get past screen 6 clicks the six list buttons in preroll.
 *   - Screens 2 to 5 and 7 and 9 use role=tab buttons with fixed ids.
 *   - Screens 7 and 8 nest sub-steps behind [data-sub="prev"|"next"].
 *   - Answers are [data-q][data-correct] buttons; feedback is written into
 *     #fb-<key> and, on screen 8, replayed with a .slam CSS animation.
 *
 * Live versus local: the live build is the one captured. It carries the same
 * ids as the 2026-09-04 local edit for everything used here.
 */

import type { InteractionScript } from "./types";

/** Satisfies the screen 6 gate so #next will move past it. Preroll only. */
const CLEAR_HUNT_GATE =
  "document.querySelectorAll('.spot[data-spot]').forEach(function (b) { b.click(); });";

/** Steps the deck forward n screens without recording. */
function advance(n: number): { at: number; click: string }[] {
  return Array.from({ length: n }, () => ({ at: 0, click: "#next" }));
}

const script: InteractionScript = {
  projectId: "training-safety",
  beats: [
    {
      id: "hero-to-zones",
      viewport: "both",
      durationFrames: 180,
      note: "Opens on the title screen, steps into the four zones, and swaps a tab and back.",
      steps: [
        { at: 20, click: "#next" },
        { at: 60, click: "#tab-2b" },
        { at: 100, click: "#tab-2a" },
      ],
    },
    {
      id: "hazard-hunt",
      viewport: "both",
      durationFrames: 180,
      note:
        "Screen 6. Three hotspots in the illustration, then the reveal button, " +
        "which the module only un-hides after three attempts.",
      preroll: advance(5),
      steps: [
        { at: 12, hover: '.hot[data-spot="ladder"]' },
        { at: 22, click: '.hot[data-spot="ladder"]' },
        { at: 47, hover: '.hot[data-spot="edge"]' },
        { at: 57, click: '.hot[data-spot="edge"]' },
        { at: 82, hover: '.hot[data-spot="cord"]' },
        { at: 92, click: '.hot[data-spot="cord"]' },
        { at: 110, waitFor: "#reveal" },
        { at: 132, click: "#reveal" },
      ],
    },
    {
      id: "hierarchy-sorter",
      viewport: "both",
      durationFrames: 150,
      note: "Screen 7, second tab. Three situations answered correctly, stepping the sub-steps between.",
      preroll: [
        { at: 0, eval: CLEAR_HUNT_GATE },
        ...advance(6),
        { at: 0, click: "#tab-7b" },
      ],
      steps: [
        { at: 22, click: '#screen-7 [data-q="h1"][data-correct="true"]' },
        { at: 55, click: '#screen-7 [data-sub="next"]' },
        { at: 82, click: '#screen-7 [data-q="h2"][data-correct="true"]' },
        { at: 110, click: '#screen-7 [data-sub="next"]' },
        { at: 132, click: '#screen-7 [data-q="h3"][data-correct="true"]' },
      ],
    },
    {
      id: "stop-or-go",
      viewport: "both",
      durationFrames: 150,
      note:
        "Screen 8. Four calls, wrong then right then wrong then right, so both " +
        "verdict states play their slam animation on camera.",
      preroll: [{ at: 0, eval: CLEAR_HUNT_GATE }, ...advance(7)],
      steps: [
        { at: 18, click: '#screen-8 [data-q="g1"][data-correct="false"]' },
        { at: 40, click: '#screen-8 [data-sub="next"]' },
        { at: 60, click: '#screen-8 [data-q="g2"][data-correct="true"]' },
        { at: 82, click: '#screen-8 [data-sub="next"]' },
        { at: 102, click: '#screen-8 [data-q="g3"][data-correct="false"]' },
        { at: 122, click: '#screen-8 [data-sub="next"]' },
        { at: 140, click: '#screen-8 [data-q="g4"][data-correct="true"]' },
      ],
    },
    {
      id: "walkthrough-card",
      viewport: "both",
      durationFrames: 120,
      note: "Screen 9. Three checks ticked in zone 1, then the card tab, which fills in from the ticks.",
      preroll: [{ at: 0, eval: CLEAR_HUNT_GATE }, ...advance(8)],
      steps: [
        { at: 18, click: "#accp-1 label:nth-of-type(1)" },
        { at: 42, click: "#accp-1 label:nth-of-type(2)" },
        { at: 66, click: "#accp-1 label:nth-of-type(3)" },
        { at: 96, click: "#tab-9b" },
      ],
    },
  ],
};

export default script;
