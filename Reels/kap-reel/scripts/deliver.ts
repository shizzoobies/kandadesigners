/**
 * Phase 6 delivery. One command, everything Section 11 through Section 14 asks
 * for that a machine can produce or check.
 *
 *   npx tsx scripts/deliver.ts --variant a
 *   npm run deliver -- --variant a
 *
 * What it does, in order:
 *
 *   1. Builds the 45 second music mix for the chosen variant, if it is not
 *      already on disk. The 15 second mixes come from scripts/audio.ts.
 *   2. Encodes every out/render-*.mp4 that exists into its Section 11 target
 *      through scripts/encode.sh, muxing the matching mix.
 *   3. Writes all five sidecar SRTs from scripts/srt.ts.
 *   4. Extracts the two thumbnails, with the brand lockup composited in.
 *   5. Writes the six carousel stills.
 *   6. Runs the Section 14 acceptance checks it can run mechanically.
 *
 * A missing render is skipped with a message rather than treated as an error,
 * so this is runnable the moment the first render lands.
 *
 * Flags:
 *   --reel <key>         which reel to deliver: web, training,
 *                        tutorial-contrast or tutorial-hero. Defaults to web,
 *                        so every command that worked before this flag existed
 *                        still does exactly what it did.
 *   --variant a|b|c      which music bed was chosen. Required for the two
 *                        showcase reels, refused for the tutorials. The
 *                        training reel's beds are t-a, t-b and t-c.
 *   --remix              rebuild the 45 second mix even if it exists.
 *   --skip-encode        checks, captions and stills only.
 *   --only <name>        encode a single target, by format key.
 *
 * The training reel, added 2026-09-04:
 *
 *   npx tsx scripts/deliver.ts --reel training --variant t-a
 *
 * It is the same pipeline over a different set of names. Renders come from
 * out/render-training-{format}-{duration}.mp4, deliveries go to
 * out/kap-reel-training-{format}-{duration}.mp4 with matching SRTs, thumbnails
 * are out/thumbnail-training-{vertical,landscape}.jpg and the carousel stills
 * land in out/frames-training/. Nothing about the web reel's names moved.
 *
 * The two tutorial reels, added 2026-09-04:
 *
 *   npx tsx scripts/deliver.ts --reel tutorial-contrast
 *
 * Same pipeline again. Renders come from
 * out/render-tutorial-{id}-{format}-{duration}.mp4 and deliveries go to
 * out/kap-tut-{id}-{format}-{duration}.mp4 with matching SRTs, per the spec.
 * Two things differ. There is no --variant, because a tutorial's mix is voice
 * with a bed ducked under it and is built by scripts/voice.ts --mix from
 * assets/audio/mix-tut-{id}-{15|45}s.wav. And the frames the thumbnails and the
 * carousel stills come from are derived from src/tutorial/timeline.ts rather
 * than hand picked, because a tutorial's beat map is computed from the measured
 * length of its narration and a hand picked frame number would go stale the
 * first time a line was regenerated.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import {
  srtFileName,
  targetsFor,
  validateAll,
  writeSrtFiles,
  type ReelKey,
  type SrtTarget,
} from "./srt.js";
import { CONTRAST_TUTORIAL } from "../src/tutorial/reels/contrast.js";
import { HERO_TUTORIAL } from "../src/tutorial/reels/hero.js";
import { tutorialTimeline } from "../src/tutorial/timeline.js";
import { tutorialStrings, type TutorialContent } from "../src/tutorial/types.js";
import { mixFilePath } from "../src/tutorial/voice-log.js";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/**
 * The project root.
 *
 * Prefers the working directory, because the README has everyone run from the
 * D:\kap-reel junction and the junction path is the one without an ampersand
 * in it. Falls back to the module's own location when this is run from
 * somewhere else.
 */
function projectRoot(): string {
  const cwd = process.cwd();
  const pkg = path.join(cwd, "package.json");
  if (fs.existsSync(pkg)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(pkg, "utf8")) as { name?: string };
      if (parsed.name === "kap-reel") return cwd;
    } catch {
      // Fall through to the module path.
    }
  }
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

const ROOT = projectRoot();
const OUT_DIR = path.join(ROOT, "out");
const AUDIO_DIR = path.join(ROOT, "assets", "audio");
const RAW_AUDIO_DIR = path.join(AUDIO_DIR, "raw");
const CONFIG_DIR = path.join(ROOT, "config");
const LOCKUP = path.join(ROOT, "assets", "brand", "logo", "logo-lockup.webp");

const rel = (p: string) => path.relative(ROOT, p).replace(/\\/g, "/");

// ---------------------------------------------------------------------------
// Shell helpers
// ---------------------------------------------------------------------------

type RunResult = { code: number; stdout: string; stderr: string };

function run(bin: string, args: string[], opts: { inherit?: boolean } = {}): RunResult {
  const res = spawnSync(bin, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: opts.inherit ? "inherit" : "pipe",
  });
  if (res.error) throw res.error;
  return {
    code: res.status ?? -1,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
  };
}

const ffmpeg = (args: string[]) => run("ffmpeg", ["-hide_banner", "-nostdin", ...args]);

function ffprobe(args: string[]): string {
  return run("ffprobe", ["-v", "error", ...args]).stdout.trim();
}

/**
 * Where bash lives.
 *
 * encode.sh is a bash script and this project is built on Windows, where bash
 * is usually Git's and usually not on PATH: the Git installer only puts cmd/
 * there. So try PATH, then walk back from git.exe, then the two standard
 * install locations.
 */
let cachedBash: string | null | undefined;
function resolveBash(): string | null {
  if (cachedBash !== undefined) return cachedBash;
  const candidates: string[] = ["bash"];
  const where = spawnSync(process.platform === "win32" ? "where" : "which", ["git"], {
    encoding: "utf8",
  });
  const gitPath = (where.stdout ?? "").split(/\r?\n/)[0]?.trim();
  if (gitPath) {
    // .../Git/cmd/git.exe and .../Git/bin/git.exe both sit one level under Git.
    candidates.push(path.join(path.dirname(path.dirname(gitPath)), "bin", "bash.exe"));
  }
  candidates.push(
    path.join(process.env.ProgramFiles ?? "C:\\Program Files", "Git", "bin", "bash.exe"),
    path.join(process.env.LOCALAPPDATA ?? "", "Programs", "Git", "bin", "bash.exe"),
  );
  for (const candidate of candidates) {
    if (candidate !== "bash" && !fs.existsSync(candidate)) continue;
    const probe = spawnSync(candidate, ["-c", "exit 0"], { encoding: "utf8" });
    if (!probe.error && probe.status === 0) {
      cachedBash = candidate;
      return cachedBash;
    }
  }
  cachedBash = null;
  return null;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type MusicGeneration = {
  kind: string;
  id: string;
  file: string;
  accepted: boolean;
  usableFromSeconds?: number;
};

type AudioConfig = { generations: MusicGeneration[] };

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

const audioConfig = () => readJson<AudioConfig>(path.join(CONFIG_DIR, "audio.json"));

// ---------------------------------------------------------------------------
// Delivery targets
// ---------------------------------------------------------------------------

export type DeliveryTarget = {
  /** {format} in the Section 11 and Section 10 file names. */
  format: string;
  duration: "15s" | "45s";
  /** The Remotion render this is encoded from. */
  input: string;
  output: string;
  frames: number;
  canvas: string;
};

/** The five crops, before either reel's names are applied to them. */
const SHAPES: { format: string; duration: "15s" | "45s"; frames: number; canvas: string }[] = [
  { format: "vertical", duration: "15s", frames: 450, canvas: "1080x1920" },
  { format: "feed", duration: "15s", frames: 450, canvas: "1080x1350" },
  { format: "square", duration: "15s", frames: 450, canvas: "1080x1080" },
  { format: "linkedin", duration: "45s", frames: 1350, canvas: "1080x1350" },
  { format: "landscape", duration: "45s", frames: 1350, canvas: "1920x1080" },
];

/**
 * Everything a reel names differently. The web reel's names are the Section 11
 * ones and must not move; the training reel takes a "training" segment in the
 * same places, which keeps both reels' outputs in one out/ directory without
 * either being able to overwrite the other.
 */
type ReelNames = {
  /** Segment inserted into render, thumbnail and caption names. */
  infix: string;
  /**
   * Stem of the delivered MP4s and SRTs. The showcase reels keep the Section 11
   * name; a tutorial takes the shorter kap-tut-<id>, which is the name the spec
   * gives and which keeps the finals in Reels/instructional reels/ legible.
   */
  deliveryStem: string;
  /** Directory the carousel stills go in. */
  framesDir: string;
  /** The content config the manifest check reads project ids out of. */
  contentFile: string;
};

const REEL_NAMES: Record<ReelKey, ReelNames> = {
  web: {
    infix: "",
    deliveryStem: "kap-reel",
    framesDir: "out/frames",
    contentFile: "src/reels/web.ts",
  },
  training: {
    infix: "-training",
    deliveryStem: "kap-reel-training",
    framesDir: "out/frames-training",
    contentFile: "src/reels/training.ts",
  },
  "tutorial-contrast": {
    infix: "-tutorial-contrast",
    deliveryStem: "kap-tut-contrast",
    framesDir: "out/frames-tutorial-contrast",
    contentFile: "src/tutorial/reels/contrast.ts",
  },
  "tutorial-hero": {
    infix: "-tutorial-hero",
    deliveryStem: "kap-tut-hero",
    framesDir: "out/frames-tutorial-hero",
    contentFile: "src/tutorial/reels/hero.ts",
  },
};

/** The two tutorial reels, keyed the way --reel names them. */
const TUTORIAL_CONTENT: Partial<Record<ReelKey, TutorialContent>> = {
  "tutorial-contrast": CONTRAST_TUTORIAL,
  "tutorial-hero": HERO_TUTORIAL,
};

function tutorialFor(reel: ReelKey): TutorialContent | null {
  return TUTORIAL_CONTENT[reel] ?? null;
}

function targets(reel: ReelKey): DeliveryTarget[] {
  const { infix, deliveryStem } = REEL_NAMES[reel];
  return SHAPES.map((shape) => ({
    ...shape,
    input: `out/render${infix}-${shape.format}-${shape.duration}.mp4`,
    output: `out/${deliveryStem}-${shape.format}-${shape.duration}.mp4`,
  }));
}

// ---------------------------------------------------------------------------
// The 45 second mix
// ---------------------------------------------------------------------------

const FPS = 30;
const MIX_45_SECONDS = 45.0;
const MIX_45_FADE_OUT_SECONDS = 0.6;

/** Section 9 asks for at least 12 dB. scripts/audio.ts used 15 on the 15s mix. */
const SFX_DUCK_DB = 15;

const AFORMAT = "aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo";
const TARGET_LUFS = -14;

/** True peak Section 9 and Section 11 want on the file that ships. */
const DELIVERED_TRUE_PEAK = -1;

/**
 * Headroom left in the wav for the AAC encode's own true peak overshoot. See
 * the same constant in scripts/audio.ts for the measurement behind it: lossy
 * encoding does not preserve a true peak ceiling, and normalising the wav to
 * exactly -1 put the delivered 15 second MP4s at -0.88 dBTP.
 */
const ENCODE_TRUE_PEAK_HEADROOM_DB = 0.5;

const TARGET_TRUE_PEAK = DELIVERED_TRUE_PEAK - ENCODE_TRUE_PEAK_HEADROOM_DB;
const LOUDNORM_TARGET = `I=${TARGET_LUFS}:TP=${TARGET_TRUE_PEAK}:LRA=11`;
const MAX_LIMITING_DB = -14;

type SfxName = "impact-low" | "whoosh-transition" | "ui-click";

/**
 * SFX cue sheet for the 45 second cut, in frames.
 *
 * Owner decision 2026-09-03: empty, for the same reason the 15 second sheet in
 * scripts/audio.ts is empty. The owner did not like the whoosh, the click or
 * the impact, so both mixes are the music bed alone.
 *
 * The rejected sheet, kept so restoring it is a one line edit. Frames from
 * src/lib/timing.ts:
 *
 *   impact-low  0                                hook text slam
 *   whoosh      156, 366, 576, 786, 996, 1076    the six scene transitions
 *   ui-click    282, 492, 702, 912               claim in, beat+126
 *               1016, 1036, 1056                 surfaces tour cuts 2, 3, 4
 *
 * Everything else Section 9 asks of this mix is unchanged: the 50 second take
 * is still trimmed to 45.0s with a 600 ms fade, still limited and normalised to
 * -14 LUFS with a -1 dBTP true peak, and still re-measured off the file.
 */
const SFX_CUES_45S: { name: SfxName; frames: number[] }[] = [];

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
  if (start === -1 || end === -1) {
    throw new Error(`No loudnorm JSON in ffmpeg output:\n${stderr.slice(-2000)}`);
  }
  return JSON.parse(stderr.slice(start, end + 1)) as LoudnormMeasurement;
}

function measureVolume(file: string, slice?: { start: number; duration: number }) {
  const args = ["-i", file];
  args.push(
    "-af",
    slice
      ? `atrim=${slice.start}:${slice.start + slice.duration},volumedetect`
      : "volumedetect",
  );
  args.push("-f", "null", "-");
  const { stderr } = ffmpeg(args);
  return {
    mean: Number(/mean_volume:\s*(-?[\d.]+) dB/.exec(stderr)?.[1] ?? NaN),
    max: Number(/max_volume:\s*(-?[\d.]+) dB/.exec(stderr)?.[1] ?? NaN),
  };
}

/**
 * The 50 second take for a variant, plus how far into it the usable audio
 * starts.
 *
 * Accepted takes win. Where none was accepted the newest take is used with its
 * logged usableFromSeconds trim, which is the case for variant c: its 50s take
 * fades in over two seconds and config/audio.json records that trimming those
 * two seconds leaves 48.04s, enough for a 45 second cut.
 */
function musicTake45(variant: string): { file: string; from: number; id: string } {
  const matches = audioConfig().generations.filter(
    (g) =>
      g.kind === "music" &&
      g.id.startsWith(`music-${variant}-50s`) &&
      fs.existsSync(path.join(ROOT, g.file)),
  );
  if (matches.length === 0) {
    throw new Error(`No 50s take logged for music variant ${variant}.`);
  }
  const accepted = matches.filter((g) => g.accepted);
  const pool = accepted.length > 0 ? accepted : matches;
  const chosen = pool[pool.length - 1];
  return {
    file: path.join(ROOT, chosen.file),
    from: chosen.usableFromSeconds ?? 0,
    id: chosen.id,
  };
}

function sfxTake(name: SfxName): string {
  const matches = audioConfig().generations.filter(
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

function limiter(ceilingDb: number): string {
  const limit = Math.min(1, 10 ** (ceilingDb / 20)).toFixed(6);
  return `alimiter=limit=${limit}:attack=5:release=50:level=disabled`;
}

function build45Filter(
  cues: FlatCue[],
  gains: Record<string, number>,
  musicFrom: number,
  ceilingDb: number,
): string {
  const fadeStart = MIX_45_SECONDS - MIX_45_FADE_OUT_SECONDS;
  const parts: string[] = [
    `[0:a]atrim=${musicFrom}:${musicFrom + MIX_45_SECONDS},asetpts=N/SR/TB,` +
      `afade=t=out:st=${fadeStart}:d=${MIX_45_FADE_OUT_SECONDS},${AFORMAT}[bed]`,
  ];
  const labels = ["[bed]"];
  cues.forEach((cue, i) => {
    const delayMs = Math.round((cue.frame / FPS) * 1000);
    const label = `s${i}`;
    parts.push(
      `[${i + 1}:a]volume=${gains[cue.name]}dB,adelay=${delayMs}:all=1,` +
        `atrim=0:${MIX_45_SECONDS},${AFORMAT}[${label}]`,
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

function analyse(inputs: string[], filter: string): LoudnormMeasurement {
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
  if (res.code !== 0) {
    throw new Error(`loudnorm analysis failed:\n${res.stderr.slice(-3000)}`);
  }
  return parseLoudnorm(res.stderr);
}

/**
 * Reads the true integrated loudness of a finished file.
 *
 * Phase 5 established that loudnorm's own pass 2 output_i is a prediction and
 * can be wrong on these beds, so everything reported comes from a second
 * analysis pass over the delivered file rather than from the prediction.
 */
function verifyLoudness(file: string) {
  const { code, stderr } = ffmpeg([
    "-i",
    file,
    "-af",
    `loudnorm=${LOUDNORM_TARGET}:print_format=json`,
    "-f",
    "null",
    "-",
  ]);
  if (code !== 0) throw new Error(`loudness verification failed:\n${stderr.slice(-3000)}`);
  const m = parseLoudnorm(stderr);
  return {
    integrated: Number(m.input_i),
    truePeak: Number(m.input_tp),
    lra: Number(m.input_lra),
  };
}

/**
 * Deadband and corrective pass, the twin of the one in scripts/audio.ts. Same
 * argument: loudnorm's pass 2 is a prediction, this project measures the file
 * instead, and where the file is not at the target a flat gain is what puts it
 * there. Inside the deadband nothing happens, which is what keeps a rebuild of
 * reel one's 45 second mix byte for byte what it was.
 */
const LOUDNESS_CORRECTION_DEADBAND_DB = 0.15;

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
  if (res.code !== 0) throw new Error(`loudness correction failed:\n${res.stderr.slice(-3000)}`);
  fs.renameSync(temp, wav);
  const corrected = verifyLoudness(wav);
  console.log(
    `  pass 3 corrected: ${delta > 0 ? "+" : ""}${delta.toFixed(2)} dB, now ` +
      `I ${corrected.integrated} LUFS, TP ${corrected.truePeak} dBTP, LRA ${corrected.lra}`,
  );
  return corrected;
}

export function build45sMix(variant: string, force: boolean): string {
  const wav = path.join(AUDIO_DIR, `mix-${variant}-45s.wav`);
  if (fs.existsSync(wav) && !force) {
    const v = verifyLoudness(wav);
    console.log(
      `[mix 45s] ${rel(wav)} already built: I ${v.integrated} LUFS, TP ${v.truePeak} dBTP. ` +
        `Pass --remix to rebuild.`,
    );
    return wav;
  }

  const music = musicTake45(variant);
  const cues: FlatCue[] = SFX_CUES_45S.flatMap(({ name, frames }) => {
    const file = sfxTake(name);
    return frames.map((frame) => ({ name, file, frame }));
  });

  console.log(`[mix 45s] variant ${variant}`);
  console.log(`  bed     ${rel(music.file)} (${music.id}), from ${music.from}s, 45.0s`);

  // Peak to peak, not mean to mean. A one shot is mostly silence, so matching
  // means would have boosted the click about 20 dB past where it belongs.
  const bed = measureVolume(music.file, { start: music.from, duration: MIX_45_SECONDS });
  const gains: Record<string, number> = {};
  const landed: Record<string, number> = {};
  for (const cue of cues) {
    if (gains[cue.name] !== undefined) continue;
    const sfx = measureVolume(cue.file);
    gains[cue.name] = Number((bed.max - SFX_DUCK_DB - sfx.max).toFixed(2));
    landed[cue.name] = Number((sfx.max + gains[cue.name]).toFixed(2));
  }
  console.log(`  bed peak ${bed.max} dBFS, mean ${bed.mean} dBFS`);
  for (const [name, gain] of Object.entries(gains)) {
    console.log(
      `  sfx ${name}: ${gain > 0 ? "+" : ""}${gain} dB, lands at ${landed[name]} dBFS, ` +
        `${SFX_DUCK_DB} dB under the bed peak`,
    );
  }

  const inputs = ["-i", music.file, ...cues.flatMap((c) => ["-i", c.file])];

  // Solve for a limiter ceiling that leaves loudnorm the headroom it needs.
  // Without it loudnorm caps its own gain to protect the peak ceiling and
  // silently misses the loudness target, which is what it did on two of three
  // variants in Phase 5.
  const raw = analyse(inputs, build45Filter(cues, gains, music.from, 0));
  let ceiling = Math.min(
    Number(raw.input_tp),
    TARGET_TRUE_PEAK - (TARGET_LUFS - Number(raw.input_i)) - 1.0,
  );
  let measured = raw;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    ceiling = Math.max(ceiling, MAX_LIMITING_DB);
    measured = analyse(inputs, build45Filter(cues, gains, music.from, ceiling));
    const predicted = Number(measured.input_tp) + (TARGET_LUFS - Number(measured.input_i));
    if (predicted <= TARGET_TRUE_PEAK || ceiling <= MAX_LIMITING_DB) break;
    ceiling -= predicted - TARGET_TRUE_PEAK + 0.3;
  }
  ceiling = Number(ceiling.toFixed(2));
  const filter = build45Filter(cues, gains, music.from, ceiling);
  console.log(`  limiter ceiling ${ceiling} dBFS`);
  console.log(
    `  pass 1: I ${measured.input_i} LUFS, TP ${measured.input_tp} dBTP, LRA ${measured.input_lra}`,
  );

  fs.mkdirSync(AUDIO_DIR, { recursive: true });
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
  if (pass2.code !== 0) throw new Error(`loudnorm pass 2 failed:\n${pass2.stderr.slice(-3000)}`);

  const afterPass2 = verifyLoudness(wav);
  console.log(
    `  pass 2 verified: I ${afterPass2.integrated} LUFS, TP ${afterPass2.truePeak} dBTP, ` +
      `LRA ${afterPass2.lra}`,
  );
  const verified = correctLoudness(wav, afterPass2);
  if (Math.abs(verified.integrated - TARGET_LUFS) > 0.5) {
    console.log(
      `  WARNING: integrated loudness is ${verified.integrated} LUFS, more than 0.5 off target.`,
    );
  }
  console.log(`  wrote ${rel(wav)}`);
  return wav;
}

// ---------------------------------------------------------------------------
// Encode
// ---------------------------------------------------------------------------

function encodeTarget(target: DeliveryTarget, mixFor: (t: DeliveryTarget) => string | null) {
  const input = path.join(ROOT, target.input);
  if (!fs.existsSync(input)) {
    console.log(
      `[skip] ${target.output}: ${target.input} does not exist yet. ` +
        `Render ${target.canvas} to that name and run this again.`,
    );
    return false;
  }
  const bash = resolveBash();
  if (!bash) {
    console.log(`[skip] ${target.output}: bash not found, cannot run scripts/encode.sh.`);
    return false;
  }
  const args = ["scripts/encode.sh", "--input", target.input, "--output", target.output];
  const mix = mixFor(target);
  if (mix) args.push("--audio", rel(mix));
  const res = run(bash, args, { inherit: true });
  if (res.code !== 0) {
    console.log(`[fail] ${target.output}: encode.sh exited ${res.code}`);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Stills
// ---------------------------------------------------------------------------

const CANVAS_HEX = "0xF8F5F2";
const LOCKUP_WIDTH = 360;
const LOCKUP_ASPECT = 303 / 800;
const LOCKUP_PAD = 24;
/** Distance from the safe area edges to the lockup plate. */
const LOCKUP_INSET = 54;
/** The opaque lower third scrim, from the scenes. Used to find the band. */
const SCRIM_RGB: [number, number, number] = [0x14, 0x10, 0x0c];

type SafeArea = { top: number; bottom: number; left: number; right: number };

function safeArea(width: number, height: number, top: number, bottom: number, right: number): SafeArea {
  return {
    top: Math.round(height * top),
    bottom: height - Math.round(height * bottom),
    left: 0,
    right: width - Math.round(width * right),
  };
}

/** Mirrors src/lib/layout.ts SAFE_ZONES for the two thumbnail canvases. */
const SAFE_VERTICAL = safeArea(1080, 1920, 0.15, 0.2, 0.1);
const SAFE_LANDSCAPE = safeArea(1920, 1080, 0.05, 0.08, 0.05);

function extractFrame(input: string, frame: number, dest: string, extraFilter = ""): void {
  const chain = [`select=eq(n\\,${frame})`, extraFilter].filter(Boolean).join(",");
  const res = ffmpeg([
    "-i",
    input,
    "-vf",
    chain,
    "-fps_mode",
    "passthrough",
    "-frames:v",
    "1",
    "-y",
    dest,
  ]);
  if (res.code !== 0) {
    throw new Error(`frame ${frame} extract failed:\n${res.stderr.slice(-2000)}`);
  }
}

/**
 * The y of the top of the lower third band, or null when there is no full
 * width band on this frame.
 *
 * The band is an opaque scrim that runs edge to edge in the stacked crops, so
 * a row whose far left and far right pixels are both scrim coloured is inside
 * it. Landscape puts the lower third in a right hand panel instead, which this
 * deliberately does not match: in that layout the bottom left of the safe area
 * is free and the lockup goes there.
 */
async function findBandTop(file: string): Promise<number | null> {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const at = (x: number, y: number) => {
    const i = (y * width + x) * channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const isScrim = (p: number[]) => p.every((v, i) => Math.abs(v - SCRIM_RGB[i]) < 10);
  let top: number | null = null;
  let runStart: number | null = null;
  for (let y = 0; y < height; y += 1) {
    const scrim = isScrim(at(20, y)) && isScrim(at(width - 20, y));
    if (scrim && runStart === null) runStart = y;
    if (!scrim && runStart !== null) {
      if (y - runStart > 40) top = runStart;
      runStart = null;
    }
  }
  if (runStart !== null && height - runStart > 40) top = runStart;
  return top;
}

/**
 * Section 11 asks for a thumbnail with a real site on screen and the brand mark
 * visible, and says not a text card.
 *
 * No frame in the cut has both. The lockup only appears on the CTA card, which
 * is exactly the text card Section 11 rules out. So the mark is composited: the
 * picture is the best frame of a real site on a real device, and the lockup is
 * laid over it on a canvas coloured plate inside the safe area.
 *
 * Which corner depends on the frame, because the point of the thumbnail is the
 * site and the mark must not cover it:
 *
 * - No full width band, which is the landscape layout with its right hand
 *   panel: the bottom left of the safe area is free, so the mark goes there,
 *   where a brand bug belongs.
 *
 * - Full width band, which is every stacked crop: the lower third owns the
 *   bottom of the safe area and there are only about seventy pixels of safe
 *   area left underneath it. Sitting the plate above the band instead puts it
 *   straight across the device screen, which hides the work the thumbnail
 *   exists to show, so the mark moves to the top left of the safe area, over
 *   the plate's out of focus background.
 */
async function thumbnail(
  input: string,
  frame: number,
  safe: SafeArea,
  dest: string,
  scratch: string,
): Promise<void> {
  extractFrame(input, frame, scratch);
  const bandTop = await findBandTop(scratch);

  const logoHeight = Math.round(LOCKUP_WIDTH * LOCKUP_ASPECT);
  const plateWidth = LOCKUP_WIDTH + LOCKUP_PAD * 2;
  const plateHeight = logoHeight + LOCKUP_PAD * 2;
  const plateLeft = safe.left + LOCKUP_INSET;
  const plateTop =
    bandTop === null
      ? Math.round(safe.bottom - LOCKUP_INSET - plateHeight)
      : safe.top + LOCKUP_INSET;

  console.log(
    `  ${path.basename(dest)}: frame ${frame}, lockup plate at ${plateLeft},${plateTop} ` +
      (bandTop === null
        ? "(no full width band, bottom left of the safe area)"
        : `(band from y ${bandTop}, so top left of the safe area)`),
  );

  const filter =
    `[0:v]select=eq(n\\,${frame}),` +
    `drawbox=x=${plateLeft}:y=${plateTop}:w=${plateWidth}:h=${plateHeight}:` +
    `color=${CANVAS_HEX}@1:t=fill[bg];` +
    `[1:v]scale=${LOCKUP_WIDTH}:-1[lg];` +
    `[bg][lg]overlay=${plateLeft + LOCKUP_PAD}:${plateTop + LOCKUP_PAD}[out]`;

  const res = ffmpeg([
    "-i",
    input,
    "-i",
    LOCKUP,
    "-filter_complex",
    filter,
    "-map",
    "[out]",
    "-fps_mode",
    "passthrough",
    "-frames:v",
    "1",
    "-q:v",
    "2",
    "-y",
    dest,
  ]);
  if (res.code !== 0) {
    throw new Error(`thumbnail failed:\n${res.stderr.slice(-2000)}`);
  }
}

/**
 * Six carousel stills, 1080x1350, from the vertical render.
 *
 * The crop is 4:5 centred on the vertical safe area rather than on the canvas,
 * so the reserved top and bottom strips are what gets thrown away and every
 * band and line of copy survives the crop intact.
 */
/**
 * Frames re-read from the re-paced beat map on 2026-09-03. Four distinct
 * cleared sites, one context plate and the CTA card. The two featured projects
 * are sampled well inside their clean captures with the claim up; the two tour
 * frames are sampled mid cut.
 *
 * Re-read again on 2026-09-04, when the drawn end card moved every beat after
 * the first project. Each still keeps the visual moment it had rather than the
 * frame number it had: the two that sat inside beats that only shifted moved by
 * the same sixteen or eight frames, and the CTA still moved to sit inside the
 * finished card rather than during the draw.
 */
type CarouselFrame = { frame: number; slug: string; note: string };

const CAROUSEL_FRAMES: Record<"web" | "training", CarouselFrame[]> = {
  web: [
    // PROJECT_1 54 to 186, clean capture from 78, claim in at 90. The beat did
    // not move, so neither did this.
    { frame: 120, slug: "1-fore-motion-golf", note: "clean capture, claim on screen" },
    // PROJECT_2 186 to 318, clean capture from 210, claim in at 222. Was 260 in
    // a beat that started at 194, so the same relative frame 66 is now 252.
    { frame: 252, slug: "2-project-makeover", note: "clean capture, claim on screen" },
    // SURFACES_TOUR cuts at 318, 336 and 354. Ten frames into the first.
    { frame: 328, slug: "3-surfaces-booking", note: "tour cut, Booking, MBS Medicine" },
    {
      // Ten frames into the third cut.
      frame: 364,
      slug: "4-surfaces-no-page-builder",
      note: "tour cut, No page builder, Southern Legacy Contractors",
    },
    // The Project Makeover plate now runs 186 to 210 and the project name
    // finishes typing on at 204, so 206 is inside that plate with the band not
    // caught mid word.
    { frame: 206, slug: "5-context-plate", note: "plate composite, phone in hands" },
    // CALL_TO_ACTION 372 to 450. The contact block lands at 422 and the drawn
    // lockup's last wordmark glyph finishes at 432, so 440 is the finished
    // card, frozen, with eight frames of margin either side of it.
    { frame: 440, slug: "6-call-to-action", note: "CTA card, drawn lockup and contact" },
  ],
  // Same beat map, so the same frames are the right frames. Four distinct
  // surfaces across the six: the walk-through on a 16:10 laptop, the same
  // course being answered on a phone, the P&L simulator on a tablet in hands,
  // and the RFI microlearning on a desk.
  training: [
    { frame: 130, slug: "1-safety-walkthrough", note: "laptop, claim on screen" },
    { frame: 262, slug: "2-safety-stop-or-go", note: "phone, stop or go, claim on screen" },
    { frame: 328, slug: "3-surfaces-finance", note: "tour cut, Finance, P&L simulator" },
    {
      frame: 364,
      slug: "4-surfaces-scorm-xapi",
      note: "tour cut, SCORM and xAPI, walk-through card",
    },
    { frame: 206, slug: "5-context-plate", note: "plate composite, phone in hands" },
    { frame: 440, slug: "6-call-to-action", note: "CTA card, drawn lockup and contact" },
  ],
};

/**
 * Which frames a reel's carousel stills come from.
 *
 * The showcase reels' frames are hand picked and hand argued, above. A
 * tutorial's are derived: one still per beat of the 15 second cut, taken at the
 * midpoint of the beat, because a tutorial beat is one idea held for its own
 * length and the middle of it is the frame that shows the idea. Deriving them
 * also means they follow the timeline when a line is regenerated, which a hand
 * picked frame number would not.
 */
function carouselFramesFor(reel: ReelKey): CarouselFrame[] {
  const tutorial = tutorialFor(reel);
  if (!tutorial) return CAROUSEL_FRAMES[reel as "web" | "training"];
  return tutorialTimeline(tutorial, "short").entries.map((entry, i) => ({
    frame: Math.round((entry.start + entry.end) / 2),
    slug: `${i + 1}-${entry.beat.id}`,
    note: `${entry.beat.id} beat, midpoint of ${entry.start} to ${entry.end}`,
  }));
}

function carouselStills(input: string, framesDir: string, frames: CarouselFrame[]): string[] {
  const FRAMES_DIR = path.join(ROOT, framesDir);
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  const cropWidth = 1080;
  const cropHeight = 1350;
  const centre = Math.round((SAFE_VERTICAL.top + SAFE_VERTICAL.bottom) / 2);
  let y = centre - Math.round(cropHeight / 2);
  y = Math.max(0, Math.min(y, 1920 - cropHeight));
  const written: string[] = [];
  for (const still of frames) {
    const dest = path.join(FRAMES_DIR, `carousel-${still.slug}.jpg`);
    extractFrame(input, still.frame, dest, `crop=${cropWidth}:${cropHeight}:0:${y}`);
    console.log(`  ${rel(dest)}: frame ${still.frame}, ${still.note}`);
    written.push(dest);
  }
  return written;
}

// ---------------------------------------------------------------------------
// Section 14 acceptance checks
// ---------------------------------------------------------------------------

/**
 * Built from a code point, so this file does not itself trip the item 6 grep
 * it runs.
 */
const EM_DASH = String.fromCharCode(0x2014);

type CheckResult = { id: number; title: string; verdict: "PASS" | "FAIL" | "MANUAL"; lines: string[] };

type Project = { id: string; display_name: string; cleared_for_public_showcase: boolean };
type Capture = { id: string; project: string };

/**
 * Item 1, over the content config for the reel being delivered.
 *
 * Until 2026-09-04 this read src/Reel.tsx and src/scenes/SurfacesTour.tsx,
 * because that is where the ids lived. The content lift moved every project id,
 * plate id and capture id into src/reels/{web,training}.ts, and a check that
 * greps a file no longer containing any ids passes by finding nothing, which is
 * worse than failing. So it reads the config for this reel, and it fails when
 * that config yields no ids at all.
 */
function checkProjectClearance(reel: ReelKey): CheckResult {
  const lines: string[] = [];
  const projects = readJson<{ approved: Project[] }>(
    path.join(CONFIG_DIR, "projects.json"),
  ).approved;
  const cleared = new Map(projects.map((p) => [p.id, p.cleared_for_public_showcase]));

  const captures = readJson<Capture[] | { captures: Capture[] }>(
    path.join(ROOT, "assets", "captures", "captures.json"),
  );
  const captureList = Array.isArray(captures) ? captures : captures.captures;
  const captureProject = new Map(captureList.map((c) => [c.id, c.project]));

  const where = REEL_NAMES[reel].contentFile;
  const content = fs.readFileSync(path.join(ROOT, where), "utf8");

  const referenced = new Map<string, string>();
  // Project beats name their project outright.
  for (const m of content.matchAll(/projectId:\s*"([^"]+)"/g)) {
    referenced.set(m[1], `${where} projectId`);
  }
  // Every other shot names a capture, so each one is resolved back to the
  // project it belongs to before the clearance is checked. That covers the
  // surfaces tour, the hook, and any beat overriding the plate's own binding.
  for (const m of content.matchAll(/[cC]aptureId:\s*"([^"]+)"/g)) {
    const project = captureProject.get(m[1]);
    if (!project) {
      referenced.set(`${m[1]} (unresolved capture)`, `${where} captureId`);
      continue;
    }
    if (!referenced.has(project)) referenced.set(project, `${where} captureId`);
  }

  // A showcase reel that names no project is a check that looked at nothing,
  // which is worse than a failure. A tutorial that names none is the normal
  // case: the contrast tutorial is about a colour and shows no client site at
  // all, and Phase A's hero content has not had its three cleared sites written
  // into it yet. So the emptiness is reported rather than treated as a fault,
  // and any id a tutorial does name is still checked.
  const tutorial = tutorialFor(reel) !== null;
  let ok = referenced.size > 0 || tutorial;
  if (referenced.size === 0) {
    lines.push(
      tutorial
        ? `  ok   no project or capture ids in ${where}: this tutorial shows no client site`
        : `  BAD  no project or capture ids found in ${where}`,
    );
  }
  for (const [id, source] of [...referenced].sort()) {
    const state = cleared.get(id);
    if (state === true) {
      lines.push(`  ok   ${id} (${source}) cleared`);
    } else {
      ok = false;
      lines.push(
        `  BAD  ${id} (${source}) ${state === undefined ? "not in projects.json" : "not cleared"}`,
      );
    }
  }
  return {
    id: 1,
    title: "Every project shown is cleared in config/projects.json",
    verdict: ok ? "PASS" : "FAIL",
    lines,
  };
}

/**
 * Item 2, applied to the caption files.
 *
 * The rule is that an on-screen number has to trace to a measurement. Three
 * things are numbers on screen that are not measurements and are allowed by
 * name rather than by pattern: the phone number, a year, and the version of a
 * published standard. WCAG is the only standard designation in either reel's
 * copy, at 2.2 in the web reel and 2.1 in the training one, and it is matched
 * as the phrase rather than as a bare version, so a stray 2.1 or 2.2 somewhere
 * else would still be caught.
 *
 * Note for the training reel: the P&L figures a viewer can read in the finance
 * beat are course content inside the capture, not a caption and not a claim.
 * They are fictional teaching numbers in a K&A original sample, the owner
 * decided on 2026-09-04 to keep the shot, and nothing in the caption files or
 * the post copy repeats them. This check reads captions, so it never sees them.
 */
const STANDARD_DESIGNATIONS = [/WCAG\s+\d+(?:\.\d+)?/g];

function checkNumbers(srtTargets: SrtTarget[]): CheckResult {
  const lines: string[] = [];
  const metricsRaw = fs.readFileSync(path.join(CONFIG_DIR, "metrics.json"), "utf8");
  const metricValues = new Set(
    (JSON.stringify(JSON.parse(metricsRaw)).match(/-?\d+(?:\.\d+)?/g) ?? []).map(String),
  );
  const brand = readJson<{ phone: string }>(path.join(CONFIG_DIR, "brand.json"));

  const found = new Map<string, { verdict: string; where: Set<string> }>();
  let ok = true;

  for (const target of srtTargets) {
    const file = path.join(OUT_DIR, srtFileName(target));
    if (!fs.existsSync(file)) {
      lines.push(`  BAD  ${srtFileName(target)} was not written`);
      ok = false;
      continue;
    }
    const text = fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((l) => !/^\d+$/.test(l) && !l.includes("-->") && l.trim() !== "")
      .join("\n");

    const note = (token: string, verdict: string) => {
      const entry = found.get(token) ?? { verdict, where: new Set<string>() };
      entry.verdict = verdict;
      entry.where.add(srtFileName(target));
      found.set(token, entry);
    };

    let residue = text;
    for (const phone of [brand.phone]) {
      if (residue.includes(phone)) note(phone, "the phone number in config/brand.json");
      residue = residue.split(phone).join(" ");
    }
    for (const pattern of STANDARD_DESIGNATIONS) {
      for (const m of residue.matchAll(pattern)) note(m[0], "a published standard designation");
      residue = residue.replace(pattern, " ");
    }
    for (const m of residue.matchAll(/\d+(?:\.\d+)?/g)) {
      const token = m[0];
      const year = Number(token);
      if (metricValues.has(token)) {
        note(token, "in config/metrics.json");
      } else if (Number.isInteger(year) && year >= 1900 && year <= 2100) {
        note(token, "a year");
      } else {
        note(token, "UNTRACED");
        ok = false;
      }
    }
  }

  for (const [token, entry] of found) {
    const mark = entry.verdict === "UNTRACED" ? "BAD " : "ok  ";
    lines.push(`  ${mark} "${token}": ${entry.verdict} (${[...entry.where].length} files)`);
  }
  if (found.size === 0) lines.push("  no numbers in any cue");

  return {
    id: 2,
    title: "Every number in the SRT cues traces to a source",
    verdict: ok ? "PASS" : "FAIL",
    lines,
  };
}

function checkFrameCounts(deliveries: DeliveryTarget[]): CheckResult {
  const lines: string[] = [];
  let ok = true;
  for (const target of deliveries) {
    const file = path.join(ROOT, target.output);
    if (!fs.existsSync(file)) {
      lines.push(`  BAD  ${target.output} not delivered yet`);
      ok = false;
      continue;
    }
    const frames = Number(
      ffprobe([
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=nb_frames",
        "-of",
        "default=nw=1:nk=1",
        file,
      ]),
    );
    if (frames === target.frames) {
      lines.push(`  ok   ${target.output}: ${frames} frames`);
    } else {
      lines.push(`  BAD  ${target.output}: ${frames} frames, expected ${target.frames}`);
      ok = false;
    }
  }
  return {
    id: 5,
    title: "All five MP4s open in ffprobe at the expected frame count",
    verdict: ok ? "PASS" : "FAIL",
    lines,
  };
}

const TEXT_EXTENSIONS = new Set([
  ".srt",
  ".md",
  ".txt",
  ".ts",
  ".tsx",
  ".json",
  ".sh",
  ".css",
  ".mjs",
  ".js",
]);

/**
 * out/bundle is Remotion's webpack output. It is third party code that is
 * neither shipped nor authored here, and it is full of em dashes, so it is
 * skipped and the skip is printed rather than left implicit.
 */
const EM_DASH_SKIP = new Set(["node_modules", ".git", ".omc", "bundle"]);

function walkText(dir: string, hits: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EM_DASH_SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkText(full, hits);
      continue;
    }
    if (!TEXT_EXTENSIONS.has(path.extname(entry.name))) continue;
    const text = fs.readFileSync(full, "utf8");
    text.split(/\r?\n/).forEach((line, i) => {
      if (line.includes(EM_DASH)) hits.push(`${rel(full)}:${i + 1}: ${line.trim().slice(0, 100)}`);
    });
  }
}

function checkEmDashes(reel: ReelKey): CheckResult {
  const hits: string[] = [];
  for (const dir of ["out", "src", "scripts", "config"]) {
    const full = path.join(ROOT, dir);
    if (fs.existsSync(full)) walkText(full, hits);
  }
  for (const file of ["LICENSING.md", "README.md"]) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) continue;
    fs.readFileSync(full, "utf8")
      .split(/\r?\n/)
      .forEach((line, i) => {
        if (line.includes(EM_DASH)) hits.push(`${file}:${i + 1}: ${line.trim().slice(0, 100)}`);
      });
  }

  // The walk above catches an em dash in a source file, which covers a content
  // file's literals as a side effect of them being source. A tutorial's strings
  // are scanned again as strings, so the check is about what reaches a frame or
  // a file rather than about which file it happens to be typed in, and so a
  // string assembled from parts is caught as the string it assembles to.
  const tutorial = tutorialFor(reel);
  let scanned = 0;
  if (tutorial) {
    for (const value of tutorialStrings(tutorial)) {
      scanned += 1;
      if (value.includes(EM_DASH)) {
        hits.push(`${REEL_NAMES[reel].contentFile}: "${value.slice(0, 90)}"`);
      }
    }
  }

  const lines = hits.length === 0 ? ["  none found"] : hits.map((h) => `  BAD  ${h}`);
  if (tutorial) {
    lines.push(
      `  scanned ${scanned} narration, caption, hook and end card strings in ${REEL_NAMES[reel].contentFile}`,
    );
  }
  lines.push("  skipped out/bundle, node_modules and .omc: build output and third party code");
  return {
    id: 6,
    title: "Zero em dashes in on-screen text, captions, copy or source",
    verdict: hits.length === 0 ? "PASS" : "FAIL",
    lines,
  };
}

const LICENSING_SECTIONS = [
  "ElevenLabs",
  "Music",
  "Sound effects",
  "Generated visuals",
];

function checkLicensing(): CheckResult {
  const file = path.join(ROOT, "LICENSING.md");
  const lines: string[] = [];
  if (!fs.existsSync(file)) {
    return { id: 8, title: "LICENSING.md is complete", verdict: "FAIL", lines: ["  missing"] };
  }
  const text = fs.readFileSync(file, "utf8").split(/\r?\n/);

  // Top level headings only, so a section owns its subsections.
  const heads: { name: string; line: number }[] = [];
  text.forEach((line, i) => {
    const m = /^##\s+(.*)$/.exec(line);
    if (m) heads.push({ name: m[1].trim(), line: i });
  });

  let ok = true;
  for (const wanted of LICENSING_SECTIONS) {
    const index = heads.findIndex((h) => h.name.toLowerCase().startsWith(wanted.toLowerCase()));
    if (index === -1) {
      lines.push(`  BAD  no "${wanted}" section`);
      ok = false;
      continue;
    }
    const from = heads[index].line;
    const to = heads[index + 1]?.line ?? text.length;
    const body = text.slice(from, to);
    const bad = body
      .map((line, i) => ({ line, n: from + i + 1 }))
      .filter(({ line }) => line.includes("FILL_IN") || line.includes("(none yet)"));
    if (bad.length === 0) {
      lines.push(`  ok   ${heads[index].name}`);
    } else {
      ok = false;
      for (const b of bad) lines.push(`  BAD  ${heads[index].name} line ${b.n}: ${b.line.trim().slice(0, 90)}`);
    }
  }
  return {
    id: 8,
    title: "LICENSING.md has no placeholders left in the generated asset sections",
    verdict: ok ? "PASS" : "FAIL",
    lines,
  };
}

/** The composition id prefix a reel's Debug twins carry, for the manual notes. */
const DEBUG_PREFIX: Record<ReelKey, string> = {
  web: "Reel",
  training: "Training",
  "tutorial-contrast": "TutorialContrast",
  "tutorial-hero": "TutorialHero",
};

function manualChecks(reel: ReelKey): CheckResult[] {
  const stem = REEL_NAMES[reel].deliveryStem;
  const prefix = DEBUG_PREFIX[reel];
  return [
    {
      id: 3,
      title: "The vertical cut is comprehensible with audio muted",
      verdict: "MANUAL",
      lines: [
        `  Watch out/${stem}-vertical-15s.mp4 with the sound off, start to finish.`,
        "  Every claim is burned in, so this is a judgement about pace, not about",
        "  whether the text exists. Nothing here can decide it.",
      ],
    },
    {
      id: 4,
      title: "No text or logo intrudes into a reserved safe zone",
      verdict: "MANUAL",
      lines: [
        "  Checked against the Debug compositions, which draw the reserved zones.",
        "  Re-render a Debug still after any scene change:",
        `  npx remotion still out/bundle ${prefix}VerticalDebug out/safe.png --frame=N`,
      ],
    },
    {
      id: 7,
      title: "Every plate composite inspected full size",
      verdict: "MANUAL",
      lines: [
        tutorialFor(reel) !== null
          ? "  No plate composite in either tutorial. Its pictures are drawn scenes, a"
          : reel === "training"
            ? "  Done at the reel two plate gate. Full size stills are in out/gate-t4."
            : "  Done in Phase 4. Full size stills are in out/gate4.",
        tutorialFor(reel) !== null
          ? "  Jam recording and real captures, none of them a generated photograph."
          : "  Re-inspect any plate whose capture or composite changed: no visible face,",
        tutorialFor(reel) !== null
          ? "  Inspect the Jam recording full size instead, once it lands."
          : "  no hand artifact, no warped device, no generated text or screen content",
        tutorialFor(reel) !== null ? "" : "  at the quad edges.",
      ].filter((l) => l !== ""),
    },
    {
      id: 9,
      title: "Full rebuild render time documented in the README",
      verdict: "MANUAL",
      lines: [
        "  The README carries a render time log. Add a row for each Phase 6 render",
        "  as it lands, so a future rebuild is predictable.",
      ],
    },
  ];
}

function runAcceptance(
  reel: ReelKey,
  deliveries: DeliveryTarget[],
  srtTargets: SrtTarget[],
): number {
  console.log(`\n=== Section 14 acceptance, ${reel} reel ===\n`);
  const results = [
    checkProjectClearance(reel),
    checkNumbers(srtTargets),
    ...manualChecks(reel),
    checkFrameCounts(deliveries),
    checkEmDashes(reel),
    checkLicensing(),
  ].sort((a, b) => a.id - b.id);

  let failures = 0;
  for (const r of results) {
    if (r.verdict === "FAIL") failures += 1;
    console.log(`[${r.verdict}] ${r.id}. ${r.title}`);
    for (const line of r.lines) console.log(line);
    console.log("");
  }
  const pass = results.filter((r) => r.verdict === "PASS").length;
  const manual = results.filter((r) => r.verdict === "MANUAL").length;
  console.log(`${pass} pass, ${failures} fail, ${manual} manual.`);
  return failures;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
}

/**
 * Which music variants a reel's --variant accepts.
 *
 * The two tutorials take none. Their mixes are not a music bed on its own but
 * the narration with a bed ducked under it, they are built by
 * scripts/voice.ts --mix, and which take beds them is a field in the content
 * file rather than a choice at delivery time. So --variant is refused for them
 * rather than ignored: a flag that silently does nothing is worse than an error.
 */
const VARIANTS: Record<ReelKey, string[]> = {
  web: ["a", "b", "c"],
  training: ["t-a", "t-b", "t-c"],
  "tutorial-contrast": [],
  "tutorial-hero": [],
};

const REELS: ReelKey[] = ["web", "training", "tutorial-contrast", "tutorial-hero"];

async function main(argv: string[]): Promise<void> {
  const reelArg = flag(argv, "reel") ?? "web";
  if (!REELS.includes(reelArg as ReelKey)) {
    console.error(`deliver: unknown reel "${reelArg}". Use ${REELS.join(", ")}.`);
    process.exit(2);
  }
  const reel = reelArg as ReelKey;
  const names = REEL_NAMES[reel];
  const tutorial = tutorialFor(reel);
  const TARGETS = targets(reel);
  const srtTargets = targetsFor(reel);

  const variant = flag(argv, "variant");
  if (tutorial) {
    if (variant) {
      console.error(
        `deliver: --variant is not used for ${reel}. Its mix is built by ` +
          `npx tsx scripts/voice.ts --mix --reel ${tutorial.id}, and the bed under it ` +
          `is content.music in ${names.contentFile}.`,
      );
      process.exit(2);
    }
  } else if (!variant || !VARIANTS[reel].includes(variant)) {
    console.error(`deliver: --variant ${VARIANTS[reel].join("|")} is required for the ${reel} reel.`);
    process.exit(2);
  }
  const only = flag(argv, "only");
  const skipEncode = argv.includes("--skip-encode");
  const remix = argv.includes("--remix");

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const scratch = path.join(OUT_DIR, ".deliver-scratch.png");

  const mix15 = tutorial
    ? path.join(ROOT, mixFilePath(tutorial.id, "short"))
    : path.join(AUDIO_DIR, `mix-${variant}-15s.wav`);
  console.log(
    `=== Phase 6 delivery, ${reel} reel` +
      (tutorial ? `, bed ${tutorial.music.short}` : `, music variant ${variant}`) +
      ` ===\n`,
  );

  // 1. Audio.
  let mix45: string | null = null;
  if (!skipEncode) {
    if (tutorial) {
      // Both tutorial mixes are voice plus a ducked bed and are built by
      // scripts/voice.ts, which is where the timeline that places the lines
      // lives. There is nothing for this script to build.
      mix45 = path.join(ROOT, mixFilePath(tutorial.id, "linkedin"));
      for (const wav of [mix15, mix45]) {
        if (!fs.existsSync(wav)) {
          console.log(
            `[warn] ${rel(wav)} does not exist. That delivery will keep the render's ` +
              `own audio. Run: npx tsx scripts/voice.ts --mix --reel ${tutorial.id}`,
          );
        }
      }
    } else {
      if (!fs.existsSync(mix15)) {
        const set = reel === "training" ? " --set training" : "";
        console.log(
          `[warn] ${rel(mix15)} does not exist. The 15 second files will keep the ` +
            `render's own audio. Run: npx tsx scripts/audio.ts mix --variant ${variant}${set}`,
        );
      }
      if (!fs.existsSync(RAW_AUDIO_DIR)) {
        console.log(`[warn] ${rel(RAW_AUDIO_DIR)} missing, cannot build the 45 second mix.`);
      } else {
        mix45 = build45sMix(variant as string, remix);
      }
    }
    console.log("");
  }

  // 2. Encode.
  if (!skipEncode) {
    console.log("=== Encodes ===\n");
    const targets = only ? TARGETS.filter((t) => t.format === only) : TARGETS;
    if (targets.length === 0) console.log(`[warn] no target named "${only}"`);
    for (const target of targets) {
      encodeTarget(target, (t) => {
        const wanted = t.duration === "15s" ? mix15 : mix45;
        return wanted && fs.existsSync(wanted) ? wanted : null;
      });
      console.log("");
    }
  }

  // 3. Captions.
  console.log("=== Captions ===\n");
  const problems = validateAll(srtTargets);
  if (problems.length > 0) {
    for (const p of problems) console.log(`  BAD  ${p.target}: ${p.message}`);
  } else {
    for (const written of writeSrtFiles(OUT_DIR, srtTargets)) {
      console.log(`  wrote ${rel(written.file)} (${written.cues} cues)`);
    }
  }
  console.log("");

  // 4. Thumbnails.
  console.log("=== Thumbnails ===\n");
  const verticalInput = `out/render${names.infix}-vertical-15s.mp4`;
  const landscapeInput = `out/render${names.infix}-landscape-45s.mp4`;
  const verticalRender = path.join(ROOT, verticalInput);
  const landscapeRender = path.join(ROOT, landscapeInput);
  // Frame 75 is inside the first project's plate, which runs 54 to 78: a real
  // site on a real laptop over a real shoulder, with the project name fully
  // typed on at 72. Frame 387 is inside the second project's plate in the 45
  // second cut, which runs 366 to 390, where the name is complete at 384 and
  // the panel is not caught mid word. Both showcase reels share the beat map,
  // so both take the same two frames.
  //
  // A tutorial has no plate and no fixed beat map, so its two frames are
  // derived: the midpoint of the stretch beat, which is the beat the cut is
  // built around and the one held longest.
  let verticalFrame = 75;
  let landscapeFrame = 387;
  if (tutorial) {
    const midOfStretch = (cut: "short" | "linkedin") => {
      const entries = tutorialTimeline(tutorial, cut).entries;
      const beat = entries.find((e) => e.beat.stretch) ?? entries[1] ?? entries[0];
      return Math.round((beat.start + beat.end) / 2);
    };
    verticalFrame = midOfStretch("short");
    landscapeFrame = midOfStretch("linkedin");
  }
  if (fs.existsSync(verticalRender)) {
    await thumbnail(
      verticalRender,
      verticalFrame,
      SAFE_VERTICAL,
      path.join(OUT_DIR, `thumbnail${names.infix}-vertical.jpg`),
      scratch,
    );
  } else {
    console.log(`  [skip] thumbnail${names.infix}-vertical.jpg: ${verticalInput} does not exist yet.`);
  }
  if (fs.existsSync(landscapeRender)) {
    await thumbnail(
      landscapeRender,
      landscapeFrame,
      SAFE_LANDSCAPE,
      path.join(OUT_DIR, `thumbnail${names.infix}-landscape.jpg`),
      scratch,
    );
  } else {
    console.log(
      `  [skip] thumbnail${names.infix}-landscape.jpg: ${landscapeInput} does not exist yet.`,
    );
  }
  if (fs.existsSync(scratch)) fs.unlinkSync(scratch);
  console.log("");

  // 5. Carousel stills.
  console.log("=== Carousel stills ===\n");
  if (fs.existsSync(verticalRender)) {
    carouselStills(verticalRender, names.framesDir, carouselFramesFor(reel));
  } else {
    console.log(`  [skip] ${names.framesDir}: ${verticalInput} does not exist yet.`);
  }

  // 6. Acceptance.
  const failures = runAcceptance(reel, TARGETS, srtTargets);
  const postCopy =
    reel === "web" ? "out/post-copy.md" : `out/post-copy${names.infix}.md`;
  console.log(
    failures === 0
      ? `\nNothing published. Review ${postCopy} and post it yourself.`
      : `\n${failures} acceptance item(s) failed. Nothing published.`,
  );
}

main(process.argv.slice(2)).catch((err: unknown) => {
  console.error(err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
