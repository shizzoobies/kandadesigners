/**
 * scripts/youtube/l1/srt.ts
 *
 * media/video.srt for YouTube L1, uploaded in Studio after publish (the video
 * has no burned-in captions).
 *
 * Text: the exact voice script (To Be Released/2026-10-02-4/source/script.md),
 * written for the screen: "W-C-A-G two point two" becomes "WCAG 2.2",
 * "W-C-A-G" becomes "WCAG", and "K and A" becomes "K&A".
 *
 * Timing: each beat's kept take is transcribed word by word (words.json, from
 * stage.ts), and the beat sits where the cut lays it out (timeline.ts). The
 * script and the transcript are matched letter for letter (letters and digits
 * only, so "home page" meets "homepage" and "pop-ups" meets "popups"); a
 * beat whose letters differ from its transcript stops the script, because the
 * captions would then be timed to words that were not said.
 *
 * Cues are whole sentences where they fit: two lines of 42 characters at most.
 * Longer sentences split at a comma, or else at the word nearest the middle.
 *
 * Run from D:\kap-reel (never npx):
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/srt.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { L1_LAYOUT } from "../../../src/youtube/l1/timeline";
import wordsJson from "../../../src/youtube/l1/words.json";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = fs.realpathSync(path.resolve(HERE, "..", "..", ".."));
const FOLDER = path.resolve(
  ROOT,
  "..",
  "..",
  "Social Media Management",
  "To Be Released",
  "2026-10-02-4",
);
const SCRIPT = path.join(FOLDER, "source", "script.md");
const OUT = path.join(FOLDER, "media", "video.srt");

const FPS = 30;
const LINE = 42;
/** A cue stays up at least this long, time allowing. */
const MIN_S = 1.2;
/** Space left between one cue's end and the next one's start. */
const GAP_S = 0.05;

type Word = [string, number, number];
const WORDS = (
  wordsJson as unknown as { beats: Record<string, { words: Word[] }> }
).beats;

function forScreen(text: string): string {
  return text
    .replace(/W-C-A-G two point two/g, "WCAG 2.2")
    .replace(/W-C-A-G/g, "WCAG")
    .replace(/K and A/g, "K&A");
}

const letters = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function readBeats(): Map<number, string> {
  const beats = new Map<number, string>();
  let current: number | null = null;
  const parts: string[] = [];
  const flush = () => {
    if (current !== null) beats.set(current, forScreen(parts.join(" ")));
    parts.length = 0;
  };
  for (const raw of fs.readFileSync(SCRIPT, "utf8").split(/\r?\n/)) {
    const head = raw.match(/^\*\*\[(\d+)\]/);
    if (head) {
      flush();
      current = Number(head[1]);
      continue;
    }
    if (current !== null && raw.trim()) parts.push(raw.trim());
  }
  flush();
  return beats;
}

/** Words a first line should not end on. */
const WEAK = new Set([
  "a",
  "an",
  "the",
  "to",
  "of",
  "and",
  "or",
  "in",
  "on",
  "with",
  "your",
  "you",
  "is",
]);

/**
 * Where a two line cue breaks, or -1 if the text cannot fit in two lines. The
 * lines are kept near even, a break after a comma is preferred, and a first
 * line never ends on a small word when there is another way.
 */
function breakAt(text: string): number {
  let best = -1;
  let bestScore = Infinity;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== " ") continue;
    const a = i;
    const b = text.length - i - 1;
    if (a > LINE || b > LINE) continue;
    const before = text.slice(0, i);
    const lastWord = before.split(" ").pop()?.toLowerCase() ?? "";
    const score =
      Math.abs(a - b) -
      (before.endsWith(",") ? 16 : 0) +
      (WEAK.has(lastWord) ? 24 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

const fits = (text: string) => text.length <= LINE || breakAt(text) >= 0;

/**
 * Splits text that does not fit one cue: at the comma nearest the middle, else
 * at the space nearest the middle that does not leave a small word hanging
 * ("that", "the"). Each half is split again if it still does not fit.
 */
function splitLong(text: string): string[] {
  if (fits(text)) return [text];
  const mid = text.length / 2;
  const nearest = (re: RegExp) => {
    let best = -1;
    let bestScore = Infinity;
    for (const m of text.matchAll(re)) {
      const i = (m.index ?? 0) + m[0].length;
      if (i < 12 || text.length - i < 12) continue;
      const lastWord =
        text.slice(0, i).trim().split(" ").pop()?.toLowerCase() ?? "";
      const score =
        Math.abs(i - mid) +
        (WEAK.has(lastWord) || lastWord === "that" ? 30 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return best;
  };
  let cut = nearest(/, /g);
  if (cut < 0) cut = nearest(/ /g);
  if (cut < 0) throw new Error(`Cannot split into cues: "${text}"`);
  return [
    ...splitLong(text.slice(0, cut).trim()),
    ...splitLong(text.slice(cut).trim()),
  ];
}

/** One or two lines of at most LINE characters, broken at the space nearest the middle. */
function lines(text: string): string {
  if (text.length <= LINE) return text;
  const best = breakAt(text);
  if (best < 0)
    throw new Error(`Cannot fit in two lines of ${LINE}: "${text}"`);
  return `${text.slice(0, best)}\n${text.slice(best + 1)}`;
}

function cuesFor(text: string): string[] {
  // A sentence ends at . ? or ! before a space, so "WCAG 2.2." stays whole.
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const merged: string[] = [];
  for (const s of sentences) {
    const prev = merged[merged.length - 1];
    // A one-word sentence ("Two.") leads into the next, and short sentences
    // in a row ("Check one. The skip link.") share a line.
    const short =
      prev !== undefined &&
      prev.length < 30 &&
      s.length > 8 &&
      s.length < 36 &&
      prev.length + 1 + s.length <= LINE;
    if (prev !== undefined && (prev.length <= 8 || short)) {
      merged[merged.length - 1] = `${prev} ${s}`;
    } else {
      merged.push(s);
    }
  }
  return merged.flatMap(splitLong);
}

const stamp = (s: number) => {
  const ms = Math.max(0, Math.round(s * 1000));
  const hh = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const mm = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${hh}:${mm}:${ss},${String(ms % 1000).padStart(3, "0")}`;
};

function main(): void {
  const beats = readBeats();
  const cues: { start: number; end: number; text: string }[] = [];

  for (const slot of L1_LAYOUT.slots) {
    const text = beats.get(slot.beat);
    const words = WORDS[String(slot.beat)]?.words;
    if (!text || !words)
      throw new Error(`Beat ${slot.beat}: no script text or no transcript`);
    const offset = (slot.from + slot.voiceFrom) / FPS;

    // Letter index -> the transcript word it belongs to.
    const owner: number[] = [];
    words.forEach((w, i) => {
      for (let k = 0; k < letters(w[0]).length; k += 1) owner.push(i);
    });
    if (letters(text) !== words.map((w) => letters(w[0])).join("")) {
      throw new Error(
        `Beat ${slot.beat}: the script's letters do not match the kept take's transcript`,
      );
    }

    let pos = 0;
    for (const cue of cuesFor(text)) {
      const n = letters(cue).length;
      const first = words[owner[pos]];
      const last = words[owner[pos + n - 1]];
      pos += n;
      cues.push({
        start: offset + first[1],
        end: offset + last[2],
        text: lines(cue),
      });
    }
  }

  // Hold each cue until the next, up to MIN_S, never overlapping.
  for (let i = 0; i < cues.length; i += 1) {
    const next = cues[i + 1]?.start ?? Infinity;
    cues[i].end = Math.min(
      Math.max(cues[i].end, cues[i].start + MIN_S),
      next - GAP_S,
    );
  }

  for (const c of cues) {
    if (/[—–]/.test(c.text)) throw new Error(`Dash in cue: ${c.text}`);
    if (/W-C-A-G|K and A/.test(c.text))
      throw new Error(`Voice spelling in cue: ${c.text}`);
  }

  const body = cues
    .map(
      (c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`,
    )
    .join("\n");
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, body);
  console.log(
    `wrote ${OUT}: ${cues.length} cues, last ends ${stamp(cues[cues.length - 1].end)}`,
  );
}

main();
