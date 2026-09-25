// Builds the 2026-10-02-2 carousel: Thrillers Mobile VR site tour.
// HTML per slide -> Playwright screenshot at 2x -> sharp downscale to 1080x1350 JPG.
// Run from D:\kap-reel: node scripts/social/2026-10-02-2/build.mjs
import { chromium } from "playwright";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const DAY = "D:/K & A Performance Site/Social Media Management/To Be Released/2026-10-02-2";
const CAP = `${DAY}/source/captures`;
const WORK = `${DAY}/source/html`;
const MEDIA = `${DAY}/media`;
const FONTS = "D:/kap-reel/assets/brand/fonts";
const LOGO = "D:/kap-reel/assets/brand/logo/logo-lockup.webp";
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(MEDIA, { recursive: true });

const url = (p) => "file:///" + p.replace(/\\/g, "/").replace(/ /g, "%20").replace(/&/g, "%26");

// Phone geometry on the slide (px). Screen is 390 css wide in the capture.
const PHONE = { x: 492, y: 300, w: 548, bezel: 14 };
const SCREEN = { x: PHONE.x + PHONE.bezel, y: PHONE.y + PHONE.bezel, w: PHONE.w - 2 * PHONE.bezel };
const S = SCREEN.w / 390;
const TOTAL = 8;

const FEATURES = [
  {
    n: 1, cap: "home", kicker: "Home page",
    head: "Built for the phone first.",
    why: "Event planners search on their phones. Before the first scroll, the page says what Thrillers is and where it comes from.",
    label: "What it is and where, in one screen",
    region: { x: 10, y: 364, w: 312, h: 410 },
  },
  {
    n: 2, cap: "rides", kicker: "Ride library",
    head: "A ride library parents can pick from.",
    why: "Four rides, each explained in plain words, so families choose the ride before they ever pick up the phone.",
    label: "VR Rides: over 200 experiences, described",
    region: { x: 10, y: 112, w: 370, h: 472 },
  },
  {
    n: 3, cap: "everyone", kicker: "Who it's for",
    head: "Answers the doubts before the call.",
    why: "Will the kids like it? Will the grown-ups? The page answers for first-timers, kids and teenagers, and grown-ups.",
    label: "First-timers, kids and teenagers, grown-ups",
    region: { x: 10, y: 140, w: 370, h: 470 },
  },
  {
    n: 4, cap: "pricing", kicker: "Plans and pricing",
    head: "The price is right on the page.",
    why: "The Early Bird plan is $100 a month for four months. A clear price brings in buyers, not tire kickers.",
    label: "$100 a month, valid for four months",
    region: { x: 10, y: 100, w: 300, h: 215 },
  },
  {
    n: 5, cap: "book", kicker: "Booking form",
    head: "Browsers become bookings.",
    why: "A short request form asks for the date, the kind of event, and where to park. Everything the owners need to say yes.",
    label: "Event date, kind of event, where to park",
    region: { x: 34, y: 236, w: 322, h: 366 },
  },
  {
    n: 6, cap: "next", kicker: "What happens next",
    head: "No guessing after they hit send.",
    why: "The page lays out every step, promises a reply within one business day, and lists direct lines to Bear and Travis.",
    label: "A reply within one business day",
    region: { x: 10, y: 92, w: 370, h: 456 },
  },
];

const css = `
@font-face { font-family: "Schibsted"; src: url("${url(FONTS + "/Schibsted-VF.woff2")}") format("woff2"); font-weight: 400 900; }
@font-face { font-family: "Atkinson"; src: url("${url(FONTS + "/AtkinsonNext-VF.woff2")}") format("woff2"); font-weight: 200 800; }
:root { --canvas:#F8F5F2; --ink:#221C15; --rust:#9A3412; --amber:#D97706; --muted:#5b5148; --line:#e4dcd3; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1080px; height: 1350px; background: var(--canvas); overflow: hidden; }
body { font-family: "Atkinson", sans-serif; color: var(--ink); position: relative; }
.bar { position: absolute; left: 64px; right: 64px; top: 52px; height: 72px; display: flex; align-items: center; justify-content: space-between; }
.bar img { height: 68px; }
.bar .site { text-align: right; }
.bar .site b { font-family: "Schibsted"; font-weight: 800; font-size: 30px; letter-spacing: -0.2px; display: block; }
.bar .site span { font-size: 21px; color: var(--muted); }
.rule { position: absolute; left: 64px; right: 64px; top: 150px; height: 2px; background: var(--line); }
.col { position: absolute; left: 64px; width: 400px; top: 196px; }
.kicker { font-family: "Schibsted"; font-weight: 700; font-size: 22px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--rust); display: flex; gap: 14px; align-items: baseline; }
.kicker i { font-style: normal; color: var(--muted); letter-spacing: 1px; }
h1 { font-family: "Schibsted"; font-weight: 800; font-size: 60px; line-height: 1.02; letter-spacing: -1.6px; margin-top: 22px; }
.why { font-size: 28px; line-height: 1.38; margin-top: 26px; color: #3a3129; }
.anno { position: absolute; left: 64px; width: 360px; }
.anno .t { font-family: "Schibsted"; font-weight: 700; font-size: 25px; line-height: 1.2; color: var(--rust); border-top: 3px solid var(--rust); padding-top: 12px; }
.foot { position: absolute; left: 64px; bottom: 52px; width: 400px; }
.foot .built { font-size: 21px; color: var(--muted); }
.foot .built b { color: var(--ink); }
.swipe { font-family: "Schibsted"; font-weight: 700; font-size: 26px; margin-top: 10px; display: flex; align-items: center; gap: 12px; }
.swipe svg { width: 56px; height: 20px; }
.phone { position: absolute; background: var(--ink); border-radius: 76px; box-shadow: 0 40px 80px -30px rgba(34,28,21,.45), 0 0 0 2px #3a3129 inset; }
.phone .screen { position: absolute; overflow: hidden; border-radius: 62px; background: #0c0c10; }
.phone .screen img { width: 100%; display: block; }
svg.over { position: absolute; left: 0; top: 0; width: 1080px; height: 1350px; pointer-events: none; }
`;

const shell = (body, title) => `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body>${body}</body></html>`;

const bar = () => `
<div class="bar"><img src="${url(LOGO)}" alt=""><div class="site"><b>ka-performancefl.com</b><span>Web design and AI integration</span></div></div>
<div class="rule"></div>`;

const arrow = `<svg viewBox="0 0 56 20"><path d="M0 10 H52 M42 2 L52 10 L42 18" fill="none" stroke="#9A3412" stroke-width="3.5"/></svg>`;
const foot = (swipe) => `
<div class="foot"><div class="built">Built by <b>K&amp;A Performance</b></div>${swipe ? `<div class="swipe">${swipe} ${arrow}</div>` : ""}</div>`;

const phone = (cap, { x, y, w, bezel }, extra = "") => {
  const sw = w - 2 * bezel;
  const sh = Math.round(sw * (844 / 390));
  return `<div class="phone" style="left:${x}px;top:${y}px;width:${w}px;height:${sh + 2 * bezel}px;${extra}">
    <div class="screen" style="left:${bezel}px;top:${bezel}px;width:${sw}px;height:${sh}px"><img src="${url(`${CAP}/${cap}.png`)}" alt=""></div></div>`;
};

function featureSlide(f) {
  const r = f.region;
  const rx = SCREEN.x + r.x * S, ry = SCREEN.y + r.y * S, rw = r.w * S, rh = r.h * S;
  const labelY = 1000; // top of the annotation rule
  const cy = ry + rh / 2;
  const elbowX = 470;
  const svg = `<svg class="over" viewBox="0 0 1080 1350">
    <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="none" stroke="#9A3412" stroke-width="5"/>
    <path d="M${64 + 360} ${labelY + 1.5} H${elbowX} V${cy} H${rx}" fill="none" stroke="#9A3412" stroke-width="3"/>
    <circle cx="${rx}" cy="${cy}" r="9" fill="#9A3412"/>
  </svg>`;
  const body = `${bar()}
  <div class="col"><div class="kicker">Feature ${f.n} <i>${f.n + 1}/${TOTAL}</i></div><div class="kicker" style="margin-top:6px;color:var(--ink)">${f.kicker}</div>
  <h1>${f.head}</h1><p class="why">${f.why}</p></div>
  ${phone(f.cap, PHONE)}
  <div class="anno" style="top:${labelY}px"><div class="t">${f.label}</div></div>
  ${svg}
  ${foot(f.n === 6 ? "One more" : "Next feature")}`;
  return shell(body, `Slide ${f.n + 1}`);
}

function hookSlide() {
  const body = `${bar()}
  <style>
    .hook { position:absolute; left:64px; right:64px; top:190px; }
    .hook .k { font-family:"Schibsted"; font-weight:700; font-size:24px; letter-spacing:3px; text-transform:uppercase; color:var(--rust); }
    .hook h1 { font-size:92px; line-height:.98; letter-spacing:-3px; margin-top:20px; }
    .hl { background: linear-gradient(transparent 62%, rgba(217,119,6,.55) 62%, rgba(217,119,6,.55) 92%, transparent 92%); }
    .sub { position:absolute; left:64px; width:900px; top:470px; font-size:28px; line-height:1.38; color:#3a3129; }
    .sub b { color: var(--ink); }
  </style>
  <div class="hook"><div class="k">Just launched · 1/${TOTAL}</div><h1>We built a website for an <span class="hl">arcade on wheels.</span></h1></div>
  <p class="sub"><b>Thrillers Mobile VR</b>, a veteran and family owned VR trailer from Middleburg, FL, is live at <b>thrillersvr.com</b>. Here is the tour, one feature per slide.</p>
  ${phone("rides", { x: 330, y: 640, w: 400, bezel: 12 }, "transform: rotate(-6deg); transform-origin: 50% 0;")}
  ${phone("home", { x: 640, y: 590, w: 420, bezel: 12 }, "transform: rotate(5deg); transform-origin: 50% 0;")}
  ${foot("Swipe for the tour")}`;
  return shell(body, "Slide 1");
}

function ctaSlide() {
  const body = `
  <style>
    .cta { position:absolute; left:64px; right:64px; top:120px; }
    .cta img { height: 120px; }
    .cta .k { font-family:"Schibsted"; font-weight:700; font-size:24px; letter-spacing:3px; text-transform:uppercase; color:var(--rust); margin-top:70px; }
    .cta h1 { font-size:112px; line-height:.96; letter-spacing:-3.5px; margin-top:18px; }
    .cta p { font-size:32px; line-height:1.4; margin-top:30px; max-width:860px; color:#3a3129; }
    .block { position:absolute; left:64px; right:64px; top:830px; border-top:4px solid var(--rust); padding-top:34px; }
    .block .u { font-family:"Schibsted"; font-weight:800; font-size:76px; letter-spacing:-2px; }
    .block .c { font-family:"Schibsted"; font-weight:700; font-size:50px; margin-top:14px; }
    .block .c span { color: var(--rust); }
    .block .t { font-size:28px; color:#3a3129; margin-top:48px; }
    .small { position:absolute; left:64px; right:64px; bottom:56px; font-size:22px; color:var(--muted); display:flex; justify-content:space-between; }
    .small b { color: var(--ink); }
  </style>
  <div class="cta"><img src="${url(LOGO)}" alt="">
    <div class="k">${TOTAL}/${TOTAL} · Your turn</div>
    <h1>Launching something?</h1>
    <p>We build websites that turn a phone search into a booking request, for Gainesville and North Florida businesses.</p></div>
  <div class="block"><div class="u">ka-performancefl.com</div><div class="c">Call Alex <span>904-210-1071</span></div><div class="t">Take the Thrillers tour yourself at <b>thrillersvr.com</b></div></div>
  <div class="small"><div>Built by <b>K&amp;A Performance</b>. Web design, local search, and AI integration.</div></div>`;
  return shell(body, "Slide 8");
}

const slides = [hookSlide(), ...FEATURES.map(featureSlide), ctaSlide()];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
for (let i = 0; i < slides.length; i++) {
  const n = String(i + 1).padStart(2, "0");
  const html = `${WORK}/slide-${n}.html`;
  fs.writeFileSync(html, slides[i]);
  await p.goto(url(html), { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  const png = `${WORK}/slide-${n}@2x.png`;
  await p.screenshot({ path: png });
  await sharp(png).resize(1080, 1350, { kernel: "lanczos3" }).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toFile(`${MEDIA}/slide-${n}.jpg`);
  console.log(`slide-${n}.jpg`);
}
await b.close();
