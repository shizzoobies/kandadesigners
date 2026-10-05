import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeD1, ATTRIBUTION_MIGRATIONS } from './helpers/d1.js';
import { fakeFetch } from './helpers/fetch.js';
import { metricoolHandler } from './fixtures/metricool.js';
import * as q from '../src/lib/db.js';
import { openRun, nextDueSite, runNightly, runManual } from '../src/lib/analytics-sync.js';
import { handleFetch } from '../analytics-sync/index.js';

const NOW = Date.parse('2026-10-05T07:30:00Z');
const DAY = 86400000;
const quiet = { warn: vi.fn(), error: vi.fn(), log: vi.fn() };
let env;

beforeEach(async () => {
  const db = makeD1();
  for (const [slug, brand] of [['ka-performance', '7076479'], ['foremotion-golf', '7185142'], ['mbs', null]]) {
    await q.createSite(db, { slug, name: slug, live_url: `https://${slug}.test`, hosting: 'pages' }, 't');
    if (brand) await db.prepare('UPDATE sites SET metricool_brand_id = ? WHERE slug = ?').bind(brand, slug).run();
  }
  env = {
    DB: db, ATTRIBUTION_DB: makeD1(ATTRIBUTION_MIGRATIONS),
    METRICOOL_BASE: 'https://app.metricool.com/api', METRICOOL_USER_ID: '5465573', METRICOOL_USER_TOKEN: 'secret-123',
  };
});

const nightly = (nowMs) => runNightly({ env, nowMs, fetchImpl: fakeFetch(metricoolHandler()), sleep: async () => {}, log: quiet });

describe('runNightly', () => {
  it('syncs one due site per run, each once a day', async () => {
    expect((await nightly(NOW)).site).toBe('foremotion-golf');
    expect((await nightly(NOW + 600000)).site).toBe('ka-performance');
    expect((await nightly(NOW + 1200000)).site).toBeNull();
    expect((await nightly(NOW + DAY)).site).toBe('foremotion-golf');
    const runs = (await env.ATTRIBUTION_DB.prepare("SELECT site_slug FROM sync_runs WHERE trigger = 'cron' ORDER BY id").all()).results;
    expect(runs.map((r) => r.site_slug)).toEqual(['foremotion-golf', 'ka-performance', 'foremotion-golf']);
  });

  it('a manual run does not count as the nightly one', async () => {
    await runManual({ env, slug: 'foremotion-golf', nowMs: NOW, fetchImpl: fakeFetch(metricoolHandler()), log: quiet });
    expect((await nextDueSite(env.ATTRIBUTION_DB, NOW)).site_slug).toBe('foremotion-golf');
  });
});

describe('openRun', () => {
  it('is true only for an unfinished run under five minutes old', async () => {
    const adb = env.ATTRIBUTION_DB;
    await adb.prepare("INSERT INTO sync_runs (site_slug, started_at, trigger) VALUES ('ka-performance', ?, 'manual')").bind(new Date(NOW - 60000).toISOString()).run();
    expect(await openRun(adb, 'ka-performance', NOW)).toBe(true);
    expect(await openRun(adb, 'ka-performance', NOW + 300000)).toBe(false);
    expect(await openRun(adb, 'foremotion-golf', NOW)).toBe(false);
  });
});

describe('runManual', () => {
  it('404s a site with no brand, 409s while a run is open, and runs otherwise', async () => {
    const f = fakeFetch(metricoolHandler());
    expect(await runManual({ env, slug: 'mbs', nowMs: NOW, fetchImpl: f, log: quiet })).toEqual({ status: 404, error: 'No Metricool brand set for this site.' });
    await env.ATTRIBUTION_DB.prepare("INSERT INTO sync_runs (site_slug, started_at, trigger) VALUES ('ka-performance', ?, 'cron')").bind(new Date(NOW - 1000).toISOString()).run();
    expect((await runManual({ env, slug: 'ka-performance', nowMs: NOW, fetchImpl: f, log: quiet })).status).toBe(409);
    const r = await runManual({ env, slug: 'foremotion-golf', nowMs: NOW, fetchImpl: f, log: quiet });
    expect(r).toMatchObject({ status: 200, ok: true });
    expect(await env.ATTRIBUTION_DB.prepare("SELECT trigger FROM sync_runs WHERE site_slug = 'foremotion-golf'").first('trigger')).toBe('manual');
  });
});

describe('ka-analytics-sync fetch handler', () => {
  const call = (url, method = 'POST') => handleFetch(new Request(url, { method }), env, { nowMs: NOW, fetchImpl: fakeFetch(metricoolHandler()), log: quiet });

  it('answers only POST /sync', async () => {
    expect((await call('https://ka-analytics-sync/sync?site=ka-performance', 'GET')).status).toBe(404);
    expect((await call('https://ka-analytics-sync/other?site=ka-performance')).status).toBe(404);
  });

  it('rejects a malformed slug', async () => {
    const res = await call('https://ka-analytics-sync/sync?site=../x');
    expect(res.status).toBe(400);
  });

  it('runs the site and returns the result as JSON, without the status field', async () => {
    const res = await call('https://ka-analytics-sync/sync?site=ka-performance');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, postsSeen: 6 });
    expect(body.status).toBeUndefined();
  });

  it('passes a 404 through', async () => {
    const res = await call('https://ka-analytics-sync/sync?site=mbs');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'No Metricool brand set for this site.' });
  });
});
