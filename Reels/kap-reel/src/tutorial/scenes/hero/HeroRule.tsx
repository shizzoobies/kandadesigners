import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";
import { fitHookLines, KineticText } from "../../../components/KineticText";
import { COLORS, DISPLAY_FAMILY, DISPLAY_STACK } from "../../../lib/brand";
import {
  centeredPadding,
  formatMetrics,
  SAFE_ZONES,
} from "../../../lib/layout";
import { demoBox } from "../FlatDemo";
import type { TutorialSceneProps } from "../registry";

/**
 * "Write the promise. Then pick the photo."
 *
 * The rule, on teal, in the hook's own treatment: two kinetic lines slammed
 * together on the beat's first frame, the first in canvas and the second in
 * amber, on a rust rule anchored 28 percent down the safe area. It is the same
 * picture as the hook on purpose. The tutorial opened on a claim and closes on
 * the instruction that claim implies, and the viewer should recognise the shape
 * before they have read the words.
 *
 * It shares the hook's fit as well as its treatment: "Write the promise." and
 * "Then pick the photo." both fit one line at the authored size in every crop,
 * so fitHookLines() returns that size unchanged here, but a later edit to
 * either line cannot silently draw one through the other.
 */

/** The two halves. First canvas, second amber, the way a hook is set. */
const LINES = ["Write the promise.", "Then pick the photo."];

/** Type size at 1080 canvas width, and the floor under it. Both the hook's. */
const RULE_FONT_SIZE = 104;
const RULE_MIN_FONT_SIZE = 84;
const RULE_LINE_HEIGHT = 1.08;

export const HeroRule: React.FC<TutorialSceneProps> = ({ format }) => {
  const box = demoBox(format);
  const scale = formatMetrics(format).typeScale;
  const pad = centeredPadding(format, scale);

  const fit = fitHookLines({
    lines: LINES,
    maxWidth: SAFE_ZONES[format].width - pad * 2,
    fontSize: Math.round(RULE_FONT_SIZE * scale),
    minFontSize: Math.round(RULE_MIN_FONT_SIZE * scale),
    lineHeight: RULE_LINE_HEIGHT,
    fontFamily: DISPLAY_FAMILY,
    fontWeight: 800,
    letterSpacing: -2 * scale,
  });

  const lineStyle: CSSProperties = {
    fontFamily: DISPLAY_STACK,
    fontSize: fit.fontSize,
    fontWeight: 800,
    letterSpacing: -2 * scale,
    lineHeight: RULE_LINE_HEIGHT,
  };

  /**
   * Centered in demoBox rather than anchored 28 percent down the safe area the
   * way the hook is.
   *
   * The hook has the frame to itself; this beat is captioned, and the caption
   * card is drawn in the bottom safe area by Tutorial.tsx. Taking the hook's
   * anchor put the amber line straight through that card in the landscape crop,
   * which has 940 pixels of safe area and only 533 of demoBox. demoBox is the
   * rectangle that already knows where the caption starts.
   */
  const ruleHeight = Math.round(8 * scale);
  const padTop = Math.round(44 * scale);
  const padBottom = Math.round(52 * scale);
  const blockHeight =
    ruleHeight + padTop + fit.boxes[0] + fit.boxes[1] + padBottom;
  const top =
    box.top + Math.max(0, Math.round((box.height - blockHeight) / 2));

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark_canvas }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top,
          borderTop: `${ruleHeight}px solid ${COLORS.accent}`,
          paddingTop: padTop,
          paddingBottom: padBottom,
          paddingLeft: pad,
          paddingRight: pad,
          textAlign: "center",
        }}
      >
        <div style={{ height: fit.boxes[0] }}>
          <KineticText
            text={LINES[0]}
            mode="slam"
            startFrame={0}
            align="center"
            style={{ ...lineStyle, color: COLORS.canvas }}
          />
        </div>
        <div style={{ height: fit.boxes[1] }}>
          <KineticText
            text={LINES[1]}
            mode="slam"
            startFrame={0}
            align="center"
            style={{ ...lineStyle, color: COLORS.amber }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
