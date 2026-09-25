/**
 * scripts/social/music-w0925-sun.ts
 *
 * One new music bed, id music-w0925-sun, for the Sunday 2026-09-27 6:00 PM
 * carousel slide video ("3 prompts to plan your week with AI"). Alex,
 * 2026-09-25: no narration, and no music track reused within any 30-day period.
 *
 * Same endpoint, model, format and record shape as music-week-0928.ts. The
 * take checks are that script's `check` command, run as a child process so its
 * main() is not triggered by an import. Helpers from audio.ts are imported
 * read-only.
 *
 * Run from D:\kap-reel:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/music-w0925-sun.ts gen
 *
 * The generation is appended to config/audio.json with set "social-w0925-sun"
 * and its measured credits. The take lands in
 * assets/audio/raw/music-w0925-sun-32s.mp3 (take2 suffix on a regenerate) and,
 * if it passes, is copied to out/candidates/music-w0925-sun.mp3; that basename
 * is the track id the social tools record in post.json.
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
} from "../audio.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const RAW_DIR = path.join(ROOT, "assets", "audio", "raw");
const CANDIDATE_DIR = path.join(ROOT, "out", "candidates");
const AUDIO_JSON = path.join(ROOT, "config", "audio.json");

const TRACK_ID = "music-w0925-sun";
const SET = "social-w0925-sun";
const MUSIC_MODEL = "music_v2";
const MUSIC_FORMAT = "mp3_48000_320";
const LENGTH_SECONDS = 32;
/** One track plus at most one regenerate. */
const CAP = 2;

const BPM = 78;
const LEAD = "felt piano motif, soft capo acoustic strums, upright bass";
const MOOD = "calm, reflective Sunday evening";

const FEEL =
  "Calm, reflective acoustic indie instrumental at about 78 bpm in a warm " +
  "major key, for a quiet Sunday evening. A soft felt piano plays a simple, " +
  "hopeful four note motif, a steel string acoustic guitar with a capo " +
  "strums gently and sparsely underneath, a round upright bass walks slowly, " +
  "soft brushed snare and a low tom pulse, a faint warm vibraphone answers " +
  "the piano now and then. Unhurried, settled and quietly optimistic, like " +
  "clearing the kitchen table and planning the week ahead as the light goes " +
  "gold.";

const INSTRUCTION =
  "Clean intro: the piano and guitar start on the very first beat, no fade " +
  "in, no long build, no silence at the start. Fully instrumental, no " +
  "vocals, no vocal chops, no humming, no oohs, no whistling, no spoken word, " +
  "no lyrics. No drop, no riser, no sweep, no impact hit, no breakdown or " +
  "pause in the middle. Steady, gentle energy the whole way through so any " +
  "fifteen second window stands on its own. It carries a short social video " +
  "with on-screen text and no voiceover, so keep the arrangement uncluttered. " +
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
    [path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs"), path.join(HERE, "music-week-0928.ts"), "check", file],
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
  const [cmd] = process.argv.slice(2);
  if (cmd !== "gen") {
    console.log("usage: gen");
    return;
  }
  const done = loadConfig().generations.filter((g) => g.set === SET).length;
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
      `${MOOD}, ${LEAD}, about ${BPM} bpm. For the Sunday 2026-09-27 carousel slide video, no narration. ` +
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
