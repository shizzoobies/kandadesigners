import type { CSSProperties } from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";
import { KineticText } from "../components/KineticText";
import { COLORS, DISPLAY_STACK } from "../lib/brand";
import { captureSrc, getHomeCapture } from "../lib/captures";
import { formatMetrics, safeArea, type FormatKey } from "../lib/layout";

export type HookProps = {
  format: FormatKey;
};

/**
 * Frames 0 to 54 in the 15 second cut, 0 to 36 in the 45 second one. Site
 * capture at 2x, full bleed, hook line slammed on top.
 */
const HOOK_CAPTURE_ID = "fore-motion-golf";

/**
 * The capture scroll is eased in and out across 180 frames, so source frame 0
 * is stationary and Section 6 demands the first frame already be moving.
 * Frame 54 is about 30 percent in, where the ease already carries real
 * velocity. At 2x the 45 second cut's 36 frames consume source 54 to 126 and
 * the re-paced 15 second cut's 54 frames consume source 54 to 162, both
 * straddling peak scroll speed and both inside the 180 frame source.
 *
 * The longer hook does decelerate into its cut: the ease derivative at source
 * 162 is about 4 percent of its peak, against 35 percent at 126. It is still
 * moving, it is a full bleed background under a text slam rather than the shot
 * that has to be read, and Section 6 asks only that the first frame already be
 * moving, which it emphatically is. Left at 2x rather than re-timed, because
 * the alternatives either slow the opening frame or slow the whole shot, and
 * the opening frame is the one Section 6 cares about.
 */
const TRIM_BEFORE = 54;

/**
 * The hook line, picked from the Section 7 copy bank and confirmed by the
 * owner on 2026-09-03. Five words across two halves, both slammed on frame 0.
 */
const HOOK_LINE_ONE = "Custom built.";
const HOOK_LINE_TWO = "Not a template.";

/** Type size at 1080 canvas width. Section 7 wants 96px or more on a hook. */
const HOOK_FONT_SIZE = 104;

/** Opaque scrim, not a drop shadow. Section 7. */
const SCRIM = "#14100C";

export const Hook: React.FC<HookProps> = ({ format }) => {
  const safe = safeArea(format);
  const metrics = formatMetrics(format);
  const scale = metrics.typeScale;
  const capture = getHomeCapture(HOOK_CAPTURE_ID, metrics.hookViewport);

  const fontSize = Math.round(HOOK_FONT_SIZE * scale);
  const lineBox = Math.round(fontSize * 1.08);

  const hookLineStyle: CSSProperties = {
    fontFamily: DISPLAY_STACK,
    fontSize,
    fontWeight: 800,
    letterSpacing: -2 * scale,
    lineHeight: 1.08,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <AbsoluteFill>
        <OffthreadVideo
          src={captureSrc(capture)}
          playbackRate={2}
          trimBefore={TRIM_BEFORE}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            // 28 percent down the safe area in every crop, so the band clears
            // the reserved top and still sits above optical center.
            top: Math.round(safe.top + safe.height * 0.28),
            backgroundColor: SCRIM,
            borderTop: `${Math.round(8 * scale)}px solid ${COLORS.accent}`,
            paddingTop: Math.round(44 * scale),
            paddingBottom: Math.round(52 * scale),
            paddingLeft: Math.round(72 * scale),
            // Clears the reserved right zone in the vertical crop, and is more
            // conservative than it has to be in the other three.
            paddingRight: Math.round(108 * scale),
            // Owner decision 2026-09-03: the hook is centred. The padding stays
            // asymmetric, so the line centres between the left margin and the
            // reserved right strip rather than on the canvas. That is what
            // keeps it clear of the platform UI in the vertical crop.
            textAlign: "center",
          }}
        >
          {/* Section 6 calls this one kinetic line, so both halves slam together. */}
          <div style={{ height: lineBox }}>
            <KineticText
              text={HOOK_LINE_ONE}
              mode="slam"
              startFrame={0}
              align="center"
              style={{ ...hookLineStyle, color: COLORS.canvas }}
            />
          </div>
          <div style={{ height: lineBox }}>
            <KineticText
              text={HOOK_LINE_TWO}
              mode="slam"
              startFrame={0}
              align="center"
              style={{ ...hookLineStyle, color: COLORS.amber }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
