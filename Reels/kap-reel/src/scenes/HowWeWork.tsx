import { AbsoluteFill, Img } from "remotion";
import { KineticText } from "../components/KineticText";
import { COLORS, DISPLAY_STACK, LOGO_PNG } from "../lib/brand";
import { formatMetrics, safeArea, type FormatKey } from "../lib/layout";
import { LINKEDIN_HOW_WE_WORK_LINES } from "../lib/timing";

export type HowWeWorkProps = {
  format: FormatKey;
};

/**
 * Frames 36 to 156 of the LinkedIn cut, 120 frames. The Section 6 insert: how
 * the studio actually works, said in three short sentences on the brand canvas.
 *
 * This is the one beat with no site capture in it, which is the point. It sits
 * directly after the hook so the claim "there is a real person on the phone"
 * lands before the work does. Section 15 bans slow fades, so the lines type on
 * and then hold: each arrives 30 frames after the one above it and all three
 * are still on screen at the cut.
 */
const LINES = ["A real person.", "A direct number.", "No ticket queue."];

/** Type size at 1080 canvas width. Well over the Section 7 body minimum of 48. */
const LINE_FONT_SIZE = 84;

/** Frames each line takes to type on. The last one finishes by frame 74. */
const REVEAL_FRAMES = 14;

const LINE_HEIGHT = 1.08;

/**
 * The lockup sits small in the top left of the safe area, not centred. A
 * centred logo on a text card reads as a title card and this beat is not a
 * title. Section 15 also caps logo animation at one second, so it does not
 * animate at all here: it is present from the first frame and it holds.
 *
 * It gets its own row rather than being absolutely positioned over the copy.
 * The first version floated it and centred the three lines on the whole safe
 * area, and in landscape, where the type scale is 1.778, the block grew tall
 * enough to run its accent rule straight through the lockup.
 */
const LOGO_WIDTH = 240;
const LOGO_ASPECT = 303 / 800;

export const HowWeWork: React.FC<HowWeWorkProps> = ({ format }) => {
  const safe = safeArea(format);
  const metrics = formatMetrics(format);
  const scale = metrics.typeScale;

  const padLeft = Math.round(72 * scale);
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
  const fontSize = Math.max(
    Math.round(48 * scale),
    Math.min(
      Math.round(LINE_FONT_SIZE * scale),
      Math.floor(roomForLines / (LINES.length * LINE_HEIGHT)),
    ),
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.canvas }}>
      <div
        style={{
          position: "absolute",
          left: safe.left + padLeft,
          // Stops well short of the reserved right strip in every crop.
          width: safe.right - safe.left - padLeft * 2,
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

          {LINES.map((line, i) => (
            <div
              key={line}
              style={{ marginBottom: i < LINES.length - 1 ? lineGap : 0 }}
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
