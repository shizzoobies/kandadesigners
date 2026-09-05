// Puts a context plate on the timeline in any of the four delivery crops.
//
// The reframing arithmetic moved to src/lib/plate-crop.ts on 2026-09-05 so the
// QA harness could import it instead of restating it. Read that file for what
// the crop does and why the recentring is capped; this one is the component
// that applies it.

import { AbsoluteFill, useVideoConfig } from "remotion";
import { PlateComposite, type PlateCompositeProps } from "./PlateComposite";
import { StandIn } from "./StandIn";
import { COLORS } from "../lib/brand";
import { findCapture } from "../lib/captures";
import { plateCrop } from "../lib/plate-crop";
import { listPlates } from "../lib/plates";

export type PlateShotProps = PlateCompositeProps;

export const PlateShot: React.FC<PlateShotProps> = (props) => {
  const { width, height } = useVideoConfig();

  // The training reel names plates and interaction captures that two other
  // agents are still producing. Neither getPlate() nor getCapture() tolerates a
  // missing id, and they should not: a web reel shot with a typo in it has to
  // fail. So the absence is caught here instead, and the shot renders a
  // labelled grey stand-in that no reviewer can mistake for finished work.
  const plate = listPlates().find((p) => p.id === props.plateId) ?? null;
  const missingCaptureId = plate
    ? [props.captureId ?? plate.captureId].find((id) => !findCapture(id))
    : undefined;

  if (!plate || missingCaptureId) {
    return (
      <AbsoluteFill>
        <StandIn
          kind={plate ? "plate capture" : "plate"}
          id={plate ? (missingCaptureId as string) : props.plateId}
          fontSize={Math.round(width * 0.032)}
        />
      </AbsoluteFill>
    );
  }

  const crop = plateCrop(plate, width, height);

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
