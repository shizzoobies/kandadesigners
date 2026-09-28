/**
 * scripts/youtube/l1/stage.ts
 *
 * Gets YouTube L1's media where Remotion can see it, and writes the word timings
 * the cut is cued from. Task A4 in
 * Social Media Management/plans/youtube-2026-09-28/SPEC.md.
 *
 * Why a copy: A2 and A3 wrote the captures and the audio under public/youtube/l1/,
 * but this project's public directory is ./assets (remotion.config.ts, and the
 * Node API calls in scripts/qa/render.ts). So the clips, the Safari still, the
 * kept voice beats and the chosen music are copied to assets/youtube/l1/, the
 * way the social builds copy their source recordings to assets/social/. The
 * copies are gitignored; public/youtube/l1/ stays the source of truth.
 *
 * Why words.json: the cut is cued to what Amy says ("Press Enter" lands the
 * Enter key), so src/youtube/l1/timeline.ts needs each kept beat's word
 * timestamps. They live in the kept take's scribe_v2 transcript, whose file
 * name changes when a beat is retaken. This writes them, with each beat's
 * measured duration and gain to -16 LUFS, into src/youtube/l1/words.json, and
 * the timeline refuses to lay out if that file disagrees with voice.json.
 *
 * Run from D:\kap-reel after any recapture or retake (never npx):
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/stage.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const SRC = path.join(ROOT, "public", "youtube", "l1");
const DEST = path.join(ROOT, "assets", "youtube", "l1");
const WORDS = path.join(ROOT, "src", "youtube", "l1", "words.json");

/** Loudness every beat is leveled to before the mix (audio README). */
const BEAT_TARGET_LUFS = -16;

type SttWord = { text: string; start: number; end: number; type: string };
type Take = {
  take: number;
  file: string;
  sttFile: string;
  durationSeconds: number;
  analysis: { integratedLufs: number; truePeakDbtp: number };
};
type Beat = {
  beat: number;
  title: string;
  file: string;
  durationSeconds: number;
  keptTake: number;
  takes: Take[];
};

function copyIfChanged(from: string, to: string): boolean {
  const a = fs.statSync(from);
  if (fs.existsSync(to)) {
    const b = fs.statSync(to);
    if (a.size === b.size && Math.abs(a.mtimeMs - b.mtimeMs) < 2000)
      return false;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  fs.utimesSync(to, a.atime, a.mtime);
  return true;
}

function writeWords(): void {
  const voice = JSON.parse(
    fs.readFileSync(path.join(SRC, "audio", "voice.json"), "utf8"),
  ) as { beats: Beat[] };

  const beats: Record<string, unknown> = {};
  for (const b of voice.beats) {
    const kept = b.takes.find((t) => t.take === b.keptTake);
    if (!kept)
      throw new Error(
        `beat ${b.beat}: kept take ${b.keptTake} is not in voice.json`,
      );
    const stt = JSON.parse(
      fs.readFileSync(path.join(SRC, "audio", kept.sttFile), "utf8"),
    ) as { words: SttWord[] };
    const words = stt.words
      .filter((w) => w.type === "word")
      .map((w) => [
        w.text,
        Number(w.start.toFixed(2)),
        Number(w.end.toFixed(2)),
      ]);
    beats[String(b.beat)] = {
      title: b.title,
      durationSeconds: b.durationSeconds,
      integratedLufs: kept.analysis.integratedLufs,
      truePeakDbtp: kept.analysis.truePeakDbtp,
      gainDb: Number(
        (BEAT_TARGET_LUFS - kept.analysis.integratedLufs).toFixed(1),
      ),
      words,
    };
  }
  const out = {
    _note:
      "Written by scripts/youtube/l1/stage.ts from public/youtube/l1/audio/voice.json and each kept take's scribe_v2 transcript. Words are [text, start, end] in seconds from the start of the beat file. Regenerate after any retake.",
    beats,
  };
  fs.writeFileSync(WORDS, `${JSON.stringify(out, null, 1)}\n`);
  console.log(
    `words   ${path.relative(ROOT, WORDS)} (${voice.beats.length} beats)`,
  );
}

function copyMedia(): void {
  const jobs: [string, string][] = [];
  const caps = path.join(SRC, "captures");
  for (const f of fs.readdirSync(caps)) {
    if (f.endsWith(".mp4") || f === "safari-advanced.png") {
      jobs.push([path.join(caps, f), path.join(DEST, "captures", f)]);
    }
  }
  const voiceDir = path.join(SRC, "audio", "voice");
  for (const f of fs.readdirSync(voiceDir)) {
    if (/^beat-\d\d\.mp3$/.test(f))
      jobs.push([path.join(voiceDir, f), path.join(DEST, "voice", f)]);
  }
  jobs.push([
    path.join(SRC, "audio", "music", "music-yt-l1.mp3"),
    path.join(DEST, "music", "music-yt-l1.mp3"),
  ]);

  let copied = 0;
  for (const [from, to] of jobs) if (copyIfChanged(from, to)) copied += 1;
  console.log(
    `media   ${path.relative(ROOT, DEST)}: ${copied} copied, ${jobs.length - copied} unchanged`,
  );
}

writeWords();
copyMedia();
