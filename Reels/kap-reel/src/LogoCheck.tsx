// Gate compositions for the drawn logo lockup, one per candidate duration.
// Registered only by src/logo-entry.ts, never by src/Root.tsx, so this phase
// does not touch the timeline another phase owns.
//
//   npx remotion still src/logo-entry.ts LogoDraw72 out/gate-logo/x.png --frame=72
//   npx remotion render src/logo-entry.ts LogoDraw72 out/gate-logo/logo-draw-72.mp4
//
// Each composition draws for its named number of frames and then holds the
// finished lockup, so the frame after the draw is the frame the reel would
// actually rest on.

import { AbsoluteFill, Composition } from "remotion";
import { LogoDraw } from "./components/LogoDraw";
import { COLORS } from "./lib/brand";
import "./lib/fonts";

const FPS = 30;

/**
 * 1000 of the 1080 canvas pixels, which leaves a 40px margin either side and
 * puts the 1340x548 stage at 409 tall inside 600. Wide enough that the 5 unit
 * design stroke lands on nearly 4 real pixels, which is the point of the gate.
 */
const STAGE_WIDTH = 1000;

const CASES = [
  { id: "LogoDraw36", draw: 36, total: 60 },
  { id: "LogoDraw72", draw: 72, total: 120 },
  { id: "LogoDraw144", draw: 144, total: 200 },
];

const LogoGate: React.FC<{ draw: number }> = ({ draw }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.canvas,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LogoDraw durationFrames={draw} width={STAGE_WIDTH} />
    </AbsoluteFill>
  );
};

export const LogoRoot: React.FC = () => {
  return (
    <>
      {CASES.map((c) => (
        <Composition
          key={c.id}
          id={c.id}
          component={LogoGate}
          durationInFrames={c.total}
          fps={FPS}
          width={1080}
          height={600}
          defaultProps={{ draw: c.draw }}
        />
      ))}
    </>
  );
};
