-- 0005: bank link, accounts, transactions and sync runs for the owner-only bank panel
-- ka-bank-sync writes every row; the admin only reads them. Plaid gives an
-- account's mask (last four digits), never the full number, and only the mask
-- is kept. The access token is stored sealed (AES-256-GCM under BANK_TOKEN_KEY,
-- a secret only ka-bank-sync holds). Amounts keep Plaid's sign: positive
-- leaves the account.
CREATE TABLE bank_links (
  id TEXT PRIMARY KEY,                 -- Plaid item_id
  provider TEXT NOT NULL,              -- 'plaid'
  institution_id TEXT, institution_name TEXT,
  token_ciphertext TEXT NOT NULL,      -- base64(iv || ciphertext || tag), AES-256-GCM under BANK_TOKEN_KEY
  cursor TEXT,                         -- /transactions/sync next_cursor, NULL before first sync
  status TEXT NOT NULL,                -- 'ok' | 'error' | 'login_required'
  error TEXT,
  linked_at TEXT NOT NULL, synced_at TEXT, updated_at TEXT NOT NULL
);
CREATE TABLE bank_accounts (
  id TEXT PRIMARY KEY,                 -- Plaid account_id
  link_id TEXT NOT NULL REFERENCES bank_links(id) ON DELETE CASCADE,
  name TEXT NOT NULL, official_name TEXT, mask TEXT, type TEXT NOT NULL, subtype TEXT,
  currency TEXT,                       -- iso_currency_code
  current REAL, available REAL,        -- cached balances from the sync response
  live_current REAL, live_available REAL, live_at TEXT,   -- from Refresh balance
  balance_at TEXT, hidden INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
);
CREATE TABLE bank_transactions (
  id TEXT PRIMARY KEY,                 -- Plaid transaction_id
  account_id TEXT NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  date TEXT NOT NULL, authorized_date TEXT,
  name TEXT NOT NULL, merchant TEXT,
  amount REAL NOT NULL,                -- Plaid sign: positive leaves the account
  currency TEXT, pending INTEGER NOT NULL DEFAULT 0, pending_id TEXT,
  category TEXT,                       -- personal_finance_category.primary
  removed INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
);
CREATE INDEX bank_transactions_account_date ON bank_transactions(account_id, date DESC);
CREATE TABLE bank_sync_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,                  -- 'cron' | 'manual' | 'balance' | 'link'
  started_at TEXT NOT NULL, finished_at TEXT,
  ok INTEGER, added INTEGER, modified INTEGER, removed INTEGER, error TEXT
);
