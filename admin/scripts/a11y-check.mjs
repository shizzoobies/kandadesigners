// axe-core over the dashboard's screens, against the local dev server
// (`node node_modules/astro/astro.js dev --port 4321`, with .dev.vars so the
// dev identity is let in). Tooling loads from D:/kap-reel/node_modules on
// purpose: this app takes no new npm dependencies.
//   node scripts/a11y-check.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire('file:///D:/kap-reel/node_modules/');
const { chromium } = require('playwright');
const axeSource = fs.readFileSync('D:/kap-reel/node_modules/axe-core/axe.min.js', 'utf8');

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const PAGES = ['/', '/?show=problems', '/sites/ka-performance', '/sites/new'];

async function audit(page, label) {
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () => window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
  }));
  for (const v of result.violations) {
    console.log(`FAIL ${label}: ${v.id} (${v.impact}) ${v.help}`);
    for (const n of v.nodes.slice(0, 3)) console.log(`   ${n.target.join(' ')}`);
  }
  if (result.violations.length === 0) console.log(`ok   ${label}`);
  return result.violations.length;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
let failures = 0;
for (const p of PAGES) {
  await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle' });
  failures += await audit(page, p);
}
await page.goto(`${BASE}/sites/new`, { waitUntil: 'networkidle' });
await page.click('button[type="submit"]');
await page.waitForLoadState('networkidle');
failures += await audit(page, '/sites/new (after an empty submit)');
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
failures += await audit(page, '/ at 375px');
await browser.close();
process.exit(failures ? 1 : 0);
