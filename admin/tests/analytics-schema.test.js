import { describe, it, expect } from 'vitest';
import { makeD1, ATTRIBUTION_MIGRATIONS } from './helpers/d1.js';

describe('ka-attribution migrations', () => {
  it('creates the Layer 1 tables', async () => {
    const db = makeD1(ATTRIBUTION_MIGRATIONS);
    const { results } = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
    expect(results.map((r) => r.name)).toEqual(['account_daily', 'post_metrics', 'posts', 'publications', 'sites_map', 'sync_runs']);
  });

  it('keeps one snapshot per post per day', async () => {
    const db = makeD1(ATTRIBUTION_MIGRATIONS);
    const ins = () => db.prepare("INSERT INTO post_metrics (site_slug, network, native_id, as_of, reach) VALUES ('ka', 'instagram', '1', '2026-10-05', 3)").run();
    await ins();
    await expect(ins()).rejects.toThrow();
  });

  it('keeps one publication per folder and network, and one account row per day', async () => {
    const db = makeD1(ATTRIBUTION_MIGRATIONS);
    const pub = () => db.prepare("INSERT INTO publications (site_slug, campaign_id, network, metricool_id, kind) VALUES ('ka', '2026-10-05-6', 'facebook', '1', 'reel')").run();
    await pub();
    await expect(pub()).rejects.toThrow();
    const day = () => db.prepare("INSERT INTO account_daily (site_slug, network, day, views) VALUES ('ka', 'youtube', '2026-10-05', 5)").run();
    await day();
    await expect(day()).rejects.toThrow();
  });

  it('records a sync run with per-network errors', async () => {
    const db = makeD1(ATTRIBUTION_MIGRATIONS);
    const r = await db.prepare("INSERT INTO sync_runs (site_slug, started_at, trigger) VALUES ('ka', 't', 'cron')").run();
    await db.prepare("UPDATE sync_runs SET finished_at = 'u', ok = 0, errors = ? WHERE id = ?").bind('{"facebook":"x"}', r.meta.last_row_id).run();
    expect(await db.prepare('SELECT posts_seen, metrics_written, errors FROM sync_runs').first()).toEqual({ posts_seen: 0, metrics_written: 0, errors: '{"facebook":"x"}' });
  });
});
