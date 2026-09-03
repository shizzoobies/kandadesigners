import "./index.css";
// Side effect: registers the brand fonts for every composition below.
import "./lib/fonts";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import { SAFE_ZONES } from "./lib/layout";
import { FPS, TOTAL_FRAMES } from "./lib/timing";

const vertical = SAFE_ZONES.vertical;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ReelVertical"
        component={Reel}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={vertical.width}
        height={vertical.height}
        defaultProps={{ format: "vertical" as const }}
      />
    </>
  );
};
