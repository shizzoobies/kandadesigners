/**
 * scripts/youtube/l1/voice.ts
 *
 * Narration for YouTube L1, "Test your website with one key" (folder
 * 2026-10-02-4, publishes Fri 2026-10-02 11:00 AM). Task A3 in
 * Social Media Management/plans/youtube-2026-09-28/SPEC.md, "Long-form" step 3.
 *
 * One ElevenLabs text to speech file per beat, so an edit never regenerates the
 * whole read. The voice text is read verbatim from the post folder's
 * source/script.md (13 beats); nothing here rewrites a line. Paragraphs inside
 * a beat are sent joined by a single newline, exactly as the script has them.
 *
 * Voice: Amy (OZxMHsGaBmV5pjMIDIn0), eleven_multilingual_v2, stability 0.5,
 * similarity_boost 0.75, style 0, speaker boost on, speed 1, mp3_44100_192.
 * Same endpoint and body as scripts/voice.ts, plus a logged seed per take so a
 * kept take can be asked for again.
 *
 * Owner direction: best quality, do not economize on credits. Any beat whose
 * take is flagged (a transcript that differs from the script, a clipped word,
 * a long pause inside a phrase, clipping, a stray audio event, W-C-A-G not read
 * as four letters) gets up to three takes, and the best is kept.
 *
 * Checks per take, all measured, none by ear:
 *   - speech to text (scribe_v2, word timestamps, audio event tags), compared
 *     word for word with the text sent
 *   - leading and trailing silence, the longest pause inside a phrase and at a
 *     sentence boundary, integrated loudness, peak, full scale sample runs
 *   - level steps inside a beat (gated loudness in 6 second windows) and pace
 *     against the script's median, so a read that drops 5 dB at a paragraph
 *     or races through a line is caught
 *   - for W-C-A-G, how long the four letters take: spelled out it is five or
 *     six syllables and well over a second, read as a word ("wick-ag") it is
 *     about half a second
 *
 * Run from D:\kap-reel (never npx):
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/voice.ts test [--alt | --ref] [--force]
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/voice.ts beat <n|all> [--retake] [--dry-run]
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/voice.ts keep <n> <take>
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/voice.ts report
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/voice.ts recheck   (re-runs the checks, no API calls)
 *
 *   test          the pronunciation lines; --alt the "W, C, A, G" spelling;
 *                 --ref the two W-C-A-G calibration reads
 *   beat all      take 1 of every beat that has no take yet
 *   beat <n> --retake   one more take of beat n (three at most)
 *   keep          override the automatic pick for a beat
 *
 * Output, in public/youtube/l1/audio/:
 *   voice/beat-NN.mp3        the kept take of each beat
 *   voice/takes/             every take, with its transcript (.stt.json)
 *   voice/tests/             the pronunciation tests, with transcripts
 *   voice.json               the manifest: text sent, durations, takes, credits
 *
 * Credits: the text to speech endpoint reports no cost, so each call is
 * measured the way scripts/voice.ts measures it, a before and after delta on
 * /v1/usage/character-stats (usageSnapshot and creditsSince, imported from
 * scripts/audio.ts). Other work on the same account in the same window would
 * land in the delta, so read each figure as an upper bound.
 *
 * The API key is read by scripts/audio.ts from .env or ELEVENLABS_API_KEY and
 * is never printed or written anywhere.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertUnderCreditAlarm,
  creditsSince,
  fetchRetry,
  ffmpeg,
  measureVolume,
  probeDuration,
  readApiKey,
  redact,
  usageSnapshot,
} from "../../audio.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const OUT = path.join(ROOT, "public", "youtube", "l1", "audio");
const VOICE_DIR = path.join(OUT, "voice");
const TAKES_DIR = path.join(VOICE_DIR, "takes");
const TESTS_DIR = path.join(VOICE_DIR, "tests");
const MANIFEST = path.join(OUT, "voice.json");

const SCRIPT_MD =
  "D:/K & A Performance Site/Social Media Management/To Be Released/2026-10-02-4/source/script.md";

const API_BASE = "https://api.elevenlabs.io";
const VOICE = { id: "OZxMHsGaBmV5pjMIDIn0", name: "Amy" };
const MODEL = "eleven_multilingual_v2";
const OUTPUT_FORMAT = "mp3_44100_192";
const SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true,
  speed: 1,
};
const STT_MODEL = "scribe_v2";

/** Three takes a beat at most, and a hard stop on the whole run. */
const TAKE_CAP = 3;
const GENERATION_CAP = 13 * TAKE_CAP + 9;

/**
 * The spelling the beats are sent with. The script writes "W-C-A-G" (Alex,
 * 2026-09-28). If the pronunciation test showed it read as a word, this would
 * become "W, C, A, G", substituted in the text sent and recorded per beat.
 */
const SCRIPT_WCAG = "W-C-A-G";
const WCAG_SPELLING = "W-C-A-G";
const WCAG_NOTE =
  "W-C-A-G, as the script writes it, reads as four letters. Tested 2026-09-28 in the frame \"__ two point two\": " +
  "the transcriber's W-C-A-G token ran 0.62s, against 0.28s for a forced word read (\"wick-ag\", test-08) and " +
  "1.02s for forced letters (\"double-you, see, ay, gee\", test-09), and both W-C-A-G tests came back as WCAG " +
  "with full confidence. \"W, C, A, G\" read slower (1.12s in the same frame) but alone came back as \"WC AJ\" " +
  "with the transcriber unsure, the A and G running together, so it was not used. In the kept beats the token " +
  "runs 0.92s (beat 3) and 0.96s (beat 11).";

/**
 * The shortest the transcriber's W-C-A-G token may run and still count as four
 * letters. Calibrated 2026-09-28 on the tests in the frame "__ two point two":
 * "wick-ag" (forced word read) 0.28s, "W-C-A-G" 0.62s, "double-you, see, ay,
 * gee" (forced letters, with commas) 1.02s. The transcriber's word timestamps
 * run short of the audio, so these sit under the true spoken lengths, which is
 * why the line is drawn between the word read and the letter read, at 0.45s.
 */
const WCAG_MIN_SECONDS = 0.45;

/**
 * Amy's pace on this script: the median characters a second of speech over the
 * thirteen first takes, measured 2026-09-28. A take more than 15 percent off it
 * reads rushed or dragged next to the rest (beat 1 take 1 ran 29 percent fast).
 */
const REFERENCE_PACE = 14.61;

/**
 * The five lines the task names, then the fallback spelling (--alt), then two
 * calibration reads (--ref) in the same frame as "W-C-A-G two point two": one
 * forced to read as a word, one forced to read as letters. The transcriber
 * writes "WCAG" either way and its word timestamps are too coarse to tell, so
 * the test is how long the W-C-A-G part runs before "two" against these two.
 */
const TESTS: { id: string; text: string; set: "main" | "alt" | "ref" }[] = [
  { id: "k-and-a", text: "K and A Performance", set: "main" },
  { id: "ninety-day", text: "the Ninety-Day AI Launch", set: "main" },
  { id: "wcag", text: "W-C-A-G", set: "main" },
  { id: "wcag-22", text: "W-C-A-G two point two", set: "main" },
  { id: "pickup", text: "pickup", set: "main" },
  { id: "wcag-commas", text: "W, C, A, G", set: "alt" },
  { id: "wcag-22-commas", text: "W, C, A, G two point two", set: "alt" },
  { id: "ref-word", text: "wick-ag two point two", set: "ref" },
  { id: "ref-letters", text: "double-you, see, ay, gee, two point two", set: "ref" },
];

const relOut = (p: string) => path.relative(OUT, p).split(path.sep).join("/");
const pad = (n: number) => String(n).padStart(2, "0");

// ---------------------------------------------------------------------------
// Script
// ---------------------------------------------------------------------------

type Beat = { n: number; title: string; scriptText: string; text: string };

function readBeats(): Beat[] {
  const md = fs.readFileSync(SCRIPT_MD, "utf8").replace(/\r\n/g, "\n");
  const parts = md.split(/^\*\*\[(\d+)\] ([^*]+)\*\*[ \t]*$/m);
  const beats: Beat[] = [];
  for (let i = 1; i < parts.length; i += 3) {
    const scriptText = parts[i + 2]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n");
    beats.push({
      n: Number(parts[i]),
      title: parts[i + 1].trim(),
      scriptText,
      text: scriptText.split(SCRIPT_WCAG).join(WCAG_SPELLING),
    });
  }
  if (beats.length !== 13) throw new Error(`Expected 13 beats in script.md, found ${beats.length}.`);
  return beats;
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

type Credit = { credits: number | null; bucket: string | null };

type Analysis = {
  durationSeconds: number;
  leadSeconds: number;
  trailSeconds: number;
  maxGapInPhrase: number;
  maxGapAtBoundary: number;
  gaps: { at: number; seconds: number; after: string | null }[];
  peakDbfs: number;
  integratedLufs: number;
  truePeakDbtp: number;
  levelWindows: { from: number; lufs: number }[];
  levelSpreadLu: number;
  clippedRuns: number;
  transcript: string;
  wordErrors: number;
  diff: string[];
  audioEvents: string[];
  shortWords: string[];
  unsureWords: { word: string; logprob: number }[];
  wcagSpans: { heard: string; seconds: number }[];
  charsPerSecond: number;
  paceVsReference: number;
  flags: string[];
  score: number;
};

type Take = {
  take: number;
  seed: number;
  file: string;
  sttFile: string;
  durationSeconds: number;
  creditsMeasured: number | null;
  creditsBucket: string | null;
  sttCreditsMeasured: number | null;
  createdAt: string;
  analysis: Analysis;
};

type BeatRecord = {
  beat: number;
  title: string;
  file: string | null;
  text: string;
  characters: number;
  durationSeconds: number | null;
  takeCount: number;
  keptTake: number | null;
  keptBy: string | null;
  creditsMeasured: number;
  creditsKeptTake: number | null;
  takes: Take[];
};

type TestRecord = {
  id: string;
  text: string;
  characters: number;
  seed: number;
  file: string;
  sttFile: string;
  durationSeconds: number;
  creditsMeasured: number | null;
  creditsBucket: string | null;
  sttCreditsMeasured: number | null;
  createdAt: string;
  analysis: Analysis;
};

type Manifest = {
  _note: string;
  video: string;
  folder: string;
  script: string;
  voice: {
    id: string;
    name: string;
    model: string;
    settings: typeof SETTINGS;
    outputFormat: string;
    endpoint: string;
  };
  wcagSpelling: string;
  wcagSpellingNote: string;
  tests: TestRecord[];
  beats: BeatRecord[];
  totals: Record<string, number | null>;
};

function emptyManifest(): Manifest {
  return {
    _note:
      "YouTube L1 narration, one file per beat. text is exactly what was sent to ElevenLabs. " +
      "durationSeconds is measured off the kept file (ffprobe). creditsMeasured per take is a before " +
      "and after delta on /v1/usage/character-stats (the scripts/voice.ts method); a beat's " +
      "creditsMeasured is the sum over all its takes. sttCreditsMeasured is the transcription check. " +
      "Other work on the account in the same window would land in a delta, so read credits as upper " +
      "bounds. Written by scripts/youtube/l1/voice.ts.",
    video: "L1, Test your website with one key (publishes 2026-10-02 11:00 AM)",
    folder: "Social Media Management/To Be Released/2026-10-02-4",
    script: "To Be Released/2026-10-02-4/source/script.md",
    voice: {
      id: VOICE.id,
      name: VOICE.name,
      model: MODEL,
      settings: SETTINGS,
      outputFormat: OUTPUT_FORMAT,
      endpoint: `POST /v1/text-to-speech/${VOICE.id}?output_format=${OUTPUT_FORMAT}, body { text, model_id, voice_settings, seed }`,
    },
    wcagSpelling: WCAG_SPELLING,
    wcagSpellingNote: "",
    tests: [],
    beats: [],
    totals: {},
  };
}

function loadManifest(): Manifest {
  if (!fs.existsSync(MANIFEST)) return emptyManifest();
  return { ...emptyManifest(), ...(JSON.parse(fs.readFileSync(MANIFEST, "utf8")) as Partial<Manifest>) };
}

function saveManifest(m: Manifest): void {
  m.wcagSpelling = WCAG_SPELLING;
  m.wcagSpellingNote = WCAG_NOTE;
  const beats = m.beats.filter((b) => b.durationSeconds !== null);
  const sum = (xs: (number | null)[]) => xs.reduce<number>((a, b) => a + (b ?? 0), 0);
  const allTakes = m.beats.flatMap((b) => b.takes);
  m.totals = {
    beatsKept: beats.length,
    narrationSeconds: Number(sum(beats.map((b) => b.durationSeconds)).toFixed(3)),
    takesGenerated: allTakes.length,
    beatCredits: sum(allTakes.map((t) => t.creditsMeasured)),
    testCredits: sum(m.tests.map((t) => t.creditsMeasured)),
    sttCredits: sum([...allTakes.map((t) => t.sttCreditsMeasured), ...m.tests.map((t) => t.sttCreditsMeasured)]),
  };
  m.totals.ttsCredits = (m.totals.beatCredits ?? 0) + (m.totals.testCredits ?? 0);
  m.totals.allCredits = (m.totals.ttsCredits ?? 0) + (m.totals.sttCredits ?? 0);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(MANIFEST, `${JSON.stringify(m, null, 2)}\n`);
}

function generationsSoFar(m: Manifest): number {
  return m.tests.length + m.beats.reduce((a, b) => a + b.takes.length, 0);
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

async function speak(key: string, text: string, seed: number, label: string): Promise<Buffer> {
  const res = await fetchRetry(`${API_BASE}/v1/text-to-speech/${VOICE.id}?output_format=${OUTPUT_FORMAT}`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: SETTINGS, seed }),
  });
  if (!res.ok) {
    throw new Error(`POST /v1/text-to-speech/${VOICE.id} returned ${res.status}: ${redact(await res.text(), key)}`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 2000) {
    throw new Error(`${label}: only ${bytes.length} bytes came back: ${redact(bytes.toString("utf8").slice(0, 500), key)}`);
  }
  return bytes;
}

type SttWord = { text: string; start: number; end: number; type: string; logprob?: number };

async function transcribe(key: string, file: string): Promise<{ json: { text?: string; words?: SttWord[] }; credits: Credit }> {
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

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

function decodeMono(file: string, rate?: number): Float32Array {
  const args = ["-hide_banner", "-nostdin", "-i", file, "-f", "f32le", "-ac", "1"];
  if (rate) args.push("-ar", String(rate));
  args.push("-");
  const res = spawnSync("ffmpeg", args, { maxBuffer: 512 * 1024 * 1024 });
  if (res.status !== 0) throw new Error(`decode failed for ${file}`);
  const buf = res.stdout as Buffer;
  const out = new Float32Array(Math.floor(buf.length / 4));
  for (let i = 0; i < out.length; i += 1) out[i] = buf.readFloatLE(i * 4);
  return out;
}

const dbOf = (x: number) => 20 * Math.log10(Math.max(x, 1e-9));

/** Edges and pauses from 10 ms frames; speech is anything within 40 dB of the loudest frame. */
function measureWave(file: string) {
  const sr = 16000;
  const x = decodeMono(file, sr);
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
  const duration = x.length / sr;
  const gaps: { at: number; seconds: number }[] = [];
  let run = 0;
  for (let i = first; i <= last; i += 1) {
    if (!speech[i]) run += 1;
    else {
      if (run >= 12) gaps.push({ at: Number(((i - run) * 0.01).toFixed(2)), seconds: Number((run * 0.01).toFixed(2)) });
      run = 0;
    }
  }
  const { stderr } = ffmpeg(["-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const summary = stderr.slice(stderr.lastIndexOf("Summary:"));
  return {
    durationSeconds: Number(probeDuration(file).toFixed(3)),
    leadSeconds: Number((Math.max(0, first) * 0.01).toFixed(2)),
    trailSeconds: Number(Math.max(0, duration - (last + 1) * 0.01).toFixed(2)),
    speechSeconds: Math.max(0.1, (last + 1 - Math.max(0, first)) * 0.01),
    gaps,
    peakDbfs: measureVolume(file).max,
    integratedLufs: Number(/I:\s*(-?[\d.]+|-inf) LUFS/.exec(summary)?.[1] ?? NaN),
    truePeakDbtp: Number(/True peak:\s*Peak:\s*(-?[\d.]+|-inf) dBFS/.exec(summary)?.[1] ?? NaN),
  };
}

/**
 * Gated loudness in 6 second windows: EBU R128 momentary values, energy mean,
 * an absolute gate at -70 and a relative gate 20 LU under the window. A read
 * whose level steps down at a paragraph break (beat 3 take 1 fell 5 dB at its
 * second paragraph) shows up as a wide spread; ordinary sentence endings stay
 * within about 3.5 LU.
 */
function levelWindows(file: string): { windows: { from: number; lufs: number }[]; spread: number } {
  const { stderr } = ffmpeg(["-i", file, "-af", "ebur128", "-f", "null", "-"]);
  const pts: { t: number; m: number }[] = [];
  for (const line of stderr.split(/\r?\n/)) {
    const m = /t:\s*([\d.]+)\s+.*?M:\s*(-?[\d.]+)/.exec(line);
    if (m) pts.push({ t: Number(m[1]), m: Number(m[2]) });
  }
  const end = pts.length ? pts[pts.length - 1].t : 0;
  const energy = (xs: number[]) => 10 * Math.log10(xs.reduce((a, x) => a + 10 ** (x / 10), 0) / xs.length);
  const windows: { from: number; lufs: number }[] = [];
  for (let from = 0; from + 3 <= end; from += 6) {
    const v = pts.filter((p) => p.t >= from && p.t < from + 6 && p.m > -70).map((p) => p.m);
    if (v.length < 25) continue;
    const gate = energy(v) - 20;
    windows.push({ from, lufs: Number(energy(v.filter((x) => x > gate)).toFixed(1)) });
  }
  const ls = windows.map((w) => w.lufs);
  return { windows, spread: ls.length ? Number((Math.max(...ls) - Math.min(...ls)).toFixed(1)) : 0 };
}

/** Runs of two or more samples pinned at full scale, at the file's own rate. */
function clippedRuns(file: string): number {
  const x = decodeMono(file);
  let runs = 0;
  let run = 0;
  for (let i = 0; i < x.length; i += 1) {
    if (Math.abs(x[i]) >= 0.999) run += 1;
    else {
      if (run >= 2) runs += 1;
      run = 0;
    }
  }
  return run >= 2 ? runs + 1 : runs;
}

const FUNCTION_WORDS = new Set([
  "your", "youre", "yours", "that", "this", "with", "from", "they", "them", "then", "than", "what", "when",
  "where", "were", "have", "just", "into", "onto", "each", "every", "also", "only", "some", "does", "dont",
  "itll", "youll", "thats", "theres", "heres", "their", "there", "these", "those", "will", "would",
  "could", "should", "about",
]);

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const TEENS = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function numberWords(n: number): string {
  if (n < 10) return ONES[n];
  if (n < 20) return TEENS[n - 10];
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
  return String(n);
}

/**
 * Lower case words for comparison, the same rules on both sides: numbers
 * spelled, "&" as "and", hyphens as spaces, US spelling, and a run of single
 * letters (W C A G) joined, so "W-C-A-G", "W C A G" and "WCAG" compare equal.
 */
function normalWords(text: string): string[] {
  const words = text
    .replace(/&/g, " and ")
    .replace(/(\d+)\.(\d+)/g, (_, a: string, b: string) => ` ${numberWords(Number(a))} point ${numberWords(Number(b))} `)
    .replace(/\d+/g, (d: string) => ` ${numberWords(Number(d))} `)
    .toLowerCase()
    .replace(/\bgrey\b/g, "gray")
    .replace(/\b(pop|sign|pick)[ -]up(s?)\b/g, "$1up$2")
    .replace(/\bweb[ -]page\b/g, "webpage")
    .replace(/\bwalk[ -]through\b/g, "walkthrough")
    .replace(/[^a-z' ]+/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter(Boolean);
  const out: string[] = [];
  let letters = "";
  for (const w of words) {
    if (w.length === 1 && w !== "a") {
      letters += w;
      continue;
    }
    if (w === "a" && letters) {
      letters += w;
      continue;
    }
    if (letters) out.push(letters);
    letters = "";
    out.push(w);
  }
  if (letters) out.push(letters);
  return out;
}

/** Word level diff: "-word" is in the script and not heard, "+word" is heard and not in the script. */
function wordDiff(expected: string[], heard: string[]): string[] {
  const n = expected.length;
  const m = heard.length;
  const d = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      d[i][j] = expected[i] === heard[j] ? d[i + 1][j + 1] + 1 : Math.max(d[i + 1][j], d[i][j + 1]);
    }
  }
  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (expected[i] === heard[j]) {
      i += 1;
      j += 1;
    } else if (d[i + 1][j] >= d[i][j + 1]) out.push(`-${expected[i++]}`);
    else out.push(`+${heard[j++]}`);
  }
  while (i < n) out.push(`-${expected[i++]}`);
  while (j < m) out.push(`+${heard[j++]}`);
  return out;
}

/** Where the transcript has W, C, A and G in a row (as one token or several), and how long they took. */
function wcagSpans(words: SttWord[]): { heard: string; seconds: number }[] {
  const spans: { heard: string; seconds: number }[] = [];
  const letters = (w: SttWord) => w.text.toLowerCase().replace(/[^a-z]/g, "");
  for (let i = 0; i < words.length; i += 1) {
    let acc = "";
    for (let j = i; j < words.length && acc.length < 4; j += 1) {
      acc += letters(words[j]);
      if (acc === "wcag") {
        spans.push({
          heard: words.slice(i, j + 1).map((w) => w.text).join(" "),
          seconds: Number((words[j].end - words[i].start).toFixed(2)),
        });
        i = j;
        break;
      }
      if (!"wcag".startsWith(acc)) break;
    }
  }
  return spans;
}

function analyze(file: string, sentText: string, stt: { text?: string; words?: SttWord[] }): Analysis {
  const wave = measureWave(file);
  const all = stt.words ?? [];
  const words = all.filter((w) => w.type === "word");
  const events = all.filter((w) => w.type === "audio_event").map((w) => w.text);
  const expected = normalWords(sentText);
  const heard = normalWords(words.map((w) => w.text).join(" "));
  const diff = heard.join("") === expected.join("") ? [] : wordDiff(expected, heard);
  const gaps = wave.gaps.map((g) => {
    let after: string | null = null;
    for (const w of words) if (w.end <= g.at + 0.08) after = w.text;
    return { ...g, after };
  });
  const boundary = (w: string | null) => w !== null && /[.,!?;:]$/.test(w);
  const maxGapInPhrase = Math.max(0, ...gaps.filter((g) => !boundary(g.after)).map((g) => g.seconds));
  const maxGapAtBoundary = Math.max(0, ...gaps.filter((g) => boundary(g.after)).map((g) => g.seconds));
  // Function words ("the", "you", "your") run under 80 ms in fluent speech and
  // the transcriber times them short, so only a longer word that short is a
  // clipped word suspect.
  const shortWords = words
    .filter((w) => {
      const letters = w.text.toLowerCase().replace(/[^a-z]/g, "");
      return letters.length >= 4 && !FUNCTION_WORDS.has(letters) && w.end - w.start < 0.08;
    })
    .map((w) => w.text);
  const unsureWords = words
    .filter((w) => typeof w.logprob === "number" && (w.logprob as number) < -1)
    .map((w) => ({ word: w.text, logprob: Number((w.logprob as number).toFixed(2)) }));
  const clips = clippedRuns(file);
  const level = levelWindows(file);
  const charsPerSecond = sentText.length / wave.speechSeconds;
  const paceVsReference = charsPerSecond / REFERENCE_PACE - 1;
  // The pronunciation test lines are too short for a pace to mean much.
  const paceOff = sentText.length >= 60 && Math.abs(paceVsReference) > 0.15;
  const spans = /W-C-A-G|W, C, A, G/.test(sentText) ? wcagSpans(words) : [];
  // An isolated test line with nothing else in it: the whole utterance is the span.
  const wcagOnly = /^W(-|, )C(-|, )A(-|, )G$/.test(sentText.trim());
  if (wcagOnly && spans.length === 0) spans.push({ heard: stt.text ?? "", seconds: Number(wave.speechSeconds.toFixed(2)) });
  if (wcagOnly && spans.length) spans[0].seconds = Math.max(spans[0].seconds, Number(wave.speechSeconds.toFixed(2)));

  const flags: string[] = [];
  if (diff.length) flags.push(`transcript differs: ${diff.join(" ")}`);
  if (/W-C-A-G|W, C, A, G/.test(sentText)) {
    const expectedCount = (sentText.match(/W-C-A-G|W, C, A, G/g) ?? []).length;
    if (spans.length < expectedCount) flags.push(`W-C-A-G not found in the transcript (${spans.length} of ${expectedCount})`);
    for (const s of spans) if (s.seconds < WCAG_MIN_SECONDS) flags.push(`W-C-A-G took only ${s.seconds}s ("${s.heard}")`);
  }
  if (maxGapInPhrase > 0.8) flags.push(`${maxGapInPhrase}s pause inside a phrase`);
  if (wave.leadSeconds > 0.6) flags.push(`${wave.leadSeconds}s leading silence`);
  if (clips > 0) flags.push(`${clips} clipped runs`);
  if (level.spread > 4.5) flags.push(`level steps ${level.spread} LU across the beat`);
  if (paceOff) flags.push(`pace ${(paceVsReference * 100).toFixed(0)}% off the reference`);
  if (shortWords.length) flags.push(`clipped words? ${shortWords.join(", ")}`);
  if (events.length) flags.push(`audio events: ${events.join(", ")}`);
  if (unsureWords.length) flags.push(`transcriber unsure: ${unsureWords.map((u) => u.word).join(", ")}`);

  const wcagShort = spans.filter((s) => s.seconds < WCAG_MIN_SECONDS).length;
  const score =
    diff.length * 10 + wcagShort * 10 + clips * 5 + shortWords.length * 3 + events.length * 3 +
    (maxGapInPhrase > 0.8 ? 3 : 0) + unsureWords.length + (level.spread > 4.5 ? 5 : 0) + (paceOff ? Math.round(Math.abs(paceVsReference) * 10) : 0);

  return {
    durationSeconds: wave.durationSeconds,
    leadSeconds: wave.leadSeconds,
    trailSeconds: wave.trailSeconds,
    maxGapInPhrase: Number(maxGapInPhrase.toFixed(2)),
    maxGapAtBoundary: Number(maxGapAtBoundary.toFixed(2)),
    gaps,
    peakDbfs: wave.peakDbfs,
    integratedLufs: wave.integratedLufs,
    truePeakDbtp: wave.truePeakDbtp,
    levelWindows: level.windows,
    levelSpreadLu: level.spread,
    clippedRuns: clips,
    transcript: stt.text ?? "",
    wordErrors: diff.length,
    diff,
    audioEvents: events,
    shortWords,
    unsureWords,
    wcagSpans: spans,
    charsPerSecond: Number(charsPerSecond.toFixed(2)),
    paceVsReference: Number(paceVsReference.toFixed(3)),
    flags,
    score,
  };
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

async function generateFile(
  key: string,
  text: string,
  seed: number,
  file: string,
  label: string,
): Promise<{ durationSeconds: number; credits: Credit; sttCredits: Credit; analysis: Analysis; sttFile: string }> {
  console.log(`\n[voice] ${label}  ${text.length} characters, seed ${seed}`);
  const before = await usageSnapshot(key);
  const bytes = await speak(key, text, seed, label);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, bytes);
  const durationSeconds = Number(probeDuration(file).toFixed(3));
  const credits = await creditsSince(key, before);
  console.log(`  wrote ${relOut(file)} (${durationSeconds.toFixed(2)}s), credits ${credits.credits ?? "not reported"}${credits.bucket ? ` (${credits.bucket})` : ""}`);
  assertUnderCreditAlarm(credits.credits, label);

  const stt = await transcribe(key, file);
  const sttFile = file.replace(/\.mp3$/, ".stt.json");
  fs.writeFileSync(sttFile, `${JSON.stringify(stt.json, null, 2)}\n`);
  const analysis = analyze(file, text, stt.json);
  console.log(`  heard: ${analysis.transcript}`);
  console.log(`  ${analysis.flags.length ? `FLAGS: ${analysis.flags.join("; ")}` : "clean"} (score ${analysis.score})`);
  if (analysis.wcagSpans.length) console.log(`  W-C-A-G spans: ${JSON.stringify(analysis.wcagSpans)}`);
  return { durationSeconds, credits, sttCredits: stt.credits, analysis, sttFile };
}

async function runTests(set: "main" | "alt" | "ref", force: boolean): Promise<void> {
  const key = readApiKey();
  const m = loadManifest();
  for (const [index, t] of TESTS.entries()) {
    if (t.set !== set) continue;
    const file = path.join(TESTS_DIR, `test-${pad(index + 1)}-${t.id}.mp3`);
    const existing = m.tests.find((r) => r.id === t.id);
    if (existing && fs.existsSync(path.join(OUT, existing.file)) && !force) {
      console.log(`skip ${t.id}, ${existing.file} exists`);
      continue;
    }
    if (generationsSoFar(m) >= GENERATION_CAP) throw new Error(`Generation cap of ${GENERATION_CAP} reached. Stopping.`);
    const seed = 9000 + index + 1;
    const r = await generateFile(key, t.text, seed, file, `test ${t.id}`);
    const record: TestRecord = {
      id: t.id,
      text: t.text,
      characters: t.text.length,
      seed,
      file: relOut(file),
      sttFile: relOut(r.sttFile),
      durationSeconds: r.durationSeconds,
      creditsMeasured: r.credits.credits,
      creditsBucket: r.credits.bucket,
      sttCreditsMeasured: r.sttCredits.credits,
      createdAt: new Date().toISOString(),
      analysis: r.analysis,
    };
    m.tests = [...m.tests.filter((x) => x.id !== t.id), record];
    saveManifest(m);
  }
}

function beatRecord(m: Manifest, beat: Beat): BeatRecord {
  let rec = m.beats.find((b) => b.beat === beat.n);
  if (!rec) {
    rec = {
      beat: beat.n,
      title: beat.title,
      file: null,
      text: beat.text,
      characters: beat.text.length,
      durationSeconds: null,
      takeCount: 0,
      keptTake: null,
      keptBy: null,
      creditsMeasured: 0,
      creditsKeptTake: null,
      takes: [],
    };
    m.beats.push(rec);
    m.beats.sort((a, b) => a.beat - b.beat);
  }
  if (rec.text !== beat.text) {
    throw new Error(`Beat ${beat.n}: script.md text no longer matches the takes on record. Move the old takes aside first.`);
  }
  return rec;
}

function keep(rec: BeatRecord, take: number, by: string): void {
  const t = rec.takes.find((x) => x.take === take);
  if (!t) throw new Error(`Beat ${rec.beat} has no take ${take}.`);
  const kept = path.join(VOICE_DIR, `beat-${pad(rec.beat)}.mp3`);
  fs.copyFileSync(path.join(OUT, t.file), kept);
  rec.file = relOut(kept);
  rec.keptTake = take;
  rec.keptBy = by;
  rec.durationSeconds = Number(probeDuration(kept).toFixed(3));
  rec.creditsKeptTake = t.creditsMeasured;
}

function refresh(rec: BeatRecord): void {
  rec.takeCount = rec.takes.length;
  rec.creditsMeasured = rec.takes.reduce((a, t) => a + (t.creditsMeasured ?? 0), 0);
}

async function runBeats(which: string, retake: boolean, dryRun: boolean): Promise<void> {
  const beats = readBeats();
  const list = which === "all" ? beats : beats.filter((b) => String(b.n) === which);
  if (!list.length) throw new Error(`No beat ${which}.`);
  if (dryRun) {
    let chars = 0;
    for (const b of list) {
      chars += b.text.length;
      console.log(`[${pad(b.n)}] ${b.title.padEnd(22)} ${String(b.text.length).padStart(4)} chars\n${b.text}\n`);
    }
    console.log(`${list.length} beats, ${chars} characters, about ${chars} credits at one a character.`);
    return;
  }
  const key = readApiKey();
  const m = loadManifest();
  for (const beat of list) {
    const rec = beatRecord(m, beat);
    if (rec.takes.length && !retake) {
      console.log(`skip beat ${beat.n}, ${rec.takes.length} take(s) on record`);
      continue;
    }
    if (rec.takes.length >= TAKE_CAP) throw new Error(`Beat ${beat.n} already has ${TAKE_CAP} takes. Stopping.`);
    if (generationsSoFar(m) >= GENERATION_CAP) throw new Error(`Generation cap of ${GENERATION_CAP} reached. Stopping.`);
    const take = rec.takes.length + 1;
    const seed = beat.n * 100 + take;
    const file = path.join(TAKES_DIR, `beat-${pad(beat.n)}-t${take}.mp3`);
    const r = await generateFile(key, beat.text, seed, file, `beat ${beat.n} take ${take}`);
    rec.takes.push({
      take,
      seed,
      file: relOut(file),
      sttFile: relOut(r.sttFile),
      durationSeconds: r.durationSeconds,
      creditsMeasured: r.credits.credits,
      creditsBucket: r.credits.bucket,
      sttCreditsMeasured: r.sttCredits.credits,
      createdAt: new Date().toISOString(),
      analysis: r.analysis,
    });
    refresh(rec);
    if (rec.keptBy === null || rec.keptBy.startsWith("auto")) {
      const best = [...rec.takes].sort((a, b) => a.analysis.score - b.analysis.score || a.take - b.take)[0];
      keep(rec, best.take, `auto: lowest check score (${best.analysis.score}) of ${rec.takes.length} take(s)`);
      console.log(`  kept take ${best.take} as ${rec.file}`);
    }
    saveManifest(m);
  }
}

function runKeep(n: string, take: string, why: string | undefined): void {
  const m = loadManifest();
  const rec = m.beats.find((b) => String(b.beat) === n);
  if (!rec) throw new Error(`No beat ${n} on record.`);
  keep(rec, Number(take), `manual${why ? `: ${why}` : ""}`);
  saveManifest(m);
  console.log(`beat ${n}: kept take ${take} as ${rec.file}`);
}

/** Re-runs the checks on every take and test from its saved transcript. No API calls. */
function runRecheck(): void {
  const m = loadManifest();
  for (const t of m.tests) {
    const stt = JSON.parse(fs.readFileSync(path.join(OUT, t.sttFile), "utf8"));
    t.analysis = analyze(path.join(OUT, t.file), t.text, stt);
  }
  for (const b of m.beats) {
    for (const t of b.takes) {
      const stt = JSON.parse(fs.readFileSync(path.join(OUT, t.sttFile), "utf8"));
      t.analysis = analyze(path.join(OUT, t.file), b.text, stt);
    }
  }
  saveManifest(m);
  runReport();
}

function runReport(): void {
  const m = loadManifest();
  for (const t of m.tests) {
    console.log(`test ${t.id.padEnd(15)} ${t.durationSeconds.toFixed(2)}s  credits ${t.creditsMeasured}  heard "${t.analysis.transcript}"  ${t.analysis.flags.join("; ") || "clean"}${t.analysis.wcagSpans.length ? `  spans ${JSON.stringify(t.analysis.wcagSpans)}` : ""}`);
  }
  const kept = m.beats.filter((b) => b.keptTake !== null);
  const pace = kept.map((b) => b.takes.find((t) => t.take === b.keptTake)!.analysis.charsPerSecond).sort((a, b) => a - b);
  const median = pace.length ? pace[Math.floor(pace.length / 2)] : NaN;
  for (const b of m.beats) {
    const t = b.takes.find((x) => x.take === b.keptTake);
    const a = t?.analysis;
    console.log(
      `beat ${pad(b.beat)} ${b.title.padEnd(20)} ${b.durationSeconds?.toFixed(2) ?? "-"}s  takes ${b.takeCount} kept ${b.keptTake}  ` +
        `credits ${b.creditsMeasured}  pace ${a?.charsPerSecond ?? "-"} c/s (median ${median})  ` +
        `lufs ${a?.integratedLufs}  lead ${a?.leadSeconds} trail ${a?.trailSeconds}  ${a?.flags.join("; ") || "clean"}`,
    );
  }
  console.log(JSON.stringify(m.totals));
}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const [cmd, a, b] = argv;
  if (cmd === "test") return runTests(argv.includes("--alt") ? "alt" : argv.includes("--ref") ? "ref" : "main", argv.includes("--force"));
  if (cmd === "beat" && a) return runBeats(a, argv.includes("--retake"), argv.includes("--dry-run"));
  if (cmd === "keep" && a && b) return runKeep(a, b, flag(argv, "--why"));
  if (cmd === "report") return runReport();
  if (cmd === "recheck") return runRecheck();
  console.log("usage: test [--alt | --ref] [--force] | beat <n|all> [--retake] [--dry-run] | keep <n> <take> [--why text] | report | recheck");
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
