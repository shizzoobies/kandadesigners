// Turns the committed Firestore export into SQL for D1.
//
//   node db/songs/import-from-firestore.mjs docs/exports/<export>.json db/songs/generated
//
// then apply each emitted chunk with:
//   wrangler d1 execute ka-songs --remote --file=db/songs/generated/import-001.sql
//
// Statements are INSERT OR IGNORE and every row carries its firestore_id, so
// re-running this against a later export imports only what is new. That is what
// makes the delta pass after cutover safe to repeat.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const [, , exportPath, outDir] = process.argv;
if (!exportPath || !outDir) {
  console.error('usage: node import-from-firestore.mjs <export.json> <outDir>');
  process.exit(1);
}

// SQLite string literals escape a single quote by doubling it. Backslashes are
// not special, so this is the whole of it.
const q = (value) => `'${String(value ?? '').replace(/'/g, "''")}'`;
const json = (value) => q(JSON.stringify(value ?? []));

const data = JSON.parse(readFileSync(exportPath, 'utf8'));
const statements = [];

for (const g of data.generations ?? []) {
  statements.push(
    'INSERT OR IGNORE INTO generations (date, lane, generated_at, songs_json, firestore_id) VALUES ('
    + [q(g.date), q(g.lane), q(g.generatedAt), json(g.songs), q(g.firestoreId)].join(', ')
    + ');'
  );
}

for (const b of data.bangers ?? []) {
  // tags is a comma-separated string, not an array: verified across all 485
  // exported songs and all 3 bangers. The client splits it on commas, so it is
  // stored raw. Only a generation's `songs` is genuinely JSON.
  statements.push(
    'INSERT OR IGNORE INTO bangers (title, prompt, description, tags, lane, date, marked_at, firestore_id) VALUES ('
    + [q(b.title), q(b.prompt), q(b.description), q(b.tags), q(b.lane), q(b.date), q(b.markedAt), q(b.firestoreId)].join(', ')
    + ');'
  );
}

// Chunked because a single generation can carry 45 song objects, and one giant
// file risks hitting a size limit mid-import, which is the worst outcome.
const CHUNK = 20;
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

let files = 0;
for (let i = 0; i < statements.length; i += CHUNK) {
  files += 1;
  const name = `import-${String(files).padStart(3, '0')}.sql`;
  writeFileSync(join(outDir, name), statements.slice(i, i + CHUNK).join('\n') + '\n', 'utf8');
}

console.log(`statements: ${statements.length}`);
console.log(`  generations: ${(data.generations ?? []).length}`);
console.log(`  bangers:     ${(data.bangers ?? []).length}`);
console.log(`chunks written: ${files} in ${outDir}`);
console.log(`expected songs after import: ${(data.generations ?? []).reduce((n, g) => n + (g.songs?.length ?? 0), 0)}`);
