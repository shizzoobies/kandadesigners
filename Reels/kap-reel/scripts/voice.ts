/**
 * scripts/voice.ts
 *
 * Narration for the tutorial reels: one ElevenLabs text to speech file per
 * beat, and the mix that beds the music under it.
 *
 * See docs/superpowers/specs/2026-09-04-tutorial-reels-design.md, "Audio".
 *
 * Run:
 *   npx tsx scripts/voice.ts voices [--search calm]
 *   npx tsx scripts/voice.ts audition
 *   npx tsx scripts/voice.ts usage
 *   npx tsx scripts/voice.ts --reel contrast|hero|both --cut short|linkedin|both
 *   npx tsx scripts/voice.ts --reel both --cut both --dry-run
 *   npx tsx scripts/voice.ts --mix --reel both --cut both
 *
 * Flags:
 *   --reel contrast|hero|both   which tutorial. Default both.
 *   --cut short|linkedin|both   which cut. Default both.
 *   --dry-run                   print the beats, character counts and a credit
 *                               estimate, and call nothing.
 *   --mix                       build the mixes instead of generating voice.
 *   --force                     regenerate even when the hash already matches.
 *   --voice <id>                override the draft voice for this run.
 *   --model <id>                eleven_multilingual_v2 (default, every line above
 *                               behaves exactly as it always has) or eleven_v3.
 *
 * eleven_v3 candidates (added 2026-09-24, see "eleven_v3" below). One reel and
 * one cut at a time, read from a tagged script file, never from src:
 *   npx tsx scripts/voice.ts --model eleven_v3 --reel contrast --cut short --stability natural [--dry-run]
 *   npx tsx scripts/voice.ts --model eleven_v3 --reel contrast --cut short --stability natural --stitch
 *   npx tsx scripts/voice.ts --model eleven_v3 --reel contrast --cut short --stability natural \
 *     --mix --music i-b --out out/candidates/contrast-15s-preview-1.mp3
 *
 *   --stability natural|creative|robust   the v3 stability mode. Default natural.
 *   --script <path>             tagged script. Default config/<reel>-v3-script.json.
 *   --stitch                    voice only preview of the cut, beats placed where
 *                               src/tutorial/timeline.ts would place them, to
 *                               out/candidates/<reel>-15s-voice-<stability>.mp3.
 *   --mix --music <variant>     the same ducked mix as the v2 --mix, over the named
 *     --out <file.mp3>          music take, encoded to the given mp3.
 *
 * API contract, confirmed against the live docs on 2026-09-04:
 *
 *   POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
 *     query:  output_format (also accepted in the body; sent as a query
 *             parameter here, which is what the reference shows)
 *     header: xi-api-key, content-type: application/json
 *     body:   { text, model_id?, voice_settings?, language_code?, seed?,
 *               previous_text?, next_text?, previous_request_ids?,
 *               next_request_ids?, apply_text_normalization?,
 *               pronunciation_dictionary_locators? }
 *     voice_settings: { stability 0-1 default 0.5, similarity_boost 0-1
 *               default 0.75, style 0-1 default 0, use_speaker_boost bool
 *               default true, speed 0.25-4.0 default 1 }
 *     output_format: mp3_44100_128 is the default and the highest mp3 the free
 *               tiers allow; mp3_44100_192 and the pcm_* and wav_* formats are
 *               also offered. mp3_44100_128 is plenty for a voice stem that is
 *               resampled to 48 kHz in the mix.
 *     200: raw audio bytes, not JSON.
 *
 *   GET https://api.elevenlabs.io/v1/voices
 *     Lists the workspace's voices including the premade library ones, with a
 *     description and labels per voice. Used once, to choose the draft read.
 *
 * Model choice, and why it is not eleven_v3.
 *
 *   eleven_v3 is the newer and more expressive model, it is on the API under
 *   that id, and it is priced the same as eleven_multilingual_v2 at one credit
 *   per character. Two things in the docs decide against it here. First, the
 *   text to speech best practices page describes v3 as being at a "research
 *   preview stage" and says its library voices "may produce more variable
 *   results compared to the v2 and v2.5 models". This timeline is laid out from
 *   the measured duration of each file and a beat is only regenerated when its
 *   text, voice, model or settings change, so a model that reads the same
 *   sentence differently on each call is the wrong instrument: it would move
 *   the picture every time anything was regenerated. Second, v3 drops
 *   similarity_boost and speaker boost, and its pacing is directed with audio
 *   tags rather than with the speed setting.
 *
 *   eleven_multilingual_v2 is generally available, honors every voice setting
 *   below, and the same page notes it "can better generalize the reading out of
 *   numbers in a way that is more natural for human listeners", which matters
 *   for a tutorial whose whole subject is a contrast ratio read aloud.
 *
 * eleven_v3, added 2026-09-24 on Alex's call.
 *
 *   He found the v2 read flat and approved v3 with audio tags for candidates.
 *   The reasons above still hold for anything that ships: v3 is opt in with
 *   --model eleven_v3, its beats live in their own folders and in their own
 *   "v3" section of config/voice.json, and nothing in src/ ever reads them,
 *   so the rendered timelines cannot move because a v3 candidate was made.
 *
 *   Confirmed against the live docs on 2026-09-24:
 *
 *   - Same endpoint and body as above with model_id "eleven_v3". The models
 *     page now lists it as generally available, 70+ languages, a 5,000
 *     character limit per request, and not meant for real time use.
 *   - Stability is a mode, not a dial. The v3 prompting guide names three:
 *     Creative ("More emotional and expressive, but prone to
 *     hallucinations"), Natural ("Closest to the original voice recording,
 *     balanced and neutral") and Robust ("Highly stable, but less responsive
 *     to directional prompts but consistent, similar to v2"). The official
 *     pages give no numbers for them. 0.0, 0.5 and 1.0 are the values the
 *     playground's three position slider sends and that third party SDK notes
 *     report the API rounds to, so that is what V3_STABILITY holds; it is not
 *     from the ElevenLabs docs themselves, and the 2026-09-24 calls at 0.0
 *     and 0.5 were accepted as sent, which is all that was verified.
 *   - Of the other voice settings the best practices page names only speed as
 *     honored by v3 (0.7 to 1.2). similarity_boost, style and speaker boost
 *     are v2 controls. So a v3 call sends voice_settings { stability } and
 *     nothing else: speed stays at its default for the same reason it does
 *     on v2, and sending settings v3 ignores would only muddy the record.
 *   - Audio tags are written inline in square brackets, lower case words,
 *     placed before the words they color: "[amused] This amber on cream
 *     looks fine." The guide's examples are emotional and delivery tags
 *     ([excited], [curious], [sarcastic], [whispers], [laughs], [sighs]) and
 *     it warns that how well a tag works depends on the voice. SSML break
 *     tags are not supported on v3; the help center page on pauses gives
 *     [pause], [short pause] and [long pause] instead, alongside ellipses.
 *   - The tags are spoken as direction, not read out, and they are billed as
 *     characters like any other text, so a tagged line costs its tags too.
 *
 *   Tags belong to the narration string sent to the model and nowhere else.
 *   stripAudioTags() below removes them, the v3 path refuses a script whose
 *   stripped text is not word for word the narration in src/tutorial/reels,
 *   and captions and the SRT keep reading that untagged narration from src.
 *
 *   The cache key for a v3 beat is voiceHash() over the tagged text, the
 *   voice, "eleven_v3" and the stability, with the settings v3 is not sent
 *   pinned to constants, so a beat is regenerated only when one of those four
 *   changes, and never twice for the same tagged line.
 *
 * Credits. The text to speech endpoint reports no cost, so cost is measured the
 * way scripts/audio.ts measures music and sound effects: a before and after
 * delta on /v1/usage/character-stats?breakdown_type=product_type, sampled
 * around each call. Every key reading, retry, usage snapshot, credit
 * measurement and loudness function below is imported from scripts/audio.ts
 * rather than copied.
 *
 * The API key is read from .env or ELEVENLABS_API_KEY, never printed, never
 * written to config/voice.json, never sent anywhere but api.elevenlabs.io.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AFORMAT,
  LOUDNORM_TARGET,
  TARGET_LUFS,
  apiGetJson,
  assertUnderCreditAlarm,
  correctLoudness,
  creditsSince,
  fetchRetry,
  ffmpeg,
  headroomCeilingDb,
  limiter,
  measureVolume,
  musicTake,
  parseLoudnorm,
  probeDuration,
  readApiKey,
  redact,
  usageSnapshot,
  verifyLoudness,
} from "./audio.js";
import { CONTRAST_TUTORIAL } from "../src/tutorial/reels/contrast.js";
import { HERO_TUTORIAL } from "../src/tutorial/reels/hero.js";
import {
  FPS,
  beatFrames,
  estimateSeconds,
  tutorialBeats,
  tutorialTimeline,
  TUTORIAL_TOTAL_FRAMES,
  type TutorialTimeline,
} from "../src/tutorial/timeline.js";
import {
  findVoice,
  mixFilePath,
  voiceFilePath,
  voiceHash,
  type VoiceAudition,
  type VoiceGeneration,
  type VoiceLog,
  type VoiceMixRecord,
  type VoiceSettings,
} from "../src/tutorial/voice-log.js";
import type {
  TutorialBeat,
  TutorialContent,
  TutorialCut,
} from "../src/tutorial/types.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const VOICE_JSON = path.join(ROOT, "config", "voice.json");

const API_BASE = "https://api.elevenlabs.io";

const MODEL = "eleven_multilingual_v2";
const OUTPUT_FORMAT = "mp3_44100_128";

/**
 * The draft voice, and the read it is asked for.
 *
 * stability 0.5 is the documented default and is the middle of the trade: below
 * it the model takes more liberties with emphasis, above it the read flattens.
 * A tutorial wants a level, unhurried read that says a number without acting
 * it, so the middle is right and it is also the setting that repeats most
 * closely if a line has to be regenerated.
 *
 * style 0, deliberately. Style exaggerates the source voice's own delivery and
 * the docs note it costs latency and stability; there is nothing here to
 * exaggerate.
 *
 * speed 1.0. The spec is explicit that speed is not touched to make a script
 * fit: if a cut comes in long, the line is shortened. Leaving this at 1.0 means
 * the timeline is laid out against a read a person would actually give.
 *
 * The id and the reason are written into config/voice.json on every generation,
 * so the choice is on the record next to the spend it caused. This constant is
 * the source of truth and the log is the record of it, not the other way round:
 * changing the id here is the whole of changing the voice, because a different
 * voice is a different hash and every beat regenerates on its own. That is what
 * the 2026-09-05 swap from Eric to Sarah cost, and nothing else.
 */
const DRAFT_VOICE = {
  id: "EXAVITQu4vr4xnSDxMaL",
  name: "Sarah",
  why:
    "Premade library voice, listed as \"Sarah - Mature, Reassuring, " +
    "Confident\": \"Young adult woman with a confident and warm, mature " +
    "quality and a reassuring, professional tone\", American. Chosen 2026-09-05 " +
    "on Alex's call for a friendly female read, from the five premade voices " +
    "GET /v1/voices returns as female and American. All five were auditioned " +
    "on one line at these exact settings, with Eric read as a control so the " +
    "pace comparison was measured rather than estimated; the files and the " +
    "full ranking are in out/voice-samples/. She won on all three criteria in " +
    "order. Clarity on numbers: she gives \"It measures two point nine to " +
    "one\" 1.849 seconds, the most of the six and 21 percent more than Eric " +
    "spends on it, and the ratio is the one thing a listener has to catch. " +
    "Warmth without sounding like an advertisement: her sentence junctions are " +
    "0.06, 0.06 and 0.15 seconds against Eric's half second, so sentences run " +
    "into each other the way speech does, where Bella's metronomic 0.35 at " +
    "every junction is the voiceover tell her own description calls a " +
    "\"deliberate, rhythmic pace\". Pace: 6.873 seconds against Eric's 6.827, " +
    "seven tenths of one percent, and nothing else in the set is within three " +
    "percent, so the four timelines barely move and what gets signed off is " +
    "the voice rather than a re-cut. Bella and Matilda are the alternates. " +
    "Laura and Jessica were auditioned and not ranked: sassy, social media, " +
    "cute and trendy are the advertisement read this rules out, and Laura " +
    "being the fastest of the six did not save her. The voice carries no " +
    "recommended settings of its own (settings is null on GET /v1/voices), so " +
    "the settings below are unchanged from Eric's. DRAFT only, pending Alex's " +
    "sign-off, and nothing about the pipeline changes when it is replaced " +
    "again, because the voice is part of the hash.",
};

const SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true,
  speed: 1.0,
};

/**
 * Credits per character for eleven_multilingual_v2, used only by --dry-run.
 * One to one, per the ElevenLabs pricing page: the v2 and v3 text to speech
 * models bill a credit a character. Every figure that goes into
 * config/voice.json is measured, never this.
 */
const CREDITS_PER_CHARACTER = 1;

/**
 * Hard cap on generations logged in config/voice.json, the same guard
 * scripts/audio.ts puts on music and sound effects.
 *
 * Twenty two beats cover both tutorials and both cuts, so this allows the draft
 * pass, Kai's pass, and one full regeneration after a script edit before the
 * run stops and asks. It is deliberately not generous.
 */
const GENERATION_CAP = 80;

const TUTORIALS: Record<string, TutorialContent> = {
  contrast: CONTRAST_TUTORIAL,
  hero: HERO_TUTORIAL,
};

const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join("/");

// ---------------------------------------------------------------------------
// config/voice.json
// ---------------------------------------------------------------------------

const EMPTY_LOG: VoiceLog = {
  _note:
    "Tutorial reel narration. Every billable ElevenLabs text to speech call is " +
    "logged in generations with the exact text sent, the voice, the model, the " +
    "settings, the measured duration of the file and the credits it cost. " +
    "creditsMeasured is a before and after delta on " +
    "/v1/usage/character-stats?breakdown_type=product_type, not an estimate, " +
    "the same way config/audio.json measures music and sound effects. " +
    "src/tutorial/timeline.ts lays the beats out from durationSeconds. " +
    "Written by scripts/voice.ts.",
  api: {
    tts: "POST /v1/text-to-speech/{voice_id}?output_format=mp3_44100_128, body { text, model_id, voice_settings }, returns audio bytes",
    voices: "GET /v1/voices, for choosing the draft library voice",
    cost: "the text to speech endpoint reports no cost, so cost is measured from the usage endpoint",
  },
  voice: null,
  generations: [],
  auditions: [],
  mixes: [],
};

function loadLog(): VoiceLog {
  if (!fs.existsSync(VOICE_JSON)) return structuredClone(EMPTY_LOG);
  const parsed = JSON.parse(
    fs.readFileSync(VOICE_JSON, "utf8"),
  ) as Partial<VoiceLog>;
  return {
    ...structuredClone(EMPTY_LOG),
    ...parsed,
    voice: parsed.voice ?? null,
    generations: parsed.generations ?? [],
    auditions: parsed.auditions ?? [],
    mixes: parsed.mixes ?? [],
  };
}

function saveLog(log: VoiceLog): void {
  fs.mkdirSync(path.dirname(VOICE_JSON), { recursive: true });
  fs.writeFileSync(VOICE_JSON, `${JSON.stringify(log, null, 2)}\n`);
}

function assertUnderCap(log: VoiceLog): void {
  if (log.generations.length >= GENERATION_CAP) {
    throw new Error(
      `Generation cap reached: ${log.generations.length} of ${GENERATION_CAP} ` +
        `text to speech generations already logged in config/voice.json. ` +
        `Stopping rather than spending more.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

type Job = {
  tutorial: TutorialContent;
  cut: TutorialCut;
  beat: TutorialBeat;
  file: string;
  hash: string;
};

function jobsFor(
  content: TutorialContent,
  cut: TutorialCut,
  voiceId: string,
): Job[] {
  return tutorialBeats(content, cut).map((beat) => ({
    tutorial: content,
    cut,
    beat,
    file: path.join(ROOT, voiceFilePath(content.id, cut, beat.id)),
    hash: voiceHash(beat.narration, voiceId, MODEL, SETTINGS),
  }));
}

/**
 * Whether this beat's audio is already on disk and already correct.
 *
 * The hash covers the text, the voice, the model and every setting, so a
 * reworded line, a different voice or a changed stability all regenerate, and
 * nothing else does. The file has to exist as well as match: a log entry
 * without a file is what a half finished run leaves behind.
 */
function upToDate(log: VoiceLog, job: Job): VoiceGeneration | null {
  const found = findVoice(log, job.tutorial.id, job.cut, job.beat.id);
  if (!found) return null;
  if (found.hash !== job.hash) return null;
  if (!fs.existsSync(path.join(ROOT, found.file))) return null;
  return found;
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

/**
 * One text to speech call, at this file's model, settings and output format.
 *
 * Shared by the beats and by the audition, so a candidate voice is heard on
 * exactly the terms the tutorials will use it on: same model, same stability,
 * same speed. An audition read under different settings would answer a
 * question nobody asked.
 */
async function speak(
  key: string,
  voiceId: string,
  text: string,
  label: string,
  // The v3 path passes its own model and its stability-only settings. Left
  // out, this is the v2 call it has always been.
  model: { model_id: string; voice_settings: object } = {
    model_id: MODEL,
    voice_settings: SETTINGS,
  },
): Promise<Buffer> {
  const res = await fetchRetry(
    `${API_BASE}/v1/text-to-speech/${voiceId}?output_format=${OUTPUT_FORMAT}`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({ text, ...model }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `POST /v1/text-to-speech/${voiceId} returned ${res.status}: ` +
        redact(body, key),
    );
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 2000) {
    throw new Error(
      `${label}: the endpoint returned only ${bytes.length} bytes: ` +
        redact(bytes.toString("utf8").slice(0, 500), key),
    );
  }
  return bytes;
}

async function generateBeat(
  key: string,
  log: VoiceLog,
  job: Job,
  voiceId: string,
  voiceName: string,
): Promise<VoiceGeneration> {
  assertUnderCap(log);
  const label = `${job.tutorial.id}/${job.cut}/${job.beat.id}`;
  const text = job.beat.narration;

  console.log(`\n[voice] ${label}`);
  console.log(`  ${text.length} characters, ${MODEL}, ${OUTPUT_FORMAT}`);

  const before = await usageSnapshot(key);
  const bytes = await speak(key, voiceId, text, label);

  fs.mkdirSync(path.dirname(job.file), { recursive: true });
  fs.writeFileSync(job.file, bytes);
  const durationSeconds = Number(probeDuration(job.file).toFixed(3));
  console.log(
    `  wrote ${rel(job.file)} (${(bytes.length / 1024).toFixed(0)} KB, ` +
      `${durationSeconds.toFixed(2)}s)`,
  );

  const { credits, bucket } = await creditsSince(key, before);
  console.log(
    `  credits ${credits ?? "not reported"}${bucket ? ` (${bucket})` : ""}`,
  );
  assertUnderCreditAlarm(credits, label);

  const record: VoiceGeneration = {
    tutorial: job.tutorial.id,
    cut: job.cut,
    beatId: job.beat.id,
    file: rel(job.file),
    text,
    characters: text.length,
    hash: job.hash,
    voiceId,
    voiceName,
    model: MODEL,
    settings: SETTINGS,
    outputFormat: OUTPUT_FORMAT,
    durationSeconds,
    creditsMeasured: credits,
    creditsBucket: bucket,
    createdAt: new Date().toISOString(),
  };

  log.generations.push(record);
  log.voice = {
    id: voiceId,
    name: voiceName,
    model: MODEL,
    settings: SETTINGS,
    outputFormat: OUTPUT_FORMAT,
    why: DRAFT_VOICE.why,
  };
  saveLog(log);
  return record;
}

// ---------------------------------------------------------------------------
// Dry run
// ---------------------------------------------------------------------------

function dryRun(content: TutorialContent, cut: TutorialCut, log: VoiceLog): {
  characters: number;
  toGenerate: number;
} {
  const jobs = jobsFor(content, cut, DRAFT_VOICE.id);
  const total = TUTORIAL_TOTAL_FRAMES[cut];

  console.log(`\n[dry run] ${content.id} ${cut} (${total} frames)`);
  let characters = 0;
  let toGenerate = 0;
  let frames = 0;

  for (const job of jobs) {
    const existing = upToDate(log, job);
    const seconds = existing
      ? existing.durationSeconds
      : estimateSeconds(job.beat.narration);
    const beatFrameCount = beatFrames(job.beat, seconds);
    frames += beatFrameCount;
    characters += job.beat.narration.length;
    if (!existing) toGenerate += 1;
    console.log(
      `  ${job.beat.id.padEnd(10)} ${String(job.beat.narration.length).padStart(4)} chars  ` +
        `${seconds.toFixed(2)}s ${existing ? "measured " : "estimated"}  ` +
        `${String(beatFrameCount).padStart(4)} frames  ` +
        `${existing ? "on disk" : "to generate"}`,
    );
  }

  const slack = total - frames;
  console.log(
    `  ${"".padEnd(10)} ${String(characters).padStart(4)} chars  ` +
      `${String(frames).padStart(20)} frames laid out, ` +
      `${slack >= 0 ? `${slack} slack to the stretch beat` : `${-slack} OVER the cut`}`,
  );
  if (slack < 0) {
    console.log(
      `  the script is ${-slack} frames too long for ${total}. Shorten a line; ` +
        `the read is not sped up to make it fit.`,
    );
  }
  return { characters, toGenerate };
}

// ---------------------------------------------------------------------------
// Mix
// ---------------------------------------------------------------------------

/**
 * How far under the voice the music bed sits before the sidechain touches it.
 *
 * Peak to peak, which is the yardstick scripts/audio.ts settled on for the same
 * reason: the voice bus is mostly silence between lines, so matching means
 * would push the bed up by whatever the gaps happen to measure. Eight decibels
 * plus the sidechain's own reduction is what puts the bed about eighteen under
 * while speech is present, which is what the spec asks for.
 */
const BED_UNDER_VOICE_DB = 8;

/** Gain reduction the sidechain is solved to apply at the voice's mean level. */
const DUCK_TARGET_DB = 10;

/** Ratio the sidechain compressor runs at. 20 is ffmpeg's maximum, and a duck is not a compressor. */
const DUCK_RATIO = 20;

const DUCK_ATTACK_MS = 20;
const DUCK_RELEASE_MS = 400;

/** Fade at the tail of the bed, per cut. The same 400 and 600 ms the two showcase mixes use. */
const FADE_OUT_SECONDS: Record<TutorialCut, number> = {
  short: 0.4,
  linkedin: 0.6,
};

type VoicePlacement = { file: string; delayMs: number };

type MixShape = {
  placements: VoicePlacement[];
  musicFrom: number;
  seconds: number;
  fadeOut: number;
  bedGainDb: number;
  threshold: number;
  /**
   * Pad the voice bus with silence to the full length of the cut. Only the v3
   * candidate mixes set it. sidechaincompress ends when its shorter input
   * ends, so without the pad the mix stops on the last word and the bed never
   * reaches its fade; the v2 mixes on disk measure 14.58s against a 15.0s
   * cut for that reason. Left off for v2 so its output is unchanged until
   * that is decided on its own.
   */
  padVoice: boolean;
};

/** Input 0, trimmed, gained and faded: the music bed before anything ducks it. */
function bedChain(shape: MixShape): string {
  return (
    `[0:a]atrim=${shape.musicFrom}:${shape.musicFrom + shape.seconds},` +
    `asetpts=N/SR/TB,volume=${shape.bedGainDb.toFixed(2)}dB,` +
    `afade=t=out:st=${shape.seconds - shape.fadeOut}:d=${shape.fadeOut},` +
    `${AFORMAT}[bed]`
  );
}

/**
 * Inputs 1..n, each delayed to its own beat, summed into one voice bus.
 *
 * The lines never overlap, so summing them is the whole of the bus. amix over a
 * single input is a no-op that still costs a filter, which is why the one line
 * case takes anull instead.
 */
function voiceChain(shape: MixShape): string[] {
  const parts: string[] = [];
  const labels: string[] = [];
  shape.placements.forEach((p, i) => {
    const label = `v${i}`;
    parts.push(
      `[${i + 1}:a]adelay=${p.delayMs}:all=1,atrim=0:${shape.seconds},${AFORMAT}[${label}]`,
    );
    labels.push(`[${label}]`);
  });
  if (labels.length > 1) {
    parts.push(
      `${labels.join("")}amix=inputs=${labels.length}:duration=longest:normalize=0[voiceraw]`,
    );
  } else {
    parts.push(`${labels[0]}anull[voiceraw]`);
  }
  const pad = shape.padVoice ? `apad=whole_dur=${shape.seconds},` : "";
  parts.push(`[voiceraw]${pad}${AFORMAT}[voiceall]`);
  return parts;
}

function duck(key: string, shape: MixShape, out: string): string {
  return (
    `[bed][${key}]sidechaincompress=threshold=${shape.threshold.toFixed(6)}:` +
    `ratio=${DUCK_RATIO}:attack=${DUCK_ATTACK_MS}:release=${DUCK_RELEASE_MS}:` +
    `makeup=1:level_sc=1[${out}]`
  );
}

/**
 * The mix graph: the bed, the voice bus, and the bed ducked under it.
 *
 * `ceilingDb` is the only free parameter, so headroomCeilingDb() in
 * scripts/audio.ts can solve for it over this graph exactly as it does over the
 * music-only one.
 */
function buildMixFilter(shape: MixShape, ceilingDb: number): string {
  return [
    bedChain(shape),
    ...voiceChain(shape),
    `[voiceall]asplit=2[voicemix][voicekey]`,
    duck("voicekey", shape, "ducked"),
    `[ducked][voicemix]amix=inputs=2:duration=first:normalize=0[premix]`,
    `[premix]${limiter(ceilingDb)}[mixed]`,
  ].join(";");
}

/** A slice of the timeline to measure over, in seconds. */
type Window = { start: number; duration: number };

/**
 * Mean level of the bed with the duck bypassed and again with it in, over one
 * window.
 *
 * Two purpose built graphs rather than a tap on the mix graph, because ffmpeg
 * refuses a filter_complex with a dangling output and every stage of the real
 * graph feeds something further down. The difference between the two numbers is
 * what the sidechain actually did, which is the figure that goes into
 * config/voice.json: it is measured, not predicted from the threshold.
 *
 * The window matters. The spec asks for the bed to sit about eighteen decibels
 * under the voice "while speech is present", and a mean over the whole picture
 * answers a different question, because the gaps between lines are at full bed
 * level and dilute it. So the window is the middle of the longest line, past
 * the sidechain's attack and short of its release.
 */
function meanOfBed(
  inputs: string[],
  shape: MixShape,
  ducked: boolean,
  window: Window,
): number {
  const slice = `atrim=${window.start.toFixed(3)}:${(window.start + window.duration).toFixed(3)},asetpts=N/SR/TB`;
  const parts = ducked
    ? [
        bedChain(shape),
        ...voiceChain(shape),
        duck("voiceall", shape, "probe"),
        `[probe]${slice},volumedetect[out]`,
      ]
    : [bedChain(shape), `[bed]${slice},volumedetect[out]`];
  const { stderr } = ffmpeg([
    ...inputs,
    "-filter_complex",
    parts.join(";"),
    "-map",
    "[out]",
    "-f",
    "null",
    "-",
  ]);
  return Number(/mean_volume:\s*(-?[\d.]+) dB/.exec(stderr)?.[1] ?? NaN);
}

/** How close to DUCK_TARGET_DB the solved duck has to land before it is accepted. */
const DUCK_TOLERANCE_DB = 1.0;

/**
 * Solves the sidechain threshold for DUCK_TARGET_DB of measured gain reduction.
 *
 * The first estimate comes from the compressor's own arithmetic: it reduces by
 * about (1 - 1/ratio) of however far the key signal sits above the threshold.
 * That estimate is always low here, because the level it is computed against is
 * the mean of a voice file including its own pauses while the reduction that
 * matters happens under a word. So the estimate is refined against a
 * measurement rather than trusted, the same shape headroomCeilingDb() in
 * scripts/audio.ts takes to the limiter ceiling.
 */
function solveDuck(
  inputs: string[],
  shape: MixShape,
  window: Window,
): { threshold: number; thresholdDb: number; measuredDuckDb: number } {
  let thresholdDb = 20 * Math.log10(shape.threshold);
  let measured = NaN;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const threshold = Math.min(0.5, Math.max(0.0005, 10 ** (thresholdDb / 20)));
    thresholdDb = 20 * Math.log10(threshold);
    const probed: MixShape = { ...shape, threshold };
    const before = meanOfBed(inputs, probed, false, window);
    const after = meanOfBed(inputs, probed, true, window);
    measured = Number((before - after).toFixed(2));
    if (
      !Number.isFinite(measured) ||
      Math.abs(measured - DUCK_TARGET_DB) <= DUCK_TOLERANCE_DB ||
      threshold <= 0.0005 ||
      threshold >= 0.5
    ) {
      return { threshold, thresholdDb, measuredDuckDb: measured };
    }
    thresholdDb -= (DUCK_TARGET_DB - measured) / (1 - 1 / DUCK_RATIO);
  }

  const threshold = Math.min(0.5, Math.max(0.0005, 10 ** (thresholdDb / 20)));
  return { threshold, thresholdDb, measuredDuckDb: measured };
}

/**
 * What the v3 candidate mixes change about buildMix, and nothing else: the
 * timeline (laid out from the v3 durations), the music take, where the wav
 * goes, and where the record is kept. Everything that decides how the mix
 * sounds (bed level, duck, limiter, loudnorm) is the same code either way.
 */
type MixOverride = {
  timeline: TutorialTimeline;
  music: { file: string; from: number; id: string };
  musicVariant: string;
  wav: string;
  save: (record: VoiceMixRecord) => void;
};

async function buildMix(
  content: TutorialContent,
  cut: TutorialCut,
  log: VoiceLog,
  override?: MixOverride,
): Promise<VoiceMixRecord> {
  const timeline = override?.timeline ?? tutorialTimeline(content, cut, log);
  const seconds = timeline.totalFrames / FPS;
  const variant = override?.musicVariant ?? content.music[cut];
  const music =
    override?.music ??
    musicTake(
      variant as Parameters<typeof musicTake>[0],
      cut === "short" ? 20 : 50,
    );

  const placements: VoicePlacement[] = [];
  // The longest line, and where it sits, so the duck can be measured while
  // speech is actually present rather than averaged across the gaps.
  let longest = { startSec: 0, seconds: 0 };
  for (const entry of timeline.entries) {
    if (!entry.voiceFile) {
      throw new Error(
        `${content.id} ${cut}: no voice file for beat "${entry.beat.id}". ` +
          `Run: npx tsx scripts/voice.ts --reel ${content.id} --cut ${cut}`,
      );
    }
    const file = path.join(ROOT, entry.voiceFile);
    if (!fs.existsSync(file)) {
      throw new Error(`${content.id} ${cut}: ${entry.voiceFile} is missing.`);
    }
    placements.push({
      file,
      delayMs: Math.round((entry.start / FPS) * 1000),
    });
    if (entry.seconds > longest.seconds) {
      longest = { startSec: entry.start / FPS, seconds: entry.seconds };
    }
  }

  // Past the 20 ms attack and short of the 400 ms release, so the window is
  // steady state ducking and nothing else.
  const duckWindow: Window = {
    start: longest.startSec + 0.4,
    duration: Math.max(0.5, longest.seconds - 0.8),
  };

  console.log(`\n[mix] ${content.id} ${cut} (${seconds.toFixed(1)}s)`);
  console.log(`  bed   ${rel(music.file)} (${music.id}), from ${music.from}s`);
  console.log(`  voice ${placements.length} beats`);

  const inputs = ["-i", music.file, ...placements.flatMap((p) => ["-i", p.file])];

  // Peak to peak, the same yardstick scripts/audio.ts uses to place the SFX.
  const bed = measureVolume(music.file, { start: music.from, duration: seconds });
  const voicePeaks = placements.map((p) => measureVolume(p.file).max);
  const voicePeak = Math.max(...voicePeaks);
  const voiceMeans = placements.map((p) => measureVolume(p.file).mean);
  const voiceMean =
    voiceMeans.reduce((a, b) => a + b, 0) / Math.max(1, voiceMeans.length);
  const bedGainDb = Number(
    (voicePeak - BED_UNDER_VOICE_DB - bed.max).toFixed(2),
  );

  // First estimate for the sidechain threshold: it reduces by about
  // (1 - 1/ratio) of the amount the key signal sits above the threshold, so the
  // threshold that costs the bed DUCK_TARGET_DB at the voice's mean level is
  // that many decibels under it. solveDuck() then refines it against a
  // measurement, because that mean includes the pauses inside each line.
  const firstThresholdDb = voiceMean - DUCK_TARGET_DB / (1 - 1 / DUCK_RATIO);

  console.log(
    `  bed peak ${bed.max} dBFS, voice peak ${voicePeak.toFixed(2)} dBFS, ` +
      `voice mean ${voiceMean.toFixed(2)} dBFS`,
  );
  console.log(
    `  bed gain ${bedGainDb > 0 ? "+" : ""}${bedGainDb} dB, so the bed sits ` +
      `${BED_UNDER_VOICE_DB} dB under the voice before the duck`,
  );

  const shape: MixShape = {
    placements,
    musicFrom: music.from,
    seconds,
    fadeOut: FADE_OUT_SECONDS[cut],
    bedGainDb,
    threshold: Math.min(0.5, Math.max(0.0005, 10 ** (firstThresholdDb / 20))),
    padVoice: Boolean(override),
  };

  const solved = solveDuck(inputs, shape, duckWindow);
  shape.threshold = solved.threshold;
  const measuredDuckDb = solved.measuredDuckDb;
  const makeFilter = (ceilingDb: number) => buildMixFilter(shape, ceilingDb);
  console.log(
    `  sidechain threshold ${solved.threshold.toFixed(4)} (${solved.thresholdDb.toFixed(1)} dBFS), ` +
      `ratio ${DUCK_RATIO}: measured ${measuredDuckDb} dB of gain reduction on the bed over ` +
      `${duckWindow.duration.toFixed(1)}s inside the longest line, so about ` +
      `${(BED_UNDER_VOICE_DB + measuredDuckDb).toFixed(1)} dB under the voice while it speaks`,
  );

  // The same limiter, loudnorm and correction path the two showcase mixes take.
  const { ceilingDb, measurement: measured } = headroomCeilingDb(
    inputs,
    makeFilter,
  );
  const filter = makeFilter(ceilingDb);
  console.log(`  limiter ceiling ${ceilingDb} dBFS`);
  console.log(
    `  pass 1: I ${measured.input_i} LUFS, TP ${measured.input_tp} dBTP, LRA ${measured.input_lra}`,
  );

  const wav = override?.wav ?? path.join(ROOT, mixFilePath(content.id, cut));
  fs.mkdirSync(path.dirname(wav), { recursive: true });
  const pass2 = ffmpeg([
    ...inputs,
    "-filter_complex",
    `${filter};[mixed]loudnorm=${LOUDNORM_TARGET}:measured_I=${measured.input_i}:` +
      `measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:` +
      `measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:` +
      `linear=false:print_format=json[norm];[norm]${AFORMAT}[out]`,
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
  if (pass2.code !== 0) {
    throw new Error(`loudnorm pass 2 failed:\n${pass2.stderr.slice(-3000)}`);
  }
  const predicted = parseLoudnorm(pass2.stderr);
  console.log(
    `  pass 2 predicted: I ${predicted.output_i} LUFS, TP ${predicted.output_tp} dBTP`,
  );
  const afterPass2 = verifyLoudness(wav);
  console.log(
    `  pass 2 verified:  I ${afterPass2.integrated} LUFS, TP ${afterPass2.truePeak} dBTP, ` +
      `LRA ${afterPass2.lra}`,
  );
  // loudnorm's pass 2 output is a prediction and this project measures the file
  // instead. A voice bus has a much wider loudness range than a music bed, so
  // the residual here is larger than it ever was on the beds alone.
  const verified = correctLoudness(wav, afterPass2);
  if (Math.abs(verified.integrated - TARGET_LUFS) > 0.5) {
    console.log(
      `  WARNING: integrated loudness is ${verified.integrated} LUFS, more than 0.5 off target.`,
    );
  }
  console.log(`  wrote ${rel(wav)}`);

  const record: VoiceMixRecord = {
    tutorial: content.id,
    cut,
    wav: rel(wav),
    musicSource: rel(music.file),
    musicVariant: variant,
    bedGainDb,
    measuredDuckDb,
    limiterCeilingDbfs: ceilingDb,
    measuredIntegratedLufs: verified.integrated,
    measuredTruePeakDbfs: verified.truePeak,
    measuredLra: verified.lra,
    createdAt: new Date().toISOString(),
  };

  if (override) {
    override.save(record);
    return record;
  }

  const fresh = loadLog();
  fresh.mixes = fresh.mixes.filter(
    (m) => !(m.tutorial === content.id && m.cut === cut),
  );
  fresh.mixes.push(record);
  fresh.mixes.sort((a, b) =>
    `${a.tutorial}/${a.cut}`.localeCompare(`${b.tutorial}/${b.cut}`),
  );
  saveLog(fresh);
  return record;
}

// ---------------------------------------------------------------------------
// eleven_v3 candidates
// ---------------------------------------------------------------------------

const V3_MODEL = "eleven_v3";

/** The three documented v3 stability modes. See the header for where the numbers come from. */
const V3_STABILITY = {
  creative: 0.0,
  natural: 0.5,
  robust: 1.0,
} as const;

type V3Mode = keyof typeof V3_STABILITY;

/** What a v3 call sends as voice_settings. Stability only; see the header. */
type V3Settings = { stability: number };

/**
 * Cap on v3 generations logged in the v3 section, separate from the v2 cap so
 * a candidate pass can never eat the budget the shipping reads rely on. Two
 * reads of a five beat cut is ten; this allows one more full pair and stops.
 */
const V3_GENERATION_CAP = 20;

/** Where the voice only and mixed candidate previews go. */
const CANDIDATE_DIR = path.join(ROOT, "out", "candidates");

/**
 * Removes inline audio tags ("[warm]", "[short pause]") and the spaces they
 * leave. Exported so anything that ever turns a tagged line into caption or
 * SRT text strips it the same way.
 */
export function stripAudioTags(text: string): string {
  return text
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const tagsIn = (text: string): string[] =>
  [...text.matchAll(/\[([^\]]*)\]/g)].map((m) => m[1]);

type V3Generation = {
  tutorial: string;
  cut: string;
  beatId: string;
  /** The stability mode, which is also the folder the file lives in. */
  mode: V3Mode;
  file: string;
  /** The exact text sent, tags included. */
  text: string;
  /** The same line with the tags stripped: what captions and the SRT say. */
  plainText: string;
  tags: string[];
  /** Characters sent, tags included, since tags are billed as text. */
  characters: number;
  hash: string;
  voiceId: string;
  voiceName: string;
  model: string;
  settings: V3Settings;
  outputFormat: string;
  durationSeconds: number;
  creditsMeasured: number | null;
  creditsBucket: string | null;
  createdAt: string;
};

type V3Stitch = {
  tutorial: string;
  cut: string;
  mode: V3Mode;
  file: string;
  totalFrames: number;
  /** Frames over the cut's fixed total, 0 when the read fits. */
  overFrames: number;
  beats: { beatId: string; startFrame: number; seconds: number }[];
  measuredIntegratedLufs: number;
  measuredTruePeakDbfs: number;
  createdAt: string;
};

type V3Mix = VoiceMixRecord & { mode: V3Mode; mp3: string };

type V3Section = {
  _note: string;
  generations: V3Generation[];
  stitches: V3Stitch[];
  mixes: V3Mix[];
};

type LogWithV3 = VoiceLog & { v3?: V3Section };

const EMPTY_V3: V3Section = {
  _note:
    "eleven_v3 candidate reads, added 2026-09-24. Kept apart from generations " +
    "above on purpose: src/tutorial/timeline.ts lays the rendered reels out " +
    "from generations, and nothing reads this section, so a candidate never " +
    "moves a render. text is exactly what was sent, audio tags included; " +
    "plainText is the same line with the tags stripped. creditsMeasured is the " +
    "same before and after usage delta as every other entry. Written by " +
    "scripts/voice.ts --model eleven_v3.",
  generations: [],
  stitches: [],
  mixes: [],
};

function v3Of(log: LogWithV3): V3Section {
  if (!log.v3) log.v3 = structuredClone(EMPTY_V3);
  log.v3.generations ??= [];
  log.v3.stitches ??= [];
  log.v3.mixes ??= [];
  return log.v3;
}

/**
 * The regeneration key for a v3 beat. voiceHash() over the tagged text, the
 * voice, the model and the stability; the three settings v3 is not sent are
 * pinned to constants so they cannot change the key.
 */
function v3Hash(text: string, voiceId: string, stability: number): string {
  return voiceHash(text, voiceId, V3_MODEL, {
    stability,
    similarity_boost: 0,
    style: 0,
    use_speaker_boost: false,
    speed: 1,
  });
}

function v3FilePath(tutorial: string, cut: TutorialCut, mode: V3Mode, beatId: string): string {
  const cutDir = cut === "short" ? "" : `${cut}/`;
  return `assets/audio/voice/${tutorial}-v3/${mode}/${cutDir}${beatId}.mp3`;
}

type V3Script = {
  tutorial: string;
  cut: string;
  beats: { id: string; narration: string }[];
};

type V3Job = {
  beat: TutorialBeat;
  text: string;
  plainText: string;
  file: string;
  hash: string;
};

/**
 * Reads the tagged script and checks it against src, beat for beat.
 *
 * Every beat of the cut must be present, in order, and its stripped text must
 * be exactly the narration in src. That is the guarantee that only the tags
 * changed, and it is checked before anything is spent.
 */
function v3Jobs(
  content: TutorialContent,
  cut: TutorialCut,
  mode: V3Mode,
  voiceId: string,
  scriptPath: string,
): V3Job[] {
  const script = JSON.parse(fs.readFileSync(scriptPath, "utf8")) as V3Script;
  if (script.tutorial !== content.id || script.cut !== cut) {
    throw new Error(
      `${rel(scriptPath)} is for ${script.tutorial} ${script.cut}, not ${content.id} ${cut}.`,
    );
  }
  const beats = tutorialBeats(content, cut);
  const ids = beats.map((b) => b.id).join(", ");
  const scriptIds = script.beats.map((b) => b.id).join(", ");
  if (ids !== scriptIds) {
    throw new Error(
      `${rel(scriptPath)} has beats [${scriptIds}], the cut has [${ids}]. They must match in order.`,
    );
  }
  return beats.map((beat, i) => {
    const text = script.beats[i].narration.trim();
    const plainText = stripAudioTags(text);
    if (plainText !== beat.narration) {
      throw new Error(
        `${rel(scriptPath)} beat "${beat.id}": with its tags stripped it reads\n` +
          `  "${plainText}"\nbut the narration in src is\n  "${beat.narration}"\n` +
          `Only tags may change. Nothing was sent.`,
      );
    }
    if (text.includes(String.fromCharCode(0x2014))) {
      throw new Error(`${rel(scriptPath)} beat "${beat.id}" contains an em dash.`);
    }
    if (/K&A/.test(text)) {
      throw new Error(`${rel(scriptPath)} beat "${beat.id}": write "K and A" for the voice model.`);
    }
    return {
      beat,
      text,
      plainText,
      file: path.join(ROOT, v3FilePath(content.id, cut, mode, beat.id)),
      hash: v3Hash(text, voiceId, V3_STABILITY[mode]),
    };
  });
}

function findV3(
  v3: V3Section,
  tutorial: string,
  cut: string,
  mode: V3Mode,
  beatId: string,
): V3Generation | null {
  let found: V3Generation | null = null;
  for (const g of v3.generations) {
    if (g.tutorial === tutorial && g.cut === cut && g.mode === mode && g.beatId === beatId) {
      found = g;
    }
  }
  return found;
}

function v3UpToDate(v3: V3Section, content: TutorialContent, cut: TutorialCut, mode: V3Mode, job: V3Job): V3Generation | null {
  const found = findV3(v3, content.id, cut, mode, job.beat.id);
  if (!found || found.hash !== job.hash) return null;
  if (!fs.existsSync(path.join(ROOT, found.file))) return null;
  return found;
}

async function generateV3(
  key: string,
  content: TutorialContent,
  cut: TutorialCut,
  mode: V3Mode,
  voiceId: string,
  voiceName: string,
  scriptPath: string,
  options: { force: boolean; dryRun: boolean },
): Promise<void> {
  const jobs = v3Jobs(content, cut, mode, voiceId, scriptPath);
  const log = loadLog() as LogWithV3;
  const v3 = v3Of(log);
  const settings: V3Settings = { stability: V3_STABILITY[mode] };

  let generated = 0;
  let skipped = 0;
  let credits = 0;
  let unmeasured = 0;
  let characters = 0;

  for (const job of jobs) {
    const label = `${content.id}/${cut}/v3-${mode}/${job.beat.id}`;
    const existing = options.force ? null : v3UpToDate(v3, content, cut, mode, job);
    if (existing) {
      skipped += 1;
      console.log(`[skip] ${label}: hash ${job.hash} already on disk (${existing.durationSeconds.toFixed(2)}s)`);
      continue;
    }
    characters += job.text.length;
    if (options.dryRun) {
      console.log(`[dry run] ${label}: ${job.text.length} characters  ${job.text}`);
      continue;
    }
    if (v3.generations.length >= V3_GENERATION_CAP) {
      throw new Error(
        `v3 generation cap reached: ${v3.generations.length} of ${V3_GENERATION_CAP} logged in ` +
          `config/voice.json. Stopping rather than spending more.`,
      );
    }

    console.log(`\n[voice v3] ${label}`);
    console.log(`  ${job.text.length} characters, ${V3_MODEL} stability ${settings.stability}, ${OUTPUT_FORMAT}`);
    console.log(`  ${job.text}`);

    const before = await usageSnapshot(key);
    const bytes = await speak(key, voiceId, job.text, label, {
      model_id: V3_MODEL,
      voice_settings: settings,
    });
    fs.mkdirSync(path.dirname(job.file), { recursive: true });
    fs.writeFileSync(job.file, bytes);
    const durationSeconds = Number(probeDuration(job.file).toFixed(3));
    console.log(`  wrote ${rel(job.file)} (${(bytes.length / 1024).toFixed(0)} KB, ${durationSeconds.toFixed(2)}s)`);

    const measured = await creditsSince(key, before);
    console.log(
      `  credits ${measured.credits ?? "not reported"}${measured.bucket ? ` (${measured.bucket})` : ""}`,
    );
    assertUnderCreditAlarm(measured.credits, label);

    const record: V3Generation = {
      tutorial: content.id,
      cut,
      beatId: job.beat.id,
      mode,
      file: rel(job.file),
      text: job.text,
      plainText: job.plainText,
      tags: tagsIn(job.text),
      characters: job.text.length,
      hash: job.hash,
      voiceId,
      voiceName,
      model: V3_MODEL,
      settings,
      outputFormat: OUTPUT_FORMAT,
      durationSeconds,
      creditsMeasured: measured.credits,
      creditsBucket: measured.bucket,
      createdAt: new Date().toISOString(),
    };
    // Reloaded and written after every call, so a paid beat is on the record
    // even if the next one throws.
    const onDisk = loadLog() as LogWithV3;
    v3Of(onDisk).generations.push(record);
    saveLog(onDisk);
    v3.generations.push(record);
    generated += 1;
    if (measured.credits === null) unmeasured += 1;
    else credits += measured.credits;
  }

  if (options.dryRun) {
    console.log(
      `\n${characters} characters to send at ${CREDITS_PER_CHARACTER} credit a character, ` +
        `about ${characters * CREDITS_PER_CHARACTER} credits. ${skipped} already on disk. Nothing was called.`,
    );
    return;
  }
  console.log(
    `\n${generated} generated, ${skipped} skipped. ${credits} credits measured` +
      (unmeasured > 0 ? `, ${unmeasured} not reported by the usage endpoint` : "") +
      `. ${v3.generations.length} of ${V3_GENERATION_CAP} v3 generations logged.`,
  );
}

/**
 * The v3 read laid out exactly as src/tutorial/timeline.ts would lay it out.
 *
 * tutorialTimeline() is handed a log whose generations are the v3 beats of one
 * mode, so the gaps, the hook and end card floors and the stretch beat are the
 * real rule, not a copy of it. If the v3 read is too long for the cut, the
 * real rule throws; a candidate still has to be heard, so the beats are then
 * laid end to end by the same beatFrames() rule with no stretch, and the
 * overrun is reported rather than hidden.
 */
function v3Timeline(
  content: TutorialContent,
  cut: TutorialCut,
  mode: V3Mode,
): { timeline: TutorialTimeline; overFrames: number; log: VoiceLog } {
  const full = loadLog() as LogWithV3;
  const v3 = v3Of(full);
  const beats = tutorialBeats(content, cut);
  const records = beats.map((beat) => {
    const found = findV3(v3, content.id, cut, mode, beat.id);
    if (!found || !fs.existsSync(path.join(ROOT, found.file))) {
      throw new Error(
        `${content.id} ${cut} v3 ${mode}: no voice file for beat "${beat.id}". Run: ` +
          `npx tsx scripts/voice.ts --model eleven_v3 --reel ${content.id} --cut ${cut} --stability ${mode}`,
      );
    }
    return found;
  });
  const log: VoiceLog = {
    ...structuredClone(EMPTY_LOG),
    generations: records.map((r) => ({
      ...r,
      settings: { ...SETTINGS, stability: r.settings.stability },
    })) as VoiceGeneration[],
  };
  try {
    return { timeline: tutorialTimeline(content, cut, log), overFrames: 0, log };
  } catch (err) {
    if (!(err instanceof Error) || !/frames over/.test(err.message)) throw err;
    let cursor = 0;
    const entries = beats.map((beat, i) => {
      const frames = beatFrames(beat, records[i].durationSeconds);
      const kind: TutorialTimeline["entries"][number]["kind"] =
        i === 0 ? "hook" : i === beats.length - 1 ? "cta" : "beat";
      const entry = {
        kind,
        beat,
        start: cursor,
        end: cursor + frames,
        seconds: records[i].durationSeconds,
        source: "measured" as const,
        voiceFile: records[i].file,
        stretchFrames: 0,
      };
      cursor += frames;
      return entry;
    });
    const overFrames = cursor - TUTORIAL_TOTAL_FRAMES[cut];
    console.log(
      `  WARNING: this read is ${overFrames} frames over the ${TUTORIAL_TOTAL_FRAMES[cut]} frame cut. ` +
        `Laid end to end for listening; it would not render as is.`,
    );
    return {
      timeline: { id: content.id, cut, totalFrames: cursor, entries, slackFrames: 0, estimated: [] },
      overFrames,
      log,
    };
  }
}

const cutSeconds = (cut: TutorialCut) => (cut === "short" ? "15s" : "45s");

function encodeMp3(input: string, output: string, filter?: string): void {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const res = ffmpeg([
    "-i",
    input,
    ...(filter ? ["-af", filter] : []),
    "-c:a",
    "libmp3lame",
    "-b:a",
    "320k",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-y",
    output,
  ]);
  if (res.code !== 0) throw new Error(`mp3 encode failed:\n${res.stderr.slice(-3000)}`);
}

/**
 * Voice only preview of one v3 read: every beat at the frame the timeline puts
 * it on, silence between, the whole cut long. Normalized to -16 LUFS, the
 * spec's voice level, so the two modes can be compared at the same loudness.
 */
function stitchV3(content: TutorialContent, cut: TutorialCut, mode: V3Mode): V3Stitch {
  const { timeline, overFrames } = v3Timeline(content, cut, mode);
  const seconds = timeline.totalFrames / FPS;
  const out = path.join(CANDIDATE_DIR, `${content.id}-${cutSeconds(cut)}-voice-${mode}.mp3`);
  const wav = `${out}.tmp.wav`;
  const inputs = timeline.entries.flatMap((e) => ["-i", path.join(ROOT, e.voiceFile as string)]);
  const parts = timeline.entries.map(
    (e, i) => `[${i}:a]adelay=${Math.round((e.start / FPS) * 1000)}:all=1,${AFORMAT}[v${i}]`,
  );
  parts.push(
    `${timeline.entries.map((_, i) => `[v${i}]`).join("")}amix=inputs=${timeline.entries.length}:` +
      `duration=longest:normalize=0,apad=whole_dur=${seconds},atrim=0:${seconds},` +
      `loudnorm=I=-16:TP=-1.5:LRA=11,${AFORMAT}[out]`,
  );
  console.log(`\n[stitch v3] ${content.id} ${cut} ${mode} (${seconds.toFixed(2)}s)`);
  const res = ffmpeg([
    ...inputs,
    "-filter_complex",
    parts.join(";"),
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
  if (res.code !== 0) throw new Error(`stitch failed:\n${res.stderr.slice(-3000)}`);
  encodeMp3(wav, out);
  fs.rmSync(wav);
  const loud = verifyLoudness(out);
  for (const e of timeline.entries) {
    console.log(
      `  ${e.beat.id.padEnd(6)} frame ${String(e.start).padStart(3)}  ${e.seconds.toFixed(2)}s` +
        (e.stretchFrames ? `  +${e.stretchFrames} stretch` : ""),
    );
  }
  console.log(`  I ${loud.integrated} LUFS, TP ${loud.truePeak} dBTP. wrote ${rel(out)}`);

  const record: V3Stitch = {
    tutorial: content.id,
    cut,
    mode,
    file: rel(out),
    totalFrames: timeline.totalFrames,
    overFrames,
    beats: timeline.entries.map((e) => ({ beatId: e.beat.id, startFrame: e.start, seconds: e.seconds })),
    measuredIntegratedLufs: loud.integrated,
    measuredTruePeakDbfs: loud.truePeak,
    createdAt: new Date().toISOString(),
  };
  const onDisk = loadLog() as LogWithV3;
  const section = v3Of(onDisk);
  section.stitches = section.stitches.filter(
    (s) => !(s.tutorial === content.id && s.cut === cut && s.mode === mode),
  );
  section.stitches.push(record);
  saveLog(onDisk);
  return record;
}

/** The v2 --mix, over a v3 read and a chosen music take, encoded to an mp3 candidate. */
async function mixV3(
  content: TutorialContent,
  cut: TutorialCut,
  mode: V3Mode,
  musicVariant: string,
  outMp3: string,
): Promise<V3Mix> {
  const { timeline, log } = v3Timeline(content, cut, mode);
  const music = musicTake(
    musicVariant as Parameters<typeof musicTake>[0],
    cut === "short" ? 20 : 50,
  );
  const wav = path.join(
    ROOT,
    "assets",
    "audio",
    "voice",
    `${content.id}-v3`,
    mode,
    `mix-${cutSeconds(cut)}-${musicVariant}.wav`,
  );
  const holder: { record?: V3Mix } = {};
  await buildMix(content, cut, log, {
    timeline,
    music,
    musicVariant,
    wav,
    save: (record) => {
      holder.record = { ...record, mode, mp3: rel(outMp3) };
    },
  });
  const saved = holder.record;
  if (!saved) throw new Error("mixV3: the mix record was not produced.");
  encodeMp3(wav, outMp3);
  console.log(`  wrote ${rel(outMp3)}`);
  const onDisk = loadLog() as LogWithV3;
  const section = v3Of(onDisk);
  section.mixes = section.mixes.filter((m) => m.mp3 !== rel(outMp3));
  section.mixes.push(saved);
  saveLog(onDisk);
  return saved;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
}

function selectedTutorials(argv: string[]): TutorialContent[] {
  const which = flag(argv, "reel") ?? "both";
  if (which === "both") return [CONTRAST_TUTORIAL, HERO_TUTORIAL];
  const found = TUTORIALS[which];
  if (!found) {
    throw new Error(
      `Unknown --reel "${which}". Use contrast, hero or both.`,
    );
  }
  return [found];
}

function selectedCuts(argv: string[]): TutorialCut[] {
  const which = flag(argv, "cut") ?? "both";
  if (which === "both") return ["short", "linkedin"];
  if (which === "short" || which === "linkedin") return [which];
  throw new Error(`Unknown --cut "${which}". Use short, linkedin or both.`);
}

/** GET /v1/voices, printed so a voice can be chosen with its description in view. */
async function listVoices(key: string, search?: string): Promise<void> {
  const { status, json } = await apiGetJson(key, "/v1/voices");
  if (status !== 200 || !json) {
    throw new Error(`GET /v1/voices returned ${status}.`);
  }
  type Voice = {
    voice_id: string;
    name: string;
    category?: string;
    description?: string | null;
    labels?: Record<string, string>;
  };
  const voices = (json as { voices?: Voice[] }).voices ?? [];
  const needle = search?.toLowerCase();
  let shown = 0;
  for (const v of voices) {
    const labels = Object.entries(v.labels ?? {})
      .map(([k, val]) => `${k}=${val}`)
      .join(" ");
    const line = `${v.name} [${v.category ?? "?"}] ${v.voice_id}\n    ${v.description ?? ""}\n    ${labels}`;
    if (needle && !line.toLowerCase().includes(needle)) continue;
    console.log(line);
    shown += 1;
  }
  console.log(`\n${shown} of ${voices.length} voices.`);
}

// ---------------------------------------------------------------------------
// Audition
// ---------------------------------------------------------------------------

/**
 * The line every candidate reads.
 *
 * It is the contrast tutorial's own first three beats run together, chosen
 * because it is the hardest thing either tutorial asks of a voice: a flat
 * assertion, a soft aside, and a number said out loud. A voice that keeps
 * "two point nine to one" intelligible without leaning on it can carry both
 * scripts.
 */
const AUDITION_TEXT =
  "Contrast is not a vibe. This amber on cream looks fine. " +
  "It measures two point nine to one. That fails.";

/**
 * The shortlist: every premade voice that GET /v1/voices returns as gender
 * female and accent american, plus Eric as the control.
 *
 * It is the whole eligible set rather than a taste-filtered three because the
 * binding constraint turned out to be pace, not tone. Every beat in every cut
 * is laid out from a measured duration and the 15 second cuts carry 54 and 89
 * frames of slack, so a candidate that reads ten percent slower than the voice
 * it replaces can put a cut over its own frame count. That is a measurement,
 * not a judgement, and it is only worth 102 credits a voice to have it.
 *
 * Eric is auditioned on the same line for the same reason. His logged beats are
 * separate files with their own lead-ins and tails, so summing three of them
 * answers a different question than one continuous read; the control makes the
 * comparison exact.
 */
const AUDITION_SHORTLIST: { id: string; name: string; description: string }[] = [
  {
    id: "hpp4J3VqNfWAUOO0d1Us",
    name: "Bella",
    description:
      "Bella - Professional, Bright, Warm: \"This voice is warm, bright, and " +
      "professional, characterized by a Standard American accent and a " +
      "polished, narrative quality. It features a medium-high pitch with " +
      "crisp diction and a deliberate, rhythmic pace that makes it highly " +
      "intelligible and engaging for long-form listening.\" " +
      "female, american, professional, informative_educational, middle_aged",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    description:
      "Sarah - Mature, Reassuring, Confident: \"Young adult woman with a " +
      "confident and warm, mature quality and a reassuring, professional " +
      "tone.\" female, american, professional, entertainment_tv, young",
  },
  {
    id: "XrExE9yKIg1WjnnlVkGX",
    name: "Matilda",
    description:
      "Matilda - Knowledgable, Professional: \"A professional woman with a " +
      "pleasing alto pitch. Suitable for many use cases.\" " +
      "female, american, upbeat, informative_educational, middle_aged",
  },
  {
    id: "FGY2WhTYpPnrIDTdsKH5",
    name: "Laura",
    description:
      "Laura - Enthusiast, Quirky Attitude: \"This young adult female voice " +
      "delivers sunny enthusiasm with a quirky attitude.\" " +
      "female, american, sassy, social_media, young",
  },
  {
    id: "cgSgspJ2msm6clMCkdW9",
    name: "Jessica",
    description:
      "Jessica - Playful, Bright, Warm: \"Young and popular, this playful " +
      "American female voice is perfect for trendy content.\" " +
      "female, american, cute, conversational, young",
  },
  {
    id: "cjVigY5qzO86Huf0OWal",
    name: "Eric",
    description:
      "Eric - Smooth, Trustworthy: \"A smooth tenor pitch from a man in his " +
      "40s - perfect for agentic use cases.\" male, american, classy, " +
      "conversational, middle_aged. The control: the voice being replaced, " +
      "reading the same line, so the pace comparison is exact.",
  },
];

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

/**
 * Reads AUDITION_TEXT in every shortlisted voice, into out/voice-samples/.
 *
 * The pace it prints is the number the choice turns on. Every beat in every cut
 * is laid out from a measured duration, so a candidate that reads slower than
 * the voice it replaces lengthens every beat at once, and a 15 second cut has
 * only 54 frames of slack to absorb it. The auditions go into config/voice.json
 * for the same reason the beats do: they were billed.
 */
async function auditionVoices(key: string): Promise<void> {
  const dir = path.join(ROOT, "out", "voice-samples");
  fs.mkdirSync(dir, { recursive: true });
  const log = loadLog();
  const results: VoiceAudition[] = [];
  const fresh: VoiceAudition[] = [];

  for (const candidate of AUDITION_SHORTLIST) {
    const label = `audition/${candidate.name}`;
    // Same skip rule the beats take, for the same reason: an audition already
    // on disk for this voice and this line has already been paid for.
    const already = (log.auditions ?? []).find(
      (a) =>
        a.voiceId === candidate.id &&
        a.text === AUDITION_TEXT &&
        a.model === MODEL &&
        fs.existsSync(path.join(ROOT, a.file)),
    );
    if (already) {
      console.log(
        `[skip] audition/${candidate.name}: ${already.file} already on disk ` +
          `(${already.durationSeconds.toFixed(2)}s, ${already.wordsPerSecond} words per second)`,
      );
      results.push(already);
      continue;
    }
    console.log(`\n[audition] ${candidate.name} (${candidate.id})`);
    console.log(
      `  ${AUDITION_TEXT.length} characters, ${MODEL}, ${OUTPUT_FORMAT}`,
    );
    const before = await usageSnapshot(key);
    const bytes = await speak(key, candidate.id, AUDITION_TEXT, label);
    const file = path.join(dir, `${candidate.name.toLowerCase()}.mp3`);
    fs.writeFileSync(file, bytes);
    const durationSeconds = Number(probeDuration(file).toFixed(3));
    const wordCount = words(AUDITION_TEXT);
    const wordsPerSecond = Number((wordCount / durationSeconds).toFixed(2));
    console.log(
      `  wrote ${rel(file)} (${(bytes.length / 1024).toFixed(0)} KB, ` +
        `${durationSeconds.toFixed(2)}s, ${wordsPerSecond} words per second)`,
    );
    const { credits, bucket } = await creditsSince(key, before);
    console.log(
      `  credits ${credits ?? "not reported"}${bucket ? ` (${bucket})` : ""}`,
    );
    assertUnderCreditAlarm(credits, label);
    const record: VoiceAudition = {
      voiceId: candidate.id,
      voiceName: candidate.name,
      description: candidate.description,
      file: rel(file),
      text: AUDITION_TEXT,
      characters: AUDITION_TEXT.length,
      words: wordCount,
      model: MODEL,
      settings: SETTINGS,
      outputFormat: OUTPUT_FORMAT,
      durationSeconds,
      wordsPerSecond,
      creditsMeasured: credits,
      creditsBucket: bucket,
      createdAt: new Date().toISOString(),
    };
    results.push(record);
    fresh.push(record);
    // Written after every call rather than once at the end, so an audition that
    // was paid for is on the record even if the next one throws.
    const onDisk = loadLog();
    onDisk.auditions = [...(onDisk.auditions ?? []), record];
    saveLog(onDisk);
  }

  const spent = fresh.reduce((sum, r) => sum + (r.creditsMeasured ?? 0), 0);
  console.log("\naudition results");
  for (const r of [...results].sort((a, b) => b.wordsPerSecond - a.wordsPerSecond)) {
    console.log(
      `  ${r.voiceName.padEnd(8)} ${r.durationSeconds.toFixed(2)}s  ` +
        `${r.wordsPerSecond.toFixed(2)} words/s  ${r.creditsMeasured ?? "?"} credits  ${r.file}`,
    );
  }
  console.log(
    `  ${spent} credits measured on ${fresh.length} new auditions, ` +
      `${results.length - fresh.length} already on disk.`,
  );
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (command === "usage") {
    const key = readApiKey();
    console.log(JSON.stringify(await usageSnapshot(key), null, 2));
    return;
  }

  if (command === "voices") {
    const key = readApiKey();
    await listVoices(key, flag(argv, "search"));
    return;
  }

  if (command === "audition") {
    await auditionVoices(readApiKey());
    return;
  }

  const model = flag(argv, "model") ?? MODEL;
  if (model !== MODEL && model !== V3_MODEL) {
    throw new Error(`Unknown --model "${model}". Use ${MODEL} (default) or ${V3_MODEL}.`);
  }

  if (model === V3_MODEL) {
    const reel = flag(argv, "reel");
    const cutName = flag(argv, "cut");
    const content = reel ? TUTORIALS[reel] : undefined;
    if (!content || (cutName !== "short" && cutName !== "linkedin")) {
      throw new Error(
        `--model ${V3_MODEL} works on one reel and one cut at a time, from a tagged script: ` +
          `--reel contrast|hero --cut short|linkedin.`,
      );
    }
    const cut: TutorialCut = cutName;
    const modeName = flag(argv, "stability") ?? "natural";
    if (!(modeName in V3_STABILITY)) {
      throw new Error(`Unknown --stability "${modeName}". Use creative, natural or robust.`);
    }
    const mode = modeName as V3Mode;

    if (argv.includes("--stitch")) {
      stitchV3(content, cut, mode);
      return;
    }
    if (argv.includes("--mix")) {
      const music = flag(argv, "music");
      const out = flag(argv, "out");
      if (!music || !out) {
        throw new Error(`--mix with --model ${V3_MODEL} needs --music <variant> and --out <file.mp3>.`);
      }
      const r = await mixV3(content, cut, mode, music, path.resolve(ROOT, out));
      console.log(
        `\n  ${r.tutorial} ${r.cut} v3 ${mode} over ${music}: I ${r.measuredIntegratedLufs} LUFS, ` +
          `TP ${r.measuredTruePeakDbfs} dBTP, bed ${r.bedGainDb} dB with ${r.measuredDuckDb} dB of duck  ${r.mp3}`,
      );
      return;
    }

    const scriptPath = path.resolve(
      ROOT,
      flag(argv, "script") ?? path.join("config", `${content.id}-v3-script.json`),
    );
    const dryRun = argv.includes("--dry-run");
    const voiceId = flag(argv, "voice") ?? DRAFT_VOICE.id;
    const voiceName = voiceId === DRAFT_VOICE.id ? DRAFT_VOICE.name : voiceId;
    await generateV3(dryRun ? "" : readApiKey(), content, cut, mode, voiceId, voiceName, scriptPath, {
      force: argv.includes("--force"),
      dryRun,
    });
    return;
  }

  const tutorials = selectedTutorials(argv);
  const cuts = selectedCuts(argv);
  const log = loadLog();

  if (argv.includes("--dry-run")) {
    let characters = 0;
    let toGenerate = 0;
    for (const content of tutorials) {
      for (const cut of cuts) {
        const r = dryRun(content, cut, log);
        characters += r.characters;
        toGenerate += r.toGenerate;
      }
    }
    console.log(
      `\n${toGenerate} beats to generate, ${characters} characters across every beat listed. ` +
        `At ${CREDITS_PER_CHARACTER} credit a character on ${MODEL} that is about ` +
        `${characters * CREDITS_PER_CHARACTER} credits for a full regeneration, less whatever ` +
        `is already on disk. Nothing was called.`,
    );
    return;
  }

  if (argv.includes("--mix")) {
    const results: VoiceMixRecord[] = [];
    for (const content of tutorials) {
      for (const cut of cuts) results.push(await buildMix(content, cut, log));
    }
    console.log("\nmix results");
    for (const r of results) {
      console.log(
        `  ${r.tutorial} ${r.cut}: I ${r.measuredIntegratedLufs} LUFS, ` +
          `TP ${r.measuredTruePeakDbfs} dBTP, LRA ${r.measuredLra}, ` +
          `bed ${r.bedGainDb} dB with ${r.measuredDuckDb} dB of duck  ${r.wav}`,
      );
    }
    return;
  }

  const key = readApiKey();
  const voiceId = flag(argv, "voice") ?? DRAFT_VOICE.id;
  const voiceName = voiceId === DRAFT_VOICE.id ? DRAFT_VOICE.name : voiceId;
  const force = argv.includes("--force");

  let generated = 0;
  let skipped = 0;
  let credits = 0;
  let unmeasured = 0;

  for (const content of tutorials) {
    for (const cut of cuts) {
      for (const job of jobsFor(content, cut, voiceId)) {
        const existing = force ? null : upToDate(log, job);
        if (existing) {
          skipped += 1;
          console.log(
            `[skip] ${content.id}/${cut}/${job.beat.id}: hash ${job.hash} already on disk ` +
              `(${existing.durationSeconds.toFixed(2)}s)`,
          );
          continue;
        }
        const record = await generateBeat(key, log, job, voiceId, voiceName);
        generated += 1;
        if (record.creditsMeasured === null) unmeasured += 1;
        else credits += record.creditsMeasured;
      }
    }
  }

  console.log(
    `\n${generated} generated, ${skipped} skipped. ${credits} credits measured` +
      (unmeasured > 0 ? `, ${unmeasured} not reported by the usage endpoint` : "") +
      `. ${log.generations.length} of ${GENERATION_CAP} generations logged.`,
  );
  if (generated > 0) {
    console.log(
      `Run the mix next: npx tsx scripts/voice.ts --mix --reel ${flag(argv, "reel") ?? "both"} ` +
        `--cut ${flag(argv, "cut") ?? "both"}`,
    );
  }
}

main().catch((err: unknown) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
