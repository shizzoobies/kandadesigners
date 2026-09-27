import { Composition } from "remotion";
import { SAFE_ZONES } from "../../lib/layout";
import { ActionMapVideo } from "./ActionMapVideo";
import { FPS, TOTAL_FRAMES } from "./timeline";

export const Root: React.FC = () => (
  <Composition
    id="Social0929ActionMapFeed"
    component={ActionMapVideo}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={SAFE_ZONES.feedVertical.width}
    height={SAFE_ZONES.feedVertical.height}
  />
);
