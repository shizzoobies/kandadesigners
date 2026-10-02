/**
 * scripts/social/music-fmg-1003.ts
 *
 * Twelve music beds for the social client Fore Motion Golf, posts of
 * 2026-10-03 to 2026-10-16 (Fore Motion Golf social, Oct 2026). Track ids are
 * reserved in the client's build brief,
 * clients/foremotion-golf/plans/2026-10-02-founders-funnel-build-brief.md
 * ("Music ids"): "-c" beds carry the Facebook slide videos of cards and stay
 * calm; "-r" beds carry the reels (a walkthrough of the empty space, and the
 * 2026-10-15-2 tier cards) and carry a little more momentum.
 *
 * Sound brief (2026-10-02): instrumental only, about 30 seconds, for a premium
 * indoor golf lounge opening in Orange Park, Florida. Warm, modern, confident,
 * unhurried: clean electric guitar or piano over a soft electronic pulse,
 * light percussion. Nothing cheesy, nothing corporate stock, nothing like the
 * K&A indie pop set. All twelve are distinct from each other and from every
 * bed in config/audio.json and LICENSING.md.
 *
 * Same endpoint, model, format, record shape and take checks as
 * music-week-0928.ts and scripts/social/2026-10-21/music.ts (the previous
 * batch). Helpers from audio.ts are imported read-only; the take checks run
 * music-week-0928.ts "check". Added here, as the brief asks: an ebur128
 * integrated loudness and true peak reading on every take, a silence reject,
 * and the speech to text vocal check run on every passing take (the previous
 * batch ran it by hand).
 *
 * Run from D:\kap-reel:
 *   node node_modules/tsx/dist/cli.mjs scripts/social/music-fmg-1003.ts gen 1003-c   one track
 *   node node_modules/tsx/dist/cli.mjs scripts/social/music-fmg-1003.ts gen all      every track not yet on disk
 *   node node_modules/tsx/dist/cli.mjs scripts/social/music-fmg-1003.ts loud <mp3>   ebur128 reading only
 *
 * Every billable call is appended to config/audio.json with set
 * "social-fmg-1003" and its measured credits, rejects included. Each take lands
 * in assets/audio/raw/music-fmg-<n>-32s.mp3 (later takes -take2, -take3) and a
 * passing take is copied to out/candidates/music-fmg-<n>.mp3; the copy's
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

const SET = "social-fmg-1003";
const CLIENT = "Fore Motion Golf social, Oct 2026";
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
    id: "music-fmg-1003-c",
    bpm: 84,
    lead: "clean electric guitar with light spring reverb playing a slow melody in sixths, muted eighth-note synth bass, soft side-chained pad, rim click and brushed hat",
    mood: "warm and assured, the lights coming up before opening",
    use: "the Sat 2026-10-03 Facebook slide video (folder 2026-10-03)",
    feel:
      "Warm, unhurried modern instrumental at about 84 bpm in a major key. A " +
      "clean electric guitar with a light spring reverb plays a slow, spacious " +
      "melody in sixths. Underneath, a soft electronic pulse: a muted synth bass " +
      "on steady eighth notes and a gentle side-chained pad that breathes with " +
      "the kick. Light percussion only, a soft rim click and a brushed hi hat. " +
      "Assured and at ease, like the lights coming up in a beautiful quiet room " +
      "just before it opens.",
  },
  {
    id: "music-fmg-1004-r",
    bpm: 104,
    lead: "clean electric guitar looping a syncopated arpeggio through a subtle ping-pong delay, warm synth pad, sixteenth-note analog synth bass, tight kick, shaker, soft clap",
    mood: "fresh and forward, first walk through a new space",
    use: "the Sun 2026-10-04 reel (folder 2026-10-04)",
    feel:
      "Modern, confident electronic instrumental with organic textures at about " +
      "104 bpm in a warm minor key that leans bright. A clean electric guitar " +
      "loops a syncopated arpeggiated figure through a subtle ping-pong delay, " +
      "over warm sustained synth pad chords. A round analog synth bass pulses " +
      "on sixteenth notes, with a tight soft kick, a shaker and a soft clap on " +
      "the backbeat. Forward moving and quietly impressive, like walking through " +
      "a new space for the first time.",
  },
  {
    id: "music-fmg-1005-c",
    bpm: 76,
    lead: "grand piano sparse open chords and a slow simple melody, soft heartbeat kick, filtered quarter-note synth pulse, shaker",
    mood: "calm, quiet confidence, late evening",
    use: "the Mon 2026-10-05 Facebook slide video (folder 2026-10-05)",
    feel:
      "Calm, elegant modern instrumental at about 76 bpm in a warm major key. " +
      "A grand piano plays sparse, open voiced chords and a slow, simple " +
      "melody with room to breathe. A soft electronic pulse sits under it: a " +
      "muffled heartbeat kick and a softly filtered synth pulsing on quarter " +
      "notes, with a quiet shaker. Polished and quietly confident, like a well " +
      "lit lounge late in the evening, nothing showy.",
  },
  {
    id: "music-fmg-1006-r",
    bpm: 110,
    lead: "upright piano repeating eighth-note ostinato, deep pulsing synth bass, soft four-on-the-floor kick, ticking hats, soft snare",
    mood: "steady momentum, something being built",
    use: "the Tue 2026-10-06 reel (folder 2026-10-06)",
    feel:
      "Modern neoclassical electronic instrumental at about 110 bpm in a minor " +
      "key that resolves warm. An upright piano plays a repeating eighth note " +
      "ostinato with a simple melody rising out of it, over a deep pulsing synth " +
      "bass. A soft four on the floor kick, ticking closed hi hats and a soft " +
      "snare on the backbeat keep it moving. Steady momentum and purpose, like a " +
      "space being finished one detail at a time.",
  },
  {
    id: "music-fmg-1007-c",
    bpm: 90,
    lead: "baritone clean electric guitar in deep melodic phrases, low filtered sixteenth-note synth arpeggio, electronic rimshot and shaker",
    mood: "cool and composed, first light",
    use: "the Wed 2026-10-07 Facebook slide video (folder 2026-10-07)",
    feel:
      "Cool, composed modern instrumental at about 90 bpm in a warm dorian " +
      "minor key. A baritone clean electric guitar plays deep, unhurried " +
      "melodic phrases. A low, softly filtered analog synth arpeggio ripples on " +
      "sixteenth notes underneath, with a round sub bass, a soft electronic " +
      "rimshot and a light shaker. Composed and self assured, like first light " +
      "in an empty room, everything in its place.",
  },
  {
    id: "music-fmg-1008-r",
    bpm: 100,
    lead: "grand piano syncopated chord stabs and short answers, light picked electric counter line, round synth bass pulse, live drum groove with a light swing and conga",
    mood: "easy swagger, a room worth showing off",
    use: "the Thu 2026-10-08 reel (folder 2026-10-08)",
    feel:
      "Smooth, confident modern instrumental at about 100 bpm with a light " +
      "swing, in a major seventh mood. A grand piano plays syncopated chord " +
      "stabs and short melodic answers, a clean electric guitar adds a light " +
      "picked counter line, and a round synth bass pulses on eighth notes. A " +
      "crisp live drum groove with a tight snare, closed hi hat and a soft " +
      "conga. Easy swagger, like showing someone around a room you are proud of.",
  },
  {
    id: "music-fmg-1009-c",
    bpm: 86,
    lead: "Rhodes electric piano warm chords and gentle melody with soft chorus, offbeat round synth bass, brushed snare, quiet shaker",
    mood: "relaxed, nowhere to be",
    use: "the Fri 2026-10-09 Facebook slide video (folder 2026-10-09)",
    feel:
      "Relaxed, warm modern instrumental at about 86 bpm in a major seventh " +
      "mood. A Rhodes electric piano with a soft chorus plays warm chords and " +
      "a gentle, simple melody. A round synth bass pulses on the offbeat eighth " +
      "notes, with a soft kick, a brushed snare on two and four and a quiet " +
      "shaker. Unhurried and comfortable, like a slow afternoon with nowhere " +
      "else to be.",
  },
  {
    id: "music-fmg-1010-r",
    bpm: 116,
    lead: "clean electric guitar through a warm amp with a touch of grit playing a simple confident riff, driving eighth-note synth bass, live drums with tight snare, rim, open hat offbeats",
    mood: "ready, doors about to open",
    use: "the Sat 2026-10-10 reel (folder 2026-10-10)",
    feel:
      "Confident, driving modern instrumental at about 116 bpm in a minor key. " +
      "A clean electric guitar through a warm amp with just a touch of grit " +
      "plays a simple, confident riff, over a driving synth bass on eighth notes " +
      "and a soft synth pad. Live drums with a tight snare, a rim click and open " +
      "hi hats on the offbeats. Ready and purposeful, like the doors about to " +
      "open, cool rather than loud.",
  },
  {
    id: "music-fmg-1011-c",
    bpm: 80,
    lead: "clean electric guitar bell-like natural harmonics and soft open chords, deep sub pulse, slow two-note synth ostinato, soft hand drum, light shaker",
    mood: "calm focus before a swing",
    use: "the Sun 2026-10-11 Facebook slide video (folder 2026-10-11)",
    feel:
      "Calm, focused modern instrumental at about 80 bpm in a major key. A " +
      "clean electric guitar plays bell-like natural harmonics and soft open " +
      "chords. A deep sub bass pulse and a slow two note synth ostinato hold " +
      "the ground, with a soft hand drum and a light shaker. Still and focused, " +
      "like the breath before a good swing.",
  },
  {
    id: "music-fmg-1014-c",
    bpm: 94,
    lead: "Wurlitzer electric piano rounded chords and simple melody, sparse muted electric guitar notes, soft analog synth bass pulse, electronic hat, low soft clap",
    mood: "unhurried confidence, a plan coming together",
    use: "the Wed 2026-10-14 Facebook slide video (folder 2026-10-14)",
    feel:
      "Unhurried, confident modern instrumental at about 94 bpm in a major " +
      "key. A Wurlitzer electric piano plays soft, rounded chords and a simple " +
      "melody, and a clean electric guitar adds sparse muted notes between the " +
      "phrases. A soft analog synth bass pulses underneath, with a light " +
      "electronic hi hat and a soft clap low in the mix. Settled and sure, like " +
      "a plan coming together.",
  },
  {
    id: "music-fmg-1015-c",
    bpm: 88,
    lead: "piano and clean electric guitar trading a simple phrase, pulsing side-chained pad, soft kick on every beat, crisp shaker",
    mood: "premium, an exclusive invitation",
    use: "the Thu 2026-10-15 Facebook slide video (folder 2026-10-15)",
    feel:
      "Elegant, premium modern instrumental at about 88 bpm, minor key moving " +
      "to a warm major resolve. A piano and a clean electric guitar trade a " +
      "simple melodic phrase back and forth, the piano in the low middle " +
      "register. A pulsing side-chained synth pad and a soft kick on every beat " +
      "give a gentle electronic heartbeat, with a crisp shaker. Refined and a " +
      "little exclusive, like a personal invitation.",
  },
  {
    id: "music-fmg-1015-r",
    bpm: 106,
    lead: "Rhodes syncopated chord stabs, chorused clean electric guitar rising melody, sub bass pulse on eighths, tight electronic kick, snappy rim, soft open hat",
    mood: "step up, limited and worth it",
    use: "the Thu 2026-10-15 tier cards reel (folder 2026-10-15-2)",
    feel:
      "Confident, premium modern instrumental at about 106 bpm in a major key " +
      "with a minor shade. A warm Rhodes electric piano plays a four chord " +
      "progression in syncopated stabs, and a clean electric guitar with a " +
      "slight chorus plays a simple rising melody over it. A sub bass pulses " +
      "on eighth notes, with a tight electronic kick, a snappy rim and a soft " +
      "open hi hat. Each step up feels a little richer, limited and worth it.",
  },
];

const INSTRUCTION =
  "Clean intro: the groove starts on the very first beat, no fade in, no " +
  "long build, no silence at the start. Fully instrumental, no vocals, no " +
  "vocal chops, no humming, no oohs, no whistling, no spoken word, no lyrics. " +
  "No heavy drop, no big riser, no sweep, no impact hit, no breakdown or " +
  "pause in the middle. Steady energy the whole way through so any fifteen " +
  "second window stands on its own. It carries a short social video with " +
  "on-screen text and no voiceover for a premium indoor golf lounge, so keep " +
  "it tasteful and uncluttered: a simple melodic motif, not a jingle, " +
  "nothing cheesy, nothing that sounds like stock music. " +
  "End cleanly: resolve on a final chord that rings out over the last two " +
  "seconds, no abrupt cut. Warm, polished modern production, plenty of " +
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
  const list = arg === "all" ? TRACKS : TRACKS.filter((t) => t.id === `music-fmg-${arg}` || t.id === arg);
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
