// "When a job aid beats a course". Wednesday 2026-10-07 reel, text led, no narration.
//
// Look: a year planner of 52 work weeks (13 per quarter row) where the task only
// turns up once a quarter, then real screens from K&A's own sample courses handed
// in from the right like a sheet passed across a desk, onto a dark teal work
// surface. Every screen is a capture of the live site (assets/social/2026-10-07,
// scripts/social/2026-10-07/capture.mjs); nothing inside a screen is edited.
//
// The K&A lockup and ka-performancefl.com sit in the brand row on every frame.
// Everything stays inside src/lib/layout.ts safeArea(): y 288 to 1536, x 108 to 972.

import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../lib/fonts";
import { BODY_STACK, COLORS, DISPLAY_STACK, LOGO_PNG } from "../../lib/brand";
import { safeArea } from "../../lib/layout";
import { BEATS, COPY, CUE } from "./timeline";

const SAFE = safeArea("vertical");
const LEFT = 108;
const RIGHT = SAFE.right - 6; // 966
const WIDTH = RIGHT - LEFT; // 858

const BRAND_TOP = SAFE.top + 20; // 308
const LOGO_H = 84;
const RULE_Y = BRAND_TOP + LOGO_H + 14;
const HEAD_TOP = RULE_Y + 34;
const BOTTOM = 1520;

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const ramp = (f: number, start: number, len: number) =>
  interpolate(f, [start, start + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

const CAPS = {
  rfi: { src: staticFile("social/2026-10-07/rfi-checklist.png"), w: 1182, h: 1266 },
  card: { src: staticFile("social/2026-10-07/safety-card.png"), w: 1194, h: 1269 },
  jobaid: { src: staticFile("social/2026-10-07/training-jobaid.png"), w: 1164, h: 1290 },
};

// ---------------------------------------------------------------------------
// Brand row: every frame.
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

const Headline: React.FC<{ children: ReactNode; size?: number; enter?: boolean }> = ({ children, size = 88, enter = true }) => {
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
        lineHeight: 1.03,
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

/** Amber highlighter band behind a phrase (amber as a highlight only, ink text on top). */
const Mark: React.FC<{ children: ReactNode; p: number }> = ({ children, p }) => (
  <span
    style={{
      backgroundImage: `linear-gradient(${COLORS.amber}, ${COLORS.amber})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${p * 100}% 10px`,
      backgroundPosition: "0 100%",
      paddingBottom: 6,
    }}
  >
    {children}
  </span>
);

// ---------------------------------------------------------------------------
// The year planner: 4 quarter rows of 13 work weeks, the task in one week each.
// ---------------------------------------------------------------------------

const TASK_WEEK = [5, 3, 8, 6]; // which week of each quarter the task lands on
const CELL = 52;
const GAP = 7;
const LABEL_W = 86;

const Planner: React.FC<{ top: number; fillFrom: number; dimOthers?: number }> = ({ top, fillFrom, dimOthers = 0 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: LEFT, top, width: WIDTH }}>
      <div
        style={{
          fontFamily: BODY_STACK,
          fontWeight: 700,
          fontSize: 32,
          letterSpacing: "0.02em",
          color: COLORS.ink,
          marginBottom: 22,
        }}
      >
        {COPY.gridLabel}
      </div>
      {[0, 1, 2, 3].map((q) => {
        const lit = ramp(f, fillFrom + q * CUE.weeksStep, 6);
        return (
          <div key={q} style={{ display: "flex", alignItems: "center", marginBottom: q < 3 ? 14 : 0 }}>
            <div style={{ width: LABEL_W, fontFamily: DISPLAY_STACK, fontWeight: 800, fontSize: 34, color: COLORS.accent }}>Q{q + 1}</div>
            <div style={{ display: "flex", gap: GAP }}>
              {Array.from({ length: 13 }, (_, w) => {
                const task = w === TASK_WEEK[q];
                return (
                  <div
                    key={w}
                    style={{
                      width: CELL,
                      height: CELL,
                      boxSizing: "border-box",
                      border: `3px solid ${task && lit > 0.5 ? COLORS.accent : "rgba(34,28,21,0.28)"}`,
                      background: task ? `rgba(154,52,18,${lit})` : `rgba(34,28,21,${0.05 + 0.05 * dimOthers})`,
                      transform: task ? `scale(${1 + 0.18 * Math.sin(Math.PI * lit)})` : undefined,
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 26, marginLeft: LABEL_W }}>
        <div style={{ width: 30, height: 30, background: COLORS.accent }} />
        <div style={{ fontFamily: BODY_STACK, fontWeight: 600, fontSize: 28, color: COLORS.muted }}>The week they need it</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// The work surface and a handed-in screen
// ---------------------------------------------------------------------------

const Surface: React.FC<{ top: number; height: number; children: ReactNode; credit?: string }> = ({ top, height, children, credit }) => (
  <div
    style={{
      position: "absolute",
      left: LEFT,
      top,
      width: WIDTH,
      height,
      background: COLORS.dark_canvas,
      borderRadius: 6,
      overflow: "hidden",
    }}
  >
    {children}
    {credit ? (
      <div
        style={{
          position: "absolute",
          left: 34,
          right: 34,
          bottom: 22,
          fontFamily: BODY_STACK,
          fontWeight: 700,
          fontSize: 27,
          color: COLORS.dark_muted,
          letterSpacing: "0.01em",
        }}
      >
        {credit}
      </div>
    ) : null}
  </div>
);

const Handed: React.FC<{ cap: keyof typeof CAPS; height: number; x: number; y: number; delay?: number; tilt?: number }> = ({
  cap,
  height,
  x,
  y,
  delay = CUE.handIn,
  tilt = -1.5,
}) => {
  const f = useCurrentFrame();
  const c = CAPS[cap];
  const width = Math.round((height * c.w) / c.h);
  const p = ramp(f, delay, CUE.handFrames);
  const style: CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    width,
    height,
    transform: `translateX(${(1 - p) * 820}px) rotate(${tilt + (1 - p) * 7}deg)`,
    boxShadow: "0 22px 44px rgba(0,0,0,0.38), 0 3px 0 rgba(0,0,0,0.2)",
    borderRadius: 4,
    overflow: "hidden",
    background: COLORS.surface,
  };
  return (
    <div style={style}>
      <Img src={c.src} style={{ width, height, display: "block" }} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const s = ramp(f, CUE.hookStamp, 6);
  const m = ramp(f, CUE.hookStamp + 6, 12);
  return (
    <>
      <Headline enter={false} size={92}>
        {COPY.hook[0]}
        <br />
        {COPY.hook[1]}
        <div
          style={{
            color: COLORS.accent,
            marginTop: 10,
            opacity: s,
            transform: `scale(${1.18 - 0.18 * s})`,
            transformOrigin: "left center",
          }}
        >
          <Mark p={m}>{COPY.hook[2]}</Mark>
        </div>
      </Headline>
      <Planner top={930} fillFrom={CUE.weeksIn} />
    </>
  );
};

const Remember: React.FC = () => {
  const f = useCurrentFrame();
  const p = ramp(f, CUE.rememberLine2, 10);
  return (
    <>
      <Headline size={80}>{COPY.remember1}</Headline>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 700,
          width: WIDTH,
          fontFamily: DISPLAY_STACK,
          fontWeight: 800,
          fontSize: 60,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: COLORS.accent,
          opacity: p,
          transform: `translateY(${(1 - p) * 20}px)`,
        }}
      >
        {COPY.remember2}
      </div>
      <Planner top={930} fillFrom={-100} dimOthers={1} />
    </>
  );
};

const SCREEN_TOP = 690;
const SCREEN_H = BOTTOM - SCREEN_TOP; // 830

const Rfi: React.FC = () => {
  const h = 690;
  const w = Math.round((h * CAPS.rfi.w) / CAPS.rfi.h);
  return (
    <>
      <Headline size={80}>{COPY.rfiHead}</Headline>
      <Surface top={SCREEN_TOP} height={SCREEN_H} credit={COPY.rfiCredit}>
        <Handed cap="rfi" height={h} x={(WIDTH - w) / 2} y={36} />
      </Surface>
    </>
  );
};

const Card: React.FC = () => {
  const h = 690;
  const w = Math.round((h * CAPS.card.w) / CAPS.card.h);
  return (
    <>
      <Headline size={80}>{COPY.cardHead}</Headline>
      <Surface top={SCREEN_TOP} height={SCREEN_H} credit={COPY.cardCredit}>
        <Handed cap="card" height={h} x={(WIDTH - w) / 2} y={36} tilt={1.5} />
      </Surface>
    </>
  );
};

const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const u = ramp(f, CUE.ctaUrlIn, 8);
  const c = ramp(f, CUE.ctaCallIn, 8);
  const h = 470;
  const w = Math.round((h * CAPS.jobaid.w) / CAPS.jobaid.h);
  return (
    <>
      <Headline size={74}>
        We build courses and job aids. <span style={{ color: COLORS.accent }}>Not sure which it needs? Ask us.</span>
      </Headline>
      <Surface top={780} height={510}>
        <Handed cap="jobaid" height={h} x={34} y={20} delay={2} tilt={-1} />
        <div
          style={{
            position: "absolute",
            left: 34 + w + 36,
            right: 30,
            top: 40,
            fontFamily: BODY_STACK,
            fontWeight: 700,
            fontSize: 30,
            lineHeight: 1.3,
            color: COLORS.dark_ink,
            opacity: ramp(f, 10, 10),
          }}
        >
          <div style={{ color: COLORS.dark_accent, fontSize: 25, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
            On our site
          </div>
          Checklists, decision trees, and reference pieces that live next to the work.
        </div>
      </Surface>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 1318,
          width: WIDTH,
          fontFamily: DISPLAY_STACK,
          fontWeight: 900,
          fontSize: 54,
          letterSpacing: "-0.03em",
          color: COLORS.ink,
          whiteSpace: "nowrap",
          opacity: u,
          transform: `translateY(${(1 - u) * 16}px)`,
        }}
      >
        {COPY.ctaUrl}
      </div>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 1410,
          width: WIDTH,
          height: 104,
          background: COLORS.accent,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: DISPLAY_STACK,
          fontWeight: 900,
          fontSize: 54,
          color: COLORS.canvas,
          opacity: c,
          transform: `translateY(${(1 - c) * 16}px)`,
        }}
      >
        {COPY.ctaCall}
      </div>
    </>
  );
};

export const JobAidReel: React.FC = () => {
  const scenes: [keyof typeof BEATS, React.FC][] = [
    ["hook", Hook],
    ["remember", Remember],
    ["rfi", Rfi],
    ["card", Card],
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
