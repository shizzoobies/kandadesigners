import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1, ATTRIBUTION_MIGRATIONS } from './helpers/d1.js';
import * as a from '../src/lib/analytics.js';

const SLUG = 'ka-performance';
const TZ = 'America/New_York';
let adb;

beforeEach(async () => {
  adb = makeD1(ATTRIBUTION_MIGRATIONS);
  await adb.prepare("INSERT INTO sites_map (site_slug, metricool_brand_id, timezone, networks, created_at) VALUES (?, '7076479', ?, 'facebook,instagram', 't')").bind(SLUG, TZ).run();
  const post = (network, id, published, campaign, title) => adb.prepare('INSERT INTO posts (site_slug, network, native_id, campaign_id, url, published_at, title, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(SLUG, network, id, campaign, `https://x.test/${id}`, published, title, 'REEL').run();
  await post('instagram', 'ig1', '2026-10-05T14:10:00.000Z', '2026-10-05-6', 'Kai');
  await post('facebook', 'fb1', '2026-10-05T14:10:00.000Z', '2026-10-05-6', 'Kai');
  await post('instagram', 'ig2', '2026-10-01T13:00:00.000Z', null, 'Native one');
  await post('instagram', 'old', '2026-08-01T13:00:00.000Z', null, 'Too old');
  for (const network of ['instagram', 'facebook']) {
    await adb.prepare("INSERT INTO publications (site_slug, campaign_id, network, metricool_id, kind, pillar, title) VALUES (?, '2026-10-05-6', ?, '1', 'reel', 'ai', 'Kai')").bind(SLUG, network).run();
  }
  const m = (network, id, asOf, reach, interactions, clicks = null) => adb.prepare('INSERT INTO post_metrics (site_slug, network, native_id, as_of, reach, views, interactions, clicks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(SLUG, network, id, asOf, reach, reach, interactions, clicks).run();
  await m('instagram', 'ig1', '2026-10-05', 10, 2);
  await m('instagram', 'ig1', '2026-10-06', 20, 4);
  await m('facebook', 'fb1', '2026-10-06', 100, 6, 3);
  await m('instagram', 'ig2', '2026-10-06', 30, null);
  await m('instagram', 'old', '2026-10-06', 999, 999);
  const day = (network, d, followers, reach, interactions) => adb.prepare('INSERT INTO account_daily (site_slug, network, day, followers, reach, interactions) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(SLUG, network, d, followers, reach, interactions).run();
  await day('instagram', '2026-09-30', 2, 4, 1);
  await day('instagram', '2026-10-06', 5, 6, null);
  await day('facebook', '2026-10-06', 9, null, 7);
});

const rowsFor = async (days = 28) => a.postRows(adb, SLUG, a.rangeBounds(await a.latestAsOf(adb, SLUG), days), TZ);
const byId = (rows) => Object.fromEntries(rows.map((r) => [r.native_id, r]));

describe('range', () => {
  it('picks 7, 28 or 90 days, defaulting to 28', () => {
    expect(a.pickRange('7')).toBe(7);
    expect(a.pickRange('90')).toBe(90);
    expect(a.pickRange('30')).toBe(28);
    expect(a.pickRange(null)).toBe(28);
  });

  it('ends at the latest snapshot', async () => {
    expect(await a.latestAsOf(adb, SLUG)).toBe('2026-10-06');
    expect(a.rangeBounds('2026-10-06', 28)).toEqual({ start: '2026-09-09', end: '2026-10-06' });
  });

  it('reads the connected networks from the map', async () => {
    expect(a.networksOf(await a.getSiteMap(adb, SLUG))).toEqual(['facebook', 'instagram']);
    expect(a.networksOf({ networks: 'facebook,tiktok' })).toEqual(['facebook']);
    expect(a.networksOf(null)).toEqual([]);
  });
});

describe('postRows', () => {
  it('lists posts published in the range with their latest snapshot', async () => {
    const rows = byId(await rowsFor());
    expect(Object.keys(rows).sort()).toEqual(['fb1', 'ig1', 'ig2']);
    expect(rows.ig1).toMatchObject({ reach: 20, interactions: 4, as_of: '2026-10-06', kind: 'reel', pillar: 'ai', title: 'Kai' });
    expect(rows.ig1.slot.label).toBe('Mon 10 AM');
  });

  it('shows a post the pipeline never pushed as native', async () => {
    const rows = byId(await rowsFor());
    expect(rows.ig2).toMatchObject({ kind: 'native', pillar: 'native' });
    expect(rows.ig2.slot.label).toBe('Thu 9 AM');
  });

  it('respects a shorter range', async () => {
    expect((await rowsFor(7)).map((r) => r.native_id).sort()).toEqual(['fb1', 'ig1', 'ig2']);
    const bounds = a.rangeBounds('2026-10-06', 3);
    expect((await a.postRows(adb, SLUG, bounds, TZ)).map((r) => r.native_id).sort()).toEqual(['fb1', 'ig1']);
  });
});

describe('dataSince', () => {
  it('returns the first snapshot day for the site, or null', async () => {
    expect(await a.dataSince(adb, SLUG)).toBe('2026-10-05');
    expect(await a.dataSince(adb, 'nope')).toBeNull();
  });
});

describe('postRows pillar and boundary', () => {
  it('shows a pipeline post whose publication has no pillar as unset', async () => {
    await adb.prepare('INSERT INTO posts (site_slug, network, native_id, campaign_id, url, published_at, title, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(SLUG, 'instagram', 'np1', '2026-10-04', 'https://x.test/np1', '2026-10-04T14:00:00.000Z', 'No pillar', 'REEL').run();
    await adb.prepare("INSERT INTO publications (site_slug, campaign_id, network, metricool_id, kind, pillar, title) VALUES (?, '2026-10-04', 'instagram', '2', 'reel', NULL, 'No pillar')").bind(SLUG).run();
    await adb.prepare('INSERT INTO post_metrics (site_slug, network, native_id, as_of, reach) VALUES (?, ?, ?, ?, ?)').bind(SLUG, 'instagram', 'np1', '2026-10-06', 5).run();
    const rows = byId(await rowsFor());
    expect(rows.np1).toMatchObject({ pillar: 'unset', kind: 'reel' });
  });

  it('includes the first instant of a local day and excludes the last instant before it', async () => {
    for (const [id, at] of [['edge-out', '2026-10-06T03:59:59.999Z'], ['edge-in', '2026-10-06T04:00:00.000Z']]) {
      await adb.prepare('INSERT INTO posts (site_slug, network, native_id, campaign_id, url, published_at, title, type) VALUES (?, ?, ?, NULL, ?, ?, ?, ?)')
        .bind(SLUG, 'instagram', id, `https://x.test/${id}`, at, id, 'REEL').run();
      await adb.prepare('INSERT INTO post_metrics (site_slug, network, native_id, as_of, reach) VALUES (?, ?, ?, ?, ?)').bind(SLUG, 'instagram', id, '2026-10-06', 1).run();
    }
    const ids = (await a.postRows(adb, SLUG, { start: '2026-10-06', end: '2026-10-06' }, TZ)).map((r) => r.native_id);
    expect(ids).toContain('edge-in');
    expect(ids).not.toContain('edge-out');
  });
});

describe('sorting and panels', () => {
  it('sorts by a numeric column with missing values last, and ignores other keys', async () => {
    const rows = await rowsFor();
    expect(a.sortRows(rows, 'reach', 'asc').map((r) => r.native_id)).toEqual(['ig1', 'ig2', 'fb1']);
    expect(a.sortRows(rows, 'reach', 'desc').map((r) => r.native_id)).toEqual(['fb1', 'ig2', 'ig1']);
    expect(a.sortRows(rows, 'interactions', 'desc').map((r) => r.native_id)).toEqual(['fb1', 'ig1', 'ig2']);
    expect(a.sortRows(rows, 'title', 'asc')).toBe(rows);
  });

  it('averages by kind, slot and pillar with the count behind each', async () => {
    const p = a.panels(await rowsFor());
    expect(p.kind).toEqual([{ key: 'reel', count: 2, reach: 60, interactions: 5 }, { key: 'native', count: 1, reach: 30, interactions: null }]);
    expect(p.slot.map((g) => [g.key, g.count])).toEqual([['Mon 10 AM', 2], ['Thu 9 AM', 1]]);
    expect(p.pillar.map((g) => g.key)).toEqual(['ai', 'native']);
  });
});

describe('cards, reach and freshness', () => {
  it('builds one card per connected network', async () => {
    const bounds = a.rangeBounds('2026-10-06', 28);
    const cards = await a.networkCards(adb, SLUG, ['facebook', 'instagram'], bounds, await rowsFor());
    expect(cards).toEqual([
      { network: 'facebook', label: 'Facebook', followers: 9, change: null, followersFrom: '2026-10-06', followersTo: '2026-10-06', reach: 100, reachSource: 'posts', interactions: 7, interactionsSource: 'account', reachDays: 0, interactionsDays: 1, clicks: 3, posts: 1 },
      { network: 'instagram', label: 'Instagram', followers: 5, change: 3, followersFrom: '2026-09-30', followersTo: '2026-10-06', reach: 10, reachSource: 'account', interactions: 1, interactionsSource: 'account', reachDays: 2, interactionsDays: 1, clicks: null, posts: 2 },
    ]);
  });

  it('sets a source of null when a total is missing', async () => {
    const cards = await a.networkCards(adb, SLUG, ['linkedin'], a.rangeBounds('2026-10-06', 28), await rowsFor());
    expect(cards[0]).toMatchObject({ reach: null, reachSource: null, interactions: null, interactionsSource: null, reachDays: 0, interactionsDays: 0, followersFrom: null, followersTo: null });
  });

  it('gives account reach per day for the sparkline', async () => {
    expect(await a.reachSeries(adb, SLUG, a.rangeBounds('2026-10-06', 28))).toEqual([4, 6]);
  });

  it('draws the sparkline from Instagram only, never summing networks', async () => {
    await adb.prepare('INSERT INTO account_daily (site_slug, network, day, followers, reach, interactions) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(SLUG, 'facebook', '2026-10-05', 8, 50, null).run();
    expect(await a.reachSeries(adb, SLUG, a.rangeBounds('2026-10-06', 28))).toEqual([4, 6]);
  });

  it('reports the last finished run per network', async () => {
    expect((await a.freshness(adb, SLUG, ['instagram'])).lines).toEqual([{ network: 'instagram', label: 'Instagram', ok: null, error: null }]);
    await adb.prepare("INSERT INTO sync_runs (site_slug, started_at, finished_at, trigger, ok, errors) VALUES (?, '2026-10-06T07:30:00Z', '2026-10-06T07:31:00Z', 'cron', 0, ?)")
      .bind(SLUG, JSON.stringify({ facebook: 'posts/facebook: returned 500', scheduler: 'timeout' })).run();
    await adb.prepare("INSERT INTO sync_runs (site_slug, started_at, trigger) VALUES (?, '2026-10-06T09:00:00Z', 'manual')").bind(SLUG).run();
    const f = await a.freshness(adb, SLUG, ['facebook', 'instagram']);
    expect(f).toMatchObject({ at: '2026-10-06T07:31:00Z', trigger: 'cron', siteError: null, other: 'Matching posts to the pipeline: timeout' });
    expect(f.lines).toEqual([
      { network: 'facebook', label: 'Facebook', ok: false, error: 'posts/facebook: returned 500' },
      { network: 'instagram', label: 'Instagram', ok: true, error: null },
    ]);
  });

  it('marks every network when the whole site failed', async () => {
    await adb.prepare("INSERT INTO sync_runs (site_slug, started_at, finished_at, trigger, ok, errors) VALUES (?, 's', 'f', 'cron', 0, ?)").bind(SLUG, JSON.stringify({ site: 'brand not found' })).run();
    const f = await a.freshness(adb, SLUG, ['instagram']);
    expect(f.siteError).toBe('brand not found');
    expect(f.lines[0]).toMatchObject({ ok: false, error: 'brand not found' });
  });
});
