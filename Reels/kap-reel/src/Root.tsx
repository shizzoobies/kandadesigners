import "./index.css";
// Side effect: registers the brand fonts for every composition below.
import "./lib/fonts";
import { Composition } from "remotion";
import { Reel, type ReelCut } from "./Reel";
import { SAFE_ZONES, type FormatKey } from "./lib/layout";
import { FPS, LINKEDIN_TOTAL_FRAMES, TOTAL_FRAMES } from "./lib/timing";
import type { ReelContent } from "./reels/types";
import { TRAINING_REEL } from "./reels/training";
import { WEB_REEL } from "./reels/web";

/**
 * The four delivery crops of a 15 second cut, plus a debug twin of each.
 * Section 8 forbids producing the crops with an FFmpeg center crop of the
 * vertical master, so every one of these renders the same scene tree with a
 * different format prop and each scene re-lays itself out from safeArea().
 */
const SHORT_FORMATS: { suffix: string; format: FormatKey }[] = [
  { suffix: "Vertical", format: "vertical" },
  { suffix: "Feed", format: "feedVertical" },
  { suffix: "Square", format: "square" },
  { suffix: "Landscape", format: "landscape" },
];

/**
 * The two crops a 45 second LinkedIn cut delivers in, per Section 11. Two
 * rather than four: LinkedIn's company page feed takes the 1080x1350 vertical,
 * and the desktop-first audience takes 1920x1080. The 1080x1920 and square
 * crops are Facebook Reels shapes and the 45 second cut is not going there.
 */
const LINKEDIN_FORMATS: { suffix: string; format: FormatKey }[] = [
  { suffix: "LinkedIn", format: "feedVertical" },
  { suffix: "LinkedInLandscape", format: "landscape" },
];

type Registration = {
  id: string;
  format: FormatKey;
  cut: ReelCut;
  durationInFrames: number;
  content: ReelContent;
};

/**
 * Every composition one reel registers: four crops of the 15 second cut, two of
 * the 45 second cut, and a safe-zone debug twin of each.
 *
 * `prefix` is what makes the two reels distinguishable in Studio and on the
 * CLI: "Reel" for the web design showcase, "Training" for the training content
 * line. Nothing else about them differs, which is the point.
 */
function registrations(prefix: string, content: ReelContent): Registration[] {
  const rows: Registration[] = [];

  for (const { suffix, format } of SHORT_FORMATS) {
    rows.push({
      id: `${prefix}${suffix}`,
      format,
      cut: "short",
      durationInFrames: TOTAL_FRAMES,
      content,
    });
  }

  for (const { suffix, format } of LINKEDIN_FORMATS) {
    rows.push({
      id: `${prefix}${suffix}`,
      format,
      cut: "linkedin",
      durationInFrames: LINKEDIN_TOTAL_FRAMES,
      content,
    });
  }

  return rows;
}

const ALL: Registration[] = [
  ...registrations("Reel", WEB_REEL),
  // The training content reel, added 2026-09-04. Same scene tree, same beat
  // maps, a second content config. See src/reels/types.ts.
  ...registrations("Training", TRAINING_REEL),
];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {ALL.map((row) => (
        <Composition
          key={row.id}
          id={row.id}
          component={Reel}
          durationInFrames={row.durationInFrames}
          fps={FPS}
          width={SAFE_ZONES[row.format].width}
          height={SAFE_ZONES[row.format].height}
          defaultProps={{
            format: row.format,
            debugSafeZones: false,
            cut: row.cut,
            content: row.content,
          }}
        />
      ))}

      {ALL.map((row) => (
        <Composition
          key={`${row.id}Debug`}
          id={`${row.id}Debug`}
          component={Reel}
          durationInFrames={row.durationInFrames}
          fps={FPS}
          width={SAFE_ZONES[row.format].width}
          height={SAFE_ZONES[row.format].height}
          defaultProps={{
            format: row.format,
            debugSafeZones: true,
            cut: row.cut,
            content: row.content,
          }}
        />
      ))}
    </>
  );
};
