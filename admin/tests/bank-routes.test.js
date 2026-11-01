import { describe, it, expect, vi } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import { handleSync } from '../src/pages/bank/sync.js';
import { handleBalance } from '../src/pages/bank/balance.js';
import { handleUnlink, POST as unlinkPost } from '../src/pages/bank/unlink.js';
import { handleLinkToken, POST as linkTokenPost } from '../src/pages/bank/link-token.js';
import { handleExchange, POST as exchangePost } from '../src/pages/bank/exchange.js';
import { isJson } from '../src/lib/bank.js';

const OWNER = { id: 1, role: 'owner', grants: [] };
const CLIENT = { id: 2, role: 'client', grants: [{ site_id: 5, slug: 'foremotion-golf', level: 'approve' }] };
const NOW = Date.parse('2026-11-01T15:00:00Z');

const stub = (status, body) => ({ fetch: vi.fn(async () => (typeof body === 'string' ? new Response(body, { status }) : Response.json(body, { status }))) });
const msgOf = (r) => decodeURIComponent(r.location.split('msg=')[1]);
const sent = (s) => {
  const [url, init] = s.fetch.mock.calls[0];
  return { url, method: init.method, body: JSON.parse(init.body) };
};

describe('owner-only on every bank endpoint', () => {
  it('the Astro exports answer 403 before reading the body', async () => {
    const env = { BANK_SYNC: stub(200, { ok: true }) };
    const locals = { user: CLIENT, runtime: { env } };
    const plain = () => new Request('https://admin.test/bank/x', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'x' });
    expect((await linkTokenPost({ request: plain(), locals })).status).toBe(403);
    expect((await exchangePost({ request: plain(), locals })).status).toBe(403);
    expect((await unlinkPost({ request: plain(), locals })).status).toBe(403);
    expect(env.BANK_SYNC.fetch).not.toHaveBeenCalled();
  });

  it('refuses a client, even one with an approve grant, and calls nothing', async () => {
    for (const user of [CLIENT, undefined, { id: 9, role: 'viewer' }]) {
      const s = stub(200, { ok: true });
      expect((await handleSync({ user, bankSync: s })).status).toBe(403);
      expect((await handleBalance({ user, bankSync: s })).status).toBe(403);
      expect((await handleUnlink({ user, bankSync: s, confirmed: true })).status).toBe(403);
      expect((await handleLinkToken({ user, bankSync: s })).status).toBe(403);
      expect((await handleExchange({ user, bankSync: s, body: { publicToken: 'p' } })).status).toBe(403);
      expect(s.fetch).not.toHaveBeenCalled();
    }
  });
});

describe('POST /bank/sync', () => {
  it('calls the sync Worker and 303s back with the counts', async () => {
    const s = stub(200, { ok: true, added: 3, modified: 1, removed: 0 });
    const r = await handleSync({ user: OWNER, bankSync: s, db: makeD1(), nowMs: NOW });
    expect(r.status).toBe(303);
    expect(r.location.startsWith('/bank?kind=ok&msg=')).toBe(true);
    expect(msgOf(r)).toBe('Synced. 3 new transactions, 1 changed, 0 removed.');
    expect(sent(s)).toEqual({ url: 'https://ka-bank-sync/sync', method: 'POST', body: {} });
    expect(msgOf(await handleSync({ user: OWNER, bankSync: stub(200, { ok: true, added: 1, modified: 0, removed: 0 }) }))).toBe('Synced. 1 new transaction, 0 changed, 0 removed.');
  });

  it('reports a failed pull, a refusal, a throw and a reply that is not JSON as warnings', async () => {
    const failed = await handleSync({ user: OWNER, bankSync: stub(200, { ok: false, error: 'ITEM_LOGIN_REQUIRED' }) });
    expect(failed.location).toContain('kind=warn');
    expect(msgOf(failed)).toBe('The sync failed: ITEM_LOGIN_REQUIRED');
    expect(msgOf(await handleSync({ user: OWNER, bankSync: stub(404, { error: 'No bank account is linked.' }) }))).toBe('No bank account is linked.');
    expect(msgOf(await handleSync({ user: OWNER, bankSync: { fetch: async () => { throw new Error('down'); } } }))).toBe('The sync could not be started.');
    expect(msgOf(await handleSync({ user: OWNER, bankSync: stub(502, '<html>') }))).toBe('The sync failed (502).');
    expect(msgOf(await handleSync({ user: OWNER, bankSync: undefined }))).toBe('The bank connection is not set up yet.');
  });

  it('waits for an open run without calling the Worker', async () => {
    const db = makeD1();
    await db.prepare("INSERT INTO bank_sync_runs (kind, started_at) VALUES ('cron', ?)").bind(new Date(NOW - 60000).toISOString()).run();
    const s = stub(200, { ok: true });
    expect(msgOf(await handleSync({ user: OWNER, bankSync: s, db, nowMs: NOW }))).toBe('A sync is already running. Try again in a few minutes.');
    expect(s.fetch).not.toHaveBeenCalled();
  });
});

describe('POST /bank/balance', () => {
  it('calls /balance and says so', async () => {
    const s = stub(200, { ok: true, accounts: 2 });
    const r = await handleBalance({ user: OWNER, bankSync: s });
    expect(r).toEqual({ status: 303, location: `/bank?kind=ok&msg=${encodeURIComponent('Live balance refreshed.')}` });
    expect(sent(s).url).toBe('https://ka-bank-sync/balance');
    expect(msgOf(await handleBalance({ user: OWNER, bankSync: stub(200, { ok: false, error: 'x' }) }))).toBe('The balance refresh failed: x');
  });
});

describe('POST /bank/unlink', () => {
  it('needs the confirm, then calls /unlink', async () => {
    const s = stub(200, { ok: true });
    const no = await handleUnlink({ user: OWNER, bankSync: s, confirmed: false });
    expect(msgOf(no)).toBe('Nothing was unlinked. Use Yes, unlink to confirm.');
    expect(s.fetch).not.toHaveBeenCalled();
    const yes = await handleUnlink({ user: OWNER, bankSync: s, confirmed: true });
    expect(yes.location).toContain('kind=ok');
    expect(msgOf(yes)).toBe('Unlinked. The accounts and transactions are gone from this panel.');
    expect(sent(s).url).toBe('https://ka-bank-sync/unlink');
  });

  it('passes the unopened-token warning on as a warning', async () => {
    const r = await handleUnlink({ user: OWNER, bankSync: stub(200, { ok: true, warning: 'Remove it in the Plaid dashboard too.' }), confirmed: true });
    expect(r.location).toContain('kind=warn');
    expect(msgOf(r)).toBe('Unlinked here, and the accounts and transactions are gone from this panel. Remove it in the Plaid dashboard too.');
  });
});

describe('POST /bank/link-token', () => {
  it('passes the owner id and mode, and returns { link_token, expiration }', async () => {
    const s = stub(200, { link_token: 'link-sandbox-abc', expiration: '2026-11-01T19:00:00Z' });
    expect(await handleLinkToken({ user: OWNER, bankSync: s })).toEqual({ status: 200, body: { link_token: 'link-sandbox-abc', expiration: '2026-11-01T19:00:00Z' } });
    expect(sent(s)).toEqual({ url: 'https://ka-bank-sync/link-token', method: 'POST', body: { userId: '1', update: false } });
    const u = stub(200, { link_token: 'link-2' });
    await handleLinkToken({ user: OWNER, bankSync: u, update: true });
    expect(sent(u).body).toEqual({ userId: '1', update: true });
  });

  it('passes errors through with a message', async () => {
    expect(await handleLinkToken({ user: OWNER, bankSync: stub(503, { error: 'The bank connection is not set up yet.' }) }))
      .toEqual({ status: 503, body: { error: 'The bank connection is not set up yet.' } });
    expect((await handleLinkToken({ user: OWNER, bankSync: stub(200, {}) })).status).toBe(502);
    expect(await handleLinkToken({ user: OWNER, bankSync: stub(503, '<html>') })).toEqual({ status: 503, body: { error: 'The bank sync Worker did not answer (503).' } });
    expect((await handleLinkToken({ user: OWNER, bankSync: undefined })).status).toBe(503);
  });
});

describe('POST /bank/exchange', () => {
  it('sends the public token and institution, and returns { ok, accounts }', async () => {
    const s = stub(200, { ok: true, accounts: 2 });
    const r = await handleExchange({ user: OWNER, bankSync: s, body: { publicToken: 'public-sandbox-1', institution: { id: 'ins_120036', name: 'Florida Credit Union', extra: 'x' } } });
    expect(r).toEqual({ status: 200, body: { ok: true, accounts: 2 } });
    expect(sent(s)).toEqual({ url: 'https://ka-bank-sync/exchange', method: 'POST', body: { publicToken: 'public-sandbox-1', institution: { id: 'ins_120036', name: 'Florida Credit Union' } } });
  });

  it('refuses a missing token and passes a refusal through', async () => {
    const s = stub(200, { ok: true });
    expect((await handleExchange({ user: OWNER, bankSync: s, body: {} })).status).toBe(400);
    expect(s.fetch).not.toHaveBeenCalled();
    expect(await handleExchange({ user: OWNER, bankSync: stub(409, { ok: false, error: 'A bank account is already linked. Unlink it first.' }), body: { publicToken: 'p' } }))
      .toEqual({ status: 409, body: { ok: false, error: 'A bank account is already linked. Unlink it first.' } });
    expect(await handleExchange({ user: OWNER, bankSync: stub(200, { ok: false, accounts: 1, error: 'sync failed' }), body: { publicToken: 'p' } }))
      .toEqual({ status: 200, body: { ok: false, accounts: 1, error: 'sync failed' } });
  });

  it('the JSON endpoints accept application/json only', () => {
    const req = (type) => new Request('https://admin.test/bank/exchange', { method: 'POST', headers: type ? { 'Content-Type': type } : {}, body: '{}' });
    expect(isJson(req('application/json'))).toBe(true);
    expect(isJson(req('application/json; charset=utf-8'))).toBe(true);
    expect(isJson(req('text/plain'))).toBe(false);
    expect(isJson(req('application/x-www-form-urlencoded'))).toBe(false);
  });
});
