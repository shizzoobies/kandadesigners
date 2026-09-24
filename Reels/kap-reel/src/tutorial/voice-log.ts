// The shape of config/voice.json, and the two pure functions that read it.
//
// config/voice.json is to the tutorial voice what config/audio.json is to the
// music: every billable ElevenLabs call, with the exact text, the voice, the
// model, the settings, the measured duration of the file and the credits
// measured as a delta on the usage endpoint. It is written by scripts/voice.ts
// and read by src/tutorial/timeline.ts, which lays the beats out from those
// durations.
//
// Nothing here imports the JSON and nothing here touches the filesystem, so
// both sides can use it: timeline.ts imports the file statically for the bundle,
// scripts/voice.ts reads and rewrites it with fs.

/** How a beat's audio is identified across a regeneration. */
export type VoiceSettings = {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  speed: number;
};

export type VoiceGeneration = {
  /** Tutorial id: "contrast" or "hero". */
  tutorial: string;
  /** "short" or "linkedin". */
  cut: string;
  /** Beat id, including the reserved "hook" and "cta". */
  beatId: string;
  /** Repo-relative path of the mp3. */
  file: string;
  /** The exact text sent to the model. */
  text: string;
  characters: number;
  /** voiceHash of text, voice, model and settings. The regeneration key. */
  hash: string;
  voiceId: string;
  voiceName: string;
  model: string;
  settings: VoiceSettings;
  outputFormat: string;
  /** Measured with ffprobe off the file, not predicted. */
  durationSeconds: number;
  /** Measured as a before and after delta on the usage endpoint. */
  creditsMeasured: number | null;
  creditsBucket: string | null;
  createdAt: string;
};

/**
 * One audition: the same line read by a candidate voice, so a voice can be
 * chosen with the reads side by side rather than from the catalogue copy.
 *
 * An audition is billed exactly like a beat, so it is logged exactly like a
 * beat. It carries no tutorial, cut or beat id, because it belongs to no
 * timeline: nothing downstream lays a picture out from these durations. The
 * words per second is the number the choice actually turns on, since a voice
 * that reads slower than the one it replaces moves every beat in every cut.
 */
export type VoiceAudition = {
  voiceId: string;
  voiceName: string;
  /** ElevenLabs' own description, as GET /v1/voices returned it. */
  description: string;
  /** Repo-relative path of the mp3. */
  file: string;
  text: string;
  characters: number;
  words: number;
  model: string;
  settings: VoiceSettings;
  outputFormat: string;
  /** Measured with ffprobe off the file, not predicted. */
  durationSeconds: number;
  wordsPerSecond: number;
  /** Measured as a before and after delta on the usage endpoint. */
  creditsMeasured: number | null;
  creditsBucket: string | null;
  createdAt: string;
};

export type VoiceMixRecord = {
  tutorial: string;
  cut: string;
  wav: string;
  musicSource: string;
  musicVariant: string;
  /** Static offset applied to the bed before the sidechain, in dB. */
  bedGainDb: number;
  /** Measured gain reduction the sidechain applies while speech is present. */
  measuredDuckDb: number;
  limiterCeilingDbfs: number;
  measuredIntegratedLufs: number;
  measuredTruePeakDbfs: number;
  measuredLra: number;
  createdAt: string;
};

export type VoiceLog = {
  _note: string;
  api: Record<string, string>;
  /** The draft voice and why it was chosen. Kai's voice replaces it later. */
  voice: {
    id: string;
    name: string;
    model: string;
    settings: VoiceSettings;
    outputFormat: string;
    why: string;
  } | null;
  generations: VoiceGeneration[];
  /** Candidate reads of one line, kept because they were paid for. */
  auditions: VoiceAudition[];
  mixes: VoiceMixRecord[];
};

/**
 * A 32 bit FNV-1a hash, hex.
 *
 * Deliberately not node:crypto: this runs in the Remotion bundle as well as in
 * a script, and a collision here costs a regenerated beat rather than anything
 * that matters. The input is a canonical join of the text, the voice, the model
 * and the settings, so changing any one of them regenerates the file and
 * invalidates the duration the timeline was laid out from.
 */
export function voiceHash(
  text: string,
  voiceId: string,
  model: string,
  settings: VoiceSettings,
): string {
  const canonical = [
    text,
    voiceId,
    model,
    settings.stability,
    settings.similarity_boost,
    settings.style,
    settings.use_speaker_boost ? "1" : "0",
    settings.speed,
  ].join("\0");
  let hash = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i += 1) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * The newest logged generation for one beat, or null.
 *
 * Newest wins rather than first, so a regenerated beat's duration is the one
 * the timeline uses. Nothing is deleted from the log when a beat is
 * regenerated: the credits were spent either way and the record has to show it.
 */
export function findVoice(
  log: VoiceLog,
  tutorial: string,
  cut: string,
  beatId: string,
): VoiceGeneration | null {
  let found: VoiceGeneration | null = null;
  for (const g of log.generations) {
    if (g.tutorial === tutorial && g.cut === cut && g.beatId === beatId) {
      found = g;
    }
  }
  return found;
}

/**
 * Where a beat's voice file lives, repo-relative. One function so the script
 * that writes it and the component that plays it cannot disagree.
 */
export function voiceFilePath(
  tutorial: string,
  cut: string,
  beatId: string,
): string {
  return `assets/audio/voice/${tutorial}/${cut}/${beatId}.mp3`;
}

/**
 * Where a tutorial's finished mix lives, repo-relative. A cut that ships an
 * eleven_v3 read takes a "-v3" suffix, so the v2 mix beside it is never
 * overwritten.
 */
export function mixFilePath(
  tutorial: string,
  cut: string,
  read: "v2" | "v3" = "v2",
): string {
  const suffix = read === "v3" ? "-v3" : "";
  return `assets/audio/mix-tut-${tutorial}-${cut === "short" ? "15" : "45"}s${suffix}.wav`;
}
