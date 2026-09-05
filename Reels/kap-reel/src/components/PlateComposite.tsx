// The five-layer context plate composite from kap-reel-handoff.md Section 4b:
// a generated room and device, with a real site capture warped into the
// device's screen quad.
//
// Layer order, and none of it is optional except where noted:
//   1. The plate, full frame, with a slow scale ramp and a noise drift.
//   2. The capture, warped into the quad by a matrix3d homography, clipped.
//   3. A dark inner shadow at the screen border, so the site sits in the device.
//   4. A screen glow spilling onto the bezel and the nearest hand or surface.
//   5. The plate's own screen pixels blended back as glare, where there is any.
//
// Layers 3 to 5 are the difference between a plate and a sticker.
//
// One hard rule learned at the first gate: layers 3 and 4 must never lighten
// the screen face. Layer 3 is near black and thin. Layer 4 paints strictly
// outside the quad. The first version broke both, and the composites read as
// washed out screens rather than as seated ones.

import { noise2D } from "@remotion/noise";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { captureSrc, getCapture } from "../lib/captures";
import { fillRegion, isFullFrame } from "../lib/content-fill";
import {
  captureTint,
  getPlate,
  plateSrc,
  quadClipPath,
  quadMatrix3d,
  quadSourceSize,
} from "../lib/plates";

export type PlateCompositeProps = {
  /** Plate id from config/plates.json. */
  plateId: string;
  /** Overrides the capture bound to the plate in plates.json. */
  captureId?: string;
  /**
   * Frame of the source capture to start on. The captures are a 6 second
   * scripted scroll, so a nonzero offset means the site is already moving when
   * the shot cuts in, which is what makes the composite read as footage rather
   * than a screenshot in a photo.
   */
  captureFrameOffset?: number;
  /** Scroll speed relative to the clean capture that follows. */
  scrollPlaybackRate?: number;
  /** Changes the handheld drift without changing anything else. */
  driftSeed?: string;
  /** Scale ramp across the shot, as a fraction. 0.03 is 3 percent. */
  scaleRamp?: number;
  /**
   * Opacity of the layer 4 spill onto the bezel, 0 to 1. Defaults to
   * GLOW_OPACITY. Per shot tuning for a page whose average colour turns out
   * too hot next to a dark room, and setting it to 0 renders a control still
   * for measuring exactly how much bezel the spill covers.
   */
  glowOpacity?: number;
};

// Section 4b: 2 to 4 percent scale over the shot, 3 to 6 px of drift. More
// than that and it reads as a Ken Burns slideshow rather than a camera.
const DEFAULT_SCALE_RAMP = 0.03;
const DRIFT_PX = 5;
const DRIFT_PERIOD_FRAMES = 90;

// Everything below is in plate pixels, not canvas pixels. The plate is 1536
// wide inside a 1080 canvas, so one canvas pixel is about 1.42 plate pixels.
// A CSS shadow reaches spread + blur/2 from its edge, which is what the
// conversions in each comment use.

/**
 * Layer 3, the inner shadow. Near black, thin, inside the quad edge only.
 * Reaches 6 + 28/2 = 20 plate px, about 14 canvas px, inside the 12 to 20
 * canvas px the spec asks for. It must never be a light colour: the job is to
 * seat the screen into the device, not to veil it.
 */
const SEAT_BLUR = 28;
const SEAT_SPREAD = 6;
const SEAT_COLOR = "rgba(6, 5, 4, 0.44)";

/**
 * Where the capture sits when its aspect does not match the screen quad's, for
 * a capture that fills its own frame.
 *
 * Cover has to crop one axis, and centring that crop is wrong for a web page.
 * plate-tablet-b is the worst case in the set: a 4:3 tablet screen against a
 * 16:10 desktop capture crops about a quarter of the width, and centred that
 * cut the first letters off every headline. A page is laid out from its top
 * left, so anchoring there keeps the logo, the nav and the headline and takes
 * the loss out of the right margin instead.
 *
 * This is still every clip in the web reel and every mobile clip in the
 * training reel. A capture whose page does not fill its frame takes the branch
 * below instead: see fillRegion() in src/lib/content-fill.ts.
 */
const CAPTURE_ANCHOR = "left top";

/**
 * Layer 4, the screen glow spill.
 *
 * An OUTSET box-shadow on the quad, and nothing else. A CSS outer shadow is
 * clipped to the region outside the border box by definition, so it is
 * structurally incapable of painting over the capture. That matters: the first
 * version of this layer was a blurred copy of the capture warped onto an
 * expanded quad, and its bright bands bloomed along the panel edge and read as
 * fog on the screen face rather than as light on the bezel.
 *
 * Reaches 12 + 150/2 = 87 plate px, about 61 canvas px, inside the 40 to 80
 * canvas px the spec asks for. The tint is the capture's average colour, so a
 * dark page spills a dark halo and a bright page a light one. At 10 percent
 * the bezel is never covered by more than a tenth of the glow.
 */
const GLOW_BLUR = 150;
const GLOW_SPREAD = 12;
const GLOW_OPACITY = 0.1;

export const PlateComposite: React.FC<PlateCompositeProps> = ({
  plateId,
  captureId,
  captureFrameOffset = 20,
  scrollPlaybackRate = 1,
  driftSeed,
  scaleRamp = DEFAULT_SCALE_RAMP,
  glowOpacity = GLOW_OPACITY,
}) => {
  const frame = useCurrentFrame();
  const { width: canvasWidth, height: canvasHeight, durationInFrames } = useVideoConfig();

  const plate = getPlate(plateId);
  const capture = getCapture(captureId ?? plate.captureId);
  const seed = driftSeed ?? plate.id;

  // Layer 1 motion. The plate is laid out at its own pixel size and then
  // scaled to cover the canvas, so every quad number below is a plate pixel
  // and nothing has to be rescaled by hand.
  const cover = Math.max(canvasWidth / plate.width, canvasHeight / plate.height);
  const ramp = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [1, 1 + scaleRamp], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const driftX = noise2D(`${seed}-x`, frame / DRIFT_PERIOD_FRAMES, 0) * DRIFT_PX;
  const driftY = noise2D(`${seed}-y`, frame / DRIFT_PERIOD_FRAMES, 11.3) * DRIFT_PX;

  // Layer 2 geometry.
  const source = quadSourceSize(plate.quad);
  const warp = quadMatrix3d(source.width, source.height, plate.quad);
  const clip = quadClipPath(plate.quad);

  // Layer 4 tint: the capture's average colour, so the spill matches the light
  // the page would actually throw.
  const [tr, tg, tb] = captureTint(capture.id);

  const warpedLayer: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: source.width,
    height: source.height,
    transformOrigin: "0 0",
    transform: warp,
  };

  /**
   * Layer 2's source rectangle.
   *
   * A capture whose page fills its own frame keeps the objectFit cover it has
   * always had, anchored top left, which is what every web reel clip and every
   * training mobile clip is. A capture whose page is a sheet on a backdrop
   * takes fillRegion() instead, and the video is laid out at the scale that
   * makes that region cover the quad and offset so the region lands on it. The
   * quad's aspect is the source size's, because quadSourceSize() is already the
   * average of the two horizontal edges over the average of the two vertical
   * ones.
   *
   * ZoomShot does the same arithmetic for the clean shots, including the
   * maxWidth and maxHeight of none: Tailwind's preflight sets
   * `video { max-width: 100% }`, which silently clamps the width below and
   * leaves the height alone, and the result is the wrong part of the capture at
   * the wrong scale rather than anything that looks like an error.
   */
  const box = capture.contentBox;
  const region =
    box && !isFullFrame(box, capture.width, capture.height)
      ? fillRegion(box, capture.width, capture.height, source.width / source.height)
      : null;
  const regionScale = region ? source.width / region.w : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0908", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: (canvasWidth - plate.width) / 2,
          top: (canvasHeight - plate.height) / 2,
          width: plate.width,
          height: plate.height,
          transformOrigin: "center center",
          transform: `translate(${driftX}px, ${driftY}px) scale(${cover * ramp})`,
        }}
      >
        {/* 1. The plate. */}
        <Img
          src={plateSrc(plate)}
          style={{ width: "100%", height: "100%", display: "block" }}
        />

        {/*
          4. Screen glow spill, as an outset shadow on the quad and nothing
          else. A CSS outer shadow is clipped to the region outside the border
          box, so this cannot paint a single pixel over the capture. The
          element carries no background for the same reason: an outer shadow is
          cast as if the border box were opaque, so it draws without one.
          Placed before the capture so it lands on the plate.
        */}
        <div
          style={{
            ...warpedLayer,
            boxShadow: `0 0 ${GLOW_BLUR}px ${GLOW_SPREAD}px rgba(${tr}, ${tg}, ${tb}, ${glowOpacity})`,
            pointerEvents: "none",
          }}
        />

        {/*
          2. The real capture, warped into the screen quad. The quad in
          plates.json is already pushed 2px outward, and overflow hidden clips
          the video to exactly that shape, so no generated screen pixel
          survives at the edge.
        */}
        <div style={{ ...warpedLayer, overflow: "hidden" }}>
          <OffthreadVideo
            src={captureSrc(capture)}
            trimBefore={captureFrameOffset}
            playbackRate={scrollPlaybackRate}
            muted
            style={
              region
                ? {
                    position: "absolute",
                    left: -region.x * regionScale,
                    top: -region.y * regionScale,
                    width: capture.width * regionScale,
                    height: capture.height * regionScale,
                    maxWidth: "none",
                    maxHeight: "none",
                  }
                : {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: CAPTURE_ANCHOR,
                  }
            }
          />
        </div>

        {/*
          3. Seat the composite in the device. A dark, thin inset shadow just
          inside the quad edge. It sits on a sibling rather than on the warped
          element itself, because an inset shadow paints below its own content
          and would otherwise sit under the video.
        */}
        <div
          style={{
            ...warpedLayer,
            boxShadow: `inset 0 0 ${SEAT_BLUR}px ${SEAT_SPREAD}px ${SEAT_COLOR}`,
            pointerEvents: "none",
          }}
        />

        {/*
          5. Glare. The plate's own screen pixels blended back on top, clipped
          to the quad. plates.json carries glareOpacity 0 for a plate whose
          panel measured flat, and then this renders nothing.
        */}
        {plate.glareOpacity > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: plate.width,
              height: plate.height,
              clipPath: clip,
              opacity: plate.glareOpacity,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          >
            <Img
              src={plateSrc(plate)}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
