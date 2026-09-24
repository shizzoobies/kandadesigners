# Deploying the sites dashboard

Alex runs each line, in order, in PowerShell. Claude verifies after each step.
Stop at the first error and paste it into the session.

## 0. Before anything
- `admin/three-bugs` is merged to `main` (it is what is live today).
- Alex confirms the email he signs into Cloudflare Access with. If it is not
  `alex@ka-performancefl.com`, fix it in `admin/seed/data.js`, then re-run
  `node scripts/seed-sql.mjs` and commit.
- Alex creates a fine-grained GitHub token: Metadata, Contents and Pull
  requests, all read-only, on the repos listed in `seed/data.js`.

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

## 3. Checker secrets
Claude writes `$env:TEMP\checker-secrets.json` (BOM-free) with the keys
`GITHUB_TOKEN` and `RESEND_API_KEY` left empty; Alex fills them in a text
editor. Then:
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js secret bulk "$env:TEMP\checker-secrets.json" -c checker/wrangler.jsonc; Remove-Item "$env:TEMP\checker-secrets.json"
```

## 4. Deploy the checker, then wait one cycle
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js deploy -c checker/wrangler.jsonc
```
Claude verifies after 15 minutes: `d1 execute ka-sites --remote --command "SELECT COUNT(*) FROM checks"` is at least the number of sites.

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
