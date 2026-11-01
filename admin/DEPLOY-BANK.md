# Deploy: bank panel

Spec: `docs/superpowers/specs/2026-11-01-bank-panel-design.md` (branch `admin/bank`).

Every step waits for Alex's yes. Run each line in PowerShell from `D:\ka-site-bank\admin` (each line starts with that `cd`). Wrangler reads `CLOUDFLARE_API_TOKEN` from the user environment, and no secret is ever printed, pasted into chat, or written to a file that stays on disk.

## Hazards until this deploy is finished
- **Migration 0005 before the admin.** `/bank` reads the four bank tables. Without them the page errors (nothing else in the admin touches them).
- **ka-bank-sync before the admin.** The admin's `wrangler.jsonc` binds the `ka-bank-sync` service as `BANK_SYNC`; the admin deploy fails while that Worker does not exist. An urgent Post Desk hotfix before then must go out from a commit before the `BANK_SYNC` binding.
- **Secrets after the Worker.** Until all three secrets are in, every route answers "The bank connection is not set up yet." and the cron only logs that line.

## 1. Migration 0005
```powershell
cd "D:\ka-site-bank\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 migrations apply ka-sites --remote
```
Check the four tables are there:
```powershell
cd "D:\ka-site-bank\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 execute ka-sites --remote --json --command "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'bank_%' ORDER BY name"
```
It must list `bank_accounts`, `bank_links`, `bank_sync_runs`, `bank_transactions`.

## 2. Plaid account (Alex, in the browser)
Sign-up is Alex's, not Claude's. In the Plaid dashboard:
- Developers, Keys: the sandbox `client_id` and `secret` (copy them one at a time in step 3b).
- Developers, API, Allowed redirect URIs: add `https://admin.ka-performancefl.com/bank/oauth`.

## 3a. Deploy ka-bank-sync
```powershell
cd "D:\ka-site-bank\admin"; node ./node_modules/wrangler/bin/wrangler.js deploy -c bank-sync/wrangler.jsonc
```
The output must list `env.DB (ka-sites)`, `PLAID_ENV ("sandbox")`, the schedule `0 */6 * * *`, and no route or workers.dev URL.

## 3b. The three secrets (clipboard route)
Each line writes one secret to a BOM-free JSON file in `%TEMP%`, hands it to `wrangler secret bulk`, deletes the file and clears the clipboard. Nothing is echoed.

Copy the sandbox `client_id` from the Plaid dashboard, then:
```powershell
cd "D:\ka-site-bank\admin"; $f = "$env:TEMP\ka-bank-secret.json"; [IO.File]::WriteAllText($f, (@{ PLAID_CLIENT_ID = (Get-Clipboard -Raw).Trim() } | ConvertTo-Json), (New-Object Text.UTF8Encoding $false)); node ./node_modules/wrangler/bin/wrangler.js secret bulk $f -c bank-sync/wrangler.jsonc; Remove-Item $f; Set-Clipboard -Value " "
```
Copy the sandbox `secret`, then:
```powershell
cd "D:\ka-site-bank\admin"; $f = "$env:TEMP\ka-bank-secret.json"; [IO.File]::WriteAllText($f, (@{ PLAID_SECRET = (Get-Clipboard -Raw).Trim() } | ConvertTo-Json), (New-Object Text.UTF8Encoding $false)); node ./node_modules/wrangler/bin/wrangler.js secret bulk $f -c bank-sync/wrangler.jsonc; Remove-Item $f; Set-Clipboard -Value " "
```
`BANK_TOKEN_KEY` (32 random bytes, base64) is generated straight into the file, never shown:
```powershell
cd "D:\ka-site-bank\admin"; $f = "$env:TEMP\ka-bank-secret.json"; $k = node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64'))"; [IO.File]::WriteAllText($f, (@{ BANK_TOKEN_KEY = $k } | ConvertTo-Json), (New-Object Text.UTF8Encoding $false)); Remove-Variable k; node ./node_modules/wrangler/bin/wrangler.js secret bulk $f -c bank-sync/wrangler.jsonc; Remove-Item $f
```
The key seals the Plaid access token in D1. It is not kept anywhere else on purpose: if it is ever lost or replaced, Unlink and link again.

Check the names (values are never shown):
```powershell
cd "D:\ka-site-bank\admin"; node ./node_modules/wrangler/bin/wrangler.js secret list -c bank-sync/wrangler.jsonc
```
It must list `BANK_TOKEN_KEY`, `PLAID_CLIENT_ID` and `PLAID_SECRET`.

## 4. Build and deploy the admin
```powershell
cd "D:\ka-site-bank\admin"; node ./node_modules/astro/astro.js build; if ($?) { node ./node_modules/wrangler/bin/wrangler.js deploy }
```
The deploy output must list the `BANK_SYNC` binding to `ka-bank-sync` beside `ANALYTICS_SYNC`.

## 5. First link in sandbox (Alex's click) and checks
Open `https://admin.ka-performancefl.com/bank`, press Link bank account, search for Florida Credit Union in Plaid's window (this also confirms Plaid lists it), and sign in with Plaid's sandbox test user `user_good` / `pass_good`. The panel should come back with "Linked." and the sandbox accounts. If the lists are empty, transactions are still being prepared; press Sync now a minute later.

Read the results back (the sealed token column is never selected):
```powershell
cd "D:\ka-site-bank\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 execute ka-sites --remote --json --command "SELECT institution_id, institution_name, status, error, linked_at, synced_at FROM bank_links"
cd "D:\ka-site-bank\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 execute ka-sites --remote --json --command "SELECT kind, started_at, finished_at, ok, added, modified, removed, error FROM bank_sync_runs ORDER BY id DESC LIMIT 5"
cd "D:\ka-site-bank\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 execute ka-sites --remote --json --command "SELECT name, mask, type, subtype, current, available, balance_at FROM bank_accounts"
```
`institution_id` should be `ins_120036`. The first run is `link` with `ok` 1. Then press Refresh balance once and check that a `balance` run appears and the cards gain a Live pair. Press Sync now and check a `manual` run.

The cron fires at 00:00, 06:00, 12:00 and 18:00 UTC; after the next one there should be a `cron` row. Read observability for ka-bank-sync's `bank-sync` log lines on that run.

Last, confirm a client cannot see it: signed in as a client, `/bank` must answer 403 and the nav must not show Bank.

## 6. Production (later, on Alex's word)
1. Apply for Production in the Plaid dashboard (Limited Production covers the first real link).
2. Press Unlink on `/bank` to remove the sandbox item (a sandbox token does not work in production).
3. Change `PLAID_ENV` to `production` in `bank-sync/wrangler.jsonc` and commit.
4. Copy the production `secret` and put it with the `PLAID_SECRET` line from 3b (the `client_id` is the same in both environments).
5. Redeploy the Worker:
```powershell
cd "D:\ka-site-bank\admin"; node ./node_modules/wrangler/bin/wrangler.js deploy -c bank-sync/wrangler.jsonc
```
6. Link the real account from `/bank`. Each Refresh balance press is a paid Balance call; the four daily syncs are covered by the Transactions subscription.
