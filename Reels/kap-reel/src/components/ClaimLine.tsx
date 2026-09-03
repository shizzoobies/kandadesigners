import { useCurrentFrame } from "remotion";
import { BODY_STACK, COLORS } from "../lib/brand";

/** Claim type size at 1080 canvas width. Section 7's body minimum. */
export const CLAIM_FONT_SIZE = 48;

export type ClaimLineProps = {
  text: string;
  /** Accent color for the rule. Rotates per project. */
  accent: string;
  /** Frame inside the current Sequence at which the claim cuts in. */
  startFrame: number;
  /** Type scale for the current format, from formatMetrics(). */
  scale?: number;
  color?: string;
};

/**
 * The spec called this a "stat chip". The owner's rule is no pill or chip
 * shaped UI anywhere in this reel, so the claim is a small-caps line preceded
 * by a short rectangular rule. Nothing here is rounded and nothing fades: the
 * line is either on screen or it is not.
 */
export const ClaimLine: React.FC<ClaimLineProps> = ({
  text,
  accent,
  startFrame,
  scale = 1,
  color = COLORS.canvas,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: Math.round(20 * scale),
        // Laid out from the first frame of the beat so the scrim behind it is
        // already the right height when the claim cuts in. Visibility, not
        // opacity: Section 7 bans fades.
        visibility: frame >= startFrame ? "visible" : "hidden",
      }}
    >
      <div
        style={{
          width: Math.round(44 * scale),
          height: Math.round(6 * scale),
          marginTop: Math.round(26 * scale),
          backgroundColor: accent,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          fontFamily: BODY_STACK,
          fontSize: Math.round(CLAIM_FONT_SIZE * scale),
          fontWeight: 600,
          letterSpacing: 0.4 * scale,
          textTransform: "uppercase",
          color,
          lineHeight: 1.15,
          // Landscape is the only crop where a claim runs out of column, and
          // "AI CADDIE BUILT / IN" reads as a mistake. Balance splits it into
          // two even lines instead of orphaning the last word.
          textWrap: "balance",
        }}
      >
        {text}
      </div>
    </div>
  );
};
