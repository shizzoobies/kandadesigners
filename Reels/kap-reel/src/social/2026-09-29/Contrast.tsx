// "Contrast is not a vibe", revision 2 (2026-09-25). Tuesday 2026-09-29 reel.
//
// Text led, no narration. Bold type on cream, a split before and after, and a
// live WCAG 2.x readout on a teal meter. Every number the meter shows is
// contrastRatio() of the two colors actually on screen that frame, so while the
// right panel turns from amber to rust the count is real at every step.
//
// The K&A lockup and ka-performancefl.com sit in a brand row at the top of the
// safe area on every frame. All copy stays inside src/lib/layout.ts safeArea():
// y 288 to 1536, x 108 to 972.

import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, useCurrentFrame } from "remotion";
import "../../lib/fonts";
import { MONO_STACK } from "../../tutorial/scenes/contrast/mono";
import { BODY_STACK, COLORS, DISPLAY_STACK, LOGO_PNG } from "../../lib/brand";
import { contrastRatio } from "../../lib/contrast";
import { safeArea } from "../../lib/layout";
import { mixHex, PAIRS, passesAA, ratioOf, shown, verdict } from "./ratios";
import { BEATS, CUE } from "./timeline";

const SAFE = safeArea("vertical");
const LEFT = 108;
const RIGHT = SAFE.right - 6; // 966, a few pixels clear of the reserved strip
const WIDTH = RIGHT - LEFT; // 864

const BRAND_TOP = SAFE.top + 20; // 308
const LOGO_H = 84;
const RULE_Y = BRAND_TOP + LOGO_H + 14;
const HEAD_TOP = RULE_Y + 30;
const STAGE_TOP = 720;
const STAGE_H = 430;
const METER_TOP = 1172;
const METER_H = 340;

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const ramp = (f: number, start: number, len: number) =>
  interpolate(f, [start, start + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

// ---------------------------------------------------------------------------
// Brand row: on every frame.
// ---------------------------------------------------------------------------

const BrandRow: React.FC = () => (
  <>
    <Img
      src={LOGO_PNG}
      style={{ position: "absolute", left: LEFT, top: BRAND_TOP, height: LOGO_H, width: "auto" }}
    />
    <div
      style={{
        position: "absolute",
        right: 1080 - RIGHT,
        top: BRAND_TOP,
        height: LOGO_H,
        display: "flex",
        alignItems: "center",
        fontFamily: DISPLAY_STACK,
        fontWeight: 800,
        fontSize: 40,
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
// Headline
// ---------------------------------------------------------------------------

const Headline: React.FC<{ children: ReactNode; size?: number; enter?: boolean }> = ({
  children,
  size = 96,
  enter = true,
}) => {
  const f = useCurrentFrame();
  const p = enter ? ramp(f, 0, 8) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: LEFT,
        top: HEAD_TOP,
        width: WIDTH,
        fontFamily: DISPLAY_STACK,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: "-0.03em",
        color: COLORS.ink,
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px)`,
      }}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// The meter
// ---------------------------------------------------------------------------

const LOG21 = Math.log(21);
const pos = (ratio: number) => Math.log(ratio) / LOG21;
const TICKS: { at: number; label: string; strong?: boolean }[] = [
  { at: 3, label: "3" },
  { at: 4.5, label: "4.5 AA", strong: true },
  { at: 7, label: "7 AAA" },
  { at: 21, label: "21" },
];

const Meter: React.FC<{ label: string; ratio: number; pulseAA?: boolean }> = ({ label, ratio, pulseAA }) => {
  const f = useCurrentFrame();
  const pass = passesAA(ratio);
  const trackW = WIDTH - 72;
  const fill = pass ? COLORS.dark_accent : COLORS.amber;
  const pulse = pulseAA ? 0.5 + 0.5 * Math.sin(f / 4) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: LEFT,
        top: METER_TOP,
        width: WIDTH,
        height: METER_H,
        background: COLORS.dark_canvas,
        borderRadius: 6,
        padding: "30px 36px",
        boxSizing: "border-box",
        color: COLORS.dark_ink,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 44 }}>
        <div
          style={{
            fontFamily: BODY_STACK,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: COLORS.dark_muted,
          }}
        >
          {label}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 22, height: 22, background: fill }} />
          <div
            style={{
              fontFamily: DISPLAY_STACK,
              fontWeight: 900,
              fontSize: 38,
              letterSpacing: "0.02em",
              color: pass ? COLORS.dark_accent : COLORS.dark_ink,
            }}
          >
            {verdict(ratio)}
          </div>
        </div>
      </div>
      <div
        style={{
          fontFamily: MONO_STACK,
          fontWeight: 600,
          fontSize: 150,
          lineHeight: 1,
          marginTop: 8,
          height: 150,
          letterSpacing: "-0.02em",
        }}
      >
        {shown(ratio)}
      </div>
      <div style={{ position: "relative", marginTop: 20, width: trackW, height: 22, background: COLORS.dark_surface }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: 22, width: trackW * pos(ratio), background: fill }} />
        {TICKS.map((t) => (
          <div
            key={t.at}
            style={{
              position: "absolute",
              left: trackW * pos(t.at) - (t.strong ? 3 : 1.5),
              top: -10,
              width: t.strong ? 6 : 3,
              height: 42,
              background: t.strong ? COLORS.dark_ink : COLORS.dark_muted,
              boxShadow: t.strong && pulse > 0 ? `0 0 ${12 + 16 * pulse}px ${COLORS.dark_accent}` : undefined,
            }}
          />
        ))}
      </div>
      <div style={{ position: "relative", width: trackW, height: 30, marginTop: 12 }}>
        {TICKS.map((t) => (
          <div
            key={t.at}
            style={{
              position: "absolute",
              left: trackW * pos(t.at),
              transform: t.at === 21 ? "translateX(-100%)" : "translateX(-50%)",
              whiteSpace: "nowrap",
              fontFamily: BODY_STACK,
              fontWeight: t.strong ? 800 : 600,
              fontSize: 26,
              color: t.strong ? COLORS.dark_ink : COLORS.dark_muted,
            }}
          >
            {t.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const stage = (extra: CSSProperties = {}): CSSProperties => ({
  position: "absolute",
  left: LEFT,
  top: STAGE_TOP,
  width: WIDTH,
  height: STAGE_H,
  ...extra,
});

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const s = ramp(f, CUE.hookStamp, 6);
  const amber = PAIRS.amberOnCream;
  return (
    <>
      <Headline enter={false} size={112}>
        <span style={{ color: amber.fg }}>Amber on cream</span>
        <br />
        looks fine.
      </Headline>
      <div style={stage({ display: "flex", alignItems: "center" })}>
        <div
          style={{
            fontFamily: DISPLAY_STACK,
            fontWeight: 900,
            fontSize: 230,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: COLORS.accent,
            opacity: s,
            transform: `scale(${1.25 - 0.25 * s}) rotate(-3deg)`,
            transformOrigin: "left center",
          }}
        >
          It fails.
        </div>
      </div>
      <Meter label={amber.label} ratio={ratioOf(amber)} />
    </>
  );
};

const Need: React.FC = () => {
  const f = useCurrentFrame();
  const p = ramp(f, 8, 10);
  const amber = PAIRS.amberOnCream;
  return (
    <>
      <Headline size={96}>
        Text needs <span style={{ color: COLORS.accent }}>4.5 : 1.</span>
        <br />
        Amber gets {shown(ratioOf(amber)).replace(" : 1", "")}.
      </Headline>
      <div style={stage({ display: "flex", alignItems: "center", opacity: p, transform: `translateY(${(1 - p) * 20}px)` })}>
        <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: "-0.02em", color: COLORS.ink }}>
          If customers can&apos;t read it,{" "}
          <span style={{ color: COLORS.accent }}>they can&apos;t book it.</span>
        </div>
      </div>
      <Meter label={amber.label} ratio={ratioOf(amber)} pulseAA />
    </>
  );
};

const Panel: React.FC<{ x: number; tag: string; color: string; ratio: number }> = ({ x, tag, color, ratio }) => {
  const pass = passesAA(ratio);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 0,
        width: 420,
        height: STAGE_H,
        background: COLORS.surface,
        border: `4px solid ${COLORS.ink}`,
        borderRadius: 6,
        boxSizing: "border-box",
        padding: "22px 26px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ fontFamily: BODY_STACK, fontWeight: 800, fontSize: 30, letterSpacing: "0.1em", color: COLORS.ink }}>{tag}</div>
      <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 900, fontSize: 170, lineHeight: 1, color, marginTop: 6 }}>Aa</div>
      <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 800, fontSize: 42, lineHeight: 1.1, color, marginTop: 8 }}>
        Book a free quote
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontFamily: MONO_STACK, fontWeight: 600, fontSize: 48, color: COLORS.ink }}>{shown(ratio)}</div>
        <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 900, fontSize: 30, color: pass ? COLORS.ink : COLORS.accent }}>
          {pass ? "PASS" : "FAIL"}
        </div>
      </div>
    </div>
  );
};

const Split: React.FC = () => {
  const f = useCurrentFrame();
  const t = ramp(f, CUE.splitMorphIn, CUE.splitMorphFrames);
  const before = PAIRS.amberOnCream;
  // Endpoints are the exact brand hexes; in between, the sRGB mix on screen.
  const afterFg = t >= 1 ? PAIRS.rustOnCream.fg : t <= 0 ? before.fg : mixHex(before.fg, PAIRS.rustOnCream.fg, t);
  const bg = PAIRS.rustOnCream.bg;
  const live = contrastRatio(afterFg, bg);
  const p = ramp(f, 4, 10);
  return (
    <>
      <Headline size={96}>
        Same palette.
        <br />
        Swap in <span style={{ color: COLORS.accent }}>rust.</span>
      </Headline>
      <div style={stage({ opacity: p, transform: `translateY(${(1 - p) * 20}px)` })}>
        <Panel x={0} tag="BEFORE" color={before.fg} ratio={ratioOf(before)} />
        <Panel x={WIDTH - 420} tag="AFTER" color={afterFg} ratio={live} />
      </div>
      <Meter label={t >= 1 ? PAIRS.rustOnCream.label : "After, live"} ratio={live} />
    </>
  );
};

const Button: React.FC = () => {
  const f = useCurrentFrame();
  const t = ramp(f, CUE.buttonFillIn, CUE.buttonFillFrames);
  const pair = PAIRS.inkOnAmber;
  const fill = t >= 1 ? pair.bg : t <= 0 ? COLORS.canvas : mixHex(COLORS.canvas, pair.bg, t);
  const live = contrastRatio(pair.fg, fill);
  return (
    <>
      <Headline size={88}>
        <span style={{ color: COLORS.accent }}>Amber still works.</span>
        <br />
        On buttons, with dark text.
      </Headline>
      <div style={stage({ top: STAGE_TOP + 40, display: "flex", alignItems: "center", justifyContent: "center" })}>
        <div
          style={{
            width: 760,
            height: 190,
            background: fill,
            border: `5px solid ${COLORS.ink}`,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: DISPLAY_STACK,
            fontWeight: 900,
            fontSize: 72,
            letterSpacing: "-0.02em",
            color: pair.fg,
            boxShadow: `10px 10px 0 ${COLORS.ink}`,
          }}
        >
          Book a free quote
        </div>
      </div>
      <Meter label={t >= 1 ? pair.label : t <= 0 ? "Dark text on cream" : "Button fill, live"} ratio={live} />
    </>
  );
};

const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const u = ramp(f, CUE.ctaUrlIn, 8);
  const c = ramp(f, CUE.ctaCallIn, 8);
  const ink = PAIRS.inkOnCream;
  return (
    <>
      <Headline size={96}>
        Every site K&amp;A builds <span style={{ color: COLORS.accent }}>passes these checks.</span>
      </Headline>
      <div style={stage({ top: STAGE_TOP + 90, height: STAGE_H - 90 })}>
        <div
          style={{
            fontFamily: DISPLAY_STACK,
            fontWeight: 900,
            fontSize: 76,
            letterSpacing: "-0.035em",
            color: COLORS.ink,
            opacity: u,
            transform: `translateY(${(1 - u) * 20}px)`,
            whiteSpace: "nowrap",
          }}
        >
          ka-performancefl.com
        </div>
        <div
          style={{
            marginTop: 26,
            width: WIDTH,
            height: 118,
            background: COLORS.accent,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: DISPLAY_STACK,
            fontWeight: 900,
            fontSize: 60,
            color: COLORS.canvas,
            opacity: c,
            transform: `translateY(${(1 - c) * 20}px)`,
          }}
        >
          Call Alex 904-210-1071
        </div>
      </div>
      <Meter label={ink.label} ratio={ratioOf(ink)} />
    </>
  );
};

// ---------------------------------------------------------------------------

export const ContrastReel: React.FC = () => {
  const scenes: [keyof typeof BEATS, React.FC][] = [
    ["hook", Hook],
    ["need", Need],
    ["split", Split],
    ["button", Button],
    ["cta", Cta],
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.canvas }}>
      {scenes.map(([id, Scene]) => (
        <Sequence key={id} name={id} from={BEATS[id].start} durationInFrames={BEATS[id].end - BEATS[id].start} layout="none">
          <Scene />
        </Sequence>
      ))}
      <BrandRow />
    </AbsoluteFill>
  );
};
