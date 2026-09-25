import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DeviceFrame } from "../../components/DeviceFrame";
import { BODY_STACK, COLORS, DISPLAY_STACK } from "../../lib/brand";
import type { TutorialSceneProps } from "../scenes/registry";
import { CAPTURE_HEIGHT, CAPTURE_WIDTH, onCanvas, PHONE, PHONE_LEFT, PHONE_SCALE, PhoneLabel, smallCaps } from "./PhoneShot";
import { wordFrame } from "./words";

/**
 * "Read this, then click that, then answer this. That is three screens
 * pretending to be one."
 *
 * An invented course screen, drawn here and labeled "example" both over the
 * device and inside its own header, so it cannot be mistaken for anyone's real
 * work. It is a generic LMS page in plain grays, deliberately not in the style
 * of any sample on the site. It asks for three things at once: a block to read,
 * hotspots to click and a question to answer. Each is outlined and numbered on
 * the word that names it, and on "three screens" each outline is tagged as the
 * screen it should have been.
 *
 * Drawn at the captures' own 1080 by 1920 and scaled into the same phone as the
 * real screens, so a cut from this to the real one does not move the device.
 */

const INK = "#2B2F33";
const GRAY = "#5D646B";
const RULE = "#D5D8DB";
const PAGE = "#F3F4F5";

/** The three asks, in page pixels, and the word each is named on. */
const REGIONS = [
  { n: 1, word: 0, y: 330, h: 470, tag: "screen 1" },
  { n: 2, word: 3, y: 830, h: 470, tag: "screen 2" },
  { n: 3, word: 6, y: 1330, h: 440, tag: "screen 3" },
] as const;

/** "three", the word the outlines are tagged on. */
const TAG_WORD = 10;

const Page: React.FC = () => (
  <div style={{ position: "relative", width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT, backgroundColor: PAGE, fontFamily: BODY_STACK, color: INK }}>
    <div style={{ height: 150, backgroundColor: "#3A3F44", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px" }}>
      <div style={{ color: "#FFFFFF", fontSize: 38, fontWeight: 600 }}>Warehouse Basics · Module 4</div>
      <div style={{ ...smallCaps(COLORS.amber, 34) }}>example</div>
    </div>
    <div style={{ position: "absolute", left: 48, top: 190, fontFamily: DISPLAY_STACK, fontSize: 66, fontWeight: 800, letterSpacing: -1 }}>
      Loading dock safety
    </div>

    {/* 1. Read this. */}
    <div style={{ position: "absolute", left: 48, right: 48, top: 350, fontSize: 36, lineHeight: 1.42, color: GRAY }}>
      Before a trailer is loaded, inspect the dock plate, set the wheel chocks and engage the
      vehicle restraint. Confirm the trailer floor can carry the load, check the lights are on
      inside, and never back a forklift onto a plate that has not been locked. Read the whole
      procedure before you continue.
    </div>

    {/* 2. Click that. */}
    <div style={{ position: "absolute", left: 48, right: 48, top: 850, height: 430, borderRadius: 12, backgroundColor: "#DDE0E3", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 60, top: 70, width: 420, height: 280, backgroundColor: "#B9BEC3", borderRadius: 6 }} />
      <div style={{ position: "absolute", left: 520, top: 150, width: 380, height: 200, backgroundColor: "#C9CDD1", borderRadius: 6 }} />
      {[
        [230, 160],
        [700, 220],
        [440, 330],
      ].map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: "50%", backgroundColor: "#FFFFFF", border: `5px solid ${GRAY}`, boxSizing: "border-box", fontSize: 44, fontWeight: 700, lineHeight: "56px", textAlign: "center", color: GRAY }}>
          +
        </div>
      ))}
      <div style={{ position: "absolute", left: 30, bottom: 26, fontSize: 32, color: INK }}>Click every hotspot before you continue.</div>
    </div>

    {/* 3. Answer this. */}
    <div style={{ position: "absolute", left: 48, right: 48, top: 1345 }}>
      <div style={{ fontSize: 38, fontWeight: 700 }}>Which step comes first?</div>
      {["Lower the dock plate", "Set the wheel chocks", "Open the trailer doors", "Start loading"].map((o) => (
        <div key={o} style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 26, fontSize: 34, color: GRAY }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: `4px solid ${GRAY}`, boxSizing: "border-box" }} />
          {o}
        </div>
      ))}
      <div style={{ marginTop: 34, width: 200, height: 72, borderRadius: 8, backgroundColor: "#5D646B", color: "#FFFFFF", fontSize: 32, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
        Submit
      </div>
    </div>

    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120, borderTop: `3px solid ${RULE}`, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 48px", gap: 24 }}>
      <div style={{ fontSize: 32, color: GRAY }}>Back</div>
      <div style={{ fontSize: 32, color: "#A5AAAF", border: `3px solid ${RULE}`, borderRadius: 8, padding: "12px 34px" }}>Next</div>
    </div>
  </div>
);

export const OnescreenClutter: React.FC<TutorialSceneProps> = ({ beat }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const tagAt = wordFrame(beat, TAG_WORD, durationInFrames);

  return (
    <AbsoluteFill>
      <PhoneLabel text="example · an invented course screen" />
      <div style={{ position: "absolute", left: PHONE_LEFT, top: PHONE.top }}>
        <DeviceFrame screenWidth={PHONE.screenWidth} screenHeight={PHONE.screenHeight} bezel={PHONE.bezel} radius={PHONE.radius}>
          <div style={{ width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT, transform: `scale(${PHONE_SCALE})`, transformOrigin: "top left" }}>
            <Page />
          </div>
        </DeviceFrame>
      </div>

      {REGIONS.map((r) => {
        const at = wordFrame(beat, r.word, durationInFrames) - 3;
        if (frame < at) return null;
        const draw = interpolate(frame, [at, at + 6], [0, 1], { extrapolateRight: "clamp" });
        const tag = interpolate(frame, [tagAt + (r.n - 1) * 4, tagAt + (r.n - 1) * 4 + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const topLeft = onCanvas(30, r.y);
        const bottomRight = onCanvas(CAPTURE_WIDTH - 30, r.y + r.h);
        const w = bottomRight.x - topLeft.x;
        const h = bottomRight.y - topLeft.y;
        return (
          <div key={r.n}>
            <div
              style={{
                position: "absolute",
                left: topLeft.x,
                top: topLeft.y,
                width: w,
                height: h,
                border: `5px solid ${COLORS.amber}`,
                borderRadius: 6,
                boxSizing: "border-box",
                opacity: draw,
                transform: `scale(${0.96 + 0.04 * draw})`,
              }}
            />
            {/* The number, on the device's left edge beside its outline. */}
            <div
              style={{
                position: "absolute",
                left: topLeft.x - 82,
                top: topLeft.y + h / 2 - 34,
                width: 68,
                height: 68,
                borderRadius: "50%",
                backgroundColor: COLORS.amber,
                color: COLORS.ink,
                fontFamily: DISPLAY_STACK,
                fontSize: 40,
                fontWeight: 800,
                lineHeight: "68px",
                textAlign: "center",
                opacity: draw,
              }}
            >
              {r.n}
            </div>
            {/* On "three screens": what each ask should have been. */}
            {/* Inside the outline's top right corner: the right edge of the
                canvas is a reserved platform zone and takes no text. */}
            <div
              style={{
                position: "absolute",
                right: 1080 - bottomRight.x + 5,
                top: topLeft.y + 5,
                padding: "8px 14px",
                borderRadius: 3,
                backgroundColor: COLORS.ink,
                opacity: tag,
                ...smallCaps(COLORS.amber, 26),
              }}
            >
              {r.tag}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
