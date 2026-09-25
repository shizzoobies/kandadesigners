import { Composition } from "remotion";
import { SAFE_ZONES } from "../../lib/layout";
import { HeroPromiseReel } from "./HeroPromise";
import { FPS, TOTAL_FRAMES } from "./timeline";

export const Root: React.FC = () => (
  <Composition
    id="Social1006HeroVertical"
    component={HeroPromiseReel}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={SAFE_ZONES.vertical.width}
    height={SAFE_ZONES.vertical.height}
  />
);
