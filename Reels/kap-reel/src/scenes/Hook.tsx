import type { CSSProperties } from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";
import { KineticText } from "../components/KineticText";
import { COLORS, DISPLAY_STACK } from "../lib/brand";
import { captureSrc, getHomeCapture } from "../lib/captures";
import { safeArea, type FormatKey } from "../lib/layout";

export type HookProps = {
  format: FormatKey;
};

/** Frames 0 to 36. Mobile capture at 2x, full bleed, hook line slammed on top. */
const HOOK_CAPTURE_ID = "fore-motion-golf";

/**
 * The capture scroll is eased in and out across 180 frames, so source frame 0
 * is stationary and Section 6 demands the first frame already be moving.
 * Frame 54 is about 30 percent in, where the ease already carries real
 * velocity, and 36 output frames at 2x consume source frames 54 to 126, which
 * straddles peak scroll speed.
 */
const TRIM_BEFORE = 54;

const HOOK_FONT_SIZE = 104;
const LINE_BOX = Math.round(HOOK_FONT_SIZE * 1.08);

const hookLineStyle: CSSProperties = {
  fontFamily: DISPLAY_STACK,
  fontSize: HOOK_FONT_SIZE,
  fontWeight: 800,
  letterSpacing: -2,
  lineHeight: 1.08,
};

export const Hook: React.FC<HookProps> = ({ format }) => {
  const safe = safeArea(format);
  const capture = getHomeCapture(HOOK_CAPTURE_ID, "mobile");

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
            top: Math.round(safe.top + safe.height * 0.28),
            backgroundColor: "#14100C",
            borderTop: `8px solid ${COLORS.accent}`,
            paddingTop: 44,
            paddingBottom: 52,
            paddingLeft: 72,
            paddingRight: 108,
          }}
        >
          {/* Section 6 calls this one kinetic line, so both halves slam together. */}
          <div style={{ height: LINE_BOX }}>
            <KineticText
              text="Custom built."
              mode="slam"
              startFrame={0}
              style={{ ...hookLineStyle, color: COLORS.canvas }}
            />
          </div>
          <div style={{ height: LINE_BOX }}>
            <KineticText
              text="Not a template."
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
