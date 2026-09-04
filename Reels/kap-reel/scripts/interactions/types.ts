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
 * Timing model: the recorder does NOT use wall-clock time. Playwright's clock
 * is installed and paused, and each frame advances it by exactly 33.333ms,
 * along with every running CSS animation and transition on the page. A 400ms
 * count-up therefore reads as 12 recorded frames whatever the screenshot
 * actually costs. Real time is available behind --realtime as an escape hatch.
 *
 * Pointer steps (click, hover, drag) get an approach window that ENDS on their
 * `at` frame: the synthetic cursor eases in over the preceding frames, so `at`
 * is the frame the press happens on, not the frame the cursor starts moving.
 * Leave at least 20 frames between a pointer step and whatever came before it.
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
