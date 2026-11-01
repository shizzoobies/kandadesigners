// The bank panel's D1 reads and formatting. Reads only: ka-bank-sync writes
// every bank row. Nothing here selects the sealed token or the cursor, and an
// account is only ever shown by its mask (the last four digits Plaid gives).
// Amounts keep Plaid's sign (positive leaves the account); the page shows
// them as money out and money in.
import { todayEastern } from './when.js';

const rows = async (stmt) => (await stmt.all()).results ?? [];

export const RANGES = [30, 60, 90];
export const pickRange = (raw) => (RANGES.includes(Number(raw)) ? Number(raw) : 30);
export const LIMIT = 100;

/** The link as the page may show it: no ciphertext, no cursor. Null when nothing is linked. */
export async function linkStatus(db) {
  return db.prepare('SELECT id, provider, institution_id, institution_name, status, error, linked_at, synced_at, updated_at FROM bank_links ORDER BY linked_at LIMIT 1').first();
}

export async function listAccounts(db) {
  return rows(db.prepare(`SELECT id, name, official_name, mask, type, subtype, currency, current, available, live_current, live_available, live_at, balance_at
    FROM bank_accounts WHERE hidden = 0 ORDER BY CASE type WHEN 'depository' THEN 0 ELSE 1 END, type, name COLLATE NOCASE, id`));
}

const TX_SELECT = `SELECT t.id, t.date, t.authorized_date, t.name, t.merchant, t.amount, t.currency, t.category, a.name AS account_name, a.mask AS account_mask
  FROM bank_transactions t JOIN bank_accounts a ON a.id = t.account_id`;
const NEWEST = 'ORDER BY t.date DESC, COALESCE(t.authorized_date, t.date) DESC, t.id';

export async function pendingTransactions(db, limit = LIMIT) {
  return rows(db.prepare(`${TX_SELECT} WHERE t.pending = 1 AND t.removed = 0 AND a.hidden = 0 ${NEWEST} LIMIT ?`).bind(limit));
}

/** Posted transactions dated within the last `days` days (Eastern, today included), newest first. */
export async function recentTransactions(db, days = 30, limit = LIMIT, nowMs = Date.now()) {
  const today = todayEastern(nowMs);
  const since = new Date(Date.parse(`${today}T00:00:00Z`) - (days - 1) * 86400000).toISOString().slice(0, 10);
  return rows(db.prepare(`${TX_SELECT} WHERE t.pending = 0 AND t.removed = 0 AND a.hidden = 0 AND t.date >= ? ${NEWEST} LIMIT ?`).bind(since, limit));
}

// The run lock, shared with ka-bank-sync (lib/bank-sync.js startRun): a run
// that started under five minutes ago and has not finished holds its group.
// Pulls of any kind lock each other; a balance refresh locks only another.
export const OPEN_RUN_MS = 5 * 60000;
export const RUN_LOCKS = { sync: ['cron', 'manual', 'link'], balance: ['balance'] };

/** Whether a run of the group is open, so a button can wait for it. */
export async function openRun(db, nowMs, group = 'sync') {
  const kinds = RUN_LOCKS[group] ?? RUN_LOCKS.sync;
  const since = new Date(nowMs - OPEN_RUN_MS).toISOString();
  const row = await db.prepare(`SELECT id FROM bank_sync_runs WHERE kind IN (${kinds.map(() => '?').join(', ')}) AND finished_at IS NULL AND started_at > ? LIMIT 1`)
    .bind(...kinds, since).first();
  return Boolean(row);
}

/** The latest transaction pull (scheduled, Sync now or the first one at link), finished or not. */
export async function lastRun(db) {
  return db.prepare("SELECT kind, started_at, finished_at, ok, added, modified, removed, error FROM bank_sync_runs WHERE kind IN ('cron', 'manual', 'link') ORDER BY id DESC LIMIT 1").first();
}

const fmt = new Map();
/** $1,234.56, or -$1,234.56. n/a when there is no number. */
export function money(value, currency = 'USD') {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'n/a';
  const code = /^[A-Z]{3}$/.test(String(currency ?? '')) ? currency : 'USD';
  if (!fmt.has(code)) fmt.set(code, new Intl.NumberFormat('en-US', { style: 'currency', currency: code }));
  return fmt.get(code).format(Number(value));
}

/** Plaid's sign: a positive amount left the account. */
export const direction = (amount) => (Number(amount) < 0 ? 'in' : 'out');

/** "$45.20 out" or "$1,200.00 in". */
export const amountText = (amount, currency) => `${money(Math.abs(Number(amount)), currency)} ${direction(amount)}`;

const OWED = new Set(['credit', 'loan']);
/**
 * A credit or loan current balance is what is owed; Plaid gives it positive.
 * Available on a credit card is the credit left, so it stays plain money.
 */
export function balanceText(account, value, field = 'current') {
  if (value === null || value === undefined) return 'n/a';
  if (OWED.has(account.type) && field === 'current') return Number(value) < 0 ? `${money(-value, account.currency)} in credit` : `${money(value, account.currency)} owed`;
  return money(value, account.currency);
}

/** "Business Checking ····1234": the mask only, never more of the number. */
export const accountTitle = (a) => (a.mask ? `${a.name} ····${a.mask}` : a.name);

/** FOOD_AND_DRINK becomes "Food and drink". */
export function categoryLabel(code) {
  if (!code) return '';
  const words = String(code).toLowerCase().split('_').filter(Boolean);
  if (!words.length) return '';
  const s = words.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The status line: a dot color and a small-caps word. */
export function connectionState(link) {
  if (!link) return { dot: 'gray', word: 'not linked' };
  if (link.status === 'ok') return { dot: 'green', word: 'linked' };
  if (link.status === 'login_required') return { dot: 'amber', word: 'needs sign-in' };
  return { dot: 'red', word: 'error' };
}

/**
 * One POST to ka-bank-sync through the BANK_SYNC service binding. Returns
 * { res, body } with body {} when the reply is not JSON; a binding that
 * throws comes back as res null.
 */
export async function callBankSync(bankSync, route, payload = {}) {
  let res;
  try {
    res = await bankSync.fetch(`https://ka-bank-sync${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return { res: null, body: {} };
  }
  let body = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  return { res, body: body && typeof body === 'object' ? body : {} };
}

export const NOT_CONNECTED = 'The bank connection is not set up yet.';

/** The 303 back to the panel. kind comes before msg: 'ok' renders as a notice, 'warn' as an alert. */
export const backToBank = (msg, kind = 'warn') => ({ status: 303, location: `/bank?kind=${kind}&msg=${encodeURIComponent(msg)}` });

/** The JSON endpoints take application/json only: a cross-site form cannot send it. */
export const isJson = (request) => (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase() === 'application/json';

export async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}
