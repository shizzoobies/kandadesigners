// The capture key logs (public/youtube/<video>/captures/<clip>.keys.json), as
// the set reads them. Written by scripts/youtube/l1/capture.mjs; see that
// folder's README for the fields. Coordinates are CSS px in the clip's own
// viewport, so they are independent of how large the clip is drawn.

import type { Box } from "./layout";

export type FocusInfo = {
  tag: string;
  id: string | null;
  label: string;
  box: Box;
  /** The visible ring: box plus outline width and offset. null where no outline is drawn. */
  ringBox: Box | null;
  scrollY: number;
};

export type KeyPress = {
  key: string;
  /** ms from the clip start; the key lands on this frame. */
  tMs: number;
  focus: FocusInfo;
};

export type KeyLog = {
  clip: string;
  viewport: { width: number; height: number; deviceScaleFactor: number };
  video: {
    width: number;
    height: number;
    fps: number;
    frames: number;
    durationMs: number;
  };
  keys: KeyPress[];
};

/** The settled focus box of press `i`: the ring where there is one, else the element. */
export function focusBox(log: KeyLog, i: number): Box {
  const k = log.keys[i];
  if (!k)
    throw new Error(`${log.clip} has no key ${i} (it has ${log.keys.length})`);
  return k.focus.ringBox ?? k.focus.box;
}

/** The press whose focus is showing at a clip time, or null before the first. */
export function focusAt(log: KeyLog, clipMs: number): KeyPress | null {
  let last: KeyPress | null = null;
  for (const k of log.keys) if (k.tMs <= clipMs) last = k;
  return last;
}
