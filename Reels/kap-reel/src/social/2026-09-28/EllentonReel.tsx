import type { CSSProperties, ReactNode } from "react";
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
import { BODY_STACK, COLORS, DISPLAY_STACK } from "../../lib/brand";
import { safeArea } from "../../lib/layout";
import {
  ASSETS,
  BEATS,
  type Box,
  COPY,
  CUES,
  LISTING_BOX,
  OVERVIEW_NAME_BOX,
  PIN,
  PLAYBACK,
  REGIONS,
} from "./ellenton";

/**
 * Ellenton Family Practice Direct in the top three. 15 seconds, 1080x1920.
 *
 * The K&A frame is on screen for all 450 frames: a cream header bar with the
 * logo and the topic, a dark teal stage, and a cream footer bar with the url.
 * Every piece of text and the logo sit inside safeArea("vertical"): y 288 to
 * 1536, x up to 972. The recordings sit in a browser card with a rust edge,
 * never full bleed. Overlays point at what is on the page; nothing on it is
 * edited.
 */

const SAFE = safeArea("vertical");
const W = 1080;
const SIDE = 108; // centered 864 box: 108 to 972, whose right edge is safe.right.
const BOX_W = W - SIDE * 2;

const HEADER = { top: 268, height: 144 };
const FOOTER = { top: 1394, height: 136 }; // ends at 1530, inside safe.bottom 1536.
const CALLOUT_TOP = 432;
// Cards and their headlines use the widest box the stage allows: x 24 to 972,
// the right 10% (972 to 1080) clear of the platform UI.
const CARD = { left: 24, width: 948, top: 606, strip: 34, border: 3, innerH: 734 };
const OVERVIEW_INNER_H = 540;
const INNER_W = CARD.width - CARD.border * 2;

const LOGO = staticFile("brand/logo/logo-lockup.webp");
const LOGO_ASPECT = 800 / 303;

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------------------------------------------------------------------------
// Frame pieces
// ---------------------------------------------------------------------------

const Header: React.FC = () => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [BEATS.build.start, BEATS.build.start + 14], [0, 1], {
    ...clamp,
    easing: ease,
  });
  const logoH = 84 + 18 * grow;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: HEADER.top,
        height: HEADER.height,
        backgroundColor: COLORS.canvas,
        borderBottom: `4px solid ${COLORS.accent}`,
      }}
    >
      <Img
        src={LOGO}
        style={{
          position: "absolute",
          left: SIDE - 36,
          top: (HEADER.height - logoH) / 2,
          height: logoH,
          width: logoH * LOGO_ASPECT,
          maxWidth: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: W - SAFE.right + 36,
          top: 0,
          height: HEADER.height,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY_STACK,
            fontWeight: 800,
            fontSize: 32,
            letterSpacing: 5,
            color: COLORS.accent,
          }}
        >
          {COPY.topic}
        </div>
        <div style={{ marginTop: 8, width: 72, height: 5, backgroundColor: COLORS.amber }} />
      </div>
    </div>
  );
};

const Footer: React.FC = () => {
  const frame = useCurrentFrame();
  const grow = interpolate(
    frame,
    [BEATS.cta.start + CUES.ctaUrl, BEATS.cta.start + CUES.ctaUrl + 10],
    [0, 1],
    { ...clamp, easing: ease },
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: FOOTER.top,
        height: FOOTER.height,
        backgroundColor: COLORS.canvas,
        borderTop: `4px solid ${COLORS.accent}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: DISPLAY_STACK,
          fontWeight: 800,
          fontSize: 62 + 16 * grow,
          letterSpacing: -0.5,
          color: COLORS.accent,
        }}
      >
        {COPY.url}
      </div>
    </div>
  );
};

/** A line that slams up into place over six frames from its start frame. */
const Line: React.FC<{ text: string; start: number; style: CSSProperties }> = ({
  text,
  start,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + 6], [0, 1], { ...clamp, easing: ease });
  return (
    <div
      style={{
        fontFamily: DISPLAY_STACK,
        fontWeight: 800,
        lineHeight: 1.1,
        letterSpacing: -1,
        textAlign: "center",
        textWrap: "balance",
        opacity: p,
        transform: `translateY(${(1 - p) * 28}px)`,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

const Callout: React.FC<{ children: ReactNode; top?: number }> = ({ children, top = CALLOUT_TOP }) => (
  <div
    style={{
      position: "absolute",
      left: CARD.left,
      width: CARD.width,
      top,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// The browser card
// ---------------------------------------------------------------------------

type Media =
  | { kind: "still"; src: string }
  | { kind: "video"; src: string; trimBefore: number; playbackRate: number };

const lerpBox = (a: Box, b: Box, t: number): Box => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});

/**
 * The recording, punched in on `region` (source pixels), inside a card with a
 * light chrome strip, a rust edge and a soft shadow. `overlay` is drawn in an
 * SVG with a 1280x720 viewBox laid exactly over the footage, so overlay shapes
 * are authored in source pixels too.
 */
const BrowserCard: React.FC<{
  media: Media;
  region: Box;
  top?: number;
  innerH?: number;
  scale?: number;
  overlay?: ReactNode;
}> = ({ media, region, top = CARD.top, innerH, scale = 1, overlay }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 7], [0, 1], { ...clamp, easing: ease });
  const s = INNER_W / region.w;
  const h = innerH ?? Math.round(region.h * s);
  const mediaStyle: CSSProperties = {
    position: "absolute",
    left: -region.x * s,
    top: -region.y * s,
    width: 1280 * s,
    height: 720 * s,
    // Tailwind preflight caps img, video and svg at max-width 100%.
    maxWidth: "none",
    maxHeight: "none",
  };
  return (
    <div
      style={{
        position: "absolute",
        left: CARD.left,
        width: CARD.width,
        top,
        transform: `scale(${(0.965 + 0.035 * enter) * scale})`,
        transformOrigin: "50% 40%",
        border: `${CARD.border}px solid ${COLORS.accent}`,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: COLORS.surface,
        boxShadow: "0 28px 70px rgba(0, 0, 0, 0.5), 0 6px 18px rgba(0, 0, 0, 0.35)",
      }}
    >
      <div
        style={{
          height: CARD.strip,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 8,
          backgroundColor: COLORS.canvas,
          borderBottom: "1px solid #E4DDD5",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: "#CFC6BC" }} />
        ))}
        <div
          style={{
            marginLeft: "auto",
            fontFamily: BODY_STACK,
            fontSize: 21,
            fontWeight: 600,
            color: COLORS.muted,
            letterSpacing: 0.3,
          }}
        >
          {COPY.cardStamp}
        </div>
      </div>
      <div style={{ position: "relative", width: INNER_W, height: h, overflow: "hidden" }}>
        {media.kind === "still" ? (
          <Img src={staticFile(media.src)} style={mediaStyle} />
        ) : (
          <OffthreadVideo
            src={staticFile(media.src)}
            trimBefore={media.trimBefore}
            playbackRate={media.playbackRate}
            muted
            style={mediaStyle}
          />
        )}
        {overlay ? (
          <svg viewBox="0 0 1280 720" style={{ ...mediaStyle, overflow: "visible" }}>
            {overlay}
          </svg>
        ) : null}
      </div>
    </div>
  );
};

/**
 * Amber ring around a source box. It settles in from a little outside the box
 * while it fades up, progress 0 to 1, and holds as a closed ring at 1.
 */
const Ring: React.FC<{ box: Box; progress: number; pad?: number }> = ({ box, progress, pad = 6 }) => {
  const grow = pad + (1 - progress) * 24;
  return (
    <rect
      x={box.x - grow}
      y={box.y - grow}
      width={box.w + grow * 2}
      height={box.h + grow * 2}
      rx={8}
      fill="none"
      stroke={COLORS.amber}
      strokeWidth={6}
      vectorEffect="non-scaling-stroke"
      opacity={progress}
    />
  );
};

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const HOOK_SIZE = 70;

const HookBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const ring = interpolate(frame, [0, 12], [0.35, 1], { ...clamp, easing: ease });
  return (
    <>
      <Callout>
        <Line text={COPY.hook[0]} start={-6} style={{ fontSize: HOOK_SIZE, color: COLORS.canvas }} />
        <Line text={COPY.hook[1]} start={CUES.hookSecond} style={{ fontSize: HOOK_SIZE, color: COLORS.amber }} />
      </Callout>
      <BrowserCard
        media={{ kind: "still", src: ASSETS.mapPack }}
        region={REGIONS.hook}
        overlay={<Ring box={LISTING_BOX} progress={ring} />}
      />
    </>
  );
};

const TypingBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const len = BEATS.typing.end - BEATS.typing.start;
  const t = interpolate(frame, [0, len], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <>
      <Callout>
        <Line text={COPY.typing} start={0} style={{ fontSize: 64, color: COLORS.canvas }} />
      </Callout>
      <BrowserCard
        media={{ kind: "video", src: ASSETS.take2, ...PLAYBACK.typing }}
        region={lerpBox(REGIONS.typingFrom, REGIONS.typingTo, t)}
        innerH={CARD.innerH}
      />
    </>
  );
};

const MapBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 54], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const ring = interpolate(frame, [40, 60], [0, 1], { ...clamp, easing: ease });
  const pulse = frame >= 48 ? ((frame - 48) % 30) / 30 : -1;
  return (
    <>
      <Callout>
        <Line text={COPY.map[0]} start={0} style={{ fontSize: 66, color: COLORS.canvas }} />
        <Line text={COPY.map[1]} start={CUES.mapSecond} style={{ fontSize: 66, color: COLORS.amber }} />
      </Callout>
      <BrowserCard
        media={{ kind: "still", src: ASSETS.mapPack }}
        region={lerpBox(REGIONS.mapFrom, REGIONS.mapTo, t)}
        innerH={CARD.innerH}
        overlay={
          <>
            <Ring box={LISTING_BOX} progress={ring} />
            {pulse >= 0 ? (
              <>
                <circle
                  cx={PIN.x}
                  cy={PIN.y}
                  r={14 + 34 * pulse}
                  fill="none"
                  stroke={COLORS.amber}
                  strokeWidth={5}
                  vectorEffect="non-scaling-stroke"
                  opacity={1 - pulse}
                />
                <circle
                  cx={PIN.x}
                  cy={PIN.y}
                  r={16}
                  fill="none"
                  stroke={COLORS.amber}
                  strokeWidth={5}
                  vectorEffect="non-scaling-stroke"
                />
              </>
            ) : null}
          </>
        }
      />
    </>
  );
};

const OverviewBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [12, 30], [0, 1], { ...clamp, easing: ease });
  // Whole sentence first, then a push in on the name line, then hold.
  const push = interpolate(frame, [40, 62], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const b = OVERVIEW_NAME_BOX;
  return (
    <>
      <Callout top={510}>
        <Line text={COPY.overview} start={0} style={{ fontSize: 72, color: COLORS.canvas }} />
      </Callout>
      <BrowserCard
        media={{ kind: "video", src: ASSETS.take1, ...PLAYBACK.overview }}
        region={lerpBox(REGIONS.overviewFrom, REGIONS.overviewTo, push)}
        innerH={OVERVIEW_INNER_H}
        top={700}
        overlay={
          <rect
            x={b.x - 2}
            y={b.y - 1}
            width={(b.w + 4) * sweep}
            height={b.h + 2}
            fill={COLORS.amber}
            opacity={0.5}
            style={{ mixBlendMode: "multiply" }}
          />
        }
      />
    </>
  );
};

const BuildBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const shrink = interpolate(frame, [0, 16], [1, 0.74], { ...clamp, easing: ease });
  return (
    <>
      <Callout>
        <Line text={COPY.build} start={0} style={{ fontSize: 72, color: COLORS.canvas }} />
      </Callout>
      <BrowserCard
        media={{ kind: "still", src: ASSETS.mapPack }}
        region={REGIONS.hook}
        top={CARD.top + 40}
        scale={shrink}
        overlay={<Ring box={LISTING_BOX} progress={1} />}
      />
    </>
  );
};

const CtaBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const panel = interpolate(frame, [0, 8], [0, 1], { ...clamp, easing: ease });
  return (
    <div
      style={{
        position: "absolute",
        left: SIDE,
        width: BOX_W,
        top: 520,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: BOX_W,
          height: 250,
          backgroundColor: COLORS.canvas,
          border: `3px solid ${COLORS.accent}`,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: panel,
          transform: `scale(${0.96 + 0.04 * panel})`,
          boxShadow: "0 28px 70px rgba(0, 0, 0, 0.45)",
        }}
      >
        <Img src={LOGO} style={{ height: 180, width: 180 * LOGO_ASPECT, maxWidth: "none" }} />
      </div>
      <div style={{ height: 64 }} />
      <Line text={COPY.cta.question} start={4} style={{ fontSize: 92, color: COLORS.canvas, lineHeight: 1.05 }} />
      <div style={{ height: 44 }} />
      <div style={{ width: 120, height: 6, backgroundColor: COLORS.amber }} />
      <div style={{ height: 44 }} />
      <Line text={COPY.cta.call} start={CUES.ctaCall} style={{ fontSize: 64, color: COLORS.canvas }} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const EllentonReel: React.FC = () => {
  const b = BEATS;
  const seq = (r: { start: number; end: number }, name: string, node: ReactNode) => (
    <Sequence from={r.start} durationInFrames={r.end - r.start} name={name} layout="none">
      {node}
    </Sequence>
  );
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 70% at 50% 45%, ${COLORS.dark_surface} 0%, ${COLORS.dark_canvas} 70%)`,
      }}
    >
      {seq(b.hook, "Hook", <HookBeat />)}
      {seq(b.typing, "Typing", <TypingBeat />)}
      {seq(b.map, "Map pack", <MapBeat />)}
      {seq(b.overview, "AI Overview", <OverviewBeat />)}
      {seq(b.build, "We build", <BuildBeat />)}
      {seq(b.cta, "Call to action", <CtaBeat />)}
      <Header />
      <Footer />
    </AbsoluteFill>
  );
};
