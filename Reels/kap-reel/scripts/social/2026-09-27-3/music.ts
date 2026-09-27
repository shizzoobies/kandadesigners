/**
 * scripts/social/2026-09-27-3/music.ts
 *
 * A new music bed for the Sun 2026-09-27 7:30 PM LinkedIn video, "ADDIE got a
 * G" (folder 2026-09-27-3): music-w0927-li. Alex, 2026-09-25: no narration,
 * and no music track reused within any 30-day period. New and distinct from
 * music-history.json and every post.json music field.
 *
 * A copy of scripts/social/2026-10-09/music.ts (same endpoint, model, format,
 * record shape and take checks). Helpers from audio.ts are imported read-only.
 *
 * Run from D:kap-reel:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-09-27-3/music.ts gen li
 *
 * Each generation is appended to config/audio.json with set "social-w0927".
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

const SET = "social-w0927";
const MUSIC_MODEL = "music_v2";
const MUSIC_FORMAT = "mp3_48000_320";
const LENGTH_SECONDS = 34;
/** Per track: one take plus at most one regenerate. */
const CAP_PER_TRACK = 2;

type Track = { id: string; bpm: number; lead: string; mood: string; use: string; feel: string };

// Distinct from every bed already used: no mandolin, ukulele, surf guitar,
// handclaps, congas, marimba, pizzicato, glockenspiel, kalimba or synth pluck.
// A clavinet and xylophone lead with woodblock ticks that suit a flipping
// split-flap board.
const TRACKS: Record<string, Track> = {
  li: {
    id: "music-w0927-li",
    bpm: 116,
    lead: "funky muted clavinet riff, bright xylophone melody, woodblock ticks, round synth bass",
    mood: "playful, light, clockwork bounce",
    use: "the Sun 2026-09-27 LinkedIn video, ADDIE got a G (folder 2026-09-27-3)",
    feel:
      "Upbeat, light and playful modern instrumental at about 116 bpm in a bright " +
      "major key. A tight, funky muted clavinet riff is the hook, a bright " +
      "xylophone answers with a short catchy melody, crisp woodblock and rimshot " +
      "ticks on the sixteenths like a clockwork mechanism, a round, bouncy synth " +
      "bass, and a clean, dry modern drum kit with a light kick and snappy snare. " +
      "Clever and cheerful, a little quirky, like letters clicking into place on " +
      "a train station departure board.",
  },
};

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
  "modern production, plenty of headroom, no clipping.";

type Json = Record<string, unknown>;

function loadConfig(): Json & { generations: Json[] } {
  const parsed = JSON.parse(fs.readFileSync(AUDIO_JSON, "utf8"));
  parsed.generations = parsed.generations ?? [];
  return parsed;
}

/** Read, append, write in one step so a parallel writer's record is kept. */
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
  if (c.durationSeconds < 30) {
    c.reasons.push(`only ${c.durationSeconds}s`);
    c.pass = false;
  }
  return c;
}

async function main(): Promise<void> {
  const [cmd, which] = process.argv.slice(2);
  const track = which ? TRACKS[which] : undefined;
  if (cmd !== "gen" || !track) {
    console.log("usage: gen li");
    return;
  }
  const done = loadConfig().generations.filter(
    (g) => g.set === SET && String(g.id).startsWith(`${track.id}-`),
  ).length;
  if (done >= CAP_PER_TRACK) throw new Error(`Cap reached: ${CAP_PER_TRACK} generations of ${track.id} logged. Stopping.`);
  const key = readApiKey();
  const take = done + 1;
  const id = `${track.id}-${LENGTH_SECONDS}s${take > 1 ? `-take${take}` : ""}`;
  const file = path.join(RAW_DIR, `${id}.mp3`);
  const prompt = `${track.feel} ${INSTRUCTION}`;
  const lengthMs = LENGTH_SECONDS * 1000;
  console.log(`[music] ${id}  ${track.bpm} bpm, ${track.lead}, ${track.mood}`);

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
      `${track.mood}, ${track.lead}, about ${track.bpm} bpm. For ${track.use}, no narration. ` +
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
    const candidate = path.join(CANDIDATE_DIR, `${track.id}.mp3`);
    fs.copyFileSync(file, candidate);
    console.log(`  copied to ${rel(candidate)}`);
  }
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
