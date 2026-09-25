// The one screen tutorial's beat map.
//
// The same rule src/tutorial/timeline.ts lays every tutorial out with, applied
// by that file's own functions: each beat is max(minFrames, ceil(seconds * 30)
// + 12), the hook holds at least 54 frames and the end card 78, and a cut
// under 450 frames hands its slack to the stretch beat. The measured seconds
// are the kept reads in config/voice.json under "onescreen".
//
// The one difference is the ceiling. tutorialTimeline() stops a short cut at
// 600 frames. Alex trimmed the script on 2026-09-24 to fit, and it still does
// not: the three unchanged beats alone take 441 frames with their tails, the
// end card needs at least 78, and "Read this, click that, answer this. Three
// screens pretending to be one." reads in about five seconds. With the fastest
// clean read of every beat (voice.ts select --fastest) the cut lays out to 690
// frames, 23.0 seconds, about 3 seconds over. Alex's call: keep the trimmed
// words, no further cuts, so this ceiling stays. Speed is never touched.

import { beatFrames, estimateSeconds, FPS, TUTORIAL_TOTAL_FRAMES, tutorialBeats, type TutorialEntry, type TutorialTimeline } from "../timeline";
import { CTA_BEAT_ID, HOOK_BEAT_ID } from "../types";
import { ONESCREEN_TUTORIAL } from "./content";
import { onescreenVoiceLog } from "./voice-log";
import { findVoice, type VoiceLog } from "../voice-log";

/**
 * The longest this reel may lay out to: 30 seconds, where the shared
 * timeline's short cut stops at 20. Facebook and Instagram Reels take far
 * longer; the ceiling is here so a runaway read fails loudly.
 */
export const ONESCREEN_MAX_FRAMES = 900;

export function onescreenTimeline(log: VoiceLog = onescreenVoiceLog()): TutorialTimeline {
  const content = ONESCREEN_TUTORIAL;
  const beats = tutorialBeats(content, "short");
  const estimated: string[] = [];
  const laid = beats.map((beat) => {
    const record = findVoice(log, content.id, "short", beat.id);
    if (!record) estimated.push(beat.id);
    const seconds = record ? record.durationSeconds : estimateSeconds(beat.narration);
    return { beat, seconds, frames: beatFrames(beat, seconds), voiceFile: record ? record.file : null, source: record ? "measured" : "estimated" };
  });
  const laidFrames = laid.reduce((a, l) => a + l.frames, 0);
  if (laidFrames > ONESCREEN_MAX_FRAMES) {
    throw new Error(`onescreen lays out to ${laidFrames} frames, over its ${ONESCREEN_MAX_FRAMES} frame ceiling.`);
  }
  const totalFrames = Math.max(TUTORIAL_TOTAL_FRAMES.short, laidFrames);
  const slackFrames = totalFrames - laidFrames;
  const entries: TutorialEntry[] = [];
  let cursor = 0;
  for (const l of laid) {
    const stretchFrames = l.beat.stretch ? slackFrames : 0;
    const frames = l.frames + stretchFrames;
    entries.push({
      kind: l.beat.id === HOOK_BEAT_ID ? "hook" : l.beat.id === CTA_BEAT_ID ? "cta" : "beat",
      beat: l.beat,
      start: cursor,
      end: cursor + frames,
      seconds: l.seconds,
      source: l.source as "measured" | "estimated",
      voiceFile: l.voiceFile,
      stretchFrames,
    });
    cursor += frames;
  }
  return { id: content.id, cut: "short", totalFrames, entries, slackFrames, estimated };
}

export const ONESCREEN_FPS = FPS;
