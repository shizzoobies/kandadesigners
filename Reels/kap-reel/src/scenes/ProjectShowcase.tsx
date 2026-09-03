import type { ReactNode } from "react";
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ClaimLine, CLAIM_FONT_SIZE } from "../components/ClaimLine";
import { DeviceFrame } from "../components/DeviceFrame";
import { KineticText } from "../components/KineticText";
import { PlatePlaceholder } from "../components/PlatePlaceholder";
import { COLORS, DISPLAY_STACK } from "../lib/brand";
import { captureSrc, getHomeCapture } from "../lib/captures";
import { formatMetrics, safeArea, type FormatKey } from "../lib/layout";
import { PROJECT_BEAT_SHOTS } from "../lib/timing";

/** Length of the whip between project beats, in frames. */
export const WHIP_FRAMES = 6;

/** Relative frame at which the one claim line cuts in and holds to the cut. */
const CLAIM_IN = 36;

/** Where the clean capture starts inside its own source, see Hook.tsx. */
const TRIM_BEFORE = 54;

const BEAT_LENGTH =
  PROJECT_BEAT_SHOTS.cleanCapture.end - PROJECT_BEAT_SHOTS.plate.start;

/** Every size below is authored at 1080 canvas width and scaled per format. */
const NAME_FONT_SIZE = 62;
const BAND_PAD_TOP = 34;
const BAND_PAD_BOTTOM = 40;
const BAND_PAD_LEFT = 72;
const BAND_PAD_RIGHT = 108;
const BAND_GAP = 18;

/**
 * How much vertical room the lower third needs for one name line, the gap, and
 * one claim line. Used to size the device frame in the stacked crops before
 * the band has laid itself out. A claim that wraps to two lines eats into the
 * gap below the device rather than pushing into the reserved bottom, because
 * the band is anchored to its bottom edge.
 */
const BAND_HEIGHT = Math.round(
  BAND_PAD_TOP +
    NAME_FONT_SIZE * 1.1 +
    BAND_GAP +
    CLAIM_FONT_SIZE * 1.15 +
    BAND_PAD_BOTTOM,
);

/** Device frame geometry at native capture size. */
const BEZEL = 20;
const RADIUS = 64;

/**
 * The lower third scrim is opaque, not translucent. At 94 percent the white
 * headings inside the captures still ghosted through and collided with the
 * claim line, which reads as a rendering fault rather than a design choice.
 */
const SCRIM = "#14100C";

export type ProjectShowcaseProps = {
  format: FormatKey;
  /** Project id in config/projects.json. Used to look the capture up. */
  projectId: string;
  displayName: string;
  /** Plate that will replace the grey rectangle in Phase 4. */
  plateId: string;
  claim: string;
  accent: string;
  /** Whip in from the right over the first WHIP_FRAMES frames. */
  whipIn: boolean;
  /** Whip out to the left over the WHIP_FRAMES frames after the beat ends. */
  whipOut: boolean;
};

/**
 * One 96 frame project beat, split per Section 6b: a grey plate placeholder for
 * 24 frames with the project name typing on, then a hard cut to the clean
 * mobile capture in a device frame with one claim line held to the cut.
 *
 * The beat lays out three ways, chosen by formatMetrics().showcase. See
 * src/lib/layout.ts for what each mode means and why.
 */
export const ProjectShowcase: React.FC<ProjectShowcaseProps> = ({
  format,
  projectId,
  displayName,
  plateId,
  claim,
  accent,
  whipIn,
  whipOut,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = safeArea(format);
  const metrics = formatMetrics(format);
  const scale = metrics.typeScale;
  const capture = getHomeCapture(projectId, "mobile");

  const bandHeight = Math.round(BAND_HEIGHT * scale);
  const bandTop = height - metrics.bandBottom - bandHeight;

  // Box the device frame has to fit inside. The device is not text, so it is
  // allowed to run into a reserved zone. Text is not.
  const nativeWidth = capture.width + BEZEL * 2;
  const nativeHeight = capture.height + BEZEL * 2;
  let boxLeft = 0;
  let boxTop = 0;
  let boxWidth = safe.right;
  let boxHeight = height;

  if (metrics.showcase === "stack") {
    // Everything above the band, with a gap so the phone does not kiss it.
    boxHeight = bandTop - Math.round(24 * scale);
  } else if (metrics.showcase === "split") {
    boxLeft = Math.round(width * 0.06);
    boxWidth = Math.round(width * 0.23);
    boxTop = safe.top;
    boxHeight = safe.height - Math.round(40 * scale);
  }

  const deviceScale = Math.min(
    1,
    boxWidth / nativeWidth,
    boxHeight / nativeHeight,
  );
  const screenWidth = Math.round(capture.width * deviceScale);
  const screenHeight = Math.round(capture.height * deviceScale);
  const bezel = Math.max(8, Math.round(BEZEL * deviceScale));
  const radius = Math.max(16, Math.round(RADIUS * deviceScale));
  const deviceLeft =
    boxLeft + Math.round((boxWidth - (screenWidth + bezel * 2)) / 2);
  const deviceTop =
    boxTop + Math.round((boxHeight - (screenHeight + bezel * 2)) / 2);

  // Fast horizontal whip. The slight horizontal stretch stands in for motion
  // blur without paying for a real blur pass.
  let translateX = 0;
  let scaleX = 1;
  if (whipIn && frame < WHIP_FRAMES) {
    translateX = interpolate(frame, [0, WHIP_FRAMES], [width, 0]);
    scaleX = interpolate(frame, [0, WHIP_FRAMES], [1.08, 1]);
  } else if (whipOut && frame >= BEAT_LENGTH) {
    translateX = interpolate(
      frame,
      [BEAT_LENGTH, BEAT_LENGTH + WHIP_FRAMES],
      [0, -width],
      { extrapolateRight: "clamp" },
    );
    scaleX = interpolate(
      frame,
      [BEAT_LENGTH, BEAT_LENGTH + WHIP_FRAMES],
      [1, 1.08],
      { extrapolateRight: "clamp" },
    );
  }

  const copy: ReactNode = (
    <>
      <KineticText
        text={displayName}
        mode="type"
        startFrame={2}
        revealFrames={16}
        style={{
          fontFamily: DISPLAY_STACK,
          fontSize: Math.round(NAME_FONT_SIZE * scale),
          fontWeight: 700,
          letterSpacing: -1 * scale,
          lineHeight: 1.1,
          color: COLORS.canvas,
          textWrap: "balance",
        }}
      />
      <div style={{ height: Math.round(BAND_GAP * scale) }} />
      {/* ClaimLine lays itself out from frame 0 and only toggles visibility,
          so the scrim is already the right height when the claim cuts in
          and a claim that wraps to two lines cannot overflow the band. */}
      <ClaimLine
        text={claim}
        accent={accent}
        startFrame={CLAIM_IN}
        scale={scale}
      />
    </>
  );

  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${translateX}px) scaleX(${scaleX})`,
      }}
    >
      {/* Shot A: grey placeholder standing in for the Phase 4 context plate. */}
      <Sequence
        from={PROJECT_BEAT_SHOTS.plate.start}
        durationInFrames={
          PROJECT_BEAT_SHOTS.plate.end - PROJECT_BEAT_SHOTS.plate.start
        }
        name={`${projectId} plate`}
        layout="none"
      >
        <PlatePlaceholder plateId={plateId} />
      </Sequence>

      {/* Shot B: hard cut to the clean capture, straight on, scrolling. The
          capture is scaled to fit its box and never letterboxed: the surround
          is brand ink, not black bars. */}
      <Sequence
        from={PROJECT_BEAT_SHOTS.cleanCapture.start}
        name={`${projectId} capture`}
        layout="none"
      >
        <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
          <div
            style={{
              position: "absolute",
              left: deviceLeft,
              top: deviceTop,
            }}
          >
            <DeviceFrame
              screenWidth={screenWidth}
              screenHeight={screenHeight}
              bezel={bezel}
              radius={radius}
            >
              <OffthreadVideo
                src={captureSrc(capture)}
                trimBefore={TRIM_BEFORE}
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </DeviceFrame>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Lower third. Lives across both shots so nothing is lost if the viewer
          blinks through the plate. */}
      <AbsoluteFill>
        {metrics.showcase === "split" ? (
          // Landscape: a panel beside the device rather than under it. Bleeds
          // off the canvas right edge, but the text stops at safe.right.
          <div
            style={{
              position: "absolute",
              left: Math.round(width * 0.33),
              right: 0,
              top: safe.top,
              height: safe.height,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                backgroundColor: SCRIM,
                borderLeft: `${Math.round(6 * scale)}px solid ${accent}`,
                paddingTop: Math.round(BAND_PAD_TOP * scale),
                paddingBottom: Math.round(BAND_PAD_BOTTOM * scale),
                paddingLeft: Math.round(48 * scale),
                // Panel bleeds off the canvas right edge, so the padding has
                // to absorb the reserved strip and still leave a margin.
                paddingRight: width - safe.right + Math.round(40 * scale),
              }}
            >
              {copy}
            </div>
          </div>
        ) : (
          // Vertical, feed and square: full width band anchored above the
          // reserved bottom. Bottom anchored, so a long name growing to two
          // lines does not move the claim.
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: metrics.bandBottom,
              backgroundColor: SCRIM,
              borderTop: `${Math.round(6 * scale)}px solid ${accent}`,
              paddingTop: Math.round(BAND_PAD_TOP * scale),
              paddingBottom: Math.round(BAND_PAD_BOTTOM * scale),
              paddingLeft: Math.round(BAND_PAD_LEFT * scale),
              paddingRight: Math.round(BAND_PAD_RIGHT * scale),
            }}
          >
            {copy}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
