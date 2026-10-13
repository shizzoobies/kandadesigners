import { describe, it, expect } from 'vitest';
import vm from 'node:vm';
import { makeD1 } from './helpers/d1.js';
import * as q from '../src/lib/db.js';
import { waitingCount, swipeIntent, swipeThreshold, swipeAxis } from '../src/lib/desk-pwa.js';
import { pushMessage, listWaitingApprove, badgeFor, runDeskPush, MOCK_PUSH_HOST } from '../src/lib/desk-push.js';
import { pushUiState } from '../src/lib/desk-push-ui.js';
import { mockTransport } from '../src/lib/web-push.js';
import { GET as swRoute } from '../src/pages/sites/[slug]/social/sw.js.js';

// One fixture (with a Stories-checklist entry), read by the page rule and by
// the server's push SQL. Shared with slice 6: tests/fixtures/desk-stories-fixture.js.
import { FIXTURE, stateOf, seedFixture } from './fixtures/desk-stories-fixture.js';

const PHONE_FINGER = { startX: 200, startY: 300, width: 390 };

describe('waitingCount', () => {
  it('counts waiting approve items: asks and Story-posts in; approved, changes, native, Stories checklist out', () => {
    expect(waitingCount(FIXTURE, stateOf)).toBe(4); // reel-wait, post-back, ask-1, story-post
  });
  it('approved and changes do not count', () => {
    expect(waitingCount([FIXTURE[1], FIXTURE[2]], stateOf)).toBe(0);
  });
  it('an ask counts until answered', () => {
    expect(waitingCount([FIXTURE[4]], stateOf)).toBe(1);
    expect(waitingCount([{ ...FIXTURE[4], decision: 'approved' }], stateOf)).toBe(0);
  });
  it('native never counts, even if stateOf said waiting', () => {
    expect(waitingCount([FIXTURE[5]], () => 'waiting')).toBe(0);
  });
  it('the Stories checklist never counts', () => {
    expect(waitingCount([FIXTURE[7]], () => 'waiting')).toBe(0);
  });
  it('page items without a list field are approve items', () => {
    expect(waitingCount([{ id: 'x', kind: 'reel' }, { id: 'y', type: 'ask' }], () => 'waiting')).toBe(2);
  });
  it('an empty desk is 0', () => {
    expect(waitingCount([], stateOf)).toBe(0);
    expect(waitingCount(undefined, stateOf)).toBe(0);
  });
});

async function fixtureDb() {
  return seedFixture(makeD1());
}

describe('pushMessage badge', () => {
  it('equals waitingCount on the shared fixture (server SQL and page rule agree)', async () => {
    const db = await fixtureDb();
    const rows = await listWaitingApprove(db, 1);
    const expected = waitingCount(FIXTURE, stateOf);
    expect(badgeFor(rows)).toBe(expected);
    const m = pushMessage({ slug: 'ka-performance' }, rows.slice(0, 1), { badge: badgeFor(rows) });
    expect(m.badge).toBe(expected);
  });

  it('runDeskPush sends badge = waiting count for the site', async () => {
    const db = await fixtureDb();
    await q.upsertPushSub(db, {
      siteId: 1, personId: 1, endpoint: `https://${MOCK_PUSH_HOST}/dev`,
      p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg', label: 'dev',
    }, 't');
    const t = mockTransport();
    await runDeskPush({ DB: db, ENVIRONMENT: 'development' }, { now: Date.parse('2026-10-05T16:00:00Z'), transport: t });
    expect(t.sent).toHaveLength(1);
    expect(JSON.parse(t.sent[0].payload).badge).toBe(waitingCount(FIXTURE, stateOf));
  });

  it('adds no count to the notification text', () => {
    const m = pushMessage({ slug: 's' }, [{ item_id: 'a', title: 'Tempo squats' }], { badge: 7 });
    expect(m.title).toBe('Waiting on you');
    expect(m.body).toBe('Tempo squats');
    expect(JSON.stringify([m.title, m.body])).not.toContain('7');
  });
});

describe('swipeIntent', () => {
  const at = (dx, dy = 0, o = {}) => swipeIntent({ ...PHONE_FINGER, x: PHONE_FINGER.startX + dx, y: PHONE_FINGER.startY + dy, ...o });

  it('ignores a start within 24px of the left or right edge', () => {
    expect(swipeIntent({ startX: 10, startY: 300, x: 300, y: 300, width: 390 })).toBeNull();
    expect(swipeIntent({ startX: 23.9, startY: 300, x: 300, y: 300, width: 390 })).toBeNull();
    expect(swipeIntent({ startX: 380, startY: 300, x: 100, y: 300, width: 390 })).toBeNull();
    expect(swipeIntent({ startX: 24, startY: 300, x: 300, y: 300, width: 390 })).toBe('approve');
  });
  it('under the threshold snaps back (null)', () => {
    expect(at(116)).toBeNull(); // 30% of 390 = 117
    expect(at(-50)).toBeNull();
  });
  it('vertical-dominant is a scroll', () => {
    expect(at(130, 140)).toBeNull();
    expect(swipeAxis(3, 12)).toBe('y');
    expect(swipeAxis(4, 4)).toBeNull(); // not locked under 10px
  });
  it('a locked vertical axis stays dead even if the finger then goes sideways', () => {
    expect(at(200, 5, { axis: 'y' })).toBeNull();
  });
  it('needs |dx| > 2|dy|', () => {
    expect(at(130, 65)).toBeNull();
    expect(at(130, 64)).toBe('approve');
  });
  it('fires exactly at the threshold', () => {
    expect(swipeThreshold(390)).toBe(117);
    expect(at(117)).toBe('approve');
    expect(at(-117)).toBe('changes');
  });
  it('right fires approve, left fires changes', () => {
    expect(at(150, 10)).toBe('approve');
    expect(at(-150, -10)).toBe('changes');
  });
  it('at 320px the 96px floor wins over 30% (96 > 96)', () => {
    expect(swipeThreshold(320)).toBe(96);
    const o = { startX: 160, startY: 300, y: 300, width: 320 };
    expect(swipeIntent({ ...o, x: 160 + 95 })).toBeNull();
    expect(swipeIntent({ ...o, x: 160 + 96 })).toBe('approve');
    expect(swipeThreshold(300)).toBe(96); // 30% = 90 < 96
  });
  it('multi-touch cancels', () => {
    expect(at(200, 0, { touches: 2 })).toBeNull();
  });
});

describe('Notifications on: iOS badge sentence', () => {
  it('only the on state mentions the badge', () => {
    const base = { supported: true, standalone: true, isIOS: true, permission: 'granted', hasKey: true };
    expect(pushUiState({ ...base, subscribed: true }).label).toMatch(/badge shows only for the installed app with notifications on/);
    for (const s of [{ ...base, subscribed: false }, { ...base, permission: 'denied' }, { ...base, standalone: false }, { ...base, hasKey: false }, { ...base, supported: false, isIOS: false }]) {
      expect(pushUiState(s).label).not.toMatch(/badge/i);
    }
  });
});

describe('service worker push sets the badge', () => {
  async function runSw(payload, { api = true } = {}) {
    const db = makeD1();
    await q.createSite(db, { slug: 'ka-performance', name: 'K & A', live_url: 'https://ka.test', hosting: 'pages' }, 't');
    const src = await (await swRoute({ params: { slug: 'ka-performance' }, locals: { runtime: { env: { DB: db } } } })).text();
    const calls = [];
    const handlers = {};
    const nav = api ? {
      setAppBadge: async (n) => { calls.push(['setAppBadge', n]); },
      clearAppBadge: async () => { calls.push(['clearAppBadge']); },
    } : {};
    const self = {
      location: { origin: 'https://admin.test' },
      navigator: nav,
      registration: { showNotification: async (t, o) => { calls.push(['showNotification', t, o.body]); } },
      addEventListener: (type, fn) => { handlers[type] = fn; },
      clients: {},
    };
    vm.runInNewContext(src, { self, URL, Promise, JSON, String, Number });
    let wait;
    handlers.push({ data: { json: () => payload }, waitUntil: (p) => { wait = p; } });
    await wait;
    return calls;
  }

  it('setAppBadge(badge) inside the same waitUntil as showNotification', async () => {
    const calls = await runSw({ title: 'Waiting on you', body: 'Tempo', badge: 3 });
    expect(calls).toContainEqual(['showNotification', 'Waiting on you', 'Tempo']);
    expect(calls).toContainEqual(['setAppBadge', 3]);
  });
  it('clears when the badge is 0', async () => {
    expect(await runSw({ title: 'x', body: 'y', badge: 0 })).toContainEqual(['clearAppBadge']);
  });
  it('without the API it still shows the notification and throws nothing', async () => {
    const calls = await runSw({ title: 'x', body: 'y', badge: 2 }, { api: false });
    expect(calls).toEqual([['showNotification', 'x', 'y']]);
  });
});
