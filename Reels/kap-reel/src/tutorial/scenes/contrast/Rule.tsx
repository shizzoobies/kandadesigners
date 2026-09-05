import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";
import { KineticText } from "../../../components/KineticText";
import { COLORS, DISPLAY_STACK } from "../../../lib/brand";
import { centeredPadding, formatMetrics } from "../../../lib/layout";
import { demoBox } from "../FlatDemo";
import type { TutorialSceneProps } from "../registry";

/**
 * "Every color that carries text gets measured, not eyeballed." The 45 second
 * cut's rule beat, 104 frames.
 *
 * The hook's treatment, on the hook's ground, for the hook's reason: this is the
 * same claim the reel opened with, now earned, and the picture says so by
 * looking like the opening. Both halves slam on frame 0, the first in canvas and
 * the second in amber, on the teal band with the rust rule above them.
 *
 * It reuses KineticText rather than TutorialHook because a hook is a content
 * shape, not a treatment: TutorialHook takes a TutorialHookContent with a shot
 * and a narration and belongs to one beat of the timeline, and a beat that
 * borrowed it would be a second hook rather than a line.
 *
 * Amber on the teal band measures 4.5 to 1, which clears AA at this size and at
 * any other. Nothing in this file needed to be told that, but a tutorial about
 * contrast should not be the reel that gets it wrong.
 */

/** Type size at 1080 canvas width, matching TutorialHook. Section 7's floor is 96. */
const RULE_FONT_SIZE = 104;
const RULE_MIN_FONT_SIZE = 96;

/**
 * Padding around the band, authored at 1080 canvas width.
 *
 * Tighter than TutorialHook's 44 and 52. The hook has the whole frame; this beat
 * has demoBox(), which in the landscape crop is 532 pixels tall, and two lines
 * of 104 scaled to 1.78 plus the hook's padding comes to 584. Taking 30 off the
 * padding is the cheap half of the fit; the clamp below is the rest of it, and
 * it never takes the type under Section 7's floor.
 */
const RULE_PAD_TOP = 28;
const RULE_PAD_BOTTOM = 34;
const RULE_HEIGHT = 8;

const LINES: [string, string] = ["Measured,", "not eyeballed."];

export const ContrastRule: React.FC<TutorialSceneProps> = ({ format }) => {
  // demoBox(), not the hook's own anchor. TutorialHook hangs its band 28 percent
  // down the safe area, which is right for a beat that has no caption: the hook
  // and the end card are the two beats Tutorial.tsx draws without one. This beat
  // has a caption, and in the landscape crop the hook's anchor put the second
  // line straight through the caption card. demoBox() is the rectangle every
  // captioned beat is allowed, so the band is centered inside that instead.
  const box = demoBox(format);
  const metrics = formatMetrics(format);
  const scale = metrics.typeScale;

  // Fit two line boxes and the padding inside demoBox(), then refuse to go below
  // Section 7's floor: a hook line that will not fit is a line to shorten, not a
  // line to shrink, and this one does fit in every crop the reel ships.
  const ruleHeight = Math.round(RULE_HEIGHT * scale);
  const padTop = Math.round(RULE_PAD_TOP * scale);
  const padBottom = Math.round(RULE_PAD_BOTTOM * scale);
  const roomForLines = box.height - ruleHeight - padTop - padBottom;
  const fontSize = Math.max(
    Math.round(RULE_MIN_FONT_SIZE * scale),
    Math.min(Math.round(RULE_FONT_SIZE * scale), Math.floor(roomForLines / 2.16)),
  );

  const lineStyle: CSSProperties = {
    fontFamily: DISPLAY_STACK,
    fontSize,
    fontWeight: 800,
    letterSpacing: -2 * scale,
    lineHeight: 1.08,
  };

  // Each half takes at least one line box and grows if it wraps, the same rule
  // TutorialHook settled on when "Your hero is a promise," would not fit one.
  const lineBox = Math.round(fontSize * 1.08);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark_canvas }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: box.top,
          height: box.height,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            borderTop: `${ruleHeight}px solid ${COLORS.accent}`,
            paddingTop: padTop,
            paddingBottom: padBottom,
            paddingLeft: centeredPadding(format, scale),
            paddingRight: centeredPadding(format, scale),
            textAlign: "center",
          }}
        >
          <div style={{ minHeight: lineBox }}>
            <KineticText
              text={LINES[0]}
              mode="slam"
              startFrame={0}
              align="center"
              style={{ ...lineStyle, color: COLORS.canvas }}
            />
          </div>
          <div style={{ minHeight: lineBox }}>
            <KineticText
              text={LINES[1]}
              mode="slam"
              startFrame={0}
              align="center"
              style={{ ...lineStyle, color: COLORS.amber }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
