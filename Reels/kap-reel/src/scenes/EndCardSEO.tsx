import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { KineticText } from "../components/KineticText";
import { BODY_STACK, COLORS, DISPLAY_STACK } from "../lib/brand";
import {
  centeredBox,
  centeredPadding,
  formatMetrics,
  safeArea,
  SAFE_ZONES,
  type FormatKey,
} from "../lib/layout";

export type EndCardSEOProps = {
  format: FormatKey;
};

/**
 * One-off end card for the Ellenton Family Practice Direct social clip
 * (2026-09-28). Not part of the ReelContent / registrations() system the
 * showcase and training reels use: this card has its own fixed copy, so it is
 * a small standalone scene in the same visual language as CallToAction rather
 * than a fifth entry in that system.
 *
 * Same fonts, same colors, no pill or chip shapes, a drawn-in reveal: a short
 * rust rule grows in above the headline the way ClaimLine's rule sits above a
 * project claim, and every line below it arrives with the same slam or
 * type-on KineticText already uses elsewhere in this project. Ink on canvas,
 * rust accent, nothing rounded, nothing fading.
 */

/** Frames the rust rule takes to grow from zero width to full. */
const RULE_GROW_FRAMES = 18;
/** Rule dimensions at 1080 canvas width, matching ClaimLine's proportions. */
const RULE_WIDTH = 120;
const RULE_HEIGHT = 6;

const HEADLINE_START = 6;
const HEADLINE_REVEAL = 20;
const BODY1_START = 26;
const BODY1_REVEAL = 22;
const URL_START = 50;
const BODY2_START = 62;
const BODY2_REVEAL = 20;
const FOOTER_START = 82;

export const EndCardSEO: React.FC<EndCardSEOProps> = ({ format }) => {
  const frame = useCurrentFrame();
  const safe = safeArea(format);
  const scale = formatMetrics(format).typeScale;

  const card = centeredBox(
    format,
    SAFE_ZONES[format].width - centeredPadding(format, scale) * 2,
  );

  const ruleWidth = interpolate(frame, [0, RULE_GROW_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
        {/* The drawn-in reveal: a rust rule growing from its center, left
            anchored the way ClaimLine's static one sits above a claim. */}
        <div
          style={{
            width: Math.round(RULE_WIDTH * scale),
            height: Math.round(RULE_HEIGHT * scale),
            marginBottom: Math.round(32 * scale),
            backgroundColor: COLORS.accent,
            transform: `scaleX(${ruleWidth})`,
            transformOrigin: "center",
            flexShrink: 0,
          }}
        />

        <KineticText
          text="Not showing up where people look?"
          mode="slam"
          startFrame={HEADLINE_START}
          reserveSpace
          align="center"
          style={{
            fontFamily: DISPLAY_STACK,
            fontSize: Math.round(76 * scale),
            fontWeight: 800,
            letterSpacing: -1 * scale,
            lineHeight: 1.12,
            color: COLORS.ink,
            textWrap: "balance",
          }}
        />

        <div style={{ height: Math.round(28 * scale) }} />

        <KineticText
          text="We build local search into every site."
          mode="type"
          startFrame={BODY1_START}
          revealFrames={BODY1_REVEAL}
          reserveSpace
          align="center"
          style={{
            fontFamily: BODY_STACK,
            fontSize: Math.round(48 * scale),
            fontWeight: 500,
            letterSpacing: 0.2 * scale,
            lineHeight: 1.3,
            color: COLORS.muted,
            textWrap: "balance",
          }}
        />

        <div style={{ height: Math.round(56 * scale) }} />

        <KineticText
          text="ka-performancefl.com"
          mode="slam"
          startFrame={URL_START}
          reserveSpace
          align="center"
          style={{
            fontFamily: DISPLAY_STACK,
            fontSize: Math.round(60 * scale),
            fontWeight: 700,
            letterSpacing: 0.3 * scale,
            color: COLORS.accent,
          }}
        />

        <div style={{ height: Math.round(24 * scale) }} />

        <KineticText
          text="Call Alex, 904-210-1071"
          mode="type"
          startFrame={BODY2_START}
          revealFrames={BODY2_REVEAL}
          reserveSpace
          align="center"
          style={{
            fontFamily: BODY_STACK,
            fontSize: Math.round(48 * scale),
            fontWeight: 500,
            letterSpacing: 0.5 * scale,
            color: COLORS.ink,
          }}
        />

        <div style={{ height: Math.round(48 * scale) }} />

        <KineticText
          text="K&A Performance, Gainesville, FL"
          mode="type"
          startFrame={FOOTER_START}
          revealFrames={14}
          reserveSpace
          align="center"
          style={{
            fontFamily: BODY_STACK,
            fontSize: Math.round(32 * scale),
            fontWeight: 500,
            letterSpacing: 0.6 * scale,
            color: COLORS.muted,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
