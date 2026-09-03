/**
 * Sidecar captions, Section 10.
 *
 * Writes out/kap-reel-{format}-{duration}.srt for all five deliveries, frame
 * accurate at 30fps, from the two tables below.
 *
 * The tables are the only thing in this file anyone should need to edit. One
 * row per on-screen text line, with the absolute frames that line appears and
 * disappears and a comment naming the scene the frames were read from. A
 * timing change in a scene is a one line edit here.
 *
 * Rows overlap on purpose, because the picture overlaps: the three "how we
 * work" lines stack up and hold together, and a project name sits over a
 * context line and then over a claim. An SRT with overlapping cues is not
 * valid, so buildCues() slices the timeline at every row boundary and emits one
 * cue per distinct set of lines that is on screen. That keeps the file legal
 * and keeps the table one row per line.
 *
 * The 15 second table was rewritten on 2026-09-03 for the re-paced master. The
 * 45 second table is unchanged: that cut was not re-paced.
 *
 *   npx tsx scripts/srt.ts            write all five
 *   npx tsx scripts/srt.ts --check    validate without writing
 *   npx tsx scripts/srt.ts --print vertical-15s
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const OUT_DIR = path.join(ROOT, "out");

export const FPS = 30;

/** Section 7's minimum hold, applied to cues as well as to the picture. */
export const MIN_CUE_FRAMES = 24;

// ---------------------------------------------------------------------------
// Timing tables
// ---------------------------------------------------------------------------

export type CueRow = {
  /** The line, exactly as it is burned into the picture. */
  text: string;
  /** Absolute frame the line arrives on, inclusive. */
  start: number;
  /** Absolute frame the line is gone on, exclusive. */
  end: number;
  /** Scene file the two frame numbers were read from. */
  source: string;
  /**
   * The beat itself is shorter than MIN_CUE_FRAMES, so a short cue here is the
   * picture, not a caption fault. Only the surfaces tour cuts qualify: 18
   * frames in the 15 second cut, 20 in the 45, both a deliberate Section 7
   * exception recorded in src/lib/timing.ts.
   */
  shortHold?: boolean;
};

/**
 * The 15 second master. Covers vertical, feed and square: Section 8 renders
 * those three from the same beat map, so the timing is identical and the same
 * table writes all three files.
 *
 * Frames read from src/lib/timing.ts (SHORT_BEATS) plus the per-scene offsets.
 */
export const CUE_ROWS_15S: CueRow[] = [
  // src/scenes/Hook.tsx. HOOK 0 to 54. Both halves slam on frame 0 and hold.
  { text: "Custom built.", start: 0, end: 54, source: "Hook.tsx" },
  { text: "Not a template.", start: 0, end: 54, source: "Hook.tsx" },

  // src/scenes/ProjectShowcase.tsx. PROJECT_1 54 to 194.
  // Name types on at beat+2, claim cuts in at beat+CLAIM_IN (36).
  { text: "Fore Motion Golf", start: 56, end: 194, source: "ProjectShowcase.tsx" },
  { text: "AI caddie built in", start: 90, end: 194, source: "ProjectShowcase.tsx" },

  // PROJECT_2 194 to 334.
  { text: "Project Makeover", start: 196, end: 334, source: "ProjectShowcase.tsx" },
  { text: "Accessibility score 100", start: 230, end: 334, source: "ProjectShowcase.tsx" },

  // src/scenes/SurfacesTour.tsx. SURFACES_TOUR 334 to 388, SURFACES_TOUR_CUTS
  // three cuts of 18. Each word is held for the whole cut. Southern Legacy
  // Contractors left the featured list in this cut and keeps its site here.
  { text: "Booking", start: 334, end: 352, source: "SurfacesTour.tsx", shortHold: true },
  { text: "Yours to edit", start: 352, end: 370, source: "SurfacesTour.tsx", shortHold: true },
  { text: "No page builder", start: 370, end: 388, source: "SurfacesTour.tsx", shortHold: true },

  // src/scenes/CallToAction.tsx. CALL_TO_ACTION 388 to 450.
  // URL_IN 14 and PHONE_IN 22, relative to the beat. The lockup is a mark, not
  // a line, so it gets no cue.
  { text: "ka-performancefl.com", start: 402, end: 450, source: "CallToAction.tsx" },
  { text: "904-210-1071", start: 410, end: 450, source: "CallToAction.tsx" },
];

/**
 * The 45 second LinkedIn cut. Covers linkedin (1080x1350) and landscape
 * (1920x1080): same beat map, same copy, so one table writes both files.
 *
 * Frames read from src/lib/timing.ts (LINKEDIN_BEATS,
 * LINKEDIN_HOW_WE_WORK_LINES, LINKEDIN_PROJECT_COPY,
 * LINKEDIN_SURFACES_TOUR_CUTS, LINKEDIN_ACCESSIBILITY_LINES) plus the
 * per-scene offsets.
 */
export const CUE_ROWS_45S: CueRow[] = [
  // src/scenes/Hook.tsx. LINKEDIN_HOOK 0 to 36.
  { text: "Custom built.", start: 0, end: 36, source: "Hook.tsx" },
  { text: "Not a template.", start: 0, end: 36, source: "Hook.tsx" },

  // src/scenes/HowWeWork.tsx. LINKEDIN_HOW_WE_WORK 36 to 156, lines at
  // beat+0, +30, +60. All three hold to the cut.
  { text: "A real person.", start: 36, end: 156, source: "HowWeWork.tsx" },
  { text: "A direct number.", start: 66, end: 156, source: "HowWeWork.tsx" },
  { text: "No ticket queue.", start: 96, end: 156, source: "HowWeWork.tsx" },

  // src/scenes/ProjectShowcase.tsx. LINKEDIN_PROJECT_1 156 to 366.
  // Name at beat+2, context line beat+40 to beat+120, claim beat+126 to cut.
  { text: "Fore Motion Golf", start: 158, end: 366, source: "ProjectShowcase.tsx" },
  {
    text: "Needed a waitlist before the doors opened.",
    start: 196,
    end: 276,
    source: "ProjectShowcase.tsx",
  },
  { text: "AI caddie built in", start: 282, end: 366, source: "ProjectShowcase.tsx" },

  // LINKEDIN_PROJECT_2 366 to 576.
  { text: "Project Makeover", start: 368, end: 576, source: "ProjectShowcase.tsx" },
  {
    text: "Needed donations and a gallery that grows.",
    start: 406,
    end: 486,
    source: "ProjectShowcase.tsx",
  },
  { text: "Accessibility score 100", start: 492, end: 576, source: "ProjectShowcase.tsx" },

  // LINKEDIN_PROJECT_3 576 to 786.
  { text: "Southern Legacy Contractors", start: 578, end: 786, source: "ProjectShowcase.tsx" },
  {
    text: "Needed quotes from a phone on a job site.",
    start: 616,
    end: 696,
    source: "ProjectShowcase.tsx",
  },
  { text: "No page builder.", start: 702, end: 786, source: "ProjectShowcase.tsx" },

  // LINKEDIN_PROJECT_4 786 to 996. The fourth project exists only in this cut.
  { text: "MBS Medicine", start: 788, end: 996, source: "ProjectShowcase.tsx" },
  {
    text: "Needed same-week booking and a patient portal.",
    start: 826,
    end: 906,
    source: "ProjectShowcase.tsx",
  },
  { text: "Booking built in", start: 912, end: 996, source: "ProjectShowcase.tsx" },

  // src/scenes/SurfacesTour.tsx. LINKEDIN_SURFACES_TOUR 996 to 1076,
  // LINKEDIN_SURFACES_TOUR_CUTS four cuts of 20. MBS Medicine has its own beat
  // in this cut, so Synovial takes the fourth slot.
  { text: "Yours to edit", start: 996, end: 1016, source: "SurfacesTour.tsx", shortHold: true },
  { text: "Memberships", start: 1016, end: 1036, source: "SurfacesTour.tsx", shortHold: true },
  { text: "Booking a call", start: 1036, end: 1056, source: "SurfacesTour.tsx", shortHold: true },
  { text: "Discovery calls", start: 1056, end: 1076, source: "SurfacesTour.tsx", shortHold: true },

  // src/scenes/AccessibilityBeat.tsx. LINKEDIN_ACCESSIBILITY 1076 to 1226,
  // lines at beat+0, +45, +90. The middle line's count is derived from
  // config/metrics.json at render time, not typed; five sites currently
  // measure 100. Re-measure below five and this row has to change with it.
  { text: "Built to WCAG 2.2 AA.", start: 1076, end: 1226, source: "AccessibilityBeat.tsx" },
  {
    text: "Five of these sites score 100 on accessibility.",
    start: 1121,
    end: 1226,
    source: "AccessibilityBeat.tsx",
  },
  { text: "Measured, not promised.", start: 1166, end: 1226, source: "AccessibilityBeat.tsx" },

  // src/scenes/CallToAction.tsx. LINKEDIN_CALL_TO_ACTION 1226 to 1350.
  // The closing line and the url both arrive at URL_IN 14, the phone at
  // PHONE_IN 22.
  { text: "Taking new projects.", start: 1240, end: 1350, source: "CallToAction.tsx" },
  { text: "ka-performancefl.com", start: 1240, end: 1350, source: "CallToAction.tsx" },
  { text: "904-210-1071", start: 1248, end: 1350, source: "CallToAction.tsx" },
];

// ---------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------

export type SrtTarget = {
  /** {format} in the Section 10 filename. */
  format: string;
  /** {duration} in the Section 10 filename. */
  duration: string;
  rows: CueRow[];
  /** Frames the matching MP4 runs, so a cue can never outlive the picture. */
  totalFrames: number;
};

export const SRT_TARGETS: SrtTarget[] = [
  { format: "vertical", duration: "15s", rows: CUE_ROWS_15S, totalFrames: 450 },
  { format: "feed", duration: "15s", rows: CUE_ROWS_15S, totalFrames: 450 },
  { format: "square", duration: "15s", rows: CUE_ROWS_15S, totalFrames: 450 },
  { format: "linkedin", duration: "45s", rows: CUE_ROWS_45S, totalFrames: 1350 },
  { format: "landscape", duration: "45s", rows: CUE_ROWS_45S, totalFrames: 1350 },
];

export function srtFileName(target: SrtTarget): string {
  return `kap-reel-${target.format}-${target.duration}.srt`;
}

// ---------------------------------------------------------------------------
// Cues
// ---------------------------------------------------------------------------

export type Cue = {
  start: number;
  end: number;
  lines: string[];
  /** Indices into the source table, so a validator can report the row. */
  rowIndexes: number[];
  shortHold: boolean;
};

function sameSet(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function isSubset(inner: number[], outer: number[]): boolean {
  return inner.every((v) => outer.includes(v));
}

/**
 * Slices the timeline at every row boundary, keeps the slices where something
 * is on screen, then tidies the result.
 *
 * Two tidying passes:
 *
 * - Coalesce. Adjacent slices carrying the same set of lines become one cue.
 *
 * - Absorb. A slice under MIN_CUE_FRAMES that is only a subset of a neighbour
 *   is a flicker, not a cue: the six frame gap where a context line has been
 *   cut and the claim has not arrived yet, or the eight frames where the CTA
 *   url is up and the phone is not. It gets folded into that neighbour. The
 *   previous neighbour wins where both qualify, because a caption trailing the
 *   picture by a fifth of a second reads as a hold, while a caption leading it
 *   announces a line before the viewer can see it.
 */
export function buildCues(rows: CueRow[]): Cue[] {
  const bounds = [...new Set(rows.flatMap((r) => [r.start, r.end]))].sort(
    (a, b) => a - b,
  );

  type Slice = { start: number; end: number; rowIndexes: number[] };
  const slices: Slice[] = [];
  for (let i = 0; i < bounds.length - 1; i += 1) {
    const start = bounds[i];
    const end = bounds[i + 1];
    const rowIndexes = rows
      .map((r, index) => ({ r, index }))
      .filter(({ r }) => r.start <= start && r.end >= end)
      .map(({ index }) => index);
    if (rowIndexes.length > 0) slices.push({ start, end, rowIndexes });
  }

  // Coalesce.
  const coalesced: Slice[] = [];
  for (const slice of slices) {
    const last = coalesced[coalesced.length - 1];
    if (last && last.end === slice.start && sameSet(last.rowIndexes, slice.rowIndexes)) {
      last.end = slice.end;
    } else {
      coalesced.push({ ...slice });
    }
  }

  // Absorb.
  const isShort = (s: Slice) => s.rowIndexes.every((i) => rows[i].shortHold);
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < coalesced.length; i += 1) {
      const s = coalesced[i];
      if (s.end - s.start >= MIN_CUE_FRAMES || isShort(s)) continue;
      const prev = coalesced[i - 1];
      const next = coalesced[i + 1];
      if (prev && prev.end === s.start && isSubset(s.rowIndexes, prev.rowIndexes)) {
        prev.end = s.end;
        coalesced.splice(i, 1);
        changed = true;
        break;
      }
      if (next && next.start === s.end && isSubset(s.rowIndexes, next.rowIndexes)) {
        next.start = s.start;
        coalesced.splice(i, 1);
        changed = true;
        break;
      }
    }
  }

  return coalesced.map((s) => ({
    start: s.start,
    end: s.end,
    lines: s.rowIndexes.map((i) => rows[i].text),
    rowIndexes: s.rowIndexes,
    shortHold: isShort(s),
  }));
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** Frame to SRT timestamp. Frame boundaries at 30fps, rounded to the millisecond. */
export function frameToTimestamp(frame: number): string {
  const totalMs = Math.round((frame / FPS) * 1000);
  const ms = totalMs % 1000;
  const totalSeconds = (totalMs - ms) / 1000;
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

export function renderSrt(rows: CueRow[]): string {
  const cues = buildCues(rows);
  const blocks = cues.map((cue, i) =>
    [
      String(i + 1),
      `${frameToTimestamp(cue.start)} --> ${frameToTimestamp(cue.end)}`,
      ...cue.lines,
      "",
    ].join("\n"),
  );
  return blocks.join("\n");
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Built from a code point rather than typed, so this file does not itself trip
 * the Section 14 item 6 grep it is here to serve.
 */
const EM_DASH = String.fromCharCode(0x2014);

export type Problem = { target: string; message: string };

export function validateTarget(target: SrtTarget): Problem[] {
  const name = srtFileName(target);
  const problems: Problem[] = [];
  const say = (message: string) => problems.push({ target: name, message });

  for (const [i, row] of target.rows.entries()) {
    if (row.start >= row.end) {
      say(`row ${i} "${row.text}" has start ${row.start} at or past end ${row.end}`);
    }
    if (row.end > target.totalFrames) {
      say(`row ${i} "${row.text}" ends at ${row.end}, past the ${target.totalFrames} frame picture`);
    }
    if (row.text.includes(EM_DASH)) {
      say(`row ${i} "${row.text}" contains an em dash`);
    }
    if (row.text.trim() === "") {
      say(`row ${i} is empty`);
    }
  }

  const cues = buildCues(target.rows);
  for (const [i, cue] of cues.entries()) {
    const prev = cues[i - 1];
    if (prev && cue.start < prev.end) {
      say(
        `cue ${i + 1} starts at frame ${cue.start}, inside cue ${i} which runs to ${prev.end}`,
      );
    }
    const length = cue.end - cue.start;
    if (length < MIN_CUE_FRAMES && !cue.shortHold) {
      say(
        `cue ${i + 1} (${cue.lines.join(" / ")}) holds ${length} frames, under the ${MIN_CUE_FRAMES} frame minimum`,
      );
    }
    if (cue.lines.some((l) => l.includes(EM_DASH))) {
      say(`cue ${i + 1} contains an em dash`);
    }
  }

  return problems;
}

export function validateAll(): Problem[] {
  return SRT_TARGETS.flatMap(validateTarget);
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

export type WrittenSrt = { file: string; cues: number; target: SrtTarget };

export function writeSrtFiles(outDir: string = OUT_DIR): WrittenSrt[] {
  fs.mkdirSync(outDir, { recursive: true });
  return SRT_TARGETS.map((target) => {
    const file = path.join(outDir, srtFileName(target));
    fs.writeFileSync(file, renderSrt(target.rows), "utf8");
    return { file, cues: buildCues(target.rows).length, target };
  });
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main(argv: string[]): void {
  const printIndex = argv.indexOf("--print");
  if (printIndex !== -1) {
    const key = argv[printIndex + 1];
    const target = SRT_TARGETS.find((t) => `${t.format}-${t.duration}` === key);
    if (!target) {
      console.error(
        `srt: unknown target "${key}". Try one of ` +
          SRT_TARGETS.map((t) => `${t.format}-${t.duration}`).join(", "),
      );
      process.exit(2);
    }
    process.stdout.write(renderSrt(target.rows));
    return;
  }

  const problems = validateAll();
  for (const p of problems) console.error(`  ${p.target}: ${p.message}`);

  if (argv.includes("--check")) {
    if (problems.length === 0) console.log("srt: all five tables validate.");
    process.exit(problems.length === 0 ? 0 : 1);
  }

  if (problems.length > 0) {
    console.error("srt: refusing to write, fix the table first.");
    process.exit(1);
  }

  for (const written of writeSrtFiles()) {
    console.log(
      `srt: wrote ${path.relative(ROOT, written.file).replace(/\\/g, "/")} ` +
        `(${written.cues} cues, ${written.target.rows.length} lines)`,
    );
  }
}

/**
 * True when this file is the entry point rather than an import.
 *
 * Compared through realpath because the project is normally run from the
 * D:\kap-reel junction (see README): import.meta.url resolves the junction to
 * the real path behind it and process.argv[1] does not, so the two strings do
 * not match even when they are the same file.
 */
function isEntryPoint(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  const real = (p: string) => {
    try {
      return fs.realpathSync(p);
    } catch {
      return path.resolve(p);
    }
  };
  return real(fileURLToPath(import.meta.url)) === real(entry);
}

if (isEntryPoint()) {
  main(process.argv.slice(2));
}
