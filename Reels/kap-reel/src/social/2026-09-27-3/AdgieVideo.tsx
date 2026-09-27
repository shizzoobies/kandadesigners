// "ADDIE got a G", Sun 2026-09-27 7:30 PM LinkedIn video (training).
//
// Text led, no narration. A split-flap departure board in K&A colors spells
// A D D I E, flips each step name in, then flips the second D to G (Develop
// to Generate) and the I's word to Individualize. Then who does what between
// the designer and AI, the 91% count up with its source line, and the CTA.
// No AI tool or vendor names; the article's company is not named.
//
// The K&A lockup and ka-performancefl.com sit in a brand row at the top of
// every frame. 1080x1350, everything inside a 44 px margin.

import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, useCurrentFrame } from "remotion";
import "../../lib/fonts";
import { BODY_STACK, COLORS, DISPLAY_STACK, LOGO_PNG } from "../../lib/brand";
import { BEATS, CELLS, COPY, CUE, HERO_FLIP, ROLES, ROWS } from "./timeline";

const W = 1080;
const H = 1350;
const LEFT = 44;
const RIGHT = W - 44;
const WIDTH = RIGHT - LEFT; // 992

const BRAND_TOP = 34;
const LOGO_H = 74;
const RULE_Y = BRAND_TOP + LOGO_H + 14; // 122
const CONTENT_TOP = RULE_Y + 6; // 128

// Board colors: the dark teal band, rust letter tiles, amber for what changed.
const BOARD_BG = "#072522";
const TILE = COLORS.dark_canvas; // #0B302D
const SEAM = "rgba(0,0,0,0.45)";
const CREAM = COLORS.canvas;

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const ramp = (f: number, start: number, len: number) =>
  interpolate(f, [start, start + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

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
// Split-flap tile
// ---------------------------------------------------------------------------

const ALPHA = " ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Deterministic pseudo random 0..1. */
const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** The characters a flap passes through from `from` to `to`. */
function chain(from: string, to: string, seed: number): string[] {
  if (from === to) return [to];
  const a = ALPHA.indexOf(from);
  const b = ALPHA.indexOf(to);
  if (a >= 0 && b > a && b - a <= 5) return ALPHA.slice(a, b + 1).split("");
  const n = 2 + Math.floor(rand(seed) * 3);
  const mid: string[] = [];
  for (let i = 0; i < n; i++) mid.push(ALPHA[1 + Math.floor(rand(seed * 7 + i * 13) * 26)]);
  return [from, ...mid, to];
}

type FlipState = { cur: string; next: string; p: number };

/** Where a flap is at frame f: showing `cur`, flipping to `next` at progress p. */
function flipAt(f: number, from: string, to: string, start: number, seed: number, step = 3): FlipState {
  const c = chain(from, to, seed);
  if (f < start) return { cur: from, next: from, p: 0 };
  const t = (f - start) / step;
  const k = Math.floor(t);
  if (k >= c.length - 1) return { cur: to, next: to, p: 0 };
  return { cur: c[k], next: c[k + 1], p: t - k };
}

type TileLook = { bg: string; fg: string; font: string; weight: number; size: number };

const Half: React.FC<{ ch: string; w: number; h: number; half: "top" | "bottom"; look: TileLook; style?: CSSProperties }> = ({
  ch,
  w,
  h,
  half,
  look,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: half === "top" ? 0 : h / 2,
      width: w,
      height: h / 2,
      overflow: "hidden",
      background: look.bg,
      borderRadius: half === "top" ? "5px 5px 0 0" : "0 0 5px 5px",
      backfaceVisibility: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        top: half === "top" ? 0 : -h / 2,
        width: w,
        height: h,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: look.font,
        fontWeight: look.weight,
        fontSize: look.size,
        lineHeight: 1,
        color: look.fg,
      }}
    >
      {ch === " " ? "" : ch}
    </div>
    {half === "top" ? (
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h / 2, background: "linear-gradient(rgba(255,255,255,0.06), rgba(0,0,0,0.10))" }} />
    ) : (
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h / 2, background: "linear-gradient(rgba(0,0,0,0.16), rgba(0,0,0,0))" }} />
    )}
  </div>
);

/** One split-flap tile. p 0..1: top flap falls over 0..0.5, bottom flap lands over 0.5..1. */
const Flap: React.FC<{ x: number; y: number; w: number; h: number; state: FlipState; look: TileLook; nextLook?: TileLook }> = ({
  x,
  y,
  w,
  h,
  state,
  look,
  nextLook,
}) => {
  const { cur, next, p } = state;
  const nl = nextLook ?? look;
  const topAngle = p < 0.5 ? -180 * p : -90; // 0 to -90
  const botAngle = p < 0.5 ? 90 : 90 - 180 * (p - 0.5); // 90 to 0
  const flipping = p > 0 && cur !== next;
  const shade = flipping ? Math.sin(Math.PI * Math.min(1, p * 2)) * 0.45 : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, perspective: 900 }}>
      {/* Behind: the next top, the current bottom. */}
      <Half ch={flipping ? next : cur} w={w} h={h} half="top" look={flipping ? nl : look} />
      <Half ch={cur} w={w} h={h} half="bottom" look={look} />
      {flipping && p < 0.5 ? (
        <>
          <div style={{ position: "absolute", left: 0, top: h / 2, width: w, height: h / 2, background: `rgba(0,0,0,${shade})`, borderRadius: "0 0 5px 5px" }} />
          <Half ch={cur} w={w} h={h} half="top" look={look} style={{ transformOrigin: "50% 100%", transform: `rotateX(${topAngle}deg)` }} />
        </>
      ) : null}
      {flipping && p >= 0.5 ? (
        <Half ch={next} w={w} h={h} half="bottom" look={nl} style={{ transformOrigin: "50% 0%", transform: `rotateX(${botAngle}deg)` }} />
      ) : null}
      {/* Seam. */}
      <div style={{ position: "absolute", left: 0, top: h / 2 - 1, width: w, height: 2, background: SEAM }} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// The board
// ---------------------------------------------------------------------------

const BOARD_TOP = 408;
const BOARD_PAD = 26;
const LETTER_W = 118;
const ROW_H = 132;
const ROW_GAP = 18;
const CELL_GAP = 6;
const CELL_H = 96;
const CELLS_LEFT = LEFT + BOARD_PAD + LETTER_W + 22;
const CELL_W = Math.floor((RIGHT - BOARD_PAD - CELLS_LEFT - CELL_GAP * (CELLS - 1)) / CELLS); // 58
const BOARD_H = BOARD_PAD * 2 + ROWS.length * ROW_H + (ROWS.length - 1) * ROW_GAP;

const LETTER_LOOK: TileLook = { bg: COLORS.accent, fg: CREAM, font: DISPLAY_STACK, weight: 900, size: 104 };
const LETTER_NEW: TileLook = { ...LETTER_LOOK, bg: COLORS.amber, fg: COLORS.ink };
const WORD_LOOK: TileLook = { bg: TILE, fg: CREAM, font: DISPLAY_STACK, weight: 800, size: 66 };
const WORD_NEW: TileLook = { ...WORD_LOOK, bg: COLORS.amber, fg: COLORS.ink };

const pad = (s: string) => s.padEnd(CELLS, " ");

const Board: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: BOARD_TOP,
          width: WIDTH,
          height: BOARD_H,
          background: BOARD_BG,
          borderTop: `10px solid ${COLORS.amber}`,
          boxSizing: "border-box",
        }}
      />
      {ROWS.map((row, r) => {
        const y = BOARD_TOP + BOARD_PAD + r * (ROW_H + ROW_GAP);
        // Letter tile.
        const letterIn = flipAt(f, " ", row.letter, CUE.letterStart + r * CUE.letterStagger, r + 1);
        let letter = letterIn;
        let letterLook = LETTER_LOOK;
        let letterNext: TileLook | undefined;
        if (row.newLetter && f >= CUE.dToG) {
          const p = Math.min(1, (f - CUE.dToG) / HERO_FLIP);
          letter = p < 1 ? { cur: row.letter, next: row.newLetter, p } : { cur: row.newLetter, next: row.newLetter, p: 0 };
          letterNext = LETTER_NEW;
          if (p >= 1) letterLook = LETTER_NEW;
        }
        if (row.newWord && !row.newLetter && f >= CUE.implementToIndividualize) letterLook = LETTER_NEW;

        // Word cells.
        const from = pad(row.word);
        const to = pad(row.newWord ?? row.word);
        const wordStart = CUE.wordStart + r * CUE.wordStagger;
        const swapAt = row.newLetter ? CUE.developToGenerate : CUE.implementToIndividualize;
        const changedRow = Boolean(row.newWord);
        return (
          <div key={r}>
            <Flap x={LEFT + BOARD_PAD} y={y} w={LETTER_W} h={ROW_H} state={letter} look={letterLook} nextLook={letterNext} />
            {Array.from({ length: CELLS }, (_, i) => {
              const seed = r * 31 + i * 7 + 3;
              const cellY = y + (ROW_H - CELL_H) / 2;
              const x = CELLS_LEFT + i * (CELL_W + CELL_GAP);
              let st = flipAt(f, " ", from[i], wordStart + i, seed);
              let look = WORD_LOOK;
              let nextLook: TileLook | undefined;
              if (changedRow && f >= swapAt) {
                const start = swapAt + i * 2;
                st = flipAt(f, from[i], to[i], start, seed + 101);
                nextLook = WORD_NEW;
                // A cell turns amber once its own flap has landed, even if its letter kept.
                const landedAt = start + 3 * (chain(from[i], to[i], seed + 101).length - 1);
                if (f >= Math.max(landedAt, start + 3)) look = WORD_NEW;
              }
              return <Flap key={i} x={x} y={cellY} w={CELL_W} h={CELL_H} state={st} look={look} nextLook={nextLook} />;
            })}
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

const Headline: React.FC<{ top: number; size: number; color?: string; opacity?: number; children: ReactNode; style?: CSSProperties }> = ({
  top,
  size,
  color = COLORS.ink,
  opacity = 1,
  children,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: LEFT,
      top,
      width: WIDTH,
      fontFamily: DISPLAY_STACK,
      fontWeight: 900,
      fontSize: size,
      lineHeight: 1.02,
      letterSpacing: "-0.025em",
      color,
      opacity,
      ...style,
    }}
  >
    {children}
  </div>
);

/** 0 to 8 s hook and steps, 8 to 13 s the swap: one board, one scene. */
const BoardScene: React.FC = () => {
  const f = useCurrentFrame();
  const swapIn = ramp(f, CUE.swapLine, 8);
  const readsIn = ramp(f, CUE.readsAdgie, 8);
  return (
    <>
      <Headline top={160} size={82}>
        {COPY.hook}
      </Headline>
      <Headline
        top={258}
        size={82}
        color={COLORS.accent}
        opacity={swapIn}
        style={{ transform: `translateY(${(1 - swapIn) * 24}px)` }}
      >
        {COPY.swap}
      </Headline>
      <Board />
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: BOARD_TOP + BOARD_H + 30,
          width: WIDTH,
          fontFamily: DISPLAY_STACK,
          fontWeight: 800,
          fontSize: 58,
          color: COLORS.ink,
          opacity: readsIn,
          transform: `translateY(${(1 - readsIn) * 20}px)`,
        }}
      >
        Now it reads <span style={{ color: COLORS.accent }}>ADGIE.</span>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Who does what, 13 to 22 s
// ---------------------------------------------------------------------------

const TABLE_TOP = 262;
const HEAD_H = 72;
const COL_W = 150;
const MINI = 70;
const ROLE_H = 176;
const TEXT_LEFT = LEFT + 20 + MINI + 22;
const YOU_X = RIGHT - COL_W * 2;
const AI_X = RIGHT - COL_W;
const TEXT_W = YOU_X - TEXT_LEFT - 20;

const Marker: React.FC<{ label: string | null; x: number; y: number; on: number }> = ({ label, x, y, on }) =>
  label ? (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: COL_W,
        height: ROLE_H,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        opacity: on,
      }}
    >
      <div style={{ width: 40, height: 40, background: COLORS.accent, transform: `scale(${0.4 + 0.6 * on})` }} />
      <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 800, fontSize: 30, color: COLORS.ink }}>{label}</div>
    </div>
  ) : null;

const Roles: React.FC = () => {
  const f = useCurrentFrame();
  const intro = ramp(f, 0, 8);
  const local = CUE.roleStart - BEATS.roles.start;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: intro }}>
      <Headline top={150} size={92}>
        {COPY.roles}
      </Headline>
      {/* Header strip. */}
      <div style={{ position: "absolute", left: LEFT, top: TABLE_TOP, width: WIDTH, height: HEAD_H, background: COLORS.dark_canvas }} />
      <div
        style={{
          position: "absolute",
          left: TEXT_LEFT,
          top: TABLE_TOP,
          height: HEAD_H,
          display: "flex",
          alignItems: "center",
          fontFamily: BODY_STACK,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: COLORS.dark_muted,
        }}
      >
        Step
      </div>
      {(["You", "AI"] as const).map((h, i) => (
        <div
          key={h}
          style={{
            position: "absolute",
            left: i === 0 ? YOU_X : AI_X,
            top: TABLE_TOP,
            width: COL_W,
            height: HEAD_H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: DISPLAY_STACK,
            fontWeight: 900,
            fontSize: 48,
            color: i === 0 ? CREAM : COLORS.amber,
          }}
        >
          {h}
        </div>
      ))}
      <div style={{ position: "absolute", left: YOU_X, top: TABLE_TOP + HEAD_H, width: COL_W, height: ROLE_H * ROLES.length, background: "#EFE8DF" }} />
      {ROLES.map((role, i) => {
        const y = TABLE_TOP + HEAD_H + i * ROLE_H;
        const on = ramp(f, local + i * CUE.roleStagger, 9);
        return (
          <div key={role.step}>
            <div style={{ position: "absolute", left: LEFT, top: y + ROLE_H - 2, width: WIDTH, height: 2, background: "#D8CFC3" }} />
            <div style={{ opacity: on, transform: `translateX(${(1 - on) * -24}px)` }}>
              <div
                style={{
                  position: "absolute",
                  left: LEFT + 20,
                  top: y + 22,
                  width: MINI,
                  height: MINI + 8,
                  background: role.changed ? COLORS.amber : COLORS.accent,
                  color: role.changed ? COLORS.ink : CREAM,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: DISPLAY_STACK,
                  fontWeight: 900,
                  fontSize: 58,
                  borderRadius: 5,
                }}
              >
                {role.letter}
                <div style={{ position: "absolute", left: 0, top: (MINI + 8) / 2 - 1, width: MINI, height: 2, background: "rgba(0,0,0,0.35)" }} />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: TEXT_LEFT,
                  top: y + 16,
                  width: TEXT_W,
                  fontFamily: DISPLAY_STACK,
                  fontWeight: 900,
                  fontSize: 40,
                  lineHeight: 1.05,
                  color: COLORS.ink,
                }}
              >
                {role.step}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: TEXT_LEFT,
                  top: y + 64,
                  width: TEXT_W,
                  fontFamily: BODY_STACK,
                  fontWeight: 500,
                  fontSize: 30,
                  lineHeight: 1.2,
                  color: COLORS.ink,
                }}
              >
                {role.line}
              </div>
            </div>
            <Marker label={role.you} x={YOU_X} y={y} on={on} />
            <Marker label={role.ai} x={AI_X} y={y} on={on} />
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 91%, 22 to 27 s
// ---------------------------------------------------------------------------

const Stat: React.FC = () => {
  const f = useCurrentFrame();
  const base = BEATS.stat.start;
  const intro = ramp(f, 0, 8);
  const count = Math.round(COPY.statNumber * ramp(f, CUE.countStart - base, CUE.countLen));
  const line = ramp(f, CUE.statLine - base, 9);
  const good = ramp(f, CUE.statGood - base, 7);
  const src = ramp(f, CUE.statSource - base, 8);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: intro }}>
      <div style={{ position: "absolute", left: 0, top: CONTENT_TOP, width: W, height: H - CONTENT_TOP, background: COLORS.dark_canvas }} />
      <div
        style={{
          position: "absolute",
          left: LEFT - 8,
          top: 170,
          fontFamily: DISPLAY_STACK,
          fontWeight: 900,
          fontSize: 360,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: COLORS.amber,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}%
      </div>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 560,
          width: WIDTH - 20,
          fontFamily: DISPLAY_STACK,
          fontWeight: 800,
          fontSize: 68,
          lineHeight: 1.1,
          letterSpacing: "-0.015em",
          color: COLORS.dark_ink,
          opacity: line,
          transform: `translateY(${(1 - line) * 20}px)`,
        }}
      >
        {COPY.stat}
      </div>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 920,
          fontFamily: DISPLAY_STACK,
          fontWeight: 900,
          fontSize: 120,
          lineHeight: 1,
          color: COLORS.dark_accent,
          opacity: good,
          transform: `scale(${0.85 + 0.15 * good})`,
          transformOrigin: "0% 50%",
        }}
      >
        {COPY.good}
      </div>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 1200,
          width: WIDTH,
          fontFamily: BODY_STACK,
          fontWeight: 500,
          fontSize: 34,
          color: COLORS.dark_muted,
          opacity: src,
        }}
      >
        {COPY.source}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// CTA, 27 to 30 s
// ---------------------------------------------------------------------------

const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const base = BEATS.cta.start;
  const o = CUE.ctaLines.map((c) => ramp(f, c - base, 7));
  const rise = (p: number): CSSProperties => ({ opacity: p, transform: `translateY(${(1 - p) * 22}px)` });
  return (
    <>
      <Headline top={250} size={138} style={rise(o[0])}>
        {COPY.cta1}
      </Headline>
      <Headline top={400} size={138} color={COLORS.accent} style={rise(o[1])}>
        {COPY.cta2}
      </Headline>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 760,
          width: WIDTH,
          fontFamily: DISPLAY_STACK,
          fontWeight: 800,
          fontSize: 58,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          color: COLORS.ink,
          ...rise(o[2]),
        }}
      >
        {COPY.cta3}
      </div>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 900,
          width: WIDTH,
          height: 180,
          whiteSpace: "nowrap",
          background: COLORS.dark_canvas,
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
          ...rise(o[3]),
        }}
      >
        {COPY.url}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------

export const AdgieVideo: React.FC = () => {
  const board = { start: BEATS.hook.start, end: BEATS.swap.end };
  return (
    <AbsoluteFill style={{ backgroundColor: CREAM }}>
      <Sequence name="board" from={board.start} durationInFrames={board.end - board.start} layout="none">
        <BoardScene />
      </Sequence>
      <Sequence name="roles" from={BEATS.roles.start} durationInFrames={BEATS.roles.end - BEATS.roles.start} layout="none">
        <Roles />
      </Sequence>
      <Sequence name="stat" from={BEATS.stat.start} durationInFrames={BEATS.stat.end - BEATS.stat.start} layout="none">
        <Stat />
      </Sequence>
      <Sequence name="cta" from={BEATS.cta.start} durationInFrames={BEATS.cta.end - BEATS.cta.start} layout="none">
        <Cta />
      </Sequence>
      <BrandRow />
    </AbsoluteFill>
  );
};
