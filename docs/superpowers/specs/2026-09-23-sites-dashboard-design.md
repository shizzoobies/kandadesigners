# Sites dashboard: the admin, rebuilt from a blank slate

**Date:** 2026-09-23 · **Status:** approved in conversation, awaiting Alex's review of this document · **Branch:** `admin/sites-dashboard` (from `admin/three-bugs`, which is live)

## Why

The August admin (clients, projects, invoices, retainers, follow-ups, coaching cockpit, members portal, newsletter, Launch Book) was not hitting what Alex needs. It also kept two separate client lists (the admin's `clients` table and the Launch Book's own JSON), which is what made the 2026-09-23 Launch Book test confusing. Alex's call: blank slate. The new admin starts as one feature, a dashboard of every site K & A manages, and grows from there.

## Decisions (Alex, 2026-09-23)

1. **One card per site**, with its logo, a way to visit it, its status, and what the person maintaining it needs to know.
2. **Single user now, assignable later.** Only Alex logs in. Every site has a "maintained by" field from day one, pointing at a `people` table that holds only Alex.
3. **Status is both automatic and manual.** An automatic health light plus a project status Alex sets.
4. **The site page holds:** where it lives, open work, accessibility, and a log. Client contacts and credential pointers are deliberately out.
5. **Open work comes from both GitHub and hand entry.** Several client repos have local-only branches GitHub cannot see.
6. **Full replacement at the same address, old database kept.** The old `ka-admin` D1 database stays untouched as an archive and keeps receiving free-course leads from the public site. The members portal, newsletter workbench, Launch Book and 7am digest go dark until rebuilt as features of the new app.
7. **Email alerts when a site turns red and when it recovers.**

## Architecture

| Piece | What it is | Notes |
| --- | --- | --- |
| `ka-admin` Worker | Astro SSR on Workers (`@astrojs/cloudflare`), fresh code replacing `admin/src` | Same Worker name, same route `admin.ka-performancefl.com/*`, same Access app (team domain and AUD unchanged), `workers_dev: false` kept. |
| `ka-sites` D1 | New database, bound as `DB` | The only database the new app binds. |
| `ka-admin` D1 | Old database, **archive** | Not bound to the new app. The public site's `ADMIN_DB` binding (course leads, course events, unsubscribe) keeps working because it binds the database, not the app. Never dropped by this project. |
| `ka-sites-checker` Worker | Scheduled Worker, plain JS (no Astro) | Runs the health, expiry and GitHub jobs and sends alerts. A separate Worker for the same reason the digest was: the Astro adapter generates the entry point, and bolting a `scheduled` handler onto generated code is fragile. |
| `ka-sites-logos` R2 bucket | Logo uploads | Served through the app (behind Access), not a public bucket. |
| `ka-admin-digest` Worker | **Retired** | Its cron trigger is removed; the Worker is deleted once the new app is live. |
| `ka-course-proxy` Worker | **Untouched** | Serves course AI blocks; independent of the admin app. |

**Auth** is unchanged in shape: Cloudflare Access proves identity; the middleware verifies the Access JWT, then looks the email up in `people`. Deny by default on every route and every hostname. `people.role` exists (`owner` now) so assigned maintainers can come later without a schema change.

**Before the rebuild merges:** `admin/three-bugs` (live since 2026-09-23 19:44) is merged to `main`, so history records what was deployed and no deploy from `main` can reopen the Launch Book leak.

## Data model (`ka-sites`)

- **people**: `id`, `name`, `email` (unique, lowercased), `role` (`owner` | `maintainer`), `created_at`.
- **sites**: `id`, `slug` (unique), `name`, `live_url`, `logo_key` (R2 key, nullable), `repo` (`owner/name`, nullable), `local_path`, `hosting` (`pages` | `worker` | `client-push` | `other`), `deploy_command`, `maintainer_id` → people (nullable), `project_status` (`live` | `in_progress` | `waiting_client` | `paused`), `status_note`, `a11y_audited_on` (date, nullable), `a11y_open_issues` (int, nullable), `a11y_statement_url` (nullable), `domain` (nullable; derived from `live_url` unless overridden), `domain_expires_on`, `cert_expires_on`, `github_synced_at`, `created_at`, `updated_at`.
- **checks**: `id`, `site_id`, `checked_at`, `ok` (bool), `http_status` (nullable), `ms` (nullable), `error` (nullable). Rows older than 30 days are pruned by the checker.
- **work_items**: `id`, `site_id`, `source` (`manual` | `github`), `text`, `url` (nullable), `github_key` (nullable; unique per site, e.g. `pr:12` or `branch:site-fixes`), `done_at` (nullable), `created_at`.
- **log_entries**: `id`, `site_id`, `entry_date`, `text`, `created_at`.
- **alert_state**: `site_id` (PK), `level` (`green` | `amber` | `red` | `gray`), `since`, `last_alert_level`, `last_alert_at`. This is what makes alerts fire once per transition rather than every run.

Enums are whitelisted in code, following the old admin's pattern.

## Automatic checks (`ka-sites-checker`)

- **Every 15 minutes, uptime.** `GET live_url`, redirects followed, 10-second timeout. Records status and elapsed ms. A 2xx or 3xx final response is up.
- **Daily, certificate expiry.** From certificate-transparency records (crt.sh JSON), taking the latest `not_after` for the exact host. A Worker's `fetch` cannot see the peer certificate, which is why. On a crt.sh failure the stored date is kept and the error is logged; the light does not go red from a lookup failure.
- **Daily, domain expiry.** From RDAP (bootstrap via `rdap.org`). Sites without their own domain skip this.
- **Hourly, GitHub.** A fine-grained, read-only token (Alex creates it: Metadata, Contents and Pull requests, read-only, selected repos) in the secret `GITHUB_TOKEN`. For each site with a `repo`: open pull requests, plus branches not merged into the default branch (compare API, `ahead_by > 0`, excluding the default branch). These are upserted as `source = 'github'` items keyed by `github_key`. Items no longer returned are marked done. Manual items are never touched.

**The health light** is computed by one pure function (`computeLevel(site, recentChecks, today)`), shared by the checker and the app:

- **Red:** the last two checks both failed; or the certificate or domain expires within 7 days.
- **Amber:** the latest check failed (only one); or the latest check took over 3000 ms; or the certificate or domain expires within 30 days.
- **Gray:** no check in the last 45 minutes (never checked, or the checker is failing). Never shown as green.
- **Green:** otherwise.

Rules are evaluated in the order red, gray, amber, green, and the first match wins. The two check-based red rules only apply when the checks are fresh, so stale uptime data reads gray, not red; an expiry within 7 days is red even when uptime data is stale. It returns the level plus a short reason string ("Down since 14:05", "Cert expires in 12 days").

**Alerts.** After each run, the checker compares each site's level with `alert_state`. On a transition into red it sends one email ("<site> is down: <reason>"). On a transition from red to green it sends one "<site> is back" email. Nothing is sent while a site stays red. Sending goes through Resend (already verified for the apex, used by the newsletter) from `alerts@ka-performancefl.com` to Alex, with the key in the secret `RESEND_API_KEY`. A send failure is logged and retried on the next run, because `last_alert_level` is only updated on success.

## Screens

Styling follows the site system: Earthen palette tokens, Schibsted Grotesk display, Atkinson Hyperlegible Next body, contrast measured to AA, no pill chips (status is small-caps text beside a colored dot, and the dot always has a text label beside it, never color alone), no em dashes in any copy.

**Dashboard (`/`).** A grid of site cards: logo, name, health dot with its reason when not green, project status and note, open-work count, and a **Visit site** link (new tab, labeled as such). Sorted red, amber, gray, then alphabetical. Filter: All · Problems · a project status. An empty state links to Add site.

**Site page (`/sites/<slug>`).** One page, top to bottom:
1. Header: logo, name, light and reason, status and note (edit in place), Visit site.
2. Where it lives: repo (linked), local path, hosting, deploy command, each with a copy button.
3. Open work: GitHub items (linked, read-only), then manual items with checkboxes and an add field.
4. Accessibility: audited date, open issues, statement link, all editable.
5. Health: 30-day uptime percentage, response-time sparkline, cert and domain expiry dates, last checked time.
6. Log: add-entry field, then entries newest first.

**Add / edit site (`/sites/new`, `/sites/<slug>/edit`).** Name, live URL and logo upload are required; everything else is optional. Logo upload: PNG, JPEG, WebP or SVG, 1 MB max, stored in R2 as `logos/<slug>-<hash>.<ext>`. With no logo, the card uses the site's favicon, fetched server-side by the checker once and cached in R2; failing that, an initials monogram.

Writes are plain form posts (progressive enhancement), and in-place edits enhance those same forms. No client framework.

## Seed data

The migration seeds Alex into `people`. A one-time seed script loads the managed sites (the nine current portfolio builds in `src/data/work.js` on the site's `main`, plus FDAAF and FixAlways, which were temporarily removed from the portfolio, plus ka-performancefl.com itself), with live URL, repo, local path, hosting and deploy command taken from the HANDOFF and each repo's own config. Any field that cannot be verified from those sources is left blank for Alex to fill in, never guessed. K & A Memories is left out unless Alex adds it.

## Error handling

- Every checker job is independent: one site's failure, or one job's failure, never stops the others. Errors are written to the run's log, and a job that fails outright leaves the sites' last-known values in place, which is what eventually turns them gray.
- The app renders from stored data only; it never calls a site, GitHub, crt.sh or RDAP during a page request.
- Form validation happens server-side and re-renders the form with messages next to the fields.

## Testing

- Vitest unit tests for `computeLevel` (every rule and boundary), alert transitions (red once, recovery once, a failed send retried), the GitHub item reconciliation (new, unchanged, gone), RDAP and crt.sh response parsing against saved fixtures, input validation and enum whitelists, and the middleware's deny-by-default.
- Checker jobs take `fetch` and `db` as injected arguments so they are tested without the network.
- Before deploy: a build, the test suite, and a Playwright plus axe pass over the dashboard, a site page and the add-site form (tooling from `D:/kap-reel/node_modules`, as the site's scripts do).
- Deploys follow the standing rule: Claude prepares one PowerShell line, Alex runs it, Claude verifies.

## Deploy order

1. Merge `admin/three-bugs` to `main`.
2. Create `ka-sites` D1, apply migrations; create the R2 bucket; set `GITHUB_TOKEN` and `RESEND_API_KEY` on the checker.
3. Deploy `ka-sites-checker`; let it run a cycle; confirm checks land.
4. Run the seed script.
5. Deploy the new `ka-admin`. Verify: `admin.ka-performancefl.com` 302s to Access on every path, workers.dev still does not answer, the dashboard renders every seeded site, and a free-course signup on the public site still lands in the old `ka-admin` database.
6. Remove the digest's cron trigger, then delete the digest Worker.

## Out of scope for now

Client contacts, credential pointers, invoices, coaching, members portal, newsletter, Launch Book, multi-user logins, and alerts other than red and recovery. Each can come back later as its own feature on this foundation.
