/**
 * scripts/find-quad.ts
 *
 * Finds the four screen corners of a generated context plate, and writes a
 * debug PNG with the quad drawn in red next to the plate so the result can be
 * checked by eye. See kap-reel-handoff.md Section 4b.
 *
 * Run:
 *   npx tsx scripts/find-quad.ts --file assets/plates/plate-ipad-lap-c01.png
 *   npx tsx scripts/find-quad.ts --plate plate-ipad-lap --file <path> --write
 *   npx tsx scripts/find-quad.ts --all --write
 *
 * Flags:
 *   --file <path>       The plate PNG to analyse.
 *   --plate <id>        Plate id to record the result against.
 *   --capture <id>      Capture id to bind to the plate. Defaults to the
 *                       binding in scripts/plates.ts.
 *   --write             Write the plate entry into config/plates.json.
 *   --all               Analyse every accepted generation in plates.json.
 *   --floor N           Luma floor, 0 to 255. Default 32.
 *   --threshold N       Luma ceiling, 0 to 255. Default 110.
 *   --open N            Morphological opening radius in working px. Default 6.
 *   --min-fill N        Rectangularity gate, 0 to 1. Default 0.8.
 *   --expand N          Outward corner expansion in px. Default 2.
 *   --glare N           glareOpacity to record, 0 to 1. Default 0.
 *   --zoom x,y,w,h      Write a 4x magnified crop with a coordinate grid, for
 *                       reading a corner off by hand. Needs --file.
 *
 * Method:
 *   1. Downscale to WORK_WIDTH, keep RGB.
 *   2. Mask the flat grey panel: luma inside [floor, threshold) AND low chroma.
 *      Masking "dark" instead was the first attempt and it failed, because on
 *      the laptop plates the near-black bezel, the keycaps and the hair all
 *      join the panel into one blob. The panel's own luma band separates it.
 *   3. Morphological opening, which deletes keycaps and thin shadows outright.
 *   4. Every connected component by flood fill, not just the largest.
 *   5. Score each by how much of its own corner quad it fills. A screen fills
 *      about 1.0; a hair silhouette or a sleeve fills far less. Take the
 *      largest that passes.
 *   6. Convex hull, then the four extremes of x+y and x-y as TL, BR, TR, BL.
 *      Stable against the rounded corners the models draw.
 *   7. Scale back to full resolution and push the corners 2px outward, so the
 *      composited capture fully covers the generated screen.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PLATE_SPECS } from "./plates.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PLATES_JSON = path.join(ROOT, "config", "plates.json");

// 1024 rather than 512 so a corner is accurate to about 1.5 plate pixels.
// At 512 the scale-back quantised corners to +/-3px, which is larger than the
// 2px outward expansion Section 4b asks for, and the expansion has to be the
// thing that guarantees coverage.
const WORK_WIDTH = 1024;

type Point = [number, number];
type Quad = [Point, Point, Point, Point];

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

type Mask = {
  data: Uint8Array;
  width: number;
  height: number;
};

async function buildMask(
  file: string,
  threshold: number,
  floor: number,
): Promise<{
  mask: Mask;
  luma: Float32Array;
  scale: number;
  full: { width: number; height: number };
}> {
  const meta = await sharp(file).metadata();
  const fullWidth = meta.width ?? 0;
  const fullHeight = meta.height ?? 0;
  if (!fullWidth || !fullHeight) throw new Error(`Could not read dimensions of ${file}`);

  const scale = fullWidth / WORK_WIDTH;
  const workHeight = Math.round(fullHeight / scale);

  const { data, info } = await sharp(file)
    .resize(WORK_WIDTH, workHeight, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const mask = new Uint8Array(w * h);
  const lumaPlane = new Float32Array(w * h);

  for (let i = 0, p = 0; i < mask.length; i++, p += 3) {
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    lumaPlane[i] = luma;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    // The target is the flat grey panel, not every dark pixel. A powered-off
    // panel sits in a narrow neutral band around luma 60. The bezel and the
    // keycaps are far darker, hair and shadowed oak are darker and warmer, and
    // that separation is what lets the panel come out as its own blob even
    // when bezel, hinge and keyboard are one continuous dark mass. Targeting
    // the panel is also the correct target: the panel is the generated screen
    // content the composite has to cover, the bezel is device and stays.
    if (luma >= floor && luma < threshold && chroma < 18 + luma * 0.16) mask[i] = 1;
  }

  return {
    mask: { data: mask, width: w, height: h },
    luma: lumaPlane,
    scale,
    full: { width: fullWidth, height: fullHeight },
  };
}

/**
 * One pass of a separable square-kernel erosion or dilation, radius r.
 * The screen is hundreds of working pixels across and a keycap is under ten,
 * so an opening (erode then dilate by the same radius) deletes the keyboard
 * and the hinge shadow outright while leaving the screen's outline intact.
 * Without it the laptop plates return one blob spanning screen plus keys plus
 * trackpad, and the bottom two corners land in the middle of the deck.
 */
function morph(mask: Mask, r: number, mode: "erode" | "dilate"): Mask {
  if (r <= 0) return mask;
  const { width, height } = mask;
  const hit = mode === "dilate" ? 1 : 0;
  const src = mask.data;

  const pass = (input: Uint8Array, horizontal: boolean): Uint8Array => {
    const out = new Uint8Array(input.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        let value = input[idx];
        for (let d = -r; d <= r && value !== hit; d++) {
          if (d === 0) continue;
          const nx = horizontal ? x + d : x;
          const ny = horizontal ? y : y + d;
          // Outside the frame counts as background, so an erosion trims the
          // border. That is correct here: a screen never touches the edge.
          const neighbour = nx < 0 || ny < 0 || nx >= width || ny >= height ? 0 : input[ny * width + nx];
          if (neighbour === hit) value = hit;
        }
        out[idx] = value;
      }
    }
    return out;
  };

  return { data: pass(pass(src, true), false), width, height };
}

/** Every 4-connected component of the mask above minSize, as pixel indices. */
function allBlobs(mask: Mask, minSize: number): number[][] {
  const { data, width, height } = mask;
  const seen = new Uint8Array(data.length);
  const stack: number[] = [];
  const found: number[][] = [];

  for (let start = 0; start < data.length; start++) {
    if (!data[start] || seen[start]) continue;
    const blob: number[] = [];
    stack.length = 0;
    stack.push(start);
    seen[start] = 1;

    while (stack.length) {
      const idx = stack.pop() as number;
      blob.push(idx);
      const x = idx % width;
      const y = (idx - x) / width;
      if (x > 0 && data[idx - 1] && !seen[idx - 1]) { seen[idx - 1] = 1; stack.push(idx - 1); }
      if (x < width - 1 && data[idx + 1] && !seen[idx + 1]) { seen[idx + 1] = 1; stack.push(idx + 1); }
      if (y > 0 && data[idx - width] && !seen[idx - width]) { seen[idx - width] = 1; stack.push(idx - width); }
      if (y < height - 1 && data[idx + width] && !seen[idx + width]) { seen[idx + width] = 1; stack.push(idx + width); }
    }

    if (blob.length >= minSize) found.push(blob);
  }

  return found;
}

/** Shoelace area of a polygon. */
function polygonArea(poly: Point[]): number {
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

function cross(o: Point, a: Point, b: Point): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/** Andrew monotone chain convex hull, counter-clockwise, no repeated point. */
function convexHull(points: Point[]): Point[] {
  const sorted = [...points].sort((p, q) => (p[0] === q[0] ? p[1] - q[1] : p[0] - q[0]));
  if (sorted.length < 3) return sorted;

  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/**
 * Picks TL, TR, BR, BL off the hull by diagonal extremes. Sum x+y is smallest
 * at the top left and largest at the bottom right; difference x-y is largest
 * at the top right and smallest at the bottom left.
 */
function cornersFromHull(hull: Point[]): Quad {
  let tl = hull[0];
  let tr = hull[0];
  let br = hull[0];
  let bl = hull[0];

  for (const p of hull) {
    if (p[0] + p[1] < tl[0] + tl[1]) tl = p;
    if (p[0] + p[1] > br[0] + br[1]) br = p;
    if (p[0] - p[1] > tr[0] - tr[1]) tr = p;
    if (p[0] - p[1] < bl[0] - bl[1]) bl = p;
  }

  return [tl, tr, br, bl];
}

function expandQuad(quad: Quad, px: number): Quad {
  const cx = (quad[0][0] + quad[1][0] + quad[2][0] + quad[3][0]) / 4;
  const cy = (quad[0][1] + quad[1][1] + quad[2][1] + quad[3][1]) / 4;
  return quad.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return [
      Math.round((x + (dx / len) * px) * 100) / 100,
      Math.round((y + (dy / len) * px) * 100) / 100,
    ] as Point;
  }) as Quad;
}

export async function findQuad(
  file: string,
  opts: { threshold?: number; floor?: number; expand?: number; minFill?: number; open?: number } = {},
): Promise<{
  quad: Quad;
  width: number;
  height: number;
  coverage: number;
  fill: number;
  spread: number;
  glareOpacity: number;
}> {
  const threshold = opts.threshold ?? 110;
  const floor = opts.floor ?? 32;
  const expand = opts.expand ?? 2;
  const minFill = opts.minFill ?? 0.8;
  const open = opts.open ?? 6;

  const built = await buildMask(file, threshold, floor);
  const { scale, full, luma } = built;
  const mask = morph(morph(built.mask, open, "erode"), open, "dilate");
  const blobs = allBlobs(mask, 1600);
  if (!blobs.length) {
    throw new Error(
      `No dark screen blob found in ${path.basename(file)} at threshold ${threshold}. ` +
        `Try a higher --threshold.`,
    );
  }

  // A powered-off screen is the one dark region that actually fills its own
  // four corner quad. Dark hair, a dark sleeve and a shadowed chair are all
  // large dark blobs too, and on plate-laptop-shoulder the hair silhouette is
  // the biggest of the lot, so picking by size alone finds the wrong thing.
  // Rank by rectangularity first, then take the largest that passes.
  const scored = blobs.map((blob) => {
    const pts: Point[] = blob.map((idx) => {
      const x = idx % mask.width;
      return [x, (idx - x) / mask.width] as Point;
    });
    const corners = cornersFromHull(convexHull(pts));
    const area = polygonArea(corners);
    return { blob, corners, area, fill: area > 0 ? blob.length / area : 0 };
  });

  const passing = scored.filter((s) => s.fill >= minFill);
  const pool = passing.length ? passing : scored;
  if (!passing.length) {
    console.warn(
      `  WARNING: no blob in ${path.basename(file)} filled ${minFill} of its quad. ` +
        `Falling back to the largest. Check the debug PNG closely.`,
    );
  }
  const winner = pool.reduce((a, b) => (b.area > a.area ? b : a));

  // How much highlight the generated panel actually carries, measured rather
  // than guessed. Layer 5 blends the plate's own screen pixels back over the
  // composite, so a panel that is genuinely flat should get glareOpacity 0
  // instead of a wash that dulls the site for no reason.
  const panelLuma = winner.blob.map((idx) => luma[idx]).sort((a, b) => a - b);
  const at = (q: number) => panelLuma[Math.min(panelLuma.length - 1, Math.floor(panelLuma.length * q))];
  const spread = at(0.97) - at(0.03);
  const glareOpacity =
    spread < 8 ? 0 : Math.round(Math.min(0.25, 0.1 + ((spread - 8) / 32) * 0.15) * 100) / 100;

  const scaled = winner.corners.map(([x, y]) => [x * scale, y * scale] as Point) as Quad;
  const quad = expandQuad(scaled, expand);

  return {
    quad,
    width: full.width,
    height: full.height,
    coverage: winner.blob.length / (mask.width * mask.height),
    fill: winner.fill,
    spread,
    glareOpacity,
  };
}

// ---------------------------------------------------------------------------
// Debug overlay
// ---------------------------------------------------------------------------

export async function writeDebugPng(file: string, quad: Quad, width: number, height: number): Promise<string> {
  const stroke = Math.max(4, Math.round(width / 300));
  const dot = stroke * 2.4;
  const label = ["TL", "TR", "BR", "BL"];

  const points = quad.map(([x, y]) => `${x},${y}`).join(" ");
  const dots = quad
    .map(
      ([x, y], i) =>
        `<circle cx="${x}" cy="${y}" r="${dot}" fill="#ff1f1f" />` +
        `<text x="${x + dot * 1.6}" y="${y - dot}" font-family="monospace" font-size="${dot * 3}" fill="#ff1f1f">${label[i]}</text>`,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <polygon points="${points}" fill="none" stroke="#ff1f1f" stroke-width="${stroke}" />
    ${dots}
  </svg>`;

  const dest = file.replace(/\.(png|jpg|jpeg|webp)$/i, ".quad-debug.png");
  await sharp(file)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile(dest);
  return dest;
}

// ---------------------------------------------------------------------------
// plates.json
// ---------------------------------------------------------------------------

type GenerationRecord = {
  generationId: string;
  plateId: string;
  model: string;
  prompt: string;
  seed: number | null;
  resolution: string;
  file: string | null;
  width: number | null;
  height: number | null;
  accepted: boolean | null;
};

type PlateRecord = {
  id: string;
  file: string;
  model: string;
  prompt: string;
  seed: number | null;
  resolution: string;
  width: number;
  height: number;
  quad: Quad;
  glareOpacity: number;
  notes: string;
  captureId: string;
  usedFor: string;
};

type PlatesFile = {
  plates: PlateRecord[];
  generations: GenerationRecord[];
  [k: string]: unknown;
};

function readPlates(): PlatesFile {
  return JSON.parse(fs.readFileSync(PLATES_JSON, "utf8")) as PlatesFile;
}

function writePlates(data: PlatesFile): void {
  fs.writeFileSync(PLATES_JSON, JSON.stringify(data, null, 2) + "\n", "utf8");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): Record<string, string | true> {
  const out: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out[a.slice(2)] = next;
      i += 1;
    } else {
      out[a.slice(2)] = true;
    }
  }
  return out;
}

async function handleOne(
  relFile: string,
  plateId: string,
  args: Record<string, string | true>,
  data: PlatesFile,
): Promise<void> {
  const abs = path.isAbsolute(relFile) ? relFile : path.join(ROOT, relFile);
  const threshold = args.threshold !== undefined ? Number(args.threshold) : 110;
  const floor = args.floor !== undefined ? Number(args.floor) : 32;
  const expand = args.expand !== undefined ? Number(args.expand) : 2;

  const minFill = args["min-fill"] !== undefined ? Number(args["min-fill"]) : 0.8;
  const open = args.open !== undefined ? Number(args.open) : 6;
  const found = await findQuad(abs, { threshold, floor, expand, minFill, open });
  const { quad, width, height, coverage, fill, spread, glareOpacity } = found;
  const debug = await writeDebugPng(abs, quad, width, height);

  console.log(`\n${plateId}  ${relFile}  ${width}x${height}`);
  console.log(
    `  screen blob covers ${(coverage * 100).toFixed(1)} percent of the frame, ` +
      `fills ${(fill * 100).toFixed(1)} percent of its quad`,
  );
  console.log(
    `  panel luma spread ${spread.toFixed(1)} of 255 -> glareOpacity ${glareOpacity}`,
  );
  console.log(`  quad ${JSON.stringify(quad)}`);
  console.log(`  debug ${path.relative(ROOT, debug).split(path.sep).join("/")}`);

  if (args.write) {
    const gen = data.generations.find((g) => g.file === relFile);
    const existing = data.plates.find((p) => p.id === plateId);
    const spec = PLATE_SPECS.find((s) => s.id === plateId);
    const record: PlateRecord = {
      id: plateId,
      file: relFile,
      model: gen?.model ?? existing?.model ?? "unknown",
      prompt: gen?.prompt ?? existing?.prompt ?? "",
      seed: gen?.seed ?? null,
      resolution: gen?.resolution ?? existing?.resolution ?? "2K",
      width,
      height,
      quad,
      glareOpacity: args.glare !== undefined ? Number(args.glare) : glareOpacity,
      notes: existing?.notes ?? "",
      captureId:
        typeof args.capture === "string"
          ? args.capture
          : (existing?.captureId ?? spec?.captureId ?? ""),
      usedFor: existing?.usedFor || (spec?.usedFor ?? ""),
    };
    const at = data.plates.findIndex((p) => p.id === plateId);
    if (at === -1) data.plates.push(record);
    else data.plates[at] = record;
    writePlates(data);
    console.log("  written to config/plates.json");
  }
}

/**
 * Writes a 4x magnified crop with a labelled 25px coordinate grid over it, so
 * a corner the detector got wrong can be read off the plate by eye and typed
 * straight into config/plates.json. Section 4b expects hand correction; this
 * is what makes it quick.
 */
async function writeZoom(file: string, x: number, y: number, w: number, h: number, dest: string): Promise<void> {
  const scale = 4;
  const parts: string[] = [];
  for (let gx = 0; gx <= w; gx += 25) {
    const px = gx * scale;
    parts.push(`<line x1="${px}" y1="0" x2="${px}" y2="${h * scale}" stroke="#00ff88" stroke-width="1" opacity="0.55"/>`);
    parts.push(`<text x="${px + 3}" y="16" font-size="13" fill="#00ff88" font-family="monospace">${x + gx}</text>`);
  }
  for (let gy = 0; gy <= h; gy += 25) {
    const py = gy * scale;
    parts.push(`<line x1="0" y1="${py}" x2="${w * scale}" y2="${py}" stroke="#00ff88" stroke-width="1" opacity="0.55"/>`);
    parts.push(`<text x="3" y="${py - 4}" font-size="13" fill="#00ff88" font-family="monospace">${y + gy}</text>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}">${parts.join("")}</svg>`;

  await sharp(file)
    .extract({ left: x, top: y, width: w, height: h })
    .resize(w * scale, h * scale, { kernel: "nearest" })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile(dest);
  console.log(`zoom written to ${dest}`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (typeof args.zoom === "string" && typeof args.file === "string") {
    const [x, y, w, h] = args.zoom.split(",").map(Number);
    const abs = path.isAbsolute(args.file) ? args.file : path.join(ROOT, args.file);
    const dest = typeof args.out === "string" ? args.out : abs.replace(/\.(png|jpg|jpeg|webp)$/i, `.zoom-${x}-${y}.png`);
    await writeZoom(abs, x, y, w, h, dest);
    return;
  }

  const data = readPlates();

  if (args.all) {
    const accepted = data.generations.filter((g) => g.accepted === true && g.file);
    if (!accepted.length) {
      console.log("No generation in config/plates.json is marked accepted true yet.");
      return;
    }
    for (const gen of accepted) {
      await handleOne(gen.file as string, gen.plateId, args, data);
    }
    return;
  }

  if (typeof args.file !== "string") {
    console.log("Usage: npx tsx scripts/find-quad.ts --file <path> [--plate id] [--write]");
    console.log("       npx tsx scripts/find-quad.ts --all --write");
    process.exitCode = 1;
    return;
  }

  const plateId =
    typeof args.plate === "string"
      ? args.plate
      : (data.generations.find((g) => g.file === args.file)?.plateId ??
        path.basename(args.file).replace(/-c\d+\.(png|jpg|jpeg|webp)$/i, ""));

  await handleOne(args.file, plateId, args, data);
}

const invokedDirectly =
  !!process.argv[1] &&
  path.basename(process.argv[1]) === path.basename(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}

