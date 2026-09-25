import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { DeviceFrame } from "../../components/DeviceFrame";
import { BODY_STACK, COLORS } from "../../lib/brand";
import capturesJson from "./captures.json";

/** Every still is the reel's own canvas, 1080 by 1920. */
export const CAPTURE_WIDTH = 1080;
export const CAPTURE_HEIGHT = 1920;

/**
 * The phone every screen in this reel sits in, real or invented, at one size so
 * a cut between them never moves the frame. 520 by 924 is the capture at
 * 0.4815, which puts the device's bottom edge just above the caption card and
 * leaves room for the small caps line over it.
 */
export const PHONE = {
  screenWidth: 520,
  screenHeight: 924,
  bezel: 16,
  radius: 58,
  /** Top of the device body on the 1080 by 1920 canvas. */
  top: 356,
} as const;

export const PHONE_SCALE = PHONE.screenWidth / CAPTURE_WIDTH;
export const PHONE_LEFT = Math.round((1080 - (PHONE.screenWidth + PHONE.bezel * 2)) / 2);

export type Box = { x: number; y: number; width: number; height: number };

type Capture = { id: string; file: string; tap: Box | null };
const CAPTURES = (capturesJson as { captures: Capture[] }).captures;

export function capture(id: string): Capture {
  const found = CAPTURES.find((c) => c.id === id);
  if (!found) throw new Error(`No onescreen capture "${id}". Run src/tutorial/onescreen/scripts/capture.ts.`);
  return found;
}

export const captureSrc = (id: string) => staticFile(capture(id).file.replace(/^assets\//, ""));

/** Small caps, the only label treatment the brand allows. No chips, no pills. */
export function smallCaps(color: string, size = 28): CSSProperties {
  return {
    fontFamily: BODY_STACK,
    fontSize: size,
    fontWeight: 700,
    letterSpacing: size * 0.14,
    textTransform: "uppercase",
    color,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  };
}

/** A state of the screen and the frame it arrives on. */
export type ScreenState = { id: string; from: number; label?: string };

export type Tap = { box: Box; at: number };

const CROSSFADE = 5;
const SLIDE = 10;

/** The small caps line over the device. */
export const PhoneLabel: React.FC<{ text: string; top?: number }> = ({ text, top = PHONE.top - 62 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", ...smallCaps(COLORS.dark_muted) }}>
    {text}
  </div>
);

/**
 * A tap, drawn: a filled amber dot arrives on the target, presses, and a ring
 * spreads from it and fades. A circle, which is a finger, not a pill.
 */
export const TapMark: React.FC<{ x: number; y: number; at: number; size?: number }> = ({ x, y, at, size = 1 }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -10 || t > 22) return null;
  const dotIn = interpolate(t, [-10, -4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press = interpolate(t, [-2, 0, 4], [1, 0.78, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dotOut = interpolate(t, [10, 18], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ring = interpolate(t, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const dot = 46 * size;
  const ringSize = (46 + ring * 110) * size;
  return (
    <>
      {t >= 0 ? (
        <div
          style={{
            position: "absolute",
            left: x - ringSize / 2,
            top: y - ringSize / 2,
            width: ringSize,
            height: ringSize,
            borderRadius: "50%",
            border: `${Math.max(3, 6 * size)}px solid ${COLORS.amber}`,
            opacity: 1 - ring,
            boxSizing: "border-box",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x - (dot * press) / 2,
          top: y - (dot * press) / 2,
          width: dot * press,
          height: dot * press,
          borderRadius: "50%",
          backgroundColor: COLORS.amber,
          opacity: 0.85 * dotIn * dotOut,
          boxShadow: "0 4px 18px rgba(0,0,0,0.35)",
        }}
      />
    </>
  );
};

/** Where a point on a capture lands on the canvas, for a phone at PHONE. */
export function onCanvas(px: number, py: number): { x: number; y: number } {
  return {
    x: PHONE_LEFT + PHONE.bezel + px * PHONE_SCALE,
    y: PHONE.top + PHONE.bezel + py * PHONE_SCALE,
  };
}

export const boxCenter = (b: Box) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

export type PhoneShotProps = {
  /** Screen states in order; each crossfades in on its frame. */
  states: ScreenState[];
  /** A next screen that slides in from the right, as the module's own Next does. */
  next?: { id: string; at: number; label?: string };
  taps?: Tap[];
  /** Drawn over the screen, in capture pixels, under the taps. */
  overlay?: ReactNode;
};

/** One real screen from the sample, in the phone, with its taps drawn on it. */
export const PhoneShot: React.FC<PhoneShotProps> = ({ states, next, taps = [], overlay }) => {
  const frame = useCurrentFrame();
  const slide = next
    ? interpolate(frame, [next.at, next.at + SLIDE], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      })
    : 0;
  const current = [...states].reverse().find((s) => frame >= s.from) ?? states[0];
  const label = next && frame >= next.at ? next.label ?? current.label : current.label;

  const screenW = PHONE.screenWidth;
  const layer = (id: string, opacity: number, x = 0) => (
    <Img
      key={`${id}-${x}`}
      src={captureSrc(id)}
      style={{
        position: "absolute",
        left: x,
        top: 0,
        width: screenW,
        height: PHONE.screenHeight,
        opacity,
      }}
    />
  );

  return (
    <AbsoluteFill>
      {label ? <PhoneLabel text={label} /> : null}
      <div style={{ position: "absolute", left: PHONE_LEFT, top: PHONE.top }}>
        <DeviceFrame screenWidth={screenW} screenHeight={PHONE.screenHeight} bezel={PHONE.bezel} radius={PHONE.radius}>
          <div style={{ position: "relative", width: screenW, height: PHONE.screenHeight, overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, transform: `translateX(${-slide * screenW}px)` }}>
              {states.map((s, i) => {
                if (frame < s.from) return null;
                const opacity = i === 0 ? 1 : interpolate(frame, [s.from, s.from + CROSSFADE], [0, 1], { extrapolateRight: "clamp" });
                return layer(s.id, opacity);
              })}
              {overlay ? (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: CAPTURE_WIDTH,
                    height: CAPTURE_HEIGHT,
                    transform: `scale(${PHONE_SCALE})`,
                    transformOrigin: "top left",
                  }}
                >
                  {overlay}
                </div>
              ) : null}
            </div>
            {next && slide > 0 ? layer(next.id, 1, (1 - slide) * screenW) : null}
          </div>
        </DeviceFrame>
      </div>
      {taps.map((t, i) => {
        const c = boxCenter(t.box);
        const p = onCanvas(c.x, c.y);
        return <TapMark key={i} x={p.x} y={p.y} at={t.at} />;
      })}
    </AbsoluteFill>
  );
};
