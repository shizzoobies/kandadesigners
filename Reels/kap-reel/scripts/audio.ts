/**
 * scripts/audio.ts
 *
 * Phase 5 audio for the K&A Performance showcase reel.
 * See kap-reel-handoff.md Section 9 and kap-reel-kickoff.md Phase 5.
 *
 * Run:
 *   npx tsx scripts/audio.ts music --variant a|b|c --length 20|50
 *   npx tsx scripts/audio.ts sfx --name whoosh-transition|ui-click|impact-low
 *   npx tsx scripts/audio.ts all
 *   npx tsx scripts/audio.ts mix [--variant a|b|c]
 *   npx tsx scripts/audio.ts usage
 *
 * Second reel, instructional design and training content (--set training):
 *   npx tsx scripts/audio.ts music --variant t-a|t-b|t-c --length 20 --set training
 *   npx tsx scripts/audio.ts mix --set training [--variant t-a|t-b|t-c]
 * These share every code path above except the prompt instruction text and
 * the generation cap, which counts separately per --set (SET_CAPS) so this
 * run is not blocked by the original 12-generation cap Phase 5 already used
 * up. mix --set training writes an audio-only mp3 preview to
 * out/gate-t5/preview-{id}.mp3 instead of muxing against a picture, because
 * the owner has not chosen a variant yet.
 *
 * API contract, confirmed against the live docs on 2026-09-03:
 *
 *   POST https://api.elevenlabs.io/v1/music
 *     header: xi-api-key, content-type: application/json
 *     body:  { prompt?, composition_plan?, music_length_ms?, output_format?,
 *              model_id?, force_instrumental?, seed?, finetune_id?,
 *              respect_sections_durations?, store_for_inpainting?,
 *              sign_with_c2pa? }
 *     prompt and composition_plan are mutually exclusive. music_length_ms,
 *     force_instrumental and seed are prompt-mode only, and the docs say seed
 *     "cannot be used with prompt", so prompt-mode generation has no seed and
 *     is not reproducible.
 *     music_length_ms range: 3000 to 600000.
 *     model_id: music_v1 (default) or music_v2.
 *     output_format: auto (default), mp3_44100_128, mp3_48000_192,
 *                    mp3_48000_240, mp3_48000_320, pcm_*, opus_*, ulaw_8000,
 *                    alaw_8000. Highest mp3 offered is mp3_48000_320, which is
 *                    what this script asks for. There is no mp3_44100_192 on
 *                    the music endpoint.
 *     200: raw audio bytes in the requested format, not JSON.
 *
 *   There IS a detailed variant, POST /v1/music/detailed ("Compose music with
 *   details"), which returns the audio alongside the composition plan and
 *   metadata as multipart. There is also "Stream music with details". This
 *   script uses the plain endpoint: the composition plan is of no use here and
 *   the multipart parse is extra surface for no gain. The full prompt is
 *   recorded in config/audio.json instead.
 *
 *   POST https://api.elevenlabs.io/v1/sound-generation?output_format=...
 *     header: xi-api-key, content-type: application/json
 *     body:  { text, duration_seconds?, prompt_influence?, loop?, model_id? }
 *     duration_seconds: 0.5 to 30, null means the model picks.
 *     prompt_influence: 0 to 1, default 0.3.
 *     model_id: eleven_text_to_sound_v2 (only allowed value, and the only
 *               model that honours loop).
 *     output_format is a QUERY parameter here, unlike the music endpoint where
 *     it is a body field. mp3_44100_192 is the highest mp3 offered.
 *     200: raw audio bytes.
 *
 * Neither endpoint reports a credit cost anywhere in the response. Cost is
 * measured the same way Phase 4 measured image spend:
 * GET /v1/usage/character-stats?start_unix=&end_unix=&breakdown_type=product_type
 * works on this restricted key even though it lacks the user_read scope. This
 * script samples the total across every product bucket either side of each
 * generation, so each figure is the exact delta for that one call, and it also
 * records which bucket moved.
 *
 * The API key is read from .env and never printed, never written to
 * config/audio.json, never sent anywhere but api.elevenlabs.io.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const ENV_FILE = path.join(ROOT, ".env");
const AUDIO_DIR = path.join(ROOT, "assets", "audio");
const RAW_DIR = path.join(AUDIO_DIR, "raw");
const AUDIO_JSON = path.join(ROOT, "config", "audio.json");
const OUT_DIR = path.join(ROOT, "out");

const API_BASE = "https://api.elevenlabs.io";

const MUSIC_MODEL = "music_v2";
const MUSIC_FORMAT = "mp3_48000_320";
const SFX_MODEL = "eleven_text_to_sound_v2";
const SFX_FORMAT = "mp3_44100_192";

/**
 * Hard limits for this phase, from the task brief.
 * GENERATION_CAP counts every billable call to either endpoint.
 * CREDIT_ALARM stops the run if any single generation costs more than this.
 */
const GENERATION_CAP = 12;
const CREDIT_ALARM = 5000;

/**
 * Per-set generation caps for later, more narrowly scoped runs than the
 * original Phase 5 budget above. Keyed by the --set label passed on the CLI.
 * A generation made with --set counts against its own cap here instead of the
 * legacy GENERATION_CAP, which is already exhausted from Phase 5 and is left
 * alone so runs without --set keep behaving exactly as they did before.
 */
const SET_CAPS: Record<string, number> = {
  training: 6,
};

/** Reject a music take whose first second sits more than this far under the whole-track mean. */
const FIRST_SECOND_TOLERANCE_DB = 6;

/** How far under the music bed the SFX are placed. Section 9 asks for at least 12. */
const SFX_DUCK_DB = 15;

// ---------------------------------------------------------------------------
// Timeline, from src/lib/timing.ts
// ---------------------------------------------------------------------------

const FPS = 30;
const PICTURE_SECONDS = 15.0;
const MUSIC_FADE_OUT_SECONDS = 0.4;

/**
 * SFX cue sheet in frames.
 *
 * Owner decision 2026-09-03: empty. The owner watched the mix with the whoosh
 * on each cut, the click on each claim and the impact on the hook slam, and did
 * not like any of them. The 15 second mix is now the music bed alone.
 *
 * The cue sheet the owner rejected, kept here so the decision is legible and so
 * restoring it is a one line edit rather than a re-derivation. Frames are from
 * the re-paced beat map in src/lib/timing.ts:
 *
 *   impact-low  0                   hook text slam
 *   whoosh      54, 194, 334        the three scene transitions
 *   ui-click    90, 230             claim in, CLAIM_IN 36 into each project beat
 *               352, 370            the second and third surfaces tour cuts
 *
 * Section 9 asks for a whoosh, a click and an impact, so this is a departure
 * from the brief made deliberately by the person the brief is for. The takes
 * are still generated, still logged in config/audio.json and still recorded in
 * LICENSING.md, because the credits were spent whether or not they ship.
 *
 * Section 9's other audio rules are untouched: the bed is still trimmed to
 * 15.0s with the 400 ms fade and still normalised to -14 LUFS with a -1 dBTP
 * true peak, measured off the delivered file.
 */
const SFX_CUES: { name: SfxName; frames: number[] }[] = [];

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

/**
 * Every music prompt is FEEL + INSTRUCTION. The instruction half is Section 9
 * turned into prompt language and is identical across the three variants, so
 * the only thing that changes between them is the character of the track.
 *
 * The "starts immediately" sentence is the load bearing one. The 15 second cut
 * has no room for an intro ramp, and Section 9 says to reject any take that
 * has one no matter how good the back half is.
 */
const MUSIC_INSTRUCTION =
  "Starts immediately at full energy on the very first beat: no intro build, " +
  "no fade in, no silence or near silence at the start, no ramp. Fully " +
  "instrumental, no vocals, no vocal chops, no spoken word, no lyrics. No " +
  "heavy drop, no big riser, no sweep, no impact hit, no sub bass wobble. " +
  "Even confident energy the whole way through so any fifteen second window " +
  "stands on its own. Modern product launch film, not a nightclub. Clean " +
  "modern production, plenty of headroom, nothing distorted.";

type VariantId = "a" | "b" | "c" | "t-a" | "t-b" | "t-c";

const MUSIC_VARIANTS: { id: VariantId; feel: string; note: string }[] = [
  {
    id: "a",
    feel:
      "Warm analog electronic at about 118 bpm. A round, slightly detuned " +
      "analog saw pulse on steady eighth notes carries the whole track, with a " +
      "warm soft sub underneath it. Light percussion: a gentle kick, a soft " +
      "closed hat, a quiet rim click. Warm tape saturation and gentle " +
      "sidechain breathing. Optimistic and grounded.",
    note: "Warm analog synth pulse, about 118 bpm",
  },
  {
    id: "b",
    feel:
      "Crisp percussive minimal electronic at about 124 bpm. A tight dry drum " +
      "machine kit: clean short kick, crisp closed hats, a light shaker, a " +
      "single clap on the backbeat. A bright plucked synth lead repeats a " +
      "simple four note motif over it. Dry and modern with very little reverb, " +
      "lots of space between the elements. Precise and purposeful.",
    note: "Crisp percussive minimal, about 124 bpm, bright plucked lead",
  },
  {
    id: "c",
    feel:
      "Softer cinematic electronic at about 110 bpm. Wide slowly evolving " +
      "synth pads under a gentle bell like arpeggio, with a light restrained " +
      "beat: soft kick, brushed snare texture, quiet hat. Spacious, warm and " +
      "hopeful, cinematic rather than dancefloor.",
    note: "Cinematic pad driven with a light beat, about 110 bpm",
  },
];

/**
 * Second showcase reel, instructional design and training content. Same hard
 * requirement as MUSIC_INSTRUCTION above (must start at full energy with no
 * intro build, because the 15 second cut has no room for a ramp), but the
 * character brief differs: a bright morning workshop rather than a product
 * launch, and cinematic swells are explicitly out as well as drops and vocals.
 */
const TRAINING_MUSIC_INSTRUCTION =
  "Starts immediately at full energy on the very first beat: no intro build, " +
  "no fade in, no silence or near silence at the start, no ramp. Fully " +
  "instrumental, no vocals, no vocal chops, no spoken word, no lyrics. No " +
  "heavy drop, no big riser, no sweep, no impact hit, no sub bass wobble, no " +
  "cinematic swell. Even confident energy the whole way through so any " +
  "fifteen second window stands on its own. A bright morning training " +
  "workshop, not a product launch and not a nightclub. Clean modern " +
  "production, plenty of headroom, nothing distorted.";

/**
 * Training reel variants, generated with --set training. Kept in a separate
 * array from MUSIC_VARIANTS so the reel one ids (a, b, c) and their prompt
 * text are untouched; generateMusic looks them up alongside MUSIC_VARIANTS.
 */
const TRAINING_MUSIC_VARIANTS: { id: VariantId; feel: string; note: string }[] =
  [
    {
      id: "t-a",
      feel:
        "Acoustic-leaning instrumental at about 108 bpm. Soft piano or felt " +
        "keys carry the main melodic motif over a light, unobtrusive " +
        "electronic pulse underneath. Warm, steady, confident, unhurried but " +
        "still moving forward, like a bright morning workshop rather than a " +
        "product launch.",
      note: "Acoustic-leaning felt keys over a light electronic pulse, about 108 bpm",
    },
    {
      id: "t-b",
      feel:
        "Warm analog synth instrumental at about 116 bpm. Warm analog synth " +
        "chords carry the harmony, with a gentle four-on-the-floor kick and a " +
        "plucked synth motif threaded through. Warm, steady, confident, " +
        "unhurried but still moving forward, like a bright morning workshop " +
        "rather than a product launch.",
      note: "Warm analog synth chords, gentle four-on-the-floor, about 116 bpm, plucked motif",
    },
    {
      id: "t-c",
      feel:
        "Organic instrumental at about 112 bpm. Marimba or mallet melodies " +
        "carry the main line over a soft, warm bass and light organic " +
        "percussion. Warm, steady, confident, unhurried but still moving " +
        "forward, like a bright morning workshop rather than a product " +
        "launch.",
      note: "Organic marimba/mallets over a soft bass, about 112 bpm",
    },
  ];

type SfxName = "whoosh-transition" | "ui-click" | "impact-low";

const SFX_SPECS: {
  id: SfxName;
  text: string;
  durationSeconds: number;
  promptInfluence: number;
  usedFor: string;
}[] = [
  {
    id: "whoosh-transition",
    text: "fast clean air whoosh, short, no tail, for a video cut",
    durationSeconds: 0.6,
    promptInfluence: 0.5,
    usedFor:
      "generated, not used in the final mixes, owner decision 2026-09-03",
  },
  {
    // The brief asked for 0.3s. The API floor is 0.5 and a 0.3 request is
    // refused with invalid_generation_settings before anything is charged, so
    // this is 0.5. The tail is near silent and the click reads the same in the
    // mix, where the cue lands on a single frame anyway.
    id: "ui-click",
    text: "soft UI tap click, subtle, clean, no tail",
    durationSeconds: 0.5,
    promptInfluence: 0.5,
    usedFor:
      "generated, not used in the final mixes, owner decision 2026-09-03",
  },
  {
    id: "impact-low",
    text: "low soft cinematic thump impact, short, muted, no reverb tail",
    durationSeconds: 0.8,
    promptInfluence: 0.5,
    usedFor:
      "generated, not used in the final mixes, owner decision 2026-09-03",
  },
];

// ---------------------------------------------------------------------------
// Key handling
// ---------------------------------------------------------------------------

function readApiKey(): string {
  if (fs.existsSync(ENV_FILE)) {
    for (const rawLine of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      if (line.slice(0, eq).trim() !== "ELEVENLABS_API_KEY") continue;
      const value = line
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (value) return value;
    }
  }
  const fromEnv = process.env.ELEVENLABS_API_KEY;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  throw new Error(
    `No ELEVENLABS_API_KEY in ${ENV_FILE} and none in the environment.`,
  );
}

/** Strips anything that looks like the key out of text before it is printed. */
function redact(text: string, key: string): string {
  if (!key) return text;
  return text.split(key).join("<redacted>");
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

/**
 * fetch with a small retry on transport errors only. An HTTP error status is
 * returned to the caller so a 4xx is never silently retried into extra spend.
 */
async function fetchRetry(
  url: string,
  init: RequestInit,
  attempts = 4,
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetch(url, init);
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        const wait = 1500 * (i + 1);
        console.log(
          `    network error, retrying in ${wait}ms (${i + 1}/${attempts - 1})`,
        );
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastError;
}

async function apiGetJson(
  key: string,
  route: string,
): Promise<{ status: number; json: unknown }> {
  const res = await fetchRetry(`${API_BASE}${route}`, {
    headers: { "xi-api-key": key },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

/** POST that expects raw audio bytes back. Throws with a redacted body on any error status. */
async function apiPostAudio(
  key: string,
  route: string,
  body: unknown,
): Promise<{ bytes: Buffer; contentType: string }> {
  const res = await fetchRetry(`${API_BASE}${route}`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `POST ${route} returned ${res.status}: ${redact(text, key)}`,
    );
  }
  const contentType = res.headers.get("content-type") ?? "";
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 2000) {
    throw new Error(
      `POST ${route} returned only ${bytes.length} bytes (${contentType}): ` +
        redact(bytes.toString("utf8").slice(0, 500), key),
    );
  }
  return { bytes, contentType };
}

// ---------------------------------------------------------------------------
// Credit measurement
// ---------------------------------------------------------------------------

type UsageSnapshot = { total: number; buckets: Record<string, number> };

/**
 * Total credits spent per product bucket over a window wide enough to include
 * everything this workspace has done. Phase 4 only ever read the "Image
 * Generation" bucket. Music and sound effects land in buckets of their own,
 * and the bucket names are not documented, so this reads every bucket and
 * reports which one moved.
 */
async function usageSnapshot(key: string): Promise<UsageSnapshot | null> {
  const end = Date.now() + 3_600_000;
  const start = end - 72 * 3_600_000;
  const { status, json } = await apiGetJson(
    key,
    `/v1/usage/character-stats?start_unix=${start}&end_unix=${end}&breakdown_type=product_type`,
  );
  if (status !== 200 || !json) return null;
  const usage = (json as { usage?: Record<string, number[]> }).usage;
  if (!usage) return null;
  const buckets: Record<string, number> = {};
  let total = 0;
  for (const [name, series] of Object.entries(usage)) {
    const sum = series.reduce((a, b) => a + (Number(b) || 0), 0);
    buckets[name] = sum;
    total += sum;
  }
  return { total, buckets };
}

type CreditResult = { credits: number | null; bucket: string | null };

/**
 * Difference between a snapshot taken before a generation and the totals now.
 * The usage endpoint lags the generation by a few seconds, so this polls until
 * it moves or gives up and reports null rather than a wrong zero.
 */
async function creditsSince(
  key: string,
  before: UsageSnapshot | null,
): Promise<CreditResult> {
  if (!before) return { credits: null, bucket: null };
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await new Promise((r) => setTimeout(r, attempt === 0 ? 2500 : 5000));
    const after = await usageSnapshot(key);
    if (!after) continue;
    const delta = after.total - before.total;
    if (delta <= 0) continue;
    let bucket: string | null = null;
    let best = 0;
    for (const [name, value] of Object.entries(after.buckets)) {
      const moved = value - (before.buckets[name] ?? 0);
      if (moved > best) {
        best = moved;
        bucket = name;
      }
    }
    return { credits: delta, bucket };
  }
  return { credits: null, bucket: null };
}

// ---------------------------------------------------------------------------
// ffmpeg helpers
// ---------------------------------------------------------------------------

function run(
  bin: string,
  args: string[],
): { code: number; stdout: string; stderr: string } {
  const res = spawnSync(bin, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.error) throw res.error;
  return {
    code: res.status ?? -1,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
  };
}

function ffmpeg(args: string[]): {
  code: number;
  stdout: string;
  stderr: string;
} {
  return run("ffmpeg", ["-hide_banner", "-nostdin", ...args]);
}

type VolumeReading = { mean: number; max: number };

/**
 * mean_volume and max_volume in dBFS, optionally over a slice of the file.
 * volumedetect is the cheapest reliable level probe ffmpeg offers and is what
 * Section 9's first-second energy test needs.
 */
function measureVolume(
  file: string,
  slice?: { start: number; duration: number },
): VolumeReading {
  const args = ["-i", file];
  if (slice) {
    args.push(
      "-af",
      `atrim=${slice.start}:${slice.start + slice.duration},volumedetect`,
    );
  } else {
    args.push("-af", "volumedetect");
  }
  args.push("-f", "null", "-");
  const { stderr } = ffmpeg(args);
  const mean = Number(/mean_volume:\s*(-?[\d.]+) dB/.exec(stderr)?.[1] ?? NaN);
  const max = Number(/max_volume:\s*(-?[\d.]+) dB/.exec(stderr)?.[1] ?? NaN);
  return { mean, max };
}

function probeDuration(file: string): number {
  const { stdout } = run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=nw=1:nk=1",
    file,
  ]);
  return Number(stdout.trim());
}

type FirstSecondTest = {
  firstSecondMeanDb: number;
  wholeTrackMeanDb: number;
  deficitDb: number;
  toleranceDb: number;
  pass: boolean;
};

/**
 * Section 9: the 15 second cut needs a track that establishes itself in under
 * a second. This measures the first 1000 ms against the whole track and fails
 * anything sitting more than FIRST_SECOND_TOLERANCE_DB under it.
 */
function firstSecondTest(file: string): FirstSecondTest {
  const whole = measureVolume(file);
  const first = measureVolume(file, { start: 0, duration: 1.0 });
  const deficit = whole.mean - first.mean;
  return {
    firstSecondMeanDb: first.mean,
    wholeTrackMeanDb: whole.mean,
    deficitDb: Number(deficit.toFixed(2)),
    toleranceDb: FIRST_SECOND_TOLERANCE_DB,
    pass: deficit <= FIRST_SECOND_TOLERANCE_DB,
  };
}

/**
 * A file is unusable if it is effectively silent, or if it is genuinely
 * distorted rather than merely peak normalized.
 *
 * The first pass of this check failed anything reporting max_volume 0.0 dB and
 * rejected two perfectly good whoosh takes. The sound effects endpoint returns
 * every effect normalized so its peak sits exactly at 0 dBFS, which is the
 * normal shape of a delivered one shot, not clipping. Real clipping shows as a
 * long run of samples pinned at full scale, which is what astats reports as
 * Flat_factor, so that is what this measures now. The SFX are attenuated by
 * roughly 25 dB in the mix regardless.
 */
function sfxHealthCheck(file: string): {
  ok: boolean;
  reason: string;
  reading: VolumeReading;
} {
  const reading = measureVolume(file);
  if (!Number.isFinite(reading.max) || reading.max < -45) {
    return {
      ok: false,
      reason: `silent, max_volume ${reading.max} dB`,
      reading,
    };
  }
  const { stderr } = ffmpeg([
    "-i",
    file,
    "-af",
    "astats=measure_overall=Flat_factor",
    "-f",
    "null",
    "-",
  ]);
  const flat = Number(/Flat factor:\s*([\d.]+)/.exec(stderr)?.[1] ?? 0);
  if (flat > 1) {
    return {
      ok: false,
      reason: `distorted, astats flat factor ${flat}`,
      reading,
    };
  }
  return { ok: true, reason: "", reading };
}

// ---------------------------------------------------------------------------
// config/audio.json
// ---------------------------------------------------------------------------

type GenerationRecord = {
  kind: "music" | "sfx";
  id: string;
  file: string;
  prompt: string;
  model: string;
  lengthMs: number;
  creditsMeasured: number | null;
  creditsBucket: string | null;
  outputFormat: string;
  createdAt: string;
  accepted: boolean;
  notes: string;
  firstSecondTest?: FirstSecondTest;
  /** The --set label this generation was made under, if any. Absent for every Phase 5 record. */
  set?: string;
};

type MixRecord = {
  variant: VariantId;
  /** Absent for an audio-only preview built with no picture, e.g. mixTrainingVariant. */
  picture?: string;
  wav: string;
  preview: string;
  musicSource: string;
  sfxDuckDb: number;
  limiterCeilingDbfs: number;
  levels: MixLevels;
  /** Measured off the delivered wav, not loudnorm's own prediction. */
  measuredIntegratedLufs: number;
  measuredTruePeakDbfs: number;
  measuredLra: number;
  loudnormPredicted: {
    integratedLufs: number;
    truePeakDbtp: number;
    lra: number;
  };
  createdAt: string;
  /** The --set label this mix was made under, if any. Absent for every Phase 5 record. */
  set?: string;
};

type AudioConfig = {
  _note: string;
  api: Record<string, string>;
  generations: GenerationRecord[];
  mixes: MixRecord[];
};

const EMPTY_CONFIG: AudioConfig = {
  _note:
    "Phase 5 audio. Every billable ElevenLabs call in this phase is logged in " +
    "generations, including the ones that were rejected and regenerated. " +
    "creditsMeasured is a before and after delta on " +
    "/v1/usage/character-stats?breakdown_type=product_type, not an estimate. " +
    "Written by scripts/audio.ts.",
  api: {
    music:
      "POST /v1/music, body { prompt, music_length_ms, model_id, output_format, force_instrumental }, returns audio bytes",
    sfx: "POST /v1/sound-generation?output_format=..., body { text, duration_seconds, prompt_influence, model_id }, returns audio bytes",
    cost: "neither endpoint reports a cost, so cost is measured from the usage endpoint",
  },
  generations: [],
  mixes: [],
};

function loadConfig(): AudioConfig {
  if (!fs.existsSync(AUDIO_JSON)) return structuredClone(EMPTY_CONFIG);
  const parsed = JSON.parse(
    fs.readFileSync(AUDIO_JSON, "utf8"),
  ) as Partial<AudioConfig>;
  return {
    ...structuredClone(EMPTY_CONFIG),
    ...parsed,
    generations: parsed.generations ?? [],
    mixes: parsed.mixes ?? [],
  };
}

function saveConfig(config: AudioConfig): void {
  fs.mkdirSync(path.dirname(AUDIO_JSON), { recursive: true });
  fs.writeFileSync(AUDIO_JSON, `${JSON.stringify(config, null, 2)}\n`);
}

function recordGeneration(record: GenerationRecord): void {
  const config = loadConfig();
  config.generations.push(record);
  saveConfig(config);
}

function generationCount(): number {
  return loadConfig().generations.length;
}

/**
 * With no setLabel this is exactly the original Phase 5 check: total
 * generations logged in config/audio.json against GENERATION_CAP. Passing a
 * setLabel that has an entry in SET_CAPS instead counts only that set's own
 * generations against its own cap, so a later, separately scoped run is not
 * blocked by a legacy cap that earlier work already reached.
 */
function assertUnderCap(setLabel?: string): void {
  if (setLabel && SET_CAPS[setLabel] !== undefined) {
    const cap = SET_CAPS[setLabel];
    const used = loadConfig().generations.filter(
      (g) => g.set === setLabel,
    ).length;
    if (used >= cap) {
      throw new Error(
        `Generation cap reached: ${used} of ${cap} "${setLabel}" generations already logged ` +
          `in config/audio.json. Stopping rather than spending more.`,
      );
    }
    return;
  }
  const used = generationCount();
  if (used >= GENERATION_CAP) {
    throw new Error(
      `Generation cap reached: ${used} of ${GENERATION_CAP} ElevenLabs generations already logged ` +
        `in config/audio.json. Stopping rather than spending more.`,
    );
  }
}

function assertUnderCreditAlarm(credits: number | null, label: string): void {
  if (credits !== null && credits > CREDIT_ALARM) {
    throw new Error(
      `STOP: ${label} cost ${credits} credits, over the ${CREDIT_ALARM} credit alarm for this phase. ` +
        `Nothing further will be generated until the owner has seen this.`,
    );
  }
}

function rel(file: string): string {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

async function generateMusic(
  key: string,
  variantId: VariantId,
  lengthSeconds: number,
  attempt = 1,
  setLabel?: string,
): Promise<{ file: string; test: FirstSecondTest; credits: number | null }> {
  assertUnderCap(setLabel);
  const variant =
    MUSIC_VARIANTS.find((v) => v.id === variantId) ??
    TRAINING_MUSIC_VARIANTS.find((v) => v.id === variantId);
  if (!variant) throw new Error(`Unknown music variant "${variantId}".`);

  const instruction =
    setLabel === "training" ? TRAINING_MUSIC_INSTRUCTION : MUSIC_INSTRUCTION;
  const prompt = `${variant.feel} ${instruction}`;
  const lengthMs = Math.round(lengthSeconds * 1000);
  const suffix = attempt > 1 ? `-take${attempt}` : "";
  const id = `music-${variantId}-${lengthSeconds}s${suffix}`;
  const file = path.join(RAW_DIR, `${id}.mp3`);

  console.log(`\n[music] ${id}`);
  console.log(
    `  ${variant.note}, ${lengthMs}ms, ${MUSIC_MODEL}, ${MUSIC_FORMAT}`,
  );

  const before = await usageSnapshot(key);
  const { bytes, contentType } = await apiPostAudio(key, "/v1/music", {
    prompt,
    music_length_ms: lengthMs,
    model_id: MUSIC_MODEL,
    output_format: MUSIC_FORMAT,
    force_instrumental: true,
  });
  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.writeFileSync(file, bytes);
  console.log(
    `  wrote ${rel(file)} (${(bytes.length / 1024).toFixed(0)} KB, ${contentType})`,
  );

  const duration = probeDuration(file);
  const test = firstSecondTest(file);
  console.log(
    `  duration ${duration.toFixed(2)}s, first second ${test.firstSecondMeanDb} dB vs whole ` +
      `${test.wholeTrackMeanDb} dB, deficit ${test.deficitDb} dB -> ${test.pass ? "PASS" : "REJECT"}`,
  );

  const { credits, bucket } = await creditsSince(key, before);
  console.log(
    `  credits ${credits ?? "not reported"}${bucket ? ` (${bucket})` : ""}`,
  );
  assertUnderCreditAlarm(credits, id);

  recordGeneration({
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
    accepted: test.pass,
    notes: test.pass
      ? `${variant.note}. Measured duration ${duration.toFixed(2)}s.`
      : `${variant.note}. Rejected on the first-second energy test, deficit ${test.deficitDb} dB.`,
    firstSecondTest: test,
    set: setLabel,
  });

  return { file, test, credits };
}

/** Generates, and regenerates once if the first second is quiet. Section 9. */
async function generateMusicWithRetry(
  key: string,
  variantId: VariantId,
  lengthSeconds: number,
  setLabel?: string,
): Promise<string> {
  const first = await generateMusic(key, variantId, lengthSeconds, 1, setLabel);
  if (first.test.pass) return first.file;
  console.log(
    `  regenerating variant ${variantId} once, the first second was too quiet`,
  );
  const second = await generateMusic(key, variantId, lengthSeconds, 2, setLabel);
  if (!second.test.pass) {
    console.log(
      `  variant ${variantId} failed the first-second test twice. Keeping the better take and ` +
        `flagging it for the owner.`,
    );
    return second.test.deficitDb <= first.test.deficitDb
      ? second.file
      : first.file;
  }
  return second.file;
}

async function generateSfx(
  key: string,
  name: SfxName,
  attempt = 1,
): Promise<string> {
  assertUnderCap();
  const spec = SFX_SPECS.find((s) => s.id === name);
  if (!spec)
    throw new Error(
      `Unknown sfx "${name}". Use one of ${SFX_SPECS.map((s) => s.id).join(", ")}.`,
    );

  const suffix = attempt > 1 ? `-take${attempt}` : "";
  const id = `sfx-${spec.id}${suffix}`;
  const file = path.join(RAW_DIR, `${id}.mp3`);

  console.log(`\n[sfx] ${id}`);
  console.log(
    `  "${spec.text}" ${spec.durationSeconds}s, ${SFX_MODEL}, ${SFX_FORMAT}`,
  );

  const before = await usageSnapshot(key);
  const { bytes, contentType } = await apiPostAudio(
    key,
    `/v1/sound-generation?output_format=${SFX_FORMAT}`,
    {
      text: spec.text,
      duration_seconds: spec.durationSeconds,
      prompt_influence: spec.promptInfluence,
      model_id: SFX_MODEL,
    },
  );
  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.writeFileSync(file, bytes);
  console.log(
    `  wrote ${rel(file)} (${(bytes.length / 1024).toFixed(0)} KB, ${contentType})`,
  );

  const duration = probeDuration(file);
  const health = sfxHealthCheck(file);
  console.log(
    `  duration ${duration.toFixed(2)}s, mean ${health.reading.mean} dB, max ${health.reading.max} dB ` +
      `-> ${health.ok ? "PASS" : `REJECT (${health.reason})`}`,
  );

  const { credits, bucket } = await creditsSince(key, before);
  console.log(
    `  credits ${credits ?? "not reported"}${bucket ? ` (${bucket})` : ""}`,
  );
  assertUnderCreditAlarm(credits, id);

  recordGeneration({
    kind: "sfx",
    id,
    file: rel(file),
    prompt: spec.text,
    model: SFX_MODEL,
    lengthMs: Math.round(spec.durationSeconds * 1000),
    creditsMeasured: credits,
    creditsBucket: bucket,
    outputFormat: SFX_FORMAT,
    createdAt: new Date().toISOString(),
    accepted: health.ok,
    notes: health.ok
      ? `${spec.usedFor}. Measured duration ${duration.toFixed(2)}s, max ${health.reading.max} dB.`
      : `${spec.usedFor}. Rejected: ${health.reason}.`,
  });

  if (!health.ok && attempt === 1) {
    console.log(`  regenerating ${spec.id} once`);
    return generateSfx(key, name, 2);
  }
  return file;
}

// ---------------------------------------------------------------------------
// Mix
// ---------------------------------------------------------------------------

function pictureFile(): string {
  const phase4 = path.join(OUT_DIR, "phase4-vertical.mp4");
  const phase3 = path.join(OUT_DIR, "phase3-vertical.mp4");
  if (fs.existsSync(phase4)) return phase4;
  if (fs.existsSync(phase3)) return phase3;
  throw new Error(`No picture found. Expected ${phase4} or ${phase3}.`);
}

/** The accepted take for a music variant at a given length, newest wins. */
function musicTakeFor(variantId: VariantId, lengthSeconds: number): string {
  const config = loadConfig();
  const matches = config.generations.filter(
    (g) =>
      g.kind === "music" &&
      g.id.startsWith(`music-${variantId}-${lengthSeconds}s`) &&
      fs.existsSync(path.join(ROOT, g.file)),
  );
  if (matches.length === 0) {
    throw new Error(
      `No ${lengthSeconds}s take logged for music variant ${variantId}.`,
    );
  }
  const accepted = matches.filter((g) => g.accepted);
  const chosen = (accepted.length > 0 ? accepted : matches)[
    (accepted.length > 0 ? accepted : matches).length - 1
  ];
  return path.join(ROOT, chosen.file);
}

function sfxTakeFor(name: SfxName): string {
  const config = loadConfig();
  const matches = config.generations.filter(
    (g) =>
      g.kind === "sfx" &&
      g.id.startsWith(`sfx-${name}`) &&
      fs.existsSync(path.join(ROOT, g.file)),
  );
  if (matches.length === 0) throw new Error(`No take logged for sfx ${name}.`);
  const accepted = matches.filter((g) => g.accepted);
  const pool = accepted.length > 0 ? accepted : matches;
  return path.join(ROOT, pool[pool.length - 1].file);
}

type FlatCue = { name: SfxName; file: string; frame: number };

function flattenCues(): FlatCue[] {
  const cues: FlatCue[] = [];
  for (const { name, frames } of SFX_CUES) {
    const file = sfxTakeFor(name);
    for (const frame of frames) cues.push({ name, file, frame });
  }
  return cues;
}

/**
 * Per-SFX gain that puts each effect SFX_DUCK_DB under the trimmed music bed,
 * measured rather than guessed. Section 9 asks for at least 12 dB of
 * separation, so this uses 15 and reports the number it actually applied.
 *
 * The comparison is peak to peak. Mean is the wrong yardstick for a one shot:
 * the ui-click is 0.5s of which most is silence, so its mean sits at -54 dB
 * and matching means would have boosted it about 20 dB past where it belongs.
 * Peak to peak is apples to apples and is what the delivered levels below are
 * reported against.
 */
type MixLevels = {
  bedPeakDbfs: number;
  bedMeanDbfs: number;
  gainsDb: Record<string, number>;
  sfxPeakAfterGainDbfs: Record<string, number>;
};

function sfxLevels(musicFile: string, cues: FlatCue[]): MixLevels {
  const bed = measureVolume(musicFile, { start: 0, duration: PICTURE_SECONDS });
  const gainsDb: Record<string, number> = {};
  const sfxPeakAfterGainDbfs: Record<string, number> = {};
  for (const cue of cues) {
    if (gainsDb[cue.name] !== undefined) continue;
    const sfx = measureVolume(cue.file);
    const gain = Number((bed.max - SFX_DUCK_DB - sfx.max).toFixed(2));
    gainsDb[cue.name] = gain;
    sfxPeakAfterGainDbfs[cue.name] = Number((sfx.max + gain).toFixed(2));
  }
  return {
    bedPeakDbfs: bed.max,
    bedMeanDbfs: bed.mean,
    gainsDb,
    sfxPeakAfterGainDbfs,
  };
}

const AFORMAT =
  "aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo";

/**
 * A limiter sitting between the mix and loudnorm, with a ceiling worked out
 * per variant rather than fixed.
 *
 * It is here because loudnorm on its own could not reach -14 LUFS on this
 * material and will not say so. Two of the three beds arrive mastered with
 * their true peak within half a decibel of zero while their integrated
 * loudness sits near -19 LUFS, so the roughly 5 dB of gain the target needs
 * has nowhere to go. loudnorm protects the -1 dBTP ceiling and quietly gives
 * up on the loudness target instead, which is what left variants a and b at
 * -15.0 and -16.2 LUFS on the first attempt. Switching loudnorm from linear to
 * dynamic changed nothing: the gain cap is the same in both modes.
 *
 * Pulling the peaks down first gives loudnorm the headroom to do its job. How
 * far down depends on how much gain the variant needs, which is why a fixed
 * -6 dB ceiling still left variant b short and over-limited variant c. The
 * ceiling is solved for instead, in headroomCeilingDb below.
 *
 * level=disabled stops alimiter applying makeup gain of its own, so the only
 * thing setting the final level is loudnorm.
 */
function limiter(ceilingDb: number): string {
  const limit = Math.min(1, 10 ** (ceilingDb / 20)).toFixed(6);
  return `alimiter=limit=${limit}:attack=5:release=50:level=disabled`;
}

/** Never limit harder than this. If a bed needs more, something is wrong with it. */
const MAX_LIMITING_DB = -14;

const TARGET_LUFS = -14;

/**
 * True peak Section 9 and Section 11 want on the file that ships.
 */
const DELIVERED_TRUE_PEAK = -1;

/**
 * Headroom left in the wav for the AAC encode's own true peak overshoot.
 *
 * Measured 2026-09-03: a wav normalised to -1.01 dBTP came back out of
 * `scripts/encode.sh` at -0.88 dBTP in the delivered MP4, and the 45 second
 * mix moved 0.19 dB the same way. Lossy encoding reconstructs a slightly
 * different waveform, so it does not preserve a true peak ceiling, and
 * normalising the intermediate to exactly -1 puts the thing that actually
 * ships over the line. Half a decibel covers the largest movement seen with
 * room to spare and costs nothing audible: the loudness target is unchanged
 * and only the peaks sit lower.
 */
const ENCODE_TRUE_PEAK_HEADROOM_DB = 0.5;

const TARGET_TRUE_PEAK = DELIVERED_TRUE_PEAK - ENCODE_TRUE_PEAK_HEADROOM_DB;

/**
 * The mix graph. Input 0 is the music, inputs 1..n are one SFX instance each.
 * Repeating the same file as several inputs is cheaper to read than an asplit
 * fan-out and ffmpeg opens it once per input regardless.
 */
function buildFilter(
  cues: FlatCue[],
  gains: Record<string, number>,
  ceilingDb: number,
): string {
  const fadeStart = PICTURE_SECONDS - MUSIC_FADE_OUT_SECONDS;
  const parts: string[] = [
    `[0:a]atrim=0:${PICTURE_SECONDS},asetpts=N/SR/TB,` +
      `afade=t=out:st=${fadeStart}:d=${MUSIC_FADE_OUT_SECONDS},${AFORMAT}[bed]`,
  ];
  const labels = ["[bed]"];
  cues.forEach((cue, i) => {
    const delayMs = Math.round((cue.frame / FPS) * 1000);
    const label = `s${i}`;
    parts.push(
      `[${i + 1}:a]volume=${gains[cue.name]}dB,adelay=${delayMs}:all=1,` +
        `atrim=0:${PICTURE_SECONDS},${AFORMAT}[${label}]`,
    );
    labels.push(`[${label}]`);
  });
  // With the cue sheet empty the bed is the whole mix, and amix over a single
  // input is a no-op that still costs a filter. Feed the limiter directly.
  if (labels.length > 1) {
    parts.push(
      `${labels.join("")}amix=inputs=${labels.length}:duration=first:normalize=0[premix]`,
    );
  } else {
    parts.push(`[bed]anull[premix]`);
  }
  parts.push(`[premix]${limiter(ceilingDb)}[mixed]`);
  return parts.join(";");
}

/** Runs loudnorm in analysis mode over the mix graph at a given limiter ceiling. */
function analyseMix(inputs: string[], filter: string): LoudnormMeasurement {
  const res = ffmpeg([
    ...inputs,
    "-filter_complex",
    `${filter};[mixed]loudnorm=${LOUDNORM_TARGET}:print_format=json[out]`,
    "-map",
    "[out]",
    "-f",
    "null",
    "-",
  ]);
  if (res.code !== 0)
    throw new Error(`loudnorm analysis failed:\n${res.stderr.slice(-3000)}`);
  return parseLoudnorm(res.stderr);
}

/**
 * Solves for the limiter ceiling that leaves loudnorm exactly enough headroom
 * to reach -14 LUFS without breaching -1 dBTP.
 *
 * loudnorm's gain is capped by its peak headroom, so the final true peak is
 * roughly (peak after limiting) + (target loudness - loudness after limiting).
 * Limiting lowers loudness as well as peaks, so the first estimate is refined
 * against a real measurement rather than trusted.
 */
function headroomCeilingDb(
  inputs: string[],
  cues: FlatCue[],
  gains: Record<string, number>,
): { ceilingDb: number; measurement: LoudnormMeasurement } {
  // Ceiling 0 is a no-op limiter, so this measures the raw mix.
  const raw = analyseMix(inputs, buildFilter(cues, gains, 0));
  let ceiling = Math.min(
    Number(raw.input_tp),
    TARGET_TRUE_PEAK - (TARGET_LUFS - Number(raw.input_i)) - 1.0,
  );
  let measurement = raw;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    ceiling = Math.max(ceiling, MAX_LIMITING_DB);
    measurement = analyseMix(inputs, buildFilter(cues, gains, ceiling));
    const predictedPeak =
      Number(measurement.input_tp) +
      (TARGET_LUFS - Number(measurement.input_i));
    if (predictedPeak <= TARGET_TRUE_PEAK || ceiling <= MAX_LIMITING_DB) {
      return { ceilingDb: Number(ceiling.toFixed(2)), measurement };
    }
    ceiling -= predictedPeak - TARGET_TRUE_PEAK + 0.3;
  }
  return { ceilingDb: Number(ceiling.toFixed(2)), measurement };
}

function mixInputs(musicFile: string, cues: FlatCue[]): string[] {
  const args = ["-i", musicFile];
  for (const cue of cues) args.push("-i", cue.file);
  return args;
}

type LoudnormMeasurement = {
  input_i: string;
  input_tp: string;
  input_lra: string;
  input_thresh: string;
  target_offset: string;
  output_i?: string;
  output_tp?: string;
  output_lra?: string;
};

function parseLoudnorm(stderr: string): LoudnormMeasurement {
  const start = stderr.lastIndexOf("{");
  const end = stderr.lastIndexOf("}");
  if (start === -1 || end === -1)
    throw new Error(
      `No loudnorm JSON in ffmpeg output:\n${stderr.slice(-2000)}`,
    );
  return JSON.parse(stderr.slice(start, end + 1)) as LoudnormMeasurement;
}

const LOUDNORM_TARGET = `I=${TARGET_LUFS}:TP=${TARGET_TRUE_PEAK}:LRA=11`;

/**
 * Reads the true integrated loudness and true peak of a finished file by
 * running loudnorm in analysis mode over it.
 *
 * This exists because loudnorm's own pass 2 output_i is a prediction, not a
 * measurement, and the first run of this mix proved it can be wrong: two of
 * the three variants reported numbers that did not match what came out.
 * Everything reported to the owner comes from this function instead.
 */
function verifyLoudness(file: string): {
  integrated: number;
  truePeak: number;
  lra: number;
} {
  const { code, stderr } = ffmpeg([
    "-i",
    file,
    "-af",
    `loudnorm=${LOUDNORM_TARGET}:print_format=json`,
    "-f",
    "null",
    "-",
  ]);
  if (code !== 0)
    throw new Error(`loudness verification failed:\n${stderr.slice(-3000)}`);
  const m = parseLoudnorm(stderr);
  return {
    integrated: Number(m.input_i),
    truePeak: Number(m.input_tp),
    lra: Number(m.input_lra),
  };
}

/**
 * How far off target the measured file has to be before the corrective pass
 * below does anything.
 *
 * Everything in this project already treats loudnorm's pass 2 output as a
 * prediction rather than a measurement, and 0.15 dB is roughly the size of the
 * prediction error on a bed that behaves. Under that, correcting costs a second
 * encode of the wav and buys a number that no meter and no ear can tell apart.
 * Over it, the file is not at the target it claims to be at.
 */
const LOUDNESS_CORRECTION_DEADBAND_DB = 0.15;

/**
 * A third, corrective pass: measure the finished wav, and if it is not at the
 * target, shift the whole file by the measured difference.
 *
 * loudnorm in dynamic mode misses on some material and does not say so. On the
 * training reel's t-a bed it predicted -13.98 LUFS and delivered -13.71, which
 * is inside the 0.5 dB warning this script already prints but well outside what
 * the rest of the reel measures. A flat gain is the right instrument for the
 * residual: it is linear, so integrated loudness and true peak both move by
 * exactly the amount applied, and there is nothing left for a limiter to do.
 *
 * The correction is refused, loudly, if it would push the true peak over the
 * ceiling. That only happens when the file is quiet and peaky, and in that case
 * a gain is the wrong answer and the limiter ceiling upstream is the thing to
 * look at.
 */
function correctLoudness(
  wav: string,
  measured: { integrated: number; truePeak: number; lra: number },
): { integrated: number; truePeak: number; lra: number } {
  const delta = TARGET_LUFS - measured.integrated;
  if (Math.abs(delta) < LOUDNESS_CORRECTION_DEADBAND_DB) return measured;

  const projectedPeak = measured.truePeak + delta;
  if (projectedPeak > TARGET_TRUE_PEAK) {
    console.log(
      `  correction skipped: ${delta.toFixed(2)} dB would put the true peak at ` +
        `${projectedPeak.toFixed(2)} dBTP, over the ${TARGET_TRUE_PEAK} ceiling.`,
    );
    return measured;
  }

  const temp = `${wav}.correct.wav`;
  const res = ffmpeg([
    "-i",
    wav,
    "-af",
    `volume=${delta.toFixed(3)}dB,${AFORMAT}`,
    "-c:a",
    "pcm_s16le",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-y",
    temp,
  ]);
  if (res.code !== 0)
    throw new Error(`loudness correction failed:\n${res.stderr.slice(-3000)}`);
  fs.renameSync(temp, wav);
  const corrected = verifyLoudness(wav);
  console.log(
    `  pass 3 corrected: ${delta > 0 ? "+" : ""}${delta.toFixed(2)} dB, now ` +
      `I ${corrected.integrated} LUFS, TP ${corrected.truePeak} dBTP, LRA ${corrected.lra}`,
  );
  return corrected;
}

async function mixVariant(variantId: VariantId): Promise<MixRecord> {
  const picture = pictureFile();
  const musicFile = musicTakeFor(variantId, 20);
  const cues = flattenCues();
  const levels = sfxLevels(musicFile, cues);
  const inputs = mixInputs(musicFile, cues);

  console.log(`\n[mix ${variantId}]`);
  console.log(`  picture ${rel(picture)}`);
  console.log(`  music   ${rel(musicFile)}`);
  console.log(
    `  bed peak ${levels.bedPeakDbfs} dBFS, mean ${levels.bedMeanDbfs} dBFS`,
  );
  for (const [name, gain] of Object.entries(levels.gainsDb)) {
    console.log(
      `  sfx ${name}: ${gain > 0 ? "+" : ""}${gain} dB, peak lands at ` +
        `${levels.sfxPeakAfterGainDbfs[name]} dBFS, ${SFX_DUCK_DB} dB under the bed peak`,
    );
  }

  // Pass 1: solve for the limiter ceiling, and measure the mix behind it.
  const { ceilingDb, measurement: measured } = headroomCeilingDb(
    inputs,
    cues,
    levels.gainsDb,
  );
  const filter = buildFilter(cues, levels.gainsDb, ceilingDb);
  console.log(
    `  limiter ceiling ${ceilingDb} dBFS, solved for the gain loudnorm needs`,
  );
  console.log(
    `  pass 1: I ${measured.input_i} LUFS, TP ${measured.input_tp} dBTP, LRA ${measured.input_lra}`,
  );

  // Pass 2: correct, and write the bare mix.
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  const wav = path.join(AUDIO_DIR, `mix-${variantId}-15s.wav`);
  const pass2Filter =
    `${filter};[mixed]loudnorm=${LOUDNORM_TARGET}:measured_I=${measured.input_i}:` +
    `measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:` +
    `measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:` +
    // Dynamic rather than linear. These beds are mastered with their true peak
    // already close to zero while their integrated loudness sits near -19
    // LUFS, so the roughly 5 dB of gain needed to reach -14 cannot be applied
    // as a flat offset without breaching the -1 dBTP ceiling. In linear mode
    // loudnorm silently gives up on the loudness target to protect the peak,
    // which is what left variants a and b at -14.9 and -16.2 on the first run.
    // Dynamic mode brings loudnorm's own true peak limiter in and lands the
    // target. LRA on all three beds is under 1.0, so there is nothing here for
    // dynamic mode to pump.
    `linear=false:print_format=json[norm];[norm]${AFORMAT}[out]`;
  const pass2 = ffmpeg([
    ...inputs,
    "-filter_complex",
    pass2Filter,
    "-map",
    "[out]",
    "-c:a",
    "pcm_s16le",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-y",
    wav,
  ]);
  if (pass2.code !== 0)
    throw new Error(`loudnorm pass 2 failed:\n${pass2.stderr.slice(-3000)}`);
  const corrected = parseLoudnorm(pass2.stderr);
  console.log(
    `  pass 2 predicted: I ${corrected.output_i} LUFS, TP ${corrected.output_tp} dBTP, ` +
      `LRA ${corrected.output_lra}`,
  );
  const verified = verifyLoudness(wav);
  console.log(
    `  pass 2 verified:  I ${verified.integrated} LUFS, TP ${verified.truePeak} dBTP, ` +
      `LRA ${verified.lra}`,
  );
  console.log(`  wrote ${rel(wav)}`);

  // Picture plus the finished mix.
  const preview = path.join(AUDIO_DIR, `preview-${variantId}.mp4`);
  const mux = ffmpeg([
    "-i",
    picture,
    "-i",
    wav,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "256k",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-shortest",
    "-movflags",
    "+faststart",
    "-y",
    preview,
  ]);
  if (mux.code !== 0)
    throw new Error(`preview mux failed:\n${mux.stderr.slice(-3000)}`);
  console.log(`  wrote ${rel(preview)}`);

  const record: MixRecord = {
    variant: variantId,
    picture: rel(picture),
    wav: rel(wav),
    preview: rel(preview),
    musicSource: rel(musicFile),
    sfxDuckDb: SFX_DUCK_DB,
    limiterCeilingDbfs: ceilingDb,
    levels,
    measuredIntegratedLufs: verified.integrated,
    measuredTruePeakDbfs: verified.truePeak,
    measuredLra: verified.lra,
    loudnormPredicted: {
      integratedLufs: Number(corrected.output_i),
      truePeakDbtp: Number(corrected.output_tp),
      lra: Number(corrected.output_lra),
    },
    createdAt: new Date().toISOString(),
  };
  const config = loadConfig();
  config.mixes = config.mixes.filter((m) => m.variant !== variantId);
  config.mixes.push(record);
  config.mixes.sort((a, b) => a.variant.localeCompare(b.variant));
  saveConfig(config);
  return record;
}

/** Where the training-set audio-only previews land, gate t5 of the second reel. */
const TRAINING_PREVIEW_DIR = path.join(OUT_DIR, "gate-t5");

/**
 * Audio-only counterpart to mixVariant for the training-set variants (t-a,
 * t-b, t-c). No picture is muxed in: the owner has not chosen a variant yet,
 * so this produces an mp3 to listen to (out/gate-t5/preview-{id}.mp3) and the
 * same bare wav mixVariant writes (assets/audio/mix-{id}-15s.wav) so either
 * can drop straight into the reel later. The trim, fade, limiter and two-pass
 * loudnorm are identical to mixVariant's, reusing the same helpers, so the
 * delivered levels match Section 9's targets the same way. SFX_CUES is empty,
 * so flattenCues() returns nothing here exactly as it does for mixVariant:
 * both are music-only mixes, per the owner's 2026-09-03 decision.
 */
async function mixTrainingVariant(variantId: VariantId): Promise<MixRecord> {
  const musicFile = musicTakeFor(variantId, 20);
  const cues = flattenCues();
  const levels = sfxLevels(musicFile, cues);
  const inputs = mixInputs(musicFile, cues);

  console.log(`\n[mix ${variantId}] (training set, audio-only preview)`);
  console.log(`  music   ${rel(musicFile)}`);
  console.log(
    `  bed peak ${levels.bedPeakDbfs} dBFS, mean ${levels.bedMeanDbfs} dBFS`,
  );

  const { ceilingDb, measurement: measured } = headroomCeilingDb(
    inputs,
    cues,
    levels.gainsDb,
  );
  const filter = buildFilter(cues, levels.gainsDb, ceilingDb);
  console.log(
    `  limiter ceiling ${ceilingDb} dBFS, solved for the gain loudnorm needs`,
  );
  console.log(
    `  pass 1: I ${measured.input_i} LUFS, TP ${measured.input_tp} dBTP, LRA ${measured.input_lra}`,
  );

  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  const wav = path.join(AUDIO_DIR, `mix-${variantId}-15s.wav`);
  const pass2Filter =
    `${filter};[mixed]loudnorm=${LOUDNORM_TARGET}:measured_I=${measured.input_i}:` +
    `measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:` +
    `measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:` +
    `linear=false:print_format=json[norm];[norm]${AFORMAT}[out]`;
  const pass2 = ffmpeg([
    ...inputs,
    "-filter_complex",
    pass2Filter,
    "-map",
    "[out]",
    "-c:a",
    "pcm_s16le",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-y",
    wav,
  ]);
  if (pass2.code !== 0)
    throw new Error(`loudnorm pass 2 failed:\n${pass2.stderr.slice(-3000)}`);
  const corrected = parseLoudnorm(pass2.stderr);
  console.log(
    `  pass 2 predicted: I ${corrected.output_i} LUFS, TP ${corrected.output_tp} dBTP, ` +
      `LRA ${corrected.output_lra}`,
  );
  const afterPass2 = verifyLoudness(wav);
  console.log(
    `  pass 2 verified:  I ${afterPass2.integrated} LUFS, TP ${afterPass2.truePeak} dBTP, ` +
      `LRA ${afterPass2.lra}`,
  );
  // The training beds needed this and reel one's did not, which is why it is
  // here and not in mixVariant above: correcting a file that is already inside
  // the deadband would rewrite reel one's delivered mixes for no gain.
  const verified = correctLoudness(wav, afterPass2);
  console.log(`  wrote ${rel(wav)}`);

  fs.mkdirSync(TRAINING_PREVIEW_DIR, { recursive: true });
  const preview = path.join(TRAINING_PREVIEW_DIR, `preview-${variantId}.mp3`);
  const enc = ffmpeg([
    "-i",
    wav,
    "-c:a",
    "libmp3lame",
    "-b:a",
    "320k",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-y",
    preview,
  ]);
  if (enc.code !== 0)
    throw new Error(`mp3 preview encode failed:\n${enc.stderr.slice(-3000)}`);
  console.log(`  wrote ${rel(preview)}`);

  const record: MixRecord = {
    variant: variantId,
    wav: rel(wav),
    preview: rel(preview),
    musicSource: rel(musicFile),
    sfxDuckDb: SFX_DUCK_DB,
    limiterCeilingDbfs: ceilingDb,
    levels,
    measuredIntegratedLufs: verified.integrated,
    measuredTruePeakDbfs: verified.truePeak,
    measuredLra: verified.lra,
    loudnormPredicted: {
      integratedLufs: Number(corrected.output_i),
      truePeakDbtp: Number(corrected.output_tp),
      lra: Number(corrected.output_lra),
    },
    createdAt: new Date().toISOString(),
    set: "training",
  };
  const config = loadConfig();
  config.mixes = config.mixes.filter((m) => m.variant !== variantId);
  config.mixes.push(record);
  config.mixes.sort((a, b) => a.variant.localeCompare(b.variant));
  saveConfig(config);
  return record;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (command === "usage") {
    const key = readApiKey();
    const snapshot = await usageSnapshot(key);
    console.log(JSON.stringify(snapshot, null, 2));
    return;
  }

  if (command === "music") {
    const key = readApiKey();
    const variant = (flag(argv, "variant") ?? "a") as VariantId;
    const length = Number(flag(argv, "length") ?? 20);
    const setLabel = flag(argv, "set");
    await generateMusicWithRetry(key, variant, length, setLabel);
    return;
  }

  if (command === "sfx") {
    const key = readApiKey();
    const name = flag(argv, "name") as SfxName | undefined;
    if (!name)
      throw new Error(
        `sfx needs --name, one of ${SFX_SPECS.map((s) => s.id).join(", ")}`,
      );
    await generateSfx(key, name);
    return;
  }

  if (command === "all") {
    const key = readApiKey();
    for (const variant of MUSIC_VARIANTS)
      await generateMusicWithRetry(key, variant.id, 20);
    for (const variant of MUSIC_VARIANTS)
      await generateMusicWithRetry(key, variant.id, 50);
    for (const spec of SFX_SPECS) await generateSfx(key, spec.id);
    console.log(
      `\n${generationCount()} of ${GENERATION_CAP} generations used.`,
    );
    return;
  }

  if (command === "mix") {
    const setLabel = flag(argv, "set");
    const only = flag(argv, "variant") as VariantId | undefined;
    if (setLabel === "training") {
      const variants = only ? [only] : (["t-a", "t-b", "t-c"] as VariantId[]);
      const results: MixRecord[] = [];
      for (const variant of variants)
        results.push(await mixTrainingVariant(variant));
      console.log("\nmix results (training set, audio-only preview)");
      for (const r of results) {
        console.log(
          `  ${r.variant}: I ${r.measuredIntegratedLufs} LUFS, TP ${r.measuredTruePeakDbfs} dBTP, ` +
            `LRA ${r.measuredLra}  ${r.preview}`,
        );
      }
      return;
    }
    const variants = only ? [only] : (["a", "b", "c"] as VariantId[]);
    const results: MixRecord[] = [];
    for (const variant of variants) results.push(await mixVariant(variant));
    console.log("\nmix results");
    for (const r of results) {
      console.log(
        `  ${r.variant}: I ${r.measuredIntegratedLufs} LUFS, TP ${r.measuredTruePeakDbfs} dBTP, ` +
          `LRA ${r.measuredLra}  ${r.preview}`,
      );
    }
    return;
  }

  console.log(
    [
      "Usage:",
      "  npx tsx scripts/audio.ts music --variant a|b|c --length 20|50",
      "  npx tsx scripts/audio.ts music --variant t-a|t-b|t-c --length 20 --set training",
      "  npx tsx scripts/audio.ts sfx --name whoosh-transition|ui-click|impact-low",
      "  npx tsx scripts/audio.ts all",
      "  npx tsx scripts/audio.ts mix [--variant a|b|c]",
      "  npx tsx scripts/audio.ts mix --set training [--variant t-a|t-b|t-c]",
      "  npx tsx scripts/audio.ts usage",
    ].join("\n"),
  );
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
