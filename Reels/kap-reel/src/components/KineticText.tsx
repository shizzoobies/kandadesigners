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
  style,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;

  if (local < 0) {
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
          ...style,
          transform: `scale(${punch})`,
          transformOrigin: "left center",
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
    <div style={style}>
      {text.split("").map((char, i) => (
        <span
          key={`${char}-${i}`}
          style={{ visibility: i < shown ? "visible" : "hidden" }}
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </div>
  );
};
