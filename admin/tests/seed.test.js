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
