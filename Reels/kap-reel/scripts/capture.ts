/**
 * scripts/capture.ts
 *
 * Phase 1 capture tooling for the K&A Performance showcase reel.
 * See kap-reel-handoff.md Section 4.
 *
 * Run:  npx tsx scripts/capture.ts [flags]
 *
 * Flags:
 *   --project <id>              Only capture this project id.
 *   --route <path>              Only capture this route path.
 *   --stills-only               Take the checked still, skip the video.
 *   --viewport mobile|desktop|both   Default both.
 *   --keep-frames               Keep the JPEG frame folder after assembly.
 *   --self-test                 Capture the owner's own site only, into
 *                               assets/captures/selftest/, and do not touch
 *                               captures.json.
 *
 * The clearance gate in loadApprovedProjects() is non-negotiable. Nothing
 * launches a browser until at least one project is cleared for public
 * showcase and has a real URL.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "playwright";
// Interaction recorder for the training reel, paused 2026-09-04 while Alex
// finishes the courses. The beat scripts live in scripts/interactions/ and
// these imports come back when recordInteraction is wired up.
// import { beatsFor } from "./interactions/index";
// import type { Beat, Step } from "./interactions/types";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PROJECTS_FILE = path.join(ROOT, "config", "projects.json");
const CAPTURES_DIR = path.join(ROOT, "assets", "captures");
const SELFTEST_DIR = path.join(CAPTURES_DIR, "selftest");

const FPS = 30;
const DURATION_SEC = 6;
const FRAME_COUNT = FPS * DURATION_SEC; // 180 frames, indices 0..179
const NAV_TIMEOUT_MS = 60_000;
const SETTLE_MS = 800;
const SCROLL_VIEWPORT_MULTIPLE = 2.2;

const USER_AGENTS = {
  mobile:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  desktop:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

const SELF_TEST_URL = "https://ka-performancefl.com";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewportName = "mobile" | "desktop";

type ViewportSpec = {
  name: ViewportName;
  width: number;
  height: number;
  isMobile: boolean;
  hasTouch: boolean;
};

const VIEWPORTS: Record<ViewportName, ViewportSpec> = {
  mobile: { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true },
  desktop: { name: "desktop", width: 1440, height: 900, isMobile: false, hasTouch: false },
};

type ApprovedProject = {
  id: string;
  display_name: string;
  url: string;
  cleared_for_public_showcase: boolean;
  credit_allowed: boolean;
  one_liner: string;
  proof_points: string[];
  capture_routes: string[];
  /** Optional per-project settle wait in ms, for sites whose hero animation runs longer than the default. */
  settle_ms?: number;
};

type ProjectsManifest = {
  approved?: ApprovedProject[];
  excluded_do_not_show?: string[];
};

type CaptureEntry = {
  id: string;
  project: string;
  route: string;
  viewport: ViewportName;
  path: string;
  stillPath: string;
  width: number;
  height: number;
  fps: number;
  durationFrames: number;
  durationSec: number;
  capturedAt: string;
  scrollDistancePx: number;
  pageHeightPx: number;
  dismissed: string[];
};

type SummaryRow = {
  id: string;
  status: "ok" | "still-only" | "failed";
  detail: string;
};

type Cli = {
  project: string | null;
  route: string | null;
  stillsOnly: boolean;
  viewport: "mobile" | "desktop" | "both";
  keepFrames: boolean;
  selfTest: boolean;
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseCli(argv: string[]): Cli {
  const cli: Cli = {
    project: null,
    route: null,
    stillsOnly: false,
    viewport: "both",
    keepFrames: false,
    selfTest: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--project":
        cli.project = argv[++i] ?? null;
        break;
      case "--route":
        cli.route = argv[++i] ?? null;
        break;
      case "--stills-only":
        cli.stillsOnly = true;
        break;
      case "--keep-frames":
        cli.keepFrames = true;
        break;
      case "--self-test":
        cli.selfTest = true;
        break;
      case "--viewport": {
        const value = argv[++i];
        if (value !== "mobile" && value !== "desktop" && value !== "both") {
          throw new Error(`--viewport must be mobile, desktop, or both. Got: ${String(value)}`);
        }
        cli.viewport = value;
        break;
      }
      default:
        if (arg.startsWith("--")) {
          throw new Error(`Unknown flag: ${arg}`);
        }
        break;
    }
  }

  return cli;
}

// ---------------------------------------------------------------------------
// Clearance gate
// ---------------------------------------------------------------------------

/**
 * Reads config/projects.json and returns only entries that are cleared for
 * public showcase and have a real URL. Exits the process if none qualify.
 * This is the blocking gate from handoff Section 1.
 */
export function loadApprovedProjects(): ApprovedProject[] {
  if (!fs.existsSync(PROJECTS_FILE)) {
    console.error(`Clearance gate: ${PROJECTS_FILE} does not exist.`);
    console.error("Ask the owner to fill it in before any capture runs. Nothing was launched.");
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
    console.error("Clearance gate: no projects are cleared for capture.");
    console.error(`File: ${PROJECTS_FILE}`);
    console.error(
      `Found ${all.length} entr${all.length === 1 ? "y" : "ies"} under "approved", none of which had ` +
        'cleared_for_public_showcase === true and a url that is not a "FILL_IN" placeholder.',
    );
    console.error("No browser was launched and nothing was captured.");
    process.exit(1);
  }

  return cleared;
}

// ---------------------------------------------------------------------------
// Overlay dismissal
// ---------------------------------------------------------------------------

const OVERLAY_CONTAINER_SELECTORS = [
  "[class*=cookie]",
  "[id*=cookie]",
  "[class*=consent]",
  "[id*=consent]",
  "[class*=Cookie]",
  "[id*=Cookie]",
  "[class*=Consent]",
  "[id*=Consent]",
  "[class*=gdpr]",
  "[id*=gdpr]",
  "[role=dialog]",
  "[aria-modal=true]",
];

const CHAT_WIDGET_SELECTORS = [
  "[class*=chat]",
  "[id*=chat]",
  "[class*=Chat]",
  "[id*=Chat]",
  "[id*=intercom]",
  "[class*=intercom]",
  "[class*=crisp]",
  "[id*=crisp]",
  "[id*=tidio]",
  "[class*=tidio]",
  "[id*=hubspot-messages]",
  "[id*=drift]",
  "[class*=drift]",
  "[id*=tawk]",
  "[class*=tawk]",
  "elevenlabs-convai",
  "[class*=widget-launcher]",
];

const DISMISS_TEXT = /accept|agree|got it|close|dismiss|\bok\b|allow all|i understand|no thanks/i;

/**
 * Clicks away consent and cookie prompts, then hides anything left over
 * (chat launchers, floating widgets, stubborn dialogs) with an injected
 * stylesheet. Also kills scrollbars and smooth scrolling so the scripted
 * scroll owns all page motion.
 *
 * Returns a human-readable list of what it dealt with.
 */
async function dismissOverlays(page: Page): Promise<string[]> {
  const dismissed: string[] = [];

  // Pass A: click the obvious consent buttons.
  const clicked = await page.evaluate(
    ({ containers, textSource }) => {
      const textRe = new RegExp(textSource, "i");
      const found: string[] = [];
      const seen = new Set<Element>();

      const describe = (el: Element): string => {
        const id = el.id ? `#${el.id}` : "";
        const cls =
          typeof el.className === "string" && el.className
            ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
            : "";
        return `${el.tagName.toLowerCase()}${id}${cls}`;
      };

      const visible = (el: Element): boolean => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const style = window.getComputedStyle(el);
        return (
          style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0
        );
      };

      for (const sel of containers) {
        let hosts: Element[];
        try {
          hosts = Array.from(document.querySelectorAll(sel));
        } catch {
          continue;
        }
        for (const host of hosts) {
          if (!visible(host)) continue;
          const buttons = Array.from(
            host.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]'),
          );
          for (const btn of buttons) {
            if (seen.has(btn)) continue;
            const label = `${btn.textContent ?? ""} ${btn.getAttribute("aria-label") ?? ""}`.trim();
            if (!textRe.test(label)) continue;
            if (!visible(btn)) continue;
            seen.add(btn);
            try {
              (btn as HTMLElement).click();
              found.push(`clicked "${label.slice(0, 40)}" in ${describe(host)}`);
            } catch {
              // fall through to the hide pass
            }
          }
        }
      }
      return found;
    },
    { containers: OVERLAY_CONTAINER_SELECTORS, textSource: DISMISS_TEXT.source },
  );
  dismissed.push(...clicked);

  if (clicked.length > 0) {
    await page.waitForTimeout(400);
  }

  // Pass B: hide whatever survived, plus chat widgets and corner floaters.
  const hidden = await page.evaluate(
    ({ containers, chats }) => {
      const found: string[] = [];
      const toHide: Element[] = [];

      const describe = (el: Element): string => {
        const id = el.id ? `#${el.id}` : "";
        const cls =
          typeof el.className === "string" && el.className
            ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
            : "";
        return `${el.tagName.toLowerCase()}${id}${cls}`;
      };

      const visible = (el: Element): boolean => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const style = window.getComputedStyle(el);
        return (
          style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0
        );
      };

      const isFixedOrSticky = (el: Element): boolean => {
        const pos = window.getComputedStyle(el).position;
        return pos === "fixed" || pos === "sticky";
      };

      // Surviving consent dialogs.
      for (const sel of containers) {
        let hosts: Element[];
        try {
          hosts = Array.from(document.querySelectorAll(sel));
        } catch {
          continue;
        }
        for (const host of hosts) {
          if (!visible(host)) continue;
          if (!isFixedOrSticky(host) && host.getAttribute("role") !== "dialog") continue;
          toHide.push(host);
          found.push(`hid consent overlay ${describe(host)}`);
        }
      }

      // Chat widgets and launchers, including their iframes.
      for (const sel of chats) {
        let hosts: Element[];
        try {
          hosts = Array.from(document.querySelectorAll(sel));
        } catch {
          continue;
        }
        for (const host of hosts) {
          if (!visible(host)) continue;
          // Only fixed/sticky chrome. A page section named "chat" is content.
          if (!isFixedOrSticky(host) && host.tagName.toLowerCase() !== "elevenlabs-convai") continue;
          toHide.push(host);
          found.push(`hid chat widget ${describe(host)}`);
        }
      }

      // Any small fixed element parked in the bottom-right corner.
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      for (const el of Array.from(document.body.querySelectorAll("*"))) {
        if (!isFixedOrSticky(el)) continue;
        if (!visible(el)) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width > 200 || rect.height > 200) continue;
        if (rect.right < vw * 0.6 || rect.bottom < vh * 0.6) continue;
        if (rect.right > vw + 40 || rect.bottom > vh + 40) continue;
        if (toHide.includes(el)) continue;
        toHide.push(el);
        found.push(`hid bottom-right floater ${describe(el)}`);
      }

      for (const el of toHide) {
        (el as HTMLElement).setAttribute("data-kap-hidden", "1");
      }
      return found;
    },
    { containers: OVERLAY_CONTAINER_SELECTORS, chats: CHAT_WIDGET_SELECTORS },
  );
  dismissed.push(...hidden);

  // The stylesheet does the actual hiding, plus scrollbar and smooth-scroll kill.
  await page.addStyleTag({
    content: `
      [data-kap-hidden="1"] { display: none !important; visibility: hidden !important; }
      ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
      html { scrollbar-width: none !important; -ms-overflow-style: none !important; }
      html, body { scroll-behavior: auto !important; }
      * { scroll-behavior: auto !important; }
    `,
  });

  return dismissed;
}

// ---------------------------------------------------------------------------
// Interaction clips (Section 4 item 6) - not built yet
// ---------------------------------------------------------------------------

/**
 * TODO: interaction beats. Short three second clips of a booking calendar
 * opening, a Stripe test checkout, an AI chat widget answering, or an admin
 * panel edit. Each needs a per-project script of clicks, so it cannot be
 * generalised the way the scroll pass can. Wire this up behind an
 * --interaction flag once the approved manifest names real routes.
 *
 * Deliberately unimplemented. Do not stub it out with a fake clip.
 */
export async function recordInteraction(): Promise<never> {
  throw new Error("recordInteraction: not implemented");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function routeSlug(route: string): string {
  if (route === "/" || route === "") return "home";
  return route.replace(/^\/+|\/+$/g, "").replace(/\//g, "-") || "home";
}

function joinUrl(base: string, route: string): string {
  const trimmed = base.replace(/\/+$/, "");
  if (!route || route === "/") return `${trimmed}/`;
  return `${trimmed}/${route.replace(/^\/+/, "")}`;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

async function navigateWithRetry(page: Page, url: string): Promise<void> {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS });
  } catch (err) {
    console.log(`  navigation failed, retrying once: ${(err as Error).message.split("\n")[0]}`);
    await page.goto(url, { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS });
  }
}

/** Assembles a numbered JPEG sequence into an H.264 MP4. */
function assembleVideo(frameDir: string, outPath: string): void {
  ensureDir(path.dirname(outPath));
  const args = [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    path.join(frameDir, "%04d.jpg"),
    "-c:v",
    "libx264",
    "-crf",
    "16",
    "-preset",
    "slow",
    // JPEG input decodes as full range, which makes x264 tag the output
    // yuvj420p. Convert to limited range so the stream really is yuv420p.
    "-vf",
    "scale=in_range=full:out_range=limited",
    "-pix_fmt",
    "yuv420p",
    "-color_range",
    "tv",
    "-r",
    String(FPS),
    "-movflags",
    "+faststart",
    outPath,
  ];
  const res = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (res.error) {
    throw new Error(`ffmpeg could not start: ${res.error.message}`);
  }
  if (res.status !== 0) {
    const tail = (res.stderr ?? "").split("\n").slice(-12).join("\n");
    throw new Error(`ffmpeg exited ${String(res.status)}:\n${tail}`);
  }
}

function readCapturesIndex(file: string): CaptureEntry[] {
  if (!fs.existsSync(file)) return [];
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? (parsed as CaptureEntry[]) : [];
  } catch {
    console.log(`  existing captures.json was unreadable, starting a fresh index`);
    return [];
  }
}

/** Merge by id so re-running one project does not wipe the others. */
function mergeCapturesIndex(file: string, entries: CaptureEntry[]): void {
  const byId = new Map<string, CaptureEntry>();
  for (const existing of readCapturesIndex(file)) byId.set(existing.id, existing);
  for (const fresh of entries) byId.set(fresh.id, fresh);
  const merged = Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
}

function printSummary(rows: SummaryRow[]): void {
  if (rows.length === 0) {
    console.log("\nNothing was captured.");
    return;
  }
  const idWidth = Math.max(8, ...rows.map((r) => r.id.length));
  const statusWidth = Math.max(6, ...rows.map((r) => r.status.length));
  const line = `${"-".repeat(idWidth)}  ${"-".repeat(statusWidth)}  ${"-".repeat(40)}`;
  console.log("\nCapture summary");
  console.log(line);
  console.log(`${"clip".padEnd(idWidth)}  ${"status".padEnd(statusWidth)}  detail`);
  console.log(line);
  for (const row of rows) {
    console.log(`${row.id.padEnd(idWidth)}  ${row.status.padEnd(statusWidth)}  ${row.detail}`);
  }
  console.log(line);
  const ok = rows.filter((r) => r.status !== "failed").length;
  console.log(`${ok} of ${rows.length} clips succeeded.\n`);
}

// ---------------------------------------------------------------------------
// The capture itself
// ---------------------------------------------------------------------------

type CaptureJob = {
  projectId: string;
  settleMs?: number;
  route: string;
  url: string;
  viewport: ViewportSpec;
};

type Dirs = {
  stills: string;
  frames: string;
  videos: string;
};

async function captureOne(
  browser: Browser,
  job: CaptureJob,
  dirs: Dirs,
  cli: Cli,
): Promise<CaptureEntry | null> {
  const vp = job.viewport;
  const slug = routeSlug(job.route);
  const clipId = `${job.projectId}-${slug}-${vp.name}`;
  const outWidth = vp.width * 2;
  const outHeight = vp.height * 2;

  console.log(`\n[${clipId}] ${job.url} at ${vp.width}x${vp.height} dsf2 -> ${outWidth}x${outHeight}`);

  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    userAgent: USER_AGENTS[vp.name],
    // Playwright's own recordVideo caps out near 25fps and drops frames under
    // load, so the frame sequence below is the primary path instead.
  });

  // tsx compiles with esbuild's keepNames on, which wraps named functions in a
  // __name() helper. That helper does not exist inside the page, so any
  // page.evaluate body containing a named inner function throws
  // "__name is not defined". Shim it before any page script runs. Passed as a
  // string so it is not itself rewritten.
  await context.addInitScript({
    content: "globalThis.__name = globalThis.__name || function (f) { return f; };",
  });

  try {
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);

    await navigateWithRetry(page, job.url);
    await page.waitForTimeout(job.settleMs ?? SETTLE_MS);

    const dismissed = await dismissOverlays(page);
    if (dismissed.length > 0) {
      for (const item of dismissed) console.log(`  dismissed: ${item}`);
    } else {
      console.log("  dismissed: nothing found");
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(250);

    // The checked still. The owner reviews these for cookie banners and
    // half-loaded heroes before anything gets cut into the reel.
    ensureDir(dirs.stills);
    const stillPath = path.join(dirs.stills, `${clipId}.png`);
    await page.screenshot({ path: stillPath, type: "png" });
    console.log(`  still: ${path.relative(ROOT, stillPath)}`);

    // Some sites lock the document and scroll inside a container (Fore Motion
    // Golf uses div.soon__scroll). Detect the tallest scrollable container when
    // the document itself does not scroll, and tag it so the frame loop can
    // drive it instead of window.
    const scroller = await page.evaluate((viewportHeight) => {
      const docHeight =
        document.documentElement.scrollHeight || document.body.scrollHeight;
      if (docHeight > viewportHeight + 50) {
        return { kind: "window", pageHeight: docHeight, label: "window" };
      }
      let best: HTMLElement | null = null;
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
        const cs = getComputedStyle(el);
        if (!/(auto|scroll)/.test(cs.overflowY)) continue;
        if (el.scrollHeight <= el.clientHeight + 50) continue;
        if (el.clientHeight < viewportHeight * 0.6) continue;
        if (!best || el.scrollHeight > best.scrollHeight) best = el;
      }
      if (!best) {
        return { kind: "window", pageHeight: docHeight, label: "window" };
      }
      best.setAttribute("data-kap-scroller", "1");
      const label = best.tagName.toLowerCase() +
        (best.id ? "#" + best.id : "") +
        (best.className ? "." + String(best.className).trim().split(/\s+/).join(".") : "");
      return { kind: "element", pageHeight: best.scrollHeight, label };
    }, vp.height);
    if (scroller.kind === "element") {
      console.log(`  scroller: ${scroller.label} (document is locked)`);
    }
    const pageHeightPx = scroller.pageHeight;
    const scrollDistancePx = Math.max(
      0,
      Math.round(Math.min(pageHeightPx - vp.height, SCROLL_VIEWPORT_MULTIPLE * vp.height)),
    );

    if (cli.stillsOnly) {
      console.log("  stills-only: skipping video");
      return null;
    }

    // Frame sequence. Deterministic scroll, one screenshot per frame.
    const frameDir = path.join(dirs.frames, clipId);
    fs.rmSync(frameDir, { recursive: true, force: true });
    ensureDir(frameDir);

    for (let i = 0; i < FRAME_COUNT; i += 1) {
      await page.evaluate(
        async ({ index, total, distance }) => {
          const t = total > 1 ? index / (total - 1) : 0;
          const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          const target = document.querySelector<HTMLElement>("[data-kap-scroller]");
          if (target) {
            target.scrollTop = eased * distance;
          } else {
            window.scrollTo(0, eased * distance);
          }
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
          });
        },
        { index: i, total: FRAME_COUNT, distance: scrollDistancePx },
      );
      const framePath = path.join(frameDir, `${String(i).padStart(4, "0")}.jpg`);
      await page.screenshot({ path: framePath, type: "jpeg", quality: 92 });
    }
    console.log(`  frames: ${FRAME_COUNT} written, scroll distance ${scrollDistancePx}px`);

    const videoPath = path.join(dirs.videos, `${clipId}.mp4`);
    assembleVideo(frameDir, videoPath);
    console.log(`  video: ${path.relative(ROOT, videoPath)}`);

    if (!cli.keepFrames) {
      fs.rmSync(frameDir, { recursive: true, force: true });
    }

    return {
      id: clipId,
      project: job.projectId,
      route: job.route,
      viewport: vp.name,
      path: path.relative(ROOT, videoPath).split(path.sep).join("/"),
      stillPath: path.relative(ROOT, stillPath).split(path.sep).join("/"),
      width: outWidth,
      height: outHeight,
      fps: FPS,
      durationFrames: FRAME_COUNT,
      durationSec: DURATION_SEC,
      capturedAt: new Date().toISOString(),
      scrollDistancePx,
      pageHeightPx,
      dismissed,
    };
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const cli = parseCli(process.argv.slice(2));

  const wantedViewports: ViewportSpec[] =
    cli.viewport === "both"
      ? [VIEWPORTS.mobile, VIEWPORTS.desktop]
      : [VIEWPORTS[cli.viewport]];

  const jobs: CaptureJob[] = [];
  let dirs: Dirs;

  if (cli.selfTest) {
    // The owner's own site. Never any client site here.
    console.log("Self test: capturing ka-performancefl.com only, into assets/captures/selftest/");
    dirs = {
      stills: path.join(SELFTEST_DIR, "stills"),
      frames: path.join(SELFTEST_DIR, "frames"),
      videos: SELFTEST_DIR,
    };
    for (const vp of wantedViewports) {
      jobs.push({
        projectId: "selftest",
        route: "/",
        url: joinUrl(SELF_TEST_URL, "/"),
        viewport: vp,
      });
    }
  } else {
    const projects = loadApprovedProjects();
    console.log(
      `Clearance gate passed: ${projects.length} project${projects.length === 1 ? "" : "s"} cleared ` +
        `(${projects.map((p) => p.id).join(", ")}).`,
    );
    dirs = {
      stills: path.join(CAPTURES_DIR, "stills"),
      frames: path.join(CAPTURES_DIR, "frames"),
      videos: CAPTURES_DIR,
    };
    for (const project of projects) {
      if (cli.project && project.id !== cli.project) continue;
      const routes = (project.capture_routes ?? []).filter((r) => !r.startsWith("FILL_IN"));
      for (const route of routes) {
        if (cli.route && route !== cli.route) continue;
        for (const vp of wantedViewports) {
          jobs.push({
            projectId: project.id,
            settleMs: project.settle_ms,
            route,
            url: joinUrl(project.url, route),
            viewport: vp,
          });
        }
      }
    }
    if (jobs.length === 0) {
      console.error("No routes matched the given filters. Nothing to capture.");
      process.exit(1);
    }
  }

  const browser = await chromium.launch({ headless: true });
  const entries: CaptureEntry[] = [];
  const rows: SummaryRow[] = [];

  try {
    for (const job of jobs) {
      const clipId = `${job.projectId}-${routeSlug(job.route)}-${job.viewport.name}`;
      try {
        const entry = await captureOne(browser, job, dirs, cli);
        if (entry) {
          entries.push(entry);
          rows.push({
            id: clipId,
            status: "ok",
            detail: `${entry.width}x${entry.height}, ${entry.durationFrames}f, ${entry.dismissed.length} dismissed`,
          });
        } else {
          rows.push({ id: clipId, status: "still-only", detail: "still written, video skipped" });
        }
      } catch (err) {
        const msg = (err as Error).message.split("\n")[0];
        console.error(`  FAILED ${clipId}: ${msg}`);
        rows.push({ id: clipId, status: "failed", detail: msg.slice(0, 60) });
      }
    }
  } finally {
    await browser.close();
  }

  if (cli.selfTest) {
    console.log("\nSelf test: captures.json deliberately untouched.");
  } else if (entries.length > 0) {
    const indexFile = path.join(CAPTURES_DIR, "captures.json");
    mergeCapturesIndex(indexFile, entries);
    console.log(`\nIndex: ${path.relative(ROOT, indexFile)} (${entries.length} entries merged)`);
  }

  printSummary(rows);

  if (rows.some((r) => r.status === "failed")) {
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
