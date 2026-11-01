// ka-bank-sync's work: Plaid's transactions and balances into ka-sites. Pure
// functions over { db, plaid, key, nowIso } so tests inject a fake Plaid; the
// Worker (bank-sync/) only wires the cron and the service binding to them.
// The access token is opened from D1 for each call and never logged; it, the
// key and the Plaid credentials are scrubbed from every stored error.
// Worker-side only: the admin imports its reads from bank.js, never this file.
import { seal, open } from './bank-crypto.js';
import { OPEN_RUN_MS, RUN_LOCKS } from './bank.js';

export const PAGE = 500;
export const KEEP_DAYS = 400;
export const MAX_RESTARTS = 3;
const MUTATION = 'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION';
const LOGIN = 'ITEM_LOGIN_REQUIRED';
const ALREADY_LINKED = 'A bank account is already linked. Unlink it first.';
export const UNOPENED_WARNING = 'The saved Plaid token could not be opened, so the connection may still exist at Plaid. Remove it in the Plaid dashboard too.';

const scrub = (text, secrets) => secrets.filter(Boolean).reduce((s, x) => s.split(String(x)).join('<secret>'), String(text));
const nil = (v) => (v === undefined ? null : v);
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const errorText = (err, secrets) => scrub(err?.message ?? err, secrets).slice(0, 300);

/** The one link (multiple links are out of scope), ciphertext included. Worker-side only. */
export async function getLinkRow(db) {
  return db.prepare('SELECT * FROM bank_links ORDER BY linked_at LIMIT 1').first();
}

/**
 * Opens a run row, or returns null when one of the same group (any pull, or
 * a balance refresh) started under five minutes ago and has not finished.
 * The check and the insert are one statement, so two clicks cannot both get
 * through. Unfinished runs older than that are closed first as abandoned.
 */
export async function startRun(db, kind, nowIso) {
  const since = new Date(Date.parse(nowIso) - OPEN_RUN_MS).toISOString();
  const kinds = kind === 'balance' ? RUN_LOCKS.balance : RUN_LOCKS.sync;
  await db.prepare("UPDATE bank_sync_runs SET finished_at = started_at, ok = 0, error = 'abandoned' WHERE finished_at IS NULL AND started_at <= ?")
    .bind(since).run();
  const r = await db.prepare(`INSERT INTO bank_sync_runs (kind, started_at) SELECT ?, ?
    WHERE NOT EXISTS (SELECT 1 FROM bank_sync_runs WHERE kind IN (${kinds.map(() => '?').join(', ')}) AND finished_at IS NULL AND started_at > ?)`)
    .bind(kind, nowIso, ...kinds, since).run();
  return r.meta.changes ? r.meta.last_row_id : null;
}

async function finishRun(db, id, finishedIso, { ok, added = null, modified = null, removed = null, error = null }) {
  await db.prepare('UPDATE bank_sync_runs SET finished_at = ?, ok = ?, added = ?, modified = ?, removed = ?, error = ? WHERE id = ?')
    .bind(finishedIso, ok ? 1 : 0, added, modified, removed, error, id).run();
}

// A Plaid error the bank's sign-in caused needs Reconnect; anything else is an error.
async function markLink(db, linkId, err, message, nowIso) {
  const status = err?.error_code === LOGIN ? 'login_required' : 'error';
  await db.prepare('UPDATE bank_links SET status = ?, error = ?, updated_at = ? WHERE id = ?').bind(status, message, nowIso, linkId).run();
}

// D1 caps a statement at 100 bound values, so rows go in several per statement.
// extra: values the statement binds besides the rows (removals bind updated_at).
export const MAX_BOUND = 100;
function chunked(rows, perRow, extra = 0) {
  const size = Math.max(1, Math.floor((MAX_BOUND - extra) / perRow));
  const out = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

const ACCOUNT_COLS = ['id', 'link_id', 'name', 'official_name', 'mask', 'type', 'subtype', 'currency', 'current', 'available', 'balance_at', 'updated_at'];
const TX_COLS = ['id', 'account_id', 'date', 'authorized_date', 'name', 'merchant', 'amount', 'currency', 'pending', 'pending_id', 'category', 'removed', 'updated_at'];
const placeholders = (n, cols) => Array.from({ length: n }, () => `(${cols.map(() => '?').join(', ')})`).join(', ');

function accountStatements(db, linkId, accounts, nowIso) {
  const values = accounts.map((a) => [
    String(a.account_id), linkId, String(a.name ?? a.official_name ?? 'Account'), nil(a.official_name), nil(a.mask), String(a.type ?? 'other'), nil(a.subtype),
    nil(a.balances?.iso_currency_code ?? a.balances?.unofficial_currency_code), num(a.balances?.current), num(a.balances?.available), nowIso, nowIso,
  ]);
  return chunked(values, ACCOUNT_COLS.length).map((group) => db.prepare(
    `INSERT INTO bank_accounts (${ACCOUNT_COLS.join(', ')}) VALUES ${placeholders(group.length, ACCOUNT_COLS)}
     ON CONFLICT(id) DO UPDATE SET link_id = excluded.link_id, name = excluded.name, official_name = excluded.official_name, mask = excluded.mask,
     type = excluded.type, subtype = excluded.subtype, currency = excluded.currency, current = excluded.current, available = excluded.available,
     balance_at = excluded.balance_at, updated_at = excluded.updated_at`,
  ).bind(...group.flat()));
}

function transactionStatements(db, txs, nowIso) {
  const values = txs.map((t) => [
    String(t.transaction_id), String(t.account_id), String(t.date), nil(t.authorized_date), String(t.name ?? t.merchant_name ?? 'Transaction'), nil(t.merchant_name),
    Number(t.amount), nil(t.iso_currency_code ?? t.unofficial_currency_code), t.pending ? 1 : 0, nil(t.pending_transaction_id),
    nil(t.personal_finance_category?.primary), 0, nowIso,
  ]);
  return chunked(values, TX_COLS.length).map((group) => db.prepare(
    `INSERT INTO bank_transactions (${TX_COLS.join(', ')}) VALUES ${placeholders(group.length, TX_COLS)}
     ON CONFLICT(id) DO UPDATE SET account_id = excluded.account_id, date = excluded.date, authorized_date = excluded.authorized_date,
     name = excluded.name, merchant = excluded.merchant, amount = excluded.amount, currency = excluded.currency, pending = excluded.pending,
     pending_id = excluded.pending_id, category = excluded.category, removed = 0, updated_at = excluded.updated_at`,
  ).bind(...group.flat()));
}

function removedStatements(db, ids, nowIso) {
  return chunked(ids, 1, 1).map((group) => db.prepare(
    `UPDATE bank_transactions SET removed = 1, updated_at = ? WHERE id IN (${group.map(() => '?').join(', ')})`,
  ).bind(nowIso, ...group));
}

// Every page from the stored cursor, kept in memory and applied once the last
// page is in. A mutation mid-pagination restarts from the cursor the loop began
// with, as Plaid asks, discarding the pages read so far. Each page lists only
// the accounts its own transactions touch, so accounts merge across pages.
async function pullChanges(plaid, token, startCursor) {
  for (let attempt = 0; ; attempt += 1) {
    const added = [];
    const modified = [];
    const removed = [];
    const accounts = new Map();
    let cursor = startCursor;
    try {
      for (;;) {
        const page = await plaid.transactionsSync(token, cursor, PAGE);
        added.push(...(page.added ?? []));
        modified.push(...(page.modified ?? []));
        removed.push(...(page.removed ?? []).map((r) => r.transaction_id).filter(Boolean));
        for (const a of page.accounts ?? []) if (a?.account_id) accounts.set(String(a.account_id), a);
        cursor = page.next_cursor ?? cursor;
        if (!page.has_more) break;
      }
      return { added, modified, removed, accounts, cursor };
    } catch (err) {
      if (err?.error_code === MUTATION && attempt < MAX_RESTARTS) continue;
      throw err;
    }
  }
}

const minusDays = (ymd, days) => new Date(Date.parse(`${ymd}T00:00:00Z`) - days * 86400000).toISOString().slice(0, 10);

/**
 * The pull: one run row, every page of changes, then /accounts/get (free,
 * cached) so every account's balance refreshes even on a quiet pull. Accounts,
 * transactions, removals and the new cursor go in one batch. A transaction
 * for an account Plaid did not list fails the run rather than being dropped.
 * Returns { status, ok, added, modified, removed, error? }.
 */
export async function runSync({ db, plaid, key, nowIso, kind = 'manual', clock = () => new Date().toISOString(), secrets = [] }) {
  const link = await getLinkRow(db);
  if (!link) return { status: 404, ok: false, error: 'No bank account is linked.' };
  const runId = await startRun(db, kind, nowIso);
  if (runId === null) return { status: 409, ok: false, error: 'A sync is already running. Try again in a few minutes.' };
  let token = null;
  try {
    token = await open(key, link.token_ciphertext);
    const changes = await pullChanges(plaid, token, link.cursor);
    for (const a of await plaid.accountsGet(token)) if (a?.account_id) changes.accounts.set(String(a.account_id), a);
    const accounts = [...changes.accounts.values()];
    const { results: known } = await db.prepare('SELECT id FROM bank_accounts WHERE link_id = ?').bind(link.id).all();
    const accountIds = new Set([...known.map((r) => r.id), ...changes.accounts.keys()]);
    const upserts = [...changes.added, ...changes.modified].filter((t) => t?.transaction_id);
    const stray = upserts.filter((t) => !accountIds.has(String(t.account_id))).length;
    if (stray) throw new Error(`${stray} ${stray === 1 ? 'transaction belongs' : 'transactions belong'} to an account Plaid did not list. Nothing from this pull was saved.`);
    await db.batch([
      ...accountStatements(db, link.id, accounts, nowIso),
      ...transactionStatements(db, upserts, nowIso),
      ...removedStatements(db, changes.removed, nowIso),
      db.prepare("UPDATE bank_links SET cursor = ?, synced_at = ?, status = 'ok', error = NULL, updated_at = ? WHERE id = ?").bind(nil(changes.cursor), nowIso, nowIso, link.id),
    ]);
    if (kind === 'cron') {
      await db.prepare('DELETE FROM bank_transactions WHERE date < ?').bind(minusDays(nowIso.slice(0, 10), KEEP_DAYS)).run();
    }
    const counts = { added: changes.added.length, modified: changes.modified.length, removed: changes.removed.length };
    await finishRun(db, runId, clock(), { ok: true, ...counts });
    return { status: 200, ok: true, ...counts };
  } catch (err) {
    const message = errorText(err, [token, key, ...secrets]);
    await markLink(db, link.id, err, message, nowIso);
    await finishRun(db, runId, clock(), { ok: false, error: message });
    return { status: 200, ok: false, added: 0, modified: 0, removed: 0, error: message };
  }
}

/**
 * A new link: prove the key works, exchange the public token, seal the access
 * token, store the link, then the first sync. One link only, so a second is
 * refused before anything is exchanged, and a second that races past that
 * check fails on the one-per-provider index. If the seal or the insert fails
 * after the exchange, the new item is removed at Plaid so nothing is left
 * billing with no row to unlink it.
 */
export async function linkItem({ db, plaid, key, nowIso, publicToken, institution = {}, clock, secrets = [] }) {
  if (await getLinkRow(db)) return { status: 409, ok: false, error: ALREADY_LINKED };
  await open(key, await seal(key, 'key check'));
  const { access_token: accessToken, item_id: itemId } = await plaid.exchangePublicToken(publicToken);
  try {
    const sealed = await seal(key, accessToken);
    await db.prepare(`INSERT INTO bank_links (id, provider, institution_id, institution_name, token_ciphertext, cursor, status, error, linked_at, synced_at, updated_at)
      VALUES (?, 'plaid', ?, ?, ?, NULL, 'ok', NULL, ?, NULL, ?)`)
      .bind(String(itemId), nil(institution.id), nil(institution.name), sealed, nowIso, nowIso).run();
  } catch (err) {
    try {
      await plaid.removeItem(accessToken);
    } catch {
      // Best effort: the original error is the one worth reporting.
    }
    if (/UNIQUE/i.test(String(err?.message))) return { status: 409, ok: false, error: ALREADY_LINKED };
    throw new Error(errorText(err, [accessToken, key, ...secrets]));
  }
  const first = await runSync({ db, plaid, key, nowIso, kind: 'link', clock, secrets: [accessToken, ...secrets] });
  const accounts = await db.prepare('SELECT COUNT(*) AS n FROM bank_accounts WHERE link_id = ?').bind(String(itemId)).first('n');
  return { status: 200, ok: first.ok, accounts, ...(first.error ? { error: first.error } : {}) };
}

/** A link token for Plaid Link; with update, for the stored item (Reconnect). */
export async function linkToken({ db, plaid, key, userId, update = false, redirectUri }) {
  let accessToken;
  if (update) {
    const link = await getLinkRow(db);
    if (!link) return { status: 404, error: 'No bank account is linked.' };
    accessToken = await open(key, link.token_ciphertext);
  }
  const r = await plaid.createLinkToken({ userId, accessToken, redirectUri });
  return { status: 200, link_token: r.link_token, expiration: r.expiration };
}

/** "Refresh balance": the paid live call, into live_current, live_available and live_at. */
export async function refreshBalance({ db, plaid, key, nowIso, clock = () => new Date().toISOString(), secrets = [] }) {
  const link = await getLinkRow(db);
  if (!link) return { status: 404, ok: false, error: 'No bank account is linked.' };
  const runId = await startRun(db, 'balance', nowIso);
  if (runId === null) return { status: 409, ok: false, error: 'A balance refresh is already running. Try again in a few minutes.' };
  let token = null;
  try {
    token = await open(key, link.token_ciphertext);
    const accounts = await plaid.liveBalances(token);
    if (accounts.length) {
      await db.batch(accounts.map((a) => db.prepare('UPDATE bank_accounts SET live_current = ?, live_available = ?, live_at = ?, updated_at = ? WHERE id = ? AND link_id = ?')
        .bind(num(a.balances?.current), num(a.balances?.available), nowIso, nowIso, String(a.account_id), link.id)));
    }
    await finishRun(db, runId, clock(), { ok: true });
    return { status: 200, ok: true, accounts: accounts.length };
  } catch (err) {
    const message = errorText(err, [token, key, ...secrets]);
    await markLink(db, link.id, err, message, nowIso);
    await finishRun(db, runId, clock(), { ok: false, error: message });
    return { status: 200, ok: false, accounts: 0, error: message };
  }
}

/**
 * Unlink: remove the item at Plaid, then the link row (accounts and
 * transactions cascade). When the sealed token cannot be opened (the key was
 * lost or replaced) the row goes anyway, so a new link is possible, with a
 * warning that the item must also be removed in the Plaid dashboard.
 */
export async function unlinkItem({ db, plaid, key, secrets = [] }) {
  const link = await getLinkRow(db);
  if (!link) return { status: 404, ok: false, error: 'No bank account is linked.' };
  const drop = () => db.prepare('DELETE FROM bank_links WHERE id = ?').bind(link.id).run();
  let token;
  try {
    token = await open(key, link.token_ciphertext);
  } catch {
    await drop();
    return { status: 200, ok: true, warning: UNOPENED_WARNING };
  }
  try {
    await plaid.removeItem(token);
  } catch (err) {
    // An item Plaid no longer knows is already unlinked there.
    if (err?.error_code !== 'ITEM_NOT_FOUND') return { status: 200, ok: false, error: errorText(err, [token, key, ...secrets]) };
  }
  await drop();
  return { status: 200, ok: true };
}
