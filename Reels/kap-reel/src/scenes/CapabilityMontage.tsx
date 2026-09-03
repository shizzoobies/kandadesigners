import { AbsoluteFill, Sequence } from "remotion";
import { PlatePlaceholder } from "../components/PlatePlaceholder";
import { CAPABILITY_MONTAGE_CUTS } from "../lib/timing";

/**
 * Frames 324 to 384. Three cuts of 20 frames, one word each. The Payments cut
 * was dropped on 2026-09-03 because checkout is not live on any cleared site.
 * Every cut is a grey rectangle here: the real interaction captures arrive
 * later.
 */
const WORDS = ["Booking", "AI", "Yours to edit"];

export const CapabilityMontage: React.FC = () => {
  return (
    <AbsoluteFill>
      {CAPABILITY_MONTAGE_CUTS.map((cut, i) => (
        <Sequence
          key={WORDS[i]}
          from={cut.start}
          durationInFrames={cut.end - cut.start}
          name={`montage ${WORDS[i]}`}
          layout="none"
        >
          <PlatePlaceholder word={WORDS[i]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
