// Beat map for the Tuesday 2026-09-29 reel, "Contrast is not a vibe", revision 2.
// Text led, no narration, 18 s at 30 fps. Beats are loose enough that a voice
// track can be laid over them later without re-timing the picture.

export const FPS = 30;

export const BEATS = {
  hook: { start: 0, end: 75 },
  need: { start: 75, end: 159 },
  split: { start: 159, end: 318 },
  button: { start: 318, end: 402 },
  cta: { start: 402, end: 540 },
} as const;

export const TOTAL_FRAMES = BEATS.cta.end;

/** Frames inside a beat, relative to its start. */
export const CUE = {
  /** "It fails." stamps in on the hook. Under half a second. */
  hookStamp: 10,
  /** Right panel starts turning from amber to rust. */
  splitMorphIn: 24,
  splitMorphFrames: 60,
  /** Button fill goes from cream to amber. */
  buttonFillIn: 14,
  buttonFillFrames: 36,
  /** CTA lines arrive. */
  ctaUrlIn: 10,
  ctaCallIn: 18,
} as const;

/** The frame the thumbnail is pulled from: the split, after the flip to rust. */
export const THUMB_FRAME = BEATS.split.start + CUE.splitMorphIn + CUE.splitMorphFrames + 40;

import { formatRatio } from "../../lib/contrast";
import { PAIRS, ratioOf } from "./ratios";

const r = (p: keyof typeof PAIRS): string => formatRatio(ratioOf(PAIRS[p]));

export type CueRow = { text: string; start: number; end: number; source: string };

/** Every on-screen line, as burned in, for the SRT. */
export function cueRows(): CueRow[] {
  const b = BEATS;
  const src = "src/social/2026-09-29/Contrast.tsx";
  return [
    { text: "Amber on cream looks fine.", start: b.hook.start, end: b.hook.end, source: src },
    { text: `It fails. ${r("amberOnCream")} : 1`, start: b.hook.start + CUE.hookStamp, end: b.hook.end, source: src },
    { text: `Text needs 4.5 : 1. Amber gets ${r("amberOnCream")}.`, start: b.need.start, end: b.need.end, source: src },
    { text: "If customers can't read it, they can't book it.", start: b.need.start + 8, end: b.need.end, source: src },
    { text: "Same palette. Swap in rust.", start: b.split.start, end: b.split.end, source: src },
    {
      text: `Before ${r("amberOnCream")} : 1 fails. After ${r("rustOnCream")} : 1 passes.`,
      start: b.split.start + CUE.splitMorphIn + CUE.splitMorphFrames,
      end: b.split.end,
      source: src,
    },
    { text: "Amber still works. On buttons, with dark text.", start: b.button.start, end: b.button.end, source: src },
    {
      text: `Dark text on amber: ${r("inkOnAmber")} : 1 passes.`,
      start: b.button.start + CUE.buttonFillIn + CUE.buttonFillFrames,
      end: b.button.end,
      source: src,
    },
    { text: "Every site K&A builds passes these checks.", start: b.cta.start, end: b.cta.end, source: src },
    { text: "ka-performancefl.com", start: b.cta.start + CUE.ctaUrlIn, end: b.cta.end, source: src },
    { text: "Call Alex 904-210-1071", start: b.cta.start + CUE.ctaCallIn, end: b.cta.end, source: src },
  ];
}
