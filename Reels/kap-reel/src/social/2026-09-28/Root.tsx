import { Composition } from "remotion";
import { EllentonReel } from "./EllentonReel";
import { FPS, TOTAL_FRAMES } from "./ellenton";

export const EllentonRoot: React.FC = () => (
  <Composition
    id="EllentonTopThree"
    component={EllentonReel}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
