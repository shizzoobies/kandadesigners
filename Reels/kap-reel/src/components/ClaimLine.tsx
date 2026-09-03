import { useCurrentFrame } from "remotion";
import { BODY_STACK, COLORS } from "../lib/brand";

export type ClaimLineProps = {
  text: string;
  /** Accent color for the rule. Rotates per project. */
  accent: string;
  /** Frame inside the current Sequence at which the claim cuts in. */
  startFrame: number;
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
  color = COLORS.canvas,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 20,
        // Laid out from the first frame of the beat so the scrim behind it is
        // already the right height when the claim cuts in. Visibility, not
        // opacity: Section 7 bans fades.
        visibility: frame >= startFrame ? "visible" : "hidden",
      }}
    >
      <div
        style={{
          width: 44,
          height: 6,
          marginTop: 26,
          backgroundColor: accent,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          fontFamily: BODY_STACK,
          fontSize: 48,
          fontWeight: 600,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color,
          lineHeight: 1.15,
        }}
      >
        {text}
      </div>
    </div>
  );
};
