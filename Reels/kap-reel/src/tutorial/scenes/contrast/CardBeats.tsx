import {
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../../../lib/brand";
import type { TutorialSceneProps } from "../registry";
import { RatioReadout } from "./RatioReadout";
import { AMBER_ON_CANVAS, INTERPUNCT, RUST_ON_CANVAS } from "./ratios";
import { SamplePage } from "./SamplePage";
import { Stage, type StageSlot } from "./Stage";

/**
 * The three beats of the 15 second cut, which are one continuous shot of one
 * card with three things happening to it: it is accepted, it is measured, it is
 * fixed. They share this file because they share the picture, and a card that
 * shifted between them would turn a measurement into a cut.
 *
 * Every number and every verdict comes from ./ratios.ts, which computes them
 * from config/brand.json. Nothing here types a ratio.
 */

/** The fictional business is labeled as one, per the non-negotiables. */
const EXAMPLE_LABEL = `example ${INTERPUNCT} fictional business`;

/** The number types on shortly after the cut, then the verdict lands under it. */
const FAILS_NUMBER_FRAME = 6;
const FAILS_VERDICT_FRAME = 36;
const REVEAL_FRAMES = 18;

/**
 * The crossfade from amber to rust.
 *
 * About 20 frames, which the spec asks for by name and which is the one place in
 * either reel where a crossfade is right: the whole claim of the beat is that
 * this is the same palette and not a redesign, and a hard cut between two
 * oranges reads as two different pages.
 */
const FIX_FADE_START = 8;
const FIX_FADE_FRAMES = 20;

/** The old number holds for a beat, then the new one types in its place. */
const FIX_HOLD_FRAMES = 12;
const FIX_NUMBER_FRAME = 16;
const FIX_VERDICT_FRAME = 46;

/**
 * The settle on the stretch beat: six thousandths of the frame, spread across
 * the whole beat. See Stage's `settle`.
 */
const FIX_SETTLE = 0.006;

function pageSlot(textColor: string) {
  return (slot: StageSlot) => (
    <SamplePage
      width={slot.width}
      height={slot.height}
      textColor={textColor}
    />
  );
}

/** "This amber on cream looks fine." The card, alone, holding. */
export const ContrastFine: React.FC<TutorialSceneProps> = ({ format }) => {
  return (
    <Stage
      format={format}
      mainLabel={EXAMPLE_LABEL}
      main={pageSlot(COLORS.amber)}
      // The measurement's space is reserved from the first beat even though
      // nothing is drawn in it yet, so the card does not move when the number
      // arrives on the next beat.
      aside={() => null}
    />
  );
};

/** "It measures two point nine to one. That fails." */
export const ContrastFails: React.FC<TutorialSceneProps> = ({ format }) => {
  return (
    <Stage
      format={format}
      mainLabel={EXAMPLE_LABEL}
      main={pageSlot(COLORS.amber)}
      aside={(slot) => (
        <RatioReadout
          measured={AMBER_ON_CANVAS}
          width={slot.width}
          height={slot.height}
          scale={slot.scale}
          startFrame={FAILS_NUMBER_FRAME}
          revealFrames={REVEAL_FRAMES}
          verdictFrame={FAILS_VERDICT_FRAME}
        />
      )}
    />
  );
};

/** "Same palette, rust instead. Six point seven. Passes." The stretch beat. */
export const ContrastFix: React.FC<TutorialSceneProps> = ({ format }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const textColor = interpolateColors(
    frame,
    [FIX_FADE_START, FIX_FADE_START + FIX_FADE_FRAMES],
    [COLORS.amber, COLORS.accent],
  );

  const showOld = frame < FIX_HOLD_FRAMES;

  return (
    <Stage
      format={format}
      mainLabel={EXAMPLE_LABEL}
      main={pageSlot(textColor)}
      settle={FIX_SETTLE}
      settleFrames={durationInFrames}
      aside={(slot) =>
        showOld ? (
          // The failing number carried over from the previous beat, already
          // typed, so the cut into this beat is not a cut in the readout: the
          // 2.9 is on screen and is then replaced.
          <RatioReadout
            measured={AMBER_ON_CANVAS}
            width={slot.width}
            height={slot.height}
            scale={slot.scale}
            startFrame={-REVEAL_FRAMES}
            revealFrames={REVEAL_FRAMES}
            verdictFrame={0}
          />
        ) : (
          <RatioReadout
            measured={RUST_ON_CANVAS}
            width={slot.width}
            height={slot.height}
            scale={slot.scale}
            startFrame={FIX_NUMBER_FRAME}
            revealFrames={REVEAL_FRAMES}
            verdictFrame={FIX_VERDICT_FRAME}
          />
        )
      }
    />
  );
};
