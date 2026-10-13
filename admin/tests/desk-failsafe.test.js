// Slice 7 fail safe: production without VAPID keys sends nothing, never uses
// the mock transport, never throws, never marks items sent, logs one line.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import * as q from '../src/lib/db.js';
import { runDeskPush, keysReady, MOCK_PUSH_HOST } from '../src/lib/desk-push.js';
import { sendPush } from '../src/lib/web-push.js';
import { seedFixture } from './fixtures/desk-stories-fixture.js';

const P256 = 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4';
const AUTH = 'BTBZMqHH6r4Tts7J_aSIgg';
const NOW = Date.parse('2026-10-14T14:05:00Z');

async function desk() {
  const db = await seedFixture(makeD1());
  const endpoint = `https://${MOCK_PUSH_HOST}/prod`;
  await q.upsertPushSub(db, { siteId: 1, personId: 1, endpoint, p256dh: P256, auth: AUTH, label: 'p' }, 't');
  await q.setPushPrefs(db, endpoint, { quiet_start: '21:00', quiet_end: '07:30', stories_at: '10:00' });
  await q.setPushHeld(db, endpoint, '2026-10-14T03:00:00.000Z');
  return db;
}
afterEach(() => vi.restoreAllMocks());

describe('fail safe without VAPID keys (production)', () => {
  for (const [name, keys] of [
    ['no keys', {}],
    ['private key only', { VAPID_PRIVATE_KEY: 'x' }],
    ['public key only', { VAPID_PUBLIC_KEY: 'BPub' }],
    ['empty public key as shipped', { VAPID_PRIVATE_KEY: 'x', VAPID_PUBLIC_KEY: '' }],
  ]) {
    it(`${name}: logs one line, sends nothing, marks nothing, never throws`, async () => {
      const db = await desk();
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const transport = vi.fn(async () => ({ status: 201 }));
      const s = await runDeskPush({ DB: db, ...keys }, { now: NOW, transport });
      expect(s).toMatchObject({ skipped: 'no-vapid-keys', sent: 0, announced: 0 });
      expect(transport).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalledTimes(1);
      expect(JSON.parse(log.mock.calls[0][0])).toEqual({ event: 'desk.push', skipped: 'no-vapid-keys' });
      expect(log.mock.calls.some((c) => String(c[0]).includes('[push:mock]'))).toBe(false);
      expect(await q.listPushSent(db, 1)).toEqual([]);
      const sub = await q.getPushSubByEndpoint(db, `https://${MOCK_PUSH_HOST}/prod`);
      expect(sub.held_since).toBe('2026-10-14T03:00:00.000Z');
      expect(sub.stories_sent_on).toBeNull();
    });
  }

  it('ignores DESK_PUSH_NOW and the mock outside development', async () => {
    const db = await desk();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const s = await runDeskPush({ DB: db, ENVIRONMENT: 'production', DESK_PUSH_NOW: '2026-10-14T10:05:00-04:00' }, { now: NOW });
    expect(s.skipped).toBe('no-vapid-keys');
  });

  it('sendPush (Send test) without keys outside development sends nothing and never mocks', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const transport = vi.fn(async () => ({ status: 201 }));
    const r = await sendPush({ endpoint: 'https://fcm.googleapis.com/fcm/send/x', p256dh: P256, auth: AUTH }, { title: 'T' }, { env: {}, transport });
    expect(r).toEqual({ status: 0, delete: false, mock: false, skipped: 'no-vapid-keys' });
    expect(transport).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('keysReady: both keys in production, or development', () => {
    expect(keysReady({})).toBe(false);
    expect(keysReady({ VAPID_PRIVATE_KEY: 'a', VAPID_PUBLIC_KEY: '' })).toBe(false);
    expect(keysReady({ VAPID_PRIVATE_KEY: 'a', VAPID_PUBLIC_KEY: 'b' })).toBe(true);
    expect(keysReady({ ENVIRONMENT: 'development' })).toBe(true);
  });

  it('development without keys still uses the mock (slice 4 local path unchanged)', async () => {
    const db = await desk();
    await q.setPushHeld(db, `https://${MOCK_PUSH_HOST}/prod`, null);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const transport = vi.fn(async () => ({ status: 201 }));
    const s = await runDeskPush({ DB: db, ENVIRONMENT: 'development' }, { now: NOW, transport });
    expect(s.skipped).toBeUndefined();
    expect(transport).toHaveBeenCalled();
  });
});
