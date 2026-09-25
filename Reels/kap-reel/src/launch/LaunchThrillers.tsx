import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { KineticText } from "../components/KineticText";
import { LogoDraw } from "../components/LogoDraw";
import { BODY_STACK, COLORS, DISPLAY_STACK, projectAccent } from "../lib/brand";
import { captureSrc, getCapture } from "../lib/captures";
import {
  centeredBox,
  centeredPadding,
  formatMetrics,
  safeArea,
  SAFE_ZONES,
  type FormatKey,
} from "../lib/layout";
import { PROJECT_BEAT_SHOTS } from "../lib/timing";
import { ProjectShowcase, WHIP_FRAMES } from "../scenes/ProjectShowcase";
import {
  HOOK_LINES,
  HOOK_PLAYBACK,
  HOOK_SECOND_HALF_IN,
  LAUNCH_BEATS,
  LAUNCH_CTA,
  LAUNCH_SHOWCASE,
  THRILLERS_CAPTURES,
  THRILLERS_PROJECT_ID,
} from "./thrillers";

/**
 * The Thrillers Mobile VR launch reel: 15 seconds, 1080x1920, for the
 * 2026-10-02 day folder. Hook over the home page, the home, experiences and
 * book captures in the showcase's device frame, then an end card.
 *
 * The three device beats are the showcase's own ProjectShowcase, unchanged,
 * with its 24 frame context plate shifted out of shot: each one is mounted 24
 * frames early, so its first visible frame is the hard cut to the clean
 * capture and no plate is ever rendered. Everything after that is the
 * showcase's treatment: DeviceFrame, the lower third with its name and claim,
 * OffthreadVideo scroll playback at a set rate, and the whip out. The whip in
 * lives inside the plate window in ProjectShowcase, so it is reapplied here
 * with the same six frames, travel and stretch.
 *
 * Real captures only. Copy and frames live in ./thrillers.ts, which the
 * delivery script reads too, so the SRT cannot drift from the picture.
 */

const PLATE_FRAMES = PROJECT_BEAT_SHOTS.plate.end - PROJECT_BEAT_SHOTS.plate.start;

/** Hook type size at 1080 width. Ten words, so below the showcase's 104. */
const HOOK_FONT_SIZE = 96;
const SCRIM = "#14100C";

export type LaunchThrillersProps = { format?: FormatKey };

const LaunchHook: React.FC<{ format: FormatKey }> = ({ format }) => {
  const safe = safeArea(format);
  const scale = formatMetrics(format).typeScale;
  const capture = getCapture(THRILLERS_CAPTURES.home);
  const fontSize = Math.round(HOOK_FONT_SIZE * scale);
  const lineBox = Math.round(fontSize * 1.08);
  const lineStyle: CSSProperties = {
    fontFamily: DISPLAY_STACK,
    fontSize,
    fontWeight: 800,
    letterSpacing: -2 * scale,
    lineHeight: 1.08,
    whiteSpace: "nowrap",
  };
  const line = (text: string, startFrame: number, color: string) => (
    <div key={text} style={{ height: lineBox }}>
      <KineticText
        text={text}
        mode="slam"
        startFrame={startFrame}
        align="center"
        style={{ ...lineStyle, color }}
      />
    </div>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <OffthreadVideo
        src={captureSrc(capture)}
        trimBefore={HOOK_PLAYBACK.trimBefore}
        playbackRate={HOOK_PLAYBACK.playbackRate}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: Math.round(safe.top + safe.height * 0.28),
          backgroundColor: SCRIM,
          borderTop: `${Math.round(8 * scale)}px solid ${COLORS.accent}`,
          paddingTop: Math.round(44 * scale),
          paddingBottom: Math.round(52 * scale),
          paddingLeft: centeredPadding(format, scale),
          paddingRight: centeredPadding(format, scale),
          textAlign: "center",
        }}
      >
        {HOOK_LINES.first.map((t) => line(t, 0, COLORS.canvas))}
        <div style={{ height: Math.round(20 * scale) }} />
        {HOOK_LINES.second.map((t) => line(t, HOOK_SECOND_HALF_IN, COLORS.amber))}
      </div>
    </AbsoluteFill>
  );
};

/** The showcase whip in, reapplied: six frames in from the right, 8 percent stretch. */
const WhipIn: React.FC<{ enabled: boolean; children: ReactNode }> = ({ enabled, children }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const active = enabled && frame < WHIP_FRAMES;
  const x = active ? interpolate(frame, [0, WHIP_FRAMES], [width, 0]) : 0;
  const sx = active ? interpolate(frame, [0, WHIP_FRAMES], [1.08, 1]) : 1;
  return (
    <AbsoluteFill style={{ transform: `translateX(${x}px) scaleX(${sx})` }}>
      {children}
    </AbsoluteFill>
  );
};

/**
 * End card in the showcase's language: the drawn K&A lockup on canvas, then
 * the launch line, the url and the call line arriving together on the copy
 * cue, as CallToAction does. Its own component because CallToAction prints
 * the bare phone number and this card says who to call.
 */
const LaunchEndCard: React.FC<{ format: FormatKey }> = ({ format }) => {
  const frame = useCurrentFrame();
  const safe = safeArea(format);
  const scale = formatMetrics(format).typeScale;
  const card = centeredBox(format, SAFE_ZONES[format].width - centeredPadding(format, scale) * 2);
  // CallToAction's sizing: five sixths of the card, capped by a share of the
  // safe height, 0.32 where a closing line joins the url and the phone.
  const logoWidth = Math.round(Math.min(776 * scale, card.width * 0.83, (safe.height * 0.32) / (548 / 1340)));
  const shown: CSSProperties = { visibility: frame >= LAUNCH_CTA.copyIn ? "visible" : "hidden", textAlign: "center" };

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.canvas }}>
      <div
        style={{
          position: "absolute",
          left: card.left,
          width: card.width,
          top: safe.top,
          height: safe.height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LogoDraw durationFrames={LAUNCH_CTA.drawFrames} startT={1.205} width={logoWidth} />
        <div
          style={{
            ...shown,
            marginTop: Math.round(44 * scale),
            fontFamily: DISPLAY_STACK,
            fontSize: Math.round(56 * scale),
            fontWeight: 700,
            letterSpacing: -0.5 * scale,
            lineHeight: 1.15,
            color: COLORS.ink,
          }}
        >
          {LAUNCH_CTA.launchLine}
        </div>
        <div
          style={{
            ...shown,
            marginTop: Math.round(24 * scale),
            fontFamily: BODY_STACK,
            fontSize: Math.round(60 * scale),
            fontWeight: 600,
            letterSpacing: 0.5 * scale,
            color: COLORS.accent,
          }}
        >
          {LAUNCH_CTA.url}
        </div>
        <div
          style={{
            ...shown,
            marginTop: Math.round(22 * scale),
            fontFamily: BODY_STACK,
            fontSize: Math.round(52 * scale),
            fontWeight: 500,
            letterSpacing: 0.5 * scale,
            color: COLORS.muted,
          }}
        >
          {LAUNCH_CTA.call}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const LaunchThrillers: React.FC<LaunchThrillersProps> = ({ format = "vertical" }) => {
  const b = LAUNCH_BEATS;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <Sequence from={b.hook.start} durationInFrames={b.hook.end - b.hook.start} name="Hook" layout="none">
        <LaunchHook format={format} />
      </Sequence>

      {LAUNCH_SHOWCASE.map((beat, i) => {
        const range = b[beat.key];
        const length = range.end - range.start;
        const whipOut = i < LAUNCH_SHOWCASE.length - 1;
        return (
          <Sequence
            key={beat.key}
            from={range.start}
            durationInFrames={length + (whipOut ? WHIP_FRAMES : 0)}
            name={beat.name}
            layout="none"
          >
            <WhipIn enabled={i > 0}>
              {/* Mounted 24 frames early: the plate window is never on screen. */}
              <Sequence from={-PLATE_FRAMES} layout="none">
                <ProjectShowcase
                  format={format}
                  projectId={THRILLERS_PROJECT_ID}
                  displayName={beat.name}
                  plateId="none"
                  claim={beat.claim}
                  accent={projectAccent(i)}
                  whipIn={false}
                  whipOut={whipOut}
                  durationInFrames={PLATE_FRAMES + length}
                  cleanTrimBefore={beat.trimBefore}
                  scrollPlaybackRate={beat.scrollPlaybackRate}
                  cleanCaptureId={beat.captureId}
                  cleanFrame="phone"
                />
              </Sequence>
            </WhipIn>
          </Sequence>
        );
      })}

      <Sequence from={b.cta.start} durationInFrames={b.cta.end - b.cta.start} name="Call to action" layout="none">
        <LaunchEndCard format={format} />
      </Sequence>
    </AbsoluteFill>
  );
};
