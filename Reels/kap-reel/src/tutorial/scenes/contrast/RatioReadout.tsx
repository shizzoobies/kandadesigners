import { useCurrentFrame } from "remotion";
import { KineticText } from "../../../components/KineticText";
import { BODY_STACK, COLORS } from "../../../lib/brand";
import { fitOneLine } from "./fit";
import { MONO_STACK } from "./mono";
import type { Measured } from "./ratios";

export type RatioReadoutProps = {
  /** The measurement. Never a string: see ./ratios.ts. */
  measured: Measured;
  /** Width and height of the slot the readout is centered in, in canvas pixels. */
  width: number;
  height: number;
  /** The crop's type scale, from formatMetrics(). */
  scale: number;
  /** Frame inside the beat the number starts typing on. */
  startFrame?: number;
  /** Frames the type-on takes. */
  revealFrames?: number;
  /** Frame the small caps verdict line arrives on. Cuts in, never fades. */
  verdictFrame?: number;
  /** Size of the number at 1080 canvas width, before the slot is fitted. */
  numberSize?: number;
};

/** Number size at 1080 canvas width, before it is fitted to the slot. */
const NUMBER_SIZE = 96;

/**
 * The verdict's own line, authored at 1080 canvas width, the largest share of
 * the readout's width it may take, and its tracking.
 *
 * The width share is there for the same reason Stage's label has one: at
 * landscape's 1.78 type scale a 32 pixel line is drawn at 57, which wrapped
 * inside a readout column and pushed the whole stage off the top of the frame.
 * It is a caption on a number, so it is held to a fraction of the number's own
 * column and fitted to one line.
 */
const VERDICT_SIZE = 30;
const VERDICT_WIDTH_SHARE = 0.05;
const VERDICT_TRACKING = 2;
const VERDICT_GAP = 16;

/**
 * Lenia Mono's advance width as a fraction of the type size.
 *
 * Every glyph in a monospaced face is one advance wide, so a seven character
 * ratio is exactly seven of them, which is what makes the number fittable
 * without measuring text. 0.6 is the usual figure for a mono face and it is
 * deliberately generous: overestimating it makes the number a little smaller
 * than it could be, and underestimating it would run "2.9 : 1" off the slot in
 * the landscape crop, where the readout column is a third of the box.
 */
const MONO_ADVANCE = 0.6;

/**
 * The measurement: a big monospaced ratio that types on, and a small caps
 * interpunct line under it saying whether it passes.
 *
 * Nothing here turns red. The spec is explicit that the number is the verdict,
 * and a red frame would make the beat about alarm rather than about measurement,
 * which is the habit the tutorial is arguing against. Both lines are canvas on
 * the ink ground, and what changes between "fails AA" and "passes AA" is the
 * words.
 *
 * The number types rather than fades because Section 7 bans slow crossfades, and
 * because a ratio arriving digit by digit is what a checker looks like. The
 * verdict cuts in a beat later: read the number, then be told what it means.
 */
export const RatioReadout: React.FC<RatioReadoutProps> = ({
  measured,
  width,
  height,
  scale,
  startFrame = 0,
  revealFrames = 18,
  verdictFrame = 0,
  numberSize = NUMBER_SIZE,
}) => {
  const frame = useCurrentFrame();

  const tracking = VERDICT_TRACKING * scale;
  const verdictSize = fitOneLine(
    measured.line,
    width,
    Math.min(VERDICT_SIZE * scale, width * VERDICT_WIDTH_SHARE),
    tracking,
  );
  const verdictLine = Math.round(verdictSize * 1.3);
  const gap = Math.round(VERDICT_GAP * scale);

  // Fit the number to the slot in both axes, then floor it so a narrow column
  // never shrinks a measurement into a footnote.
  const byWidth = (width * 0.94) / (measured.label.length * MONO_ADVANCE);
  const byHeight = (height - verdictLine - gap) / 1.1;
  const fontSize = Math.max(
    Math.round(44 * scale),
    Math.round(Math.min(numberSize * scale, byWidth, byHeight)),
  );

  return (
    <div
      style={{
        width,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <KineticText
        text={measured.label}
        mode="type"
        startFrame={startFrame}
        revealFrames={revealFrames}
        reserveSpace
        align="center"
        style={{
          fontFamily: MONO_STACK,
          fontSize,
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: 0,
          color: COLORS.canvas,
        }}
      />
      <div
        style={{
          marginTop: gap,
          height: verdictLine,
          fontFamily: BODY_STACK,
          fontSize: verdictSize,
          fontWeight: 600,
          letterSpacing: tracking,
          textTransform: "uppercase",
          lineHeight: 1.3,
          textAlign: "center",
          whiteSpace: "nowrap",
          // The same quiet gray-teal in both states. A pass in green and a fail
          // in red would put the verdict in the color rather than in the
          // number, which is the habit this tutorial exists to argue against.
          color: COLORS.dark_muted,
          // Visibility, not opacity. Section 7 bans fades and the verdict is a
          // statement: it is either being made or it is not.
          visibility: frame >= verdictFrame ? "visible" : "hidden",
        }}
      >
        {measured.line}
      </div>
    </div>
  );
};
