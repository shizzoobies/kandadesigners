import type { CSSProperties } from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";
import { fitHookLines, KineticText } from "../../components/KineticText";
import { StandIn } from "../../components/StandIn";
import { COLORS, DISPLAY_FAMILY, DISPLAY_STACK } from "../../lib/brand";
import { captureSrc, findCapture } from "../../lib/captures";
import {
  centeredPadding,
  formatMetrics,
  safeArea,
  SAFE_ZONES,
  type FormatKey,
} from "../../lib/layout";
import type { TutorialHookContent } from "../types";

export type TutorialHookProps = {
  format: FormatKey;
  content: TutorialHookContent;
};

/** Type size at 1080 canvas width. Section 7 wants 96px or more on a hook. */
const HOOK_FONT_SIZE = 104;

/**
 * The smallest a hook half may be set at, at 1080 canvas width, before it is
 * allowed to wrap instead of shrinking further.
 *
 * Under Section 7's 96px preference on purpose. A tutorial hook is a sentence
 * rather than a two word slam, and 84px is the point at which "Your hero is a
 * promise," is still a headline read at arm's length on a phone. Below it the
 * line stops reading as a hook, so the fit stops there and wraps instead.
 */
const HOOK_MIN_FONT_SIZE = 84;

/** Line box multiplier. The same 1.08 src/scenes/Hook.tsx sets. */
const HOOK_LINE_HEIGHT = 1.08;

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
 * the copy box centered on the canvas by centeredPadding().
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

  const pad = centeredPadding(format, scale);

  /**
   * The type size and the two box heights, measured rather than assumed.
   *
   * A tutorial hook is a sentence: "Your hero is a promise," is twenty three
   * characters and at 104px it is a third wider than the 864 pixel copy box in
   * the vertical crop. fitHookLines() shrinks it to fit on one line where that
   * is possible and wraps it where it is not, and either way it hands back a
   * box tall enough for the lines the half really took, so the amber second
   * half stacks under the first instead of over it. Where both halves already
   * fit, which is every showcase hook and the contrast tutorial's, it returns
   * the authored size and one line box each: unchanged.
   */
  const fit = fitHookLines({
    lines: content.lines,
    maxWidth: SAFE_ZONES[format].width - pad * 2,
    fontSize: Math.round(HOOK_FONT_SIZE * scale),
    minFontSize: Math.round(HOOK_MIN_FONT_SIZE * scale),
    lineHeight: HOOK_LINE_HEIGHT,
    fontFamily: DISPLAY_FAMILY,
    fontWeight: 800,
    letterSpacing: -2 * scale,
  });

  const hookLineStyle: CSSProperties = {
    fontFamily: DISPLAY_STACK,
    fontSize: fit.fontSize,
    fontWeight: 800,
    letterSpacing: -2 * scale,
    lineHeight: HOOK_LINE_HEIGHT,
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
            paddingLeft: pad,
            paddingRight: pad,
            textAlign: "center",
          }}
        >
          {/* One kinetic line, so both halves slam together. */}
          <div style={{ height: fit.boxes[0] }}>
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
          <div style={{ height: fit.boxes[1] }}>
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
