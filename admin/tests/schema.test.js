import { describe, it, expect } from 'vitest';
import { makeD1 } from './helpers/d1.js';

describe('migrations', () => {
  it('creates every table the app uses', async () => {
    const db = makeD1();
    const { results } = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
    expect(results.map((r) => r.name)).toEqual(
      ['alert_state', 'checks', 'desk_decisions', 'desk_items', 'desk_meta', 'desk_story_checks', 'log_entries', 'people', 'sites', 'work_items'],
    );
  });

  it('allows many manual work items but one row per GitHub key per site', async () => {
    const db = makeD1();
    await db.prepare("INSERT INTO sites (slug, name, live_url, created_at, updated_at) VALUES ('a', 'A', 'https://a.test', 't', 't')").run();
    const add = (key) => db.prepare("INSERT INTO work_items (site_id, source, text, github_key, created_at) VALUES (1, 'x', 'x', ?, 't')").bind(key).run();
    await add(null);
    await add(null);
    await add('pr:1');
    await expect(add('pr:1')).rejects.toThrow();
  });
});
