import { AbsoluteFill, Sequence } from "remotion";
import { PlatePlaceholder } from "../components/PlatePlaceholder";
import { COLORS, DISPLAY_STACK, projectAccent } from "../lib/brand";
import { formatMetrics, safeArea, type FormatKey } from "../lib/layout";
import { SURFACES_TOUR_CUTS } from "../lib/timing";

export type SurfacesTourProps = {
  format: FormatKey;
};

export type TourCut = {
  /** Capture in assets/captures/captures.json that fills the plate's screen. */
  captureId: string;
  /** Plate in config/plates.json that Phase 4 composites this capture into. */
  plateId: string;
  /** The one word of copy over this cut. */
  word: string;
};

/**
 * Frames 324 to 384. Four cuts of 15 frames, one cleared site each, each on a
 * different device held by a different person. Owner decision 2026-09-03,
 * replacing the capability montage: the point is that one studio ships across
 * four surfaces, not that four features exist.
 *
 * Every cut is a grey PlatePlaceholder until Phase 4 lands. When it does, the
 * placeholder line below becomes a PlateComposite line and nothing else in
 * this file moves.
 */
const CUTS: TourCut[] = [
  {
    captureId: "mbs-medicine-home-desktop",
    plateId: "plate-desktop-wide",
    word: "Booking",
  },
  {
    captureId: "onlynails-dashboard-sitephotos-clean",
    plateId: "plate-handoff",
    word: "Yours to edit",
  },
  {
    captureId: "ellenton-family-practice-home-mobile",
    plateId: "plate-phone-hands-b",
    word: "Memberships",
  },
  {
    captureId: "pbj-strategic-accounting-home-desktop",
    plateId: "plate-tablet-b",
    word: "Booking a call",
  },
];

/** Type size at 1080 canvas width. Well over the Section 7 body minimum. */
const WORD_FONT_SIZE = 96;

/** Opaque scrim. A composite plate is the busiest background in the reel. */
const SCRIM = "#14100C";

export const SurfacesTour: React.FC<SurfacesTourProps> = ({ format }) => {
  const safe = safeArea(format);
  const metrics = formatMetrics(format);
  const scale = metrics.typeScale;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      {CUTS.map((cut, i) => {
        const range = SURFACES_TOUR_CUTS[i];
        const accent = projectAccent(i);

        return (
          <Sequence
            key={cut.plateId}
            from={range.start}
            durationInFrames={range.end - range.start}
            name={`surface ${cut.word}`}
            layout="none"
          >
            {/* Phase 4 swap point: one line per cut. */}
            <PlatePlaceholder plateId={cut.plateId} note={cut.captureId} />

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
                {/* Cut, not fade, and held for the whole 15 frames. */}
                <div
                  style={{
                    fontFamily: DISPLAY_STACK,
                    fontSize: Math.round(WORD_FONT_SIZE * scale),
                    fontWeight: 800,
                    letterSpacing: -2 * scale,
                    lineHeight: 1.05,
                    color: COLORS.canvas,
                    maxWidth: safe.right - Math.round(180 * scale),
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
