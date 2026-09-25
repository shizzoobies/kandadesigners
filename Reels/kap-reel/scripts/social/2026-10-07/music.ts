/**
 * scripts/social/2026-10-07/music.ts
 *
 * Two new music beds for Wednesday 2026-10-07 (week plan plans/2026-10-05.md):
 *   r  music-w1007-r  reel (folder 2026-10-07), calm, focused, fingerpicked guitar
 *   c  music-w1007-c  carousel slide video (folder 2026-10-07-2), warm, gentle keys and guitar
 * Alex, 2026-09-25: no narration, and no music track reused within any 30-day period.
 *
 * A copy of scripts/social/2026-10-06/music.ts (same endpoint, model, format,
 * record shape and checks). Helpers from audio.ts are imported read-only.
 *
 * Run from D:kap-reel:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-07/music.ts gen r
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-07/music.ts gen c
 *
 * Each generation is appended to config/audio.json with set "social-w1007".
 * Takes land in assets/audio/raw/<id>-32s.mp3 (take2 suffix on a regenerate) and,
 * if they pass, are copied to out/candidates/<id>.mp3.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  apiPostAudio,
  assertUnderCreditAlarm,
  creditsSince,
  readApiKey,
  rel,
  usageSnapshot,
} from "../../audio.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const RAW_DIR = path.join(ROOT, "assets", "audio", "raw");
const CANDIDATE_DIR = path.join(ROOT, "out", "candidates");
const AUDIO_JSON = path.join(ROOT, "config", "audio.json");

const SET = "social-w1007";
const MUSIC_MODEL = "music_v2";
const MUSIC_FORMAT = "mp3_48000_320";
const LENGTH_SECONDS = 32;
/** Per track: one take plus at most one regenerate. */
const CAP = 2;

type Track = { id: string; bpm: number; lead: string; mood: string; use: string; feel: string };

// Distinct from every bed in plans/2026-09-28-music.md, music-history.json and
// this week's other beds (config/audio.json, sets social-w1003 to social-w1009):
// no acoustic over a synth pad (w0928-3), no strummed nylon (w0928-4), no
// Wurlitzer, Rhodes, felt piano or electric piano, no twelve string, no funk
// scratch, no kalimba, no pizzicato, no surf or spring reverb riff.
const TRACKS: Record<string, Track> = {
  r: {
    id: "music-w1007-r",
    bpm: 90,
    lead: "Travis picked clean electric guitar on the neck pickup, baritone guitar melody, upright bass, brushes",
    mood: "calm, focused, fingerpicked guitar",
    use: "the Wednesday 2026-10-07 reel (2026-10-07, When a job aid beats a course)",
    feel:
      "Calm, focused indie instrumental at about 90 bpm in a warm major key, " +
      "guitar led. A clean electric guitar on the neck pickup plays a steady " +
      "fingerpicked Travis pattern with an alternating thumb bass as the bed, a " +
      "baritone guitar plays a simple low, singing melody as the hook, a soft " +
      "upright bass, brushed snare with a gentle kick and a light shaker. No " +
      "synth pad, no strings, no piano. Clear headed and unhurried, like " +
      "careful work at a tidy bench, still gently moving forward.",
  },
  c: {
    id: "music-w1007-c",
    bpm: 86,
    lead: "warm grand piano chords, soft celesta motif, singing clean electric guitar melody, brushed drums",
    mood: "warm, gentle keys and guitar",
    use: "the Wednesday 2026-10-07 carousel slide video (2026-10-07-2, Course, job aid, or neither?)",
    feel:
      "Warm, gentle indie pop instrumental at about 86 bpm in a major key. A " +
      "softly played acoustic grand piano holds warm, open chords in a steady " +
      "pulse, a celesta adds a small bright motif, a clean electric guitar with " +
      "a light chorus plays long, singing melody notes as the hook, a round " +
      "soft bass, brushed drums and a quiet shaker. Kind, reassuring and " +
      "thoughtful, like a helpful colleague walking you through a decision.",
  },
};

const INSTRUCTION =
  "Clean intro: the guitars and drums start on the very first beat, no fade " +
  "in, no long build, no silence at the start. Fully instrumental, no " +
  "vocals, no vocal chops, no humming, no oohs, no whistling, no spoken word, " +
  "no lyrics. No drop, no riser, no sweep, no impact hit, no breakdown or " +
  "pause in the middle. Steady, upbeat energy the whole way through so any " +
  "fifteen second window stands on its own. It carries a short social video " +
  "with on-screen text and no voiceover, so a simple catchy instrumental " +
  "hook is welcome, but keep the arrangement uncluttered. " +
  "End cleanly: resolve on a final chord that rings out over the last two " +
  "seconds, no abrupt cut. Clean, warm modern indie production, plenty of " +
  "headroom, no clipping.";

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

type Check = {
  durationSeconds: number;
  firstSecond: { firstDb: number; wholeDb: number; deficitDb: number; pass: boolean };
  ending: { clean: boolean };
  pass: boolean;
  reasons: string[];
};

function checkTake(file: string): Check {
  const res = spawnSync(
    process.execPath,
    [path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs"), path.join(HERE, "..", "music-week-0928.ts"), "check", file],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  if (res.status !== 0) throw new Error(`check failed: ${res.stderr}`);
  const c = JSON.parse(res.stdout) as Check;
  // The check command runs with minSeconds 0; apply the 30 second floor here.
  if (c.durationSeconds < 30) {
    c.reasons.push(`only ${c.durationSeconds}s`);
    c.pass = false;
  }
  return c;
}

async function main(): Promise<void> {
  const [cmd, which] = process.argv.slice(2);
  const track = TRACKS[which ?? ""];
  if (cmd !== "gen" || !track) {
    console.log("usage: gen r|c");
    return;
  }
  const { id: TRACK_ID, bpm: BPM, lead: LEAD, mood: MOOD, feel: FEEL } = track;
  const done = loadConfig().generations.filter((g) => g.set === SET && String(g.id).startsWith(`${TRACK_ID}-`)).length;
  if (done >= CAP) throw new Error(`Cap reached: ${CAP} "${SET}" generations logged. Stopping.`);
  const key = readApiKey();
  const take = done + 1;
  const id = `${TRACK_ID}-${LENGTH_SECONDS}s${take > 1 ? `-take${take}` : ""}`;
  const file = path.join(RAW_DIR, `${id}.mp3`);
  const prompt = `${FEEL} ${INSTRUCTION}`;
  const lengthMs = LENGTH_SECONDS * 1000;
  console.log(`[music] ${id}  ${BPM} bpm, ${LEAD}, ${MOOD}`);

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
      `${MOOD}, ${LEAD}, about ${BPM} bpm. For ${track.use}, no narration. ` +
      (check.pass
        ? `Measured duration ${check.durationSeconds}s, ending ${check.ending.clean ? "rings out" : "cut close to full level"}.`
        : `Rejected: ${check.reasons.join("; ")}.`),
    firstSecondTest: {
      firstSecondMeanDb: check.firstSecond.firstDb,
      wholeTrackMeanDb: check.firstSecond.wholeDb,
      deficitDb: check.firstSecond.deficitDb,
      toleranceDb: 6,
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
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
