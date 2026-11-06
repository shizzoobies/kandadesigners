# Hours quick review: prepared release

Prepared 2026-11-06 on `codex/hours-quick-review`, from
`codex/aec-hours-production` at `9ad4cef13ed969953e0ed705d688d6d7bfadaeb3`.
Not deployed. Production migrations and time entries were not changed.

## Behavior

- Approve and Skip are available on each collapsed pending row.
- Quick approval confirms the saved interval, never a submitted replacement
  interval, and always leaves billable off. Billing remains in expanded details.
- Quick actions return to the pending queue. Pending entries sort first.
- Entries strictly under 900 seconds are skipped per entry. Exactly 900 seconds
  stays pending. Comparison retains milliseconds before display rounding.
- Short imports, manual entries, and edits are retained as skipped records.
  Correcting an interval to at least 15 minutes can return it to review.
- Skipped records have a reason and revision history. Original evidence is
  immutable. Repeated delivery never restores a skipped or corrected record.
- Quick actions require ownership, pending status and the displayed revision.
  Database triggers still prevent overlapping approved intervals across projects.

## Production reconciliation and proposed migration

Read-only checks on 2026-11-06 confirmed the production Worker still runs version
`4a39ce7f-ef97-42db-b60f-1a9a861e7326` at 100%, the secret update following the
Hours release of `2eb4cb46bcca0d14d45c3e9bfd6e6e6bc7ee8fc3`.
The remote Hours branch still ends at `9ad4cef1`; `admin/bank` at `10935ea5`.
Do not deploy GitHub main, which contains the legacy admin.

An aggregate SELECT on `ka-sites` found 14 pending records, of which 11 were
strictly under 15 minutes, plus one approved record (not under 15 minutes).
The query reported zero rows written. Counts may change as sync continues.

After explicit release authorization, apply migration
`0007_time_quick_review.sql` before deploying this branch's built Worker.
It adds the audit reason, replaces history triggers and skips only existing
pending short entries. It increments their revision so stale approval requests
cannot succeed. Existing approved/billable and already skipped rows are not
reclassified. Guards also cover older Worker writes during rollout.

Recheck the deployment and migration ledger at release time; retain all current
secrets and bindings. No credentials or hook changes are needed. The prior
Worker is compatible with the added column, but rolling code back does not
undo the minimum-duration policy in the database. Do not delete audit history
or silently restore skipped records to reverse this release.

## Verification

- `node node_modules/vitest/vitest.mjs run`: 45 files, 466 tests passed.
- `node node_modules/astro/astro.js build`: passed, including the final
  queue-anchor and compact-row changes. Existing adapter sharp/runtime and
  node:crypto externalization notices remain; no build errors.
- `git diff --check`: passed.
- No lint script is defined in this app's package manifest.
- New SQLite tests cover 1 ms, 14:59.999, exactly 15:00, 15:00.001,
  duplicate sync, manual/edit behavior, ownership, forged billing/interval
  fields, competing approve/skip requests, concurrent overlapping approvals,
  adjacency, stale revisions, queue ordering and migration preservation.
- Migrations 0001 through 0007 applied successfully to an isolated local D1
  database. Synthetic entries verified the database's old-Worker insert guard.
- Headless Chrome with the existing bundled Playwright runtime exercised
  `/hours`, `/hours/2` and `/hours/export` on loopback port 4407.
- Checked 360x800, 768x1024 and 1280x900, reduced motion and no horizontal
  overflow. Inspected actual screenshots at all three widths, plus the
  overlap error and expanded form.
- Verified collapsed keyboard approval at exactly 15 minutes, pointer approval,
  non-billable totals, overlap rejection, automatic detail expansion on error,
  quick skip, empty queue, stored skip reasons, history and CSV exclusions.
- One expected HTTP 409 console message came from the deliberate overlap
  attempt. No other console errors or failed requests occurred.

Local browser evidence is in `output/quick-review/ui-results.json` and
`output/playwright/hours-quick-*.png`. The repeatable browser runner and isolated
local Worker config are under `output/quick-review/`. These are synthetic QA
artifacts, not production records. Windows sandbox restrictions required
approved escalated local test/build/browser execution; no approval was denied.
