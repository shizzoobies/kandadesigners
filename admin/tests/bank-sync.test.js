import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import { fakePlaid, account, tx, plaidError, ACCESS_TOKEN } from './helpers/plaid.js';
import { seal, open } from '../src/lib/bank-crypto.js';
import { runSync, linkItem, linkToken, refreshBalance, unlinkItem, openRun, getLinkRow, OPEN_RUN_MS } from '../src/lib/bank-sync.js';

const KEY = btoa(String.fromCharCode(...new Uint8Array(32).map((_, i) => i + 1)));
const NOW = '2026-11-01T15:00:00.000Z';
const NOW_MS = Date.parse(NOW);
const clock = () => '2026-11-01T15:00:05.000Z';
let db;

async function addLink({ cursor = null, status = 'ok' } = {}) {
  const sealed = await seal(KEY, ACCESS_TOKEN);
  await db.prepare("INSERT INTO bank_links (id, provider, institution_id, institution_name, token_ciphertext, cursor, status, linked_at, updated_at) VALUES ('item-1', 'plaid', 'ins_120036', 'Florida Credit Union', ?, ?, ?, 't', 't')")
    .bind(sealed, cursor, status).run();
}

const all = async (sql) => (await db.prepare(sql).all()).results;
const link = () => db.prepare('SELECT cursor, status, error, synced_at FROM bank_links').first();
const runs = () => all('SELECT kind, ok, added, modified, removed, error, finished_at FROM bank_sync_runs ORDER BY id');
const sync = (plaid, kind = 'manual', nowIso = NOW) => runSync({ db, plaid, key: KEY, nowIso, kind, clock });

beforeEach(() => {
  db = makeD1();
});

describe('runSync', () => {
  it('says so when nothing is linked, and records no run', async () => {
    expect(await sync(fakePlaid())).toEqual({ status: 404, ok: false, error: 'No bank account is linked.' });
    expect(await runs()).toEqual([]);
  });

  it('first sync stores accounts, cached balances, transactions and the cursor', async () => {
    await addLink();
    const plaid = fakePlaid({
      pages: {
        null: {
          added: [tx('t1'), tx('t2', { pending: true, amount: -500, name: 'Deposit', merchant_name: 'Client Co' })],
          modified: [], removed: [],
          accounts: [account('acc-1'), account('acc-2', { name: 'Savings', mask: '9876', subtype: 'savings', balances: { available: null, current: 5000, iso_currency_code: 'USD' } })],
          next_cursor: 'c1', has_more: false,
        },
      },
    });
    const r = await sync(plaid);
    expect(r).toEqual({ status: 200, ok: true, added: 2, modified: 0, removed: 0 });
    expect(plaid.calls[0]).toEqual(['transactionsSync', ACCESS_TOKEN, null, 500]);
    expect(await all('SELECT id, link_id, name, mask, type, subtype, currency, current, available, balance_at, hidden FROM bank_accounts ORDER BY id')).toEqual([
      { id: 'acc-1', link_id: 'item-1', name: 'Business Checking', mask: '1234', type: 'depository', subtype: 'checking', currency: 'USD', current: 1250.75, available: 1200.5, balance_at: NOW, hidden: 0 },
      { id: 'acc-2', link_id: 'item-1', name: 'Savings', mask: '9876', type: 'depository', subtype: 'savings', currency: 'USD', current: 5000, available: null, balance_at: NOW, hidden: 0 },
    ]);
    expect(await all('SELECT id, account_id, date, name, merchant, amount, pending, category, removed FROM bank_transactions ORDER BY id')).toEqual([
      { id: 't1', account_id: 'acc-1', date: '2026-10-28', name: 'Purchase t1', merchant: null, amount: 12.34, pending: 0, category: 'GENERAL_MERCHANDISE', removed: 0 },
      { id: 't2', account_id: 'acc-1', date: '2026-10-28', name: 'Deposit', merchant: 'Client Co', amount: -500, pending: 1, category: 'GENERAL_MERCHANDISE', removed: 0 },
    ]);
    expect(await link()).toEqual({ cursor: 'c1', status: 'ok', error: null, synced_at: NOW });
    expect(await runs()).toEqual([{ kind: 'manual', ok: 1, added: 2, modified: 0, removed: 0, error: null, finished_at: clock() }]);
  });

  it('a second sync applies modified and removed from the stored cursor', async () => {
    await addLink();
    const plaid = fakePlaid({
      pages: {
        null: { added: [tx('t1', { pending: true }), tx('t2')], modified: [], removed: [], accounts: [account('acc-1')], next_cursor: 'c1', has_more: false },
        c1: {
          added: [tx('t3', { pending_transaction_id: 't1' })],
          modified: [tx('t2', { amount: 99.99, name: 'Corrected' })],
          removed: [{ transaction_id: 't1', account_id: 'acc-1' }],
          accounts: [account('acc-1', { balances: { available: 900, current: 950, iso_currency_code: 'USD' } })],
          next_cursor: 'c2', has_more: false,
        },
      },
    });
    await sync(plaid);
    const r = await sync(plaid, 'manual', '2026-11-01T16:00:00.000Z');
    expect(r).toMatchObject({ ok: true, added: 1, modified: 1, removed: 1 });
    expect(plaid.calls[1]).toEqual(['transactionsSync', ACCESS_TOKEN, 'c1', 500]);
    expect(await all('SELECT id, amount, name, removed, pending_id FROM bank_transactions ORDER BY id')).toEqual([
      { id: 't1', amount: 12.34, name: 'Purchase t1', removed: 1, pending_id: null },
      { id: 't2', amount: 99.99, name: 'Corrected', removed: 0, pending_id: null },
      { id: 't3', amount: 12.34, name: 'Purchase t3', removed: 0, pending_id: 't1' },
    ]);
    expect(await db.prepare('SELECT available, current FROM bank_accounts').first()).toEqual({ available: 900, current: 950 });
    expect((await link()).cursor).toBe('c2');
  });

  it('follows has_more across pages', async () => {
    await addLink();
    const plaid = fakePlaid({
      pages: {
        null: { added: [tx('t1')], modified: [], removed: [], accounts: [account('acc-1')], next_cursor: 'p2', has_more: true },
        p2: { added: [tx('t2')], modified: [], removed: [], accounts: [account('acc-1')], next_cursor: 'p3', has_more: true },
        p3: { added: [tx('t3')], modified: [], removed: [], accounts: [account('acc-1')], next_cursor: 'done', has_more: false },
      },
    });
    expect(await sync(plaid)).toMatchObject({ ok: true, added: 3 });
    expect(plaid.calls.map((c) => c[2])).toEqual([null, 'p2', 'p3']);
    expect((await link()).cursor).toBe('done');
    expect(await db.prepare('SELECT COUNT(*) AS n FROM bank_transactions').first('n')).toBe(3);
  });

  it('restarts from the cursor the loop began with after a mutation during pagination', async () => {
    await addLink({ cursor: 'start' });
    const plaid = fakePlaid({
      pages: {
        start: (n) => (n === 1
          ? { added: [tx('stale')], modified: [], removed: [], accounts: [account('acc-1')], next_cursor: 'mid', has_more: true }
          : { added: [tx('fresh')], modified: [], removed: [], accounts: [account('acc-1')], next_cursor: 'mid2', has_more: true }),
        mid: () => { throw plaidError('TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION'); },
        mid2: { added: [tx('fresh2')], modified: [], removed: [], accounts: [account('acc-1')], next_cursor: 'end', has_more: false },
      },
    });
    expect(await sync(plaid)).toMatchObject({ ok: true, added: 2 });
    expect(plaid.calls.map((c) => c[2])).toEqual(['start', 'mid', 'start', 'mid2']);
    expect((await all('SELECT id FROM bank_transactions ORDER BY id')).map((r) => r.id)).toEqual(['fresh', 'fresh2']);
    expect((await link()).cursor).toBe('end');
  });

  it('ITEM_LOGIN_REQUIRED marks the link for Reconnect and closes the run with ok 0', async () => {
    await addLink({ cursor: 'c1' });
    const plaid = fakePlaid({ pages: { c1: () => { throw plaidError('ITEM_LOGIN_REQUIRED', 'the login details of this item have changed'); } } });
    const r = await sync(plaid);
    expect(r).toMatchObject({ status: 200, ok: false });
    expect(r.error).toContain('ITEM_LOGIN_REQUIRED');
    expect(await link()).toMatchObject({ cursor: 'c1', status: 'login_required', synced_at: null });
    expect((await link()).error).toContain('login details');
    expect((await runs())[0]).toMatchObject({ kind: 'manual', ok: 0, finished_at: clock() });
  });

  it('any other error marks the link as an error, with the token scrubbed', async () => {
    await addLink();
    const plaid = fakePlaid({ pages: { null: () => { throw new Error(`boom with ${ACCESS_TOKEN} inside`); } } });
    const r = await sync(plaid);
    expect(r.error).toBe('boom with <secret> inside');
    expect(await link()).toMatchObject({ status: 'error', error: 'boom with <secret> inside' });
    expect(JSON.stringify(await runs())).not.toContain(ACCESS_TOKEN);
  });

  it('a later good sync clears the error', async () => {
    await addLink({ status: 'login_required' });
    await db.prepare("UPDATE bank_links SET error = 'old'").run();
    await sync(fakePlaid({ pages: { null: { added: [], modified: [], removed: [], accounts: [account('acc-1')], next_cursor: 'c1', has_more: false } } }));
    expect(await link()).toMatchObject({ status: 'ok', error: null });
  });

  it('waits for a sync started under five minutes ago that has not finished', async () => {
    await addLink();
    await db.prepare("INSERT INTO bank_sync_runs (kind, started_at) VALUES ('cron', ?)").bind(new Date(NOW_MS - 60000).toISOString()).run();
    expect(await openRun(db, NOW_MS)).toBe(true);
    const plaid = fakePlaid();
    expect(await sync(plaid)).toEqual({ status: 409, ok: false, error: 'A sync is already running. Try again in a few minutes.' });
    expect(plaid.calls).toEqual([]);
    expect(await openRun(db, NOW_MS + OPEN_RUN_MS)).toBe(false);
  });

  it('a balance run is not a lock', async () => {
    await db.prepare("INSERT INTO bank_sync_runs (kind, started_at) VALUES ('balance', ?)").bind(NOW).run();
    expect(await openRun(db, NOW_MS)).toBe(false);
  });

  it('a cron run prunes transactions older than 400 days', async () => {
    await addLink();
    const plaid = fakePlaid({
      pages: { null: { added: [tx('old', { date: '2025-09-01' }), tx('new')], modified: [], removed: [], accounts: [account('acc-1')], next_cursor: 'c1', has_more: false } },
    });
    await sync(plaid, 'cron');
    expect((await all('SELECT id FROM bank_transactions')).map((r) => r.id)).toEqual(['new']);
  });

  it('writes many transactions in chunks under the bound-value cap', async () => {
    await addLink();
    const added = Array.from({ length: 120 }, (_, i) => tx(`t${i}`));
    await sync(fakePlaid({ pages: { null: { added, modified: [], removed: added.slice(0, 15).map((t) => ({ transaction_id: t.transaction_id })), accounts: [account('acc-1')], next_cursor: 'c1', has_more: false } } }));
    expect(await db.prepare('SELECT COUNT(*) AS n FROM bank_transactions').first('n')).toBe(120);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM bank_transactions WHERE removed = 1').first('n')).toBe(15);
  });
});

describe('linkItem', () => {
  it('exchanges, seals the token, stores the link and runs a first sync', async () => {
    const plaid = fakePlaid({ pages: { null: { added: [tx('t1')], modified: [], removed: [], accounts: [account('acc-1')], next_cursor: 'c1', has_more: false } } });
    const r = await linkItem({ db, plaid, key: KEY, nowIso: NOW, clock, publicToken: 'public-sandbox-1', institution: { id: 'ins_120036', name: 'Florida Credit Union' } });
    expect(r).toEqual({ status: 200, ok: true, accounts: 1 });
    expect(plaid.calls[0]).toEqual(['exchangePublicToken', 'public-sandbox-1']);
    const row = await getLinkRow(db);
    expect(row).toMatchObject({ id: 'item-1', provider: 'plaid', institution_id: 'ins_120036', institution_name: 'Florida Credit Union', status: 'ok', cursor: 'c1', linked_at: NOW });
    expect(row.token_ciphertext).not.toContain(ACCESS_TOKEN);
    expect(await open(KEY, row.token_ciphertext)).toBe(ACCESS_TOKEN);
    expect((await runs())[0]).toMatchObject({ kind: 'link', ok: 1, added: 1 });
  });

  it('refuses a second link before exchanging anything', async () => {
    await addLink();
    const plaid = fakePlaid();
    expect(await linkItem({ db, plaid, key: KEY, nowIso: NOW, publicToken: 'p', institution: {} })).toEqual({ status: 409, ok: false, error: 'A bank account is already linked. Unlink it first.' });
    expect(plaid.calls).toEqual([]);
  });
});

describe('linkToken', () => {
  it('asks for a new-link token, or an update-mode token with the stored access token', async () => {
    const plaid = fakePlaid();
    expect(await linkToken({ db, plaid, key: KEY, userId: '1', redirectUri: 'https://admin.test/bank/oauth' }))
      .toEqual({ status: 200, link_token: 'link-sandbox-abc', expiration: '2026-11-01T20:00:00Z' });
    expect(plaid.calls[0]).toEqual(['createLinkToken', { userId: '1', accessToken: undefined, redirectUri: 'https://admin.test/bank/oauth' }]);
    expect(await linkToken({ db, plaid, key: KEY, userId: '1', update: true })).toEqual({ status: 404, error: 'No bank account is linked.' });
    await addLink();
    await linkToken({ db, plaid, key: KEY, userId: '1', update: true });
    expect(plaid.calls[1][1]).toMatchObject({ accessToken: ACCESS_TOKEN });
  });
});

describe('refreshBalance', () => {
  it('writes live balances and records a balance run', async () => {
    await addLink();
    await sync(fakePlaid({ pages: { null: { added: [], modified: [], removed: [], accounts: [account('acc-1')], next_cursor: 'c1', has_more: false } } }));
    const plaid = fakePlaid({ balances: [account('acc-1', { balances: { available: 1100, current: 1180.25, iso_currency_code: 'USD' } })] });
    expect(await refreshBalance({ db, plaid, key: KEY, nowIso: NOW, clock })).toEqual({ status: 200, ok: true, accounts: 1 });
    expect(await db.prepare('SELECT current, available, live_current, live_available, live_at FROM bank_accounts').first())
      .toEqual({ current: 1250.75, available: 1200.5, live_current: 1180.25, live_available: 1100, live_at: NOW });
    expect((await runs()).at(-1)).toMatchObject({ kind: 'balance', ok: 1 });
  });

  it('marks the link when the bank wants its sign-in again', async () => {
    await addLink();
    const plaid = fakePlaid();
    plaid.liveBalances = async () => { throw plaidError('ITEM_LOGIN_REQUIRED'); };
    expect(await refreshBalance({ db, plaid, key: KEY, nowIso: NOW, clock })).toMatchObject({ ok: false });
    expect((await link()).status).toBe('login_required');
  });
});

describe('unlinkItem', () => {
  it('removes the item at Plaid, then the link, its accounts and transactions', async () => {
    await addLink();
    await sync(fakePlaid({ pages: { null: { added: [tx('t1')], modified: [], removed: [], accounts: [account('acc-1')], next_cursor: 'c1', has_more: false } } }));
    const plaid = fakePlaid();
    expect(await unlinkItem({ db, plaid, key: KEY })).toEqual({ status: 200, ok: true });
    expect(plaid.calls).toEqual([['removeItem', ACCESS_TOKEN]]);
    expect(await getLinkRow(db)).toBeNull();
    expect(await db.prepare('SELECT COUNT(*) AS n FROM bank_transactions').first('n')).toBe(0);
  });

  it('keeps the link when Plaid refuses, and drops it when Plaid no longer knows the item', async () => {
    await addLink();
    expect(await unlinkItem({ db, plaid: fakePlaid({ removeError: plaidError('INTERNAL_SERVER_ERROR', 'try later') }), key: KEY })).toMatchObject({ ok: false });
    expect(await getLinkRow(db)).not.toBeNull();
    expect(await unlinkItem({ db, plaid: fakePlaid({ removeError: plaidError('ITEM_NOT_FOUND') }), key: KEY })).toEqual({ status: 200, ok: true });
    expect(await getLinkRow(db)).toBeNull();
  });
});
