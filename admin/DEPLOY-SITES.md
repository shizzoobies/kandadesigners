# Deploying the sites dashboard

Alex runs each line, in order, in PowerShell. Claude verifies after each step.
Stop at the first error and paste it into the session.

## 0. Before anything
- `admin/three-bugs` is merged to `main` (it is what is live today).
- Alex confirms the email he signs into Cloudflare Access with. If it is not
  `alex@ka-performancefl.com`, fix it in `admin/seed/data.js`, then re-run
  `node scripts/seed-sql.mjs` and commit.
- Alex creates a fine-grained, read-only GitHub token (Metadata, Contents,
  Pull requests) on the shizzoobies account, covering the shizzoobies repos
  listed in `seed/data.js`. Sites under other owners are tracked by hand.

## 1. Create the database and the logo bucket
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 create ka-sites
```
Copy the `database_id` it prints into BOTH `admin/wrangler.jsonc` and
`admin/checker/wrangler.jsonc` (Claude does this and commits), then:
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js r2 bucket create ka-sites-logos
```

## 2. Schema and seed
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 migrations apply ka-sites --remote; if ($?) { node ./node_modules/wrangler/bin/wrangler.js d1 execute ka-sites --remote --file seed/seed.sql }
```

## 3. Deploy the checker, then wait one cycle
It runs fine with no secrets set yet: GitHub sync is skipped (logged, not
fatal) and alert emails are held rather than sent.
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js deploy -c checker/wrangler.jsonc
```
Claude verifies after 15 minutes:
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 execute ka-sites --remote --command "SELECT s.slug, c.ok, c.http_status, c.error FROM sites s JOIN checks c ON c.site_id = s.id WHERE c.checked_at = (SELECT MAX(checked_at) FROM checks WHERE site_id = s.id)"
```
This shows each site's latest result by name, so a site blocking the checker
(for example a 403) is caught here, before any secret goes live and before
any alert email goes out.

## 4. Checker secrets
Claude writes `$env:TEMP\checker-secrets.json` (BOM-free) with the keys
`GITHUB_TOKEN` and `RESEND_API_KEY` left empty; Alex fills them in a text
editor. Then:
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js secret bulk "$env:TEMP\checker-secrets.json" -c checker/wrangler.jsonc; Remove-Item "$env:TEMP\checker-secrets.json"
```

## 5. Deploy the new admin
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/astro/astro.js build; if ($?) { node ./node_modules/wrangler/bin/wrangler.js deploy }
```
Claude verifies: `admin.ka-performancefl.com` 302s to Access on `/`,
`/sites/new` and `/logos/x`; the workers.dev hostname still does not answer;
Alex signs in and sees every site; a free-course signup on the public site
still lands in the old `ka-admin` database (`course_leads` count goes up).

## 6. Retire the digest
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js delete --name ka-admin-digest
```
