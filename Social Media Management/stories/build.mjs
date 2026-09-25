// Story images (1080x1920), one per weekday (weeks of Sept 28 and Oct 5), each with an
// empty zone where Alex places the Instagram / Facebook link sticker by hand.
//
// Run from anywhere (npx breaks on the ampersand path, so call node directly):
//   node "D:\K & A Performance Site\Social Media Management\stories\build.mjs"
//   add --guides to also write *-guides.png with the app UI safe zones drawn in.
//
// Each run re-extracts the reel frame from To Be Released/<date>/media/reel-vertical.mp4,
// so a re-rendered reel is picked up by running this again.

import { chromium } from 'file:///D:/kap-reel/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const RELEASE = join(ROOT, 'To Be Released');
const FRAMES = join(HERE, 'frames');
const BRAND = 'D:/kap-reel/assets/brand';
const GUIDES = process.argv.includes('--guides');
// --only <date> rebuilds one day's story; that week's contact sheet still shows all five.
const ONLY = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;

const url = (p) => pathToFileURL(p).href;

// Safe area: app UI covers the top 250 px and the bottom 340 px of a Story.
const SAFE_TOP = 250;
const SAFE_BOTTOM = 1920 - 340;

// crop = [x, y, w, h] in the 1080x1920 reel frame; t = seconds into the reel.
const DAYS = [
  {
    date: '2026-09-28', dow: 'Mon', theme: 'teal',
    t: 6.0, crop: [14, 598, 966, 794],
    kicker: 'Local SEO',
    hook: 'A two-provider practice. <em>Top three on Google.</em>',
    site: 'ka-performancefl.com',
    cta: 'See how we do local search',
    link: 'https://ka-performancefl.com/?utm_source=instagram&utm_medium=story&utm_campaign=2026-09-28',
  },
  {
    date: '2026-09-29', dow: 'Tue', theme: 'bold',
    t: 9.5, crop: [108, 717, 858, 794],
    kicker: 'Contrast',
    hook: '<span class="hl">Amber</span> on cream looks fine. <b>It fails.</b>',
    site: 'ka-performancefl.com',
    cta: 'Check your colors',
    link: 'https://ka-performancefl.com/?utm_source=instagram&utm_medium=story&utm_campaign=2026-09-29',
  },
  {
    date: '2026-09-30', dow: 'Wed', theme: 'editorial',
    t: 8.8, crop: [108, 680, 864, 500],
    caption: 'Real screen from our free safety sample course.',
    kicker: 'Instructional design',
    hook: 'If a screen asks the learner to do <span class="hl">two things,</span> it does <b>neither.</b>',
    site: 'ka-performancefl.com/training',
    cta: 'See the sample courses',
    link: 'https://ka-performancefl.com/training/?utm_source=instagram&utm_medium=story&utm_campaign=2026-09-30',
  },
  {
    date: '2026-10-01', dow: 'Thu', theme: 'chat',
    t: 12.5, crop: [120, 404, 840, 966],
    kicker: 'AI tip for business owners',
    hook: 'Stop asking AI to write the email. <em>Tell it who the email is for.</em>',
    site: 'ka-performancefl.com/ai-launch',
    cta: 'See the 90-Day AI Launch',
    link: 'https://ka-performancefl.com/ai-launch/?utm_source=instagram&utm_medium=story&utm_campaign=2026-10-01',
  },
  {
    date: '2026-10-02', dow: 'Fri', theme: 'energy',
    t: 5.5, crop: [0, 400, 1080, 1060],
    kicker: 'Just launched',
    hook: '<span class="bx w">No venue.</span> <span class="bx w">No gear.</span> <span class="bx r">The arcade pulls up</span> <span class="bx a">to your driveway.</span>',
    site: 'ka-performancefl.com',
    cta: 'See the site',
    link: 'https://ka-performancefl.com/?utm_source=instagram&utm_medium=story&utm_campaign=2026-10-02',
  },

  // ---------- Week of Oct 5 ----------
  {
    date: '2026-10-05', dow: 'Mon', theme: 'teal',
    t: 1.0, crop: [108, 760, 864, 628],
    kicker: 'Local SEO',
    hook: 'Your Google profile has 5 settings <em>most businesses forget.</em>',
    site: 'ka-performancefl.com',
    cta: 'Check your Google profile',
    link: 'https://ka-performancefl.com/services/seo-ai-search/?utm_source=instagram&utm_medium=story&utm_campaign=2026-10-05',
  },
  {
    date: '2026-10-06', dow: 'Tue', theme: 'bold',
    t: 11.5, crop: [108, 740, 864, 780],
    kicker: 'Web design',
    hook: 'Your hero is a <span class="hl">promise,</span> <b>not a photo.</b>',
    site: 'ka-performancefl.com',
    cta: 'See what we build',
    link: 'https://ka-performancefl.com/services/web-design/?utm_source=instagram&utm_medium=story&utm_campaign=2026-10-06',
  },
  {
    date: '2026-10-07', dow: 'Wed', theme: 'editorial',
    t: 8.5, crop: [184, 702, 712, 736],
    caption: 'Real screen from our RFI sample course.',
    kicker: 'Job aids',
    hook: 'If they need it once a quarter, don\'t teach it. <b>Hand it to them.</b>',
    site: 'ka-performancefl.com/training',
    cta: 'See the sample courses',
    link: 'https://ka-performancefl.com/training/?utm_source=instagram&utm_medium=story&utm_campaign=2026-10-07',
  },
  {
    date: '2026-10-08', dow: 'Thu', theme: 'chat',
    t: 15.2, crop: [108, 400, 864, 1000],
    kicker: 'AI tip for business owners',
    hook: 'AI drafts. <em>You decide.</em>',
    site: 'ka-performancefl.com/ai-launch',
    cta: 'The 90-Day AI Launch',
    link: 'https://ka-performancefl.com/ai-launch/?utm_source=instagram&utm_medium=story&utm_campaign=2026-10-08',
  },
  {
    date: '2026-10-09', dow: 'Fri', theme: 'energy',
    t: 12.9, crop: [108, 740, 864, 820],
    kicker: 'Behind the scenes',
    hook: '<span class="bx w">Every post</span> <span class="bx w">we publish</span> <span class="bx r">gets approved</span> <span class="bx a">twice.</span>',
    site: 'ka-performancefl.com',
    cta: 'See our work',
    link: 'https://ka-performancefl.com/?utm_source=instagram&utm_medium=story&utm_campaign=2026-10-09',
  },
];

function extractFrame(day) {
  const mp4 = join(RELEASE, day.date, 'media', 'reel-vertical.mp4');
  const st = statSync(mp4);
  const out = join(FRAMES, `${day.date}-frame.png`);
  const [x, y, w, h] = day.crop;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(day.t), '-i', mp4,
    '-frames:v', '1', '-vf', `crop=${w}:${h}:${x}:${y}`, out]);
  return { out, mtime: st.mtime };
}

const CSS = `
@font-face { font-family: 'Schibsted'; src: url('${url(BRAND + '/fonts/Schibsted-VF.woff2')}') format('woff2'); font-weight: 400 900; }
@font-face { font-family: 'Atkinson'; src: url('${url(BRAND + '/fonts/AtkinsonNext-VF.woff2')}') format('woff2'); font-weight: 200 800; }
:root { --cream:#F8F5F2; --ink:#221C15; --rust:#9A3412; --amber:#D97706; --teal:#0B302D; --teal2:#134E4A; --mint:#5EEAD4; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1080px; height: 1920px; overflow: hidden; }
body { position: relative; font-family: 'Atkinson', sans-serif; color: var(--ink); background: var(--cream);
  -webkit-font-smoothing: antialiased; }

/* Brand bar: logo on a cream surface, inside the safe area. */
.bar { position: absolute; left: 0; right: 0; top: 262px; height: 118px; background: var(--cream);
  display: flex; align-items: center; justify-content: space-between; padding: 0 64px; }
.bar img { height: 78px; display: block; }
.bar .site { font: 700 34px/1 'Schibsted'; color: var(--rust); letter-spacing: -0.01em; }
.bar .rule { position: absolute; left: 64px; right: 64px; bottom: 0; height: 3px; background: var(--rust); }

.main { position: absolute; left: 64px; right: 64px; top: 412px; height: 774px;
  display: flex; flex-direction: column; gap: 30px; }
.kicker { font: 800 24px/1 'Schibsted'; letter-spacing: 0.16em; text-transform: uppercase; }
.hook { font: 800 76px/1.02 'Schibsted'; letter-spacing: -0.025em; text-wrap: balance; }
.shot { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
.shot img { max-width: 100%; max-height: 100%; display: block; }

.cta { position: absolute; left: 0; right: 0; top: 1222px; height: 96px; text-align: center; }
.cta .tap { font: 800 22px/1 'Schibsted'; letter-spacing: 0.18em; text-transform: uppercase; }
.cta .line { margin-top: 10px; font: 800 44px/1 'Schibsted'; letter-spacing: -0.015em;
  display: inline-flex; align-items: center; gap: 16px; }
.cta svg { width: 34px; height: 40px; }

/* The empty zone Alex covers with the link sticker. 700x220, centered. */
.zone { position: absolute; left: 190px; top: 1336px; width: 700px; height: 220px;
  border: 3px dashed currentColor; opacity: 0.5; display: flex; align-items: center; justify-content: center; }
.zone span { font: 600 24px/1 'Atkinson'; letter-spacing: 0.08em; }

/* ---------- Mon: teal stage, browser card with a rust edge ---------- */
.teal { background: radial-gradient(120% 70% at 50% 45%, var(--teal2) 0%, var(--teal) 70%); color: var(--cream); }
.teal .kicker { color: var(--amber); }
.teal .hook { color: #fff; text-align: center; }
.teal .hook em { font-style: normal; color: var(--amber); display: block; }
.teal .kicker { text-align: center; }
.teal .shot img { border: 3px solid var(--rust); border-radius: 10px; box-shadow: 0 24px 60px rgba(0,0,0,.45); }
.teal .cta .tap { color: var(--mint); }
.teal .cta .line { color: #fff; }
.teal .cta svg path { stroke: var(--amber); }
.teal .zone { color: var(--cream); }

/* ---------- Tue: bold type on cream ---------- */
.bold .bar .rule { height: 4px; }
.bold .kicker { color: var(--rust); }
.bold .hook { font-size: 80px; }
.bold .hook .hl { box-shadow: inset 0 -0.26em 0 var(--amber); }
.bold .hook b { display: block; color: var(--rust); font-size: 112px; font-weight: 900; letter-spacing: -0.035em; margin-top: 4px; }
.bold .shot { justify-content: flex-start; }
.bold .cta .tap { color: var(--rust); }
.bold .cta svg path { stroke: var(--rust); }
.bold .zone { color: var(--ink); }

/* ---------- Wed: editorial magazine ---------- */
.editorial { background: linear-gradient(180deg, #FBF8F5 0%, var(--cream) 55%, #F1EAE3 100%); }
.editorial .bar .rule { height: 2px; box-shadow: 0 6px 0 var(--cream), 0 8px 0 var(--rust); }
.editorial .bar .site { font-size: 30px; }
.editorial .kicker { color: var(--rust); display: flex; align-items: center; gap: 18px; }
.editorial .kicker::before { content: ''; width: 64px; height: 3px; background: var(--rust); }
.editorial .hook { font-size: 66px; line-height: 1.06; }
.editorial .hook .hl { box-shadow: inset 0 -0.22em 0 rgba(217,119,6,.55); }
.editorial .hook b { color: var(--rust); }
.editorial .quote { font: 900 120px/0.6 'Schibsted'; color: var(--rust); height: 50px; margin-bottom: -10px; }
.editorial .shot { flex-direction: column; gap: 14px; }
.editorial .shot img { max-height: calc(100% - 40px); }
.editorial .cap { font: 500 24px/1.2 'Atkinson'; color: rgba(34,28,21,.72); }
.editorial .shot img { filter: drop-shadow(0 14px 22px rgba(34,28,21,.12)); }
.editorial .cta .tap { color: var(--rust); }
.editorial .cta svg path { stroke: var(--rust); }
.editorial .zone { color: var(--ink); }

/* ---------- Thu: chat window on the teal stage ---------- */
.chat { background: var(--teal); color: var(--cream); }
.chat .bar { left: 48px; right: 48px; border-radius: 14px 14px 0 0; }
.chat .bar .rule { left: 0; right: 0; }
.chat .main { left: 48px; right: 48px; top: 380px; height: 820px; padding: 34px 40px 0;
  background: var(--teal2); border-radius: 0 0 14px 14px; gap: 24px; }
.chat .kicker { color: var(--mint); font-size: 22px; }
.chat .hook { color: #fff; font-size: 62px; }
.chat .hook em { font-style: normal; color: var(--mint); display: block; margin-top: 12px; }
.chat .shot { align-items: flex-start; padding-bottom: 30px; }
.chat .shot img { border-radius: 12px; }
.chat .cta .tap { color: var(--mint); }
.chat .cta .line { color: #fff; }
.chat .cta svg path { stroke: var(--mint); }
.chat .zone { color: var(--cream); }

/* ---------- Fri: launch energy, rust band, boxed type ---------- */
.energy { background: var(--teal); color: var(--cream); overflow: hidden; }
.energy::before { content: ''; position: absolute; left: -200px; right: -200px; top: 800px; height: 250px;
  background: var(--rust); transform: rotate(-9deg); }
.energy .kicker { color: var(--amber); }
.energy .hook { font-size: 70px; line-height: 1; text-transform: uppercase; font-weight: 900; }
.energy .hook .bx { display: inline-block; padding: 6px 14px 4px; margin: 0 4px 8px 0; }
.energy .hook .w { background: #fff; color: var(--ink); }
.energy .hook .r { background: var(--rust); color: #fff; }
.energy .hook .a { background: var(--amber); color: var(--ink); }
.energy .main { gap: 22px; }
.energy .shot { position: relative; z-index: 1; padding: 14px 0 22px; }
.energy .shot img { transform: rotate(-2.5deg); box-shadow: 0 30px 70px rgba(0,0,0,.5); border: 3px solid #fff; }
.energy .cta .tap { color: var(--amber); }
.energy .cta .line { color: #fff; }
.energy .cta svg path { stroke: var(--amber); }
.energy .zone { color: var(--cream); opacity: 0.55; }

/* Guides (optional): shows the app UI zones. Never in the delivered PNG. */
.guide { position: absolute; left: 0; right: 0; background: rgba(255,0,0,.22); z-index: 9; }
`;

const ARROW = `<svg viewBox="0 0 34 40" fill="none"><path d="M17 3v31M5 23l12 12 12-12" stroke-width="5" stroke-linecap="square"/></svg>`;

function html(day, frame, guides) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
<body class="${day.theme}">
  <div class="bar"><img src="${url(BRAND + '/logo/logo-lockup.webp')}" alt="K&amp;A Performance"><div class="site">${day.site}</div><div class="rule"></div></div>
  <div class="main">
    ${day.theme === 'editorial' ? '<div class="quote">&ldquo;</div>' : ''}
    <div class="kicker">${day.kicker}</div>
    <div class="hook">${day.hook}</div>
    <div class="shot"><img src="${url(frame)}?v=${Date.now()}" alt="">${day.caption ? `<div class="cap">${day.caption}</div>` : ''}</div>
  </div>
  <div class="cta"><div class="tap">Tap to see it</div><div class="line">${day.cta} ${ARROW}</div></div>
  <div class="zone"><span>link sticker here</span></div>
  ${guides ? `<div class="guide" style="top:0;height:${SAFE_TOP}px"></div><div class="guide" style="top:${SAFE_BOTTOM}px;bottom:0"></div>` : ''}
</body></html>`;
}

mkdirSync(FRAMES, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const report = [];

for (const day of DAYS.filter((d) => !ONLY || d.date === ONLY)) {
  const { out: frame, mtime } = extractFrame(day);
  const variants = GUIDES ? [false, true] : [false];
  for (const guides of variants) {
    const htmlPath = join(FRAMES, `${day.date}${guides ? '-guides' : ''}.html`);
    writeFileSync(htmlPath, html(day, frame, guides));
    await page.goto(url(htmlPath));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));

    // Check: no text inside the app UI zones, and the sticker zone stays clear.
    const issues = await page.evaluate(([top, bottom]) => {
      const bad = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const n = walker.currentNode;
        if (!n.textContent.trim()) continue;
        const r = document.createRange(); r.selectNodeContents(n);
        for (const b of r.getClientRects()) {
          if (b.top < top || b.bottom > bottom) bad.push(`text "${n.textContent.trim().slice(0, 30)}" at ${Math.round(b.top)}-${Math.round(b.bottom)}`);
        }
      }
      const shot = document.querySelector('.shot img').getBoundingClientRect();
      const cta = document.querySelector('.cta').getBoundingClientRect();
      if (shot.bottom > cta.top) bad.push(`frame overlaps CTA (${Math.round(shot.bottom)} > ${Math.round(cta.top)})`);
      const hook = document.querySelector('.hook').getBoundingClientRect();
      if (shot.height < 300) bad.push(`frame too small (${Math.round(shot.height)} px tall)`);
      return { bad, hook: Math.round(hook.height), shot: [Math.round(shot.width), Math.round(shot.height)] };
    }, [SAFE_TOP, SAFE_BOTTOM]);

    const png = guides ? join(FRAMES, `${day.date}-story-guides.png`) : join(HERE, `${day.date}-story.png`);
    await page.screenshot({ path: png, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
    if (!guides) report.push({ date: day.date, reelModified: mtime.toISOString(), ...issues });
  }
}
await browser.close();

for (const r of report) {
  console.log(`${r.date}  reel modified ${r.reelModified}  hook ${r.hook}px  frame ${r.shot.join('x')}  ${r.bad.length ? 'ISSUES: ' + r.bad.join('; ') : 'ok'}`);
}

// Contact sheets: one per week, that week's five stories side by side. Only the
// weeks touched by this run are rewritten. The week of Sept 28 keeps its
// original name, contact-sheet.png; later weeks are contact-sheet-<Monday>.png.
const monday = (date) => {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
const weeks = [...new Set(DAYS.filter((d) => !ONLY || d.date === ONLY).map((d) => monday(d.date)))];
for (const week of weeks) {
  const pngs = DAYS.filter((d) => monday(d.date) === week).map((d) => join(HERE, `${d.date}-story.png`));
  const inputs = pngs.flatMap((p) => ['-i', p]);
  const scale = pngs.map((_, i) => `[${i}]scale=432:768[s${i}]`).join(';');
  const stack = pngs.map((_, i) => `[s${i}]`).join('') + `hstack=${pngs.length}`;
  const sheet = join(HERE, week === '2026-09-28' ? 'contact-sheet.png' : `contact-sheet-${week}.png`);
  if (!pngs.every((p) => existsSync(p))) {
    console.log(`contact sheet for the week of ${week} skipped: not every story in that week is built yet`);
    continue;
  }
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `${scale};${stack}`, sheet]);
  console.log('contact sheet: ' + sheet);
}
