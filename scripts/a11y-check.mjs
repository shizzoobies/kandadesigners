// Accessibility check for built pages: axe-core (WCAG 2.x A/AA rules),
// document structure, and a real keyboard pass that walks the whole tab
// order, checks every stop has a visible focus indicator, and watches for a
// focus trap inside any iframe (the samples viewer is the likeliest place
// for one). Run after `node node_modules/astro/astro.js build`:
//
//   node scripts/a11y-check.mjs                 # the default page list
//   node scripts/a11y-check.mjs /training/ /x/  # specific paths
//
// Tooling is loaded from the sibling project D:/kap-reel/node_modules on
// purpose: this repo takes no new npm dependencies, because `npm install`
// strips lockfile entries and has broken production deploys before.
//
// Writes docs/accessibility/reports/<date>-a11y.json and prints a summary.
// Exits 1 on any axe violation, structure failure, or focus trap. Automated
// tools catch roughly a third of real issues; this is the floor, not the
// audit. The manual passes are logged in the accessibility statement.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { serveDist } from './lib/serve-dist.mjs';

const KAP = 'file:///D:/kap-reel/node_modules/';
const require = createRequire(KAP);
const { chromium } = require('playwright');
const axeSource = fs.readFileSync('D:/kap-reel/node_modules/axe-core/axe.min.js', 'utf8');

const DEFAULT_PAGES = [
  '/training/',
  '/training/samples/',
  '/training/samples/rfi-that-gets-answered/',
  '/training/team/',
  '/training/capabilities/',
  '/training-samples/rfi/',
  '/services/',
  '/accessibility/',
];
// Git Bash rewrites a bare /path argument into C:/Program Files/Git/path
// (MSYS path conversion). Strip that back off, and accept paths without a
// leading slash, so the script works from any shell.
const normalize = (a) => '/' + a.replace(/^[A-Za-z]:\/.*?\/Git\//, '').replace(/^\/+/, '');
const pages = process.argv.slice(2).length ? process.argv.slice(2).map(normalize) : DEFAULT_PAGES;

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const MAX_TABS = 500;
const FRAME_TRAP_TABS = 150;

async function structure(page) {
  return page.evaluate(() => {
    const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({
      level: Number(h.tagName[1]),
      text: (h.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70),
    }));
    const skips = [];
    for (let i = 1; i < hs.length; i++) {
      if (hs[i].level > hs[i - 1].level + 1) skips.push(`${hs[i - 1].level}→${hs[i].level} at "${hs[i].text}"`);
    }
    const imgsNoAlt = [...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => i.src.slice(-60));
    const framesNoTitle = [...document.querySelectorAll('iframe')].filter((f) => !f.title).map((f) => f.src);
    return {
      lang: document.documentElement.lang,
      title: document.title,
      h1Count: hs.filter((h) => h.level === 1).length,
      headings: hs,
      skips,
      mainCount: document.querySelectorAll('main').length,
      hasNav: !!document.querySelector('nav'),
      hasSkipLink: !!document.querySelector('a[href="#main-content"], a.skip-link'),
      imgsNoAlt,
      framesNoTitle,
    };
  });
}

async function axe(page) {
  await page.addScriptTag({ content: axeSource });
  const r = await page.evaluate(
    (tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }),
    AXE_TAGS,
  );
  return {
    violations: r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
    })),
    incomplete: r.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
    passes: r.passes.length,
  };
}

async function keyboard(page) {
  // Start from a clean state: nothing focused.
  await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  const missingFocus = [];
  const order = [];
  let frameTabs = 0;
  let maxFrameTabs = 0;
  let frameTrap = false;
  let leftFrame = false;
  let sawFrame = false;
  let steps = 0;

  for (; steps < MAX_TABS; steps++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return { body: true };
      const cs = getComputedStyle(el);
      const text = (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      const key = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}|${text}`;
      const rect = el.getBoundingClientRect();
      // Cycle detection by element identity, not by label: a page legitimately
      // repeats link text (nav "Services" and a breadcrumb "Services"), and
      // treating that as a wrap ended the walk after the header.
      const seen = (window.__kaTabSeen ||= new WeakSet());
      const dup = seen.has(el);
      seen.add(el);
      return {
        key,
        dup,
        isFrame: el.tagName === 'IFRAME',
        focusVisible: el.matches(':focus-visible'),
        outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
        shadow: cs.boxShadow !== 'none',
        offscreen: rect.width === 0 && rect.height === 0,
        hidden: cs.visibility === 'hidden' || cs.display === 'none',
      };
    });
    if (info.body) break; // walked off the end: the tab order is finite
    if (info.isFrame) {
      sawFrame = true;
      frameTabs++;
      maxFrameTabs = Math.max(maxFrameTabs, frameTabs);
      if (frameTabs > FRAME_TRAP_TABS) {
        frameTrap = true;
        break;
      }
      continue;
    }
    if (sawFrame && frameTabs > 0) leftFrame = true;
    frameTabs = 0;
    if (info.dup) break; // cycled back to an earlier stop
    order.push(info.key);
    if (!info.offscreen && !info.hidden && !(info.outline || info.shadow)) missingFocus.push(info.key);
  }
  return { stops: order.length, missingFocus, sawFrame, leftFrame, frameTrap, maxFrameTabs, steps, first: order[0] };
}

const { origin, close } = await serveDist();
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const report = { date: new Date().toISOString(), origin, pages: [] };
let failed = false;

for (const p of pages) {
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  const res = await page.goto(origin + p, { waitUntil: 'networkidle' });
  const status = res?.status();
  const entry = { path: p, status };
  if (status !== 200) {
    entry.error = `HTTP ${status}`;
    failed = true;
  } else {
    entry.structure = await structure(page);
    entry.axe = await axe(page);
    entry.keyboard = await keyboard(page);
    entry.consoleErrors = consoleErrors;
    const s = entry.structure;
    entry.problems = [];
    if (s.h1Count !== 1) entry.problems.push(`h1 count ${s.h1Count}`);
    if (s.skips.length) entry.problems.push(`heading skips: ${s.skips.join('; ')}`);
    if (!s.lang) entry.problems.push('no html lang');
    if (!s.title) entry.problems.push('no title');
    if (s.mainCount !== 1) entry.problems.push(`main count ${s.mainCount}`);
    if (s.imgsNoAlt.length) entry.problems.push(`img without alt attr: ${s.imgsNoAlt.join(', ')}`);
    if (s.framesNoTitle.length) entry.problems.push(`iframe without title: ${s.framesNoTitle.join(', ')}`);
    if (entry.axe.violations.length) entry.problems.push(`${entry.axe.violations.length} axe violation(s)`);
    if (entry.keyboard.frameTrap) entry.problems.push('FOCUS TRAP inside iframe');
    if (entry.keyboard.sawFrame && !entry.keyboard.leftFrame) entry.problems.push('focus entered an iframe and never came back');
    if (entry.keyboard.missingFocus.length) entry.problems.push(`${entry.keyboard.missingFocus.length} stop(s) without visible focus`);
    if (consoleErrors.length) entry.problems.push(`${consoleErrors.length} console error(s)`);
    if (entry.problems.length) failed = true;
  }
  report.pages.push(entry);
  await page.close();

  const tag = entry.problems?.length ? 'FAIL' : status === 200 ? 'ok  ' : 'ERR ';
  console.log(`${tag} ${p}`);
  if (entry.structure) {
    console.log(`     h1=${entry.structure.h1Count} headings=${entry.structure.headings.length} axe=${entry.axe.violations.length} viol/${entry.axe.incomplete.length} incomplete/${entry.axe.passes} pass  tabs=${entry.keyboard.stops} stops${entry.keyboard.sawFrame ? ` (iframe: ${entry.keyboard.maxFrameTabs} tabs inside, ${entry.keyboard.leftFrame ? 'exited' : 'NOT exited'})` : ''}`);
  }
  for (const pr of entry.problems || []) console.log(`     ! ${pr}`);
  for (const v of entry.axe?.violations || []) console.log(`       axe ${v.impact}: ${v.id} (${v.nodes}) ${v.help} -> ${v.targets[0]}`);
  for (const k of entry.keyboard?.missingFocus || []) console.log(`       no focus ring: ${k}`);
}

await browser.close();
await close();

const outDir = path.resolve('docs/accessibility/reports');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `${report.date.slice(0, 10)}-a11y.json`);
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`\nreport: ${path.relative(process.cwd(), out)}`);
console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: PASS');
process.exit(failed ? 1 : 0);
