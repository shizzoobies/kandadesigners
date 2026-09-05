// Slide-deck fit check for the training samples. The owner's rule: a
// slide-style course never scrolls; long content goes into tabs, accordions,
// or sub-steps. This walks every screen of a sample, opens every tab,
// accordion header, and sub-step it can find, and after each state measures
// whether the document or any scroll container overflows vertically.
//
//   node scripts/sample-fit-check.mjs            # all three samples
//   node scripts/sample-fit-check.mjs safety      # one folder name
//
// Run after a build. Playwright is loaded from D:/kap-reel/node_modules (see
// a11y-check.mjs for why). At the desktop viewports nothing may overflow; at
// the phone viewport only the screen body may, never the document.
import { createRequire } from 'node:module';
import { serveDist } from './lib/serve-dist.mjs';

const require = createRequire('file:///D:/kap-reel/node_modules/');
const { chromium } = require('playwright');

const ALL = ['rfi', 'safety', 'finance', 'nutrition', 'strength', 'sauna'];
const samples = process.argv.slice(2).length
  ? process.argv.slice(2).map((a) => a.replace(/^.*\//, '').replace(/\/$/, ''))
  : ALL;
const DESKTOP = [
  [1100, 700],
  [1280, 760],
  [1440, 820],
];
const PHONE = [390, 844];
const MAX_SCREENS = 12;

// One measurement: document overflow plus the worst scroll container.
const measure = () => {
  const d = document.documentElement;
  const doc = { sh: d.scrollHeight, ch: d.clientHeight };
  let worst = null;
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') continue;
    if (!el.checkVisibility()) continue;
    const over = el.scrollHeight - el.clientHeight;
    if (over > 1 && (!worst || over > worst.over)) {
      worst = { over, tag: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).split(' ')[0] : ''), sh: el.scrollHeight, ch: el.clientHeight };
    }
  }
  return { doc, worst };
};

const describeActive = () => {
  const h = [...document.querySelectorAll('h2')].find((x) => x.checkVisibility());
  return h ? h.textContent.trim().slice(0, 40) : '(no visible h2)';
};

async function visibleButtons(page) {
  const handles = await page.$$('button');
  const out = [];
  for (const h of handles) {
    if (!(await h.isVisible()) || !(await h.isEnabled())) continue;
    out.push({ h, text: ((await h.textContent()) || '').trim() });
  }
  return out;
}

async function pressOuterNext(page) {
  // The outer pager is last in the DOM; its Next/Finish is the last match.
  const btns = await visibleButtons(page);
  const nexts = btns.filter((b) => /^(next|finish)\b/i.test(b.text));
  if (!nexts.length) return false;
  await nexts[nexts.length - 1].h.click();
  await page.waitForTimeout(250);
  return true;
}

async function unlockScreen(page) {
  // A gated screen (hunt, quiz) enables Next only after answers. Click every
  // non-pager, non-tab, non-accordion button once per pass until Next enables,
  // a few passes at most.
  for (let pass = 0; pass < 4; pass++) {
    const btns = await visibleButtons(page);
    const next = btns.filter((b) => /^(next|finish)\b/i.test(b.text)).pop();
    if (next) return true;
    for (const b of btns) {
      if (/^(back|start over|next|finish)\b/i.test(b.text)) continue;
      const role = await b.h.getAttribute('role');
      const exp = await b.h.getAttribute('aria-expanded');
      if (role === 'tab' || exp !== null) continue;
      try { await b.h.click({ timeout: 800 }); } catch {}
      await page.waitForTimeout(40);
    }
  }
  return false;
}

async function exploreStates(page, record) {
  // Baseline, then each tab, each accordion header, then each sub-step.
  record('base', await page.evaluate(measure));
  const tabs = await page.$$('[role="tab"]');
  for (let i = 0; i < tabs.length; i++) {
    if (!(await tabs[i].isVisible())) continue;
    await tabs[i].click();
    await page.waitForTimeout(120);
    record('tab ' + (i + 1), await page.evaluate(measure));
  }
  const acc = await page.$$('button[aria-expanded]');
  for (let i = 0; i < acc.length; i++) {
    if (!(await acc[i].isVisible())) continue;
    const was = await acc[i].getAttribute('aria-expanded');
    if (was === 'false') {
      await acc[i].click();
      await page.waitForTimeout(120);
      record('acc ' + (i + 1), await page.evaluate(measure));
    }
  }
  // Sub-steps: inner "next" buttons that are not the last (outer) one.
  for (let s = 0; s < 12; s++) {
    const btns = await visibleButtons(page);
    const inner = btns.filter((b) => /^(next|continue)\b/i.test(b.text));
    if (inner.length < 2) break;
    await inner[0].h.click();
    await page.waitForTimeout(150);
    record('step ' + (s + 2), await page.evaluate(measure));
  }
}

// FIT_ROOT=public checks a sample straight from source, no build needed.
const { origin, close } = await serveDist(process.env.FIT_ROOT || 'dist');
const browser = await chromium.launch();
let failed = false;

for (const sample of samples) {
  console.log(`\n=== ${sample} ===`);
  for (const [w, h, phone] of [...DESKTOP.map((v) => [...v, false]), [...PHONE, true]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`${origin}/training-samples/${sample}/`, { waitUntil: 'networkidle' });
    let worstDoc = 0;
    let worstBox = null;
    const problems = [];
    for (let screen = 1; screen <= MAX_SCREENS; screen++) {
      const title = await page.evaluate(describeActive);
      await exploreStates(page, (state, m) => {
        const docOver = m.doc.sh - m.doc.ch;
        if (docOver > worstDoc) worstDoc = docOver;
        if (docOver > 1) problems.push(`screen ${screen} "${title}" ${state}: document overflows by ${docOver}px`);
        if (m.worst) {
          if (!worstBox || m.worst.over > worstBox.over) worstBox = { ...m.worst, screen, state };
          if (!phone) problems.push(`screen ${screen} "${title}" ${state}: ${m.worst.tag} overflows by ${m.worst.over}px`);
        }
      });
      const unlocked = await unlockScreen(page);
      if (!unlocked) break;
      const before = await page.evaluate(describeActive);
      const moved = await pressOuterNext(page);
      const after = await page.evaluate(describeActive);
      if (!moved || after === before) break;
    }
    const label = `${w}x${h}${phone ? ' (phone)' : ''}`;
    const bad = problems.length > 0;
    if (bad && !phone) failed = true;
    if (phone && worstDoc > 1) failed = true;
    console.log(`${bad ? (phone ? 'note' : 'FAIL') : 'ok  '} ${label}  worst document overflow ${worstDoc}px${worstBox ? `, worst box ${worstBox.tag} +${worstBox.over}px on screen ${worstBox.screen} (${worstBox.state})` : ', no scroll containers overflow'}${errors.length ? `, ${errors.length} page error(s)` : ''}`);
    for (const p of problems.slice(0, phone ? 0 : 8)) console.log('     ! ' + p);
    if (!phone && problems.length > 8) console.log(`     ! ...and ${problems.length - 8} more`);
    if (phone && worstDoc > 1) console.log('     ! the document itself scrolls on the phone; only the screen body may');
    await ctx.close();
  }
}

await browser.close();
await close();
console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: PASS');
process.exit(failed ? 1 : 0);
