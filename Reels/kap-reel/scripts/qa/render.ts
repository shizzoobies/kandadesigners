// Bundling and still rendering for the QA harness.
//
// The harness builds and renders from its own bundle at out/qa/bundle so it can
// never collide with a delivery build in out/bundle, and so a report can name
// the bundle it measured. The bundle is cached: rerunning reuses it unless
// --rebundle is passed or src has been touched since it was built.
//
// Stills go through the Node API rather than the CLI. One CLI process per still
// pays for a fresh Chromium and a fresh bundle read every time; a pool of
// browsers held open across five hundred stills does not.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { enableTailwind } from "@remotion/tailwind-v4";
import {
  ensureBrowser,
  openBrowser,
  renderStill,
  selectComposition,
} from "@remotion/renderer";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(HERE, "..", "..");
export const QA_DIR = path.join(PROJECT_ROOT, "out", "qa");
export const BUNDLE_DIR = path.join(QA_DIR, "bundle");
export const STILLS_DIR = path.join(QA_DIR, "stills");

export type BundleInfo = {
  serveUrl: string;
  builtAt: string;
  reused: boolean;
  seconds: number;
};

function newestSourceMtime(): number {
  const roots = [
    path.join(PROJECT_ROOT, "src"),
    path.join(PROJECT_ROOT, "config"),
    path.join(PROJECT_ROOT, "assets", "captures", "captures.json"),
  ];
  let newest = 0;
  const walk = (p: string) => {
    let stat: fs.Stats;
    try {
      stat = fs.statSync(p);
    } catch {
      return;
    }
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(p)) walk(path.join(p, entry));
      return;
    }
    if (stat.mtimeMs > newest) newest = stat.mtimeMs;
  };
  for (const root of roots) walk(root);
  return newest;
}

/**
 * Build the QA bundle, or reuse the one on disk when it is newer than every
 * file it was built from.
 *
 * The Node API does not read remotion.config.ts, so the two settings that
 * change what renders have to be passed here: the public directory is ./assets,
 * not ./public, and Tailwind has to be enabled because src/index.css imports it
 * and its preflight is load bearing. ZoomShot only sets maxWidth: none because
 * Tailwind's preflight clamps a zoomed video, so a bundle built without
 * Tailwind would render a different picture from the one that ships and every
 * measurement taken off it would be worthless.
 */
export async function buildBundle(force: boolean): Promise<BundleInfo> {
  const stampFile = path.join(QA_DIR, "bundle-stamp.json");
  const started = Date.now();

  if (!force && fs.existsSync(path.join(BUNDLE_DIR, "index.html")) && fs.existsSync(stampFile)) {
    try {
      const stamp = JSON.parse(fs.readFileSync(stampFile, "utf8")) as {
        builtAtMs: number;
        builtAt: string;
      };
      if (stamp.builtAtMs >= newestSourceMtime()) {
        return {
          serveUrl: BUNDLE_DIR,
          builtAt: stamp.builtAt,
          reused: true,
          seconds: 0,
        };
      }
    } catch {
      // Fall through and rebuild.
    }
  }

  fs.mkdirSync(QA_DIR, { recursive: true });
  let lastLogged = -1;
  const serveUrl = await bundle({
    entryPoint: path.join(PROJECT_ROOT, "src", "index.ts"),
    outDir: BUNDLE_DIR,
    publicDir: path.join(PROJECT_ROOT, "assets"),
    webpackOverride: enableTailwind,
    rspack: true,
    symlinkPublicDir: true,
    onProgress: (progress) => {
      const pct = Math.floor(progress / 10) * 10;
      if (pct !== lastLogged) {
        lastLogged = pct;
        process.stdout.write(`  bundling ${pct}%\r`);
      }
    },
  });
  const builtAt = new Date().toISOString();
  fs.writeFileSync(
    stampFile,
    JSON.stringify({ builtAt, builtAtMs: Date.now() }, null, 2),
  );
  process.stdout.write("                    \r");
  return {
    serveUrl,
    builtAt,
    reused: false,
    seconds: (Date.now() - started) / 1000,
  };
}

export type StillRequest = {
  compositionId: string;
  frame: number;
  /** Absolute path of the PNG to write. */
  output: string;
};

export type RenderPoolOptions = {
  serveUrl: string;
  concurrency: number;
  onDone?: (done: number, total: number) => void;
};

/**
 * First port handed to a render worker.
 *
 * renderStill starts its own static server per call, and the public API takes a
 * port but not a server to share. Left to itself every worker asks for the same
 * default port, and at six workers that raced: a still came back with
 * ERR_SOCKET_NOT_CONNECTED on a font file and cancelled the render. One port per
 * worker, well clear of the 3000 a studio would be on.
 */
const BASE_PORT = 3210;

/** Attempts per still before the run gives up on it. */
const STILL_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Renders a list of stills across a pool of browsers.
 *
 * Compositions are resolved once each and shared, because selectComposition
 * opens a page and evaluates the Root for every call and there are only twenty
 * four of them against several hundred stills.
 */
export async function renderStills(
  requests: StillRequest[],
  options: RenderPoolOptions,
): Promise<void> {
  if (requests.length === 0) return;
  await ensureBrowser();

  const compositionIds = [...new Set(requests.map((r) => r.compositionId))];
  const compositions = new Map<string, Awaited<ReturnType<typeof selectComposition>>>();
  for (const id of compositionIds) {
    compositions.set(
      id,
      await selectComposition({ serveUrl: options.serveUrl, id, inputProps: {} }),
    );
  }

  const workers = Math.max(1, Math.min(options.concurrency, requests.length));
  let cursor = 0;
  let done = 0;

  const runWorker = async (worker: number) => {
    const browser = await openBrowser("chrome", { logLevel: "error" });
    try {
      for (;;) {
        const index = cursor;
        cursor += 1;
        if (index >= requests.length) break;
        const req = requests[index];
        const composition = compositions.get(req.compositionId);
        if (!composition) throw new Error(`no composition ${req.compositionId}`);
        fs.mkdirSync(path.dirname(req.output), { recursive: true });

        let lastError: unknown = null;
        for (let attempt = 1; attempt <= STILL_ATTEMPTS; attempt += 1) {
          try {
            await renderStill({
              composition,
              serveUrl: options.serveUrl,
              output: req.output,
              frame: req.frame,
              imageFormat: "png",
              overwrite: true,
              puppeteerInstance: browser,
              port: BASE_PORT + worker,
              logLevel: "error",
              inputProps: {},
            });
            lastError = null;
            break;
          } catch (err) {
            lastError = err;
            if (attempt < STILL_ATTEMPTS) await sleep(400 * attempt);
          }
        }
        if (lastError !== null) {
          throw new Error(
            `${req.compositionId} frame ${req.frame} failed ${STILL_ATTEMPTS} times: ${String(lastError)}`,
          );
        }

        done += 1;
        options.onDone?.(done, requests.length);
      }
    } finally {
      await browser.close({ silent: true });
    }
  };

  await Promise.all(Array.from({ length: workers }, (_, i) => runWorker(i)));
}
