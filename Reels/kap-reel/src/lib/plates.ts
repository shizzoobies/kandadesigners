// Context plate index and the projective transform that seats a real site
// capture into a generated device screen. See kap-reel-handoff.md Section 4b.
//
// Phase 4 owns this file. Written by scripts/plates.ts and scripts/find-quad.ts,
// read by src/components/PlateComposite.tsx.

import { staticFile } from "remotion";
import platesIndex from "../../config/plates.json";

export type Point = [number, number];

/** Screen corners in plate pixels, ordered TL, TR, BR, BL. */
export type Quad = [Point, Point, Point, Point];

export type PlateEntry = {
  id: string;
  /** Repo-relative path, for example assets/plates/plate-ipad-lap-c01.png. */
  file: string;
  model: string;
  prompt: string;
  seed: number | null;
  resolution: string;
  width: number;
  height: number;
  quad: Quad;
  /**
   * How much of the plate's own screen pixels to blend back on top as glare,
   * 0 to 1. Zero means the generated screen had no usable highlight.
   */
  glareOpacity: number;
  notes: string;
  /** Which captures.json clip belongs in this screen. */
  captureId: string;
  usedFor: string;
};

type PlatesFile = {
  plates: PlateEntry[];
};

// Cast through unknown: TypeScript infers quad from the JSON as number[][],
// which cannot be narrowed to the fixed length four tuple directly.
// scripts/find-quad.ts is the only writer and it always emits four corners.
const PLATES = (platesIndex as unknown as PlatesFile).plates ?? [];

/** Turns the repo-relative plate path into a Remotion static file URL. */
export function plateSrc(entry: PlateEntry): string {
  return staticFile(entry.file.replace(/^assets\//, ""));
}

/** Looks a plate up by id. Throws if the id is not in plates.json. */
export function getPlate(id: string): PlateEntry {
  const found = PLATES.find((p) => p.id === id);
  if (!found) {
    throw new Error(
      `No plate with id "${id}" in config/plates.json. Known ids: ${PLATES.map(
        (p) => p.id,
      ).join(", ")}`,
    );
  }
  return found;
}

export function listPlates(): PlateEntry[] {
  return PLATES;
}

// ---------------------------------------------------------------------------
// Screen glow tint
// ---------------------------------------------------------------------------

/**
 * The average colour of each capture. This is the tint of the light a screen
 * spills onto its own bezel and whatever sits next to it.
 *
 * Measured once, offline, not sampled at runtime. The composite reads the
 * capture at source frame 44, so each value is that frame scaled to a single
 * pixel with
 *   ffmpeg -i <capture>.mp4 -vf "select=eq(n\,44),scale=1:1" -frames:v 1 out.png
 *
 * An average rather than a blurred copy of the capture, deliberately. A
 * blurred copy carries the page's bright bands, so a white nav or a white
 * content section blooms across the bezel as fog, which is exactly what the
 * first version of layer 4 did. An average cannot band, and it self regulates:
 * fore-motion-golf averages to near black, so a dark page spills almost
 * nothing, which is what a dark screen actually does in a room.
 */
const CAPTURE_TINTS: Record<string, [number, number, number]> = {
  "fore-motion-golf-home-desktop": [21, 23, 19],
  "project-makeover-home-mobile": [95, 89, 93],
  "southern-legacy-contractors-home-desktop": [61, 63, 71],
  "mbs-medicine-home-desktop": [81, 68, 67],
  "onlynails-dashboard-sitephotos-clean": [219, 217, 215],
  "ellenton-family-practice-home-mobile": [215, 216, 212],
  "pbj-strategic-accounting-home-desktop": [138, 131, 128],
  "synovial-marketing-home-mobile": [221, 213, 204],

  // Training set, measured 2026-09-04 the same way, one entry per clip the
  // seven training plates bind to. The spread across them is the widest in
  // this table and it is real: the safety pages open on a near black hero, so
  // those screens spill almost nothing, while the finance and rfi samples are
  // cream and paper white and spill a warm light the way a document page does.
  "training-safety-hero-to-zones-desktop": [38, 32, 31],
  "training-safety-hierarchy-sorter-mobile": [63, 55, 38],
  "training-safety-walkthrough-card-desktop": [40, 35, 33],
  "training-finance-pnl-simulator-desktop": [226, 220, 207],
  "training-finance-waterfall-desktop": [226, 218, 206],
  "training-rfi-scenario-branch-desktop": [230, 230, 234],
  "training-rfi-hero-mobile": [65, 86, 127],
};

/** Neutral mid grey, for a capture that has not been measured yet. */
const DEFAULT_TINT: [number, number, number] = [110, 105, 102];

export function captureTint(captureId: string): [number, number, number] {
  return CAPTURE_TINTS[captureId] ?? DEFAULT_TINT;
}

// ---------------------------------------------------------------------------
// Projective transform
// ---------------------------------------------------------------------------

/**
 * Solves a dense linear system by Gaussian elimination with partial pivoting.
 * Small and fixed size (8x8 here), so clarity beats cleverness.
 */
function solveLinearSystem(matrix: number[][], rhs: number[]): number[] {
  const n = rhs.length;
  const a = matrix.map((row, i) => [...row, rhs[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    if (Math.abs(a[pivot][col]) < 1e-12) {
      throw new Error("Degenerate quad: the four corners are collinear or coincident.");
    }
    const swap = a[col];
    a[col] = a[pivot];
    a[pivot] = swap;

    const diag = a[col][col];
    for (let k = col; k <= n; k++) a[col][k] /= diag;

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = a[row][col];
      if (factor === 0) continue;
      for (let k = col; k <= n; k++) a[row][k] -= factor * a[col][k];
    }
  }

  return a.map((row) => row[n]);
}

/**
 * The eight coefficients of the projective map
 *   x' = (a*u + b*v + c) / (g*u + h*v + 1)
 *   y' = (d*u + e*v + f) / (g*u + h*v + 1)
 * that carries the axis-aligned rectangle 0,0 to w,h onto the quad.
 */
export type Homography = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
};

export function solveHomography(
  sourceWidth: number,
  sourceHeight: number,
  quad: Quad,
): Homography {
  const src: Point[] = [
    [0, 0],
    [sourceWidth, 0],
    [sourceWidth, sourceHeight],
    [0, sourceHeight],
  ];

  const matrix: number[][] = [];
  const rhs: number[] = [];

  for (let i = 0; i < 4; i++) {
    const [u, v] = src[i];
    const [x, y] = quad[i];
    matrix.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
    rhs.push(x);
    matrix.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
    rhs.push(y);
  }

  const s = solveLinearSystem(matrix, rhs);
  return { a: s[0], b: s[1], c: s[2], d: s[3], e: s[4], f: s[5], g: s[6], h: s[7] };
}

/**
 * The same map as a CSS matrix3d string. CSS takes the 4x4 in column-major
 * order, so the 2D projective coefficients land at m11 m12 m14, m21 m22 m24
 * and m41 m42 m44. Apply it with transformOrigin "0 0" to an element that is
 * exactly sourceWidth by sourceHeight and positioned at the plate's origin.
 */
export function quadMatrix3d(
  sourceWidth: number,
  sourceHeight: number,
  quad: Quad,
): string {
  const { a, b, c, d, e, f, g, h } = solveHomography(sourceWidth, sourceHeight, quad);
  const m = [a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${m.map((n) => (Math.abs(n) < 1e-10 ? 0 : n)).join(", ")})`;
}

// ---------------------------------------------------------------------------
// Quad geometry helpers
// ---------------------------------------------------------------------------

function distance(p: Point, q: Point): number {
  return Math.hypot(q[0] - p[0], q[1] - p[1]);
}

/**
 * A sensible pixel size for the element being warped: the average of the two
 * horizontal edges by the average of the two vertical edges. Using the quad's
 * own scale keeps the capture's pixel density close to one to one, so the
 * warp neither softens nor aliases the site.
 */
export function quadSourceSize(quad: Quad): { width: number; height: number } {
  const top = distance(quad[0], quad[1]);
  const bottom = distance(quad[3], quad[2]);
  const left = distance(quad[0], quad[3]);
  const right = distance(quad[1], quad[2]);
  return {
    width: Math.round((top + bottom) / 2),
    height: Math.round((left + right) / 2),
  };
}

/** Axis-aligned bounding box of the quad, in plate pixels. */
export function quadBounds(quad: Quad): {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} {
  const xs = quad.map((p) => p[0]);
  const ys = quad.map((p) => p[1]);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
  };
}

/** The quad as a CSS clip-path polygon in the plate's own pixel space. */
export function quadClipPath(quad: Quad): string {
  return `polygon(${quad.map(([x, y]) => `${x}px ${y}px`).join(", ")})`;
}

/**
 * Pushes each corner outward from the quad centroid by `px` pixels. Used to
 * grow the glow and the glare beyond the screen, and by find-quad.ts to give
 * the composite its coverage overlap.
 */
export function expandQuad(quad: Quad, px: number): Quad {
  const cx = (quad[0][0] + quad[1][0] + quad[2][0] + quad[3][0]) / 4;
  const cy = (quad[0][1] + quad[1][1] + quad[2][1] + quad[3][1]) / 4;
  return quad.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return [x + (dx / len) * px, y + (dy / len) * px] as Point;
  }) as Quad;
}
