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
import { BrowserFrame } from "../components/BrowserFrame";
import { DeviceFrame } from "../components/DeviceFrame";
import { KineticText } from "../components/KineticText";
import { PlateShot } from "../components/PlateShot";
import { StandIn } from "../components/StandIn";
import { ZoomShot } from "../components/ZoomShot";
import { BODY_STACK, COLORS, DISPLAY_STACK } from "../lib/brand";
import { captureSrc, findCapture, getHomeCapture } from "../lib/captures";
import {
  centeredPadding,
  formatMetrics,
  safeArea,
  type FormatKey,
} from "../lib/layout";
import { LINKEDIN_PROJECT_COPY, PROJECT_BEAT_SHOTS } from "../lib/timing";
import type { CleanFrame, ZoomRegion } from "../reels/types";

/** Length of the whip between project beats, in frames. */
export const WHIP_FRAMES = 6;

/**
 * Relative frame at which the one claim line cuts in and holds to the cut.
 *
 * Unchanged by the 2026-09-03 re-pace, per the owner's note: twelve frames
 * after the hard cut to the clean capture at relative 24, so the viewer has
 * landed in the new shot before a second thing arrives. In the 132 frame beat
 * the 2026-09-04 end card re-time left, it holds 96 frames instead of 60.
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
const BAND_GAP = 18;

/**
 * Side padding inside the landscape copy panel, at 1080 canvas width. The panel
 * bleeds off the canvas right edge, so the right padding is this plus the width
 * of the reserved strip: that is what makes the copy box symmetric inside the
 * strip of panel the viewer can actually see, rather than hung to its left.
 */
const PANEL_PAD_X = 48;

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
function bandHeight(copyLines: number, nameLines: number): number {
  const slot = Math.max(
    COPY_LINE_HEIGHT * copyLines,
    CLAIM_RULE_BLOCK + COPY_LINE_HEIGHT,
  );
  return Math.round(
    BAND_PAD_TOP +
      NAME_FONT_SIZE * 1.1 * nameLines +
      BAND_GAP +
      slot +
      BAND_PAD_BOTTOM,
  );
}

/** Device frame geometry at native capture size. */
const BEZEL = 20;
const RADIUS = 64;

/**
 * Size of a browser window's chrome, as fractions of its screen width. The
 * numbers match BrowserFrame's own defaults; they are restated here because the
 * window has to be fitted into a box before it is rendered, and a window is
 * taller and a hair wider than the screen inside it.
 */
const BROWSER_BAR = 0.05;
const BROWSER_BAR_MIN = 24;
const BROWSER_LINE = 0.0026;
const BROWSER_LINE_MIN = 2;

/** Native pixel size of a shot whose capture has not been recorded yet. */
const STAND_IN_SHOT = {
  phone: { width: 780, height: 1688 },
  browser: { width: 2880, height: 1800 },
};

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
   * Length of this beat in frames. Defaults to the 132 frame beat of the 15
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
  /**
   * Capture for the clean shot. Omitted falls back to the project's mobile
   * home page capture, which is what every web reel beat uses.
   */
  cleanCaptureId?: string;
  /**
   * Which device the clean shot sits inside. "phone" is the web reel's dark
   * slab around a 780x1688 mobile capture. "browser" is the sketched window
   * around a 2880x1800 desktop capture, which is the only sensible container
   * for a 16:10 training module screen.
   */
  cleanFrame?: CleanFrame;
  /**
   * Region of the clean capture to push in on, in capture pixels. A desktop
   * module screen shown whole renders its body text about four pixels tall in a
   * 1080 wide frame, which proves nothing; a region of it is readable.
   */
  zoom?: ZoomRegion;
  /**
   * How many lines the name wraps to at 1080 width. Only used to predict the
   * band's height so the device above it is sized against the right box.
   */
  nameLines?: number;
};

/**
 * One project beat, split per Section 6b: the context plate for 24 frames with
 * the project name typing on, then a hard cut to the clean mobile capture in a
 * device frame with one claim line held to the cut. 132 frames in the 15
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
  cleanCaptureId,
  cleanFrame = "phone",
  zoom,
  nameLines = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = safeArea(format);
  const metrics = formatMetrics(format);
  const scale = metrics.typeScale;
  // A named clip may not be recorded yet, and then the shot is a stand-in. A
  // project's own home page capture always exists, because the project would
  // not be in the reel otherwise.
  const capture = cleanCaptureId
    ? findCapture(cleanCaptureId)
    : getHomeCapture(projectId, "mobile");

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
  // Clamped at zero: a capture that plays from its own first frame, which is
  // what an interaction recording does, has nothing before it to back into.
  const plateCaptureOffset = Math.max(
    0,
    cleanTrimBefore - Math.round(PLATE_SHOT_FRAMES * scrollPlaybackRate),
  );

  const copySlotHeight = Math.round(
    Math.max(
      COPY_LINE_HEIGHT * (contextLine ? 2 : 1),
      CLAIM_RULE_BLOCK + COPY_LINE_HEIGHT,
    ) * scale,
  );
  const bandHeightPx = Math.round(
    bandHeight(contextLine ? 2 : 1, nameLines) * scale,
  );
  const bandTop = height - metrics.bandBottom - bandHeightPx;

  const browser = cleanFrame === "browser";

  // What the frame has to fit. Where there is a zoom region, that region is the
  // shot: it is the rectangle the viewer ends up seeing.
  const shotNative = capture ?? STAND_IN_SHOT[cleanFrame];
  const shotWidth = zoom ? zoom.w : shotNative.width;
  const shotHeight = zoom ? zoom.h : shotNative.height;

  /**
   * The overlay arrangement only works for a shot at least as tall and narrow
   * as the canvas. The lower third is anchored near the bottom of a canvas the
   * device is centred on, so it always covers the lower third or so of the
   * device, and a 9:16 mobile capture can spend that on page it has already
   * scrolled past. A shot wider than the canvas cannot: it has run out of
   * height long before the band, so the band lands across the middle of the
   * thing the shot exists to show.
   *
   * Every browser window is wider than it is tall and so always lands here,
   * which is what this rule originally said. A phone shot pushed in on one
   * region of itself can be wider than the canvas too, which is what the
   * stop-or-go beat of the training reel is, and it needs the same answer: in
   * the vertical crop the shot spans the safe width and the lower third sits
   * under it rather than across it.
   */
  const shotWiderThanCanvas = shotWidth / shotHeight > width / height;
  const showcase =
    metrics.showcase === "overlay" && shotWiderThanCanvas
      ? "stack"
      : metrics.showcase;

  // Box the device frame has to fit inside. The device is not text, so it is
  // allowed to run into a reserved zone. Text is not.
  let boxLeft = 0;
  let boxTop = 0;
  let boxWidth = safe.right;
  let boxHeight = height;

  if (showcase === "stack") {
    // Everything above the band, with a gap so the device does not kiss it.
    boxHeight = bandTop - Math.round(24 * scale);
    if (browser) {
      // A wide short window centres in whatever is left, so the box has to
      // start at the safe top or the window centres up into the platform's UI.
      boxTop = safe.top;
      boxHeight -= safe.top;
    }
  } else if (showcase === "split") {
    // Landscape. The strip left of the copy panel is the axis a 16:10 window
    // runs out of first, where a 9:16 phone runs out of height, so a browser
    // beat gets a wider strip.
    boxLeft = Math.round(width * (browser ? 0.025 : 0.06));
    boxWidth = Math.round(width * (browser ? 0.3 : 0.23));
    boxTop = safe.top;
    boxHeight = safe.height - Math.round(40 * scale);
  }

  let screenWidth: number;
  let screenHeight: number;
  let frameWidth: number;
  let frameHeight: number;
  let bezel = 0;
  let radius = 0;
  let browserBar = 0;
  let browserLine = 0;

  if (browser) {
    // A window is BROWSER_BAR taller and two hairlines wider than its screen,
    // so the screen is solved against the box rather than fitted to it. The
    // minimums on the bar and the hairline are what make this two passes: solve
    // proportionally, take the minimums, and give the height back if they bit.
    const aspect = shotWidth / shotHeight;
    let sw = Math.min(
      boxWidth / (1 + 2 * BROWSER_LINE),
      boxHeight / (1 / aspect + BROWSER_BAR + 2 * BROWSER_LINE),
      // Never upscale past the capture's own pixels, the same rule the phone
      // frame follows.
      shotWidth,
    );
    let bar = Math.max(BROWSER_BAR_MIN, Math.round(sw * BROWSER_BAR));
    let line = Math.max(BROWSER_LINE_MIN, Math.round(sw * BROWSER_LINE));
    let sh = sw / aspect;

    if (sh + bar + line * 2 > boxHeight) {
      sh = boxHeight - bar - line * 2;
      sw = sh * aspect;
      bar = Math.max(BROWSER_BAR_MIN, Math.round(sw * BROWSER_BAR));
      line = Math.max(BROWSER_LINE_MIN, Math.round(sw * BROWSER_LINE));
      sh = Math.min(sh, boxHeight - bar - line * 2);
    }

    screenWidth = Math.round(sw);
    screenHeight = Math.round(sh);
    browserBar = bar;
    browserLine = line;
    frameWidth = screenWidth + line * 2;
    frameHeight = screenHeight + bar + line * 2;
  } else {
    const nativeWidth = shotWidth + BEZEL * 2;
    const nativeHeight = shotHeight + BEZEL * 2;
    const deviceScale = Math.min(
      1,
      boxWidth / nativeWidth,
      boxHeight / nativeHeight,
    );
    screenWidth = Math.round(shotWidth * deviceScale);
    screenHeight = Math.round(shotHeight * deviceScale);
    bezel = Math.max(8, Math.round(BEZEL * deviceScale));
    radius = Math.max(16, Math.round(RADIUS * deviceScale));
    frameWidth = screenWidth + bezel * 2;
    frameHeight = screenHeight + bezel * 2;
  }

  const deviceLeft = boxLeft + Math.round((boxWidth - frameWidth) / 2);
  const deviceTop = boxTop + Math.round((boxHeight - frameHeight) / 2);

  /**
   * What goes inside the frame: the capture, the same capture pushed in on one
   * region of itself, or a labelled grey stand-in where the clip has not been
   * recorded yet.
   */
  const cleanShotFrames = beatLength - PROJECT_BEAT_SHOTS.cleanCapture.start;
  const cleanShot =
    capture === null ? (
      <StandIn
        kind="capture"
        id={cleanCaptureId ?? `${projectId}-home-mobile`}
        fontSize={Math.round(screenWidth * 0.045)}
      />
    ) : zoom ? (
      <ZoomShot
        src={captureSrc(capture)}
        captureWidth={capture.width}
        captureHeight={capture.height}
        zoom={zoom}
        width={screenWidth}
        height={screenHeight}
        trimBefore={cleanTrimBefore}
        playbackRate={scrollPlaybackRate}
        pushInFrames={cleanShotFrames}
      />
    ) : (
      <OffthreadVideo
        src={captureSrc(capture)}
        trimBefore={cleanTrimBefore}
        playbackRate={scrollPlaybackRate}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );

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
            {browser ? (
              <BrowserFrame
                screenWidth={screenWidth}
                screenHeight={screenHeight}
                chrome={browserBar}
                border={browserLine}
              >
                {cleanShot}
              </BrowserFrame>
            ) : (
              <DeviceFrame
                screenWidth={screenWidth}
                screenHeight={screenHeight}
                bezel={bezel}
                radius={radius}
              >
                {cleanShot}
              </DeviceFrame>
            )}
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
                // Owner decision 2026-09-03, unchanged on 2026-09-04: in the
                // split layout the copy centres inside this panel rather than
                // on the canvas, because the canvas is shared with the device.
                // What did change is the left bias: the panel bleeds off the
                // canvas right edge, so the right padding absorbs the reserved
                // strip and then matches the left, which puts the copy box
                // exactly in the middle of the visible panel.
                textAlign: "center",
                paddingTop: Math.round(BAND_PAD_TOP * scale),
                paddingBottom: Math.round(BAND_PAD_BOTTOM * scale),
                paddingLeft: Math.round(PANEL_PAD_X * scale),
                paddingRight: width - safe.right + Math.round(PANEL_PAD_X * scale),
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
              // Owner decision 2026-09-04: the copy centres on the canvas. The
              // scrim still runs edge to edge; the padding inside it is
              // symmetric, and centeredPadding() makes that box the widest one
              // that is both on the canvas axis and clear of the reserved right
              // strip. A name too long for it wraps inside the box, which is
              // what nameLines already sizes the band for.
              textAlign: "center",
              paddingTop: Math.round(BAND_PAD_TOP * scale),
              paddingBottom: Math.round(BAND_PAD_BOTTOM * scale),
              paddingLeft: centeredPadding(format, scale),
              paddingRight: centeredPadding(format, scale),
            }}
          >
            {copy}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
