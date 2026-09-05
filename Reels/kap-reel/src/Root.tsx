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
import { Tutorial } from "./tutorial/Tutorial";
import { TUTORIAL_TOTAL_FRAMES } from "./tutorial/timeline";
import type { TutorialContent, TutorialCut } from "./tutorial/types";
import { CONTRAST_TUTORIAL } from "./tutorial/reels/contrast";
import { HERO_TUTORIAL } from "./tutorial/reels/hero";

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

// ---------------------------------------------------------------------------
// Tutorial reels
// ---------------------------------------------------------------------------

type TutorialRegistration = {
  id: string;
  format: FormatKey;
  cut: TutorialCut;
  durationInFrames: number;
  content: TutorialContent;
};

/**
 * Every composition one tutorial registers, mirroring registrations() above:
 * four crops of the 15 second cut, two of the 45 second cut, and a safe-zone
 * debug twin of each.
 *
 * It is a second function rather than a generic one because the two trees take
 * different props and different content types. The shapes and the argument for
 * them are identical, which is why SHORT_FORMATS and LINKEDIN_FORMATS are
 * shared: a tutorial delivers in exactly the shapes a showcase reel does.
 */
function tutorialRegistrations(
  prefix: string,
  content: TutorialContent,
): TutorialRegistration[] {
  const rows: TutorialRegistration[] = [];

  for (const { suffix, format } of SHORT_FORMATS) {
    rows.push({
      id: `${prefix}${suffix}`,
      format,
      cut: "short",
      durationInFrames: TUTORIAL_TOTAL_FRAMES.short,
      content,
    });
  }

  for (const { suffix, format } of LINKEDIN_FORMATS) {
    rows.push({
      id: `${prefix}${suffix}`,
      format,
      cut: "linkedin",
      durationInFrames: TUTORIAL_TOTAL_FRAMES.linkedin,
      content,
    });
  }

  return rows;
}

const ALL_TUTORIALS: TutorialRegistration[] = [
  ...tutorialRegistrations("TutorialContrast", CONTRAST_TUTORIAL),
  ...tutorialRegistrations("TutorialHero", HERO_TUTORIAL),
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

      {ALL_TUTORIALS.map((row) => (
        <Composition
          key={row.id}
          id={row.id}
          component={Tutorial}
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

      {ALL_TUTORIALS.map((row) => (
        <Composition
          key={`${row.id}Debug`}
          id={`${row.id}Debug`}
          component={Tutorial}
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
