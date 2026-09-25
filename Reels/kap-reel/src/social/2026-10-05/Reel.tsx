// "5 Google Business Profile settings most businesses forget". Monday 2026-10-05 reel.
//
// Text led, no narration, music bed only. A 17 s cut of the five checks in the
// 2026-10-05-2 carousel, reusing that carousel's route map and evidence cards
// (assets/social/2026-10-05, exported by the carousel's source/build.mjs): two
// are real crops of K&A's own Google Maps listing, three are labeled drawn
// examples. Same route map look: a dark teal street map, rust pins, amber route.
//
// The K&A lockup and ka-performancefl.com sit in a brand row at the top of the
// safe area on every frame. All copy stays inside src/lib/layout.ts safeArea():
// y 288 to 1536, x 108 to 972.

import type { ReactNode } from "react";
import { AbsoluteFill, Composition, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BODY_STACK, COLORS, DISPLAY_STACK, LOGO_PNG } from "../../lib/brand";
import { SAFE_ZONES, safeArea } from "../../lib/layout";
import {
  CTA,
  CTA_CALL_IN,
  CTA_TEXT,
  CTA_URL_IN,
  FPS,
  HOOK,
  HOOK_TEXT,
  STOP_FRAMES,
  STOPS,
  TOTAL_FRAMES,
  stopStart,
} from "./timeline";

const SAFE = safeArea("vertical");
const LEFT = 108;
const RIGHT = SAFE.right; // 972
const WIDTH = RIGHT - LEFT; // 864

const BRAND_TOP = SAFE.top + 20; // 308
const LOGO_H = 84;
const RULE_Y = BRAND_TOP + LOGO_H + 14; // 406
const BODY_TOP = RULE_Y + 34; // 440

const TEAL = COLORS.dark_canvas;
const MINT = COLORS.dark_accent;
const RUST = COLORS.accent;
const AMBER = COLORS.amber;
const INK = COLORS.ink;
const CREAM = COLORS.canvas;

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const ramp = (f: number, start: number, len: number) =>
  interpolate(f, [start, start + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

// The same quiet street grid as the carousel's map panels.
const STREETS = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='480'>` +
    `<g stroke='#5EEAD4' stroke-opacity='.10' stroke-width='2' fill='none'>` +
    Array.from({ length: 12 }, (_, i) => `<path d='M${i * 40} 0v480M0 ${i * 40}h480'/>`).join("") +
    `</g><g stroke='#5EEAD4' stroke-opacity='.16' stroke-width='10' fill='none' stroke-linecap='round'>` +
    `<path d='M-20 150 C 120 120, 260 210, 500 170'/><path d='M300 -20 C 280 160, 360 300, 330 500'/></g></svg>`,
)}")`;

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

const Pin: React.FC<{ label: string; size: number; fill?: string; ring?: string }> = ({ label, size, fill = RUST, ring = CREAM }) => (
  <svg viewBox="0 0 100 128" width={size} height={size * 1.28} style={{ display: "block", flex: "none" }}>
    <path d="M50 124C50 124 8 74 8 44a42 42 0 0 1 84 0c0 30-42 80-42 80z" fill={fill} stroke={ring} strokeWidth={5} />
    <circle cx={50} cy={44} r={27} fill={CREAM} />
    {label === "check" ? (
      <path d="M36 45l10 10 19-22" fill="none" stroke={fill} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <text x={50} y={57} textAnchor="middle" fontFamily={DISPLAY_STACK} fontWeight={900} fontSize={38} fill={fill}>
        {label}
      </text>
    )}
  </svg>
);

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
        color: INK,
        letterSpacing: "-0.01em",
      }}
    >
      ka-performancefl.com
    </div>
    <div style={{ position: "absolute", left: LEFT, top: RULE_Y, width: WIDTH, height: 6, background: RUST }} />
  </>
);

const Highlight: React.FC<{ children: ReactNode }> = ({ children }) => (
  <span
    style={{
      background: `linear-gradient(transparent 60%, rgba(217,119,6,.42) 60%, rgba(217,119,6,.42) 92%, transparent 92%)`,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

/** Five mini pins on a dashed route: where we are in the checklist. */
const Progress: React.FC<{ current: number; top: number }> = ({ current, top }) => {
  const gap = (WIDTH - 5 * 64) / 4;
  return (
    <div style={{ position: "absolute", left: LEFT, top, width: WIDTH, height: 96 }}>
      <div
        style={{
          position: "absolute",
          left: 32,
          right: 32,
          top: 32,
          borderTop: `7px dotted ${AMBER}`,
        }}
      />
      {STOPS.map((s, i) => (
        <div key={s.label} style={{ position: "absolute", left: i * (64 + gap), top: 0, opacity: i <= current ? 1 : 0.35 }}>
          <Pin label={i < current ? "check" : String(i + 1)} size={64} fill={i <= current ? RUST : "#8A7F76"} ring={CREAM} />
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const map = ramp(f, 4, 14);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: BODY_TOP,
          width: WIDTH,
          fontFamily: DISPLAY_STACK,
          fontWeight: 900,
          fontSize: 88,
          lineHeight: 1.0,
          letterSpacing: "-0.03em",
          color: INK,
        }}
      >
        Your Google profile has <Highlight>5 settings</Highlight> most businesses forget.
      </div>
      <Img
        src={staticFile("social/2026-10-05/route.png")}
        style={{
          position: "absolute",
          left: LEFT,
          top: 760,
          width: WIDTH,
          height: "auto",
          opacity: map,
          transform: `translateY(${(1 - map) * 60}px)`,
        }}
      />
    </>
  );
};

const StopBeat: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const s = STOPS[i];
  const band = ramp(f, 0, 8);
  const ev = ramp(f, 5, 12);
  const BAND_H = 300;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: BODY_TOP,
          width: WIDTH,
          height: BAND_H,
          background: `${TEAL} ${STREETS}`,
          backgroundSize: "480px 480px",
          borderRadius: 6,
          padding: "28px 32px 28px 26px",
          boxSizing: "border-box",
          display: "flex",
          gap: 26,
          alignItems: "flex-start",
        }}
      >
        <div style={{ transform: `scale(${0.6 + 0.4 * band})`, transformOrigin: "50% 100%", marginTop: 4 }}>
          <Pin label={String(i + 1)} size={100} />
        </div>
        <div style={{ opacity: band, transform: `translateX(${(1 - band) * 30}px)` }}>
          <div
            style={{
              fontFamily: BODY_STACK,
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              color: AMBER,
            }}
          >
            Stop {i + 1} of 5 &nbsp;/&nbsp; {s.label}
          </div>
          <div
            style={{
              fontFamily: DISPLAY_STACK,
              fontWeight: 800,
              fontSize: 60,
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              color: CREAM,
              marginTop: 12,
            }}
          >
            {s.headline}
          </div>
        </div>
      </div>
      <Img
        src={staticFile(s.evidence)}
        style={{
          position: "absolute",
          left: LEFT,
          top: BODY_TOP + BAND_H + 26,
          width: WIDTH,
          height: "auto",
          opacity: ev,
          transform: `translateY(${(1 - ev) * 50}px)`,
        }}
      />
      <Progress current={i} top={1290} />
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 1410,
          width: WIDTH,
          fontFamily: BODY_STACK,
          fontSize: 28,
          color: COLORS.muted,
        }}
      >
        From Google's own Business Profile help pages
      </div>
    </>
  );
};

const CtaBeat: React.FC = () => {
  const f = useCurrentFrame();
  const head = ramp(f, 0, 8);
  const card = ramp(f, 4, 12);
  const url = ramp(f, CTA_URL_IN, 8);
  const call = ramp(f, CTA_CALL_IN, 8);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: BODY_TOP,
          width: WIDTH,
          fontFamily: DISPLAY_STACK,
          fontWeight: 900,
          fontSize: 74,
          lineHeight: 1.04,
          letterSpacing: "-0.03em",
          color: INK,
          whiteSpace: "nowrap",
          opacity: head,
          transform: `translateY(${(1 - head) * 24}px)`,
        }}
      >
        {CTA_TEXT.headA}
        <br />
        <Highlight>{CTA_TEXT.headB}</Highlight>
      </div>
      <Img
        src={staticFile("social/2026-10-05/listing.png")}
        style={{ position: "absolute", left: LEFT, top: 660, width: WIDTH, height: "auto", opacity: card }}
      />
      <div style={{ position: "absolute", left: LEFT, top: 1060, width: WIDTH, height: 8, background: RUST, opacity: url }} />
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 1090,
          width: WIDTH,
          opacity: url,
          fontFamily: DISPLAY_STACK,
          fontWeight: 800,
          lineHeight: 1.05,
        }}
      >
        <div style={{ fontSize: 76, color: RUST, letterSpacing: "-0.015em" }}>{CTA_TEXT.url}</div>
        <div style={{ fontSize: 46, color: INK }}>{CTA_TEXT.path}</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 1270,
          width: WIDTH,
          opacity: call,
          fontFamily: DISPLAY_STACK,
          fontWeight: 700,
          fontSize: 60,
          color: INK,
        }}
      >
        {CTA_TEXT.call}
      </div>
    </>
  );
};

export const GbpReel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: CREAM }}>
    <Sequence from={HOOK.start} durationInFrames={HOOK.end - HOOK.start} layout="none">
      <Hook />
    </Sequence>
    {STOPS.map((s, i) => (
      <Sequence key={s.label} from={stopStart(i)} durationInFrames={STOP_FRAMES} layout="none">
        <StopBeat i={i} />
      </Sequence>
    ))}
    <Sequence from={CTA.start} durationInFrames={CTA.end - CTA.start} layout="none">
      <CtaBeat />
    </Sequence>
    <BrandRow />
  </AbsoluteFill>
);

export const Mon1005Root: React.FC = () => (
  <Composition
    id="Mon1005GbpVertical"
    component={GbpReel}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={SAFE_ZONES.vertical.width}
    height={SAFE_ZONES.vertical.height}
  />
);
