/**
 * scripts/social/2026-10-03/music.ts
 *
 * One new music bed, id music-w1003, for the Saturday 2026-10-03 carousel
 * slide video ("Tab through your website", folder 2026-10-03). Alex's rules
 * from 2026-09-25 apply: no narration, and no track reused within 30 days, so
 * this is a fresh track.
 *
 * Copied from scripts/social/music-w0925-sat.ts (same endpoint, model,
 * format, instruction, take checks and audio.json record shape), with the
 * helpers from scripts/audio.ts imported read-only.
 *
 * Run from D:\kap-reel:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-03/music.ts gen
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-03/music.ts check <mp3>
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-03/music.ts vocals <mp3>
 *
 * Every billable generation is appended to config/audio.json with set
 * "social-w1003". The take lands in assets/audio/raw/music-w1003-32s.mp3
 * and, if it passes, is copied to out/candidates/music-w1003.mp3.
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
} from "../../audio.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const RAW_DIR = path.join(ROOT, "assets", "audio", "raw");
const CANDIDATE_DIR = path.join(ROOT, "out", "candidates");
const AUDIO_JSON = path.join(ROOT, "config", "audio.json");

const SET = "social-w1003";
const TRACK_ID = "music-w1003";
const MUSIC_MODEL = "music_v2";
const MUSIC_FORMAT = "mp3_48000_320";
const LENGTH_SECONDS = 32;
/** One track plus at most one regenerate. */
const CAP = 2;
const FIRST_SECOND_TOLERANCE_DB = 6;

/** Same instruction as music-week-0928.ts. */
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

type Track = { bpm: number; lead: string; mood: string; feel: string };

/**
 * Brief mood: bright Saturday midday, jangly clean electric guitar, easy tempo.
 * Kept apart from its nearest neighbors: music-i-a (jangly electrics with
 * handclaps, 120 bpm), music-w0926-pilot (twelve string electric riff, palm
 * muted rhythm, organ), music-w1005-c (twelve string acoustic, twangy lead),
 * music-w0925-sat (lap steel shuffle) and music-w1009-r (surf riff, claps).
 * So: one six string clean electric ringing open chord arpeggios, a second
 * clean electric answering with a short slide-free melody, no twelve string,
 * no claps, no keys, no organ, slower at about 94 bpm with a straight feel.
 */
const TRACK: Track = {
  bpm: 94,
  lead: "jangly clean electric open-chord arpeggios, answering clean electric melody, tambourine",
  mood: "bright Saturday midday, easy tempo",
  feel:
    "Bright, easygoing indie pop instrumental at about 94 bpm in a major key " +
    "with a straight, relaxed groove. A jangly clean electric guitar rings " +
    "open chord arpeggios with a bright, chiming top end and a touch of room " +
    "reverb, a second clean electric guitar answers with a short, sunny, " +
    "singable melody, a warm round bass line, a light drum kit with a soft " +
    "kick, a crisp snare and a tambourine on the backbeat. No handclaps, no " +
    "twelve string, no acoustic guitar, no piano, no organ, no keyboards, no " +
    "synths. Unhurried and sunny, like a clear Saturday at noon with the " +
    "windows open.",
};

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

async function generate(key: string, take: number): Promise<string> {
  if (setCount() >= CAP) throw new Error(`Cap reached: ${CAP} "${SET}" generations logged. Stopping.`);
  const prompt = `${TRACK.feel} ${INSTRUCTION}`;
  const lengthMs = LENGTH_SECONDS * 1000;
  const id = `${TRACK_ID}-${LENGTH_SECONDS}s${take > 1 ? `-take${take}` : ""}`;
  const file = path.join(RAW_DIR, `${id}.mp3`);
  console.log(`\n[music] ${id}  ${TRACK.bpm} bpm, ${TRACK.lead}, ${TRACK.mood}`);

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
      `${TRACK.mood}, ${TRACK.lead}, about ${TRACK.bpm} bpm. For the Sat 2026-10-03 carousel slide video (2026-10-03), no narration.` +
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
    const candidate = path.join(CANDIDATE_DIR, `${TRACK_ID}.mp3`);
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
  if (cmd === "gen") {
    const candidate = path.join(CANDIDATE_DIR, `${TRACK_ID}.mp3`);
    if (fs.existsSync(candidate)) {
      console.log(`skip, ${rel(candidate)} exists`);
      return;
    }
    await generate(key, setCount() + 1);
    return;
  }
  console.log("usage: gen | check <mp3> | vocals <mp3>");
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
