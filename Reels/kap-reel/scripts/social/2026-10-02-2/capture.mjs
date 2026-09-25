// Fresh captures of the Thrillers demo for the 2026-10-02-2 carousel.
// 390x844 CSS, device scale 3 (1170x2532 PNG). Read-only: no form is submitted.
import { chromium } from "playwright";
import fs from "node:fs";
const base = "https://thrillers.ka-testing2.com";
const OUT = "D:/K & A Performance Site/Social Media Management/To Be Released/2026-10-02-2/source/captures";
fs.mkdirSync(OUT, { recursive: true });
// slug, route, heading text to scroll to (null = top), headroom css px, marks: texts to locate
const SHOTS = [
  ["home", "/", null, 0, ["Book the trailer", "Florida's first"]],
  ["rides", "/experiences", "VR Rides", 160, ["VR Rides", "200+", "Pick a world"]],
  ["everyone", "/experiences", "First-timers", 150, ["Something for everyone", "First-timers", "Kids & teenagers", "Grown-ups"]],
  ["pricing", "/pricing", "Early Bird", 110, ["100", "Valid for four months", "A month"]],
  ["book", "/book", "Phone", 110, ["Your event, in a few lines", "Event date", "Kind of event", "Where are we parking"]],
  ["next", "/book", "What happens next", 100, ["What happens next", "The moment you hit send", "Within one business day", "Direct lines"]],
];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" });
const p = await ctx.newPage();
const log = [];
for (const [slug, route, heading, headroom, marks] of SHOTS) {
  await p.goto(base + route, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.addStyleTag({ content: "::-webkit-scrollbar{display:none}html{scrollbar-width:none}html,body,*{scroll-behavior:auto!important}" });
  await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
  await p.waitForTimeout(2500);
  let y = 0;
  if (heading) {
    y = await p.evaluate(({ heading, headroom }) => {
      const el = [...document.querySelectorAll("h1,h2,h3,dt,label")].find(h => h.textContent.replace(/\s+/g, " ").includes(heading));
      if (!el) throw new Error("no heading " + heading);
      return Math.max(0, Math.round(el.getBoundingClientRect().top + scrollY - headroom));
    }, { heading, headroom });
  }
  await p.evaluate(y => scrollTo(0, y), y);
  await p.waitForTimeout(1500);
  const boxes = await p.evaluate((marks) => {
    const out = {};
    const all = [...document.querySelectorAll("body *")];
    for (const m of marks) {
      // smallest visible element whose own text includes m
      let best = null;
      for (const el of all) {
        const t = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (!t.toLowerCase().includes(m.toLowerCase())) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > innerHeight) continue;
        if (!best || t.length < best.len) best = { len: t.length, x: r.x, y: r.y, w: r.width, h: r.height, tag: el.tagName };
      }
      out[m] = best;
    }
    return out;
  }, marks);
  const file = `${OUT}/${slug}.png`;
  await p.screenshot({ path: file });
  log.push({ slug, url: base + route, scrollY: y, capturedAt: new Date().toISOString(), viewport: "390x844 css, dsf 3, 1170x2532 px", boxesCss: boxes });
  console.log(slug, y, JSON.stringify(boxes));
}
fs.writeFileSync(`${OUT}/capture-log.json`, JSON.stringify({ site: "Thrillers Mobile VR demo (domain pending)", script: "kap-reel/scripts/social/2026-10-02-2/capture.mjs", captures: log }, null, 2));
await b.close();
