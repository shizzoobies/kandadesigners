import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import * as q from '../src/lib/db.js';
import * as desk from '../src/lib/desk.js';

const NOW = Date.parse('2026-10-05T16:00:00Z'); // noon Eastern, Oct 5
const HOUR = 3600000;
const iso = (ms) => new Date(ms).toISOString();
let db;

async function addItem(o) {
  const row = { list: 'approve', kind: 'reel', post_date: '2026-10-06', post_time: '10:00', title: 'T', ...o };
  const payload = o.payload ?? { id: row.item_id, date: row.post_date, kind: row.kind };
  await db.prepare('INSERT INTO desk_items (site_id, item_id, list, kind, post_date, post_time, title, payload, pushed_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(row.item_id, row.list, row.kind, row.post_date, row.post_time, row.title, JSON.stringify(payload), 't').run();
}

async function addDecision(itemId, decision, decidedAtMs, pulledAt = null, extra = {}) {
  await db.prepare('INSERT INTO desk_decisions (site_id, item_id, decision, answer, decided_at, pulled_at) VALUES (1, ?, ?, ?, ?, ?)')
    .bind(itemId, decision, extra.answer ?? '', iso(decidedAtMs), pulledAt).run();
}

function fakeBucket(keys) {
  const store = new Set(keys);
  return {
    store,
    async list({ prefix, cursor }) {
      // Two per page, with a key cursor, so deleting while listing is exercised.
      const all = [...store].filter((k) => k.startsWith(prefix) && (!cursor || k > cursor)).sort();
      const page = all.slice(0, 2);
      return { objects: page.map((key) => ({ key })), truncated: all.length > 2, cursor: all.length > 2 ? page[1] : undefined };
    },
    async delete(k) {
      for (const key of [].concat(k)) store.delete(key);
    },
  };
}

beforeEach(async () => {
  db = makeD1();
  await q.createSite(db, { slug: 'ka-performance', name: 'K & A', live_url: 'https://ka.test', hosting: 'pages' }, 't');
  await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Alex', 'alex@example.com', 'owner', 't')").run();
});

describe('0002_post_desk migration', () => {
  it('keys items by site, list and id, so a Story can sit in both lists', async () => {
    await addItem({ item_id: '2026-10-06-story', list: 'approve', kind: 'story' });
    await addItem({ item_id: '2026-10-06-story', list: 'stories', kind: 'story' });
    await expect(addItem({ item_id: '2026-10-06-story', list: 'stories', kind: 'story' })).rejects.toThrow();
  });

  it('defaults a decision to empty note, answers and answer', async () => {
    await db.prepare("INSERT INTO desk_decisions (site_id, item_id, decision, decided_at) VALUES (1, 'x', 'approved', 't')").run();
    expect(await db.prepare("SELECT note, answers, answer, pulled_at FROM desk_decisions WHERE item_id = 'x'").first())
      .toEqual({ note: '', answers: '{}', answer: '', pulled_at: null });
  });
});

describe('desk queries', () => {
  it('returns the state with payloads and answers parsed, in push order', async () => {
    await addItem({ item_id: '2026-10-07', payload: { id: '2026-10-07', media: [{ src: 'ka-performance/2026-10-07/a.mp4' }] } });
    await addItem({ item_id: '2026-10-06' });
    await db.prepare("INSERT INTO desk_decisions (site_id, item_id, decision, answers, decided_at) VALUES (1, '2026-10-07', 'changes', '{\"0\":\"Yes\"}', 't')").run();
    await db.prepare("INSERT INTO desk_story_checks (site_id, item_id, posted, checked_at) VALUES (1, '2026-10-06-story', 1, 't')").run();
    await db.prepare("INSERT INTO desk_meta (site_id, pushed_at, built_at, stories_paused) VALUES (1, 'p', 'b', 1)").run();
    const s = await desk.getDeskState(db, 1);
    expect(s.items.map((i) => i.item_id)).toEqual(['2026-10-07', '2026-10-06']);
    expect(s.items[0].payload.media[0].src).toBe('ka-performance/2026-10-07/a.mp4');
    expect(s.decisions[0]).toMatchObject({ item_id: '2026-10-07', decision: 'changes', answers: { 0: 'Yes' } });
    expect(s.checks[0]).toMatchObject({ item_id: '2026-10-06-story', posted: true });
    expect(s.meta).toMatchObject({ pushed_at: 'p', built_at: 'b', stories_paused: true });
  });

  it('knows whether a site has a desk', async () => {
    expect(await desk.hasDesk(db, 1)).toBe(false);
    await db.prepare("INSERT INTO desk_meta (site_id, pushed_at) VALUES (1, 'p')").run();
    expect(await desk.hasDesk(db, 1)).toBe(true);
  });

  it('saving a decision rewrites the row and clears pulled_at', async () => {
    await addItem({ item_id: '2026-10-06' });
    await addDecision('2026-10-06', 'approved', NOW - HOUR, 'pulled');
    const row = await desk.saveDecision(db, 1, { item_id: '2026-10-06', decision: 'waiting', note: '', answers: {}, answer: '' }, 1, iso(NOW));
    expect(row).toMatchObject({ item_id: '2026-10-06', decision: 'waiting', decided_by: 1, decided_at: iso(NOW), pulled_at: null });
  });

  it('saving a Story check clears pulled_at', async () => {
    await db.prepare("INSERT INTO desk_story_checks (site_id, item_id, posted, checked_at, pulled_at) VALUES (1, 's', 1, 't', 'pulled')").run();
    const row = await desk.saveCheck(db, 1, 's', false, 1, iso(NOW));
    expect(row).toMatchObject({ item_id: 's', posted: false, checked_by: 1, pulled_at: null });
  });
});

describe('decide and check bodies', () => {
  const post = { item_id: 'p', kind: 'reel' };
  const ask = { item_id: 'a', kind: 'ask' };

  it('accepts the three post decisions and caps lengths', () => {
    expect(desk.parseDecideBody({ item_id: 'p', decision: 'approved' }, post)).toMatchObject({ ok: true });
    expect(desk.parseDecideBody({ item_id: 'p', decision: 'changes', note: 'Shorter' }, post).values.note).toBe('Shorter');
    expect(desk.parseDecideBody({ item_id: 'p', decision: 'changes', note: 'x'.repeat(2001) }, post).ok).toBe(false);
    expect(desk.parseDecideBody({ item_id: 'p', decision: 'waiting', answers: { 0: 'x'.repeat(1001) } }, post).ok).toBe(false);
    expect(desk.parseDecideBody({ item_id: 'p', decision: 'waiting', answers: { 0: 'Yes' } }, post).values.answers).toEqual({ 0: 'Yes' });
  });

  it('rejects a decision outside the set, or the wrong one for the item', () => {
    expect(desk.parseDecideBody({ item_id: 'p', decision: 'published' }, post).ok).toBe(false);
    expect(desk.parseDecideBody({ item_id: 'p', decision: 'answered', answer: 'x' }, post).ok).toBe(false);
    expect(desk.parseDecideBody({ item_id: 'a', decision: 'approved' }, ask).ok).toBe(false);
    expect(desk.parseDecideBody({ item_id: 'n', decision: 'approved' }, { item_id: 'n', kind: 'native' }).ok).toBe(false);
  });

  it('needs a note for changes and an answer for an answered ask', () => {
    expect(desk.parseDecideBody({ item_id: 'p', decision: 'changes', note: '  ' }, post).ok).toBe(false);
    expect(desk.parseDecideBody({ item_id: 'a', decision: 'answered', answer: '' }, ask).ok).toBe(false);
    expect(desk.parseDecideBody({ item_id: 'a', decision: 'answered', answer: 'Tuesday' }, ask).values.answer).toBe('Tuesday');
    expect(desk.parseDecideBody({ item_id: 'a', decision: 'answered', answer: 'x'.repeat(1001) }, ask).ok).toBe(false);
  });

  it('rejects malformed answers', () => {
    expect(desk.parseDecideBody({ item_id: 'p', decision: 'waiting', answers: ['x'] }, post).ok).toBe(false);
    expect(desk.parseDecideBody({ item_id: 'p', decision: 'waiting', answers: { first: 'x' } }, post).ok).toBe(false);
    expect(desk.parseDecideBody({ item_id: 'p', decision: 'waiting', answers: { 0: 5 } }, post).ok).toBe(false);
  });

  it('takes posted as a boolean only', () => {
    expect(desk.parseCheckBody({ item_id: 's', posted: true })).toEqual({ ok: true, values: { item_id: 's', posted: true } });
    expect(desk.parseCheckBody({ item_id: 's', posted: 'yes' }).ok).toBe(false);
    expect(desk.parseCheckBody({ item_id: 's' }).ok).toBe(false);
  });
});

describe('purge selection', () => {
  const today = '2026-10-05';
  const sel = (items, decisions, checks = []) => desk.selectPurge({ items, decisions, checks, today, nowMs: NOW });
  const ids = (xs) => xs.map((x) => x.item_id);
  const item = (item_id, o = {}) => ({ item_id, list: 'approve', kind: 'reel', post_date: '2026-10-08', ...o });
  const dec = (item_id, decision, ageHours, pulled = true) => ({ item_id, decision, decided_at: iso(NOW - ageHours * HOUR), pulled_at: pulled ? 'x' : null });
  const chk = (item_id, ageHours, pulled = true) => ({ item_id, posted: true, checked_at: iso(NOW - ageHours * HOUR), pulled_at: pulled ? 'x' : null });

  it('purges rows and media dated before today, but never a decision Claude has not pulled', () => {
    const plan = sel([item('2026-10-04', { post_date: '2026-10-04' }), item('2026-10-05', { post_date: '2026-10-05' })], [dec('2026-10-04', 'waiting', 1, false)]);
    expect(plan.rows).toEqual([{ list: 'approve', item_id: '2026-10-04' }]);
    expect(plan.media).toEqual(['2026-10-04']);
    expect(plan.decisions).toEqual([]);
  });

  it('takes a past item\'s pulled decision with it, recording the state it was selected on', () => {
    const d = dec('2026-10-04', 'changes', 1);
    const plan = sel([item('2026-10-04', { post_date: '2026-10-04' })], [d]);
    expect(plan.decisions).toEqual([{ item_id: '2026-10-04', decided_at: d.decided_at, pulled: true }]);
  });

  it('keeps an unpulled Story tick when its past day purges', () => {
    const plan = sel([item('2026-10-01-story', { list: 'stories', kind: 'story', post_date: '2026-10-01' })], [], [chk('2026-10-01-story', 30, false)]);
    expect(plan.rows).toHaveLength(1);
    expect(plan.checks).toEqual([]);
  });

  it('clears orphan decisions and ticks once pulled', () => {
    const plan = sel([], [dec('gone', 'waiting', 1), dec('unread', 'approved', 1, false)], [chk('gone-story', 1), chk('unread-story', 1, false)]);
    expect(ids(plan.decisions)).toEqual(['gone']);
    expect(ids(plan.checks)).toEqual(['gone-story']);
  });

  it('clears orphans after 14 days even if never pulled', () => {
    const plan = sel([], [dec('old', 'approved', 14 * 24 + 1, false), dec('young', 'approved', 14 * 24 - 1, false)], [chk('old-story', 14 * 24 + 1, false)]);
    expect(plan.decisions).toEqual([{ item_id: 'old', decided_at: iso(NOW - (14 * 24 + 1) * HOUR), pulled: false }]);
    expect(ids(plan.checks)).toEqual(['old-story']);
  });

  it('keeps a decision or tick whose item is still on the desk, however old', () => {
    const plan = sel([item('a'), item('a-story', { list: 'stories', kind: 'story' })], [dec('a', 'changes', 24 * 20)], [chk('a-story', 24 * 20)]);
    expect(plan.decisions).toEqual([]);
    expect(plan.checks).toEqual([]);
  });

  it('purges an approval once pulled and more than 24 hours old', () => {
    const plan = sel([item('a')], [dec('a', 'approved', 25)]);
    expect(plan.rows).toEqual([{ list: 'approve', item_id: 'a' }]);
    expect(ids(plan.decisions)).toEqual(['a']);
  });

  it('keeps an approval Claude has not pulled yet', () => {
    expect(sel([item('a')], [dec('a', 'approved', 48, false)]).rows).toEqual([]);
  });

  it('keeps an approval under 24 hours old', () => {
    expect(sel([item('a')], [dec('a', 'approved', 23)]).rows).toEqual([]);
  });

  it('keeps change requests and waiting items with future dates', () => {
    expect(sel([item('a'), item('b')], [dec('a', 'changes', 48), dec('b', 'waiting', 48)]).rows).toEqual([]);
  });

  it('purges asks when answered, pulled and 24 hours old, and keeps them otherwise', () => {
    const ask = (id) => item(id, { kind: 'ask', post_date: null });
    const plan = sel([ask('q1'), ask('q2'), ask('q3'), ask('q4')], [
      dec('q1', 'answered', 25), dec('q2', 'answered', 25, false), dec('q3', 'answered', 2), dec('q4', 'waiting', 48),
    ]);
    expect(plan.rows).toEqual([{ list: 'approve', item_id: 'q1' }]);
  });

  it('keeps a Story on the checklist, and its image and tick, after its approval purges', () => {
    const plan = sel([
      item('2026-10-07-story', { kind: 'story', post_date: '2026-10-07' }),
      item('2026-10-07-story', { list: 'stories', kind: 'story', post_date: '2026-10-07' }),
    ], [dec('2026-10-07-story', 'approved', 30)], [chk('2026-10-07-story', 30)]);
    expect(plan.rows).toEqual([{ list: 'approve', item_id: '2026-10-07-story' }]);
    expect(ids(plan.decisions)).toEqual(['2026-10-07-story']);
    expect(plan.checks).toEqual([]);
    expect(plan.media).toEqual([]);
  });

  it('purges a past Story from both lists with its pulled tick', () => {
    const plan = sel([
      item('2026-10-01-story', { kind: 'story', post_date: '2026-10-01' }),
      item('2026-10-01-story', { list: 'stories', kind: 'story', post_date: '2026-10-01' }),
    ], [], [chk('2026-10-01-story', 30)]);
    expect(plan.rows).toHaveLength(2);
    expect(ids(plan.checks)).toEqual(['2026-10-01-story']);
    expect(plan.media).toEqual(['2026-10-01-story']);
  });
});

describe('purge', () => {
  const site = { id: 1, slug: 'ka-performance' };

  it('deletes rows, decisions, checks and every R2 object under the item prefix', async () => {
    await addItem({ item_id: '2026-10-01', post_date: '2026-10-01' });
    await addItem({ item_id: '2026-10-08', post_date: '2026-10-08' });
    await addDecision('2026-10-01', 'approved', NOW - HOUR, 'pulled');
    await db.prepare("INSERT INTO desk_story_checks (site_id, item_id, posted, checked_at, pulled_at) VALUES (1, '2026-10-01', 1, 't', 'pulled')").run();
    const bucket = fakeBucket([
      'ka-performance/2026-10-01/a.mp4', 'ka-performance/2026-10-01/b.png', 'ka-performance/2026-10-01/c.png',
      'ka-performance/2026-10-08/a.mp4', 'ka-performance/2026-10-01-story/x.png',
    ]);
    const plan = await desk.maybePurge({ db, bucket, site, nowMs: NOW, memo: new Map() });
    expect(plan.rows).toHaveLength(1);
    expect((await desk.getDeskState(db, 1)).items.map((i) => i.item_id)).toEqual(['2026-10-08']);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_decisions').first('n')).toBe(0);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_story_checks').first('n')).toBe(0);
    expect([...bucket.store].sort()).toEqual(['ka-performance/2026-10-01-story/x.png', 'ka-performance/2026-10-08/a.mp4']);
  });

  it('leaves unpulled decisions and ticks in place when their past day purges', async () => {
    await addItem({ item_id: '2026-10-01', post_date: '2026-10-01' });
    await addItem({ item_id: '2026-10-01-story', list: 'stories', kind: 'story', post_date: '2026-10-01' });
    await addDecision('2026-10-01', 'changes', NOW - HOUR);
    await db.prepare("INSERT INTO desk_story_checks (site_id, item_id, posted, checked_at) VALUES (1, '2026-10-01-story', 1, '2026-10-05T15:00:00.000Z')").run();
    await desk.maybePurge({ db, bucket: fakeBucket([]), site, nowMs: NOW, memo: new Map() });
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_items').first('n')).toBe(0);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_decisions').first('n')).toBe(1);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_story_checks').first('n')).toBe(1);
  });

  it('spares a decision Alex changed between selection and delete', async () => {
    await addDecision('gone', 'approved', NOW - HOUR, 'pulled');
    const plan = desk.selectPurge({ items: [], decisions: await desk.listDeskDecisions(db, 1), checks: [], today: '2026-10-05', nowMs: NOW });
    expect(plan.decisions).toHaveLength(1);
    await desk.saveDecision(db, 1, { item_id: 'gone', decision: 'waiting', note: '', answers: {}, answer: '' }, 1, iso(NOW));
    await desk.applyPurge(db, fakeBucket([]), site, plan);
    expect(await db.prepare('SELECT decision FROM desk_decisions').first('decision')).toBe('waiting');
  });

  it('spares a tick Alex changed between selection and delete', async () => {
    await db.prepare("INSERT INTO desk_story_checks (site_id, item_id, posted, checked_at, pulled_at) VALUES (1, 'gone-story', 1, '2026-10-05T15:00:00.000Z', 'pulled')").run();
    const plan = desk.selectPurge({ items: [], decisions: [], checks: await desk.listDeskChecks(db, 1), today: '2026-10-05', nowMs: NOW });
    expect(plan.checks).toHaveLength(1);
    await desk.saveCheck(db, 1, 'gone-story', false, 1, iso(NOW));
    await desk.applyPurge(db, fakeBucket([]), site, plan);
    expect(await db.prepare('SELECT posted FROM desk_story_checks').first('posted')).toBe(0);
  });

  it('runs at most once per 10 minutes per site', async () => {
    const memo = new Map();
    const bucket = fakeBucket([]);
    expect(await desk.maybePurge({ db, bucket, site, nowMs: NOW, memo })).not.toBeNull();
    expect(await desk.maybePurge({ db, bucket, site, nowMs: NOW + 9 * 60000, memo })).toBeNull();
    expect(await desk.maybePurge({ db, bucket, site: { id: 2, slug: 'other' }, nowMs: NOW + 9 * 60000, memo })).not.toBeNull();
    expect(await desk.maybePurge({ db, bucket, site, nowMs: NOW + 10 * 60000, memo })).not.toBeNull();
  });

  it('logs and carries on when the purge fails', async () => {
    const errors = [];
    const broken = { list: async () => { throw new Error('r2 down'); }, delete: async () => {} };
    await addItem({ item_id: '2026-10-01', post_date: '2026-10-01' });
    const plan = await desk.maybePurge({ db, bucket: broken, site, nowMs: NOW, memo: new Map(), log: { error: (...a) => errors.push(a) } });
    expect(plan).toBeNull();
    expect(errors).toHaveLength(1);
  });
});
