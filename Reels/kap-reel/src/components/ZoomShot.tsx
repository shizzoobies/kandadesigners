import { interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import type { ZoomRegion } from "../reels/types";

/** Push in across the shot, as a fraction. Section 4b's plate ramp is the same 3 percent. */
export const ZOOM_PUSH_IN = 0.03;

export type ZoomShotProps = {
  /** Static file url of the capture. */
  src: string;
  /** The capture's own pixel size. */
  captureWidth: number;
  captureHeight: number;
  /** The region of the capture to show, in capture pixels. */
  zoom: ZoomRegion;
  /** Size of the box this shot fills, in canvas pixels. */
  width: number;
  height: number;
  /** Source frame the clip starts on. */
  trimBefore?: number;
  playbackRate?: number;
  /**
   * Frames the push in is spread across. Pass the length of the shot, not of
   * the composition: this component is usually inside a Sequence with no
   * duration of its own, where useVideoConfig would report the whole cut.
   */
  pushInFrames: number;
  /** Push in as a fraction over the shot. */
  pushIn?: number;
};

/**
 * A desktop capture pushed in on one region of itself, with a slow ramp.
 *
 * A 2880x1800 module screen scaled into a 1080 wide frame renders its body text
 * at about four pixels tall. Nobody reads that on a phone, and the shot then
 * proves nothing except that a page exists. Showing a 1900x1200 region of the
 * same capture at the same frame width is a little over 50 percent scale, which
 * is a readable interaction.
 *
 * The geometry: pick the scale that makes the region cover the box, lay the
 * whole capture out at that scale, then translate so the region's centre lands
 * on the box's centre. The push in is a transform on a wrapper around all of
 * that, with its origin at the box centre, so the ramp pushes into the middle
 * of the region rather than dragging it off one edge. No new dependency, and
 * nothing here reaches for the video's own pixels.
 */
export const ZoomShot: React.FC<ZoomShotProps> = ({
  src,
  captureWidth,
  captureHeight,
  zoom,
  width,
  height,
  trimBefore,
  playbackRate = 1,
  pushInFrames,
  pushIn = ZOOM_PUSH_IN,
}) => {
  const frame = useCurrentFrame();

  // Cover, not contain: the region fills the box in both axes and whichever
  // axis has slack spills evenly outside it.
  const scale = Math.max(width / zoom.w, height / zoom.h);
  const left = -zoom.x * scale + (width - zoom.w * scale) / 2;
  const top = -zoom.y * scale + (height - zoom.h * scale) / 2;

  const ramp = interpolate(
    frame,
    [0, Math.max(1, pushInFrames - 1)],
    [1, 1 + pushIn],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div style={{ width, height, overflow: "hidden", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width,
          height,
          transformOrigin: "center center",
          transform: `scale(${ramp})`,
        }}
      >
        <OffthreadVideo
          src={src}
          trimBefore={trimBefore}
          playbackRate={playbackRate}
          muted
          style={{
            position: "absolute",
            left,
            top,
            // Laid out at the capture's own aspect, so nothing is stretched and
            // objectFit has nothing left to decide.
            width: captureWidth * scale,
            height: captureHeight * scale,
            // Tailwind's preflight sets `video { max-width: 100% }`, which
            // silently clamps the width above to the box and leaves the height
            // alone. That is not a distortion you can see at a glance: the
            // video simply shows the wrong part of the capture at the wrong
            // scale, which is exactly what the first zoomed still did.
            maxWidth: "none",
            maxHeight: "none",
          }}
        />
      </div>
    </div>
  );
};
