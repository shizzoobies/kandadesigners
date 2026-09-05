import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BODY_STACK, COLORS } from "../../../lib/brand";
import { formatMetrics, type FormatKey } from "../../../lib/layout";
import { demoBox } from "../FlatDemo";
import { fitOneLine } from "./fit";

/**
 * The box one half of the stage may draw in, in canvas pixels, plus the crop's
 * own type scale so anything drawn inside stays authored against 1080 wide.
 */
export type StageSlot = {
  width: number;
  height: number;
  scale: number;
};

export type StageProps = {
  format: FormatKey;
  /** The picture: the page card, or the laptop holding the capture. */
  main: (slot: StageSlot) => ReactNode;
  /**
   * A small caps line directly under the picture. The non-negotiables require a
   * fictional example to be labeled as one, and this is where that label goes:
   * plain text, never a pill.
   */
  mainLabel?: string;
  /** The measurement, beside the picture in landscape and under it elsewhere. */
  aside?: (slot: StageSlot) => ReactNode;
  /** Ground behind the stage. Ink unless a beat says otherwise. */
  ground?: string;
  /**
   * How much of the box width the picture takes in the split crop. The rest,
   * less one gap, is the aside.
   */
  mainFraction?: number;
  /** Height the aside is given in the stacked crops, authored at 1080 wide. */
  asideHeight?: number;
  /**
   * A barely perceptible scale drift across the beat, as a fraction.
   *
   * The 15 second "fix" beat is the stretch beat and holds its fixed state for
   * about four seconds after everything has arrived. Section 7 bans filler
   * animation, and a static frame held that long reads as a freeze rather than
   * as a hold, so the settle is small enough that nobody sees it move and large
   * enough that the frame is not dead. Off by default.
   */
  settle?: number;
  /** Frames the settle is spread across. Pass the length of the beat. */
  settleFrames?: number;
};

/** Gap between the picture and the aside, authored at 1080 canvas width. */
const GAP = 44;

/**
 * The small caps label's own line, authored at 1080 canvas width, and the
 * largest share of the picture's width it may take.
 *
 * The second cap is what keeps landscape honest. typeScale is 1.78 there, so a
 * 30 pixel label is drawn at 53, which is most of the way to the card's own
 * headline: the label stopped being a caption and started being a title. It is a
 * note about the picture, so it is held to a fraction of the picture's width in
 * every crop and the tall crops are unaffected.
 */
const LABEL_SIZE = 28;
const LABEL_WIDTH_SHARE = 0.035;
const LABEL_GAP = 18;
const LABEL_TRACKING = 1.6;

/** Default height the measurement takes in the stacked crops, at 1080 wide. */
const ASIDE_HEIGHT = 214;

/**
 * The layout every contrast beat is built on: one picture, one label under it,
 * one measurement beside or below.
 *
 * It exists so the four beats of the 15 second cut put the card in exactly the
 * same rectangle. "fine", "fails" and "fix" are one continuous shot as far as
 * the viewer is concerned, the card is the thing being looked at, and a card
 * that moved by ten pixels when the number arrived would read as a cut rather
 * than as a measurement being taken. So the measurement's space is reserved on
 * every beat, whether or not that beat draws anything in it.
 *
 * Everything comes from demoBox(), which is the shared rectangle FlatDemo and
 * JamClip already lay out in, so a drawn beat and the Jam recording sit in one
 * place and the caption card underneath is never covered.
 */
export const Stage: React.FC<StageProps> = ({
  format,
  main,
  mainLabel,
  aside,
  ground = COLORS.ink,
  mainFraction = 0.6,
  asideHeight = ASIDE_HEIGHT,
  settle = 0,
  settleFrames = 1,
}) => {
  const frame = useCurrentFrame();
  const box = demoBox(format);
  const scale = box.scale;
  const split = formatMetrics(format).showcase === "split";

  const gap = Math.round(GAP * scale);

  // The picture's width is decided first, because the label is fitted to it and
  // the height the label needs is decided by the size that fit.
  const mainWidth = split
    ? Math.round(box.width * mainFraction)
    : box.width;
  const asideWidth = split ? box.width - mainWidth - gap : box.width;

  const labelTracking = LABEL_TRACKING * scale;
  const labelSize = mainLabel
    ? fitOneLine(
        mainLabel,
        mainWidth,
        Math.min(LABEL_SIZE * scale, mainWidth * LABEL_WIDTH_SHARE),
        labelTracking,
      )
    : 0;
  const labelBlock = mainLabel
    ? Math.round(labelSize * 1.25) + Math.round(LABEL_GAP * scale)
    : 0;

  const asideBoxHeight = split
    ? box.height
    : aside
      ? Math.round(asideHeight * scale)
      : 0;
  const mainHeight = split
    ? box.height - labelBlock
    : box.height - labelBlock - asideBoxHeight - (aside ? gap : 0);

  const drift =
    settle === 0
      ? 1
      : interpolate(frame, [0, Math.max(1, settleFrames - 1)], [1, 1 + settle], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const labelStyle = {
    fontFamily: BODY_STACK,
    fontSize: labelSize,
    fontWeight: 600,
    letterSpacing: labelTracking,
    textTransform: "uppercase" as const,
    color: COLORS.dark_muted,
    lineHeight: 1.25,
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
    marginTop: Math.round(LABEL_GAP * scale),
  };

  return (
    <AbsoluteFill style={{ backgroundColor: ground }}>
      <div
        style={{
          position: "absolute",
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
          display: "flex",
          flexDirection: split ? "row" : "column",
          alignItems: "center",
          justifyContent: "center",
          gap,
          transformOrigin: "center center",
          transform: `scale(${drift})`,
        }}
      >
        <div
          style={{
            width: mainWidth,
            height: split ? box.height : mainHeight + labelBlock,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {main({ width: mainWidth, height: mainHeight, scale })}
          {mainLabel ? <div style={labelStyle}>{mainLabel}</div> : null}
        </div>

        {aside ? (
          <div
            style={{
              width: asideWidth,
              height: asideBoxHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {aside({ width: asideWidth, height: asideBoxHeight, scale })}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
