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
 *   --beat <id>                 Only capture this beat (interaction projects).
 *   --stills-only               Take the checked still, skip the video.
 *   --viewport mobile|desktop|both   Default both.
 *   --keep-frames               Keep the JPEG frame folder after assembly.
 *   --self-test                 Capture the owner's own site only, into
 *                               assets/captures/selftest/, and do not touch
 *                               captures.json.
 *   --gate-sheets               Build no clips. Read captures.json and tile the
 *                               25/50/75 percent frames of every interaction
 *                               clip into out/gate-t1/<project>-<viewport>.png.
 *
 * The clearance gate in loadApprovedProjects() is non-negotiable. Nothing
 * launches a browser until at least one project is cleared for public
 * showcase and has a real URL.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { beatsFor } from "./interactions/index";
import type { Beat, Step } from "./interactions/types";

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

// Interaction recorder constants. See recordInteraction().
const FRAME_WAIT_MS = 33; // one frame of wall clock between state change and shutter
const TARGET_FRAME_MS = 1000 / FPS;
const APPROACH_FRAMES = 12; // cursor travel before a pointer step lands
const PRESS_FRAMES = 3; // how long the cursor stays squashed after a press
const CURSOR_OFFSET_PX = 6; // down-right of centre so the arrow never covers a label
const DRAG_FRAMES = 14;
const PREROLL_SETTLE_MS = 320;

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
  /**
   * "scroll" (the default) drives a scripted scroll down the page. "interaction"
   * hands the page to the beat script in scripts/interactions/ for this id, which
   * clicks, drags and types through the module instead of scrolling it. A deck
   * with body overflow hidden has nothing to scroll, so it has to be the latter.
   */
  capture_mode?: "scroll" | "interaction";
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
  /** Only present on interaction clips. Scroll clips are left exactly as they were. */
  mode?: "interaction";
  /** Beat id from scripts/interactions/, only on interaction clips. */
  beat?: string;
};

type SummaryRow = {
  id: string;
  status: "ok" | "still-only" | "failed";
  detail: string;
};

type Cli = {
  project: string | null;
  route: string | null;
  beat: string | null;
  stillsOnly: boolean;
  viewport: "mobile" | "desktop" | "both";
  keepFrames: boolean;
  selfTest: boolean;
  gateSheets: boolean;
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseCli(argv: string[]): Cli {
  const cli: Cli = {
    project: null,
    route: null,
    beat: null,
    stillsOnly: false,
    viewport: "both",
    keepFrames: false,
    selfTest: false,
    gateSheets: false,
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
      case "--beat":
        cli.beat = argv[++i] ?? null;
        break;
      case "--gate-sheets":
        cli.gateSheets = true;
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
// Interaction clips (Section 4 item 6)
// ---------------------------------------------------------------------------

/**
 * A synthetic pointer. Screenshots do not include the OS cursor, so the clip
 * has to draw its own or the module looks like it is operating itself.
 *
 * Desktop gets a 28px arrow, dark with a white outline so it survives both the
 * safety module's near-black stage and the finance module's cream paper. Mobile
 * gets a translucent tap disc instead, because a mouse arrow on a phone frame
 * is a lie. Either way the element is pointer-events none and aria-hidden, so
 * it never takes a click or a focus ring away from the module.
 */
const CURSOR_CSS = `
  #kap-cursor {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    background: none !important;
    pointer-events: none !important;
    z-index: 2147483647 !important;
    opacity: 0;
    will-change: transform;
  }
  #kap-cursor svg { display: block; }
`;

const CURSOR_ARROW_SVG =
  '<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false">' +
  '<path d="M4 2 L4 23.2 L9.7 17.6 L13.4 26 L17.4 24.2 L13.7 16 L21.6 15.8 Z" ' +
  'fill="#15171b" stroke="#ffffff" stroke-width="1.9" stroke-linejoin="round"/></svg>';

const CURSOR_TAP_SVG =
  '<svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true" focusable="false">' +
  '<circle cx="22" cy="22" r="16.5" fill="rgba(20,22,26,0.30)" ' +
  'stroke="rgba(255,255,255,0.92)" stroke-width="2.6"/></svg>';

type CursorTween = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startFrame: number;
  frames: number;
  fadeIn: boolean;
};

type Cursor = {
  x: number;
  y: number;
  shown: boolean;
  tween: CursorTween | null;
  pressUntil: number;
  held: boolean;
};

/** Viewport-space point plus the element box it came from. */
type HitPoint = { x: number; y: number };

async function installCursor(page: Page, vp: ViewportSpec): Promise<Cursor> {
  await page.addStyleTag({ content: CURSOR_CSS });
  await page.evaluate(
    ({ svg, hotX, hotY, startX, startY }) => {
      const el = document.createElement("div");
      el.id = "kap-cursor";
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = svg;
      document.body.appendChild(el);
      const place = (x: number, y: number, scale: number, opacity: number): void => {
        el.style.opacity = String(opacity);
        el.style.transform =
          `translate3d(${String(x - hotX)}px, ${String(y - hotY)}px, 0) ` +
          `scale(${String(scale)})`;
        el.style.transformOrigin = `${String(hotX)}px ${String(hotY)}px`;
      };
      (window as unknown as { __kapPlaceCursor: typeof place }).__kapPlaceCursor = place;
      place(startX, startY, 1, 0);
    },
    {
      svg: vp.isMobile ? CURSOR_TAP_SVG : CURSOR_ARROW_SVG,
      hotX: vp.isMobile ? 22 : 4,
      hotY: vp.isMobile ? 22 : 2,
      startX: Math.round(vp.width * 0.62),
      startY: Math.round(vp.height * 0.88),
    },
  );

  return {
    x: Math.round(vp.width * 0.62),
    y: Math.round(vp.height * 0.88),
    shown: false,
    tween: null,
    pressUntil: -1,
    held: false,
  };
}

async function paintCursor(page: Page, cursor: Cursor, frame: number): Promise<void> {
  let opacity = cursor.shown ? 1 : 0;

  if (cursor.tween) {
    const t = cursor.tween;
    const raw = t.frames > 0 ? Math.min(1, Math.max(0, (frame - t.startFrame) / t.frames)) : 1;
    // easeInOutCubic: leaves and arrives slowly, which reads as a hand rather
    // than a teleport.
    const eased = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
    cursor.x = t.fromX + (t.toX - t.fromX) * eased;
    cursor.y = t.fromY + (t.toY - t.fromY) * eased;
    if (t.fadeIn) opacity = Math.min(1, raw * 2.5);
    if (raw >= 1) cursor.tween = null;
  }

  const pressing = cursor.held || frame <= cursor.pressUntil;
  const scale = pressing ? 0.9 : 1;

  await page.evaluate(
    ({ x, y, s, o }) => {
      (
        window as unknown as {
          __kapPlaceCursor?: (a: number, b: number, c: number, d: number) => void;
        }
      ).__kapPlaceCursor?.(x, y, s, o);
    },
    { x: cursor.x, y: cursor.y, s: scale, o: opacity },
  );
}

/**
 * Where the pointer should land on `selector`, in viewport pixels.
 *
 * Ordinary elements get centre plus a small down-right offset so the arrow body
 * sits off the label rather than across it, clamped so the point stays inside
 * the box. A range input gets its thumb instead, because pressing the middle of
 * a track jumps the value before the drag even starts.
 */
async function hitPointFor(
  page: Page,
  selector: string,
  vp: ViewportSpec,
): Promise<HitPoint | null> {
  const hit = await page.evaluate(
    ({ sel, off }) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return null;
      if (el instanceof HTMLInputElement && el.type === "range") {
        const min = Number(el.min || "0");
        const max = Number(el.max || "100");
        const span = max - min || 1;
        const thumb = 20;
        const frac = (Number(el.value) - min) / span;
        return { x: r.left + thumb / 2 + frac * (r.width - thumb), y: r.top + r.height / 2 };
      }
      const dx = Math.min(off, r.width / 3);
      const dy = Math.min(off, r.height / 3);
      return { x: r.left + r.width / 2 + dx, y: r.top + r.height / 2 + dy };
    },
    { sel: selector, off: CURSOR_OFFSET_PX },
  );
  if (!hit) return null;
  return {
    x: Math.max(2, Math.min(vp.width - 2, hit.x)),
    y: Math.max(2, Math.min(vp.height - 2, hit.y)),
  };
}

/** The selector a step drives the pointer to, or null for the non-pointer verbs. */
function pointerSelector(step: Step): string | null {
  if ("click" in step) return step.click;
  if ("hover" in step) return step.hover;
  if ("drag" in step) return step.drag.selector;
  return null;
}

function stepLabel(step: Step): string {
  if ("click" in step) return `click ${step.click}`;
  if ("hover" in step) return `hover ${step.hover}`;
  if ("key" in step) return `key ${step.key}`;
  if ("fill" in step) return `fill ${step.fill.selector}`;
  if ("drag" in step) return `drag ${step.drag.selector}`;
  if ("eval" in step) return "eval";
  return `waitFor ${step.waitFor}`;
}

/** An in-flight drag, carried across frames by the recorder loop. */
type ActiveDrag = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startFrame: number;
  frames: number;
};

/**
 * Runs the non-pointer half of a step. Pointer motion is the loop's business,
 * because it has to be spread across frames.
 */
async function runFlatStep(page: Page, step: Step): Promise<void> {
  if ("key" in step) {
    await page.keyboard.press(step.key);
    return;
  }
  if ("fill" in step) {
    await page.evaluate(
      ({ sel, value }) => {
        const el = document.querySelector(sel);
        if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement)) return;
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      },
      { sel: step.fill.selector, value: step.fill.value },
    );
    return;
  }
  if ("eval" in step) {
    await page.evaluate(step.eval);
    return;
  }
  if ("waitFor" in step) {
    await page.waitForSelector(step.waitFor, { state: "visible", timeout: 15_000 });
  }
}

/** Preroll: put the module on the right screen, off camera, with no cursor. */
async function runPreroll(page: Page, steps: Step[], vp: ViewportSpec): Promise<void> {
  for (const step of steps) {
    if ("drag" in step) {
      const point = await hitPointFor(page, step.drag.selector, vp);
      if (point) {
        await page.mouse.move(point.x, point.y);
        await page.mouse.down();
        await page.mouse.move(
          point.x + (step.drag.delta?.[0] ?? 0),
          point.y + (step.drag.delta?.[1] ?? 0),
        );
        await page.mouse.up();
      }
    } else {
      const sel = pointerSelector(step);
      if (sel !== null) {
        await page.click(sel, { timeout: 15_000 });
      } else {
        await runFlatStep(page, step);
      }
    }
    await page.waitForTimeout(PREROLL_SETTLE_MS);
  }
}

/**
 * Slows the page's animation timeline so a CSS transition still reads as a
 * transition once the frames are played back at 30fps.
 *
 * The recorder runs on wall clock: state change, a 33ms wait, then the shutter.
 * The shutter is the expensive part, so a recorded frame costs 80 to 130ms of
 * real time, and a 400ms transition would be over in three frames, an eighth of
 * a second on screen. Setting the animation playback rate to the ratio between
 * a real frame and a played frame puts it back where the module's author put
 * it. This drives CSS animations and transitions; JS tweens on
 * requestAnimationFrame are untouched, which is why the finance simulator is
 * driven by a drag across frames rather than by one jump and its count-up.
 */
async function slowAnimations(context: BrowserContext, page: Page, frameCostMs: number): Promise<number> {
  const rate = Math.min(1, Math.max(0.2, TARGET_FRAME_MS / Math.max(1, frameCostMs)));
  const cdp = await context.newCDPSession(page);
  await cdp.send("Animation.enable");
  await cdp.send("Animation.setPlaybackRate", { playbackRate: rate });
  return rate;
}

type InteractionJob = {
  projectId: string;
  settleMs?: number;
  route: string;
  url: string;
  viewport: ViewportSpec;
  beat: Beat;
  /** Written once per module and viewport, then reused by every beat. */
  moduleStillPath: string;
};

/**
 * Records one beat as a frame sequence and assembles it exactly the way the
 * scroll pass does: 30fps, device scale factor 2, one page.screenshot per
 * frame, the same x264 flags and the same full-to-limited range conversion.
 *
 * The frame loop is the whole point. Steps fire when the counter reaches their
 * `at`, and every frame in between is still recorded, so the module's own
 * animation is on camera rather than skipped over.
 */
export async function recordInteraction(
  browser: Browser,
  job: InteractionJob,
  dirs: Dirs,
  cli: Cli,
): Promise<CaptureEntry | null> {
  const vp = job.viewport;
  const beat = job.beat;
  const clipId = `${job.projectId}-${beat.id}-${vp.name}`;
  const outWidth = vp.width * 2;
  const outHeight = vp.height * 2;

  console.log(
    `\n[${clipId}] ${job.url} at ${vp.width}x${vp.height} dsf2 -> ${outWidth}x${outHeight}, ` +
      `${String(beat.durationFrames)}f`,
  );
  if (beat.note) console.log(`  beat: ${beat.note}`);

  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    userAgent: USER_AGENTS[vp.name],
    // The finance module gates its count-up, its row stagger and its waterfall
    // draw on prefers-reduced-motion. We want all three, so say so out loud
    // rather than trusting the default.
    reducedMotion: "no-preference",
  });

  await context.addInitScript({
    content: "globalThis.__name = globalThis.__name || function (f) { return f; };",
  });

  try {
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);

    await navigateWithRetry(page, job.url);
    await page.waitForTimeout(job.settleMs ?? SETTLE_MS);

    const dismissed = await dismissOverlays(page);
    for (const item of dismissed) console.log(`  dismissed: ${item}`);
    if (dismissed.length === 0) console.log("  dismissed: nothing found");

    // The checked still is the module's first screen, one per viewport, shared
    // by every beat of that module.
    ensureDir(dirs.stills);
    if (!fs.existsSync(job.moduleStillPath)) {
      await page.screenshot({ path: job.moduleStillPath, type: "png" });
      console.log(`  still: ${path.relative(ROOT, job.moduleStillPath)}`);
    }

    const pageHeightPx = await page.evaluate(
      () => document.documentElement.scrollHeight || document.body.scrollHeight,
    );

    if (cli.stillsOnly) {
      console.log("  stills-only: skipping video");
      return null;
    }

    // Measure what a frame really costs here, then hand that to the animation
    // timeline so the module's transitions land on the right number of frames.
    const probeStart = Date.now();
    for (let i = 0; i < 4; i += 1) await page.screenshot({ type: "jpeg", quality: 92 });
    const frameCostMs = (Date.now() - probeStart) / 4 + FRAME_WAIT_MS;
    const rate = await slowAnimations(context, page, frameCostMs);
    console.log(
      `  frame cost ${String(Math.round(frameCostMs))}ms, animation playback rate ${rate.toFixed(2)}`,
    );

    if (beat.preroll && beat.preroll.length > 0) {
      await runPreroll(page, beat.preroll, vp);
      console.log(`  preroll: ${String(beat.preroll.length)} steps, not recorded`);
    }

    const cursor = await installCursor(page, vp);

    const frameDir = path.join(dirs.frames, clipId);
    fs.rmSync(frameDir, { recursive: true, force: true });
    ensureDir(frameDir);

    const ordered = [...beat.steps].sort((a, b) => a.at - b.at);
    const approachAt = new Map<number, Step[]>();
    for (const step of ordered) {
      if (pointerSelector(step) === null) continue;
      const start = Math.max(0, step.at - APPROACH_FRAMES);
      const bucket = approachAt.get(start) ?? [];
      bucket.push(step);
      approachAt.set(start, bucket);
    }

    // The safety module's hazard illustration reflows every time a spot is
    // taken, so a target resolved when the approach began can have moved by the
    // time the press lands. Re-resolve one frame out and re-aim the tween.
    const refreshAt = new Map<number, Step[]>();
    for (const step of ordered) {
      if (pointerSelector(step) === null) continue;
      if (step.at < 1) continue;
      const bucket = refreshAt.get(step.at - 1) ?? [];
      bucket.push(step);
      refreshAt.set(step.at - 1, bucket);
    }

    let drag: ActiveDrag | null = null;
    const fired: string[] = [];

    for (let f = 0; f < beat.durationFrames; f += 1) {
      // 1. Start any approach that ends on a later frame's `at`.
      for (const step of approachAt.get(f) ?? []) {
        const sel = pointerSelector(step);
        if (sel === null) continue;
        const point = await hitPointFor(page, sel, vp);
        if (!point) {
          console.log(`  frame ${String(f)}: approach target missing, ${sel}`);
          continue;
        }
        cursor.tween = {
          fromX: cursor.x,
          fromY: cursor.y,
          toX: point.x,
          toY: point.y,
          startFrame: f,
          frames: Math.max(1, step.at - f),
          fadeIn: !cursor.shown,
        };
        cursor.shown = true;
      }

      // 1b. Re-aim at a target that moved under the cursor mid-approach.
      for (const step of refreshAt.get(f) ?? []) {
        if (!cursor.tween) continue;
        const sel = pointerSelector(step);
        if (sel === null) continue;
        const point = await hitPointFor(page, sel, vp);
        if (!point) continue;
        if (Math.abs(point.x - cursor.tween.toX) < 2 && Math.abs(point.y - cursor.tween.toY) < 2) {
          continue;
        }
        cursor.tween.toX = point.x;
        cursor.tween.toY = point.y;
      }

      // 2. Carry an in-flight drag. The cursor rides the drag, not a tween.
      if (drag) {
        const done = Math.min(1, Math.max(0, (f - drag.startFrame) / drag.frames));
        const eased = 1 - Math.pow(1 - done, 3);
        cursor.x = drag.fromX + (drag.toX - drag.fromX) * eased;
        cursor.y = drag.fromY + (drag.toY - drag.fromY) * eased;
        cursor.tween = null;
        await page.mouse.move(cursor.x, cursor.y);
        if (done >= 1) {
          await page.mouse.up();
          cursor.held = false;
          cursor.pressUntil = -1;
          drag = null;
        }
      }

      // 3. Put the cursor where this frame wants it, before anything fires.
      await paintCursor(page, cursor, f);

      // 4. Fire the steps due on this frame.
      let pressedThisFrame = false;
      for (const step of ordered) {
        if (step.at !== f) continue;
        const sel = pointerSelector(step);
        if (sel === null) {
          await runFlatStep(page, step);
          fired.push(`${String(f)}: ${stepLabel(step)}`);
          continue;
        }
        if ("hover" in step) {
          await page.mouse.move(cursor.x, cursor.y);
          fired.push(`${String(f)}: ${stepLabel(step)}`);
          continue;
        }
        if ("click" in step) {
          await page.mouse.move(cursor.x, cursor.y);
          await page.mouse.down();
          await page.mouse.up();
          cursor.pressUntil = f + PRESS_FRAMES - 1;
          pressedThisFrame = true;
          fired.push(`${String(f)}: ${stepLabel(step)}`);
          continue;
        }
        if ("drag" in step) {
          const frames = step.drag.frames ?? DRAG_FRAMES;
          let toX = cursor.x + (step.drag.delta?.[0] ?? 0);
          let toY = cursor.y + (step.drag.delta?.[1] ?? 0);
          if (step.drag.toSelector) {
            const dest = await hitPointFor(page, step.drag.toSelector, vp);
            if (dest) {
              toX = dest.x;
              toY = dest.y;
            }
          }
          await page.mouse.move(cursor.x, cursor.y);
          await page.mouse.down();
          cursor.held = true;
          drag = {
            fromX: cursor.x,
            fromY: cursor.y,
            toX: Math.max(2, Math.min(vp.width - 2, toX)),
            toY: Math.max(2, Math.min(vp.height - 2, toY)),
            startFrame: f,
            frames,
          };
          pressedThisFrame = true;
          fired.push(`${String(f)}: ${stepLabel(step)}`);
        }
      }

      // The press has to be on the frame it happens on, not the next one.
      if (pressedThisFrame) await paintCursor(page, cursor, f);

      // 5. Let the page move, then take the frame.
      await page.waitForTimeout(FRAME_WAIT_MS);
      const framePath = path.join(frameDir, `${String(f).padStart(4, "0")}.jpg`);
      await page.screenshot({ path: framePath, type: "jpeg", quality: 92 });
    }

    if (cursor.held) await page.mouse.up();
    console.log(`  frames: ${String(beat.durationFrames)} written`);
    for (const line of fired) console.log(`    fired ${line}`);

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
      stillPath: path.relative(ROOT, job.moduleStillPath).split(path.sep).join("/"),
      width: outWidth,
      height: outHeight,
      fps: FPS,
      durationFrames: beat.durationFrames,
      durationSec: Number((beat.durationFrames / FPS).toFixed(3)),
      capturedAt: new Date().toISOString(),
      scrollDistancePx: 0,
      pageHeightPx,
      dismissed,
      mode: "interaction",
      beat: beat.id,
    };
  } finally {
    await context.close();
  }
}

/**
 * A still of the screen a desktop-only beat lives on, taken at 390 wide.
 * This is the evidence for the call: the beat is desktop only because the
 * mobile layout of that screen cannot carry it, and here is the layout.
 */
async function mobileEvidenceStill(
  browser: Browser,
  job: Omit<InteractionJob, "moduleStillPath">,
  outPath: string,
): Promise<void> {
  const vp = VIEWPORTS.mobile;
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: USER_AGENTS.mobile,
    reducedMotion: "no-preference",
  });
  await context.addInitScript({
    content: "globalThis.__name = globalThis.__name || function (f) { return f; };",
  });
  try {
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
    await navigateWithRetry(page, job.url);
    await page.waitForTimeout(job.settleMs ?? SETTLE_MS);
    await dismissOverlays(page);
    if (job.beat.preroll && job.beat.preroll.length > 0) {
      await runPreroll(page, job.beat.preroll, vp);
    }
    ensureDir(path.dirname(outPath));
    await page.screenshot({ path: outPath, type: "png" });
    console.log(`  mobile evidence still: ${path.relative(ROOT, outPath)}`);
  } finally {
    await context.close();
  }
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

/** Pulls one frame out of a clip at a fraction of its length. */
function extractFrame(videoPath: string, frameIndex: number, outPath: string): void {
  const res = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      videoPath,
      "-vf",
      `select=eq(n\\,${String(frameIndex)})`,
      "-vsync",
      "0",
      "-frames:v",
      "1",
      outPath,
    ],
    { encoding: "utf8" },
  );
  if (res.status !== 0) {
    const tail = (res.stderr ?? "").split("\n").slice(-6).join("\n");
    throw new Error(`ffmpeg frame extract failed for ${videoPath}:\n${tail}`);
  }
}

/**
 * One contact sheet per module and viewport: a row per beat, three columns at
 * 25, 50 and 75 percent of the clip. This is the gate. Every sheet gets looked
 * at, and anything with an overlay, a cursor sitting on a label, or a row whose
 * three frames are identical goes back and gets re-recorded.
 */
function buildGateSheets(indexFile: string, outDir: string): string[] {
  const entries = readCapturesIndex(indexFile).filter((e) => e.mode === "interaction");
  if (entries.length === 0) {
    console.log("No interaction clips in captures.json. Nothing to sheet.");
    return [];
  }

  const groups = new Map<string, CaptureEntry[]>();
  for (const entry of entries) {
    const key = `${entry.project}-${entry.viewport}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(entry);
    groups.set(key, bucket);
  }

  ensureDir(outDir);
  const written: string[] = [];

  for (const [key, clips] of groups) {
    const order = beatsFor(clips[0].project).map((b) => b.id);
    clips.sort((a, b) => order.indexOf(a.beat ?? "") - order.indexOf(b.beat ?? ""));

    const tmp = path.join(outDir, `.tmp-${key}`);
    fs.rmSync(tmp, { recursive: true, force: true });
    ensureDir(tmp);

    let n = 1;
    for (const clip of clips) {
      for (const pct of [0.25, 0.5, 0.75]) {
        const idx = Math.min(clip.durationFrames - 1, Math.round(clip.durationFrames * pct));
        extractFrame(
          path.join(ROOT, clip.path),
          idx,
          path.join(tmp, `${String(n).padStart(3, "0")}.png`),
        );
        n += 1;
      }
      console.log(`  sheet row ${String(clips.indexOf(clip) + 1)}: ${clip.id}`);
    }

    const sheetPath = path.join(outDir, `${key}.png`);
    const res = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-framerate",
        "1",
        "-i",
        path.join(tmp, "%03d.png"),
        "-vf",
        `scale=-2:480,tile=3x${String(clips.length)}:margin=8:padding=6:color=0x1a1a1a`,
        "-frames:v",
        "1",
        sheetPath,
      ],
      { encoding: "utf8" },
    );
    if (res.status !== 0) {
      const tail = (res.stderr ?? "").split("\n").slice(-8).join("\n");
      throw new Error(`ffmpeg tile failed for ${key}:\n${tail}`);
    }
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(`sheet: ${path.relative(ROOT, sheetPath)} (${String(clips.length)} rows)`);
    written.push(sheetPath);
  }

  return written;
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

  if (cli.gateSheets) {
    buildGateSheets(
      path.join(CAPTURES_DIR, "captures.json"),
      path.join(ROOT, "out", "gate-t1"),
    );
    return;
  }

  const wantedViewports: ViewportSpec[] =
    cli.viewport === "both"
      ? [VIEWPORTS.mobile, VIEWPORTS.desktop]
      : [VIEWPORTS[cli.viewport]];

  const jobs: CaptureJob[] = [];
  const beatJobs: InteractionJob[] = [];
  const evidenceJobs: { job: Omit<InteractionJob, "moduleStillPath">; out: string }[] = [];
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

        if (project.capture_mode === "interaction") {
          const beats = beatsFor(project.id);
          if (beats.length === 0) {
            console.error(
              `${project.id} is capture_mode "interaction" but scripts/interactions/ has no beats for it.`,
            );
            process.exit(1);
          }
          for (const beat of beats) {
            if (cli.beat && beat.id !== cli.beat) continue;
            for (const vp of wantedViewports) {
              const base = {
                projectId: project.id,
                settleMs: project.settle_ms,
                route,
                url: joinUrl(project.url, route),
                viewport: vp,
                beat,
              };
              if (beat.viewport !== "both" && beat.viewport !== vp.name) {
                // The beat cannot carry this viewport. Take a still of the
                // screen it lives on at 390 wide so the call is on the record.
                if (vp.name === "mobile") {
                  evidenceJobs.push({
                    job: { ...base, viewport: VIEWPORTS.mobile },
                    out: path.join(
                      CAPTURES_DIR,
                      "stills",
                      `${project.id}-${beat.id}-mobile-evidence.png`,
                    ),
                  });
                }
                continue;
              }
              beatJobs.push({
                ...base,
                moduleStillPath: path.join(
                  CAPTURES_DIR,
                  "stills",
                  `${project.id}-${routeSlug(route)}-${vp.name}.png`,
                ),
              });
            }
          }
          continue;
        }

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
    if (jobs.length === 0 && beatJobs.length === 0 && evidenceJobs.length === 0) {
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

    for (const beatJob of beatJobs) {
      const clipId = `${beatJob.projectId}-${beatJob.beat.id}-${beatJob.viewport.name}`;
      try {
        const entry = await recordInteraction(browser, beatJob, dirs, cli);
        if (entry) {
          entries.push(entry);
          rows.push({
            id: clipId,
            status: "ok",
            detail: `${String(entry.width)}x${String(entry.height)}, ${String(entry.durationFrames)}f, ${String(beatJob.beat.steps.length)} steps`,
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

    for (const evidence of evidenceJobs) {
      const label = `${evidence.job.projectId}-${evidence.job.beat.id}-mobile-evidence`;
      try {
        console.log(`\n[${label}] desktop-only beat, taking the mobile still instead`);
        await mobileEvidenceStill(browser, evidence.job, evidence.out);
      } catch (err) {
        console.error(`  FAILED ${label}: ${(err as Error).message.split("\n")[0]}`);
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
