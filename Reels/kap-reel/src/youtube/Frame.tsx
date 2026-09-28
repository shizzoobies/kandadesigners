// The K&A frame: the same on every frame of every video.
//
// The top rail carries the lockup and ka-performancefl.com at the left (Alex's
// rule: the mark and the URL in a corner on every frame, small and always in
// the same place) and the current chapter at the right, set as a small caps
// interpunct line. Under it sits the 16:9 stage, and under that the bottom
// rail, where the lower third and the key overlay go (see layout.ts).
//
// Children are laid out in stage coordinates: (0, 0) is the stage's top left.
// The stage does not clip them, so a lower third or a keycap can sit in the
// bottom rail at y > STAGE.h; anything that must stay inside the window (a
// capture) clips itself with <StageClip>.

import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { MONO } from "./fonts";
import { H, LOCKUP_H, RAIL_MID, STAGE, W, rise } from "./layout";
import { Lockup, LOCKUP_ASPECT } from "./Lockup";
import type { YouTubeTheme } from "./theme";

export const URL_TEXT = "ka-performancefl.com";
export const STAGE_RADIUS = 14;

/** The small caps label style used everywhere in the set. */
export const smallCaps = (
  size: number,
  color: string,
): React.CSSProperties => ({
  fontFamily: MONO,
  fontWeight: 600,
  fontSize: size,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  lineHeight: 1,
  whiteSpace: "nowrap",
  color,
});

/** Clips its children to the stage window, corners included. */
export const StageClip: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: STAGE.w,
      height: STAGE.h,
      overflow: "hidden",
      borderRadius: STAGE_RADIUS,
    }}
  >
    {children}
  </div>
);

export const Frame: React.FC<{
  theme: YouTubeTheme;
  /** The chapter line at the right of the rail, e.g. "Check 3 · Tab order". */
  chapter: string;
  /** Composition frame the current chapter began on, for its fade in. */
  chapterFrom: number;
  children: ReactNode;
}> = ({ theme, chapter, chapterFrom, children }) => {
  const frame = useCurrentFrame();
  const lockupW = LOCKUP_H * LOCKUP_ASPECT;
  const chapterIn = chapterFrom === 0 ? 1 : rise(frame, chapterFrom, 10);

  return (
    <AbsoluteFill style={{ background: theme.bg, width: W, height: H }}>
      {/* Top rail: the brand corner. */}
      <div
        style={{
          position: "absolute",
          left: STAGE.x,
          top: RAIL_MID - LOCKUP_H / 2,
        }}
      >
        <Lockup height={LOCKUP_H} scheme={theme.lockup} ground={theme.bg} />
      </div>
      <div
        style={{
          position: "absolute",
          left: STAGE.x + lockupW + 22,
          top: RAIL_MID - 14,
          width: 1,
          height: 28,
          background: theme.line,
        }}
      />
      <div
        style={{
          ...smallCaps(19, theme.muted),
          position: "absolute",
          left: STAGE.x + lockupW + 45,
          top: RAIL_MID - 10,
        }}
      >
        {URL_TEXT}
      </div>

      {/* Top rail: the chapter. */}
      <div
        style={{
          ...smallCaps(19, theme.muted),
          position: "absolute",
          right: W - (STAGE.x + STAGE.w),
          top: RAIL_MID - 10,
          opacity: chapterIn,
        }}
      >
        {chapter}
      </div>

      {/* The stage window. */}
      <div
        style={{
          position: "absolute",
          left: STAGE.x,
          top: STAGE.y,
          width: STAGE.w,
          height: STAGE.h,
          borderRadius: STAGE_RADIUS,
          background: theme.surface,
          boxShadow: `0 0 0 1px ${theme.stageEdge}, 0 18px 48px ${theme.shadow}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: STAGE.x,
          top: STAGE.y,
          width: STAGE.w,
          height: STAGE.h,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
