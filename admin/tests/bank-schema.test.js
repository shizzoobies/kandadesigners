import { describe, it, expect } from 'vitest';
import { makeD1 } from './helpers/d1.js';

const count = async (db, table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first('n');

describe('0005 bank tables', () => {
  it('deleting a link removes its accounts and their transactions', async () => {
    const db = makeD1();
    await db.prepare("INSERT INTO bank_links (id, provider, token_ciphertext, status, linked_at, updated_at) VALUES ('item-1', 'plaid', 'x', 'ok', 't', 't')").run();
    await db.prepare("INSERT INTO bank_accounts (id, link_id, name, type, updated_at) VALUES ('acc-1', 'item-1', 'Checking', 'depository', 't')").run();
    await db.prepare("INSERT INTO bank_transactions (id, account_id, date, name, amount, updated_at) VALUES ('tx-1', 'acc-1', '2026-10-30', 'Coffee', 4.5, 't')").run();
    expect(await db.prepare("SELECT hidden FROM bank_accounts WHERE id = 'acc-1'").first('hidden')).toBe(0);
    expect(await db.prepare("SELECT pending, removed FROM bank_transactions WHERE id = 'tx-1'").first()).toEqual({ pending: 0, removed: 0 });
    await db.prepare("DELETE FROM bank_links WHERE id = 'item-1'").run();
    expect(await count(db, 'bank_accounts')).toBe(0);
    expect(await count(db, 'bank_transactions')).toBe(0);
  });

  it('refuses an account without a link and a transaction without an account', async () => {
    const db = makeD1();
    await expect(db.prepare("INSERT INTO bank_accounts (id, link_id, name, type, updated_at) VALUES ('acc-1', 'nope', 'Checking', 'depository', 't')").run()).rejects.toThrow();
    await expect(db.prepare("INSERT INTO bank_transactions (id, account_id, date, name, amount, updated_at) VALUES ('tx-1', 'nope', '2026-10-30', 'x', 1, 't')").run()).rejects.toThrow();
  });
});

describe('0005 one link only', () => {
  it('refuses a second link for the same provider', async () => {
    const db = makeD1();
    const add = (id) => db.prepare("INSERT INTO bank_links (id, provider, token_ciphertext, status, linked_at, updated_at) VALUES (?, 'plaid', 'x', 'ok', 't', 't')").bind(id).run();
    await add('item-1');
    await expect(add('item-2')).rejects.toThrow(/UNIQUE/);
  });
});
