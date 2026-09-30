# Attribution layer, Stage 0: inspection report and staged plan

Written 2026-09-30 in response to Astra's "Fable pipeline attribution implementation guidance"
(`2026-09-30-astra-guidance.txt`, same folder). Nothing has been built, deployed, activated or
credentialed. This document is the approval gate for Stage 1.

Approved: no (draft for Alex, 2026-09-30)

## 0. What this is, in one paragraph

A measurement layer that connects each published social post to the enquiries, qualified leads,
booked and won work and paid revenue it produced, where the evidence supports the link, for K&A
first and then for each client that opts in. The design is one shared layer with per-site
configuration, tracking off by default. The pilot is K&A. This document maps that design onto
the stack as it actually exists, lists what must change, and separates what was verified from
what is still assumed.

## 1. Inspection report

### 1a. Facts verified in the repositories (2026-09-30)

**Repositories and deployment**
- Marketing site: GitHub `shizzoobies/kandadesigners`, Cloudflare Pages project `kandadesigners`,
  static Astro plus Pages Functions in `functions/`. A push to `main` builds and deploys. Bindings
  live in the Pages dashboard, not the repo; there is deliberately no root wrangler config.
  - Authoritative checkout for site work: `D:\ka-site-color` (branch `site/privacy-and-targets`,
    no commits of its own, 4 behind origin/main at 644e461; origin/main is c20e5b4).
  - `D:\K & A Performance Site` is on `codex/training-premium-rfi`, 107 ahead and 75 behind
    origin/main; its `src/` is an older generation of the site. It is the social pipeline's
    home, not a site checkout.
- Admin: `D:\ka-site-admin`, branch `admin/post-desk` at 14095ae, matches its remote, not merged
  to main (35 ahead, 50 behind). Worker `ka-admin` on route `admin.ka-performancefl.com/*`,
  deployed by a manual wrangler line Alex pastes. Sibling Workers `ka-sites-checker` (cron) and
  `ka-course-proxy`.
- Pipeline: `D:\K & A Performance Site\Social Media Management` (junction `D:\ka-social`).
  `tools/` is pure Node with 274 vitest tests; it makes no HTTP calls itself. Metricool is
  reached only through the claude.ai MCP connector, by the main session.

**Data stores**
- `ka-sites` (D1, bound as `DB` in the admin): `people`, `sites` (14 slugs), `checks`,
  `work_items`, `log_entries`, `alert_state`, `desk_items`, `desk_decisions`,
  `desk_story_checks`, `desk_meta`. No lead, campaign, event, revenue or invoice tables.
- `ka-admin` (D1): the archived CRM (`clients`, `projects`, `invoices`, `retainers`,
  `followups`), coaching, newsletter, `course_leads`, `course_events`, and `app_state` (the Launch
  Book blob). Bound only to the public site as `ADMIN_DB`; the admin deliberately does not bind
  it. It still receives writes from `/api/course-lead`, `/api/course-event` and
  `/api/unsubscribe`.
- `ka-songs` (D1): Daily Songs only. Out of scope.
- R2: `ka-social` (public media), `ka-social-desk` (private review copies), `ka-sites-logos`.
- Post Desk state is transient by design: `desk push` replaces `desk_items`, pulled decisions are
  deleted, the admin purges the rest within 14 days. The only durable approval history is the
  local file `review/desk-log.jsonl` (56 lines, tracked in git).

**Website tracking (in `src/layouts/BaseLayout.astro`, worktree line numbers)**
- Meta Pixel `1584105763055085`, deferred load (:177-204), `PageView` fires unconditionally
  (:203), noscript beacon (:207). No consent gate. Domain verification meta present.
- `ka_src` cookie (:258-273): reads only `?src=`, first touch wins, 90 days, `SameSite=Lax`,
  `Secure`. Read by the AI Launch and training hidden `source` fields and server-side by
  `course-lead.js` (capped at 60 characters, default `direct`). Not read by the contact form,
  StartProjectModal or ScopeChat.
- No code anywhere reads `utm_*`. No GA4, GTM, LinkedIn Insight Tag, Plausible, Cloudflare Web
  Analytics beacon, Clarity or Hotjar in either checkout.
- `fbq('track','Lead')` fires on success in four places: contact form (contact/index.astro:216),
  AI Launch intake (ai-launch.astro:1190), training inquiry (training/index.astro:423), free
  course (free-course.astro:123). Not in StartProjectModal (held by Alex per HANDOFF:171) or
  ScopeChat. Every Lead event uses the same name with no event ID, so it cannot be deduplicated
  against a server event.
- Privacy page `src/pages/privacy/index.astro`, last updated August 31, 2026. No cookie banner.

**Enquiry paths (full inventory, section 3 below)**: 7 lead-capturing paths, 6 of which post
from the browser straight to Web3Forms (access key `7ad90fb9-...` in the page source) with no
K&A server involvement. Only `/free-course/` has a server-side success (`functions/api/course-lead.js`
writes `ka-admin.course_leads`, then sends the Web3Forms copy). No Stripe, Calendly, cal.com,
PayPal or Square anywhere. No booking provider. Phone and mailto links carry no click tracking.

**Pipeline link contract**
- No code builds a destination URL. Every UTM link is typed by hand into `facebook.md`,
  `linkedin.md` (first comment) and `youtube.md` (line 2), and `payload.mjs` sends the caption
  as written. Only the YouTube line-2 link is validated, and only for `utm_source=youtube`.
- Values in use: `utm_source=<network>&utm_medium=social&utm_campaign=<folder id>`. No `utm_id`,
  `utm_content` or `utm_term` anywhere. Instagram feed posts carry no link ("link in bio").
  Paused Stories used `utm_medium=story`. David's BBQ uses the same pattern on `davidsbbq.com`.
- `post.json` after release keeps: `r2[file]{key,url,sha256,uploadedAt}`, `metricool.<net>
  {payload,id,uuid,scheduledAt,draft,studioDoneAt,lastError}`, and after reconcile
  `published{at, <net>{permalink}}`. It does **not** keep the native network post id
  (`providers[].id`), which the getScheduledPosts response does carry.
- No cross-folder ledger exists. `review/data.json` shows only unscheduled posts; `music-history.json`
  and `reports/` are untracked prose or partial lists.
- Brand id `7076479` is hard-coded in printed instructions (`tools/social.mjs:140,179`) and docs,
  not in `tools/config/`. Per-client config (`clients/<slug>/client.json`) carries only `slug,
  name, site, sitePath, publish, networks, timezone, handoff`. R2 and YouTube config are global.
- `smartLinkData: { ids: [] }` is hard-coded in `payload.mjs:63`; the SmartLink is never attached
  to a post.

### 1b. Facts verified live (2026-09-30, from this session)

- `https://ka-performancefl.com/` serves the Meta Pixel (`fbq('init','1584105763055085')`) and
  the `ka_src` code. No GA, LinkedIn, Cloudflare Insights or consent strings in the HTML.
- `https://ka-performancefl.com/contact/` serves four forms (`contact-form`, the modal's
  `data-lead-form`, `chat-form`, `sg-form`), two Web3Forms submit URLs, and one `fbq("track","Lead")`.
- Metricool brand 7076479 (`getBrandSettings`): Facebook page `1239857262550754`, Instagram
  `kaperformancefl`, LinkedIn `urn:li:organization:129934379`, YouTube `UCoZ_dAeTe5YO-JEDBdYSKsQ`.
  **No website analytics connection** on the brand. Plan tier is not exposed by the API.
- SmartLink `kaperformancefl`, id `169122`, buttons as of today (`getAnalyticsDataByMetrics`,
  connector `buttons`):
  - "Our website" → `https://ka-performancefl.com/?utm_source=instagram&utm_medium=smartlink` (4 clicks)
  - "Free AI lessons" → `https://ka-performancefl.com/ai-launch/?utm_source=instagram&utm_medium=smartlink` (2 clicks)
  - "Training samples" → `https://ka-performancefl.com/training/?utm_source=instagram&utm_medium=smartlink` (1 click)
  - "Call Alex" → `tel:9042101071`
  - Social icons for Instagram and Facebook; the YouTube icon is DELETED with the placeholder
    `https://youtube.com/...`.
  - Timeline: 7 visits and 5 button clicks on 2026-09-25; nothing since.
  - No `utm_campaign` or placement id on any button. The "Free AI lessons" label contradicts the
    standing rule that /ai-launch/ is the paid 90-Day AI Launch, never "free lessons".

### 1c. Assumptions still to resolve (not verifiable from code)

- Pages dashboard: production branch, whether `ADMIN_DB` is bound in Preview, whether
  Cloudflare Web Analytics is switched on at the dashboard level.
- Web3Forms account: destination inbox, webhooks (Web3Forms can POST to a webhook; that is one
  route to a server-side lead record without touching the browser), spam filter settings.
- Meta Events Manager: whether PageView and Lead are actually being received, whether a
  Conversions API dataset exists, what the current dedup rules say.
- Metricool Starter: whether it includes REST API access at all. MCP access does not prove it.
  This gates any importer of Metricool analytics; the MCP connector is the only proven path.
- `ka-admin` live contents: how many `course_leads` rows exist, whether migration 0007 is
  applied, whether the Launch Book `app_state` blob is still maintained by hand.
- Cloudflare Access: whether anyone besides Alex is in the admin policy.
- Whether the Google Business Profile website button and the Facebook/LinkedIn "website" fields
  carry any tag (the L3 notes say GBP is the plain URL).

### 1d. Gaps against the guidance, in priority order

1. **No server records an enquiry** except the free course, and that one writes to an archive
   database the admin does not bind. A blocked script, a Web3Forms outage or a double click is
   invisible.
2. **No touch capture beyond `?src=`**. Every social link's UTMs are dropped on arrival.
3. **No link contract in code.** Hand-typed UTMs, no placement id, no validation on three of
   four networks, no SmartLink attribution.
4. **No durable publication ledger.** Native post ids are discarded; the only index of what was
   published is the folder tree.
5. **Pixel without consent and without server dedup.** PageView fires for everyone; Lead fires
   with no event id.
6. **Privacy policy disagrees with the code** on five points (section 6).
7. **No revenue source at all.** Invoices are archived; the Launch Book is a JSON blob in the
   archive; no payment provider.

## 2. Repository and deployment map

| Layer | Where | Deploys how | Owns |
|---|---|---|---|
| Marketing site | `D:\ka-site-color` → origin/main → Pages `kandadesigners` | git push to main (Alex) | pages, Pages Functions (`functions/api/*`), pixel, cookies |
| Admin | `D:\ka-site-admin`, `admin/post-desk` → Worker `ka-admin` | manual wrangler line (Alex) | sites dashboard, Post Desk, Cloudflare Access auth, D1 `ka-sites` |
| Checker | same repo, `admin/checker` → Worker `ka-sites-checker` | manual | uptime, certs, GitHub, Resend alerts |
| Course proxy | `admin/course-proxy` → Worker `ka-course-proxy` | manual | Anthropic and ElevenLabs proxy for courses |
| Pipeline | `Social Media Management/tools` | none (local Node) | manifests, R2 uploads, Metricool packets, desk push and pull |
| Archive | D1 `ka-admin` | frozen; written only by three Pages Functions | old CRM, course leads and events, Launch Book |

## 3. Enquiry path inventory (worktree line numbers)

| # | Path | File | Provider | Server success? | Conversion event | Source captured |
|---|---|---|---|---|---|---|
| 1 | Contact form | `src/pages/contact/index.astro:70-106`, POST :206 | Web3Forms (browser) | no | Lead :216 | none |
| 2 | Start a project modal, message tab | `src/components/StartProjectModal.astro:28-57`, POST :219 | Web3Forms (browser) | no | none (held by Alex) | none |
| 3 | Kai scoping chat, lead step | `src/components/ScopeChat.astro:180-191` | Web3Forms (browser); chat via `/api/scope` | no | none | none |
| 4 | AI Launch intake | `src/pages/ai-launch.astro:626-731`, POST :1181 | Web3Forms (browser) | no | Lead :1190 | hidden `source` from `ka_src` or `?src` |
| 5 | Training inquiry | `src/pages/training/index.astro:109-250`, POST :414 | Web3Forms (browser) | no | Lead :423 | hidden `source` from `ka_src` |
| 6 | Free course gate | `src/pages/free-course.astro:42-49`, POST :116 | `/api/course-lead` → D1 `ka-admin` + Web3Forms copy | **yes** | Lead :123 on `result.ok` | `ka_src` server-side |
| 7 | Client feedback (legacy) | `public/mbsfeedback/index.html:375`, POST :529 | Web3Forms (browser) | no | none | none |
| 8 | Kai corner chat, services chat, voice agent | `SiteGuide.astro:186`, `services/index.astro:692,665` | `/api/guide`, ElevenLabs | n/a | none | none (no lead capture) |
| 9 | Phone and mailto | Nav, Footer, contact, locations | tel: / mailto: | n/a | none | none |

Not present: booking providers, payment links, checkout.

## 4. Per-client integration matrix (today)

| Client | Site | Publishing | Metricool brand | Forms | Server lead record | Revenue source |
|---|---|---|---|---|---|---|
| K&A Performance | ka-performancefl.com (Pages) | pipeline, brand 7076479 | yes | 6 live paths, Web3Forms | free course only | none active |
| David's BBQ | davidsbbq.com | owner-published (Drive hand-off) | none | unknown, not inspected | none | none |
| 12 other `sites` rows | various | none | none | not inspected | none | none |

Every other client is a candidate for the same contract with tracking disabled.

## 5. Existing-data reconciliation (no merging by assumption)

- `ka-admin.course_leads` and `course_events`: **leave in place.** Propose that `course-lead.js`
  also emits a lead and submission event into the new ledger (section 7), keyed by the same
  email hash, so the free course joins the rest without moving the archive. Do not repoint the
  archive writes. Decision for Alex: keep double-writing, or migrate the free course to the new
  endpoint and freeze `ka-admin` fully.
- `ka-admin.invoices`, `retainers`, `app_state` (Launch Book): **not a live revenue source.**
  Do not read them into the dashboard as revenue. Offer a one-time, audited CSV import of paid
  invoices as historical `payment_received` events only if Alex wants history, labeled as
  imported.
- `review/desk-log.jsonl` and every `post.json` under `Already Released/` and `To Be Released/`:
  the campaign and publication history. Import idempotently by folder id and network.
- `ka_src` values already in `course_leads.source` (`synovial`, `direct`): map to
  `utm_source=<value>&utm_medium=partner` on import; keep the raw value.

## 6. Privacy choices to make before Stage 1 ships anything

Findings, code versus `/privacy/`:
1. Policy says no analytics cookies of our own; `ka_src` and `ka_course` exist.
2. Policy says no newsletter or mailing list; the free course sends "an occasional note",
   `/api/unsubscribe` exists, the admin sends newsletters through Resend.
3. Policy and terms say mobile numbers are not collected; AI Launch requires a phone, training
   asks for one.
4. Course leads are stored in D1; the policy does not say so.
5. The pixel's Lead event fires on four forms, not only "a contact form"; the ElevenLabs voice
   agent is not mentioned.

Proposed policy for the pilot (Alex decides):
- **Necessary processing** (no consent needed): the lead record, the notification email, the
  first-party touch cookie used only to attribute the enquiry. Documented in `/privacy/`.
- **Optional analytics and advertising** (gated): the Meta Pixel and any future Conversions API
  or LinkedIn send. Options: (a) keep firing as today and document it plainly, since the
  audience is US and no consent law applies to K&A's own site; (b) add a one-line, dismissible
  consent bar that gates the pixel and all adapters, and treat "not answered" as off. The
  guidance assumes (b). Recommendation: (b), because clients in healthcare and other sensitive
  categories will need it anyway and the layer should ship with the gate built in.
- **Field allowlist to platforms:** never form free text, never phone, never the chat summary.
  Only the event name, event id, time, page path, and the hashed email where a platform allows it
  and Alex has approved it.
- **Retention:** touch cookie 90 days (matching `ka_src`); ledger rows kept until Alex deletes
  them, with a delete-by-email job; outbox rows 30 days.
- **Sensitive clients:** `mbs-medicine` and any healthcare site get `adapters.enabled=false`
  hard-locked in config; only the internal ledger.

## 7. Architecture, translated to this stack

**Principle:** additive, off by default, one shared code path, per-site config, the server is
the conversion authority, Web3Forms emails keep working exactly as today.

### 7a. Components

1. **Site integration contract (`@ka/attribution-client`, a small script shipped from the site
   repo, not a package)**
   - `src/scripts/attribution.ts`: on every page, read `utm_source/medium/campaign/id/content`
     and permitted click ids (`fbclid`, `li_fat_id`, `gclid`) from the URL; normalize; write the
     first eligible touch and the latest eligible non-direct touch into one cookie `ka_touch`
     (JSON, 90 days, `SameSite=Lax; Secure`), never overwriting the first touch with a direct
     visit. Keep `?src=` working by mapping it to `utm_source=<src>&utm_medium=partner`. Replace
     the `ka_src` block in `BaseLayout.astro`, and read `ka_src` once as a fallback so existing
     visitors are not lost.
   - `data-lead-form` handling: every form in section 3 (paths 1 to 6) posts to the new server
     endpoint instead of Web3Forms directly. The browser sends the fields it sends today plus
     `form_id`, `site_id` (from build-time config, not trusted alone), the `ka_touch` snapshot,
     an idempotency key (random, stored in `sessionStorage` per form), and the consent state.
   - On a `202 {ok, event_id}` reply: fire `fbq('track','Lead',{}, {eventID: event_id})` only if
     consent allows and the site config enables the pixel; otherwise nothing. The Lead is not a
     conversion until the server said so.
2. **Server endpoint: Pages Function `functions/api/lead.js`** (same place `course-lead.js`
   lives, so the hosting model does not change)
   - Validates: origin, honeypot, size, required fields per `form_id`, Turnstile if enabled
     for the site. Rejections return 4xx and record nothing.
   - Resolves the tenant from server config (`site_id` by request host, never from the body).
   - In one D1 transaction: upsert `leads` (by tenant + email hash), insert one
     `lead_events{event_type: submitted}` with the attribution snapshot (dedup key = idempotency
     key), insert `outbox` rows: one `email` (Web3Forms, server-side, same subject lines and
     field names as today so the inbox looks identical), and one row per enabled adapter.
   - Returns `202 {ok:true, event_id}` as soon as the row is durable. Email delivery happens
     from the outbox with retries; a failed email is visible in the dashboard, never a lost lead.
   - Double clicks and retries with the same idempotency key return the same `event_id`.
   - `course-lead.js` gains a call into the same ledger write (section 5) and otherwise stays.
3. **Storage: a new D1 database `ka-attribution`**, bound as `ATTRIBUTION_DB` to the Pages
   project and to the admin Worker. Not `ka-sites` (whose rows are disposable by design) and not
   `ka-admin` (frozen archive). Tenant scoping by `site_id` on every statement, enforced in one
   query helper the way `admin/src/lib/desk.js` does it today.
4. **Campaign ledger importer: pipeline command `node tools/social.mjs ledger sync`**
   - Reads every `post.json` (both buckets, all clients), emits one `campaigns` row per folder
     and one `publications` row per network with Metricool id/uuid, native post id (captured
     from `getScheduledPosts` from now on; `reconcile` starts saving `providers[].id`),
     published permalink, scheduled and published times, status and the manifest path.
     Idempotent by (site_id, folder, network). Writes through `wrangler d1 execute` exactly like
     `desk push`, so it needs no new credentials.
   - Runs at the end of `release --record` and `reconcile`, and on demand.
5. **Link contract in code (`tools/lib/links.mjs`)**
   - `buildDestination(url, {network, folder, placement, paid})` returns the tagged URL:
     `utm_source=<network>`, `utm_medium=social|smartlink|story|paid-social`,
     `utm_campaign=<folder id>` (unchanged, backward compatible), `utm_id=<folder id>`,
     `utm_content=<placement>` where placement is `fb-reel`, `fb-post`, `ig-bio`, `li-doc`,
     `li-first-comment`, `yt-short`, `yt-desc`, `story`.
   - `payload.mjs` keeps sending the caption as written; `validate` gains a rule that every
     caption link on ka-performancefl.com (or the client's `site`) carries the full set for its
     network, with an autofix (`social links --fix`) that rewrites hand-typed links to the
     contract. Historical folders are not rewritten.
   - SmartLink buttons: give each a `utm_campaign=bio&utm_id=bio&utm_content=ig-bio-<button>`
     tag by hand in Metricool (it is four buttons), add the YouTube button, and rename "Free AI
     lessons". Placement-level attribution is the honest ceiling for Instagram; the ledger
     records `unknown_reason: no_post_link` for Instagram feed posts.
6. **Admin dashboard: `/sites/[slug]/attribution` in the `ka-admin` Worker**
   - Filters: date, network, paid/organic, campaign, placement, model (first eligible / last
     eligible non-direct). Panels: accepted leads, qualified/booked/won/paid counts, revenue by
     currency, refunds, conversion rates with denominators shown, lead-to-sale delay,
     cohort by acquisition week. Coverage panel: attributed / unattributed with reason
     (`no_tags`, `expired`, `direct`, `consent_denied`, `no_post_link`). Health panel: outbox
     failures, duplicates, last ledger sync, last Metricool import, stale feeds.
   - Platform-reported numbers (Metricool analytics, later Meta/LinkedIn) shown in a separate
     column, never summed with the internal counts.
   - Owner-only writes, same `readWrite` guard as the desk.
7. **Lifecycle and money (Stage 2)**: a `deals` form in the same admin page, per site: mark a
   lead qualified / booked / won with a value, and record `payment_received` / `refund` with
   amount, currency, transaction id and the actual payment date. Plus an audited CSV import
   (columns: lead email or lead id, event, amount, currency, occurred_at, external id) with a
   dry run. No CRM or payment integration exists to connect; this is the minimal honest source
   until one does.
8. **Adapters (Stage 3, each behind a per-site flag, default off)**: `meta-capi` (Conversions
   API, event id shared with the browser Lead), `linkedin-capi`, `ga4-mp`. Outbox delivery with
   receipts, last error, next retry. Nothing here until Alex approves the destination, the
   fields, and the account.

### 7b. Schema for `ka-attribution` (D1, migration 0001)

```
sites            site_id PK, slug, client_id, domain, timezone, currency, config_json, kill_switch, created_at
campaigns        site_id, campaign_id (folder id), title, pillar, planned_at, manifest_path, PK(site_id,campaign_id)
publications     site_id, campaign_id, network, placement, organic_or_paid, metricool_id, metricool_uuid,
                 native_post_id, destination_url, published_url, scheduled_at, published_at, status,
                 PK(site_id,campaign_id,network)
leads            site_id, lead_id PK, email_hash, email_enc, name, phone_enc, first_touch_json, last_touch_json,
                 attribution_policy_version, consent_state, consent_version, created_at, deleted_at
lead_events      site_id, event_id PK, lead_id, form_id, event_type, occurred_at, received_at, source_system,
                 source_record_id, deal_id, amount_minor, currency, transaction_id, attribution_json,
                 dedup_key UNIQUE(site_id,dedup_key), note
touches          site_id, touch_id PK, browser_ref, occurred_at, utm_json, click_ids_json, landing_path,
                 consent_state, policy_version   (only stored when a lead is created; anonymous touches stay in the cookie)
outbox           id PK, site_id, event_id, destination, payload_json, attempts, status, receipt, last_error,
                 next_retry_at, created_at
imports          id PK, site_id, kind, file_hash, rows, applied_at, applied_by, dry_run
```

Email and phone are stored encrypted with a key held as a Pages secret; the dashboard shows
them only to owners. Raw form free text is never stored in this database; it goes to the email
only.

### 7c. Files and services that change

| Stage | Repo | Files |
|---|---|---|
| 1 | site (`D:\ka-site-color`, new branch off origin/main) | `src/scripts/attribution.ts` (new), `src/layouts/BaseLayout.astro` (replace `ka_src` block, gate pixel, add consent bar include), `src/components/ConsentBar.astro` (new), `functions/api/lead.js` (new), `functions/_lib/attribution.js` (new: tenant resolve, validation, ledger write, outbox), `functions/api/course-lead.js` (add ledger call), `src/pages/contact/index.astro`, `src/components/StartProjectModal.astro`, `src/components/ScopeChat.astro`, `src/pages/ai-launch.astro`, `src/pages/training/index.astro` (point at `/api/lead`, send touch and idempotency key, fire Lead only on 202), `src/pages/privacy/index.astro` (rewrite the five points, new `lastUpdated`), `src/data/attribution.js` (new: site config), `scripts/seo-check.mjs` (allow the new script) |
| 1 | admin (`D:\ka-site-admin`) | `admin/wrangler.jsonc` (+ `ATTRIBUTION_DB`), `admin/migrations-attribution/0001_ledger.sql` (new, separate dir), `admin/src/lib/attribution.js` (new), `admin/src/pages/sites/[slug]/attribution/index.astro` (new), `admin/src/pages/sites/[slug]/attribution/*.js` (state, deal, import) |
| 1 | pipeline | `tools/lib/links.mjs` (new), `tools/lib/ledger.mjs` (new), `tools/lib/reconcile.mjs` (save `providers[].id`), `tools/lib/validate.mjs` (link rule), `tools/social.mjs` (`ledger sync`, `links --fix`), `tools/config/clients.json` (new: brand id and site id per client, replacing the hard-coded 7076479), `clients/README.md`, `README.md`, tests for each |
| 1 | Cloudflare (Alex, dashboard) | create D1 `ka-attribution`; bind `ATTRIBUTION_DB` on Pages (Production and Preview) and on the admin Worker; add `LEAD_ENC_KEY` secret; optionally a Turnstile site key |
| 2 | admin | deal form, CSV import with dry run, cohort views |
| 3 | site + admin | adapter modules under `functions/_lib/adapters/`, outbox worker cron (`ka-attribution-outbox`, new Worker) or a scheduled Pages Function |

### 7d. What stays exactly as it is

Web3Forms as the inbox (now sent server-side, same subject lines), the Post Desk and its
approvals, `desk push` purge semantics, owner-published clients (David's BBQ never touches
Metricool or the ledger's publishing side), `ka-admin` archive, the pixel id, the 90-day window.

## 8. Staged sequence

**Stage 0 (this document).** Approval needed to start Stage 1.

**Stage 1: internal foundation, staging only** (estimate: 3 working days of build, one review)
1. Pipeline first, because it has tests and no live risk: `links.mjs` + validate rule +
   `clients.json` + `ledger sync` writing to a **local** D1 (`wrangler d1 execute --local`).
   Prove idempotent import of all 92 existing folders.
2. Migration 0001 and the admin page, read-only, against local D1 with synthetic rows.
3. Site: `attribution.ts`, consent bar, `/api/lead`, the six form changes, privacy rewrite. Run
   on a Pages **preview branch** (`attribution.kandadesigners.pages.dev`) with a Preview-only
   `ATTRIBUTION_DB` binding to a **staging** D1 (`ka-attribution-staging`). Web3Forms in
   staging posts to a test subject line so real leads are not mixed in.
4. Acceptance tests from the guidance, section "Acceptance tests required before production":
   links and delayed return, submission correctness (validation failure, double click, JS
   blocked, email retry), privacy and isolation (cross-tenant reads fail, consent denied blocks
   the pixel), durability (delete desk rows, ledger intact).
Gate: Alex reviews the preview site, the dashboard on staging, and the diff.

**Stage 2: lifecycle reporting** (estimate: 1 day)
- Deal form and CSV import; demonstrate a delayed sale, a refund applied once, an import
  replayed without inflation, a sale after cookie expiry on a known lead.
Gate: Alex reviews the report against synthetic data.

**Stage 3: optional adapters** (only for destinations Alex approves; estimate 1 day each)
- Meta Conversions API in test-events mode with the browser event id; prove dedup in Events
  Manager. LinkedIn and GA4 only if there is a paid campaign to justify them.
- Metricool analytics importer: **only through the MCP connector** the weekly check already
  uses, stored as structured rows with source, interval and freshness, until API entitlement is
  confirmed.

**Stage 4: pilot production and generalization** (estimate: half a day plus the site push)
- Merge to main (site) and deploy the admin Worker; bind Production `ATTRIBUTION_DB`; run
  `ledger sync` for real; verify the first live lead end to end; keep the pixel gated.
- Then the client checklist: add a `sites` row and `clients.json` entry, tracking off, consent
  policy chosen, adapters off. Add the contract to the site-generation template so new builds
  inherit it disabled.

**Rollback at every stage:** the site changes sit behind `src/data/attribution.js` flags
(`ledger`, `consentBar`, `pixel`, `adapters`) so a redeploy with flags off restores today's
behavior without a revert; the migration is additive (a new database), so rollback is
"unbind and stop writing"; the pipeline changes are behind a `ledger` config key and the link
autofix never rewrites historical folders.

## 9. Approval list (each needs a yes before it happens)

| # | Action | Site / account | Data | Impact |
|---|---|---|---|---|
| A1 | Create D1 `ka-attribution-staging` and `ka-attribution` | Cloudflare account | none yet | new database, free tier |
| A2 | Bind `ATTRIBUTION_DB` to Pages Preview (staging) | kandadesigners | none | preview only |
| A3 | Add `LEAD_ENC_KEY` secret to Pages | kandadesigners | encryption key | none |
| A4 | Route six forms through `/api/lead` on a preview branch | preview only | name, email, phone, message, touch | none live |
| A5 | Rewrite `/privacy/` and `lastUpdated` | live site, with A8 | policy text | public copy change |
| A6 | Consent bar gating the pixel | live site, with A8 | consent state cookie | pixel fires less |
| A7 | Bind `ATTRIBUTION_DB` to Pages Production and the admin Worker | production | leads, touches | go-live |
| A8 | Push the site branch to main and deploy the admin Worker | production | all of the above | go-live |
| A9 | Re-tag the four SmartLink buttons, add YouTube, rename "Free AI lessons" | Metricool SmartLink 169122 | none | bio link attribution |
| A10 | Save native post ids from `getScheduledPosts` in `post.json` | pipeline | post ids | none |
| A11 | Meta Conversions API dataset and token | Meta Events Manager | event name, id, time, hashed email if approved | sends lead events to Meta |
| A12 | Any CSV import of historical invoices | ka-admin export | amounts, dates | shows historical revenue |

No customer data goes to any platform under A1 to A10. A11 is the first item that would.

## 10. Costs

- Cloudflare D1, Pages Functions and one small Worker: within the free tier at K&A's volume
  (single-digit leads a week). No new paid service.
- Turnstile: free. Web3Forms: unchanged plan.
- Build time: roughly six working days across Stages 1 to 4 for K&A, plus about half a day per
  additional client.

## 11. Decisions for Alex (asked only because inspection cannot resolve them)

1. **Pilot:** K&A first, as proposed? Yes / no.
2. **Consent:** option (a) document and keep firing, or option (b) consent bar gating the pixel
   and every adapter? The plan assumes (b).
3. **Free course:** keep writing to `ka-admin` and mirror into the ledger, or move it to
   `/api/lead` and freeze `ka-admin` completely?
4. **Lifecycle definitions for K&A:** what counts as qualified (a scoping call held?), booked
   (proposal accepted?), won (deposit paid?), and paid (money received)? Where do you record
   these today, if anywhere?
5. **Revenue source of truth:** manual deal entry in the admin (proposed), or is there an
   invoicing tool you actually use now?
6. **Historical invoices:** import the archived `ka-admin` invoices as labeled history, or start
   clean?
7. **Phone numbers:** keep requiring a phone on AI Launch? If yes, the privacy page and terms
   change to say so.
8. **Sensitive sites:** confirm `mbs-medicine` is locked to internal-only (no pixel, no
   adapters) from day one.
9. **Adapters:** is a Meta Conversions API send wanted at all for K&A, given no paid Meta ads
   run today? If not, Stage 3 is skipped for now.
10. **SmartLink:** approve the re-tag, the YouTube button and the rename of "Free AI lessons".

## 12. Evidence that will accompany each gate

The diff, migration and rollback commands, one synthetic lead payload and its ledger rows, the
site-to-account mapping, the acceptance test results, adapter receipts where authorized, and a
short runbook: onboard a client, diagnose a missing conversion, correct a sale, process a
deletion, turn tracking off. No secrets or real customer payloads in any handoff.
