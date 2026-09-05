// Pixel measurement primitives for the QA harness.
//
// Everything here works on a raw RGB buffer read through sharp, three bytes
// per pixel with the alpha removed. The measurements are the same family the
// throwaway scripts in out/_align and out/_laptop used: column and row scans of
// ink against a known flat background, plus a longest-run search for a solid
// block of one colour. Those two primitives find the lower third scrim, the
// device body, the screen hole inside it, and the bounding box of a text block.
//
// Nothing in this file knows about the reel. It takes rectangles and colours
// and returns numbers.

import sharp from "sharp";

export type RGB = [number, number, number];

export type Raw = {
  data: Buffer;
  width: number;
  height: number;
};

export type Rect = { x: number; y: number; w: number; h: number };

export async function loadRaw(file: string): Promise<Raw> {
  const img = sharp(file);
  const meta = await img.metadata();
  const data = await img.removeAlpha().raw().toBuffer();
  return {
    data,
    width: meta.width as number,
    height: meta.height as number,
  };
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "").trim();
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function pixelAt(raw: Raw, x: number, y: number): RGB {
  const i = (y * raw.width + x) * 3;
  return [raw.data[i], raw.data[i + 1], raw.data[i + 2]];
}

/** Euclidean distance in RGB. Used everywhere a tolerance is quoted. */
export function colourDistance(a: RGB, b: RGB): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function near(raw: Raw, x: number, y: number, colour: RGB, tol: number): boolean {
  const i = (y * raw.width + x) * 3;
  const dr = raw.data[i] - colour[0];
  const dg = raw.data[i + 1] - colour[1];
  const db = raw.data[i + 2] - colour[2];
  return dr * dr + dg * dg + db * db <= tol * tol;
}

export function clampRect(rect: Rect, raw: Raw): Rect {
  const x = Math.max(0, Math.min(raw.width - 1, Math.round(rect.x)));
  const y = Math.max(0, Math.min(raw.height - 1, Math.round(rect.y)));
  const w = Math.max(0, Math.min(raw.width - x, Math.round(rect.w)));
  const h = Math.max(0, Math.min(raw.height - y, Math.round(rect.h)));
  return { x, y, w, h };
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  );
}

export type Run = { start: number; end: number };

/** Longest contiguous run of true in a flag array. Half open, [start, end). */
export function longestRun(flags: boolean[]): Run | null {
  let best: Run | null = null;
  let start: number | null = null;
  for (let i = 0; i <= flags.length; i += 1) {
    if (i < flags.length && flags[i]) {
      if (start === null) start = i;
    } else if (start !== null) {
      if (best === null || i - start > best.end - best.start) {
        best = { start, end: i };
      }
      start = null;
    }
  }
  return best;
}

/**
 * The largest solid block of one colour: rows that are mostly that colour,
 * then columns that are mostly that colour within those rows. This is how the
 * lower third scrim and the landscape copy panel are found, and it is lifted
 * from out/_align/measure.mts unchanged in behaviour.
 */
export function findFlatBlock(
  raw: Raw,
  colour: RGB,
  tol: number,
  options: { rowFraction?: number; colFraction?: number; search?: Rect } = {},
): Rect | null {
  const rowFraction = options.rowFraction ?? 0.25;
  const colFraction = options.colFraction ?? 0.5;
  const box = options.search
    ? clampRect(options.search, raw)
    : { x: 0, y: 0, w: raw.width, h: raw.height };

  const rowFlags: boolean[] = [];
  for (let y = box.y; y < box.y + box.h; y += 1) {
    let n = 0;
    for (let x = box.x; x < box.x + box.w; x += 1) {
      if (near(raw, x, y, colour, tol)) n += 1;
    }
    rowFlags.push(n > box.w * rowFraction);
  }
  const rows = longestRun(rowFlags);
  if (rows === null) return null;

  const rowStart = box.y + rows.start;
  const rowEnd = box.y + rows.end;
  const rowCount = rowEnd - rowStart;

  const colFlags: boolean[] = [];
  for (let x = box.x; x < box.x + box.w; x += 1) {
    let n = 0;
    for (let y = rowStart; y < rowEnd; y += 1) {
      if (near(raw, x, y, colour, tol)) n += 1;
    }
    colFlags.push(n > rowCount * colFraction);
  }
  const cols = longestRun(colFlags);
  if (cols === null) return null;

  return {
    x: box.x + cols.start,
    y: rowStart,
    w: cols.end - cols.start,
    h: rowCount,
  };
}

export type InkBox = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  pixels: number;
};

/**
 * Bounding box of everything inside `box` that is not the background colour.
 *
 * `minRun` rejects a stray antialiased pixel: a column only counts once more
 * than that many of its rows carry ink, and a row likewise. Text is many rows
 * tall, so this costs nothing real and it stops one hot pixel from moving a
 * measured centre by fifty pixels.
 */
export function inkBox(
  raw: Raw,
  background: RGB,
  tol: number,
  box: Rect,
  minRun = 3,
): InkBox | null {
  const b = clampRect(box, raw);
  const cols = new Array<number>(b.w).fill(0);
  const rows = new Array<number>(b.h).fill(0);
  let pixels = 0;

  for (let y = 0; y < b.h; y += 1) {
    for (let x = 0; x < b.w; x += 1) {
      if (!near(raw, b.x + x, b.y + y, background, tol)) {
        cols[x] += 1;
        rows[y] += 1;
        pixels += 1;
      }
    }
  }

  let left = -1;
  let right = -1;
  for (let x = 0; x < b.w; x += 1) {
    if (cols[x] > minRun) {
      if (left < 0) left = x;
      right = x;
    }
  }
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < b.h; y += 1) {
    if (rows[y] > minRun) {
      if (top < 0) top = y;
      bottom = y;
    }
  }
  if (left < 0 || top < 0) return null;

  return {
    left: b.x + left,
    right: b.x + right,
    top: b.y + top,
    bottom: b.y + bottom,
    centerX: b.x + (left + right) / 2,
    centerY: b.y + (top + bottom) / 2,
    pixels,
  };
}

/** Count of pixels inside `box` that are not the background colour. */
export function countNonBackground(
  raw: Raw,
  background: RGB,
  tol: number,
  box: Rect,
): number {
  const b = clampRect(box, raw);
  let n = 0;
  for (let y = b.y; y < b.y + b.h; y += 1) {
    for (let x = b.x; x < b.x + b.w; x += 1) {
      if (!near(raw, x, y, background, tol)) n += 1;
    }
  }
  return n;
}

/** Count of pixels inside `box` within `tol` of `colour`. */
export function countNear(raw: Raw, colour: RGB, tol: number, box?: Rect): number {
  const b = box ? clampRect(box, raw) : { x: 0, y: 0, w: raw.width, h: raw.height };
  let n = 0;
  for (let y = b.y; y < b.y + b.h; y += 1) {
    for (let x = b.x; x < b.x + b.w; x += 1) {
      if (near(raw, x, y, colour, tol)) n += 1;
    }
  }
  return n;
}

/**
 * The frame's dominant colour, quantised to 16 levels per channel and then
 * refined to the mean of the pixels in the winning bucket. Used as the
 * background for the blank frame test, where nothing else knows what the
 * background is meant to be.
 */
export function dominantColour(raw: Raw, step = 4): RGB {
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let y = 0; y < raw.height; y += step) {
    for (let x = 0; x < raw.width; x += step) {
      const i = (y * raw.width + x) * 3;
      const r = raw.data[i];
      const g = raw.data[i + 1];
      const b = raw.data[i + 2];
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const cell = buckets.get(key);
      if (cell) {
        cell.n += 1;
        cell.r += r;
        cell.g += g;
        cell.b += b;
      } else {
        buckets.set(key, { n: 1, r, g, b });
      }
    }
  }
  let best: { n: number; r: number; g: number; b: number } | null = null;
  for (const cell of buckets.values()) {
    if (best === null || cell.n > best.n) best = cell;
  }
  if (best === null) return [0, 0, 0];
  return [
    Math.round(best.r / best.n),
    Math.round(best.g / best.n),
    Math.round(best.b / best.n),
  ];
}

/** Fraction of the frame that differs from `background` by more than `tol`. */
export function inkCoverage(raw: Raw, background: RGB, tol: number, step = 2): number {
  let ink = 0;
  let total = 0;
  for (let y = 0; y < raw.height; y += step) {
    for (let x = 0; x < raw.width; x += step) {
      total += 1;
      if (!near(raw, x, y, background, tol)) ink += 1;
    }
  }
  return total === 0 ? 0 : ink / total;
}

/** Peak signal to noise ratio between two same sized frames, in decibels. */
export function psnr(a: Raw, b: Raw): number {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error("psnr: frame sizes differ");
  }
  let sum = 0;
  const n = a.width * a.height * 3;
  for (let i = 0; i < n; i += 1) {
    const d = a.data[i] - b.data[i];
    sum += d * d;
  }
  const mse = sum / n;
  if (mse === 0) return Infinity;
  return 10 * Math.log10((255 * 255) / mse);
}

// ---------------------------------------------------------------------------
// Quadrilaterals
// ---------------------------------------------------------------------------

export type Point = [number, number];
export type Quad = [Point, Point, Point, Point];

export function quadCentroid(quad: Quad): Point {
  return [
    (quad[0][0] + quad[1][0] + quad[2][0] + quad[3][0]) / 4,
    (quad[0][1] + quad[1][1] + quad[2][1] + quad[3][1]) / 4,
  ];
}

export function quadBoundingRect(quad: Quad): Rect {
  const xs = quad.map((p) => p[0]);
  const ys = quad.map((p) => p[1]);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/**
 * Points on a ring `inset` pixels inside each edge of a quadrilateral.
 *
 * Each edge is sampled and every sample is pushed along that edge's inward
 * normal, so the ring follows the shape rather than a bounding box. The ends of
 * each edge are skipped, because a corner is where two insets fight and where a
 * rounded screen corner lives.
 */
export function quadRingSamples(
  quad: Quad,
  inset: number,
  perEdge = 120,
): Point[] {
  const [cx, cy] = quadCentroid(quad);
  const out: Point[] = [];
  for (let e = 0; e < 4; e += 1) {
    const p = quad[e];
    const q = quad[(e + 1) % 4];
    const ex = q[0] - p[0];
    const ey = q[1] - p[1];
    const len = Math.hypot(ex, ey) || 1;
    // Normal of the edge, flipped to point at the centroid.
    let nx = -ey / len;
    let ny = ex / len;
    const mx = (p[0] + q[0]) / 2;
    const my = (p[1] + q[1]) / 2;
    if (nx * (cx - mx) + ny * (cy - my) < 0) {
      nx = -nx;
      ny = -ny;
    }
    for (let i = 0; i < perEdge; i += 1) {
      const t = 0.04 + (0.92 * i) / Math.max(1, perEdge - 1);
      out.push([p[0] + ex * t + nx * inset, p[1] + ey * t + ny * inset]);
    }
  }
  return out;
}

export function rectToQuad(rect: Rect): Quad {
  return [
    [rect.x, rect.y],
    [rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y + rect.h],
    [rect.x, rect.y + rect.h],
  ];
}

// ---------------------------------------------------------------------------
// Skin tone, for the plate review crops
// ---------------------------------------------------------------------------

/**
 * A deliberately loose skin mask in HSV. It is a review aid, not a decision:
 * anything it finds is cropped out for a person to look at, and a false
 * positive costs one extra thumbnail.
 */
export function isSkin(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max / 255;
  if (v < 0.25 || v > 0.98) return false;
  const s = max === 0 ? 0 : (max - min) / max;
  if (s < 0.15 || s > 0.68) return false;
  if (r <= g || g < b) return false;
  const d = max - min;
  if (d === 0) return false;
  let hue: number;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
  return hue >= 0 && hue <= 50;
}

/**
 * Connected regions of a boolean mask laid out on a coarse grid, returned as
 * bounding boxes in grid cells. Four connectivity, iterative flood fill.
 */
export function maskRegions(
  mask: boolean[],
  cols: number,
  rows: number,
  minCells: number,
): { x: number; y: number; w: number; h: number; cells: number }[] {
  const seen = new Uint8Array(cols * rows);
  const out: { x: number; y: number; w: number; h: number; cells: number }[] = [];
  const stack: number[] = [];

  for (let start = 0; start < cols * rows; start += 1) {
    if (seen[start] || !mask[start]) continue;
    seen[start] = 1;
    stack.length = 0;
    stack.push(start);
    let minX = cols;
    let maxX = -1;
    let minY = rows;
    let maxY = -1;
    let cells = 0;

    while (stack.length > 0) {
      const idx = stack.pop() as number;
      const x = idx % cols;
      const y = (idx - x) / cols;
      cells += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      const neighbours = [
        x > 0 ? idx - 1 : -1,
        x < cols - 1 ? idx + 1 : -1,
        y > 0 ? idx - cols : -1,
        y < rows - 1 ? idx + cols : -1,
      ];
      for (const n of neighbours) {
        if (n >= 0 && !seen[n] && mask[n]) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }

    if (cells >= minCells) {
      out.push({
        x: minX,
        y: minY,
        w: maxX - minX + 1,
        h: maxY - minY + 1,
        cells,
      });
    }
  }

  out.sort((a, b) => b.cells - a.cells);
  return out;
}
