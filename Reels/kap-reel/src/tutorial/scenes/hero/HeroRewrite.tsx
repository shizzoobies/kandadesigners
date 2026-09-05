import { useCurrentFrame, useVideoConfig } from "remotion";
import { KineticText } from "../../../components/KineticText";
import type { TutorialSceneProps } from "../registry";
import { RiversidePhone } from "./RiversidePhone";
import { exampleLabel, REWRITE_PASSES } from "./riverside";

/**
 * "Take a weak line. Welcome to our website. Rewrite it: who it is for, what
 * they get, why you."
 *
 * Three passes on the same headline, one per clause: who it is for, what they
 * get, why you. Each pass is the one before it plus its clause, so the beat
 * reads as one line being grown rather than three lines being swapped, and the
 * third pass is the sourdough line the 15 second cut also lands on.
 *
 * The passes are laid out from the beat's own length rather than from fixed
 * frames. The beat is 177 frames today and it is 177 because the narration
 * measured 5.48 seconds; a re-recorded line, or Kai's voice instead of the
 * draft, moves it, and three hardcoded pass boundaries would then either
 * crowd into the front of the beat or leave the last pass hanging.
 */

/** Fraction of a pass's slot spent typing. The rest holds the finished line. */
const TYPE_FRACTION = 0.45;

export const HeroRewrite: React.FC<TutorialSceneProps> = ({ format, beat }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const slot = durationInFrames / REWRITE_PASSES.length;
  const index = Math.min(
    REWRITE_PASSES.length - 1,
    Math.max(0, Math.floor(frame / slot)),
  );

  return (
    <RiversidePhone
      format={format}
      label={exampleLabel(beat.props)}
      headline={
        <KineticText
          // Keyed on the pass, so the reveal restarts at the top of each slot
          // rather than continuing the character count of the pass before it.
          key={index}
          text={REWRITE_PASSES[index]}
          mode="type"
          startFrame={Math.round(index * slot)}
          revealFrames={Math.max(6, Math.round(slot * TYPE_FRACTION))}
        />
      }
    />
  );
};
