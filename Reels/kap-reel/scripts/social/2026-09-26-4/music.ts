/**
 * scripts/social/2026-09-26-4/music.ts
 *
 * One new music bed, id music-w0926-pilot, for the Saturday 2026-09-26 12:00 PM
 * carousel slide video (folder 2026-09-26-4, "Free social media management for
 * 3 Gainesville businesses"). Alex, 2026-09-25: no narration, and no music track
 * reused within any 30-day period.
 *
 * Same endpoint, model, format and record shape as music-week-0928.ts. The
 * take checks are that script's `check` command, run as a child process so its
 * main() is not triggered by an import. Helpers from audio.ts are imported
 * read-only.
 *
 * Run from D:\kap-reel:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-09-26-4/music.ts gen
 *
 * The generation is appended to config/audio.json with set "social-w0926-pilot"
 * and its measured credits. The take lands in
 * assets/audio/raw/music-w0926-pilot-32s.mp3 (take2 suffix on a regenerate) and,
 * if it passes, is copied to out/candidates/music-w0926-pilot.mp3; that basename
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
} from "../../audio.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const RAW_DIR = path.join(ROOT, "assets", "audio", "raw");
const CANDIDATE_DIR = path.join(ROOT, "out", "candidates");
const AUDIO_JSON = path.join(ROOT, "config", "audio.json");

const TRACK_ID = "music-w0926-pilot";
const SET = "social-w0926-pilot";
const MUSIC_MODEL = "music_v2";
const MUSIC_FORMAT = "mp3_48000_320";
const LENGTH_SECONDS = 32;
/** One track plus at most one regenerate. */
const CAP = 2;

const BPM = 112;
const LEAD = "chiming twelve string electric riff, palm muted rhythm guitar, warm organ";
const MOOD = "upbeat, warm, welcoming";

// Distinct from every bed in plans/2026-09-28-music.md and music-history.json:
// no bass-led groove, ukulele, fingerpicked acoustic, mandolin, chorused
// arpeggios, driving eighth notes, stomps, hollow body tremolo, lap steel,
// felt piano or analog synth pulse. The lead here is a chiming twelve string.
const FEEL =
  "Upbeat, warm indie pop instrumental at about 112 bpm in a bright major " +
  "key, guitar led. A chiming twelve string electric guitar plays a catchy, " +
  "open, ringing riff as the main hook, a second clean electric guitar keeps " +
  "a light palm muted eighth note rhythm, a warm vintage organ holds soft " +
  "chords underneath, a melodic electric bass, crisp live drums with a " +
  "tambourine on every beat. Friendly, optimistic and inviting, like a local " +
  "shop opening its doors on a sunny Saturday morning.";

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
      `${MOOD}, ${LEAD}, about ${BPM} bpm. For the Saturday 2026-09-26 social pilot carousel slide video (2026-09-26-4), no narration. ` +
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
