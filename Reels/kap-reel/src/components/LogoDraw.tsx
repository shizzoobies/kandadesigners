// The K&A lockup drawing itself, ported frame for frame from the live site's
// src/components/LogoIntroAnimation.astro (which is itself a port of the
// "KA Logo Animation" design source). The site drives one render(T) function
// off a GSAP clock; this drives the same function off Remotion's frame, so the
// motion is identical and every frame is a pure function of its frame number.
//
// What is the same as the site, deliberately:
//   - the 1340x548 authored stage, so every coordinate below is the design
//     coordinate with no conversion
//   - the easings, the cue times, and the per element maths in render()
//   - the ampersand at left 515, which is the site's corrected position. The
//     design export uses 545 and the owner has ruled that one off.
//
// What is different:
//   - no GSAP, no session storage, no scroll hand back, no reduced motion
//     branch. A video has none of those.
//   - the path length and the tip position come from @remotion/paths rather
//     than from SVGPathElement.getTotalLength(), so nothing is measured from
//     the DOM at render time. The two agree to within about 0.1 percent.
//   - the site multiplies its scale by a BUMP of 1.12 so the drawn linework
//     reads at the same visual weight as the static mark it sits on top of.
//     There is no static mark underneath here, and BUMP is a uniform scale, so
//     it changes nothing about the proportions. It is left out: `width` means
//     the stage is that wide. A caller who wants it bigger passes a bigger
//     width.

import { getLength, getPointAtLength } from "@remotion/paths";
import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../lib/brand";

/** The authored stage. Every coordinate in this file is in these units. */
const STAGE_W = 1340;
const STAGE_H = 548;

/** The browser frame the mouse drags into being, straight from the source. */
const PATH_D =
  "M 195 500 L 63 500 Q 47 500 47 484 L 47 61 Q 47 45 63 45 L 1221 45 Q 1237 45 1237 61 L 1237 336 Q 1237 356 1243.5 366";

const TOTAL_LENGTH = getLength(PATH_D);

/**
 * getPointAtLength is typed nullable because a length off the end of the path
 * has no point. The clamp rules that out, so the fallback is unreachable and
 * only exists to keep the call site free of null checks.
 */
const pointAt = (length: number): { x: number; y: number } => {
  const clamped = Math.max(0, Math.min(TOTAL_LENGTH, length));
  return getPointAtLength(PATH_D, clamped) ?? { x: 0, y: 0 };
};

/** The lockup's own palette, which is not the reel's palette. */
const INK = "#2a2422";
const RUST = "#a93c1c";
const TAUPE = "#8b6f5c";
const TEAL = "#2e7d74";
/**
 * The mouse body is a hole punched in the artwork rather than a colour of it,
 * so it takes the reel's canvas rather than the site's. The site uses
 * var(--color-canvas), which is the same idea.
 */
const MOUSE_BODY = COLORS.canvas;

/** Cue sheet from the design source: Draw 3s, Letters 2.2s, Wordmark 1.8s. */
const DRAW = 0;
const LETTERS = 3;
const WORDMARK = 5.2;
/** The source holds two seconds then fades to loop. This freezes instead. */
const END = 7;

const DOT_XS = [90, 140, 190];
const DOT_COLORS = [TAUPE, RUST, TEAL];
const DOT_Y = 88;
const WORD = "PERFORMANCE".split("");

/**
 * Length along the path at which the tip reaches the top edge at x = 63, which
 * is where the dot timing is measured from. The site hardcodes the browser's
 * 605.2; this derives it from the path so the number belongs to the same
 * flattening as the getPointAtLength calls below. @remotion/paths gives
 * 606.94, a 1.7 unit disagreement with the DOM, which is under 0.1 percent of
 * the path and about 3 hundredths of a second of draw.
 */
const TOP_EDGE_AT = ((): number => {
  const TOP_Y = 45;
  const CORNER_X = 63;
  const atTopEdge = (length: number): boolean => {
    const p = pointAt(length);
    return p.y <= TOP_Y + 1e-4 && p.x >= CORNER_X;
  };
  // Coarse scan first: the predicate is true only on the top run, so a plain
  // bisection over the whole path is not safe.
  let coarse = -1;
  for (let length = 0; length <= TOTAL_LENGTH; length += 2) {
    if (atTopEdge(length)) {
      coarse = length;
      break;
    }
  }
  if (coarse < 0) return 605.2;
  let lo = coarse - 2;
  let hi = coarse;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (atTopEdge(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
})();

const DOT_LENGTHS = DOT_XS.map((x) => TOP_EDGE_AT + (x - 63));

// --- easings, ported from the design source ---
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutCubic = (p: number): number => 1 - Math.pow(1 - p, 3);
const easeInOutCubic = (p: number): number =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const easeOutBack = (p: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};
const seg = (
  T: number,
  start: number,
  end: number,
  ease: (p: number) => number,
): number => ease(clamp01((T - start) / (end - start)));

const enter = (T: number, start: number, duration = 0.7) => {
  const p = seg(T, start, start + duration, easeOutCubic);
  return { opacity: p, y: (1 - p) * 46 };
};

export type LogoDrawProps = {
  /**
   * Frames the authored seven second choreography is compressed into. The
   * whole piece is scaled uniformly: T = frame / durationFrames * 7.
   */
  durationFrames: number;
  /** Rendered width of the stage in canvas pixels. Aspect is 1340:548. */
  width: number;
  /**
   * Frame at which the clock freezes. Defaults to `durationFrames`, which is
   * the finished lockup, so any frame past the draw holds it. Set it lower to
   * freeze part way through, for a still or a poster frame.
   */
  holdFromFrame?: number;
  style?: CSSProperties;
};

/**
 * Everything below is one render(T) exactly as the source writes it: no
 * per-element tweens, no refs, no measurement. Give it the same frame twice
 * and it draws the same pixels.
 */
export const LogoDraw: React.FC<LogoDrawProps> = ({
  durationFrames,
  width,
  holdFromFrame,
  style,
}) => {
  const frame = useCurrentFrame();

  const holdFrame = holdFromFrame ?? durationFrames;
  const clockFrame = Math.min(frame, holdFrame);
  const T =
    durationFrames <= 0
      ? END
      : Math.min(END, (clockFrame / durationFrames) * END);

  const scale = width / STAGE_W;

  const prog = seg(T, DRAW + 0.35, DRAW + 0.35 + 2.5, easeInOutCubic);

  const tipLength = prog * TOTAL_LENGTH;
  const tip = pointAt(tipLength);
  const back = pointAt(Math.max(0, tipLength - 30));
  const dir = Math.atan2(tip.y - back.y, tip.x - back.x);
  // mAmt drives the tilt only, exactly as the source does. The mouse itself
  // stays on the tail of the path at full opacity, which is what the finished
  // artwork in assets/brand/logo/logo-lockup.webp shows.
  const mAmt =
    prog <= 0 ? 0 : prog >= 1 ? 0 : Math.min(1, prog / 0.06, (1 - prog) / 0.12);
  const rot = Math.cos(dir) * 9 * mAmt;
  const mouseIn = seg(T, DRAW, DRAW + 0.35, easeOutBack);

  // Click pulse as the letters start.
  const L = LETTERS;
  const press =
    1 -
    0.09 *
      (T < L
        ? 0
        : T < L + 0.14
          ? (T - L) / 0.14
          : T < L + 0.34
            ? 1 - (T - L - 0.14) / 0.2
            : 0);

  const k = enter(T, L + 0.12);
  const a = enter(T, L + 0.72);
  const ampP = seg(T, L + 0.42, L + 1.15, easeOutBack);
  const ampO = seg(T, L + 0.42, L + 0.75, easeOutCubic);

  const letter: CSSProperties = {
    position: "absolute",
    fontFamily: '"KA Playfair", Georgia, serif',
    lineHeight: 1,
  };

  return (
    <div
      style={{
        position: "relative",
        width,
        height: (width * STAGE_H) / STAGE_W,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: STAGE_W,
          height: STAGE_H,
          transformOrigin: "0 0",
          transform: `scale(${scale})`,
        }}
      >
        <svg
          width={STAGE_W}
          height={STAGE_H}
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          <path
            d={PATH_D}
            fill="none"
            stroke={TAUPE}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={TOTAL_LENGTH}
            strokeDashoffset={TOTAL_LENGTH * (1 - prog)}
          />
          {DOT_XS.map((x, i) => (
            <circle
              key={x}
              cx={x}
              cy={DOT_Y}
              r={10}
              fill="none"
              stroke={DOT_COLORS[i]}
              strokeWidth={5}
              style={{
                transformBox: "view-box",
                transformOrigin: `${x}px ${DOT_Y}px`,
                transform: `scale(${easeOutBack(
                  clamp01((tipLength - DOT_LENGTHS[i]) / 90),
                )})`,
              }}
            />
          ))}
        </svg>

        <div
          style={{
            ...letter,
            left: 230,
            top: 100,
            fontWeight: 500,
            fontSize: 330,
            color: INK,
            opacity: k.opacity,
            transform: `translateY(${k.y}px)`,
          }}
        >
          K
        </div>
        <div
          style={{
            ...letter,
            left: 515,
            top: 108,
            fontWeight: 600,
            fontStyle: "italic",
            fontSize: 320,
            color: RUST,
            transformOrigin: "50% 60%",
            opacity: ampO,
            transform: `scale(${0.55 + 0.45 * ampP})`,
          }}
        >
          &amp;
        </div>
        <div
          style={{
            ...letter,
            left: 830,
            top: 100,
            fontWeight: 500,
            fontSize: 330,
            color: INK,
            opacity: a.opacity,
            transform: `translateY(${a.y}px)`,
          }}
        >
          A
        </div>

        <div
          style={{ position: "absolute", left: 236, top: 474, display: "flex" }}
        >
          {WORD.map((glyph, i) => {
            const e = enter(T, WORDMARK + i * 0.07, 0.5);
            return (
              <span
                // The wordmark has repeated letters, so the index is the key.
                key={i}
                style={{
                  width: 77,
                  textAlign: "center",
                  fontFamily: '"KA Poppins", system-ui, sans-serif',
                  fontWeight: 500,
                  fontSize: 46,
                  lineHeight: 1,
                  color: TAUPE,
                  opacity: e.opacity,
                  transform: `translateY(${e.y * 0.5}px)`,
                }}
              >
                {glyph}
              </span>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            width: 88,
            height: 148,
            transformOrigin: "50% 20%",
            left: tip.x - 44,
            top: tip.y - 4,
            opacity: mouseIn,
            transform: `rotate(${rot}deg) scale(${press})`,
          }}
        >
          <svg width={88} height={148} viewBox="0 0 88 148">
            <rect
              x={3}
              y={3}
              width={82}
              height={142}
              rx={41}
              fill={MOUSE_BODY}
              stroke={TAUPE}
              strokeWidth={5}
            />
            <rect
              x={37}
              y={26}
              width={14}
              height={34}
              rx={7}
              fill="none"
              stroke={INK}
              strokeWidth={5}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
