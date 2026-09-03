/**
 * scripts/measure.ts
 *
 * Lighthouse measurement for the K&A Performance showcase reel.
 * See kap-reel-handoff.md Section 5.
 *
 * Every number that appears on screen in the reel gets measured here. No
 * fabricated metrics. Three runs per URL, median taken, mobile preset,
 * performance and accessibility only.
 *
 * Run:  npx tsx scripts/measure.ts [flags]
 *
 * Flags:
 *   --project <id>   Only measure this project id.
 *   --runs <n>       Runs per URL. Default 3.
 *   --url <url>      Ad hoc single URL. Bypasses the manifest and writes to
 *                    config/metrics.selftest.json. For proving the script
 *                    works against the owner's own site.
 *
 * The clearance gate is the same as capture.ts and is non-negotiable, except
 * under --url which measures exactly the one URL it was handed.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PROJECTS_FILE = path.join(ROOT, "config", "projects.json");
const METRICS_FILE = path.join(ROOT, "config", "metrics.json");
const SELFTEST_METRICS_FILE = path.join(ROOT, "config", "metrics.selftest.json");

/** Only surface a metric if it is genuinely strong. Handoff Section 5. */
const PERFORMANCE_THRESHOLD = 90;
const ACCESSIBILITY_THRESHOLD = 95;

const DEFAULT_RUNS = 3;

type ApprovedProject = {
  id: string;
  url: string;
  cleared_for_public_showcase: boolean;
  capture_routes?: string[];
};

type ProjectsManifest = {
  approved?: ApprovedProject[];
};

type Result = {
  project: string;
  url: string;
  runs: number;
  performance: number | null;
  accessibility: number | null;
  lcpMs: number | null;
  cls: number | null;
  tbtMs: number | null;
  worthShowing: {
    performance: boolean;
    accessibility: boolean;
  };
};

type MetricsFile = {
  measuredAt: string;
  results: Result[];
};

type RunSample = {
  performance: number | null;
  accessibility: number | null;
  lcpMs: number | null;
  cls: number | null;
  tbtMs: number | null;
};

type Cli = {
  project: string | null;
  runs: number;
  url: string | null;
};

function parseCli(argv: string[]): Cli {
  const cli: Cli = { project: null, runs: DEFAULT_RUNS, url: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--project":
        cli.project = argv[++i] ?? null;
        break;
      case "--url":
        cli.url = argv[++i] ?? null;
        break;
      case "--runs": {
        const value = Number(argv[++i]);
        if (!Number.isInteger(value) || value < 1) {
          throw new Error("--runs must be a positive integer");
        }
        cli.runs = value;
        break;
      }
      default:
        if (arg.startsWith("--")) throw new Error(`Unknown flag: ${arg}`);
        break;
    }
  }
  return cli;
}

/**
 * Same blocking gate as capture.ts. Nothing launches Chrome until at least one
 * project is cleared for public showcase and has a real URL.
 */
function loadApprovedProjects(): ApprovedProject[] {
  if (!fs.existsSync(PROJECTS_FILE)) {
    console.error(`Clearance gate: ${PROJECTS_FILE} does not exist.`);
    console.error("Ask the owner to fill it in before measuring anything. Nothing was launched.");
    process.exit(1);
  }

  let manifest: ProjectsManifest;
  try {
    manifest = JSON.parse(fs.readFileSync(PROJECTS_FILE, "utf8")) as ProjectsManifest;
  } catch (err) {
    console.error(`Clearance gate: ${PROJECTS_FILE} is not valid JSON.`);
    console.error(String(err));
    process.exit(1);
  }

  const all = Array.isArray(manifest.approved) ? manifest.approved : [];
  const cleared = all.filter(
    (p) =>
      p &&
      p.cleared_for_public_showcase === true &&
      typeof p.url === "string" &&
      p.url.length > 0 &&
      !p.url.startsWith("FILL_IN"),
  );

  if (cleared.length === 0) {
    console.error("Clearance gate: no projects are cleared for measurement.");
    console.error(`File: ${PROJECTS_FILE}`);
    console.error(
      `Found ${all.length} entr${all.length === 1 ? "y" : "ies"} under "approved", none of which had ` +
        'cleared_for_public_showcase === true and a url that is not a "FILL_IN" placeholder.',
    );
    console.error("No browser was launched and nothing was measured.");
    process.exit(1);
  }

  return cleared;
}

function median(values: number[]): number | null {
  const clean = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (clean.length === 0) return null;
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 === 1 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
}

/** One Lighthouse pass. Mobile preset, performance and accessibility only. */
async function runLighthouseOnce(url: string): Promise<RunSample> {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  try {
    const runnerResult = await lighthouse(
      url,
      {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        onlyCategories: ["performance", "accessibility"],
        formFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75,
          disabled: false,
        },
      },
    );

    if (!runnerResult) throw new Error("Lighthouse returned no result");
    const lhr = runnerResult.lhr;

    const score = (id: string): number | null => {
      const raw = lhr.categories[id]?.score;
      return typeof raw === "number" ? Math.round(raw * 100) : null;
    };
    const audit = (id: string): number | null => {
      const raw = lhr.audits[id]?.numericValue;
      return typeof raw === "number" ? raw : null;
    };

    return {
      performance: score("performance"),
      accessibility: score("accessibility"),
      lcpMs: audit("largest-contentful-paint"),
      cls: audit("cumulative-layout-shift"),
      tbtMs: audit("total-blocking-time"),
    };
  } finally {
    // On Windows chrome-launcher often loses the race to delete its own temp
    // profile and throws EPERM. That is cleanup noise, not a failed run, and
    // it must not take the measurement down with it.
    try {
      await chrome.kill();
    } catch (err) {
      const msg = (err as Error).message.split("\n")[0];
      console.log(`  (chrome cleanup warning, ignored: ${msg})`);
    }
  }
}

async function measureUrl(projectId: string, url: string, runs: number): Promise<Result | null> {
  console.log(`\n[${projectId}] ${url}`);
  const samples: RunSample[] = [];

  for (let i = 1; i <= runs; i += 1) {
    try {
      const sample = await runLighthouseOnce(url);
      samples.push(sample);
      console.log(
        `  run ${i}/${runs}: perf ${String(sample.performance)}, a11y ${String(sample.accessibility)}, ` +
          `LCP ${sample.lcpMs === null ? "n/a" : `${Math.round(sample.lcpMs)}ms`}`,
      );
    } catch (err) {
      console.error(`  run ${i}/${runs} failed: ${(err as Error).message.split("\n")[0]}`);
    }
  }

  if (samples.length === 0) {
    console.error(`  no successful runs for ${url}, skipping`);
    return null;
  }

  const pick = (key: keyof RunSample): number | null =>
    median(samples.map((s) => s[key]).filter((v): v is number => typeof v === "number"));

  const performance = pick("performance");
  const accessibility = pick("accessibility");
  const lcpMs = pick("lcpMs");
  const cls = pick("cls");
  const tbtMs = pick("tbtMs");

  return {
    project: projectId,
    url,
    runs: samples.length,
    performance,
    accessibility,
    lcpMs: lcpMs === null ? null : Math.round(lcpMs),
    cls: cls === null ? null : Number(cls.toFixed(4)),
    tbtMs: tbtMs === null ? null : Math.round(tbtMs),
    worthShowing: {
      performance: performance !== null && performance >= PERFORMANCE_THRESHOLD,
      accessibility: accessibility !== null && accessibility >= ACCESSIBILITY_THRESHOLD,
    },
  };
}

async function main(): Promise<void> {
  const cli = parseCli(process.argv.slice(2));
  const results: Result[] = [];
  let outFile = METRICS_FILE;

  if (cli.url) {
    console.log(`Ad hoc mode: measuring one URL, manifest bypassed. ${cli.url}`);
    outFile = SELFTEST_METRICS_FILE;
    const result = await measureUrl(cli.project ?? "adhoc", cli.url, cli.runs);
    if (result) results.push(result);
  } else {
    const projects = loadApprovedProjects();
    console.log(
      `Clearance gate passed: ${projects.length} project${projects.length === 1 ? "" : "s"} cleared ` +
        `(${projects.map((p) => p.id).join(", ")}).`,
    );
    for (const project of projects) {
      if (cli.project && project.id !== cli.project) continue;
      const result = await measureUrl(project.id, project.url, cli.runs);
      if (result) results.push(result);
    }
  }

  const payload: MetricsFile = {
    measuredAt: new Date().toISOString(),
    results,
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`\nWrote ${path.relative(ROOT, outFile)}`);
  for (const r of results) {
    const perfNote = r.worthShowing.performance ? "worth showing" : "hold back";
    const a11yNote = r.worthShowing.accessibility ? "worth showing" : "hold back";
    console.log(
      `  ${r.project}: performance ${String(r.performance)} (${perfNote}), ` +
        `accessibility ${String(r.accessibility)} (${a11yNote}), ` +
        `LCP ${String(r.lcpMs)}ms, CLS ${String(r.cls)}, TBT ${String(r.tbtMs)}ms`,
    );
  }
  if (results.length === 0) {
    console.log("  no results. Every run failed.");
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
