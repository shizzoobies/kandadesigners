/**
 * scripts/interactions/types.ts
 *
 * The step DSL for interaction captures (handoff Section 4 item 6).
 *
 * A recording is a list of beats. A beat is a fixed number of frames at 30fps
 * and a list of steps that fire when the frame counter reaches their `at`.
 * Between steps the recorder keeps stepping frames, so CSS transitions and the
 * module's own animations are captured rather than skipped over.
 *
 * Timing model: real time. Each frame is a state change, a fixed 33ms wait, and
 * a screenshot, so one recorded frame costs 80 to 130ms of wall clock depending
 * on the viewport. Left alone that would compress a 400ms CSS transition into
 * three frames, so the recorder measures the real frame cost and sets the CDP
 * animation playback rate to the ratio between the two. CSS animations and
 * transitions then land on the number of frames their author intended. JS tweens
 * on requestAnimationFrame are not slowed by that, which is why the finance
 * simulator is driven by a drag spread across frames rather than by one jump
 * and its 400ms count-up.
 *
 * Pointer steps (click, hover, drag) get an approach window that ENDS on their
 * `at` frame: the synthetic cursor eases in over the preceding 12 frames, so
 * `at` is the frame the press happens on, not the frame the cursor starts
 * moving. Leave at least 20 frames between a pointer step and whatever came
 * before it.
 */

/** One scripted action. Exactly one verb per step. */
export type Step =
  /** Real mouse click at the element's hotspot. Approach ends on `at`. */
  | { at: number; click: string }
  /** Keyboard press on the focused element, e.g. "ArrowRight". */
  | { at: number; key: string }
  /** Move the cursor onto an element and leave it there. Approach ends on `at`. */
  | { at: number; hover: string }
  /** Set a form value and fire input + change. */
  | { at: number; fill: { selector: string; value: string } }
  /**
   * Press on `selector`, travel, release. `at` is the mousedown frame and the
   * travel runs over the following `frames` (default 14). For an
   * input[type=range] the press lands on the thumb rather than the box centre.
   */
  | {
      at: number;
      drag: {
        selector: string;
        toSelector?: string;
        delta?: [number, number];
        frames?: number;
      };
    }
  /** Raw JS in the page. The value is ignored. */
  | { at: number; eval: string }
  /** Block the frame loop until the selector matches and is visible. */
  | { at: number; waitFor: string };

export type BeatViewport = "desktop" | "mobile" | "both";

export type Beat = {
  id: string;
  viewport: BeatViewport;
  durationFrames: number;
  steps: Step[];
  /**
   * Steps run before the recording starts, to put the module on the right
   * screen. Not recorded, and `at` is ignored: preroll steps run in order with
   * a short settle between each.
   */
  preroll?: Step[];
  /** Why this beat is scoped the way it is. Printed in the run log. */
  note?: string;
};

export type InteractionScript = {
  projectId: string;
  beats: Beat[];
};
