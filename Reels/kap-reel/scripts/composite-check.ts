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
 * The entry is deliberately separate from src/Root.tsx so this phase does not
 * touch the timeline the other phase owns.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PLATES_JSON = path.join(ROOT, "config", "plates.json");
const GATE_DIR = path.join(ROOT, "out", "gate4");
const ENTRY = "src/plates-entry.ts";

type PlateRecord = {
  id: string;
  file: string;
  captureId: string;
};

function readPlates(): { plates: PlateRecord[] } {
  return JSON.parse(fs.readFileSync(PLATES_JSON, "utf8")) as { plates: PlateRecord[] };
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
    default:
      console.log("Usage: npx tsx scripts/composite-check.ts <sheet|gate> [flags]");
      console.log('  sheet --in "assets/plates/plate-*.png" --out out/gate4/candidates-sheet.png');
      console.log("  gate [--only <plateId>]");
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
