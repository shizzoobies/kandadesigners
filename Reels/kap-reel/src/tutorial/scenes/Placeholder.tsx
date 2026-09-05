import { AbsoluteFill } from "remotion";
import { StandIn } from "../../components/StandIn";
import { COLORS } from "../../lib/brand";
import { demoBox } from "./FlatDemo";
import type { TutorialSceneProps } from "./registry";

/**
 * The scene every beat is set to until Phase B replaces it.
 *
 * It is the showcase reels' grey render, one beat at a time: a labelled grey
 * rectangle in the box the real scene will occupy, saying which beat it is
 * standing in for. That is deliberate and it is the whole point of Phase A's
 * gate. A grey render with the draft voice on it lets the scripts and the
 * timing be judged before a single tutorial scene is drawn, and a placeholder
 * that looked plausible would get signed off.
 *
 * It sits in demoBox() rather than filling the frame so the caption card is
 * visible underneath it and the layout being reviewed is the real one.
 */
export const Placeholder: React.FC<TutorialSceneProps> = ({ format, beat }) => {
  const box = demoBox(format);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <div
        style={{
          position: "absolute",
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
        }}
      >
        <StandIn
          kind="scene"
          id={beat.id}
          fontSize={Math.round(40 * box.scale)}
        />
      </div>
    </AbsoluteFill>
  );
};
