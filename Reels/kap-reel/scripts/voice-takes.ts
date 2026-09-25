/**
 * scripts/voice-takes.ts
 *
 * Alternate eleven_v3 reads of the contrast tutorial, 15 second cut, made
 * 2026-09-24 after Alex heard the natural v3 read and asked for "more
 * feeling" that was also not "too much or wrong feeling". Read as: the emotion
 * that was there sounded performed or misplaced, and what was missing was a
 * friend who knows the answer and enjoys telling you. Words never change; only
 * the inline audio tags, the stability mode and the voice do.
 *
 * Each take is built the same way: every beat generated several times with a
 * different seed, every generation transcribed and measured, and the best one
 * kept by those measurements rather than by whichever roll came first.
 *
 * Run from D:\kap-reel (never npx):
 *   node node_modules/tsx/dist/cli.mjs scripts/voice-takes.ts api
 *   node node_modules/tsx/dist/cli.mjs scripts/voice-takes.ts take --take a|b|c [--beat <id>] [--dry-run]
 *   node node_modules/tsx/dist/cli.mjs scripts/voice-takes.ts audition [--dry-run]
 *   node node_modules/tsx/dist/cli.mjs scripts/voice-takes.ts rank
 *   node node_modules/tsx/dist/cli.mjs scripts/voice-takes.ts select --take a|b|c
 *   node node_modules/tsx/dist/cli.mjs scripts/voice-takes.ts verify --take a|b|c
 *   node node_modules/tsx/dist/cli.mjs scripts/voice-takes.ts build --take a|b|c
 *   node node_modules/tsx/dist/cli.mjs scripts/voice-takes.ts report
 *
 * Driven by config/contrast-takes.json, logged to config/voice-takes.json.
 * src/ never reads either file, so no take can move a render; shipping one is
 * a separate, deliberate change to content.voice.
 *
 * Why this is its own file. scripts/voice.ts is shared with the other
 * tutorials and is not edited for this. It exports stripAudioTags, which is
 * imported below so a tagged line is stripped exactly the way the v3 path
 * strips it. Everything else it would offer (the seeded wav call, the mix
 * graph) is private to it, so the parts needed here are reproduced with the
 * same constants: the mix is the voice.ts --mix graph (bed 8 dB under the
 * voice peak, sidechain duck solved to about 10 dB, limiter, two pass loudnorm
 * to -14 LUFS, corrective gain), built from the same scripts/audio.ts helpers.
 *
 * voice.ts runs its CLI when it is imported. It is therefore imported once,
 * with process.argv set to its own no-spend dry run (it calls nothing and
 * reads only config/voice.json) and console output muted for that moment.
 *
 * Confirmed against the live docs on 2026-09-24 (elevenlabs.io/docs); the
 * full record is in out/candidates/README-takes.md:
 *
 * - eleven_v3 is the expressive text to speech model for recorded narration:
 *   GA, 5,000 characters a request. eleven_v3_conversational is listed as the
 *   realtime variant for agents. Nothing newer (no v4) is on the models page.
 * - Stability on v3 is three modes. Natural 0.5 and creative 0.0 here, the
 *   same values voice.ts uses. voice_settings sends stability only.
 * - output_format wav_44100: 44.1 kHz PCM and WAV need Pro or above. Lossless,
 *   the same samples as pcm_44100 with a header.
 * - seed: "best effort to sample deterministically". No parameter returns
 *   several generations from one request, so variation is one request per
 *   seed and the kept seed is logged.
 * - Speech to text: POST /v1/speech-to-text, model scribe_v2, word timestamps
 *   and tag_audio_events, which is the check for spoken tags.
 *
 * The API key is read from .env or ELEVENLABS_API_KEY by scripts/audio.ts and
 * never printed or written anywhere.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AFORMAT,
  LOUDNORM_TARGET,
  TARGET_LUFS,
  apiGetJson,
  assertUnderCreditAlarm,
  correctLoudness,
  creditsSince,
  fetchRetry,
  ffmpeg,
  headroomCeilingDb,
  limiter,
  measureVolume,
  musicTake,
  parseLoudnorm,
  probeDuration,
  readApiKey,
  redact,
  usageSnapshot,
  verifyLoudness,
} from "./audio.js";
import { CONTRAST_TUTORIAL } from "../src/tutorial/reels/contrast.js";
import {
  FPS,
  TUTORIAL_TOTAL_FRAMES,
  beatFrames,
  tutorialBeats,
  tutorialTimeline,
  type TutorialTimeline,
} from "../src/tutorial/timeline.js";
import type { VoiceGeneration, VoiceLog, VoiceMixRecord } from "../src/tutorial/voice-log.js";
import type { TutorialBeat, TutorialContent, TutorialCut } from "../src/tutorial/types.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const API_BASE = "https://api.elevenlabs.io";
const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join("/");

// ---------------------------------------------------------------------------
// stripAudioTags, from scripts/voice.ts
// ---------------------------------------------------------------------------

async function importStripAudioTags(): Promise<(text: string) => string> {
  const argv = process.argv;
  const log = console.log;
  const warn = console.warn;
  process.argv = [argv[0], path.join(HERE, "voice.ts"), "--dry-run", "--reel", "contrast", "--cut", "short"];
  console.log = () => {};
  console.warn = () => {};
  try {
    const mod = (await import("./voice.js")) as { stripAudioTags: (text: string) => string };
    return mod.stripAudioTags;
  } finally {
    process.argv = argv;
    console.log = log;
    console.warn = warn;
  }
}

const stripAudioTags = await importStripAudioTags();

const tagsIn = (text: string): string[] => [...text.matchAll(/\[([^\]]*)\]/g)].map((m) => m[1]);

// ---------------------------------------------------------------------------
// Config and log
// ---------------------------------------------------------------------------

const V3_MODEL = "eleven_v3";
const V3_STABILITY = { creative: 0.0, natural: 0.5, robust: 1.0 } as const;
type V3Mode = keyof typeof V3_STABILITY;
type V3Settings = { stability: number };

const TAKES_CONFIG = path.join(ROOT, "config", "contrast-takes.json");
const TAKES_LOG = path.join(ROOT, "config", "voice-takes.json");
const TAKES_AUDIO = path.join(ROOT, "assets", "audio", "voice", "contrast-takes");
const CANDIDATE_DIR = path.join(ROOT, "out", "candidates");
const AUDITION_DIR = path.join(CANDIDATE_DIR, "contrast-take-c-auditions");
const STT_MODEL = "scribe_v2";

const TUTORIALS: Record<string, TutorialContent> = { contrast: CONTRAST_TUTORIAL };

type TakeBeat = { id: string; narration: string; why: string };

type TakeDef = {
  title: string;
  voiceId: string | null;
  voiceName: string | null;
  mode: V3Mode;
  direction: string;
  beats?: TakeBeat[];
  /** Take C reads another take's tags exactly. */
  tagsFrom?: string;
  why?: string;
};

type TakesConfig = {
  tutorial: string;
  cut: TutorialCut;
  model: string;
  outputFormat: string;
  generationsPerBeat: number;
  seedBase: number;
  runCreditCap: number;
  musicVariant: string;
  takes: Record<string, TakeDef>;
  audition: {
    mode: V3Mode;
    seedsPerLine: number;
    lines: { id: string; text: string; note: string }[];
    voices: { id: string; name: string; category: string; description: string }[];
  };
};

/** What was measured off one file. All seconds, all dB. */
type TakeAnalysis = {
  durationSeconds: number;
  leadSeconds: number;
  trailSeconds: number;
  gaps: { at: number; seconds: number; after: string | null }[];
  maxGapInPhrase: number;
  maxGapAtBoundary: number;
  startEdgeDb: number;
  endEdgeDb: number;
  peakDbfs: number;
  integratedLufs: number;
  speechDb: number;
  medianF0: number;
  pitchSpreadSt: number;
  pitchRangeSt: number;
  endContourSt: number;
  transcript: string;
  wordErrors: number;
  audioEvents: string[];
  spokenTag: boolean;
  shortWords: string[];
  minLogprob: number;
  wordsPerSecond: number;
  /** Samples at full scale in the file as delivered, and runs of two or more in a row (clipping). */
  clip?: ClipStats;
};

type ClipStats = { fullScaleSamples: number; clippedRuns: number; longestRun: number; peakLinear: number };

type TakeGeneration = {
  kind: "beat" | "audition" | "baseline";
  take: string;
  beatId: string;
  seed: number | null;
  file: string;
  text: string;
  plainText: string;
  tags: string[];
  characters: number;
  voiceId: string;
  voiceName: string;
  model: string;
  mode: V3Mode;
  settings: V3Settings;
  outputFormat: string;
  durationSeconds: number;
  creditsMeasured: number | null;
  creditsBucket: string | null;
  /**
   * Set when a file was paid for by an earlier, interrupted run and found on
   * disk without a record. Its cost is counted at one credit a character.
   */
  adopted?: string;
  createdAt: string;
  stt?: { file: string; creditsMeasured: number | null; creditsBucket: string | null };
  analysis?: TakeAnalysis;
};

type TakeSelection = {
  take: string;
  beatId: string;
  keptSeed: number | null;
  sourceFile: string;
  file: string;
  durationSeconds: number;
  why: string;
  ranking: { seed: number | null; score: number; rejected: string[]; notes: string }[];
  createdAt: string;
};

type Verification = {
  take: string;
  beatId: string;
  file: string;
  sttFile: string;
  transcript: string;
  wordErrors: number;
  spokenTag: boolean;
  audioEvents: string[];
  creditsMeasured: number | null;
  createdAt: string;
};

type TakesLog = {
  _note: string;
  apiCheck?: unknown;
  generations: TakeGeneration[];
  selections: TakeSelection[];
  verifications: Verification[];
  auditionRanking: unknown[];
  stitches: unknown[];
  mixes: unknown[];
};

const EMPTY_TAKES_LOG: TakesLog = {
  _note:
    "Alternate eleven_v3 takes of the contrast tutorial, 15 second cut, and the take C voice " +
    "audition, 2026-09-24. Every billable call is here with the exact text sent, the seed, the " +
    "voice, the stability, the output format, the measured duration and the measured credits (a " +
    "before and after delta on the usage endpoint, the same as config/voice.json). stt is the " +
    "transcription check of that file and what it cost. analysis is what was measured off the " +
    "file. selections is which generation each take kept per beat and why; verifications is the " +
    "transcription of each kept, finished beat. src/ never reads this file. Written by " +
    "scripts/voice-takes.ts.",
  generations: [],
  selections: [],
  verifications: [],
  auditionRanking: [],
  stitches: [],
  mixes: [],
};

function loadTakesConfig(): TakesConfig {
  return JSON.parse(fs.readFileSync(TAKES_CONFIG, "utf8")) as TakesConfig;
}

function loadTakesLog(): TakesLog {
  if (!fs.existsSync(TAKES_LOG)) return structuredClone(EMPTY_TAKES_LOG);
  const parsed = JSON.parse(fs.readFileSync(TAKES_LOG, "utf8")) as Partial<TakesLog>;
  return { ...structuredClone(EMPTY_TAKES_LOG), ...parsed, _note: EMPTY_TAKES_LOG._note };
}

function saveTakesLog(log: TakesLog): void {
  fs.writeFileSync(TAKES_LOG, `${JSON.stringify(log, null, 2)}\n`);
}

/** Credits spent on one generation, measured, or counted a credit a character when adopted. */
const genCredits = (g: TakeGeneration) => g.creditsMeasured ?? (g.adopted ? g.characters : 0);

/** Credits measured so far across every take, audition and transcription. */
function takesSpent(log: TakesLog): number {
  return (
    log.generations.reduce((sum, g) => sum + genCredits(g) + (g.stt?.creditsMeasured ?? 0), 0) +
    log.verifications.reduce((sum, v) => sum + (v.creditsMeasured ?? 0), 0)
  );
}

function assertUnderRunCap(config: TakesConfig, log: TakesLog, next: number, label: string): void {
  const spent = takesSpent(log);
  if (spent + next > config.runCreditCap) {
    throw new Error(
      `STOP before ${label}: ${spent} credits spent on the takes, and ${next} more would pass ` +
        `the ${config.runCreditCap} credit cap in config/contrast-takes.json. Nothing was sent.`,
    );
  }
}

function takeBeats(config: TakesConfig, take: string): TakeBeat[] {
  const def = config.takes[take];
  if (!def) throw new Error(`No take "${take}" in config/contrast-takes.json.`);
  if (def.beats) return def.beats;
  if (def.tagsFrom) return takeBeats(config, def.tagsFrom);
  throw new Error(`Take "${take}" has neither beats nor tagsFrom.`);
}

/**
 * The words-only-the-tags-change guarantee: every beat of the cut present and
 * in order, its stripped text exactly the narration in src, no em dash, "K and
 * A" rather than "K&A". Checked before anything is spent.
 */
function checkTaggedBeats(
  content: TutorialContent,
  cut: TutorialCut,
  tagged: { id: string; narration: string }[],
  source: string,
): { beat: TutorialBeat; text: string; plainText: string }[] {
  const beats = tutorialBeats(content, cut);
  const ids = beats.map((b) => b.id).join(", ");
  const scriptIds = tagged.map((b) => b.id).join(", ");
  if (ids !== scriptIds) {
    throw new Error(`${source} has beats [${scriptIds}], the cut has [${ids}]. They must match in order.`);
  }
  return beats.map((beat, i) => {
    const text = tagged[i].narration.trim();
    checkLine(text, `${source} beat "${beat.id}"`);
    const plainText = stripAudioTags(text);
    if (plainText !== beat.narration) {
      throw new Error(
        `${source} beat "${beat.id}": with its tags stripped it reads\n  "${plainText}"\n` +
          `but the narration in src is\n  "${beat.narration}"\nOnly tags may change. Nothing was sent.`,
      );
    }
    return { beat, text, plainText };
  });
}

function checkLine(text: string, label: string): void {
  if (text.includes(String.fromCharCode(0x2014))) throw new Error(`${label} contains an em dash.`);
  if (/K&A/.test(text)) throw new Error(`${label}: write "K and A" for the voice model.`);
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** One seeded eleven_v3 call. Returns the audio bytes. */
async function speak(
  key: string,
  voiceId: string,
  text: string,
  label: string,
  settings: V3Settings,
  outputFormat: string,
  seed: number,
): Promise<Buffer> {
  const res = await fetchRetry(`${API_BASE}/v1/text-to-speech/${voiceId}?output_format=${outputFormat}`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: V3_MODEL, voice_settings: settings, seed }),
  });
  if (!res.ok) {
    throw new Error(`POST /v1/text-to-speech/${voiceId} returned ${res.status}: ${redact(await res.text(), key)}`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 2000) {
    throw new Error(`${label}: only ${bytes.length} bytes came back: ${redact(bytes.toString("utf8").slice(0, 500), key)}`);
  }
  return bytes;
}

type CreditMeasure = { credits: number | null; bucket: string | null };
type SttWord = { text: string; start: number; end: number; type: string; logprob?: number };

async function transcribe(key: string, file: string): Promise<{ json: unknown; credits: CreditMeasure }> {
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
  const credits = await creditsSince(key, before);
  return { json: JSON.parse(body), credits };
}

/** The docs check made against the API itself: models, subscription, library voices. All free reads. */
async function runApiCheck(): Promise<void> {
  const key = readApiKey();
  const models = await apiGetJson(key, "/v1/models");
  type Model = { model_id: string; name?: string; can_do_text_to_speech?: boolean; description?: string };
  const list = ((models.json as Model[] | null) ?? []).filter((m) => m.can_do_text_to_speech !== false);
  console.log(`GET /v1/models ${models.status}`);
  for (const m of list) console.log(`  ${m.model_id}  ${m.name ?? ""}`);
  const sub = await apiGetJson(key, "/v1/user/subscription");
  const tier = (sub.json as { tier?: string } | null)?.tier ?? null;
  console.log(`GET /v1/user/subscription ${sub.status}${tier ? ` tier ${tier}` : ""}`);
  const q =
    "/v1/shared-voices?page_size=40&category=professional&gender=female&accent=american" +
    "&language=en&use_cases=conversational&sort=usage_character_count_1y";
  const shared = await apiGetJson(key, q);
  type Shared = { voice_id: string; name: string; rate?: number; descriptive?: string; age?: string; use_case?: string; description?: string };
  const voices = ((shared.json as { voices?: Shared[] } | null)?.voices ?? []).map((v) => ({
    id: v.voice_id,
    name: v.name,
    rate: v.rate ?? null,
    age: v.age ?? null,
    descriptive: v.descriptive ?? null,
    useCase: v.use_case ?? null,
    description: (v.description ?? "").slice(0, 200),
  }));
  console.log(`GET /v1/shared-voices ${shared.status}: ${voices.length} professional, female, American, conversational`);
  for (const v of voices) console.log(`  ${v.name} ${v.id} rate ${v.rate} ${v.age} ${v.descriptive}`);
  const log = loadTakesLog();
  log.apiCheck = {
    checkedAt: new Date().toISOString(),
    models: list.map((m) => m.model_id),
    subscription: { status: sub.status, tier },
    sharedVoicesQuery: q,
    sharedVoices: voices,
  };
  saveTakesLog(log);
}

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

function decodeMono16k(file: string): Float32Array {
  const res = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", "-i", file, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], {
    maxBuffer: 512 * 1024 * 1024,
  });
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

function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))];
}

/** YIN over one frame. f0 in Hz, or null for an unvoiced frame. */
function yin(x: Float32Array, start: number, sr: number): number | null {
  const W = 400;
  const tauMin = Math.floor(sr / 400);
  const tauMax = Math.floor(sr / 70);
  if (start + W + tauMax >= x.length) return null;
  const d = new Float64Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau += 1) {
    let sum = 0;
    for (let j = 0; j < W; j += 1) {
      const diff = x[start + j] - x[start + j + tau];
      sum += diff * diff;
    }
    d[tau] = sum;
  }
  let running = 0;
  const cmnd = new Float64Array(tauMax + 1);
  cmnd[0] = 1;
  for (let tau = 1; tau <= tauMax; tau += 1) {
    running += d[tau];
    cmnd[tau] = running > 0 ? (d[tau] * tau) / running : 1;
  }
  for (let tau = tauMin; tau <= tauMax; tau += 1) {
    if (cmnd[tau] < 0.15) {
      while (tau + 1 <= tauMax && cmnd[tau + 1] < cmnd[tau]) tau += 1;
      return sr / tau;
    }
  }
  return null;
}

/** Everything measured off the waveform: edges, silences, level, pitch. */
function measureWave(file: string) {
  const sr = 16000;
  const x = decodeMono16k(file);
  const hop = 160;
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
  const speechDb = 10 * Math.log10(speechFrames.reduce((a, db) => a + 10 ** (db / 10), 0) / Math.max(1, speechFrames.length));
  const f0: number[] = [];
  for (let i = 0; i < frames.length; i += 1) {
    if (frames[i] < peakFrame - 30) continue;
    const f = yin(x, i * hop, sr);
    if (f) f0.push(f);
  }
  const mf0 = median(f0);
  const st = f0.map((f) => 12 * Math.log2(f / mf0));
  const mean = st.reduce((a, b) => a + b, 0) / Math.max(1, st.length);
  const spread = Math.sqrt(st.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, st.length));
  const { stderr } = ffmpeg(["-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const summary = stderr.slice(stderr.lastIndexOf("Summary:"));
  const integrated = Number(/I:\s*(-?[\d.]+|-inf) LUFS/.exec(summary)?.[1] ?? NaN);
  const vol = measureVolume(file);
  return {
    durationSeconds: Number(probeDuration(file).toFixed(3)),
    leadSeconds: Number((Math.max(0, first) * 0.01).toFixed(2)),
    trailSeconds: Number(Math.max(0, durationSeconds - (last + 1) * 0.01).toFixed(2)),
    gapsRaw,
    startEdgeDb: Number((frames[0] - peakFrame).toFixed(1)),
    endEdgeDb: Number((Math.max(frames[frames.length - 1], frames[frames.length - 2] ?? -120) - peakFrame).toFixed(1)),
    peakDbfs: vol.max,
    integratedLufs: integrated,
    speechDb: Number(speechDb.toFixed(2)),
    medianF0: Number(mf0.toFixed(1)),
    pitchSpreadSt: Number(spread.toFixed(2)),
    pitchRangeSt: Number((quantile(st, 0.9) - quantile(st, 0.1)).toFixed(2)),
    endContourSt: Number(median(st.slice(-5)).toFixed(2)),
  };
}

/**
 * Full scale samples at the file's own rate and format. volumedetect reports
 * 0.0 dBFS for anything from about 0.989 up, which is a loud read, not a
 * clipped one; what a listener hears as distortion is two or more samples in
 * a row pinned at full scale.
 */
function clipStats(file: string): ClipStats {
  const res = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", "-i", file, "-f", "f32le", "-ac", "1", "-"], { maxBuffer: 512 * 1024 * 1024 });
  if (res.status !== 0) throw new Error(`decode failed for ${rel(file)}`);
  const buf = res.stdout as Buffer;
  let full = 0;
  let runs = 0;
  let run = 0;
  let longest = 0;
  let peak = 0;
  for (let i = 0; i + 4 <= buf.length; i += 4) {
    const x = Math.abs(buf.readFloatLE(i));
    if (x > peak) peak = x;
    if (x >= 0.999) {
      full += 1;
      run += 1;
      if (run > longest) longest = run;
    } else {
      if (run >= 2) runs += 1;
      run = 0;
    }
  }
  if (run >= 2) runs += 1;
  return { fullScaleSamples: full, clippedRuns: runs, longestRun: longest, peakLinear: Number(peak.toFixed(5)) };
}

/** Adds clip stats to every measured generation that lacks them, and saves the log. */
function ensureClipStats(): void {
  const log = loadTakesLog();
  let changed = false;
  for (const g of log.generations) {
    if (g.analysis && !g.analysis.clip) {
      g.analysis.clip = clipStats(path.join(ROOT, g.file));
      changed = true;
    }
  }
  if (changed) saveTakesLog(log);
}

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

/** Lower case words, numbers spelled the way the narration spells them. */
function normalWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/(\d)\.(\d)/g, (_, a: string, b: string) => ` ${ONES[Number(a)]} point ${ONES[Number(b)]} `)
    .replace(/\b(\d)\b/g, (_, a: string) => ` ${ONES[Number(a)]} `)
    .replace(/[^a-z' ]+/g, " ")
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

/** What the transcript says about a line: word errors, spoken tags, tagged sounds. */
function transcriptCheck(stt: unknown, plainText: string, tagged: string) {
  const all = (stt as { words?: SttWord[] }).words ?? [];
  const words = all.filter((w) => w.type === "word");
  const events = all.filter((w) => w.type === "audio_event").map((w) => w.text);
  const transcript = (stt as { text?: string }).text ?? "";
  const heard = normalWords(words.map((w) => w.text).join(" "));
  const expected = normalWords(plainText);
  // The transcriber sometimes runs two words together; a transcript that
  // matches once the spaces are gone counts as exact.
  const wordErrors = heard.join("") === expected.join("") ? 0 : editDistance(heard, expected);
  const tagWords = new Set(normalWords(tagsIn(tagged).join(" ")).filter((w) => !expected.includes(w)));
  const spokenTag = heard.some((w) => tagWords.has(w));
  return { words, events, transcript, expected, wordErrors, spokenTag };
}

function analyse(file: string, plainText: string, tagged: string, stt: unknown): TakeAnalysis {
  const wave = measureWave(file);
  const t = transcriptCheck(stt, plainText, tagged);
  // Each silence labelled with the word before it, so a pause at a full stop
  // is told apart from one in the middle of "two point nine".
  const gaps = wave.gapsRaw.map((g) => {
    let after: string | null = null;
    for (const w of t.words) if (w.end <= g.at + 0.08) after = w.text;
    return { ...g, after };
  });
  const boundary = (w: string | null) => w !== null && /[.,!?;:]$/.test(w);
  const maxGapInPhrase = Math.max(0, ...gaps.filter((g) => !boundary(g.after)).map((g) => g.seconds));
  const maxGapAtBoundary = Math.max(0, ...gaps.filter((g) => boundary(g.after)).map((g) => g.seconds));
  const shortWords = t.words.filter((w) => w.text.replace(/[^a-z]/gi, "").length >= 3 && w.end - w.start < 0.08).map((w) => w.text);
  const logprobs = t.words.map((w) => w.logprob).filter((p): p is number => typeof p === "number");
  const { gapsRaw: _unused, ...rest } = wave;
  void _unused;
  return {
    ...rest,
    gaps,
    maxGapInPhrase: Number(maxGapInPhrase.toFixed(2)),
    maxGapAtBoundary: Number(maxGapAtBoundary.toFixed(2)),
    transcript: t.transcript,
    wordErrors: t.wordErrors,
    audioEvents: t.events,
    spokenTag: t.spokenTag,
    shortWords,
    minLogprob: logprobs.length ? Number(Math.min(...logprobs).toFixed(3)) : 0,
    wordsPerSecond: Number((t.expected.length / Math.max(0.1, wave.durationSeconds - wave.leadSeconds - wave.trailSeconds)).toFixed(2)),
  };
}

async function checkGeneration(key: string, config: TakesConfig, g: TakeGeneration): Promise<void> {
  if (g.analysis) return;
  const file = path.join(ROOT, g.file);
  const sttFile = `${file}.stt.json`;
  let json: unknown;
  let credits: CreditMeasure = { credits: null, bucket: null };
  if (g.stt && fs.existsSync(path.join(ROOT, g.stt.file))) {
    json = JSON.parse(fs.readFileSync(path.join(ROOT, g.stt.file), "utf8"));
    credits = { credits: g.stt.creditsMeasured, bucket: g.stt.creditsBucket };
  } else {
    assertUnderRunCap(config, loadTakesLog(), 20, `the transcription of ${g.file}`);
    const r = await transcribe(key, file);
    json = r.json;
    credits = r.credits;
    fs.writeFileSync(sttFile, JSON.stringify(json, null, 2));
  }
  g.stt = { file: rel(sttFile), creditsMeasured: credits.credits, creditsBucket: credits.bucket };
  g.analysis = { ...analyse(file, g.plainText, g.text, json), clip: clipStats(file) };
  const a = g.analysis;
  console.log(
    `    stt ${credits.credits ?? "?"} credits: "${a.transcript}"` +
      `${a.wordErrors ? `  WORD ERRORS ${a.wordErrors}` : ""}${a.spokenTag ? "  SPOKEN TAG" : ""}` +
      `${a.audioEvents.length ? `  EVENTS ${a.audioEvents.join(" ")}` : ""}`,
  );
  console.log(
    `    lead ${a.leadSeconds}s tail ${a.trailSeconds}s, gaps ${a.maxGapInPhrase}s in phrase / ` +
      `${a.maxGapAtBoundary}s at breaks, ${a.integratedLufs} LUFS, speech ${a.speechDb} dB, ` +
      `pitch spread ${a.pitchSpreadSt} st, edges ${a.startEdgeDb}/${a.endEdgeDb} dB`,
  );
}

function persistGeneration(g: TakeGeneration): void {
  const log = loadTakesLog();
  const i = log.generations.findIndex((x) => x.file === g.file);
  if (i === -1) log.generations.push(g);
  else log.generations[i] = g;
  saveTakesLog(log);
}

type GenSpec = {
  kind: TakeGeneration["kind"];
  take: string;
  beatId: string;
  seed: number;
  text: string;
  plainText: string;
  voiceId: string;
  voiceName: string;
  mode: V3Mode;
  file: string;
};

function recordFor(spec: GenSpec, config: TakesConfig, durationSeconds: number, credits: CreditMeasure): TakeGeneration {
  return {
    kind: spec.kind,
    take: spec.take,
    beatId: spec.beatId,
    seed: spec.seed,
    file: rel(spec.file),
    text: spec.text,
    plainText: spec.plainText,
    tags: tagsIn(spec.text),
    characters: spec.text.length,
    voiceId: spec.voiceId,
    voiceName: spec.voiceName,
    model: V3_MODEL,
    mode: spec.mode,
    settings: { stability: V3_STABILITY[spec.mode] },
    outputFormat: config.outputFormat,
    durationSeconds,
    creditsMeasured: credits.credits,
    creditsBucket: credits.bucket,
    createdAt: new Date().toISOString(),
  };
}

/** One seeded v3 call into a wav, logged, then transcribed and measured. */
async function generateTakeFile(key: string, config: TakesConfig, spec: GenSpec): Promise<TakeGeneration> {
  checkLine(spec.text, `${spec.take}/${spec.beatId}`);
  const label = `${spec.take}/${spec.beatId}/${spec.voiceName}/seed ${spec.seed}`;
  assertUnderRunCap(config, loadTakesLog(), spec.text.length + 20, label);
  console.log(`\n[${label}] ${spec.mode}, ${config.outputFormat}`);
  console.log(`  ${spec.text}`);
  const before = await usageSnapshot(key);
  const bytes = await speak(key, spec.voiceId, spec.text, label, { stability: V3_STABILITY[spec.mode] }, config.outputFormat, spec.seed);
  if (bytes.subarray(0, 4).toString("latin1") !== "RIFF") {
    throw new Error(`${label}: asked for ${config.outputFormat} and did not get a wav back.`);
  }
  fs.mkdirSync(path.dirname(spec.file), { recursive: true });
  fs.writeFileSync(spec.file, bytes);
  const durationSeconds = Number(probeDuration(spec.file).toFixed(3));
  const measured = await creditsSince(key, before);
  console.log(`  wrote ${rel(spec.file)} (${durationSeconds.toFixed(2)}s), ${measured.credits ?? "?"} credits`);
  assertUnderCreditAlarm(measured.credits, label);
  const g = recordFor(spec, config, durationSeconds, measured);
  persistGeneration(g);
  await checkGeneration(key, config, g);
  persistGeneration(g);
  return g;
}

/**
 * A generation that is on disk and logged, or on disk and not logged (paid
 * for by an interrupted run: adopted, not regenerated), or missing.
 */
async function ensureGeneration(key: string, config: TakesConfig, spec: GenSpec, dryRun: boolean): Promise<number> {
  const log = loadTakesLog();
  const existing = log.generations.find(
    (g) => g.file === rel(spec.file) && g.text === spec.text && g.voiceId === spec.voiceId && g.mode === spec.mode,
  );
  if (existing && fs.existsSync(spec.file)) {
    if (!dryRun && !existing.analysis) {
      await checkGeneration(key, config, existing);
      persistGeneration(existing);
    }
    return 0;
  }
  if (!existing && fs.existsSync(spec.file) && fs.readFileSync(spec.file).subarray(0, 4).toString("latin1") === "RIFF") {
    console.log(`[adopt] ${rel(spec.file)}: on disk from the interrupted run, not logged. Adopted, not regenerated.`);
    if (dryRun) return 0;
    const g = recordFor(spec, config, Number(probeDuration(spec.file).toFixed(3)), { credits: null, bucket: null });
    g.adopted = "Paid for by the run interrupted at 20:06 on 2026-09-24 before its record was written; counted at one credit a character.";
    g.createdAt = fs.statSync(spec.file).mtime.toISOString();
    persistGeneration(g);
    await checkGeneration(key, config, g);
    persistGeneration(g);
    return 0;
  }
  if (dryRun) {
    console.log(`[dry run] ${spec.take} ${spec.voiceName} ${spec.beatId} seed ${spec.seed}: ${spec.text.length} characters  ${spec.text}`);
    return spec.text.length;
  }
  await generateTakeFile(key, config, spec);
  return spec.text.length;
}

// ---------------------------------------------------------------------------
// Commands: generate
// ---------------------------------------------------------------------------

async function runTake(take: string, dryRun: boolean, onlyBeat?: string): Promise<void> {
  const config = loadTakesConfig();
  const def = config.takes[take];
  if (!def) throw new Error(`No take "${take}".`);
  const content = TUTORIALS[config.tutorial];
  if (!def.voiceId || !def.voiceName) throw new Error(`Take ${take} has no voice yet. Run the audition and set it.`);
  const checked = checkTaggedBeats(content, config.cut, takeBeats(config, take), `take ${take}`);
  const key = dryRun ? "" : readApiKey();
  let characters = 0;
  for (const c of checked) {
    if (onlyBeat && c.beat.id !== onlyBeat) continue;
    for (let n = 1; n <= config.generationsPerBeat; n += 1) {
      const seed = config.seedBase + n;
      characters += await ensureGeneration(
        key,
        config,
        {
          kind: "beat",
          take,
          beatId: c.beat.id,
          seed,
          text: c.text,
          plainText: c.plainText,
          voiceId: def.voiceId,
          voiceName: def.voiceName,
          mode: def.mode,
          file: path.join(TAKES_AUDIO, `take-${take}`, c.beat.id, `s${seed}.wav`),
        },
        dryRun,
      );
    }
  }
  const spent = takesSpent(loadTakesLog());
  console.log(
    `\n${dryRun ? `${characters} characters to send. Nothing was called. ` : `Take ${take} generated. `}` +
      `${spent} credits spent on the takes so far, cap ${config.runCreditCap}.`,
  );
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function runAudition(dryRun: boolean): Promise<void> {
  const config = loadTakesConfig();
  const a = config.audition;
  const key = dryRun ? "" : readApiKey();
  let characters = 0;
  for (const voice of a.voices) {
    for (const line of a.lines) {
      for (let n = 1; n <= a.seedsPerLine; n += 1) {
        const seed = config.seedBase + n;
        characters += await ensureGeneration(
          key,
          config,
          {
            kind: "audition",
            take: "audition",
            beatId: line.id,
            seed,
            text: line.text,
            plainText: stripAudioTags(line.text),
            voiceId: voice.id,
            voiceName: voice.name,
            mode: a.mode,
            file: path.join(AUDITION_DIR, `${slug(voice.name)}-${line.id}-s${seed}.wav`),
          },
          dryRun,
        );
      }
    }
  }
  console.log(
    `\n${dryRun ? `${characters} characters to send. Nothing was called. ` : "Audition done. "}` +
      `${takesSpent(loadTakesLog())} credits spent on the takes so far.`,
  );
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/**
 * The score a generation is kept on. Lower is better. A rejection is a fault a
 * listener hears as a mistake: a dropped or added word, a spoken tag, a laugh
 * or breath the transcriber tagged, a file that starts inside a sound or stops
 * inside the last word, or clipping (two or more samples in a row at full
 * scale; a lone full scale sample is only a small penalty). Everything else is a penalty in
 * rough seconds of harm: dead air before and after, a pause inside a phrase
 * (weighted hardest: a stumble in "two point nine to one" reads as unsure), a
 * long pause at a sentence break, a word timed under 80 ms (a clipped
 * syllable), low transcriber confidence, speech level away from the take's
 * median, length away from the beat's median, and pitch movement far outside
 * the beat's median either way (much more is the performed read Alex heard,
 * much less is the flat one before it).
 */
function scoreGeneration(
  g: TakeGeneration,
  context: { speechMedian: number; durationMedian: number; spreadMedian: number },
): { score: number; rejected: string[]; notes: string[] } {
  const a = g.analysis;
  if (!a) return { score: Infinity, rejected: ["not measured"], notes: [] };
  const rejected: string[] = [];
  if (a.wordErrors > 0) rejected.push(`${a.wordErrors} word error${a.wordErrors > 1 ? "s" : ""} ("${a.transcript}")`);
  if (a.spokenTag) rejected.push("a tag was spoken");
  if (a.audioEvents.length) rejected.push(`audio events ${a.audioEvents.join(" ")}`);
  if (a.startEdgeDb > -20) rejected.push(`starts inside a sound (${a.startEdgeDb} dB)`);
  if (a.endEdgeDb > -10) rejected.push(`stops inside the last word (${a.endEdgeDb} dB)`);
  const clip = a.clip ?? { fullScaleSamples: 0, clippedRuns: 0, longestRun: 0, peakLinear: 0 };
  if (clip.clippedRuns > 0) rejected.push(`clips (${clip.clippedRuns} runs of full scale samples, longest ${clip.longestRun})`);
  const notes: string[] = [];
  let score = 0;
  const add = (amount: number, note: string) => {
    if (amount <= 0.001) return;
    score += amount;
    notes.push(`${note} +${amount.toFixed(2)}`);
  };
  add((a.leadSeconds - 0.15) * 4, `lead ${a.leadSeconds}s`);
  add((a.trailSeconds - 0.3) * 2, `tail ${a.trailSeconds}s`);
  add((a.maxGapInPhrase - 0.25) * 12, `pause in phrase ${a.maxGapInPhrase}s`);
  add((a.maxGapAtBoundary - 0.55) * 6, `pause at break ${a.maxGapAtBoundary}s`);
  add(a.shortWords.length * 1.5, `short words ${a.shortWords.join(" ")}`);
  add(clip.clippedRuns === 0 ? clip.fullScaleSamples * 0.1 : 0, `${clip.fullScaleSamples} lone full scale sample${clip.fullScaleSamples === 1 ? "" : "s"}`);
  add(Math.max(0, -1.0 - a.minLogprob) * 1.5, `transcriber confidence ${a.minLogprob}`);
  add((a.endEdgeDb + 40) * 0.04, `last sound cut at ${a.endEdgeDb} dB`);
  add((a.startEdgeDb + 45) * 0.03, `first sound starts at ${a.startEdgeDb} dB`);
  add(Math.abs(a.speechDb - context.speechMedian) * 0.35, `level ${(a.speechDb - context.speechMedian).toFixed(1)} dB off the take`);
  add((Math.abs(a.durationSeconds - context.durationMedian) / context.durationMedian) * 4, `length ${a.durationSeconds}s against ${context.durationMedian.toFixed(2)}s`);
  const ratio = a.pitchSpreadSt / context.spreadMedian;
  add(ratio > 1.4 ? (ratio - 1.4) * 3 : ratio < 0.65 ? (0.65 - ratio) * 3 : 0, `pitch spread ${a.pitchSpreadSt} st`);
  return { score: Number(score.toFixed(3)), rejected, notes };
}

/**
 * The kept file, finished: a 5 ms fade in, a 30 ms fade out to the last
 * sample and 60 ms of silence after it. eleven_v3 hands a line back with the
 * decay of the last word still sounding at the final sample, which plays as a
 * click; the fade lets it finish and nothing inside the speech is touched.
 * 24 bit, 44.1 kHz, as generated.
 */
function finishBeat(source: string, out: string): number {
  const seconds = probeDuration(source);
  const res = ffmpeg([
    "-i", source,
    "-af", `afade=t=in:st=0:d=0.005,afade=t=out:st=${(seconds - 0.03).toFixed(4)}:d=0.03,apad=pad_dur=0.06`,
    "-c:a", "pcm_s24le", "-y", out,
  ]);
  if (res.code !== 0) throw new Error(`finishing ${rel(source)} failed:\n${res.stderr.slice(-2000)}`);
  return Number(probeDuration(out).toFixed(3));
}

function runSelect(take: string): void {
  ensureClipStats();
  const config = loadTakesConfig();
  const content = TUTORIALS[config.tutorial];
  const def = config.takes[take];
  const log = loadTakesLog();
  const checked = checkTaggedBeats(content, config.cut, takeBeats(config, take), `take ${take}`);
  const all = log.generations.filter(
    (g) => g.kind === "beat" && g.take === take && g.voiceId === def.voiceId && g.mode === def.mode && g.analysis,
  );
  const clean = all.filter((g) => {
    const a = g.analysis as TakeAnalysis;
    return a.wordErrors === 0 && !a.spokenTag && a.audioEvents.length === 0;
  });
  const speechMedian = median((clean.length ? clean : all).map((g) => (g.analysis as TakeAnalysis).speechDb));
  const selections: TakeSelection[] = [];
  console.log(`\n[select take ${take}] speech level median ${speechMedian.toFixed(2)} dB over ${all.length} generations`);
  for (const c of checked) {
    const gens = all.filter((g) => g.beatId === c.beat.id && g.text === c.text);
    if (gens.length === 0) throw new Error(`take ${take} ${c.beat.id}: nothing generated.`);
    const durationMedian = median(gens.map((g) => g.durationSeconds));
    const spreadMedian = median(gens.map((g) => (g.analysis as TakeAnalysis).pitchSpreadSt));
    const scored = gens
      .map((g) => ({ g, ...scoreGeneration(g, { speechMedian, durationMedian, spreadMedian }) }))
      .sort((x, y) => (x.rejected.length ? 1000 : 0) + x.score - ((y.rejected.length ? 1000 : 0) + y.score));
    const best = scored[0];
    const a = best.g.analysis as TakeAnalysis;
    const final = path.join(TAKES_AUDIO, `take-${take}`, `${c.beat.id}.wav`);
    const finishedSeconds = finishBeat(path.join(ROOT, best.g.file), final);
    const losers = scored
      .slice(1)
      .map((s) => `seed ${s.g.seed} ${s.rejected.length ? `rejected: ${s.rejected.join(", ")}` : `score ${s.score}${s.notes.length ? ` (${s.notes.join("; ")})` : ""}`}`);
    const why =
      (best.rejected.length ? `NO CLEAN GENERATION; least bad kept, with ${best.rejected.join(", ")}. ` : "") +
      `Kept seed ${best.g.seed}: transcript exact, no spoken tag or audio event, lead ${a.leadSeconds}s, ` +
      `largest pause ${Math.max(a.maxGapInPhrase, a.maxGapAtBoundary)}s` +
      `${a.maxGapAtBoundary > a.maxGapInPhrase ? " at a sentence break" : a.maxGapInPhrase > 0 ? " inside a phrase" : ""}, ` +
      `${a.durationSeconds}s, ${a.integratedLufs} LUFS (speech ${a.speechDb} dB), pitch spread ${a.pitchSpreadSt} st, ` +
      `score ${best.score}${best.notes.length ? ` (${best.notes.join("; ")})` : ""}. Others: ${losers.join(" | ")}.`;
    console.log(`  ${c.beat.id}: ${why}`);
    selections.push({
      take,
      beatId: c.beat.id,
      keptSeed: best.g.seed,
      sourceFile: best.g.file,
      file: rel(final),
      durationSeconds: finishedSeconds,
      why,
      ranking: scored.map((s) => ({ seed: s.g.seed, score: s.score, rejected: s.rejected, notes: s.notes.join("; ") })),
      createdAt: new Date().toISOString(),
    });
  }
  const onDisk = loadTakesLog();
  onDisk.selections = [...onDisk.selections.filter((s) => s.take !== take), ...selections];
  saveTakesLog(onDisk);
}

/** The speech to text check on every kept, finished beat: no spoken tag, no dropped word, no tagged sound. */
async function runVerify(take: string): Promise<void> {
  const config = loadTakesConfig();
  const key = readApiKey();
  const log = loadTakesLog();
  const kept = log.selections.filter((s) => s.take === take);
  if (kept.length === 0) throw new Error(`take ${take}: run select first.`);
  const results: Verification[] = [];
  for (const s of kept) {
    const source = log.generations.find((g) => g.file === s.sourceFile) as TakeGeneration;
    const file = path.join(ROOT, s.file);
    assertUnderRunCap(config, loadTakesLog(), 20, `verifying ${s.file}`);
    const r = await transcribe(key, file);
    const sttFile = `${file}.stt.json`;
    fs.writeFileSync(sttFile, JSON.stringify(r.json, null, 2));
    const t = transcriptCheck(r.json, source.plainText, source.text);
    console.log(
      `  ${take}/${s.beatId}: "${t.transcript}" ${t.wordErrors ? `WORD ERRORS ${t.wordErrors}` : "exact"}, ` +
        `${t.spokenTag ? "SPOKEN TAG" : "no spoken tag"}, ${t.events.length ? `EVENTS ${t.events.join(" ")}` : "no audio events"}, ` +
        `${r.credits.credits ?? "?"} credits`,
    );
    results.push({
      take,
      beatId: s.beatId,
      file: s.file,
      sttFile: rel(sttFile),
      transcript: t.transcript,
      wordErrors: t.wordErrors,
      spokenTag: t.spokenTag,
      audioEvents: t.events,
      creditsMeasured: r.credits.credits,
      createdAt: new Date().toISOString(),
    });
  }
  const onDisk = loadTakesLog();
  onDisk.verifications = [...onDisk.verifications.filter((v) => v.take !== take), ...results];
  saveTakesLog(onDisk);
}

/** Ranks the audition voices, per voice across both seeds of every line. */
function runRank(): void {
  ensureClipStats();
  const config = loadTakesConfig();
  const log = loadTakesLog();
  const auds = log.generations.filter((g) => g.kind === "audition" && g.analysis);
  const rows = config.audition.voices.map((v) => {
    const mine = auds.filter((g) => g.voiceId === v.id);
    let score = 0;
    let rejects = 0;
    const perLine: Record<string, string> = {};
    for (const line of config.audition.lines) {
      const all = auds.filter((g) => g.beatId === line.id);
      const durationMedian = median(all.map((g) => g.durationSeconds));
      const spreadMedian = median(all.map((g) => (g.analysis as TakeAnalysis).pitchSpreadSt));
      const gens = mine.filter((g) => g.beatId === line.id);
      const results = gens.map((g) => scoreGeneration(g, { speechMedian: (g.analysis as TakeAnalysis).speechDb, durationMedian, spreadMedian }));
      rejects += results.filter((r) => r.rejected.length).length;
      score += results.reduce((s, r) => s + r.score, 0) / Math.max(1, results.length);
      perLine[line.id] = gens
        .map((g, i) => {
          const a = g.analysis as TakeAnalysis;
          return `s${g.seed} ${a.durationSeconds}s ${results[i].rejected.length ? `REJECT ${results[i].rejected.join(", ")}` : `score ${results[i].score}`}, spread ${a.pitchSpreadSt} st, ${a.wordsPerSecond} w/s`;
        })
        .join("; ");
    }
    const lineSeconds = Object.fromEntries(
      config.audition.lines.map((l) => [l.id, median(mine.filter((g) => g.beatId === l.id).map((g) => g.durationSeconds))]),
    );
    const spread = median(mine.map((g) => (g.analysis as TakeAnalysis).pitchSpreadSt));
    const wps = median(mine.map((g) => (g.analysis as TakeAnalysis).wordsPerSecond));
    return {
      voice: v.name,
      voiceId: v.id,
      category: v.category,
      generations: mine.length,
      rejects,
      score: Number(score.toFixed(3)),
      lineSeconds,
      medianPitchSpreadSt: spread,
      medianWordsPerSecond: wps,
      perLine,
      files: mine.map((g) => g.file),
    };
  });
  rows.sort((a, b) => a.rejects - b.rejects || a.score - b.score);
  console.log("\naudition ranking (fewest rejects, then lowest mean score per line)");
  rows.forEach((r, i) => {
    console.log(
      `  ${i + 1}. ${r.voice.padEnd(15)} ${r.generations} gens  rejects ${r.rejects}  score ${r.score}  ` +
        `spread ${r.medianPitchSpreadSt} st  ${r.medianWordsPerSecond} w/s  ${JSON.stringify(r.lineSeconds)}`,
    );
    for (const [line, text] of Object.entries(r.perLine)) console.log(`       ${line}: ${text}`);
  });
  const onDisk = loadTakesLog();
  onDisk.auditionRanking = rows;
  saveTakesLog(onDisk);
}

// ---------------------------------------------------------------------------
// Layout and mix: the voice.ts --mix graph, reproduced with its constants
// ---------------------------------------------------------------------------

const BED_UNDER_VOICE_DB = 8;
const DUCK_TARGET_DB = 10;
const DUCK_RATIO = 20;
const DUCK_ATTACK_MS = 20;
const DUCK_RELEASE_MS = 400;
const DUCK_TOLERANCE_DB = 1.0;
const FADE_OUT_SECONDS: Record<TutorialCut, number> = { short: 0.4, linkedin: 0.6 };

type LaidRecord = { tutorial: string; cut: string; beatId: string; file: string; durationSeconds: number };

/** The timeline rule of src/tutorial/timeline.ts over the kept beats; end to end if it overruns its cap. */
function layoutRecords(content: TutorialContent, cut: TutorialCut, records: LaidRecord[]): { timeline: TutorialTimeline; overFrames: number } {
  const beats = tutorialBeats(content, cut);
  const log = {
    _note: "",
    api: {},
    voice: null,
    auditions: [],
    mixes: [],
    generations: records.map((r) => ({ ...r })) as unknown as VoiceGeneration[],
  } as unknown as VoiceLog;
  try {
    const timeline = tutorialTimeline(content, cut, log);
    return { timeline, overFrames: Math.max(0, timeline.totalFrames - TUTORIAL_TOTAL_FRAMES[cut]) };
  } catch (err) {
    if (!(err instanceof Error) || !/frames over/.test(err.message)) throw err;
    let cursor = 0;
    const entries = beats.map((beat, i) => {
      const frames = beatFrames(beat, records[i].durationSeconds);
      const kind: TutorialTimeline["entries"][number]["kind"] = i === 0 ? "hook" : i === beats.length - 1 ? "cta" : "beat";
      const entry = { kind, beat, start: cursor, end: cursor + frames, seconds: records[i].durationSeconds, source: "measured" as const, voiceFile: records[i].file, stretchFrames: 0 };
      cursor += frames;
      return entry;
    });
    console.log(`  WARNING: over the cut's frame cap; laid end to end for listening.`);
    return {
      timeline: { id: content.id, cut, totalFrames: cursor, entries, slackFrames: 0, estimated: [] } as TutorialTimeline,
      overFrames: cursor - TUTORIAL_TOTAL_FRAMES[cut],
    };
  }
}

type MixShape = {
  placements: { file: string; delayMs: number }[];
  musicFrom: number;
  seconds: number;
  fadeOut: number;
  bedGainDb: number;
  threshold: number;
};

const bedChain = (s: MixShape) =>
  `[0:a]atrim=${s.musicFrom}:${s.musicFrom + s.seconds},asetpts=N/SR/TB,volume=${s.bedGainDb.toFixed(2)}dB,` +
  `afade=t=out:st=${s.seconds - s.fadeOut}:d=${s.fadeOut},${AFORMAT}[bed]`;

function voiceChain(s: MixShape): string[] {
  const parts: string[] = [];
  const labels: string[] = [];
  s.placements.forEach((p, i) => {
    parts.push(`[${i + 1}:a]adelay=${p.delayMs}:all=1,atrim=0:${s.seconds},${AFORMAT}[v${i}]`);
    labels.push(`[v${i}]`);
  });
  parts.push(
    labels.length > 1
      ? `${labels.join("")}amix=inputs=${labels.length}:duration=longest:normalize=0[voiceraw]`
      : `${labels[0]}anull[voiceraw]`,
  );
  // Padded to the full cut, as the v3 candidate mixes are, so the bed reaches its fade.
  parts.push(`[voiceraw]apad=whole_dur=${s.seconds},${AFORMAT}[voiceall]`);
  return parts;
}

const duck = (key: string, s: MixShape, out: string) =>
  `[bed][${key}]sidechaincompress=threshold=${s.threshold.toFixed(6)}:ratio=${DUCK_RATIO}:` +
  `attack=${DUCK_ATTACK_MS}:release=${DUCK_RELEASE_MS}:makeup=1:level_sc=1[${out}]`;

const buildMixFilter = (s: MixShape, ceilingDb: number) =>
  [
    bedChain(s),
    ...voiceChain(s),
    `[voiceall]asplit=2[voicemix][voicekey]`,
    duck("voicekey", s, "ducked"),
    `[ducked][voicemix]amix=inputs=2:duration=first:normalize=0[premix]`,
    `[premix]${limiter(ceilingDb)}[mixed]`,
  ].join(";");

type Window = { start: number; duration: number };

function meanOfBed(inputs: string[], s: MixShape, ducked: boolean, w: Window): number {
  const slice = `atrim=${w.start.toFixed(3)}:${(w.start + w.duration).toFixed(3)},asetpts=N/SR/TB`;
  const parts = ducked
    ? [bedChain(s), ...voiceChain(s), duck("voiceall", s, "probe"), `[probe]${slice},volumedetect[out]`]
    : [bedChain(s), `[bed]${slice},volumedetect[out]`];
  const { stderr } = ffmpeg([...inputs, "-filter_complex", parts.join(";"), "-map", "[out]", "-f", "null", "-"]);
  return Number(/mean_volume:\s*(-?[\d.]+) dB/.exec(stderr)?.[1] ?? NaN);
}

function solveDuck(inputs: string[], s: MixShape, w: Window) {
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

async function buildMix(content: TutorialContent, cut: TutorialCut, timeline: TutorialTimeline, musicVariant: string, wav: string): Promise<VoiceMixRecord> {
  const seconds = timeline.totalFrames / FPS;
  const music = musicTake(musicVariant as Parameters<typeof musicTake>[0], cut === "short" ? 20 : 50);
  const placements: MixShape["placements"] = [];
  let longest = { startSec: 0, seconds: 0 };
  for (const e of timeline.entries) {
    placements.push({ file: path.join(ROOT, e.voiceFile as string), delayMs: Math.round((e.start / FPS) * 1000) });
    if (e.seconds > longest.seconds) longest = { startSec: e.start / FPS, seconds: e.seconds };
  }
  const window: Window = { start: longest.startSec + 0.4, duration: Math.max(0.5, longest.seconds - 0.8) };
  const inputs = ["-i", music.file, ...placements.flatMap((p) => ["-i", p.file])];
  const bed = measureVolume(music.file, { start: music.from, duration: seconds });
  const voicePeak = Math.max(...placements.map((p) => measureVolume(p.file).max));
  const means = placements.map((p) => measureVolume(p.file).mean);
  const voiceMean = means.reduce((a, b) => a + b, 0) / Math.max(1, means.length);
  const bedGainDb = Number((voicePeak - BED_UNDER_VOICE_DB - bed.max).toFixed(2));
  const firstThresholdDb = voiceMean - DUCK_TARGET_DB / (1 - 1 / DUCK_RATIO);
  const shape: MixShape = {
    placements,
    musicFrom: music.from,
    seconds,
    fadeOut: FADE_OUT_SECONDS[cut],
    bedGainDb,
    threshold: Math.min(0.5, Math.max(0.0005, 10 ** (firstThresholdDb / 20))),
  };
  const solved = solveDuck(inputs, shape, window);
  shape.threshold = solved.threshold;
  console.log(
    `  bed ${rel(music.file)} gain ${bedGainDb} dB; duck threshold ${solved.thresholdDb.toFixed(1)} dBFS, ` +
      `measured ${solved.measuredDuckDb} dB, so about ${(BED_UNDER_VOICE_DB + solved.measuredDuckDb).toFixed(1)} dB under the voice`,
  );
  const makeFilter = (c: number) => buildMixFilter(shape, c);
  const { ceilingDb, measurement: m } = headroomCeilingDb(inputs, makeFilter);
  fs.mkdirSync(path.dirname(wav), { recursive: true });
  const pass2 = ffmpeg([
    ...inputs,
    "-filter_complex",
    `${makeFilter(ceilingDb)};[mixed]loudnorm=${LOUDNORM_TARGET}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:` +
      `measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=false:print_format=json[norm];[norm]${AFORMAT}[out]`,
    "-map", "[out]", "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2", "-y", wav,
  ]);
  if (pass2.code !== 0) throw new Error(`loudnorm pass 2 failed:\n${pass2.stderr.slice(-3000)}`);
  void parseLoudnorm(pass2.stderr);
  const verified = correctLoudness(wav, verifyLoudness(wav));
  if (Math.abs(verified.integrated - TARGET_LUFS) > 0.5) {
    console.log(`  WARNING: integrated loudness is ${verified.integrated} LUFS, more than 0.5 off target.`);
  }
  return {
    tutorial: content.id,
    cut,
    wav: rel(wav),
    musicSource: rel(music.file),
    musicVariant,
    bedGainDb,
    measuredDuckDb: solved.measuredDuckDb,
    limiterCeilingDbfs: ceilingDb,
    measuredIntegratedLufs: verified.integrated,
    measuredTruePeakDbfs: verified.truePeak,
    measuredLra: verified.lra,
    createdAt: new Date().toISOString(),
  };
}

function encodeMp3(input: string, output: string): void {
  const res = ffmpeg(["-i", input, "-c:a", "libmp3lame", "-b:a", "320k", "-ar", "48000", "-ac", "2", "-y", output]);
  if (res.code !== 0) throw new Error(`mp3 encode failed:\n${res.stderr.slice(-3000)}`);
}

async function runBuild(take: string): Promise<void> {
  const config = loadTakesConfig();
  const content = TUTORIALS[config.tutorial];
  const cut = config.cut;
  const log = loadTakesLog();
  const records = tutorialBeats(content, cut).map((beat) => {
    const s = log.selections.find((x) => x.take === take && x.beatId === beat.id);
    if (!s || !fs.existsSync(path.join(ROOT, s.file))) throw new Error(`take ${take} ${beat.id}: run select first.`);
    return { tutorial: content.id, cut, beatId: beat.id, file: s.file, durationSeconds: s.durationSeconds };
  });
  const { timeline, overFrames } = layoutRecords(content, cut, records);
  const seconds = timeline.totalFrames / FPS;

  // Voice only: every beat where the timeline puts it, normalized to -16 LUFS
  // like the earlier stitches, 48 kHz 24 bit.
  const voiceWav = path.join(CANDIDATE_DIR, `contrast-take-${take}-voice.wav`);
  const inputs = timeline.entries.flatMap((e) => ["-i", path.join(ROOT, e.voiceFile as string)]);
  const parts = timeline.entries.map((e, i) => `[${i}:a]adelay=${Math.round((e.start / FPS) * 1000)}:all=1,${AFORMAT}[v${i}]`);
  parts.push(
    `${timeline.entries.map((_, i) => `[v${i}]`).join("")}amix=inputs=${timeline.entries.length}:duration=longest:normalize=0,` +
      `apad=whole_dur=${seconds},atrim=0:${seconds},loudnorm=I=-16:TP=-1.5:LRA=11,${AFORMAT}[out]`,
  );
  const res = ffmpeg([...inputs, "-filter_complex", parts.join(";"), "-map", "[out]", "-c:a", "pcm_s24le", "-ar", "48000", "-ac", "2", "-y", voiceWav]);
  if (res.code !== 0) throw new Error(`stitch failed:\n${res.stderr.slice(-3000)}`);
  const voiceLoud = verifyLoudness(voiceWav);
  console.log(`\n[build take ${take}] ${timeline.totalFrames} frames (${seconds.toFixed(2)}s), ${overFrames} over 450`);
  for (const e of timeline.entries) {
    console.log(`  ${e.beat.id.padEnd(6)} frame ${String(e.start).padStart(3)}  ${e.seconds.toFixed(2)}s${e.stretchFrames ? `  +${e.stretchFrames} stretch` : ""}`);
  }
  console.log(`  voice ${rel(voiceWav)}: I ${voiceLoud.integrated} LUFS, TP ${voiceLoud.truePeak} dBTP`);

  const mixWav = path.join(CANDIDATE_DIR, `contrast-take-${take}-mix.wav`);
  const mixMp3 = path.join(CANDIDATE_DIR, `contrast-take-${take}-mix.mp3`);
  const record = await buildMix(content, cut, timeline, config.musicVariant, mixWav);
  encodeMp3(mixWav, mixMp3);
  const mp3Loud = verifyLoudness(mixMp3);
  console.log(`  mix ${rel(mixWav)}: I ${record.measuredIntegratedLufs} LUFS, TP ${record.measuredTruePeakDbfs} dBTP`);
  console.log(`  mp3 ${rel(mixMp3)} (320 kbps): I ${mp3Loud.integrated} LUFS, TP ${mp3Loud.truePeak} dBTP`);

  const onDisk = loadTakesLog();
  onDisk.stitches = [
    ...(onDisk.stitches as { take: string }[]).filter((s) => s.take !== take),
    {
      take,
      file: rel(voiceWav),
      totalFrames: timeline.totalFrames,
      seconds: Number(seconds.toFixed(3)),
      overFrames,
      beats: timeline.entries.map((e) => ({ beatId: e.beat.id, startFrame: e.start, seconds: e.seconds, file: e.voiceFile })),
      measuredIntegratedLufs: voiceLoud.integrated,
      measuredTruePeakDbfs: voiceLoud.truePeak,
      createdAt: new Date().toISOString(),
    },
  ];
  onDisk.mixes = [
    ...(onDisk.mixes as { take: string }[]).filter((m) => m.take !== take),
    { take, ...record, mp3: rel(mixMp3), mp3IntegratedLufs: mp3Loud.integrated, mp3TruePeakDbfs: mp3Loud.truePeak },
  ];
  saveTakesLog(onDisk);
}

/** Credits per take and in total, from the log. */
function runReport(): void {
  const log = loadTakesLog();
  const rows: Record<string, { gens: number; tts: number; stt: number; adopted: number }> = {};
  for (const g of log.generations) {
    const k = g.kind === "audition" ? `audition (${g.voiceName})` : `${g.kind} ${g.take}`;
    rows[k] ??= { gens: 0, tts: 0, stt: 0, adopted: 0 };
    rows[k].gens += 1;
    rows[k].tts += genCredits(g);
    rows[k].stt += g.stt?.creditsMeasured ?? 0;
    if (g.adopted) rows[k].adopted += 1;
  }
  for (const v of log.verifications) {
    const k = `verify ${v.take}`;
    rows[k] ??= { gens: 0, tts: 0, stt: 0, adopted: 0 };
    rows[k].stt += v.creditsMeasured ?? 0;
  }
  for (const [k, r] of Object.entries(rows)) console.log(`${k.padEnd(28)} ${String(r.gens).padStart(3)} gens  tts ${r.tts}  stt ${r.stt}${r.adopted ? `  adopted ${r.adopted}` : ""}`);
  console.log(`total ${takesSpent(log)}`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];
  const take = flag(argv, "take") ?? "";
  if (command === "api") return runApiCheck();
  if (command === "take") return runTake(take, argv.includes("--dry-run"), flag(argv, "beat"));
  if (command === "audition") return runAudition(argv.includes("--dry-run"));
  if (command === "rank") return runRank();
  if (command === "select") return runSelect(take);
  if (command === "verify") return runVerify(take);
  if (command === "build") return runBuild(take);
  if (command === "report") return runReport();
  throw new Error("Usage: voice-takes.ts api | take --take a|b|c | audition | rank | select --take x | verify --take x | build --take x | report");
}

main().catch((err: unknown) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
