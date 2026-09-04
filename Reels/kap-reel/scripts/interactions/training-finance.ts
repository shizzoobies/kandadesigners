/**
 * scripts/interactions/training-finance.ts
 *
 * "The P&L, read like an owner." Eight screen deck.
 *
 * How the deck is driven, read off the live build:
 *   - #next and #prev step through #screen-1 .. #screen-8. Only the last
 *     screen disables #next, so nothing here needs a gate bypass.
 *   - This is the one module of the three with a reduced-motion guard:
 *     matchMedia('(prefers-reduced-motion: reduce)') gates the count-up tween,
 *     the row stagger and the waterfall draw. The recorder emulates
 *     no-preference so all three run.
 *   - Screen 4 is the simulator: four input[type=range] levers (#s-price,
 *     #s-units, #s-cogs, #s-opex) driving a 400ms requestAnimationFrame tween
 *     on #v-rev, #v-gp, #v-oi, #v-gm and the rest. Frame-locked stepping is
 *     what makes that 400ms read as twelve frames instead of a flash.
 *   - Screen 5 is the line-item sorter: [data-q="cN"][data-a] buttons inside a
 *     [data-steps] group with [data-step-prev] / [data-step-next] controls.
 *   - The waterfall lives on screen 8 and is drawn by animateWaterfall() ON
 *     ARRIVAL, so the beat has to arrive on camera: preroll stops at screen 7
 *     and the recorded clip clicks #next.
 *
 * Live versus local: the live build is older (829 lines of app.js against 954)
 * but carries the same lever ids, the same classify keys, and the same
 * screen 8 waterfall used here.
 */

import type { InteractionScript } from "./types";

function advance(n: number): { at: number; click: string }[] {
  return Array.from({ length: n }, () => ({ at: 0, click: "#next" }));
}

const script: InteractionScript = {
  projectId: "training-finance",
  beats: [
    {
      id: "pnl-simulator",
      // Desktop only. At 390 wide the screen is 1262px of content inside a
      // 647px box, so the levers and the figures they drive are never on
      // screen together. A clip of a slider moving with no numbers reacting is
      // the beat failing its own gate check. Evidence still:
      // assets/captures/stills/training-finance-home-mobile.png
      viewport: "desktop",
      durationFrames: 180,
      note: "Screen 4. Three levers dragged, each one re-tweening the statement and the two big figures.",
      preroll: advance(3),
      steps: [
        { at: 30, drag: { selector: "#s-price", delta: [95, 0], frames: 16 } },
        { at: 90, drag: { selector: "#s-cogs", delta: [-72, 0], frames: 14 } },
        { at: 142, drag: { selector: "#s-opex", delta: [58, 0], frames: 14 } },
      ],
    },
    {
      id: "line-item-sorter",
      viewport: "both",
      durationFrames: 120,
      note: "Screen 5. Two items classified correctly, stepping the item list between them.",
      preroll: advance(4),
      steps: [
        { at: 22, click: '#screen-5 [data-q="c1"][data-a="cogs"]' },
        { at: 52, click: "#screen-5 [data-step-next]" },
        { at: 78, click: '#screen-5 [data-q="c2"][data-a="opex"]' },
        { at: 104, click: "#screen-5 [data-step-next]" },
      ],
    },
    {
      id: "waterfall",
      viewport: "both",
      durationFrames: 120,
      note: "Arrives on screen 8 on camera, because the chart is drawn by the arrival, not by anything on the screen itself.",
      preroll: advance(6),
      steps: [
        { at: 20, click: "#next" },
        { at: 30, waitFor: "#screen-8 .waterfall" },
      ],
    },
  ],
};

export default script;
