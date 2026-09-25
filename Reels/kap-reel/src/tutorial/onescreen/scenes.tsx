import { AbsoluteFill, Img, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { DeviceFrame } from "../../components/DeviceFrame";
import { COLORS } from "../../lib/brand";
import type { TutorialSceneProps } from "../scenes/registry";
import { OnescreenClutter } from "./Clutter";
import { capture, captureSrc, PhoneShot, smallCaps } from "./PhoneShot";
import { wordFrame } from "./words";

/** Word indices in the narration, named so the scenes read as the script does. */
const DECIDE = { acts: 8, gets: 9, moves: 11 };
const TRICK = { fewer: 0, more: 2, that: 4 };

const tapOf = (id: string) => {
  const t = capture(id).tap;
  if (!t) throw new Error(`capture ${id} has no tap recorded.`);
  return t;
};

/**
 * "We build one decision per screen. The learner acts, gets feedback, moves on."
 *
 * The hazard hunt, screen 7 of the live safety sample. It asks for one thing:
 * tap what needs attention. On "acts" the ladder is tapped, exactly where the
 * capture script's real tap landed, and the screen that tap produced replaces
 * it. On "gets feedback" the screen shows the feedback the module wrote for
 * that tap. On "moves on" the next screen slides in, as the module's own Next
 * does.
 */
export const OnescreenDecide: React.FC<TutorialSceneProps> = ({ beat }) => {
  const { durationInFrames } = useVideoConfig();
  const w = (i: number) => wordFrame(beat, i, durationInFrames);
  const tapAt = w(DECIDE.acts);
  return (
    <PhoneShot
      states={[
        { id: "hunt-idle", from: 0, label: "real course · hazard hunt" },
        { id: "hunt-found", from: tapAt + 2, label: "real course · hazard hunt" },
        { id: "hunt-feedback", from: w(DECIDE.gets), label: "real course · feedback" },
      ]}
      next={{ id: "bench-idle", at: w(DECIDE.moves), label: "real course · next screen" }}
      taps={[{ box: tapOf("hunt-idle"), at: tapAt }]}
    />
  );
};

/** The three real screens side by side, each holding its one decision made. */
const Row: React.FC = () => {
  const frame = useCurrentFrame();
  const shots = [
    { id: "hunt-found", label: "spot it" },
    { id: "bench-placed", label: "fix it" },
    { id: "audit-board", label: "stop or go" },
  ];
  const screenW = 280;
  const screenH = Math.round((screenW * 1920) / 1080);
  const bezel = 8;
  const gap = 22;
  const total = shots.length * (screenW + bezel * 2) + (shots.length - 1) * gap;
  const left0 = Math.round((1080 - total) / 2);
  const top = 500;
  return (
    <AbsoluteFill>
      {shots.map((s, i) => {
        const at = i * 4;
        const o = interpolate(frame, [at, at + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const left = left0 + i * (screenW + bezel * 2 + gap);
        return (
          <div key={s.id} style={{ position: "absolute", left, top: top + (1 - o) * 30, opacity: o }}>
            <DeviceFrame screenWidth={screenW} screenHeight={screenH} bezel={bezel} radius={30}>
              <Img src={captureSrc(s.id)} style={{ width: screenW, height: screenH }} />
            </DeviceFrame>
            <div style={{ marginTop: 22, textAlign: "center", ...smallCaps(COLORS.amber, 26) }}>{s.label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * "Fewer clicks. More learning. That is the whole trick."
 *
 * The other two real screens, one decision each, then all three together.
 * "Fewer clicks": the control workbench, one control chosen for one situation
 * and placed. "More learning": inspect before release, one location, one call,
 * the hold marker placed. "That is the whole trick": the three screens side by
 * side with the decision each one asked for.
 */
export const OnescreenTrick: React.FC<TutorialSceneProps> = ({ beat }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const w = (i: number) => wordFrame(beat, i, durationInFrames);
  const more = w(TRICK.more);
  const that = w(TRICK.that) - 4;
  // The workbench takes two real taps: the control, then the situation it goes on.
  const benchTap = Math.max(4, w(TRICK.fewer) + 3);
  const placeTap = Math.min(more - 12, benchTap + 14);
  const auditTap = more + 6;

  if (frame >= that) {
    return (
      <AbsoluteFill>
        <div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center", ...smallCaps(COLORS.dark_muted) }}>
          three screens · one decision each
        </div>
        <SequenceShift from={that}>
          <Row />
        </SequenceShift>
      </AbsoluteFill>
    );
  }
  if (frame >= more) {
    return (
      <SequenceShift from={more}>
        <PhoneShot
          states={[
            { id: "audit-open", from: 0, label: "real course · stop or go" },
            { id: "audit-hold", from: auditTap - more + 2, label: "real course · stop or go" },
          ]}
          taps={[{ box: tapOf("audit-open"), at: auditTap - more }]}
        />
      </SequenceShift>
    );
  }
  return (
    <PhoneShot
      states={[
        { id: "bench-toolkit", from: 0, label: "real course · pick the control" },
        { id: "bench-chosen", from: benchTap + 2, label: "real course · pick the control" },
        { id: "bench-placed", from: placeTap + 2, label: "real course · pick the control" },
      ]}
      taps={[
        { box: tapOf("bench-toolkit"), at: benchTap },
        { box: tapOf("bench-chosen"), at: placeTap },
      ]}
    />
  );
};

/** Renders children with the frame counted from `from`. */
const SequenceShift: React.FC<{ from: number; children: React.ReactNode }> = ({ from, children }) => (
  <Sequence from={from} layout="none">
    {children}
  </Sequence>
);

export const ONESCREEN_SCENES: Record<string, React.FC<TutorialSceneProps>> = {
  "onescreen-clutter": OnescreenClutter,
  "onescreen-decide": OnescreenDecide,
  "onescreen-trick": OnescreenTrick,
};
