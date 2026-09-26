# Post Desk in the admin (2026-09-26)

Moves the Post Desk (today a claude.ai artifact,
https://claude.ai/artifact/BwgxjJ7mbkuRGvxyHPMRd3, source
`Social Media Management/review/index.html`) into the admin at
admin.ka-performancefl.com, as a section of a monitored site.

## Alex's decisions (2026-09-26)

- Same database: new tables in `ka-sites`, not a new D1.
- The desk only holds work until it is published, then it purges: once a post's
  date has passed, and also one day after Alex approves it (see Purge).
- Only Alex approves for now: writes need `people.role = 'owner'`. Anyone else in
  `people` (none today) would see the desk read-only.
- Claude pushes the queue and pulls decisions on its own (wrangler, the user-scope
  `CLOUDFLARE_API_TOKEN`). Deploys and migrations stay Alex's pasted lines.
- The artifact keeps running until the admin desk has had a real test run.
- Later: every monitored site can have its own Post Desk for that client's brand.
  So everything is keyed by `site_id` and lives under `/sites/<slug>/social` now,
  even though only `ka-performance` uses it at first.

## What stays the same

- The social pipeline on Alex's PC builds the queue (`node tools/review.mjs`
  writes `review/data.json`). Scheduling in Metricool stays in Claude's session
  (Starter plan, no API). The desk records decisions; Claude applies them.
- The page's behavior: Approvals (rail of waiting posts, stories, asks; detail
  with media, captions per network, questions, repost line; Approve, Request
  changes with a note, Undo; J/K/A/C keys) and Stories (checklist rows with
  image, sticker text, URL, Copy URL, Save image, Posted checkbox; today
  outlined, past unticked flagged; "paused" message when `storiesPaused`).
  Past days are purged (see Purge), so the "not ticked" flag only matters for
  rows still present.

## Data (migration `0002_post_desk.sql`)

```sql
CREATE TABLE desk_items (
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,          -- folder id, "<date>-story", or ask id
  list TEXT NOT NULL,             -- 'approve' | 'stories'
  kind TEXT NOT NULL,             -- reel | carousel | linkedin | post | native | story | ask
  post_date TEXT,                 -- YYYY-MM-DD (Eastern); NULL for asks
  post_time TEXT,                 -- HH:MM or NULL
  title TEXT NOT NULL,
  payload TEXT NOT NULL,          -- JSON: the item exactly as in data.json, media paths as R2 keys
  pushed_at TEXT NOT NULL,
  PRIMARY KEY (site_id, list, item_id)
);
CREATE TABLE desk_decisions (
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  decision TEXT NOT NULL,         -- waiting | approved | changes | answered
  note TEXT NOT NULL DEFAULT '',
  answers TEXT NOT NULL DEFAULT '{}',   -- JSON {questionIndex: text}
  answer TEXT NOT NULL DEFAULT '',      -- asks only
  decided_by INTEGER REFERENCES people(id),
  decided_at TEXT NOT NULL,
  pulled_at TEXT,                 -- set by Claude's pull; NULL = not yet read
  PRIMARY KEY (site_id, item_id)
);
CREATE TABLE desk_story_checks (
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,          -- "<date>-story"
  posted INTEGER NOT NULL,
  checked_by INTEGER REFERENCES people(id),
  checked_at TEXT NOT NULL,
  pulled_at TEXT,
  PRIMARY KEY (site_id, item_id)
);
CREATE TABLE desk_meta (
  site_id INTEGER PRIMARY KEY REFERENCES sites(id) ON DELETE CASCADE,
  pushed_at TEXT NOT NULL,
  built_at TEXT,
  stories_paused INTEGER NOT NULL DEFAULT 0
);
```

A change to a decision (including Undo) rewrites the row and clears `pulled_at`,
so the next pull reports it again.

## Media

- New private R2 bucket `ka-social-desk`, bound to the admin Worker as
  `DESK_MEDIA`. Review copies never go to the public `ka-social` bucket
  (media.ka-performancefl.com): unapproved posts must not sit at public URLs.
- Key layout: `<site-slug>/<item-id>/<file name>`, e.g.
  `ka-performance/2026-10-05/reel-vertical.mp4`,
  `ka-performance/2026-10-05-story/2026-10-05-story.png`.
  Keys match `^[a-z0-9-]+/[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$`.
- In `payload`, every media `src` (and story `src`) is the R2 key. The page
  turns a key into `/sites/<slug>/social/media/<key after the slug>`.
- Versioning: each `payload.media[]` entry may carry `v`, and a story item (in
  either list) may carry a top-level `v` for its `src`: a string such as
  `"906497-1727340000000"` (size and mtime, written by `desk push`). When `v` is
  present the page appends `?v=<encodeURIComponent(v)>`, so a replaced file is
  never served from the browser's cache. The media route ignores the query
  string; the key comes from the path alone.
- `GET /sites/<slug>/social/media/<item-id>/<file>` serves from `DESK_MEDIA`
  behind the middleware, with HTTP Range support (206, `Accept-Ranges: bytes`,
  `Content-Range`), because Safari will not play an mp4 without it.
  `Cache-Control: private, max-age=3600`, `X-Content-Type-Options: nosniff`,
  `ETag`. The key's slug must equal the route's slug. A ranged read uses
  `onlyIf: { etagMatches }` against the object `head()` measured; if the file
  changed or went in between, the route answers 503 with `Retry-After: 1`.

## Routes (all behind the existing middleware; Access + `people`)

- `GET /sites/<slug>/social`: the desk page. Server renders with the site's
  items, decisions and story checks embedded as JSON; a client script (ported
  from the artifact) draws it. `#stories` opens the Stories tab.
- `GET /sites/<slug>/social/state`: JSON `{items, decisions, checks, meta}` for
  refresh (on window focus and after each write). No realtime needed.
- `POST /sites/<slug>/social/decide`: JSON `{item_id, decision, note?, answers?, answer?}`.
- `POST /sites/<slug>/social/check`: JSON `{item_id, posted}`.
- Write rules: owner only (else 403); `Content-Type: application/json`; the
  `Origin` header must equal the request's origin (Astro's `checkOrigin` covers
  form posts only, not JSON); `item_id` must exist in `desk_items` for that
  site; decision in the allowed set; note, answers and answer length-capped
  (note 2000, each answer 1000). Respond with the saved row.
- Nav: the top nav gains "Social" linking to `/sites/ka-performance/social`;
  each site page links to its desk ("Post Desk") when that site has any
  `desk_items` or `desk_meta` row.

## Purge

Rule, applied per site, with "today" = Eastern date (`lib/when.js`).
An item's `desk_items` rows go, one list at a time, when
1. `post_date < today`, or
2. (approval list only) its decision is `approved`, `decided_at` is more than
   24 hours ago, and `pulled_at` is set (Claude has read it, so the approval is
   never lost).
Asks (no date) go when answered, pulled and 24 hours old. An approved Story
leaves the approval list by rule 2 but stays on the Stories checklist until its
date passes. R2 objects under `<slug>/<item-id>/` go once no row for that item
is left in either list.

Decisions and Story ticks are never lost to a purge: unpulled ones survive
rule 1. A decision (or tick) goes only once its item has no row left in the
approval list (or the checklist) AND `pulled_at` is set, or, as a hard cap,
once `decided_at` (or `checked_at`) is more than 14 days old. Each delete
re-checks the state it was selected on (`decided_at`/`checked_at` unchanged,
and still pulled when that was the reason), so a decision Alex changes between
selection and delete survives.

Runs in the admin Worker when the desk page or `/state` is requested (cheap;
at most once per 10 minutes per site, tracked in memory is fine), and Claude's
push mirrors the queue (below), which removes whatever the pipeline no longer
has waiting.

## Claude's side (Social Media Management/tools)

- `node tools/social.mjs desk pull [--site ka-performance]`: reads decisions and
  story checks with `pulled_at IS NULL` (`wrangler d1 execute ka-sites --remote
  --json --command`), appends them to `review/desk-log.jsonl` (the local
  record), prints a summary, then sets `pulled_at` on exactly those rows
  (matched on `item_id` and `decided_at`/`checked_at`, so a row Alex changes in
  between is left for next time) via `d1 execute --remote --command`, chunked
  at 50 statements per call. Never `--file` for this: with `--remote`,
  `--file` goes through the D1 import API, which briefly makes the database
  unavailable, and this is a small, frequent update, not a bulk replace.
  Applying decisions stays manual, as today.
- `node tools/social.mjs desk push [--site ka-performance] [--dry-run]`, in
  order:
  1. Reads the site's current `desk_items` (`list, item_id`). An approval-list
     item (post, an approved Story, or an ask) that is missing there but whose
     latest logged decision in `review/desk-log.jsonl` is `approved` (or, for
     an ask, `answered`) has already been purged once Claude read the
     decision; `desk push` does not resurrect it just because the local
     `review/data.json` still lists it (Claude has not applied the decision
     locally yet). It is left out of the push and reported, e.g. `2026-10-12:
     approved on the desk, apply it locally (status approved) before pushing
     again`. A Story-checklist row is never subject to this skip.
  2. Reads `review/data.json`/`review/files.json`, computes each media file's
     `v` (`<size>-<mtimeMs>`, from the local file `desk push` is about to
     upload), and uploads whatever changed since `review/desk-pushed.json`
     (key -> size and mtime) to `ka-social-desk` with the existing r2 helpers.
     An item missing from `desk_items` (step 1's check, even one not skipped)
     has its tracked media entries dropped first, forcing a re-upload even if
     the local file looks unchanged, since the two can drift apart. Videos go
     up as the 720p review proxies `review.mjs` already makes.
  3. Pulls (never lose a decision, and never while the import below is
     running).
  4. Replaces the site's `desk_items` in one `d1 execute --remote --file`
     (still `--file` here, this is the bulk replace it exists for): delete all
     rows for the site and re-insert the current ones; delete
     `desk_decisions`/`desk_story_checks` rows whose `item_id` is no longer in
     the corresponding list, but only when `pulled_at IS NOT NULL` (never drop
     one still waiting to be read); upsert `desk_meta`. Each `desk_items` row
     also gets a content hash (see below); when it changed since the last
     successful push, the same transaction also deletes that item's
     `desk_decisions` row (guarded the same way, `pulled_at IS NOT NULL`), so a
     revised post drops back to Waiting. `desk push` prints which item ids
     were reset.
  5. Only once that import has actually succeeded: deletes R2 objects for
     items the queue no longer needs.
  `--dry-run` reports the plan (uploads, deletes, row count) and touches
  nothing remote at all: no pull, no `desk_items` read, no skip check.
  `review/desk-pushed.json` (media size/mtime, plus a content hash per
  `<list>/<item_id>`) is written after every attempt, in a `finally`, so a
  failure partway (e.g. the import throws) still keeps whatever uploads
  completed instead of re-sending them next time.
- The content hash covers only what Alex actually reviews, computed after
  `v` is known (so a re-rendered file, same caption, still counts as a
  change): for a post, `title`, `hook`, `networks`, `facebook`, `instagram`,
  `firstComment`, `linkedin`, `linkedinComment`, `repost`, `questions`, and
  `media` as `[{role, alt, platforms, v}]`; for a Story (either list), `date`,
  `time`, `condition`, `stickerText`, `stickerUrl`, `v`; for an ask, `title`,
  `detail`, `placeholder`. Never `status`, `scheduled`, `ai`, `music`,
  `weekday`, `pillar`, `builtAt`, or a media/story `src` (an R2 key, not
  content) - an operational-only change (Metricool status, a schedule id)
  must never reset an approval Alex already gave.
- Both reuse `tools/lib/cloudflare.mjs` (`wrangler`, token handling); the D1
  database name is `ka-sites`. SQL is built with proper escaping (single quotes
  doubled), never string-concatenated from untrusted text without it.

## Deploy (Alex's pasted lines, runbook in admin/DEPLOY-POST-DESK.md)

1. `wrangler r2 bucket create ka-social-desk`
2. `wrangler d1 migrations apply ka-sites --remote`
3. build and deploy the admin.
Then Claude runs the first `desk push` and Alex does a test run next to the
artifact. The artifact retires only after that.

## Not in scope now

Client brands (multi-brand social pipeline, per-client Metricool brands),
editing captions in the desk, scheduling from the desk, realtime updates.
