import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BODY_STACK,
  brand,
  COLORS,
  DISPLAY_STACK,
  LOGO_PNG,
} from "../lib/brand";
import { safeArea, type FormatKey } from "../lib/layout";

export type CallToActionProps = {
  format: FormatKey;
};

/** Frames the logo takes to settle. Section 15 bans logo animations over a second. */
const LOGO_SETTLE_FRAMES = 12;
/** Name and url arrive together, never sequentially. */
const LOCKUP_IN = 14;
const PHONE_IN = 22;

/**
 * approved-logo-transparent.png is 1536x1024 with the mark occupying only
 * 510x448 at offset 512,260. Displaying the whole file makes the mark read at
 * a third of its box, so the transparent padding is cropped here rather than by
 * writing a new asset. Measured from the alpha channel on 2026-09-03.
 */
const LOGO_FILE = { width: 1536, height: 1024 };
const LOGO_CONTENT = { x: 512, y: 260, width: 510, height: 448 };
const LOGO_TARGET_WIDTH = 460;
const LOGO_SCALE = LOGO_TARGET_WIDTH / LOGO_CONTENT.width;

export const CallToAction: React.FC<CallToActionProps> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const safe = safeArea(format);

  const settle = spring({
    frame,
    fps,
    durationInFrames: LOGO_SETTLE_FRAMES,
    config: { damping: 200 },
  });
  const logoY = interpolate(settle, [0, 1], [-44, 0]);
  const logoScale = interpolate(settle, [0, 1], [0.92, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.canvas }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: safe.top,
          height: safe.height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: LOGO_TARGET_WIDTH,
            height: Math.round(LOGO_CONTENT.height * LOGO_SCALE),
            overflow: "hidden",
            position: "relative",
            transform: `translateY(${logoY}px) scale(${logoScale})`,
          }}
        >
          <Img
            src={LOGO_PNG}
            style={{
              position: "absolute",
              width: Math.round(LOGO_FILE.width * LOGO_SCALE),
              height: Math.round(LOGO_FILE.height * LOGO_SCALE),
              left: -Math.round(LOGO_CONTENT.x * LOGO_SCALE),
              top: -Math.round(LOGO_CONTENT.y * LOGO_SCALE),
              maxWidth: "none",
            }}
          />
        </div>

        <div style={{ height: 40 }} />

        <div
          style={{
            visibility: frame >= LOCKUP_IN ? "visible" : "hidden",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: DISPLAY_STACK,
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: -1.5,
              lineHeight: 1.1,
              color: COLORS.ink,
            }}
          >
            {brand.business_name}
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: BODY_STACK,
              fontSize: 56,
              fontWeight: 500,
              letterSpacing: 0.5,
              color: COLORS.accent,
            }}
          >
            {brand.url}
          </div>
        </div>

        <div
          style={{
            marginTop: 30,
            visibility: frame >= PHONE_IN ? "visible" : "hidden",
            fontFamily: BODY_STACK,
            fontSize: 52,
            fontWeight: 500,
            letterSpacing: 1,
            color: COLORS.muted,
          }}
        >
          {brand.phone}
        </div>
      </div>
    </AbsoluteFill>
  );
};
