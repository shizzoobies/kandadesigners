/**
 * src/tutorial/brief/pipeline.ts
 *
 * Voice, mix and delivery for the brief tutorial ("Give the AI the brief, not
 * the task"), the Thursday 2026-10-01 reel. Run from D:\kap-reel:
 *
 *   node node_modules/tsx/dist/cli.mjs src/tutorial/brief/pipeline.ts voice [--per 3] [--beat <id>] [--dry-run]
 *   node node_modules/tsx/dist/cli.mjs src/tutorial/brief/pipeline.ts select
 *   node node_modules/tsx/dist/cli.mjs src/tutorial/brief/pipeline.ts mix
 *   node node_modules/tsx/dist/cli.mjs src/tutorial/brief/pipeline.ts deliver [--to <day folder>/media]
 *   node node_modules/tsx/dist/cli.mjs src/tutorial/brief/pipeline.ts spend
 *
 * Why this is its own script rather than a flag on scripts/voice.ts. voice.ts
 * and scripts/deliver-tutorial-short.ts each carry a fixed map of the
 * tutorials they know (contrast and hero), and on 2026-09-24 both files were
 * being worked on by other sessions and were off limits to this one. So this
 * file reuses what those scripts export (the key reading, retry, usage delta,
 * loudness and limiter helpers in scripts/audio.ts, encodeTarget in
 * scripts/deliver.ts, the SRT renderer and validator in scripts/srt.ts) and
 * repeats only what they keep private: the v3 call, the transcription check,
 * the per beat selection and the ducked mix. The mix constants and the duck
 * solver are voice.ts's, number for number, so this bed sits under this voice
 * exactly as it would have under `voice.ts --mix`.
 *
 * voice   eleven_v3, Sarah, the natural stability mode (0.5), output
 *         wav_44100 (the highest format the takes pipeline in voice.ts uses on
 *         this workspace's Pro tier), one seeded call per generation, --per
 *         generations per beat. Every file is transcribed with scribe_v2 and
 *         measured, and every call's credits are a before and after delta on
 *         the usage endpoint. Logged to the "briefV3" section of
 *         config/voice.json, which nothing else reads or writes.
 * select  Scores every generation per beat, keeps one, trims the silence at
 *         its edges and writes the finished file and its length into
 *         briefV3.kept, which is what the composition is laid out from.
 * mix     Music take i-a (out/candidates/music-i-a.mp3) under the kept reads,
 *         ducked the way voice.ts --mix ducks, to
 *         assets/audio/mix-tut-brief-15s-v3.wav.
 * deliver Encodes the render with the mix through scripts/encode.sh, writes
 *         the SRT (the untagged narration),
 *         renders the thumbnail and three review frames as stills, and with
 *         --to copies reel-vertical.mp4, reel-vertical.srt and thumbnail.jpg.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  AFORMAT,
  LOUDNORM_TARGET,
  TARGET_LUFS,
  assertUnderCreditAlarm,
  correctLoudness,
  creditsSince,
  fetchRetry,
  ffmpeg,
  headroomCeilingDb,
  limiter,
  measureVolume,
  parseLoudnorm,
  probeDuration,
  readApiKey,
  redact,
  usageSnapshot,
  verifyLoudness,
} from "../../../scripts/audio.js";
import { encodeTarget, type DeliveryTarget } from "../../../scripts/deliver.js";
import {
  renderSrt,
  validateTarget,
  type CueRow,
  type SrtTarget,
} from "../../../scripts/srt.js";
import { FPS, tutorialBeats, tutorialMixPath } from "../timeline.js";
import type { TutorialTimeline } from "../timeline.js";
import { BRIEF_TUTORIAL } from "./content.js";
import {
  BRIEF_VOICE_KEY,
  briefTimeline,
  type BriefKept,
  type BriefVoiceSection,
} from "./voice-data.js";
import { THUMBNAIL_OFFSET } from "./timing.js";

const ROOT = process.cwd();
if (!fs.existsSync(path.join(ROOT, "package.json")) || !fs.existsSync(path.join(ROOT, "src", "tutorial"))) {
  throw new Error("Run this from the project root (D:\\kap-reel).");
}

const VOICE_JSON = path.join(ROOT, "config", "voice.json");
const SCRIPT_JSON = path.join(ROOT, "config", "brief-v3-script.json");
const VOICE_DIR = path.join(ROOT, "assets", "audio", "voice", "brief-v3", "natural");
const TAKES_DIR = path.join(VOICE_DIR, "takes");
const MUSIC = path.join(ROOT, "out", "candidates", "music-i-a.mp3");
const MUSIC_VARIANT = "i-a";
const CANDIDATES = path.join(ROOT, "out", "candidates");
const COMPOSITION = "TutorialBriefVertical";
const RENDER = "out/render-tutorial-brief-v3-vertical-15s.mp4";
const DELIVERY = "out/kap-tut-brief-v3-vertical-15s.mp4";

const API_BASE = "https://api.elevenlabs.io";
const MODEL = "eleven_v3";
const MODE = "natural";
const STABILITY = 0.5;
const OUTPUT_FORMAT = "wav_44100";
const STT_MODEL = "scribe_v2";
const VOICE = { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" };
const SEED_BASE = 241000;

const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join("/");

// ---------------------------------------------------------------------------
// The briefV3 section of config/voice.json
// ---------------------------------------------------------------------------

type Analysis = {
  durationSeconds: number;
  leadSeconds: number;
  trailSeconds: number;
  /** Where the last speech frame ends, seconds. */
  speechEnd: number;
  gaps: { at: number; seconds: number; after: string | null }[];
  maxGapInPhrase: number;
  maxGapAtBoundary: number;
  startEdgeDb: number;
  endEdgeDb: number;
  peakDbfs: number;
  integratedLufs: number;
  speechDb: number;
  transcript: string;
  wordErrors: number;
  audioEvents: string[];
  spokenTag: boolean;
  shortWords: string[];
  minLogprob: number;
  words: { text: string; start: number; end: number }[];
};

type Generation = {
  beatId: string;
  seed: number;
  file: string;
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
  creditsMeasured: number | null;
  creditsBucket: string | null;
  createdAt: string;
  stt?: { file: string; model: string; creditsMeasured: number | null; creditsBucket: string | null };
  analysis?: Analysis;
};

type Section = BriefVoiceSection & {
  tutorial: string;
  cut: string;
  model: string;
  mode: string;
  voiceId: string;
  voiceName: string;
  outputFormat: string;
  script: string;
  generations: Generation[];
  kept: BriefKept[];
  selection?: { beatId: string; ranking: { seed: number; score: number; rejected: string[]; notes: string }[] }[];
  layout?: unknown;
  mix?: unknown;
};

const NOTE =
  "The brief tutorial (Give the AI the brief, not the task), 15 second vertical cut, read on " +
  "eleven_v3 by Sarah at the natural stability mode from config/brief-v3-script.json, " +
  "2026-09-24. Kept apart from generations and v3 above: nothing but src/tutorial/brief reads " +
  "this section. generations is every billable text to speech call, with the exact text sent " +
  "(tags included), the seed, the measured duration and the credits measured as a before and " +
  "after delta on the usage endpoint; stt is the scribe_v2 transcription check of that file " +
  "and what it cost; analysis is what was measured off the file. kept is the one generation " +
  "per beat the composition is laid out from, finished (edges trimmed, faded), with why. " +
  "Written by src/tutorial/brief/pipeline.ts.";

function emptySection(): Section {
  return {
    _note: NOTE,
    tutorial: BRIEF_TUTORIAL.id,
    cut: "short",
    model: MODEL,
    mode: MODE,
    voiceId: VOICE.id,
    voiceName: VOICE.name,
    outputFormat: OUTPUT_FORMAT,
    script: "config/brief-v3-script.json",
    generations: [],
    kept: [],
  };
}

/** Reads the whole log and returns this section, never touching the others. */
function loadSection(): Section {
  const log = JSON.parse(fs.readFileSync(VOICE_JSON, "utf8")) as Record<string, unknown>;
  const found = log[BRIEF_VOICE_KEY] as Section | undefined;
  return { ...emptySection(), ...(found ?? {}) };
}

/**
 * Rewrites this section alone. The file is re-read immediately before the
 * write, so a change another session made to any other key in between is kept.
 */
function saveSection(section: Section): void {
  const log = JSON.parse(fs.readFileSync(VOICE_JSON, "utf8")) as Record<string, unknown>;
  log[BRIEF_VOICE_KEY] = { ...section, _note: NOTE };
  fs.writeFileSync(VOICE_JSON, `${JSON.stringify(log, null, 2)}\n`);
  // A backup outside the shared file, in case another writer clobbers it.
  fs.mkdirSync(path.join(ROOT, "out", "brief"), { recursive: true });
  fs.writeFileSync(
    path.join(ROOT, "out", "brief", "voice-section.json"),
    `${JSON.stringify(log[BRIEF_VOICE_KEY], null, 2)}\n`,
  );
}

function upsertGeneration(g: Generation): void {
  const section = loadSection();
  const i = section.generations.findIndex((x) => x.file === g.file);
  if (i === -1) section.generations.push(g);
  else section.generations[i] = g;
  saveSection(section);
}

// ---------------------------------------------------------------------------
// The tagged script
// ---------------------------------------------------------------------------

function stripAudioTags(text: string): string {
  return text.replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
}

/** A short, stable folder name for one tagged text (FNV-1a, hex). */
function textKey(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `t${h.toString(16).padStart(8, "0")}`;
}

const tagsIn = (text: string): string[] => [...text.matchAll(/\[([^\]]*)\]/g)].map((m) => m[1]);

type Job = { beatId: string; text: string; plainText: string };

/** The tagged beats, checked against src word for word before anything is spent. */
function jobs(): Job[] {
  const script = JSON.parse(fs.readFileSync(SCRIPT_JSON, "utf8")) as {
    tutorial: string;
    cut: string;
    beats: { id: string; narration: string }[];
  };
  if (script.tutorial !== BRIEF_TUTORIAL.id || script.cut !== "short") {
    throw new Error(`${rel(SCRIPT_JSON)} is for ${script.tutorial} ${script.cut}, not brief short.`);
  }
  const beats = tutorialBeats(BRIEF_TUTORIAL, "short");
  const want = beats.map((b) => b.id).join(", ");
  const have = script.beats.map((b) => b.id).join(", ");
  if (want !== have) throw new Error(`${rel(SCRIPT_JSON)} has beats [${have}], the cut has [${want}].`);
  return beats.map((beat, i) => {
    const text = script.beats[i].narration.trim();
    const plainText = stripAudioTags(text);
    if (plainText !== beat.narration) {
      throw new Error(
        `beat "${beat.id}": with its tags stripped the script reads\n  "${plainText}"\n` +
          `but the narration in src is\n  "${beat.narration}"\nOnly tags may change. Nothing was sent.`,
      );
    }
    if (text.includes(String.fromCharCode(0x2014))) throw new Error(`beat "${beat.id}" contains an em dash.`);
    if (/K&A/.test(text)) throw new Error(`beat "${beat.id}": write "K and A" for the voice model.`);
    return { beatId: beat.id, text, plainText };
  });
}

// ---------------------------------------------------------------------------
// ElevenLabs
// ---------------------------------------------------------------------------

async function speak(key: string, text: string, seed: number, label: string): Promise<Buffer> {
  const res = await fetchRetry(
    `${API_BASE}/v1/text-to-speech/${VOICE.id}?output_format=${OUTPUT_FORMAT}`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: { stability: STABILITY },
        seed,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`POST /v1/text-to-speech returned ${res.status}: ${redact(await res.text(), key)}`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 2000 || bytes.subarray(0, 4).toString("latin1") !== "RIFF") {
    throw new Error(`${label}: asked for ${OUTPUT_FORMAT} and did not get a wav back (${bytes.length} bytes).`);
  }
  return bytes;
}

async function transcribe(
  key: string,
  file: string,
): Promise<{ json: unknown; credits: number | null; bucket: string | null }> {
  const form = new FormData();
  form.append("model_id", STT_MODEL);
  form.append("timestamps_granularity", "word");
  form.append("tag_audio_events", "true");
  form.append("language_code", "en");
  form.append("file", new Blob([fs.readFileSync(file)]), path.basename(file));
  const before = await usageSnapshot(key);
  const res = await fetchRetry(`${API_BASE}/v1/speech-to-text`, {
    method: "POST",
    headers: { "xi-api-key": key },
    body: form,
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`POST /v1/speech-to-text returned ${res.status}: ${redact(body, key)}`);
  const measured = await creditsSince(key, before);
  return { json: JSON.parse(body), credits: measured.credits, bucket: measured.bucket };
}

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

function decodeMono16k(file: string): Float32Array {
  const res = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostdin", "-i", file, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
    { maxBuffer: 512 * 1024 * 1024 },
  );
  if (res.status !== 0) throw new Error(`decode failed for ${rel(file)}`);
  const buf = res.stdout as Buffer;
  const out = new Float32Array(Math.floor(buf.length / 4));
  for (let i = 0; i < out.length; i += 1) out[i] = buf.readFloatLE(i * 4);
  return out;
}

const dbOf = (x: number) => 20 * Math.log10(Math.max(x, 1e-9));

function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Words as a comparison sees them: lower case, a url's punctuation spoken
 * ("fl.com/training" is "fl dot com slash training"), hyphens as spaces. The
 * comparison then runs on the letters alone, so "K and A" heard as "KNA" or
 * "AI" heard as "A.I." is the same read, and a real dropped or added word is
 * still a difference.
 */
function normalWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\.(?=[a-z])/g, " dot ")
    .replace(/\//g, " slash ")
    .replace(/-/g, " ")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/'/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function editDistance(a: string[], b: string[]): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j += 1) d[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

type SttWord = { text: string; start: number; end: number; type: string; logprob?: number };

function analyse(file: string, plainText: string, tagged: string, stt: unknown): Analysis {
  const sr = 16000;
  const hop = 160;
  const x = decodeMono16k(file);
  const frames: number[] = [];
  for (let i = 0; i + hop <= x.length; i += hop) {
    let s = 0;
    for (let j = 0; j < hop; j += 1) s += x[i + j] * x[i + j];
    frames.push(dbOf(Math.sqrt(s / hop)));
  }
  const peakFrame = Math.max(...frames);
  const threshold = Math.max(-60, peakFrame - 40);
  const speech = frames.map((db) => db > threshold);
  const first = speech.indexOf(true);
  const last = speech.lastIndexOf(true);
  const durationSeconds = x.length / sr;
  const gapsRaw: { at: number; seconds: number }[] = [];
  let run = 0;
  for (let i = first; i <= last; i += 1) {
    if (!speech[i]) run += 1;
    else {
      if (run >= 12) gapsRaw.push({ at: Number(((i - run) * 0.01).toFixed(2)), seconds: Number((run * 0.01).toFixed(2)) });
      run = 0;
    }
  }
  const speechFrames = frames.filter((_, i) => speech[i]);
  const speechDb =
    10 * Math.log10(speechFrames.reduce((a, db) => a + 10 ** (db / 10), 0) / Math.max(1, speechFrames.length));

  const { stderr } = ffmpeg(["-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const summary = stderr.slice(stderr.lastIndexOf("Summary:"));
  const integrated = Number(/I:\s*(-?[\d.]+|-inf) LUFS/.exec(summary)?.[1] ?? NaN);
  const vol = measureVolume(file);

  const all = ((stt as { words?: SttWord[] }).words ?? []);
  const words = all.filter((w) => w.type === "word");
  const events = all.filter((w) => w.type === "audio_event").map((w) => w.text);
  const transcript = (stt as { text?: string }).text ?? "";
  const heard = normalWords(words.map((w) => w.text).join(" "));
  const expected = normalWords(plainText);
  const wordErrors = heard.join("") === expected.join("") ? 0 : editDistance(heard, expected);
  const tagWords = new Set(normalWords(tagsIn(tagged).join(" ")).filter((w) => !expected.includes(w)));
  const spokenTag = heard.some((w) => tagWords.has(w));

  const gaps = gapsRaw.map((g) => {
    let after: string | null = null;
    for (const w of words) if (w.end <= g.at + 0.08) after = w.text;
    return { ...g, after };
  });
  const boundary = (w: string | null) => w !== null && /[.,!?;:"]$/.test(w);
  const maxGapInPhrase = Math.max(0, ...gaps.filter((g) => !boundary(g.after)).map((g) => g.seconds));
  const maxGapAtBoundary = Math.max(0, ...gaps.filter((g) => boundary(g.after)).map((g) => g.seconds));
  const shortWords = words
    .filter((w) => w.text.replace(/[^a-z]/gi, "").length >= 3 && w.end - w.start < 0.08)
    .map((w) => w.text);
  const logprobs = words.map((w) => w.logprob).filter((p): p is number => typeof p === "number");

  return {
    durationSeconds: Number(probeDuration(file).toFixed(3)),
    leadSeconds: Number((Math.max(0, first) * 0.01).toFixed(2)),
    trailSeconds: Number(Math.max(0, durationSeconds - (last + 1) * 0.01).toFixed(2)),
    speechEnd: Number(((last + 1) * 0.01).toFixed(2)),
    gaps,
    maxGapInPhrase: Number(maxGapInPhrase.toFixed(2)),
    maxGapAtBoundary: Number(maxGapAtBoundary.toFixed(2)),
    startEdgeDb: Number((frames[0] - peakFrame).toFixed(1)),
    endEdgeDb: Number((Math.max(frames[frames.length - 1], frames[frames.length - 2] ?? -120) - peakFrame).toFixed(1)),
    peakDbfs: vol.max,
    integratedLufs: integrated,
    speechDb: Number(speechDb.toFixed(2)),
    transcript,
    wordErrors,
    audioEvents: events,
    spokenTag,
    shortWords,
    minLogprob: logprobs.length ? Number(Math.min(...logprobs).toFixed(3)) : 0,
    words: words.map((w) => ({ text: w.text, start: w.start, end: w.end })),
  };
}

// ---------------------------------------------------------------------------
// voice
// ---------------------------------------------------------------------------

async function runVoice(per: number, onlyBeat: string | undefined, dryRun: boolean): Promise<void> {
  const list = jobs();
  const key = dryRun ? "" : readApiKey();
  let characters = 0;
  let spent = 0;
  for (const job of list) {
    if (onlyBeat && job.beatId !== onlyBeat) continue;
    for (let n = 1; n <= per; n += 1) {
      const seed = SEED_BASE + n;
      // A read of this exact text and seed, wherever it was written. A new
      // text gets its own folder, so the paid reads of an earlier draft stay
      // on disk and on the record rather than being overwritten.
      const existing = loadSection().generations.find(
        (g) => g.beatId === job.beatId && g.seed === seed && g.text === job.text && fs.existsSync(path.join(ROOT, g.file)),
      );
      const file = existing
        ? path.join(ROOT, existing.file)
        : path.join(TAKES_DIR, job.beatId, textKey(job.text), `s${seed}.wav`);
      if (existing?.analysis) {
        console.log(`[skip] ${job.beatId} seed ${seed}: on disk (${existing.durationSeconds}s)`);
        continue;
      }
      if (dryRun) {
        characters += job.text.length;
        console.log(`[dry run] ${job.beatId} seed ${seed}: ${job.text.length} characters  ${job.text}`);
        continue;
      }
      let g = existing;
      if (!g) {
        console.log(`\n[voice] ${job.beatId} seed ${seed}: ${job.text}`);
        const before = await usageSnapshot(key);
        const bytes = await speak(key, job.text, seed, `${job.beatId}/s${seed}`);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, bytes);
        const measured = await creditsSince(key, before);
        assertUnderCreditAlarm(measured.credits, `${job.beatId}/s${seed}`);
        g = {
          beatId: job.beatId,
          seed,
          file: rel(file),
          text: job.text,
          plainText: job.plainText,
          tags: tagsIn(job.text),
          characters: job.text.length,
          voiceId: VOICE.id,
          voiceName: VOICE.name,
          model: MODEL,
          mode: MODE,
          settings: { stability: STABILITY },
          outputFormat: OUTPUT_FORMAT,
          durationSeconds: Number(probeDuration(file).toFixed(3)),
          creditsMeasured: measured.credits,
          creditsBucket: measured.bucket,
          createdAt: new Date().toISOString(),
        };
        upsertGeneration(g);
        spent += measured.credits ?? 0;
        console.log(`  wrote ${g.file} (${g.durationSeconds}s), ${measured.credits ?? "?"} credits`);
      }
      const sttFile = `${file}.stt.json`;
      let json: unknown;
      if (g.stt && fs.existsSync(path.join(ROOT, g.stt.file))) {
        json = JSON.parse(fs.readFileSync(path.join(ROOT, g.stt.file), "utf8"));
      } else {
        const r = await transcribe(key, file);
        json = r.json;
        fs.writeFileSync(sttFile, JSON.stringify(json, null, 2));
        g.stt = { file: rel(sttFile), model: STT_MODEL, creditsMeasured: r.credits, creditsBucket: r.bucket };
        spent += r.credits ?? 0;
      }
      g.analysis = analyse(file, g.plainText, g.text, json);
      upsertGeneration(g);
      const a = g.analysis;
      console.log(
        `  stt ${g.stt.creditsMeasured ?? "?"} credits: "${a.transcript}"` +
          `${a.wordErrors ? `  WORD ERRORS ${a.wordErrors}` : ""}${a.spokenTag ? "  SPOKEN TAG" : ""}` +
          `${a.audioEvents.length ? `  EVENTS ${a.audioEvents.join(" ")}` : ""}`,
      );
      console.log(
        `  lead ${a.leadSeconds}s tail ${a.trailSeconds}s, gaps ${a.maxGapInPhrase}s in phrase / ` +
          `${a.maxGapAtBoundary}s at breaks, ${a.integratedLufs} LUFS, speech ${a.speechDb} dB, ` +
          `peak ${a.peakDbfs} dBFS, edges ${a.startEdgeDb}/${a.endEdgeDb} dB`,
      );
    }
  }
  if (dryRun) {
    console.log(`\n${characters} characters to send, about ${characters} credits plus transcription. Nothing was called.`);
  } else {
    console.log(`\n${spent} credits measured this run. ${totalSpend().total} measured on this reel so far.`);
  }
}

// ---------------------------------------------------------------------------
// select
// ---------------------------------------------------------------------------

/**
 * Lower is better. A rejection is a fault a listener hears as a mistake. The
 * penalties are voice.ts's own for its alternate takes (lead and tail silence,
 * a pause inside a phrase weighted hardest, long pauses at a break, clipped
 * words, low transcriber confidence, level away from the take's median, length
 * away from the beat's median), without the pitch term: that one was there to
 * catch an over-performed read, and this read is judged on timing and level.
 */
function score(
  a: Analysis,
  context: { speechMedian: number; durationMedian: number },
): { score: number; rejected: string[]; notes: string[] } {
  const rejected: string[] = [];
  if (a.wordErrors > 0) rejected.push(`${a.wordErrors} word error${a.wordErrors > 1 ? "s" : ""} ("${a.transcript}")`);
  if (a.spokenTag) rejected.push("a tag was spoken");
  if (a.audioEvents.length) rejected.push(`audio events ${a.audioEvents.join(" ")}`);
  if (a.startEdgeDb > -20) rejected.push(`starts inside a sound (${a.startEdgeDb} dB)`);
  if (a.endEdgeDb > -10) rejected.push(`stops inside the last word (${a.endEdgeDb} dB)`);
  if (a.peakDbfs >= -0.1) rejected.push(`peaks at ${a.peakDbfs} dBFS`);
  const notes: string[] = [];
  let total = 0;
  const add = (amount: number, note: string) => {
    if (amount <= 0.001) return;
    total += amount;
    notes.push(`${note} +${amount.toFixed(2)}`);
  };
  add((a.leadSeconds - 0.15) * 4, `lead ${a.leadSeconds}s`);
  add((a.trailSeconds - 0.3) * 2, `tail ${a.trailSeconds}s`);
  add((a.maxGapInPhrase - 0.25) * 12, `pause in phrase ${a.maxGapInPhrase}s`);
  add((a.maxGapAtBoundary - 0.55) * 6, `pause at break ${a.maxGapAtBoundary}s`);
  add(a.shortWords.length * 1.5, `short words ${a.shortWords.join(" ")}`);
  add(Math.max(0, -1.0 - a.minLogprob) * 1.5, `transcriber confidence ${a.minLogprob}`);
  add(Math.abs(a.speechDb - context.speechMedian) * 0.35, `level ${(a.speechDb - context.speechMedian).toFixed(1)} dB off the read`);
  add(
    (Math.abs(a.durationSeconds - context.durationMedian) / context.durationMedian) * 4,
    `length ${a.durationSeconds}s against ${context.durationMedian.toFixed(2)}s`,
  );
  return { score: Number(total.toFixed(3)), rejected, notes };
}

/** Silence kept before the first sound and after the last, once finished. */
const KEEP_LEAD = 0.06;
const KEEP_TAIL = 0.12;

/**
 * The kept file, finished: the silence at each edge trimmed to a few
 * hundredths, a 5 ms fade in, a 30 ms fade out and 60 ms of silence after it.
 * The same finish voice.ts gives its kept takes, plus the trim, because v3
 * files arrive with anything from nothing to half a second of air at the
 * front and the timeline already puts its own 12 frame tail after every line.
 * Nothing inside the speech is touched; the read is not sped up.
 */
function finish(g: Generation, out: string): { seconds: number; trimStart: number } {
  const a = g.analysis as Analysis;
  const source = path.join(ROOT, g.file);
  const trimStart = Math.max(0, a.leadSeconds - KEEP_LEAD);
  const end = Math.min(a.durationSeconds, a.speechEnd + KEEP_TAIL);
  const len = end - trimStart;
  const res = ffmpeg([
    "-i",
    source,
    "-af",
    `atrim=${trimStart.toFixed(3)}:${end.toFixed(3)},asetpts=N/SR/TB,` +
      `afade=t=in:st=0:d=0.005,afade=t=out:st=${(len - 0.03).toFixed(3)}:d=0.03,apad=pad_dur=0.06`,
    "-c:a",
    "pcm_s24le",
    "-y",
    out,
  ]);
  if (res.code !== 0) throw new Error(`finishing ${g.file} failed:\n${res.stderr.slice(-2000)}`);
  return { seconds: Number(probeDuration(out).toFixed(3)), trimStart };
}

function runSelect(): void {
  const section = loadSection();
  const list = jobs();
  // Only reads of the current script count: earlier drafts stay on the record
  // but neither compete nor set the level the kept reads are matched to.
  const current = new Set(list.map((j) => `${j.beatId}|${j.text}`));
  const clean = section.generations.filter(
    (g) => current.has(`${g.beatId}|${g.text}`) && g.analysis && g.analysis.wordErrors === 0 && !g.analysis.spokenTag && g.analysis.audioEvents.length === 0,
  );
  const speechMedian = median(clean.map((g) => (g.analysis as Analysis).speechDb));
  console.log(`[select] speech level median ${speechMedian.toFixed(2)} dB over ${clean.length} clean generations`);

  type Ranked = { g: Generation; score: number; rejected: string[]; notes: string[] };
  const ranked: Record<string, Ranked[]> = {};
  for (const job of list) {
    const gens = section.generations.filter((g) => g.beatId === job.beatId && g.text === job.text && g.analysis);
    if (gens.length === 0) throw new Error(`${job.beatId}: nothing generated. Run voice first.`);
    const durationMedian = median(gens.map((g) => g.durationSeconds));
    ranked[job.beatId] = gens
      .map((g) => ({ g, ...score(g.analysis as Analysis, { speechMedian, durationMedian }) }))
      .sort((x, y) => (x.rejected.length ? 1000 : 0) + x.score - ((y.rejected.length ? 1000 : 0) + y.score));
  }

  // Fit. The best scoring read of every beat may lay out past the 600 frame
  // cap. When it does, the beat whose next clean read saves frames at the
  // smallest cost in score gives way, and that repeats until the cut fits.
  // Only clean reads are candidates, and the read is never sped up: this only
  // chooses between takes that were actually made.
  const choice: Record<string, number> = Object.fromEntries(list.map((j) => [j.beatId, 0]));
  const finishedLength = (g: Generation) => {
    const a = g.analysis as Analysis;
    return Math.min(a.durationSeconds, a.speechEnd + KEEP_TAIL) - Math.max(0, a.leadSeconds - KEEP_LEAD) + 0.06;
  };
  const layoutFrames = () =>
    tutorialBeats(BRIEF_TUTORIAL, "short").reduce((sum, beat) => {
      const r = ranked[beat.id][choice[beat.id]];
      return sum + Math.max(beat.minFrames, Math.ceil(finishedLength(r.g) * FPS) + 12);
    }, 0);
  const swaps: string[] = [];
  while (layoutFrames() > 600) {
    let bestSwap: { beatId: string; index: number; cost: number } | null = null;
    for (const job of list) {
      const cur = ranked[job.beatId][choice[job.beatId]];
      ranked[job.beatId].forEach((r, index) => {
        if (r.rejected.length || finishedLength(r.g) >= finishedLength(cur.g) - 0.01) return;
        const saved = finishedLength(cur.g) - finishedLength(r.g);
        const cost = (r.score - cur.score) / saved;
        if (!bestSwap || cost < bestSwap.cost) bestSwap = { beatId: job.beatId, index, cost };
      });
    }
    if (!bestSwap) break;
    const s = bestSwap as { beatId: string; index: number; cost: number };
    const from = ranked[s.beatId][choice[s.beatId]].g.seed;
    choice[s.beatId] = s.index;
    swaps.push(`${s.beatId}: seed ${from} gave way to seed ${ranked[s.beatId][s.index].g.seed} to fit 600 frames`);
  }
  for (const line of swaps) console.log(`  fit: ${line}`);

  const kept: BriefKept[] = [];
  for (const job of list) {
    const best = ranked[job.beatId][choice[job.beatId]];
    const out = path.join(VOICE_DIR, `${job.beatId}.wav`);
    const { seconds, trimStart } = finish(best.g, out);
    const a = best.g.analysis as Analysis;
    const others = ranked[job.beatId]
      .filter((r) => r !== best)
      .map((r) =>
        `seed ${r.g.seed} ${r.rejected.length ? `rejected: ${r.rejected.join(", ")}` : `score ${r.score}${r.notes.length ? ` (${r.notes.join("; ")})` : ""}`}`,
      );
    const fitNote = swaps.find((l) => l.startsWith(`${job.beatId}:`));
    const why =
      (fitNote ? `Fit: ${fitNote.slice(job.beatId.length + 2)}. ` : "") +
      (best.rejected.length ? `NO CLEAN GENERATION; least bad kept, with ${best.rejected.join(", ")}. ` : "") +
      `Kept seed ${best.g.seed}: transcript "${a.transcript}", lead ${a.leadSeconds}s, tail ${a.trailSeconds}s, ` +
      `largest pause ${Math.max(a.maxGapInPhrase, a.maxGapAtBoundary)}s, ${a.durationSeconds}s raw, ` +
      `${a.integratedLufs} LUFS (speech ${a.speechDb} dB), score ${best.score}` +
      `${best.notes.length ? ` (${best.notes.join("; ")})` : ""}. Others: ${others.join(" | ") || "none"}.`;
    console.log(`  ${job.beatId}: ${why}`);
    kept.push({
      beatId: job.beatId,
      file: rel(out),
      durationSeconds: seconds,
      sourceFile: best.g.file,
      seed: best.g.seed,
      words: a.words.map((w) => ({
        text: w.text,
        start: Number(Math.max(0, w.start - trimStart).toFixed(3)),
        end: Number(Math.max(0, w.end - trimStart).toFixed(3)),
      })),
      why,
    });
  }

  section.kept = kept;
  section.selection = list.map((job) => ({
    beatId: job.beatId,
    ranking: ranked[job.beatId].map((r) => ({
      seed: r.g.seed,
      score: r.score,
      rejected: r.rejected,
      notes: r.notes.join("; "),
    })),
  }));
  let timeline: TutorialTimeline;
  try {
    timeline = briefTimeline(section);
  } catch (err) {
    saveSection(section);
    throw err;
  }
  section.layout = {
    totalFrames: timeline.totalFrames,
    seconds: Number((timeline.totalFrames / FPS).toFixed(3)),
    beats: timeline.entries.map((e) => ({ beatId: e.beat.id, start: e.start, end: e.end, seconds: e.seconds })),
  };
  saveSection(section);
  console.log(`\n[layout] ${timeline.totalFrames} frames (${(timeline.totalFrames / FPS).toFixed(2)}s)`);
  for (const e of timeline.entries) {
    console.log(`  ${e.beat.id.padEnd(6)} ${String(e.start).padStart(3)} to ${String(e.end).padStart(3)}  ${e.seconds.toFixed(2)}s`);
  }
}

// ---------------------------------------------------------------------------
// mix: voice.ts --mix, number for number
// ---------------------------------------------------------------------------

const BED_UNDER_VOICE_DB = 8;
const DUCK_TARGET_DB = 10;
const DUCK_RATIO = 20;
const DUCK_ATTACK_MS = 20;
const DUCK_RELEASE_MS = 400;
const DUCK_TOLERANCE_DB = 1.0;
const FADE_OUT_SECONDS = 0.4;

type Shape = {
  placements: { file: string; delayMs: number }[];
  seconds: number;
  bedGainDb: number;
  threshold: number;
};

const bedChain = (s: Shape) =>
  `[0:a]atrim=0:${s.seconds},asetpts=N/SR/TB,volume=${s.bedGainDb.toFixed(2)}dB,` +
  `afade=t=out:st=${s.seconds - FADE_OUT_SECONDS}:d=${FADE_OUT_SECONDS},${AFORMAT}[bed]`;

function voiceChain(s: Shape): string[] {
  const parts: string[] = [];
  const labels: string[] = [];
  s.placements.forEach((p, i) => {
    parts.push(`[${i + 1}:a]adelay=${p.delayMs}:all=1,atrim=0:${s.seconds},${AFORMAT}[v${i}]`);
    labels.push(`[v${i}]`);
  });
  parts.push(`${labels.join("")}amix=inputs=${labels.length}:duration=longest:normalize=0[voiceraw]`);
  // Padded to the full cut, as voice.ts pads its v3 mixes, so the bed reaches
  // its fade instead of stopping on the last word.
  parts.push(`[voiceraw]apad=whole_dur=${s.seconds},${AFORMAT}[voiceall]`);
  return parts;
}

const duck = (key: string, s: Shape, out: string) =>
  `[bed][${key}]sidechaincompress=threshold=${s.threshold.toFixed(6)}:ratio=${DUCK_RATIO}:` +
  `attack=${DUCK_ATTACK_MS}:release=${DUCK_RELEASE_MS}:makeup=1:level_sc=1[${out}]`;

const mixFilter = (s: Shape, ceilingDb: number) =>
  [
    bedChain(s),
    ...voiceChain(s),
    `[voiceall]asplit=2[voicemix][voicekey]`,
    duck("voicekey", s, "ducked"),
    `[ducked][voicemix]amix=inputs=2:duration=first:normalize=0[premix]`,
    `[premix]${limiter(ceilingDb)}[mixed]`,
  ].join(";");

function meanOfBed(inputs: string[], s: Shape, ducked: boolean, w: { start: number; duration: number }): number {
  const slice = `atrim=${w.start.toFixed(3)}:${(w.start + w.duration).toFixed(3)},asetpts=N/SR/TB`;
  const parts = ducked
    ? [bedChain(s), ...voiceChain(s), duck("voiceall", s, "probe"), `[probe]${slice},volumedetect[out]`]
    : [bedChain(s), `[bed]${slice},volumedetect[out]`];
  const { stderr } = ffmpeg([...inputs, "-filter_complex", parts.join(";"), "-map", "[out]", "-f", "null", "-"]);
  return Number(/mean_volume:\s*(-?[\d.]+) dB/.exec(stderr)?.[1] ?? NaN);
}

function solveDuck(inputs: string[], s: Shape, w: { start: number; duration: number }) {
  let thresholdDb = 20 * Math.log10(s.threshold);
  let measured = NaN;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const threshold = Math.min(0.5, Math.max(0.0005, 10 ** (thresholdDb / 20)));
    thresholdDb = 20 * Math.log10(threshold);
    const probed = { ...s, threshold };
    measured = Number((meanOfBed(inputs, probed, false, w) - meanOfBed(inputs, probed, true, w)).toFixed(2));
    if (!Number.isFinite(measured) || Math.abs(measured - DUCK_TARGET_DB) <= DUCK_TOLERANCE_DB || threshold <= 0.0005 || threshold >= 0.5) {
      return { threshold, thresholdDb, measuredDuckDb: measured };
    }
    thresholdDb -= (DUCK_TARGET_DB - measured) / (1 - 1 / DUCK_RATIO);
  }
  return { threshold: Math.min(0.5, Math.max(0.0005, 10 ** (thresholdDb / 20))), thresholdDb, measuredDuckDb: measured };
}

function runMix(): void {
  const section = loadSection();
  const timeline = briefTimeline(section);
  const seconds = timeline.totalFrames / FPS;
  const musicSeconds = probeDuration(MUSIC);
  if (musicSeconds + 0.01 < seconds) {
    throw new Error(`${rel(MUSIC)} is ${musicSeconds.toFixed(2)}s, shorter than the ${seconds.toFixed(2)}s cut.`);
  }
  const placements = timeline.entries.map((e) => {
    if (!e.voiceFile) throw new Error(`no kept read for "${e.beat.id}". Run select first.`);
    return { file: path.join(ROOT, e.voiceFile), delayMs: Math.round((e.start / FPS) * 1000) };
  });
  let longest = { startSec: 0, seconds: 0 };
  for (const e of timeline.entries) {
    if (e.seconds > longest.seconds) longest = { startSec: e.start / FPS, seconds: e.seconds };
  }
  const window = { start: longest.startSec + 0.4, duration: Math.max(0.5, longest.seconds - 0.8) };
  const inputs = ["-i", MUSIC, ...placements.flatMap((p) => ["-i", p.file])];

  const bed = measureVolume(MUSIC, { start: 0, duration: seconds });
  const voicePeak = Math.max(...placements.map((p) => measureVolume(p.file).max));
  const means = placements.map((p) => measureVolume(p.file).mean);
  const voiceMean = means.reduce((a, b) => a + b, 0) / means.length;
  const bedGainDb = Number((voicePeak - BED_UNDER_VOICE_DB - bed.max).toFixed(2));
  const firstThresholdDb = voiceMean - DUCK_TARGET_DB / (1 - 1 / DUCK_RATIO);
  console.log(`[mix] brief short (${seconds.toFixed(2)}s), bed ${rel(MUSIC)} (${MUSIC_VARIANT})`);
  console.log(`  bed peak ${bed.max} dBFS, voice peak ${voicePeak.toFixed(2)}, voice mean ${voiceMean.toFixed(2)}, bed gain ${bedGainDb} dB`);

  const shape: Shape = {
    placements,
    seconds,
    bedGainDb,
    threshold: Math.min(0.5, Math.max(0.0005, 10 ** (firstThresholdDb / 20))),
  };
  const solved = solveDuck(inputs, shape, window);
  shape.threshold = solved.threshold;
  console.log(
    `  sidechain threshold ${solved.threshold.toFixed(4)} (${solved.thresholdDb.toFixed(1)} dBFS): ` +
      `${solved.measuredDuckDb} dB of duck inside the longest line, about ` +
      `${(BED_UNDER_VOICE_DB + solved.measuredDuckDb).toFixed(1)} dB under the voice`,
  );
  const make = (c: number) => mixFilter(shape, c);
  const { ceilingDb, measurement: m } = headroomCeilingDb(inputs, make);
  const wav = path.join(ROOT, tutorialMixPath(BRIEF_TUTORIAL, "short"));
  const pass2 = ffmpeg([
    ...inputs,
    "-filter_complex",
    `${make(ceilingDb)};[mixed]loudnorm=${LOUDNORM_TARGET}:measured_I=${m.input_i}:` +
      `measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:` +
      `offset=${m.target_offset}:linear=false:print_format=json[norm];[norm]${AFORMAT}[out]`,
    "-map",
    "[out]",
    "-c:a",
    "pcm_s16le",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-y",
    wav,
  ]);
  if (pass2.code !== 0) throw new Error(`loudnorm pass 2 failed:\n${pass2.stderr.slice(-3000)}`);
  parseLoudnorm(pass2.stderr);
  const verified = correctLoudness(wav, verifyLoudness(wav));
  if (Math.abs(verified.integrated - TARGET_LUFS) > 0.5) {
    console.log(`  WARNING: integrated loudness ${verified.integrated} LUFS, more than 0.5 off target.`);
  }
  console.log(`  wrote ${rel(wav)}: I ${verified.integrated} LUFS, TP ${verified.truePeak} dBTP, LRA ${verified.lra}`);

  // A listening copy beside the other candidates.
  const mp3 = path.join(CANDIDATES, "brief-15s-mix.mp3");
  const enc = ffmpeg(["-i", wav, "-c:a", "libmp3lame", "-b:a", "320k", "-y", mp3]);
  if (enc.code !== 0) throw new Error(`mp3 encode failed:\n${enc.stderr.slice(-2000)}`);

  const fresh = loadSection();
  fresh.mix = {
    wav: rel(wav),
    mp3: rel(mp3),
    musicSource: rel(MUSIC),
    musicVariant: MUSIC_VARIANT,
    seconds,
    bedGainDb,
    measuredDuckDb: solved.measuredDuckDb,
    limiterCeilingDbfs: ceilingDb,
    measuredIntegratedLufs: verified.integrated,
    measuredTruePeakDbfs: verified.truePeak,
    measuredLra: verified.lra,
    createdAt: new Date().toISOString(),
  };
  saveSection(fresh);
}

// ---------------------------------------------------------------------------
// deliver
// ---------------------------------------------------------------------------

function remotion(args: string[]): void {
  const res = spawnSync(process.execPath, ["node_modules/@remotion/cli/remotion-cli.js", ...args], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (res.status !== 0) throw new Error(`remotion ${args.join(" ")} exited ${res.status}`);
}

function still(frame: number, out: string): void {
  remotion(["still", "src/index.ts", COMPOSITION, out, `--frame=${frame}`, "--log=error"]);
}

async function runDeliver(to: string | undefined): Promise<void> {
  const timeline = briefTimeline(loadSection());
  const mix = path.join(ROOT, tutorialMixPath(BRIEF_TUTORIAL, "short"));
  if (!fs.existsSync(mix)) throw new Error(`${rel(mix)} is missing. Run mix first.`);
  if (!fs.existsSync(path.join(ROOT, RENDER))) {
    throw new Error(`${RENDER} is missing. Render ${COMPOSITION} to it first.`);
  }
  const at = (id: string) => {
    const e = timeline.entries.find((x) => x.beat.id === id);
    if (!e) throw new Error(`no beat ${id}`);
    return e;
  };

  // 1. Encode, with the mix muxed in place of the render's own audio.
  const target: DeliveryTarget = {
    format: "vertical",
    duration: "15s",
    input: RENDER,
    output: DELIVERY,
    frames: timeline.totalFrames,
    canvas: "1080x1920",
  };
  if (!encodeTarget(target, () => mix)) throw new Error(`encode of ${DELIVERY} failed.`);

  // 2. Captions: one cue per beat, the untagged narration.
  const rows: CueRow[] = timeline.entries.map((e) => ({
    text: e.beat.narration,
    start: e.start,
    end: e.end,
    source: `tutorial/brief ${e.beat.id}`,
  }));
  const srtTarget = {
    format: "vertical",
    duration: "15s",
    rows,
    totalFrames: timeline.totalFrames,
    reel: "tutorial-brief",
  } as unknown as SrtTarget;
  const problems = validateTarget(srtTarget);
  if (problems.length) throw new Error(problems.map((p) => p.message).join("\n"));
  const srt = path.join(ROOT, "out", "kap-tut-brief-v3-vertical-15s.srt");
  fs.writeFileSync(srt, renderSrt(rows), "utf8");
  if (/\[[^\]]*\]/.test(fs.readFileSync(srt, "utf8"))) throw new Error("an audio tag reached the SRT.");
  console.log(`wrote ${rel(srt)}`);

  // 3. Stills, rendered rather than pulled from the encode, so they are lossless.
  fs.mkdirSync(CANDIDATES, { recursive: true });
  const hook = at("hook");
  const weak = at("weak");
  const cta = at("cta");
  const promptsFrame = weak.start + THUMBNAIL_OFFSET;
  const frames: [string, number][] = [
    ["brief-frame-hook.png", hook.start + Math.min(30, hook.end - hook.start - 1)],
    ["brief-frame-prompts.png", promptsFrame],
    ["brief-frame-cta.png", cta.end - 3],
  ];
  for (const [name, frame] of frames) {
    still(frame, path.join(CANDIDATES, name));
    console.log(`wrote out/candidates/${name} (frame ${frame})`);
  }

  // 4. Thumbnail: the side by side prompts, before either output arrives.
  const thumb = path.join(ROOT, "out", "thumbnail-tutorial-brief-v3-vertical.jpg");
  const thumbRes = ffmpeg(["-i", path.join(CANDIDATES, "brief-frame-prompts.png"), "-q:v", "2", "-y", thumb]);
  if (thumbRes.code !== 0) throw new Error(`thumbnail failed:\n${thumbRes.stderr.slice(-2000)}`);
  console.log(`wrote ${rel(thumb)} (frame ${promptsFrame})`);

  // 5. Copy.
  if (to) {
    const dest = path.resolve(to);
    fs.mkdirSync(dest, { recursive: true });
    const copies: [string, string][] = [
      [path.join(ROOT, DELIVERY), "reel-vertical.mp4"],
      [srt, "reel-vertical.srt"],
      [thumb, "thumbnail.jpg"],
    ];
    for (const [from, name] of copies) {
      fs.copyFileSync(from, path.join(dest, name));
      console.log(`copied ${name} to ${dest}`);
    }
  }
}

// ---------------------------------------------------------------------------
// spend
// ---------------------------------------------------------------------------

function totalSpend(): { tts: number; stt: number; total: number; generations: number } {
  const section = loadSection();
  const tts = section.generations.reduce((s, g) => s + (g.creditsMeasured ?? 0), 0);
  const stt = section.generations.reduce((s, g) => s + (g.stt?.creditsMeasured ?? 0), 0);
  return { tts, stt, total: tts + stt, generations: section.generations.length };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
}

async function main(argv: string[]): Promise<void> {
  const command = argv[0];
  if (command === "voice") {
    await runVoice(Number(flag(argv, "per") ?? 3), flag(argv, "beat"), argv.includes("--dry-run"));
  } else if (command === "select") {
    runSelect();
  } else if (command === "mix") {
    runMix();
  } else if (command === "deliver") {
    await runDeliver(flag(argv, "to"));
  } else if (command === "spend") {
    const s = totalSpend();
    console.log(`${s.generations} generations: ${s.tts} text to speech credits, ${s.stt} speech to text, ${s.total} total.`);
  } else {
    throw new Error("Commands: voice, select, mix, deliver, spend.");
  }
}

main(process.argv.slice(2)).catch((err: unknown) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
