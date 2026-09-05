import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY_STACK, COLORS } from "../../lib/brand";
import {
  centeredBox,
  centeredPadding,
  formatMetrics,
  SAFE_ZONES,
  type FormatKey,
} from "../../lib/layout";
import { CAPTION_MAX_LINES } from "../types";

export type CaptionProps = {
  format: FormatKey;
  /** One or two lines. Authored in the content file, not split at render time. */
  lines: string[];
};

/** Type size at 1080 canvas width, per the spec: Atkinson at about 44px. */
const CAPTION_FONT_SIZE = 44;

/** A card, not a pill. The non-negotiables ban pill and chip UI outright. */
const CARD_RADIUS = 8;

/**
 * Frames the card takes to arrive and to leave.
 *
 * Section 7 bans slow crossfades and everything else in both reels is a hard
 * cut. Six frames is a fifth of a second, which is a cut with the edge taken
 * off rather than a fade: it exists because a caption card appearing on the
 * same frame as a scene change makes the scene change read as a flicker.
 */
const FADE_FRAMES = 6;

/**
 * The burned in caption card, per the spec's "Captions".
 *
 * Bottom safe area, Atkinson at about 44px at 1080 wide, ink on a canvas card
 * with an 8px radius, one or two lines, fading with the beat. It is burned in
 * because a tutorial watched muted in a feed is the normal case, and the SRT
 * sidecar carries the full narration for a viewer reading rather than listening.
 *
 * Centred on the CANVAS through centeredBox(), like everything else in this
 * project since the owner's 2026-09-04 decision. The card is sized to its own
 * copy rather than run edge to edge, so it reads as a caption card sitting on
 * the picture and not as a second lower third.
 */
export const Caption: React.FC<CaptionProps> = ({ format, lines }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const metrics = formatMetrics(format);
  const scale = metrics.typeScale;

  if (lines.length === 0) return null;
  if (lines.length > CAPTION_MAX_LINES) {
    throw new Error(
      `A caption is at most ${CAPTION_MAX_LINES} lines, got ${lines.length}: ` +
        `${lines.join(" / ")}`,
    );
  }

  // In at the top of the beat, out at the bottom of it, and held flat between.
  const opacity = Math.min(
    interpolate(frame, [0, FADE_FRAMES], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(
      frame,
      [durationInFrames - FADE_FRAMES, durationInFrames],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    ),
  );

  const fontSize = Math.round(CAPTION_FONT_SIZE * scale);
  const padX = Math.round(36 * scale);
  const padY = Math.round(24 * scale);

  // The widest the card may be: the same copy box every band in the reel takes,
  // so a caption can never run into the reserved right strip.
  const box = centeredBox(
    format,
    SAFE_ZONES[format].width - centeredPadding(format, scale) * 2,
  );

  return (
    <div
      style={{
        position: "absolute",
        left: box.left,
        width: box.width,
        bottom: metrics.bandBottom,
        display: "flex",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          maxWidth: "100%",
          boxSizing: "border-box",
          padding: `${padY}px ${padX}px`,
          borderRadius: Math.round(CARD_RADIUS * scale),
          backgroundColor: COLORS.canvas,
          color: COLORS.ink,
          fontFamily: BODY_STACK,
          fontSize,
          fontWeight: 500,
          lineHeight: 1.25,
          letterSpacing: 0.2 * scale,
          textAlign: "center",
        }}
      >
        {lines.map((line, i) => (
          <div key={`${line}-${i}`}>{line}</div>
        ))}
      </div>
    </div>
  );
};
