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

  it('editing a site does not change its slug even when the name would slugify differently', async () => {
    await saveSite({ db, bucket, form: form({ name: 'K & A Performance', slug: 'ka-performance', live_url: 'https://ka.test' }), existing: null, nowMs: 0 });
    const existing = await q.getSiteBySlug(db, 'ka-performance');
    const r = await saveSite({ db, bucket, form: form({ name: 'K & A Performance', live_url: 'https://ka2.test' }), existing, nowMs: 0 });
    expect(r).toEqual({ ok: true, slug: 'ka-performance' });
    const after = await q.getSiteBySlug(db, 'ka-performance');
    expect(after).toBeTruthy();
    expect(after.live_url).toBe('https://ka2.test');
  });

  it('reserves the slug "new" for new sites', async () => {
    const r = await saveSite({ db, bucket, form: form({ name: 'New', live_url: 'https://new.test' }), existing: null, nowMs: 0 });
    expect(r.ok).toBe(false);
    expect(r.errors.name).toBeTruthy();
  });
});
