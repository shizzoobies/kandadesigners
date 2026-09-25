/**
 * scripts/social/2026-10-04/music.ts
 *
 * One new music bed, id music-w1004, for the Sunday 2026-10-04 6:00 PM carousel
 * slide video (folder 2026-10-04, "What a month of posts looks like"). Alex,
 * 2026-09-25: no narration, and no music track reused within any 30-day period.
 *
 * Same endpoint, model, format and record shape as music-week-0928.ts. The
 * take checks are that script's `check` command, run as a child process so its
 * main() is not triggered by an import. Helpers from audio.ts are imported
 * read-only.
 *
 * Run from D:\kap-reel:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-04/music.ts gen
 *
 * The generation is appended to config/audio.json with set "social-w1004"
 * and its measured credits. The take lands in
 * assets/audio/raw/music-w1004-32s.mp3 (take2 suffix on a regenerate) and,
 * if it passes, is copied to out/candidates/music-w1004.mp3; that basename
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

const TRACK_ID = "music-w1004";
const SET = "social-w1004";
const MUSIC_MODEL = "music_v2";
const MUSIC_FORMAT = "mp3_48000_320";
const LENGTH_SECONDS = 32;
/** One track plus at most one regenerate. */
const CAP = 2;

const BPM = 84;
const LEAD = "warm steel string acoustic melody in a swaying 6/8, soft Wurlitzer electric piano, brushed snare";
const MOOD = "mellow Sunday evening";

// Distinct from every bed in plans/2026-09-28-music.md, music-history.json and
// the weekend beds in config/audio.json: no felt piano, capo strums or upright
// bass (the Sept 27 Sunday bed), no fingerpicked acoustic over a pad, ukulele,
// mandolin, twelve string, lap steel, organ, hollow body tremolo or synth
// pulse. This one sways in 6/8 with a Wurlitzer and brushes.
const FEEL =
  "Mellow, warm indie folk pop instrumental at about 84 bpm in a gentle, " +
  "swaying 6/8 feel, in a warm major key, guitar led. A warm steel string " +
  "acoustic guitar plays a simple, hummable melody on the lower strings with " +
  "soft hammer ons, a second acoustic guitar strums lightly in 6/8, a soft " +
  "Wurlitzer electric piano holds mellow chords and answers the melody, a " +
  "round warm bass, brushed snare and a soft kick. Relaxed, settled and " +
  "hopeful, like a quiet Sunday evening on the porch, looking over the month " +
  "ahead.";

const INSTRUCTION =
  "Clean intro: the guitar, keys and brushes start on the very first beat, no " +
  "fade in, no long build, no silence at the start. Fully instrumental, no " +
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
      `${MOOD}, ${LEAD}, about ${BPM} bpm. For the Sunday 2026-10-04 carousel slide video (2026-10-04, What a month of posts looks like), no narration. ` +
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
