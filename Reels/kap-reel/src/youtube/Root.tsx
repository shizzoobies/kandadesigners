import { Composition } from "remotion";
import "./fonts";
import { H, W, FPS } from "./layout";
import { L1, type L1Props } from "./l1/L1";
import { L1_THEME } from "./l1/themes";
import { L1_TOTAL_FRAMES } from "./l1/timeline";
import { assertThemeContrast } from "./theme";

// A theme that fails contrast never registers.
assertThemeContrast(L1_THEME);

export const Root: React.FC = () => (
  <>
    {/* L1, "Test your website with one key", Fri 2026-10-02 11:00 AM. */}
    <Composition
      id="YouTubeL1"
      component={L1}
      durationInFrames={L1_TOTAL_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{ withAudio: true } satisfies L1Props}
    />
  </>
);
