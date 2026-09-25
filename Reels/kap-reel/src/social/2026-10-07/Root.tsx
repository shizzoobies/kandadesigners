import { Composition } from "remotion";
import { SAFE_ZONES } from "../../lib/layout";
import { JobAidReel } from "./JobAid";
import { FPS, TOTAL_FRAMES } from "./timeline";

export const Root: React.FC = () => (
  <Composition
    id="Social1007JobAidVertical"
    component={JobAidReel}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={SAFE_ZONES.vertical.width}
    height={SAFE_ZONES.vertical.height}
  />
);
