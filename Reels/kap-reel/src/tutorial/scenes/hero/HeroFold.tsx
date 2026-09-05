import { interpolate, useCurrentFrame } from "remotion";
import type { TutorialSceneProps } from "../registry";
import { RiversidePhone } from "./RiversidePhone";
import { exampleLabel, WEAK_HEADLINE } from "./riverside";

/**
 * "The first screen decides whether anyone scrolls. On a phone that is about
 * six hundred pixels. A photo and a logo spend it on nothing."
 *
 * The same weak page, with the fold drawn on it. The rule arrives at frame 60,
 * which is where the narration reaches "six hundred pixels", and takes 20
 * frames to cross the screen: fast enough to be a cut rather than a transition,
 * slow enough that the eye follows it and sees how little is above it.
 *
 * The label lands when the rule does. A name arriving with the line reads as
 * one gesture; a name that was already there reads as a caption for something
 * that has not happened yet.
 */

const RULE_START = 60;
const RULE_FRAMES = 20;

export const HeroFold: React.FC<TutorialSceneProps> = ({ format, beat }) => {
  const frame = useCurrentFrame();
  const fold = interpolate(
    frame,
    [RULE_START, RULE_START + RULE_FRAMES],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <RiversidePhone
      format={format}
      headline={WEAK_HEADLINE}
      label={exampleLabel(beat.props)}
      fold={fold}
    />
  );
};
