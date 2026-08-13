# Admin Backend — Design Spec

**Date:** 2026-08-13 · **Status:** approved in brainstorming, not yet planned or built
**Visual reference:** [`2026-08-13-admin-dashboard-mockup.html`](2026-08-13-admin-dashboard-mockup.html) (open in a browser; both layout options, real tokens, invented numbers)

## Problem

The business is getting busy and the tracking is in Alex's head, texts, email threads and browser tabs. Four things are actively at risk of slipping, all four confirmed by Alex as real: money owed (invoices sent but unpaid, work delivered but never invoiced), client follow-ups and promises, project status and who is blocking, and scattered info with no searchable home.

An existing attempt sits at `public/internal/tracker.html`: a single-file "Team Project Tracker" on Firebase Realtime Database, publicly reachable on the live domain, gated only by a client-side password visible in View Source (`csrocks26!`). It is superseded by this work and retired as part of it.

## Decisions, and why

| Decision | Choice | Reason |
| --- | --- | --- |
| Invoices | **Track only**, not generate or collect | Records what was billed and what is unpaid, which is the missing 80%. No PDF generation, no payment integration, no tax or payments liability in our code. `invoices.external_url` links out to wherever the real invoice lives. |
| Users at launch | **Alex only** | One row in `users`. Schema leaves room for team and clients without migration. |
| Reminders | **Daily digest email only** | Works when the app is not opened, which is the habit currently failing. No per-reminder scheduling, no team emails yet. |
| Where it lives | **Separate app** at `admin.ka-performancefl.com` | Alex expects team and eventually client logins, and wants zero risk to the customer-facing site. Also gets its own lockfile, which removes the emnapi hazard from all admin work. |
| Stack | **Astro SSR** on Workers via `@astrojs/cloudflare` | Same framework as the site, so layouts and tokens carry over and Alex can maintain it. Astro middleware makes the auth gate one file. |
| Auth | **Cloudflare Access**, not homegrown passwords | Free to 50 users, no password storage, no hashing CPU, Google Workspace SSO means Alex is already logged in, and one-time PIN covers future external users. Also retires the plaintext-password pattern for good. |
| Client data stored | Links/URLs **and** contacts/history | Explicitly **not** credentials, explicitly **not** files. See Non-goals. |
| Billing shapes | **Deposit-then-balance** and **monthly retainer** | Alex's two actual shapes. No hourly, no time tracking. |
| Dashboard | **Ranked stream over panels** | See Dashboard below. |

## Verified platform facts

Checked against current docs on 2026-08-13 rather than assumed:

- D1 binds to Workers and Pages Functions via dashboard or wrangler config. Free tier: 5 GB, 5M row-reads/day, 100k row-writes/day. Far beyond this workload. ([D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/))
- **Pages Functions cannot run cron.** Scheduled work is Workers-only (`triggers.crons` plus a `scheduled` handler); free plan allows 5 triggers per account. ([Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/))
- **Free-plan CPU is 10ms per request**; Cloudflare's own docs put auth/SSR workloads at 10–20ms. Workers Paid ($5/mo) raises this to minutes. ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/#cpu-time))
- Astro SSR on Workers: `@astrojs/cloudflare` adapter, `wrangler.jsonc` with `main` pointing at the generated `dist/_worker.js/index.js`, `nodejs_compat`, and an `assets` binding to serve static files from the same Worker. ([Astro on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/), [static assets](https://developers.cloudflare.com/workers/static-assets/))
- Cloudflare Access passes the identity JWT in the `Cf-Access-Jwt-Assertion` header (also a `CF_Authorization` cookie for browsers). Validate by fetching `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`, matching the token's `kid` against `public_certs`, checking the app's `aud` tag, then reading `payload.email`. ([Validating Access JWTs](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/))
- Cloudflare Zero Trust is free up to 50 users. ([Zero Trust plans](https://www.cloudflare.com/plans/zero-trust-services/))
- Cloudflare Email Sending is in public beta and normally requires Workers Paid, **but sends to verified destination addresses in your own account are free on all plans and do not count against quota** — which is exactly the digest-to-self case. To be validated in Phase 5; Resend's free tier over plain `fetch` is the fallback. ([Email Service pricing](https://developers.cloudflare.com/email-service/platform/pricing/), [public beta changelog](https://developers.cloudflare.com/changelog/post/2026-04-16-email-sending-public-beta/))

**No `npm install` in the site's tree is required by any of this.** D1, Access and Email are bindings, not packages. This is why SSR for the *site* was rejected: `@astrojs/cloudflare` there would mean touching the fragile root lockfile.

## Architecture

```
repo (one git repo, D:\K & A Performance Site)
├── src/, functions/, public/     ← marketing site, UNTOUCHED
│   package-lock.json             ← emnapi-fragile, never opened again
│
└── admin/                        ← new, own package.json + own lockfile
    ├── src/                      Astro SSR  → Worker "ka-admin"
    │   ├── middleware.ts                      admin.ka-performancefl.com
    │   ├── lib/dashboard.js      ← the six rules, shared
    │   └── pages/
    ├── migrations/0001_init.sql
    └── digest/                   ~120 lines → Worker "ka-admin-digest"
                                               cron only, no routes
                    ↘             ↙
                  D1: "ka-admin"  (one database, bound to both Workers)
```

Two Workers, one database, one subdomain, one new directory. The site's build, lockfile, domain and deploy pipeline are untouched; a broken admin deploy cannot reach `ka-performancefl.com`.

### Why the digest is a separate Worker

The Astro adapter *generates* the Worker entry point, so adding a `scheduled` handler means wrapping generated code that changes between adapter versions. A separate Worker avoids that, and isolates failures in both directions.

Cron is `["0 11,12 * * *"]` and the handler no-ops unless the current hour in `America/New_York` is 7. Two invocations a day, exact 7am year-round. A single UTC cron would drift an hour at each daylight-saving change.

**Corrected 2026-08-13 during implementation:** this spec originally said `0 10,11`, which was wrong. 7am Eastern is **11:00 UTC under EDT** (UTC-4) and **12:00 UTC under EST** (UTC-5). The original values would have delivered at 6am all summer and 5am all winter.

### Auth flow

1. Cloudflare Access policy on `admin.ka-performancefl.com` allows `alex@ka-performancefl.com` via Google Workspace.
2. `admin/src/middleware.ts` validates the Access JWT on every request: signature against the certs endpoint (cache the JWKS in memory per isolate), `aud` match, expiry.
3. It then loads the matching `users` row and puts `{email, name, role, clientId}` on `Astro.locals.user`. Unknown email or `active = 0` gets a 403, so revoking someone is a database flag as well as an Access policy change.
4. **Access says who you are; D1 says what you may see.** That split is what makes the client-portal path a policy change plus a role check rather than a rewrite.
5. Local dev has no Access in front of it. Middleware falls back to a dev identity **only** when `ENVIRONMENT=development` is present, set in gitignored `.dev.vars` and never in production. Without that var, a missing JWT is a 403. This must be covered by a test.

## Data model

One migration, `admin/migrations/0001_init.sql`. Nine tables, everything hanging off `clients`.

**Conventions, stated because they are the classic bug sources:**

- **Money is integer cents.** No floats anywhere. Formatting happens at render.
- **Dates are `TEXT` `YYYY-MM-DD`; timestamps are ISO-8601 UTC `TEXT`.** SQLite has no date type and this format sorts correctly as a string.
- **"Today" is computed in `America/New_York`, never UTC.** Otherwise anything due today reads as overdue after 8pm local, which quietly trains you to distrust the dashboard.
- Soft-delete (`archived_at`) for `clients` and `projects`; hard delete for `notes`, `client_links`, `followups`.

| Table | Columns |
| --- | --- |
| `users` | `id`, `email` UNIQUE, `name`, `role` (`owner`\|`staff`\|`client`), `client_id` NULL, `active`, `created_at`, `last_seen_at` |
| `clients` | `id`, `name`, `company`, `email`, `phone`, `status` (`lead`\|`active`\|`past`), `source`, `created_at`, `updated_at`, `archived_at` |
| `client_links` | `id`, `client_id`, `label`, `url`, `kind` (`live`\|`staging`\|`repo`\|`drive`\|`gbp`\|`social`\|`dashboard`\|`other`), `sort_order` |
| `projects` | `id`, `client_id`, `name`, `status` (`quoted`\|`active`\|`on_hold`\|`delivered`\|`complete`\|`cancelled`), `waiting_on` (`us`\|`client`\|`artist`\|NULL), `total_quoted_cents`, `started_on`, `due_on`, `delivered_on`, `created_at`, `updated_at`, `archived_at` |
| `invoices` | `id`, `client_id`, `project_id` NULL, `ref`, `kind` (`deposit`\|`balance`\|`retainer`\|`other`), `amount_cents`, `issued_on`, `due_on`, `paid_on`, `status` (`expected`\|`sent`\|`paid`\|`void`), `external_url`, `notes` |
| `retainers` | `id`, `client_id`, `label`, `amount_cents`, `day_of_month`, `active`, `started_on`, `ended_on` |
| `followups` | `id`, `title`, `detail`, `client_id` NULL, `project_id` NULL, `due_on`, `done_at`, `created_at` |
| `notes` | `id`, `entity_type` (`client`\|`project`\|`invoice`\|NULL), `entity_id`, `body`, `author_email`, `pinned`, `created_at` |
| `imports` | `id`, `source`, `note`, `created_at` |

Notes on the less obvious choices:

- **`users.client_id`** is the entire client-portal growth path: a `client`-role user sees only rows for their own client. One nullable column now, no migration later.
- **`projects.waiting_on` is deliberately separate from `status`.** Alex asked for "waiting on the client vs waiting on you"; folding that into `status` is how status enums rot into fifteen values.
- **`invoices.status = 'expected'`** is load-bearing. It represents money you know you must bill but have not. That is the leak the dashboard exists to catch.
- **`retainers` never auto-creates invoices.** The digest reports that a period is unbilled; Alex stays the one who decides. Consistent with track-only.
- **`notes` are attachable or standalone** (`entity_type` NULL), so a scratch thought does not need a home before it can be written down.
- **`imports`** records the Firebase tracker migration so the provenance of those projects is obvious a year from now.

## Dashboard

The six rules are the product; the CRUD screens exist to feed them. All six live in `admin/src/lib/dashboard.js` and are imported by **both** Workers, so the screen and the email cannot disagree. If they ever do, it is a bug, not a difference of configuration.

| Rule | Definition |
| --- | --- |
| Overdue | `status = 'sent' AND due_on < today` |
| Needs invoicing | `delivered_on IS NOT NULL AND sum(sent + paid) < total_quoted_cents` |
| Deposit never billed | `project.status = 'active' AND no invoice of kind = 'deposit'` |
| Retainer unbilled | active retainer with no `kind = 'retainer'` invoice in the current month |
| Follow-ups due | `done_at IS NULL AND due_on <= today` |
| Gone quiet | `project.status = 'active' AND` newest note or follow-up older than 14 days |

Two forward-looking variants exist only to fill the panels, and live in the same module:

| Variant | Definition |
| --- | --- |
| Follow-ups upcoming | `done_at IS NULL AND due_on BETWEEN tomorrow AND today + 7 days` |
| Retainers upcoming | active retainer whose `day_of_month` falls later in the current month and is unbilled |

The money strip's three figures, defined so they cannot drift between screen and email:

| Figure | Definition |
| --- | --- |
| Outstanding | `sum(amount_cents) WHERE status = 'sent' AND paid_on IS NULL` |
| Overdue | the same, restricted to `due_on < today` (a strict subset of Outstanding) |
| Not yet invoiced | `sum(amount_cents) WHERE status = 'expected'` plus the open balances from Needs-invoicing and Deposit-never-billed |

### Layout: ranked stream on top, panels underneath

Chosen over either alone. Above: a money strip (outstanding / overdue / not yet invoiced) then a single ranked stream. Below: panels for the slower categories.

**Promotion rule — dated and arrived goes in the stream; future or soft-signal goes in the panels.**

- **Stream:** overdue invoices, follow-ups due today or earlier, retainers past their bill day this month, delivered projects with an open balance, active projects with no deposit billed. Grouped under "Money, act first" then "Promises coming due", so money is structurally at the top.
- **Panels:** follow-ups due in the next 7 days, retainers due later this month, and "gone quiet" (which has no due date, only an absence).
- The stream caps at 20 items with an "and N more" row, so a busy week cannot turn it into a wall.

### Status treatment

**No pills or chips anywhere** (house rule). Status is carried by a 2px left rule plus a mono caps label, with rust for money, amber for approaching, and a neutral grey rule for soft signals. Amber is never used as text colour on light, per the palette rule that it fails AA there. Money uses `font-variant-numeric: tabular-nums`.

## Screens

- **Client detail** is the workhorse: contact block, links rail grouped by `kind`, open projects, invoice history, dated note stream with an always-visible add box. This page alone answers "scattered info".
- **Projects** list grouped by `waiting_on`; detail page shows quoted / invoiced / paid / outstanding **computed**, never typed.
- **Invoices** list filterable by status, defaulting to everything not `paid`.
- **Follow-ups**, flat by due date, one-click done.
- **Notes**, the standalone ones, plus a header search across clients, projects and note bodies.

Interaction model is deliberately old-fashioned: server-rendered pages, real `<form>` POSTs, redirect after write. Almost no client JS, so there is no state-sync layer to debug and it works on a phone on a bad connection. The only JS is the dashboard quick-add.

## Digest email

Same rules module, rendered as plain mostly-text HTML with the money section first and links back into the admin. **If nothing is due it sends nothing** — a daily email you learn to ignore is worse than no email.

Sending identity is a **subdomain** (`notify.ka-performancefl.com`), never the root. The root domain's SPF and DKIM belong to Google Workspace, and a careless SPF edit there degrades Alex's actual business email. Subdomain sending keeps Workspace mail entirely out of scope.

## Phasing

Each phase is independently deployable and independently useful. Stopping after Phase 3 still leaves a working tool.

- **Phase 0 · prove the chain.** D1 created, migration applied, Access policy live, subdomain resolving, Astro skeleton whose only page renders "authenticated as …, role owner". No features. This de-risks auth, bindings, DNS and deploy before any business logic exists.
- **Phase 1 · Clients, links, notes.** First real usefulness.
- **Phase 2 · Projects,** plus the Firebase tracker import, then delete `public/internal/tracker.html` and lock the old Firebase rules.
- **Phase 3 · Invoices and retainers.** Closes the money leak.
- **Phase 4 · Follow-ups and the dashboard.** The payoff, once there is data to aggregate.
- **Phase 5 · Digest Worker** and the sending-subdomain DNS. Last because it is the only part needing outside setup.

## Testing

- **The six rules get unit tests, written first.** They are pure functions over rows and every one is a date-boundary bug waiting to happen: due-today versus overdue, month rollover for retainers, the `America/New_York` definition of "today". This is the one part of the build where TDD genuinely pays.
- **Auth middleware gets tests**, including the negative case that the dev-identity fallback is inert without `ENVIRONMENT=development`.
- **Screens get Playwright smoke tests** against `wrangler dev` with a seeded local D1, following the pattern already used for the site.

## Non-goals

Deliberately excluded, each with a clean path to add later:

- Invoice PDF generation, sending, or payment collection (Stripe). Track-only by decision.
- **Credential storage.** No client logins, hosting passwords or API keys. Would make this a credential store and require encryption at rest and a real answer for a leaked session; revisit as its own design.
- **File and document storage** (contracts, assets). Needs R2 plus upload handling; a later phase if wanted.
- Hourly billing and time tracking.
- Team and client logins. Schema is ready (`users.role`, `users.client_id`); the Access policy and role checks are the work when it happens.
- Auto-generating recurring invoices.

## Risks and open questions

1. ~~**Workers Paid ($5/mo) is probably needed.**~~ **CLOSED 2026-08-13: Alex already has Workers Paid, Active** (confirmed from his Cloudflare subscriptions page, on the same account as the Worker — the listed zones match the Pages projects). The 10ms free CPU cap never applied, so no measurement was needed and no design compromise is required for the dashboard's six queries per render.
2. ~~**The free email path needs validating**~~ **CLOSED 2026-08-13 by the same finding.** Email Sending requires Workers Paid, which is active, so the digest can send to arbitrary recipients rather than only Email-Routing-verified destinations. The Resend fallback is unnecessary, and "email the team too" is available whenever wanted.
3. **Access adds a Cloudflare dependency for auth.** Acceptable given everything already runs there, and it is what removes password handling entirely.
4. **The Access login screen is Cloudflare's, not branded.** Fine for internal use; revisit if a client portal ships.
5. **`admin/` inside the site repo.** Astro's root build only reads `src/` and `public/`, so it ignores `admin/`, but `.gitignore` needs `admin/node_modules` and `admin/dist`, and the Pages build must not be pointed at the new directory.
6. **The Firebase tracker's current contents are unread.** Phase 2 must export before deleting, and the Firebase rules should be locked whether or not the data is worth keeping.

## Confirmed Access configuration (2026-08-13)

Zero Trust is enabled and the Access application exists. These are configuration values, not secrets: they belong in `wrangler.jsonc` as plain vars and may be committed.

| Value | |
| --- | --- |
| Team name | `kandaperformance` |
| Team domain | `kandaperformance.cloudflareaccess.com` |
| JWKS / certs URL | `https://kandaperformance.cloudflareaccess.com/cdn-cgi/access/certs` |
| Application AUD | `2bf30fbb34a3a276856fa95b5649bce7fd5a5776acb1103d64a6f51e8ed06900` |

Verified by fetching the certs endpoint, which returns a live JWKS. As of this date `admin.ka-performancefl.com` returns NXDOMAIN, meaning the Access application is a policy definition waiting for the hostname to exist. That is the desired state: the Worker's custom domain will create the proxied record, and Access begins gating the moment it does. **Still to confirm: that the Access application's hostname is exactly `admin.ka-performancefl.com`,** since a typo there leaves the admin ungated while looking configured.

## Tasks that are Alex's (dashboard only)

Claude's deploy-class and dashboard calls are auto-blocked in this environment, so these come as runnable commands or dashboard steps:

1. ~~Enable Zero Trust, create the Access application and policy, supply team name and AUD tag~~ — **DONE 2026-08-13**, values above.
2. Create the D1 database and supply its ID.
3. Add `admin.ka-performancefl.com` as a Worker custom domain (the wrangler token is zone-read only).
4. Decide on Workers Paid after Phase 0 measures CPU.
5. Phase 5: DNS records for the `notify.` sending subdomain, and verify the destination address.
6. Phase 2: lock the Firebase Realtime Database rules once the tracker is retired.
