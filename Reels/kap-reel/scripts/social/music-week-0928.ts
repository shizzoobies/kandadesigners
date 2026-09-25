/**
 * scripts/social/music-week-0928.ts
 *
 * Seven new music beds for the week of 2026-09-28 (ids music-w0928-1 .. -7),
 * so that the ten videos that week (five reels, five Facebook slide videos)
 * each carry a different track. Alex, 2026-09-25: no narration on any content,
 * and no music track reused within any 30-day period.
 *
 * Same house direction as the tutorial2 set (indie pop, guitar driven, feel
 * good, no vocals), same endpoint, model and format as scripts/audio.ts, whose
 * exported helpers are imported read-only. audio.ts hard-codes its variants, so
 * this set lives here instead of being added there.
 *
 * Run from D:\kap-reel:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/music-week-0928.ts gen 1     one track
 *   node node_modules/tsx/dist/cli.mjs scripts/social/music-week-0928.ts gen all   every track not yet on disk
 *   node node_modules/tsx/dist/cli.mjs scripts/social/music-week-0928.ts check <mp3>
 *   node node_modules/tsx/dist/cli.mjs scripts/social/music-week-0928.ts vocals <mp3>
 *
 * Every billable generation is appended to config/audio.json with
 * set "social-w0928" and its measured credits, the same record shape audio.ts
 * writes. Each take lands in assets/audio/raw/music-w0928-<n>-32s.mp3 and is
 * copied to out/candidates/music-w0928-<n>.mp3; the copy's basename is the
 * track id the social tools record in post.json.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  apiPostAudio,
  assertUnderCreditAlarm,
  creditsSince,
  ffmpeg,
  measureVolume,
  probeDuration,
  readApiKey,
  redact,
  rel,
  usageSnapshot,
} from "../audio.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const RAW_DIR = path.join(ROOT, "assets", "audio", "raw");
const CANDIDATE_DIR = path.join(ROOT, "out", "candidates");
const AUDIO_JSON = path.join(ROOT, "config", "audio.json");

const SET = "social-w0928";
const MUSIC_MODEL = "music_v2";
const MUSIC_FORMAT = "mp3_48000_320";
const LENGTH_SECONDS = 32;
/** Seven tracks plus at most one regenerate each. */
const CAP = 14;
const FIRST_SECOND_TOLERANCE_DB = 6;

/**
 * No voice sits on top of these beds any more, so unlike tutorial2 the
 * instruction does not ask for midrange space; the bed carries a muted-first
 * video with on-screen text. It keeps the clean start (the hook lands on frame
 * 0) and asks for a real ending.
 */
const INSTRUCTION =
  "Clean intro: the groove starts on the very first beat, no fade in, no " +
  "long build, no silence at the start. Fully instrumental, no vocals, no " +
  "vocal chops, no humming, no oohs, no whistling, no spoken word, no lyrics. " +
  "No heavy drop, no big riser, no sweep, no impact hit, no breakdown or " +
  "pause in the middle. Steady energy the whole way through so any fifteen " +
  "second window stands on its own. It carries a short social video with " +
  "on-screen text and no voiceover, so a simple catchy instrumental hook is " +
  "welcome, but keep the arrangement uncluttered. End cleanly: resolve on a " +
  "final chord that rings out over the last two seconds, no abrupt cut. Clean " +
  "modern indie production, plenty of headroom, no clipping.";

type Track = { n: number; bpm: number; lead: string; mood: string; feel: string };

const TRACKS: Track[] = [
  {
    n: 1,
    bpm: 100,
    lead: "bass-led groove, muted electric stabs",
    mood: "confident",
    feel:
      "Confident mid tempo indie pop instrumental at about 100 bpm in a major " +
      "key. A bass led groove: a round, melodic electric bass line drives the " +
      "song, a clean electric guitar plays tight muted stabs on the offbeats, " +
      "dry punchy kick and snare, tambourine on the backbeat. Self assured, " +
      "grounded and quietly proud, like walking into a room you own.",
  },
  {
    n: 2,
    bpm: 116,
    lead: "strummed ukulele, glockenspiel, snaps",
    mood: "bright, playful",
    feel:
      "Bright, playful indie pop instrumental at about 116 bpm with a bouncy " +
      "skipping shuffle feel. A strummed ukulele carries the rhythm, a clean " +
      "electric guitar answers with short cheerful picked phrases, a " +
      "glockenspiel adds sparkle on the hook, plucky round bass, snappy drums " +
      "with finger snaps and handclaps. Sunny, cheeky, colorful and fun.",
  },
  {
    n: 3,
    bpm: 92,
    lead: "fingerpicked acoustic over a soft synth pad",
    mood: "calm, focused",
    feel:
      "Calm, focused indie folk pop instrumental at about 92 bpm. A " +
      "fingerpicked acoustic guitar plays a gentle repeating pattern over a " +
      "soft warm synth pad, a clean electric guitar with a touch of reverb " +
      "adds sparse melodic notes, brushed snare, soft kick and shaker, warm " +
      "bass. Steady, thoughtful and clear headed, like concentrated work at a " +
      "sunny desk, still gently moving forward.",
  },
  {
    n: 4,
    bpm: 104,
    lead: "picked mandolin and nylon guitar",
    mood: "curious, light",
    feel:
      "Light, curious indie pop instrumental at about 104 bpm. A bright " +
      "mandolin plays a quick picked melodic figure in playful question and " +
      "answer phrases, a nylon string guitar strums lightly underneath, " +
      "pizzicato style plucks, a bouncy upright style bass, light drums with " +
      "rimshots and shaker. Inquisitive, light footed, a little whimsical and " +
      "optimistic.",
  },
  {
    n: 5,
    bpm: 108,
    lead: "chorused clean electric arpeggios, synth pluck",
    mood: "curious, airy",
    feel:
      "Airy, curious modern indie pop instrumental at about 108 bpm. Clean " +
      "electric guitar arpeggios with a shimmering chorus effect, a light " +
      "analog synth pad and a soft synth pluck counter melody, a bubbly " +
      "melodic bass, crisp drums with rimshots and a steady hi hat. A sense of " +
      "discovery, light and open, like an idea clicking into place.",
  },
  {
    n: 6,
    bpm: 128,
    lead: "driving eighth-note electric guitars, big claps",
    mood: "high energy, launch",
    feel:
      "High energy indie rock pop instrumental at about 128 bpm. Driving " +
      "eighth note electric guitars, one lightly crunchy rhythm guitar and one " +
      "bright clean lead riff, a punchy pumping bass, energetic drums with a " +
      "four on the floor kick, open hi hats and big handclaps on every " +
      "backbeat. Exciting, bold, celebratory launch day energy, like a " +
      "countdown hitting zero.",
  },
  {
    n: 7,
    bpm: 124,
    lead: "big acoustic strums, stomps, octave electric riff",
    mood: "high energy, anthemic",
    feel:
      "Upbeat, anthemic indie pop instrumental at about 124 bpm. Big bright " +
      "acoustic guitar strums with foot stomps and claps, a clean electric " +
      "guitar playing a soaring octave riff, a light synth arpeggio sparkle, " +
      "driving bass, energetic tom heavy drums. Joyful, triumphant, high " +
      "energy launch party feel.",
  },
];

// ---------------------------------------------------------------------------
// config/audio.json, appended the way audio.ts appends
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>;

function loadConfig(): Json & { generations: Json[] } {
  const parsed = JSON.parse(fs.readFileSync(AUDIO_JSON, "utf8"));
  parsed.generations = parsed.generations ?? [];
  return parsed;
}

function appendGeneration(record: Json): void {
  const config = loadConfig();
  config.generations.push(record);
  fs.writeFileSync(AUDIO_JSON, `${JSON.stringify(config, null, 2)}\n`);
}

function setCount(): number {
  return loadConfig().generations.filter((g) => g.set === SET).length;
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

type Silence = { start: number; end: number; duration: number };

function silences(file: string, noiseDb = -45, minSeconds = 0.3): Silence[] {
  const { stderr } = ffmpeg([
    "-i",
    file,
    "-af",
    `silencedetect=noise=${noiseDb}dB:d=${minSeconds}`,
    "-f",
    "null",
    "-",
  ]);
  const out: Silence[] = [];
  let start: number | null = null;
  for (const line of stderr.split(/\r?\n/)) {
    const s = /silence_start:\s*(-?[\d.]+)/.exec(line);
    if (s) start = Number(s[1]);
    const e = /silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/.exec(line);
    if (e) {
      out.push({ start: start ?? 0, end: Number(e[1]), duration: Number(e[2]) });
      start = null;
    }
  }
  if (start !== null) {
    const d = probeDuration(file);
    out.push({ start, end: d, duration: d - start });
  }
  return out;
}

function flatFactor(file: string): { flat: number; peakDb: number } {
  const { stderr } = ffmpeg([
    "-i",
    file,
    "-af",
    "astats=measure_perchannel=none:measure_overall=Flat_factor+Peak_level",
    "-f",
    "null",
    "-",
  ]);
  return {
    flat: Number(/Flat factor:\s*([\d.]+)/.exec(stderr)?.[1] ?? 0),
    peakDb: Number(/Peak level dB:\s*(-?[\d.]+|-inf)/.exec(stderr)?.[1] ?? NaN),
  };
}

export type TakeCheck = {
  durationSeconds: number;
  firstSecond: { firstDb: number; wholeDb: number; deficitDb: number; pass: boolean };
  leadingSilenceSeconds: number;
  midSilences: Silence[];
  clipping: { flatFactor: number; peakDb: number; pass: boolean };
  ending: { last250msDb: number; last2sDb: number; wholeDb: number; clean: boolean };
  pass: boolean;
  reasons: string[];
};

export function checkTake(file: string, minSeconds = 30): TakeCheck {
  const duration = probeDuration(file);
  const whole = measureVolume(file);
  const first = measureVolume(file, { start: 0, duration: 1 });
  const deficit = Number((whole.mean - first.mean).toFixed(2));
  const sil = silences(file);
  const leading = sil.find((s) => s.start <= 0.05);
  const mid = silences(file, -45, 0.5).filter((s) => s.start > 0.05 && s.end < duration - 2.5);
  const clip = flatFactor(file);
  const last250 = measureVolume(file, { start: Math.max(0, duration - 0.25), duration: 0.25 });
  const last2 = measureVolume(file, { start: Math.max(0, duration - 2), duration: 2 });
  // An abrupt cut leaves the final quarter second near full level. A clean end
  // rings down: the last 250 ms sits well under the track mean.
  const endingClean = whole.mean - last250.mean >= 8;
  const reasons: string[] = [];
  if (duration < minSeconds) reasons.push(`only ${duration.toFixed(2)}s`);
  if (deficit > FIRST_SECOND_TOLERANCE_DB) reasons.push(`first second ${deficit} dB under the mean`);
  if (leading && leading.duration > 0.1) reasons.push(`${leading.duration.toFixed(2)}s leading silence`);
  if (mid.length) reasons.push(`mid-track silence ${mid.map((s) => `${s.start.toFixed(1)}s+${s.duration.toFixed(1)}`).join(", ")}`);
  if (clip.flat > 1) reasons.push(`clipping, flat factor ${clip.flat}`);
  return {
    durationSeconds: Number(duration.toFixed(2)),
    firstSecond: { firstDb: first.mean, wholeDb: whole.mean, deficitDb: deficit, pass: deficit <= FIRST_SECOND_TOLERANCE_DB },
    leadingSilenceSeconds: leading ? Number(leading.duration.toFixed(2)) : 0,
    midSilences: mid,
    clipping: { flatFactor: clip.flat, peakDb: clip.peakDb, pass: clip.flat <= 1 },
    ending: { last250msDb: last250.mean, last2sDb: last2.mean, wholeDb: whole.mean, clean: endingClean },
    pass: reasons.length === 0,
    reasons,
  };
}

/**
 * Vocal check: ElevenLabs speech to text (scribe_v2) with audio event tagging.
 * A take with no singing or speech comes back with no word tokens, only audio
 * events such as (music). Any word token is a vocal suspect for a human ear.
 */
export async function vocalCheck(
  key: string,
  file: string,
): Promise<{ words: string[]; text: string; credits: number | null }> {
  const before = await usageSnapshot(key);
  const form = new FormData();
  form.append("model_id", "scribe_v2");
  form.append("tag_audio_events", "true");
  form.append("file", new Blob([fs.readFileSync(file)], { type: "audio/mpeg" }), path.basename(file));
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": key },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`speech-to-text ${res.status}: ${redact(text, key).slice(0, 400)}`);
  const json = JSON.parse(text) as { text?: string; words?: { text: string; type: string }[] };
  const words = (json.words ?? []).filter((w) => w.type === "word").map((w) => w.text);
  const { credits } = await creditsSince(key, before);
  return { words, text: json.text ?? "", credits };
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

async function generate(key: string, track: Track, take: number): Promise<string> {
  if (setCount() >= CAP) throw new Error(`Cap reached: ${CAP} "${SET}" generations logged. Stopping.`);
  const prompt = `${track.feel} ${INSTRUCTION}`;
  const lengthMs = LENGTH_SECONDS * 1000;
  const id = `music-w0928-${track.n}-${LENGTH_SECONDS}s${take > 1 ? `-take${take}` : ""}`;
  const file = path.join(RAW_DIR, `${id}.mp3`);
  console.log(`\n[music] ${id}  ${track.bpm} bpm, ${track.lead}, ${track.mood}`);

  const before = await usageSnapshot(key);
  const { bytes } = await apiPostAudio(key, "/v1/music", {
    prompt,
    music_length_ms: lengthMs,
    model_id: MUSIC_MODEL,
    output_format: MUSIC_FORMAT,
    force_instrumental: true,
  });
  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.writeFileSync(file, bytes);
  const { credits, bucket } = await creditsSince(key, before);
  console.log(`  wrote ${rel(file)}, credits ${credits ?? "not reported"}${bucket ? ` (${bucket})` : ""}`);
  assertUnderCreditAlarm(credits, id);

  const check = checkTake(file);
  console.log(`  check: ${check.pass ? "PASS" : `FAIL (${check.reasons.join("; ")})`}`);
  console.log(`  ${JSON.stringify(check)}`);

  appendGeneration({
    kind: "music",
    id,
    file: rel(file),
    prompt,
    model: MUSIC_MODEL,
    lengthMs,
    creditsMeasured: credits,
    creditsBucket: bucket,
    outputFormat: MUSIC_FORMAT,
    createdAt: new Date().toISOString(),
    accepted: check.pass,
    notes:
      `${track.mood}, ${track.lead}, about ${track.bpm} bpm. For the week of 2026-09-28, no narration. ` +
      (check.pass
        ? `Measured duration ${check.durationSeconds}s, ending ${check.ending.clean ? "rings out" : "cut close to full level"}.`
        : `Rejected: ${check.reasons.join("; ")}.`),
    firstSecondTest: {
      firstSecondMeanDb: check.firstSecond.firstDb,
      wholeTrackMeanDb: check.firstSecond.wholeDb,
      deficitDb: check.firstSecond.deficitDb,
      toleranceDb: FIRST_SECOND_TOLERANCE_DB,
      pass: check.firstSecond.pass,
    },
    set: SET,
  });

  if (check.pass) {
    fs.mkdirSync(CANDIDATE_DIR, { recursive: true });
    const candidate = path.join(CANDIDATE_DIR, `music-w0928-${track.n}.mp3`);
    fs.copyFileSync(file, candidate);
    console.log(`  copied to ${rel(candidate)}`);
  }
  return file;
}

async function main(): Promise<void> {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === "check" && arg) {
    console.log(JSON.stringify(checkTake(arg, 0), null, 2));
    return;
  }
  const key = readApiKey();
  if (cmd === "vocals" && arg) {
    const r = await vocalCheck(key, arg);
    console.log(JSON.stringify({ file: arg, wordCount: r.words.length, words: r.words.slice(0, 40), text: r.text.slice(0, 300), credits: r.credits }));
    return;
  }
  if (cmd === "gen" && arg) {
    const list = arg === "all" ? TRACKS : TRACKS.filter((t) => String(t.n) === arg);
    if (!list.length) throw new Error(`No track ${arg}`);
    for (const t of list) {
      const candidate = path.join(CANDIDATE_DIR, `music-w0928-${t.n}.mp3`);
      if (arg === "all" && fs.existsSync(candidate)) {
        console.log(`skip ${t.n}, ${rel(candidate)} exists`);
        continue;
      }
      const takes = loadConfig().generations.filter(
        (g) => g.set === SET && String(g.id).startsWith(`music-w0928-${t.n}-`),
      ).length;
      await generate(key, t, takes + 1);
    }
    return;
  }
  console.log("usage: gen <n|all> | check <mp3> | vocals <mp3>");
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
