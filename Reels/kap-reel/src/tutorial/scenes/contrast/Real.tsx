import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  LaptopFrame,
  LAPTOP_SCREEN_ASPECT,
  laptopGeometry,
} from "../../../components/LaptopFrame";
import { ZoomShot } from "../../../components/ZoomShot";
import { BODY_STACK, COLORS } from "../../../lib/brand";
import { formatMetrics } from "../../../lib/layout";
import type { TutorialSceneProps } from "../registry";
import { fitOneLine } from "./fit";
import {
  KA_HERO_TEXT_BLOCK,
  KA_PLAYBACK_RATE,
  KA_RESET_LINE,
  kaHomeDesktop,
} from "./kaCapture";
import { RatioReadout } from "./RatioReadout";
import { AMBER_ON_CANVAS, INTERPUNCT } from "./ratios";
import { Stage, type StageSlot } from "./Stage";

/**
 * "Here's a real page." The 45 second cut's first beat, 325 frames.
 *
 * A real page in the laptop, and beside it the same block re-set in amber with
 * the measurement under it. The page is the owner's own, not a client's: see
 * ./kaCapture.ts for why that matters and where the file comes from.
 *
 * The beat is built in three arrivals rather than one, because the narration is
 * three sentences and a picture that is complete on frame 0 makes the last two
 * of them redundant. The laptop is there from the cut, the card lands around
 * frame 120 on "the amber reads as bold", and the number types around 220 on
 * "the checker says two point nine to one".
 */

/** Frame the card cuts in on. Cuts, never fades: Section 7. */
const CARD_FRAME = 120;

/** Frame the number starts typing on, and the frame the verdict lands. */
const NUMBER_FRAME = 220;
const VERDICT_FRAME = 252;
const REVEAL_FRAMES = 20;

/** The aside's own height in the stacked crops, authored at 1080 wide. */
const ASIDE_HEIGHT = 360;

/**
 * Half the box for the laptop in landscape.
 *
 * The laptop is height bound in every crop, because demoBox() reserves the
 * bottom of the frame for the caption card, so giving the main column more than
 * half the width buys no screen and only starves the card.
 */
const MAIN_FRACTION = 0.5;

const LABEL = `ka-performancefl.com ${INTERPUNCT} home`;

export const ContrastReal: React.FC<TutorialSceneProps> = ({ format }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const shot = kaHomeDesktop();
  const split = formatMetrics(format).showcase === "split";

  const laptop = (slot: StageSlot) => {
    // Solve the 16:10 screen against the slot in both axes, the same way
    // FlatDemo and JamClip do, so this beat's device sits where theirs would.
    let screenWidth = slot.width;
    let screenHeight = Math.round(screenWidth / LAPTOP_SCREEN_ASPECT);
    const first = laptopGeometry(screenWidth, screenHeight);
    if (first.frameHeight > slot.height) {
      screenHeight = Math.round(
        screenHeight * (slot.height / first.frameHeight),
      );
      screenWidth = Math.round(screenHeight * LAPTOP_SCREEN_ASPECT);
    }

    return (
      <LaptopFrame screenWidth={screenWidth} screenHeight={screenHeight}>
        <ZoomShot
          src={shot.src}
          captureWidth={shot.width}
          captureHeight={shot.height}
          zoom={KA_HERO_TEXT_BLOCK}
          width={screenWidth}
          height={screenHeight}
          playbackRate={KA_PLAYBACK_RATE}
          pushInFrames={durationInFrames}
        />
      </LaptopFrame>
    );
  };

  const aside = (slot: StageSlot) => {
    const scale = slot.scale;
    const pad = Math.round(28 * scale);
    const paraSize = Math.round(Math.min(32 * scale, slot.width * 0.052));
    const note = `the same block ${INTERPUNCT} re-set in amber`;
    // Fitted and held to one line, like every other small caps line here: the
    // card's height is not reserved, but a two line note pushed the readout
    // under it past the bottom of the box in the landscape crop.
    const noteSize = fitOneLine(
      note,
      slot.width - pad * 2,
      Math.min(24 * scale, slot.width * 0.035),
      1.4 * scale,
    );
    // In landscape the aside is a tall column and the readout takes a share of
    // it; in the stacked crops it is a strip whose height Stage has already
    // reserved, and the readout takes a fixed part of that.
    const readoutHeight = split
      ? Math.round(slot.height * 0.4)
      : Math.round(176 * scale);

    return (
      <div
        style={{
          width: slot.width,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: Math.round(26 * scale),
          // Cut in, do not fade. The card is a second thing on screen, not a
          // dissolve into a different shot.
          visibility: frame >= CARD_FRAME ? "visible" : "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            boxSizing: "border-box",
            backgroundColor: COLORS.canvas,
            borderRadius: Math.round(8 * scale),
            padding: pad,
            boxShadow: `0 ${Math.round(24 * scale)}px ${Math.round(
              56 * scale,
            )}px rgba(0, 0, 0, 0.4)`,
          }}
        >
          <div
            style={{
              fontFamily: BODY_STACK,
              fontSize: noteSize,
              fontWeight: 600,
              letterSpacing: 1.4 * scale,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              color: COLORS.muted,
              marginBottom: Math.round(14 * scale),
            }}
          >
            {note}
          </div>
          <div
            style={{
              fontFamily: BODY_STACK,
              fontSize: paraSize,
              fontWeight: 500,
              lineHeight: 1.45,
              color: COLORS.amber,
            }}
          >
            {KA_RESET_LINE}
          </div>
        </div>

        <RatioReadout
          measured={AMBER_ON_CANVAS}
          width={slot.width}
          height={readoutHeight}
          scale={scale}
          startFrame={NUMBER_FRAME}
          revealFrames={REVEAL_FRAMES}
          verdictFrame={VERDICT_FRAME}
          numberSize={80}
        />
      </div>
    );
  };

  return (
    <Stage
      format={format}
      mainLabel={LABEL}
      main={laptop}
      aside={aside}
      mainFraction={split ? MAIN_FRACTION : 1}
      asideHeight={ASIDE_HEIGHT}
    />
  );
};
