/**
 * scripts/social/music-efp-1003.ts
 *
 * Twelve music beds for the social client Ellenton Family Practice Direct,
 * posts of 2026-10-03 to 2026-10-16 (Ellenton Family Practice Direct social,
 * Oct 2026). Track ids are reserved in the client's build brief,
 * clients/ellenton-family-practice/plans/2026-10-03-new-patients-build-brief.md
 * ("Music ids"): "-c" beds carry the Facebook slide videos and are the calmest;
 * "-r" beds carry the two reels (a photo walkthrough of the clinic on 10/04 and
 * the flu season explainer on 10/11) and carry a gentle lift.
 *
 * Sound brief (2026-10-02): instrumental only, about 30 seconds, for a family
 * medical practice in Ellenton, Florida, tagline "Modern medicine. Old
 * fashioned doctors." Warm, calm, trustworthy, unhurried: acoustic guitar,
 * piano, soft strings or Rhodes, light brushed percussion or none. Nothing
 * clinical, nothing corporate stock, nothing dramatic, no sudden hits. All
 * twelve are distinct from each other and from every bed in config/audio.json
 * and LICENSING.md, the music-fmg set included.
 *
 * Same method as music-fmg-1003.ts (the previous batch, 2026-10-02): same
 * endpoint, model, format, length, record shape and take checks (the
 * music-week-0928.ts "check", an ebur128 loudness reading, a silence reject,
 * a 25 s floor, and the scribe_v2 vocal check on every passing take). Helpers
 * from audio.ts are imported read-only.
 *
 * Run from D:\kap-reel:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/music-efp-1003.ts gen 1003-c   one track
 *   node node_modules/tsx/dist/cli.mjs scripts/social/music-efp-1003.ts gen all      every track not yet on disk
 *   node node_modules/tsx/dist/cli.mjs scripts/social/music-efp-1003.ts loud <mp3>   ebur128 reading only
 *
 * Every billable call is appended to config/audio.json with set
 * "social-efp-1003" and its measured credits, rejects included. Each take lands
 * in assets/audio/raw/music-efp-<n>-32s.mp3 (later takes -take2, -take3) and a
 * passing take is copied to out/candidates/music-efp-<n>.mp3; the copy's
 * basename is the track id the finisher records in post.json.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  apiPostAudio,
  assertUnderCreditAlarm,
  creditsSince,
  ffmpeg,
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

const SET = "social-efp-1003";
const CLIENT = "Ellenton Family Practice Direct social, Oct 2026";
const MUSIC_MODEL = "music_v2";
const MUSIC_FORMAT = "mp3_48000_320";
const LENGTH_SECONDS = 32;
/** Per track: one take plus at most two regenerates. */
const CAP_PER_TRACK = 3;
/** The brief's floor; anything shorter is rejected. */
const MIN_SECONDS = 25;
/** Integrated loudness under this reads as silent or near silent. */
const SILENT_LUFS = -35;

type Track = { id: string; bpm: number; lead: string; mood: string; use: string; feel: string };

const TRACKS: Track[] = [
  {
    id: "music-efp-1003-c",
    bpm: 78,
    lead: "fingerstyle steel-string acoustic guitar melody over softly sustained violins and violas, no percussion",
    mood: "welcoming and genuine, the doctor who knows your name",
    use: "the Sat 2026-10-03 Facebook slide video, who we are (folder 2026-10-03)",
    feel:
      "Warm, welcoming acoustic instrumental at about 78 bpm in G major. A " +
      "fingerstyle steel-string acoustic guitar plays a simple, singable " +
      "melody with its own soft bass notes, over a gentle bed of sustained " +
      "violins and violas holding long, quiet chords. No drums. Genuine and " +
      "neighborly, like being greeted by name by a doctor who has known your " +
      "family for years.",
  },
  {
    id: "music-efp-1004-r",
    bpm: 98,
    lead: "DADGAD acoustic guitar rolling eighth-note pattern with ringing open strings, piano doubling the melody, warm cello and viola pad, brushed snare and soft kick",
    mood: "open and bright, morning light through the windows, a gentle lift",
    use: "the Sun 2026-10-04 reel, a look inside the clinic (folder 2026-10-04)",
    feel:
      "Bright, gently lifting acoustic instrumental at about 98 bpm in D major. " +
      "An acoustic guitar in DADGAD tuning plays a rolling eighth-note pattern " +
      "with ringing open strings, and a piano doubles a simple, rising melody " +
      "an octave above it. Warm cello and viola hold a soft pad underneath. A " +
      "brushed snare and a soft kick keep an easy forward step. Open and " +
      "hopeful, like morning light coming through the windows as you walk " +
      "through a friendly, well kept office.",
  },
  {
    id: "music-efp-1005-c",
    bpm: 70,
    lead: "Rhodes electric piano with light tremolo playing slow gospel-tinged chords, soft upright bass, no drums",
    mood: "easy and clear, nothing complicated",
    use: "the Mon 2026-10-05 Facebook slide video, how to book (folder 2026-10-05)",
    feel:
      "Calm, warm instrumental at about 70 bpm in F major. A Rhodes electric " +
      "piano with a light tremolo plays slow, gospel-tinged chords and a " +
      "simple melody on top, accompanied only by a soft upright bass on the " +
      "roots. No drums. Easy and uncomplicated, like a friendly voice on the " +
      "phone telling you there is a time that works for you.",
  },
  {
    id: "music-efp-1007-c",
    bpm: 76,
    lead: "nylon-string classical guitar slow arpeggios with a warm solo viola melody, no percussion",
    mood: "reassuring, there is a way for everyone",
    use: "the Wed 2026-10-07 Facebook slide video, three ways to be seen (folder 2026-10-07)",
    feel:
      "Gentle, reassuring instrumental at about 76 bpm in A minor turning to " +
      "C major. A nylon-string classical guitar plays slow, even arpeggios, " +
      "and a solo viola sings a warm, legato melody over it with a soft, " +
      "natural tone. No percussion. Kind and steady, like being told there is " +
      "a way to be seen whatever your situation.",
  },
  {
    id: "music-efp-1009-c",
    bpm: 74,
    lead: "soft jazz ballad trio: warm grand piano melody and chords, upright bass, brushes swirling slowly on the snare",
    mood: "relaxed and personal, a longer conversation",
    use: "the Fri 2026-10-09 Facebook slide video, Direct Primary Care explained (folder 2026-10-09)",
    feel:
      "Relaxed, intimate jazz ballad instrumental at about 74 bpm in B flat " +
      "major. A warm grand piano plays a simple melody with soft, rich chords, " +
      "an upright bass walks slowly underneath, and brushes swirl gently on " +
      "the snare with a feather-light ride cymbal. Personal and unhurried, " +
      "like a long, easy conversation with a doctor who is not watching the " +
      "clock.",
  },
  {
    id: "music-efp-1010-c",
    bpm: 92,
    lead: "gently strummed acoustic guitar, warm violin melody, soft upright bass, light brushed snare on two and four",
    mood: "sunny Saturday, back to school, easygoing",
    use: "the Sat 2026-10-10 Facebook slide video, sports and school physicals (folder 2026-10-10)",
    feel:
      "Sunny, easygoing acoustic instrumental at about 92 bpm in E major. A " +
      "steel-string acoustic guitar strums gently and evenly, a violin plays " +
      "a warm, simple folk melody, and a soft upright bass and a light brushed " +
      "snare on two and four keep a relaxed step. Friendly and wholesome, like " +
      "a Saturday morning before the season starts, calm rather than busy.",
  },
  {
    id: "music-efp-1011-r",
    bpm: 102,
    lead: "Rhodes and fingerpicked acoustic guitar in interlocking eighth notes, soft string pad, light brushed kit with a soft kick",
    mood: "prepared and reassuring, steady forward motion, a gentle lift",
    use: "the Sun 2026-10-11 flu season explainer reel (folder 2026-10-11)",
    feel:
      "Warm, reassuring instrumental with a gentle lift at about 102 bpm in A " +
      "major. A Rhodes electric piano and a fingerpicked acoustic guitar play " +
      "interlocking eighth-note patterns that weave together, with a simple " +
      "melody on the Rhodes. A soft string pad holds the chords, and a light " +
      "brushed drum kit with a soft kick moves it gently forward. Prepared and " +
      "calm, like getting ready for the season with someone you trust.",
  },
  {
    id: "music-efp-1012-c",
    bpm: 66,
    lead: "string quartet alone, slow sustained chords and a simple first violin melody, no percussion",
    mood: "comforting, rest and care",
    use: "the Mon 2026-10-12 Facebook slide video, sick visits (folder 2026-10-12)",
    feel:
      "Very calm, comforting chamber instrumental at about 66 bpm in E flat " +
      "major. A string quartet plays alone: slow, warm sustained chords from " +
      "the viola and cello, and a simple, tender melody in the first violin, " +
      "all played softly with a gentle vibrato. No percussion, no piano. " +
      "Comforting and caring, like a warm blanket and someone checking in on " +
      "you, never sad or mournful.",
  },
  {
    id: "music-efp-1013-c",
    bpm: 72,
    lead: "solo grand piano with flowing left-hand arpeggios and a hopeful melody, soft sustained cello underneath",
    mood: "gentle, hopeful, dignified",
    use: "the Tue 2026-10-13 Facebook slide video, breast cancer awareness month (folder 2026-10-13)",
    feel:
      "Gentle, hopeful instrumental at about 72 bpm in D flat major. A grand " +
      "piano plays flowing left-hand arpeggios and a simple, hopeful melody in " +
      "the middle register, with a soft cello sustaining long low notes " +
      "underneath from the first beat. No percussion. Warm, dignified and " +
      "quietly encouraging, never sad, never sentimental.",
  },
  {
    id: "music-efp-1014-c",
    bpm: 80,
    lead: "piano and acoustic guitar duet in a slow 3/4 waltz, guitar picking the chords, piano carrying the melody, no percussion",
    mood: "steady and patient, alongside you for the long run",
    use: "the Wed 2026-10-14 Facebook slide video, chronic care (folder 2026-10-14)",
    feel:
      "Steady, patient instrumental in a slow 3/4 waltz at about 80 bpm in C " +
      "major. A fingerpicked acoustic guitar plays the chords on a gentle " +
      "one-two-three, and a warm upright piano carries a simple melody above " +
      "it. No drums. Patient and dependable, like a provider who walks " +
      "alongside you visit after visit, year after year.",
  },
  {
    id: "music-efp-1015-c",
    bpm: 76,
    lead: "high-register piano lullaby melody over soft sustained Rhodes chords, light shaker",
    mood: "tender, gently playful, a whole family under one roof",
    use: "the Thu 2026-10-15 Facebook slide video, kids (folder 2026-10-15)",
    feel:
      "Tender, gently playful instrumental at about 76 bpm in F major. A piano " +
      "plays a simple, lullaby-like melody high in its register, over soft, " +
      "warm sustained Rhodes chords and a round, quiet bass. A very light " +
      "shaker keeps time. Sweet without being childish, like a family doctor " +
      "who sees the kids and the parents in the same warm room.",
  },
  {
    id: "music-efp-1016-c",
    bpm: 84,
    lead: "grand piano and fingerpicked acoustic guitar trading a simple phrase, warm upright bass, soft brushed snare on a slow backbeat",
    mood: "settled and content, all caught up",
    use: "the Fri 2026-10-16 Facebook slide video, the annual physical (folder 2026-10-16)",
    feel:
      "Settled, content acoustic instrumental at about 84 bpm in G major. A " +
      "grand piano and a fingerpicked acoustic guitar trade a simple melodic " +
      "phrase back and forth, call and answer, over a warm upright bass and a " +
      "soft brushed snare on a slow backbeat. Easy and complete, like walking " +
      "out of a good yearly checkup with everything in order.",
  },
];

const INSTRUCTION =
  "Clean intro: the music starts on the very first beat, no fade in, no " +
  "long build, no crescendo, no silence at the start. Fully instrumental, no " +
  "vocals, no vocal chops, no humming, no oohs, no whistling, no spoken word, " +
  "no lyrics. No sudden hits, no impact, no riser, no sweep, no cinematic " +
  "swell, no breakdown or pause in the middle. Steady, even energy the whole " +
  "way through so any fifteen second window stands on its own. It carries a " +
  "short social video with on-screen text and no voiceover for a small " +
  "family medical practice, so keep it warm, human and uncluttered: a simple " +
  "melodic motif, not a jingle, nothing clinical, nothing corporate, nothing " +
  "dramatic, nothing that sounds like stock music. " +
  "End cleanly: resolve on a final chord that rings out over the last two " +
  "seconds, no abrupt cut. Warm, natural acoustic production, plenty of " +
  "headroom, no clipping.";

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

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

type Check = {
  durationSeconds: number;
  firstSecond: { firstDb: number; wholeDb: number; deficitDb: number; pass: boolean };
  clipping: { flatFactor: number; peakDb: number; pass: boolean };
  ending: { clean: boolean };
  pass: boolean;
  reasons: string[];
};

/** The previous batch's take checks, run from music-week-0928.ts. */
function checkTake(file: string): Check {
  const res = spawnSync(
    process.execPath,
    [path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs"), path.join(HERE, "music-week-0928.ts"), "check", file],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  if (res.status !== 0) throw new Error(`check failed: ${res.stderr}`);
  const c = JSON.parse(res.stdout) as Check;
  if (c.durationSeconds < MIN_SECONDS) {
    c.reasons.push(`only ${c.durationSeconds}s`);
    c.pass = false;
  }
  return c;
}

type Loudness = { integratedLufs: number; truePeakDbtp: number; lraLu: number };

function loudness(file: string): Loudness {
  const { stderr } = ffmpeg(["-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const summary = stderr.slice(stderr.lastIndexOf("Summary:"));
  const num = (re: RegExp) => {
    const m = re.exec(summary)?.[1];
    return m === undefined || m === "-inf" ? -Infinity : Number(m);
  };
  return {
    integratedLufs: num(/I:\s*(-?[\d.]+|-inf)\s*LUFS/),
    truePeakDbtp: num(/Peak:\s*(-?[\d.]+|-inf)\s*dBFS/),
    lraLu: num(/LRA:\s*(-?[\d.]+)\s*LU/),
  };
}

type VocalResult = { words: string[]; credits: number | null };

/** ElevenLabs speech to text with audio event tags; any word token is a vocal suspect. */
async function vocalCheck(key: string, file: string): Promise<VocalResult> {
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
  const json = JSON.parse(text) as { words?: { text: string; type: string }[] };
  const words = (json.words ?? []).filter((w) => w.type === "word").map((w) => w.text);
  const { credits } = await creditsSince(key, before);
  return { words, credits };
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

function takesLogged(track: Track): number {
  return loadConfig().generations.filter(
    (g) => g.set === SET && String(g.id).startsWith(`${track.id}-`),
  ).length;
}

/** One billable take. Returns true when it passed every check. */
async function generate(key: string, track: Track): Promise<boolean> {
  const done = takesLogged(track);
  if (done >= CAP_PER_TRACK) throw new Error(`Cap reached: ${CAP_PER_TRACK} generations of ${track.id} logged. Stopping.`);
  const take = done + 1;
  const id = `${track.id}-${LENGTH_SECONDS}s${take > 1 ? `-take${take}` : ""}`;
  const file = path.join(RAW_DIR, `${id}.mp3`);
  const prompt = `${track.feel} ${INSTRUCTION}`;
  const lengthMs = LENGTH_SECONDS * 1000;
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
  const loud = loudness(file);
  if (!(loud.integratedLufs > SILENT_LUFS)) {
    check.reasons.push(`silent or near silent, ${loud.integratedLufs} LUFS integrated`);
    check.pass = false;
  }
  console.log(`  check: ${check.pass ? "PASS" : `FAIL (${check.reasons.join("; ")})`}`);
  console.log(`  ${JSON.stringify({ ...check, loudness: loud })}`);

  let vocal: Json | undefined;
  if (check.pass) {
    const v = await vocalCheck(key, file);
    console.log(`  vocal check: ${v.words.length} words, credits ${v.credits ?? "not reported"}`);
    vocal = {
      model: "scribe_v2",
      file: rel(file),
      wordCount: v.words.length,
      words: v.words.slice(0, 40),
      creditsMeasured: v.credits,
    };
    if (v.words.length) {
      check.reasons.push(`vocal suspect, speech to text found ${v.words.length} words`);
      check.pass = false;
    }
  }

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
      `${track.mood}, ${track.lead}, about ${track.bpm} bpm. ${CLIENT}: ${track.use}, no narration. ` +
      (check.pass
        ? `Measured duration ${check.durationSeconds}s, ${loud.integratedLufs} LUFS integrated, ${loud.truePeakDbtp} dBTP, ending ${check.ending.clean ? "rings out" : "cut close to full level"}.`
        : `Rejected: ${check.reasons.join("; ")}.`),
    firstSecondTest: {
      firstSecondMeanDb: check.firstSecond.firstDb,
      wholeTrackMeanDb: check.firstSecond.wholeDb,
      deficitDb: check.firstSecond.deficitDb,
      toleranceDb: 6,
      pass: check.firstSecond.pass,
    },
    loudness: { ...loud, durationSeconds: check.durationSeconds, flatFactor: check.clipping.flatFactor },
    ...(vocal ? { vocalCheck: vocal } : {}),
    client: CLIENT,
    set: SET,
  });

  if (check.pass) {
    fs.mkdirSync(CANDIDATE_DIR, { recursive: true });
    const candidate = path.join(CANDIDATE_DIR, `${track.id}.mp3`);
    fs.copyFileSync(file, candidate);
    console.log(`  copied to ${rel(candidate)}`);
  }
  return check.pass;
}

async function main(): Promise<void> {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === "loud" && arg) {
    console.log(JSON.stringify(loudness(arg)));
    return;
  }
  if (cmd !== "gen" || !arg) {
    console.log("usage: gen <1003-c|...|all> | loud <mp3>");
    return;
  }
  const list = arg === "all" ? TRACKS : TRACKS.filter((t) => t.id === `music-efp-${arg}` || t.id === arg);
  if (!list.length) throw new Error(`No track ${arg}`);
  const key = readApiKey();
  for (const t of list) {
    const candidate = path.join(CANDIDATE_DIR, `${t.id}.mp3`);
    if (fs.existsSync(candidate)) {
      console.log(`skip ${t.id}, ${rel(candidate)} exists`);
      continue;
    }
    // Regenerate rejects until a take passes or the per-track cap stops the run.
    while (!(await generate(key, t))) {
      /* next take */
    }
  }
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
