// "Your hero is a promise, not a photo". Tuesday 2026-10-06 reel.
//
// The parked hero tutorial rebuilt text led: no narration, music bed only.
// One drawn phone (labeled on every frame it appears: a drawn example, not a
// real business) goes from a weak first screen (a stock-style photo and
// "Welcome to our website") to a strong one that states what you do, where,
// proof and the next step. A four-row list on the teal stage crosses, then ticks,
// each item as it lands on the phone. No client site is shown.
//
// The K&A lockup and ka-performancefl.com sit in a brand row at the top of the
// safe area on every frame. All copy stays inside src/lib/layout.ts safeArea():
// y 288 to 1536, x 108 to 972.

import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Img, interpolate, useCurrentFrame } from "remotion";
import "../../lib/fonts";
import { BODY_STACK, COLORS, DISPLAY_STACK, LOGO_PNG } from "../../lib/brand";
import { safeArea } from "../../lib/layout";
import { BEATS, CTA, CUE, DRAWN_LABEL, HEADLINES, ITEMS, WEAK } from "./timeline";

const SAFE = safeArea("vertical");
const LEFT = 108;
const RIGHT = SAFE.right - 6; // 966
const WIDTH = RIGHT - LEFT; // 858

const BRAND_TOP = SAFE.top + 20; // 308
const LOGO_H = 84;
const RULE_Y = BRAND_TOP + LOGO_H + 14; // 406
const HEAD_TOP = RULE_Y + 34; // 440
const STAGE_TOP = 740;
const STAGE_BOTTOM = SAFE.bottom - 14; // 1522
const STAGE_H = STAGE_BOTTOM - STAGE_TOP;

// The phone, in canvas pixels, inside the stage.
const PH_X = LEFT + 34;
const PH_Y = STAGE_TOP + 86;
const PH_W = 420;
const PH_H = STAGE_BOTTOM - PH_Y; // cut by the bottom edge of the stage, like a phone in a hand
const BEZEL = 14;
const SCR_W = PH_W - BEZEL * 2; // 392

const LIST_X = PH_X + PH_W + 40;
const LIST_W = RIGHT - 30 - LIST_X;

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const ramp = (f: number, start: number, len: number) =>
  interpolate(f, [start, start + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const inBeat = (f: number, k: keyof typeof BEATS) => f >= BEATS[k].start && f < BEATS[k].end;

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
// Headline: two lines, the second in rust.
// ---------------------------------------------------------------------------

const Headline: React.FC<{ lines: readonly [string, string] | readonly string[]; start: number; size?: number; enter?: boolean }> = ({
  lines,
  start,
  size = 80,
  enter = true,
}) => {
  const f = useCurrentFrame();
  const p = enter ? ramp(f, start, 8) : 1;
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
        lineHeight: 1.0,
        letterSpacing: "-0.03em",
        color: COLORS.ink,
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px)`,
      }}
    >
      {lines[0]}{" "}
      <span style={{ color: COLORS.accent }}>{lines[1]}</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// The drawn "stock photo": a generic sunrise over hills. Deliberately a drawing.
// ---------------------------------------------------------------------------

const StockPhoto: React.FC<{ w: number; h: number; covered: number }> = ({ w, h, covered }) => (
  <div style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
    <svg width={w} height={h} viewBox="0 0 392 440" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7C8C88" />
          <stop offset="0.55" stopColor="#E8B67A" />
          <stop offset="1" stopColor="#F3D9B1" />
        </linearGradient>
      </defs>
      <rect width="392" height="440" fill="url(#sky)" />
      <circle cx="270" cy="250" r="54" fill="#FBE7C6" opacity="0.9" />
      <path d="M0 300 C 80 240, 150 250, 210 290 S 330 260, 392 280 V 440 H 0 Z" fill="#3E6660" />
      <path d="M0 350 C 100 310, 200 330, 260 360 S 360 330, 392 340 V 440 H 0 Z" fill="#134E4A" />
      <path d="M0 400 C 120 380, 250 390, 392 395 V 440 H 0 Z" fill="#0B302D" />
    </svg>
    <div
      style={{
        position: "absolute",
        right: 10,
        top: 10,
        fontFamily: BODY_STACK,
        fontWeight: 800,
        fontSize: 15,
        letterSpacing: "0.12em",
        color: "#FFFFFF",
        background: "rgba(34,28,21,0.55)",
        padding: "4px 8px",
        opacity: 1 - covered,
      }}
    >
      STOCK PHOTO
    </div>
    {covered > 0 ? (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: COLORS.ink,
          opacity: covered,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: BODY_STACK,
          fontWeight: 800,
          fontSize: 22,
          letterSpacing: "0.14em",
          color: COLORS.canvas,
        }}
      >
        PHOTO COVERED
      </div>
    ) : null}
  </div>
);

// ---------------------------------------------------------------------------
// Numbered marker, square (no pills), tied to the list row.
// ---------------------------------------------------------------------------

const Marker: React.FC<{ n: number; p: number; style?: CSSProperties }> = ({ n, p, style }) => (
  <div
    style={{
      position: "absolute",
      width: 38,
      height: 38,
      background: COLORS.amber,
      color: COLORS.ink,
      fontFamily: DISPLAY_STACK,
      fontWeight: 900,
      fontSize: 26,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 4,
      opacity: p,
      transform: `scale(${0.6 + 0.4 * p})`,
      ...style,
    }}
  >
    {n}
  </div>
);

/** One item on the strong hero: the content, then its numbered marker at the right. */
const Row: React.FC<{ n: number; p: number; gap?: number; top?: boolean; children: ReactNode }> = ({ n, p, gap = 0, top, children }) => (
  <div
    style={{
      marginTop: gap,
      display: "flex",
      alignItems: top ? "flex-start" : "center",
      justifyContent: "space-between",
      gap: 8,
      opacity: p,
      transform: `translateY(${(1 - p) * 16}px)`,
    }}
  >
    <div style={{ minWidth: 0 }}>{children}</div>
    <Marker n={n} p={p} style={{ position: "relative", flex: "none", width: 32, height: 32, fontSize: 22 }} />
  </div>
);

// ---------------------------------------------------------------------------
// The phone.
// ---------------------------------------------------------------------------

const Phone: React.FC = () => {
  const f = useCurrentFrame();
  const shrink = ramp(f, CUE.shrinkIn, CUE.shrinkFrames);
  const strong = f >= CUE.shrinkIn;
  const tick = CUE.tick.map((t) => ramp(f, t, 8));
  const cover = inBeat(f, "test") ? ramp(f, CUE.coverIn, 8) : 0;

  const NAV_H = 64;
  // Weak: the photo fills the first screen under the nav. Strong: it becomes a strip at the bottom.
  const photoH = interpolate(shrink, [0, 1], [470, 190]);
  const photoTop = interpolate(shrink, [0, 1], [NAV_H, NAV_H + 430]);


  return (
    <div
      style={{
        position: "absolute",
        left: PH_X,
        top: PH_Y,
        width: PH_W,
        height: PH_H,
        background: "#1A1510",
        borderRadius: "46px 46px 0 0",
        padding: `${BEZEL}px ${BEZEL}px 0`,
        boxSizing: "border-box",
        boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          position: "relative",
          width: SCR_W,
          height: PH_H - BEZEL,
          background: COLORS.surface,
          borderRadius: "34px 34px 0 0",
          overflow: "hidden",
        }}
      >
        {/* nav */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: SCR_W,
            height: NAV_H,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 22px 0",
            boxSizing: "border-box",
            borderBottom: "1px solid rgba(34,28,21,0.12)",
          }}
        >
          <div
            style={{
              border: `2px solid ${COLORS.muted}`,
              padding: "3px 10px",
              fontFamily: BODY_STACK,
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: "0.14em",
              color: COLORS.muted,
            }}
          >
            LOGO
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {strong ? (
              <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 800, fontSize: 20, color: COLORS.accent, opacity: tick[3] }}>Call</div>
            ) : null}
            <div style={{ width: 28 }}>
              {[0, 1, 2].map((k) => (
                <div key={k} style={{ height: 3, background: COLORS.ink, marginBottom: k < 2 ? 6 : 0 }} />
              ))}
            </div>
          </div>
        </div>

        {/* photo */}
        <div style={{ position: "absolute", left: 0, top: photoTop, width: SCR_W, height: photoH }}>
          <StockPhoto w={SCR_W} h={photoH} covered={cover} />
          {!strong ? (
            <div style={{ position: "absolute", left: 24, right: 24, bottom: 40 }}>
              <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 800, fontSize: 38, lineHeight: 1.05, color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.35)" }}>
                {WEAK.headline}
              </div>
              <div style={{ marginTop: 10, fontFamily: BODY_STACK, fontWeight: 600, fontSize: 19, color: "#FFFFFF", opacity: 0.9 }}>{WEAK.sub}</div>
            </div>
          ) : null}
        </div>

        {!strong ? (
          <div style={{ position: "absolute", left: 24, top: NAV_H + 470 + 30, width: SCR_W - 48 }}>
            <div style={{ fontFamily: BODY_STACK, fontWeight: 800, fontSize: 18, letterSpacing: "0.14em", color: COLORS.muted }}>OUR STORY</div>
            {[300, 330, 250].map((w, k) => (
              <div key={k} style={{ marginTop: 16, width: w, height: 12, background: "rgba(34,28,21,0.12)" }} />
            ))}
          </div>
        ) : null}

        {/* the strong first screen */}
        {strong ? (
          <div style={{ position: "absolute", left: 22, top: NAV_H + 30, width: SCR_W - 38 }}>
            <Row n={1} p={tick[0]} top>
              <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 900, fontSize: 44, lineHeight: 1.02, letterSpacing: "-0.02em", color: COLORS.ink }}>
                {ITEMS[0].strong}
              </div>
            </Row>
            <Row n={2} p={tick[1]} gap={16}>
              <div style={{ fontFamily: BODY_STACK, fontWeight: 700, fontSize: 23, color: COLORS.ink }}>{ITEMS[1].strong}</div>
            </Row>
            <Row n={3} p={tick[2]} gap={10}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: COLORS.amber, fontSize: 22, letterSpacing: "0.02em" }}>{"★★★★★"}</span>
                <span style={{ fontFamily: BODY_STACK, fontWeight: 700, fontSize: 20, color: COLORS.muted }}>{ITEMS[2].strong}</span>
              </div>
            </Row>
            <Row n={4} p={tick[3]} gap={20}>
              <div
                style={{
                  width: 220,
                  height: 58,
                  background: COLORS.accent,
                  color: COLORS.canvas,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: DISPLAY_STACK,
                  fontWeight: 800,
                  fontSize: 24,
                }}
              >
                {ITEMS[3].strong}
              </div>
            </Row>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// The four-row list on the stage.
// ---------------------------------------------------------------------------

const Cross: React.FC<{ p: number }> = ({ p }) => (
  <svg width="44" height="44" viewBox="0 0 44 44" style={{ opacity: p, transform: `scale(${1.4 - 0.4 * p})` }}>
    <path d="M10 10 L34 34 M34 10 L10 34" stroke="#F2A58A" strokeWidth="6" strokeLinecap="round" />
  </svg>
);
const Tick: React.FC<{ p: number }> = ({ p }) => (
  <svg width="44" height="44" viewBox="0 0 44 44" style={{ opacity: p, transform: `scale(${1.4 - 0.4 * p})` }}>
    <path d="M8 23 L18 33 L37 10" fill="none" stroke={COLORS.dark_accent} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const List: React.FC = () => {
  const f = useCurrentFrame();
  const strong = f >= CUE.shrinkIn;
  return (
    <div style={{ position: "absolute", left: LIST_X, top: STAGE_TOP + 110, width: LIST_W }}>
      <div style={{ fontFamily: BODY_STACK, fontWeight: 800, fontSize: 24, letterSpacing: "0.12em", color: COLORS.dark_muted, marginBottom: 18 }}>
        IN THE FIRST SCREEN
      </div>
      {ITEMS.map((it, i) => {
        const x = ramp(f, CUE.cross[i], 6);
        const t = ramp(f, CUE.tick[i], 8);
        const done = strong && t > 0;
        return (
          <div
            key={it.n}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              height: 118,
              borderTop: `2px solid rgba(240,247,245,0.18)`,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                flex: "none",
                background: COLORS.amber,
                color: COLORS.ink,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: DISPLAY_STACK,
                fontWeight: 900,
                fontSize: 28,
              }}
            >
              {it.n}
            </div>
            <div
              style={{
                flex: 1,
                fontFamily: DISPLAY_STACK,
                fontWeight: 800,
                fontSize: 36,
                lineHeight: 1.05,
                color: COLORS.dark_ink,
                opacity: done || !strong ? 1 : 0.55,
              }}
            >
              {it.label}
            </div>
            <div style={{ width: 44, height: 44, flex: "none" }}>{strong ? <Tick p={t} /> : <Cross p={x} />}</div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage: teal panel, the drawn-example label, the phone and the list.
// ---------------------------------------------------------------------------

const Stage: React.FC<{ children?: ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: LEFT,
      top: STAGE_TOP,
      width: WIDTH,
      height: STAGE_H,
      background: COLORS.dark_canvas,
      borderRadius: 6,
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

const DrawnLabel: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: LEFT + 34,
      top: STAGE_TOP + 30,
      fontFamily: BODY_STACK,
      fontWeight: 800,
      fontSize: 26,
      letterSpacing: "0.06em",
      color: COLORS.dark_ink,
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <span style={{ width: 16, height: 16, background: COLORS.amber, display: "inline-block" }} />
    {DRAWN_LABEL}
  </div>
);

const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const u = ramp(f, CUE.ctaUrlIn, 8);
  const c = ramp(f, CUE.ctaCallIn, 8);
  return (
    <div style={{ position: "absolute", left: LEFT, top: STAGE_TOP, width: WIDTH, height: STAGE_H }}>
      <div style={{ position: "absolute", left: 50, right: 50, top: 90 }}>
        <div style={{ fontFamily: BODY_STACK, fontWeight: 800, fontSize: 28, letterSpacing: "0.12em", color: COLORS.dark_muted }}>
          WHAT YOU DO. WHERE. PROOF. THE NEXT STEP.
        </div>
        <div
          style={{
            marginTop: 70,
            fontFamily: DISPLAY_STACK,
            fontWeight: 900,
            fontSize: 66,
            letterSpacing: "-0.03em",
            color: COLORS.dark_ink,
            whiteSpace: "nowrap",
            opacity: u,
            transform: `translateY(${(1 - u) * 20}px)`,
          }}
        >
          {CTA.url}
        </div>
        <div style={{ marginTop: 10, fontFamily: BODY_STACK, fontWeight: 700, fontSize: 38, color: COLORS.dark_accent, opacity: u }}>{CTA.page}</div>
        <div
          style={{
            marginTop: 90,
            height: 130,
            background: COLORS.amber,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: DISPLAY_STACK,
            fontWeight: 900,
            fontSize: 60,
            color: COLORS.ink,
            opacity: c,
            transform: `translateY(${(1 - c) * 20}px)`,
          }}
        >
          {CTA.call}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------

export const HeroPromiseReel: React.FC = () => {
  const f = useCurrentFrame();
  const beat = (Object.keys(BEATS) as (keyof typeof BEATS)[]).find((k) => inBeat(f, k)) ?? "cta";
  const showPhone = beat !== "cta";
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.canvas }}>
      <Headline lines={HEADLINES[beat]} start={BEATS[beat].start} enter={beat !== "hook"} size={80} />
      <Stage />
      {showPhone ? (
        <>
          <Phone />
          <List />
          <DrawnLabel />
        </>
      ) : (
        <Cta />
      )}
      <BrandRow />
    </AbsoluteFill>
  );
};
