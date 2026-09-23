import { describe, it, expect } from 'vitest';
import { GET, POST, DELETE, STATE_KEYS, isStateKey, MAX_VALUE_BYTES } from '../src/pages/api/state.js';
import { getAppState, setAppState, deleteAppState } from '../src/lib/db.js';

// D1 stub. db.js's own header promises these functions are "trivially testable
// against a stub" because the binding is always the first argument; this is
// that stub. It records every prepare/bind and answers first() from `row`.
function fakeDb(row = null) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      const call = { sql, args: null, ran: false };
      calls.push(call);
      return {
        bind(...args) { call.args = args; return this; },
        async first() { return row; },
        async run() { call.ran = true; return { success: true }; },
      };
    },
  };
}

const ctx = (db, { search = '', body = undefined, email = 'alex@ka-performancefl.com' } = {}) => ({
  url: new URL(`https://admin.ka-performancefl.com/api/state${search}`),
  request: new Request('https://admin.ka-performancefl.com/api/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : body,
  }),
  locals: { runtime: { env: { DB: db } }, user: { email } },
});

describe('isStateKey', () => {
  it('accepts the launch book key', () => {
    expect(isStateKey('kap:launchbook')).toBe(true);
  });
  it('rejects anything not on the whitelist', () => {
    expect(isStateKey('kap:anything-else')).toBe(false);
    expect(isStateKey('')).toBe(false);
    expect(isStateKey(null)).toBe(false);
    expect(isStateKey(undefined)).toBe(false);
  });
  it('is the whitelist the route exports', () => {
    expect(STATE_KEYS).toEqual(['kap:launchbook']);
  });
});

describe('GET /api/state', () => {
  it('returns the stored value', async () => {
    const db = fakeDb({ value: '{"clients":[]}', updated_at: '2026-09-22T10:00:00.000Z', updated_by: 'alex@x' });
    const res = await GET(ctx(db, { search: '?key=kap:launchbook' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ value: '{"clients":[]}', updatedAt: '2026-09-22T10:00:00.000Z' });
  });

  it('treats a never-written key as an empty book, not an error', async () => {
    const res = await GET(ctx(fakeDb(null), { search: '?key=kap:launchbook' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ value: null, updatedAt: null });
  });

  it('refuses a key that is not whitelisted', async () => {
    const db = fakeDb(null);
    const res = await GET(ctx(db, { search: '?key=users' }));
    expect(res.status).toBe(400);
    expect(db.calls).toHaveLength(0);
  });

  it('refuses a missing key', async () => {
    expect((await GET(ctx(fakeDb(null)))).status).toBe(400);
  });
});

describe('POST /api/state', () => {
  it('writes the value and stamps the verified identity, not the body', async () => {
    const db = fakeDb(null);
    const res = await POST(ctx(db, {
      body: JSON.stringify({ key: 'kap:launchbook', value: '{"clients":[1]}', email: 'attacker@evil.test' }),
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(db.calls).toHaveLength(1);
    expect(db.calls[0].sql).toContain('INSERT INTO app_state');
    expect(db.calls[0].args[0]).toBe('kap:launchbook');
    expect(db.calls[0].args[1]).toBe('{"clients":[1]}');
    expect(db.calls[0].args[3]).toBe('alex@ka-performancefl.com');
    expect(db.calls[0].ran).toBe(true);
  });

  it('refuses a key that is not whitelisted', async () => {
    const db = fakeDb(null);
    const res = await POST(ctx(db, { body: JSON.stringify({ key: 'other', value: '{}' }) }));
    expect(res.status).toBe(400);
    expect(db.calls).toHaveLength(0);
  });

  it('refuses a non-string value', async () => {
    const db = fakeDb(null);
    const res = await POST(ctx(db, { body: JSON.stringify({ key: 'kap:launchbook', value: { a: 1 } }) }));
    expect(res.status).toBe(400);
    expect(db.calls).toHaveLength(0);
  });

  it('refuses a body that is not JSON', async () => {
    const db = fakeDb(null);
    const res = await POST(ctx(db, { body: 'not json' }));
    expect(res.status).toBe(400);
    expect(db.calls).toHaveLength(0);
  });

  it('refuses a value over the size cap', async () => {
    const db = fakeDb(null);
    const res = await POST(ctx(db, {
      body: JSON.stringify({ key: 'kap:launchbook', value: 'x'.repeat(MAX_VALUE_BYTES + 1) }),
    }));
    expect(res.status).toBe(413);
    expect(db.calls).toHaveLength(0);
  });
});

describe('DELETE /api/state', () => {
  it('deletes the whitelisted key', async () => {
    const db = fakeDb(null);
    const res = await DELETE(ctx(db, { search: '?key=kap:launchbook' }));
    expect(res.status).toBe(200);
    expect(db.calls[0].sql).toContain('DELETE FROM app_state');
    expect(db.calls[0].args).toEqual(['kap:launchbook']);
  });

  it('refuses a key that is not whitelisted', async () => {
    const db = fakeDb(null);
    expect((await DELETE(ctx(db, { search: '?key=clients' }))).status).toBe(400);
    expect(db.calls).toHaveLength(0);
  });
});

describe('app_state db functions', () => {
  it('getAppState binds the key and selects the audit columns', async () => {
    const db = fakeDb({ value: 'v', updated_at: 't', updated_by: 'e' });
    const row = await getAppState(db, 'kap:launchbook');
    expect(row).toEqual({ value: 'v', updated_at: 't', updated_by: 'e' });
    expect(db.calls[0].sql).toContain('FROM app_state WHERE key = ?');
    expect(db.calls[0].args).toEqual(['kap:launchbook']);
  });

  it('setAppState upserts rather than failing on an existing key', async () => {
    const db = fakeDb(null);
    await setAppState(db, 'kap:launchbook', 'v', { now: 't', email: 'e' });
    expect(db.calls[0].sql).toContain('ON CONFLICT(key) DO UPDATE');
    expect(db.calls[0].args).toEqual(['kap:launchbook', 'v', 't', 'e']);
  });

  it('setAppState defaults the author to an empty string', async () => {
    const db = fakeDb(null);
    await setAppState(db, 'kap:launchbook', 'v', { now: 't' });
    expect(db.calls[0].args[3]).toBe('');
  });

  it('deleteAppState binds the key', async () => {
    const db = fakeDb(null);
    await deleteAppState(db, 'kap:launchbook');
    expect(db.calls[0].args).toEqual(['kap:launchbook']);
  });
});
