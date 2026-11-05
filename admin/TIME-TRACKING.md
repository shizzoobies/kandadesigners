# AEC hours tracking

Production release based on `admin/bank` commit
`10935ea500c028a748075278c93d24d8ccae87df`, preserving Sites, Post Desk, People,
and Bank. The live Worker is `ka-admin`, using `ka-sites` D1 and `people`
authorization. GitHub main contains a different, legacy admin and must not be
used to deploy this feature. The user authorized publishing on 2026-11-05.
Automatic sync, credentials, Access policies, and persistent hooks remain disabled
pending separate action-time approval. Migration: `0006_time_tracking.sql`.

## User flow

Owners get an **Hours** navigation item. Each owner sees only their own entries.
AEC Punch and AEC Finance are explicit work categories; an existing site can
optionally be linked without creating sites or touching billing.

- Add manual intervals, or import a collector JSON file/pasted JSON.
- Codex imports are suggestions with zero approved and zero billable time.
- Review/correct UTC start/end and work description, then approve.
- Billable is a separate, unchecked-by-default choice. Nothing generates invoices.
- Overlaps across both categories cannot be approved, enforced by database triggers.
  Correct or exclude one interval. Adjacent intervals are allowed.
- Saving an approved entry for review removes its approved/billable contribution.
- Original source timestamps are immutable; every change has a history record.
- CSV contains approved entries only, with billable flag and original evidence.
- All-time totals include all entries, independent of 100-entry page navigation.
  Durations retain milliseconds; displayed hours are rounded to two decimals.

## Exact source and limitations

The optional local Node collector consumes documented Codex hook stdin for
`UserPromptSubmit`, `Stop`, and `Interrupt`. It timestamps receipt locally and
pairs a start with the first completion/interruption using a SHA-256 key of
`session_id` plus `turn_id`. Explicit configured repository roots map `cwd` to
`aec-punch` or `aec-finance`. Add each actual worktree root deliberately.

Only these fields reach the admin: `version`, `sourceKey`, `workstream`, `start`,
and `end`. No prompts, assistant messages, tool results, transcript contents,
local paths, or raw session/turn IDs are saved or sent by the collector. It never
reads Codex session files or the `transcript_path` field. Manual entries are a
separate source.

This measures elapsed agent-turn activity, **not human attention or billable work**.
Waits, unattended work, approvals, and background operations can be included.
Concurrent turns remain separate suggestions; human review and the approval
constraint prevent double counting. It does not retrospectively reconstruct work.
Missing starts/completions, crashed hooks, unmapped roots, and intervals longer
than four hours do not become suggestions. Long/invalid paired intervals leave a
local `skipped` marker; enter actual work manually. No idle detection is claimed.
Interrupt capture is best effort within Codex's short hook timeout.

The installed executable reported `codex-cli 0.166.0-alpha.5.1` and
`hooks stable true`. Compatibility was checked with `--version` and
`features list`; the hooks themselves were tested with synthetic payloads, not
installed into the user's running Codex sessions.

References checked 2026-11-05:
- [Official Codex hooks](https://learn.chatgpt.com/docs/hooks)
- [D1 prepared statements and transactional batches](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [D1 local migration commands](https://developers.cloudflare.com/d1/wrangler-commands/)

## Collector setup after release approval

The examples are inert. They are not copied into `.codex` automatically.

1. Place `scripts/codex-time.mjs` and a private copy of
   `scripts/time-config.example.json` in a stable location. Node 24+ is available
   on the inspected machine. Set an absolute private `stateDir` and the exact
   Punch/Finance repository and worktree roots. Protect the directory with the
   user's OS permissions. Keep it outside Git and synced/public directories.
2. Merge the event blocks in `scripts/time-hooks.example.json` into an appropriate
   trusted project or user hooks configuration. Preserve every existing hook.
   Replace placeholder paths; quote paths with spaces in the command strings.
   Project-local hooks only load for trusted project layers. Restart a test
   session and verify one real start/stop pair before relying on capture.
3. With `autoSync: false`, export queued activity manually:

   ```powershell
   node 'C:/stable-path/codex-time.mjs' export 'C:/private/time-config.json' > activity.json
   ```

   Import the JSON through **Hours > Import Codex activity**. At most 100 records
   are exported per call. Pass `2`, `3`, etc. after the config path for subsequent
   pages while capture is idle. Manual export leaves queued records intact, so
   reimport is safe. Use automatic sync for continuing capture at volume.

## Optional automatic delivery

The endpoint is disabled unless configured. It is write-only and cannot approve,
read, edit, or delete time. No other admin route accepts its credential.

- Stage a random token with at least 32 random bytes as Worker secret
  `TIME_SYNC_TOKEN`. Set `TIME_SYNC_USER_ID` to the verified owner row ID.
  On 2026-11-05 the production owner Alex Anderson was verified as ID 1.
  Removing that person or their owner role stops new sync requests. Revoke the
  token before removing/replacing that identity, since SQLite IDs can be reused.
  Rotating/removing the token also stops delivery. Existing hours retain their
  history with a null owner when a person is removed, preventing ID-reuse exposure.
- Provision a Cloudflare Access service token with a **Service Auth** policy
  scoped only to `/api/time-sync` on the protected admin hostname. Keep the
  existing human Access policy intact. Do not add a Bypass policy or widen the
  service token to the whole admin.
- In the collector process environment, securely supply `KA_TIME_SYNC_TOKEN`,
  `KA_ACCESS_CLIENT_ID`, and `KA_ACCESS_CLIENT_SECRET`. Do not put credentials in
  the JSON config, hooks command, repository, or chat.
- Set `autoSync: true`. The collector attempts delivery after Stop/Interrupt;
  HTTPS only, redirects refused, 1.8-second request timeout. Failed deliveries
  remain in the durable `pending` directory. Successful records move to `sent`.
  A later hook or `node codex-time.mjs sync CONFIG.json` retries the next batch.
  There is no background scheduler; if no new turn occurs, a failed batch waits
  for an explicit retry. The admin deduplicates even after a lost acknowledgment.
- Keep the application endpoint `https://admin.ka-performancefl.com/api/time-sync`.
  Never reuse the synthetic local test token from the test script in production.
- Open/reload Hours to see delivered suggestions. Configuration presence is shown
  in the UI; it is not a claim that the collector is currently connected.

## Verification and release procedure

Install only within `admin` using its existing lockfile. Checks used:

```powershell
node node_modules/vitest/vitest.mjs run
node node_modules/astro/astro.js build
node node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --local --persist-to .wrangler/time-qa
```

Set `ASTRO_TELEMETRY_DISABLED=1` for build. Windows esbuild resolution required
running the test/build/local server commands outside the restricted sandbox.
No auto-review rejection occurred; approved local execution completed.

The production-based local Worker runs on `127.0.0.1:4398`, inspector `9398`, with
synthetic D1 in `.wrangler/production-qa` and development identity. The initial
legacy-base smoke run used port 4397. `scripts/verify-time-local.mjs` is a
fixed-loopback smoke check that imports its own synthetic pending fixture;
it deliberately has no remote-host parameter. It verifies sync credential,
method/origin denial, retry deduplication, CSRF denial, and approved-only CSV.

Browser evidence is under local `output/playwright/`: manually added time,
approval after correction, reload persistence, overlap denial with preserved
inputs, responsive 360/768/1280 captures, and revision history. Screenshots were
opened for visual inspection. Unit tests exercise SQLite migrations/triggers,
owner isolation, invalid inputs, audit history, pagination, CSV protection,
collector privacy/deduplication, and durable sync failure/retry. Final full suite:
457 tests in 44 files passed before the additional person-removal regression;
the subsequent focused schema/time run passed all 19 tests. The build passed; it emits the adapter's existing
Sharp runtime warning and a Node crypto externalization notice. Node crypto
authentication also passed in the actual local Worker runtime with nodejs_compat.

Before release, identify the actual deployed schema, record the D1 Time Travel
bookmark, apply **only missing** migrations to `ka-sites`, deploy the matching
Worker build with `--keep-vars`, and verify Access and the owner workflow.
Never replay seed migrations blindly against live data. Preserve Bank and
Analytics service bindings, existing secrets, and disabled workers.dev/preview URLs.
Enabling persistent hooks and provisioning the Access/Worker credentials are
still pending. UCC development servers and tests were not stopped or modified.
