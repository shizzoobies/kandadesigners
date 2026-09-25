// The "onescreen" key of config/voice.json, and the one function that turns it
// into the VoiceLog src/tutorial/timeline.ts lays a cut out from.
//
// Nothing here touches the filesystem, so the bundle imports it as well as the
// script: the composition reads the kept reads' durations and word timings from
// the same record the mix was built from.

import voiceJson from "../../../config/voice.json";
import type { VoiceGeneration, VoiceLog, VoiceMixRecord } from "../voice-log";

/** Where the kept, finished reads live, repo relative. */
export const ONESCREEN_KEPT_DIR = "assets/audio/voice/onescreen-v3/natural";

export type OnescreenWord = { text: string; start: number; end: number };

export type OnescreenTake = {
  beatId: string;
  seed: number;
  file: string;
  /** Exactly what was sent, tags included. */
  text: string;
  plainText: string;
  tags: string[];
  characters: number;
  voiceId: string;
  voiceName: string;
  model: string;
  mode: string;
  settings: { stability: number };
  outputFormat: string;
  durationSeconds: number;
  /** Before and after delta on the usage endpoint. */
  creditsMeasured: number | null;
  creditsBucket: string | null;
  /** The character-cost response header, when the API sent one. */
  characterCostHeader: number | null;
  requestId: string | null;
  createdAt: string;
  stt?: { file: string; model: string; creditsMeasured: number | null };
  analysis?: {
    durationSeconds: number;
    leadSeconds: number;
    trailSeconds: number;
    maxGapInPhrase: number;
    maxGapAtBoundary: number;
    startEdgeDb: number;
    endEdgeDb: number;
    peakDbfs: number;
    speechDb: number;
    medianF0: number;
    pitchSpreadSt: number;
    transcript: string;
    words: OnescreenWord[];
    wordErrors: number;
    audioEvents: string[];
    spokenTag: boolean;
    shortWords: string[];
    minLogprob: number;
    wordsPerSecond: number;
  };
};

export type OnescreenSelection = {
  beatId: string;
  keptSeed: number;
  sourceFile: string;
  /** The finished read, repo relative. */
  file: string;
  durationSeconds: number;
  /** Word timings off the transcript of the kept read, seconds from its start. */
  words: OnescreenWord[];
  why: string;
  ranking: { seed: number; durationSeconds: number; score: number; rejected: string[] }[];
  createdAt: string;
};

export type OnescreenSection = {
  _note: string;
  voice: {
    id: string;
    name: string;
    model: string;
    mode: string;
    stability: number;
    outputFormat: string;
  };
  takes: OnescreenTake[];
  selections: OnescreenSelection[];
  mixes: (VoiceMixRecord & { totalFrames: number })[];
};

export const ONESCREEN_SECTION: OnescreenSection | null =
  ((voiceJson as unknown as { onescreen?: OnescreenSection }).onescreen ?? null);

/**
 * The kept reads as a VoiceLog, so tutorialTimeline() lays the cut out from
 * them with its own rule and nothing else: one generation per beat.
 */
export function onescreenVoiceLog(section: OnescreenSection | null = ONESCREEN_SECTION): VoiceLog {
  const generations: VoiceGeneration[] = (section?.selections ?? []).map((s) => ({
    tutorial: "onescreen",
    cut: "short",
    beatId: s.beatId,
    file: s.file,
    text: "",
    characters: 0,
    hash: "",
    voiceId: section?.voice.id ?? "",
    voiceName: section?.voice.name ?? "",
    model: section?.voice.model ?? "",
    settings: { stability: section?.voice.stability ?? 0.5, similarity_boost: 0, style: 0, use_speaker_boost: false, speed: 1 },
    outputFormat: section?.voice.outputFormat ?? "",
    durationSeconds: s.durationSeconds,
    creditsMeasured: null,
    creditsBucket: null,
    createdAt: s.createdAt,
  }));
  return { _note: "", api: {}, voice: null, generations, auditions: [], mixes: [] };
}

/** The kept read's word timings for a beat, or an empty list. */
export function wordsFor(beatId: string): OnescreenWord[] {
  return ONESCREEN_SECTION?.selections.find((s) => s.beatId === beatId)?.words ?? [];
}
