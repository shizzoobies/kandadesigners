import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import { fakePlaid, account, tx } from './helpers/plaid.js';
import { handleFetch } from '../bank-sync/index.js';

const KEY = btoa(String.fromCharCode(...new Uint8Array(32).map((_, i) => 255 - i)));
const NOW = '2026-11-01T15:00:00.000Z';
let env;
let plaid;

beforeEach(() => {
  env = { DB: makeD1(), PLAID_ENV: 'sandbox', PLAID_CLIENT_ID: 'cid', PLAID_SECRET: 'sec', BANK_TOKEN_KEY: KEY, ADMIN_ORIGIN: 'https://admin.ka-performancefl.com' };
  plaid = fakePlaid({
    pages: { null: { added: [tx('t1')], modified: [], removed: [], accounts: [account('acc-1')], next_cursor: 'c1', has_more: false } },
    balances: [account('acc-1')],
  });
});

const call = (path, body, method = 'POST') => handleFetch(
  new Request(`https://ka-bank-sync${path}`, { method, ...(method === 'POST' ? { body: JSON.stringify(body ?? {}), headers: { 'Content-Type': 'application/json' } } : {}) }),
  env,
  { plaid, nowIso: NOW, clock: () => NOW },
);
const exchange = () => call('/exchange', { publicToken: 'public-sandbox-1', institution: { id: 'ins_120036', name: 'Florida Credit Union' } });

describe('ka-bank-sync fetch handler', () => {
  it('answers only POST on its five routes', async () => {
    expect((await call('/sync', null, 'GET')).status).toBe(404);
    expect((await call('/other', {})).status).toBe(404);
    expect((await call('/', {})).status).toBe(404);
    expect((await call('/sync/x', {})).status).toBe(404);
  });

  it('says it is not set up when a secret is missing', async () => {
    delete env.BANK_TOKEN_KEY;
    const res = await call('/sync', {});
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, error: 'The bank connection is not set up yet.' });
  });

  it('/link-token returns the token and expiration, with the OAuth return URI', async () => {
    const res = await call('/link-token', { userId: 1 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ link_token: 'link-sandbox-abc', expiration: '2026-11-01T20:00:00Z' });
    expect(plaid.calls[0][1]).toEqual({ userId: '1', accessToken: undefined, redirectUri: 'https://admin.ka-performancefl.com/bank/oauth' });
    expect((await call('/link-token', {})).status).toBe(400);
    await call('/link-token', { userId: 1, redirect: false });
    expect(plaid.calls[1][1].redirectUri).toBeUndefined();
  });

  it('/link-token in update mode needs a link', async () => {
    const res = await call('/link-token', { userId: 1, update: true });
    expect(res.status).toBe(404);
    await exchange();
    expect((await call('/link-token', { userId: 1, update: true })).status).toBe(200);
  });

  it('/exchange links, syncs, and returns { ok, accounts }', async () => {
    const res = await exchange();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, accounts: 1 });
    expect(await env.DB.prepare('SELECT institution_name, status FROM bank_links').first()).toEqual({ institution_name: 'Florida Credit Union', status: 'ok' });
    expect((await call('/exchange', {})).status).toBe(400);
    expect((await exchange()).status).toBe(409);
  });

  it('/sync, /balance and /unlink return their results as JSON, without the status field', async () => {
    expect((await call('/sync', {})).status).toBe(404);
    await exchange();
    const s = await (await call('/sync', {})).json();
    expect(s).toEqual({ ok: true, added: 0, modified: 0, removed: 0 });
    expect(await (await call('/balance', {})).json()).toEqual({ ok: true, accounts: 1 });
    expect(await (await call('/unlink', {})).json()).toEqual({ ok: true });
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM bank_links').first('n')).toBe(0);
  });

  it('turns an unexpected throw into a 502 without the secret', async () => {
    plaid.createLinkToken = async () => { throw new Error('failed with sec in it'); };
    const res = await call('/link-token', { userId: 1 });
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, error: 'failed with <secret> in it' });
  });
});
