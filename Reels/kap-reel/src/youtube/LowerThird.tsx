// The lower third: a small caps label over one display line, at the left of
// the bottom rail, set on the frame itself under an accent rule. It never sits
// on a capture, so it never hides part of the page being shown. Fixed shape and
// motion across videos: it rises 10 px and fades in over 12 frames, and fades
// out over the last 8. Coordinates are the stage's (see Frame.tsx).

import { interpolate, useCurrentFrame } from "remotion";
import { DISPLAY } from "./fonts";
import { BOTTOM_RAIL, STAGE, rise } from "./layout";
import { smallCaps } from "./Frame";
import type { YouTubeTheme } from "./theme";

/** Leaves the right of the rail to the key overlay. */
export const LOWER_THIRD_MAX_W = 1120;

const BLOCK_H = 64;

export const LowerThird: React.FC<{
  theme: YouTubeTheme;
  label: string;
  line: string;
  /** Beat frames it is on screen, [from, to). */
  from: number;
  to: number;
}> = ({ theme, label, line, from, to }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  const p = rise(frame, from, 12);
  const out = interpolate(frame, [to - 8, to], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: STAGE.h + Math.round((BOTTOM_RAIL.h - BLOCK_H) / 2),
        height: BLOCK_H,
        maxWidth: LOWER_THIRD_MAX_W,
        opacity: Math.min(p, out),
        transform: `translateY(${(1 - p) * 10}px)`,
        borderLeft: `5px solid ${theme.accent}`,
        paddingLeft: 20,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={smallCaps(17, theme.accent)}>{label}</div>
      <div
        style={{
          marginTop: 10,
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 30,
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          color: theme.ink,
        }}
      >
        {line}
      </div>
    </div>
  );
};
