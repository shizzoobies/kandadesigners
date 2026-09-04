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
 * Live versus local: re-read off the live page on 2026-09-04 and unchanged from
 * what the local file describes. Eight sheets, the meter reads "Sheet N of 8",
 * seven generated tabs across four [data-tabs] wrappers, the #screen-5 scenario
 * and the #screen-7 knowledge check both where this file expects them.
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
      // Desktop only, on the evidence of the first gate sheet. At 390 wide the
      // two option cards fill the whole 844px box, so #fb-scenario renders
      // below the cut with the document locked and neither verdict is ever on
      // camera. The clip would show two cards being selected and nothing said
      // about either, which is this beat with its point removed. Evidence
      // still: assets/captures/stills/training-rfi-scenario-branch-mobile-evidence.png
      viewport: "desktop",
      durationFrames: 150,
      note:
        "Sheet 5. The thin RFI is chosen first so the corrective feedback plays, " +
        "then the specific one, so the panel swaps to the right answer on camera.",
      preroll: advance(4),
      steps: [
        { at: 28, click: '#screen-5 .choice[data-correct="false"]' },
        { at: 90, click: '#screen-5 .choice[data-correct="true"]' },
      ],
    },
    {
      id: "knowledge-check",
      // Desktop only, and not because the questions do not fit: they do. The
      // generated .substep-bar is a three-across row the 390 wide layout never
      // wraps, so "Next decision" sits at x=378 with 139px of width and runs
      // off the right edge of a 390px viewport with the document locked. The
      // second decision cannot be reached by pointer on a phone at all.
      // Evidence still:
      // assets/captures/stills/training-rfi-knowledge-check-mobile-evidence.png
      viewport: "desktop",
      durationFrames: 120,
      note: "Sheet 7. Two of the three decisions answered, stepping the generated sub-step bar between them.",
      preroll: advance(6),
      // The second answer at 84 rather than 92: at 92 the 75 percent sample
      // frame landed two frames short of it, so the gate sheet showed decision
      // two sitting untouched.
      steps: [
        { at: 22, click: '#screen-7 .choice[data-q="k1"][data-correct="true"]' },
        { at: 58, click: "#screen-7 .substep-bar button:last-of-type" },
        { at: 84, click: '#screen-7 .choice[data-q="k2"][data-correct="true"]' },
      ],
    },
  ],
};

export default script;
