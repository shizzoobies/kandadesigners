// The brief tutorial's voice, as the timeline reads it.
//
// The read lives in its own "briefV3" section of config/voice.json, written by
// src/tutorial/brief/pipeline.ts. Several generations were made per beat and
// one was kept; `kept` holds the finished file and its measured length for
// each beat. This turns that section into the VoiceLog shape
// src/tutorial/timeline.ts lays a cut out from, and hands it to
// tutorialTimeline() explicitly, so the one timeline rule (12 frame tails, the
// hook and end card floors, the 600 frame cap) is the rule this reel is laid
// out by too.
//
// No React and no filesystem, so the bundle and the pipeline script share it.

import voiceJson from "../../../config/voice.json";
import { tutorialTimeline, type TutorialTimeline } from "../timeline";
import type { VoiceGeneration, VoiceLog } from "../voice-log";
import { BRIEF_TUTORIAL } from "./content";

/** One beat's kept read: what the timeline and the mix place. */
export type BriefKept = {
  beatId: string;
  /** Repo-relative path of the finished wav. */
  file: string;
  durationSeconds: number;
  /** The generation it was finished from. */
  sourceFile: string;
  seed: number | null;
  /** Word timings in the finished file, from the transcription, in seconds. */
  words?: { text: string; start: number; end: number }[];
  why: string;
};

export type BriefVoiceSection = {
  _note?: string;
  kept?: BriefKept[];
  [key: string]: unknown;
};

/** The section key in config/voice.json. */
export const BRIEF_VOICE_KEY = "briefV3";

/** A VoiceLog whose generations are the kept reads of the brief tutorial. */
export function briefVoiceLog(section: BriefVoiceSection | undefined): VoiceLog {
  const kept = section?.kept ?? [];
  const generations = kept.map(
    (k) =>
      ({
        tutorial: BRIEF_TUTORIAL.id,
        cut: "short",
        beatId: k.beatId,
        file: k.file,
        durationSeconds: k.durationSeconds,
      }) as unknown as VoiceGeneration,
  );
  return {
    _note: "",
    api: {},
    voice: null,
    generations,
    auditions: [],
    mixes: [],
  };
}

const SECTION = (voiceJson as unknown as Record<string, BriefVoiceSection | undefined>)[
  BRIEF_VOICE_KEY
];

/** The kept reads as the bundle saw them. */
export const BRIEF_KEPT: BriefKept[] = SECTION?.kept ?? [];

/** The 15 second cut, laid out from the kept reads. */
export function briefTimeline(
  section: BriefVoiceSection | undefined = SECTION,
): TutorialTimeline {
  return tutorialTimeline(BRIEF_TUTORIAL, "short", briefVoiceLog(section));
}

/** Word timings for one beat's kept read, or an empty list. */
export function briefWords(beatId: string): { text: string; start: number; end: number }[] {
  return BRIEF_KEPT.find((k) => k.beatId === beatId)?.words ?? [];
}
