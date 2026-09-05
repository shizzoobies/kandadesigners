/**
 * scripts/composite-check.ts
 *
 * Phase 4 inspection tooling.
 *
 *   npx tsx scripts/composite-check.ts sheet --in "assets/plates/plate-*.png"
 *                                            --out out/gate4/candidates-sheet.png
 *                                            [--cols 5] [--cell 420]
 *
 *   npx tsx scripts/composite-check.ts gate [--only <plateId>]
 *     Renders one 1080x1920 composite still per plate that has a capture
 *     assigned, through the standalone entry src/plates-entry.ts, into
 *     out/gate4/composite-<plateId>.png, then tiles them into
 *     out/gate4/composites-sheet.png.
 *
 *   npx tsx scripts/composite-check.ts ring [--out out/_fill/after] [--only <id>]
 *     The mechanical version of "is there dead backdrop inside the device".
 *     Renders the same stills, maps each plate's quad through the same
 *     transform PlateComposite applies, samples a ring 6px inside the quad
 *     edge, and reports the fraction of ring pixels that are still the
 *     capture's own backdrop colour. Under 2 percent is a pass.
 *
 * The entry is deliberately separate from src/Root.tsx so this phase does not
 * touch the timeline the other phase owns.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { noise2D } from "@remotion/noise";
import sharp from "sharp";
import { fillRegion, isFullFrame } from "../src/lib/content-fill";
import { clipBackgroundColor } from "./capture";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PLATES_JSON = path.join(ROOT, "config", "plates.json");
const CAPTURES_JSON = path.join(ROOT, "assets", "captures", "captures.json");
const GATE_DIR = path.join(ROOT, "out", "gate4");
const ENTRY = "src/plates-entry.ts";

type Quad = [number, number][];

type PlateRecord = {
  id: string;
  file: string;
  captureId: string;
  width: number;
  height: number;
  quad: Quad;
  retired?: boolean;
};

function readPlates(): { plates: PlateRecord[] } {
  return JSON.parse(fs.readFileSync(PLATES_JSON, "utf8")) as { plates: PlateRecord[] };
}

type CaptureRecord = {
  id: string;
  path: string;
  width: number;
  height: number;
  contentBox?: { x: number; y: number; w: number; h: number };
};

/**
 * Whether this clip has a backdrop at all.
 *
 * A clip whose content box is the whole frame is a page that fills its
 * viewport, and there is no raw backdrop anywhere in it for the composite to
 * show. The ring below still measures such a plate, because the measurement is
 * cheap and a regression would show up in it, but a high reading there is the
 * page's own background colour matching the corner pixel the box was measured
 * from, not dead backdrop inside the device.
 */
function hasMargin(capture: CaptureRecord): boolean {
  const box = capture.contentBox;
  if (!box) return false;
  return !(box.x === 0 && box.y === 0 && box.w === capture.width && box.h === capture.height);
}

function readCaptures(): CaptureRecord[] {
  return JSON.parse(fs.readFileSync(CAPTURES_JSON, "utf8")) as CaptureRecord[];
}

// ---------------------------------------------------------------------------
// Contact sheet
// ---------------------------------------------------------------------------

export async function buildSheet(
  files: string[],
  out: string,
  opts: { cols?: number; cell?: number } = {},
): Promise<void> {
  if (!files.length) throw new Error("No input files matched.");

  const cols = opts.cols ?? Math.min(5, files.length);
  const cell = opts.cell ?? 420;
  const label = 34;
  const pad = 10;
  const rows = Math.ceil(files.length / cols);

  const cellW = cell;
  const cellH = Math.round(cell * (16 / 9));
  const sheetW = cols * (cellW + pad) + pad;
  const sheetH = rows * (cellH + label + pad) + pad;

  const composites: Parameters<ReturnType<typeof sharp>["composite"]>[0] = [];

  for (let i = 0; i < files.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const left = pad + col * (cellW + pad);
    const top = pad + row * (cellH + label + pad);

    const thumb = await sharp(files[i])
      .resize(cellW, cellH, { fit: "contain", background: { r: 20, g: 18, b: 16 } })
      .png()
      .toBuffer();
    composites.push({ input: thumb, left, top });

    const name = path.basename(files[i]).replace(/\.(png|jpg|jpeg|webp)$/i, "");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cellW}" height="${label}">
      <rect width="${cellW}" height="${label}" fill="#14110f"/>
      <text x="6" y="23" font-family="monospace" font-size="17" fill="#f0ece6">${name}</text>
    </svg>`;
    composites.push({ input: Buffer.from(svg), left, top: top + cellH });
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp({
    create: { width: sheetW, height: sheetH, channels: 3, background: { r: 10, g: 9, b: 8 } },
  })
    .composite(composites)
    .png()
    .toFile(out);

  console.log(`sheet: ${files.length} images -> ${path.relative(ROOT, out).split(path.sep).join("/")} (${sheetW}x${sheetH})`);
}

/** Minimal glob: directory plus a single "*" in the basename. */
function expand(pattern: string): string[] {
  const abs = path.isAbsolute(pattern) ? pattern : path.join(ROOT, pattern);
  const dir = path.dirname(abs);
  const base = path.basename(abs);
  if (!base.includes("*")) return fs.existsSync(abs) ? [abs] : [];
  const rx = new RegExp(`^${base.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`, "i");
  return fs
    .readdirSync(dir)
    .filter((f) => rx.test(f))
    .sort()
    .map((f) => path.join(dir, f));
}

// ---------------------------------------------------------------------------
// Gate stills
// ---------------------------------------------------------------------------

/** Mid shot, so the scale ramp and the drift are both partway through. */
const STILL_FRAME = 24;

function renderStill(compositionId: string, out: string, frame: number): boolean {
  console.log(`  rendering ${compositionId} at frame ${frame}`);
  // Node directly on the CLI entry, not npx through a shell. The repo lives
  // behind a directory junction whose real path contains spaces and an
  // ampersand, and npx.cmd under shell true splits that path apart: it ends up
  // looking for D:\@remotion\cli\remotion-cli.js and reporting that "A" is not
  // a recognised command. Spawning without a shell passes the path intact.
  const res = spawnSync(
    process.execPath,
    [
      path.join(ROOT, "node_modules", "@remotion", "cli", "remotion-cli.js"),
      "still",
      ENTRY,
      compositionId,
      out,
      "--frame",
      String(frame),
      "--image-format",
      "png",
      "--log",
      "error",
    ],
    { cwd: ROOT, stdio: "inherit" },
  );
  if (res.status !== 0) {
    console.log(`  FAILED ${compositionId} (exit ${res.status})`);
    return false;
  }
  return true;
}

async function cmdGate(only: string | null, frame: number): Promise<void> {
  const { plates } = readPlates();
  const targets = plates.filter((p) => p.captureId && (!only || p.id === only));
  if (!targets.length) {
    console.log("No plate in config/plates.json has a captureId assigned yet.");
    return;
  }

  fs.mkdirSync(GATE_DIR, { recursive: true });
  const made: string[] = [];

  for (const plate of targets) {
    const out = path.join(GATE_DIR, `composite-${plate.id}.png`);
    if (renderStill(`PlateCheck-${plate.id}`, out, frame)) made.push(out);
  }

  if (made.length > 1) {
    await buildSheet(made, path.join(GATE_DIR, "composites-sheet.png"), { cols: 4, cell: 460 });
  }
  console.log(`\n${made.length} of ${targets.length} composites rendered into out/gate4/.`);
}

// ---------------------------------------------------------------------------
// Ring check
// ---------------------------------------------------------------------------

/**
 * These four have to track src/components/PlateComposite.tsx and
 * src/PlateCheck.tsx exactly, because the whole point of this check is to
 * measure the pixels the composite actually drew rather than the pixels it was
 * meant to draw. A drift of one frame or one noise seed puts the ring on the
 * bezel and reports a pass that is not one.
 */
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const SHOT_FRAMES = 48;
const SCALE_RAMP = 0.03;
const DRIFT_PX = 5;
const DRIFT_PERIOD_FRAMES = 90;

/** How far inside the quad edge the ring sits, in canvas pixels. */
const RING_INSET = 6;

/**
 * How close a ring pixel has to be to the capture's backdrop colour, summed
 * across the three channels, before it counts as backdrop that should not be
 * there. Deliberately tight: the seat shadow of layer 3 darkens everything
 * along this ring, and a page pixel darkened is still nowhere near the flat
 * black the safety deck is mounted on.
 */
const RING_MATCH_THRESHOLD = 12;

/** Anything above this is dead backdrop inside the device. */
const RING_FAIL_FRACTION = 0.02;

/**
 * A plate point mapped into canvas pixels, through the same layer 1 transform
 * PlateComposite applies: the plate laid out at its own size, centred on the
 * canvas, then translated by the handheld drift and scaled to cover about its
 * own centre.
 */
function plateToCanvas(
  plate: PlateRecord,
  point: [number, number],
  frame: number,
): [number, number] {
  const cover = Math.max(CANVAS_WIDTH / plate.width, CANVAS_HEIGHT / plate.height);
  const ramp = 1 + SCALE_RAMP * (frame / Math.max(1, SHOT_FRAMES - 1));
  const s = cover * ramp;
  const driftX = noise2D(`${plate.id}-x`, frame / DRIFT_PERIOD_FRAMES, 0) * DRIFT_PX;
  const driftY = noise2D(`${plate.id}-y`, frame / DRIFT_PERIOD_FRAMES, 11.3) * DRIFT_PX;
  return [
    CANVAS_WIDTH / 2 + (point[0] - plate.width / 2) * s + driftX,
    CANVAS_HEIGHT / 2 + (point[1] - plate.height / 2) * s + driftY,
  ];
}

/**
 * Points along a ring RING_INSET pixels inside the quad's edges, one per pixel
 * of perimeter. Each edge is walked and pushed along its own inward normal,
 * rather than the whole polygon being shrunk toward its centroid, because a
 * shrink moves a long edge less than a short one and this quad is a screen seen
 * at an angle.
 */
function ringPoints(canvasQuad: [number, number][]): [number, number][] {
  const cx = canvasQuad.reduce((a, p) => a + p[0], 0) / 4;
  const cy = canvasQuad.reduce((a, p) => a + p[1], 0) / 4;
  const points: [number, number][] = [];

  for (let i = 0; i < 4; i += 1) {
    const a = canvasQuad[i];
    const b = canvasQuad[(i + 1) % 4];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len < 1) continue;
    let nx = -dy / len;
    let ny = dx / len;
    const midX = (a[0] + b[0]) / 2;
    const midY = (a[1] + b[1]) / 2;
    if (nx * (cx - midX) + ny * (cy - midY) < 0) {
      nx = -nx;
      ny = -ny;
    }
    const steps = Math.max(2, Math.round(len));
    for (let k = 0; k < steps; k += 1) {
      const t = k / steps;
      points.push([
        a[0] + dx * t + nx * RING_INSET,
        a[1] + dy * t + ny * RING_INSET,
      ]);
    }
  }

  return points;
}

/**
 * Frame of the capture PlateCheck's composites are showing.
 *
 * PlateCheck passes no captureFrameOffset, so PlateComposite's default of 20
 * applies, and at composition frame 24 with playbackRate 1 the video is on
 * source frame 44. Only used to sample the source pixel a ring point came from.
 */
const PLATE_CHECK_CAPTURE_OFFSET = 20;

// ---------------------------------------------------------------------------
// The inverse of the warp, so a rendered pixel can be traced back to the
// capture pixel it came from.
//
// Written out here rather than imported from src/lib/plates.ts, which reaches
// for remotion's staticFile and cannot be loaded outside a render. An
// independent implementation is worth something anyway: a check that shares its
// arithmetic with the thing it checks agrees with it by construction.
// ---------------------------------------------------------------------------

type Point = [number, number];

function solveLinear(matrix: number[][], rhs: number[]): number[] {
  const n = rhs.length;
  const a = matrix.map((row, i) => [...row, rhs[i]]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    if (Math.abs(a[pivot][col]) < 1e-12) throw new Error("Degenerate quad.");
    const swap = a[col];
    a[col] = a[pivot];
    a[pivot] = swap;
    const diag = a[col][col];
    for (let k = col; k <= n; k += 1) a[col][k] /= diag;
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = a[row][col];
      if (factor === 0) continue;
      for (let k = col; k <= n; k += 1) a[row][k] -= factor * a[col][k];
    }
  }
  return a.map((row) => row[n]);
}

/** The eight coefficients of the projective map carrying src onto dst. */
function solveProjective(src: Point[], dst: Point[]): number[] {
  const matrix: number[][] = [];
  const rhs: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    const [u, v] = src[i];
    const [x, y] = dst[i];
    matrix.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
    rhs.push(x);
    matrix.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
    rhs.push(y);
  }
  return solveLinear(matrix, rhs);
}

function applyProjective(h: number[], p: Point): Point {
  const [a, b, c, d, e, f, g, i] = h;
  const w = g * p[0] + i * p[1] + 1;
  return [(a * p[0] + b * p[1] + c) / w, (d * p[0] + e * p[1] + f) / w];
}

/** The same average-of-opposite-edges size src/lib/plates.ts warps into. */
function quadSourceSize(quad: Quad): { width: number; height: number } {
  const dist = (p: number[], q: number[]) => Math.hypot(q[0] - p[0], q[1] - p[1]);
  return {
    width: Math.round((dist(quad[0], quad[1]) + dist(quad[3], quad[2])) / 2),
    height: Math.round((dist(quad[0], quad[3]) + dist(quad[1], quad[2])) / 2),
  };
}

type RingResult = {
  plateId: string;
  captureId: string;
  background: [number, number, number];
  sampled: number;
  backdrop: number;
  fraction: number;
  /** Fraction of ring points that trace back to a capture pixel outside the box. */
  outside: number;
  /** The same colour test run on the source pixels the ring points came from. */
  sourceFraction: number;
  margin: boolean;
};

type RawImage = { data: Buffer; width: number; height: number; channels: number };

/** One frame of a clip as raw pixels. */
function clipFrameRaw(videoPath: string, frameIndex: number): Promise<RawImage> {
  const tmp = path.join(
    GATE_DIR,
    `.ring-frame-${path.basename(videoPath, ".mp4")}-${String(frameIndex)}.png`,
  );
  fs.mkdirSync(GATE_DIR, { recursive: true });
  const res = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-i",
      videoPath,
      "-vf",
      `select=eq(n\\,${String(frameIndex)})`,
      "-vsync",
      "0",
      "-frames:v",
      "1",
      tmp,
    ],
    { encoding: "utf8" },
  );
  if (res.status !== 0) throw new Error(`ffmpeg frame extract failed for ${videoPath}`);
  return sharp(tmp)
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      fs.rmSync(tmp, { force: true });
      return { data, width: info.width, height: info.height, channels: info.channels };
    });
}

/** Inverse of plateToCanvas. */
function canvasToPlate(plate: PlateRecord, point: Point, frame: number): Point {
  const cover = Math.max(CANVAS_WIDTH / plate.width, CANVAS_HEIGHT / plate.height);
  const s = cover * (1 + SCALE_RAMP * (frame / Math.max(1, SHOT_FRAMES - 1)));
  const driftX = noise2D(`${plate.id}-x`, frame / DRIFT_PERIOD_FRAMES, 0) * DRIFT_PX;
  const driftY = noise2D(`${plate.id}-y`, frame / DRIFT_PERIOD_FRAMES, 11.3) * DRIFT_PX;
  return [
    (point[0] - CANVAS_WIDTH / 2 - driftX) / s + plate.width / 2,
    (point[1] - CANVAS_HEIGHT / 2 - driftY) / s + plate.height / 2,
  ];
}

function diffFrom(
  img: RawImage,
  x: number,
  y: number,
  colour: [number, number, number],
): number | null {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= img.width || py >= img.height) return null;
  const i = (py * img.width + px) * img.channels;
  return (
    Math.abs(img.data[i] - colour[0]) +
    Math.abs(img.data[i + 1] - colour[1]) +
    Math.abs(img.data[i + 2] - colour[2])
  );
}

async function measureRing(
  plate: PlateRecord,
  stillPath: string,
  capture: CaptureRecord,
  frame: number,
): Promise<RingResult> {
  const capturePath = path.join(ROOT, capture.path);
  const background = await clipBackgroundColor(capturePath);
  const still = await sharp(stillPath)
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => ({
      data,
      width: info.width,
      height: info.height,
      channels: info.channels,
    }));
  const source = await clipFrameRaw(capturePath, PLATE_CHECK_CAPTURE_OFFSET + frame);

  const canvasQuad = plate.quad.map((p) => plateToCanvas(plate, p, frame));
  const points = ringPoints(canvasQuad);

  // The warp maps the rectangle 0,0 to sw,sh onto the quad, so its inverse is
  // the projective map from the quad's corners back onto that rectangle.
  const size = quadSourceSize(plate.quad);
  const toLayer = solveProjective(plate.quad, [
    [0, 0],
    [size.width, 0],
    [size.width, size.height],
    [0, size.height],
  ]);

  // How layer pixels become capture pixels, which is the branch PlateComposite
  // takes for this clip.
  const box = capture.contentBox ?? {
    x: 0,
    y: 0,
    w: capture.width,
    h: capture.height,
  };
  const filled = !isFullFrame(box, capture.width, capture.height);
  const region = filled
    ? fillRegion(box, capture.width, capture.height, size.width / size.height)
    : { x: 0, y: 0, w: capture.width, h: capture.height };
  const k = filled
    ? size.width / region.w
    : Math.max(size.width / capture.width, size.height / capture.height);

  let sampled = 0;
  let backdrop = 0;
  let outside = 0;
  let sourceBackdrop = 0;

  for (const point of points) {
    const rendered = diffFrom(still, point[0], point[1], background);
    if (rendered === null) continue;
    sampled += 1;
    if (rendered <= RING_MATCH_THRESHOLD) backdrop += 1;

    const [u, v] = applyProjective(toLayer, canvasToPlate(plate, point, frame));
    const cx = region.x + u / k;
    const cy = region.y + v / k;
    if (cx < box.x || cy < box.y || cx >= box.x + box.w || cy >= box.y + box.h) {
      outside += 1;
    }
    const src = diffFrom(source, cx, cy, background);
    if (src !== null && src <= RING_MATCH_THRESHOLD) sourceBackdrop += 1;
  }

  return {
    plateId: plate.id,
    captureId: plate.captureId,
    background,
    sampled,
    backdrop,
    fraction: sampled === 0 ? 0 : backdrop / sampled,
    outside: sampled === 0 ? 0 : outside / sampled,
    sourceFraction: sampled === 0 ? 0 : sourceBackdrop / sampled,
    margin: hasMargin(capture),
  };
}

async function cmdRing(
  outDir: string,
  only: string | null,
  frame: number,
  reuse: boolean,
): Promise<void> {
  const { plates } = readPlates();
  const captures = readCaptures();
  const targets = plates.filter(
    (p) => p.captureId && p.retired !== true && (!only || p.id === only),
  );
  if (!targets.length) {
    console.log("No plate in config/plates.json is both live and bound to a capture.");
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });
  const results: RingResult[] = [];

  for (const plate of targets) {
    const still = path.join(outDir, `composite-${plate.id}.png`);
    // --reuse re-measures stills already in outDir. Only ever correct when the
    // composite has not changed since they were rendered.
    if (!(reuse && fs.existsSync(still)) && !renderStill(`PlateCheck-${plate.id}`, still, frame)) {
      continue;
    }
    const capture = captures.find((c) => c.id === plate.captureId);
    if (!capture) {
      console.log(`  ${plate.id}: capture ${plate.captureId} is not in captures.json`);
      continue;
    }
    results.push(await measureRing(plate, still, capture, frame));
  }

  const idWidth = Math.max(8, ...results.map((r) => r.plateId.length));
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
  console.log(`\nRing check, ${String(RING_INSET)}px inside the quad, frame ${String(frame)}`);
  console.log(
    `${"plate".padEnd(idWidth)}  rendered   source  offpage  margin  bg colour`,
  );
  for (const r of results) {
    const flag = r.outside > RING_FAIL_FRACTION ? "  FAIL" : "";
    console.log(
      `${r.plateId.padEnd(idWidth)}  ${pct(r.fraction).padStart(8)}  ` +
        `${pct(r.sourceFraction).padStart(7)}  ${pct(r.outside).padStart(7)}  ` +
        `${(r.margin ? "yes" : "no").padStart(6)}  ${r.background.join(",")}${flag}`,
    );
  }

  console.log(
    "\nrendered: ring pixels in the composite within " +
      `${String(RING_MATCH_THRESHOLD)} of the capture's backdrop colour.` +
      "\nsource:   the same test on the capture pixel each ring point traces back to, which is " +
      "the floor\n          the rendered figure cannot go below while the page's own edge is " +
      "that colour." +
      "\noffpage:  ring points tracing back outside the capture's content box. This is the one " +
      "that\n          means dead backdrop inside the device, and the one that has to be under " +
      `${String(RING_FAIL_FRACTION * 100)} percent.`,
  );

  const failed = results.filter((r) => r.outside > RING_FAIL_FRACTION);
  console.log(
    `\n${String(results.length - failed.length)} of ${String(results.length)} composites are ` +
      `under ${String(RING_FAIL_FRACTION * 100)} percent off page.`,
  );
  if (failed.length > 0) process.exitCode = 1;
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

async function main(): Promise<void> {
  const [, , cmd, ...rest] = process.argv;
  const args = parseArgs(rest);

  switch (cmd) {
    case "sheet": {
      const pattern = typeof args.in === "string" ? args.in : "assets/plates/plate-*.png";
      const files = expand(pattern).filter((f) => !/quad-debug|zoom-/i.test(f));
      const out =
        typeof args.out === "string"
          ? path.isAbsolute(args.out)
            ? args.out
            : path.join(ROOT, args.out)
          : path.join(GATE_DIR, "candidates-sheet.png");
      await buildSheet(files, out, {
        cols: args.cols !== undefined ? Number(args.cols) : undefined,
        cell: args.cell !== undefined ? Number(args.cell) : undefined,
      });
      break;
    }
    case "gate":
      await cmdGate(
        typeof args.only === "string" ? args.only : null,
        args.frame !== undefined ? Number(args.frame) : STILL_FRAME,
      );
      break;
    case "ring": {
      const dir =
        typeof args.out === "string"
          ? path.isAbsolute(args.out)
            ? args.out
            : path.join(ROOT, args.out)
          : path.join(ROOT, "out", "_fill", "ring");
      await cmdRing(
        dir,
        typeof args.only === "string" ? args.only : null,
        args.frame !== undefined ? Number(args.frame) : STILL_FRAME,
        args.reuse === true,
      );
      break;
    }
    default:
      console.log("Usage: npx tsx scripts/composite-check.ts <sheet|gate|ring> [flags]");
      console.log('  sheet --in "assets/plates/plate-*.png" --out out/gate4/candidates-sheet.png');
      console.log("  gate [--only <plateId>]");
      console.log("  ring [--out out/_fill/ring] [--only <plateId>] [--frame 24] [--reuse]");
      process.exitCode = 1;
  }
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
