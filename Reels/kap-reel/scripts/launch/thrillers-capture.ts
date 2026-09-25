/**
 * scripts/launch/thrillers-capture.ts
 *
 * Captures the three routes of the Thrillers Mobile VR launch reel (day folder
 * 2026-10-02) the way scripts/capture.ts captures a showcase site: Chromium
 * headless, networkidle plus an 800ms settle, overlays dismissed and checked
 * on a still first, then one screenshot per frame of a scripted scroll, 180
 * frames, assembled at 30 fps. Deterministic: the scroll position of every
 * frame is a pure function of the frame index.
 *
 * Two differences from the showcase captures, both from the brief:
 *   - Vertical 1080x1920 frames. The viewport is 360x640 CSS at device scale
 *     3, a mobile layout, so the page reads at phone size inside the device
 *     frame rather than as a desktop layout shrunk into one.
 *   - The experiences route is a stepped scroll: four eased moves between four
 *     stops, one per ride, so each ride name holds long enough to read. Home
 *     and book use the showcase's single eased scroll.
 *
 * Run from D:\kap-reel:
 *   node node_modules/tsx/dist/cli.mjs scripts/launch/thrillers-capture.ts [--route /book]
 *
 * Writes assets/captures/thrillers-mobile-vr-<route>-vertical.mp4 and its still,
 * merges the entries into assets/captures/captures.json by id, and records the
 * routes, urls and timestamps in the day folder's source/capture-log.json.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "playwright";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const PROJECTS_FILE = path.join(ROOT, "config", "projects.json");
const CAPTURES_DIR = path.join(ROOT, "assets", "captures");
const INDEX_FILE = path.join(CAPTURES_DIR, "captures.json");
const DAY_SOURCE = path.resolve(
  ROOT,
  "..",
  "..",
  "Social Media Management",
  "To Be Released",
  "2026-10-02",
  "source",
);

const PROJECT_ID = "thrillers-mobile-vr";
const FPS = 30;
const FRAME_COUNT = 180;
const SETTLE_MS = 800;
const SCROLL_VIEWPORT_MULTIPLE = 2.2;
const VIEWPORT = { width: 360, height: 640 };
const DSF = 3;
const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

/**
 * The experiences stops, as [holdFrom, holdTo) per ride. Laid out for the
 * 120 frame experiences beat, which plays this clip from frame 0 at rate 1:
 * three holds of 21 frames, three 12 frame moves, and the last stop held to
 * the end of the clip.
 */
const STEP_HOLDS: [number, number][] = [
  [0, 21],
  [33, 54],
  [66, 87],
  [99, FRAME_COUNT],
];
/** Ride headings, in page order. Matched on the h2's own text. */
const RIDE_HEADINGS = ["VR Rides", "VR Theater", "The 360", "Racecar"];
/** CSS pixels left above each ride heading, for its kicker line. */
const STOP_HEADROOM = 70;

type Route = { route: string; slug: string; mode: "eased" | "stepped" };

const ROUTES: Route[] = [
  { route: "/", slug: "home", mode: "eased" },
  { route: "/experiences", slug: "experiences", mode: "stepped" },
  { route: "/book", slug: "book", mode: "eased" },
];

type LogEntry = {
  id: string;
  route: string;
  url: string;
  capturedAt: string;
  viewport: string;
  output: string;
  mode: Route["mode"];
  scrollPlanCssPx: number[] | { distance: number };
  pageHeightCssPx: number;
  dismissed: string[];
};

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function projectUrl(): string {
  const manifest = JSON.parse(fs.readFileSync(PROJECTS_FILE, "utf8")) as {
    approved: { id: string; url: string; cleared_for_public_showcase: boolean }[];
  };
  const entry = manifest.approved.find((p) => p.id === PROJECT_ID);
  if (!entry || entry.cleared_for_public_showcase !== true) {
    console.error(`Clearance gate: ${PROJECT_ID} is not cleared in config/projects.json.`);
    process.exit(1);
  }
  return entry.url.replace(/\/+$/, "");
}

/** Same two passes as capture.ts dismissOverlays(): click consent, hide leftovers. */
async function dismissOverlays(page: Page): Promise<string[]> {
  const found = await page.evaluate(() => {
    const out: string[] = [];
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";
    };
    const consent = "[class*=cookie i],[id*=cookie i],[class*=consent i],[id*=consent i],[role=dialog],[aria-modal=true]";
    for (const host of Array.from(document.querySelectorAll(consent))) {
      if (!visible(host)) continue;
      for (const btn of Array.from(host.querySelectorAll("button,a,[role=button]"))) {
        const label = `${btn.textContent ?? ""} ${btn.getAttribute("aria-label") ?? ""}`;
        if (/accept|agree|got it|close|dismiss|\bok\b|allow all|no thanks/i.test(label) && visible(btn)) {
          (btn as HTMLElement).click();
          out.push(`clicked "${label.trim().slice(0, 40)}"`);
        }
      }
      const pos = getComputedStyle(host).position;
      if (pos === "fixed" || pos === "sticky" || host.getAttribute("role") === "dialog") {
        host.setAttribute("data-kap-hidden", "1");
        out.push(`hid ${host.tagName.toLowerCase()}${host.id ? "#" + host.id : ""}`);
      }
    }
    const chat = "[class*=chat i],[id*=chat i],[id*=intercom],[class*=crisp],[id*=tawk],elevenlabs-convai";
    for (const el of Array.from(document.querySelectorAll(chat))) {
      const pos = getComputedStyle(el).position;
      if (visible(el) && (pos === "fixed" || el.tagName.toLowerCase() === "elevenlabs-convai")) {
        el.setAttribute("data-kap-hidden", "1");
        out.push(`hid chat ${el.tagName.toLowerCase()}`);
      }
    }
    return out;
  });
  await page.addStyleTag({
    content: `
      [data-kap-hidden="1"] { display: none !important; }
      ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
      html { scrollbar-width: none !important; }
      html, body, * { scroll-behavior: auto !important; }
    `,
  });
  return found;
}

/** Scroll position of every frame, CSS pixels. */
function easedPlan(distance: number): number[] {
  return Array.from({ length: FRAME_COUNT }, (_, i) => ease(i / (FRAME_COUNT - 1)) * distance);
}

function steppedPlan(stops: number[]): number[] {
  const plan: number[] = [];
  for (let i = 0; i < FRAME_COUNT; i += 1) {
    const holdIdx = STEP_HOLDS.findIndex(([a, b]) => i >= a && i < b);
    if (holdIdx !== -1) {
      plan.push(stops[holdIdx]);
      continue;
    }
    // In a move: between the end of one hold and the start of the next.
    const next = STEP_HOLDS.findIndex(([a]) => a > i);
    const from = STEP_HOLDS[next - 1][1];
    const to = STEP_HOLDS[next][0];
    const t = (i - from + 1) / (to - from + 1);
    plan.push(stops[next - 1] + ease(t) * (stops[next] - stops[next - 1]));
  }
  return plan;
}

function assemble(frameDir: string, outPath: string): void {
  const res = spawnSync(
    "ffmpeg",
    [
      "-y", "-framerate", String(FPS), "-i", path.join(frameDir, "%04d.jpg"),
      "-c:v", "libx264", "-crf", "16", "-preset", "slow",
      "-vf", "scale=in_range=full:out_range=limited",
      "-pix_fmt", "yuv420p", "-color_range", "tv", "-r", String(FPS),
      "-movflags", "+faststart", outPath,
    ],
    { encoding: "utf8" },
  );
  if (res.status !== 0) throw new Error(`ffmpeg exited ${String(res.status)}:\n${res.stderr.slice(-1500)}`);
}

function mergeIndex(entries: Record<string, unknown>[]): void {
  // Re-read immediately before writing: other captures may have landed.
  const existing: Record<string, unknown>[] = fs.existsSync(INDEX_FILE)
    ? (JSON.parse(fs.readFileSync(INDEX_FILE, "utf8")) as Record<string, unknown>[])
    : [];
  const byId = new Map(existing.map((e) => [String(e.id), e]));
  for (const e of entries) byId.set(String(e.id), e);
  const merged = Array.from(byId.values()).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  fs.writeFileSync(INDEX_FILE, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
}

async function main(): Promise<void> {
  const only = process.argv.includes("--route") ? process.argv[process.argv.indexOf("--route") + 1] : null;
  const base = projectUrl();
  const browser = await chromium.launch({ headless: true });
  const entries: Record<string, unknown>[] = [];
  const log: LogEntry[] = [];
  fs.mkdirSync(path.join(CAPTURES_DIR, "stills"), { recursive: true });
  fs.mkdirSync(path.join(DAY_SOURCE, "stills"), { recursive: true });

  try {
    for (const r of ROUTES) {
      if (only && r.route !== only) continue;
      const id = `${PROJECT_ID}-${r.slug}-vertical`;
      const url = r.route === "/" ? `${base}/` : `${base}${r.route}`;
      console.log(`\n[${id}] ${url} at ${VIEWPORT.width}x${VIEWPORT.height} dsf${DSF}`);

      const context = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: DSF,
        isMobile: true,
        hasTouch: true,
        userAgent: USER_AGENT,
      });
      await context.addInitScript({
        content: "globalThis.__name = globalThis.__name || function (f) { return f; };",
      });
      try {
        const page = await context.newPage();
        const capturedAt = new Date().toISOString();
        await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
        await page.evaluate(() => document.fonts.ready.then(() => undefined));
        await page.waitForTimeout(SETTLE_MS);
        const dismissed = await dismissOverlays(page);
        console.log(`  dismissed: ${dismissed.length ? dismissed.join("; ") : "nothing found"}`);
        // Walk the page once before recording. The site reveals sections and
        // counts its numbers up as they scroll into view; a jump cut straight
        // to a ride would otherwise catch the heading mid reveal and a counter
        // part way to its real value. After the walk every section is in its
        // finished, as written state.
        await page.evaluate(async () => {
          const step = Math.round(window.innerHeight * 0.6);
          for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((resolve) => setTimeout(resolve, 150));
          }
        });
        await page.waitForTimeout(2500);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(800);

        const stillPath = path.join(CAPTURES_DIR, "stills", `${id}.png`);
        await page.screenshot({ path: stillPath, type: "png" });
        fs.copyFileSync(stillPath, path.join(DAY_SOURCE, "stills", `${id}.png`));

        const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        let plan: number[];
        let planRecord: LogEntry["scrollPlanCssPx"];
        if (r.mode === "stepped") {
          const stops = await page.evaluate(
            ({ names, headroom }) =>
              names.map((name) => {
                const h2 = Array.from(document.querySelectorAll("h2")).find((h) =>
                  (h.textContent ?? "").replace(/\s+/g, " ").trim().startsWith(name),
                );
                if (!h2) throw new Error(`no h2 starting "${name}"`);
                return Math.round(h2.getBoundingClientRect().top + window.scrollY - headroom);
              }),
            { names: RIDE_HEADINGS, headroom: STOP_HEADROOM },
          );
          plan = steppedPlan(stops);
          planRecord = stops;
          console.log(`  stops: ${stops.join(", ")} css px`);
        } else {
          const distance = Math.round(
            Math.min(pageHeight - VIEWPORT.height, SCROLL_VIEWPORT_MULTIPLE * VIEWPORT.height),
          );
          plan = easedPlan(distance);
          planRecord = { distance };
          console.log(`  eased scroll: ${distance} css px`);
        }

        const frameDir = path.join(CAPTURES_DIR, "frames", id);
        fs.rmSync(frameDir, { recursive: true, force: true });
        fs.mkdirSync(frameDir, { recursive: true });
        for (let i = 0; i < FRAME_COUNT; i += 1) {
          await page.evaluate(async (y) => {
            window.scrollTo(0, y);
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          }, plan[i]);
          await page.screenshot({
            path: path.join(frameDir, `${String(i).padStart(4, "0")}.jpg`),
            type: "jpeg",
            quality: 92,
          });
        }
        const videoPath = path.join(CAPTURES_DIR, `${id}.mp4`);
        assemble(frameDir, videoPath);
        fs.rmSync(frameDir, { recursive: true, force: true });
        console.log(`  video: ${path.relative(ROOT, videoPath)}`);

        const width = VIEWPORT.width * DSF;
        const height = VIEWPORT.height * DSF;
        entries.push({
          id,
          project: PROJECT_ID,
          route: r.route,
          viewport: "mobile",
          path: path.relative(ROOT, videoPath).split(path.sep).join("/"),
          stillPath: path.relative(ROOT, stillPath).split(path.sep).join("/"),
          width,
          height,
          fps: FPS,
          durationFrames: FRAME_COUNT,
          durationSec: FRAME_COUNT / FPS,
          capturedAt,
          scrollDistancePx: Math.round(Math.max(...plan)),
          pageHeightPx: pageHeight,
          dismissed,
          // A website fills its viewport: the content box is the whole frame.
          contentBox: { x: 0, y: 0, w: width, h: height },
        });
        log.push({
          id,
          route: r.route,
          url,
          capturedAt,
          viewport: `${VIEWPORT.width}x${VIEWPORT.height} css, dsf ${DSF}, ${width}x${height} frames`,
          output: `kap-reel/${path.relative(ROOT, videoPath).split(path.sep).join("/")}`,
          mode: r.mode,
          scrollPlanCssPx: planRecord,
          pageHeightCssPx: pageHeight,
          dismissed,
        });
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  mergeIndex(entries);
  const logFile = path.join(DAY_SOURCE, "capture-log.json");
  const prior: LogEntry[] = fs.existsSync(logFile)
    ? ((JSON.parse(fs.readFileSync(logFile, "utf8")) as { captures: LogEntry[] }).captures ?? [])
    : [];
  const byId = new Map(prior.map((e) => [e.id, e]));
  for (const e of log) byId.set(e.id, e);
  fs.writeFileSync(
    logFile,
    `${JSON.stringify(
      {
        site: "Thrillers Mobile VR",
        note: "Captured from the demo host. The real domain is not live yet (waiting on Wix); the demo URL is a placeholder to replace.",
        script: "kap-reel/scripts/launch/thrillers-capture.ts",
        frames: FRAME_COUNT,
        fps: FPS,
        captures: Array.from(byId.values()),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`\n${entries.length} clip(s). Index merged, log at ${logFile}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
