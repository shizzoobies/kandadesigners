import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import { GROUP_NAME, buildGroupBody, syncAccessGroup, syncStatus, syncStatusText } from '../src/lib/access-sync.js';
import { getSettings } from '../src/lib/db.js';

const ACCOUNT = 'c8f0f7697e2801ba2acabb700b5da793';
const NOW = Date.parse('2026-10-02T16:00:00Z');
const ENV = { ACCESS_GROUPS_TOKEN: 'tok-123', CF_ACCOUNT_ID: ACCOUNT };
const quiet = { log() {} };
let db;

// Records each call and answers from a queue of {status, body}.
function fakeFetch(...answers) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, method: init.method, headers: init.headers, body: init.body ? JSON.parse(init.body) : undefined });
    const a = answers.shift() ?? { status: 200, body: { success: true, result: { id: 'grp-1' } } };
    if (a.throws) throw new Error(a.throws);
    return new Response(JSON.stringify(a.body), { status: a.status });
  };
  fn.calls = calls;
  return fn;
}

beforeEach(async () => {
  db = makeD1();
  await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Alex', 'alex@example.com', 'owner', 't'), ('Hannah', 'Hannah@Example.com', 'client', 't')").run();
});

describe('buildGroupBody', () => {
  it('lists every person by email, owners and clients alike', () => {
    expect(buildGroupBody([{ email: 'b@x.com', role: 'client' }, { email: 'a@x.com', role: 'owner' }])).toEqual({
      name: 'K&A admin people',
      include: [{ email: { email: 'a@x.com' } }, { email: { email: 'b@x.com' } }],
    });
    expect(GROUP_NAME).toBe('K&A admin people');
  });

  it('lowercases, trims and de-duplicates emails, and skips blanks', () => {
    expect(buildGroupBody([{ email: ' A@X.com ' }, { email: 'a@x.com' }, { email: '' }, { email: null }]).include)
      .toEqual([{ email: { email: 'a@x.com' } }]);
  });
});

describe('syncAccessGroup', () => {
  it('skips without a token, calls nothing and stores nothing', async () => {
    const f = fakeFetch();
    const r = await syncAccessGroup({ db, env: { CF_ACCOUNT_ID: ACCOUNT }, fetchImpl: f, nowMs: NOW });
    expect(r).toEqual({ ok: false, skipped: 'token_missing' });
    expect(f.calls).toHaveLength(0);
    expect(await getSettings(db)).toEqual({});
  });

  it('skips without an account id', async () => {
    const f = fakeFetch();
    const r = await syncAccessGroup({ db, env: { ACCESS_GROUPS_TOKEN: 'tok' }, fetchImpl: f, nowMs: NOW });
    expect(r).toEqual({ ok: false, skipped: 'account_missing' });
    expect(f.calls).toHaveLength(0);
  });

  it('creates the group the first time and stores its id', async () => {
    const f = fakeFetch({ status: 200, body: { success: true, result: { id: 'grp-new' } } });
    const r = await syncAccessGroup({ db, env: ENV, fetchImpl: f, nowMs: NOW, log: quiet });
    expect(r).toEqual({ ok: true, created: true });
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0].method).toBe('POST');
    expect(f.calls[0].url).toBe(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/access/groups`);
    expect(f.calls[0].headers.Authorization).toBe('Bearer tok-123');
    expect(f.calls[0].body).toEqual({
      name: 'K&A admin people',
      include: [{ email: { email: 'alex@example.com' } }, { email: { email: 'hannah@example.com' } }],
    });
    expect(await getSettings(db)).toEqual({
      access_group_id: 'grp-new', access_sync_at: new Date(NOW).toISOString(), access_sync_error: '',
    });
  });

  it('replaces the include list with PUT once the group exists', async () => {
    await syncAccessGroup({ db, env: ENV, fetchImpl: fakeFetch({ status: 200, body: { success: true, result: { id: 'grp-1' } } }), nowMs: NOW });
    await db.prepare('DELETE FROM people WHERE id = 2').run();
    const f = fakeFetch({ status: 200, body: { success: true, result: { id: 'grp-1' } } });
    expect(await syncAccessGroup({ db, env: ENV, fetchImpl: f, nowMs: NOW + 1000 })).toEqual({ ok: true });
    expect(f.calls[0].method).toBe('PUT');
    expect(f.calls[0].url).toBe(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/access/groups/grp-1`);
    expect(f.calls[0].body.include).toEqual([{ email: { email: 'alex@example.com' } }]);
  });

  it('recreates the group when Cloudflare no longer has it', async () => {
    await db.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('access_group_id', 'grp-gone', 't')").run();
    const f = fakeFetch({ status: 404, body: { success: false, errors: [{ code: 12130, message: 'not found' }] } },
      { status: 200, body: { success: true, result: { id: 'grp-2' } } });
    expect(await syncAccessGroup({ db, env: ENV, fetchImpl: f, nowMs: NOW, log: quiet })).toEqual({ ok: true, created: true });
    expect(f.calls.map((c) => c.method)).toEqual(['PUT', 'POST']);
    const s = await getSettings(db);
    expect(s.access_group_id).toBe('grp-2');
    // The new group is not on the Access policy yet, so People must say so.
    expect(s.access_sync_error).toBe('Created a new Access group; add it to the admin Allow policy.');
    expect(s.access_sync_at).toBe(new Date(NOW).toISOString());
    expect(syncStatusText(syncStatus(ENV, s), NOW)).toMatch(/needs attention: Created a new Access group/);
  });

  it('creates the very first group without a warning: the runbook adds it to the policy', async () => {
    await syncAccessGroup({ db, env: ENV, fetchImpl: fakeFetch(), nowMs: NOW, log: quiet });
    expect((await getSettings(db)).access_sync_error).toBe('');
  });

  it('logs each sync as one JSON line, never the token or an email', async () => {
    const lines = [];
    const log = { log: (s) => lines.push(s) };
    await syncAccessGroup({ db, env: ENV, fetchImpl: fakeFetch(), nowMs: NOW, log });
    await syncAccessGroup({ db, env: ENV, fetchImpl: fakeFetch({ status: 403, body: { success: false, errors: [] } }), nowMs: NOW, log });
    await syncAccessGroup({ db, env: { CF_ACCOUNT_ID: ACCOUNT }, fetchImpl: fakeFetch(), nowMs: NOW, log });
    expect(lines.map((l) => JSON.parse(l))).toEqual([
      { event: 'access.sync', result: 'ok', created: true, people: 2 },
      { event: 'access.sync', result: 'error', error: 'Cloudflare answered 403' },
      { event: 'access.sync', result: 'skipped', reason: 'token_missing' },
    ]);
    for (const l of lines) expect(l).not.toMatch(/tok-123|@/);
  });

  it('stores a Cloudflare error, keeps the last good sync time, and never throws', async () => {
    await syncAccessGroup({ db, env: ENV, fetchImpl: fakeFetch(), nowMs: NOW });
    const f = fakeFetch({ status: 403, body: { success: false, errors: [{ code: 10000, message: 'Authentication error' }] } });
    const r = await syncAccessGroup({ db, env: ENV, fetchImpl: f, nowMs: NOW + 5000 });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/403/);
    expect(r.error).toMatch(/Authentication error/);
    expect(r.error).not.toMatch(/tok-123/);
    const s = await getSettings(db);
    expect(s.access_sync_error).toBe(r.error);
    expect(s.access_sync_at).toBe(new Date(NOW).toISOString());
  });

  it('stores a network failure as an error', async () => {
    const r = await syncAccessGroup({ db, env: ENV, fetchImpl: fakeFetch({ throws: 'connection reset' }), nowMs: NOW });
    expect(r).toEqual({ ok: false, error: expect.stringMatching(/connection reset/) });
    expect((await getSettings(db)).access_sync_error).toMatch(/connection reset/);
  });

  it('refuses a malformed account id or stored group id rather than build a URL from it', async () => {
    const f = fakeFetch();
    const r = await syncAccessGroup({ db, env: { ...ENV, CF_ACCOUNT_ID: '../zones' }, fetchImpl: f, nowMs: NOW });
    expect(r.ok).toBe(false);
    expect(f.calls).toHaveLength(0);
    await db.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('access_group_id', '../../x', 't')").run();
    const r2 = await syncAccessGroup({ db, env: ENV, fetchImpl: f, nowMs: NOW });
    expect(r2.ok).toBe(false);
    expect(f.calls).toHaveLength(0);
  });
});

describe('syncStatusText', () => {
  const at = new Date(NOW - 2 * 60000).toISOString();
  it('says when the list last synced, in plain words', () => {
    expect(syncStatusText({ state: 'ok', at }, NOW)).toBe('Sign-in list synced 2 minutes ago.');
    expect(syncStatusText({ state: 'ok', at: new Date(NOW - 20000).toISOString() }, NOW)).toBe('Sign-in list synced just now.');
    expect(syncStatusText({ state: 'ok', at: new Date(NOW - 60000).toISOString() }, NOW)).toBe('Sign-in list synced 1 minute ago.');
    expect(syncStatusText({ state: 'ok', at: new Date(NOW - 3 * 3600000).toISOString() }, NOW)).toBe('Sign-in list synced 3 hours ago.');
    expect(syncStatusText({ state: 'ok', at: new Date(NOW - 2 * 86400000).toISOString() }, NOW)).toBe('Sign-in list synced 2 days ago.');
  });

  it('gives the error and the last good sync', () => {
    expect(syncStatusText({ state: 'error', at, error: 'Cloudflare answered 403' }, NOW))
      .toBe('Sign-in list needs attention: Cloudflare answered 403. Last good sync 2 minutes ago.');
    expect(syncStatusText({ state: 'error', error: 'boom' }, NOW)).toBe('Sign-in list needs attention: boom. It has never synced.');
  });

  it('names a missing token or account id, and a list that has never synced', () => {
    expect(syncStatusText({ state: 'token_missing' }, NOW)).toBe('Sign-in list not connected: token missing.');
    expect(syncStatusText({ state: 'account_missing' }, NOW)).toBe('Sign-in list not connected: account id missing.');
    expect(syncStatusText({ state: 'never' }, NOW)).toBe('Sign-in list has not synced yet.');
  });
});

describe('syncStatus', () => {
  it('says the token is missing first of all', () => {
    expect(syncStatus({}, { access_sync_at: 'x' })).toEqual({ state: 'token_missing' });
  });

  it('reports never, ok and error', () => {
    expect(syncStatus(ENV, {})).toEqual({ state: 'never' });
    expect(syncStatus(ENV, { access_sync_at: 'a', access_sync_error: '' })).toEqual({ state: 'ok', at: 'a' });
    expect(syncStatus(ENV, { access_sync_at: 'a', access_sync_error: 'boom' })).toEqual({ state: 'error', at: 'a', error: 'boom' });
    expect(syncStatus({ ACCESS_GROUPS_TOKEN: 't' }, {})).toEqual({ state: 'account_missing' });
  });
});
