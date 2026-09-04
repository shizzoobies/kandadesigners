/**
 * scripts/interactions/training-rfi.ts
 *
 * "The RFI that gets answered." Eight screen deck, same pager contract as the
 * safety module but a different chassis underneath.
 *
 * How the deck is driven, read off the live build:
 *   - #next and #prev step through #screen-1 .. #screen-8. Nothing is gated:
 *     #next is only disabled on the last screen.
 *   - Tabs are NOT authored. [data-tabs] wrappers hold <section class="tabsec">
 *     children and app.js builds a .tablist of .tab buttons at run time, so
 *     there are no tab ids to target. Nothing here needs them.
 *   - Sub-steps are also built at run time: a [data-substeps] group gets a
 *     .substep-bar appended to its screen holding "Previous <noun>", a count,
 *     and "Next <noun>". Target them positionally inside the screen.
 *   - Answers are [data-q][data-correct] buttons writing into #fb-<key>.
 *
 * Live versus local: the live build is older than the local file (435 lines of
 * app.js against 547) but carries the same screens, the same #screen-5
 * scenario, and the same #screen-7 knowledge check used here.
 */

import type { InteractionScript } from "./types";

function advance(n: number): { at: number; click: string }[] {
  return Array.from({ length: n }, () => ({ at: 0, click: "#next" }));
}

const script: InteractionScript = {
  projectId: "training-rfi",
  beats: [
    {
      id: "hero",
      viewport: "both",
      durationFrames: 60,
      note: "First screen, held. No pointer steps, so the synthetic cursor never appears: this is the clean opening still as two seconds of video.",
      steps: [],
    },
    {
      id: "scenario-branch",
      viewport: "both",
      durationFrames: 150,
      note:
        "Screen 5. The thin RFI is chosen first so the corrective feedback plays, " +
        "then the specific one, so the panel swaps to the right answer on camera.",
      preroll: advance(4),
      steps: [
        { at: 28, click: '#screen-5 .choice[data-correct="false"]' },
        { at: 90, click: '#screen-5 .choice[data-correct="true"]' },
      ],
    },
    {
      id: "knowledge-check",
      viewport: "both",
      durationFrames: 120,
      note: "Screen 7. Two of the three decisions answered, stepping the generated sub-step bar between them.",
      preroll: advance(6),
      steps: [
        { at: 22, click: '#screen-7 .choice[data-q="k1"][data-correct="true"]' },
        { at: 62, click: "#screen-7 .substep-bar button:last-of-type" },
        { at: 92, click: '#screen-7 .choice[data-q="k2"][data-correct="true"]' },
      ],
    },
  ],
};

export default script;
