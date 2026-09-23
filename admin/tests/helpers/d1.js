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
