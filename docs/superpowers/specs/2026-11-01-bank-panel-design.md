# Bank panel in the K & A admin

Design agreed with Alex on 2026-11-01. He asked for the business bank balance and pending and recent transactions on the admin, and chose the live path (a bank-data provider) over the QuickBooks feed. The bank is Florida Credit Union (flcu.org, Gainesville). Build goes on branch `admin/bank` in worktree `D:\ka-site-bank`, preview locally first, deploy on Alex's word, one PowerShell line per step.

## Decisions

- **Provider: Plaid.** Florida Credit Union is listed as a Plaid institution (third-party coverage data gives `ins_120036`); it is confirmed against `/institutions/search` the moment sandbox keys exist. Teller was considered: free to 100 connections, but its API does not answer from Alex's machine and its coverage of a Gainesville credit union is unverified. The provider code lives in one module so a swap stays a one-file change, but only Plaid is built.
- **Cost model.** `/transactions/sync` is a monthly per-connected-account subscription and its response carries each account with cached balances, so the scheduled pull makes no Balance calls. `/accounts/balance/get` (a per-call charge) runs only from a "Refresh balance" button. Plaid's Limited Production gives 200 free calls per product with live data, enough to prove the link before Pay as you go.
- **Where Plaid lives: a new Worker `ka-bank-sync`**, a sibling of `analytics-sync/`, for the same reason that Worker exists (the Astro adapter generates the admin's entry point; a cron bolted onto it breaks between adapter versions). It holds the Plaid secrets, the token-encryption key, the cron, and every Plaid call. The admin reaches it only through a service binding `BANK_SYNC`. No route, `workers_dev` and `preview_urls` off.
- **Owner-only.** The gate in `src/lib/gate.js` already closes every route to clients except home, granted desks and logos, so `/bank` is owner-only by default. Every bank page and endpoint adds the second lock the People page uses (`user.role !== 'owner'` gives 403). The nav link is inside the owner branch of `Shell.astro`. Hannah's client login never sees it.
- **Token at rest.** The Plaid `access_token` is the first credential that arrives at runtime rather than through `wrangler secret put`. It is stored in D1 encrypted with AES-256-GCM under `BANK_TOKEN_KEY`, a secret only `ka-bank-sync` holds (32 random bytes, base64). The admin Worker never sees the plaintext token or the Plaid secret. Row shows provider, item id, institution, status, cursor, timestamps, and the ciphertext.
- **Snapshot, not live.** The panel reads D1. The cron (`0 */6 * * *`, four times a day) pulls transaction changes and cached balances. Buttons give "Sync now" (same pull) and "Refresh balance" (the paid live call). Both are plain form POSTs that call the sync Worker and 303 back with `?kind=ok|warn&msg=`, like `sites/[slug]/analytics/sync.js`.
- **Never shown:** full account numbers (Plaid gives only `mask`, store only that), routing numbers, the item id outside the owner page, any token. The panel's text never names the credit union's login.

## Data (migration `0005_bank.sql` in `migrations/`, database `ka-sites`)

```sql
-- 0005: bank link, accounts, transactions and sync runs for the owner-only bank panel
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
```

`tests/schema.test.js` gains the four tables in its exact list. Amounts are stored in Plaid's sign convention and displayed as money out and money in.

## The sync Worker (`admin/bank-sync/`)

`wrangler.jsonc`: name `ka-bank-sync`, `main ./index.js`, compatibility date `2026-08-13`, `triggers.crons ["0 */6 * * *"]`, D1 `DB` = `ka-sites` (`migrations_dir ../migrations`), vars `PLAID_ENV` (`sandbox` until Alex says production), `PLAID_CLIENT_NAME` `K & A Performance`, `ADMIN_ORIGIN` `https://admin.ka-performancefl.com`; secrets `PLAID_CLIENT_ID`, `PLAID_SECRET`, `BANK_TOKEN_KEY` (comment only, never values). `observability` on, `workers_dev` false, `preview_urls` false.

`index.js` exports `handleFetch(request, env, deps)` and a default with `scheduled` and `fetch`. Routes (POST only, JSON in and out, 404 otherwise):

- `POST /link-token` body `{ userId, redirect? }`: `/link/token/create` with `client_name`, `language en`, `country_codes ['US']`, `user.client_user_id`, `products ['transactions']`, `transactions.days_requested 90`, and `redirect_uri` `${ADMIN_ORIGIN}/bank/oauth` (the OAuth return for institutions that need it; Alex registers that URI in the Plaid dashboard). In update mode (body `{ update: true }`) send `access_token` and no `products`. Returns `{ link_token, expiration }`.
- `POST /exchange` body `{ publicToken, institution: { id, name } }`: `/item/public_token/exchange`, encrypt the access token, upsert `bank_links` (status ok, cursor null), then run a first sync. Returns `{ ok, accounts }`.
- `POST /sync`: the pull (below). Returns `{ ok, added, modified, removed, error? }`.
- `POST /balance`: `/accounts/balance/get`, writes `live_current`, `live_available`, `live_at`; records a run of kind `balance`. Returns `{ ok, accounts }`.
- `POST /unlink`: `/item/remove`, then deletes the link row (cascade). Returns `{ ok }`.

The pull, in `src/lib/bank-sync.js` as pure functions over `{ db, plaid, nowIso }` so tests inject a fake Plaid: open a run row (kind cron or manual; a run started under five minutes ago and unfinished is a lock, same rule as `analytics-sync.js` `openRun`); load the link; loop `/transactions/sync` from the stored cursor with `count 500` until `has_more` is false, applying `added` and `modified` as upserts, `removed` as `removed = 1`; on `TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION` restart the loop from the cursor the loop began with; upsert `bank_accounts` from the response's `accounts` with cached balances and `balance_at = nowIso`; store `next_cursor` and `synced_at`; close the run. Plaid error `ITEM_LOGIN_REQUIRED` sets link status `login_required` with the message and closes the run with `ok 0`; any other error sets `status error`. Transactions older than 400 days may be pruned at the end of a cron run.

`src/lib/plaid.js` is the provider module: `plaidFetch(env, path, body)` posting JSON to `https://${PLAID_ENV}.plaid.com${path}` with `PLAID-CLIENT-ID` and `PLAID-SECRET` headers, returning parsed JSON, throwing a `PlaidError` with `error_code` and `error_message` on non-2xx, with the secret scrubbed from any message the way `analytics-sync.js` scrubs the Metricool token. `src/lib/bank-crypto.js`: `seal(key, text)` and `open(key, b64)` with WebCrypto AES-GCM, 12-byte IV, key imported from base64.

## The admin

- `wrangler.jsonc`: service binding `BANK_SYNC` to `ka-bank-sync`, with a comment that the Worker is deployed first.
- `src/pages/bank/index.astro`, `<Shell title="Bank" active="bank">`, owner check at the top. Sections, in order:
  1. **Balance**: one `.card` per account not hidden: `h3` name with mask (`Checking ····1234`), `dl.facts` with Available and Current (cached, with `balance_at` in `easternDateTime`), and when `live_at` exists a second pair labeled "Live" with its time. Money formatted `$1,234.56`; negatives for credit accounts shown as owed.
  2. **Pending**: table `table.data` of transactions with `pending = 1` and `removed = 0`, newest first: date, name (merchant when present), amount as "out" or "in", category. Empty state `.empty` "Nothing pending."
  3. **Recent**: same table for posted transactions, last 30 days, newest first, capped at 100 rows, with a `?range=30|60|90` nav of `.btn quiet` like the analytics page.
  4. **Connection**: `.level` + `.dot` status line (green `linked`, amber `needs sign-in` for `login_required`, red `error`, gray `not linked`), institution name, last sync time from `bank_sync_runs`, and the buttons: "Sync now" (POST `/bank/sync`), "Refresh balance" (POST `/bank/balance`, with the hint that it is a paid live call), "Reconnect" (opens Link in update mode when `login_required`), "Unlink" (POST `/bank/unlink`, with a confirm). When no link exists the section shows only "Link bank account".
- `src/pages/bank/link.astro` (or a section of index): loads `https://cdn.plaid.com/link/v2/stable/link-initialize.js`, POSTs to `/bank/link-token` for a token, calls `Plaid.create({ token, onSuccess(public_token, metadata) })` which POSTs `/bank/exchange` with the public token and `metadata.institution`, then redirects to `/bank?kind=ok`. `src/pages/bank/oauth.astro` re-initializes Link with `receivedRedirectUri = window.location.href` and the link token kept in `sessionStorage`, per Plaid's OAuth flow. The Plaid script is the admin's second client script and the only external one; the CSP, if the admin sets one, allows `cdn.plaid.com`.
- Endpoints `src/pages/bank/{link-token,exchange,sync,balance,unlink}.js`: owner check, call `env.BANK_SYNC.fetch('https://ka-bank-sync/<route>', { method: 'POST', body })`, and either return JSON (link-token, exchange) or 303 to `/bank?kind=..&msg=..` (sync, balance, unlink). Each keeps a pure `handleX({ user, bankSync, ... })` beside the Astro export for tests.
- `src/lib/bank.js`: the D1 reads (`listAccounts`, `pendingTransactions`, `recentTransactions(days, limit)`, `linkStatus`, `lastRun`) and formatting helpers (`money`, `direction`).
- Nav: `Shell.astro` owner branch gains `<a href="/bank" aria-current={active === 'bank' ? 'page' : undefined}>Bank</a>` after People.
- Styles reuse `admin.css`; a scoped block for the amount column (`text-align: right; font-variant-numeric: tabular-nums`) and for money in (`--green`) versus out (ink). House rules: no pills, status is small-caps text beside a dot, no em dashes, amber never as text on light.

## Tests (vitest, `tests/`)

- `schema.test.js` table list; `bank-schema.test.js` cascades (deleting a link removes accounts and transactions).
- `gate.test.js`: `/bank`, `/bank/sync`, `/bank/exchange` are not client routes, and a client with an approve grant still gets 403 on `/bank` (copy the analytics owner-only test).
- `bank-sync.test.js`: with a fake Plaid, a first sync stores accounts, balances, transactions and the cursor; a second sync applies modified and removed; pagination with `has_more`; the mutation error restarts from the loop's starting cursor; `ITEM_LOGIN_REQUIRED` marks the link; the five-minute lock.
- `bank-crypto.test.js`: seal then open round-trips, a wrong key fails.
- `bank-routes.test.js`: owner-only on every endpoint, 303 targets and messages, JSON shape of link-token and exchange.
- `bank.test.js`: pending and recent queries, money formatting, direction.
- `bank-worker.test.js`: `handleFetch` routing and 404s.

## Deploy (Alex's lines, in order, each on his go)

1. `d1 migrations apply ka-sites --remote` (0005).
2. Alex creates the Plaid account (sign-up is his, not Claude's), copies the sandbox `client_id` and `secret`, generates `BANK_TOKEN_KEY` with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`, and registers `https://admin.ka-performancefl.com/bank/oauth` as an allowed redirect URI in the Plaid dashboard. Secrets go in with the clipboard route (`secret bulk` from a BOM-free JSON file, then delete the file), the Metricool lesson.
3. Deploy `ka-bank-sync` (`wrangler deploy -c bank-sync/wrangler.jsonc`).
4. Build and deploy the admin.
5. Alex opens `/bank`, links Florida Credit Union in sandbox (Plaid's sandbox credentials `user_good` / `pass_good` against the sandbox version of the institution), and the panel fills with test data. Then he applies for Production in the Plaid dashboard (Limited Production for the first real link), `PLAID_ENV` flips to `production` with production secrets, and he links the real account.

## Out of scope

Any money movement, Plaid Auth or Identity products, categorization beyond Plaid's primary category, exports, multiple links, client visibility of any bank data, and QuickBooks.
