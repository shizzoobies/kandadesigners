import type { ReactNode } from "react";
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ClaimLine,
  CLAIM_FONT_SIZE,
  CLAIM_RULE_BLOCK,
} from "../components/ClaimLine";
import { DeviceFrame } from "../components/DeviceFrame";
import { KineticText } from "../components/KineticText";
import { PlateShot } from "../components/PlateShot";
import { BODY_STACK, COLORS, DISPLAY_STACK } from "../lib/brand";
import { captureSrc, getHomeCapture } from "../lib/captures";
import { formatMetrics, safeArea, type FormatKey } from "../lib/layout";
import { LINKEDIN_PROJECT_COPY, PROJECT_BEAT_SHOTS } from "../lib/timing";

/** Length of the whip between project beats, in frames. */
export const WHIP_FRAMES = 6;

/**
 * Relative frame at which the one claim line cuts in and holds to the cut.
 *
 * Unchanged by the 2026-09-03 re-pace, per the owner's note: twelve frames
 * after the hard cut to the clean capture at relative 24, so the viewer has
 * landed in the new shot before a second thing arrives. In the re-paced 140
 * frame beat it now holds 104 frames instead of 60.
 */
const CLAIM_IN = 36;

/**
 * Frames the LinkedIn context sentence takes to type on. It starts revealing
 * on the cut to the clean capture at relative frame 24 and is fully on screen
 * at LINKEDIN_PROJECT_COPY.contextIn.
 */
const CONTEXT_REVEAL_FRAMES = 16;

/**
 * Fallback source frame for the clean capture, see Hook.tsx. Both cuts pass
 * their own value from src/lib/timing.ts, so this only applies to a caller
 * that supplies neither, such as a Studio preview of the component alone.
 */
const TRIM_BEFORE = 54;

/** Length of the plate shot, in frames. Section 6b caps this at 24. */
const PLATE_SHOT_FRAMES =
  PROJECT_BEAT_SHOTS.plate.end - PROJECT_BEAT_SHOTS.plate.start;

const BEAT_LENGTH =
  PROJECT_BEAT_SHOTS.cleanCapture.end - PROJECT_BEAT_SHOTS.plate.start;

/** Every size below is authored at 1080 canvas width and scaled per format. */
const NAME_FONT_SIZE = 62;
const BAND_PAD_TOP = 34;
const BAND_PAD_BOTTOM = 40;
const BAND_PAD_LEFT = 72;
const BAND_PAD_RIGHT = 108;
const BAND_GAP = 18;

/** Height of one line in the copy slot below the project name, at 1080 width. */
const COPY_LINE_HEIGHT = CLAIM_FONT_SIZE * 1.15;

/**
 * How much vertical room the lower third needs for one name line, the gap, and
 * the copy slot. Used to size the device frame in the stacked crops before
 * the band has laid itself out. A claim that wraps to two lines eats into the
 * gap below the device rather than pushing into the reserved bottom, because
 * the band is anchored to its bottom edge.
 *
 * `copyLines` is 1 in the 15 second cut, where the slot only ever holds the
 * claim, and 2 in the LinkedIn cut, where the same slot also has to hold a
 * context sentence that wraps to two lines in every crop.
 *
 * Since the 2026-09-03 centring the claim carries its rule above the text
 * rather than beside it, so the claim is CLAIM_RULE_BLOCK taller than a plain
 * body line. In the 15 second cut that is what sets the slot height; in the
 * LinkedIn cut two body lines are still taller, so the claim fits inside the
 * slot the context sentence already reserved and the band does not move.
 */
function bandHeight(copyLines: number): number {
  const slot = Math.max(
    COPY_LINE_HEIGHT * copyLines,
    CLAIM_RULE_BLOCK + COPY_LINE_HEIGHT,
  );
  return Math.round(
    BAND_PAD_TOP + NAME_FONT_SIZE * 1.1 + BAND_GAP + slot + BAND_PAD_BOTTOM,
  );
}

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
  /**
   * One sentence on what the business needed, LinkedIn cut only. Shares the
   * copy slot with the claim and is cut off before the claim arrives, so the
   * two are never on screen together.
   */
  contextLine?: string;
  /**
   * Length of this beat in frames. Defaults to the 140 frame beat of the 15
   * second cut; the LinkedIn cut passes 210. Only the clean capture stretches:
   * the plate stays at the Section 6b cap of 24 frames either way.
   */
  durationInFrames?: number;
  /** Source frame the clean capture starts on. */
  cleanTrimBefore?: number;
  /**
   * Playback rate for both the plate's capture and the clean capture. One rate
   * for both so the scroll velocity matches across the cut at frame 24, which
   * is what Section 6b asks for.
   */
  scrollPlaybackRate?: number;
  /**
   * Overrides the capture bound to the plate in config/plates.json. Passed
   * explicitly where the spec names the capture rather than relying on the
   * default binding.
   */
  plateCaptureId?: string;
};

/**
 * One project beat, split per Section 6b: the context plate for 24 frames with
 * the project name typing on, then a hard cut to the clean mobile capture in a
 * device frame with one claim line held to the cut. 140 frames in the 15
 * second cut, 210 in the 45 second one.
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
  contextLine,
  durationInFrames,
  cleanTrimBefore = TRIM_BEFORE,
  scrollPlaybackRate = 1,
  plateCaptureId,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = safeArea(format);
  const metrics = formatMetrics(format);
  const scale = metrics.typeScale;
  const capture = getHomeCapture(projectId, "mobile");

  const beatLength = durationInFrames ?? BEAT_LENGTH;

  /**
   * Where the capture inside the plate starts, so the cut at relative frame 24
   * reads as a camera move rather than a restart.
   *
   * Section 6b asks for the scroll direction and rough velocity to match across
   * the cut. Both shots play their source at scrollPlaybackRate, so the
   * velocity matches for free and the position is arithmetic: start the plate's
   * capture this many frames before cleanTrimBefore and it arrives at exactly
   * cleanTrimBefore on the frame the clean capture takes over. The site is
   * already well down the page and moving when the plate cuts in, which is what
   * Section 4b asks of a plate as well.
   *
   * Most plates carry the desktop capture of the same site while the clean shot
   * is the mobile one, so the match is a fraction of the page rather than an
   * identical pixel. Both are the same 180 frame scripted scroll of the same
   * page, so the same source frame is the same point in that scroll.
   */
  const plateCaptureOffset =
    cleanTrimBefore - Math.round(PLATE_SHOT_FRAMES * scrollPlaybackRate);

  const copySlotHeight = Math.round(
    Math.max(
      COPY_LINE_HEIGHT * (contextLine ? 2 : 1),
      CLAIM_RULE_BLOCK + COPY_LINE_HEIGHT,
    ) * scale,
  );
  const bandHeightPx = Math.round(bandHeight(contextLine ? 2 : 1) * scale);
  const bandTop = height - metrics.bandBottom - bandHeightPx;

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
  } else if (whipOut && frame >= beatLength) {
    translateX = interpolate(
      frame,
      [beatLength, beatLength + WHIP_FRAMES],
      [0, -width],
      { extrapolateRight: "clamp" },
    );
    scaleX = interpolate(
      frame,
      [beatLength, beatLength + WHIP_FRAMES],
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
        align="center"
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
      {contextLine ? (
        // The LinkedIn cut runs one context sentence and then the claim through
        // the same slot. The slot reserves two body lines up front, so the
        // scrim height does not change when one swaps for the other and the
        // band never jumps. minHeight rather than a fixed height: if a context
        // sentence ever wraps to three lines the band grows upward instead of
        // clipping the third line.
        <div
          style={{
            minHeight: copySlotHeight,
            display: "flex",
            flexDirection: "column",
            // A two line context sentence fills the slot; the one line claim
            // that replaces it sits on the slot's optical centre rather than
            // hanging off its top edge.
            justifyContent: "center",
          }}
        >
          {frame < LINKEDIN_PROJECT_COPY.contextOut ? (
            <KineticText
              text={contextLine}
              mode="type"
              // Starts revealing on the cut to the clean capture and is fully
              // on screen by contextIn. Cut, not faded, at contextOut.
              startFrame={
                LINKEDIN_PROJECT_COPY.contextIn - CONTEXT_REVEAL_FRAMES
              }
              revealFrames={CONTEXT_REVEAL_FRAMES}
              align="center"
              style={{
                fontFamily: BODY_STACK,
                fontSize: Math.round(CLAIM_FONT_SIZE * scale),
                fontWeight: 500,
                letterSpacing: 0.2 * scale,
                lineHeight: 1.15,
                color: COLORS.canvas,
              }}
            />
          ) : (
            <ClaimLine
              text={claim}
              accent={accent}
              startFrame={LINKEDIN_PROJECT_COPY.claimIn}
              scale={scale}
            />
          )}
        </div>
      ) : (
        // ClaimLine lays itself out from frame 0 and only toggles visibility,
        // so the scrim is already the right height when the claim cuts in
        // and a claim that wraps to two lines cannot overflow the band.
        <ClaimLine
          text={claim}
          accent={accent}
          startFrame={CLAIM_IN}
          scale={scale}
        />
      )}
    </>
  );

  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${translateX}px) scaleX(${scaleX})`,
      }}
    >
      {/* Shot A: the context plate, with this project's capture composited
          into the device screen. Which capture that is comes from the plate's
          own captureId in config/plates.json, which pairs laptop-shoulder with
          the Fore Motion desktop scroll, phone-hands with the Project Makeover
          mobile scroll, and ipad-lap with the Southern Legacy desktop scroll.
          PlateShot crops the 9:16 composite to whatever canvas is rendering. */}
      <Sequence
        from={PROJECT_BEAT_SHOTS.plate.start}
        durationInFrames={PLATE_SHOT_FRAMES}
        name={`${projectId} plate`}
        layout="none"
      >
        <PlateShot
          plateId={plateId}
          captureId={plateCaptureId}
          captureFrameOffset={plateCaptureOffset}
          scrollPlaybackRate={scrollPlaybackRate}
        />
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
                trimBefore={cleanTrimBefore}
                playbackRate={scrollPlaybackRate}
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
                // Owner decision 2026-09-03: copy is centred. In the split
                // layout that means centred inside this panel, between its
                // left padding and the safe right edge, not on the canvas.
                textAlign: "center",
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
              // Owner decision 2026-09-03: copy is centred. The band keeps its
              // asymmetric padding, so the copy centres between the left
              // margin and the reserved right strip rather than on the canvas,
              // which is what keeps it inside the safe area in the vertical
              // crop.
              textAlign: "center",
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
