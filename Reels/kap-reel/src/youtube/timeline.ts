// Laying a long video out from its measured narration.
//
// Each beat is one voice file. A beat runs for its measured duration plus a
// gap before the next one (0.7 s by default, the rough preview's spacing), so
// nothing is a fixed beat map: retake a line and every later beat moves with
// it. Inside a beat, pictures are cued to words from the transcript, in
// seconds from the start of the beat's file.
//
// Pure data, no Remotion imports, so a Node script (the mix) can lay the video
// out exactly as the composition does.

export const TIMELINE_FPS = 30;

/** [text, start, end], seconds from the start of the beat file. */
export type Word = [string, number, number];

export type BeatAudio = {
  title: string;
  durationSeconds: number;
  gainDb: number;
  words: Word[];
};

export type BeatSpec = {
  beat: number;
  /** Seconds of silence after the line, before the next beat starts. */
  gapAfter?: number;
  /** A fixed length in frames (the end screen), instead of voice plus gap. */
  frames?: number;
  /** Where the voice starts inside the beat, s. */
  voiceAt?: number;
};

export type BeatSlot = {
  beat: number;
  title: string;
  /** Composition frame the beat starts on. */
  from: number;
  frames: number;
  /** Frame inside the beat the voice file starts on. */
  voiceFrom: number;
  seconds: number;
  gainDb: number;
};

export const DEFAULT_GAP = 0.7;

/** The end screen runs 20 s in every video (YouTube allows 5 to 20). */
export const END_SCREEN_FRAMES = 20 * TIMELINE_FPS;

export function layoutBeats(
  specs: BeatSpec[],
  audio: Record<string, BeatAudio>,
): { slots: BeatSlot[]; totalFrames: number } {
  let cursor = 0;
  const slots = specs.map((s) => {
    const a = audio[String(s.beat)];
    if (!a) throw new Error(`No audio for beat ${s.beat}`);
    const voiceFrom = Math.round((s.voiceAt ?? 0) * TIMELINE_FPS);
    const frames =
      s.frames ??
      voiceFrom +
        Math.ceil(a.durationSeconds * TIMELINE_FPS) +
        Math.round((s.gapAfter ?? DEFAULT_GAP) * TIMELINE_FPS);
    const slot: BeatSlot = {
      beat: s.beat,
      title: a.title,
      from: cursor,
      frames,
      voiceFrom,
      seconds: a.durationSeconds,
      gainDb: a.gainDb,
    };
    cursor += frames;
    return slot;
  });
  return { slots, totalFrames: cursor };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, "");

/**
 * The start of a phrase in a beat, seconds from the start of the beat file.
 * `nth` picks a later occurrence (1 is the first). Throws if the transcript
 * does not contain it, which is what a retake with changed words should do.
 */
export function makeCue(audio: Record<string, BeatAudio>) {
  return (beat: number, phrase: string, nth = 1): number => {
    const a = audio[String(beat)];
    if (!a) throw new Error(`No words for beat ${beat}`);
    const want = phrase.split(/\s+/).map(norm).filter(Boolean);
    const words = a.words.map((w) => norm(w[0]));
    let seen = 0;
    for (let i = 0; i + want.length <= words.length; i += 1) {
      if (want.every((w, j) => words[i + j] === w)) {
        seen += 1;
        if (seen === nth) return a.words[i][1];
      }
    }
    throw new Error(
      `Beat ${beat}: "${phrase}" (#${nth}) is not in the transcript`,
    );
  };
}

/** m:ss for a frame, for chapter lists and logs. */
export function timecode(frame: number): string {
  const s = Math.floor(frame / TIMELINE_FPS);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
