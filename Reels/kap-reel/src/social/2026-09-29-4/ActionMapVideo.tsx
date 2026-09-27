// "Most courses start in the wrong place", Tue 2026-09-29 12:00 PM LinkedIn
// video (training, Action Mapping).
//
// Text led, no narration. A trail map on cream paper: the usual route
// (everything they should know, quiz, dead end) fades, and a rust route draws
// itself between four numbered pins: the goal, the actions, practice, and
// only then what people need to know. A practice scenario card shows a
// consequence instead of "wrong", a pile of info cards shrinks to the
// essentials, and a detour sign says sometimes the answer isn't a course.
// Action Mapping is Cathy Moore's model; she is credited on the CTA frame.
// No AI tool or vendor names.
//
// The K&A lockup and ka-performancefl.com sit in a brand row at the top of
// every frame. 1080x1350, everything inside a 44 px margin.

import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, useCurrentFrame } from "remotion";
import "../../lib/fonts";
import { BODY_STACK, COLORS, DISPLAY_STACK, LOGO_PNG } from "../../lib/brand";
import { BEATS, COPY, CUE, PIN_LABELS } from "./timeline";

const W = 1080;
const H = 1350;
const LEFT = 44;
const RIGHT = W - 44;
const WIDTH = RIGHT - LEFT; // 992

const BRAND_TOP = 34;
const LOGO_H = 74;
const RULE_Y = BRAND_TOP + LOGO_H + 14; // 122
const CONTENT_TOP = RULE_Y + 6; // 128

const CREAM = COLORS.canvas;
const PAPER = COLORS.surface;
const TEAL = COLORS.dark_canvas; // #0B302D
const CONTOUR = "#E7DDD0";

const HEAD_TOP = 158;
const MAP_TOP = 360;

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const ramp = (f: number, start: number, len: number) =>
  interpolate(f, [start, start + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const lin = (f: number, start: number, end: number) =>
  interpolate(f, [start, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

// ---------------------------------------------------------------------------
// Brand row: on every frame.
// ---------------------------------------------------------------------------

const BrandRow: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: CONTENT_TOP, background: CREAM }} />
    <Img src={LOGO_PNG} style={{ position: "absolute", left: LEFT, top: BRAND_TOP, height: LOGO_H, width: "auto" }} />
    <div
      style={{
        position: "absolute",
        right: W - RIGHT,
        top: BRAND_TOP,
        height: LOGO_H,
        display: "flex",
        alignItems: "center",
        fontFamily: DISPLAY_STACK,
        fontWeight: 800,
        fontSize: 38,
        color: COLORS.ink,
        letterSpacing: "-0.01em",
      }}
    >
      ka-performancefl.com
    </div>
    <div style={{ position: "absolute", left: LEFT, top: RULE_Y, width: WIDTH, height: 6, background: COLORS.accent }} />
  </>
);

// ---------------------------------------------------------------------------
// Headlines: one at a time in the band above the map.
// ---------------------------------------------------------------------------

type Line = { text: string; start: number; end: number; color?: string };

const LINES: Line[] = [
  { text: COPY.hook, start: 0, end: BEATS.hook.end },
  { text: COPY.goal, start: BEATS.goal.start, end: BEATS.goal.end },
  { text: COPY.actions, start: BEATS.actions.start, end: CUE.pin3 - 20 },
  { text: COPY.practice, start: CUE.pin3 - 20, end: CUE.consequenceLine },
  { text: COPY.consequenceLine, start: CUE.consequenceLine, end: BEATS.scenario.end, color: COLORS.accent },
  { text: COPY.know, start: BEATS.know.start, end: BEATS.know.end },
  { text: COPY.detour, start: BEATS.detour.start, end: BEATS.detour.end },
];

const Headlines: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {LINES.map((l) => {
        if (f < l.start || f >= l.end) return null;
        const p = l.start === 0 ? 1 : ramp(f, l.start, 8);
        return (
          <div
            key={l.text}
            style={{
              position: "absolute",
              left: LEFT,
              top: HEAD_TOP,
              width: WIDTH,
              fontFamily: DISPLAY_STACK,
              fontWeight: 900,
              fontSize: 80,
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
              color: l.color ?? COLORS.ink,
              opacity: p,
              transform: `translateY(${(1 - p) * 18}px)`,
            }}
          >
            {l.text}
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Map pieces
// ---------------------------------------------------------------------------

const Paper: React.FC = () => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
    <rect x={LEFT} y={MAP_TOP} width={WIDTH} height={H - MAP_TOP - 44} fill={PAPER} stroke={CONTOUR} strokeWidth={3} />
    {/* Contour lines. */}
    {[0, 1, 2, 3, 4].map((i) => (
      <path
        key={`a${i}`}
        d={`M ${LEFT} ${520 + i * 46} C ${300} ${470 + i * 40}, ${520} ${640 + i * 30}, ${RIGHT} ${560 + i * 44}`}
        fill="none"
        stroke={CONTOUR}
        strokeWidth={3}
      />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <ellipse key={`b${i}`} cx={640} cy={1110} rx={90 + i * 70} ry={50 + i * 40} fill="none" stroke={CONTOUR} strokeWidth={3} />
    ))}
    {/* North arrow. */}
    <g transform={`translate(${RIGHT - 60}, ${H - 150})`}>
      <path d="M 0 -30 L 14 16 L 0 6 L -14 16 Z" fill={COLORS.ink} />
      <text x={0} y={46} textAnchor="middle" fontFamily={BODY_STACK} fontWeight={800} fontSize={26} fill={COLORS.ink}>
        N
      </text>
    </g>
  </svg>
);

/** A path that draws itself: p 0..1. */
const DrawPath: React.FC<{ id: string; d: string; p: number; color: string; width: number; dash?: string; opacity?: number }> = ({
  id,
  d,
  p,
  color,
  width,
  dash,
  opacity = 1,
}) =>
  p <= 0.001 ? null : (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity }}>
    <defs>
      <mask id={`m-${id}`}>
        <path d={d} pathLength={1} fill="none" stroke="#fff" strokeWidth={width + 8} strokeDasharray={`${p} 1`} strokeLinecap="round" />
      </mask>
    </defs>
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={dash}
      mask={`url(#m-${id})`}
    />
  </svg>
);

/** Map label: uppercase, spaced, on a paper patch. */
const MapLabel: React.FC<{ x: number; y: number; align?: "left" | "right"; color?: string; size?: number; children: ReactNode; style?: CSSProperties }> = ({
  x,
  y,
  align = "left",
  color = COLORS.ink,
  size = 30,
  children,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      top: y,
      ...(align === "left" ? { left: x } : { right: W - x }),
      padding: "4px 10px",
      background: PAPER,
      fontFamily: BODY_STACK,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/** A numbered map pin; (x, y) is the tip. */
const Pin: React.FC<{ x: number; y: number; n: number; at: number; color?: string }> = ({ x, y, n, at, color = COLORS.accent }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const drop = interpolate(f, [at, at + 8, at + 12, at + 15], [-70, 0, -10, 0], { extrapolateRight: "clamp" });
  const o = ramp(f, at, 5);
  return (
    <div style={{ position: "absolute", left: x - 40, top: y - 104, width: 80, height: 110, opacity: o }}>
      <div style={{ position: "absolute", left: 18, top: 96, width: 44, height: 12, borderRadius: "50%", background: "rgba(34,28,21,0.18)" }} />
      <svg width={80} height={104} viewBox="0 0 80 104" style={{ position: "absolute", left: 0, top: drop }}>
        <path d="M40 104 C 30 80, 2 66, 2 40 A 38 38 0 1 1 78 40 C 78 66, 50 80, 40 104 Z" fill={color} stroke={TEAL} strokeWidth={3} />
        <circle cx={40} cy={40} r={26} fill={CREAM} />
        <text x={40} y={53} textAnchor="middle" fontFamily={DISPLAY_STACK} fontWeight={900} fontSize={38} fill={TEAL}>
          {n}
        </text>
      </svg>
    </div>
  );
};

// Pins, tips at these points.
const P = [
  { x: 150, y: 1210 },
  { x: 860, y: 1020 },
  { x: 190, y: 820 },
  { x: 870, y: 600 },
];

const SEG = [
  `M ${P[0].x} ${P[0].y} C 420 1240, 640 1160, ${P[1].x} ${P[1].y}`,
  `M ${P[1].x} ${P[1].y} C 1000 920, 520 930, ${P[2].x} ${P[2].y}`,
  `M ${P[2].x} ${P[2].y} C 30 740, 560 700, ${P[3].x} ${P[3].y}`,
];

const OLD_ROUTE = "M 150 1200 C 380 1180, 420 1010, 560 990 C 720 970, 760 820, 900 770";

// ---------------------------------------------------------------------------
// The map scene: 0 to 12 s and 20 to 27 s (the scenario covers 12 to 20 s).
// ---------------------------------------------------------------------------

const MapScene: React.FC = () => {
  const f = useCurrentFrame();
  const dim =
    f >= BEATS.scenario.start && f < BEATS.know.start
      ? 1 - 0.8 * ramp(f, BEATS.scenario.start, 8) + 0.8 * ramp(f, BEATS.know.start - 8, 8)
      : f >= BEATS.detour.start
        ? 1 - 0.78 * ramp(f, BEATS.detour.start, 8)
        : 1;
  const oldP = lin(f, CUE.oldRoute[0], CUE.oldRoute[1]);
  const oldO = 1 - ramp(f, CUE.oldFade, 12);
  const callout = ramp(f, CUE.goalCallout, 8) * (1 - ramp(f, BEATS.goal.end - 6, 6));
  const segP = [lin(f, CUE.seg1[0], CUE.seg1[1]), lin(f, CUE.seg2[0], CUE.seg2[1]), lin(f, CUE.seg3[0], CUE.seg3[1])];
  const pinAt = [CUE.pin1, CUE.pin2, CUE.pin3, CUE.pin4];
  const label = (i: number) => ramp(f, pinAt[i] + 8, 6);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: dim }}>
        <Paper />
        {/* The usual route, to a dead end. */}
        {oldO > 0 ? (
          <div style={{ position: "absolute", inset: 0, opacity: oldO }}>
            <DrawPath id="old" d={OLD_ROUTE} p={oldP} color={COLORS.muted} width={10} dash="2 22" />
            <MapLabel x={84} y={1234} size={28} style={{ opacity: ramp(f, 2, 6) }}>
              {COPY.oldStart}
            </MapLabel>
            <div style={{ position: "absolute", left: 540, top: 972, width: 36, height: 36, background: COLORS.muted, opacity: ramp(f, CUE.oldQuiz, 5) }} />
            <MapLabel x={520} y={900} size={34} style={{ opacity: ramp(f, CUE.oldQuiz, 6) }}>
              {COPY.oldQuiz}
            </MapLabel>
            <div style={{ opacity: ramp(f, CUE.oldDeadEnd, 6) }}>
              <div style={{ position: "absolute", left: 912, top: 720, width: 14, height: 100, background: COLORS.accent, transform: "rotate(18deg)" }} />
              <div
                style={{
                  position: "absolute",
                  right: W - 980,
                  top: 600,
                  padding: "10px 18px",
                  background: COLORS.accent,
                  color: CREAM,
                  fontFamily: DISPLAY_STACK,
                  fontWeight: 900,
                  fontSize: 48,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {COPY.deadEnd}
              </div>
            </div>
          </div>
        ) : null}
        {/* The action map route. */}
        {SEG.map((d, i) => (
          <div key={d}>
            <DrawPath id={`h${i}`} d={d} p={segP[i]} color={COLORS.accent} width={22} opacity={0.18} />
            <DrawPath id={`s${i}`} d={d} p={segP[i]} color={COLORS.accent} width={10} />
          </div>
        ))}
        {P.map((pt, i) => (
          <Pin key={i} x={pt.x} y={pt.y} n={i + 1} at={pinAt[i]} color={i === 3 ? COLORS.amber : COLORS.accent} />
        ))}
        <MapLabel x={P[0].x + 56} y={P[0].y - 62} size={32} style={{ opacity: label(0) * (1 - callout) }}>
          {PIN_LABELS[0]}
        </MapLabel>
        <MapLabel x={P[1].x - 56} y={P[1].y - 62} align="right" size={32} style={{ opacity: label(1) }}>
          {PIN_LABELS[1]}
        </MapLabel>
        <MapLabel x={P[2].x + 56} y={P[2].y - 62} size={32} style={{ opacity: label(2) }}>
          {PIN_LABELS[2]}
        </MapLabel>
        <MapLabel x={P[3].x + 60} y={P[3].y - 164} align="right" size={32} style={{ opacity: label(3) }}>
          {PIN_LABELS[3]}
        </MapLabel>
        {/* Pin 1 callout. */}
        <div
          style={{
            position: "absolute",
            left: P[0].x + 60,
            top: P[0].y - 200,
            width: RIGHT - 40 - (P[0].x + 60),
            boxSizing: "border-box",
            padding: "22px 28px",
            background: TEAL,
            borderLeft: `12px solid ${COLORS.amber}`,
            opacity: callout,
            transform: `translateY(${(1 - callout) * 20}px)`,
          }}
        >
          <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 900, fontSize: 50, lineHeight: 1.05, color: COLORS.dark_ink }}>{COPY.goalLine}</div>
          <div style={{ marginTop: 12, fontFamily: BODY_STACK, fontWeight: 600, fontStyle: "italic", fontSize: 36, color: COLORS.amber }}>
            {COPY.goalExample}
          </div>
        </div>
        <Pile />
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Pin 4: a pile of info cards shrinks to the essentials, 20 to 24 s.
// ---------------------------------------------------------------------------

const PILE = [
  { dx: -30, dy: 20, r: -9 },
  { dx: 40, dy: -10, r: 7 },
  { dx: -10, dy: -30, r: -3 },
  { dx: 60, dy: 30, r: 11 },
  { dx: -50, dy: -10, r: -14 },
  { dx: 20, dy: 40, r: 4 },
  { dx: 0, dy: 0, r: -2 }, // kept
  { dx: 44, dy: 8, r: 5 }, // kept
];
const KEEP = new Set([6, 7]);

const Pile: React.FC = () => {
  const f = useCurrentFrame();
  if (f < CUE.pileIn || f >= BEATS.detour.start) return null;
  const cx = 290;
  const cy = 520;
  const tag = ramp(f, CUE.essentials, 8);
  return (
    <>
      {PILE.map((c, i) => {
        const inP = ramp(f, CUE.pileIn + i * 2, 8);
        const outAt = CUE.pileShrink + i * 4;
        const out = KEEP.has(i) ? 0 : ramp(f, outAt, 10);
        const settle = KEEP.has(i) ? ramp(f, CUE.essentials - 10, 10) : 0;
        const k = i === 6 ? -1 : 1;
        const x = cx + c.dx * (1 - settle) + (KEEP.has(i) ? k * 124 * settle : 0) + out * (i % 2 ? 420 : -420);
        const y = cy + c.dy * (1 - settle) - out * 160;
        const r = c.r * (1 - settle) + out * (i % 2 ? 30 : -30);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - 120,
              top: y - 80,
              width: 240,
              height: 160,
              boxSizing: "border-box",
              background: KEEP.has(i) && settle > 0.5 ? CREAM : "#FFFFFF",
              border: `4px solid ${KEEP.has(i) && settle > 0.5 ? COLORS.accent : COLORS.ink}`,
              transform: `rotate(${r}deg) scale(${0.8 + 0.2 * inP})`,
              opacity: inP * (1 - out),
              padding: "22px 20px",
            }}
          >
            {[0.9, 0.7, 0.8, 0.5].map((w, j) => (
              <div key={j} style={{ height: 12, width: `${w * 100}%`, background: j === 0 ? COLORS.ink : "#CFC6BA", marginBottom: 14 }} />
            ))}
          </div>
        );
      })}
      <MapLabel x={cx} y={cy + 110} size={32} color={COLORS.accent} style={{ opacity: tag, transform: "translateX(-50%)" }}>
        {COPY.essentials}
      </MapLabel>
    </>
  );
};

// ---------------------------------------------------------------------------
// Practice scenario card, 12 to 20 s
// ---------------------------------------------------------------------------

const CARD_TOP = 384;

const Choice: React.FC<{ y: number; letter: string; text: string; picked: number; o: number }> = ({ y, letter, text, picked, o }) => (
  <div
    style={{
      position: "absolute",
      left: LEFT + 36,
      top: y,
      width: WIDTH - 72,
      height: 96,
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      gap: 24,
      padding: "0 20px",
      border: `4px solid ${COLORS.ink}`,
      background: picked > 0.5 ? COLORS.accent : "#FFFFFF",
      color: picked > 0.5 ? CREAM : COLORS.ink,
      fontFamily: DISPLAY_STACK,
      fontWeight: 800,
      fontSize: 42,
      opacity: o,
      transform: `translateY(${(1 - o) * 16}px) scale(${1 - 0.03 * Math.sin(Math.PI * Math.min(1, picked * 1.2))})`,
    }}
  >
    <div
      style={{
        width: 56,
        height: 56,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: picked > 0.5 ? CREAM : TEAL,
        color: picked > 0.5 ? COLORS.accent : CREAM,
        fontWeight: 900,
        fontSize: 34,
      }}
    >
      {letter}
    </div>
    {text}
  </div>
);

const Scenario: React.FC = () => {
  const f = useCurrentFrame();
  const base = BEATS.scenario.start;
  const card = ramp(f, CUE.cardIn - base, 10);
  const choices = ramp(f, CUE.choicesIn - base, 8);
  const pick = ramp(f, CUE.pick - base, 4);
  const pointerP = ramp(f, CUE.pointerIn - base, 16);
  const pointerO = ramp(f, CUE.pointerIn - base, 4) * (1 - ramp(f, CUE.consequence - base, 6));
  const cons = ramp(f, CUE.consequence - base, 10);
  const out = ramp(f, BEATS.scenario.end - base - 8, 8);
  const choiceA = CARD_TOP + 280;
  const choiceB = choiceA + 116;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: card * (1 - out), transform: `translateY(${(1 - card) * 40}px)` }}>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: CARD_TOP,
          width: WIDTH,
          height: 880,
          background: "#FFFFFF",
          border: `4px solid ${COLORS.ink}`,
          boxSizing: "border-box",
          boxShadow: "0 18px 40px rgba(34,28,21,0.18)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: CARD_TOP,
          width: WIDTH,
          height: 70,
          background: TEAL,
          display: "flex",
          alignItems: "center",
          paddingLeft: 36,
          boxSizing: "border-box",
          fontFamily: BODY_STACK,
          fontWeight: 800,
          fontSize: 30,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: COLORS.amber,
        }}
      >
        {COPY.scenarioKicker}
      </div>
      <div
        style={{
          position: "absolute",
          left: LEFT + 36,
          top: CARD_TOP + 100,
          width: WIDTH - 72,
          fontFamily: DISPLAY_STACK,
          fontWeight: 800,
          fontSize: 56,
          lineHeight: 1.1,
          color: COLORS.ink,
        }}
      >
        {COPY.scenario}
      </div>
      <Choice y={choiceA} letter="A" text={COPY.choiceA} picked={pick} o={choices} />
      <Choice y={choiceB} letter="B" text={COPY.choiceB} picked={0} o={choices} />
      {/* Pointer taps choice A. */}
      <svg
        width={64}
        height={64}
        viewBox="0 0 64 64"
        style={{
          position: "absolute",
          left: interpolate(pointerP, [0, 1], [760, 520]),
          top: interpolate(pointerP, [0, 1], [choiceB + 120, choiceA + 40]),
          opacity: pointerO,
        }}
      >
        <path d="M6 4 L6 52 L20 40 L30 60 L38 56 L28 36 L46 36 Z" fill={COLORS.ink} stroke={CREAM} strokeWidth={3} strokeLinejoin="round" />
      </svg>
      {/* Consequence. */}
      <div
        style={{
          position: "absolute",
          left: LEFT + 36,
          top: CARD_TOP + 540,
          width: WIDTH - 72,
          height: 300,
          boxSizing: "border-box",
          padding: "30px 34px",
          background: TEAL,
          borderTop: `12px solid ${COLORS.amber}`,
          opacity: cons,
          transform: `translateY(${(1 - cons) * 30}px)`,
        }}
      >
        <div
          style={{
            fontFamily: BODY_STACK,
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: COLORS.amber,
          }}
        >
          {COPY.consequenceKicker}
        </div>
        <div style={{ marginTop: 18, fontFamily: DISPLAY_STACK, fontWeight: 900, fontSize: 68, lineHeight: 1.05, color: COLORS.dark_ink }}>
          {COPY.consequence}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Detour, 24 to 27 s
// ---------------------------------------------------------------------------

const Detour: React.FC = () => {
  const f = useCurrentFrame();
  const base = BEATS.detour.start;
  const sign = ramp(f, CUE.sign - base, 8);
  const postX = 540;
  return (
    <>
      <div style={{ position: "absolute", left: postX - 10, top: 560, width: 20, height: 700, background: COLORS.ink, opacity: sign }} />
      <div style={{ position: "absolute", left: postX - 160, top: 1250, width: 320, height: 12, background: COLORS.ink, opacity: sign }} />
      {/* The sign: amber, arrow to the right. */}
      <div
        style={{
          position: "absolute",
          left: postX - 300,
          top: 410,
          width: 600,
          height: 170,
          boxSizing: "border-box",
          background: COLORS.amber,
          border: `8px solid ${COLORS.ink}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          fontFamily: DISPLAY_STACK,
          fontWeight: 900,
          fontSize: 96,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: COLORS.ink,
          opacity: sign,
          transform: `rotate(${(1 - sign) * -8}deg) scale(${0.85 + 0.15 * sign})`,
        }}
      >
        {COPY.detourSign}
        <svg width={90} height={60} viewBox="0 0 90 60">
          <path d="M0 22 H58 V4 L90 30 L58 56 V38 H0 Z" fill={COLORS.ink} />
        </svg>
      </div>
      {COPY.boards.map((b, i) => {
        const o = ramp(f, CUE.boards[i] - base, 7);
        const right = i % 2 === 0;
        const y = 650 + i * 150;
        const w = 520;
        const x = right ? postX - 40 : postX + 40 - w;
        const tip = 44;
        return (
          <div
            key={b}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: w,
              height: 110,
              background: TEAL,
              clipPath: right
                ? `polygon(0 0, ${w - tip}px 0, ${w}px 50%, ${w - tip}px 100%, 0 100%)`
                : `polygon(${tip}px 0, ${w}px 0, ${w}px 100%, ${tip}px 100%, 0 50%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: DISPLAY_STACK,
              fontWeight: 800,
              fontSize: 46,
              color: COLORS.dark_ink,
              opacity: o,
              transform: `translateX(${(1 - o) * (right ? -30 : 30)}px)`,
            }}
          >
            {b}
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// CTA, 27 to 30 s
// ---------------------------------------------------------------------------

const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const base = BEATS.cta.start;
  const o = CUE.ctaLines.map((c) => ramp(f, c - base, 7));
  const credit = ramp(f, CUE.credit - base, 7);
  const rise = (p: number): CSSProperties => ({ opacity: p, transform: `translateY(${(1 - p) * 22}px)` });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 260,
          width: WIDTH,
          fontFamily: DISPLAY_STACK,
          fontWeight: 900,
          fontSize: 124,
          lineHeight: 1.0,
          letterSpacing: "-0.03em",
          color: COLORS.ink,
          ...rise(o[0]),
        }}
      >
        Design for what <span style={{ color: COLORS.accent }}>people do.</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 570,
          width: WIDTH,
          fontFamily: DISPLAY_STACK,
          fontWeight: 800,
          fontSize: 60,
          lineHeight: 1.1,
          color: COLORS.ink,
          ...rise(o[1]),
        }}
      >
        {COPY.cta2}
      </div>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 800,
          width: WIDTH,
          height: 180,
          whiteSpace: "nowrap",
          background: TEAL,
          borderTop: `10px solid ${COLORS.amber}`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          paddingLeft: 40,
          fontFamily: DISPLAY_STACK,
          fontWeight: 800,
          fontSize: 56,
          color: COLORS.dark_accent,
          letterSpacing: "-0.01em",
          ...rise(o[2]),
        }}
      >
        {COPY.url}
      </div>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 1020,
          fontFamily: BODY_STACK,
          fontWeight: 600,
          fontSize: 32,
          color: COLORS.muted,
          opacity: credit,
        }}
      >
        {COPY.credit}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------

export const ActionMapVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: CREAM }}>
    <Sequence name="map" from={0} durationInFrames={BEATS.detour.end} layout="none">
      <MapScene />
    </Sequence>
    <Sequence name="scenario" from={BEATS.scenario.start} durationInFrames={BEATS.scenario.end - BEATS.scenario.start} layout="none">
      <Scenario />
    </Sequence>
    <Sequence name="detour" from={BEATS.detour.start} durationInFrames={BEATS.detour.end - BEATS.detour.start} layout="none">
      <Detour />
    </Sequence>
    <Sequence name="cta" from={BEATS.cta.start} durationInFrames={BEATS.cta.end - BEATS.cta.start} layout="none">
      <Cta />
    </Sequence>
    <Headlines />
    <BrandRow />
  </AbsoluteFill>
);
