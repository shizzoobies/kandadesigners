// One composition per plate, for the Phase 4 gate. Registered only by
// src/plates-entry.ts, never by src/Root.tsx.

import { Composition } from "remotion";
import { PlateComposite } from "./components/PlateComposite";
import { listPlates } from "./lib/plates";

const FPS = 30;
/** A plate beat in the vertical master is about 1.6 seconds. */
const SHOT_FRAMES = 48;

export const PlatesRoot: React.FC = () => {
  return (
    <>
      {listPlates()
        .filter((plate) => plate.captureId)
        .map((plate) => (
          <Composition
            key={plate.id}
            id={`PlateCheck-${plate.id}`}
            component={PlateComposite}
            durationInFrames={SHOT_FRAMES}
            fps={FPS}
            width={1080}
            height={1920}
            defaultProps={{ plateId: plate.id }}
          />
        ))}
    </>
  );
};
