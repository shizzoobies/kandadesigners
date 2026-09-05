import type { CSSProperties } from "react";
import { interpolate, useCurrentFrame } from "remotion";

// ---------------------------------------------------------------------------
// Fitting a hook line to its box
// ---------------------------------------------------------------------------
//
// A hook is two kinetic lines stacked in two boxes of a fixed height, and both
// hook scenes (src/scenes/Hook.tsx and src/tutorial/scenes/TutorialHook.tsx)
// used to compute that height as fontSize * 1.08: exactly one line box, on the
// assumption that a hook line is short. That holds for the showcase reels,
// whose halves are "Custom built." and "One designer.", and it does not hold
// for a tutorial, whose hook is a sentence. "Your hero is a promise," is twenty
// three characters and at 104px it is far wider than the 864 pixel copy box, so
// it wrapped inside a box only tall enough for one line and the amber second
// half was drawn straight through it.
//
// fitHookLines() is the fix, and it lives here rather than in either scene
// because both scenes have to make the same decision and neither may own it.
// The rule, in order:
//
//   1. Measure every half at the authored size. If they all fit on one line,
//      change nothing. That is the showcase case and it renders identically.
//   2. Otherwise shrink the type until the widest half fits on one line, down
//      to a floor (84px at 1080 wide, against Section 7's 96px preference: a
//      hook that has to be read in half a second is worth the exception, an
//      unreadable one is not).
//   3. If it still does not fit at the floor, let it wrap and give each half a
//      box as tall as the number of lines it actually took, so the second half
//      stacks below the first rather than on top of it.
//
// Measurement is a canvas 2D context rather than an estimate from character
// counts, because the answer differs per crop in a way an estimate cannot see:
// the landscape crop scales the type by 1.78 and the copy box by 1.93, so the
// hero hook fits on one line there and does not in the vertical crop.

/** Canvas context used for measuring. Made once; null outside a browser. */
let measureContext: CanvasRenderingContext2D | null | undefined;

function measurer(): CanvasRenderingContext2D | null {
  if (measureContext !== undefined) return measureContext;
  measureContext =
    typeof document === "undefined"
      ? null
      : document.createElement("canvas").getContext("2d");
  return measureContext;
}

export type HookLineFit = {
  /** The size every half is set at. The authored size unless it had to shrink. */
  fontSize: number;
  /** Height of each half's box, in pixels: its line count times the line box. */
  boxes: number[];
  /** Lines each half actually took. 1 unless it had to wrap at the floor. */
  rows: number[];
};

export type FitHookLinesOptions = {
  lines: string[];
  /** Width of the copy box the lines are set in, in canvas pixels. */
  maxWidth: number;
  /** The authored size for this crop. Never exceeded. */
  fontSize: number;
  /** The smallest the type may shrink to before the line is allowed to wrap. */
  minFontSize: number;
  /** Multiplier on the size for one line box. The hook's is 1.08. */
  lineHeight: number;
  /** The display family's own name, not the fallback stack. */
  fontFamily: string;
  fontWeight: number;
  /** Tracking in pixels, negative on the hook. */
  letterSpacing: number;
};

export function fitHookLines(options: FitHookLinesOptions): HookLineFit {
  const {
    lines,
    maxWidth,
    fontSize,
    minFontSize,
    lineHeight,
    fontFamily,
    fontWeight,
    letterSpacing,
  } = options;

  const boxOf = (size: number, rows: number) =>
    Math.round(size * lineHeight) * rows;
  const unchanged: HookLineFit = {
    fontSize,
    boxes: lines.map(() => boxOf(fontSize, 1)),
    rows: lines.map(() => 1),
  };

  const ctx = measurer();
  if (!ctx) return unchanged;

  const fontOf = (size: number) => `${fontWeight} ${size}px "${fontFamily}"`;

  // The brand face is loaded by @remotion/fonts, which holds the render back
  // until it is ready, so in a render this is always true. If it ever is not,
  // the measurement would be of a fallback face and the honest answer is to
  // change nothing rather than to resize the type from a wrong number.
  if (!document.fonts.check(fontOf(fontSize))) return unchanged;

  // Chrome has taken ctx.letterSpacing since 99 and the render browser is far
  // newer, but a measurement that silently ignored the hook's negative tracking
  // would overstate every line, so the fallback adds it back by hand.
  const tracking = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  const trackingSupported = "letterSpacing" in tracking;

  const widthOf = (text: string, size: number): number => {
    ctx.font = fontOf(size);
    if (trackingSupported) tracking.letterSpacing = `${letterSpacing}px`;
    const measured = ctx.measureText(text).width;
    return trackingSupported
      ? measured
      : measured + letterSpacing * text.length;
  };
  const widestAt = (size: number) =>
    lines.reduce((widest, line) => Math.max(widest, widthOf(line, size)), 0);

  if (widestAt(fontSize) <= maxWidth) return unchanged;

  // Width is very nearly linear in size, so one division lands within a pixel
  // or two and the two loops only walk that far.
  let size = Math.min(
    fontSize,
    Math.max(
      minFontSize,
      Math.floor((fontSize * maxWidth) / widestAt(fontSize)),
    ),
  );
  while (size > minFontSize && widestAt(size) > maxWidth) size -= 1;
  while (size < fontSize && widestAt(size + 1) <= maxWidth) size += 1;

  if (widestAt(size) <= maxWidth) {
    return {
      fontSize: size,
      boxes: lines.map(() => boxOf(size, 1)),
      rows: lines.map(() => 1),
    };
  }

  // Too wide even at the floor. Wrap there, and measure the wrap the same way
  // the browser will do it, so each box is as tall as its half really is.
  const rows = lines.map((line) => {
    let count = 1;
    let current = "";
    for (const word of line.split(/\s+/).filter(Boolean)) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && widthOf(candidate, size) > maxWidth) {
        count += 1;
        current = word;
      } else {
        current = candidate;
      }
    }
    return count;
  });

  return { fontSize: size, boxes: rows.map((r) => boxOf(size, r)), rows };
}

export type KineticTextMode = "type" | "slam";

export type KineticTextProps = {
  text: string;
  /** Frame inside the current Sequence at which the line appears. */
  startFrame?: number;
  /**
   * "type" reveals characters one at a time with no fade.
   * "slam" puts the whole line on screen at once with a short scale punch.
   */
  mode?: KineticTextMode;
  /** Frames the type-on takes. Ignored in slam mode. */
  revealFrames?: number;
  /**
   * Lays the line's box out from frame 0 with every character hidden, instead
   * of rendering nothing until startFrame. Opt in, and off by default so no
   * existing caller changes.
   *
   * A block of lines that arrive one at a time needs this: without it each
   * line's box appears as it starts, and a centered block visibly jumps upward
   * on every arrival. With it the block is its final height from the first
   * frame and only the characters change.
   */
  reserveSpace?: boolean;
  /**
   * Horizontal alignment of the line inside its own box.
   *
   * Owner decision 2026-09-03: the reel's copy is centered rather than left
   * hung. Centring is safe with the type-on because the reveal hides characters
   * with `visibility` rather than slicing the string, so every character still
   * occupies its box from frame 0 and the box is its final width on the first
   * frame. The line is therefore centered once, as a finished line, and does not
   * creep sideways as characters arrive.
   *
   * The slam punch also has to know: scaling about the left edge on a centered
   * line pushes it off center for the four frames the punch lasts.
   *
   * Owner decision 2026-09-04: a centered line centres on its containing box,
   * and every box that holds one is now centered on the canvas by
   * centeredPadding() or centeredBox() in src/lib/layout.ts. The line's own box
   * is forced to the full width of that container so the axis is the
   * container's axis in every context, flex parents included.
   */
  align?: "left" | "center";
  style?: CSSProperties;
};

/**
 * Type on, hold, cut. Section 7 of the handoff bans slow crossfades, so nothing
 * here animates opacity: characters are either present or hidden, and layout is
 * held stable with visibility rather than a substring so the line does not
 * reflow while it reveals.
 */
export const KineticText: React.FC<KineticTextProps> = ({
  text,
  startFrame = 0,
  mode = "type",
  revealFrames = 18,
  reserveSpace = false,
  align = "left",
  style,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  const centered = align === "center";

  if (local < 0 && !reserveSpace) {
    return null;
  }

  if (mode === "slam") {
    const punch = interpolate(local, [0, 4], [1.05, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <div
        style={{
          textAlign: align,
          width: centered ? "100%" : undefined,
          ...style,
          transform: `scale(${punch})`,
          transformOrigin: centered ? "center center" : "left center",
          // Only reachable with reserveSpace on, where the box has to exist
          // before the line does.
          visibility: local < 0 ? "hidden" : "visible",
        }}
      >
        {text}
      </div>
    );
  }

  const shown = Math.round(
    interpolate(local, [0, revealFrames], [0, text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    // pre-wrap, not a non-breaking space. A hidden span still occupies its
    // box, so a plain space keeps the reveal from reflowing on its own, and it
    // leaves the only break opportunity a long project name has. With a
    // non-breaking space "Southern Legacy Contractors" ran straight through the
    // reserved right zone in the landscape crop rather than wrapping.
    <div
      style={{
        whiteSpace: "pre-wrap",
        textAlign: align,
        width: centered ? "100%" : undefined,
        ...style,
      }}
    >
      {text.split("").map((char, i) => (
        <span
          key={`${char}-${i}`}
          style={{ visibility: i < shown ? "visible" : "hidden" }}
        >
          {char}
        </span>
      ))}
    </div>
  );
};
