# Deploying the Post Desk

Alex runs each line, in order, in PowerShell. Claude verifies after each step.
Stop at the first error and paste it into the session.

The design is `docs/superpowers/specs/2026-09-26-post-desk-design.md`. The
claude.ai artifact keeps running until the admin desk has had a real test run.

## 0. Before anything
- `admin/post-desk` is reviewed, committed, and builds cleanly. It is stacked on
  `admin/sites-dashboard`, which is what is live today; like that branch, it
  deploys from the worktree. Merging the admin branches to `main` is a separate
  call (a push to `main` also rebuilds the marketing site).

## 1. Create the private media bucket
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js r2 bucket create ka-social-desk
```
Claude verifies: the bucket is listed and has no public access (no r2.dev
URL, no custom domain). Review copies must never sit at public URLs.

## 2. Schema
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 migrations apply ka-sites --remote
```
Claude verifies: `desk_items`, `desk_decisions`, `desk_story_checks` and
`desk_meta` exist in `ka-sites`, and the sites dashboard still loads.

## 3. Build and deploy the admin
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/astro/astro.js build; if ($?) { node ./node_modules/wrangler/bin/wrangler.js deploy }
```
Claude verifies, without a token:
- `admin.ka-performancefl.com/sites/ka-performance/social` 302s to Access.
- `admin.ka-performancefl.com/sites/ka-performance/social/media/x/y.png` 302s
  to Access too, so no media is reachable without signing in.
- The workers.dev hostname still does not answer (`workers_dev` stays false).

## 4. First push and the test run
Claude runs the first `node tools/social.mjs desk push` from
`Social Media Management`. Alex opens Social in the admin's top nav and
checks it against the artifact: media plays (including on his iPhone),
approvals and Story ticks save, and `desk pull` reports them. The artifact
retires only after that.
