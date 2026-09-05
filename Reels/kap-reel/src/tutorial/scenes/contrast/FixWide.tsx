import {
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BODY_STACK, COLORS } from "../../../lib/brand";
import { formatMetrics } from "../../../lib/layout";
import type { TutorialSceneProps } from "../registry";
import { fitOneLine } from "./fit";
import { MONO_STACK } from "./mono";
import { RatioReadout } from "./RatioReadout";
import {
  AMBER_ON_CANVAS,
  INK_ON_AMBER,
  INTERPUNCT,
  RUST_ON_CANVAS,
} from "./ratios";
import { SamplePage } from "./SamplePage";
import { Stage, type StageSlot } from "./Stage";

/**
 * "The fix is not a new palette." The 45 second cut's fix beat, 355 frames.
 *
 * The same card as the 15 second cut, crossfading from amber to rust, with both
 * measurements standing side by side rather than one replacing the other. That
 * is the difference between the two cuts: the short one is a correction and
 * shows one number at a time, and this one is an argument and has to show what
 * was traded for what.
 *
 * Under both, small, the button's own measurement. It is there because the
 * narration says amber stays on buttons with dark text on top, and a viewer who
 * has just watched amber fail will otherwise read that as an exception being
 * made. It is not an exception: espresso ink on amber is its own pair and it
 * clears AA on its own.
 */

/** The button's line cuts in early, on "amber stays on buttons". */
const BUTTON_FRAME = 55;

/** The crossfade, then the second number, then its verdict. */
const FADE_START = 150;
const FADE_FRAMES = 20;
const NUMBER_FRAME = 175;
const REVEAL_FRAMES = 22;
const VERDICT_FRAME = 212;

/** See Stage's `settle`. This beat holds for nearly five seconds at the end. */
const SETTLE = 0.005;

/** The aside's height in the stacked crops, authored at 1080 wide. */
const ASIDE_HEIGHT = 300;

/** Landscape gives the card a little over half the box. */
const MAIN_FRACTION = 0.55;

const EXAMPLE_LABEL = `example ${INTERPUNCT} fictional business`;

export const ContrastFixWide: React.FC<TutorialSceneProps> = ({ format }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const split = formatMetrics(format).showcase === "split";

  const textColor = interpolateColors(
    frame,
    [FADE_START, FADE_START + FADE_FRAMES],
    [COLORS.amber, COLORS.accent],
  );

  const aside = (slot: StageSlot) => {
    const scale = slot.scale;
    const gap = Math.round(28 * scale);

    // The button's line, fitted and held to one line. It is the third thing on
    // a strip that already carries two measurements, so it is the smallest
    // thing on it by some way, which is also what it is worth.
    const buttonText = `ink on amber ${INTERPUNCT} ${INK_ON_AMBER.label} ${INTERPUNCT} ${INK_ON_AMBER.verdict}`;
    const buttonTracking = 1.4 * scale;
    const buttonSize = fitOneLine(
      buttonText,
      slot.width,
      Math.min(26 * scale, slot.width * 0.038),
      buttonTracking,
    );
    const buttonLine = Math.round(buttonSize * 1.3);

    // Two readouts, laid out across the strip in the stacked crops and down the
    // column in landscape, so each one gets the long axis of whatever shape the
    // crop left for the measurement.
    const rowGap = Math.round(36 * scale);
    const readoutWidth = split
      ? slot.width
      : Math.round((slot.width - rowGap) / 2);
    const readoutHeight = split
      ? Math.round((slot.height - buttonLine - gap - rowGap) / 2)
      : slot.height - buttonLine - gap;

    const small = {
      fontFamily: BODY_STACK,
      fontSize: buttonSize,
      fontWeight: 600,
      letterSpacing: buttonTracking,
      textTransform: "uppercase" as const,
      whiteSpace: "nowrap" as const,
      color: COLORS.dark_muted,
      lineHeight: 1.3,
    };

    return (
      <div
        style={{
          width: slot.width,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap,
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: split ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: rowGap,
          }}
        >
          <RatioReadout
            measured={AMBER_ON_CANVAS}
            width={readoutWidth}
            height={readoutHeight}
            scale={scale}
            startFrame={-REVEAL_FRAMES}
            revealFrames={REVEAL_FRAMES}
            verdictFrame={0}
            numberSize={72}
          />
          <RatioReadout
            measured={RUST_ON_CANVAS}
            width={readoutWidth}
            height={readoutHeight}
            scale={scale}
            startFrame={NUMBER_FRAME}
            revealFrames={REVEAL_FRAMES}
            verdictFrame={VERDICT_FRAME}
            numberSize={72}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "nowrap",
            alignItems: "baseline",
            justifyContent: "center",
            gap: Math.round(10 * scale),
            height: buttonLine,
            visibility: frame >= BUTTON_FRAME ? "visible" : "hidden",
          }}
        >
          <div style={small}>ink on amber</div>
          <div style={small}>{INTERPUNCT}</div>
          <div
            style={{
              fontFamily: MONO_STACK,
              fontSize: buttonSize,
              fontWeight: 600,
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              color: COLORS.canvas,
            }}
          >
            {INK_ON_AMBER.label}
          </div>
          <div style={small}>{INTERPUNCT}</div>
          <div style={small}>{INK_ON_AMBER.verdict}</div>
        </div>
      </div>
    );
  };

  return (
    <Stage
      format={format}
      mainLabel={EXAMPLE_LABEL}
      main={(slot) => (
        <SamplePage
          width={slot.width}
          height={slot.height}
          textColor={textColor}
        />
      )}
      aside={aside}
      mainFraction={MAIN_FRACTION}
      asideHeight={ASIDE_HEIGHT}
      settle={SETTLE}
      settleFrames={durationInFrames}
    />
  );
};
