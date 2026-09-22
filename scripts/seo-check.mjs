// Title, description, robots and canonical gate for built pages. Run after
// `node node_modules/astro/astro.js build`:
//
//   node scripts/seo-check.mjs
//
// It also runs as npm's `postbuild`, so Cloudflare's `npm run build` fails the
// deploy rather than shipping a page that breaks the rule. Node built-ins
// only, no new dependencies, same reason the other check scripts take theirs
// from a sibling project: `npm install` here strips lockfile entries and has
// broken production deploys before.
//
// Why this exists at all: the training section drifted to a 73-character title
// and a 195-character description against a plan that had written both limits
// down, because nothing enforced them. A rule nobody checks is a suggestion.
//
// What it checks, in two passes:
//
//   1. Every <loc> in dist/sitemap-0.xml, which is the definition of "a page
//      we are asking to be indexed". Each one must have a <title> of 60
//      characters or fewer, a <meta name="description"> between 140 and 160,
//      no robots meta containing noindex (a page cannot both ask to be
//      indexed and refuse), and a canonical equal to its own sitemap URL.
//
//   2. Every other index.html and 404.html under dist/. Whether it is an
//      Astro route is decided from src/pages, not from the NOINDEX array:
//      a routed page (404, the course pages, the capabilities page) must
//      carry a noindex robots meta, because a page that is neither in the
//      sitemap nor noindexed is an accident either way. A static file under
//      a NOINDEX path is skipped: those live in public/, they are noindexed
//      by the X-Robots-Tag rules in public/_headers, and they take no meta
//      tag from the layout because they never pass through it. A page that
//      is neither routed nor under a NOINDEX path fails, because nothing
//      is keeping it out of the index.
//
// Lengths are counted on the decoded text, not on the raw HTML: an ampersand
// is one character on a search results page, even though Astro serialises it
// as the five characters "&#38;". Every title on this site carries "K & A
// Performance", so measuring the raw bytes would charge four characters per
// page for punctuation nobody sees.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = path.join(ROOT, 'dist');
const CONFIG = path.join(ROOT, 'astro.config.mjs');
const SITEMAP = path.join(DIST, 'sitemap-0.xml');

const TITLE_MAX = 60;
const DESC_MIN = 140;
const DESC_MAX = 160;

// The NOINDEX array, read out of astro.config.mjs rather than restated here,
// so the skip list and the sitemap filter can never disagree. Parsed as text
// on purpose: importing the config would execute defineConfig and the Vite
// plugins, which this script has no business loading.
function readNoindexPaths() {
  const src = fs.readFileSync(CONFIG, 'utf8');
  const block = src.match(/const NOINDEX\s*=\s*\[([\s\S]*?)\];/);
  if (!block) {
    console.error(`Could not find the NOINDEX array in ${path.relative(ROOT, CONFIG)}.`);
    process.exit(1);
  }
  const paths = [...block[1].matchAll(/'([^']+)'|"([^"]+)"/g)].map((m) => m[1] ?? m[2]);
  if (!paths.length) {
    console.error(`The NOINDEX array in ${path.relative(ROOT, CONFIG)} parsed as empty.`);
    process.exit(1);
  }
  return paths;
}

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();

function readMeta(file) {
  const html = fs.readFileSync(file, 'utf8');
  const headEnd = html.indexOf('</head>');
  const head = headEnd === -1 ? html : html.slice(0, headEnd);
  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const desc = head.match(/<meta\s+name="description"\s+content="([\s\S]*?)"/i);
  const robots = head.match(/<meta\s+name="robots"\s+content="([\s\S]*?)"/i);
  const canonical = head.match(/<link\s+rel="canonical"\s+href="([\s\S]*?)"/i);
  return {
    title: title ? decode(title[1]) : null,
    description: desc ? decode(desc[1]) : null,
    robots: robots ? decode(robots[1]) : null,
    canonical: canonical ? decode(canonical[1]) : null,
  };
}

// Every index.html and 404.html under dist/, as site paths.
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === 'index.html' || entry.name === '404.html') out.push(full);
  }
  return out;
}

const fileToPath = (file) => {
  const rel = path.relative(DIST, file).split(path.sep).join('/');
  return rel === 'index.html' ? '/' : '/' + rel.replace(/index\.html$/, '');
};

if (!fs.existsSync(SITEMAP)) {
  console.error(`No ${path.relative(ROOT, SITEMAP)}. Run the build first:`);
  console.error('  node node_modules/astro/astro.js build');
  process.exit(1);
}

const noindexPaths = readNoindexPaths();
const underNoindex = (p) =>
  noindexPaths.some((n) => p === n || p === `${n}/` || p.startsWith(`${n}/`));

// One regex per file in src/pages, in the shape the build emits with
// `build.format: 'directory'`: src/pages/course/[slug].astro becomes
// /course/<anything>/, src/pages/404.astro becomes /404.html. This is how the
// script tells a routed page, which must carry the meta tag, from a static
// file copied out of public/, which cannot.
const PAGES = path.join(ROOT, 'src', 'pages');
function routeMatchers(dir = PAGES, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routeMatchers(full, out);
      continue;
    }
    if (!/\.(astro|md|mdx)$/.test(entry.name)) continue;
    const rel = path.relative(PAGES, full).split(path.sep).join('/').replace(/\.(astro|md|mdx)$/, '');
    if (rel === '404') {
      out.push(/^\/404\.html$/);
      continue;
    }
    const segments = rel.split('/').filter((seg) => seg !== 'index');
    const pattern = segments
      .map((seg) => {
        if (/^\[\.\.\..+\]$/.test(seg)) return '.+';
        if (/^\[.+\]$/.test(seg)) return '[^/]+';
        return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');
    out.push(new RegExp(`^/${pattern}${pattern ? '/' : ''}$`));
  }
  return out;
}
const ROUTES = routeMatchers();
const isRoute = (p) => ROUTES.some((re) => re.test(p));

const locs = [...fs.readFileSync(SITEMAP, 'utf8').matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((m) =>
  decode(m[1]),
);

const rows = [];
const failures = [];
const fail = (p, message) => failures.push(`${p}: ${message}`);

// Pass 1: the pages we are asking search engines to index.
const sitemapFiles = new Set();
for (const loc of locs) {
  const pathname = new URL(loc).pathname;
  const file = path.join(DIST, ...pathname.split('/').filter(Boolean), 'index.html');
  sitemapFiles.add(file);

  if (!fs.existsSync(file)) {
    fail(pathname, `in the sitemap but ${path.relative(ROOT, file)} does not exist`);
    rows.push({ path: pathname, title: '-', desc: '-', note: 'MISSING' });
    continue;
  }

  const meta = readMeta(file);
  const before = failures.length;

  if (!meta.title) fail(pathname, 'no <title>');
  else if (meta.title.length > TITLE_MAX) {
    fail(pathname, `title is ${meta.title.length} characters, over ${TITLE_MAX}: "${meta.title}"`);
  }

  if (!meta.description) fail(pathname, 'no <meta name="description">');
  else if (meta.description.length < DESC_MIN || meta.description.length > DESC_MAX) {
    fail(
      pathname,
      `description is ${meta.description.length} characters, outside ${DESC_MIN} to ${DESC_MAX}`,
    );
  }

  if (meta.robots && /noindex/i.test(meta.robots)) {
    fail(pathname, `is in the sitemap but its robots meta says "${meta.robots}"`);
  }

  if (!meta.canonical) fail(pathname, 'no canonical link');
  else if (meta.canonical !== loc) {
    fail(pathname, `canonical is ${meta.canonical}, the sitemap says ${loc}`);
  }

  rows.push({
    path: pathname,
    title: meta.title ? String(meta.title.length) : '-',
    desc: meta.description ? String(meta.description.length) : '-',
    note: failures.length > before ? 'FAIL' : 'index',
  });
}

// Pass 2: everything else the build emitted. A page that is neither in the
// sitemap nor noindexed is an accident in one direction or the other.
for (const file of walk(DIST).sort()) {
  if (sitemapFiles.has(file)) continue;
  const pathname = fileToPath(file);
  const routed = isRoute(pathname);
  if (!routed && underNoindex(pathname)) continue; // static file, header-noindexed

  const meta = readMeta(file);
  const ok = meta.robots && /noindex/i.test(meta.robots);
  if (!ok && routed) {
    fail(
      pathname,
      'is not in the sitemap and has no noindex robots meta. Pass `noindex` to BaseLayout, or let it into the sitemap.',
    );
  } else if (!ok) {
    fail(
      pathname,
      'is a static file outside every NOINDEX path and carries no noindex meta. Add its folder to NOINDEX in astro.config.mjs and public/_headers.',
    );
  }
  rows.push({
    path: pathname,
    title: meta.title ? String(meta.title.length) : '-',
    desc: meta.description ? String(meta.description.length) : '-',
    note: ok ? 'noindex' : 'FAIL',
  });
}

const w = Math.max(4, ...rows.map((r) => r.path.length));
console.log(`${'page'.padEnd(w)}  title  desc  state`);
console.log('-'.repeat(w + 21));
for (const r of rows) {
  console.log(
    `${r.path.padEnd(w)}  ${r.title.padStart(5)}  ${r.desc.padStart(4)}  ${r.note}`,
  );
}

const indexed = rows.filter((r) => r.note === 'index' || r.note === 'FAIL').length;
console.log(
  `\n${rows.length} page(s) checked, ${locs.length} in the sitemap, ` +
    `${rows.length - locs.length} noindexed route(s). ` +
    `Rules: title <= ${TITLE_MAX}, description ${DESC_MIN} to ${DESC_MAX}, ` +
    'sitemap pages canonical to themselves and never noindexed.',
);

if (failures.length) {
  console.log(`\n${failures.length} failure(s):`);
  for (const f of failures) console.log(`  ! ${f}`);
  console.log('\nRESULT: FAIL');
  process.exit(1);
}

console.log(`\nRESULT: PASS (${indexed} indexable page(s))`);
process.exit(0);
