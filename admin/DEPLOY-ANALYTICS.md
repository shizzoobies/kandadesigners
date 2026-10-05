# Deploy: social analytics (attribution Layer 1)

Plan: `D:\K & A Performance Site\docs\superpowers\plans\2026-10-04-social-analytics.md`, Task 12.

Every step waits for Alex's yes, naming that approval. Run each one from `D:\ka-site-admin\admin` in PowerShell. Wrangler reads `CLOUDFLARE_API_TOKEN` from the user environment, and the token is never printed.

## Hazards until this deploy is finished
- **Migration 0004 first.** Admin code from commit 853008d onward writes `sites.metricool_brand_id`. Every site add or edit fails until ka-sites migration 0004 is applied (L2).
- **No admin deploy before L1 and L4a.** `wrangler.jsonc` binds `ATTRIBUTION_DB`, whose database id is all zeros until L1. It also binds the `ka-analytics-sync` service, which does not exist until L4a. An urgent Post Desk hotfix before then must go out from a commit before 853008d.

## L1: create the database
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 create ka-attribution
```
Copy the printed `database_id` into `wrangler.jsonc` and `analytics-sync/wrangler.jsonc`, replacing `00000000-0000-0000-0000-000000000000`, then commit.

## L2: migrations
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 migrations apply ka-attribution --remote; if ($?) { node ./node_modules/wrangler/bin/wrangler.js d1 migrations apply ka-sites --remote }
```
Check that ka-attribution lists six tables and that ka-sites has the `metricool_brand_id` column.

## L4a, then L3: the sync Worker and its token
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js deploy -c analytics-sync/wrangler.jsonc
cd "D:\ka-site-admin\admin"; node scripts/put-metricool-secret.mjs
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js secret list -c analytics-sync/wrangler.jsonc
```
The cron's first run is 07:00 UTC. A run that happens before the secret is set only records "METRICOOL_USER_TOKEN is not set".

## L4b: the admin
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/astro/astro.js build; if ($?) { node ./node_modules/wrangler/bin/wrangler.js deploy }
```
The deploy output must list the `ATTRIBUTION_DB` and `ANALYTICS_SYNC` bindings.

## L5: brand ids and the first pushes
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 execute ka-sites --remote --command "UPDATE sites SET metricool_brand_id = '7076479' WHERE slug = 'ka-performance'; UPDATE sites SET metricool_brand_id = '7185142' WHERE slug = 'foremotion-golf'; UPDATE sites SET metricool_brand_id = '7196744' WHERE slug = 'ellenton-family-practice';"
cd "D:\K & A Performance Site\Social Media Management"; node tools/social.mjs analytics push
cd "D:\K & A Performance Site\Social Media Management"; node tools/social.mjs --client foremotion-golf analytics push
cd "D:\K & A Performance Site\Social Media Management"; node tools/social.mjs --client ellenton-family-practice analytics push
```
Run each push with `--dry-run` first and read the rows.

## First sync (Alex's click) and checks
Open `/sites/<slug>/analytics` for each of the three sites and press Sync now. Then read the results back:
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 execute ka-attribution --remote --json --command "SELECT site_slug, trigger, ok, posts_seen, errors FROM sync_runs ORDER BY id"
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 execute ka-attribution --remote --json --command "SELECT site_slug, network, COUNT(*) AS posts, SUM(campaign_id IS NOT NULL) AS joined FROM posts GROUP BY site_slug, network"
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 execute ka-attribution --remote --json --command "SELECT site_slug, network, url, COUNT(*) AS n FROM posts GROUP BY 1, 2, 3 HAVING COUNT(*) > 1"
```
The second query must show `joined` above zero, LinkedIn included. The third must return no rows; any row means reels are also coming back from the posts endpoints. Each followers series must be a running total, not daily gains. Read observability for `exceededCpu` on the first runs.

The next morning, after 08:50 UTC, there should be one `cron` row per site.
