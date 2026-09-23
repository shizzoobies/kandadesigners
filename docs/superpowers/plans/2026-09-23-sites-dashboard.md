# Sites Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the August admin at `admin.ka-performancefl.com` with a single feature: a dashboard of every site K & A manages, with automatic health, expiry and GitHub checks, and red/recovery email alerts.

**Architecture:** The `ka-admin` Worker keeps its name, route and Cloudflare Access gate but gets fresh Astro code bound to a new D1 database `ka-sites` and an R2 bucket for logos. A separate scheduled Worker `ka-sites-checker` does all network checks and writes results to D1; the app only reads stored data. All rules live in small pure modules under `admin/src/lib/`, shared by both Workers and unit-tested with Vitest against a real SQLite (Node's built-in `node:sqlite`) behind a D1-shaped adapter.

**Tech Stack:** Astro 5 SSR with `@astrojs/cloudflare` 12, Cloudflare Workers, D1, R2, Cron Triggers, Resend (email), GitHub REST API, crt.sh, RDAP, Vitest 2, Playwright and axe-core loaded from `D:/kap-reel/node_modules`.

**Spec:** `docs/superpowers/specs/2026-09-23-sites-dashboard-design.md`. Read it first.

## Global Constraints

- Work happens in the worktree `D:\ka-site-admin`, branch `admin/sites-dashboard`, inside the `admin/` directory unless a path says otherwise.
- **No `npm install`, ever.** Everything needed is already in `admin/node_modules`. Playwright and axe load from `D:/kap-reel/node_modules`.
- Commands run from `D:\ka-site-admin\admin` in Git Bash. npm scripts break on this machine, so call tools directly: tests `node node_modules/vitest/vitest.mjs run`, build `node node_modules/astro/astro.js build`, wrangler `node node_modules/wrangler/bin/wrangler.js`.
- **Never run a wrangler command with `--remote`, `deploy`, `d1 create`, `r2 bucket create`, `secret put` or `delete`.** Those are production actions; Task 16 prepares them for Alex to run. `--local` and `deploy --dry-run` (which uploads nothing) are fine.
- `compatibility_date` is `"2026-08-13"` in every wrangler config. Never set it to today.
- Copy rules for every user-visible string, alt text, title and email: US English (color, center, gray), **no em dashes** (use periods, commas, colons), no pill or chip UI (status is small-caps text beside a colored dot, and color never carries meaning alone), contrast measured to WCAG AA.
- Palette tokens and fonts: `--canvas #F8F5F2`, `--surface #FFFDF9`, `--ink #221C15`, `--muted #6C635A`, `--accent #9A3412`, `--accent-hot #7C2D12`; Schibsted Grotesk (display), Atkinson Hyperlegible Next (body), both already in `admin/public/fonts/`.
- Every DB helper takes the D1 binding as its first argument. Booleans are stored as `0/1`. Dates are `YYYY-MM-DD` text; timestamps are ISO 8601 UTC strings. Displayed times are Eastern.
- Deny by default: every route requires a valid Access identity whose email is in `people`.
- The old `ka-admin` D1 database is never modified, dropped or bound by anything in this plan.
- Commit after every task with a message ending in:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## File map

```
admin/
  wrangler.jsonc                 rewritten: DB -> ka-sites, R2 LOGOS, no newsletter vars
  migrations/0001_sites.sql      new schema (old migrations moved to archive/)
  archive/ka-admin-migrations/   the old schema, kept for reference to the archive DB
  checker/index.js               scheduled Worker: runChecker + default export
  checker/wrangler.jsonc
  seed/data.js                   people + sites, verified facts only
  scripts/seed-sql.mjs           data.js -> seed/seed.sql
  scripts/a11y-check.mjs         Playwright + axe over the local dev server
  src/middleware.js              thin: authorize() or 403
  src/lib/access.js              KEPT unchanged (Access JWT verification)
  src/lib/identity.js            KEPT unchanged (where an identity may come from)
  src/lib/authorize.js           identity -> people row
  src/lib/when.js                Eastern time and date helpers
  src/lib/enums.js               whitelists and labels
  src/lib/health.js              computeLevel, LEVEL_RANK
  src/lib/db.js                  every D1 query
  src/lib/validate.js            form parsing and validation
  src/lib/expiry.js              crt.sh and RDAP lookups and parsers
  src/lib/favicon.js             fallback icon discovery
  src/lib/github.js              open-work fetch and reconcile
  src/lib/alerts.js              alert decision, email text, Resend send
  src/lib/sparkline.js           uptime percent, hourly averages, SVG path
  src/lib/view.js                logo src, initials, sorting and filtering cards
  src/lib/logo.js                store an uploaded logo in R2
  src/layouts/Shell.astro        rewritten
  src/styles/admin.css           rewritten
  src/components/LevelDot.astro
  src/components/SiteLogo.astro
  src/components/SiteCard.astro
  src/pages/index.astro          dashboard
  src/pages/sites/new.astro      add site
  src/pages/sites/[slug]/index.astro   site page
  src/pages/sites/[slug]/edit.astro    edit site
  src/pages/sites/[slug]/[action].js   POST: status, a11y, work, work-done, log
  src/pages/logos/[...key].js    serves R2 logos behind the middleware
  tests/helpers/d1.js            D1-shaped adapter over node:sqlite
  tests/*.test.js
```

---

### Task 1: Blank slate, new schema, and the test database

**Files:**
- Delete: `admin/src/pages/**` (everything), `admin/src/launch-book.html`, `admin/src/lib/coaching.js`, `admin/src/lib/dashboard.js`, `admin/src/lib/db.js`, `admin/src/lib/format.js`, `admin/src/lib/newsletter.js`, `admin/tests/coaching.test.js`, `admin/tests/digest.test.js`, `admin/tests/format.test.js`, `admin/tests/newsletter.test.js`, `admin/tests/state.test.js`, `admin/digest/` (whole directory)
- Move: `admin/migrations/000*.sql` to `admin/archive/ka-admin-migrations/`
- Keep untouched: `admin/src/lib/access.js`, `admin/src/lib/identity.js`, `admin/tests/access.test.js`, `admin/tests/identity.test.js`, `admin/course-proxy/`, `admin/public/`
- Create: `admin/migrations/0001_sites.sql`, `admin/tests/helpers/d1.js`, `admin/tests/schema.test.js`
- Modify: `admin/wrangler.jsonc`

**Interfaces:**
- Produces: `makeD1()` from `tests/helpers/d1.js`, returning an object with `prepare(sql)` (whose statements support `.bind(...args)`, `.first()`, `.all()`, `.run()`), `batch(statements)`, and `sqlite` (the raw `DatabaseSync`). All migrations in `admin/migrations/` are applied in filename order.
- Produces: tables `people`, `sites`, `checks`, `work_items`, `log_entries`, `alert_state` exactly as in the migration below.

- [ ] **Step 1: Remove the old app and archive the old migrations**

```bash
cd /d/ka-site-admin/admin
git rm -r -q src/pages src/launch-book.html src/lib/coaching.js src/lib/dashboard.js src/lib/db.js src/lib/format.js src/lib/newsletter.js tests/coaching.test.js tests/digest.test.js tests/format.test.js tests/newsletter.test.js tests/state.test.js digest
mkdir -p archive/ka-admin-migrations
git mv migrations/0001_init.sql migrations/0002_coaching.sql migrations/0003_course_leads.sql migrations/0004_newsletter.sql migrations/0005_newsletter_workbench.sql migrations/0006_course_events.sql migrations/0007_app_state.sql archive/ka-admin-migrations/
```

Then create `admin/archive/ka-admin-migrations/README.md`:

```markdown
# The old admin schema

These migrations built the `ka-admin` D1 database for the August 2026 admin.
That database is kept as an archive and still receives free-course leads from
the public site (its `ADMIN_DB` binding). The sites dashboard does not bind it.
Kept here so the archive's shape is readable without querying production.
```

- [ ] **Step 2: Write the new schema**

Create `admin/migrations/0001_sites.sql`:

```sql
-- 0001: the sites dashboard. A fresh database (ka-sites); the old ka-admin
-- database is an archive and is not touched by this app.

CREATE TABLE people (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TEXT NOT NULL
);

CREATE TABLE sites (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  live_url TEXT NOT NULL,
  logo_key TEXT,
  favicon_key TEXT,
  repo TEXT,
  local_path TEXT,
  hosting TEXT NOT NULL DEFAULT 'other',
  deploy_command TEXT,
  maintainer_id INTEGER REFERENCES people(id),
  project_status TEXT NOT NULL DEFAULT 'live',
  status_note TEXT NOT NULL DEFAULT '',
  a11y_audited_on TEXT,
  a11y_open_issues INTEGER,
  a11y_statement_url TEXT,
  domain TEXT,
  domain_expires_on TEXT,
  cert_expires_on TEXT,
  github_synced_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE checks (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  checked_at TEXT NOT NULL,
  ok INTEGER NOT NULL,
  http_status INTEGER,
  ms INTEGER,
  error TEXT
);
CREATE INDEX checks_site_time ON checks (site_id, checked_at DESC);

CREATE TABLE work_items (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  text TEXT NOT NULL,
  url TEXT,
  github_key TEXT,
  done_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (site_id, github_key)
);

CREATE TABLE log_entries (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  entry_date TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE alert_state (
  site_id INTEGER PRIMARY KEY REFERENCES sites(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  since TEXT NOT NULL,
  last_alert_level TEXT,
  last_alert_at TEXT
);
```

- [ ] **Step 3: Write the D1 adapter for tests**

Create `admin/tests/helpers/d1.js`:

```js
// A D1-shaped adapter over Node's built-in SQLite, so db.js runs real SQL in
// tests. Loaded through createRequire because Vite's resolver does not know the
// prefix-only `node:sqlite` builtin. Every migration is applied in order.
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

const MIGRATIONS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations');

const plain = (row) => (row === undefined ? null : { ...row });

export function makeD1() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(path.join(MIGRATIONS, file), 'utf8'));
  }

  const prepare = (sql) => {
    let args = [];
    const stmt = {
      bind(...values) {
        args = values;
        return stmt;
      },
      async first(column) {
        const row = plain(sqlite.prepare(sql).get(...args));
        if (row && column) return row[column];
        return row;
      },
      async all() {
        return { results: sqlite.prepare(sql).all(...args).map(plain), success: true };
      },
      async run() {
        const info = sqlite.prepare(sql).run(...args);
        return { success: true, meta: { last_row_id: Number(info.lastInsertRowid), changes: info.changes } };
      },
    };
    return stmt;
  };

  return {
    sqlite,
    prepare,
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const out = [];
        for (const s of statements) out.push(await s.run());
        sqlite.exec('COMMIT');
        return out;
      } catch (err) {
        sqlite.exec('ROLLBACK');
        throw err;
      }
    },
  };
}
```

- [ ] **Step 4: Write the schema test**

Create `admin/tests/schema.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { makeD1 } from './helpers/d1.js';

describe('0001_sites migration', () => {
  it('creates every table the app uses', async () => {
    const db = makeD1();
    const { results } = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
    expect(results.map((r) => r.name)).toEqual(
      ['alert_state', 'checks', 'log_entries', 'people', 'sites', 'work_items'],
    );
  });

  it('allows many manual work items but one row per GitHub key per site', async () => {
    const db = makeD1();
    await db.prepare("INSERT INTO sites (slug, name, live_url, created_at, updated_at) VALUES ('a', 'A', 'https://a.test', 't', 't')").run();
    const add = (key) => db.prepare("INSERT INTO work_items (site_id, source, text, github_key, created_at) VALUES (1, 'x', 'x', ?, 't')").bind(key).run();
    await add(null);
    await add(null);
    await add('pr:1');
    await expect(add('pr:1')).rejects.toThrow();
  });
});
```

- [ ] **Step 5: Run the tests**

Run: `node node_modules/vitest/vitest.mjs run`
Expected: PASS for `schema.test.js`, `access.test.js`, `identity.test.js`. No other test files exist.

- [ ] **Step 6: Point wrangler at the new database**

Replace `admin/wrangler.jsonc` with:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "ka-admin",
  "main": "./dist/_worker.js/index.js",
  "compatibility_date": "2026-08-13",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist"
  },
  // ka-sites is the sites dashboard's own database. The old ka-admin database
  // is an archive (it still receives free-course leads from the public site
  // through that project's ADMIN_DB binding) and is deliberately not bound here.
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "ka-sites",
      // Filled in at deploy (Task 16) from `wrangler d1 create ka-sites`.
      // Local development and tests do not need the real id.
      "database_id": "00000000-0000-0000-0000-000000000000",
      "migrations_dir": "migrations"
    }
  ],
  "r2_buckets": [
    { "binding": "LOGOS", "bucket_name": "ka-sites-logos" }
  ],
  // Identifiers, not secrets: the AUD tag names the Access application and the
  // team domain is public. Both are safe to commit.
  "vars": {
    "ACCESS_TEAM_DOMAIN": "kandaperformance.cloudflareaccess.com",
    "ACCESS_AUD": "2bf30fbb34a3a276856fa95b5649bce7fd5a5776acb1103d64a6f51e8ed06900"
  },
  // A Route, not a Custom Domain: a proxied A record (192.0.2.1, deliberately
  // unroutable) already sits at this hostname, and Custom Domain attachment
  // fails with API code 100117 because of it. Routes want that record.
  "routes": [
    { "pattern": "admin.ka-performancefl.com/*", "zone_name": "ka-performancefl.com" }
  ],
  "observability": { "enabled": true },
  // Off since 2026-09-22. Static assets are served before any Worker code, and
  // Access does not cover workers.dev, so this hostname was once an ungated
  // door. The route above is the only way in.
  "workers_dev": false
}
```

- [ ] **Step 7: Commit**

```bash
git add -A .
git commit -m "Admin: blank slate, the ka-sites schema and a real SQLite for tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Time helpers, enums, and the health light

**Files:**
- Create: `admin/src/lib/when.js`, `admin/src/lib/enums.js`, `admin/src/lib/health.js`
- Test: `admin/tests/when.test.js`, `admin/tests/health.test.js`

**Interfaces:**
- Produces (`when.js`): `easternTime(iso) -> "2:05 PM"`, `easternDateTime(iso) -> "Sep 23, 2:05 PM"`, `humanDate(ymd) -> "Sep 23, 2026"`, `todayEastern(nowMs) -> "YYYY-MM-DD"`, `daysUntil(ymd, nowMs) -> integer` (calendar days from today in Eastern; negative when past).
- Produces (`enums.js`): `HOSTING`, `HOSTING_LABEL`, `PROJECT_STATUS`, `STATUS_LABEL`, `LEVELS`, `LEVEL_LABEL`, `ROLES`.
- Produces (`health.js`): `FRESH_MS = 2700000`, `SLOW_MS = 3000`, `LEVEL_RANK = { red: 0, amber: 1, gray: 2, green: 3 }`, `computeLevel(site, checks, nowMs) -> { level, reason }`. `site` needs `cert_expires_on` and `domain_expires_on` (nullable `YYYY-MM-DD`). `checks` is newest first, each `{ checked_at, ok (0/1 or boolean), ms }`.

- [ ] **Step 1: Write the failing tests**

Create `admin/tests/when.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { easternTime, easternDateTime, humanDate, todayEastern, daysUntil } from '../src/lib/when.js';

describe('when', () => {
  it('formats times in Eastern with a plain space before AM or PM', () => {
    expect(easternTime('2026-09-23T18:05:00Z')).toBe('2:05 PM');
    expect(easternDateTime('2026-09-23T18:05:00Z')).toBe('Sep 23, 2:05 PM');
  });
  it('formats stored dates without shifting them', () => {
    expect(humanDate('2026-11-01')).toBe('Nov 1, 2026');
  });
  it('uses the Eastern calendar day for today', () => {
    // 02:00 UTC on the 24th is still the evening of the 23rd in New York.
    expect(todayEastern(Date.parse('2026-09-24T02:00:00Z'))).toBe('2026-09-23');
  });
  it('counts calendar days until a date', () => {
    const now = Date.parse('2026-09-23T15:00:00Z');
    expect(daysUntil('2026-09-23', now)).toBe(0);
    expect(daysUntil('2026-09-30', now)).toBe(7);
    expect(daysUntil('2026-09-20', now)).toBe(-3);
  });
});
```

Create `admin/tests/health.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { computeLevel, LEVEL_RANK } from '../src/lib/health.js';

const NOW = Date.parse('2026-09-23T18:00:00Z');
const at = (minutesAgo) => new Date(NOW - minutesAgo * 60000).toISOString();
const site = (extra = {}) => ({ cert_expires_on: null, domain_expires_on: null, ...extra });
const up = (minutesAgo, ms = 400) => ({ checked_at: at(minutesAgo), ok: 1, ms });
const down = (minutesAgo) => ({ checked_at: at(minutesAgo), ok: 0, ms: null });

describe('computeLevel', () => {
  it('is green when the latest check is fresh, fast and up', () => {
    expect(computeLevel(site(), [up(5)], NOW)).toEqual({ level: 'green', reason: 'Up' });
  });

  it('is gray when there are no checks', () => {
    expect(computeLevel(site(), [], NOW)).toEqual({ level: 'gray', reason: 'Not checked yet' });
  });

  it('is gray when the latest check is older than 45 minutes, even if it failed', () => {
    expect(computeLevel(site(), [down(46), down(61)], NOW)).toEqual({ level: 'gray', reason: 'No recent check' });
  });

  it('is amber after one failed check', () => {
    expect(computeLevel(site(), [down(5), up(20)], NOW)).toEqual({ level: 'amber', reason: 'Last check failed' });
  });

  it('is red after two failed checks in a row, dated from the first failure', () => {
    // at(35) is 17:25 UTC, 1:25 PM Eastern.
    const result = computeLevel(site(), [down(5), down(20), down(35), up(50)], NOW);
    expect(result).toEqual({ level: 'red', reason: 'Down since 1:25 PM' });
  });

  it('is amber when slower than 3 seconds', () => {
    expect(computeLevel(site(), [up(5, 3400)], NOW)).toEqual({ level: 'amber', reason: 'Slow: 3.4 s' });
    expect(computeLevel(site(), [up(5, 3000)], NOW).level).toBe('green');
  });

  it('is red when the certificate expires within 7 days, even with stale checks', () => {
    expect(computeLevel(site({ cert_expires_on: '2026-09-30' }), [], NOW))
      .toEqual({ level: 'red', reason: 'Cert expires in 7 days' });
  });

  it('is amber when the domain expires within 30 days', () => {
    expect(computeLevel(site({ domain_expires_on: '2026-10-23' }), [up(5)], NOW))
      .toEqual({ level: 'amber', reason: 'Domain expires in 30 days' });
    expect(computeLevel(site({ domain_expires_on: '2026-10-24' }), [up(5)], NOW).level).toBe('green');
  });

  it('names the soonest expiry and handles today and the past', () => {
    expect(computeLevel(site({ cert_expires_on: '2026-09-23', domain_expires_on: '2026-09-25' }), [up(5)], NOW).reason)
      .toBe('Cert expires today');
    expect(computeLevel(site({ cert_expires_on: '2026-09-24' }), [up(5)], NOW).reason).toBe('Cert expires tomorrow');
    expect(computeLevel(site({ domain_expires_on: '2026-09-01' }), [up(5)], NOW).reason).toBe('Domain expired');
  });

  it('ranks levels worst first', () => {
    expect(['green', 'gray', 'red', 'amber'].sort((a, b) => LEVEL_RANK[a] - LEVEL_RANK[b]))
      .toEqual(['red', 'amber', 'gray', 'green']);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node node_modules/vitest/vitest.mjs run tests/when.test.js tests/health.test.js`
Expected: FAIL, cannot find module `../src/lib/when.js`.

- [ ] **Step 3: Implement**

Create `admin/src/lib/when.js`:

```js
// Time and date formatting. "Today" is an Eastern-time concept here, never UTC,
// because Alex reads this in Gainesville and an expiry "today" must mean his today.
// ICU puts a narrow no-break space before AM/PM; it is normalized to a plain
// space so strings compare and wrap predictably.

const EASTERN = 'America/New_York';

const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: EASTERN, hour: 'numeric', minute: '2-digit' });
const dateTimeFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: EASTERN, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});
const humanFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
const ymdFmt = new Intl.DateTimeFormat('en-CA', { timeZone: EASTERN, year: 'numeric', month: '2-digit', day: '2-digit' });

const clean = (s) => s.replace(/[\u202f\u00a0]/g, ' ');

export const easternTime = (iso) => clean(timeFmt.format(new Date(iso)));
export const easternDateTime = (iso) => clean(dateTimeFmt.format(new Date(iso)));
export const humanDate = (ymd) => clean(humanFmt.format(new Date(`${ymd}T00:00:00Z`)));
export const todayEastern = (nowMs = Date.now()) => ymdFmt.format(new Date(nowMs));

export function daysUntil(ymd, nowMs = Date.now()) {
  const today = Date.parse(`${todayEastern(nowMs)}T00:00:00Z`);
  return Math.round((Date.parse(`${ymd}T00:00:00Z`) - today) / 86400000);
}
```

Create `admin/src/lib/enums.js`:

```js
// Whitelists and their display labels. Form input is checked against these
// arrays; nothing outside them is ever written.

export const HOSTING = ['pages', 'worker', 'client-push', 'other'];
export const HOSTING_LABEL = {
  pages: 'Cloudflare Pages',
  worker: 'Cloudflare Worker',
  'client-push': "Client's repo or server",
  other: 'Other',
};

export const PROJECT_STATUS = ['live', 'in_progress', 'waiting_client', 'paused'];
export const STATUS_LABEL = {
  live: 'Live',
  in_progress: 'In progress',
  waiting_client: 'Waiting on client',
  paused: 'Paused',
};

export const LEVELS = ['red', 'amber', 'gray', 'green'];
export const LEVEL_LABEL = { red: 'Problem', amber: 'Needs a look', gray: 'No data', green: 'Healthy' };

export const ROLES = ['owner', 'maintainer'];
```

Create `admin/src/lib/health.js`:

```js
// The health light. One pure function shared by the dashboard and the checker,
// so the screen and the alert emails can never disagree.
//
// Order matters and the first match wins: red, gray, amber, green. Check-based
// red needs fresh checks, so a stalled checker reads gray rather than "down";
// an expiry within 7 days is red regardless, because that fact does not go stale.
import { daysUntil, easternTime } from './when.js';

export const FRESH_MS = 45 * 60 * 1000;
export const SLOW_MS = 3000;
export const LEVEL_RANK = { red: 0, amber: 1, gray: 2, green: 3 };

function soonestExpiry(site, nowMs) {
  const found = [];
  if (site.cert_expires_on) found.push({ label: 'Cert', days: daysUntil(site.cert_expires_on, nowMs) });
  if (site.domain_expires_on) found.push({ label: 'Domain', days: daysUntil(site.domain_expires_on, nowMs) });
  found.sort((a, b) => a.days - b.days);
  return found[0] ?? null;
}

function expiryReason({ label, days }) {
  if (days < 0) return `${label} expired`;
  if (days === 0) return `${label} expires today`;
  if (days === 1) return `${label} expires tomorrow`;
  return `${label} expires in ${days} days`;
}

export function computeLevel(site, checks, nowMs) {
  const expiry = soonestExpiry(site, nowMs);
  if (expiry && expiry.days <= 7) return { level: 'red', reason: expiryReason(expiry) };

  const latest = checks[0];
  if (!latest) return { level: 'gray', reason: 'Not checked yet' };
  if (nowMs - Date.parse(latest.checked_at) > FRESH_MS) return { level: 'gray', reason: 'No recent check' };

  if (!latest.ok) {
    let failures = 0;
    let firstFailure = latest;
    for (const check of checks) {
      if (check.ok) break;
      failures += 1;
      firstFailure = check;
    }
    if (failures >= 2) return { level: 'red', reason: `Down since ${easternTime(firstFailure.checked_at)}` };
    return { level: 'amber', reason: 'Last check failed' };
  }

  if (latest.ms != null && latest.ms > SLOW_MS) {
    return { level: 'amber', reason: `Slow: ${(latest.ms / 1000).toFixed(1)} s` };
  }
  if (expiry && expiry.days <= 30) return { level: 'amber', reason: expiryReason(expiry) };
  return { level: 'green', reason: 'Up' };
}
```

- [ ] **Step 4: Run the tests**

Run: `node node_modules/vitest/vitest.mjs run tests/when.test.js tests/health.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/when.js src/lib/enums.js src/lib/health.js tests/when.test.js tests/health.test.js
git commit -m "Sites: the health light, one pure rule for the screen and the alerts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The database module

**Files:**
- Create: `admin/src/lib/db.js`
- Test: `admin/tests/db.test.js`

**Interfaces:**
- Consumes: `makeD1()` (Task 1).
- Produces, every function `async` with the D1 binding first:
  - `getPersonByEmail(db, email) -> {id,name,email,role} | null` (email lowercased)
  - `listPeople(db) -> Person[]`
  - `listSites(db) -> Site[]` (all columns, ordered by name, case-insensitive)
  - `getSiteBySlug(db, slug) -> Site | null`
  - `SITE_FIELDS` = `['slug','name','live_url','repo','local_path','hosting','deploy_command','maintainer_id','domain']`
  - `createSite(db, values, nowIso) -> id`, `updateSite(db, id, values, nowIso)` (both write exactly `SITE_FIELDS`)
  - `updateSiteStatus(db, id, {project_status, status_note}, nowIso)`
  - `updateSiteA11y(db, id, {a11y_audited_on, a11y_open_issues, a11y_statement_url}, nowIso)`
  - `setSiteLogo(db, id, key, nowIso)`, `setSiteFavicon(db, id, key, nowIso)`
  - `setSiteExpiry(db, id, {cert_expires_on?, domain_expires_on?}, nowIso)` (only keys that are present)
  - `setGithubSynced(db, id, nowIso)`
  - `insertCheck(db, {site_id, checked_at, ok, http_status, ms, error})`
  - `latestChecksForAll(db, perSite) -> Map<siteId, Check[]>` (newest first)
  - `checksSince(db, siteId, sinceIso) -> Check[]` (newest first)
  - `pruneChecks(db, beforeIso)`
  - `listWorkItems(db, siteId) -> WorkItem[]`, `openWorkCounts(db) -> Map<siteId, number>`
  - `addManualWork(db, siteId, text, nowIso)`, `setManualWorkDone(db, siteId, itemId, done, nowIso)`
  - `listGithubItems(db, siteId) -> WorkItem[]`, `applyGithubPlan(db, siteId, {inserts, updates, closes}, nowIso)`
  - `listLog(db, siteId)`, `addLog(db, siteId, entryDate, text, nowIso)`
  - `allAlertStates(db) -> Map<siteId, AlertState>`, `upsertAlertState(db, {site_id, level, since, last_alert_level, last_alert_at})`

- [ ] **Step 1: Write the failing tests**

Create `admin/tests/db.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import * as q from '../src/lib/db.js';

const T = '2026-09-23T18:00:00.000Z';
let db;

const site = (over = {}) => ({
  slug: 'mbs-medicine', name: 'MBS Medicine', live_url: 'https://mbsdoc.com', repo: null,
  local_path: null, hosting: 'pages', deploy_command: null, maintainer_id: null, domain: null, ...over,
});

beforeEach(() => { db = makeD1(); });

describe('people', () => {
  it('finds a person by email case-insensitively', async () => {
    await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Alex', 'alex@example.com', 'owner', 't')").run();
    expect(await q.getPersonByEmail(db, 'ALEX@example.com')).toMatchObject({ name: 'Alex', role: 'owner' });
    expect(await q.getPersonByEmail(db, 'nobody@example.com')).toBeNull();
  });
});

describe('sites', () => {
  it('creates, reads, lists and updates', async () => {
    const id = await q.createSite(db, site(), T);
    await q.createSite(db, site({ slug: 'another', name: 'another site' }), T);
    expect((await q.getSiteBySlug(db, 'mbs-medicine')).id).toBe(id);
    expect((await q.listSites(db)).map((s) => s.name)).toEqual(['another site', 'MBS Medicine']);
    await q.updateSite(db, id, site({ repo: 'o/r' }), '2026-09-24T00:00:00.000Z');
    const after = await q.getSiteBySlug(db, 'mbs-medicine');
    expect(after.repo).toBe('o/r');
    expect(after.updated_at).toBe('2026-09-24T00:00:00.000Z');
  });

  it('updates status, accessibility, logo, favicon and only the expiry fields given', async () => {
    const id = await q.createSite(db, site(), T);
    await q.updateSiteStatus(db, id, { project_status: 'waiting_client', status_note: 'Photos' }, T);
    await q.updateSiteA11y(db, id, { a11y_audited_on: '2026-09-01', a11y_open_issues: 3, a11y_statement_url: null }, T);
    await q.setSiteLogo(db, id, 'logos/a.png', T);
    await q.setSiteFavicon(db, id, 'favicons/a', T);
    await q.setSiteExpiry(db, id, { cert_expires_on: '2026-12-01' }, T);
    await q.setSiteExpiry(db, id, { domain_expires_on: '2027-01-01' }, T);
    const s = await q.getSiteBySlug(db, 'mbs-medicine');
    expect(s).toMatchObject({
      project_status: 'waiting_client', status_note: 'Photos', a11y_open_issues: 3,
      logo_key: 'logos/a.png', favicon_key: 'favicons/a',
      cert_expires_on: '2026-12-01', domain_expires_on: '2027-01-01',
    });
  });
});

describe('checks', () => {
  it('returns the latest N per site, newest first, and prunes old rows', async () => {
    const a = await q.createSite(db, site(), T);
    const b = await q.createSite(db, site({ slug: 'b', name: 'B' }), T);
    for (const [id, when, ok] of [[a, '2026-09-23T17:00:00Z', 1], [a, '2026-09-23T17:15:00Z', 0], [a, '2026-09-23T17:30:00Z', 1], [b, '2026-09-23T17:30:00Z', 1]]) {
      await q.insertCheck(db, { site_id: id, checked_at: when, ok, http_status: 200, ms: 100, error: null });
    }
    const map = await q.latestChecksForAll(db, 2);
    expect(map.get(a).map((c) => c.checked_at)).toEqual(['2026-09-23T17:30:00Z', '2026-09-23T17:15:00Z']);
    expect(map.get(b)).toHaveLength(1);
    expect(await q.checksSince(db, a, '2026-09-23T17:10:00Z')).toHaveLength(2);
    await q.pruneChecks(db, '2026-09-23T17:10:00Z');
    expect(await q.checksSince(db, a, '2000-01-01T00:00:00Z')).toHaveLength(2);
  });

  it('stores booleans as 0 and 1', async () => {
    const a = await q.createSite(db, site(), T);
    await q.insertCheck(db, { site_id: a, checked_at: T, ok: false, http_status: null, ms: null, error: 'timeout' });
    expect((await q.checksSince(db, a, '2000-01-01'))[0]).toMatchObject({ ok: 0, error: 'timeout' });
  });
});

describe('work items', () => {
  it('adds and ticks manual items and counts only open ones', async () => {
    const a = await q.createSite(db, site(), T);
    await q.addManualWork(db, a, 'Fix contrast', T);
    await q.addManualWork(db, a, 'Push credit commit', T);
    const [first] = await q.listWorkItems(db, a);
    await q.setManualWorkDone(db, a, first.id, true, T);
    expect((await q.openWorkCounts(db)).get(a)).toBe(1);
    await q.setManualWorkDone(db, a, first.id, false, T);
    expect((await q.openWorkCounts(db)).get(a)).toBe(2);
  });

  it('applies a GitHub plan: inserts, reopening updates and closes', async () => {
    const a = await q.createSite(db, site(), T);
    await q.applyGithubPlan(db, a, { inserts: [{ github_key: 'pr:1', text: 'PR 1', url: 'u1' }, { github_key: 'branch:x', text: 'Branch x', url: 'u2' }], updates: [], closes: [] }, T);
    const items = await q.listGithubItems(db, a);
    const pr = items.find((i) => i.github_key === 'pr:1');
    const br = items.find((i) => i.github_key === 'branch:x');
    await q.applyGithubPlan(db, a, { inserts: [], updates: [], closes: [br.id] }, T);
    await q.applyGithubPlan(db, a, { inserts: [], updates: [{ id: pr.id, text: 'PR 1 renamed', url: 'u1' }], closes: [] }, T);
    const after = await q.listGithubItems(db, a);
    expect(after.find((i) => i.id === pr.id)).toMatchObject({ text: 'PR 1 renamed', done_at: null });
    expect(after.find((i) => i.id === br.id).done_at).toBe(T);
  });

  it('never lets the manual toggle touch a GitHub item', async () => {
    const a = await q.createSite(db, site(), T);
    await q.applyGithubPlan(db, a, { inserts: [{ github_key: 'pr:1', text: 'PR 1', url: 'u' }], updates: [], closes: [] }, T);
    const [pr] = await q.listGithubItems(db, a);
    await q.setManualWorkDone(db, a, pr.id, true, T);
    expect((await q.listGithubItems(db, a))[0].done_at).toBeNull();
  });
});

describe('log and alert state', () => {
  it('lists log entries newest first', async () => {
    const a = await q.createSite(db, site(), T);
    await q.addLog(db, a, '2026-09-01', 'Older', T);
    await q.addLog(db, a, '2026-09-22', 'Newer', T);
    expect((await q.listLog(db, a)).map((e) => e.text)).toEqual(['Newer', 'Older']);
  });

  it('upserts alert state', async () => {
    const a = await q.createSite(db, site(), T);
    await q.upsertAlertState(db, { site_id: a, level: 'green', since: T, last_alert_level: null, last_alert_at: null });
    await q.upsertAlertState(db, { site_id: a, level: 'red', since: T, last_alert_level: 'red', last_alert_at: T });
    expect((await q.allAlertStates(db)).get(a)).toMatchObject({ level: 'red', last_alert_level: 'red' });
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `node node_modules/vitest/vitest.mjs run tests/db.test.js`
Expected: FAIL, cannot find module `../src/lib/db.js`.

- [ ] **Step 3: Implement**

Create `admin/src/lib/db.js`:

```js
// Every D1 query the dashboard and the checker make. The binding is always the
// first argument, so this module has no idea whether it runs in a Worker or a
// test, and tests run it against real SQLite (tests/helpers/d1.js).
// Booleans are stored as 0/1; undefined is never bound (SQLite rejects it).

const rows = async (stmt) => (await stmt.all()).results ?? [];
const nil = (v) => (v === undefined ? null : v);

// people

export async function getPersonByEmail(db, email) {
  return db.prepare('SELECT id, name, email, role FROM people WHERE email = ?')
    .bind(String(email ?? '').toLowerCase()).first();
}

export async function listPeople(db) {
  return rows(db.prepare('SELECT id, name, email, role FROM people ORDER BY name COLLATE NOCASE'));
}

// sites

export const SITE_FIELDS = ['slug', 'name', 'live_url', 'repo', 'local_path', 'hosting', 'deploy_command', 'maintainer_id', 'domain'];

export async function listSites(db) {
  return rows(db.prepare('SELECT * FROM sites ORDER BY name COLLATE NOCASE'));
}

export async function getSiteBySlug(db, slug) {
  return db.prepare('SELECT * FROM sites WHERE slug = ?').bind(slug).first();
}

export async function createSite(db, values, nowIso) {
  const cols = SITE_FIELDS.join(', ');
  const marks = SITE_FIELDS.map(() => '?').join(', ');
  const res = await db.prepare(`INSERT INTO sites (${cols}, created_at, updated_at) VALUES (${marks}, ?, ?)`)
    .bind(...SITE_FIELDS.map((f) => nil(values[f])), nowIso, nowIso).run();
  return res.meta.last_row_id;
}

export async function updateSite(db, id, values, nowIso) {
  const sets = SITE_FIELDS.map((f) => `${f} = ?`).join(', ');
  await db.prepare(`UPDATE sites SET ${sets}, updated_at = ? WHERE id = ?`)
    .bind(...SITE_FIELDS.map((f) => nil(values[f])), nowIso, id).run();
}

export async function updateSiteStatus(db, id, { project_status, status_note }, nowIso) {
  await db.prepare('UPDATE sites SET project_status = ?, status_note = ?, updated_at = ? WHERE id = ?')
    .bind(project_status, status_note ?? '', nowIso, id).run();
}

export async function updateSiteA11y(db, id, v, nowIso) {
  await db.prepare('UPDATE sites SET a11y_audited_on = ?, a11y_open_issues = ?, a11y_statement_url = ?, updated_at = ? WHERE id = ?')
    .bind(nil(v.a11y_audited_on), nil(v.a11y_open_issues), nil(v.a11y_statement_url), nowIso, id).run();
}

export async function setSiteLogo(db, id, key, nowIso) {
  await db.prepare('UPDATE sites SET logo_key = ?, updated_at = ? WHERE id = ?').bind(key, nowIso, id).run();
}

export async function setSiteFavicon(db, id, key, nowIso) {
  await db.prepare('UPDATE sites SET favicon_key = ?, updated_at = ? WHERE id = ?').bind(key, nowIso, id).run();
}

export async function setSiteExpiry(db, id, dates, nowIso) {
  const sets = [];
  const args = [];
  for (const col of ['cert_expires_on', 'domain_expires_on']) {
    if (dates[col] !== undefined) {
      sets.push(`${col} = ?`);
      args.push(dates[col]);
    }
  }
  if (sets.length === 0) return;
  await db.prepare(`UPDATE sites SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).bind(...args, nowIso, id).run();
}

export async function setGithubSynced(db, id, nowIso) {
  await db.prepare('UPDATE sites SET github_synced_at = ? WHERE id = ?').bind(nowIso, id).run();
}

// checks

export async function insertCheck(db, c) {
  await db.prepare('INSERT INTO checks (site_id, checked_at, ok, http_status, ms, error) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(c.site_id, c.checked_at, c.ok ? 1 : 0, nil(c.http_status), nil(c.ms), nil(c.error)).run();
}

export async function latestChecksForAll(db, perSite) {
  const list = await rows(db.prepare(
    `SELECT site_id, checked_at, ok, http_status, ms, error FROM (
       SELECT *, ROW_NUMBER() OVER (PARTITION BY site_id ORDER BY checked_at DESC, id DESC) AS rn FROM checks
     ) WHERE rn <= ? ORDER BY site_id, checked_at DESC`,
  ).bind(perSite));
  const map = new Map();
  for (const r of list) {
    if (!map.has(r.site_id)) map.set(r.site_id, []);
    map.get(r.site_id).push(r);
  }
  return map;
}

export async function checksSince(db, siteId, sinceIso) {
  return rows(db.prepare(
    'SELECT checked_at, ok, http_status, ms, error FROM checks WHERE site_id = ? AND checked_at >= ? ORDER BY checked_at DESC, id DESC',
  ).bind(siteId, sinceIso));
}

export async function pruneChecks(db, beforeIso) {
  await db.prepare('DELETE FROM checks WHERE checked_at < ?').bind(beforeIso).run();
}

// work items

export async function listWorkItems(db, siteId) {
  return rows(db.prepare('SELECT * FROM work_items WHERE site_id = ? ORDER BY done_at IS NOT NULL, created_at, id').bind(siteId));
}

export async function openWorkCounts(db) {
  const list = await rows(db.prepare('SELECT site_id, COUNT(*) AS n FROM work_items WHERE done_at IS NULL GROUP BY site_id'));
  return new Map(list.map((r) => [r.site_id, r.n]));
}

export async function addManualWork(db, siteId, text, nowIso) {
  await db.prepare("INSERT INTO work_items (site_id, source, text, created_at) VALUES (?, 'manual', ?, ?)")
    .bind(siteId, text, nowIso).run();
}

export async function setManualWorkDone(db, siteId, itemId, done, nowIso) {
  await db.prepare("UPDATE work_items SET done_at = ? WHERE id = ? AND site_id = ? AND source = 'manual'")
    .bind(done ? nowIso : null, itemId, siteId).run();
}

export async function listGithubItems(db, siteId) {
  return rows(db.prepare("SELECT * FROM work_items WHERE site_id = ? AND source = 'github'").bind(siteId));
}

export async function applyGithubPlan(db, siteId, plan, nowIso) {
  const stmts = [];
  for (const i of plan.inserts) {
    stmts.push(db.prepare("INSERT INTO work_items (site_id, source, text, url, github_key, created_at) VALUES (?, 'github', ?, ?, ?, ?)")
      .bind(siteId, i.text, nil(i.url), i.github_key, nowIso));
  }
  for (const u of plan.updates) {
    stmts.push(db.prepare('UPDATE work_items SET text = ?, url = ?, done_at = NULL WHERE id = ? AND site_id = ?')
      .bind(u.text, nil(u.url), u.id, siteId));
  }
  for (const id of plan.closes) {
    stmts.push(db.prepare('UPDATE work_items SET done_at = ? WHERE id = ? AND site_id = ?').bind(nowIso, id, siteId));
  }
  if (stmts.length) await db.batch(stmts);
}

// log

export async function listLog(db, siteId) {
  return rows(db.prepare('SELECT * FROM log_entries WHERE site_id = ? ORDER BY entry_date DESC, id DESC').bind(siteId));
}

export async function addLog(db, siteId, entryDate, text, nowIso) {
  await db.prepare('INSERT INTO log_entries (site_id, entry_date, text, created_at) VALUES (?, ?, ?, ?)')
    .bind(siteId, entryDate, text, nowIso).run();
}

// alert state

export async function allAlertStates(db) {
  const list = await rows(db.prepare('SELECT * FROM alert_state'));
  return new Map(list.map((r) => [r.site_id, r]));
}

export async function upsertAlertState(db, s) {
  await db.prepare(
    `INSERT INTO alert_state (site_id, level, since, last_alert_level, last_alert_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(site_id) DO UPDATE SET level = excluded.level, since = excluded.since,
       last_alert_level = excluded.last_alert_level, last_alert_at = excluded.last_alert_at`,
  ).bind(s.site_id, s.level, s.since, nil(s.last_alert_level), nil(s.last_alert_at)).run();
}
```

- [ ] **Step 4: Run the tests**

Run: `node node_modules/vitest/vitest.mjs run tests/db.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db.js tests/db.test.js
git commit -m "Sites: every query in one module, tested against real SQLite

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Who may come in

**Files:**
- Create: `admin/src/lib/authorize.js`
- Rewrite: `admin/src/middleware.js`
- Test: `admin/tests/authorize.test.js`

**Interfaces:**
- Consumes: `resolveEmail({request, env, verify})` from `identity.js` (unchanged, returns `{email, source}` or `null`); `getPersonByEmail` (Task 3).
- Produces: `authorize({request, env, resolve}) -> {id, name, email, role, source} | null`; `Astro.locals.user` set to that object on every request that reaches a page.

- [ ] **Step 1: Write the failing test**

Create `admin/tests/authorize.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import { authorize } from '../src/lib/authorize.js';

const request = new Request('https://admin.ka-performancefl.com/');

async function envWithAlex() {
  const DB = makeD1();
  await DB.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Alex Anderson', 'alex@example.com', 'owner', 't')").run();
  return { DB };
}

describe('authorize', () => {
  it('lets in a verified identity that is in people', async () => {
    const env = await envWithAlex();
    const user = await authorize({ request, env, resolve: async () => ({ email: 'alex@example.com', source: 'access' }) });
    expect(user).toMatchObject({ name: 'Alex Anderson', role: 'owner', source: 'access' });
  });

  it('refuses a verified identity that is not in people', async () => {
    const env = await envWithAlex();
    expect(await authorize({ request, env, resolve: async () => ({ email: 'someone@example.com', source: 'access' }) })).toBeNull();
  });

  it('refuses when there is no identity', async () => {
    const env = await envWithAlex();
    expect(await authorize({ request, env, resolve: async () => null })).toBeNull();
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `node node_modules/vitest/vitest.mjs run tests/authorize.test.js`
Expected: FAIL, cannot find module `../src/lib/authorize.js`.

- [ ] **Step 3: Implement**

Create `admin/src/lib/authorize.js`:

```js
// Access says who you are; the people table says whether you may be here.
// Kept out of middleware.js so it can be tested without Astro's virtual modules.
import { resolveEmail } from './identity.js';
import { getPersonByEmail } from './db.js';

export async function authorize({ request, env, resolve = resolveEmail }) {
  const identity = await resolve({ request, env });
  if (!identity) return null;
  const person = await getPersonByEmail(env.DB, identity.email);
  if (!person) return null;
  return { id: person.id, name: person.name, email: person.email, role: person.role, source: identity.source };
}
```

Replace `admin/src/middleware.js` with:

```js
import { defineMiddleware } from 'astro:middleware';
import { authorize } from './lib/authorize.js';

// Deny by default. This runs before every route, including /logos/*, so nothing
// the app serves is reachable without an Access identity that is in `people`.
// Static files in ./dist (fonts, favicons) are served before this runs; they
// are the only public bytes, and only through Access, since workers_dev is off.
const DENY = 'Not authorized. This application is restricted to K & A Performance staff.';

export const onRequest = defineMiddleware(async (context, next) => {
  const env = context.locals.runtime?.env;
  if (!env?.DB) return new Response('Server misconfigured: no database binding.', { status: 500 });

  const user = await authorize({ request: context.request, env });
  if (!user) return new Response(DENY, { status: 403 });

  context.locals.user = user;
  return next();
});
```

- [ ] **Step 4: Run all tests**

Run: `node node_modules/vitest/vitest.mjs run`
Expected: PASS, including the unchanged `access.test.js` and `identity.test.js`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/authorize.js src/middleware.js tests/authorize.test.js
git commit -m "Sites: deny by default, people table decides who gets in

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Form validation

**Files:**
- Create: `admin/src/lib/validate.js`
- Test: `admin/tests/validate.test.js`

**Interfaces:**
- Consumes: `HOSTING`, `PROJECT_STATUS` (Task 2).
- Produces: `slugify(s)`, `parseSiteForm(formData) -> {ok, values, errors}` (values keyed by `SITE_FIELDS`), `parseStatusForm(fd)`, `parseA11yForm(fd)`, `parseText(fd, key, max) -> {ok, value} | {ok:false, error}`, `LOGO_TYPES`, `MAX_LOGO_BYTES`, `checkLogo(file) -> {ok, ext} | {ok:false, error}` (`ext` is `null` when no file was chosen). `errors` maps a field name to a message.

- [ ] **Step 1: Write the failing tests**

Create `admin/tests/validate.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { slugify, parseSiteForm, parseStatusForm, parseA11yForm, parseText, checkLogo, MAX_LOGO_BYTES } from '../src/lib/validate.js';

const fd = (obj) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.append(k, v);
  return f;
};

describe('slugify', () => {
  it('makes readable slugs', () => {
    expect(slugify("David's BBQ")).toBe('david-s-bbq');
    expect(slugify('PB&J Strategic Accounting')).toBe('pb-and-j-strategic-accounting');
    expect(slugify('  Café Été  ')).toBe('cafe-ete');
  });
});

describe('parseSiteForm', () => {
  it('accepts the minimum and fills defaults', () => {
    const r = parseSiteForm(fd({ name: 'MBS Medicine', live_url: 'https://mbsdoc.com' }));
    expect(r.ok).toBe(true);
    expect(r.values).toMatchObject({ slug: 'mbs-medicine', hosting: 'other', repo: null, maintainer_id: null, domain: null });
  });

  it('rejects a missing name, a bad URL, a bad repo, an unknown hosting and a bad domain', () => {
    const r = parseSiteForm(fd({ name: '', live_url: 'mbsdoc.com', repo: 'just-a-name', hosting: 'ftp', domain: 'not a domain' }));
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).sort()).toEqual(['domain', 'hosting', 'live_url', 'name', 'repo']);
  });

  it('keeps an explicit slug and parses the maintainer id', () => {
    const r = parseSiteForm(fd({ name: 'X', live_url: 'https://x.test', slug: 'Custom Slug', maintainer_id: '1' }));
    expect(r.values.slug).toBe('custom-slug');
    expect(r.values.maintainer_id).toBe(1);
  });
});

describe('parseStatusForm', () => {
  it('whitelists the status and limits the note', () => {
    expect(parseStatusForm(fd({ project_status: 'paused', status_note: 'Back in October' })).ok).toBe(true);
    expect(parseStatusForm(fd({ project_status: 'gone', status_note: '' })).errors.project_status).toBeTruthy();
    expect(parseStatusForm(fd({ project_status: 'live', status_note: 'x'.repeat(141) })).errors.status_note).toBeTruthy();
  });
});

describe('parseA11yForm', () => {
  it('treats blanks as unknown and checks the rest', () => {
    expect(parseA11yForm(fd({ a11y_audited_on: '', a11y_open_issues: '', a11y_statement_url: '' })).values)
      .toEqual({ a11y_audited_on: null, a11y_open_issues: null, a11y_statement_url: null });
    const bad = parseA11yForm(fd({ a11y_audited_on: 'yesterday', a11y_open_issues: '-1', a11y_statement_url: 'x' }));
    expect(Object.keys(bad.errors).sort()).toEqual(['a11y_audited_on', 'a11y_open_issues', 'a11y_statement_url']);
  });
});

describe('parseText', () => {
  it('requires text within a limit', () => {
    expect(parseText(fd({ text: ' Fix contrast ' }), 'text', 200)).toEqual({ ok: true, value: 'Fix contrast' });
    expect(parseText(fd({ text: '  ' }), 'text', 200).ok).toBe(false);
    expect(parseText(fd({ text: 'abc' }), 'text', 2).ok).toBe(false);
  });
});

describe('checkLogo', () => {
  it('allows no file, the four image types, and nothing over 1 MB', () => {
    expect(checkLogo(null)).toEqual({ ok: true, ext: null });
    expect(checkLogo(new File([new Uint8Array(0)], 'empty.png', { type: 'image/png' }))).toEqual({ ok: true, ext: null });
    expect(checkLogo(new File([new Uint8Array(10)], 'a.svg', { type: 'image/svg+xml' }))).toEqual({ ok: true, ext: 'svg' });
    expect(checkLogo(new File([new Uint8Array(10)], 'a.gif', { type: 'image/gif' })).ok).toBe(false);
    expect(checkLogo(new File([new Uint8Array(MAX_LOGO_BYTES + 1)], 'a.png', { type: 'image/png' })).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `node node_modules/vitest/vitest.mjs run tests/validate.test.js`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Implement**

Create `admin/src/lib/validate.js`:

```js
// Form parsing. Every write in the app goes through one of these; each returns
// either values ready for db.js or messages keyed by field name, which the page
// shows next to the field. Messages are plain, US English, no em dashes.
import { HOSTING, PROJECT_STATUS } from './enums.js';

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const str = (fd, key) => String(fd.get(key) ?? '').trim();
const blankToNull = (v) => (v === '' ? null : v);
const done = (values, errors) => ({ ok: Object.keys(errors).length === 0, values, errors });

function isHttpUrl(v) {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function slugify(s) {
  return String(s)
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function parseSiteForm(fd) {
  const errors = {};
  const v = {};

  v.name = str(fd, 'name');
  if (!v.name) errors.name = 'Name is required.';
  else if (v.name.length > 80) errors.name = 'Keep the name under 80 characters.';

  v.live_url = str(fd, 'live_url');
  if (!isHttpUrl(v.live_url)) errors.live_url = 'Enter the full address, starting with https://.';

  v.slug = slugify(str(fd, 'slug') || v.name);
  if (!v.slug && !errors.name) errors.name = 'The name needs at least one letter or number.';

  v.repo = blankToNull(str(fd, 'repo'));
  if (v.repo && !/^[\w.-]+\/[\w.-]+$/.test(v.repo)) errors.repo = 'Use owner/name, for example shizzoobies/kandadesigners.';

  v.local_path = blankToNull(str(fd, 'local_path'));

  v.hosting = str(fd, 'hosting') || 'other';
  if (!HOSTING.includes(v.hosting)) errors.hosting = 'Pick a hosting type from the list.';

  v.deploy_command = blankToNull(str(fd, 'deploy_command'));

  const maintainer = str(fd, 'maintainer_id');
  v.maintainer_id = maintainer === '' ? null : Number(maintainer);
  if (v.maintainer_id !== null && !Number.isInteger(v.maintainer_id)) errors.maintainer_id = 'Pick a person from the list.';

  v.domain = blankToNull(str(fd, 'domain').toLowerCase());
  if (v.domain && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(v.domain)) errors.domain = 'Enter a bare domain, for example example.com.';

  return done(v, errors);
}

export function parseStatusForm(fd) {
  const errors = {};
  const project_status = str(fd, 'project_status');
  if (!PROJECT_STATUS.includes(project_status)) errors.project_status = 'Pick a status from the list.';
  const status_note = str(fd, 'status_note');
  if (status_note.length > 140) errors.status_note = 'Keep the note under 140 characters.';
  return done({ project_status, status_note }, errors);
}

export function parseA11yForm(fd) {
  const errors = {};
  const a11y_audited_on = blankToNull(str(fd, 'a11y_audited_on'));
  if (a11y_audited_on && !YMD.test(a11y_audited_on)) errors.a11y_audited_on = 'Use a date.';

  const issues = str(fd, 'a11y_open_issues');
  const a11y_open_issues = issues === '' ? null : Number(issues);
  if (a11y_open_issues !== null && !(Number.isInteger(a11y_open_issues) && a11y_open_issues >= 0)) {
    errors.a11y_open_issues = 'Use a whole number, 0 or more.';
  }

  const a11y_statement_url = blankToNull(str(fd, 'a11y_statement_url'));
  if (a11y_statement_url && !isHttpUrl(a11y_statement_url)) {
    errors.a11y_statement_url = 'Enter the full address, starting with https://.';
  }
  return done({ a11y_audited_on, a11y_open_issues, a11y_statement_url }, errors);
}

export function parseText(fd, key, max) {
  const value = str(fd, key);
  if (!value) return { ok: false, error: 'Write something first.' };
  if (value.length > max) return { ok: false, error: `Keep it under ${max} characters.` };
  return { ok: true, value };
}

export const LOGO_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' };
export const MAX_LOGO_BYTES = 1024 * 1024;

export function checkLogo(file) {
  if (!file || typeof file === 'string' || file.size === 0) return { ok: true, ext: null };
  const ext = LOGO_TYPES[file.type];
  if (!ext) return { ok: false, error: 'Upload a PNG, JPEG, WebP or SVG.' };
  if (file.size > MAX_LOGO_BYTES) return { ok: false, error: 'Keep the logo under 1 MB.' };
  return { ok: true, ext };
}
```

- [ ] **Step 4: Run the tests**

Run: `node node_modules/vitest/vitest.mjs run tests/validate.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validate.js tests/validate.test.js
git commit -m "Sites: form validation with plain messages per field

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Expiry lookups and the fallback icon

**Files:**
- Create: `admin/src/lib/expiry.js`, `admin/src/lib/favicon.js`
- Test: `admin/tests/expiry.test.js`, `admin/tests/favicon.test.js`

**Interfaces:**
- Produces (`expiry.js`): `hostFromUrl(url) -> host`, `ownDomain(site) -> domain | null` (uses `site.domain` if set; `null` for `*.pages.dev`, `*.workers.dev`, `*.netlify.app`, `*.github.io`; otherwise the last two labels of the host without `www.`), `parseCrtSh(entries, host) -> "YYYY-MM-DD" | null`, `parseRdap(json) -> "YYYY-MM-DD" | null`, `lookupCertExpiry(host, fetchImpl)`, `lookupDomainExpiry(domain, fetchImpl)` (both throw on a non-2xx response).
- Produces (`favicon.js`): `findIconHref(html) -> href | null` (prefers `apple-touch-icon`, then any `rel` containing the token `icon`), `fetchFavicon(liveUrl, fetchImpl) -> {bytes: ArrayBuffer, contentType} | null`.

- [ ] **Step 1: Write the failing tests**

Create `admin/tests/expiry.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { hostFromUrl, ownDomain, parseCrtSh, parseRdap, lookupCertExpiry, lookupDomainExpiry } from '../src/lib/expiry.js';

describe('domains', () => {
  it('derives the host and the registrable domain', () => {
    expect(hostFromUrl('https://www.MBSDOC.com/path')).toBe('www.mbsdoc.com');
    expect(ownDomain({ live_url: 'https://www.mbsdoc.com', domain: null })).toBe('mbsdoc.com');
    expect(ownDomain({ live_url: 'https://admin.ka-performancefl.com', domain: null })).toBe('ka-performancefl.com');
  });
  it('skips platform hostnames and honors an override', () => {
    expect(ownDomain({ live_url: 'https://foremotion-soon.pages.dev', domain: null })).toBeNull();
    expect(ownDomain({ live_url: 'https://x.workers.dev', domain: null })).toBeNull();
    expect(ownDomain({ live_url: 'https://shop.example.co.uk', domain: 'example.co.uk' })).toBe('example.co.uk');
  });
});

describe('parseCrtSh', () => {
  const entries = [
    { name_value: 'mbsdoc.com\nwww.mbsdoc.com', not_after: '2026-11-20T23:59:59' },
    { name_value: '*.mbsdoc.com', not_after: '2026-12-15T12:00:00' },
    { name_value: 'other.com', not_after: '2027-06-01T00:00:00' },
  ];
  it('takes the latest not_after among certificates that cover the host', () => {
    expect(parseCrtSh(entries, 'www.mbsdoc.com')).toBe('2026-12-15');
    expect(parseCrtSh(entries, 'mbsdoc.com')).toBe('2026-11-20');
  });
  it('does not let a wildcard cover two levels down', () => {
    expect(parseCrtSh(entries, 'a.b.mbsdoc.com')).toBeNull();
  });
  it('returns null for nothing useful', () => {
    expect(parseCrtSh([], 'x.com')).toBeNull();
    expect(parseCrtSh(null, 'x.com')).toBeNull();
  });
});

describe('parseRdap', () => {
  it('reads the expiration event', () => {
    expect(parseRdap({ events: [{ eventAction: 'registration', eventDate: '2020-01-01T00:00:00Z' }, { eventAction: 'expiration', eventDate: '2027-03-01T12:00:00Z' }] }))
      .toBe('2027-03-01');
    expect(parseRdap({ events: [] })).toBeNull();
  });
});

describe('lookups', () => {
  const json = (body, status = 200) => async () => new Response(JSON.stringify(body), { status });
  it('calls crt.sh and RDAP and parses the answers', async () => {
    expect(await lookupCertExpiry('mbsdoc.com', json([{ name_value: 'mbsdoc.com', not_after: '2026-11-20T00:00:00' }]))).toBe('2026-11-20');
    expect(await lookupDomainExpiry('mbsdoc.com', json({ events: [{ eventAction: 'expiration', eventDate: '2027-03-01T00:00:00Z' }] }))).toBe('2027-03-01');
  });
  it('throws on a failed response so the caller keeps the stored date', async () => {
    await expect(lookupCertExpiry('x.com', json({}, 502))).rejects.toThrow('crtsh_502');
    await expect(lookupDomainExpiry('x.com', json({}, 404))).rejects.toThrow('rdap_404');
  });
});
```

Create `admin/tests/favicon.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { findIconHref, fetchFavicon } from '../src/lib/favicon.js';

describe('findIconHref', () => {
  it('prefers the apple touch icon, then any icon', () => {
    expect(findIconHref('<link rel="icon" href="/a.png"><link rel="apple-touch-icon" href="/big.png">')).toBe('/big.png');
    expect(findIconHref("<link href='/s.ico' rel='shortcut icon'>")).toBe('/s.ico');
    expect(findIconHref('<link rel="stylesheet" href="/x.css">')).toBeNull();
  });
});

describe('fetchFavicon', () => {
  const png = new Uint8Array([137, 80, 78, 71]);
  it('follows the page link to an image', async () => {
    const fetchImpl = async (url) => {
      if (url === 'https://site.test/') return new Response('<link rel="icon" href="/i.png">', { headers: { 'content-type': 'text/html' } });
      if (url === 'https://site.test/i.png') return new Response(png, { headers: { 'content-type': 'image/png' } });
      return new Response('', { status: 404 });
    };
    const icon = await fetchFavicon('https://site.test/', fetchImpl);
    expect(icon.contentType).toBe('image/png');
    expect(icon.bytes.byteLength).toBe(4);
  });
  it('falls back to /favicon.ico and refuses non-images', async () => {
    const fetchImpl = async (url) => (url.endsWith('/favicon.ico')
      ? new Response('<html>', { headers: { 'content-type': 'text/html' } })
      : new Response('<p>no links</p>', { headers: { 'content-type': 'text/html' } }));
    expect(await fetchFavicon('https://site.test/', fetchImpl)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `node node_modules/vitest/vitest.mjs run tests/expiry.test.js tests/favicon.test.js`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Implement**

Create `admin/src/lib/expiry.js`:

```js
// Certificate and domain expiry. A Worker's fetch cannot see the peer
// certificate, so the certificate date comes from public certificate
// transparency logs (crt.sh), and the domain date from RDAP, WHOIS's successor.
// Lookups throw on failure; the checker catches and keeps the stored date, so a
// flaky lookup never turns a site red.

const PLATFORM_SUFFIXES = ['.pages.dev', '.workers.dev', '.netlify.app', '.github.io'];
const TIMEOUT_MS = 20000;

export const hostFromUrl = (url) => new URL(url).hostname.toLowerCase();

export function ownDomain(site) {
  if (site.domain) return site.domain;
  const host = hostFromUrl(site.live_url);
  if (PLATFORM_SUFFIXES.some((s) => host.endsWith(s))) return null;
  return host.replace(/^www\./, '').split('.').slice(-2).join('.');
}

function covers(name, host) {
  const n = name.trim().toLowerCase();
  if (n === host) return true;
  if (!n.startsWith('*.')) return false;
  const rest = n.slice(2);
  return host.endsWith(`.${rest}`) && host.split('.').length === rest.split('.').length + 1;
}

export function parseCrtSh(entries, host) {
  let best = null;
  for (const e of entries ?? []) {
    const names = String(e.name_value ?? '').split('\n');
    if (!names.some((n) => covers(n, host))) continue;
    const day = String(e.not_after ?? '').slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && (!best || day > best)) best = day;
  }
  return best;
}

export function parseRdap(json) {
  const event = (json?.events ?? []).find((e) => e.eventAction === 'expiration');
  return event ? String(event.eventDate).slice(0, 10) : null;
}

export async function lookupCertExpiry(host, fetchImpl = fetch) {
  const res = await fetchImpl(`https://crt.sh/?q=${encodeURIComponent(host)}&output=json&exclude=expired`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`crtsh_${res.status}`);
  return parseCrtSh(await res.json(), host);
}

export async function lookupDomainExpiry(domain, fetchImpl = fetch) {
  const res = await fetchImpl(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
    headers: { Accept: 'application/rdap+json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`rdap_${res.status}`);
  return parseRdap(await res.json());
}
```

Create `admin/src/lib/favicon.js`:

```js
// The fallback logo: the site's own icon, found once by the checker and cached
// in R2. Prefers the apple touch icon because it is usually 180px, not 16px.

const MAX_BYTES = 1024 * 1024;
const TIMEOUT_MS = 10000;

export function findIconHref(html) {
  const ranked = [];
  for (const tag of String(html).match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1] ?? '').toLowerCase();
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    if (rel.includes('apple-touch-icon')) ranked.push([0, href]);
    else if (rel.split(/\s+/).includes('icon')) ranked.push([1, href]);
  }
  ranked.sort((a, b) => a[0] - b[0]);
  return ranked[0]?.[1] ?? null;
}

export async function fetchFavicon(liveUrl, fetchImpl = fetch) {
  let href = '/favicon.ico';
  try {
    const page = await fetchImpl(liveUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (page.ok) href = findIconHref(await page.text()) ?? href;
  } catch {
    // Fall through to /favicon.ico.
  }
  const res = await fetchImpl(new URL(href, liveUrl).toString(), { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) return null;
  const contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim();
  if (!contentType.startsWith('image/')) return null;
  const bytes = await res.arrayBuffer();
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return null;
  return { bytes, contentType };
}
```

- [ ] **Step 4: Run the tests**

Run: `node node_modules/vitest/vitest.mjs run tests/expiry.test.js tests/favicon.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/expiry.js src/lib/favicon.js tests/expiry.test.js tests/favicon.test.js
git commit -m "Sites: certificate and domain expiry, and the fallback icon

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: GitHub open work

**Files:**
- Create: `admin/src/lib/github.js`
- Test: `admin/tests/github.test.js`

**Interfaces:**
- Produces: `fetchOpenWork(repo, token, fetchImpl) -> Array<{github_key, text, url}>` where keys are `pr:<number>` and `branch:<name>`; `reconcileGithub(existing, fetched) -> {inserts, updates, closes}` matching `applyGithubPlan` (Task 3). `existing` is every GitHub item for the site, done or not.

- [ ] **Step 1: Write the failing tests**

Create `admin/tests/github.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { fetchOpenWork, reconcileGithub } from '../src/lib/github.js';

function fakeGitHub() {
  const calls = [];
  const routes = {
    '/repos/o/r': { default_branch: 'main' },
    '/repos/o/r/pulls?state=open&per_page=100': [{ number: 7, title: 'Credit link', html_url: 'https://github.com/o/r/pull/7', head: { ref: 'credit' } }],
    '/repos/o/r/branches?per_page=100': [{ name: 'main' }, { name: 'credit' }, { name: 'site-fixes' }, { name: 'feature/old' }],
    '/repos/o/r/compare/main...site-fixes': { ahead_by: 2 },
    '/repos/o/r/compare/main...feature/old': { ahead_by: 0 },
  };
  const fetchImpl = async (url, init) => {
    const path = url.replace('https://api.github.com', '');
    calls.push({ path, auth: init.headers.Authorization, ua: init.headers['User-Agent'] });
    if (!(path in routes)) return new Response('{}', { status: 404 });
    return new Response(JSON.stringify(routes[path]), { status: 200 });
  };
  return { fetchImpl, calls };
}

describe('fetchOpenWork', () => {
  it('lists open pull requests and unmerged branches that have no pull request', async () => {
    const { fetchImpl, calls } = fakeGitHub();
    const items = await fetchOpenWork('o/r', 'tok', fetchImpl);
    expect(items).toEqual([
      { github_key: 'pr:7', text: 'Pull request #7: Credit link', url: 'https://github.com/o/r/pull/7' },
      { github_key: 'branch:site-fixes', text: 'Branch site-fixes: 2 commits not merged', url: 'https://github.com/o/r/tree/site-fixes' },
    ]);
    expect(calls.every((c) => c.auth === 'Bearer tok' && c.ua)).toBe(true);
  });

  it('throws when GitHub refuses', async () => {
    const fetchImpl = async () => new Response('{}', { status: 401 });
    await expect(fetchOpenWork('o/r', 'bad', fetchImpl)).rejects.toThrow('github_401');
  });
});

describe('reconcileGithub', () => {
  it('inserts new, updates changed or reopened, closes missing, leaves the rest', () => {
    const existing = [
      { id: 1, github_key: 'pr:7', text: 'Pull request #7: Credit link', url: 'u7', done_at: null },
      { id: 2, github_key: 'pr:8', text: 'Pull request #8: Old title', url: 'u8', done_at: null },
      { id: 3, github_key: 'branch:x', text: 'Branch x: 1 commit not merged', url: 'ux', done_at: '2026-09-01' },
      { id: 4, github_key: 'branch:gone', text: 'Branch gone', url: 'ug', done_at: null },
      { id: 5, github_key: 'branch:closed', text: 'Branch closed', url: 'uc', done_at: '2026-09-01' },
    ];
    const fetched = [
      { github_key: 'pr:7', text: 'Pull request #7: Credit link', url: 'u7' },
      { github_key: 'pr:8', text: 'Pull request #8: New title', url: 'u8' },
      { github_key: 'branch:x', text: 'Branch x: 1 commit not merged', url: 'ux' },
      { github_key: 'pr:9', text: 'Pull request #9: New', url: 'u9' },
    ];
    expect(reconcileGithub(existing, fetched)).toEqual({
      inserts: [{ github_key: 'pr:9', text: 'Pull request #9: New', url: 'u9' }],
      updates: [{ id: 2, text: 'Pull request #8: New title', url: 'u8' }, { id: 3, text: 'Branch x: 1 commit not merged', url: 'ux' }],
      closes: [4],
    });
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `node node_modules/vitest/vitest.mjs run tests/github.test.js`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Implement**

Create `admin/src/lib/github.js`:

```js
// Open work from GitHub: open pull requests, plus branches ahead of the default
// branch that have no pull request (a branch with a PR would be listed twice).
// Read-only; the token needs Metadata, Contents and Pull requests read access.
// reconcileGithub is pure so the checker's writes are decided in one testable place.

const API = 'https://api.github.com';

// Branch names can contain "/", which GitHub expects unencoded in compare paths.
const encodeRef = (ref) => ref.split('/').map(encodeURIComponent).join('/');

async function gh(path, token, fetchImpl) {
  const res = await fetchImpl(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'ka-sites-checker',
    },
  });
  if (!res.ok) throw new Error(`github_${res.status}`);
  return res.json();
}

export async function fetchOpenWork(repo, token, fetchImpl = fetch) {
  const [info, pulls, branches] = await Promise.all([
    gh(`/repos/${repo}`, token, fetchImpl),
    gh(`/repos/${repo}/pulls?state=open&per_page=100`, token, fetchImpl),
    gh(`/repos/${repo}/branches?per_page=100`, token, fetchImpl),
  ]);

  const items = pulls.map((p) => ({
    github_key: `pr:${p.number}`,
    text: `Pull request #${p.number}: ${p.title}`,
    url: p.html_url,
  }));

  const prHeads = new Set(pulls.map((p) => p.head?.ref));
  for (const branch of branches) {
    if (branch.name === info.default_branch || prHeads.has(branch.name)) continue;
    const cmp = await gh(`/repos/${repo}/compare/${encodeRef(info.default_branch)}...${encodeRef(branch.name)}`, token, fetchImpl);
    if (cmp.ahead_by > 0) {
      items.push({
        github_key: `branch:${branch.name}`,
        text: `Branch ${branch.name}: ${cmp.ahead_by} ${cmp.ahead_by === 1 ? 'commit' : 'commits'} not merged`,
        url: `https://github.com/${repo}/tree/${encodeRef(branch.name)}`,
      });
    }
  }
  return items;
}

export function reconcileGithub(existing, fetched) {
  const byKey = new Map(existing.map((e) => [e.github_key, e]));
  const seen = new Set();
  const inserts = [];
  const updates = [];
  for (const f of fetched) {
    seen.add(f.github_key);
    const e = byKey.get(f.github_key);
    if (!e) inserts.push(f);
    else if (e.done_at || e.text !== f.text || e.url !== f.url) updates.push({ id: e.id, text: f.text, url: f.url });
  }
  const closes = existing.filter((e) => !e.done_at && !seen.has(e.github_key)).map((e) => e.id);
  return { inserts, updates, closes };
}
```

- [ ] **Step 4: Run the tests**

Run: `node node_modules/vitest/vitest.mjs run tests/github.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/github.js tests/github.test.js
git commit -m "Sites: open pull requests and unmerged branches from GitHub

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Alerts

**Files:**
- Create: `admin/src/lib/alerts.js`
- Test: `admin/tests/alerts.test.js`

**Interfaces:**
- Produces: `decideAlert(lastAlertLevel, level) -> 'down' | 'recovered' | null`; `alertEmail(kind, site, reason, adminUrl) -> {subject, text}`; `sendEmail({apiKey, from, to, subject, text}, fetchImpl)` (throws `resend_<status>` on failure).

- [ ] **Step 1: Write the failing tests**

Create `admin/tests/alerts.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { decideAlert, alertEmail, sendEmail } from '../src/lib/alerts.js';

describe('decideAlert', () => {
  it('fires once on turning red and once on getting back to green', () => {
    expect(decideAlert(null, 'red')).toBe('down');
    expect(decideAlert('green', 'red')).toBe('down');
    expect(decideAlert('red', 'red')).toBeNull();
    expect(decideAlert('red', 'amber')).toBeNull();
    expect(decideAlert('red', 'gray')).toBeNull();
    expect(decideAlert('red', 'green')).toBe('recovered');
    expect(decideAlert(null, 'green')).toBeNull();
    expect(decideAlert('green', 'amber')).toBeNull();
  });
});

describe('alertEmail', () => {
  const site = { name: 'MBS Medicine', slug: 'mbs-medicine', live_url: 'https://mbsdoc.com' };
  it('says what is wrong and links to the dashboard', () => {
    const m = alertEmail('down', site, 'Down since 2:05 PM', 'https://admin.ka-performancefl.com');
    expect(m.subject).toBe('MBS Medicine is red: Down since 2:05 PM');
    expect(m.text).toContain('https://admin.ka-performancefl.com/sites/mbs-medicine');
    expect(m.text).not.toContain('\u2014');
  });
  it('says when it is back', () => {
    expect(alertEmail('recovered', site, 'Up', 'https://a').subject).toBe('MBS Medicine is back to green');
  });
});

describe('sendEmail', () => {
  it('posts to Resend and throws on failure', async () => {
    let sent;
    const ok = async (url, init) => { sent = { url, init }; return new Response('{}', { status: 200 }); };
    await sendEmail({ apiKey: 'k', from: 'f@x', to: 't@x', subject: 's', text: 'b' }, ok);
    expect(sent.url).toBe('https://api.resend.com/emails');
    expect(sent.init.headers.Authorization).toBe('Bearer k');
    expect(JSON.parse(sent.init.body)).toEqual({ from: 'f@x', to: ['t@x'], subject: 's', text: 'b' });
    await expect(sendEmail({ apiKey: 'k', from: 'f', to: 't', subject: 's', text: 'b' }, async () => new Response('{}', { status: 422 })))
      .rejects.toThrow('resend_422');
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `node node_modules/vitest/vitest.mjs run tests/alerts.test.js`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Implement**

Create `admin/src/lib/alerts.js`:

```js
// Red and recovery emails. One email when a site turns red, one when it gets
// back to green, nothing in between: amber or gray after red does not count as
// recovered, so a flapping site cannot fill the inbox.
// Sent through Resend, which already sends mail for ka-performancefl.com.

export function decideAlert(lastAlertLevel, level) {
  if (level === 'red' && lastAlertLevel !== 'red') return 'down';
  if (level === 'green' && lastAlertLevel === 'red') return 'recovered';
  return null;
}

export function alertEmail(kind, site, reason, adminUrl) {
  const link = `${adminUrl}/sites/${site.slug}`;
  if (kind === 'down') {
    return {
      subject: `${site.name} is red: ${reason}`,
      text: `${site.name} turned red.\n\nReason: ${reason}\nLive site: ${site.live_url}\nDashboard: ${link}\n\nYou will get one more email when it is back to green.`,
    };
  }
  return {
    subject: `${site.name} is back to green`,
    text: `${site.name} is back to green.\n\nLive site: ${site.live_url}\nDashboard: ${link}`,
  };
}

export async function sendEmail({ apiKey, from, to, subject, text }, fetchImpl = fetch) {
  const res = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!res.ok) throw new Error(`resend_${res.status}`);
}
```

- [ ] **Step 4: Run the tests**

Run: `node node_modules/vitest/vitest.mjs run tests/alerts.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/alerts.js tests/alerts.test.js
git commit -m "Sites: one email on red, one on recovery

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: The checker Worker

**Files:**
- Create: `admin/checker/index.js`, `admin/checker/wrangler.jsonc`
- Test: `admin/tests/checker.test.js`

**Interfaces:**
- Consumes: everything from Tasks 2, 3, 6, 7, 8.
- Produces: `checkUptime(site, fetchImpl, nowFn) -> {ok, http_status, ms, error}`; `runChecker({env, nowMs, fetchImpl, log}) -> {checked, errors: string[]}`; default export `{ scheduled(event, env, ctx) }`. `env` has `DB`, optional `LOGOS` (R2), `GITHUB_TOKEN`, `RESEND_API_KEY`, `ALERT_FROM`, `ALERT_TO`, `ADMIN_URL`.
- Schedule inside one `*/15 * * * *` cron: uptime every run; GitHub when the UTC minute is under 15; expiry, favicons and pruning when the UTC hour is 10 and the minute is under 15; alerts after everything, every run.

- [ ] **Step 1: Write the failing tests**

Create `admin/tests/checker.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import * as q from '../src/lib/db.js';
import { runChecker, checkUptime } from '../checker/index.js';

const quiet = { error() {}, warn() {}, log() {} };
const T0 = Date.parse('2026-09-23T14:15:00Z'); // not a GitHub or daily run
let env;
let sent;

function net(overrides = {}) {
  return async (url, init = {}) => {
    for (const [prefix, fn] of Object.entries(overrides)) if (url.startsWith(prefix)) return fn(url, init);
    if (url === 'https://api.resend.com/emails') {
      sent.push(JSON.parse(init.body));
      return new Response('{}', { status: 200 });
    }
    return new Response('ok', { status: 200 });
  };
}

beforeEach(async () => {
  sent = [];
  env = { DB: makeD1(), RESEND_API_KEY: 'k', ALERT_FROM: 'alerts@x', ALERT_TO: 'alex@x', ADMIN_URL: 'https://admin.test' };
  await q.createSite(env.DB, { slug: 'a', name: 'A', live_url: 'https://a.test/', hosting: 'pages' }, 't');
});

describe('checkUptime', () => {
  it('counts 2xx and 3xx as up and records a timeout as an error', async () => {
    let t = 0;
    const now = () => (t += 250);
    expect(await checkUptime({ live_url: 'https://a.test/' }, async () => new Response('', { status: 301 }), now))
      .toMatchObject({ ok: true, http_status: 301, ms: 250 });
    const timeout = async () => { const e = new Error('t'); e.name = 'TimeoutError'; throw e; };
    expect(await checkUptime({ live_url: 'https://a.test/' }, timeout, now)).toEqual({ ok: false, http_status: null, ms: null, error: 'timeout' });
  });
});

describe('runChecker', () => {
  it('records a check per site and sets alert state', async () => {
    await runChecker({ env, nowMs: T0, fetchImpl: net(), log: quiet });
    expect(await q.checksSince(env.DB, 1, '2000-01-01')).toHaveLength(1);
    expect((await q.allAlertStates(env.DB)).get(1)).toMatchObject({ level: 'green' });
    expect(sent).toHaveLength(0);
  });

  it('emails once when a site goes red and once when it recovers', async () => {
    const down = net({ 'https://a.test/': async () => new Response('', { status: 503 }) });
    await runChecker({ env, nowMs: T0, fetchImpl: down, log: quiet });
    expect(sent).toHaveLength(0); // one failure is amber
    await runChecker({ env, nowMs: T0 + 15 * 60000, fetchImpl: down, log: quiet });
    expect(sent.map((m) => m.subject)).toEqual(['A is red: Down since 10:15 AM']);
    await runChecker({ env, nowMs: T0 + 30 * 60000, fetchImpl: down, log: quiet });
    expect(sent).toHaveLength(1);
    await runChecker({ env, nowMs: T0 + 45 * 60000, fetchImpl: net(), log: quiet });
    expect(sent.map((m) => m.subject)).toEqual(['A is red: Down since 10:15 AM', 'A is back to green']);
  });

  it('retries a failed alert send on the next run', async () => {
    const down = (resendStatus) => net({
      'https://a.test/': async () => new Response('', { status: 503 }),
      'https://api.resend.com/': async (url, init) => { sent.push(JSON.parse(init.body)); return new Response('{}', { status: resendStatus }); },
    });
    await runChecker({ env, nowMs: T0, fetchImpl: down(200), log: quiet });
    await runChecker({ env, nowMs: T0 + 15 * 60000, fetchImpl: down(500), log: quiet });
    expect((await q.allAlertStates(env.DB)).get(1).last_alert_level).toBeNull();
    await runChecker({ env, nowMs: T0 + 30 * 60000, fetchImpl: down(200), log: quiet });
    expect((await q.allAlertStates(env.DB)).get(1).last_alert_level).toBe('red');
  });

  it('syncs GitHub on the hourly run only, and skips without a token', async () => {
    await q.updateSite(env.DB, 1, { slug: 'a', name: 'A', live_url: 'https://a.test/', hosting: 'pages', repo: 'o/r' }, 't');
    let githubCalls = 0;
    const gh = net({
      'https://api.github.com/': async (url) => {
        githubCalls += 1;
        if (url.endsWith('/repos/o/r')) return new Response(JSON.stringify({ default_branch: 'main' }));
        if (url.includes('/pulls')) return new Response(JSON.stringify([{ number: 3, title: 'T', html_url: 'u', head: { ref: 'x' } }]));
        return new Response('[]');
      },
    });
    await runChecker({ env: { ...env, GITHUB_TOKEN: 'tok' }, nowMs: T0, fetchImpl: gh, log: quiet });
    expect(githubCalls).toBe(0);
    const onTheHour = Date.parse('2026-09-23T15:00:00Z');
    await runChecker({ env, nowMs: onTheHour, fetchImpl: gh, log: quiet });
    expect(githubCalls).toBe(0);
    await runChecker({ env: { ...env, GITHUB_TOKEN: 'tok' }, nowMs: onTheHour, fetchImpl: gh, log: quiet });
    expect((await q.listGithubItems(env.DB, 1)).map((i) => i.github_key)).toEqual(['pr:3']);
    expect((await q.getSiteBySlug(env.DB, 'a')).github_synced_at).toBe('2026-09-23T15:00:00.000Z');
  });

  it('refreshes expiry daily and keeps the stored date when a lookup fails', async () => {
    const daily = Date.parse('2026-09-23T10:00:00Z');
    const lookups = net({
      'https://crt.sh/': async () => new Response(JSON.stringify([{ name_value: 'a.test', not_after: '2026-12-01T00:00:00' }])),
      'https://rdap.org/': async () => new Response(JSON.stringify({ events: [{ eventAction: 'expiration', eventDate: '2027-01-01T00:00:00Z' }] })),
    });
    await runChecker({ env, nowMs: daily, fetchImpl: lookups, log: quiet });
    expect(await q.getSiteBySlug(env.DB, 'a')).toMatchObject({ cert_expires_on: '2026-12-01', domain_expires_on: '2027-01-01' });
    const broken = net({ 'https://crt.sh/': async () => new Response('', { status: 502 }), 'https://rdap.org/': async () => new Response('', { status: 502 }) });
    const result = await runChecker({ env, nowMs: daily + 86400000, fetchImpl: broken, log: quiet });
    expect(await q.getSiteBySlug(env.DB, 'a')).toMatchObject({ cert_expires_on: '2026-12-01', domain_expires_on: '2027-01-01' });
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('prunes checks older than 30 days on the daily run', async () => {
    await q.insertCheck(env.DB, { site_id: 1, checked_at: '2026-08-01T00:00:00Z', ok: 1, http_status: 200, ms: 1, error: null });
    await runChecker({ env, nowMs: Date.parse('2026-09-23T10:00:00Z'), fetchImpl: net(), log: quiet });
    expect((await q.checksSince(env.DB, 1, '2000-01-01')).map((c) => c.checked_at)).toEqual(['2026-09-23T10:00:00.000Z']);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `node node_modules/vitest/vitest.mjs run tests/checker.test.js`
Expected: FAIL, cannot find module `../checker/index.js`.

- [ ] **Step 3: Implement**

Create `admin/checker/index.js`:

```js
// ka-sites-checker: every network check the dashboard shows, on one cron.
//
// A separate Worker from ka-admin because the Astro adapter generates that
// Worker's entry point; a scheduled handler bolted onto generated code breaks
// between adapter versions. It imports the same lib modules, so the light it
// alerts on is the light the dashboard shows.
//
// One cron, every 15 minutes. Inside a run: uptime always; GitHub on the run
// at minute 0; expiry, favicons and pruning once a day at 10:00 UTC; alert
// evaluation last, every run. Every job is isolated: one failure is logged and
// the rest carry on, and a job that never succeeds leaves stored values to age
// into gray rather than pretending to be green.
import * as q from '../src/lib/db.js';
import { computeLevel } from '../src/lib/health.js';
import { decideAlert, alertEmail, sendEmail } from '../src/lib/alerts.js';
import { fetchOpenWork, reconcileGithub } from '../src/lib/github.js';
import { hostFromUrl, ownDomain, lookupCertExpiry, lookupDomainExpiry } from '../src/lib/expiry.js';
import { fetchFavicon } from '../src/lib/favicon.js';

const UPTIME_TIMEOUT_MS = 10000;
const KEEP_CHECKS_MS = 30 * 86400000;
const CHECKS_FOR_LEVEL = 12;

export async function checkUptime(site, fetchImpl = fetch, nowFn = Date.now) {
  const started = nowFn();
  try {
    const res = await fetchImpl(site.live_url, {
      redirect: 'follow',
      cache: 'no-store',
      headers: { 'User-Agent': 'K&A sites checker (+https://ka-performancefl.com)' },
      signal: AbortSignal.timeout(UPTIME_TIMEOUT_MS),
    });
    const ms = nowFn() - started;
    await res.body?.cancel();
    return { ok: res.status >= 200 && res.status < 400, http_status: res.status, ms, error: null };
  } catch (err) {
    const error = err?.name === 'TimeoutError' ? 'timeout' : String(err?.message ?? err).slice(0, 200);
    return { ok: false, http_status: null, ms: null, error };
  }
}

export async function runChecker({ env, nowMs = Date.now(), fetchImpl = fetch, log = console }) {
  const DB = env.DB;
  const nowIso = new Date(nowMs).toISOString();
  const when = new Date(nowMs);
  const errors = [];
  const note = (job, err) => {
    const message = `${job}: ${err?.message ?? err}`;
    errors.push(message);
    log.error(message);
  };

  const sites = await q.listSites(DB);

  const uptime = await Promise.allSettled(sites.map(async (site) => {
    const result = await checkUptime(site, fetchImpl);
    await q.insertCheck(DB, { site_id: site.id, checked_at: nowIso, ...result });
  }));
  uptime.forEach((r, i) => { if (r.status === 'rejected') note(`uptime ${sites[i].slug}`, r.reason); });

  if (when.getUTCMinutes() < 15) {
    if (!env.GITHUB_TOKEN) log.warn('github: no GITHUB_TOKEN, skipped');
    else {
      for (const site of sites.filter((s) => s.repo)) {
        try {
          const fetched = await fetchOpenWork(site.repo, env.GITHUB_TOKEN, fetchImpl);
          const plan = reconcileGithub(await q.listGithubItems(DB, site.id), fetched);
          await q.applyGithubPlan(DB, site.id, plan, nowIso);
          await q.setGithubSynced(DB, site.id, nowIso);
        } catch (err) {
          note(`github ${site.slug}`, err);
        }
      }
    }
  }

  if (when.getUTCHours() === 10 && when.getUTCMinutes() < 15) {
    for (const site of sites) {
      try {
        const cert = await lookupCertExpiry(hostFromUrl(site.live_url), fetchImpl);
        if (cert) await q.setSiteExpiry(DB, site.id, { cert_expires_on: cert }, nowIso);
      } catch (err) {
        note(`cert ${site.slug}`, err);
      }
      const domain = ownDomain(site);
      if (domain) {
        try {
          const expires = await lookupDomainExpiry(domain, fetchImpl);
          if (expires) await q.setSiteExpiry(DB, site.id, { domain_expires_on: expires }, nowIso);
        } catch (err) {
          note(`domain ${site.slug}`, err);
        }
      }
      if (env.LOGOS && !site.logo_key && !site.favicon_key) {
        try {
          const icon = await fetchFavicon(site.live_url, fetchImpl);
          if (icon) {
            const key = `favicons/${site.slug}`;
            await env.LOGOS.put(key, icon.bytes, { httpMetadata: { contentType: icon.contentType } });
            await q.setSiteFavicon(DB, site.id, key, nowIso);
          }
        } catch (err) {
          note(`favicon ${site.slug}`, err);
        }
      }
    }
    try {
      await q.pruneChecks(DB, new Date(nowMs - KEEP_CHECKS_MS).toISOString());
    } catch (err) {
      note('prune', err);
    }
  }

  try {
    const fresh = await q.listSites(DB);
    const checksBySite = await q.latestChecksForAll(DB, CHECKS_FOR_LEVEL);
    const states = await q.allAlertStates(DB);
    for (const site of fresh) {
      const { level, reason } = computeLevel(site, checksBySite.get(site.id) ?? [], nowMs);
      const prev = states.get(site.id);
      let lastAlertLevel = prev?.last_alert_level ?? null;
      let lastAlertAt = prev?.last_alert_at ?? null;
      const kind = decideAlert(lastAlertLevel, level);
      if (kind && env.RESEND_API_KEY) {
        try {
          const mail = alertEmail(kind, site, reason, env.ADMIN_URL);
          await sendEmail({ apiKey: env.RESEND_API_KEY, from: env.ALERT_FROM, to: env.ALERT_TO, ...mail }, fetchImpl);
          lastAlertLevel = level;
          lastAlertAt = nowIso;
        } catch (err) {
          note(`alert ${site.slug}`, err);
        }
      }
      await q.upsertAlertState(DB, {
        site_id: site.id,
        level,
        since: prev && prev.level === level ? prev.since : nowIso,
        last_alert_level: lastAlertLevel,
        last_alert_at: lastAlertAt,
      });
    }
  } catch (err) {
    note('alerts', err);
  }

  return { checked: sites.length, errors };
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runChecker({ env, nowMs: event.scheduledTime }));
  },
};
```

Create `admin/checker/wrangler.jsonc`:

```jsonc
{
  "$schema": "../node_modules/wrangler/config-schema.json",
  "name": "ka-sites-checker",
  "main": "./index.js",
  "compatibility_date": "2026-08-13",
  "triggers": {
    "crons": ["*/15 * * * *"]
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "ka-sites",
      // Same id as ../wrangler.jsonc, filled in at deploy (Task 16).
      "database_id": "00000000-0000-0000-0000-000000000000",
      "migrations_dir": "../migrations"
    }
  ],
  "r2_buckets": [
    { "binding": "LOGOS", "bucket_name": "ka-sites-logos" }
  ],
  // GITHUB_TOKEN and RESEND_API_KEY are secrets, set at deploy with
  // `secret bulk` from a BOM-free JSON file, never pasted into a terminal.
  "vars": {
    "ALERT_TO": "alex@ka-performancefl.com",
    "ALERT_FROM": "K & A sites <alerts@ka-performancefl.com>",
    "ADMIN_URL": "https://admin.ka-performancefl.com"
  },
  "observability": { "enabled": true },
  // No fetch handler and nothing to serve; the cron is the only way in.
  "workers_dev": false
}
```

- [ ] **Step 4: Run all tests**

Run: `node node_modules/vitest/vitest.mjs run`
Expected: PASS, every file.

- [ ] **Step 5: Confirm the checker bundles**

Run: `node node_modules/wrangler/bin/wrangler.js deploy --dry-run --outdir "$TEMP/checker-dry" -c checker/wrangler.jsonc`
Expected: "--dry-run: exiting now." with no build errors. (A dry run uploads nothing.)

- [ ] **Step 6: Commit**

```bash
git add checker tests/checker.test.js
git commit -m "Sites: the checker Worker, uptime, GitHub, expiry, icons and alerts on one cron

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: View helpers

**Files:**
- Create: `admin/src/lib/sparkline.js`, `admin/src/lib/view.js`, `admin/src/lib/logo.js`
- Test: `admin/tests/view.test.js`

**Interfaces:**
- Produces (`sparkline.js`): `uptimePercent(checks) -> number | null` (one decimal), `hourlyAverages(checks) -> number[]` (oldest first, ignores null `ms`), `sparklinePath(values, width, height) -> string | null` (`null` under two points).
- Produces (`view.js`): `logoSrc(site) -> "/logos/<key>" | null` (upload beats favicon), `initials(name) -> "MM"`, `buildCards(sites, checksBySite, openCounts, nowMs) -> Card[]` where `Card = {site, level, reason, openWork}` sorted by `LEVEL_RANK` then name, and `filterCards(cards, show) -> Card[]` where `show` is `'all'`, `'problems'` (level is not green) or a `PROJECT_STATUS` value.
- Produces (`logo.js`): `storeLogo(bucket, slug, file, ext) -> key` (key `logos/<slug>-<8 hex of SHA-256>.<ext>`).

- [ ] **Step 1: Write the failing tests**

Create `admin/tests/view.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { uptimePercent, hourlyAverages, sparklinePath } from '../src/lib/sparkline.js';
import { logoSrc, initials, buildCards, filterCards } from '../src/lib/view.js';
import { storeLogo } from '../src/lib/logo.js';

describe('sparkline helpers', () => {
  it('computes uptime to one decimal', () => {
    expect(uptimePercent([])).toBeNull();
    expect(uptimePercent([{ ok: 1 }, { ok: 1 }, { ok: 0 }])).toBe(66.7);
  });
  it('averages response time by hour, oldest first', () => {
    const checks = [
      { checked_at: '2026-09-23T11:45:00Z', ms: 300 },
      { checked_at: '2026-09-23T11:00:00Z', ms: 100 },
      { checked_at: '2026-09-23T10:30:00Z', ms: 50 },
      { checked_at: '2026-09-23T10:15:00Z', ms: null },
    ];
    expect(hourlyAverages(checks)).toEqual([50, 200]);
  });
  it('draws a path scaled to the box', () => {
    expect(sparklinePath([1], 100, 20)).toBeNull();
    expect(sparklinePath([0, 10], 100, 20)).toBe('M0.0,20.0 L100.0,0.0');
  });
});

describe('view helpers', () => {
  it('prefers the uploaded logo, then the favicon', () => {
    expect(logoSrc({ logo_key: 'logos/a.png', favicon_key: 'favicons/a' })).toBe('/logos/logos/a.png');
    expect(logoSrc({ logo_key: null, favicon_key: 'favicons/a' })).toBe('/logos/favicons/a');
    expect(logoSrc({ logo_key: null, favicon_key: null })).toBeNull();
  });
  it('makes initials', () => {
    expect(initials('MBS Medicine')).toBe('MM');
    expect(initials("David's BBQ")).toBe('DB');
    expect(initials('Synovial')).toBe('S');
  });

  const NOW = Date.parse('2026-09-23T18:00:00Z');
  const fresh = new Date(NOW - 5 * 60000).toISOString();
  const s = (id, name, project_status = 'live') => ({ id, name, project_status, cert_expires_on: null, domain_expires_on: null });
  const sites = [s(1, 'Zed'), s(2, 'Alpha'), s(3, 'Mid', 'paused'), s(4, 'Beta')];
  const checks = new Map([
    [1, [{ checked_at: fresh, ok: 0 }, { checked_at: fresh, ok: 0 }]],
    [2, [{ checked_at: fresh, ok: 1, ms: 100 }]],
    [3, [{ checked_at: fresh, ok: 0 }]],
  ]);
  const cards = buildCards(sites, checks, new Map([[2, 3]]), NOW);

  it('sorts worst first, then by name, with open work counts', () => {
    expect(cards.map((c) => [c.site.name, c.level, c.openWork])).toEqual([
      ['Zed', 'red', 0], ['Mid', 'amber', 0], ['Beta', 'gray', 0], ['Alpha', 'green', 3],
    ]);
  });
  it('filters by problems or a project status', () => {
    expect(filterCards(cards, 'all')).toHaveLength(4);
    expect(filterCards(cards, 'problems').map((c) => c.site.name)).toEqual(['Zed', 'Mid', 'Beta']);
    expect(filterCards(cards, 'paused').map((c) => c.site.name)).toEqual(['Mid']);
    expect(filterCards(cards, 'nonsense')).toHaveLength(4);
  });
});

describe('storeLogo', () => {
  it('names the object by slug and content hash and keeps the type', async () => {
    const put = [];
    const bucket = { async put(key, body, opts) { put.push({ key, opts }); } };
    const file = new File([new TextEncoder().encode('logo')], 'a.png', { type: 'image/png' });
    const key = await storeLogo(bucket, 'mbs-medicine', file, 'png');
    expect(key).toMatch(/^logos\/mbs-medicine-[0-9a-f]{8}\.png$/);
    expect(put[0].opts.httpMetadata.contentType).toBe('image/png');
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `node node_modules/vitest/vitest.mjs run tests/view.test.js`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Implement**

Create `admin/src/lib/sparkline.js`:

```js
// Health history for the site page: 30 days of 15-minute checks is 2,880
// points, so the sparkline plots hourly averages instead.

export function uptimePercent(checks) {
  if (!checks.length) return null;
  const up = checks.filter((c) => c.ok).length;
  return Math.round((up / checks.length) * 1000) / 10;
}

export function hourlyAverages(checks) {
  const buckets = new Map();
  for (const c of checks) {
    if (c.ms == null) continue;
    const hour = c.checked_at.slice(0, 13);
    const b = buckets.get(hour) ?? [0, 0];
    b[0] += c.ms;
    b[1] += 1;
    buckets.set(hour, b);
  }
  return [...buckets.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, b]) => b[0] / b[1]);
}

export function sparklinePath(values, width, height) {
  const pts = values.filter(Number.isFinite);
  if (pts.length < 2) return null;
  const min = Math.min(...pts);
  const span = Math.max(...pts) - min || 1;
  const step = width / (pts.length - 1);
  return pts
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(height - ((v - min) / span) * height).toFixed(1)}`)
    .join(' ');
}
```

Create `admin/src/lib/view.js`:

```js
// Shaping stored rows for the screens. No Astro here, so it is unit-tested.
import { computeLevel, LEVEL_RANK } from './health.js';
import { PROJECT_STATUS } from './enums.js';

export function logoSrc(site) {
  const key = site.logo_key || site.favicon_key;
  return key ? `/logos/${key}` : null;
}

export function initials(name) {
  return String(name)
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z0-9]/g, '')[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function buildCards(sites, checksBySite, openCounts, nowMs) {
  return sites
    .map((site) => ({
      site,
      ...computeLevel(site, checksBySite.get(site.id) ?? [], nowMs),
      openWork: openCounts.get(site.id) ?? 0,
    }))
    .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || a.site.name.localeCompare(b.site.name));
}

export function filterCards(cards, show) {
  if (show === 'problems') return cards.filter((c) => c.level !== 'green');
  if (PROJECT_STATUS.includes(show)) return cards.filter((c) => c.site.project_status === show);
  return cards;
}
```

Create `admin/src/lib/logo.js`:

```js
// Uploaded logos live in R2 under a content-hashed key, so replacing a logo
// never serves a stale cached copy under the old name.

export async function storeLogo(bucket, slug, file, ext) {
  const bytes = await file.arrayBuffer();
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const hash = [...digest.slice(0, 4)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const key = `logos/${slug}-${hash}.${ext}`;
  await bucket.put(key, bytes, { httpMetadata: { contentType: file.type } });
  return key;
}
```

- [ ] **Step 4: Run all tests**

Run: `node node_modules/vitest/vitest.mjs run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sparkline.js src/lib/view.js src/lib/logo.js tests/view.test.js
git commit -m "Sites: cards sorted worst first, history helpers, logo storage

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Shell, styles and the dashboard

**Files:**
- Rewrite: `admin/src/layouts/Shell.astro`, `admin/src/styles/admin.css`
- Create: `admin/src/components/LevelDot.astro`, `admin/src/components/SiteLogo.astro`, `admin/src/components/SiteCard.astro`, `admin/src/pages/index.astro`, `admin/src/pages/logos/[...key].js`, `admin/.dev.vars` (not committed; it is gitignored)

**Interfaces:**
- Consumes: `listSites`, `latestChecksForAll`, `openWorkCounts` (Task 3); `buildCards`, `filterCards`, `logoSrc`, `initials` (Task 10); `STATUS_LABEL`, `LEVEL_LABEL`, `PROJECT_STATUS` (Task 2).
- Produces: `Shell` props `{title, active: 'sites' | 'new'}`; `LevelDot` props `{level, reason}`; `SiteLogo` props `{site, size: 'sm' | 'lg'}`; `SiteCard` props `{card}`.

- [ ] **Step 1: Write the styles**

Replace `admin/src/styles/admin.css` with:

```css
/* K & A sites. House rules: no pill or chip UI (status is small-caps text
   beside a dot, and the dot always has a text label), no em dashes in copy,
   amber never as text on light, contrast measured to AA. */

@font-face {
  font-family: "Atkinson Hyperlegible Next";
  src: url("/fonts/AtkinsonNext-VF.woff2") format("woff2-variations");
  font-weight: 200 800;
  font-display: swap;
}
@font-face {
  font-family: "Schibsted Grotesk";
  src: url("/fonts/Schibsted-VF.woff2") format("woff2-variations");
  font-weight: 400 900;
  font-display: swap;
}

:root {
  --canvas: #F8F5F2;
  --surface: #FFFDF9;
  --ink: #221C15;
  --muted: #6C635A;
  --accent: #9A3412;
  --accent-hot: #7C2D12;
  --line: rgba(34, 28, 21, .11);
  --line-strong: rgba(34, 28, 21, .20);
  /* Dot colors: each is at least 3:1 against --surface (non-text contrast),
     and every dot sits beside a text label. */
  --red: #B91C1C;
  --amber: #B45309;
  --green: #15803D;
  --gray: #6C635A;
  --error: #9F1239;
  --font-display: "Schibsted Grotesk", system-ui, sans-serif;
  --font-body: "Atkinson Hyperlegible Next", system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--canvas); color: var(--ink); font: 16px/1.5 var(--font-body); }
a { color: var(--accent); }
a:hover { color: var(--accent-hot); }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }

.skip { position: absolute; left: -9999px; }
.skip:focus { left: 16px; top: 16px; background: var(--surface); padding: 8px 12px; z-index: 10; }

.top { display: flex; align-items: center; gap: 24px; padding: 16px 24px; border-bottom: 1px solid var(--line); background: var(--surface); }
.brand { font: 800 18px/1 var(--font-display); color: var(--ink); text-decoration: none; }
.brand em { font-style: normal; color: var(--accent); }
.top nav { display: flex; gap: 16px; }
.top nav a { color: var(--muted); text-decoration: none; font-weight: 600; }
.top nav a[aria-current="page"] { color: var(--ink); text-decoration: underline; text-underline-offset: 6px; }
.top .who { margin-left: auto; color: var(--muted); font-size: 14px; }

main { max-width: 1200px; margin: 0 auto; padding: 32px 24px 64px; }
h1 { font: 800 32px/1.15 var(--font-display); margin: 0 0 24px; }
h2 { font: 700 20px/1.2 var(--font-display); margin: 0 0 12px; }

.caps { font: 700 12px/1.2 var(--font-body); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }

.filters { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 0 0 24px; padding: 0; list-style: none; }
.filters a { color: var(--muted); font-weight: 600; text-decoration: none; }
.filters a[aria-current="true"] { color: var(--ink); text-decoration: underline; text-underline-offset: 4px; }

.grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); padding: 0; margin: 0; list-style: none; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.card-head { display: flex; align-items: center; gap: 12px; }
.card-head h2 { margin: 0; font-size: 18px; }
.card-head h2 a { color: var(--ink); text-decoration: none; }
.card-head h2 a:hover { text-decoration: underline; }
.card .note { margin: 0; color: var(--muted); font-size: 14px; }
.card-foot { display: flex; justify-content: space-between; align-items: center; margin-top: auto; font-size: 14px; }

.logo { flex: none; display: grid; place-items: center; border-radius: 8px; background: var(--canvas); border: 1px solid var(--line); overflow: hidden; }
.logo img { width: 100%; height: 100%; object-fit: contain; }
.logo.sm { width: 44px; height: 44px; }
.logo.lg { width: 72px; height: 72px; }
.logo .initials { font: 800 16px/1 var(--font-display); color: var(--muted); }

.level { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; }
.dot { width: 10px; height: 10px; border-radius: 50%; flex: none; }
.dot.red { background: var(--red); }
.dot.amber { background: var(--amber); }
.dot.green { background: var(--green); }
.dot.gray { background: var(--gray); }

.btn { display: inline-block; font: 700 15px/1 var(--font-body); padding: 10px 16px; border-radius: 6px; border: 1px solid var(--accent); background: var(--accent); color: #fff; text-decoration: none; cursor: pointer; }
.btn:hover { background: var(--accent-hot); color: #fff; }
.btn.quiet { background: transparent; color: var(--accent); }
.btn.quiet:hover { background: var(--canvas); color: var(--accent-hot); }

.empty { background: var(--surface); border: 1px dashed var(--line-strong); border-radius: 8px; padding: 32px; text-align: center; }

/* Site page */
.site-head { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; margin-bottom: 32px; }
.site-head h1 { margin: 0; }
.site-head .meta { display: flex; flex-direction: column; gap: 6px; }
.site-head .actions { margin-left: auto; display: flex; gap: 8px; }
.section { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 24px; margin-bottom: 20px; }
dl.facts { display: grid; grid-template-columns: max-content 1fr; gap: 10px 20px; margin: 0; }
dl.facts dt { color: var(--muted); font-weight: 600; }
dl.facts dd { margin: 0; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
code { font: 14px/1.4 var(--font-mono); background: var(--canvas); padding: 2px 6px; border-radius: 4px; overflow-wrap: anywhere; }
.copy { font: 600 13px/1 var(--font-body); padding: 6px 8px; border: 1px solid var(--line-strong); background: var(--surface); border-radius: 4px; cursor: pointer; color: var(--ink); }
.work { list-style: none; margin: 0 0 16px; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.work li { display: flex; gap: 10px; align-items: flex-start; }
.work .done { color: var(--muted); text-decoration: line-through; }
.work form { display: inline; }
.log { list-style: none; margin: 16px 0 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.log time { display: block; }
.spark { display: block; width: 100%; max-width: 480px; height: 48px; }
.spark path { fill: none; stroke: var(--accent); stroke-width: 1.5; }

/* Forms */
form.stack { display: flex; flex-direction: column; gap: 16px; max-width: 640px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-weight: 700; }
.field .hint { color: var(--muted); font-size: 14px; }
.field .err { color: var(--error); font-size: 14px; font-weight: 600; }
input[type="text"], input[type="url"], input[type="date"], input[type="number"], select, textarea {
  font: 16px/1.4 var(--font-body); padding: 10px 12px; border: 1px solid var(--line-strong); border-radius: 6px; background: #fff; color: var(--ink);
}
.row { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-end; }
.row input[type="text"] { flex: 1 1 240px; }
details.edit summary { cursor: pointer; color: var(--accent); font-weight: 700; }
details.edit[open] summary { margin-bottom: 12px; }
.alert { border-left: 4px solid var(--error); background: var(--surface); padding: 12px 16px; margin-bottom: 20px; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

@media (max-width: 640px) {
  .top { flex-wrap: wrap; }
  .top .who { margin-left: 0; width: 100%; }
  dl.facts { grid-template-columns: 1fr; }
  .site-head .actions { margin-left: 0; }
}
```

- [ ] **Step 2: Write the layout and components**

Replace `admin/src/layouts/Shell.astro` with:

```astro
---
import '../styles/admin.css';

const { title, active = '' } = Astro.props;
const user = Astro.locals.user;
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/images/favicon-192.png" />
    <title>{title} | K &amp; A sites</title>
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
    <header class="top">
      <a class="brand" href="/">K &amp; A <em>sites</em></a>
      <nav aria-label="Main">
        <a href="/" aria-current={active === 'sites' ? 'page' : undefined}>Sites</a>
        <a href="/sites/new" aria-current={active === 'new' ? 'page' : undefined}>Add site</a>
      </nav>
      <div class="who">{user?.name || user?.email}</div>
    </header>
    <main id="main">
      <slot />
    </main>
  </body>
</html>
```

Create `admin/src/components/LevelDot.astro`:

```astro
---
import { LEVEL_LABEL } from '../lib/enums.js';
const { level, reason } = Astro.props;
const text = level === 'green' ? LEVEL_LABEL.green : reason;
---
<span class="level"><span class={`dot ${level}`} aria-hidden="true"></span><span>{text}</span></span>
```

Create `admin/src/components/SiteLogo.astro`:

```astro
---
import { logoSrc, initials } from '../lib/view.js';
const { site, size = 'sm' } = Astro.props;
const src = logoSrc(site);
---
<span class={`logo ${size}`}>
  {src
    ? <img src={src} alt="" loading="lazy" />
    : <span class="initials" aria-hidden="true">{initials(site.name)}</span>}
</span>
```

The logo is decorative (`alt=""`) because the site name is always printed beside it.

Create `admin/src/components/SiteCard.astro`:

```astro
---
import SiteLogo from './SiteLogo.astro';
import LevelDot from './LevelDot.astro';
import { STATUS_LABEL } from '../lib/enums.js';
const { card } = Astro.props;
const { site, level, reason, openWork } = card;
---
<li class="card">
  <div class="card-head">
    <SiteLogo site={site} />
    <h2><a href={`/sites/${site.slug}`}>{site.name}</a></h2>
  </div>
  <LevelDot level={level} reason={reason} />
  <div>
    <div class="caps">{STATUS_LABEL[site.project_status] ?? site.project_status}</div>
    {site.status_note && <p class="note">{site.status_note}</p>}
  </div>
  <div class="card-foot">
    <span>{openWork === 0 ? 'No open work' : `${openWork} open ${openWork === 1 ? 'item' : 'items'}`}</span>
    <a href={site.live_url} target="_blank" rel="noopener">Visit site<span class="sr"> {site.name} (opens in a new tab)</span></a>
  </div>
</li>
```

- [ ] **Step 3: Write the dashboard and the logo route**

Create `admin/src/pages/index.astro`:

```astro
---
import Shell from '../layouts/Shell.astro';
import SiteCard from '../components/SiteCard.astro';
import { listSites, latestChecksForAll, openWorkCounts } from '../lib/db.js';
import { buildCards, filterCards } from '../lib/view.js';
import { PROJECT_STATUS, STATUS_LABEL } from '../lib/enums.js';

const DB = Astro.locals.runtime.env.DB;
const [sites, checks, counts] = await Promise.all([listSites(DB), latestChecksForAll(DB, 12), openWorkCounts(DB)]);
const show = Astro.url.searchParams.get('show') ?? 'all';
const all = buildCards(sites, checks, counts, Date.now());
const cards = filterCards(all, show);

const filters = [
  { key: 'all', label: `All (${all.length})` },
  { key: 'problems', label: `Problems (${all.filter((c) => c.level !== 'green').length})` },
  ...PROJECT_STATUS.map((s) => ({ key: s, label: STATUS_LABEL[s] })),
];
---
<Shell title="Sites" active="sites">
  <h1>Sites</h1>
  {sites.length === 0 ? (
    <div class="empty">
      <p>No sites yet.</p>
      <a class="btn" href="/sites/new">Add a site</a>
    </div>
  ) : (
    <>
      <nav aria-label="Filter sites">
        <ul class="filters">
          {filters.map((f) => (
            <li><a href={f.key === 'all' ? '/' : `/?show=${f.key}`} aria-current={show === f.key ? 'true' : undefined}>{f.label}</a></li>
          ))}
        </ul>
      </nav>
      {cards.length === 0
        ? <p>No sites match this filter.</p>
        : <ul class="grid">{cards.map((card) => <SiteCard card={card} />)}</ul>}
    </>
  )}
</Shell>
```

Create `admin/src/pages/logos/[...key].js`:

```js
// Serves logos and fetched icons from R2. Behind the middleware like every
// route, so logos are only visible to people who can see the dashboard.
// SVG uploads are served with a locked-down CSP and nosniff; they only ever
// render inside <img>, where scripts do not run, and this keeps it that way
// if someone opens one directly.

export async function GET({ params, locals }) {
  const key = params.key ?? '';
  if (!/^(logos|favicons)\/[a-z0-9.-]+$/.test(key)) return new Response('Not found', { status: 404 });

  const object = await locals.runtime.env.LOGOS.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=86400',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
```

- [ ] **Step 4: Set up local development**

Create `admin/.dev.vars` (gitignored, never committed):

```
ENVIRONMENT=development
DEV_EMAIL=alex@ka-performancefl.com
```

Then create and fill the local database:

```bash
node node_modules/wrangler/bin/wrangler.js d1 migrations apply ka-sites --local
node node_modules/wrangler/bin/wrangler.js d1 execute ka-sites --local --command "INSERT INTO people (name, email, role, created_at) VALUES ('Alex Anderson', 'alex@ka-performancefl.com', 'owner', '2026-09-23T00:00:00Z'); INSERT INTO sites (slug, name, live_url, hosting, project_status, status_note, created_at, updated_at) VALUES ('ka-performance', 'K & A Performance', 'https://ka-performancefl.com', 'pages', 'live', '', 't', 't'), ('demo-paused', 'Demo Paused', 'https://example.com', 'other', 'paused', 'Waiting on photos', 't', 't');"
```

Expected: migrations report `0001_sites.sql` applied; the insert reports success.

- [ ] **Step 5: Build and look at it**

Run: `node node_modules/astro/astro.js build`
Expected: build completes with no errors.

Run in the background: `node node_modules/astro/astro.js dev --port 4321`
Open `http://localhost:4321/` in the in-app browser. Expected: two cards, both gray with "Not checked yet" (no checker has run locally), "Paused" plus "Waiting on photos" on the second, and filters that change the list. Tab through the page: the skip link appears first and every link shows a focus outline.

- [ ] **Step 6: Commit**

```bash
git add src/styles/admin.css src/layouts/Shell.astro src/components src/pages/index.astro "src/pages/logos/[...key].js"
git commit -m "Sites: the dashboard, one card per site, worst first

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: The site page and its actions

**Files:**
- Create: `admin/src/pages/sites/[slug]/index.astro`, `admin/src/pages/sites/[slug]/[action].js`
- Test: `admin/tests/actions.test.js`

**Interfaces:**
- Consumes: `getSiteBySlug`, `checksSince`, `listWorkItems`, `listLog`, `listPeople`, `updateSiteStatus`, `updateSiteA11y`, `addManualWork`, `setManualWorkDone`, `addLog` (Task 3); `parseStatusForm`, `parseA11yForm`, `parseText` (Task 5); `computeLevel` (Task 2); `uptimePercent`, `hourlyAverages`, `sparklinePath` (Task 10); `todayEastern`, `humanDate`, `easternDateTime` (Task 2).
- Produces: `POST /sites/<slug>/<action>` for `status`, `a11y`, `work`, `work-done`, `log`. Success redirects (303) to `/sites/<slug>#<section>`. Validation failure redirects to `/sites/<slug>?err=<action>&msg=<message>#<section>`. Unknown action or site: 404. Exported `handleAction({db, slug, action, form, nowMs}) -> {status, location}` for tests.

- [ ] **Step 1: Write the failing test**

Create `admin/tests/actions.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import * as q from '../src/lib/db.js';
import { handleAction } from '../src/pages/sites/[slug]/[action].js';

const NOW = Date.parse('2026-09-23T18:00:00Z');
let db;
const form = (obj) => { const f = new FormData(); for (const [k, v] of Object.entries(obj)) f.append(k, v); return f; };
const act = (action, obj, slug = 'a') => handleAction({ db, slug, action, form: form(obj), nowMs: NOW });

beforeEach(async () => {
  db = makeD1();
  await q.createSite(db, { slug: 'a', name: 'A', live_url: 'https://a.test', hosting: 'pages' }, 't');
});

describe('site actions', () => {
  it('saves status and returns to the header', async () => {
    expect(await act('status', { project_status: 'paused', status_note: 'Back in October' }))
      .toEqual({ status: 303, location: '/sites/a#top' });
    expect(await q.getSiteBySlug(db, 'a')).toMatchObject({ project_status: 'paused', status_note: 'Back in October' });
  });

  it('sends validation messages back to the right section', async () => {
    const r = await act('status', { project_status: 'gone', status_note: '' });
    expect(r.status).toBe(303);
    expect(r.location).toMatch(/^\/sites\/a\?err=status&msg=.+#top$/);
  });

  it('adds and ticks manual work', async () => {
    expect((await act('work', { text: 'Fix contrast' })).location).toBe('/sites/a#work');
    const [item] = await q.listWorkItems(db, 1);
    await act('work-done', { id: String(item.id), done: '1' });
    expect((await q.listWorkItems(db, 1))[0].done_at).not.toBeNull();
  });

  it('saves accessibility and log entries, defaulting the log date to today in Eastern', async () => {
    await act('a11y', { a11y_audited_on: '2026-09-22', a11y_open_issues: '4', a11y_statement_url: '' });
    expect((await q.getSiteBySlug(db, 'a')).a11y_open_issues).toBe(4);
    await act('log', { text: 'Added credit link', entry_date: '' });
    expect((await q.listLog(db, 1))[0]).toMatchObject({ entry_date: '2026-09-23', text: 'Added credit link' });
  });

  it('404s an unknown action or site', async () => {
    expect((await act('delete', {})).status).toBe(404);
    expect((await act('status', { project_status: 'live' }, 'nope')).status).toBe(404);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `node node_modules/vitest/vitest.mjs run tests/actions.test.js`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Implement the actions**

Create `admin/src/pages/sites/[slug]/[action].js`:

```js
// Every small write on the site page is a plain form POST to here, then a 303
// back to the section it came from. Works with no JavaScript at all.
import * as q from '../../../lib/db.js';
import { parseStatusForm, parseA11yForm, parseText } from '../../../lib/validate.js';
import { todayEastern } from '../../../lib/when.js';

const SECTION = { status: 'top', a11y: 'a11y', work: 'work', 'work-done': 'work', log: 'log' };
const YMD = /^\d{4}-\d{2}-\d{2}$/;

const back = (slug, section) => ({ status: 303, location: `/sites/${slug}#${section}` });
const fail = (slug, action, msg) => ({
  status: 303,
  location: `/sites/${slug}?err=${action}&msg=${encodeURIComponent(msg)}#${SECTION[action]}`,
});
const firstError = (errors) => Object.values(errors)[0];

export async function handleAction({ db, slug, action, form, nowMs = Date.now() }) {
  if (!(action in SECTION)) return { status: 404 };
  const site = await q.getSiteBySlug(db, slug);
  if (!site) return { status: 404 };
  const nowIso = new Date(nowMs).toISOString();

  if (action === 'status') {
    const r = parseStatusForm(form);
    if (!r.ok) return fail(slug, action, firstError(r.errors));
    await q.updateSiteStatus(db, site.id, r.values, nowIso);
  } else if (action === 'a11y') {
    const r = parseA11yForm(form);
    if (!r.ok) return fail(slug, action, firstError(r.errors));
    await q.updateSiteA11y(db, site.id, r.values, nowIso);
  } else if (action === 'work') {
    const r = parseText(form, 'text', 200);
    if (!r.ok) return fail(slug, action, r.error);
    await q.addManualWork(db, site.id, r.value, nowIso);
  } else if (action === 'work-done') {
    const id = Number(form.get('id'));
    if (!Number.isInteger(id)) return fail(slug, action, 'That item could not be found.');
    await q.setManualWorkDone(db, site.id, id, form.get('done') === '1', nowIso);
  } else if (action === 'log') {
    const r = parseText(form, 'text', 500);
    if (!r.ok) return fail(slug, action, r.error);
    const given = String(form.get('entry_date') ?? '').trim();
    if (given && !YMD.test(given)) return fail(slug, action, 'Use a date.');
    await q.addLog(db, site.id, given || todayEastern(nowMs), r.value, nowIso);
  }
  return back(slug, SECTION[action]);
}

export async function POST({ params, request, locals }) {
  const form = await request.formData();
  const r = await handleAction({ db: locals.runtime.env.DB, slug: params.slug, action: params.action, form });
  if (r.status === 404) return new Response('Not found', { status: 404 });
  return new Response(null, { status: r.status, headers: { Location: r.location } });
}
```

- [ ] **Step 4: Run the test**

Run: `node node_modules/vitest/vitest.mjs run tests/actions.test.js`
Expected: PASS.

- [ ] **Step 5: Write the site page**

Create `admin/src/pages/sites/[slug]/index.astro`:

```astro
---
import Shell from '../../../layouts/Shell.astro';
import SiteLogo from '../../../components/SiteLogo.astro';
import LevelDot from '../../../components/LevelDot.astro';
import * as q from '../../../lib/db.js';
import { computeLevel } from '../../../lib/health.js';
import { uptimePercent, hourlyAverages, sparklinePath } from '../../../lib/sparkline.js';
import { humanDate, easternDateTime, todayEastern } from '../../../lib/when.js';
import { HOSTING_LABEL, PROJECT_STATUS, STATUS_LABEL } from '../../../lib/enums.js';

const DB = Astro.locals.runtime.env.DB;
const site = await q.getSiteBySlug(DB, Astro.params.slug);
if (!site) return new Response('Not found', { status: 404 });

const now = Date.now();
const [checks, work, log, people] = await Promise.all([
  q.checksSince(DB, site.id, new Date(now - 30 * 86400000).toISOString()),
  q.listWorkItems(DB, site.id),
  q.listLog(DB, site.id),
  q.listPeople(DB),
]);
const { level, reason } = computeLevel(site, checks.slice(0, 12), now);
const uptime = uptimePercent(checks);
const path = sparklinePath(hourlyAverages(checks), 480, 44);
const githubItems = work.filter((w) => w.source === 'github');
const manualItems = work.filter((w) => w.source === 'manual');
const maintainer = people.find((p) => p.id === site.maintainer_id);
const err = Astro.url.searchParams.get('err');
const msg = Astro.url.searchParams.get('msg');
const orNone = (v) => v ?? 'Not set';
const where = [
  ['Repo', site.repo, site.repo ? `https://github.com/${site.repo}` : null],
  ['Local folder', site.local_path, null],
  ['Deploy command', site.deploy_command, null],
];
---
<Shell title={site.name}>
  {err && msg && <div class="alert" role="alert">{msg}</div>}

  <div class="site-head" id="top">
    <SiteLogo site={site} size="lg" />
    <div class="meta">
      <h1>{site.name}</h1>
      <LevelDot level={level} reason={reason} />
      <div>
        <span class="caps">{STATUS_LABEL[site.project_status]}</span>
        {site.status_note && <span> {site.status_note}</span>}
      </div>
      <details class="edit">
        <summary>Change status</summary>
        <form method="post" action={`/sites/${site.slug}/status`} class="row">
          <div class="field">
            <label for="project_status">Status</label>
            <select id="project_status" name="project_status">
              {PROJECT_STATUS.map((s) => <option value={s} selected={s === site.project_status}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div class="field">
            <label for="status_note">Note</label>
            <input type="text" id="status_note" name="status_note" value={site.status_note} maxlength="140" />
          </div>
          <button class="btn" type="submit">Save status</button>
        </form>
      </details>
    </div>
    <div class="actions">
      <a class="btn" href={site.live_url} target="_blank" rel="noopener">Visit site<span class="sr"> (opens in a new tab)</span></a>
      <a class="btn quiet" href={`/sites/${site.slug}/edit`}>Edit details</a>
    </div>
  </div>

  <section class="section" aria-labelledby="where-h">
    <h2 id="where-h">Where it lives</h2>
    <dl class="facts">
      <dt>Live site</dt><dd><a href={site.live_url}>{site.live_url}</a></dd>
      <dt>Hosting</dt><dd>{HOSTING_LABEL[site.hosting]}</dd>
      {where.map(([label, value, href]) => (
        <>
          <dt>{label}</dt>
          <dd>
            {value
              ? <>{href ? <a href={href}><code>{value}</code></a> : <code>{value}</code>}<button class="copy" type="button" data-copy={value} hidden>Copy<span class="sr"> {label}</span></button></>
              : 'Not set'}
          </dd>
        </>
      ))}
      <dt>Maintained by</dt><dd>{maintainer ? maintainer.name : 'Not assigned'}</dd>
    </dl>
  </section>

  <section class="section" id="work" aria-labelledby="work-h">
    <h2 id="work-h">Open work</h2>
    {err === 'work' || err === 'work-done' ? <p class="err" role="alert">{msg}</p> : null}
    <h3 class="caps">From GitHub</h3>
    {!site.repo
      ? <p>No repo set, so nothing is read from GitHub.</p>
      : githubItems.filter((w) => !w.done_at).length === 0
        ? <p>Nothing open{site.github_synced_at ? `, as of ${easternDateTime(site.github_synced_at)}` : ', not synced yet'}.</p>
        : <ul class="work">{githubItems.filter((w) => !w.done_at).map((w) => <li><a href={w.url}>{w.text}</a></li>)}</ul>}
    <h3 class="caps">Your list</h3>
    <ul class="work">
      {manualItems.map((w) => (
        <li>
          <form method="post" action={`/sites/${site.slug}/work-done`}>
            <input type="hidden" name="id" value={w.id} />
            <input type="hidden" name="done" value={w.done_at ? '0' : '1'} />
            <button class="copy" type="submit">{w.done_at ? 'Reopen' : 'Done'}<span class="sr">: {w.text}</span></button>
          </form>
          <span class={w.done_at ? 'done' : ''}>{w.text}</span>
        </li>
      ))}
    </ul>
    <form method="post" action={`/sites/${site.slug}/work`} class="row">
      <div class="field" style="flex: 1 1 240px">
        <label for="work-text">Add an item</label>
        <input type="text" id="work-text" name="text" maxlength="200" required />
      </div>
      <button class="btn" type="submit">Add</button>
    </form>
  </section>

  <section class="section" id="a11y" aria-labelledby="a11y-h">
    <h2 id="a11y-h">Accessibility</h2>
    {err === 'a11y' && <p class="err" role="alert">{msg}</p>}
    <dl class="facts">
      <dt>Last audit</dt><dd>{site.a11y_audited_on ? humanDate(site.a11y_audited_on) : 'Not set'}</dd>
      <dt>Open issues</dt><dd>{orNone(site.a11y_open_issues)}</dd>
      <dt>Statement</dt><dd>{site.a11y_statement_url ? <a href={site.a11y_statement_url}>{site.a11y_statement_url}</a> : 'Not published'}</dd>
    </dl>
    <details class="edit">
      <summary>Update accessibility</summary>
      <form method="post" action={`/sites/${site.slug}/a11y`} class="stack">
        <div class="field"><label for="a11y_audited_on">Last audit</label><input type="date" id="a11y_audited_on" name="a11y_audited_on" value={site.a11y_audited_on ?? ''} /></div>
        <div class="field"><label for="a11y_open_issues">Open issues</label><input type="number" min="0" step="1" id="a11y_open_issues" name="a11y_open_issues" value={site.a11y_open_issues ?? ''} /></div>
        <div class="field"><label for="a11y_statement_url">Statement address</label><input type="url" id="a11y_statement_url" name="a11y_statement_url" value={site.a11y_statement_url ?? ''} /></div>
        <div><button class="btn" type="submit">Save accessibility</button></div>
      </form>
    </details>
  </section>

  <section class="section" aria-labelledby="health-h">
    <h2 id="health-h">Health</h2>
    <dl class="facts">
      <dt>Uptime, 30 days</dt><dd>{uptime === null ? 'No checks yet' : `${uptime}%`}</dd>
      <dt>Last checked</dt><dd>{checks[0] ? easternDateTime(checks[0].checked_at) : 'Never'}</dd>
      <dt>Certificate expires</dt><dd>{site.cert_expires_on ? humanDate(site.cert_expires_on) : 'Unknown'}</dd>
      <dt>Domain expires</dt><dd>{site.domain_expires_on ? humanDate(site.domain_expires_on) : 'Unknown'}</dd>
    </dl>
    {path && (
      <figure>
        <svg class="spark" viewBox="0 0 480 44" role="img" aria-label="Response time, hourly average, last 30 days"><path d={path} /></svg>
        <figcaption class="caps">Response time, hourly average, last 30 days</figcaption>
      </figure>
    )}
  </section>

  <section class="section" id="log" aria-labelledby="log-h">
    <h2 id="log-h">Log</h2>
    {err === 'log' && <p class="err" role="alert">{msg}</p>}
    <form method="post" action={`/sites/${site.slug}/log`} class="row">
      <div class="field"><label for="entry_date">Date</label><input type="date" id="entry_date" name="entry_date" value={todayEastern(now)} /></div>
      <div class="field" style="flex: 1 1 240px"><label for="log-text">What happened</label><input type="text" id="log-text" name="text" maxlength="500" required /></div>
      <button class="btn" type="submit">Add entry</button>
    </form>
    {log.length === 0
      ? <p>No entries yet.</p>
      : <ul class="log">{log.map((e) => <li><time class="caps" datetime={e.entry_date}>{humanDate(e.entry_date)}</time>{e.text}</li>)}</ul>}
  </section>

  <script>
    // Copy buttons are hidden until JavaScript can make them work.
    for (const btn of document.querySelectorAll('[data-copy]')) {
      btn.hidden = false;
      btn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(btn.dataset.copy);
        const label = btn.firstChild;
        label.textContent = 'Copied';
        setTimeout(() => { label.textContent = 'Copy'; }, 1500);
      });
    }
  </script>
</Shell>
```

- [ ] **Step 6: Build and check it**

Run: `node node_modules/astro/astro.js build`
Expected: no errors.

With `astro dev` running (Task 11, Step 5), open `http://localhost:4321/sites/ka-performance`. Change the status, add and tick a work item, save accessibility with `-1` issues (expect the message "Use a whole number, 0 or more." in the Accessibility section), and add a log entry. Each action returns to its section with the change shown.

- [ ] **Step 7: Commit**

```bash
git add "src/pages/sites/[slug]" tests/actions.test.js
git commit -m "Sites: the site page, where it lives, open work, accessibility, health and log

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Add and edit a site

**Files:**
- Create: `admin/src/components/SiteForm.astro`, `admin/src/pages/sites/new.astro`, `admin/src/pages/sites/[slug]/edit.astro`, `admin/src/lib/save-site.js`
- Test: `admin/tests/save-site.test.js`

**Interfaces:**
- Consumes: `parseSiteForm`, `checkLogo` (Task 5); `createSite`, `updateSite`, `getSiteBySlug`, `setSiteLogo`, `listPeople` (Task 3); `storeLogo` (Task 10); `HOSTING`, `HOSTING_LABEL` (Task 2).
- Produces: `saveSite({db, bucket, form, existing, nowMs}) -> {ok: true, slug} | {ok: false, values, errors}`. `existing` is the site row being edited, or `null` for a new site. A slug already used by a different site is an error on `name`.

- [ ] **Step 1: Write the failing test**

Create `admin/tests/save-site.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import * as q from '../src/lib/db.js';
import { saveSite } from '../src/lib/save-site.js';

let db;
let bucket;
const form = (obj) => { const f = new FormData(); for (const [k, v] of Object.entries(obj)) f.append(k, v); return f; };

beforeEach(() => {
  db = makeD1();
  bucket = { stored: [], async put(key) { this.stored.push(key); } };
});

describe('saveSite', () => {
  it('creates a site and stores an uploaded logo', async () => {
    const logo = new File([new Uint8Array([1, 2, 3])], 'l.png', { type: 'image/png' });
    const r = await saveSite({ db, bucket, form: form({ name: 'MBS Medicine', live_url: 'https://mbsdoc.com', logo }), existing: null, nowMs: 0 });
    expect(r).toEqual({ ok: true, slug: 'mbs-medicine' });
    const site = await q.getSiteBySlug(db, 'mbs-medicine');
    expect(site.logo_key).toMatch(/^logos\/mbs-medicine-/);
    expect(bucket.stored).toHaveLength(1);
  });

  it('refuses a duplicate name and a bad logo without writing', async () => {
    await saveSite({ db, bucket, form: form({ name: 'A', live_url: 'https://a.test' }), existing: null, nowMs: 0 });
    const dup = await saveSite({ db, bucket, form: form({ name: 'A', live_url: 'https://b.test' }), existing: null, nowMs: 0 });
    expect(dup.ok).toBe(false);
    expect(dup.errors.name).toMatch(/already/);
    const gif = new File([new Uint8Array([1])], 'l.gif', { type: 'image/gif' });
    const bad = await saveSite({ db, bucket, form: form({ name: 'B', live_url: 'https://b.test', logo: gif }), existing: null, nowMs: 0 });
    expect(bad.errors.logo).toBeTruthy();
    expect(await q.getSiteBySlug(db, 'b')).toBeNull();
  });

  it('edits in place, keeps the logo when none is uploaded, and allows keeping its own slug', async () => {
    const logo = new File([new Uint8Array([1])], 'l.png', { type: 'image/png' });
    await saveSite({ db, bucket, form: form({ name: 'A', live_url: 'https://a.test', logo }), existing: null, nowMs: 0 });
    const existing = await q.getSiteBySlug(db, 'a');
    const r = await saveSite({ db, bucket, form: form({ name: 'A', live_url: 'https://a2.test', repo: 'o/r' }), existing, nowMs: 0 });
    expect(r).toEqual({ ok: true, slug: 'a' });
    const after = await q.getSiteBySlug(db, 'a');
    expect(after).toMatchObject({ live_url: 'https://a2.test', repo: 'o/r', logo_key: existing.logo_key });
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `node node_modules/vitest/vitest.mjs run tests/save-site.test.js`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Implement**

Create `admin/src/lib/save-site.js`:

```js
// Create or edit a site from the add/edit form, logo included. Validates
// everything before writing anything, so a bad logo never leaves a half-saved site.
import { parseSiteForm, checkLogo } from './validate.js';
import { createSite, updateSite, getSiteBySlug, setSiteLogo } from './db.js';
import { storeLogo } from './logo.js';

export async function saveSite({ db, bucket, form, existing, nowMs = Date.now() }) {
  const parsed = parseSiteForm(form);
  const errors = { ...parsed.errors };
  const file = form.get('logo');
  const logo = checkLogo(file);
  if (!logo.ok) errors.logo = logo.error;

  if (!errors.name) {
    const clash = await getSiteBySlug(db, parsed.values.slug);
    if (clash && clash.id !== existing?.id) errors.name = 'A site with that name already exists.';
  }
  if (Object.keys(errors).length) return { ok: false, values: parsed.values, errors };

  const nowIso = new Date(nowMs).toISOString();
  let id = existing?.id;
  if (existing) await updateSite(db, id, parsed.values, nowIso);
  else id = await createSite(db, parsed.values, nowIso);

  if (logo.ext) {
    const key = await storeLogo(bucket, parsed.values.slug, file, logo.ext);
    await setSiteLogo(db, id, key, nowIso);
  }
  return { ok: true, slug: parsed.values.slug };
}
```

Create `admin/src/components/SiteForm.astro`:

```astro
---
import { HOSTING, HOSTING_LABEL } from '../lib/enums.js';
const { values = {}, errors = {}, people = [], action, submitLabel } = Astro.props;
const v = (k) => values[k] ?? '';
const fields = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'live_url', label: 'Live address', type: 'url', required: true, hint: 'The full address, starting with https://.' },
  { name: 'repo', label: 'GitHub repo', type: 'text', hint: 'owner/name. Leave blank if the code is not on GitHub.' },
  { name: 'local_path', label: 'Local folder', type: 'text', hint: 'For example D:\\MBS Medical\\mbsmedical-ref.' },
  { name: 'deploy_command', label: 'Deploy command', type: 'text' },
  { name: 'domain', label: 'Domain for expiry checks', type: 'text', hint: 'Only needed when it is not simply the live address without www.' },
];
---
<form method="post" action={action} enctype="multipart/form-data" class="stack" novalidate>
  {fields.map((f) => (
    <div class="field">
      <label for={f.name}>{f.label}{f.required ? '' : ' (optional)'}</label>
      {f.hint && <span class="hint" id={`${f.name}-hint`}>{f.hint}</span>}
      <input
        type={f.type}
        id={f.name}
        name={f.name}
        value={v(f.name)}
        required={f.required}
        aria-invalid={errors[f.name] ? 'true' : undefined}
        aria-describedby={[f.hint && `${f.name}-hint`, errors[f.name] && `${f.name}-err`].filter(Boolean).join(' ') || undefined}
      />
      {errors[f.name] && <span class="err" id={`${f.name}-err`}>{errors[f.name]}</span>}
    </div>
  ))}
  <div class="field">
    <label for="hosting">Hosting</label>
    <select id="hosting" name="hosting">
      {HOSTING.map((h) => <option value={h} selected={v('hosting') === h}>{HOSTING_LABEL[h]}</option>)}
    </select>
    {errors.hosting && <span class="err">{errors.hosting}</span>}
  </div>
  <div class="field">
    <label for="maintainer_id">Maintained by (optional)</label>
    <select id="maintainer_id" name="maintainer_id">
      <option value="">Not assigned</option>
      {people.map((p) => <option value={p.id} selected={String(v('maintainer_id')) === String(p.id)}>{p.name}</option>)}
    </select>
  </div>
  <div class="field">
    <label for="logo">Logo (optional)</label>
    <span class="hint" id="logo-hint">PNG, JPEG, WebP or SVG, up to 1 MB. Without one, the site's own icon is used.</span>
    <input type="file" id="logo" name="logo" accept="image/png,image/jpeg,image/webp,image/svg+xml" aria-describedby="logo-hint" />
    {errors.logo && <span class="err">{errors.logo}</span>}
  </div>
  <div><button class="btn" type="submit">{submitLabel}</button></div>
</form>
```

Create `admin/src/pages/sites/new.astro`:

```astro
---
import Shell from '../../layouts/Shell.astro';
import SiteForm from '../../components/SiteForm.astro';
import { listPeople } from '../../lib/db.js';
import { saveSite } from '../../lib/save-site.js';

const { DB, LOGOS } = Astro.locals.runtime.env;
let values = { hosting: 'pages' };
let errors = {};
if (Astro.request.method === 'POST') {
  const r = await saveSite({ db: DB, bucket: LOGOS, form: await Astro.request.formData(), existing: null });
  if (r.ok) return Astro.redirect(`/sites/${r.slug}`, 303);
  ({ values, errors } = r);
}
const people = await listPeople(DB);
---
<Shell title="Add site" active="new">
  <h1>Add site</h1>
  {Object.keys(errors).length > 0 && <div class="alert" role="alert">Some fields need attention.</div>}
  <SiteForm values={values} errors={errors} people={people} action="/sites/new" submitLabel="Add site" />
</Shell>
```

Create `admin/src/pages/sites/[slug]/edit.astro`:

```astro
---
import Shell from '../../../layouts/Shell.astro';
import SiteForm from '../../../components/SiteForm.astro';
import { getSiteBySlug, listPeople } from '../../../lib/db.js';
import { saveSite } from '../../../lib/save-site.js';

const { DB, LOGOS } = Astro.locals.runtime.env;
const site = await getSiteBySlug(DB, Astro.params.slug);
if (!site) return new Response('Not found', { status: 404 });

let values = site;
let errors = {};
if (Astro.request.method === 'POST') {
  const r = await saveSite({ db: DB, bucket: LOGOS, form: await Astro.request.formData(), existing: site });
  if (r.ok) return Astro.redirect(`/sites/${r.slug}`, 303);
  ({ values, errors } = r);
}
const people = await listPeople(DB);
---
<Shell title={`Edit ${site.name}`}>
  <h1>Edit {site.name}</h1>
  {Object.keys(errors).length > 0 && <div class="alert" role="alert">Some fields need attention.</div>}
  <SiteForm values={values} errors={errors} people={people} action={`/sites/${site.slug}/edit`} submitLabel="Save changes" />
</Shell>
```

- [ ] **Step 4: Run all tests and build**

Run: `node node_modules/vitest/vitest.mjs run`
Expected: PASS, every file.

Run: `node node_modules/astro/astro.js build`
Expected: no errors.

- [ ] **Step 5: Try it**

With `astro dev` running, open `/sites/new`. Submit empty: expect the "Some fields need attention." banner plus messages under Name and Live address. Add "Test Site" with `https://example.com` and a small PNG: expect a redirect to `/sites/test-site` with the logo shown. Edit it and change the address: expect the logo kept.

- [ ] **Step 6: Commit**

```bash
git add src/lib/save-site.js src/components/SiteForm.astro src/pages/sites/new.astro "src/pages/sites/[slug]/edit.astro" tests/save-site.test.js
git commit -m "Sites: add and edit a site, logo upload to R2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Seed data

**Files:**
- Create: `admin/seed/data.js`, `admin/scripts/seed-sql.mjs`
- Test: `admin/tests/seed.test.js`
- Generated (committed): `admin/seed/seed.sql`

**Interfaces:**
- Produces: `buildSeedSql({people, sites}, nowIso) -> string` exported from `scripts/seed-sql.mjs`; running the script writes `seed/seed.sql`. Inserts use `INSERT OR IGNORE` keyed on `people.email` and `sites.slug`, so running the seed twice changes nothing and never overwrites edits made in the app.

- [ ] **Step 1: Write the failing test**

Create `admin/tests/seed.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import { buildSeedSql } from '../scripts/seed-sql.mjs';
import data from '../seed/data.js';

describe('seed', () => {
  it('escapes quotes and is safe to run twice', () => {
    const sql = buildSeedSql({
      people: [{ name: 'Alex Anderson', email: 'Alex@Example.com', role: 'owner' }],
      sites: [{ slug: 'davids-bbq', name: "David's BBQ", live_url: 'https://davidsbbq.test', hosting: 'pages' }],
    }, '2026-09-23T00:00:00.000Z');
    const db = makeD1();
    db.sqlite.exec(sql);
    db.sqlite.exec(sql);
    expect(db.sqlite.prepare('SELECT name FROM sites').all().map((r) => r.name)).toEqual(["David's BBQ"]);
    expect(db.sqlite.prepare('SELECT email FROM people').get().email).toBe('alex@example.com');
  });

  it('the real data file loads into the schema', () => {
    const db = makeD1();
    db.sqlite.exec(buildSeedSql(data, '2026-09-23T00:00:00.000Z'));
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM sites').get().n).toBe(data.sites.length);
    expect(data.sites.every((s) => /^https:\/\//.test(s.live_url))).toBe(true);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `node node_modules/vitest/vitest.mjs run tests/seed.test.js`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Write the generator**

Create `admin/scripts/seed-sql.mjs`:

```js
// Turns seed/data.js into seed/seed.sql. INSERT OR IGNORE on the unique keys
// (people.email, sites.slug), so re-running never overwrites what Alex has
// since edited in the app.
//   node scripts/seed-sql.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SITE_COLS = ['slug', 'name', 'live_url', 'repo', 'local_path', 'hosting', 'deploy_command', 'domain', 'project_status', 'status_note', 'a11y_audited_on', 'a11y_open_issues', 'a11y_statement_url'];
const DEFAULTS = { hosting: 'other', project_status: 'live', status_note: '' };

const lit = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

export function buildSeedSql({ people, sites }, nowIso) {
  const lines = [];
  for (const p of people) {
    lines.push(`INSERT OR IGNORE INTO people (name, email, role, created_at) VALUES (${lit(p.name)}, ${lit(p.email.toLowerCase())}, ${lit(p.role ?? 'owner')}, ${lit(nowIso)});`);
  }
  for (const s of sites) {
    const row = { ...DEFAULTS, ...s };
    lines.push(`INSERT OR IGNORE INTO sites (${SITE_COLS.join(', ')}, created_at, updated_at) VALUES (${SITE_COLS.map((c) => lit(row[c])).join(', ')}, ${lit(nowIso)}, ${lit(nowIso)});`);
  }
  return `${lines.join('\n')}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { default: data } = await import('../seed/data.js');
  const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../seed/seed.sql');
  writeFileSync(out, buildSeedSql(data, new Date().toISOString()));
  console.log(`Wrote ${out}: ${data.people.length} people, ${data.sites.length} sites.`);
}
```

- [ ] **Step 4: Assemble the verified data**

Create `admin/seed/data.js` with one entry per managed site. **Only facts you can verify go in; anything you cannot verify is left out of the object (it becomes NULL), never guessed.** Sources, in order:

1. `D:\ka-site-seo\docs\superpowers\HANDOFF.md` (on `main`): the "START HERE" block, "Adding a client to the portfolio", "OVERNIGHT" items O2 to O5 and S5, which name each client's folder, deploy method and branch.
2. `D:\ka-site-seo\src\data\work.js` on `main` for the nine portfolio names; `git show 8ef9627:src/data/work.js` in the site repo for FDAAF and FixAlways.
3. Each client folder's own `wrangler.jsonc`/`wrangler.toml`, `package.json` and `git remote -v` for the live URL, repo and hosting. A `pages_build_output_dir` or `wrangler pages deploy` means `pages`; a `main` entry with `routes` means `worker`; a push to a client remote means `client-push`.
4. Open each live URL once to confirm it answers before recording it.

The sites to cover (twelve): MBS Medicine, PB&J Strategic Accounting, Project Makeover, Fore Motion Golf, Ellenton Family Practice Direct, Southern Legacy Contractors, Synovial Marketing, Osteen & Sons, David's BBQ, FDAAF, FixAlways, and K & A Performance (`https://ka-performancefl.com`, repo `shizzoobies/kandadesigners`, local path `D:\K & A Performance Site`, hosting `pages`, deploy command `git push origin main`). Set `project_status: 'live'` and leave `status_note` empty for all of them; Alex sets those. For the people entry, use the email Alex signs into Cloudflare Access with. **Ask Alex for it; do not assume.** Until he answers, use `alex@ka-performancefl.com` and flag it in the Task 16 handoff.

The file's shape, with the one site the plan already verified:

```js
// Seed for the ka-sites database. Verified facts only: a field that could not
// be confirmed from the HANDOFF, the client's own repo config or the live site
// is left out, and Alex fills it in the app. Sources noted per site.
export default {
  people: [
    // CONFIRM with Alex: the email he signs into Cloudflare Access with.
    { name: 'Alex Anderson', email: 'alex@ka-performancefl.com', role: 'owner' },
  ],
  sites: [
    {
      // Source: HANDOFF deploy runbook; this repo's git remote.
      slug: 'ka-performance',
      name: 'K & A Performance',
      live_url: 'https://ka-performancefl.com',
      repo: 'shizzoobies/kandadesigners',
      local_path: 'D:\\K & A Performance Site',
      hosting: 'pages',
      deploy_command: 'git push origin main',
      a11y_statement_url: 'https://ka-performancefl.com/accessibility/',
    },
    // ...one object per remaining site, each with a source comment.
  ],
};
```

Replace the `// ...one object per remaining site` line with the eleven verified entries before moving on.

- [ ] **Step 5: Generate, test and load locally**

```bash
node scripts/seed-sql.mjs
node node_modules/vitest/vitest.mjs run tests/seed.test.js
node node_modules/wrangler/bin/wrangler.js d1 execute ka-sites --local --file seed/seed.sql
```

Expected: the script reports 1 person and 12 sites; tests PASS; the local execute succeeds. With `astro dev` running, the dashboard shows all twelve plus the two local test rows from Task 11.

- [ ] **Step 6: Commit**

```bash
git add seed scripts/seed-sql.mjs tests/seed.test.js
git commit -m "Sites: seed data, verified facts only, safe to run twice

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Accessibility check

**Files:**
- Create: `admin/scripts/a11y-check.mjs`

**Interfaces:**
- Consumes: a running `astro dev` on port 4321 with `.dev.vars` (Task 11), seeded locally (Task 14).
- Produces: exit code 0 when axe finds no WCAG 2.x A/AA violations on `/`, `/?show=problems`, `/sites/ka-performance`, `/sites/new`, and `/sites/new` after an empty submit; exit 1 otherwise, printing each violation.

- [ ] **Step 1: Write the script**

Create `admin/scripts/a11y-check.mjs`:

```js
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
```

- [ ] **Step 2: Run it**

With `astro dev` running on port 4321:

Run: `MSYS_NO_PATHCONV=1 node scripts/a11y-check.mjs`
Expected: every line starts with `ok`, exit code 0. Fix any violation in the page or CSS it names (not by weakening the rule set), re-run until clean.

- [ ] **Step 3: Keyboard pass by hand**

In the in-app browser at `http://localhost:4321/`: Tab from the top. Expect the skip link first, then brand, Sites, Add site, the filters, then each card's name link and Visit site link, all with a visible outline. On a site page, open "Change status" with Enter, change it, submit with Enter, and land back at the header.

- [ ] **Step 4: Commit**

```bash
git add scripts/a11y-check.mjs
git commit -m "Sites: an axe pass over every screen, phone width included

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Deploy runbook and handoff

**Files:**
- Create: `admin/DEPLOY-SITES.md`
- Modify: `docs/superpowers/HANDOFF.md` (the "Admin backend" section)

Nothing in this task runs a production command. It writes the exact commands for Alex, in order, each as one PowerShell line that `cd`s first (every new terminal tab opens in `D:\K & A Performance Site`).

- [ ] **Step 1: Write the runbook**

Create `admin/DEPLOY-SITES.md`:

````markdown
# Deploying the sites dashboard

Alex runs each line, in order, in PowerShell. Claude verifies after each step.
Stop at the first error and paste it into the session.

## 0. Before anything
- `admin/three-bugs` is merged to `main` (it is what is live today).
- Alex confirms the email he signs into Cloudflare Access with. If it is not
  `alex@ka-performancefl.com`, fix it in `admin/seed/data.js`, then re-run
  `node scripts/seed-sql.mjs` and commit.
- Alex creates a fine-grained GitHub token: Metadata, Contents and Pull
  requests, all read-only, on the repos listed in `seed/data.js`.

## 1. Create the database and the logo bucket
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 create ka-sites
```
Copy the `database_id` it prints into BOTH `admin/wrangler.jsonc` and
`admin/checker/wrangler.jsonc` (Claude does this and commits), then:
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js r2 bucket create ka-sites-logos
```

## 2. Schema and seed
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 migrations apply ka-sites --remote; if ($?) { node ./node_modules/wrangler/bin/wrangler.js d1 execute ka-sites --remote --file seed/seed.sql }
```

## 3. Checker secrets
Claude writes `$env:TEMP\checker-secrets.json` (BOM-free) with the keys
`GITHUB_TOKEN` and `RESEND_API_KEY` left empty; Alex fills them in a text
editor. Then:
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js secret bulk "$env:TEMP\checker-secrets.json" -c checker/wrangler.jsonc; Remove-Item "$env:TEMP\checker-secrets.json"
```

## 4. Deploy the checker, then wait one cycle
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js deploy -c checker/wrangler.jsonc
```
Claude verifies after 15 minutes: `d1 execute ka-sites --remote --command "SELECT COUNT(*) FROM checks"` is at least the number of sites.

## 5. Deploy the new admin
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/astro/astro.js build; if ($?) { node ./node_modules/wrangler/bin/wrangler.js deploy }
```
Claude verifies: `admin.ka-performancefl.com` 302s to Access on `/`,
`/sites/new` and `/logos/x`; the workers.dev hostname still does not answer;
Alex signs in and sees every site; a free-course signup on the public site
still lands in the old `ka-admin` database (`course_leads` count goes up).

## 6. Retire the digest
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js delete --name ka-admin-digest
```
````

- [ ] **Step 2: Update the handoff**

In `docs/superpowers/HANDOFF.md`, replace the body of the "## Admin backend" section with a short paragraph: the August admin was replaced on branch `admin/sites-dashboard` by the sites dashboard (spec and plan paths), the old `ka-admin` database is an archive still receiving course leads, the members portal, newsletter, Launch Book and digest are retired, and deployment follows `admin/DEPLOY-SITES.md`. State which runbook steps have been done (none, at the time of writing) and that the seed email awaits Alex's confirmation.

- [ ] **Step 3: Run the full suite one last time**

Run: `node node_modules/vitest/vitest.mjs run`
Expected: PASS, every file.

Run: `node node_modules/astro/astro.js build`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add DEPLOY-SITES.md ../docs/superpowers/HANDOFF.md
git commit -m "Sites: the deploy runbook for Alex and the handoff

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
