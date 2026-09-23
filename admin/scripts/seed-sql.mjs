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
