import { describe, it, expect } from 'vitest';
import { makeD1 } from './helpers/d1.js';

describe('migrations', () => {
  it('creates every table the app uses', async () => {
    const db = makeD1();
    const { results } = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
    expect(results.map((r) => r.name)).toEqual(
      ['alert_state', 'checks', 'desk_access', 'desk_decisions', 'desk_items', 'desk_meta', 'desk_push_sent', 'desk_push_subs', 'desk_story_checks', 'log_entries', 'people', 'settings', 'sites', 'work_items'],
    );
  });

  it('0003 keys desk access by person and site, and drops it with either', async () => {
    const db = makeD1();
    await db.prepare("INSERT INTO sites (slug, name, live_url, created_at, updated_at) VALUES ('a', 'A', 'https://a.test', 't', 't')").run();
    await db.prepare("INSERT INTO sites (slug, name, live_url, created_at, updated_at) VALUES ('b', 'B', 'https://b.test', 't', 't')").run();
    await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('H', 'h@example.com', 'client', 't')").run();
    const grant = (site) => db.prepare("INSERT INTO desk_access (person_id, site_id, level, granted_at) VALUES (1, ?, 'approve', 't')").bind(site).run();
    await grant(1);
    await grant(2);
    await expect(grant(1)).rejects.toThrow();
    await expect(db.prepare("INSERT INTO desk_access (person_id, site_id, level, granted_at) VALUES (1, 99, 'view', 't')").run()).rejects.toThrow();
    await db.prepare('DELETE FROM sites WHERE id = 2').run();
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_access').first('n')).toBe(1);
    await db.prepare('DELETE FROM people WHERE id = 1').run();
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_access').first('n')).toBe(0);
  });

  it('0003 keeps one settings row per key', async () => {
    const db = makeD1();
    await db.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('access_group_id', 'g', 't')").run();
    await expect(db.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('access_group_id', 'h', 't')").run()).rejects.toThrow();
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

  it('0004 keys push sent by site and item, and drops subs with the person or site', async () => {
    const db = makeD1();
    await db.prepare("INSERT INTO sites (slug, name, live_url, created_at, updated_at) VALUES ('a', 'A', 'https://a.test', 't', 't')").run();
    await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('H', 'h@example.com', 'owner', 't')").run();
    const p256 = 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4';
    const auth = 'BTBZMqHH6r4Tts7J_aSIgg';
    await db.prepare('INSERT INTO desk_push_subs (site_id, person_id, endpoint, p256dh, auth, created_at) VALUES (1, 1, ?, ?, ?, ?)').bind('https://fcm.googleapis.com/fcm/send/x', p256, auth, 't').run();
    await db.prepare("INSERT INTO desk_push_sent (site_id, item_id, sent_at) VALUES (1, 'a', 't')").run();
    await expect(db.prepare("INSERT INTO desk_push_sent (site_id, item_id, sent_at) VALUES (1, 'a', 't')").run()).rejects.toThrow();
    await db.prepare('DELETE FROM people WHERE id = 1').run();
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_push_subs').first('n')).toBe(0);
    await db.prepare('DELETE FROM sites WHERE id = 1').run();
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_push_sent').first('n')).toBe(0);
  });
});
