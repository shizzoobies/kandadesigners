import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import * as q from '../src/lib/db.js';
import { getDeskState } from '../src/lib/desk.js';
import { waitingCount } from '../src/lib/desk-pwa.js';
import {
  inQuiet, easternNow, validatePushPrefs, morningSummary, storiesReminder, storiesDue,
  pushNow, runDeskPush, listWaitingApprove, badgeFor, MOCK_PUSH_HOST,
} from '../src/lib/desk-push.js';
import { prefsForm, prefsBody, consumeViewParam, PREF_DEFAULTS } from '../src/lib/desk-push-ui.js';
import { mockTransport } from '../src/lib/web-push.js';
import { handlePush } from '../src/pages/sites/[slug]/social/push.js';
import { FIXTURE, stateOf, seedFixture, pageItems, STORY_ID } from './fixtures/desk-stories-fixture.js';

const P256 = 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4';
const AUTH = 'BTBZMqHH6r4Tts7J_aSIgg';
const ORIGIN = 'https://admin.ka-performancefl.com';
// Fake clock: Eastern wall time on a 2026 date, as a UTC instant. EDT is -4
// until Nov 1, EST -5 after (and before Mar 8).
const et = (date, hhmm) => {
  const off = (date >= '2026-03-08' && date < '2026-11-01') ? 4 : 5;
  const [h, m] = hhmm.split(':').map(Number);
  return Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10), h + off, m);
};
const night = { quiet_start: '21:00', quiet_end: '07:30' };

describe('easternNow', () => {
  it('reads Eastern wall time via Intl on both sides of each 2026 DST change', () => {
    expect(easternNow(Date.parse('2026-03-08T06:59:00Z'))).toEqual({ date: '2026-03-08', minutes: 1 * 60 + 59 }); // 1:59 EST
    expect(easternNow(Date.parse('2026-03-08T07:00:00Z'))).toEqual({ date: '2026-03-08', minutes: 3 * 60 }); // 3:00 EDT
    expect(easternNow(Date.parse('2026-11-01T05:30:00Z'))).toEqual({ date: '2026-11-01', minutes: 1 * 60 + 30 }); // 1:30 EDT
    expect(easternNow(Date.parse('2026-11-01T06:30:00Z'))).toEqual({ date: '2026-11-01', minutes: 1 * 60 + 30 }); // 1:30 EST again
    expect(easternNow(Date.parse('2026-10-14T03:59:00Z'))).toEqual({ date: '2026-10-13', minutes: 23 * 60 + 59 });
  });
});

describe('inQuiet', () => {
  it('same-day window [start, end)', () => {
    const s = { quiet_start: '12:00', quiet_end: '14:00' };
    expect(inQuiet(s, et('2026-10-13', '11:59'))).toBe(false);
    expect(inQuiet(s, et('2026-10-13', '12:00'))).toBe(true);
    expect(inQuiet(s, et('2026-10-13', '13:59'))).toBe(true);
    expect(inQuiet(s, et('2026-10-13', '14:00'))).toBe(false);
  });
  it('cross-midnight window and its edges', () => {
    expect(inQuiet(night, et('2026-10-13', '20:59'))).toBe(false);
    expect(inQuiet(night, et('2026-10-13', '21:00'))).toBe(true);
    expect(inQuiet(night, et('2026-10-13', '23:00'))).toBe(true);
    expect(inQuiet(night, et('2026-10-14', '00:00'))).toBe(true);
    expect(inQuiet(night, et('2026-10-14', '07:29'))).toBe(true);
    expect(inQuiet(night, et('2026-10-14', '07:30'))).toBe(false);
    expect(inQuiet(night, et('2026-10-14', '12:00'))).toBe(false);
  });
  it('null or one-sided means never quiet', () => {
    const t = et('2026-10-13', '23:00');
    expect(inQuiet({ quiet_start: null, quiet_end: null }, t)).toBe(false);
    expect(inQuiet({ quiet_start: '21:00', quiet_end: null }, t)).toBe(false);
    expect(inQuiet({}, t)).toBe(false);
    expect(inQuiet(null, t)).toBe(false);
  });
  it('equal start and end means never quiet', () => {
    const s = { quiet_start: '22:00', quiet_end: '22:00' };
    for (const h of ['00:00', '21:59', '22:00', '22:01']) expect(inQuiet(s, et('2026-10-13', h))).toBe(false);
  });
  it('spring forward, 2026-03-08: 7:35 EDT is out, though the same UTC hour a day earlier (6:35 EST) is in', () => {
    expect(inQuiet(night, Date.parse('2026-03-08T11:35:00Z'))).toBe(false); // 07:35 EDT
    expect(inQuiet(night, Date.parse('2026-03-07T11:35:00Z'))).toBe(true); // 06:35 EST
    expect(inQuiet(night, Date.parse('2026-03-08T11:29:00Z'))).toBe(true); // 07:29 EDT
    expect(inQuiet(night, Date.parse('2026-03-08T07:30:00Z'))).toBe(true); // 03:30 EDT
  });
  it('fall back, 2026-11-01: 7:35 EST is 12:35Z; 11:35Z is still 6:35 and quiet', () => {
    expect(inQuiet(night, Date.parse('2026-11-01T11:35:00Z'))).toBe(true); // 06:35 EST
    expect(inQuiet(night, Date.parse('2026-11-01T12:35:00Z'))).toBe(false); // 07:35 EST
    expect(inQuiet(night, Date.parse('2026-11-01T05:30:00Z'))).toBe(true); // 01:30 EDT
    expect(inQuiet(night, Date.parse('2026-11-01T06:30:00Z'))).toBe(true); // 01:30 EST
    expect(inQuiet(night, Date.parse('2026-11-02T01:59:00Z'))).toBe(false); // 20:59 EST Nov 1
    expect(inQuiet(night, Date.parse('2026-11-02T02:00:00Z'))).toBe(true); // 21:00 EST Nov 1
  });
});

describe('pushNow (DESK_PUSH_NOW)', () => {
  it('is honored only when ENVIRONMENT=development', () => {
    const iso = '2026-10-13T23:00:00-04:00';
    expect(pushNow({ ENVIRONMENT: 'development', DESK_PUSH_NOW: iso }, 5)).toBe(Date.parse(iso));
    expect(pushNow({ ENVIRONMENT: 'production', DESK_PUSH_NOW: iso }, 5)).toBe(5);
    expect(pushNow({ DESK_PUSH_NOW: iso }, 5)).toBe(5);
    expect(pushNow({ ENVIRONMENT: 'development', DESK_PUSH_NOW: 'nope' }, 5)).toBe(5);
  });
});

describe('page and push waitingCount agree on the Stories fixture', () => {
  it('same count from the page items and from listWaitingApprove', async () => {
    const db = await seedFixture(makeD1());
    const state = await getDeskState(db, 1, { owner: true });
    expect(state.items.some((i) => i.list === 'stories')).toBe(true);
    const page = waitingCount(pageItems(state), stateOf);
    const push = badgeFor(await listWaitingApprove(db, 1));
    expect(page).toBe(4);
    expect(push).toBe(page);
    expect(waitingCount(FIXTURE, stateOf)).toBe(page);
  });
});

describe('message helpers', () => {
  const site = { slug: 'ka-performance' };
  it('morningSummary: "N waiting on you", badge N, opens the first waiting item; null when nothing waits', () => {
    const rows = [{ item_id: 'a', title: 'A', kind: 'reel' }, { item_id: 'b', title: 'B', kind: 'ask' }];
    expect(morningSummary(site, rows)).toEqual({
      title: '2 waiting on you', body: 'A', url: '/sites/ka-performance/social?item=a', tag: 'desk-ka-performance', badge: 2,
    });
    expect(morningSummary(site, [])).toBeNull();
  });
  it('storiesReminder opens ?view=stories', () => {
    const m = storiesReminder(site, { badge: 3 });
    expect(m.title).toBe("Today's Story isn't posted yet");
    expect(m.url).toBe('/sites/ka-performance/social?view=stories');
    expect(m.badge).toBe(3);
  });
});

async function deskWithSubs(subs) {
  const db = await seedFixture(makeD1());
  for (const [name, prefs] of subs) {
    const endpoint = `https://${MOCK_PUSH_HOST}/${name}`;
    await q.upsertPushSub(db, { siteId: 1, personId: 1, endpoint, p256dh: P256, auth: AUTH, label: name }, 't');
    await q.setPushPrefs(db, endpoint, { quiet_start: null, quiet_end: null, stories_at: null, ...prefs });
  }
  return db;
}
const env = (db) => ({ DB: db, ENVIRONMENT: 'development' });
const run = async (db, when) => { const t = mockTransport(); const s = await runDeskPush(env(db), { now: when, transport: t }); return { t, s, pushes: t.sent.map((x) => ({ to: x.endpoint.split('/').pop(), ...JSON.parse(x.payload) })) }; };
const sentIds = async (db) => (await q.listPushSent(db, 1)).map((r) => r.item_id).sort();
const subRow = (db, name) => q.getPushSubByEndpoint(db, `https://${MOCK_PUSH_HOST}/${name}`);

describe('runDeskPush: quiet hours', () => {
  it('some devices quiet: the awake one is pushed, the quiet one held, and the items count as sent', async () => {
    const db = await deskWithSubs([['phone', night], ['laptop', {}]]);
    const { pushes, s } = await run(db, et('2026-10-13', '23:00'));
    expect(pushes.map((p) => p.to)).toEqual(['laptop']);
    expect(s.held).toBe(1);
    expect((await subRow(db, 'phone')).held_since).toBe(new Date(et('2026-10-13', '23:00')).toISOString());
    expect((await subRow(db, 'laptop')).held_since).toBeNull();
    expect(await sentIds(db)).toEqual(['ask-1', 'post-back', 'reel-wait', 'story-post']);
  });

  it('all devices quiet: nothing sent, not marked sent, held_since set once and kept, no fail_count', async () => {
    const db = await deskWithSubs([['phone', night], ['tablet', night]]);
    const r1 = await run(db, et('2026-10-13', '23:00'));
    expect(r1.pushes).toEqual([]);
    expect(await sentIds(db)).toEqual([]);
    const first = (await subRow(db, 'phone')).held_since;
    expect(first).toBeTruthy();
    const r2 = await run(db, et('2026-10-14', '02:00'));
    expect(r2.pushes).toEqual([]);
    expect((await subRow(db, 'phone')).held_since).toBe(first);
    expect((await subRow(db, 'phone')).fail_count).toBe(0);
    expect(await sentIds(db)).toEqual([]);
  });

  it('morning summary is sent once on the first run out of quiet hours, then held_since clears', async () => {
    const db = await deskWithSubs([['phone', night]]);
    await run(db, et('2026-10-13', '23:00'));
    expect((await run(db, et('2026-10-14', '07:25'))).pushes).toEqual([]);
    const m = await run(db, et('2026-10-14', '07:35'));
    expect(m.pushes).toHaveLength(1);
    expect(m.pushes[0]).toMatchObject({ to: 'phone', title: '4 waiting on you', badge: 4, url: '/sites/ka-performance/social?item=reel-wait' });
    expect((await subRow(db, 'phone')).held_since).toBeNull();
    expect(await sentIds(db)).toEqual(['ask-1', 'post-back', 'reel-wait', 'story-post']);
    expect((await run(db, et('2026-10-14', '07:40'))).pushes).toEqual([]);
    expect((await run(db, et('2026-10-14', '12:00'))).pushes).toEqual([]);
  });

  it('a morning summary that replaces new-item pushes marks those items sent, so the next run does not re-announce', async () => {
    const db = await deskWithSubs([['phone', night]]);
    await run(db, et('2026-10-13', '23:00'));
    // A new item lands overnight: still held, nothing marked.
    await db.prepare("INSERT INTO desk_items (site_id, item_id, list, kind, post_date, post_time, title, payload, pushed_at) VALUES (1, 'late-reel', 'approve', 'reel', '2026-10-16', '10:00', 'Late', '{}', 't')").run();
    expect((await run(db, et('2026-10-14', '03:00'))).pushes).toEqual([]);
    expect(await sentIds(db)).toEqual([]);
    const m = await run(db, et('2026-10-14', '07:35'));
    expect(m.pushes).toHaveLength(1);
    expect(m.pushes[0].title).toBe('5 waiting on you');
    expect(m.s.summaries).toBe(1);
    expect(await sentIds(db)).toEqual(['ask-1', 'late-reel', 'post-back', 'reel-wait', 'story-post']);
    const next = await run(db, et('2026-10-14', '07:40'));
    expect(next.pushes).toEqual([]);
    expect(next.s.announced).toBe(0);
  });

  it('summary skipped (held_since cleared silently) when nothing is waiting by morning', async () => {
    const db = await deskWithSubs([['phone', night]]);
    await run(db, et('2026-10-13', '23:00'));
    await db.prepare("UPDATE desk_decisions SET decision = 'approved' WHERE item_id = 'post-back'").run();
    for (const id of ['reel-wait', 'ask-1', 'story-post']) {
      await db.prepare("INSERT INTO desk_decisions (site_id, item_id, decision, note, decided_at) VALUES (1, ?, 'approved', '', 't')").bind(id).run();
    }
    const m = await run(db, et('2026-10-14', '07:35'));
    expect(m.pushes).toEqual([]);
    expect((await subRow(db, 'phone')).held_since).toBeNull();
  });
});

describe('runDeskPush: Stories reminder', () => {
  const stories = { stories_at: '10:00' };
  const mark = async (db) => { await q.markPushSent(db, 1, ['ask-1', 'post-back', 'reel-wait', 'story-post'], 't'); };

  it('fires once a day at or after stories_at, opening ?view=stories', async () => {
    const db = await deskWithSubs([['phone', stories]]);
    await mark(db);
    expect((await run(db, et('2026-10-14', '09:55'))).pushes).toEqual([]);
    const r = await run(db, et('2026-10-14', '10:05'));
    expect(r.pushes).toHaveLength(1);
    expect(r.pushes[0]).toMatchObject({ title: "Today's Story isn't posted yet", url: '/sites/ka-performance/social?view=stories', badge: 4 });
    expect((await subRow(db, 'phone')).stories_sent_on).toBe('2026-10-14');
    expect((await run(db, et('2026-10-14', '10:10'))).pushes).toEqual([]);
    expect((await run(db, et('2026-10-14', '18:00'))).pushes).toEqual([]);
  });

  it('skipped when today’s Story is ticked posted', async () => {
    const db = await deskWithSubs([['phone', stories]]);
    await mark(db);
    await db.prepare("INSERT INTO desk_story_checks (site_id, item_id, posted, checked_at) VALUES (1, ?, 1, 't')").bind(STORY_ID).run();
    expect((await run(db, et('2026-10-14', '10:05'))).pushes).toEqual([]);
  });

  it('skipped when Stories are paused', async () => {
    const db = await deskWithSubs([['phone', stories]]);
    await mark(db);
    await db.prepare('UPDATE desk_meta SET stories_paused = 1 WHERE site_id = 1').run();
    expect((await run(db, et('2026-10-14', '10:05'))).pushes).toEqual([]);
  });

  it('skipped when there is no Story today', async () => {
    const db = await deskWithSubs([['phone', stories]]);
    await mark(db);
    expect((await run(db, et('2026-10-15', '10:05'))).pushes).toEqual([]);
  });

  it('skipped in quiet hours, then sent on the first run after', async () => {
    const db = await deskWithSubs([['phone', { stories_at: '06:00', ...night }]]);
    await mark(db);
    expect((await run(db, et('2026-10-14', '06:05'))).pushes).toEqual([]);
    const r = await run(db, et('2026-10-14', '07:30'));
    expect(r.pushes.map((p) => p.title)).toEqual(["Today's Story isn't posted yet"]);
  });

  it('storiesDue is pure and checks each rule', () => {
    const t = et('2026-10-14', '10:05');
    const sub = { stories_at: '10:00', stories_sent_on: null };
    const story = { posted: 0 };
    expect(storiesDue(sub, t, { story, paused: false })).toBe(true);
    expect(storiesDue({ ...sub, stories_sent_on: '2026-10-14' }, t, { story, paused: false })).toBe(false);
    expect(storiesDue({ ...sub, stories_sent_on: '2026-10-13' }, t, { story, paused: false })).toBe(true);
    expect(storiesDue({ stories_at: null }, t, { story, paused: false })).toBe(false);
    expect(storiesDue(sub, t, { story: null, paused: false })).toBe(false);
    expect(storiesDue(sub, t, { story: { posted: 1 }, paused: false })).toBe(false);
    expect(storiesDue(sub, t, { story, paused: true })).toBe(false);
    expect(storiesDue(sub, et('2026-10-14', '09:59'), { story, paused: false })).toBe(false);
  });
});

describe('POST /push prefs', () => {
  const OWNER = { id: 1, name: 'Alex', email: 'alex@example.com', role: 'owner' };
  const VIEWER = { id: 2, name: 'Sam', email: 'sam@example.com', role: 'client', grants: [{ site_id: 1, slug: 'ka-performance', level: 'view' }] };
  const APPROVER = { id: 3, name: 'Pat', email: 'pat@example.com', role: 'client', grants: [{ site_id: 1, slug: 'ka-performance', level: 'approve' }] };
  let db;
  const call = (body, user = OWNER) => handlePush({
    db, env: env(db), slug: 'ka-performance', user, nowMs: et('2026-10-13', '14:00'),
    request: new Request(`${ORIGIN}/sites/ka-performance/social/push`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: ORIGIN }, body: JSON.stringify(body),
    }),
  });
  const mine = `https://${MOCK_PUSH_HOST}/mine`;
  const theirs = `https://${MOCK_PUSH_HOST}/theirs`;
  beforeEach(async () => {
    db = await seedFixture(makeD1());
    await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Sam', 'sam@example.com', 'client', 't')").run();
    await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Pat', 'pat@example.com', 'client', 't')").run();
    await db.prepare("INSERT INTO desk_access (person_id, site_id, level, granted_at) VALUES (2, 1, 'view', 't')").run();
    await db.prepare("INSERT INTO desk_access (person_id, site_id, level, granted_at) VALUES (3, 1, 'approve', 't')").run();
    await q.upsertPushSub(db, { siteId: 1, personId: 1, endpoint: mine, p256dh: P256, auth: AUTH, label: 'mine' }, 't');
    await q.upsertPushSub(db, { siteId: 1, personId: 3, endpoint: theirs, p256dh: P256, auth: AUTH, label: 'pat' }, 't');
  });

  it('saves HH:MM or null for the caller’s own device, and subscribe returns them', async () => {
    const r = await call({ action: 'prefs', endpoint: mine, quiet_start: '21:00', quiet_end: '07:30', stories_at: '10:00' });
    expect(r.status).toBe(200);
    expect(r.body.prefs).toEqual({ quiet_start: '21:00', quiet_end: '07:30', stories_at: '10:00' });
    const sub = await call({ action: 'subscribe', subscription: { endpoint: mine, keys: { p256dh: P256, auth: AUTH } } });
    expect(sub.body.prefs).toEqual({ quiet_start: '21:00', quiet_end: '07:30', stories_at: '10:00' });
    const off = await call({ action: 'prefs', endpoint: mine, quiet_start: null, quiet_end: null, stories_at: null });
    expect(off.body.prefs).toEqual({ quiet_start: null, quiet_end: null, stories_at: null });
  });

  it('turning quiet hours off clears a pending hold', async () => {
    await q.setPushHeld(db, mine, '2026-10-13T03:00:00.000Z');
    await call({ action: 'prefs', endpoint: mine, quiet_start: null, quiet_end: null, stories_at: null });
    expect((await q.getPushSubByEndpoint(db, mine)).held_since).toBeNull();
  });

  it('rejects bad times', async () => {
    for (const bad of ['9:00', '24:00', '21:60', '2100', '21:00:00', ' 21:00', 2100, true, {}, '']) {
      const r = await call({ action: 'prefs', endpoint: mine, quiet_start: bad, quiet_end: '07:30', stories_at: null });
      expect(r.status, JSON.stringify(bad)).toBe(400);
    }
    expect((await call({ action: 'prefs', endpoint: mine, quiet_start: null, quiet_end: null, stories_at: '7am' })).status).toBe(400);
    expect((await call({ action: 'prefs', endpoint: mine, quiet_start: '21:00', quiet_end: null, stories_at: null })).status).toBe(400);
    expect((await call({ action: 'prefs', quiet_start: null, quiet_end: null, stories_at: null })).status).toBe(400);
    expect((await q.getPushSubByEndpoint(db, mine)).quiet_start).toBeNull();
  });

  it('refuses someone else’s endpoint', async () => {
    const r = await call({ action: 'prefs', endpoint: theirs, quiet_start: '21:00', quiet_end: '07:30', stories_at: null });
    expect(r.status).toBe(404);
    expect((await q.getPushSubByEndpoint(db, theirs)).quiet_start).toBeNull();
    // and Pat can set his own
    expect((await call({ action: 'prefs', endpoint: theirs, quiet_start: '21:00', quiet_end: '07:30', stories_at: null }, APPROVER)).status).toBe(200);
  });

  it('gives a viewer 403', async () => {
    const r = await call({ action: 'prefs', endpoint: mine, quiet_start: '21:00', quiet_end: '07:30', stories_at: null }, VIEWER);
    expect(r.status).toBe(403);
  });

  it('validatePushPrefs accepts nulls and missing fields as null', () => {
    expect(validatePushPrefs({})).toEqual({ ok: true, prefs: { quiet_start: null, quiet_end: null, stories_at: null } });
    expect(validatePushPrefs({ quiet_start: '00:00', quiet_end: '23:59', stories_at: '10:00' }).ok).toBe(true);
  });
});

describe('settings form helpers', () => {
  it('off by default with spec defaults 9:00 PM to 7:30 AM and 10:00 AM', () => {
    expect(PREF_DEFAULTS).toEqual({ quiet_start: '21:00', quiet_end: '07:30', stories_at: '10:00' });
    expect(prefsForm(null, { hasStories: true })).toEqual({
      quietOn: false, quietStart: '21:00', quietEnd: '07:30', storiesShown: true, storiesOn: false, storiesAt: '10:00',
    });
  });
  it('shows saved values back, and hides the Stories reminder without Stories', () => {
    const f = prefsForm({ quiet_start: '22:15', quiet_end: '06:45', stories_at: '11:30' }, { hasStories: false });
    expect(f).toMatchObject({ quietOn: true, quietStart: '22:15', quietEnd: '06:45', storiesShown: false, storiesOn: false });
  });
  it('prefsBody round-trips and never sets a reminder without Stories', () => {
    const form = { quietOn: true, quietStart: '22:15', quietEnd: '06:45', storiesOn: true, storiesAt: '11:30' };
    expect(prefsBody(form, { hasStories: true })).toEqual({ quiet_start: '22:15', quiet_end: '06:45', stories_at: '11:30' });
    expect(prefsBody(form, { hasStories: false }).stories_at).toBeNull();
    expect(prefsBody({ ...form, quietOn: false }, { hasStories: true })).toMatchObject({ quiet_start: null, quiet_end: null });
  });
  it('consumeViewParam: ?view=stories means Stories and is stripped', () => {
    expect(consumeViewParam('https://x.test/sites/a/social?view=stories')).toEqual({ stories: true, url: '/sites/a/social' });
    expect(consumeViewParam('https://x.test/sites/a/social?item=b&view=stories#x')).toEqual({ stories: true, url: '/sites/a/social?item=b#x' });
    expect(consumeViewParam('https://x.test/sites/a/social?item=b')).toEqual({ stories: false, url: '/sites/a/social?item=b' });
  });
});
