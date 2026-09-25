/**
 * scripts/social/2026-10-09/music.ts
 *
 * Two new music beds for Fri 2026-10-09 (behind the scenes, "How we plan a week
 * of posts"):
 *   music-w1009-r  the 10:30 AM reel (folder 2026-10-09)
 *   music-w1009-c  the 4:00 PM carousel slide video (folder 2026-10-09-2)
 * Alex, 2026-09-25: no narration, and no music track reused within any 30-day
 * period. Both are new and distinct from plans/2026-09-28-music.md,
 * music-history.json and the other beds made for the week of Oct 5.
 *
 * A copy of scripts/social/2026-10-08/music.ts (same endpoint, model, format,
 * record shape and take checks). Helpers from audio.ts are imported read-only.
 *
 * Run from D:kap-reel:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-09/music.ts gen r
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-09/music.ts gen c
 *
 * Each generation is appended to config/audio.json with set "social-w1009".
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

const SET = "social-w1009";
const MUSIC_MODEL = "music_v2";
const MUSIC_FORMAT = "mp3_48000_320";
const LENGTH_SECONDS = 32;
/** Per track: one take plus at most one regenerate. */
const CAP_PER_TRACK = 2;

type Track = { id: string; bpm: number; lead: string; mood: string; use: string; feel: string };

// Distinct from every bed already used: not the w0928-4 picked mandolin over
// nylon strums, not the w0928-5 chorused arpeggios with a synth pluck, not
// ukulele, lap steel, twelve string, stomps or driving eighth notes.
const TRACKS: Record<string, Track> = {
  r: {
    id: "music-w1009-r",
    bpm: 122,
    lead: "surf-tinged clean electric riff with spring reverb, acoustic strums, handclaps, upright piano stabs",
    mood: "upbeat, handclaps, happy Friday",
    use: "the Fri 2026-10-09 reel (folder 2026-10-09)",
    feel:
      "Upbeat, sunny indie pop instrumental at about 122 bpm in a bright major key. " +
      "A bouncy, surf-tinged clean electric guitar riff drenched in spring reverb " +
      "is the hook, a strummed acoustic guitar keeps a steady shuffle, bright " +
      "upright piano stabs on the offbeats, a bouncing melodic bass, crisp live " +
      "drums with big group handclaps on every backbeat and a tambourine. Happy, " +
      "carefree Friday energy, like the last hour of a good week with the " +
      "windows open.",
  },
  c: {
    id: "music-w1009-c",
    bpm: 108,
    lead: "groovy round electric bass, bright clean guitar hook with light phaser, congas",
    mood: "groovy bass and bright guitar",
    use: "the Fri 2026-10-09 carousel slide video (folder 2026-10-09-2)",
    feel:
      "Groovy, feel good indie pop instrumental at about 108 bpm in a major key. " +
      "A round, melodic electric bass groove with octave jumps leads the song, a " +
      "bright, sparkling clean electric guitar plays a short catchy hook with a " +
      "light phaser, a second guitar strums open chords on the downbeats, congas " +
      "and a shaker, tight dry kick and snare. Laid back and confident, a little " +
      "retro, like a well organized workshop humming along on a Friday afternoon.",
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
    console.log("usage: gen r|c");
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
