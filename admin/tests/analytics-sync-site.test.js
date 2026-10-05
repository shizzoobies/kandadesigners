import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeD1, ATTRIBUTION_MIGRATIONS } from './helpers/d1.js';
import { fakeFetch } from './helpers/fetch.js';
import { metricoolHandler, IG_POST, YT_VIDEO, BY_ENDPOINT, timeline } from './fixtures/metricool.js';
import { syncSite, matchesProvider, sameUrl } from '../src/lib/analytics-sync.js';

const ENV = { METRICOOL_BASE: 'https://app.metricool.com/api', METRICOOL_USER_ID: '5465573', METRICOOL_USER_TOKEN: 'secret-123' };
const NOW = Date.parse('2026-10-05T07:30:00Z');
const KA = { site_slug: 'ka-performance', metricool_brand_id: '7076479', timezone: 'America/New_York' };
const quiet = () => ({ warn: vi.fn(), error: vi.fn(), log: vi.fn() });
let adb;

const run = (handler, over = {}) => syncSite({
  adb, site: KA, env: ENV, nowMs: NOW, fetchImpl: fakeFetch(handler), sleep: async () => {}, log: quiet(), clock: () => NOW + 1000, ...over,
});
const all = async (sql, ...args) => (await adb.prepare(sql).bind(...args).all()).results;

beforeEach(async () => {
  adb = makeD1(ATTRIBUTION_MIGRATIONS);
  await adb.prepare("INSERT INTO sites_map (site_slug, metricool_brand_id, timezone, created_at) VALUES ('ka-performance', '7076479', 'America/New_York', 't')").run();
  await adb.prepare("INSERT INTO publications (site_slug, campaign_id, network, metricool_id, kind, pillar, title, scheduled_at) VALUES ('ka-performance', '2026-10-02-3', 'linkedin', '383676038', 'linkedin', 'training', 'Course, job aid', '2026-10-02T08:00:00-04:00')").run();
});

describe('matchesProvider', () => {
  it('matches by id, by the _id suffix, or by URL, on the same network only', () => {
    expect(matchesProvider({ network: 'youtube', native_id: 'HopxcccH2Uw', url: null }, { network: 'youtube', id: 'HopxcccH2Uw' })).toBe(true);
    expect(matchesProvider({ network: 'facebook', native_id: '1239857262550754_122119960383423707', url: null }, { network: 'facebook', id: '122119960383423707' })).toBe(true);
    expect(matchesProvider({ network: 'instagram', native_id: '399_318', url: 'https://www.instagram.com/reel/Dd_tCCejNRj/' }, { network: 'instagram', id: 'https://instagram.com/reel/Dd_tCCejNRj' })).toBe(true);
    expect(matchesProvider({ network: 'facebook', native_id: 'HopxcccH2Uw', url: null }, { network: 'youtube', id: 'HopxcccH2Uw' })).toBe(false);
    expect(matchesProvider({ network: 'instagram', native_id: '1', url: null }, { network: 'instagram', id: '' })).toBe(false);
  });

  it('sameUrl ignores www and a trailing slash, and rejects non-URLs', () => {
    expect(sameUrl('https://www.x.test/a/', 'https://x.test/a')).toBe(true);
    expect(sameUrl('nope', 'nope')).toBe(false);
  });

  it('sameUrl keeps the query, so two watch URLs with different v= differ', () => {
    expect(sameUrl('https://www.youtube.com/watch?v=AAA', 'https://youtube.com/watch?v=BBB')).toBe(false);
    expect(sameUrl('https://www.youtube.com/watch?v=AAA', 'https://youtube.com/watch?v=AAA')).toBe(true);
  });
});

describe('syncSite', () => {
  it('writes every post with one snapshot dated today, and records the run', async () => {
    const r = await run(metricoolHandler());
    expect(r).toMatchObject({ ok: true, postsSeen: 6, errors: {} });
    expect(await adb.prepare('SELECT COUNT(*) AS n FROM posts').first('n')).toBe(6);
    expect(await all('SELECT DISTINCT as_of FROM post_metrics')).toEqual([{ as_of: '2026-10-05' }]);
    expect(await adb.prepare("SELECT published_at FROM posts WHERE native_id = '18000000000000001'").first('published_at')).toBe('2026-10-04T22:02:25.000Z');
    expect(await adb.prepare('SELECT networks FROM sites_map').first('networks')).toBe('facebook,instagram,linkedin,youtube');
    expect(await adb.prepare('SELECT site_slug, started_at, finished_at, trigger, ok, posts_seen, metrics_written, errors FROM sync_runs').first()).toEqual({
      site_slug: 'ka-performance', started_at: new Date(NOW).toISOString(), finished_at: new Date(NOW + 1000).toISOString(),
      trigger: 'cron', ok: 1, posts_seen: 6, metrics_written: 6, errors: null,
    });
  });

  it('replaces the same-day snapshot on a re-run instead of adding one', async () => {
    await run(metricoolHandler());
    await run(metricoolHandler({ byEndpoint: { ...BY_ENDPOINT, 'posts/instagram': [{ ...IG_POST, reach: 50 }] } }));
    expect(await adb.prepare('SELECT COUNT(*) AS n FROM post_metrics').first('n')).toBe(6);
    expect(await adb.prepare("SELECT reach FROM post_metrics WHERE native_id = '18000000000000001'").first('reach')).toBe(50);
  });

  it('stores Metricool ids from the scheduler and joins campaigns through publications', async () => {
    await run(metricoolHandler());
    const rows = await all('SELECT network, native_id, metricool_id, campaign_id FROM posts ORDER BY network, native_id');
    expect(rows).toEqual([
      { network: 'facebook', native_id: '1239857262550754_122119960383423707', metricool_id: '383676427', campaign_id: null },
      { network: 'facebook', native_id: '2085412555673873', metricool_id: '383675968', campaign_id: null },
      { network: 'instagram', native_id: '18000000000000001', metricool_id: null, campaign_id: null },
      { network: 'instagram', native_id: '3999113046320272483_31893145780', metricool_id: '383676002', campaign_id: null },
      { network: 'linkedin', native_id: 'urn:li:ugcPost:7511757516595363840', metricool_id: '383676038', campaign_id: '2026-10-02-3' },
      { network: 'youtube', native_id: 'HopxcccH2Uw', metricool_id: '383688294', campaign_id: null },
    ]);
  });

  it('logs a failing network, keeps its old rows, and still writes the others', async () => {
    await adb.prepare("INSERT INTO posts (site_slug, network, native_id) VALUES ('ka-performance', 'facebook', 'old')").run();
    await adb.prepare("INSERT INTO post_metrics (site_slug, network, native_id, as_of, reach) VALUES ('ka-performance', 'facebook', 'old', '2026-10-04', 9)").run();
    const r = await run(metricoolHandler({ fail: { 'v2/analytics/posts/facebook': { status: 500, body: 'boom secret-123' } } }));
    expect(r.ok).toBe(false);
    expect(r.errors.facebook).toBe('posts/facebook: v2/analytics/posts/facebook returned 500: boom <token>');
    expect(await adb.prepare("SELECT reach FROM post_metrics WHERE native_id = 'old'").first('reach')).toBe(9);
    expect(await adb.prepare("SELECT COUNT(*) AS n FROM posts WHERE network = 'instagram'").first('n')).toBe(2);
    expect(await adb.prepare("SELECT COUNT(*) AS n FROM posts WHERE native_id = '2085412555673873'").first('n')).toBe(1);
    const saved = await adb.prepare('SELECT ok, errors FROM sync_runs').first();
    expect(saved.ok).toBe(0);
    expect(saved.errors).not.toContain('secret-123');
    expect(JSON.parse(saved.errors)).toEqual(r.errors);
  });

  it('records a missing token without calling Metricool', async () => {
    const f = fakeFetch(metricoolHandler());
    const r = await syncSite({ adb, site: KA, env: { ...ENV, METRICOOL_USER_TOKEN: '' }, nowMs: NOW, fetchImpl: f, log: quiet() });
    expect(r.errors).toEqual({ site: 'METRICOOL_USER_TOKEN is not set' });
    expect(f.calls).toHaveLength(0);
  });

  it('records a brand Metricool does not know', async () => {
    const r = await run(metricoolHandler(), { site: { ...KA, metricool_brand_id: '999' } });
    expect(r.errors).toEqual({ site: 'brand not found' });
  });

  it('asks only for the networks the brand has connected', async () => {
    await adb.prepare("INSERT INTO sites_map (site_slug, metricool_brand_id, timezone, created_at) VALUES ('foremotion-golf', '7185142', 'America/New_York', 't')").run();
    const f = fakeFetch(metricoolHandler());
    await syncSite({ adb, site: { site_slug: 'foremotion-golf', metricool_brand_id: '7185142', timezone: 'America/New_York' }, env: ENV, nowMs: NOW, fetchImpl: f, log: quiet() });
    const paths = f.calls.map((c) => c.url.pathname);
    expect(paths.some((p) => p.includes('linkedin') || p.includes('youtube'))).toBe(false);
    expect(f.calls.filter((c) => c.url.searchParams.get('network') === 'linkedin')).toHaveLength(0);
    expect(paths).toContain('/api/v2/analytics/reels/facebook');
  });

  it('writes account days, and only logs a timeline Metricool refuses', async () => {
    const log = quiet();
    const r = await run(metricoolHandler({
      timelines: {
        'instagram/followers': { body: timeline('followers', [{ dateTime: '2026-10-03T12:00:00+0200', value: 2 }, { dateTime: '2026-10-04T12:00:00+0200', value: 3 }]) },
        'instagram/reach': { status: 400, body: '{"detail":"Invalid field"}' },
      },
    }), { log });
    expect(r.ok).toBe(true);
    expect(await all("SELECT day, followers, followers_delta, reach FROM account_daily WHERE network = 'instagram' ORDER BY day")).toEqual([
      { day: '2026-10-03', followers: 2, followers_delta: null, reach: null },
      { day: '2026-10-04', followers: 3, followers_delta: 1, reach: null },
    ]);
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn.mock.calls[0][0]).toContain('instagram reach');
  });

  it('links only the YouTube video whose watch URL matches, not every video', async () => {
    const second = { ...YT_VIDEO, videoId: 'ZZZ', watchUrl: 'https://www.youtube.com/watch?v=ZZZ' };
    await run(metricoolHandler({ byEndpoint: { ...BY_ENDPOINT, 'posts/youtube': [YT_VIDEO, second] } }));
    expect(await all("SELECT native_id, metricool_id FROM posts WHERE network = 'youtube' ORDER BY native_id")).toEqual([
      { native_id: 'HopxcccH2Uw', metricool_id: '383688294' },
      { native_id: 'ZZZ', metricool_id: null },
    ]);
  });

  it('keeps stored account numbers when the window moves past them', async () => {
    const series = (points) => ({ 'instagram/followers': { body: timeline('followers', points) } });
    await run(metricoolHandler({ timelines: series([{ dateTime: '2026-10-03T12:00:00+0200', value: 2 }, { dateTime: '2026-10-04T12:00:00+0200', value: 3 }]) }));
    await run(metricoolHandler({ timelines: series([{ dateTime: '2026-10-04T12:00:00+0200', value: 3 }, { dateTime: '2026-10-05T12:00:00+0200', value: 4 }]) }));
    expect(await all("SELECT day, followers, followers_delta FROM account_daily WHERE network = 'instagram' ORDER BY day")).toEqual([
      { day: '2026-10-03', followers: 2, followers_delta: null },
      { day: '2026-10-04', followers: 3, followers_delta: 1 },
      { day: '2026-10-05', followers: 4, followers_delta: 1 },
    ]);
  });

  it('keeps a stored account metric when its timeline fails on a later run', async () => {
    const followers = { 'instagram/followers': { body: timeline('followers', [{ dateTime: '2026-10-04T12:00:00+0200', value: 3 }]) } };
    await run(metricoolHandler({ timelines: { ...followers, 'instagram/reach': { body: timeline('reach', [{ dateTime: '2026-10-04T12:00:00+0200', value: 7 }]) } } }));
    expect(await adb.prepare("SELECT reach FROM account_daily WHERE network = 'instagram' AND day = '2026-10-04'").first('reach')).toBe(7);
    await run(metricoolHandler({ timelines: { ...followers, 'instagram/reach': { status: 500, body: 'boom' } } }));
    expect(await adb.prepare("SELECT reach FROM account_daily WHERE network = 'instagram' AND day = '2026-10-04'").first('reach')).toBe(7);
  });

  it('keeps a stored post field when a later reply leaves it out', async () => {
    await run(metricoolHandler());
    const before = await adb.prepare("SELECT url FROM posts WHERE native_id = '18000000000000001'").first('url');
    expect(before).toBe('https://www.instagram.com/p/AAA111/');
    await run(metricoolHandler({ byEndpoint: { ...BY_ENDPOINT, 'posts/instagram': [{ ...IG_POST, url: undefined }] } }));
    expect(await adb.prepare("SELECT url FROM posts WHERE native_id = '18000000000000001'").first('url')).toBe(before);
  });
});
