import { AbsoluteFill, Img } from "remotion";
import { KineticText } from "../components/KineticText";
import { COLORS, DISPLAY_STACK, LOGO_PNG } from "../lib/brand";
import {
  centeredBox,
  centeredPadding,
  formatMetrics,
  safeArea,
  SAFE_ZONES,
  type FormatKey,
} from "../lib/layout";
import { LINKEDIN_HOW_WE_WORK_LINES } from "../lib/timing";

/**
 * Frames 36 to 156 of the LinkedIn cut, 120 frames. The Section 6 insert: how
 * the studio actually works, said in three short sentences on the brand canvas.
 *
 * This is the one beat with no site capture in it, which is the point. It sits
 * directly after the hook so the claim about how the studio works lands before
 * the work does. Section 15 bans slow fades, so the lines type on and then
 * hold: each arrives 30 frames after the one above it and all three are still
 * on screen at the cut.
 */
export type HowWeWorkProps = {
  format: FormatKey;
  /** The three lines, from the reel's content config. */
  lines: string[];
};

/** Type size at 1080 canvas width. Well over the Section 7 body minimum of 48. */
const LINE_FONT_SIZE = 84;

/** Frames each line takes to type on. The last one finishes by frame 74. */
const REVEAL_FRAMES = 14;

const LINE_HEIGHT = 1.08;

/**
 * Average character advance of the display face in a mixed-case sentence, as a
 * fraction of the type size. Measured off Schibsted Grotesk at weight 700, and
 * only ever used to decide whether a line would wrap, never to position
 * anything, so an approximation is the right tool.
 */
const AVG_ADVANCE = 0.52;

/**
 * The lockup sits small at the top of the column. Section 15 caps logo
 * animation at one second, so it does not animate at all here: it is present
 * from the first frame and it holds.
 *
 * It gets its own row rather than being absolutely positioned over the copy.
 * The first version floated it and centred the three lines on the whole safe
 * area, and in landscape, where the type scale is 1.778, the block grew tall
 * enough to run its accent rule straight through the lockup.
 *
 * Owner decision 2026-09-04: the lockup centres on the canvas like everything
 * else. It used to hang off the left of the column, which put the frame's ink
 * 62 pixels left of the canvas centre even with the copy centred, and that is
 * what the owner was measuring.
 */
const LOGO_WIDTH = 240;
const LOGO_ASPECT = 303 / 800;

export const HowWeWork: React.FC<HowWeWorkProps> = ({ format, lines }) => {
  const safe = safeArea(format);
  const metrics = formatMetrics(format);
  const scale = metrics.typeScale;

  // The column, centred on the canvas rather than on the safe area.
  const column = centeredBox(
    format,
    SAFE_ZONES[format].width - centeredPadding(format, scale) * 2,
  );
  const lineGap = Math.round(26 * scale);
  const ruleHeight = Math.round(8 * scale);
  const ruleGap = Math.round(44 * scale);

  const logoWidth = Math.round(Math.min(LOGO_WIDTH * scale, safe.width * 0.26));
  const logoHeight = Math.round(logoWidth * LOGO_ASPECT);
  const headerHeight = logoHeight + Math.round(40 * scale);

  // Cap the type against what is left below the lockup rather than trusting
  // the type scale alone. Landscape is only 1080 tall and three lines at
  // 1.778 scale plus the rule is most of that.
  const bodyHeight = safe.height - headerHeight;
  const roomForLines = bodyHeight - ruleHeight - ruleGap - lineGap * 2;

  // And cap it against the column's width, so a longer set of lines stays one
  // line each rather than silently wrapping to six. The reveal hides characters
  // with visibility rather than slicing the string, so a wrap would be there
  // from frame 0 and would double the block's height against a layout that
  // reserved three lines. AVG_ADVANCE is the average character width of the
  // display face in a mixed-case sentence, as a fraction of the type size.
  const longest = Math.max(...lines.map((line) => line.length), 1);
  const widthCap = Math.floor(column.width / (longest * AVG_ADVANCE));

  const fontSize = Math.max(
    Math.round(48 * scale),
    Math.min(
      Math.round(LINE_FONT_SIZE * scale),
      Math.floor(roomForLines / (lines.length * LINE_HEIGHT)),
      widthCap,
    ),
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.canvas }}>
      <div
        style={{
          position: "absolute",
          left: column.left,
          width: column.width,
          top: safe.top,
          height: safe.height,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ height: headerHeight, flexShrink: 0 }}>
          <Img
            src={LOGO_PNG}
            style={{
              marginTop: Math.round(24 * scale),
              marginLeft: "auto",
              marginRight: "auto",
              width: logoWidth,
              height: logoHeight,
              display: "block",
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* The same short rectangular rule the claim lines use. No pills.
              Owner decision 2026-09-03: the copy is centred, so the rule is
              centred over it rather than hung off the left of the block. */}
          <div
            style={{
              width: Math.round(88 * scale),
              height: ruleHeight,
              backgroundColor: COLORS.accent,
              marginBottom: ruleGap,
              marginLeft: "auto",
              marginRight: "auto",
              flexShrink: 0,
            }}
          />

          {lines.map((line, i) => (
            <div
              key={line}
              style={{ marginBottom: i < lines.length - 1 ? lineGap : 0 }}
            >
              <KineticText
                text={line}
                mode="type"
                startFrame={LINKEDIN_HOW_WE_WORK_LINES[i]}
                revealFrames={REVEAL_FRAMES}
                align="center"
                // All three boxes exist from frame 0, so the block does not
                // shift upward each time a line arrives.
                reserveSpace
                style={{
                  fontFamily: DISPLAY_STACK,
                  fontSize,
                  fontWeight: 700,
                  letterSpacing: -1.5 * scale,
                  lineHeight: LINE_HEIGHT,
                  // Ink on canvas, the site's own pairing. Far past 4.5:1.
                  color: COLORS.ink,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
