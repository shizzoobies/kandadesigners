/**
 * Captures for the "One screen, one decision" tutorial reel.
 *
 *   node node_modules/tsx/dist/cli.mjs src/tutorial/onescreen/scripts/capture.ts
 *
 * Real screens from the live safety sample, "Spot it before it hurts someone"
 * (ka-performancefl.com/training-samples/safety/, listed on
 * ka-performancefl.com/training/samples/). Three screens, each of which asks
 * the learner for one thing:
 *
 *   hunt    screen 7, the hazard hunt: tap the thing that is wrong.
 *   bench   screen 8, the control workbench: pick the control for one situation.
 *   audit   screen 9, inspect before release: stop the work or let it go.
 *
 * Captured the way scripts/capture.ts captures a mobile site: Playwright,
 * Chromium, a touch phone context with the iPhone user agent, motion allowed,
 * networkidle, a settle. The one difference is the viewport: 405 by 720 CSS
 * pixels at a device scale of 8/3, which is exactly 1080 by 1920, so the still
 * is the reel's own canvas and a phone sized layout at once. capture.ts's 390
 * by 844 at 2x would be 780 by 1688.
 *
 * Every tap is a real tap on the live page (page.tap), and the element it
 * landed on is measured before the tap and written, in capture pixels, into
 * src/tutorial/onescreen/captures.json, so the ring the reel draws sits where
 * the finger went. Focus is blurred before each shutter: the module focuses its
 * heading on every screen change for screen readers, and a keyboard focus ring
 * on a phone screenshot is not what a learner tapping through sees.
 *
 * PNGs go to assets/captures/onescreen/ (gitignored, like every capture).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "playwright";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const OUT_DIR = path.join(ROOT, "assets", "captures", "onescreen");
const MANIFEST = path.join(HERE, "..", "captures.json");

const URL = "https://ka-performancefl.com/training-samples/safety/";
const VIEWPORT = { width: 405, height: 720 };
const SCALE = 8 / 3;
const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const SETTLE_MS = 900;

type Box = { x: number; y: number; width: number; height: number };

export type OnescreenCapture = {
  id: string;
  /** Path under assets/, for staticFile() with the "assets/" prefix removed. */
  file: string;
  screen: number;
  what: string;
  /** Where the tap that leads OUT of this state lands, in capture pixels. */
  tap: Box | null;
};

async function settle(page: Page, ms = SETTLE_MS): Promise<void> {
  await page.waitForTimeout(ms);
  // A tap leaves the pointer, and so a hover state, on whatever it touched.
  await page.mouse.move(2, 2);
  await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (el && el !== document.body) el.blur();
  });
  await page.waitForTimeout(120);
}

async function boxOf(page: Page, selector: string): Promise<Box> {
  const b = await page.locator(selector).first().boundingBox();
  if (!b) throw new Error(`${selector} is not on screen.`);
  const s = (v: number) => Math.round(v * SCALE);
  return { x: s(b.x), y: s(b.y), width: s(b.width), height: s(b.height) };
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    isMobile: true,
    hasTouch: true,
    userAgent: USER_AGENT,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const shots: OnescreenCapture[] = [];

  const shoot = async (
    id: string,
    screen: number,
    what: string,
    tap: Box | null,
  ): Promise<void> => {
    const file = path.join(OUT_DIR, `${id}.png`);
    await page.screenshot({ path: file });
    const rel = path.relative(ROOT, file).split(path.sep).join("/");
    shots.push({ id, file: rel, screen, what, tap });
    console.log(`  ${rel}  ${what}`);
  };

  const meter = async () =>
    page.evaluate(() => document.querySelector("#progress-text")?.textContent ?? "");

  try {
    await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
    await settle(page, 1500);

    // Screens 1 to 6 are reading screens. Step past them with real taps.
    for (let i = 1; i < 7; i += 1) {
      await page.tap("#next");
      await settle(page, 450);
    }
    if (!/Screen 7 of/.test(await meter())) throw new Error(`expected screen 7, got "${await meter()}"`);

    // Screen 7, the hazard hunt. One ask: tap what needs attention.
    await settle(page);
    const ladder = '.hot[data-spot="ladder"]';
    await shoot("hunt-idle", 7, "Hazard hunt, nothing found yet", await boxOf(page, ladder));
    await page.tap(ladder);
    await settle(page);
    await shoot("hunt-found", 7, "The ladder tapped: checked in the scene and the list, Found 1 of 6", null);
    // The feedback is written under the inspection list; scroll the screen to it.
    await page.evaluate(() => {
      const body = document.querySelector("#screen-7 .screen-body");
      if (body) body.scrollTop = body.scrollHeight;
    });
    await settle(page, 500);
    await shoot("hunt-feedback", 7, "The feedback for the ladder, under the checked list", null);

    // Satisfy the six hazard gate so Next moves on, exactly as a learner who
    // found all six would. Nothing of this state is shown.
    await page.evaluate(() => {
      document.querySelectorAll<HTMLButtonElement>(".spot[data-spot]").forEach((b) => {
        if (b.getAttribute("aria-pressed") !== "true") b.click();
      });
    });
    await page.tap("#next");
    await settle(page);
    if (!/Screen 8 of/.test(await meter())) throw new Error(`expected screen 8, got "${await meter()}"`);

    // Screen 8, the control workbench. One ask: which control fits this situation.
    await page.tap("#tab-8b");
    await settle(page);
    const target = "#control-board .placement-target >> visible=true";
    await shoot("bench-idle", 8, "Control workbench, Reroute the drain, nothing placed", await boxOf(page, target));
    await page.tap(target);
    await settle(page);
    const reroute = '.work-tool[data-tool="h1"]';
    await shoot("bench-toolkit", 8, "The six controls, one to choose", await boxOf(page, reroute));
    await page.tap(reroute);
    await settle(page, 500);
    await shoot("bench-chosen", 8, "Reroute overhead chosen, waiting to be placed on the situation", await boxOf(page, target));
    await page.tap(target);
    await settle(page);
    await shoot("bench-placed", 8, "Reroute the line overhead placed, Placed 1 of 6", null);

    await page.tap("#next");
    await settle(page);
    if (!/Screen 9 of/.test(await meter())) throw new Error(`expected screen 9, got "${await meter()}"`);

    // Screen 9, inspect before release. One ask: stop this work, or let it go.
    const walkway = '.audit-location[data-finding] >> nth=1';
    await shoot("audit-idle", 9, "Inspect before release, eight locations", await boxOf(page, walkway));
    await page.tap(walkway);
    await settle(page);
    const flag = "#audit-flag";
    await shoot("audit-open", 9, "Wet walkway field notes, Place hold marker", await boxOf(page, flag));
    await page.tap(flag);
    await settle(page);
    await shoot("audit-hold", 9, "Hold marker placed on the wet walkway", null);
    await page.evaluate(() => {
      const body = document.querySelector("#screen-9 .screen-body");
      if (body) body.scrollTop = 0;
    });
    await settle(page, 500);
    await shoot("audit-board", 9, "The locations after the hold: Inspected 1 of 8, 1 hold", null);
  } finally {
    await browser.close();
  }

  const manifest = {
    _note:
      "Written by src/tutorial/onescreen/scripts/capture.ts. Real screens from the live safety sample, " +
      "captured at 405 by 720 CSS pixels and a device scale of 8/3, so every still is 1080 by 1920. " +
      "tap is the element the next real tap landed on, in capture pixels.",
    url: URL,
    capturedAt: new Date().toISOString(),
    width: Math.round(VIEWPORT.width * SCALE),
    height: Math.round(VIEWPORT.height * SCALE),
    captures: shots,
  };
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`wrote ${path.relative(ROOT, MANIFEST)} (${shots.length} captures)`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
