/**
 * Reel QA harness.
 *
 *   npx tsx scripts/qa.ts [--reel web|training|all] [--fast]
 *
 * The owner's brief, in his words: "we really wanna get everything pixel
 * perfect, any way we can really QA this in a meaningful way so I don't keep
 * finding stuff like that." Everything he has found by eye so far was findable
 * by measurement, and this is the measurement.
 *
 * What it does, in order:
 *
 *   1. Builds its own bundle at out/qa/bundle, so it never collides with a
 *      delivery build in out/bundle, and records when it was built.
 *   2. Derives a shot list from the beat maps in src/lib/timing.ts and the
 *      content configs in src/reels, and renders those frames as PNG stills.
 *   3. Runs nine measured checks over them, every one of which answers with a
 *      number rather than an opinion.
 *   4. Writes out/qa/report.md, out/qa/findings.json and a contact sheet per
 *      composition with a red badge on every failing frame.
 *
 * Exits 1 if anything failed. Nothing goes into the Posts folder until this
 * exits 0. See the QA section of README.md.
 *
 * Flags:
 *   --reel web|training|all   which reel to test. Default all.
 *   --fast                    sample fewer frames per beat, for a quick pass.
 *   --only <id>[,<id>]        restrict to named compositions.
 *   --rebundle                force a bundle rebuild.
 *   --concurrency <n>         browsers rendering stills at once. Default 6.
 *   --skip-render             reuse the stills already in out/qa/stills.
 */

import fs from "node:fs";
import path from "node:path";
import {
  CHECK_NAMES,
  captureClips,
  checkContinuity,
  checkMotion,
  runFrameChecks,
  setClipBackdrops,
  type Finding,
} from "./qa/checks";
import { loadRaw, type Raw, type RGB } from "./qa/pixels";
import { reviewPlate, type PlateReview } from "./qa/plates";
import {
  buildBundle,
  renderStills,
  BUNDLE_DIR,
  PROJECT_ROOT,
  QA_DIR,
  STILLS_DIR,
  type StillRequest,
} from "./qa/render";
import {
  countBy,
  writeContactSheet,
  writeFindings,
  writeReport,
  type RunSummary,
} from "./qa/report";
import {
  compositions,
  debugShotsFor,
  platesInUse,
  shotsFor,
  type ReelKey,
  type SampleMode,
  type Shot,
} from "./qa/shots";

type Args = {
  reel: "web" | "training" | "all";
  mode: SampleMode;
  only: string[];
  rebundle: boolean;
  concurrency: number;
  skipRender: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    reel: "all",
    mode: "full",
    only: [],
    rebundle: false,
    concurrency: 6,
    skipRender: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === "--reel") {
      const value = argv[i + 1];
      if (value !== "web" && value !== "training" && value !== "all") {
        throw new Error(`--reel takes web, training or all, not "${value}"`);
      }
      args.reel = value;
      i += 1;
    } else if (flag === "--fast") {
      args.mode = "fast";
    } else if (flag === "--only") {
      args.only = (argv[i + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      i += 1;
    } else if (flag === "--rebundle") {
      args.rebundle = true;
    } else if (flag === "--skip-render") {
      args.skipRender = true;
    } else if (flag === "--concurrency") {
      args.concurrency = Math.max(1, Number(argv[i + 1] ?? 6));
      i += 1;
    } else if (flag === "--help" || flag === "-h") {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`unknown flag "${flag}". Run with --help.`);
    }
  }
  return args;
}

function printUsage(): void {
  console.log(
    [
      "npx tsx scripts/qa.ts [--reel web|training|all] [--fast]",
      "",
      "  --reel <r>          web, training or all. Default all.",
      "  --fast              sample fewer frames per beat.",
      "  --only <ids>        comma separated composition ids.",
      "  --rebundle          force a rebuild of out/qa/bundle.",
      "  --concurrency <n>   browsers rendering at once. Default 6.",
      "  --skip-render       reuse the stills already on disk.",
    ].join("\n"),
  );
}

function stillPath(shot: Shot): string {
  return path.join(STILLS_DIR, shot.composition, `${shot.frame.toString().padStart(4, "0")}.png`);
}

function debugStillPath(id: string, frame: number): string {
  return path.join(QA_DIR, "debug", id, `${frame.toString().padStart(4, "0")}.png`);
}

/** A small LRU so the pair checks do not reload a frame that is already open. */
class RawCache {
  private readonly entries = new Map<string, Raw>();
  constructor(private readonly limit: number) {}
  async get(file: string): Promise<Raw> {
    const hit = this.entries.get(file);
    if (hit) {
      this.entries.delete(file);
      this.entries.set(file, hit);
      return hit;
    }
    const raw = await loadRaw(file);
    this.entries.set(file, raw);
    if (this.entries.size > this.limit) {
      const oldest = this.entries.keys().next().value as string;
      this.entries.delete(oldest);
    }
    return raw;
  }
}

/**
 * The backdrop colour of every clip, read off its own first frame.
 *
 * scripts/capture.ts exports clipBackgroundColor() for this, and its own comment
 * names the ring check as the caller: measuring the backdrop the same way the
 * content box that hides it was measured is what puts check (d) in precise mode.
 * The import is dynamic and guarded, because capture.ts is a large module that
 * shells out to ffmpeg, and a QA run that cannot resolve a backdrop should say
 * so and screen instead of dying.
 */
async function resolveBackdrops(): Promise<{ map: Map<string, RGB>; note: string }> {
  const map = new Map<string, RGB>();
  const clips = captureClips();
  try {
    const capture = await import("./capture");
    for (const clip of clips) {
      const file = path.join(PROJECT_ROOT, clip.path);
      if (!fs.existsSync(file)) continue;
      try {
        map.set(clip.id, await capture.clipBackgroundColor(file));
      } catch {
        // One unreadable clip screens rather than stopping the run.
      }
    }
    return {
      map,
      note: `backdrop resolved for ${map.size} of ${clips.length} clips`,
    };
  } catch (err) {
    return {
      map,
      note:
        "no clip backdrops: scripts/capture.ts could not be loaded, so check (d) " +
        `is screening against near black and near white (${String(err)})`,
    };
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const startedAt = new Date();
  const t0 = Date.now();

  const reels: ReelKey[] =
    args.reel === "all" ? ["web", "training"] : [args.reel as ReelKey];
  let comps = compositions().filter((c) => reels.includes(c.reel));
  if (args.only.length > 0) {
    comps = comps.filter((c) => args.only.includes(c.id));
    if (comps.length === 0) throw new Error(`--only matched no composition`);
  }

  const shots: Shot[] = [];
  for (const comp of comps) shots.push(...shotsFor(comp, args.mode));

  const debugShots = comps.flatMap((comp) =>
    debugShotsFor(comp).map((d) => ({ ...d, composition: comp.id })),
  );

  console.log(
    `QA: ${comps.length} compositions, ${shots.length} stills, ` +
      `${debugShots.length} debug stills, mode ${args.mode}`,
  );

  const bundleInfo = await buildBundle(args.rebundle);
  console.log(
    `bundle ${bundleInfo.reused ? "reused" : `built in ${bundleInfo.seconds.toFixed(1)}s`}` +
      `, ${BUNDLE_DIR}, ${bundleInfo.builtAt}`,
  );

  if (!args.skipRender) {
    fs.rmSync(STILLS_DIR, { recursive: true, force: true });
    fs.rmSync(path.join(QA_DIR, "debug"), { recursive: true, force: true });
    const requests: StillRequest[] = [
      ...shots.map((s) => ({
        compositionId: s.composition,
        frame: s.frame,
        output: stillPath(s),
      })),
      ...debugShots.map((d) => ({
        compositionId: d.id,
        frame: d.frame,
        output: debugStillPath(d.id, d.frame),
      })),
    ];
    const renderStart = Date.now();
    let lastPct = -1;
    await renderStills(requests, {
      serveUrl: bundleInfo.serveUrl,
      concurrency: args.concurrency,
      onDone: (done, total) => {
        const pct = Math.floor((done / total) * 100);
        if (pct !== lastPct && pct % 5 === 0) {
          lastPct = pct;
          process.stdout.write(`  rendering ${done}/${total}\r`);
        }
      },
    });
    process.stdout.write("                              \r");
    console.log(
      `rendered ${requests.length} stills in ${((Date.now() - renderStart) / 1000).toFixed(1)}s`,
    );
  } else {
    console.log("reusing the stills already in out/qa/stills");
  }

  // ---------------------------------------------------------------------
  // Measure
  // ---------------------------------------------------------------------
  const backdrops = await resolveBackdrops();
  setClipBackdrops(backdrops.map);
  console.log(backdrops.note);

  const findings: Finding[] = [];
  const cache = new RawCache(8);
  const byKey = new Map(shots.map((s) => [s.key, s]));

  let measured = 0;
  for (const shot of shots) {
    const file = stillPath(shot);
    if (!fs.existsSync(file)) {
      findings.push({
        composition: shot.composition,
        shot: shot.key,
        frame: shot.frame,
        label: shot.label,
        check: "e",
        verdict: "FAIL",
        detail: `still was never rendered: ${path.relative(PROJECT_ROOT, file)}`,
        metrics: {},
      });
      continue;
    }
    const raw = await cache.get(file);
    findings.push(...runFrameChecks(raw, shot).findings);
    measured += 1;
    if (measured % 25 === 0) {
      process.stdout.write(`  measuring ${measured}/${shots.length}\r`);
    }
  }
  process.stdout.write("                              \r");

  // Pair checks: (h) across the cut, (i) at the end of every clean shot.
  const pairKey = (composition: string, frame: number) =>
    `${composition}-${String(frame).padStart(4, "0")}`;

  for (const shot of shots) {
    if (shot.scene !== "project") continue;

    if (shot.phase === "cleanStart") {
      const before = byKey.get(pairKey(shot.composition, shot.frame - 1));
      if (before && before.phase === "plateEnd" && fs.existsSync(stillPath(before))) {
        findings.push(
          checkContinuity(
            shot,
            await cache.get(stillPath(before)),
            await cache.get(stillPath(shot)),
          ),
        );
      }
    }

    if (shot.phase === "end-1") {
      const before = byKey.get(pairKey(shot.composition, shot.frame - 1));
      if (before && before.phase === "end-2" && fs.existsSync(stillPath(before))) {
        findings.push(
          checkMotion(
            shot,
            await cache.get(stillPath(before)),
            await cache.get(stillPath(shot)),
          ),
        );
      }
    }
  }

  // ---------------------------------------------------------------------
  // Check g, the plate review crops
  // ---------------------------------------------------------------------
  fs.rmSync(path.join(QA_DIR, "plates"), { recursive: true, force: true });
  const plates: PlateReview[] = [];
  for (const { plateId, usedBy } of platesInUse(reels)) {
    const review = await reviewPlate(PROJECT_ROOT, QA_DIR, plateId, usedBy);
    plates.push(review);
    findings.push({
      composition: "plates",
      shot: plateId,
      frame: 0,
      label: `plate ${plateId}`,
      check: "g",
      verdict: "REVIEW",
      detail:
        `${review.cornerCrops.length} quad corner crops and ${review.skinCrops.length} ` +
        `skin crops in out/qa/plates/${plateId}/` +
        (review.notes.length > 0 ? `; ${review.notes.join("; ")}` : ""),
      metrics: {
        cornerCrops: review.cornerCrops.length,
        skinCrops: review.skinCrops.length,
      },
    });
  }
  console.log(`plate review crops written for ${plates.length} plates`);

  // ---------------------------------------------------------------------
  // Report
  // ---------------------------------------------------------------------
  const finishedAt = new Date();
  const summary: RunSummary = {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    bundleBuiltAt: bundleInfo.builtAt,
    bundleReused: bundleInfo.reused,
    mode: args.mode,
    reels,
    compositions: comps.map((c) => c.id),
    stills: shots.length,
    debugStills: debugShots.length,
    backdrops: backdrops.note,
    seconds: (Date.now() - t0) / 1000,
  };

  fs.rmSync(path.join(QA_DIR, "sheets"), { recursive: true, force: true });
  for (const comp of comps) {
    await writeContactSheet(QA_DIR, comp.id, shots, findings, stillPath);
  }
  console.log(`contact sheets written for ${comps.length} compositions`);

  writeReport(QA_DIR, summary, shots, findings, plates);
  writeFindings(QA_DIR, summary, findings, plates);

  const counts = countBy(findings);
  console.log("");
  console.log(
    `${counts.FAIL} FAIL, ${counts.REVIEW} REVIEW, ${counts.PASS} PASS, ${counts.SKIP} not applicable`,
  );
  if (counts.FAIL > 0) {
    const grouped = new Map<string, number>();
    for (const f of findings) {
      if (f.verdict !== "FAIL") continue;
      const key = `${f.check} ${CHECK_NAMES[f.check]}`;
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }
    for (const [key, n] of [...grouped.entries()].sort()) {
      console.log(`  ${key}: ${n}`);
    }
  }
  console.log(`report: ${path.relative(PROJECT_ROOT, path.join(QA_DIR, "report.md"))}`);
  console.log(`in ${summary.seconds.toFixed(1)}s`);

  process.exit(counts.FAIL > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
