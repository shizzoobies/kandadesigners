// Puts a context plate on the timeline in any of the four delivery crops.
//
// PlateComposite lays the plate out against the live canvas: it centres the
// plate on the canvas and scales it to cover. That is right for the 9:16
// master, where a 1536x2752 plate and a 1080x1920 canvas are within half a
// percent of the same aspect. It is wrong for 1080x1350, 1080x1080 and
// 1920x1080, where covering the canvas throws away the top and bottom of the
// plate and the device can drift out of frame entirely.
//
// This wrapper reframes the composite without touching it: it offsets the
// composite so the screen quad's centre lands on the canvas centre, then
// scales the whole thing up by the smallest factor that still covers the
// canvas after that offset. Nothing here knows about plate content. It reads
// the quad out of config/plates.json through src/lib/plates.ts, the same
// source PlateComposite warps the capture into.

import { AbsoluteFill, useVideoConfig } from "remotion";
import { PlateComposite, type PlateCompositeProps } from "./PlateComposite";
import { COLORS } from "../lib/brand";
import { getPlate, quadBounds, type PlateEntry } from "../lib/plates";

/**
 * Headroom over the exact coverage scale. PlateComposite drifts the plate a
 * few pixels on a noise curve to fake a handheld operator, and the scale ramp
 * is applied about the plate's own centre rather than the canvas centre, so
 * the exact figure would leave a hairline of background at an edge on some
 * frames. Two percent buys more margin than either can spend.
 */
const DRIFT_HEADROOM = 1.02;

export type PlateShotProps = PlateCompositeProps;

export type PlateCrop = {
  /** Offset of the composite's own box from the canvas origin, in canvas px. */
  left: number;
  top: number;
  /** Size of that box. Oversized on purpose: it is the composite's clip rect. */
  width: number;
  height: number;
  /** Push in about the canvas centre, applied after the offset. */
  scale: number;
};

/**
 * The offset and push-in that centre `plate`'s screen quad on a
 * canvasWidth by canvasHeight canvas.
 *
 * Assumes what PlateComposite documents about itself: the plate is drawn at
 * its own pixel size, centred on the canvas, scaled by cover(). If that ever
 * changes, this is the function that has to change with it.
 */
export function plateCrop(
  plate: PlateEntry,
  canvasWidth: number,
  canvasHeight: number,
): PlateCrop {
  const cover = Math.max(
    canvasWidth / plate.width,
    canvasHeight / plate.height,
  );
  const quad = quadBounds(plate.quad);

  // How far the quad centre sits from the plate centre, in canvas pixels.
  // Undoing it is what recentres the shot on the device.
  const offsetX = (quad.centerX - plate.width / 2) * cover;
  const offsetY = (quad.centerY - plate.height / 2) * cover;

  // Four half-widths have to survive the offset: the composite's own clip box
  // on the left and top, and the plate's far edge on the right and bottom.
  // Each gives a minimum scale, and the shot takes the largest.
  const scale =
    Math.max(
      1,
      canvasWidth / (canvasWidth + 2 * offsetX),
      canvasWidth / (2 * (plate.width - quad.centerX) * cover),
      canvasHeight / (canvasHeight + 2 * offsetY),
      canvasHeight / (2 * (plate.height - quad.centerY) * cover),
    ) * DRIFT_HEADROOM;

  return {
    left: -offsetX,
    top: -offsetY,
    // The composite clips its own content to this box, so it is sized past
    // the plate on every side and the crop is decided by `scale` alone.
    width: canvasWidth + plate.width * cover,
    height: canvasHeight + plate.height * cover,
    scale,
  };
}

export const PlateShot: React.FC<PlateShotProps> = (props) => {
  const { width, height } = useVideoConfig();
  const crop = plateCrop(getPlate(props.plateId), width, height);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${crop.scale})` }}>
        <div
          style={{
            position: "absolute",
            left: crop.left,
            top: crop.top,
            width: crop.width,
            height: crop.height,
          }}
        >
          <PlateComposite {...props} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
