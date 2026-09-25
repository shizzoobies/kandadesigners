import "../../index.css";
// Side effect: registers the brand fonts.
import "../../lib/fonts";
import { Composition, Still } from "remotion";
import { SAFE_ZONES } from "../../lib/layout";
import { ThrillersBuilt, ThrillersThumb } from "./ThrillersBuilt";
import { FPS, TOTAL_FRAMES } from "./timeline";

const W = SAFE_ZONES.vertical.width;
const H = SAFE_ZONES.vertical.height;

export const Root: React.FC = () => (
  <>
    <Composition
      id="Social1002ThrillersVertical"
      component={ThrillersBuilt}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={W}
      height={H}
    />
    <Still id="Social1002ThrillersThumb" component={ThrillersThumb} width={W} height={H} />
  </>
);
