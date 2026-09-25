import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fitHookLines } from "../../components/KineticText";
import { LogoDraw } from "../../components/LogoDraw";
import { BODY_FAMILY, BODY_STACK, brand, COLORS } from "../../lib/brand";
import {
  centeredBox,
  centeredPadding,
  formatMetrics,
  safeArea,
  SAFE_ZONES,
  type FormatKey,
} from "../../lib/layout";

/**
 * The drawn end card, pointing at the free AI lessons.
 *
 * src/scenes/CallToAction.tsx line for line in everything but the address:
 * the same LogoDraw choreography at the same 66 frame draw from the same
 * T 1.205 start, the same copy cue at relative 47, the same canvas ground,
 * lockup width rule and centring on the canvas. CallToAction always prints
 * brand.url, and this card's job is to send the viewer to one page, so it is a
 * copy rather than a prop on a shared scene another session was working in.
 *
 * The address is set as one line at the largest size that fits the card,
 * measured with the same fitter the hook uses, from 60 down to 40 pixels at
 * 1080 wide.
 */

const DRAW_FRAMES = 66;
const COPY_IN = 47;
const DRAW_START_T = 1.205;
const LOGO_TARGET_WIDTH = 776;
const LOGO_ASPECT = 548 / 1340;

export type BriefCtaProps = {
  format: FormatKey;
  closingLine: string;
  url: string;
};

export const BriefCta: React.FC<BriefCtaProps> = ({ format, closingLine, url }) => {
  const frame = useCurrentFrame();
  const safe = safeArea(format);
  const scale = formatMetrics(format).typeScale;
  const card = centeredBox(format, SAFE_ZONES[format].width - centeredPadding(format, scale) * 2);

  const logoWidth = Math.round(
    Math.min(LOGO_TARGET_WIDTH * scale, card.width * 0.83, (safe.height * 0.32) / LOGO_ASPECT),
  );

  const urlFit = fitHookLines({
    lines: [url],
    maxWidth: card.width,
    fontSize: Math.round(60 * scale),
    minFontSize: Math.round(40 * scale),
    lineHeight: 1.2,
    fontFamily: BODY_FAMILY,
    fontWeight: 600,
    letterSpacing: 0.5 * scale,
  });

  const copyVisible = frame >= COPY_IN ? "visible" : "hidden";

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

        <div
          style={{
            marginTop: Math.round(44 * scale),
            visibility: copyVisible,
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

        <div
          style={{
            marginTop: Math.round(20 * scale),
            visibility: copyVisible,
            fontFamily: BODY_STACK,
            fontSize: urlFit.fontSize,
            fontWeight: 600,
            letterSpacing: 0.5 * scale,
            lineHeight: 1.2,
            color: COLORS.accent,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {url}
        </div>

        <div
          style={{
            marginTop: Math.round(26 * scale),
            visibility: copyVisible,
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
