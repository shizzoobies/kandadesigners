import { describe, it, expect, vi } from 'vitest';
import { makeD1, ATTRIBUTION_MIGRATIONS } from './helpers/d1.js';
import { fakeFetch } from './helpers/fetch.js';
import * as q from '../src/lib/db.js';
import { items, metricoolGet, syncWindow, weekChunks, refreshSitesMap } from '../src/lib/analytics-sync.js';

const ENV = { METRICOOL_BASE: 'https://app.metricool.com/api', METRICOOL_USER_ID: '5465573', METRICOOL_USER_TOKEN: 'secret-123' };

describe('items', () => {
  it('reads data arrays, bare arrays, and nothing', () => {
    expect(items({ data: [1] })).toEqual([1]);
    expect(items([2])).toEqual([2]);
    expect(items({})).toEqual([]);
    expect(items(null)).toEqual([]);
  });
});

describe('metricoolGet', () => {
  it('sends the token as a header and the ids as params', async () => {
    const f = fakeFetch(() => ({ body: { data: [] } }));
    await metricoolGet({ env: ENV, path: 'v2/analytics/posts/instagram', params: { from: 'a', to: 'b' }, blogId: 7076479, fetchImpl: f });
    const { url, init } = f.calls[0];
    expect(url.pathname).toBe('/api/v2/analytics/posts/instagram');
    expect(Object.fromEntries(url.searchParams)).toEqual({ userId: '5465573', blogId: '7076479', from: 'a', to: 'b' });
    expect(init.headers['X-Mc-Auth']).toBe('secret-123');
    expect(url.href).not.toContain('secret-123');
  });

  it('leaves blogId out when none is given', async () => {
    const f = fakeFetch(() => ({ body: { data: [] } }));
    await metricoolGet({ env: ENV, path: 'admin/simpleProfiles', fetchImpl: f });
    expect(f.calls[0].url.searchParams.has('blogId')).toBe(false);
  });

  it('waits Retry-After once on a 429, then succeeds', async () => {
    const f = fakeFetch((u, n) => (n === 1 ? { status: 429, body: 'slow', headers: { 'Retry-After': '2' } } : { body: { data: [7] } }));
    const sleep = vi.fn(async () => {});
    expect(await metricoolGet({ env: ENV, path: 'x', fetchImpl: f, sleep })).toEqual({ data: [7] });
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it('waits 5 s without Retry-After, and gives up on a second 429', async () => {
    const f = fakeFetch(() => ({ status: 429, body: 'slow' }));
    const sleep = vi.fn(async () => {});
    await expect(metricoolGet({ env: ENV, path: 'x', fetchImpl: f, sleep })).rejects.toThrow('x returned 429');
    expect(sleep).toHaveBeenCalledWith(5000);
    expect(f.calls).toHaveLength(2);
  });

  it('scrubs the token from an error and reports non-JSON', async () => {
    const bad = fakeFetch(() => ({ status: 401, body: 'bad token secret-123' }));
    await expect(metricoolGet({ env: ENV, path: 'x', fetchImpl: bad })).rejects.toThrow('x returned 401: bad token <token>');
    const html = fakeFetch(() => ({ body: '<html>' }));
    await expect(metricoolGet({ env: ENV, path: 'x', fetchImpl: html })).rejects.toThrow('x did not return JSON');
  });
});

describe('syncWindow and weekChunks', () => {
  it('covers 35 days back to now, in the site timezone', () => {
    expect(syncWindow(Date.parse('2026-10-05T07:30:00Z'), 'America/New_York')).toEqual({ from: '2026-08-31T00:00:00', to: '2026-10-05T03:30:00', today: '2026-10-05' });
  });

  it('splits the window into week-long scheduler calls', () => {
    const chunks = weekChunks('2026-08-31', '2026-10-05');
    expect(chunks).toHaveLength(6);
    expect(chunks[0]).toEqual({ start: '2026-08-31T00:00:00', end: '2026-09-06T23:59:59' });
    expect(chunks[5]).toEqual({ start: '2026-10-05T00:00:00', end: '2026-10-05T23:59:59' });
  });
});

describe('refreshSitesMap', () => {
  it('mirrors the sites that have a brand id, and drops the ones that lost it', async () => {
    const db = makeD1();
    const adb = makeD1(ATTRIBUTION_MIGRATIONS);
    const site = (slug) => q.createSite(db, { slug, name: slug, live_url: `https://${slug}.test`, hosting: 'pages' }, 't');
    await site('ka-performance');
    await site('foremotion-golf');
    await site('mbs');
    await db.prepare("UPDATE sites SET metricool_brand_id = '7076479' WHERE slug = 'ka-performance'").run();
    await db.prepare("UPDATE sites SET metricool_brand_id = '7185142' WHERE slug = 'foremotion-golf'").run();

    expect(await refreshSitesMap(db, adb, 'now')).toEqual(['foremotion-golf', 'ka-performance']);
    const rows = (await adb.prepare('SELECT site_slug, metricool_brand_id, timezone FROM sites_map ORDER BY site_slug').all()).results;
    expect(rows).toEqual([
      { site_slug: 'foremotion-golf', metricool_brand_id: '7185142', timezone: 'America/New_York' },
      { site_slug: 'ka-performance', metricool_brand_id: '7076479', timezone: 'America/New_York' },
    ]);

    await db.prepare("UPDATE sites SET metricool_brand_id = NULL WHERE slug = 'foremotion-golf'").run();
    await db.prepare("UPDATE sites SET metricool_brand_id = '1' WHERE slug = 'ka-performance'").run();
    await refreshSitesMap(db, adb, 'later');
    expect((await adb.prepare('SELECT site_slug, metricool_brand_id, created_at FROM sites_map').all()).results)
      .toEqual([{ site_slug: 'ka-performance', metricool_brand_id: '1', created_at: 'now' }]);

    await db.prepare('UPDATE sites SET metricool_brand_id = NULL').run();
    expect(await refreshSitesMap(db, adb, 'x')).toEqual([]);
    expect(await adb.prepare('SELECT COUNT(*) AS n FROM sites_map').first('n')).toBe(0);
  });
});
