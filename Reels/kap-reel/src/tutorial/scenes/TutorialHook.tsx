import type { CSSProperties } from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";
import { KineticText } from "../../components/KineticText";
import { StandIn } from "../../components/StandIn";
import { COLORS, DISPLAY_STACK } from "../../lib/brand";
import { captureSrc, findCapture } from "../../lib/captures";
import {
  centeredPadding,
  formatMetrics,
  safeArea,
  type FormatKey,
} from "../../lib/layout";
import type { TutorialHookContent } from "../types";

export type TutorialHookProps = {
  format: FormatKey;
  content: TutorialHookContent;
};

/** Type size at 1080 canvas width. Section 7 wants 96px or more on a hook. */
const HOOK_FONT_SIZE = 104;

/** Opaque scrim, not a drop shadow. Section 7. The same value src/scenes/Hook.tsx uses. */
const SCRIM = "#14100C";

/**
 * The showcase Hook's kinetic treatment, with a flat brand field option.
 *
 * src/scenes/Hook.tsx always has a site capture behind it, because the showcase
 * reels are about the work. A tutorial opens on a claim, and both of the first
 * two tutorials open on nothing but the claim, so the field is a first class
 * option here rather than a missing shot. Everything else is the same
 * treatment: both halves of the line slam on frame 0, the first in canvas and
 * the second in amber, on a scrim anchored 28 percent down the safe area, with
 * the copy box centred on the canvas by centeredPadding().
 *
 * On a field the scrim comes off. Its whole job is to hold text off a
 * photograph, and there is no photograph: leaving it in would draw a darker
 * rectangle on a flat ground for no reason. The accent rule above the lines
 * stays, because that is the hook's shape rather than the scrim's.
 */
export const TutorialHook: React.FC<TutorialHookProps> = ({
  format,
  content,
}) => {
  const safe = safeArea(format);
  const metrics = formatMetrics(format);
  const scale = metrics.typeScale;
  const shot = content.shot;

  const fontSize = Math.round(HOOK_FONT_SIZE * scale);

  /**
   * Each half of the line gets at least one line box and takes more if it needs
   * it.
   *
   * src/scenes/Hook.tsx pins each half to exactly one line box, which is right
   * for the showcase reels: "Custom built." and "One designer." are thirteen
   * characters and never wrap. A tutorial hook is a sentence, and "Your hero is
   * a promise," is twenty three characters, which at 104px will not fit an 864
   * pixel copy box however it is set. Section 7 puts a floor of 96px under a
   * hook, so the answer is not smaller type: the line wraps, and the box has to
   * grow with it. Pinned, the second half rendered straight through the first,
   * which is what the first grey render showed.
   */
  const lineBox = Math.round(fontSize * 1.08);

  const hookLineStyle: CSSProperties = {
    fontFamily: DISPLAY_STACK,
    fontSize,
    fontWeight: 800,
    letterSpacing: -2 * scale,
    lineHeight: 1.08,
  };

  const onField = shot.kind === "field";
  const ground =
    shot.kind === "field" && shot.field === "canvas"
      ? COLORS.canvas
      : COLORS.dark_canvas;

  // A named clip may not be recorded yet, and a stand-in must be impossible to
  // mistake for a finished shot.
  const capture = shot.kind === "capture" ? findCapture(shot.captureId) : null;

  return (
    <AbsoluteFill
      style={{ backgroundColor: onField ? ground : COLORS.ink }}
    >
      {shot.kind === "capture" ? (
        <AbsoluteFill>
          {capture === null ? (
            <StandIn
              kind="capture"
              id={shot.captureId}
              fontSize={Math.round(52 * scale)}
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
      ) : null}

      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: Math.round(safe.top + safe.height * 0.28),
            backgroundColor: onField ? "transparent" : SCRIM,
            borderTop: `${Math.round(8 * scale)}px solid ${COLORS.accent}`,
            paddingTop: Math.round(44 * scale),
            paddingBottom: Math.round(52 * scale),
            paddingLeft: centeredPadding(format, scale),
            paddingRight: centeredPadding(format, scale),
            textAlign: "center",
          }}
        >
          {/* One kinetic line, so both halves slam together. */}
          <div style={{ minHeight: lineBox }}>
            <KineticText
              text={content.lines[0]}
              mode="slam"
              startFrame={0}
              align="center"
              style={{
                ...hookLineStyle,
                color:
                  onField && ground === COLORS.canvas
                    ? COLORS.ink
                    : COLORS.canvas,
              }}
            />
          </div>
          <div style={{ minHeight: lineBox }}>
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
