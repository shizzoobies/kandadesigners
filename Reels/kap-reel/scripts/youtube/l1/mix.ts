/**
 * scripts/youtube/l1/mix.ts
 *
 * The finished audio for YouTube L1: the thirteen voice beats placed where the
 * cut lays them out, over the music-yt-l1 bed, mastered to -14 LUFS integrated
 * and under -1 dBTP. Writes assets/youtube/l1/mix.wav, which the composition
 * plays (src/youtube/l1/L1.tsx), and logs the numbers to
 * public/youtube/l1/audio/mix.json.
 *
 * The graph, in the order the audio README asks for:
 *   voice  each beat at its own gain to -16 LUFS (words.json, from voice.json),
 *          delayed to its beat's start in the timeline, summed, then a gentle
 *          compressor, because Amy's peaks sit 19 to 21 dB over her loudness
 *   music  the bed at a steady level about 12 LU under the voice (about -26
 *          LUFS in the finished program), lifted over 1 s to about -18 LUFS
 *          once the end screen's line is said, faded over the last 2.5 s
 *   master the solved limiter ceiling and a two-pass loudnorm from
 *          scripts/audio.ts, then the corrective pass, the same chain every
 *          earlier mix in this project uses
 *
 * The timeline is imported from src/youtube/l1/timeline.ts, so the mix and the
 * picture cannot disagree about where a beat starts. Run stage.ts first.
 *
 * Run from D:\kap-reel (never npx):
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/mix.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AFORMAT,
  LOUDNORM_TARGET,
  TARGET_LUFS,
  correctLoudness,
  ffmpeg,
  headroomCeilingDb,
  parseLoudnorm,
  verifyLoudness,
} from "../../audio";
import {
  L1_LAYOUT,
  L1_TOTAL_FRAMES,
  slotOf,
} from "../../../src/youtube/l1/timeline";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const STAGED = path.join(ROOT, "assets", "youtube", "l1");
const MUSIC = path.join(STAGED, "music", "music-yt-l1.mp3");
const OUT_WAV = path.join(STAGED, "mix.wav");
const LOG = path.join(ROOT, "public", "youtube", "l1", "audio", "mix.json");

const FPS = 30;
const TOTAL_S = L1_TOTAL_FRAMES / FPS;

/** Music in the finished program: under the voice, and on the end screen. */
const MUSIC_UNDER_VOICE_LUFS = -26;
const MUSIC_END_SCREEN_LUFS = -18;
const LIFT_S = 1.0;
const FADE_OUT_S = 2.5;

/** Voice bus compressor, gentle (about 3 dB off the leveled beats); the limiter does the rest of the peak control. */
const VOICE_COMP =
  "acompressor=threshold=0.2:ratio=2.5:attack=5:release=150:knee=4";

const dbToLin = (db: number) => 10 ** (db / 20);

function voiceInputs(): { args: string[]; parts: string[]; labels: string[] } {
  const args: string[] = [];
  const parts: string[] = [];
  const labels: string[] = [];
  L1_LAYOUT.slots.forEach((s, i) => {
    const file = path.join(
      STAGED,
      "voice",
      `beat-${String(s.beat).padStart(2, "0")}.mp3`,
    );
    if (!fs.existsSync(file))
      throw new Error(`${file} is missing: run stage.ts`);
    args.push("-i", file);
    const delayMs = Math.round(((s.from + s.voiceFrom) / FPS) * 1000);
    // Input 0 is the music, so beat i is input i + 1.
    parts.push(
      `[${i + 1}:a]${AFORMAT},volume=${s.gainDb.toFixed(2)}dB,adelay=${delayMs}:all=1[v${i}]`,
    );
    labels.push(`[v${i}]`);
  });
  return { args, parts, labels };
}

/** The bed's gain curve: steady, then lifted for the end screen. */
function bedFilter(underDb: number, endDb: number): string {
  const end = slotOf(13);
  const liftAt = (end.from + end.voiceFrom) / FPS + end.seconds + 0.3;
  const a = dbToLin(underDb).toFixed(5);
  const b = dbToLin(endDb).toFixed(5);
  const expr = `if(lt(t,${liftAt.toFixed(3)}),${a},if(lt(t,${(liftAt + LIFT_S).toFixed(3)}),${a}+(${b}-${a})*(t-${liftAt.toFixed(3)})/${LIFT_S},${b}))`;
  return (
    `[0:a]${AFORMAT},atrim=0:${TOTAL_S.toFixed(3)},asetpts=N/SR/TB,` +
    `volume='${expr}':eval=frame,afade=t=out:st=${(TOTAL_S - FADE_OUT_S).toFixed(3)}:d=${FADE_OUT_S}[bed]`
  );
}

function graph(
  underDb: number,
  endDb: number,
  ceilingDb: number,
  withMusic = true,
): string {
  const v = voiceInputs();
  const parts = [
    ...v.parts,
    `${v.labels.join("")}amix=inputs=${v.labels.length}:duration=longest:normalize=0,apad=whole_dur=${TOTAL_S.toFixed(3)},atrim=0:${TOTAL_S.toFixed(3)},${VOICE_COMP}[voice]`,
  ];
  if (withMusic) {
    parts.push(bedFilter(underDb, endDb));
    parts.push(`[voice][bed]amix=inputs=2:duration=first:normalize=0[premix]`);
  } else {
    parts.push(`[voice]anull[premix]`);
  }
  const limit = Math.min(1, dbToLin(ceilingDb)).toFixed(6);
  parts.push(
    `[premix]alimiter=limit=${limit}:attack=5:release=50:level=disabled[mixed]`,
  );
  return parts.join(";");
}

function measure(filter: string, inputs: string[]): { i: number; tp: number } {
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
    throw new Error(`measure failed:\n${res.stderr.slice(-3000)}`);
  const m = parseLoudnorm(res.stderr);
  return { i: Number(m.input_i), tp: Number(m.input_tp) };
}

/** Integrated loudness of one stretch of a finished file. */
function segmentLufs(file: string, from: number, to: number): number {
  const res = ffmpeg([
    "-i",
    file,
    "-af",
    `atrim=${from}:${to},loudnorm=${LOUDNORM_TARGET}:print_format=json`,
    "-f",
    "null",
    "-",
  ]);
  if (res.code !== 0)
    throw new Error(`segment measure failed:\n${res.stderr.slice(-3000)}`);
  return Number(parseLoudnorm(res.stderr).input_i);
}

function main(): void {
  if (!fs.existsSync(MUSIC))
    throw new Error(`${MUSIC} is missing: run stage.ts`);
  const inputs = ["-i", MUSIC, ...voiceInputs().args];
  const musicSrc = verifyLoudness(MUSIC).integrated;
  console.log(`music source ${musicSrc} LUFS; program ${TOTAL_S.toFixed(1)} s`);

  // The voice alone sets the master gain; the bed is set against that gain so
  // it lands where it should in the finished program, not in the premix.
  const voiceOnly = measure(graph(0, 0, 0, false), inputs);
  const masterGain = TARGET_LUFS - voiceOnly.i;
  const underDb = MUSIC_UNDER_VOICE_LUFS - musicSrc - masterGain;
  const endDb = Math.min(6, MUSIC_END_SCREEN_LUFS - musicSrc - masterGain);
  console.log(
    `voice bus ${voiceOnly.i} LUFS, ${voiceOnly.tp} dBTP; master gain ${masterGain.toFixed(2)} dB; ` +
      `bed ${underDb.toFixed(2)} dB under voice, ${endDb.toFixed(2)} dB on the end screen`,
  );

  // Pass 1: the limiter ceiling loudnorm needs, measured over the full mix.
  const { ceilingDb, measurement } = headroomCeilingDb(inputs, (c) =>
    graph(underDb, endDb, c),
  );
  console.log(
    `limiter ceiling ${ceilingDb} dBFS; pass 1 I ${measurement.input_i} LUFS, TP ${measurement.input_tp} dBTP`,
  );

  // Pass 2.
  fs.mkdirSync(STAGED, { recursive: true });
  const filter =
    `${graph(underDb, endDb, ceilingDb)};[mixed]loudnorm=${LOUDNORM_TARGET}:measured_I=${measurement.input_i}:` +
    `measured_TP=${measurement.input_tp}:measured_LRA=${measurement.input_lra}:` +
    `measured_thresh=${measurement.input_thresh}:offset=${measurement.target_offset}:` +
    `linear=true:print_format=json[norm];[norm]${AFORMAT}[out]`;
  const pass2 = ffmpeg([
    ...inputs,
    "-filter_complex",
    filter,
    "-map",
    "[out]",
    "-c:a",
    "pcm_s16le",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-y",
    OUT_WAV,
  ]);
  if (pass2.code !== 0)
    throw new Error(`pass 2 failed:\n${pass2.stderr.slice(-3000)}`);
  const final = correctLoudness(OUT_WAV, verifyLoudness(OUT_WAV));
  console.log(
    `final ${final.integrated} LUFS, ${final.truePeak} dBTP, LRA ${final.lra}`,
  );

  // Where the bed sits in the finished program. Under the voice it cannot be
  // measured off the mix, so it is the bed's own loudness over that stretch
  // plus every gain it went through (the master gain actually applied is the
  // finished loudness less the limited premix's). On the end screen, after its
  // line, the bed is alone and is measured off the file.
  const end = slotOf(13);
  const endScreenAt = end.from / FPS;
  const appliedGain = final.integrated - Number(measurement.input_i);
  const underLufs = Number(
    (segmentLufs(MUSIC, 0, endScreenAt) + underDb + appliedGain).toFixed(2),
  );
  const endFrom =
    (end.from + end.voiceFrom) / FPS + end.seconds + 0.3 + LIFT_S + 0.5;
  const endLufs = segmentLufs(OUT_WAV, endFrom, TOTAL_S - FADE_OUT_S);
  console.log(
    `music: ${underLufs} LUFS under the voice (bed plus gains), ${endLufs} LUFS measured on the end screen`,
  );

  const record = {
    _note:
      "Written by scripts/youtube/l1/mix.ts. The mix itself is assets/youtube/l1/mix.wav (staged, gitignored); rerun the script to rebuild it.",
    builtAt: new Date().toISOString(),
    programSeconds: Number(TOTAL_S.toFixed(3)),
    musicSourceLufs: musicSrc,
    voiceBusLufs: voiceOnly.i,
    masterGainDb: Number(masterGain.toFixed(2)),
    bedGainUnderVoiceDb: Number(underDb.toFixed(2)),
    bedGainEndScreenDb: Number(endDb.toFixed(2)),
    musicUnderVoiceTargetLufs: MUSIC_UNDER_VOICE_LUFS,
    musicEndScreenTargetLufs: MUSIC_END_SCREEN_LUFS,
    limiterCeilingDb: ceilingDb,
    final: {
      integratedLufs: final.integrated,
      truePeakDbtp: final.truePeak,
      lra: final.lra,
    },
    musicUnderVoiceLufs: underLufs,
    measuredEndScreenLufs: endLufs,
    beats: L1_LAYOUT.slots.map((s) => ({
      beat: s.beat,
      startSeconds: Number(((s.from + s.voiceFrom) / FPS).toFixed(3)),
      gainDb: s.gainDb,
    })),
  };
  fs.writeFileSync(LOG, `${JSON.stringify(record, null, 2)}\n`);
  console.log(
    `wrote ${path.relative(ROOT, OUT_WAV)} and ${path.relative(ROOT, LOG)}`,
  );
}

main();
