import { AbsoluteFill, Sequence } from "remotion";
import { PlateShot } from "../components/PlateShot";
import { COLORS, DISPLAY_STACK, projectAccent } from "../lib/brand";
import { formatMetrics, safeArea, type FormatKey } from "../lib/layout";
import {
  LINKEDIN_SURFACES_TOUR_CUTS,
  SURFACES_TOUR_CUTS,
  type FrameRange,
} from "../lib/timing";

export type SurfacesTourProps = {
  format: FormatKey;
  /**
   * Which cut is rendering. "short" is the 15 second master's three 18 frame
   * cuts. "linkedin" is four 20 frame cuts over a different set of surfaces:
   * MBS Medicine has its own project beat in that cut, so its tour cut is
   * dropped and Synovial Marketing takes the slot.
   */
  cut?: "short" | "linkedin";
};

export type TourCut = {
  /** Capture in assets/captures/captures.json that fills the plate's screen. */
  captureId: string;
  /** Plate in config/plates.json that Phase 4 composites this capture into. */
  plateId: string;
  /** The one word of copy over this cut. */
  word: string;
  /**
   * Source frame the capture starts on. Nonzero everywhere, and different per
   * cut, so no two surfaces are caught at the same point in their scroll.
   */
  captureFrameOffset: number;
  /**
   * Seed for the handheld drift. One per cut, so four hard cuts do not share
   * one camera wobble.
   */
  driftSeed: string;
};

/**
 * Frames 334 to 388. Three cuts of 18 frames, one cleared site each, each on a
 * different device held by a different person. Owner decision 2026-09-03,
 * replacing the capability montage: the point is that one studio ships across
 * these surfaces, not that a list of features exists.
 *
 * Re-paced 2026-09-03 with the rest of the 15 second cut, from four cuts of 15
 * to three of 18. The Memberships and "Booking a call" cuts came out, and the
 * third slot now carries Southern Legacy Contractors, which left the featured
 * list in this cut: "No page builder" is the claim that beat was making, and
 * putting it here keeps that site and that argument on screen.
 *
 * Each cut is a finished context plate with that cut's capture composited into
 * the device screen, cropped to the current canvas by PlateShot. Hard cuts
 * throughout: no transition, no fade, the word held for the whole 18 frames.
 */
const SHORT_CUTS: TourCut[] = [
  {
    captureId: "mbs-medicine-home-desktop",
    plateId: "plate-desktop-wide",
    word: "Booking",
    captureFrameOffset: 24,
    driftSeed: "surfaces-booking",
  },
  {
    captureId: "onlynails-dashboard-sitephotos-clean",
    plateId: "plate-handoff",
    word: "Yours to edit",
    captureFrameOffset: 42,
    driftSeed: "surfaces-yours-to-edit",
  },
  {
    // plate-tablet-b is bound to the PB&J capture in config/plates.json. The
    // captureId here overrides that binding, which is what the field is for.
    captureId: "southern-legacy-contractors-home-desktop",
    plateId: "plate-tablet-b",
    word: "No page builder",
    captureFrameOffset: 60,
    driftSeed: "surfaces-no-page-builder",
  },
];

/**
 * Frames 996 to 1076 of the LinkedIn cut. Four cuts of 20 frames.
 *
 * MBS Medicine is a full project beat in this cut, so its "Booking" tour cut
 * would be the second time in forty seconds that the same site made the same
 * point. Synovial Marketing takes the slot instead, which also puts a fourth
 * cleared site on screen rather than repeating one.
 *
 * The fourth cut reuses plate-phone-hands, which project 2 also uses in this
 * cut. It carries a different site and a different drift seed, and it is 24
 * seconds later on the timeline, so the two do not read as the same shot.
 */
const LINKEDIN_CUTS: TourCut[] = [
  {
    captureId: "onlynails-dashboard-sitephotos-clean",
    plateId: "plate-handoff",
    word: "Yours to edit",
    captureFrameOffset: 42,
    driftSeed: "linkedin-yours-to-edit",
  },
  {
    captureId: "ellenton-family-practice-home-mobile",
    plateId: "plate-phone-hands-b",
    word: "Memberships",
    captureFrameOffset: 60,
    driftSeed: "linkedin-memberships",
  },
  {
    captureId: "pbj-strategic-accounting-home-desktop",
    plateId: "plate-tablet-b",
    word: "Booking a call",
    captureFrameOffset: 78,
    driftSeed: "linkedin-booking-a-call",
  },
  {
    captureId: "synovial-marketing-home-mobile",
    plateId: "plate-phone-hands",
    word: "Discovery calls",
    captureFrameOffset: 96,
    driftSeed: "linkedin-discovery-calls",
  },
];

/** Type size at 1080 canvas width. Well over the Section 7 body minimum. */
const WORD_FONT_SIZE = 96;

/** Opaque scrim. A composite plate is the busiest background in the reel. */
const SCRIM = "#14100C";

export const SurfacesTour: React.FC<SurfacesTourProps> = ({
  format,
  cut: reelCut = "short",
}) => {
  const safe = safeArea(format);
  const metrics = formatMetrics(format);
  const scale = metrics.typeScale;

  const cuts: TourCut[] = reelCut === "linkedin" ? LINKEDIN_CUTS : SHORT_CUTS;
  const ranges: FrameRange[] =
    reelCut === "linkedin" ? LINKEDIN_SURFACES_TOUR_CUTS : SURFACES_TOUR_CUTS;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      {cuts.map((cut, i) => {
        const range = ranges[i];
        const accent = projectAccent(i);

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
