import { interpolate, useCurrentFrame } from "remotion";
import type { TutorialSceneProps } from "../registry";
import { RiversidePhone } from "./RiversidePhone";
import { exampleLabel, PROMISE_HEADLINE } from "./riverside";

/**
 * "Test it. Cover the photo. If the line still tells a stranger what they get,
 * it works."
 *
 * The page as the beat before it left it, with the photo taken away: a canvas
 * cover wipes down the band where the picture was, and the sourdough headline
 * underneath is untouched and still says what the bakery sells. That is the
 * test, run on screen, on a page the viewer can copy.
 *
 * The cover wipes rather than cutting because a rectangle that simply appeared
 * would read as the photo failing to load. Eighteen frames is six tenths of a
 * second: a gesture, not a transition, and it is done long before the line has
 * to be read.
 */

const MASK_START = 20;
const MASK_FRAMES = 18;

export const HeroTest: React.FC<TutorialSceneProps> = ({ format, beat }) => {
  const frame = useCurrentFrame();
  const mask = interpolate(
    frame,
    [MASK_START, MASK_START + MASK_FRAMES],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <RiversidePhone
      format={format}
      headline={PROMISE_HEADLINE}
      label={exampleLabel(beat.props)}
      mask={mask}
    />
  );
};
