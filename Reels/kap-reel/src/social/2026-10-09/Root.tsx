import { Composition } from "remotion";
import { SAFE_ZONES } from "../../lib/layout";
import { FPS, TOTAL_FRAMES } from "./timeline";
import { WeekReel } from "./WeekReel";

export const Root: React.FC = () => (
  <Composition
    id="Social1009WeekVertical"
    component={WeekReel}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={SAFE_ZONES.vertical.width}
    height={SAFE_ZONES.vertical.height}
  />
);
