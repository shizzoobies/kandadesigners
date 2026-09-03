import type { CSSProperties } from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";
import { KineticText } from "../components/KineticText";
import { COLORS, DISPLAY_STACK } from "../lib/brand";
import { captureSrc, getHomeCapture } from "../lib/captures";
import { formatMetrics, safeArea, type FormatKey } from "../lib/layout";

export type HookProps = {
  format: FormatKey;
};

/** Frames 0 to 36. Site capture at 2x, full bleed, hook line slammed on top. */
const HOOK_CAPTURE_ID = "fore-motion-golf";

/**
 * The capture scroll is eased in and out across 180 frames, so source frame 0
 * is stationary and Section 6 demands the first frame already be moving.
 * Frame 54 is about 30 percent in, where the ease already carries real
 * velocity, and 36 output frames at 2x consume source frames 54 to 126, which
 * straddles peak scroll speed.
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
          }}
        >
          {/* Section 6 calls this one kinetic line, so both halves slam together. */}
          <div style={{ height: lineBox }}>
            <KineticText
              text={HOOK_LINE_ONE}
              mode="slam"
              startFrame={0}
              style={{ ...hookLineStyle, color: COLORS.canvas }}
            />
          </div>
          <div style={{ height: lineBox }}>
            <KineticText
              text={HOOK_LINE_TWO}
              mode="slam"
              startFrame={0}
              style={{ ...hookLineStyle, color: COLORS.amber }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
