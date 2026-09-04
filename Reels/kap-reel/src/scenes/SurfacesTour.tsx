import { AbsoluteFill, Sequence } from "remotion";
import { PlateShot } from "../components/PlateShot";
import { COLORS, DISPLAY_STACK } from "../lib/brand";
import { formatMetrics, safeArea, type FormatKey } from "../lib/layout";
import {
  LINKEDIN_SURFACES_TOUR_CUTS,
  SURFACES_TOUR_CUTS,
  type FrameRange,
} from "../lib/timing";
import type { ReelCut, TourCut } from "../reels/types";

/**
 * Frames 334 to 388 in the 15 second cut, 996 to 1076 in the 45 second one.
 * Three cuts of 18 frames or four of 20, one surface each, each on a different
 * device held by a different person. Owner decision 2026-09-03, replacing the
 * capability montage: the point is that one studio ships across these surfaces,
 * not that a list of features exists.
 *
 * Each cut is a finished context plate with that cut's capture composited into
 * the device screen, cropped to the current canvas by PlateShot. Hard cuts
 * throughout: no transition, no fade, the word held for the whole cut. Which
 * surfaces they are is content, and arrives from src/reels.
 */
export type SurfacesTourProps = {
  format: FormatKey;
  /** Which cut is rendering. Decides the frame ranges, not the content. */
  cut?: ReelCut;
  /** The surfaces themselves, in order, from the reel's content config. */
  cuts: TourCut[];
  /** Accent rotation, from the reel's content config. */
  accents: string[];
};

/** Type size at 1080 canvas width. Well over the Section 7 body minimum. */
const WORD_FONT_SIZE = 96;

/** Opaque scrim. A composite plate is the busiest background in the reel. */
const SCRIM = "#14100C";

export const SurfacesTour: React.FC<SurfacesTourProps> = ({
  format,
  cut: reelCut = "short",
  cuts,
  accents,
}) => {
  const safe = safeArea(format);
  const metrics = formatMetrics(format);
  const scale = metrics.typeScale;

  const ranges: FrameRange[] =
    reelCut === "linkedin" ? LINKEDIN_SURFACES_TOUR_CUTS : SURFACES_TOUR_CUTS;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      {cuts.map((cut, i) => {
        const range = ranges[i];
        const accent = accents[i % accents.length];

        return (
          <Sequence
            key={`${cut.plateId}-${cut.word}`}
            from={range.start}
            durationInFrames={range.end - range.start}
            name={`surface ${cut.word}`}
            layout="none"
          >
            <PlateShot
              plateId={cut.plateId}
              captureId={cut.captureId}
              captureFrameOffset={cut.captureFrameOffset}
              driftSeed={cut.driftSeed}
            />

            <AbsoluteFill>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: metrics.bandBottom,
                  backgroundColor: SCRIM,
                  borderTop: `${Math.round(8 * scale)}px solid ${accent}`,
                  paddingTop: Math.round(36 * scale),
                  paddingBottom: Math.round(42 * scale),
                  paddingLeft: Math.round(72 * scale),
                  // Clears the reserved right zone in the vertical crop.
                  paddingRight: Math.round(108 * scale),
                }}
              >
                {/* Cut, not fade, and held for the whole cut. Owner decision
                    2026-09-03: centred. maxWidth still caps the column, so the
                    auto margins are what centre that column inside the band's
                    asymmetric padding rather than leaving it hung left. */}
                <div
                  style={{
                    fontFamily: DISPLAY_STACK,
                    fontSize: Math.round(WORD_FONT_SIZE * scale),
                    fontWeight: 800,
                    letterSpacing: -2 * scale,
                    lineHeight: 1.05,
                    color: COLORS.canvas,
                    maxWidth: safe.right - Math.round(180 * scale),
                    marginLeft: "auto",
                    marginRight: "auto",
                    textAlign: "center",
                  }}
                >
                  {cut.word}
                </div>
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
