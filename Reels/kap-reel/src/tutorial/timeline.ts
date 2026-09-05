// Beat lengths are driven by the narration, not the other way round.
//
// See the spec's "Timeline from the voice". scripts/voice.ts generates one
// audio file per beat and writes its measured duration into config/voice.json.
// This file reads those durations and lays the beats out:
//
//   1. Each beat gets max(minFrames, ceil(durationSec * 30) + TAIL_FRAMES), so
//      the voice never runs past its picture and there is a 12 frame tail
//      before the next line.
//   2. The hook holds at least 54 frames in the short cut and 36 in the
//      LinkedIn one, which are the two hook lengths src/lib/timing.ts already
//      uses. The end card holds at least what its own draw needs.
//   3. The composition total is exactly 450 or 1350. Slack goes to the beat
//      marked stretch. An overrun is a hard error naming the beat to cut.
//
// Speed is never touched to make a script fit. The script is edited, and the
// error says so.

import voiceJson from "../../config/voice.json";
import {
  CTA_BEAT_ID,
  HOOK_BEAT_ID,
  type TutorialBeat,
  type TutorialContent,
  type TutorialCut,
} from "./types";
import { findVoice, type VoiceLog } from "./voice-log";

export const FPS = 30;

/** Total frames per cut. Exact: a cut is 15.0 or 45.0 seconds, not about. */
export const TUTORIAL_TOTAL_FRAMES: Record<TutorialCut, number> = {
  short: 450,
  linkedin: 1350,
};

/**
 * Frames of silence left after each line before the next beat cuts.
 *
 * 12 frames is four tenths of a second. Enough that the last word is not
 * clipped by the cut and short enough that four beats of it do not cost a
 * second and a half of a fifteen second reel.
 */
export const TAIL_FRAMES = 12;

/**
 * The shortest the hook may hold, per cut. Both numbers come from
 * src/lib/timing.ts, where the showcase reels' 2026-09-03 re-pace settled them:
 * 54 frames is enough to read five words, and the 45 second cut can cut sooner
 * because it has more room afterwards.
 */
export const HOOK_MIN_FRAMES: Record<TutorialCut, number> = {
  short: 54,
  linkedin: 36,
};

/**
 * The shortest the end card may hold, per cut.
 *
 * The spec asks for 78, which is the 15 second cut's number: the drawn lockup
 * in src/components/LogoDraw.tsx takes 66 frames not to strobe and the contact
 * block arrives at relative 50. The 45 second cut's end card is authored
 * against a 124 frame beat in src/scenes/CallToAction.tsx (84 frame draw, copy
 * at 64), and handing it 78 would run the draw past its own beat, so the
 * LinkedIn floor is that 124. Both tutorials' closing narration is longer than
 * either floor anyway, so in practice the narration decides and these only
 * guarantee the card is never starved.
 */
export const CTA_MIN_FRAMES: Record<TutorialCut, number> = {
  short: 78,
  linkedin: 124,
};

/**
 * Words per second assumed for a beat that has no voice file yet.
 *
 * Only a scaffold: it exists so a grey render lays out and can be watched
 * before a single credit is spent, and every estimated beat is named in a
 * console warning when the bundle first evaluates the timeline.
 *
 * It is conservative, and measurably so. The draft pass on 2026-09-04 read the
 * 22 beats of both tutorials at about 3.9 words a second on
 * eleven_multilingual_v2 at speed 1.0, so 2.6 overstates every beat by roughly
 * half. That is the right direction to be wrong in for a placeholder, because
 * an underestimate would put a line past its own picture, but it does mean the
 * estimated layout of a 15 second cut can exceed 450 frames on a fresh checkout.
 * tutorialTimeline() squeezes estimated beats back to their minFrames rather
 * than failing for that reason; a measured overrun still fails.
 */
export const ESTIMATE_WORDS_PER_SECOND = 2.6;

const VOICE_LOG = voiceJson as unknown as VoiceLog;

/** What a laid out beat is: the beat itself, its frames, and where its length came from. */
export type TutorialEntry = {
  /** "hook" and "cta" are drawn by their own scenes, not through the registry. */
  kind: "hook" | "beat" | "cta";
  beat: TutorialBeat;
  start: number;
  /** Exclusive, like every other frame range in this project. */
  end: number;
  /** The narration's length in seconds, measured or estimated. */
  seconds: number;
  source: "measured" | "estimated";
  /** Repo-relative voice file, when one exists. */
  voiceFile: string | null;
  /** Frames added to this beat from the cut's slack. Only ever the stretch beat. */
  stretchFrames: number;
};

export type TutorialTimeline = {
  id: string;
  cut: TutorialCut;
  totalFrames: number;
  entries: TutorialEntry[];
  /** Frames handed to the stretch beat. */
  slackFrames: number;
  /** Beat ids laid out from the estimate rather than from a measured file. */
  estimated: string[];
};

/**
 * The hook and the end card as beats, so everything downstream walks one list.
 *
 * scripts/voice.ts generates audio for these exactly as it does for a beat, the
 * SRT carries them as cues, and the timeline lays them out with the same rule.
 * Their scene keys are placeholders that resolveScene never sees: Tutorial.tsx
 * branches on `kind` and draws TutorialHook and CallToAction directly.
 */
function hookBeat(content: TutorialContent, cut: TutorialCut): TutorialBeat {
  return {
    id: HOOK_BEAT_ID,
    scene: HOOK_BEAT_ID,
    narration: content.hook.narration,
    caption: [],
    minFrames: HOOK_MIN_FRAMES[cut],
  };
}

function ctaBeat(content: TutorialContent, cut: TutorialCut): TutorialBeat {
  return {
    id: CTA_BEAT_ID,
    scene: CTA_BEAT_ID,
    narration: content.cta[cut].narration,
    caption: [],
    minFrames: CTA_MIN_FRAMES[cut],
  };
}

/** Every beat of a cut, in order, hook and end card included. */
export function tutorialBeats(
  content: TutorialContent,
  cut: TutorialCut,
): TutorialBeat[] {
  return [
    hookBeat(content, cut),
    ...content.beats[cut],
    ctaBeat(content, cut),
  ];
}

function beatKind(beat: TutorialBeat): TutorialEntry["kind"] {
  if (beat.id === HOOK_BEAT_ID) return "hook";
  if (beat.id === CTA_BEAT_ID) return "cta";
  return "beat";
}

/** Seconds the narration is estimated to take, before any voice exists. */
export function estimateSeconds(narration: string): number {
  const words = narration.split(/\s+/).filter(Boolean).length;
  return words / ESTIMATE_WORDS_PER_SECOND;
}

/** Frames a beat needs for a given narration length. The rule, in one place. */
export function beatFrames(beat: TutorialBeat, seconds: number): number {
  return Math.max(beat.minFrames, Math.ceil(seconds * FPS) + TAIL_FRAMES);
}

/**
 * Beats that have already been warned about, so a warning is printed once per
 * cut rather than once per rendered frame. Remotion evaluates the composition
 * tree on every frame; a console line per frame would be 450 of them.
 */
const warned = new Set<string>();

/**
 * Lays a cut out. Throws when the script does not fit.
 *
 * The error names every beat with its frames so the person reading it can see
 * which line to shorten, because "the script is edited" is only actionable if
 * the message says which part of it.
 */
export function tutorialTimeline(
  content: TutorialContent,
  cut: TutorialCut,
  // The bundle takes the log as it was when the module was evaluated, which is
  // right for a render. scripts/voice.ts passes the log it has just written,
  // because a mix built one process after a generation has to place the lines
  // against the durations that generation measured, not against a snapshot
  // taken before it ran.
  log: VoiceLog = VOICE_LOG,
): TutorialTimeline {
  const totalFrames = TUTORIAL_TOTAL_FRAMES[cut];
  const beats = tutorialBeats(content, cut);

  const stretchIds = beats.filter((b) => b.stretch).map((b) => b.id);
  if (stretchIds.length !== 1) {
    throw new Error(
      `${content.id} ${cut}: exactly one beat must set stretch: true, found ` +
        `${stretchIds.length}${stretchIds.length ? ` (${stretchIds.join(", ")})` : ""}. ` +
        `The stretch beat is where the slack between the laid out beats and the ` +
        `${totalFrames} frame total goes.`,
    );
  }

  type Laid = {
    beat: TutorialBeat;
    frames: number;
    seconds: number;
    source: "measured" | "estimated";
    voiceFile: string | null;
  };

  const estimated: string[] = [];
  const laid: Laid[] = beats.map((beat) => {
    const record = findVoice(log, content.id, cut, beat.id);
    const seconds = record
      ? record.durationSeconds
      : estimateSeconds(beat.narration);
    if (!record) estimated.push(beat.id);
    return {
      beat,
      frames: beatFrames(beat, seconds),
      seconds,
      source: record ? "measured" : "estimated",
      voiceFile: record ? record.file : null,
    };
  });

  const describe = () =>
    laid
      .map(
        (l) =>
          `    ${l.beat.id}: ${l.frames} frames (${l.seconds.toFixed(2)}s ${l.source})`,
      )
      .join("\n");

  let laidFrames = laid.reduce((sum, l) => sum + l.frames, 0);

  // An overrun on measured beats is a real overrun and the build fails. An
  // overrun on estimates is not: the estimate exists so a grey render lays out
  // before a credit is spent, and 2.6 words a second is a guess about a read
  // nobody has heard yet. The draft read measured nearer four words a second,
  // so the estimate is conservative in the direction that would have failed
  // every cut on a fresh checkout. So the estimated beats are squeezed back to
  // their own minFrames, in order, until the cut fits, and the warning below
  // already says the timing is provisional.
  if (laidFrames > totalFrames && estimated.length > 0) {
    for (const l of laid) {
      if (laidFrames <= totalFrames) break;
      if (l.source !== "estimated") continue;
      const give = Math.min(l.frames - l.beat.minFrames, laidFrames - totalFrames);
      l.frames -= give;
      laidFrames -= give;
    }
  }

  if (laidFrames > totalFrames) {
    const over = laidFrames - totalFrames;
    throw new Error(
      `${content.id} ${cut} is ${over} frames over its ${totalFrames} frame total ` +
        `(${laidFrames} laid out). Shorten a narration line or drop a beat; the ` +
        `speed of the read is not adjusted to make a script fit.\n${describe()}`,
    );
  }

  const slackFrames = totalFrames - laidFrames;

  if (estimated.length > 0) {
    const key = `${content.id}/${cut}`;
    if (!warned.has(key)) {
      warned.add(key);
      console.warn(
        `[tutorial] ${key}: no voice in config/voice.json for ${estimated.join(", ")}. ` +
          `Those beats are laid out from an estimate of ${ESTIMATE_WORDS_PER_SECOND} ` +
          `words per second, so the timing is provisional. Run: ` +
          `npx tsx scripts/voice.ts --reel ${content.id} --cut ${cut}`,
      );
    }
  }

  const entries: TutorialEntry[] = [];
  let cursor = 0;
  for (const l of laid) {
    const stretchFrames = l.beat.stretch ? slackFrames : 0;
    const frames = l.frames + stretchFrames;
    entries.push({
      kind: beatKind(l.beat),
      beat: l.beat,
      start: cursor,
      end: cursor + frames,
      seconds: l.seconds,
      source: l.source,
      voiceFile: l.voiceFile,
      stretchFrames,
    });
    cursor += frames;
  }

  if (cursor !== totalFrames) {
    throw new Error(
      `${content.id} ${cut} laid out to ${cursor} frames, not ${totalFrames}. ` +
        `This is a bug in tutorialTimeline, not in the content.`,
    );
  }

  return {
    id: content.id,
    cut,
    totalFrames,
    entries,
    slackFrames,
    estimated,
  };
}
