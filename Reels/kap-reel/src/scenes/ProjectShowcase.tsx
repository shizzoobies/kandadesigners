import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ClaimLine } from "../components/ClaimLine";
import { DeviceFrame } from "../components/DeviceFrame";
import { KineticText } from "../components/KineticText";
import { PlatePlaceholder } from "../components/PlatePlaceholder";
import { COLORS, DISPLAY_STACK } from "../lib/brand";
import { captureSrc, getHomeCapture } from "../lib/captures";
import { safeArea, type FormatKey } from "../lib/layout";
import { PROJECT_BEAT_SHOTS } from "../lib/timing";

/** Length of the whip between project beats, in frames. */
export const WHIP_FRAMES = 6;

/** Relative frame at which the one claim line cuts in and holds to the cut. */
const CLAIM_IN = 36;

/** Where the clean capture starts inside its own source, see Hook.tsx. */
const TRIM_BEFORE = 54;

const BEAT_LENGTH =
  PROJECT_BEAT_SHOTS.cleanCapture.end - PROJECT_BEAT_SHOTS.plate.start;

const NAME_FONT_SIZE = 62;

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
  const capture = getHomeCapture(projectId, "mobile");

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

      {/* Shot B: hard cut to the clean capture, straight on, scrolling. */}
      <Sequence
        from={PROJECT_BEAT_SHOTS.cleanCapture.start}
        name={`${projectId} capture`}
        layout="none"
      >
        <AbsoluteFill
          style={{
            backgroundColor: COLORS.ink,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <DeviceFrame
            screenWidth={capture.width}
            screenHeight={capture.height}
          >
            <OffthreadVideo
              src={captureSrc(capture)}
              trimBefore={TRIM_BEFORE}
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </DeviceFrame>
        </AbsoluteFill>
      </Sequence>

      {/* Lower third. Lives across both shots so nothing is lost if the viewer
          blinks through the plate. Bottom anchored, so a long name growing to
          two lines does not move the claim. */}
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: height - (safe.bottom - 96),
            backgroundColor: SCRIM,
            borderTop: `6px solid ${accent}`,
            paddingTop: 34,
            paddingBottom: 40,
            paddingLeft: 72,
            paddingRight: 108,
          }}
        >
          <KineticText
            text={displayName}
            mode="type"
            startFrame={2}
            revealFrames={16}
            style={{
              fontFamily: DISPLAY_STACK,
              fontSize: NAME_FONT_SIZE,
              fontWeight: 700,
              letterSpacing: -1,
              lineHeight: 1.1,
              color: COLORS.canvas,
            }}
          />
          <div style={{ height: 18 }} />
          {/* ClaimLine lays itself out from frame 0 and only toggles visibility,
              so the scrim is already the right height when the claim cuts in
              and a claim that wraps to two lines cannot overflow the band. */}
          <ClaimLine text={claim} accent={accent} startFrame={CLAIM_IN} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
