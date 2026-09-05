// The shot list: every frame the harness renders and what it expects to find
// in it.
//
// Derived from the beat maps in src/lib/timing.ts and the content configs in
// src/reels, so a re-timed cut or a re-cast project beat changes the frames
// that get tested without anyone editing this file. The only numbers restated
// here are the two that live as private constants inside scene components, and
// both are marked.

import { findCapture, getHomeCapture } from "../../src/lib/captures";
import { formatMetrics, type FormatKey } from "../../src/lib/layout";
import {
  LINKEDIN_ACCESSIBILITY_LINES,
  LINKEDIN_BEATS,
  LINKEDIN_HOW_WE_WORK_LINES,
  LINKEDIN_PROJECT_BEAT_SHOTS,
  LINKEDIN_PROJECT_COPY,
  LINKEDIN_SURFACES_TOUR_CUTS,
  LINKEDIN_TOTAL_FRAMES,
  PROJECT_BEAT_SHOTS,
  SURFACES_TOUR_CUTS,
  SHORT_BEATS,
  TOTAL_FRAMES,
  type BeatMap,
  type FrameRange,
} from "../../src/lib/timing";
import { TRAINING_REEL } from "../../src/reels/training";
import { WEB_REEL } from "../../src/reels/web";
import type { FeaturedBeat, ReelContent, ReelCut, TourCut } from "../../src/reels/types";
import type { CompositionSpec } from "./geometry";
import { SAFE_ZONES } from "../../src/lib/layout";

/**
 * Relative frame the one claim line cuts in on in the 15 second cut. Private
 * const CLAIM_IN in src/scenes/ProjectShowcase.tsx, restated because it is not
 * exported. The LinkedIn cut's equivalent is LINKEDIN_PROJECT_COPY.claimIn,
 * which is exported and is imported above rather than restated.
 */
const SHORT_CLAIM_IN = 36;

/**
 * The frame a project name has finished typing on, relative to the beat.
 * ProjectShowcase passes startFrame 2 and revealFrames 16 to KineticText, so
 * the last character lands on relative frame 18.
 */
const NAME_SETTLED = 18;

/**
 * The frame the LinkedIn context sentence has finished typing on, relative to
 * the beat. It starts revealing on the cut to the clean capture and is fully on
 * screen at LINKEDIN_PROJECT_COPY.contextIn.
 */
const CONTEXT_SETTLED = LINKEDIN_PROJECT_COPY.contextIn;

/**
 * Length of the whip between project beats. WHIP_FRAMES in
 * src/scenes/ProjectShowcase.tsx, restated because tsconfig.scripts.json does
 * not set --jsx.
 *
 * Every beat after the first slides in from the right across these frames, so
 * on those frames the whole scene, band and copy included, is deliberately part
 * way off the canvas. Check (b) measures it and reports it, but as REVIEW: a
 * line that is mid-slide is not a line that has been laid out inside a reserved
 * zone, and treating the two the same would bury a real fault under six frames
 * of transition per beat.
 */
const WHIP_FRAMES = 6;

/**
 * The end card's draw length and the frame its copy arrives on, per cut.
 * Private const CTA_TIMING in src/scenes/CallToAction.tsx, restated for the
 * same reason. If these drift the harness samples the wrong frames of the draw
 * and check (e) will say so, because a frame sampled before the mark exists
 * reads as blank.
 */
const CTA_TIMING: Record<ReelCut, { drawFrames: number; copyIn: number }> = {
  short: { drawFrames: 66, copyIn: 50 },
  linkedin: { drawFrames: 84, copyIn: 64 },
};

export type ReelKey = "web" | "training";

export const REEL_CONTENT: Record<ReelKey, ReelContent> = {
  web: WEB_REEL,
  training: TRAINING_REEL,
};

const SHORT_FORMATS: { suffix: string; format: FormatKey }[] = [
  { suffix: "Vertical", format: "vertical" },
  { suffix: "Feed", format: "feedVertical" },
  { suffix: "Square", format: "square" },
  { suffix: "Landscape", format: "landscape" },
];

const LINKEDIN_FORMATS: { suffix: string; format: FormatKey }[] = [
  { suffix: "LinkedIn", format: "feedVertical" },
  { suffix: "LinkedInLandscape", format: "landscape" },
];

/** The twelve delivery compositions. The Debug twins are handled separately. */
export function compositions(): CompositionSpec[] {
  const rows: CompositionSpec[] = [];
  const reels: { prefix: string; reel: ReelKey }[] = [
    { prefix: "Reel", reel: "web" },
    { prefix: "Training", reel: "training" },
  ];
  for (const { prefix, reel } of reels) {
    for (const { suffix, format } of SHORT_FORMATS) {
      rows.push({
        id: `${prefix}${suffix}`,
        reel,
        format,
        cut: "short",
        width: SAFE_ZONES[format].width,
        height: SAFE_ZONES[format].height,
        durationInFrames: TOTAL_FRAMES,
      });
    }
    for (const { suffix, format } of LINKEDIN_FORMATS) {
      rows.push({
        id: `${prefix}${suffix}`,
        reel,
        format,
        cut: "linkedin",
        width: SAFE_ZONES[format].width,
        height: SAFE_ZONES[format].height,
        durationInFrames: LINKEDIN_TOTAL_FRAMES,
      });
    }
  }
  return rows;
}

export type CopyRegion = "band" | "panel" | "flat" | "none";

export type PlateShotInfo = {
  plateId: string;
  captureId?: string;
  driftSeed?: string;
  /** Frame relative to the Sequence PlateComposite sits inside. */
  relativeFrame: number;
  /** Duration of that Sequence, which is what drives the composite's scale ramp. */
  shotDurationFrames: number;
};

export type DeviceShotInfo = {
  laptop: boolean;
  /** The rectangle the shot is, in capture pixels: the zoom region or the clip. */
  shotWidth: number;
  shotHeight: number;
  captureId: string | null;
  /**
   * Which of ProjectShowcase's three arrangements this beat takes in this crop,
   * solved the same way the scene solves it.
   *
   * It decides whether the screen hole can be measured at all. In "overlay" the
   * lower third sits on top of the device's lower part, so the visible screen is
   * clipped and its aspect is not the device's aspect. In "stack" and "split"
   * the whole device is on screen and the aspect is measurable, which is where
   * the 16:10 laptop rule is enforced. No laptop beat is ever "overlay": a 16:10
   * screen is wider than any of these canvases, which is exactly the test the
   * scene uses to send it to "stack".
   */
  arrangement: "overlay" | "stack" | "split";
};

export type Shot = {
  key: string;
  composition: string;
  reel: ReelKey;
  format: FormatKey;
  cut: ReelCut;
  frame: number;
  scene: "hook" | "project" | "tour" | "howWeWork" | "accessibility" | "cta";
  phase: string;
  label: string;
  copyRegion: CopyRegion;
  beatIndex?: number;
  tourIndex?: number;
  plate?: PlateShotInfo;
  device?: DeviceShotInfo;
  /**
   * True when every line on screen has finished arriving.
   *
   * KineticText's type-on hides characters with visibility, so a line that is
   * half typed lays out at its final width but only inks the left of it. Its ink
   * centre is therefore left of its box centre by design, and measuring a
   * centre line off it would report a fault that is not there. Check (a) only
   * runs where this is true, and says so where it is not.
   */
  copySettled: boolean;
  /**
   * True on a frame where the whole scene is mid whip, sliding in from the
   * right. Its copy is part way off the canvas by design, so check (b) reports
   * rather than judges.
   */
  inTransit: boolean;
  /** Run the end card logo check on this frame. */
  logo: boolean;
  /**
   * True where the shot list expects the frame to carry almost no ink. Nothing
   * in either reel is one, which is what makes check (e) worth running.
   */
  intentionalBlank: boolean;
};

function beatMap(cut: ReelCut): BeatMap {
  return cut === "linkedin" ? LINKEDIN_BEATS : SHORT_BEATS;
}

function projectShots(cut: ReelCut) {
  return cut === "linkedin" ? LINKEDIN_PROJECT_BEAT_SHOTS : PROJECT_BEAT_SHOTS;
}

function tourRanges(cut: ReelCut): FrameRange[] {
  return cut === "linkedin" ? LINKEDIN_SURFACES_TOUR_CUTS : SURFACES_TOUR_CUTS;
}

function claimIn(cut: ReelCut): number {
  return cut === "linkedin" ? LINKEDIN_PROJECT_COPY.claimIn : SHORT_CLAIM_IN;
}

/** The rectangle the clean shot shows, in capture pixels. */
function shotSize(beat: FeaturedBeat): { width: number; height: number; captureId: string | null } {
  if (beat.zoom) {
    const named = beat.cleanCaptureId ? findCapture(beat.cleanCaptureId) : null;
    return {
      width: beat.zoom.w,
      height: beat.zoom.h,
      captureId: named ? named.id : (beat.cleanCaptureId ?? null),
    };
  }
  const capture = beat.cleanCaptureId
    ? findCapture(beat.cleanCaptureId)
    : getHomeCapture(beat.projectId, "mobile");
  if (capture) {
    return { width: capture.width, height: capture.height, captureId: capture.id };
  }
  // A clip that has not landed renders a stand-in rather than a device, which
  // check (c) will report as a missing device body.
  return { width: 780, height: 1688, captureId: beat.cleanCaptureId ?? null };
}

function copyRegionFor(
  format: FormatKey,
  scene: Shot["scene"],
): CopyRegion {
  if (scene === "howWeWork" || scene === "accessibility" || scene === "cta") {
    return "flat";
  }
  if (scene === "project" && formatMetrics(format).showcase === "split") {
    return "panel";
  }
  return "band";
}

export type SampleMode = "full" | "fast";

/**
 * Every frame tested for one composition.
 *
 * Full mode is the list the brief asks for, plus two frames it implies: the
 * last plate frame and the first clean frame, which check (h) compares, and the
 * second to last frame of each clean shot, which check (i) compares against the
 * last. Fast mode drops the frames that only duplicate a neighbour's evidence,
 * and keeps every frame a PASS or FAIL check depends on.
 */
export function shotsFor(comp: CompositionSpec, mode: SampleMode): Shot[] {
  const content = REEL_CONTENT[comp.reel];
  const beats = beatMap(comp.cut);
  const shots = projectShots(comp.cut);
  const featured = content.featured[comp.cut];
  const tour = content.tour[comp.cut];
  const fast = mode === "fast";
  const out: Shot[] = [];

  const push = (
    frame: number,
    scene: Shot["scene"],
    phase: string,
    label: string,
    extra: Partial<Shot> = {},
  ) => {
    const clamped = Math.max(0, Math.min(comp.durationInFrames - 1, frame));
    const key = `${comp.id}-${String(clamped).padStart(4, "0")}`;
    if (out.some((s) => s.key === key)) return;
    out.push({
      key,
      composition: comp.id,
      reel: comp.reel,
      format: comp.format,
      cut: comp.cut,
      frame: clamped,
      scene,
      phase,
      label,
      copyRegion: copyRegionFor(comp.format, scene),
      copySettled: true,
      inTransit: false,
      logo: false,
      intentionalBlank: false,
      ...extra,
    });
  };

  // Hook: start plus 1, middle, end minus 1.
  const hook = beats.hook;
  const hookMid = Math.floor((hook.start + hook.end) / 2);
  if (!fast) push(hook.start + 1, "hook", "start+1", "hook, first frame after the slam");
  push(hookMid, "hook", "mid", "hook, middle");
  if (!fast) push(hook.end - 1, "hook", "end-1", "hook, last frame");

  // How we work, LinkedIn only: each line in plus 2, section end minus 1.
  if (beats.howWeWork) {
    const b = beats.howWeWork;
    if (!fast) {
      for (let i = 0; i < LINKEDIN_HOW_WE_WORK_LINES.length; i += 1) {
        push(
          b.start + LINKEDIN_HOW_WE_WORK_LINES[i] + 2,
          "howWeWork",
          `line${i + 1}+2`,
          `how we work, line ${i + 1} in`,
          { copySettled: false },
        );
      }
    }
    push(b.end - 1, "howWeWork", "end-1", "how we work, last frame");
  }

  // Project beats.
  featured.forEach((beat, i) => {
    const range = beats.projects[i];
    if (!range) return;
    const plateStart = range.start + shots.plate.start;
    const plateEnd = range.start + shots.plate.end;
    const cleanStart = range.start + shots.cleanCapture.start;
    const plateFrames = shots.plate.end - shots.plate.start;
    const size = shotSize(beat);
    const laptop = beat.cleanFrame === "laptop";
    // ProjectShowcase's own rule, restated from the same inputs: a shot wider
    // than the canvas cannot take the overlay arrangement, because the band
    // would land across the middle of the thing the shot exists to show.
    const shotAspect = laptop ? 16 / 10 : size.width / size.height;
    const base = formatMetrics(comp.format).showcase;
    const arrangement: DeviceShotInfo["arrangement"] =
      base === "overlay" && shotAspect > comp.width / comp.height ? "stack" : base;
    const device: DeviceShotInfo = {
      laptop,
      shotWidth: size.width,
      shotHeight: size.height,
      captureId: size.captureId,
      arrangement,
    };
    const plateInfo = (frame: number): PlateShotInfo => ({
      plateId: beat.plateId,
      captureId: beat.plateCaptureId,
      relativeFrame: frame - plateStart,
      shotDurationFrames: plateFrames,
    });

    const settledAt = range.start + NAME_SETTLED;
    const contextSettledAt =
      comp.cut === "linkedin" ? range.start + CONTEXT_SETTLED : range.start;

    // Every beat but the first whips in over the first WHIP_FRAMES frames.
    const whipsIn = i > 0;
    const transit = (frame: number) =>
      whipsIn && frame < range.start + WHIP_FRAMES;

    if (!fast) {
      push(plateStart + 1, "project", "plate+1", `${beat.name}, plate opens`, {
        beatIndex: i,
        plate: plateInfo(plateStart + 1),
        copySettled: plateStart + 1 >= settledAt,
        inTransit: transit(plateStart + 1),
      });
    }
    const plateMid = Math.floor((plateStart + plateEnd) / 2);
    push(plateMid, "project", "plateMid", `${beat.name}, plate middle`, {
      beatIndex: i,
      plate: plateInfo(plateMid),
      copySettled: plateMid >= settledAt,
    });
    if (!fast) {
      // Check (h) compares this pair across the hard cut.
      push(plateEnd - 1, "project", "plateEnd", `${beat.name}, last plate frame`, {
        beatIndex: i,
        plate: plateInfo(plateEnd - 1),
        copySettled: plateEnd - 1 >= settledAt,
      });
      push(cleanStart, "project", "cleanStart", `${beat.name}, first clean frame`, {
        beatIndex: i,
        device,
        copySettled: cleanStart >= settledAt && cleanStart >= contextSettledAt,
      });
    }
    push(cleanStart + 1, "project", "clean+1", `${beat.name}, clean shot opens`, {
      beatIndex: i,
      device,
      copySettled: cleanStart + 1 >= settledAt && cleanStart + 1 >= contextSettledAt,
    });
    push(
      range.start + claimIn(comp.cut) + 2,
      "project",
      "claim+2",
      `${beat.name}, claim up`,
      { beatIndex: i, device },
    );
    // Check (i) compares this pair: a shot that is frozen at the cut lands on a
    // photograph.
    push(range.end - 2, "project", "end-2", `${beat.name}, second to last frame`, {
      beatIndex: i,
      device,
    });
    push(range.end - 1, "project", "end-1", `${beat.name}, last frame`, {
      beatIndex: i,
      device,
    });
  });

  // Surfaces tour: start plus 1, middle, end minus 1 of every cut.
  const ranges = tourRanges(comp.cut);
  tour.forEach((cut: TourCut, i: number) => {
    const range = ranges[i];
    if (!range) return;
    const start = beats.surfacesTour.start + range.start;
    const end = beats.surfacesTour.start + range.end;
    const length = range.end - range.start;
    const info = (frame: number): PlateShotInfo => ({
      plateId: cut.plateId,
      captureId: cut.captureId,
      driftSeed: cut.driftSeed,
      relativeFrame: frame - start,
      shotDurationFrames: length,
    });
    if (!fast) {
      push(start + 1, "tour", "start+1", `tour "${cut.word}", opens`, {
        tourIndex: i,
        plate: info(start + 1),
      });
    }
    const mid = Math.floor((start + end) / 2);
    push(mid, "tour", "mid", `tour "${cut.word}", middle`, {
      tourIndex: i,
      plate: info(mid),
    });
    if (!fast) {
      push(end - 1, "tour", "end-1", `tour "${cut.word}", last frame`, {
        tourIndex: i,
        plate: info(end - 1),
      });
    }
  });

  // Accessibility, LinkedIn only.
  if (beats.accessibility) {
    const b = beats.accessibility;
    if (!fast) {
      for (let i = 0; i < LINKEDIN_ACCESSIBILITY_LINES.length; i += 1) {
        push(
          b.start + LINKEDIN_ACCESSIBILITY_LINES[i] + 2,
          "accessibility",
          `line${i + 1}+2`,
          `accessibility, line ${i + 1} in`,
          { copySettled: false },
        );
      }
    }
    push(b.end - 1, "accessibility", "end-1", "accessibility, last frame");
  }

  // Call to action: start, start plus 1, draw middle, copy in plus 1, end minus 1.
  const cta = beats.callToAction;
  const timing = CTA_TIMING[comp.cut];
  push(cta.start, "cta", "start", "end card, first frame", { copySettled: false });
  if (!fast) {
    push(cta.start + 1, "cta", "start+1", "end card, second frame", {
      copySettled: false,
    });
  }
  if (!fast) {
    push(
      cta.start + Math.floor(timing.drawFrames / 2),
      "cta",
      "drawMid",
      "end card, middle of the draw",
      { copySettled: false },
    );
  }
  // The mark is still drawing here: the wordmark types on until a few frames
  // before the beat ends. The logo colours are already down, so check (f) runs;
  // the centre line is not settled, so check (a) does not.
  push(cta.start + timing.copyIn + 1, "cta", "copy+1", "end card, copy in", {
    logo: true,
    copySettled: false,
  });
  push(cta.end - 1, "cta", "end-1", "end card, last frame", { logo: true });

  out.sort((a, b) => a.frame - b.frame);
  return out;
}

/**
 * The two Debug frames rendered per composition as visual evidence for the safe
 * zone check: one band frame and the end card. The check itself measures the
 * normal frame against the rectangles layout.ts derives; these are so a
 * reviewer can see the red zones over the same picture.
 */
export function debugShotsFor(comp: CompositionSpec): { id: string; frame: number; label: string }[] {
  const beats = beatMap(comp.cut);
  const firstProject = beats.projects[0];
  const bandFrame = firstProject
    ? firstProject.start + projectShots(comp.cut).cleanCapture.start + 12
    : beats.hook.start + 1;
  return [
    { id: `${comp.id}Debug`, frame: bandFrame, label: "project beat, band up" },
    { id: `${comp.id}Debug`, frame: beats.callToAction.end - 1, label: "end card" },
  ];
}

/** Every plate id either reel puts on screen, in the cuts the harness tests. */
export function platesInUse(reels: ReelKey[]): { plateId: string; usedBy: string[] }[] {
  const map = new Map<string, Set<string>>();
  for (const reel of reels) {
    const content = REEL_CONTENT[reel];
    for (const cut of ["short", "linkedin"] as ReelCut[]) {
      content.featured[cut].forEach((beat) => {
        const set = map.get(beat.plateId) ?? new Set<string>();
        set.add(`${reel} ${cut} project "${beat.name}"`);
        map.set(beat.plateId, set);
      });
      content.tour[cut].forEach((cut2) => {
        const set = map.get(cut2.plateId) ?? new Set<string>();
        set.add(`${reel} ${cut} tour "${cut2.word}"`);
        map.set(cut2.plateId, set);
      });
    }
  }
  return [...map.entries()]
    .map(([plateId, usedBy]) => ({ plateId, usedBy: [...usedBy].sort() }))
    .sort((a, b) => a.plateId.localeCompare(b.plateId));
}
