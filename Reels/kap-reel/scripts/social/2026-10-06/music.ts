/**
 * scripts/social/2026-10-06/music.ts
 *
 * Two new music beds for Tuesday 2026-10-06 (week plan plans/2026-10-05.md):
 *   r  music-w1006-r  reel (folder 2026-10-06), funky clean guitar, upbeat
 *   c  music-w1006-c  carousel slide video (folder 2026-10-06-2), airy, bright, light percussion
 * Alex, 2026-09-25: no narration, and no music track reused within any 30-day period.
 *
 * A copy of scripts/social/2026-09-26-4/music.ts (same endpoint, model, format,
 * record shape and checks). Helpers from audio.ts are imported read-only.
 *
 * Run from D:kap-reel:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-06/music.ts gen r
 *   node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-06/music.ts gen c
 *
 * Each generation is appended to config/audio.json with set "social-w1006".
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

const SET = "social-w1006";
const MUSIC_MODEL = "music_v2";
const MUSIC_FORMAT = "mp3_48000_320";
const LENGTH_SECONDS = 32;
/** Per track: one take plus at most one regenerate. */
const CAP = 2;

type Track = { id: string; bpm: number; lead: string; mood: string; use: string; feel: string };

// Distinct from every bed in plans/2026-09-28-music.md, music-history.json and
// this week's other beds so far: no bass-led groove, ukulele, fingerpicked
// acoustic, mandolin, chorused arpeggios, driving eighth notes, stomps, hollow
// body tremolo, lap steel, twelve string, felt piano, Wurlitzer or 6/8 sway.
const TRACKS: Record<string, Track> = {
  r: {
    id: "music-w1006-r",
    bpm: 106,
    lead: "funky clean electric guitar, sixteenth note scratch rhythm, bluesy double stops, tight bass",
    mood: "funky, clean guitar, upbeat",
    use: "the Tuesday 2026-10-06 reel (2026-10-06, Your hero is a promise, not a photo)",
    feel:
      "Upbeat, funky indie pop instrumental at about 106 bpm in a bright major " +
      "key, guitar led. A clean, dry electric guitar plays a tight sixteenth note " +
      "funk scratch rhythm with crisp muted chord chops, a second clean electric " +
      "guitar answers with short bluesy double stop licks as the hook, a tight " +
      "round electric bass locks with the kick, crisp live drums with a steady " +
      "closed hi hat and a snappy snare, a light shaker. Feel good, confident and " +
      "a little cheeky, head nodding groove, clean and uncluttered, no horns, no " +
      "wah, no distortion.",
  },
  c: {
    id: "music-w1006-c",
    bpm: 98,
    lead: "airy open tuned acoustic guitar with harmonics, kalimba counter melody, light hand percussion",
    mood: "airy, bright, light percussion",
    use: "the Tuesday 2026-10-06 carousel slide video (2026-10-06-2, Above the fold)",
    feel:
      "Airy, bright indie pop instrumental at about 98 bpm in a major key, guitar " +
      "led. An open tuned steel string acoustic guitar strums lightly with ringing " +
      "open strings and chimes of natural harmonics as the hook, a clean electric " +
      "guitar with a soft slapback echo adds a few high melodic notes, a kalimba " +
      "plays a small bright counter melody, soft round bass, light percussion " +
      "only: shaker, rim clicks, a soft cajon and finger snaps, no heavy drums. " +
      "Open, fresh and weightless, like morning light through a clean window.",
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
