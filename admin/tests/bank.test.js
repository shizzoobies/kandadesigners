import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import * as b from '../src/lib/bank.js';

const NOW = Date.parse('2026-11-01T15:00:00Z');
let db;

const addTx = (id, over = {}) => {
  const t = { account_id: 'acc-1', date: '2026-10-28', authorized_date: null, name: `Tx ${id}`, merchant: null, amount: 10, pending: 0, removed: 0, category: null, ...over };
  return db.prepare('INSERT INTO bank_transactions (id, account_id, date, authorized_date, name, merchant, amount, currency, pending, category, removed, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, t.account_id, t.date, t.authorized_date, t.name, t.merchant, t.amount, 'USD', t.pending, t.category, t.removed, 't').run();
};

beforeEach(async () => {
  db = makeD1();
  await db.prepare("INSERT INTO bank_links (id, provider, institution_name, token_ciphertext, cursor, status, linked_at, updated_at) VALUES ('item-1', 'plaid', 'Florida Credit Union', 'SEALED', 'CURSOR', 'ok', 't', 't')").run();
  await db.prepare("INSERT INTO bank_accounts (id, link_id, name, mask, type, currency, current, available, updated_at) VALUES ('acc-1', 'item-1', 'Business Checking', '1234', 'depository', 'USD', 100, 90, 't')").run();
  await db.prepare("INSERT INTO bank_accounts (id, link_id, name, mask, type, currency, current, hidden, updated_at) VALUES ('acc-2', 'item-1', 'Old Savings', '5555', 'depository', 'USD', 5, 1, 't')").run();
});

describe('bank reads', () => {
  it('linkStatus never selects the sealed token or the cursor', async () => {
    const link = await b.linkStatus(db);
    expect(link).toMatchObject({ id: 'item-1', institution_name: 'Florida Credit Union', status: 'ok' });
    expect(link.token_ciphertext).toBeUndefined();
    expect(link.cursor).toBeUndefined();
    expect(JSON.stringify(link)).not.toContain('SEALED');
  });

  it('listAccounts leaves hidden accounts out', async () => {
    expect((await b.listAccounts(db)).map((a) => a.id)).toEqual(['acc-1']);
  });

  it('pendingTransactions: pending, not removed, visible accounts, newest first', async () => {
    await addTx('p1', { pending: 1, date: '2026-10-30' });
    await addTx('p2', { pending: 1, date: '2026-10-31' });
    await addTx('p3', { pending: 1, removed: 1 });
    await addTx('p4', { pending: 1, account_id: 'acc-2' });
    await addTx('posted');
    const rows = await b.pendingTransactions(db);
    expect(rows.map((r) => r.id)).toEqual(['p2', 'p1']);
    expect(rows[0]).toMatchObject({ account_name: 'Business Checking', account_mask: '1234' });
  });

  it('recentTransactions: posted within the range, newest first, capped', async () => {
    await addTx('in-range', { date: '2026-10-05' });
    await addTx('edge', { date: '2026-10-02' });
    await addTx('too-old', { date: '2026-10-01' });
    await addTx('newest', { date: '2026-10-31' });
    await addTx('pending', { pending: 1, date: '2026-10-31' });
    await addTx('removed', { removed: 1, date: '2026-10-31' });
    expect((await b.recentTransactions(db, 30, 100, NOW)).map((r) => r.id)).toEqual(['newest', 'in-range', 'edge']);
    expect((await b.recentTransactions(db, 60, 100, NOW)).map((r) => r.id)).toEqual(['newest', 'in-range', 'edge', 'too-old']);
    expect((await b.recentTransactions(db, 90, 2, NOW)).map((r) => r.id)).toEqual(['newest', 'in-range']);
  });

  it('lastRun is the latest pull, not a balance refresh', async () => {
    expect(await b.lastRun(db)).toBeNull();
    await db.prepare("INSERT INTO bank_sync_runs (kind, started_at, finished_at, ok) VALUES ('cron', '2026-11-01T12:00:00Z', '2026-11-01T12:00:03Z', 1)").run();
    await db.prepare("INSERT INTO bank_sync_runs (kind, started_at, finished_at, ok) VALUES ('balance', '2026-11-01T13:00:00Z', '2026-11-01T13:00:01Z', 1)").run();
    expect(await b.lastRun(db)).toMatchObject({ kind: 'cron', ok: 1 });
  });
});

describe('bank formatting', () => {
  it('money', () => {
    expect(b.money(1234.56)).toBe('$1,234.56');
    expect(b.money(-1234.5)).toBe('-$1,234.50');
    expect(b.money(0)).toBe('$0.00');
    expect(b.money(null)).toBe('n/a');
    expect(b.money(undefined)).toBe('n/a');
    expect(b.money(5, 'not a code')).toBe('$5.00');
  });

  it('direction and amountText follow Plaid\'s sign', () => {
    expect(b.direction(45.2)).toBe('out');
    expect(b.direction(-1200)).toBe('in');
    expect(b.amountText(45.2, 'USD')).toBe('$45.20 out');
    expect(b.amountText(-1200, 'USD')).toBe('$1,200.00 in');
  });

  it('balanceText shows credit and loan balances as owed', () => {
    expect(b.balanceText({ type: 'depository', currency: 'USD' }, 1250.75)).toBe('$1,250.75');
    expect(b.balanceText({ type: 'depository', currency: 'USD' }, -20)).toBe('-$20.00');
    expect(b.balanceText({ type: 'credit', currency: 'USD' }, 410.1)).toBe('$410.10 owed');
    expect(b.balanceText({ type: 'credit', currency: 'USD' }, -15)).toBe('$15.00 in credit');
    expect(b.balanceText({ type: 'credit', currency: 'USD' }, 8657.82, 'available')).toBe('$8,657.82');
    expect(b.balanceText({ type: 'loan', currency: 'USD' }, null)).toBe('n/a');
  });

  it('accountTitle shows the mask only', () => {
    expect(b.accountTitle({ name: 'Checking', mask: '1234' })).toBe('Checking ····1234');
    expect(b.accountTitle({ name: 'Checking', mask: null })).toBe('Checking');
  });

  it('categoryLabel, connectionState and pickRange', () => {
    expect(b.categoryLabel('FOOD_AND_DRINK')).toBe('Food and drink');
    expect(b.categoryLabel(null)).toBe('');
    expect(b.connectionState(null)).toEqual({ dot: 'gray', word: 'not linked' });
    expect(b.connectionState({ status: 'ok' })).toEqual({ dot: 'green', word: 'linked' });
    expect(b.connectionState({ status: 'login_required' })).toEqual({ dot: 'amber', word: 'needs sign-in' });
    expect(b.connectionState({ status: 'error' })).toEqual({ dot: 'red', word: 'error' });
    expect(b.pickRange('60')).toBe(60);
    expect(b.pickRange('7')).toBe(30);
    expect(b.pickRange(null)).toBe(30);
  });
});
