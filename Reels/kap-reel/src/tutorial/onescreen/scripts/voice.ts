/**
 * Narration and mix for the "One screen, one decision" tutorial reel.
 *
 *   node node_modules/tsx/dist/cli.mjs src/tutorial/onescreen/scripts/voice.ts generate [--dry-run] [--beat <id>]
 *   node node_modules/tsx/dist/cli.mjs src/tutorial/onescreen/scripts/voice.ts select [--fastest]
 *   node node_modules/tsx/dist/cli.mjs src/tutorial/onescreen/scripts/voice.ts mix
 *   node node_modules/tsx/dist/cli.mjs src/tutorial/onescreen/scripts/voice.ts report
 *
 * Its own script rather than a --reel on scripts/voice.ts, because that file is
 * shared and being worked on by other agents; everything below that decides how
 * a line is billed, measured, finished and mixed follows it on purpose, and the
 * API, credit and loudness helpers are imported from scripts/audio.ts rather
 * than copied, exactly as scripts/voice.ts does.
 *
 * generate  Reads config/onescreen-v3-script.json, checks every tagged line
 *           against the narration in src/tutorial/onescreen/content.ts (tags
 *           stripped, word for word, no em dash, "K and A" not "K&A"), then
 *           asks eleven_v3 for `generationsPerBeat` seeded reads of every beat.
 *           Sarah (EXAVITQu4vr4xnSDxMaL), stability natural (0.5), the highest
 *           output format the plan returns: wav_48000 first, wav_44100 if that
 *           is refused. Each read is transcribed with scribe_v2 (word
 *           timestamps) so a dropped word, a spoken tag or an audio event is
 *           caught before anything is kept. Every call is logged in
 *           config/voice.json under "onescreen", with the credits measured as
 *           a before and after delta on the usage endpoint and, where the API
 *           sends it, the character-cost header of the response.
 * select    Scores every read of every beat the way the contrast takes are
 *           scored, keeps the best acceptable read per beat that lets the cut
 *           lay out inside ONESCREEN_MAX_FRAMES (src/tutorial/onescreen/layout.ts), finishes it (5 ms fade in, 30 ms fade
 *           out, 60 ms of air) into assets/audio/voice/onescreen-v3/natural/,
 *           and records the kept read, its word timings and why.
 * mix       The kept reads placed by the tutorial timeline, over
 *           out/candidates/music-i-c.mp3, ducked the way scripts/voice.ts
 *           --mix ducks (bed 8 dB under the voice peak, a sidechain solved to
 *           10 dB of measured reduction inside the longest line), limited and
 *           loudness normalized through scripts/audio.ts, to
 *           assets/audio/mix-tut-onescreen-15s-v3.wav.
 * report    Prints the spend.
 *
 * The API key is read by scripts/audio.ts from .env or ELEVENLABS_API_KEY,
 * never printed and never written anywhere.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AFORMAT,
  LOUDNORM_TARGET,
  TARGET_LUFS,
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
} from "../../../../scripts/audio.js";
import { FPS, beatFrames, tutorialBeats } from "../../timeline.js";
import { ONESCREEN_MAX_FRAMES, onescreenTimeline } from "../layout.js";
import type { TutorialCut } from "../../types.js";
import { ONESCREEN_MUSIC, ONESCREEN_TUTORIAL } from "../content.js";
import { onescreenVoiceLog, ONESCREEN_KEPT_DIR, type OnescreenSection, type OnescreenSelection, type OnescreenTake } from "../voice-log.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const VOICE_JSON = path.join(ROOT, "config", "voice.json");
const SCRIPT_JSON = path.join(ROOT, "config", "onescreen-v3-script.json");
const TAKES_DIR = path.join(ROOT, "assets", "audio", "voice", "onescreen-v3", "natural", "takes");
const MIX_WAV = path.join(ROOT, "assets", "audio", "mix-tut-onescreen-15s-v3.wav");
const API_BASE = "https://api.elevenlabs.io";
const MODEL = "eleven_v3";
const STT_MODEL = "scribe_v2";
const CUT: TutorialCut = "short";
/** Natural, per the v3 prompting guide's three modes; the same 0.5 scripts/voice.ts sends. */
const STABILITY = 0.5;
/** Highest first. 44.1 kHz PCM and WAV need Pro; 48 kHz is tried first and falls back. */
const FORMATS = ["wav_48000", "wav_44100"];
/** Stops the run before it spends more than this, measured. */
const RUN_CREDIT_CAP = 6000;

const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join("/");

type Script = {
  tutorial: string;
  cut: string;
  model: string;
  voiceId: string;
  voiceName: string;
  mode: string;
  generationsPerBeat: number;
  seedBase: number;
  beats: { id: string; narration: string; why: string }[];
};

// ---------------------------------------------------------------------------
// config/voice.json, the "onescreen" key only
// ---------------------------------------------------------------------------

const EMPTY: OnescreenSection = {
  _note:
    "The one screen, one decision tutorial (Wednesday 2026-09-30 reel), vertical short cut, " +
    "eleven_v3, Sarah, natural. takes is every billable text to speech call with the exact text sent " +
    "(tags included), the seed, the output format, the measured duration, the credits measured as a " +
    "before and after delta on /v1/usage/character-stats and the character-cost header where the API " +
    "sent one, plus the scribe_v2 transcription check of that file and what it cost. selections is the " +
    "read kept per beat, finished, with its word timings, which is what src/tutorial/onescreen lays " +
    "the reel out from. mixes is the shipped mix. Written by src/tutorial/onescreen/scripts/voice.ts; " +
    "nothing else in this file is touched by it.",
  voice: {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    model: MODEL,
    mode: "natural",
    stability: STABILITY,
    outputFormat: FORMATS[0],
  },
  takes: [],
  selections: [],
  mixes: [],
};

/** Reads the whole file, hands back this key, and writes only this key back. */
function withSection<T>(fn: (s: OnescreenSection) => T): T {
  const raw = JSON.parse(fs.readFileSync(VOICE_JSON, "utf8")) as Record<string, unknown>;
  const section = { ...structuredClone(EMPTY), ...((raw.onescreen as OnescreenSection | undefined) ?? {}) };
  const out = fn(section);
  // Re-read immediately before writing so a concurrent writer's other keys survive.
  const fresh = JSON.parse(fs.readFileSync(VOICE_JSON, "utf8")) as Record<string, unknown>;
  fresh.onescreen = section;
  fs.writeFileSync(VOICE_JSON, `${JSON.stringify(fresh, null, 2)}\n`);
  return out;
}

function readSection(): OnescreenSection {
  const raw = JSON.parse(fs.readFileSync(VOICE_JSON, "utf8")) as Record<string, unknown>;
  return { ...structuredClone(EMPTY), ...((raw.onescreen as OnescreenSection | undefined) ?? {}) };
}

function spent(s: OnescreenSection): number {
  return s.takes.reduce((a, t) => a + (t.creditsMeasured ?? 0) + (t.stt?.creditsMeasured ?? 0), 0);
}

// ---------------------------------------------------------------------------
// Script checks
// ---------------------------------------------------------------------------

export function stripAudioTags(text: string): string {
  return text.replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
}
const tagsIn = (text: string): string[] => [...text.matchAll(/\[([^\]]*)\]/g)].map((m) => m[1]);

function loadScript(): Script {
  const script = JSON.parse(fs.readFileSync(SCRIPT_JSON, "utf8")) as Script;
  const beats = tutorialBeats(ONESCREEN_TUTORIAL, CUT);
  const ids = beats.map((b) => b.id).join(", ");
  const scriptIds = script.beats.map((b) => b.id).join(", ");
  if (ids !== scriptIds) throw new Error(`${rel(SCRIPT_JSON)} has beats [${scriptIds}], the cut has [${ids}].`);
  beats.forEach((beat, i) => {
    const text = script.beats[i].narration;
    const plain = stripAudioTags(text);
    if (plain !== beat.narration) {
      throw new Error(`beat ${beat.id}: stripped script reads\n  "${plain}"\nbut content.ts says\n  "${beat.narration}"\nNothing was sent.`);
    }
    if (text.includes(String.fromCharCode(0x2014))) throw new Error(`beat ${beat.id} contains an em dash.`);
    if (/K&A/.test(text)) throw new Error(`beat ${beat.id}: write "K and A" for the voice model.`);
  });
  return script;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

async function speak(
  key: string,
  voiceId: string,
  text: string,
  seed: number,
  format: string,
): Promise<{ bytes: Buffer; characterCost: number | null; requestId: string | null } | { refused: string }> {
  const res = await fetchRetry(`${API_BASE}/v1/text-to-speech/${voiceId}?output_format=${format}`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: { stability: STABILITY }, seed }),
  });
  if (!res.ok) {
    const body = redact(await res.text(), key);
    if ((res.status === 400 || res.status === 403 || res.status === 422) && /format|tier|subscription|plan/i.test(body)) {
      return { refused: `${res.status}: ${body.slice(0, 300)}` };
    }
    throw new Error(`POST /v1/text-to-speech/${voiceId} returned ${res.status}: ${body}`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 2000) throw new Error(`only ${bytes.length} bytes came back`);
  const cost = res.headers.get("character-cost") ?? res.headers.get("x-character-count");
  return { bytes, characterCost: cost === null ? null : Number(cost), requestId: res.headers.get("request-id") };
}

type SttWord = { text: string; start: number; end: number; type: string; logprob?: number };

async function transcribe(key: string, file: string): Promise<{ json: unknown; credits: number | null }> {
  const form = new FormData();
  form.append("model_id", STT_MODEL);
  form.append("timestamps_granularity", "word");
  form.append("tag_audio_events", "true");
  form.append("language_code", "en");
  form.append("file", new Blob([fs.readFileSync(file)]), path.basename(file));
  const before = await usageSnapshot(key);
  const res = await fetchRetry(`${API_BASE}/v1/speech-to-text`, { method: "POST", headers: { "xi-api-key": key }, body: form });
  const body = await res.text();
  if (!res.ok) throw new Error(`POST /v1/speech-to-text returned ${res.status}: ${redact(body, key)}`);
  const credits = await creditsSince(key, before);
  return { json: JSON.parse(body), credits: credits.credits };
}

// ---------------------------------------------------------------------------
// Measurement, the same yardsticks the contrast takes are ranked on
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
const median = (xs: number[]) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

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

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
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

/**
 * The transcriber writes the spoken url its own way ("ka-performancefl.com",
 * "KA Performance FL", "K and A"), so both sides are compared with the url's
 * letters run together. Anything else it hears differently is a word error.
 */
function comparable(words: string[]): string {
  // "K and A" comes back as "kanda", "kna" or "ka" depending on how fast it
  // was said; all of them are the brand, so all of them compare equal.
  return words
    .join(" ")
    .replace(/\s+/g, "")
    .replace(/dot/g, "")
    .replace(/slash/g, "")
    .replace(/k(and|an|n)?aperformance/g, "kaperformance");
}

export type Analysis = OnescreenTake["analysis"];

function analyse(file: string, plainText: string, tagged: string, stt: unknown): NonNullable<Analysis> {
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
  const vol = measureVolume(file);

  const all = ((stt as { words?: SttWord[] }).words ?? []);
  const words = all.filter((w) => w.type === "word");
  const events = all.filter((w) => w.type === "audio_event").map((w) => w.text);
  const transcript = (stt as { text?: string }).text ?? "";
  const heard = normalWords(words.map((w) => w.text).join(" "));
  const expected = normalWords(plainText);
  const wordErrors = comparable(heard) === comparable(expected) ? 0 : editDistance(heard, expected);
  const tagWords = new Set(normalWords(tagsIn(tagged).join(" ")).filter((w) => !expected.includes(w)));
  const spokenTag = heard.some((w) => tagWords.has(w));
  const gaps = gapsRaw.map((g) => {
    let after: string | null = null;
    for (const w of words) if (w.end <= g.at + 0.08) after = w.text;
    return { ...g, after };
  });
  const boundary = (w: string | null) => w !== null && /[.,!?;:]$/.test(w);
  const maxGapInPhrase = Math.max(0, ...gaps.filter((g) => !boundary(g.after)).map((g) => g.seconds));
  const maxGapAtBoundary = Math.max(0, ...gaps.filter((g) => boundary(g.after)).map((g) => g.seconds));
  const shortWords = words.filter((w) => w.text.replace(/[^a-z]/gi, "").length >= 3 && w.end - w.start < 0.08).map((w) => w.text);
  const logprobs = words.map((w) => w.logprob).filter((p): p is number => typeof p === "number");
  const lead = Math.max(0, first) * 0.01;
  const trail = Math.max(0, durationSeconds - (last + 1) * 0.01);
  return {
    durationSeconds: Number(probeDuration(file).toFixed(3)),
    leadSeconds: Number(lead.toFixed(2)),
    trailSeconds: Number(trail.toFixed(2)),
    maxGapInPhrase: Number(maxGapInPhrase.toFixed(2)),
    maxGapAtBoundary: Number(maxGapAtBoundary.toFixed(2)),
    startEdgeDb: Number((frames[0] - peakFrame).toFixed(1)),
    endEdgeDb: Number((Math.max(frames[frames.length - 1], frames[frames.length - 2] ?? -120) - peakFrame).toFixed(1)),
    peakDbfs: vol.max,
    speechDb: Number(speechDb.toFixed(2)),
    medianF0: Number(mf0.toFixed(1)),
    pitchSpreadSt: Number(spread.toFixed(2)),
    transcript,
    words: words.map((w) => ({ text: w.text, start: w.start, end: w.end })),
    wordErrors,
    audioEvents: events,
    spokenTag,
    shortWords,
    minLogprob: logprobs.length ? Number(Math.min(...logprobs).toFixed(3)) : 0,
    wordsPerSecond: Number((expected.length / Math.max(0.1, durationSeconds - lead - trail)).toFixed(2)),
  };
}

/**
 * A read's file name. The first pass named reads <beat>-s<seed>.wav; a line
 * whose words have changed since gets a hash of its tagged text in the name,
 * so a new read never overwrites a paid for one of different words.
 */
const FIRST_PASS: Record<string, string> = {
  hook: "[warm, a little playful] If a screen asks the learner to do two things, it does neither.",
  decide: "[warm] We build one decision per screen. The learner acts, gets feedback, moves on.",
  trick: "[confident] Fewer clicks. More learning. That is the whole trick.",
};
function takeName(beatId: string, text: string, seed: number): string {
  if (FIRST_PASS[beatId] === text) return `${beatId}-s${seed}.wav`;
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return `${beatId}-${h.toString(16).padStart(8, "0")}-s${seed}.wav`;
}

// ---------------------------------------------------------------------------
// generate
// ---------------------------------------------------------------------------

async function generate(dryRun: boolean, onlyBeat?: string): Promise<void> {
  const script = loadScript();
  const jobs: { beatId: string; text: string; plain: string; seed: number; file: string }[] = [];
  for (const b of script.beats) {
    if (onlyBeat && b.id !== onlyBeat) continue;
    for (let i = 0; i < script.generationsPerBeat; i += 1) {
      const seed = script.seedBase + i;
      jobs.push({ beatId: b.id, text: b.narration, plain: stripAudioTags(b.narration), seed, file: path.join(TAKES_DIR, takeName(b.id, b.narration, seed)) });
    }
  }
  const section = readSection();
  const todo = jobs.filter((j) => !section.takes.some((t) => t.beatId === j.beatId && t.seed === j.seed && t.text === j.text && fs.existsSync(path.join(ROOT, t.file))));
  const chars = todo.reduce((a, j) => a + j.text.length, 0);
  console.log(`${jobs.length} reads in the plan, ${todo.length} to generate, ${chars} characters (1 credit each), plus a transcription per read.`);
  for (const j of todo) console.log(`  ${j.beatId} seed ${j.seed}: ${j.text}`);
  if (dryRun || todo.length === 0) return;

  const key = readApiKey();
  let format = readSection().voice.outputFormat;
  for (const j of todo) {
    if (spent(readSection()) + j.text.length > RUN_CREDIT_CAP) {
      throw new Error(`STOP: ${spent(readSection())} credits measured, the next read would pass the ${RUN_CREDIT_CAP} cap.`);
    }
    console.log(`\n[${j.beatId} seed ${j.seed}] ${format}`);
    const before = await usageSnapshot(key);
    let result = await speak(key, script.voiceId, j.text, j.seed, format);
    while ("refused" in result) {
      const next = FORMATS[FORMATS.indexOf(format) + 1];
      if (!next) throw new Error(`every output format refused: ${result.refused}`);
      console.log(`  ${format} refused (${result.refused}); trying ${next}`);
      format = next;
      withSection((s) => { s.voice.outputFormat = format; });
      result = await speak(key, script.voiceId, j.text, j.seed, format);
    }
    if (result.bytes.subarray(0, 4).toString("latin1") !== "RIFF") throw new Error(`asked for ${format} and did not get a wav back.`);
    fs.mkdirSync(path.dirname(j.file), { recursive: true });
    fs.writeFileSync(j.file, result.bytes);
    const credits = await creditsSince(key, before);
    const durationSeconds = Number(probeDuration(j.file).toFixed(3));
    console.log(`  wrote ${rel(j.file)} (${durationSeconds.toFixed(2)}s), ${credits.credits ?? "?"} credits measured, header ${result.characterCost ?? "none"}`);

    const sttFile = `${j.file}.stt.json`;
    const stt = await transcribe(key, j.file);
    fs.writeFileSync(sttFile, JSON.stringify(stt.json, null, 2));
    const analysis = analyse(j.file, j.plain, j.text, stt.json);
    console.log(`  stt ${stt.credits ?? "?"} credits: "${analysis.transcript}"${analysis.wordErrors ? `  WORD ERRORS ${analysis.wordErrors}` : ""}${analysis.spokenTag ? "  SPOKEN TAG" : ""}${analysis.audioEvents.length ? `  EVENTS ${analysis.audioEvents.join(" ")}` : ""}`);

    const take: OnescreenTake = {
      beatId: j.beatId,
      seed: j.seed,
      file: rel(j.file),
      text: j.text,
      plainText: j.plain,
      tags: tagsIn(j.text),
      characters: j.text.length,
      voiceId: script.voiceId,
      voiceName: script.voiceName,
      model: MODEL,
      mode: "natural",
      settings: { stability: STABILITY },
      outputFormat: format,
      durationSeconds,
      creditsMeasured: credits.credits,
      creditsBucket: credits.bucket,
      characterCostHeader: result.characterCost,
      requestId: result.requestId,
      createdAt: new Date().toISOString(),
      stt: { file: rel(sttFile), model: STT_MODEL, creditsMeasured: stt.credits },
      analysis,
    };
    withSection((s) => {
      s.takes = s.takes.filter((t) => t.file !== take.file);
      s.takes.push(take);
    });
  }
  console.log(`\n${spent(readSection())} credits measured on this reel so far.`);
}

// ---------------------------------------------------------------------------
// select
// ---------------------------------------------------------------------------

function score(t: OnescreenTake, ctx: { speech: number; duration: number; spread: number }): { score: number; rejected: string[]; notes: string[] } {
  const a = t.analysis;
  if (!a) return { score: Infinity, rejected: ["not measured"], notes: [] };
  const rejected: string[] = [];
  if (a.wordErrors > 0) rejected.push(`${a.wordErrors} word error(s): "${a.transcript}"`);
  if (a.spokenTag) rejected.push("a tag was spoken");
  if (a.audioEvents.length) rejected.push(`audio events ${a.audioEvents.join(" ")}`);
  if (a.startEdgeDb > -20) rejected.push(`starts inside a sound (${a.startEdgeDb} dB)`);
  if (a.endEdgeDb > -10) rejected.push(`stops inside the last word (${a.endEdgeDb} dB)`);
  // eleven_v3 hands back every wav peak normalized to within a hair of full
  // scale, so a 0 dBFS peak is the format, not a fault. What would be a fault
  // is a run of samples held at full scale, which is what astats calls the
  // flat factor: anything above zero is a clipped waveform.
  const flat = flatFactor(path.join(ROOT, t.file));
  if (flat > 0) rejected.push(`clipped (flat factor ${flat}, peak ${a.peakDbfs} dBFS)`);
  const notes: string[] = [];
  let s = 0;
  const add = (amount: number, note: string) => {
    if (amount <= 0.001) return;
    s += amount;
    notes.push(`${note} +${amount.toFixed(2)}`);
  };
  add((a.leadSeconds - 0.15) * 4, `lead ${a.leadSeconds}s`);
  add((a.trailSeconds - 0.3) * 2, `tail ${a.trailSeconds}s`);
  add((a.maxGapInPhrase - 0.25) * 12, `pause in phrase ${a.maxGapInPhrase}s`);
  add((a.maxGapAtBoundary - 0.55) * 6, `pause at break ${a.maxGapAtBoundary}s`);
  add(a.shortWords.length * 1.5, `short words ${a.shortWords.join(" ")}`);
  add(Math.max(0, -1.0 - a.minLogprob) * 1.5, `transcriber confidence ${a.minLogprob}`);
  add((a.endEdgeDb + 40) * 0.04, `last sound cut at ${a.endEdgeDb} dB`);
  add((a.startEdgeDb + 45) * 0.03, `first sound starts at ${a.startEdgeDb} dB`);
  add(Math.abs(a.speechDb - ctx.speech) * 0.35, `level ${(a.speechDb - ctx.speech).toFixed(1)} dB off the beat`);
  add((Math.abs(a.durationSeconds - ctx.duration) / ctx.duration) * 4, `length ${a.durationSeconds}s against ${ctx.duration.toFixed(2)}s`);
  const ratio = a.pitchSpreadSt / ctx.spread;
  add(ratio > 1.4 ? (ratio - 1.4) * 3 : ratio < 0.65 ? (0.65 - ratio) * 3 : 0, `pitch spread ${a.pitchSpreadSt} st`);
  return { score: Number(s.toFixed(3)), rejected, notes };
}

function flatFactor(file: string): number {
  const { stderr } = ffmpeg(["-i", file, "-af", "astats=measure_overall=Flat_factor:measure_perchannel=none", "-f", "null", "-"]);
  return Number(/Flat factor:s*(-?[d.]+)/.exec(stderr)?.[1] ?? NaN);
}

/** 5 ms in, 30 ms out to the last sample, 60 ms of air after it. The contrast takes' finish. */
function finish(source: string, out: string): number {
  const seconds = probeDuration(source);
  const res = ffmpeg([
    "-i", source,
    "-af", `afade=t=in:st=0:d=0.005,afade=t=out:st=${(seconds - 0.03).toFixed(4)}:d=0.03,apad=pad_dur=0.06`,
    "-c:a", "pcm_s24le", "-y", out,
  ]);
  if (res.code !== 0) throw new Error(`finishing ${rel(source)} failed:\n${res.stderr.slice(-2000)}`);
  return Number(probeDuration(out).toFixed(3));
}

/**
 * Clean enough to ship in --fastest mode: accepted, and no pause longer than
 * this inside a phrase. A faster read that gets its speed by hesitating
 * mid-phrase is not clean; on 2026-09-24 that keeps out decide seed 300929,
 * whose 0.34s pause lands inside "The learner".
 */
const FASTEST_MAX_PHRASE_GAP = 0.3;

function select(fastest = false): void {
  const section = readSection();
  const beats = tutorialBeats(ONESCREEN_TUTORIAL, CUT);
  // Only reads of the line as it is scripted now. A beat whose words changed
  // keeps its earlier reads in the log (they were paid for) but never competes.
  const scripted = Object.fromEntries(loadScript().beats.map((b) => [b.id, b.narration]));
  type Ranked = { take: OnescreenTake; score: number; rejected: string[]; notes: string[] };
  const ranked: Record<string, Ranked[]> = {};
  for (const beat of beats) {
    const takes = section.takes.filter((t) => t.beatId === beat.id && t.text === scripted[beat.id] && t.analysis && fs.existsSync(path.join(ROOT, t.file)));
    if (takes.length === 0) throw new Error(`no reads for ${beat.id}. Run generate first.`);
    const ctx = {
      speech: median(takes.map((t) => t.analysis!.speechDb)),
      duration: median(takes.map((t) => t.analysis!.durationSeconds)),
      spread: median(takes.map((t) => t.analysis!.pitchSpreadSt)),
    };
    ranked[beat.id] = takes.map((t) => ({ take: t, ...score(t, ctx) })).sort((a, b) => a.score - b.score);
    console.log(`\n${beat.id}`);
    for (const r of ranked[beat.id]) {
      console.log(`  seed ${r.take.seed}  ${r.take.durationSeconds.toFixed(2)}s  score ${r.score}${r.rejected.length ? `  REJECTED: ${r.rejected.join("; ")}` : ""}`);
      if (r.notes.length) console.log(`    ${r.notes.join("; ")}`);
    }
  }

  // The best acceptable read per beat whose combination lays out inside the
  // cut's cap. Exhaustive: four or five reads of five beats is at most 3125.
  const cap = ONESCREEN_MAX_FRAMES;
  const options = beats.map((b) => ranked[b.id].filter((r) => r.rejected.length === 0 && (!fastest || r.take.analysis!.maxGapInPhrase <= FASTEST_MAX_PHRASE_GAP)));
  const empty = beats.filter((_, i) => options[i].length === 0).map((b) => b.id);
  if (empty.length) throw new Error(`no acceptable read for ${empty.join(", ")}. Generate more.`);
  // The finish adds 60 ms of air to every kept read.
  const framesOf = (i: number, r: Ranked) => beatFrames(beats[i], r.take.durationSeconds + 0.06);
  let best: { pick: Ranked[]; total: number; frames: number } | null = null;
  const walk = (i: number, pick: Ranked[]) => {
    if (i === beats.length) {
      const frames = pick.reduce((a, r, k) => a + framesOf(k, r), 0);
      if (frames > cap) return;
      // Default: the lowest total score that fits. --fastest (Alex, 2026-09-24):
      // the shortest cut from clean reads, score as the tie break.
      const total = pick.reduce((a, r) => a + r.score, 0) + (fastest ? frames * 1000 : 0);
      if (!best || total < best.total) best = { pick: [...pick], total, frames };
      return;
    }
    for (const r of options[i]) walk(i + 1, [...pick, r]);
  };
  walk(0, []);
  if (!best) {
    const fastest = options.map((o, i) => Math.min(...o.map((r) => framesOf(i, r)))).reduce((a, b) => a + b, 0);
    throw new Error(`no combination of acceptable reads lays out inside ${cap} frames; the fastest is ${fastest}.`);
  }
  const chosen = best as { pick: Ranked[]; total: number; frames: number };
  console.log(`\nkept combination lays out to ${Math.max(450, chosen.frames)} frames (${chosen.frames} laid out, cap ${cap}).`);

  const keptDir = path.join(ROOT, ONESCREEN_KEPT_DIR);
  fs.mkdirSync(keptDir, { recursive: true });
  const selections: OnescreenSelection[] = chosen.pick.map((r, i) => {
    const beat = beats[i];
    const out = path.join(keptDir, `${beat.id}.wav`);
    const durationSeconds = finish(path.join(ROOT, r.take.file), out);
    const top = ranked[beat.id][0];
    const why =
      (top.take === r.take ? "Best score of the beat. " : `Kept over seed ${top.take.seed} (score ${top.score}) ${fastest ? "as the shortest clean read (--fastest)" : `so the cut fits ${cap} frames`}. `) +
      `Transcript exact, no spoken tag or audio event, lead ${r.take.analysis!.leadSeconds}s, largest pause ` +
      `${Math.max(r.take.analysis!.maxGapInPhrase, r.take.analysis!.maxGapAtBoundary)}s, pitch spread ` +
      `${r.take.analysis!.pitchSpreadSt} st, score ${r.score}${r.notes.length ? ` (${r.notes.join("; ")})` : ""}.`;
    console.log(`  kept ${beat.id} seed ${r.take.seed} -> ${rel(out)} (${durationSeconds}s)`);
    return {
      beatId: beat.id,
      keptSeed: r.take.seed,
      sourceFile: r.take.file,
      file: rel(out),
      durationSeconds,
      words: r.take.analysis!.words,
      why,
      ranking: ranked[beat.id].map((x) => ({ seed: x.take.seed, durationSeconds: x.take.durationSeconds, score: x.score, rejected: x.rejected })),
      createdAt: new Date().toISOString(),
    };
  });
  withSection((s) => {
    s.selections = selections;
  });
}

// ---------------------------------------------------------------------------
// mix: scripts/voice.ts's buildMix, over music-i-c
// ---------------------------------------------------------------------------

const BED_UNDER_VOICE_DB = 8;
const DUCK_TARGET_DB = 10;
const DUCK_RATIO = 20;
const DUCK_ATTACK_MS = 20;
const DUCK_RELEASE_MS = 400;
const FADE_OUT_SECONDS = 0.4;
const DUCK_TOLERANCE_DB = 1.0;

type Shape = { placements: { file: string; delayMs: number }[]; seconds: number; fadeOut: number; bedGainDb: number; threshold: number };

const bedChain = (s: Shape) =>
  `[0:a]atrim=0:${s.seconds},asetpts=N/SR/TB,volume=${s.bedGainDb.toFixed(2)}dB,` +
  `afade=t=out:st=${s.seconds - s.fadeOut}:d=${s.fadeOut},${AFORMAT}[bed]`;

function voiceChain(s: Shape): string[] {
  const parts: string[] = [];
  const labels: string[] = [];
  s.placements.forEach((p, i) => {
    parts.push(`[${i + 1}:a]adelay=${p.delayMs}:all=1,atrim=0:${s.seconds},${AFORMAT}[v${i}]`);
    labels.push(`[v${i}]`);
  });
  parts.push(`${labels.join("")}amix=inputs=${labels.length}:duration=longest:normalize=0[voiceraw]`);
  // Padded to the whole cut so the sidechain runs to the end and the bed reaches its fade.
  parts.push(`[voiceraw]apad=whole_dur=${s.seconds},${AFORMAT}[voiceall]`);
  return parts;
}

const duck = (keyLabel: string, s: Shape, out: string) =>
  `[bed][${keyLabel}]sidechaincompress=threshold=${s.threshold.toFixed(6)}:ratio=${DUCK_RATIO}:` +
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

/**
 * music-i-c is a 20 second take and the reel runs longer, so the bed is the take
 * played through to a bar line and then continued from the same place in the
 * phrase near its start. 17.256s is where the take best repeats its own first
 * eight bars: the onset envelope of 0.5 to 2.5s correlates with the same span
 * 17.256s later at 0.38, the highest of any offset from 17.0 to 17.8s (about
 * eight bars at the take's 110 bpm). The splice is a 0.3s equal power
 * crossfade at 2s after that offset, under the voice, ducked. Nothing is
 * generated; it is the same take, extended.
 */
const BED_LOOP_OFFSET = 17.256;
const BED_LOOP_FROM = 2.0;
const BED_XFADE = 0.3;

function extendBed(seconds: number): string {
  const src = path.join(ROOT, ONESCREEN_MUSIC);
  const take = probeDuration(src);
  if (take >= seconds + 0.1) return src;
  const out = path.join(ROOT, "assets", "audio", "music-i-c-onescreen-bed.wav");
  const jump = BED_LOOP_OFFSET + BED_LOOP_FROM;
  const half = BED_XFADE / 2;
  const res = ffmpeg([
    "-i", src,
    "-filter_complex",
    `[0:a]atrim=0:${(jump + half).toFixed(3)},asetpts=N/SR/TB[a];` +
      `[0:a]atrim=start=${(BED_LOOP_FROM - half).toFixed(3)},asetpts=N/SR/TB[b];` +
      `[a][b]acrossfade=d=${BED_XFADE}:c1=qsin:c2=qsin[out]`,
    "-map", "[out]", "-c:a", "pcm_s24le", "-ar", "48000", "-y", out,
  ]);
  if (res.code !== 0) throw new Error(`extending the bed failed:
${res.stderr.slice(-2000)}`);
  const length = probeDuration(out);
  if (length < seconds) throw new Error(`the extended bed is ${length}s, the cut is ${seconds}s.`);
  console.log(`  bed extended to ${length.toFixed(2)}s: ${rel(out)}`);
  return out;
}

function mix(): void {
  const log = onescreenVoiceLog(readSection());
  const timeline = onescreenTimeline(log);
  const seconds = timeline.totalFrames / FPS;
  const music = extendBed(seconds);

  const placements: Shape["placements"] = [];
  let longest = { startSec: 0, seconds: 0 };
  for (const e of timeline.entries) {
    if (!e.voiceFile || e.source !== "measured") throw new Error(`no kept read for ${e.beat.id}. Run select first.`);
    placements.push({ file: path.join(ROOT, e.voiceFile), delayMs: Math.round((e.start / FPS) * 1000) });
    if (e.seconds > longest.seconds) longest = { startSec: e.start / FPS, seconds: e.seconds };
  }
  const window = { start: longest.startSec + 0.4, duration: Math.max(0.5, longest.seconds - 0.8) };
  const inputs = ["-i", music, ...placements.flatMap((p) => ["-i", p.file])];
  const bed = measureVolume(music, { start: 0, duration: seconds });
  const voicePeak = Math.max(...placements.map((p) => measureVolume(p.file).max));
  const voiceMeans = placements.map((p) => measureVolume(p.file).mean);
  const voiceMean = voiceMeans.reduce((a, b) => a + b, 0) / voiceMeans.length;
  const bedGainDb = Number((voicePeak - BED_UNDER_VOICE_DB - bed.max).toFixed(2));
  const shape: Shape = {
    placements,
    seconds,
    fadeOut: FADE_OUT_SECONDS,
    bedGainDb,
    threshold: Math.min(0.5, Math.max(0.0005, 10 ** ((voiceMean - DUCK_TARGET_DB / (1 - 1 / DUCK_RATIO)) / 20))),
  };
  console.log(`[mix] onescreen short, ${timeline.totalFrames} frames (${seconds.toFixed(2)}s), bed ${ONESCREEN_MUSIC}`);
  console.log(`  bed peak ${bed.max} dBFS, voice peak ${voicePeak.toFixed(2)}, voice mean ${voiceMean.toFixed(2)}, bed gain ${bedGainDb} dB`);

  let thresholdDb = 20 * Math.log10(shape.threshold);
  let measuredDuckDb = NaN;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    shape.threshold = Math.min(0.5, Math.max(0.0005, 10 ** (thresholdDb / 20)));
    thresholdDb = 20 * Math.log10(shape.threshold);
    measuredDuckDb = Number((meanOfBed(inputs, shape, false, window) - meanOfBed(inputs, shape, true, window)).toFixed(2));
    if (!Number.isFinite(measuredDuckDb) || Math.abs(measuredDuckDb - DUCK_TARGET_DB) <= DUCK_TOLERANCE_DB) break;
    thresholdDb -= (DUCK_TARGET_DB - measuredDuckDb) / (1 - 1 / DUCK_RATIO);
  }
  console.log(`  sidechain threshold ${shape.threshold.toFixed(4)}: ${measuredDuckDb} dB of measured reduction inside the longest line`);

  const { ceilingDb, measurement: m } = headroomCeilingDb(inputs, (c: number) => mixFilter(shape, c));
  const filter = mixFilter(shape, ceilingDb);
  fs.mkdirSync(path.dirname(MIX_WAV), { recursive: true });
  const pass2 = ffmpeg([
    ...inputs,
    "-filter_complex",
    `${filter};[mixed]loudnorm=${LOUDNORM_TARGET}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:` +
      `measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:` +
      `linear=false:print_format=json[norm];[norm]${AFORMAT}[out]`,
    "-map", "[out]", "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2", "-y", MIX_WAV,
  ]);
  if (pass2.code !== 0) throw new Error(`loudnorm pass 2 failed:\n${pass2.stderr.slice(-3000)}`);
  parseLoudnorm(pass2.stderr);
  const verified = correctLoudness(MIX_WAV, verifyLoudness(MIX_WAV));
  if (Math.abs(verified.integrated - TARGET_LUFS) > 0.5) console.log(`  WARNING: ${verified.integrated} LUFS`);
  console.log(`  wrote ${rel(MIX_WAV)}: I ${verified.integrated} LUFS, TP ${verified.truePeak} dBTP, LRA ${verified.lra}`);
  withSection((s) => {
    s.mixes = [
      {
        tutorial: "onescreen",
        cut: CUT,
        wav: rel(MIX_WAV),
        musicSource: `${ONESCREEN_MUSIC} (extended to ${rel(music)}: the take to ${(BED_LOOP_OFFSET + BED_LOOP_FROM).toFixed(3)}s, then from ${BED_LOOP_FROM}s again, 0.3s crossfade)`,
        musicVariant: "i-c",
        bedGainDb,
        measuredDuckDb,
        limiterCeilingDbfs: ceilingDb,
        measuredIntegratedLufs: verified.integrated,
        measuredTruePeakDbfs: verified.truePeak,
        measuredLra: verified.lra,
        totalFrames: timeline.totalFrames,
        createdAt: new Date().toISOString(),
      },
    ];
  });
}

function report(): void {
  const s = readSection();
  const tts = s.takes.reduce((a, t) => a + (t.creditsMeasured ?? 0), 0);
  const header = s.takes.reduce((a, t) => a + (t.characterCostHeader ?? 0), 0);
  const stt = s.takes.reduce((a, t) => a + (t.stt?.creditsMeasured ?? 0), 0);
  const chars = s.takes.reduce((a, t) => a + t.characters, 0);
  console.log(`${s.takes.length} reads, ${chars} characters sent.`);
  console.log(`text to speech: ${tts} credits measured on the usage endpoint, ${header} by the character-cost header.`);
  console.log(`speech to text: ${stt} credits measured.`);
  console.log(`total measured: ${tts + stt}.`);
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  const flag = (n: string) => {
    const i = rest.indexOf(`--${n}`);
    return i === -1 ? undefined : rest[i + 1];
  };
  if (command === "generate") return generate(rest.includes("--dry-run"), flag("beat"));
  if (command === "select") return select(rest.includes("--fastest"));
  if (command === "mix") return mix();
  if (command === "report") return report();
  throw new Error("Use generate [--dry-run] [--beat <id>], select, mix or report.");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
