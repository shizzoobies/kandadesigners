// Captures for Wed 2026-10-07, "When a job aid beats a course".
//
// Real screens from the live K&A site, reached the way a learner reaches them
// (clicking Next, ticking boxes), never edited:
//   rfi-checklist   The RFI sample's "Before you send" checklist (screen 9 of 9),
//                   the job aid that sample hands the learner to keep.
//   safety-picker   The safety sample's walk-through card screen, checks ticked.
//   safety-card     The same learner's finished "My walk-through card".
//   training-jobaid The /training/ page's "Job aids and performance support" card.
//
// Run from D:\kap-reel:  node scripts/social/2026-10-07/capture.mjs
// Writes assets/social/2026-10-07/*.png and captures.json (url, time, size).
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire("D:/kap-reel/package.json");
const { chromium } = require("playwright");

const OUT = path.resolve("assets/social/2026-10-07");
fs.mkdirSync(OUT, { recursive: true });
const BASE = "https://ka-performancefl.com";
const log = [];

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, reducedMotion: "reduce" });
const page = await ctx.newPage();

async function shot(id, locator, url) {
  const file = path.join(OUT, `${id}.png`);
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  // Site chrome that floats over content (the chat launcher, sticky bars) is hidden
  // for the shot. Nothing inside the captured element is touched.
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("body *")) {
      if (getComputedStyle(el).position === "fixed") el.style.visibility = "hidden";
    }
  });
  await locator.screenshot({ path: file });
  const box = await locator.boundingBox();
  log.push({ id, url, file: `assets/social/2026-10-07/${id}.png`, cssSize: [Math.round(box.width), Math.round(box.height)], scale: 3, capturedAt: new Date().toISOString() });
  console.log(`captured ${id}`);
}

async function nextUntil(screenId, max = 12) {
  for (let i = 0; i < max; i++) {
    const visible = await page.locator(`#${screenId}`).isVisible();
    if (visible) return;
    const next = page.locator("#next");
    if (await next.isDisabled()) {
      // The safety hazard hunt gates Next until every hotspot is found: find them.
      const spots = page.locator(".screen:not([hidden]) .hot[data-spot]");
      for (let s = 0; s < (await spots.count()); s++) {
        await spots.nth(s).click({ force: true });
        await page.waitForTimeout(250);
        await page.keyboard.press("Escape").catch(() => {});
        const close = page.locator("dialog[open] button").first();
        if (await close.count()) await close.click().catch(() => {});
      }
    }
    await next.click();
    await page.waitForTimeout(500);
  }
  throw new Error(`never reached ${screenId}`);
}

// 1. RFI sample, "Before you send"
{
  const url = `${BASE}/training-samples/rfi/`;
  await page.goto(url, { waitUntil: "networkidle" });
  await nextUntil("screen-9");
  await shot("rfi-checklist", page.locator("#screen-9 .takeaway"), url);
}

// 2. Safety sample, walk-through card
{
  const url = `${BASE}/training-samples/safety/`;
  await page.goto(url, { waitUntil: "networkidle" });
  await nextUntil("screen-10");
  // Tick one real check per zone, as a learner would.
  const picks = [
    "Exits marked, unlocked and clear on both sides",
    "Every leading edge and opening walked, not scanned from across the floor",
    "Ground fault protection on temporary circuits, checked rather than assumed",
    "Debris cleared as the work makes it, with bins where the work is",
  ];
  for (let z = 1; z <= 4; z++) {
    const btn = page.locator(`#accb-${z}`);
    if ((await btn.getAttribute("aria-expanded")) !== "true") await btn.click();
    await page.waitForTimeout(200);
    await page.locator(`#accp-${z} input[value="${picks[z - 1]}"]`).check();
    if (z < 4) {
      await btn.click(); // close again so the next zone sits under the tabs
      await page.waitForTimeout(150);
    }
  }
  await shot("safety-picker", page.locator("#screen-10"), url);
  await page.locator("#tab-10b").click();
  await page.waitForTimeout(400);
  await shot("safety-card", page.locator("#card"), url);
}

// 3. /training/ capability panel: the hero's tabbed "What we build" stage. Click
//    the Job aids tab (and Microlearning) the way a visitor does, then shoot the panel.
{
  const url = `${BASE}/training/`;
  for (const [id, tab, title] of [["training-jobaid", "Job aids", "Job aids and performance support"], ["training-micro", "Microlearning", "Microlearning"]]) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("button", { has: page.locator("span", { hasText: new RegExp("^" + tab + "$") }) }).first().click();
    await page.waitForTimeout(900);
    const panel = page.locator("article.cap-panel").filter({ has: page.locator("h2", { hasText: title }) }).first();
    await shot(id, panel, url);
  }
}

await b.close();
fs.writeFileSync(path.join(OUT, "captures.json"), JSON.stringify({ captures: log }, null, 2) + "\n");
console.log("wrote captures.json");
