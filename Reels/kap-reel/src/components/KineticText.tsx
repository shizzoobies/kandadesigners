import type { CSSProperties } from "react";
import { interpolate, useCurrentFrame } from "remotion";

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
   * line's box appears as it starts, and a centred block visibly jumps upward
   * on every arrival. With it the block is its final height from the first
   * frame and only the characters change.
   */
  reserveSpace?: boolean;
  /**
   * Horizontal alignment of the line inside its own box.
   *
   * Owner decision 2026-09-03: the reel's copy is centred rather than left
   * hung. Centring is safe with the type-on because the reveal hides characters
   * with `visibility` rather than slicing the string, so every character still
   * occupies its box from frame 0 and the box is its final width on the first
   * frame. The line is therefore centred once, as a finished line, and does not
   * creep sideways as characters arrive.
   *
   * The slam punch also has to know: scaling about the left edge on a centred
   * line pushes it off centre for the four frames the punch lasts.
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
    <div style={{ whiteSpace: "pre-wrap", textAlign: align, ...style }}>
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
