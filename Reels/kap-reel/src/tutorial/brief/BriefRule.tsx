import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";
import { fitHookLines, KineticText } from "../../components/KineticText";
import { COLORS, DISPLAY_FAMILY, DISPLAY_STACK } from "../../lib/brand";
import { centeredPadding, formatMetrics, SAFE_ZONES, type FormatKey } from "../../lib/layout";
import { demoBox } from "../scenes/FlatDemo";

/**
 * "Give it the brief, not the task."
 *
 * The rule, on teal, in the hook's own treatment: the two halves of the first
 * sentence slammed together on the beat's first frame, canvas then amber, on a
 * rust rule. The same picture as the hook on purpose, as in the hero
 * tutorial's rule beat: the reel opened on the habit and closes on the
 * instruction.
 */

const LINES = ["Give it the brief,", "not the task."];

const RULE_FONT_SIZE = 104;
const RULE_MIN_FONT_SIZE = 84;
const RULE_LINE_HEIGHT = 1.08;

export const BriefRule: React.FC<{ format: FormatKey }> = ({ format }) => {
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

  const ruleHeight = Math.round(8 * scale);
  const padTop = Math.round(44 * scale);
  const padBottom = Math.round(52 * scale);
  const blockHeight = ruleHeight + padTop + fit.boxes[0] + fit.boxes[1] + padBottom;
  const top = box.top + Math.max(0, Math.round((box.height - blockHeight) / 2));

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
          <KineticText text={LINES[0]} mode="slam" startFrame={0} align="center" style={{ ...lineStyle, color: COLORS.canvas }} />
        </div>
        <div style={{ height: fit.boxes[1] }}>
          <KineticText text={LINES[1]} mode="slam" startFrame={0} align="center" style={{ ...lineStyle, color: COLORS.amber }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
