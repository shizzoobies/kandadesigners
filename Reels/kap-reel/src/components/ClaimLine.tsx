import { useCurrentFrame } from "remotion";
import { BODY_STACK, COLORS } from "../lib/brand";

/** Claim type size at 1080 canvas width. Section 7's body minimum. */
export const CLAIM_FONT_SIZE = 48;

/** Rule dimensions at 1080 canvas width. */
const RULE_WIDTH = 64;
const RULE_HEIGHT = 6;
const RULE_GAP = 16;

/**
 * Extra height the rule adds above the claim's own text line, at 1080 canvas
 * width. ProjectShowcase sizes the lower third before the band lays itself out,
 * so it needs this number to predict the band's height.
 */
export const CLAIM_RULE_BLOCK = RULE_HEIGHT + RULE_GAP;

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
 * shaped UI anywhere in this reel, so the claim is a small-caps line with a
 * short rectangular rule. Nothing here is rounded and nothing fades: the line
 * is either on screen or it is not.
 *
 * Owner decision 2026-09-03: the copy is centred rather than left hung, so the
 * rule moved from beside the text to a short centred bar above it. Hanging a
 * dash off the left of a centred line reads as a stray mark, and a rule to the
 * left of centred text pulls the optical centre off axis by half its own width
 * plus the gap.
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
        flexDirection: "column",
        alignItems: "center",
        // Laid out from the first frame of the beat so the scrim behind it is
        // already the right height when the claim cuts in. Visibility, not
        // opacity: Section 7 bans fades.
        visibility: frame >= startFrame ? "visible" : "hidden",
      }}
    >
      <div
        style={{
          width: Math.round(RULE_WIDTH * scale),
          height: Math.round(RULE_HEIGHT * scale),
          marginBottom: Math.round(RULE_GAP * scale),
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
          textAlign: "center",
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
