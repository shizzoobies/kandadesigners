/**
 * scripts/interactions/training-finance.ts
 *
 * "The profit and loss statement, read like an owner." Eight folio deck on the
 * ledger book build (site commit e2b90a5), 1440x900 authored, body overflow
 * hidden, one section visible at a time.
 *
 * How the deck is driven, read off the live build on 2026-09-04:
 *   - #next and #prev step through #screen-1 .. #screen-8, toggling both
 *     [hidden] and .is-current. The meter reads "Folio N of 8". Nothing is
 *     gated: show() sets nextBtn.disabled = false on every folio and only
 *     relabels it "Finish" on folio 8, so no beat needs a bypass.
 *   - This is the one module of the three with a reduced-motion guard:
 *     matchMedia('(prefers-reduced-motion: reduce)') gates the count-up tween,
 *     the row stagger and the waterfall draw. The recorder asks for
 *     no-preference so all three run.
 *   - Folio 4 is the simulator: four input[type=range] levers (#s-price,
 *     #s-units, #s-cogs, #s-opex) driving a 400ms requestAnimationFrame tween
 *     on #v-rev, #v-cogs, #v-gp, #v-opex, #v-oi, #v-gm and #v-oi-big. That
 *     tween is JS, not CSS, so the recorder's animation slowdown does not reach
 *     it. Dragging the thumb across fourteen frames is what puts the figures on
 *     camera: every frame of the drag fires an input event and re-aims it.
 *   - Folio 5 is the line-item sorter: [data-q="cN"][data-a] buttons inside a
 *     [data-steps] group with [data-step-prev] / [data-step-next] controls.
 *     c1 is cost of goods sold, c2 is an operating expense.
 *   - The waterfall lives on folio 8 and animateWaterfall() runs ON ARRIVAL,
 *     with a 110ms stagger per bar, so the beat has to arrive on camera:
 *     preroll stops at folio 7 and the recorded clip presses Next.
 *
 * Live versus local: the live build is the ledger book rebuild, not the older
 * local file, so every selector here was re-read off the live page. The lever
 * ids and the classify keys survived the rebuild. The screen chrome did not,
 * which is why these notes say folio where the other two modules say screen.
 */

import type { InteractionScript } from "./types";

function advance(n: number): { at: number; click: string }[] {
  return Array.from({ length: n }, () => ({ at: 0, click: "#next" }));
}

const script: InteractionScript = {
  projectId: "training-finance",
  beats: [
    {
      id: "hero",
      viewport: "both",
      durationFrames: 60,
      note: "Folio 1, held. No pointer steps, so the synthetic cursor never appears: the clean opening still, as two seconds of video.",
      steps: [],
    },
    {
      id: "pnl-simulator",
      // Desktop only. At 390 wide folio 4 runs to 1262px of content inside an
      // 844px box with the document locked, so the statement table and both big
      // figures fall below the cut: #v-gm lands at y=1046 and #v-oi-big at
      // y=1138, neither reachable. A clip of a lever moving with no figures
      // answering is the beat failing its own gate check. Evidence still:
      // assets/captures/stills/training-finance-pnl-simulator-mobile-evidence.png
      viewport: "desktop",
      durationFrames: 180,
      note: "Folio 4. All four levers dragged in turn, each one re-tweening the statement, the gross margin and the operating income.",
      preroll: advance(3),
      steps: [
        { at: 26, drag: { selector: "#s-price", delta: [78, 0], frames: 14 } },
        { at: 66, drag: { selector: "#s-units", delta: [52, 0], frames: 14 } },
        { at: 106, drag: { selector: "#s-cogs", delta: [-64, 0], frames: 14 } },
        { at: 146, drag: { selector: "#s-opex", delta: [46, 0], frames: 14 } },
      ],
    },
    {
      id: "line-item-sorter",
      viewport: "both",
      durationFrames: 120,
      note: "Folio 5. Two items classified correctly, stepping the item list between them, ending on the second verdict rather than on a blank item.",
      preroll: advance(4),
      steps: [
        { at: 24, click: '#screen-5 [data-q="c1"][data-a="cogs"]' },
        { at: 58, click: "#screen-5 [data-step-next]" },
        { at: 90, click: '#screen-5 [data-q="c2"][data-a="opex"]' },
      ],
    },
    {
      id: "waterfall",
      viewport: "both",
      durationFrames: 120,
      note: "Arrives on folio 8 on camera, because the chart is drawn by the arrival and not by anything on the folio itself.",
      preroll: advance(6),
      // Arrival at 45 rather than 20, set off the first gate sheet. The chart
      // takes about twenty frames to stagger in, so arriving at 20 put all
      // three sample frames on a finished chart and the row read as a still.
      // At 45 the sheet gets folio 7, the chart mid-draw, and the chart done.
      steps: [{ at: 45, click: "#next" }],
    },
  ],
};

export default script;
