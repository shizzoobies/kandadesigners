import type { CSSProperties } from "react";
import { AbsoluteFill, Composition, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BODY_STACK, COLORS, DISPLAY_STACK } from "../../lib/brand";
import { safeArea } from "../../lib/layout";
import capturesJson from "../../tutorial/onescreen/captures.json";
import { BEATS, CHROME, CTA, FPS, HEIGHT, HOOK_QUOTE, SECTIONS, TOTAL_FRAMES, WIDTH, type Section } from "./beats";

// Safe area for the vertical crop: y 288 to 1536, x 0 to 972. All text and the
// logo sit in the canvas centered column 108 to 972, inside it.
const SAFE = safeArea("vertical");
const COL_L = 108;
const COL_R = SAFE.right; // 972
const COL_W = COL_R - COL_L; // 864

const MAST_TOP = SAFE.top + 18; // 306
const MAST_RULE = 418;
const BODY_TOP = 452;
const FOOT_RULE = 1452;
const FOOT_TEXT = 1472;

const PAPER = COLORS.canvas;
const INK = COLORS.ink;
const RUST = COLORS.accent;
const MUTED = COLORS.muted;

type Box = { x: number; y: number; width: number; height: number };
type Cap = { id: string; file: string; tap: Box | null };
const CAPS = (capturesJson as { captures: Cap[] }).captures;
const cap = (id: string): Cap => {
  const c = CAPS.find((x) => x.id === id);
  if (!c) throw new Error(`no capture ${id}`);
  return c;
};
const capSrc = (id: string) => staticFile(cap(id).file.replace(/^assets\//, ""));

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.2, 0.7, 0.2, 1);

function smallCaps(color: string, size = 26): CSSProperties {
  return {
    fontFamily: BODY_STACK,
    fontSize: size,
    fontWeight: 700,
    letterSpacing: size * 0.16,
    textTransform: "uppercase",
    color,
    lineHeight: 1.1,
    whiteSpace: "nowrap",
  };
}

/** Faint paper grain: two soft gradients, no texture file. */
const Paper: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: PAPER,
      backgroundImage:
        "radial-gradient(ellipse at 20% 10%, rgba(255,253,249,0.9), rgba(255,253,249,0) 60%), " +
        "radial-gradient(ellipse at 90% 95%, rgba(154,52,18,0.05), rgba(154,52,18,0) 55%)",
    }}
  />
);

/** Masthead and folio. On every frame. */
const Chrome: React.FC = () => (
  <AbsoluteFill>
    <Img
      src={staticFile("brand/logo/logo-lockup.webp")}
      style={{ position: "absolute", left: COL_L - 8, top: MAST_TOP, width: 270, mixBlendMode: "multiply" }}
    />
    <div style={{ position: "absolute", right: WIDTH - COL_R, top: MAST_TOP + 14, textAlign: "right" }}>
      <div style={smallCaps(RUST, 22)}>{CHROME.mastKicker}</div>
      <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 700, fontSize: 34, color: INK, marginTop: 8, whiteSpace: "nowrap" }}>
        {CHROME.mastTitle}
      </div>
    </div>
    {/* Rust double rule. */}
    <div style={{ position: "absolute", left: COL_L, width: COL_W, top: MAST_RULE, height: 5, background: RUST }} />
    <div style={{ position: "absolute", left: COL_L, width: COL_W, top: MAST_RULE + 10, height: 2, background: RUST }} />
    {/* Footer. */}
    <div style={{ position: "absolute", left: COL_L, width: COL_W, top: FOOT_RULE, height: 2, background: RUST }} />
    <div
      style={{
        position: "absolute",
        left: COL_L,
        width: COL_W,
        top: FOOT_TEXT,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
      }}
    >
      <span style={smallCaps(MUTED, 22)}>{CHROME.footLeft}</span>
      <span style={{ fontFamily: DISPLAY_STACK, fontWeight: 800, fontSize: 34, color: RUST, whiteSpace: "nowrap" }}>
        {CHROME.footRight}
      </span>
    </div>
  </AbsoluteFill>
);

/** A rust rule that draws left to right. */
const Rule: React.FC<{ top: number; delay?: number; width?: number; height?: number }> = ({ top, delay = 0, width = COL_W, height = 3 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [delay, delay + 12], [0, 1], { ...clamp, easing: ease });
  return <div style={{ position: "absolute", left: COL_L, top, width: width * p, height, background: RUST }} />;
};

const HOOK_WORDS = HOOK_QUOTE.split(" ");

/** Beat 1. The pull quote, whole on frame 0. */
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  // The highlight under "two things" sweeps in; the words themselves are there from frame 0.
  const hl = interpolate(f, [6, 22], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: COL_L - 10,
          top: BODY_TOP - 40,
          fontFamily: DISPLAY_STACK,
          fontWeight: 900,
          fontSize: 300,
          lineHeight: 1,
          color: RUST,
        }}
      >
        {"“"}
      </div>
      <div
        style={{
          position: "absolute",
          left: COL_L,
          width: COL_W,
          top: 640,
          fontFamily: DISPLAY_STACK,
          fontWeight: 800,
          fontSize: 96,
          lineHeight: 1.04,
          letterSpacing: -2,
          color: INK,
        }}
      >
        {HOOK_WORDS.map((w, i) => {
          const isTwo = w === "two" || w === "things,";
          const isLast = i === HOOK_WORDS.length - 1;
          return (
            <span key={i}>
            <span style={{ position: "relative", whiteSpace: "nowrap", color: isLast ? RUST : INK }}>
              {isTwo ? (
                <span
                  style={{
                    position: "absolute",
                    left: -4,
                    right: w === "two" ? -26 : -4,
                    bottom: 8,
                    height: 30,
                    background: "#F0C58C", // amber tint on cream, a highlight only
                    opacity: 1,
                    transformOrigin: "left",
                    transform: `scaleX(${hl})`,
                    zIndex: 0,
                  }}
                />
              ) : null}
              <span style={{ position: "relative", zIndex: 1 }}>{w}</span>
            </span>
            {isLast ? "" : " "}
            </span>
          );
        })}
      </div>
      <Rule top={1180} delay={8} width={220} height={6} />
      <div style={{ position: "absolute", left: COL_L, top: 1212, width: COL_W }}>
        <div style={smallCaps(RUST, 26)}>One screen, one decision</div>
        <div style={{ fontFamily: BODY_STACK, fontSize: 36, fontWeight: 500, color: INK, marginTop: 14, lineHeight: 1.3 }}>
          How K&A builds every course, shown in a real one.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const PHOTO_TOP = 734;
const PHOTO_INSET = 12; // keeps the hairline outline (offset 8, 2px) inside x 972
const PHOTO_W = COL_W - PHOTO_INSET * 2;
const PHOTO_SCALE = PHOTO_W / 1080;

/** A real capture set like a photo: cropped, hairline border, caption under it. */
const Photo: React.FC<{ s: Section }> = ({ s }) => {
  const f = useCurrentFrame();
  const [y0, y1] = s.crop;
  const h = Math.round((y1 - y0) * PHOTO_SCALE);
  const enter = interpolate(f, [4, 20], [0, 1], { ...clamp, easing: ease });
  const current = [...s.shots].reverse().find((x) => f >= x.from) ?? s.shots[0];
  const tapBox = s.tapAt !== undefined ? cap(s.shots[0].id).tap : null;
  let tap: React.ReactNode = null;
  if (tapBox && s.tapAt !== undefined) {
    const t = f - s.tapAt;
    if (t >= -10 && t <= 18) {
      const cx = (tapBox.x + tapBox.width / 2) * PHOTO_SCALE;
      const cy = (tapBox.y + tapBox.height / 2 - y0) * PHOTO_SCALE;
      const r = interpolate(t, [-10, 0, 18], [70, 36, 90], clamp);
      const o = interpolate(t, [-10, -4, 6, 18], [0, 1, 1, 0], clamp);
      tap = (
        <div
          style={{
            position: "absolute",
            left: cx - r,
            top: cy - r,
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            border: `8px solid ${COLORS.amber}`,
            opacity: o,
            boxSizing: "border-box",
          }}
        />
      );
    }
  }
  return (
    <div
      style={{
        position: "absolute",
        left: COL_L + PHOTO_INSET,
        top: PHOTO_TOP + (1 - enter) * 40,
        width: PHOTO_W,
        opacity: enter,
      }}
    >
      <div
        style={{
          position: "relative",
          width: PHOTO_W,
          height: h,
          overflow: "hidden",
          outline: `2px solid ${INK}`,
          outlineOffset: 8,
          boxShadow: "0 22px 40px rgba(34,28,21,0.22)",
        }}
      >
        <Img src={capSrc(current.id)} style={{ position: "absolute", left: 0, top: -y0 * PHOTO_SCALE, width: PHOTO_W }} />
        {tap}
      </div>
      <div
        style={{
          position: "absolute",
          left: -8,
          top: -50,
          background: RUST,
          padding: "9px 16px 7px",
          ...smallCaps(PAPER, 22),
        }}
      >
        {s.tag}
      </div>
    </div>
  );
};

/** Beats 2 to 4. Big numeral, kicker, headline, photo, dek. */
const SectionPage: React.FC<{ s: Section }> = ({ s }) => {
  const f = useCurrentFrame();
  const inA = interpolate(f, [0, 10], [0, 1], { ...clamp, easing: ease });
  const inDek = interpolate(f, [30, 42], [0, 1], { ...clamp, easing: ease });
  const h = Math.round((s.crop[1] - s.crop[0]) * PHOTO_SCALE);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: COL_L - 6,
          top: BODY_TOP - 8,
          fontFamily: DISPLAY_STACK,
          fontWeight: 900,
          fontSize: 230,
          lineHeight: 0.9,
          letterSpacing: -10,
          color: RUST,
          opacity: inA,
          transform: `translateY(${(1 - inA) * 30}px)`,
        }}
      >
        {s.numeral}
      </div>
      <div
        style={{
          position: "absolute",
          left: COL_L + 290,
          width: COL_W - 290,
          top: BODY_TOP + 6,
          opacity: inA,
          transform: `translateX(${(1 - inA) * 24}px)`,
        }}
      >
        <div style={smallCaps(RUST, 26)}>{s.kicker}</div>
        <div
          style={{
            fontFamily: DISPLAY_STACK,
            fontWeight: 800,
            fontSize: 46,
            lineHeight: 1.06,
            letterSpacing: -0.5,
            color: INK,
            marginTop: 12,
          }}
        >
          {s.headline}
        </div>
      </div>
      <Photo s={s} />
      <div
        style={{
          position: "absolute",
          left: COL_L,
          width: COL_W,
          top: PHOTO_TOP + h + 34,
          opacity: inDek,
        }}
      >
        <div style={{ fontFamily: BODY_STACK, fontSize: 38, fontWeight: 700, color: INK, lineHeight: 1.25 }}>{s.dek}</div>
        <div style={{ fontFamily: BODY_STACK, fontSize: 24, fontWeight: 500, color: MUTED, marginTop: 10 }}>{s.credit}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Beat 5. Holds to the last frame. */
const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, 12], [0, 1], { ...clamp, easing: ease });
  const b = interpolate(f, [30, 42], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: COL_L, width: COL_W, top: BODY_TOP + 20, opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
        <div style={smallCaps(RUST, 28)}>{CTA.kicker}</div>
        <div
          style={{
            fontFamily: DISPLAY_STACK,
            fontWeight: 900,
            fontSize: 112,
            lineHeight: 1.0,
            letterSpacing: -3,
            color: INK,
            marginTop: 22,
          }}
        >
          We design training people <span style={{ color: RUST }}>finish.</span>
        </div>
      </div>
      <Rule top={1000} delay={14} height={5} />
      <div style={{ position: "absolute", left: COL_L, width: COL_W, top: 1040, opacity: b, transform: `translateY(${(1 - b) * 20}px)` }}>
        <div style={{ fontFamily: BODY_STACK, fontSize: 36, fontWeight: 500, color: MUTED }}>{CTA.lead}</div>
        <div style={{ fontFamily: DISPLAY_STACK, fontSize: 52, fontWeight: 800, color: RUST, marginTop: 8, letterSpacing: -0.5, whiteSpace: "nowrap" }}>
          {CTA.url}
        </div>
        <div style={{ fontFamily: DISPLAY_STACK, fontSize: 52, fontWeight: 800, color: INK, marginTop: 36, whiteSpace: "nowrap" }}>
          {CTA.call}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const WedOneScreen: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <Paper />
    {BEATS.map((b) => {
      let node: React.ReactNode;
      if (b.id === "hook") node = <Hook />;
      else if (b.id === "cta") node = <EndCard />;
      else node = <SectionPage s={SECTIONS.find((s) => s.id === b.id)!} />;
      return (
        <Sequence key={b.id} from={b.start} durationInFrames={b.end - b.start} name={b.id} layout="none">
          {node}
        </Sequence>
      );
    })}
    <Chrome />
  </AbsoluteFill>
);

export const Wed0930Root: React.FC = () => (
  <Composition
    id="Wed0930OneScreen"
    component={WedOneScreen}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
