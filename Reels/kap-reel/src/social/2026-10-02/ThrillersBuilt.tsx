import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { DeviceFrame } from "../../components/DeviceFrame";
import { LogoDraw } from "../../components/LogoDraw";
import { BODY_STACK, COLORS, DISPLAY_STACK } from "../../lib/brand";
import { captureSrc, getCapture } from "../../lib/captures";
import { safeArea } from "../../lib/layout";
import {
  BEATS,
  BOOK,
  BOOK_CUTS,
  BRAND_LINE,
  CAPTURES,
  CARD,
  HOOK,
  LAUNCH,
  NEXT,
  PUNCHES,
  RIDE_CUTS,
  RIDES,
  STACK_TOP,
  KA_URL,
  type Line,
  type Tone,
} from "./timeline";

/**
 * Friday 2026-10-02, revision 2: the Thrillers Mobile VR launch, framed by
 * K&A from the first frame to the last.
 *
 * Every frame carries the same K&A frame: a cream header with the lockup and
 * ka-performancefl.com, and a rust footer reading "Built by K&A Performance",
 * both inside the vertical safe area (top 15 percent, bottom 20 percent, right
 * 10 percent reserved). Between them the client's site plays in a phone on a
 * dark teal stage, cut on the music's beat, with kinetic label type slammed
 * over it. The last 90 frames are the K&A end card, which holds.
 */

const SAFE = safeArea("vertical");

/** The K&A frame. Header and footer bands, canvas px. */
const HEADER = { top: SAFE.top + 8, height: 108 };
const RULE = 6;
const FOOTER = { top: 1432, height: 90 };
/** The stage between them. */
const STAGE = { top: HEADER.top + HEADER.height + RULE, bottom: FOOTER.top };

/** Phone: screen at 522x928 (a 1080x1920 capture at 0.483), 14 px bezel. */
const PHONE = { left: 420, top: 452, screenW: 522, screenH: 928, bezel: 14 };

const LEFT = 44;
/** Right edge nothing we set may pass: the reserved right strip, less a margin. */
const RIGHT_LIMIT = SAFE.right - 16;

const TONES: Record<Tone, { bg: string; fg: string }> = {
  cream: { bg: COLORS.canvas, fg: COLORS.ink },
  rust: { bg: COLORS.accent, fg: COLORS.canvas },
  amber: { bg: COLORS.amber, fg: COLORS.ink },
  ink: { bg: COLORS.ink, fg: COLORS.canvas },
};

const LOGO = staticFile("brand/logo/logo-lockup.webp");

// ---------------------------------------------------------------------------
// The K&A frame
// ---------------------------------------------------------------------------

const Header: React.FC = () => {
  const logoH = 76;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: HEADER.top,
          height: HEADER.height,
          backgroundColor: COLORS.canvas,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: HEADER.top + HEADER.height,
          height: RULE,
          backgroundColor: COLORS.accent,
        }}
      />
      <Img
        src={LOGO}
        style={{
          position: "absolute",
          left: LEFT - 6,
          top: HEADER.top + (HEADER.height - logoH) / 2,
          height: logoH,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 1080 - RIGHT_LIMIT,
          top: HEADER.top,
          height: HEADER.height,
          display: "flex",
          alignItems: "center",
          fontFamily: BODY_STACK,
          fontWeight: 800,
          fontSize: 46,
          letterSpacing: 0.2,
          color: COLORS.accent,
          whiteSpace: "nowrap",
        }}
      >
        {KA_URL}
      </div>
    </>
  );
};

const Footer: React.FC = () => {
  const frame = useCurrentFrame();
  // The two amber marks tick on every beat, the frame's only moving part.
  const t = frame % 15;
  const pulse = interpolate(t, [0, 5], [1.5, 1], { extrapolateRight: "clamp" });
  const mark: CSSProperties = {
    width: 18,
    height: 18,
    backgroundColor: COLORS.amber,
    transform: `scale(${pulse})`,
    flex: "0 0 auto",
  };
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: FOOTER.top,
        height: FOOTER.height,
        backgroundColor: COLORS.accent,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 1080 - SAFE.right,
          right: 1080 - SAFE.right,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <div style={mark} />
        <div
          style={{
            fontFamily: DISPLAY_STACK,
            fontWeight: 800,
            fontSize: 48,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: COLORS.canvas,
            whiteSpace: "nowrap",
          }}
        >
          {BRAND_LINE}
        </div>
        <div style={mark} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage
// ---------------------------------------------------------------------------

/** A rust slab behind the phone that jumps to a new angle on every section. */
const Slab: React.FC = () => {
  const frame = useCurrentFrame();
  const stops: [number, number, number][] = [
    // [frame, centre y, angle]
    [0, 1060, -9],
    [60, 720, 7],
    [120, 1120, -6],
    [240, 780, 8],
    [330, 930, -4],
  ];
  let i = 0;
  for (let k = 0; k < stops.length; k += 1) if (frame >= stops[k][0]) i = k;
  const [at, y, a] = stops[i];
  const prev = stops[Math.max(0, i - 1)];
  const p = interpolate(frame - at, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const cy = i === 0 ? y : prev[1] + (y - prev[1]) * p;
  const ang = i === 0 ? a : prev[2] + (a - prev[2]) * p;
  return (
    <div
      style={{
        position: "absolute",
        left: -300,
        width: 1680,
        top: cy - 170,
        height: 340,
        backgroundColor: COLORS.accent,
        transform: `rotate(${ang}deg)`,
      }}
    />
  );
};

/** Scale bump on every cut, 6 frames. */
function punch(frame: number): number {
  let s = 1;
  for (const p of PUNCHES) {
    const t = frame - p;
    if (t >= 0 && t < 6) s = interpolate(t, [0, 6], [1.06, 1], { easing: Easing.out(Easing.cubic) });
  }
  return s;
}

const Clip: React.FC<{ id: string; trimBefore: number; zoom?: number }> = ({ id, trimBefore, zoom = 1 }) => (
  <OffthreadVideo
    src={captureSrc(getCapture(id))}
    trimBefore={trimBefore}
    muted
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: `scale(${zoom})`,
      transformOrigin: "50% 0%",
    }}
  />
);

const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [BEATS.next.start, BEATS.next.start + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const scale = punch(frame) * (1 - 0.08 * out);
  const tilt = 2.5;
  return (
    <div
      style={{
        position: "absolute",
        left: PHONE.left,
        top: PHONE.top,
        transform: `rotate(${tilt}deg) scale(${scale}) translateY(${out * 40}px)`,
        transformOrigin: "50% 50%",
        opacity: 1 - 0.45 * out,
      }}
    >
      <DeviceFrame screenWidth={PHONE.screenW} screenHeight={PHONE.screenH} bezel={PHONE.bezel} radius={58}>
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          <Sequence from={0} durationInFrames={BEATS.launch.end} layout="none">
            <AbsoluteFill>
              <Clip id={CAPTURES.home} trimBefore={0} />
            </AbsoluteFill>
          </Sequence>
          {RIDE_CUTS.map((c) => (
            <Sequence key={c.name} from={c.at} durationInFrames={30} layout="none">
              <AbsoluteFill>
                <Clip id={CAPTURES.experiences} trimBefore={c.trimBefore} />
              </AbsoluteFill>
            </Sequence>
          ))}
          {BOOK_CUTS.map((c) => (
            <Sequence key={c.at} from={c.at} durationInFrames={30} layout="none">
              <AbsoluteFill>
                <Clip id={CAPTURES.book} trimBefore={c.trimBefore} zoom={c.zoom} />
              </AbsoluteFill>
            </Sequence>
          ))}
          <Sequence from={BEATS.next.start} durationInFrames={BEATS.next.end - BEATS.next.start} layout="none">
            <AbsoluteFill>
              <Clip id={CAPTURES.home} trimBefore={40} />
            </AbsoluteFill>
          </Sequence>
        </div>
      </DeviceFrame>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Kinetic type
// ---------------------------------------------------------------------------

function boxPad(size: number, body?: boolean) {
  return body
    ? { v: Math.round(size * 0.34), h: Math.round(size * 0.5) }
    : { v: Math.round(size * 0.12), h: Math.round(size * 0.2) };
}

function rowHeight(size: number, body?: boolean): number {
  const p = boxPad(size, body);
  return Math.round(size * (body ? 1.25 : 0.98)) + p.v * 2;
}

const GAP = 10;

/** y of each row in a stack, from the largest line that uses the row. */
function rowTops(lines: Line[], top: number): number[] {
  const rows = Math.max(...lines.map((l) => l.row)) + 1;
  const tops: number[] = [];
  let y = top;
  for (let r = 0; r < rows; r += 1) {
    tops.push(y);
    const inRow = lines.filter((l) => l.row === r);
    const h = inRow.length ? Math.max(...inRow.map((l) => rowHeight(l.size, l.body))) : 0;
    y += h + GAP;
  }
  return tops;
}

const Slam: React.FC<{ line: Line; y: number; frame: number }> = ({ line, y, frame }) => {
  if (frame < line.at || frame >= line.until) return null;
  const t = frame - line.at;
  const s = interpolate(t, [0, 4], [0.78, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const x = interpolate(t, [0, 4], [-36, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const tone = TONES[line.tone];
  const pad = boxPad(line.size, line.body);
  return (
    <div
      style={{
        position: "absolute",
        left: LEFT,
        top: y,
        maxWidth: RIGHT_LIMIT - LEFT,
        transform: `translateX(${x}px) scale(${s})`,
        transformOrigin: "0% 50%",
        backgroundColor: tone.bg,
        color: tone.fg,
        padding: `${pad.v}px ${pad.h}px`,
        fontFamily: line.body ? BODY_STACK : DISPLAY_STACK,
        fontWeight: line.body ? 700 : 900,
        fontSize: line.size,
        lineHeight: line.body ? 1.25 : 0.98,
        letterSpacing: line.body ? 0 : -0.02 * line.size,
        whiteSpace: "nowrap",
        boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
      }}
    >
      {line.text}
    </div>
  );
};

const Stack: React.FC<{ lines: Line[]; top: number }> = ({ lines, top }) => {
  const frame = useCurrentFrame();
  const tops = rowTops(lines, top);
  return (
    <>
      {lines.map((l) => (
        <Slam key={`${l.text}-${l.at}`} line={l} y={tops[l.row]} frame={frame} />
      ))}
    </>
  );
};

// ---------------------------------------------------------------------------
// End card
// ---------------------------------------------------------------------------

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const slam = (at: number) => {
    const t = frame - at;
    return {
      visibility: t >= 0 ? ("visible" as const) : ("hidden" as const),
      transform: `scale(${interpolate(t, [0, 4], [0.8, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      })})`,
    };
  };
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: STAGE.top,
        height: STAGE.bottom - STAGE.top,
        backgroundColor: COLORS.canvas,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 1080 - SAFE.right,
          right: 1080 - SAFE.right,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY_STACK,
            fontWeight: 900,
            fontSize: 66,
            letterSpacing: -1.5,
            lineHeight: 1.05,
            color: COLORS.ink,
          }}
        >
          {CARD.kicker}
        </div>
        <div style={{ marginTop: 34 }}>
          <LogoDraw durationFrames={CARD.drawFrames} startT={3} width={760} />
        </div>
        <div
          style={{
            ...slam(CARD.urlIn),
            marginTop: 26,
            backgroundColor: COLORS.accent,
            color: COLORS.canvas,
            padding: "14px 30px",
            fontFamily: BODY_STACK,
            fontWeight: 800,
            fontSize: 68,
            letterSpacing: 0,
            whiteSpace: "nowrap",
          }}
        >
          {CARD.url}
        </div>
        <div
          style={{
            ...slam(CARD.callIn),
            marginTop: 28,
            fontFamily: DISPLAY_STACK,
            fontWeight: 800,
            fontSize: 60,
            color: COLORS.ink,
            whiteSpace: "nowrap",
          }}
        >
          {CARD.call}
        </div>
        <div
          style={{
            ...slam(CARD.callIn),
            marginTop: 16,
            fontFamily: BODY_STACK,
            fontWeight: 600,
            fontSize: 42,
            color: COLORS.muted,
          }}
        >
          {CARD.service}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// The reel
// ---------------------------------------------------------------------------

export const ThrillersBuilt: React.FC = () => {
  const b = BEATS;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark_canvas }}>
      <Sequence from={0} durationInFrames={b.card.start} layout="none">
        <Slab />
        <Phone />
      </Sequence>

      <Stack lines={HOOK} top={STACK_TOP.hook} />
      <Stack lines={LAUNCH} top={STACK_TOP.show - 40} />
      <Stack lines={RIDES} top={STACK_TOP.show} />
      <Stack lines={BOOK} top={STACK_TOP.show} />
      <Stack lines={NEXT} top={STACK_TOP.next} />

      <Sequence from={b.card.start} durationInFrames={b.card.end - b.card.start} layout="none">
        <EndCard />
      </Sequence>

      <Header />
      <Footer />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Thumbnail: one still that sells K&A and shows the url.
// ---------------------------------------------------------------------------

const THUMB_LINES: Line[] = [
  { text: "JUST LAUNCHED", at: -30, until: 30, tone: "amber", size: 58, row: 0 },
  { text: "THRILLERS", at: -30, until: 30, tone: "cream", size: 124, row: 1 },
  { text: "MOBILE VR", at: -30, until: 30, tone: "cream", size: 124, row: 2 },
  { text: "BUILT BY K&A", at: -30, until: 30, tone: "rust", size: 104, row: 3 },
  { text: "Your launch could be next.", at: -30, until: 30, tone: "ink", size: 46, row: 4, body: true },
  { text: KA_URL, at: -30, until: 30, tone: "amber", size: 54, row: 5, body: true },
];

export const ThrillersThumb: React.FC = () => {
  const still = staticFile(getCapture(CAPTURES.home).stillPath.replace(/^assets\//, ""));
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark_canvas }}>
      <div
        style={{
          position: "absolute",
          left: -300,
          width: 1680,
          top: 1000 - 170,
          height: 340,
          backgroundColor: COLORS.accent,
          transform: "rotate(-9deg)",
        }}
      />
      <div style={{ position: "absolute", left: PHONE.left, top: PHONE.top, transform: "rotate(2.5deg)" }}>
        <DeviceFrame screenWidth={PHONE.screenW} screenHeight={PHONE.screenH} bezel={PHONE.bezel} radius={58}>
          <Img src={still} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </DeviceFrame>
      </div>
      <Stack lines={THUMB_LINES} top={500} />
      <Header />
      <Footer />
    </AbsoluteFill>
  );
};
