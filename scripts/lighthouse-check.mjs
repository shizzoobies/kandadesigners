// Lighthouse scores for built pages, mobile emulation (Lighthouse's default),
// against a local static server. The brief's definition of done: accessibility
// and best practices at 100, performance reasonable on mobile. Run after a
// build:
//
//   node scripts/lighthouse-check.mjs                # default page list
//   node scripts/lighthouse-check.mjs /training/     # specific paths
//
// Lighthouse and chrome-launcher load from D:/kap-reel/node_modules and drive
// Playwright's Chromium, so nothing is installed here (see a11y-check.mjs
// for why). Writes docs/accessibility/reports/<date>-lighthouse.json.
// Exits 1 if any page scores below 100 on accessibility or best practices.
import fs from 'node:fs';
import path from 'node:path';
import { serveDist } from './lib/serve-dist.mjs';

const lighthouse = (await import('file:///D:/kap-reel/node_modules/lighthouse/core/index.js')).default;
const chromeLauncher = await import('file:///D:/kap-reel/node_modules/chrome-launcher/dist/index.js');
const CHROME = 'C:/Users/Mr Anderson_local/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';

const DEFAULT_PAGES = [
  '/training/',
  '/training/samples/',
  '/training/samples/rfi-that-gets-answered/',
  '/training/team/',
  '/training/capabilities/',
  '/services/',
  '/accessibility/',
];
// Git Bash rewrites a bare /path argument into C:/Program Files/Git/path
// (MSYS path conversion). Strip that back off, and accept paths without a
// leading slash, so the script works from any shell.
const normalize = (a) => '/' + a.replace(/^[A-Za-z]:\/.*?\/Git\//, '').replace(/^\/+/, '');
const pages = process.argv.slice(2).length ? process.argv.slice(2).map(normalize) : DEFAULT_PAGES;

const { origin, close } = await serveDist();
const chrome = await chromeLauncher.launch({
  chromePath: CHROME,
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});

const report = { date: new Date().toISOString(), origin, pages: [] };
let failed = false;

for (const p of pages) {
  const r = await lighthouse(origin + p, {
    port: chrome.port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: ['accessibility', 'best-practices', 'performance', 'seo'],
  });
  const c = r.lhr.categories;
  const score = (k) => Math.round((c[k]?.score ?? 0) * 100);
  const entry = {
    path: p,
    accessibility: score('accessibility'),
    bestPractices: score('best-practices'),
    performance: score('performance'),
    seo: score('seo'),
    failingA11y: Object.values(r.lhr.audits)
      .filter((a) => c.accessibility.auditRefs.some((ref) => ref.id === a.id) && a.score !== null && a.score < 1)
      .map((a) => `${a.id}: ${a.title}`),
    failingBP: Object.values(r.lhr.audits)
      .filter((a) => c['best-practices'].auditRefs.some((ref) => ref.id === a.id) && a.score !== null && a.score < 1)
      .map((a) => `${a.id}: ${a.title}`),
    lcpMs: Math.round(r.lhr.audits['largest-contentful-paint']?.numericValue ?? 0),
    cls: Number((r.lhr.audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3)),
    tbtMs: Math.round(r.lhr.audits['total-blocking-time']?.numericValue ?? 0),
  };
  if (entry.accessibility < 100 || entry.bestPractices < 100) failed = true;
  report.pages.push(entry);
  console.log(
    `${entry.accessibility === 100 && entry.bestPractices === 100 ? 'ok  ' : 'FAIL'} ${p}  a11y=${entry.accessibility} bp=${entry.bestPractices} perf=${entry.performance} seo=${entry.seo}  LCP=${entry.lcpMs}ms CLS=${entry.cls} TBT=${entry.tbtMs}ms`,
  );
  for (const f of entry.failingA11y) console.log(`     a11y: ${f}`);
  for (const f of entry.failingBP) console.log(`     bp:   ${f}`);
}

// chrome-launcher removes its temp profile on kill and Windows sometimes
// still holds a handle (EPERM). The scores are already in hand; a leftover
// temp dir is not a failure.
try {
  await chrome.kill();
} catch (err) {
  if (err?.code !== 'EPERM') throw err;
}
await close();

const outDir = path.resolve('docs/accessibility/reports');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `${report.date.slice(0, 10)}-lighthouse.json`);
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`\nreport: ${path.relative(process.cwd(), out)}`);
console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: PASS');
process.exit(failed ? 1 : 0);
