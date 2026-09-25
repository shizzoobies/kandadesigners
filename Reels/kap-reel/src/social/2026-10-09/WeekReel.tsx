// "How we plan a week of posts", Fri 2026-10-09 reel (behind the scenes).
//
// Text led, no narration. A five-stop route (Plan, Brief, Build, Approve,
// Schedule) fills as the reel moves; the two approval stops are flagged. Each
// step shows the real screen for it, rebuilt with sample content and marked
// SAMPLE (rendered by To Be Released/2026-10-09-2/source/build.mjs). The Post
// Desk is the real page code captured with sample data (postdesk.mjs). No
// client data, no tool names.
//
// The K&A lockup and ka-performancefl.com sit in a brand row at the top of the
// safe area on every frame. Everything stays inside safeArea("vertical"):
// y 288 to 1536, x 108 to 972.

import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../lib/fonts";
import { BODY_STACK, COLORS, DISPLAY_STACK, LOGO_PNG } from "../../lib/brand";
import { safeArea } from "../../lib/layout";
import { BEATS, COPY, CUE, STEPS } from "./timeline";

const SAFE = safeArea("vertical");
const LEFT = 108;
const RIGHT = SAFE.right - 6; // 966
const WIDTH = RIGHT - LEFT; // 858
const BOTTOM = SAFE.bottom - 10; // 1526

const BRAND_TOP = SAFE.top + 20; // 308
const LOGO_H = 84;
const RULE_Y = BRAND_TOP + LOGO_H + 14; // 406
const ROUTE_TOP = RULE_Y + 34; // 440
const KICK_TOP = ROUTE_TOP + 140; // 580
const HEAD_TOP = KICK_TOP + 44; // 624
const VIS_TOP = 800;

const OK = "#0F6B5C";
const PAPER = "#FFFDF9";

const shot = (name: string) => staticFile(`social/2026-10-09/${name}`);

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const ramp = (f: number, start: number, len: number) =>
  interpolate(f, [start, start + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

// ---------------------------------------------------------------------------
// Brand row: on every frame.
// ---------------------------------------------------------------------------

const BrandRow: React.FC = () => (
  <>
    <Img src={LOGO_PNG} style={{ position: "absolute", left: LEFT, top: BRAND_TOP, height: LOGO_H, width: "auto" }} />
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
// Pieces
// ---------------------------------------------------------------------------

const Tick: React.FC<{ color: string; size: number; weight?: number }> = ({ color, size, weight = 13 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
    <path d="M14 54 L40 78 L88 18" fill="none" stroke={color} strokeWidth={weight} strokeLinecap="square" />
  </svg>
);

const APPROVAL_AT: Record<number, number> = { 0: 1, 3: 2 };

/** at: current step 0..4, -1 none, 5 all done. p: 0..1 progress of the fill into `at`. */
const Route: React.FC<{ at: number; top?: number; p?: number }> = ({ at, top = ROUTE_TOP, p = 1 }) => {
  const inset = 44;
  const span = WIDTH - inset * 2;
  const x = (i: number) => LEFT + inset + (span * i) / 4;
  const doneTo = at <= 0 ? 0 : Math.min(at, 4) - 1 + (at >= 5 ? 1 : p);
  return (
    <div style={{ position: "absolute", left: 0, top, width: 1080, height: 130 }}>
      <div style={{ position: "absolute", left: x(0), top: 46, width: span, height: 8, background: "#D8CFC3" }} />
      <div style={{ position: "absolute", left: x(0), top: 46, width: (span * Math.max(0, doneTo)) / 4, height: 8, background: COLORS.ink }} />
      {STEPS.map((label, i) => {
        const st = i < at ? "done" : i === at ? "now" : "next";
        const size = st === "now" ? 66 : 54;
        const ap = APPROVAL_AT[i];
        return (
          <div key={label}>
            {ap ? (
              <div
                style={{
                  position: "absolute",
                  left: x(i),
                  top: -6,
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                  fontFamily: BODY_STACK,
                  fontWeight: 800,
                  fontSize: 19,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: OK,
                }}
              >
                Approval {ap}
              </div>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: x(i) - size / 2,
                top: 50 - size / 2,
                width: size,
                height: size,
                boxSizing: "border-box",
                border: `5px solid ${st === "now" ? COLORS.accent : COLORS.ink}`,
                background: st === "now" ? COLORS.accent : st === "done" ? COLORS.ink : COLORS.canvas,
                color: st === "now" ? COLORS.canvas : COLORS.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: DISPLAY_STACK,
                fontWeight: 900,
                fontSize: st === "now" ? 36 : 28,
              }}
            >
              {st === "done" ? <Tick color={COLORS.canvas} size={34} weight={15} /> : i + 1}
            </div>
            <div
              style={{
                position: "absolute",
                left: x(i),
                top: 88,
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                fontFamily: DISPLAY_STACK,
                fontWeight: st === "now" ? 900 : 700,
                fontSize: 27,
                color: st === "now" ? COLORS.accent : st === "done" ? COLORS.ink : COLORS.muted,
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Stamp: React.FC<{ children: ReactNode; p: number; rotate: number; size?: number; style?: CSSProperties }> = ({
  children,
  p,
  rotate,
  size = 54,
  style,
}) => (
  <div
    style={{
      display: "inline-block",
      fontFamily: DISPLAY_STACK,
      fontWeight: 900,
      fontSize: size,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: OK,
      border: `${Math.round(size / 8)}px double ${OK}`,
      padding: `${Math.round(size * 0.12)}px ${Math.round(size * 0.35)}px ${Math.round(size * 0.06)}px`,
      background: "rgba(255,253,249,0.88)",
      opacity: p,
      transform: `rotate(${rotate}deg) scale(${1.6 - 0.6 * p})`,
      transformOrigin: "center",
      ...style,
    }}
  >
    {children}
  </div>
);

const Kicker: React.FC<{ n: number }> = ({ n }) => (
  <div
    style={{
      position: "absolute",
      left: LEFT,
      top: KICK_TOP,
      fontFamily: BODY_STACK,
      fontWeight: 800,
      fontSize: 30,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: COLORS.accent,
    }}
  >
    Step {n} of 5
  </div>
);

const Headline: React.FC<{ children: ReactNode; size?: number; top?: number; enter?: boolean }> = ({
  children,
  size = 80,
  top = HEAD_TOP,
  enter = true,
}) => {
  const f = useCurrentFrame();
  const p = enter ? ramp(f, 0, 8) : 1;
  return (
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

/** A screen image entering from below, centered in the visual area. */
const Screen: React.FC<{ src: string; w: number; h: number; top?: number; delay?: number; shadow?: boolean }> = ({
  src,
  w,
  h,
  top = VIS_TOP,
  delay = 3,
  shadow = true,
}) => {
  const f = useCurrentFrame();
  const p = ramp(f, delay, 12);
  return (
    <Img
      src={src}
      style={{
        position: "absolute",
        left: LEFT + (WIDTH - w) / 2,
        top,
        width: w,
        height: h,
        opacity: p,
        transform: `translateY(${(1 - p) * 60}px)`,
        filter: shadow ? "drop-shadow(0 22px 30px rgba(34,28,21,0.18))" : undefined,
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const s1 = ramp(f, CUE.hookStamp1, 6);
  const s2 = ramp(f, CUE.hookStamp2, 6);
  const w = ramp(f, CUE.hookWeek, 8);
  const card = (x: number, label: string, sub: string, p: number, rot: number) => (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 880,
        width: 414,
        height: 330,
        background: PAPER,
        border: "2px solid #DDD3C6",
        borderTop: `10px solid ${OK}`,
        boxSizing: "border-box",
        padding: "34px 30px",
        boxShadow: "0 18px 36px rgba(34,28,21,0.12)",
      }}
    >
      <Stamp p={p} rotate={rot} size={46}>
        Approved
      </Stamp>
      <div style={{ marginTop: 40, fontFamily: DISPLAY_STACK, fontWeight: 900, fontSize: 46, color: COLORS.ink }}>{label}</div>
      <div style={{ marginTop: 6, fontFamily: BODY_STACK, fontSize: 30, color: COLORS.muted, lineHeight: 1.2 }}>{sub}</div>
    </div>
  );
  return (
    <>
      <Headline enter={false} size={104} top={RULE_Y + 44}>
        Every post we publish gets <span style={{ color: COLORS.accent }}>approved twice.</span>
      </Headline>
      {card(LEFT, COPY.hookA, "Alex approves it before anything is made", s1, -7)}
      {card(LEFT + WIDTH - 414, COPY.hookB, "Alex approves it before it is scheduled", s2, 5)}
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 1250,
          fontFamily: DISPLAY_STACK,
          fontWeight: 900,
          fontSize: 76,
          letterSpacing: "-0.03em",
          color: COLORS.accent,
          opacity: w,
          transform: `translateX(${(1 - w) * -40}px)`,
        }}
      >
        {COPY.hookWeek}
      </div>
      <div style={{ opacity: w }}>
        <Route at={-1} top={1360} />
      </div>
    </>
  );
};

const StepFrame: React.FC<{ n: number; title: ReactNode; size?: number; children: ReactNode }> = ({ n, title, size, children }) => {
  const f = useCurrentFrame();
  return (
    <>
      <Route at={n - 1} p={ramp(f, 0, 12)} />
      <Kicker n={n} />
      <Headline size={size}>{title}</Headline>
      {children}
    </>
  );
};

// Screen PNGs are 2x renders at 900 css px wide; sizes below keep their ratio.
const fit = (w: number, pw: number, ph: number) => ({ w, h: Math.round((w * ph) / pw) });

const Plan: React.FC = () => {
  const f = useCurrentFrame();
  const s = fit(WIDTH, 1800, 1310);
  const p = ramp(f, CUE.planStamp, 6);
  return (
    <StepFrame n={1} title={<>Plan the week. <span style={{ color: COLORS.accent }}>Alex approves it.</span></>} size={76}>
      <Screen src={shot("screen-plan.png")} {...s} top={VIS_TOP + 40} />
      <div style={{ position: "absolute", left: LEFT + 430, top: VIS_TOP + 40 + s.h - 100 }}>
        <Stamp p={p} rotate={-8} size={50}>
          Approval 1
        </Stamp>
      </div>
    </StepFrame>
  );
};

const Brief: React.FC = () => {
  const s = fit(WIDTH, 1800, 1022);
  return (
    <StepFrame n={2} title={<>A brief for <span style={{ color: COLORS.accent }}>every post.</span></>}>
      <Screen src={shot("screen-brief.png")} {...s} top={VIS_TOP + 60} />
    </StepFrame>
  );
};

const Build: React.FC = () => {
  const f = useCurrentFrame();
  const s = fit(WIDTH, 1800, 1082);
  // Reveal the three versions one at a time, left to right.
  const cuts = [0.27, 0.64, 1];
  let reveal = 0;
  CUE.buildReveal.forEach((c, i) => {
    const p = ramp(f, c, 10);
    if (p > 0) reveal = (i === 0 ? 0 : cuts[i - 1]) + (cuts[i] - (i === 0 ? 0 : cuts[i - 1])) * p;
  });
  return (
    <StepFrame n={3} title={<>Build every <span style={{ color: COLORS.accent }}>version.</span></>}>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: HEAD_TOP + 92,
          fontFamily: DISPLAY_STACK,
          fontWeight: 700,
          fontSize: 44,
          color: COLORS.ink,
          opacity: ramp(f, CUE.buildReveal[0], 8),
        }}
      >
        {COPY.buildSub}
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)` }}>
        <Screen src={shot("screen-build.png")} {...s} top={VIS_TOP + 40} delay={0} shadow={false} />
      </div>
    </StepFrame>
  );
};

// Phone capture: 400 x 860 css px at 3x = 1200 x 2580. Crop from y 900 down.
const PHONE_W = 520;
const PHONE_SCALE = PHONE_W / 1200;
const CROP_Y = 900;
const PHONE_H = Math.round((2580 - CROP_Y) * PHONE_SCALE); // 728
// Approve button, waiting state (postdesk-boxes.json): css x 54, y 797, 98 x 48.
const GO = { x: (54 + 49) * 3 * PHONE_SCALE, y: ((797 + 24) * 3 - CROP_Y) * PHONE_SCALE };

const Approve: React.FC = () => {
  const f = useCurrentFrame();
  const enter = ramp(f, 2, 12);
  const swap = ramp(f, CUE.approveSwap, 5);
  const tap = interpolate(f, [CUE.approveTap, CUE.approveTap + 6, CUE.approveTap + 14], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stamp = ramp(f, CUE.approveStamp, 6);
  const px = LEFT + (WIDTH - PHONE_W) / 2 - 150;
  const py = VIS_TOP - 30;
  const img = (name: string, o: number) => (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: o }}>
      <Img src={shot(name)} style={{ position: "absolute", left: 0, top: -CROP_Y * PHONE_SCALE, width: PHONE_W, height: 2580 * PHONE_SCALE }} />
    </div>
  );
  return (
    <StepFrame n={4} title={<>Alex approves <span style={{ color: COLORS.accent }}>every post.</span></>} size={60}>
      <div
        style={{
          position: "absolute",
          left: px - 14,
          top: py - 14,
          width: PHONE_W + 28,
          height: PHONE_H + 28,
          background: COLORS.ink,
          borderRadius: 34,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 60}px)`,
          boxShadow: "0 26px 44px rgba(34,28,21,0.25)",
        }}
      >
        <div style={{ position: "absolute", left: 14, top: 14, width: PHONE_W, height: PHONE_H, borderRadius: 22, overflow: "hidden", background: "#F4EFE8" }}>
          {img("postdesk-phone-waiting.png", 1 - swap)}
          {img("postdesk-phone-approved.png", swap)}
          <div
            style={{
              position: "absolute",
              left: GO.x - 50,
              top: GO.y - 50,
              width: 100,
              height: 100,
              borderRadius: "50%",
              border: `6px solid ${COLORS.amber}`,
              background: "rgba(217,119,6,0.25)",
              opacity: tap,
              transform: `scale(${0.6 + 0.6 * tap})`,
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: px + PHONE_W + 50,
          top: py + 40,
          width: RIGHT - (px + PHONE_W + 50),
          fontFamily: BODY_STACK,
          fontSize: 34,
          lineHeight: 1.25,
          color: COLORS.ink,
          opacity: enter,
        }}
      >
        <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 900, fontSize: 40, marginBottom: 12 }}>The Post Desk</div>
        Every finished post and caption on one page.
        <div style={{ marginTop: 24, fontWeight: 700 }}>
          Approve, or <span style={{ color: COLORS.accent }}>request changes</span> with a note.
        </div>
      </div>
      <div style={{ position: "absolute", left: RIGHT - 470, top: py + PHONE_H - 96 }}>
        <Stamp p={stamp} rotate={-6} size={50}>
          Approval 2
        </Stamp>
      </div>
      <div
        style={{
          position: "absolute",
          left: px,
          top: py + PHONE_H + 26,
          fontFamily: BODY_STACK,
          fontWeight: 800,
          fontSize: 22,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: COLORS.accent,
          opacity: enter,
        }}
      >
        Sample posts shown
      </div>
    </StepFrame>
  );
};

const Schedule: React.FC = () => {
  const s1 = fit(740, 1800, 966);
  const s2 = fit(740, 1800, 820);
  return (
    <StepFrame n={5} title={<>Schedule it. <span style={{ color: COLORS.accent }}>Check what worked.</span></>} size={76}>
      <Screen src={shot("screen-schedule.png")} {...s1} top={VIS_TOP + 10} />
      <Screen src={shot("screen-results.png")} {...s2} top={VIS_TOP + 10 + s1.h + 14} delay={CUE.scheduleResults} />
    </StepFrame>
  );
};

const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const o = ramp(f, CUE.ctaOffer, 8);
  return (
    <>
      <Route at={5} />
      <Headline size={80} top={KICK_TOP}>
        This is how we run it for <span style={{ color: COLORS.accent }}>pilot businesses.</span>
      </Headline>
      {COPY.ctaLines.map((line, i) => {
        const p = ramp(f, CUE.ctaLines[i], 6);
        return (
          <div
            key={line}
            style={{
              position: "absolute",
              left: LEFT,
              top: 790 + i * 70,
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontFamily: DISPLAY_STACK,
              fontWeight: 700,
              fontSize: 38,
              color: COLORS.ink,
              opacity: p,
              transform: `translateX(${(1 - p) * -30}px)`,
            }}
          >
            <Tick color={COLORS.accent} size={44} weight={14} />
            {line}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 1030,
          width: WIDTH,
          height: BOTTOM - 1030,
          boxSizing: "border-box",
          background: COLORS.dark_canvas,
          borderTop: `12px solid ${COLORS.amber}`,
          padding: "34px 40px",
          color: COLORS.dark_ink,
          opacity: o,
          transform: `translateY(${(1 - o) * 30}px)`,
        }}
      >
        <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 900, fontSize: 54, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{COPY.offer}</div>
        <div style={{ marginTop: 30, fontFamily: DISPLAY_STACK, fontWeight: 900, fontSize: 66, color: "#FFFFFF" }}>{COPY.call}</div>
        <div style={{ marginTop: 2, fontFamily: BODY_STACK, fontSize: 36, color: COLORS.dark_muted }}>{COPY.message}</div>
        <div style={{ marginTop: 26, fontFamily: DISPLAY_STACK, fontWeight: 800, fontSize: 50, color: COLORS.dark_accent }}>{COPY.url}</div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------

export const WeekReel: React.FC = () => {
  const scenes: [keyof typeof BEATS, React.FC][] = [
    ["hook", Hook],
    ["plan", Plan],
    ["brief", Brief],
    ["build", Build],
    ["approve", Approve],
    ["schedule", Schedule],
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
