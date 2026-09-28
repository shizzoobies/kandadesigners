/**
 * scripts/youtube/l1/music.ts
 *
 * The music bed for YouTube L1, "Test your website with one key" (folder
 * 2026-10-02-4, publishes Fri 2026-10-02 11:00 AM): music-yt-l1. Task A3 in
 * Social Media Management/plans/youtube-2026-09-28/SPEC.md, "Long-form" step 4,
 * and video-1-tab-key.md section 7: a new calm ElevenLabs bed, no vocals,
 * mixed low under the narration and lifted for the 20 second end screen.
 *
 * Same endpoint, model, format and no-vocals instruction as
 * scripts/social/music-week-0928.ts and scripts/social/2026-09-29-4/music.ts,
 * with an instruction rewritten for a long bed under a voice: steady from start
 * to finish, room in the midrange, no sections that jump out. The API takes
 * music_length_ms up to 600000 (scripts/audio.ts, confirmed 2026-09-03), so the
 * whole bed is one call of LENGTH_SECONDS, long enough to cover the cut; no
 * loop or join is needed.
 *
 * Two candidates with different instruments, so Alex can pick in one listen:
 *   a  vibraphone, warm pads, mellow bass, brushed shaker, about 84 bpm
 *   b  filtered synth arpeggio, pads, sub bass, soft kick and hat, about 90 bpm
 *
 * Checks per take:
 *   - the music-week-0928.ts take check (run as a child process, because that
 *     file runs its CLI on import): duration, first second energy, leading
 *     and mid-track silence, clipping, a clean ending
 *   - level over time: short-term loudness in 10 second blocks, so a build, a
 *     drop or a breakdown anywhere in six minutes shows up as a number
 *   - vocals: music-week-0928.ts vocals (scribe_v2 with audio event tags); any
 *     transcribed word is a vocal suspect
 *
 * Run from D:\kap-reel (never npx):
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/music.ts gen a|b
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/music.ts check <mp3>
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/music.ts vocals <mp3>
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/music.ts trim b 21.346
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/music.ts choose a|b
 *
 * trim cuts a take's opening at the given second (candidate b came back with a
 * 21 second pad intro despite the instruction; the groove enters on a
 * downbeat at 21.36s, just after a quiet dip at 21.346s).
 *
 * choose copies the pick to music/music-yt-l1.mp3 (the file name is the track
 * id) and appends the track to Social Media Management/music-history.json,
 * dated for the 2026-10-02 publish.
 *
 * Every generation is appended to config/audio.json with set "youtube-l1" and
 * its measured credits, the record shape audio.ts writes. The music POST is
 * sent once with no automatic retry: a six minute take can take a while, and a
 * retried request after a client timeout would be billed twice.
 *
 * The API key is read by scripts/audio.ts from .env or ELEVENLABS_API_KEY and
 * is never printed or written anywhere.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { creditsSince, ffmpeg, probeDuration, readApiKey, redact, usageSnapshot } from "../../audio.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const OUT = path.join(ROOT, "public", "youtube", "l1", "audio");
const MUSIC_DIR = path.join(OUT, "music");
const AUDIO_JSON = path.join(ROOT, "config", "audio.json");
const WEEK_SCRIPT = path.join(ROOT, "scripts", "social", "music-week-0928.ts");
const TSX = path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs");
const MUSIC_HISTORY = "D:/K & A Performance Site/Social Media Management/music-history.json";

const SET = "youtube-l1";
const TRACK_ID = "music-yt-l1";
const MUSIC_MODEL = "music_v2";
const MUSIC_FORMAT = "mp3_48000_320";
/**
 * Six and a half minutes. The kept narration measures 5:16 (voice.json); with
 * the pauses between beats, the held checklist in beat 11 and the 20 second
 * end screen the cut lands about 5:45 to 5:55, so 6:30 covers it with room to
 * spare. The editor starts the bed at 0:00 and fades it out at the end.
 */
const LENGTH_SECONDS = 390;
/** Two candidates, plus at most one regenerate each. */
const CAP = 4;
/**
 * The 30 to 34 second beds cost about 875 credits, about 27 a second, so 6:30
 * should be about 10,700. audio.ts stops at 5,000 for a 20 second phase; this
 * stops the run if one take costs nearly double the estimate.
 */
const CREDIT_ALARM = 20000;

const INSTRUCTION =
  "Fully instrumental, no vocals, no vocal chops, no humming, no oohs, no " +
  "whistling, no spoken word, no lyrics. This is a background bed under a " +
  "spoken voiceover in a six minute how-to video, so it stays calm, steady " +
  "and unobtrusive from start to finish: the same gentle groove, tempo, key " +
  "and texture the whole way through, evolving only very slightly, like a " +
  "seamless loop. Leave space in the midrange where a voice sits: no busy " +
  "lead melody, no solos, no prominent hook competing for attention. No key " +
  "change, no tempo change, no drop, no riser, no sweep, no impact hit, no " +
  "big build, no breakdown, no pause or silence anywhere in the middle, and " +
  "no section noticeably louder or quieter than the rest. Soft clean start: " +
  "the groove is there from the first beat, no long fade in, no silence at " +
  "the start. End cleanly: resolve on a final chord that rings out over the " +
  "last few seconds, no abrupt cut. Warm, clean modern production, plenty of " +
  "headroom, no clipping.";

type Candidate = { key: string; bpm: number; lead: string; mood: string; feel: string };

const CANDIDATES: Record<string, Candidate> = {
  a: {
    key: "a",
    bpm: 84,
    lead: "soft vibraphone chords, warm analog pads, mellow electric bass, brushed shaker and rim click",
    mood: "calm, warm, focused",
    feel:
      "Calm, warm, steady downtempo instrumental at about 84 bpm in a relaxed " +
      "major key. A soft vibraphone plays sparse, gentle chords and a simple " +
      "recurring two note figure, warm analog synth pads hold the harmony " +
      "underneath, a round, mellow electric bass keeps a slow steady pulse, and " +
      "very light percussion keeps time: a soft brushed shaker and a quiet rim " +
      "click, no loud drums. Friendly, clear headed and focused, like a quiet, " +
      "sunny studio in the afternoon.",
  },
  b: {
    key: "b",
    bpm: 90,
    lead: "gently filtered synth arpeggio, warm evolving pads, mellow sub bass, soft muted kick and ticking hat",
    mood: "calm, clear, quietly optimistic",
    feel:
      "Calm, warm, steady ambient electronic instrumental at about 90 bpm in a " +
      "soft major key. A gently filtered synth arpeggio ripples quietly and " +
      "evenly in the background, warm evolving pads carry the harmony, a " +
      "mellow sub bass holds the root, and a soft muted kick with a light, " +
      "ticking closed hi hat keeps a steady pulse. Clear, modern and quietly " +
      "optimistic, like a calm walkthrough of a well built website.",
  },
};

const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join("/");

// ---------------------------------------------------------------------------
// config/audio.json, appended the way audio.ts appends
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>;

function loadConfig(): Json & { generations: Json[] } {
  const parsed = JSON.parse(fs.readFileSync(AUDIO_JSON, "utf8"));
  parsed.generations = parsed.generations ?? [];
  return parsed;
}

/** Read, change, write in one step so a parallel writer's record is kept. */
function updateConfig(change: (c: Json & { generations: Json[] }) => void): void {
  const config = loadConfig();
  change(config);
  fs.writeFileSync(AUDIO_JSON, `${JSON.stringify(config, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** One POST, no retry, no client timeout short of fifteen minutes. */
function postOnce(key: string, route: string, body: unknown): Promise<Buffer> {
  const payload = Buffer.from(JSON.stringify(body));
  return new Promise((resolve, reject) => {
    const req = https.request(
      `https://api.elevenlabs.io${route}`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "content-type": "application/json", "content-length": payload.length },
        timeout: 15 * 60 * 1000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const bytes = Buffer.concat(chunks);
          if ((res.statusCode ?? 0) >= 300) {
            reject(new Error(`POST ${route} returned ${res.statusCode}: ${redact(bytes.toString("utf8").slice(0, 800), key)}`));
          } else if (bytes.length < 2000) {
            reject(new Error(`POST ${route} returned only ${bytes.length} bytes: ${redact(bytes.toString("utf8"), key)}`));
          } else resolve(bytes);
        });
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error(`POST ${route} timed out after 15 minutes`)));
    req.on("error", reject);
    req.end(payload);
  });
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

function runWeekScript(args: string[]): string {
  const res = spawnSync(process.execPath, [TSX, WEEK_SCRIPT, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0) throw new Error(`music-week-0928.ts ${args[0]} failed: ${res.stderr}`);
  return res.stdout;
}

type TakeCheck = {
  durationSeconds: number;
  firstSecond: { firstDb: number; wholeDb: number; deficitDb: number; pass: boolean };
  leadingSilenceSeconds: number;
  midSilences: { start: number; end: number; duration: number }[];
  clipping: { flatFactor: number; peakDb: number; pass: boolean };
  ending: { last250msDb: number; last2sDb: number; wholeDb: number; clean: boolean };
  pass: boolean;
  reasons: string[];
};

type LevelCheck = {
  integratedLufs: number;
  truePeakDbtp: number;
  lra: number;
  blocks: { from: number; shortTermLufs: number }[];
  medianBlockLufs: number;
  lowestBlock: { from: number; belowMedianDb: number };
  highestBlock: { from: number; aboveMedianDb: number };
  steady: boolean;
  gainToMinus26Db: number;
};

/**
 * Short-term loudness (3 s window, ebur128) sampled every 100 ms, reduced to
 * the median of each 10 second block. The opening 5 s and the closing 10 s are
 * left out of the steadiness test, since the ring-out is meant to fall away.
 */
function levelCheck(file: string): LevelCheck {
  const { stderr } = ffmpeg(["-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const samples: { t: number; s: number }[] = [];
  for (const line of stderr.split(/\r?\n/)) {
    const m = /t:\s*([\d.]+)\s+.*?S:\s*(-?[\d.]+|-inf)/.exec(line);
    if (m && m[2] !== "-inf") samples.push({ t: Number(m[1]), s: Number(m[2]) });
  }
  const summary = stderr.slice(stderr.lastIndexOf("Summary:"));
  const integratedLufs = Number(/I:\s*(-?[\d.]+) LUFS/.exec(summary)?.[1] ?? NaN);
  const lra = Number(/LRA:\s*([\d.]+) LU/.exec(summary)?.[1] ?? NaN);
  const truePeakDbtp = Number(/True peak:\s*Peak:\s*(-?[\d.]+|-inf) dBFS/.exec(summary)?.[1] ?? NaN);
  const duration = probeDuration(file);
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : NaN;
  };
  const blocks: { from: number; shortTermLufs: number }[] = [];
  for (let from = 0; from < duration; from += 10) {
    const inBlock = samples.filter((x) => x.t >= from && x.t < from + 10).map((x) => x.s);
    if (inBlock.length) blocks.push({ from, shortTermLufs: Number(median(inBlock).toFixed(1)) });
  }
  const body = blocks.filter((b) => b.from >= 5 && b.from + 10 <= duration - 10);
  const med = median(body.map((b) => b.shortTermLufs));
  const low = body.reduce((a, b) => (b.shortTermLufs < a.shortTermLufs ? b : a), body[0]);
  const high = body.reduce((a, b) => (b.shortTermLufs > a.shortTermLufs ? b : a), body[0]);
  const below = Number((med - low.shortTermLufs).toFixed(1));
  const above = Number((high.shortTermLufs - med).toFixed(1));
  return {
    integratedLufs,
    truePeakDbtp,
    lra,
    blocks,
    medianBlockLufs: Number(med.toFixed(1)),
    lowestBlock: { from: low.from, belowMedianDb: below },
    highestBlock: { from: high.from, aboveMedianDb: above },
    steady: below <= 6 && above <= 4,
    gainToMinus26Db: Number((-26 - integratedLufs).toFixed(1)),
  };
}

function checkAll(file: string): { take: TakeCheck; level: LevelCheck; reasons: string[] } {
  const take = JSON.parse(runWeekScript(["check", file])) as TakeCheck;
  const reasons = [...take.reasons];
  if (take.durationSeconds < LENGTH_SECONDS - 30) reasons.push(`only ${take.durationSeconds}s of ${LENGTH_SECONDS}`);
  if (!take.ending.clean) reasons.push("ending cut close to full level");
  const level = levelCheck(file);
  if (!level.steady) {
    reasons.push(
      `level not steady: block at ${level.lowestBlock.from}s is ${level.lowestBlock.belowMedianDb} dB under the median, ` +
        `block at ${level.highestBlock.from}s ${level.highestBlock.aboveMedianDb} dB over`,
    );
  }
  return { take, level, reasons };
}

function vocals(file: string): { wordCount: number; words: string[]; text: string; credits: number | null } {
  const out = runWeekScript(["vocals", file]).trim().split(/\r?\n/).pop() ?? "{}";
  return JSON.parse(out);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function generate(which: string): Promise<void> {
  const c = CANDIDATES[which];
  if (!c) throw new Error(`No candidate ${which}; use a or b.`);
  const logged = loadConfig().generations.filter((g) => g.set === SET);
  if (logged.length >= CAP) throw new Error(`Cap reached: ${CAP} "${SET}" generations logged. Stopping.`);
  const take = logged.filter((g) => String(g.id).startsWith(`${TRACK_ID}-${which}`)).length + 1;
  const id = `${TRACK_ID}-${which}${take > 1 ? `${take}` : ""}`;
  const file = path.join(MUSIC_DIR, `${id}.mp3`);
  const prompt = `${c.feel} ${INSTRUCTION}`;
  const lengthMs = LENGTH_SECONDS * 1000;
  const key = readApiKey();
  console.log(`[music] ${id}  ${c.bpm} bpm, ${c.lead}, ${c.mood}, ${LENGTH_SECONDS}s asked`);

  const before = await usageSnapshot(key);
  const started = Date.now();
  const bytes = await postOnce(key, "/v1/music", {
    prompt,
    music_length_ms: lengthMs,
    model_id: MUSIC_MODEL,
    output_format: MUSIC_FORMAT,
    force_instrumental: true,
  });
  fs.mkdirSync(MUSIC_DIR, { recursive: true });
  fs.writeFileSync(file, bytes);
  const seconds = ((Date.now() - started) / 1000).toFixed(0);
  const { credits, bucket } = await creditsSince(key, before);
  console.log(`  wrote ${rel(file)} in ${seconds}s, credits ${credits ?? "not reported"}${bucket ? ` (${bucket})` : ""}`);

  const { take: check, level, reasons } = checkAll(file);
  const pass = reasons.length === 0;
  console.log(`  check: ${pass ? "PASS" : `FAIL (${reasons.join("; ")})`}`);
  console.log(`  ${JSON.stringify({ ...check, level: { ...level, blocks: undefined } })}`);

  updateConfig((config) => {
    config.generations.push({
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
      accepted: pass,
      notes:
        `${c.mood}, ${c.lead}, about ${c.bpm} bpm. Candidate ${which} for ${TRACK_ID}, the bed under the narration of ` +
        `YouTube L1 (folder 2026-10-02-4). ` +
        (pass
          ? `Measured duration ${check.durationSeconds}s, ${level.integratedLufs} LUFS, LRA ${level.lra} LU, ending ${check.ending.clean ? "rings out" : "cut close to full level"}.`
          : `Flagged: ${reasons.join("; ")}.`),
      firstSecondTest: {
        firstSecondMeanDb: check.firstSecond.firstDb,
        wholeTrackMeanDb: check.firstSecond.wholeDb,
        deficitDb: check.firstSecond.deficitDb,
        toleranceDb: 6,
        pass: check.firstSecond.pass,
      },
      levelCheck: { ...level, blocks: undefined },
      set: SET,
    });
  });
  if (credits !== null && credits > CREDIT_ALARM) {
    throw new Error(`STOP: ${id} cost ${credits} credits, over the ${CREDIT_ALARM} alarm. Nothing further until the owner has seen this.`);
  }

  const v = vocals(file);
  console.log(`  vocals: ${v.wordCount} words transcribed${v.wordCount ? ` (${v.words.slice(0, 20).join(" ")})` : ""}, credits ${v.credits}`);
  updateConfig((config) => {
    const rec = config.generations.find((g) => g.set === SET && g.id === id);
    if (rec) rec.vocalCheck = { model: "scribe_v2", wordCount: v.wordCount, words: v.words.slice(0, 40), creditsMeasured: v.credits };
  });
}

function latestTake(which: string): Json {
  const rec = loadConfig()
    .generations.filter((g) => g.set === SET && String(g.id).startsWith(`${TRACK_ID}-${which}`))
    .pop();
  if (!rec) throw new Error(`No take of candidate ${which} on record.`);
  return rec;
}

/**
 * Cuts a take's opening at a given second, with a 5 ms fade in, to
 * <id>-trimmed.mp3 (mp3 320k, 48 kHz), checks it, and records the trim on the
 * take's config/audio.json entry. The raw take is kept. Same fix as
 * music-w1005-r, whose leading silence was trimmed the same way.
 */
function trim(which: string, startSeconds: string): void {
  const rec = latestTake(which);
  const src = path.join(ROOT, String(rec.file));
  const dest = src.replace(/\.mp3$/, "-trimmed.mp3");
  const start = Number(startSeconds);
  const res = ffmpeg([
    "-y", "-i", src,
    "-af", `atrim=start=${start},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.005`,
    "-ar", "48000", "-c:a", "libmp3lame", "-b:a", "320k", dest,
  ]);
  if (res.code !== 0) throw new Error(`trim failed: ${res.stderr.slice(-400)}`);
  const { take, level, reasons } = checkAll(dest);
  console.log(`wrote ${rel(dest)}: ${take.durationSeconds}s, ${reasons.length ? `FAIL (${reasons.join("; ")})` : "PASS"}`);
  updateConfig((config) => {
    const r = config.generations.find((g) => g.set === SET && g.id === rec.id);
    if (r) {
      r.trimmed = {
        file: rel(dest),
        startSeconds: start,
        durationSeconds: take.durationSeconds,
        pass: reasons.length === 0,
        reasons,
        levelCheck: { ...level, blocks: undefined },
        note: "Opening cut at the first full downbeat, 5 ms fade in, re-encoded mp3 320k 48 kHz. No credits.",
      };
    }
  });
}

function choose(which: string): void {
  const c = CANDIDATES[which];
  if (!c) throw new Error(`No candidate ${which}; use a or b.`);
  const rec = latestTake(which);
  const raw = path.join(ROOT, String(rec.file));
  const trimmed = raw.replace(/\.mp3$/, "-trimmed.mp3");
  const src = fs.existsSync(trimmed) ? trimmed : raw;
  const dest = path.join(MUSIC_DIR, `${TRACK_ID}.mp3`);
  fs.copyFileSync(src, dest);
  console.log(`copied ${rel(src)} to ${rel(dest)}`);

  const history = JSON.parse(fs.readFileSync(MUSIC_HISTORY, "utf8")) as Json[];
  if (history.some((h) => h.track === TRACK_ID)) {
    console.log(`${TRACK_ID} is already in music-history.json; left as is.`);
    return;
  }
  history.push({
    track: TRACK_ID,
    file: `D:/kap-reel/${rel(dest)}`,
    published: "2026-10-02",
    post: "YouTube L1, Test your website with one key (To Be Released/2026-10-02-4), long-form 16:9, the bed under the narration",
    _note:
      `ElevenLabs ${MUSIC_MODEL}, candidate ${which} (${rel(src)}): ${c.mood}, ${c.lead}, about ${c.bpm} bpm, ` +
      `${LENGTH_SECONDS}s asked. Logged in D:/kap-reel/config/audio.json under set "${SET}". Dated for the planned ` +
      `2026-10-02 11:00 AM publish; generator scripts/youtube/l1/music.ts.`,
  });
  fs.writeFileSync(MUSIC_HISTORY, `${JSON.stringify(history, null, 2)}\n`);
  console.log(`appended ${TRACK_ID} to music-history.json`);
}

async function main(): Promise<void> {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === "gen" && arg) return generate(arg);
  if (cmd === "check" && arg) {
    const r = checkAll(arg);
    console.log(JSON.stringify({ reasons: r.reasons, take: r.take, level: r.level }, null, 2));
    return;
  }
  if (cmd === "vocals" && arg) {
    console.log(JSON.stringify(vocals(arg)));
    return;
  }
  if (cmd === "trim" && arg && process.argv[4]) return trim(arg, process.argv[4]);
  if (cmd === "choose" && arg) return choose(arg);
  console.log("usage: gen a|b | check <mp3> | vocals <mp3> | trim a|b <seconds> | choose a|b");
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
