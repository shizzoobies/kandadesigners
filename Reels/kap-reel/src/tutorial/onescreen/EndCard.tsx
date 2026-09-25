import { AbsoluteFill, useCurrentFrame } from "remotion";
import { LogoDraw } from "../../components/LogoDraw";
import { BODY_STACK, brand, COLORS } from "../../lib/brand";
import { centeredBox, centeredPadding, formatMetrics, safeArea, SAFE_ZONES, type FormatKey } from "../../lib/layout";
import { CTA_URL } from "./content";

/**
 * The drawn end card, pointing at /training.
 *
 * src/scenes/CallToAction.tsx draws the lockup over the brand url and the
 * phone; this reel's call to action is the free sample courses, so the url
 * line has to be ka-performancefl.com/training, and that card takes no url
 * prop. This is the same card with that one line changed: the same LogoDraw,
 * the same short cut clock (a 66 frame draw from T 1.205, copy on relative
 * frame 47), the same caps on the lockup, the same type. The url is set at
 * 52px rather than 60 because it is nine characters longer and has to sit
 * inside the same 864 pixel copy box.
 */
const DRAW_FRAMES = 66;
const COPY_IN = 47;
const DRAW_START_T = 1.205;
const LOGO_TARGET_WIDTH = 776;
const LOGO_ASPECT = 548 / 1340;

export const OnescreenEndCard: React.FC<{ format?: FormatKey; closingLine?: string }> = ({
  format = "vertical",
  closingLine,
}) => {
  const frame = useCurrentFrame();
  const safe = safeArea(format);
  const scale = formatMetrics(format).typeScale;
  const card = centeredBox(format, SAFE_ZONES[format].width - centeredPadding(format, scale) * 2);
  const logoWidth = Math.round(
    Math.min(LOGO_TARGET_WIDTH * scale, card.width * 0.83, (safe.height * (closingLine ? 0.32 : 0.4)) / LOGO_ASPECT),
  );
  const shown = frame >= COPY_IN ? "visible" : "hidden";

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.canvas }}>
      <div
        style={{
          position: "absolute",
          left: card.left,
          width: card.width,
          top: safe.top,
          height: safe.height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LogoDraw durationFrames={DRAW_FRAMES} startT={DRAW_START_T} width={logoWidth} />
        {closingLine ? (
          <div
            style={{
              marginTop: Math.round(44 * scale),
              visibility: shown,
              fontFamily: BODY_STACK,
              fontSize: Math.round(52 * scale),
              fontWeight: 500,
              letterSpacing: 0.4 * scale,
              lineHeight: 1.2,
              color: COLORS.ink,
              textAlign: "center",
            }}
          >
            {closingLine}
          </div>
        ) : null}
        <div
          style={{
            marginTop: Math.round((closingLine ? 20 : 44) * scale),
            visibility: shown,
            fontFamily: BODY_STACK,
            fontSize: Math.round(52 * scale),
            fontWeight: 600,
            letterSpacing: 0.5 * scale,
            color: COLORS.accent,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {CTA_URL}
        </div>
        <div
          style={{
            marginTop: Math.round(26 * scale),
            visibility: shown,
            fontFamily: BODY_STACK,
            fontSize: Math.round(52 * scale),
            fontWeight: 500,
            letterSpacing: 1 * scale,
            color: COLORS.muted,
            textAlign: "center",
          }}
        >
          {brand.phone}
        </div>
      </div>
    </AbsoluteFill>
  );
};
