import type { CSSProperties } from "react";
import { AbsoluteFill, OffthreadVideo, useVideoConfig } from "remotion";
import { KineticText } from "../components/KineticText";
import { StandIn } from "../components/StandIn";
import { ZoomShot } from "../components/ZoomShot";
import { COLORS, DISPLAY_STACK } from "../lib/brand";
import { captureSrc, findCapture, getHomeCapture } from "../lib/captures";
import {
  centeredPadding,
  formatMetrics,
  safeArea,
  type FormatKey,
} from "../lib/layout";
import type { HookContent } from "../reels/types";

export type HookProps = {
  format: FormatKey;
  content: HookContent;
};

/** Type size at 1080 canvas width. Section 7 wants 96px or more on a hook. */
const HOOK_FONT_SIZE = 104;

/** Opaque scrim, not a drop shadow. Section 7. */
const SCRIM = "#14100C";

/**
 * Frames 0 to 54 in the 15 second cut, 0 to 36 in the 45 second one. A site or
 * module capture full bleed, with the hook line slammed on top.
 *
 * The web reel's shot is the Fore Motion home page at 2x from source frame 54.
 * Its scroll is eased in and out across 180 frames, so source frame 0 is
 * stationary and Section 6 demands the first frame already be moving; frame 54
 * is about 30 percent in, where the ease already carries real velocity. At 2x
 * the 45 second cut's 36 frames consume source 54 to 126 and the re-paced 15
 * second cut's 54 frames consume source 54 to 162, both straddling peak scroll
 * speed and both inside the 180 frame source.
 *
 * The training reel's shot is an interaction recording instead, which is
 * already moving on its first frame because a person is clicking in it, so it
 * plays from 0 at rate 1 and can be pushed in on one region of itself.
 */
export const Hook: React.FC<HookProps> = ({ format, content }) => {
  const safe = safeArea(format);
  const metrics = formatMetrics(format);
  const { width, height, durationInFrames } = useVideoConfig();
  const scale = metrics.typeScale;
  const shot = content.shot;

  const fontSize = Math.round(HOOK_FONT_SIZE * scale);
  const lineBox = Math.round(fontSize * 1.08);

  const hookLineStyle: CSSProperties = {
    fontFamily: DISPLAY_STACK,
    fontSize,
    fontWeight: 800,
    letterSpacing: -2 * scale,
    lineHeight: 1.08,
  };

  // A named clip may not be recorded yet; a project's home page capture always
  // exists, because the project would not be in the reel otherwise.
  const capture =
    shot.kind === "projectHome"
      ? getHomeCapture(shot.projectId, metrics.hookViewport)
      : findCapture(shot.captureId);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <AbsoluteFill>
        {capture === null ? (
          <StandIn
            kind="capture"
            id={(shot as { captureId: string }).captureId}
            fontSize={Math.round(52 * scale)}
          />
        ) : shot.kind === "capture" && shot.zoom ? (
          <ZoomShot
            src={captureSrc(capture)}
            captureWidth={capture.width}
            captureHeight={capture.height}
            zoom={shot.zoom}
            width={width}
            height={height}
            trimBefore={shot.trimBefore}
            playbackRate={shot.playbackRate}
            pushInFrames={durationInFrames}
          />
        ) : (
          <OffthreadVideo
            src={captureSrc(capture)}
            playbackRate={shot.playbackRate}
            trimBefore={shot.trimBefore}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </AbsoluteFill>

      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            // 28 percent down the safe area in every crop, so the band clears
            // the reserved top and still sits above optical center.
            top: Math.round(safe.top + safe.height * 0.28),
            backgroundColor: SCRIM,
            borderTop: `${Math.round(8 * scale)}px solid ${COLORS.accent}`,
            paddingTop: Math.round(44 * scale),
            paddingBottom: Math.round(52 * scale),
            // Owner decision 2026-09-04: symmetric, so the line centres on the
            // canvas. The scrim still runs edge to edge; only the copy box
            // inside it is centred, and centeredPadding() sizes that box so its
            // right edge stops on safe.right in the vertical crop.
            paddingLeft: centeredPadding(format, scale),
            paddingRight: centeredPadding(format, scale),
            textAlign: "center",
          }}
        >
          {/* Section 6 calls this one kinetic line, so both halves slam together. */}
          <div style={{ height: lineBox }}>
            <KineticText
              text={content.lines[0]}
              mode="slam"
              startFrame={0}
              align="center"
              style={{ ...hookLineStyle, color: COLORS.canvas }}
            />
          </div>
          <div style={{ height: lineBox }}>
            <KineticText
              text={content.lines[1]}
              mode="slam"
              startFrame={0}
              align="center"
              style={{ ...hookLineStyle, color: COLORS.amber }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
