## Approved rollout checkpoint: 2026-10-03

This checkpoint supersedes the historical setup and authorization blockers below.
The owner approved the sender, the two WAF paths, publishing this reviewed update,
and exactly one labeled synthetic enquiry to alex@ka-performancefl.com.

- Production Pages kandadesigners has RESEND_API_KEY configured (name/presence
  verified only) and LEAD_FROM = K & A Performance Website <leads@ka-performancefl.com>.
  The owner confirmed the Resend sending domain is verified.
- Both /api/lead and /api/lead/ are now in the existing enabled AI endpoints rule.
  Verified rule b8d9aee9b6af4206ac14a56b2ed3457d in ruleset
  b61bbbc4ebc2442198b0fff64afe0865, K&A zone 1995b308676149e70185aa8f7f7ce96d.
  All prior paths are retained. Action block, 5 requests per 10 seconds, a
  10-second mitigation, and ip.src/cf.colo.id characteristics are unchanged.
  The allowance is shared across all matched endpoints.
- ADMIN_DB remains the archived ka-admin database
  7e6d2716-1744-4618-a971-d12308a7bc5b. No migration or rebinding.
- The current production source was clean and matched c20e5b4 before applying
  this change on fix/form-email-routing-20261003. All 19 backend tests, the
  47-page Astro build, and the 31-indexable-page SEO gate passed in that checkout.
- Previously completed mocked browser QA: 288 checks at 360/768/1280 pixels.
  The production test must use the general contact form, never course signup,
  so it creates no synthetic course lead or database row. Confirm inbox receipt
  separately; API acceptance alone is not proof of delivery.

The sections below preserve the earlier investigation and implementation record.

# Form email routing update

Prepared 2026-10-03 against deployed commit c20e5b4 in D:/ka-site-seo.
This workspace is an isolated subset for review, not a complete website checkout.
No production submission, email, deployment, DNS change, or secret change was made.

## Current setup checkpoint (2026-10-03, after owner key entry)

- Owner reports the Resend key was saved and ka-performancefl.com is verified.
- A fresh names-only listing confirms RESEND_API_KEY now exists in the
  kandadesigners Production environment. Its value and validity were not read
  or tested. This supersedes the initial missing-secret finding below.
- A targeted configuration read confirms LEAD_FROM is still absent in Production.
  Set the plain variable to `K & A Performance Website <leads@ka-performancefl.com>`.
- ADMIN_DB binding presence is confirmed. Its database destination was not changed.
- WAF access remains blocked by the earlier HTTP 403. No alternate credential or
  route was attempted. Owner must add /api/lead and /api/lead/ to the existing
  POST API rate-limit rule, preserving its other settings.
- No new QA run was needed: no application code changed at this checkpoint.
- The saved Pages secret applies to deployments that use it; this check does not
  claim the current deployed code has begun using Resend. Rollout is unapproved.

## Confirmed findings

- Cloudflare Pages project: kandadesigners. Latest production deployment read on
  2026-10-03: 96fc178e-7c86-4364-8071-8c7657d6df2d, main, c20e5b4.
- Live homepage popup and contact, scope, mentorship and training paths still use
  Web3Forms. The homepage popup matches the reported subject, sender display name,
  Name/Email/Message fields, and submitted-from homepage.
- The Web3Forms recipient mapping is not in source. The reported delivery to
  personal Gmail supports old recipient routing, but forwarding and reply account
  selection cannot be distinguished from source. No explicit Reply-To was set.
- Free-course capture posts to /api/course-lead and attempts a D1 upsert before
  notification. It succeeds if either storage or mail succeeds. Ordinary enquiry
  forms have no application database persistence.
- Current site checkout: D:/ka-site-seo. D:/K & A Performance Site belongs to a
  separate Codex/social workstream. Current admin checkout: D:/ka-site-admin.
- Current admin uses ka-sites. Old ka-admin remains the course-lead archive,
  referenced by public Pages ADMIN_DB. Do not redirect those writes to ka-sites.
- Production secret-name listing confirms RESEND_API_KEY on Worker ka-admin,
  but absent on Pages kandadesigners. Secret values were not retrieved.
- Older newsletter source uses NEWSLETTER_FROM=news@ka-performancefl.com;
  current checker configuration uses ALERT_FROM=alerts@ka-performancefl.com and
  ALERT_TO=alex@ka-performancefl.com. Notes say the apex is verified in Resend;
  current sender verification and key scope were not tested.

## Patch behavior

- Popup, contact, scope, launch and training use /api/lead and a shared browser helper.
- The server fixes To to alex@ka-performancefl.com and Reply-To to the validated
  visitor email. Resend credentials and sender never enter browser code.
- Configure LEAD_FROM to `K & A Performance Website <leads@ka-performancefl.com>`
  only after confirming that sender/domain is permitted by the chosen Resend key.
- Server validation includes body/field bounds, required fields, email validation,
  same-origin JSON requests, allowlisted notification fields, and honeypot handling.
  Same-origin checking is defense in depth, not bot protection by itself.
- The new /api/lead endpoint rejects Pages aliases and preview hosts; only
  ka-performancefl.com and www.ka-performancefl.com are accepted. Otherwise a
  pages.dev request could bypass a WAF rule on the production zone.
- General enquiry retries reuse a Resend idempotency key for the same payload in
  the current page session. Failure stays visible and does not clear entered data.
- Course D1 upsert, deduplication, unsubscribe token and storage-or-mail success
  behavior are preserved. Course notifications now use the shared Resend helper.
- Training/launch retain all questionnaire fields, source attribution and SMS
  consent No. No SMS or marketing enrollment is added. Privacy delivery-provider
  reference changes with the implementation.
- General enquiries remain email-only. This patch does not add a CRM/database,
  queue or provider-delivery webhook. Resend API acceptance is not final delivery.

## Deployment blockers and rollout gates

1. Configure a sending-only Resend credential securely as RESEND_API_KEY on the
   public Pages project, with LEAD_FROM as above or another permitted business
   sender in the same display-name format. Do not copy credentials into chat,
   client code, source control, or command arguments. Worker secrets are not
   automatically inherited by Pages. Do not deploy before configuration exists.
2. Confirm ADMIN_DB still binds the old ka-admin database. No database migration
   or rebinding is required by this patch. This investigation did not query PII.
3. Extend the existing Cloudflare WAF POST rate-limit URI set with BOTH
   `/api/lead` and `/api/lead/` (the Pages router accepts a trailing slash); retain
   all existing paths, including /api/course-lead, and keep the rule's current
   threshold, period, action, IP characteristic and mitigation duration.
   Read-only retrieval of the live http_ratelimit ruleset returned HTTP 403, so
   no exact current rule ID or expression is claimed. Owner must inspect the
   existing API rule in the zone's Security/WAF rate limiting settings. Old notes
   describe 5 requests per 10 seconds per IP, not a newly verified setting.
   Do not replace the existing rule with a reconstructed historical expression.
   Web3Forms provider spam filtering is removed, so this gate is required.
4. Apply the patch to an isolated branch based on current main; recheck if main
   has moved. Full build and mocked browser QA have passed in the sibling
   ka-form-qa copy. This patch subset itself is not a complete build tree.
5. Obtain deployment authorization. No approval to deploy, set secrets, change
   WAF, or DNS was included in this implementation task. No DNS change should be
   needed if the existing Resend domain verification is still valid.
6. Any real-mail delivery test requires separate authorization. Inspect both To
   and Reply-To headers and the business inbox's sending identity. Reply-To controls
   the reply recipient; it does not choose the user's Gmail sending account.

## Verification

Run `node --test tests/lead-email.test.mjs` from this subset or the full checkout.
The tests replace fetch and D1 with in-memory mocks. They never send email or
submit forms to production.

Completed independently in ../ka-form-qa:
- Full Astro production build: 47 pages, passed.
- Existing SEO gate: 47 pages checked, 31 indexable, passed; unpublished office
  address absent from generated output.
- Wrangler Pages Functions compilation: passed. Generated routes prioritize
  onRequestPost for POST and return 405 for the general /api/lead handler.
- Browser QA: 288 checks passed across popup, contact, scope, launch, training
  and course, each at 360, 768 and 1280 pixels. Empty and malformed required
  fields, consent/honeypots, rapid duplicate clicks, disabled state, errors,
  retained fields, error focus, retries, success, routing/Reply-To, course D1
  write, token and redirect, and no horizontal overflow were exercised.
- Zero uncaught browser exceptions. 18 external resource requests were blocked.
  All API calls ran locally against the actual handlers with mocked Resend/D1.
  The browser was desktop Chrome in fresh headless contexts, with a fully
  intercepted HTTPS origin and static responses supplied only from loopback.
- 36 screenshots saved; all six mobile error states and six representative
  tablet/desktop success states were visually inspected.
- 18 backend tests had already passed. After visual QA, the new production-host
  guard received one additional targeted regression test (passed); the full
  browser suite was not repeated because no UI code changed.
- Existing cosmetic behavior retained: the scoped-lead button remains disabled
  with its Sending label after the adjacent Sent confirmation appears. This is
  present in the baseline source; not a delivery failure or a new regression.

Evidence: ../ka-form-qa/output/playwright/form-email-report.json and screenshots;
runner: ../ka-form-qa/scripts/verify-form-email.mjs. All task-owned browser/server
processes from the completed suite were closed.

## Secure owner setup

The desktop browser-control tool was unavailable in this execution session.
No authenticated secret-entry page was opened and no key was read or saved.
Owner setup in Cloudflare: Workers & Pages > kandadesigners > Settings >
Variables and Secrets, Production selected. Add RESEND_API_KEY as encrypted
Secret; the owner enters and saves it personally. Add LEAD_FROM as a plain
variable after checking the domain in Resend. Secrets must exist before the
deployment that uses them.

In Resend, confirm ka-performancefl.com is currently Verified for sending.
Historical notes say it was verified, but this investigation did not access the
Resend dashboard. A sending-only key restricted to this domain is sufficient;
no broad account key is required. The proposed LEAD_FROM is
`K & A Performance Website <leads@ka-performancefl.com>`. Resend's documented
domain verification allows sending from addresses at that domain without
creating a separate mailbox. Do not change inbound Google Workspace MX records.

Reusing internal mail routing was considered: current admin/src/lib/alerts.js
is a helper invoked by a cron checker, not a callable internal mail service.
Reusing the Worker would require new routing/service bindings and an interface;
that is a larger architecture change than a restricted Pages sending key.

References:
- https://developers.cloudflare.com/pages/functions/bindings/#secrets
- https://resend.com/docs/dashboard/api-keys/introduction
- https://resend.com/docs/dashboard/domains/introduction

Relevant original source: src/components/StartProjectModal.astro:219,
src/components/ScopeChat.astro:180, src/pages/contact/index.astro:225,
src/pages/ai-launch.astro:1181, src/pages/training/index.astro:414,
functions/api/course-lead.js:50 and :81. Deployment ownership notes are in
D:/ka-site-seo/docs/superpowers/HANDOFF.md; admin database separation is in
D:/ka-site-admin/admin/wrangler.jsonc and admin/DEPLOY-SITES.md.
