// Render the capabilities one-pager to public/downloads/.
//
// WHAT IT DOES
//   Serves the built site out of dist/ on an ephemeral localhost port, opens
//   /training/capabilities/ in headless Chromium under print media, and
//   writes public/downloads/KA-Performance-Training-Capabilities.pdf. Then it
//   counts the pages in the bytes it just wrote and fails loudly if the
//   answer is not exactly 1, because "the one-pager" is the whole product and
//   a silent second page is the failure mode nobody notices until a buyer has
//   already forwarded it.
//
// PREREQUISITE
//   A fresh build. From the repo root:
//     node node_modules/astro/astro.js build
//     node scripts/capabilities-pdf.mjs
//   (npm scripts and npx choke on the "&" in this repo's path, hence the
//   direct node invocation.)
//
// WHY PLAYWRIGHT IS BORROWED FROM A SIBLING PROJECT
//   This repo deliberately takes no new npm dependencies. `npm install` here
//   has repeatedly stripped entries out of package-lock.json and broken the
//   Cloudflare Pages deploy, so package.json and the lockfile are frozen.
//   Playwright and its Chromium already exist in D:/kap-reel (the reel
//   project), so this script resolves it from that directory instead of
//   installing anything. Nothing is copied; if that project moves, change
//   PLAYWRIGHT_HOME below. The browser binaries live under
//   %LOCALAPPDATA%/ms-playwright and are found automatically.
//
// REGENERATE
//   Edit src/data/training.js (the facts) or
//   src/pages/training/capabilities/index.astro (the layout and the print
//   scale), rebuild, rerun this script. Never hand-edit the PDF.

import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLAYWRIGHT_HOME = 'file:///D:/kap-reel/node_modules/';
const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = path.join(ROOT, 'dist');
const PAGE_PATH = '/training/capabilities/';
const OUT_DIR = path.join(ROOT, 'public', 'downloads');
const OUT_FILE = path.join(OUT_DIR, 'KA-Performance-Training-Capabilities.pdf');
const SHOT_DIR = path.join(ROOT, 'TAAS', 'extracted');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf',
};

/** Resolve a URL pathname to a file inside dist/, or null. Directories map to
 *  their index.html. Anything that escapes dist/ is refused. */
async function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const target = path.resolve(DIST, '.' + path.posix.normalize(clean));
  if (target !== DIST && !target.startsWith(DIST + path.sep)) return null;
  try {
    const s = await stat(target);
    if (s.isDirectory()) {
      const index = path.join(target, 'index.html');
      const si = await stat(index);
      return si.isFile() ? index : null;
    }
    return s.isFile() ? target : null;
  } catch {
    return null;
  }
}

function startServer() {
  const server = createServer(async (req, res) => {
    const file = await resolveFile(req.url || '/');
    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('404');
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/** Count page objects in a PDF. `/Type /Pages` is the tree node, not a page,
 *  so the negative lookahead matters. */
function countPages(bytes) {
  const text = Buffer.from(bytes).toString('latin1');
  return (text.match(/\/Type\s*\/Page(?!s)/g) || []).length;
}

async function main() {
  try {
    await stat(path.join(DIST, 'training', 'capabilities', 'index.html'));
  } catch {
    console.error(
      'dist/training/capabilities/index.html is missing.\n' +
        'Build first: node node_modules/astro/astro.js build'
    );
    process.exit(1);
  }

  const require = createRequire(PLAYWRIGHT_HOME);
  const { chromium } = require('playwright');
  console.log('playwright ' + require('playwright/package.json').version + ' (from ' + PLAYWRIGHT_HOME + ')');

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(SHOT_DIR, { recursive: true });

  const { server, port } = await startServer();
  const origin = 'http://127.0.0.1:' + port;
  const url = origin + PAGE_PATH;
  console.log('serving dist/ at ' + origin);

  const browser = await chromium.launch({ headless: true });
  let exitCode = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
    await page.goto(url, { waitUntil: 'networkidle' });

    // Screen-media reference shot first, while the page is still in its
    // on-screen state, so a reviewer can check both without a browser.
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(SHOT_DIR, 'capabilities-screen.png'), fullPage: true });

    // Print shot at the Letter content box (7.4in x 9.9in at 96dpi, i.e.
    // Letter minus the 0.55in @page margins) so the reviewer sees the real
    // proportions of the PDF rather than a desktop-wide reflow of it.
    await page.emulateMedia({ media: 'print' });
    await page.setViewportSize({ width: 710, height: 950 });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(SHOT_DIR, 'capabilities-print.png'), fullPage: true });

    const opts = {
      path: OUT_FILE,
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
    };
    try {
      await page.pdf({ ...opts, tagged: true });
      console.log('tagged: yes (page.pdf accepted tagged: true)');
    } catch (err) {
      console.log('tagged: NO, option rejected by this Playwright build (' + err.message.split('\n')[0] + ')');
      console.log('retrying without it; the PDF will be untagged');
      await page.pdf(opts);
    }

    const bytes = await readFile(OUT_FILE);
    const pages = countPages(bytes);
    const kb = (bytes.length / 1024).toFixed(1);
    console.log('wrote ' + OUT_FILE + ' (' + kb + ' KB)');
    console.log('page count: ' + pages);
    console.log('structure tree present: ' + (bytes.includes('/StructTreeRoot') ? 'yes' : 'no'));

    if (pages !== 1) {
      console.error(
        '\nFAIL: the one-pager rendered ' + pages + ' pages.\n' +
          'Lower the print type scale in src/pages/training/capabilities/index.astro\n' +
          '(the .cap font-size inside @media print), rebuild, and rerun. Do not go\n' +
          'below 9pt: cut content instead.'
      );
      exitCode = 1;
    }
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
