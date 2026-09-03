import { AbsoluteFill } from "remotion";
import { KineticText } from "../components/KineticText";
import { COLORS, DISPLAY_STACK } from "../lib/brand";
import { formatMetrics, safeArea, type FormatKey } from "../lib/layout";
import { numberWord, perfectAccessibilityCount } from "../lib/metrics";
import { LINKEDIN_ACCESSIBILITY_LINES } from "../lib/timing";

export type AccessibilityBeatProps = {
  format: FormatKey;
};

/**
 * Frames 1076 to 1226 of the LinkedIn cut, 150 frames. The Section 6 insert
 * that only exists in this cut, because accessibility is a differentiator on
 * LinkedIn in a way it is not on Facebook.
 *
 * The only beat on the dark teal band from config/brand.json: dark_canvas
 * behind, dark_ink type, dark_accent on the rule. It reads as a different
 * register from the warm project beats, which is the intent: this is the
 * studio speaking about its own standards rather than showing client work.
 */

/** Type size at 1080 canvas width. Section 7 body minimum is 48. */
const LINE_FONT_SIZE = 68;

/** Frames each line takes to type on. Section 7 bans fades, so nothing fades. */
const REVEAL_FRAMES = 16;

/**
 * Below this many perfect scores the middle line does not go on screen at all.
 * Two sites is not a pattern and Section 0 forbids dressing one up as one.
 */
const MIN_PERFECT_SCORES = 3;

export const AccessibilityBeat: React.FC<AccessibilityBeatProps> = ({
  format,
}) => {
  const safe = safeArea(format);
  const metrics = formatMetrics(format);
  const scale = metrics.typeScale;

  // Section 14 item 2: every on-screen number traces to config/metrics.json.
  // The count of perfect accessibility scores is derived from the measured
  // Lighthouse results at build time, never typed as a literal, so a
  // re-measure that drops a site below 100 changes this line rather than
  // leaving a stale claim in the video. Below MIN_PERFECT_SCORES the line is
  // not rendered at all.
  const perfect = perfectAccessibilityCount();
  const showCount = perfect >= MIN_PERFECT_SCORES;

  const lines: string[] = [
    "Built to WCAG 2.2 AA.",
    showCount
      ? `${numberWord(perfect)} of these sites score 100 on accessibility.`
      : "",
    "Measured, not promised.",
  ];

  const fontSize = Math.round(LINE_FONT_SIZE * scale);
  const padLeft = Math.round(72 * scale);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark_canvas }}>
      <div
        style={{
          position: "absolute",
          left: safe.left + padLeft,
          // Stops short of the reserved right strip in every crop.
          width: safe.right - safe.left - padLeft * 2,
          top: safe.top,
          height: safe.height,
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
            height: Math.round(8 * scale),
            backgroundColor: COLORS.dark_accent,
            marginBottom: Math.round(44 * scale),
            marginLeft: "auto",
            marginRight: "auto",
          }}
        />

        {lines.map((line, i) =>
          line === "" ? null : (
            <div
              key={line}
              style={{ marginBottom: i < lines.length - 1 ? Math.round(30 * scale) : 0 }}
            >
              <KineticText
                text={line}
                mode="type"
                startFrame={LINKEDIN_ACCESSIBILITY_LINES[i]}
                revealFrames={REVEAL_FRAMES}
                align="center"
                // All three boxes exist from frame 0, so the centred block
                // does not shift upward each time a line arrives.
                reserveSpace
                style={{
                  fontFamily: DISPLAY_STACK,
                  fontSize,
                  fontWeight: 700,
                  letterSpacing: -1 * scale,
                  lineHeight: 1.12,
                  // dark_ink on dark_canvas, the site's own dark band pairing.
                  // Far past 4.5:1.
                  color: COLORS.dark_ink,
                  textWrap: "balance",
                }}
              />
            </div>
          ),
        )}
      </div>
    </AbsoluteFill>
  );
};
