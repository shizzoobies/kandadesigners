import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeD1, ATTRIBUTION_MIGRATIONS } from './helpers/d1.js';
import * as q from '../src/lib/db.js';
import { handleSync } from '../src/pages/sites/[slug]/analytics/sync.js';

const NOW = Date.parse('2026-10-05T16:00:00Z');
let db;
let adb;

const syncStub = (status, body) => ({ fetch: vi.fn(async () => Response.json(body, { status })) });
const msgOf = (r) => decodeURIComponent(r.location.split('msg=')[1]);

beforeEach(async () => {
  db = makeD1();
  adb = makeD1(ATTRIBUTION_MIGRATIONS);
  await q.createSite(db, { slug: 'ka-performance', name: 'K & A', live_url: 'https://ka.test', hosting: 'pages', metricool_brand_id: '7076479' }, 't');
  await q.createSite(db, { slug: 'mbs', name: 'MBS', live_url: 'https://mbs.test', hosting: 'pages' }, 't');
});

describe('POST /sites/[slug]/analytics/sync', () => {
  it('404s an unknown site', async () => {
    expect(await handleSync({ db, adb, sync: syncStub(200, {}), slug: 'nope', nowMs: NOW })).toEqual({ status: 404 });
  });

  it('sends a site with no brand back with a message, and calls nothing', async () => {
    const sync = syncStub(200, { ok: true });
    const r = await handleSync({ db, adb, sync, slug: 'mbs', nowMs: NOW });
    expect(r.status).toBe(303);
    expect(r.location.startsWith('/sites/mbs/analytics?msg=')).toBe(true);
    expect(msgOf(r)).toBe('No Metricool brand set for this site.');
    expect(sync.fetch).not.toHaveBeenCalled();
  });

  it('says so when the bindings are missing', async () => {
    expect(msgOf(await handleSync({ db, adb, sync: undefined, slug: 'ka-performance', nowMs: NOW }))).toBe('Analytics is not connected yet.');
  });

  it('waits for an open run', async () => {
    await adb.prepare("INSERT INTO sync_runs (site_slug, started_at, trigger) VALUES ('ka-performance', ?, 'cron')").bind(new Date(NOW - 60000).toISOString()).run();
    const sync = syncStub(200, { ok: true });
    expect(msgOf(await handleSync({ db, adb, sync, slug: 'ka-performance', nowMs: NOW }))).toBe('A sync is already running. Try again in a few minutes.');
    expect(sync.fetch).not.toHaveBeenCalled();
  });

  it('calls the sync Worker and reports the outcome', async () => {
    const sync = syncStub(200, { ok: true, postsSeen: 6 });
    const r = await handleSync({ db, adb, sync, slug: 'ka-performance', nowMs: NOW });
    expect(sync.fetch).toHaveBeenCalledWith('https://ka-analytics-sync/sync?site=ka-performance', { method: 'POST' });
    expect(msgOf(r)).toBe('Synced.');
    expect(msgOf(await handleSync({ db, adb, sync: syncStub(200, { ok: false }), slug: 'ka-performance', nowMs: NOW }))).toBe('Synced, with errors. See the lines below.');
    expect(msgOf(await handleSync({ db, adb, sync: syncStub(409, { error: 'A sync is already running.' }), slug: 'ka-performance', nowMs: NOW }))).toBe('A sync is already running.');
  });

  it('survives a binding that throws or a reply that is not JSON', async () => {
    const boom = { fetch: vi.fn(async () => { throw new Error('down'); }) };
    expect(msgOf(await handleSync({ db, adb, sync: boom, slug: 'ka-performance', nowMs: NOW }))).toBe('The sync could not be started.');
    const html = { fetch: vi.fn(async () => new Response('<html>', { status: 502 })) };
    expect(msgOf(await handleSync({ db, adb, sync: html, slug: 'ka-performance', nowMs: NOW }))).toBe('The sync failed (502).');
  });
});
