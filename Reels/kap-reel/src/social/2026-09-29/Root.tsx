import { Composition } from "remotion";
import { SAFE_ZONES } from "../../lib/layout";
import { ContrastReel } from "./Contrast";
import { FPS, TOTAL_FRAMES } from "./timeline";

export const Root: React.FC = () => (
  <Composition
    id="Social0929ContrastVertical"
    component={ContrastReel}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={SAFE_ZONES.vertical.width}
    height={SAFE_ZONES.vertical.height}
  />
);
