import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import * as q from '../src/lib/db.js';
import {
  pushPlan, pushMessage, validatePushSubscription,
  runDeskPush, listWaitingApprove, MOCK_PUSH_HOST,
} from '../src/lib/desk-push.js';
import { pushUiState, clickTarget } from '../src/lib/desk-push-ui.js';
import { mockTransport, encryptAes128gcm, vapidJwt, sendPush, b64url, unb64url, generateVapidKeys } from '../src/lib/web-push.js';
import { handlePush } from '../src/pages/sites/[slug]/social/push.js';
import { GET as swRoute } from '../src/pages/sites/[slug]/social/sw.js.js';

const NOW = Date.parse('2026-10-05T16:00:00Z');
const ORIGIN = 'https://admin.ka-performancefl.com';
const OWNER = { id: 1, name: 'Alex', email: 'alex@example.com', role: 'owner' };
const VIEWER = { id: 2, name: 'Sam', email: 'sam@example.com', role: 'client', grants: [{ site_id: 1, slug: 'ka-performance', level: 'view' }] };
const APPROVER = { id: 3, name: 'Pat', email: 'pat@example.com', role: 'client', grants: [{ site_id: 1, slug: 'ka-performance', level: 'approve' }] };

const FAKE_P256 = 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4';
const FAKE_AUTH = 'BTBZMqHH6r4Tts7J_aSIgg';
const GOOD_SUB = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  keys: { p256dh: FAKE_P256, auth: FAKE_AUTH },
};

describe('pushPlan', () => {
  it('announces waiting ids not yet sent, and forgets sent ids no longer waiting', () => {
    expect(pushPlan(['a', 'b', 'c'], ['b', 'd'])).toEqual({
      announce: ['a', 'c'],
      forget: ['d'],
    });
  });

  it('announces nothing on a second pass with the same waiting set', () => {
    const first = pushPlan(['a', 'b'], []);
    expect(first.announce).toEqual(['a', 'b']);
    const second = pushPlan(['a', 'b'], first.announce);
    expect(second).toEqual({ announce: [], forget: [] });
  });

  it('re-announces after forget when an item is waiting again', () => {
    const { announce, forget } = pushPlan(['a'], ['a', 'b']);
    expect(announce).toEqual([]);
    expect(forget).toEqual(['b']);
    // After deleting 'a' from sent (e.g. it was decided), then it waits again:
    expect(pushPlan(['a'], []).announce).toEqual(['a']);
  });
});

describe('pushMessage', () => {
  const site = { slug: 'ka-performance', name: 'K & A' };

  it('names one item and deep-links to it', () => {
    expect(pushMessage(site, [{ item_id: '2026-10-06-reel', title: 'Tempo squats' }])).toEqual({
      title: 'Waiting on you',
      body: 'Tempo squats',
      url: '/sites/ka-performance/social?item=2026-10-06-reel',
      tag: 'desk-ka-performance',
    });
  });

  it('counts several and opens the first in rail order', () => {
    const m = pushMessage(site, [
      { item_id: 'a', title: 'A' },
      { item_id: 'b', title: 'B' },
      { item_id: 'c', title: 'C' },
    ]);
    expect(m).toEqual({
      title: '3 new posts waiting on you',
      body: '3 new posts waiting on you',
      url: '/sites/ka-performance/social?item=a',
      tag: 'desk-ka-performance',
    });
  });
});

describe('pushUiState', () => {
  const base = { supported: true, standalone: true, isIOS: false, permission: 'default', subscribed: false, hasKey: true };

  it('nokey when the public key is missing', () => {
    expect(pushUiState({ ...base, hasKey: false }).kind).toBe('nokey');
  });

  it('ios-install on iPhone Safari not standalone', () => {
    expect(pushUiState({ ...base, isIOS: true, standalone: false }).kind).toBe('ios-install');
  });

  it('unsupported when PushManager is missing', () => {
    expect(pushUiState({ ...base, supported: false }).kind).toBe('unsupported');
  });

  it('off / on / denied', () => {
    expect(pushUiState(base)).toMatchObject({ kind: 'off', actions: ['on'] });
    expect(pushUiState({ ...base, subscribed: true, permission: 'granted' })).toMatchObject({ kind: 'on', actions: ['test', 'off'] });
    expect(pushUiState({ ...base, permission: 'denied' }).kind).toBe('denied');
  });
});

describe('validatePushSubscription', () => {
  it('accepts an allowlisted https endpoint with correct key lengths', () => {
    expect(validatePushSubscription(GOOD_SUB)).toEqual({
      ok: true, endpoint: GOOD_SUB.endpoint, p256dh: FAKE_P256, auth: FAKE_AUTH,
    });
  });

  it('rejects a non-allowlisted host', () => {
    const r = validatePushSubscription({ ...GOOD_SUB, endpoint: 'https://evil.test/push' });
    expect(r.ok).toBe(false);
  });

  it('allows the mock host only in development', () => {
    const sub = { ...GOOD_SUB, endpoint: `https://${MOCK_PUSH_HOST}/x` };
    expect(validatePushSubscription(sub).ok).toBe(false);
    expect(validatePushSubscription(sub, { development: true }).ok).toBe(true);
  });

  it('rejects http and bad keys', () => {
    expect(validatePushSubscription({ ...GOOD_SUB, endpoint: 'http://fcm.googleapis.com/x' }).ok).toBe(false);
    expect(validatePushSubscription({ endpoint: GOOD_SUB.endpoint, keys: { p256dh: 'aa', auth: FAKE_AUTH } }).ok).toBe(false);
  });
});

describe('clickTarget', () => {
  const origin = 'https://admin.ka-performancefl.com';
  const scope = '/sites/ka-performance/social';

  it('keeps a same-origin in-scope deep link', () => {
    expect(clickTarget('/sites/ka-performance/social?item=a', { origin, scope }))
      .toBe(`${origin}/sites/ka-performance/social?item=a`);
  });

  it('falls back to the desk root for outside scope or foreign origin', () => {
    expect(clickTarget('/sites/other/social?item=a', { origin, scope })).toBe(`${origin}${scope}`);
    expect(clickTarget('https://evil.test/sites/ka-performance/social', { origin, scope })).toBe(`${origin}${scope}`);
  });
});

describe('RFC 8291 Appendix A', () => {
  it('produces the exact ciphertext for the fixed salt and keys', async () => {
    const plaintext = 'When I grow up, I want to be a watermelon';
    const body = await encryptAes128gcm(plaintext, {
      p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
      auth: 'BTBZMqHH6r4Tts7J_aSIgg',
      salt: 'DGv6ra1nlYgDCS1FRnbzlw',
      asPublic: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
      asPrivate: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
    });
    // Appendix A header + ciphertext (binary concat). Section 5's wrapped
    // base64 is the same bytes re-encoded across the boundary.
    const header = unb64url(
      'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
    );
    const cipher = unb64url('8pfeW0KbunFT06SuDKoJH9Ql87S1QUrdirN6GcG7sFz1y1sqLgVi1VhjVkHsUoEsbI_0LpXMuGvnzQ');
    const want = new Uint8Array(header.length + cipher.length);
    want.set(header, 0); want.set(cipher, header.length);
    expect(Buffer.from(body).toString('hex')).toBe(Buffer.from(want).toString('hex'));
  });
});

describe('VAPID JWT', () => {
  it('emits ES256 header and aud/exp/sub claims, and verifies with the public key', async () => {
    const keys = await generateVapidKeys();
    const now = Date.parse('2026-10-05T16:00:00Z');
    const { token, header, claims } = await vapidJwt({
      audience: 'https://fcm.googleapis.com',
      subject: 'mailto:alex@ka-performancefl.com',
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      now,
      expiresInSec: 12 * 3600,
    });
    expect(header).toEqual({ typ: 'JWT', alg: 'ES256' });
    expect(claims).toEqual({
      aud: 'https://fcm.googleapis.com',
      exp: Math.floor(now / 1000) + 12 * 3600,
      sub: 'mailto:alex@ka-performancefl.com',
    });
    const parts = token.split('.');
    expect(parts).toHaveLength(3);
    // Verify the ES256 signature with the public key via WebCrypto (not just claims).
    const pubRaw = unb64url(keys.publicKey);
    const pubKey = await crypto.subtle.importKey(
      'raw', pubRaw, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'],
    );
    const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const sig = unb64url(parts[2]);
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' }, pubKey, sig, signingInput,
    );
    expect(ok).toBe(true);
  });
});

describe('sendPush response codes', () => {
  const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/x', p256dh: FAKE_P256, auth: FAKE_AUTH };

  it('uses mock transport when VAPID_PRIVATE_KEY is unset', async () => {
    const t = mockTransport();
    const r = await sendPush(sub, { title: 'T', body: 'B' }, { env: {}, transport: t });
    expect(r).toMatchObject({ status: 201, mock: true, delete: false });
    expect(t.sent).toHaveLength(1);
    expect(t.sent[0].endpoint).toBe(sub.endpoint);
  });

  it('marks 404/410 for delete and leaves 429 alone', async () => {
    const env = { VAPID_PRIVATE_KEY: 'x', VAPID_PUBLIC_KEY: 'y' }; // will fail jwt — use transport only
    // Bypass encrypt by using a transport that short-circuits before crypto:
    // sendPush encrypts when priv is set. Use injectable transport after we
    // stub by calling with mock-like path: unset priv for status mapping test
    // via a custom wrapper.
    const statuses = [201, 404, 410, 429];
    for (const status of statuses) {
      const t = async () => ({ status });
      const r = await sendPush(sub, { title: 'T' }, { env: {}, transport: t });
      expect(r.status).toBe(status);
      expect(r.delete).toBe(status === 404 || status === 410);
    }
  });
});

describe('runDeskPush', () => {
  let db;
  beforeEach(async () => {
    db = makeD1();
    await q.createSite(db, { slug: 'ka-performance', name: 'K & A', live_url: 'https://ka.test', hosting: 'pages' }, 't');
    await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Alex', 'alex@example.com', 'owner', 't')").run();
    const add = (id, list, kind, title = 'T') => db.prepare(
      'INSERT INTO desk_items (site_id, item_id, list, kind, post_date, post_time, title, payload, pushed_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).bind(id, list, kind, '2026-10-06', '10:00', title, JSON.stringify({ id }), 't').run();
    await add('reel-1', 'approve', 'reel', 'Reel one');
    await add('ask-1', 'approve', 'ask', 'Which track?');
    await add('native-1', 'approve', 'native', 'Native');
    await add('story-1', 'stories', 'story', 'Story');
    await q.upsertPushSub(db, {
      siteId: 1, personId: 1, endpoint: `https://${MOCK_PUSH_HOST}/dev`,
      p256dh: FAKE_P256, auth: FAKE_AUTH, label: 'dev',
    }, 't');
  });

  it('announces waiting approve items once, skips Stories and native, re-announces after waiting again', async () => {
    const t = mockTransport();
    const env = { DB: db, ENVIRONMENT: 'development' };
    const s1 = await runDeskPush(env, { now: NOW, transport: t });
    expect(s1.announced).toBe(2); // reel + ask
    expect(t.sent).toHaveLength(1);
    const payload = JSON.parse(t.sent[0].payload);
    expect(payload.title).toBe('2 new posts waiting on you');
    expect(payload.url).toContain('item=reel-1');

    const t2 = mockTransport();
    const s2 = await runDeskPush(env, { now: NOW + 1000, transport: t2 });
    expect(s2.announced).toBe(0);
    expect(t2.sent).toHaveLength(0);

    // Approve then put back to waiting → announce again.
    await db.prepare("INSERT INTO desk_decisions (site_id, item_id, decision, decided_by, decided_at) VALUES (1, 'reel-1', 'approved', 1, 't')").run();
    await runDeskPush(env, { now: NOW + 2000, transport: mockTransport() }); // forgets reel-1
    await db.prepare("UPDATE desk_decisions SET decision = 'waiting' WHERE item_id = 'reel-1'").run();
    const t3 = mockTransport();
    const s3 = await runDeskPush(env, { now: NOW + 3000, transport: t3 });
    expect(s3.announced).toBe(1);
    expect(JSON.parse(t3.sent[0].payload).url).toContain('item=reel-1');
  });

  it('sends nothing for a Stories-only change', async () => {
    await db.prepare("DELETE FROM desk_items WHERE list = 'approve'").run();
    await db.prepare("DELETE FROM desk_push_sent").run();
    const t = mockTransport();
    const s = await runDeskPush({ DB: db }, { now: NOW, transport: t });
    expect(s.announced).toBe(0);
    expect(t.sent).toHaveLength(0);
  });
});

describe('POST /push', () => {
  let db;
  const env = () => ({ DB: db, ENVIRONMENT: 'development' });
  const req = (body, { origin = ORIGIN } = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (origin) headers.Origin = origin;
    return new Request(`${ORIGIN}/sites/ka-performance/social/push`, {
      method: 'POST', headers, body: JSON.stringify(body),
    });
  };
  const call = (body, opts = {}) => handlePush({
    db, env: env(), slug: opts.slug ?? 'ka-performance', user: opts.user ?? OWNER,
    request: req(body, opts), nowMs: NOW,
  });

  beforeEach(async () => {
    db = makeD1();
    await q.createSite(db, { slug: 'ka-performance', name: 'K & A', live_url: 'https://ka.test', hosting: 'pages' }, 't');
    await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Alex', 'alex@example.com', 'owner', 't')").run();
    await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Sam', 'sam@example.com', 'client', 't')").run();
    await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Pat', 'pat@example.com', 'client', 't')").run();
    await db.prepare("INSERT INTO desk_access (person_id, site_id, level, granted_at) VALUES (2, 1, 'view', 't')").run();
    await db.prepare("INSERT INTO desk_access (person_id, site_id, level, granted_at) VALUES (3, 1, 'approve', 't')").run();
  });

  it('lets the owner subscribe, unsubscribe and test', async () => {
    const sub = { endpoint: `https://${MOCK_PUSH_HOST}/phone`, keys: { p256dh: FAKE_P256, auth: FAKE_AUTH } };
    expect((await call({ action: 'subscribe', subscription: sub, label: 'iPhone' })).status).toBe(200);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_push_subs').first('n')).toBe(1);

    const test = await call({ action: 'test', endpoint: sub.endpoint });
    expect(test.status).toBe(200);
    expect(test.body.mock).toBe(true);

    expect((await call({ action: 'unsubscribe', endpoint: sub.endpoint })).status).toBe(200);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_push_subs').first('n')).toBe(0);
  });

  it('gives a viewer 403', async () => {
    const sub = { endpoint: `https://${MOCK_PUSH_HOST}/v`, keys: { p256dh: FAKE_P256, auth: FAKE_AUTH } };
    expect((await call({ action: 'subscribe', subscription: sub }, { user: VIEWER })).status).toBe(403);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_push_subs').first('n')).toBe(0);
  });

  it('refuses a bad origin and a non-allowlisted endpoint', async () => {
    const sub = { endpoint: `https://${MOCK_PUSH_HOST}/x`, keys: { p256dh: FAKE_P256, auth: FAKE_AUTH } };
    expect((await call({ action: 'subscribe', subscription: sub }, { origin: 'https://evil.test' })).status).toBe(403);
    expect((await call({
      action: 'subscribe',
      subscription: { endpoint: 'https://evil.test/push', keys: { p256dh: FAKE_P256, auth: FAKE_AUTH } },
    })).status).toBe(400);
  });

  it('lets an approve client subscribe', async () => {
    const sub = { endpoint: `https://${MOCK_PUSH_HOST}/pat`, keys: { p256dh: FAKE_P256, auth: FAKE_AUTH } };
    expect((await call({ action: 'subscribe', subscription: sub }, { user: APPROVER })).status).toBe(200);
  });
});

describe('runDeskPush 429/5xx retry', () => {
  let db;
  beforeEach(async () => {
    db = makeD1();
    await q.createSite(db, { slug: 'ka-performance', name: 'K & A', live_url: 'https://ka.test', hosting: 'pages' }, 't');
    await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Alex', 'alex@example.com', 'owner', 't')").run();
    await db.prepare(
      "INSERT INTO desk_items (site_id, item_id, list, kind, post_date, post_time, title, payload, pushed_at) VALUES (1, 'reel-1', 'approve', 'reel', '2026-10-06', '10:00', 'Reel', '{}', 't')",
    ).run();
    await q.upsertPushSub(db, {
      siteId: 1, personId: 1, endpoint: `https://${MOCK_PUSH_HOST}/dev`,
      p256dh: FAKE_P256, auth: FAKE_AUTH, label: 'dev',
    }, 't');
  });

  it('leaves items unsent when every device gets 429, and retries next run', async () => {
    const env = { DB: db, ENVIRONMENT: 'development' };
    const t429 = async () => ({ status: 429 });
    const s1 = await runDeskPush(env, { now: NOW, transport: t429 });
    expect(s1.announced).toBe(1);
    expect(s1.sent).toBe(0);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_push_sent').first('n')).toBe(0);

    const tOk = mockTransport();
    const s2 = await runDeskPush(env, { now: NOW + 1000, transport: tOk });
    expect(s2.announced).toBe(1);
    expect(s2.sent).toBe(1);
    expect(tOk.sent).toHaveLength(1);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_push_sent').first('n')).toBe(1);
  });

  it('leaves items unsent when every device gets 5xx', async () => {
    const env = { DB: db, ENVIRONMENT: 'development' };
    const t500 = async () => ({ status: 503 });
    await runDeskPush(env, { now: NOW, transport: t500 });
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_push_sent').first('n')).toBe(0);
  });

  it('marks sent when at least one device gets 2xx even if another hits 429', async () => {
    await q.upsertPushSub(db, {
      siteId: 1, personId: 1, endpoint: `https://${MOCK_PUSH_HOST}/other`,
      p256dh: FAKE_P256, auth: FAKE_AUTH, label: 'other',
    }, 't');
    const env = { DB: db, ENVIRONMENT: 'development' };
    let n = 0;
    const t = async () => {
      n += 1;
      return { status: n === 1 ? 201 : 429 };
    };
    await runDeskPush(env, { now: NOW, transport: t });
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_push_sent').first('n')).toBe(1);
  });

  it('deletes 404/410 subscriptions and still retries announce if no 2xx', async () => {
    const env = { DB: db, ENVIRONMENT: 'development' };
    const t410 = async () => ({ status: 410 });
    // sendPush with mock path (no VAPID) still maps delete from status
    await runDeskPush(env, { now: NOW, transport: t410 });
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_push_subs').first('n')).toBe(0);
    // No 2xx → not marked; next run with a fresh sub can announce again
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_push_sent').first('n')).toBe(0);
  });
});

describe('GET sw.js Service-Worker-Allowed', () => {
  it('serves JS with Service-Worker-Allowed matching the desk scope (no trailing slash)', async () => {
    const db = makeD1();
    await q.createSite(db, { slug: 'ka-performance', name: 'K & A', live_url: 'https://ka.test', hosting: 'pages' }, 't');
    const r = await swRoute({
      params: { slug: 'ka-performance' },
      locals: { runtime: { env: { DB: db } } },
    });
    expect(r.status).toBe(200);
    expect(r.headers.get('Content-Type')).toMatch(/text\/javascript/);
    expect(r.headers.get('Cache-Control')).toBe('no-cache');
    expect(r.headers.get('Service-Worker-Allowed')).toBe('/sites/ka-performance/social');
    expect(r.headers.get('Service-Worker-Allowed').endsWith('/')).toBe(false);
    const src = await r.text();
    expect(src).toContain('addEventListener');
    expect(src).not.toMatch(/addEventListener\(\s*['"]fetch['"]/);
  });
});
