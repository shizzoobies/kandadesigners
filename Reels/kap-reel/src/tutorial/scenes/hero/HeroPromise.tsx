import { interpolate, useCurrentFrame } from "remotion";
import { KineticText } from "../../../components/KineticText";
import type { TutorialSceneProps } from "../registry";
import { RiversidePhone } from "./RiversidePhone";
import { exampleLabel, PROMISE_HEADLINE, WEAK_HEADLINE } from "./riverside";

/**
 * "Say what they get, in the first six words."
 *
 * The same phone as the beat before it, and the greeting rewrites itself into
 * the promise: the weak line is deleted from the right, and the new one types
 * on in its place. Nothing else on the page moves, which is the argument. The
 * layout was never the problem.
 *
 * The beat runs 167 frames and the line lands at 110, so about two seconds are
 * left to read the finished headline. A type-on that used the whole beat would
 * end on the cut and nobody would have read it.
 */

/** Frames the weak line takes to delete. */
const DELETE_FRAMES = 24;

/** Frames of empty line between the delete and the type-on. A breath. */
const TYPE_START = 32;

/** The frame the finished line lands on, out of the beat's 167. */
const TYPE_END = 110;

/**
 * The delete, which is the type-on run backwards.
 *
 * It is written here rather than as a mode on KineticText because KineticText
 * is shared by both showcase reels and the contrast tutorial, and one beat of
 * one tutorial is not a reason to widen its contract. The mechanism is the same
 * one it uses: every character keeps its box and is hidden with visibility, so
 * the line does not reflow while it empties.
 */
const Deleting: React.FC<{ text: string; shown: number }> = ({
  text,
  shown,
}) => (
  <div style={{ whiteSpace: "pre-wrap" }}>
    {text.split("").map((char, i) => (
      <span
        key={`${char}-${i}`}
        style={{ visibility: i < shown ? "visible" : "hidden" }}
      >
        {char}
      </span>
    ))}
  </div>
);

export const HeroPromise: React.FC<TutorialSceneProps> = ({ format, beat }) => {
  const frame = useCurrentFrame();

  const headline =
    frame < TYPE_START ? (
      <Deleting
        text={WEAK_HEADLINE}
        shown={Math.round(
          interpolate(frame, [0, DELETE_FRAMES], [WEAK_HEADLINE.length, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        )}
      />
    ) : (
      <KineticText
        text={PROMISE_HEADLINE}
        mode="type"
        startFrame={TYPE_START}
        revealFrames={TYPE_END - TYPE_START}
      />
    );

  return (
    <RiversidePhone
      format={format}
      headline={headline}
      label={exampleLabel(beat.props)}
    />
  );
};
