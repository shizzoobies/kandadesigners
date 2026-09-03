import "./index.css";
// Side effect: registers the brand fonts for every composition below.
import "./lib/fonts";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import { SAFE_ZONES, type FormatKey } from "./lib/layout";
import { FPS, LINKEDIN_TOTAL_FRAMES, TOTAL_FRAMES } from "./lib/timing";

/**
 * The four delivery crops, plus a debug twin of each. Section 8 forbids
 * producing the crops with an FFmpeg center crop of the vertical master, so
 * every one of these renders the same scene tree with a different format prop
 * and each scene re-lays itself out from safeArea(format).
 */
const FORMATS: { id: string; format: FormatKey }[] = [
  { id: "ReelVertical", format: "vertical" },
  { id: "ReelFeed", format: "feedVertical" },
  { id: "ReelSquare", format: "square" },
  { id: "ReelLandscape", format: "landscape" },
];

/** The two crops the 45 second LinkedIn cut delivers in, per Section 11. */
const LINKEDIN_FORMATS: { id: string; format: FormatKey }[] = [
  { id: "ReelLinkedIn", format: "feedVertical" },
  { id: "ReelLinkedInLandscape", format: "landscape" },
];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {FORMATS.map(({ id, format }) => {
        const spec = SAFE_ZONES[format];
        return (
          <Composition
            key={id}
            id={id}
            component={Reel}
            durationInFrames={TOTAL_FRAMES}
            fps={FPS}
            width={spec.width}
            height={spec.height}
            defaultProps={{ format, debugSafeZones: false }}
          />
        );
      })}

      {FORMATS.map(({ id, format }) => {
        const spec = SAFE_ZONES[format];
        return (
          <Composition
            key={`${id}Debug`}
            id={`${id}Debug`}
            component={Reel}
            durationInFrames={TOTAL_FRAMES}
            fps={FPS}
            width={spec.width}
            height={spec.height}
            defaultProps={{ format, debugSafeZones: true }}
          />
        );
      })}

      {/* The 45 second LinkedIn cut. Same scene tree, same components, a
          different beat map and two extra beats, selected by the cut prop.
          Two crops rather than four: LinkedIn's company page feed takes the
          1080x1350 vertical, and the desktop-first audience takes 1920x1080.
          The 1080x1920 and square crops are Facebook Reels shapes and the
          45 second cut is not going there. */}
      {LINKEDIN_FORMATS.map(({ id, format }) => {
        const spec = SAFE_ZONES[format];
        return (
          <Composition
            key={id}
            id={id}
            component={Reel}
            durationInFrames={LINKEDIN_TOTAL_FRAMES}
            fps={FPS}
            width={spec.width}
            height={spec.height}
            defaultProps={{ format, debugSafeZones: false, cut: "linkedin" }}
          />
        );
      })}

      {LINKEDIN_FORMATS.map(({ id, format }) => {
        const spec = SAFE_ZONES[format];
        return (
          <Composition
            key={`${id}Debug`}
            id={`${id}Debug`}
            component={Reel}
            durationInFrames={LINKEDIN_TOTAL_FRAMES}
            fps={FPS}
            width={spec.width}
            height={spec.height}
            defaultProps={{ format, debugSafeZones: true, cut: "linkedin" }}
          />
        );
      })}
    </>
  );
};
