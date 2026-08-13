# daily-songs: Firebase to Cloudflare D1 — Plan

**Goal:** Move the `daily-songs-x7k2` app off Google Firestore onto Cloudflare D1, so nothing live depends on Firebase and the data stops being world-readable.

**Architecture:** A new D1 database `ka-songs` bound to the **site's** Pages project as `SONGS_DB` (not the admin's `ka-admin` database: business records and a music tool should not share a schema). Two same-origin Pages Functions replace the browser's direct Firestore access, gated with the `verifyAuthCookie` helper the generation endpoints already use. The client loses the Firebase SDK entirely.

**Tech Stack:** Cloudflare D1, Pages Functions, vanilla ES modules. No new npm dependencies anywhere.

## Global constraints

- **Never `npm install` at the repo root.** npm 11 strips the top-level `@emnapi` entries from `package-lock.json` and breaks the Cloudflare build. Canary: 3 top-level entries, 26 total mentions, md5 `1fc8960b5bed1a9256d72ec5c6620649`. This plan adds **no dependencies at all**.
- **No `wrangler.toml` at the repo root.** The site's Pages project is dashboard-configured; introducing a wrangler config would change how Cloudflare builds a live site. Consequence: D1 work uses `wrangler d1 execute ka-songs --file=...`, which resolves the database by name and needs no local config, and the Pages **binding is added in the dashboard by Alex**.
- **Testing here is integration-only, by necessity.** A unit-test runner for `functions/` would mean a dev dependency at the repo root, which the constraint above forbids. Verification is therefore live HTTP plus D1 queries, stated explicitly at each step rather than pretended otherwise.
- `export MSYS_NO_PATHCONV=1` before any curl whose body or query contains a bare `/path`, and use `--data-urlencode` per field. Git Bash rewrites POSIX-looking values and silently truncates on a raw `&`.
- The app is **in active use** (last generation 2026-08-11). Firestore rules stay open until cutover is verified, and a delta re-export catches anything written in the window.

## Confirmed values

| Thing | Value |
| --- | --- |
| Firestore project (leaving) | `daily-songs-89174`, collections `generations`, `bangers` |
| Committed export | `docs/exports/daily-songs-firestore-2026-08-13.json` (89 + 3 records, 485 songs) |
| New D1 database | `ka-songs` (id filled in at Task 1) |
| Pages binding name | `SONGS_DB` |
| Existing auth helper | `lib/auth-cookie.js` → `verifyAuthCookie(cookieHeader, env.COOKIE_SIGNING_SECRET)` |
| App path | `public/daily-songs-x7k2/app.js` |

## Why the client needs reordering, not just re-pointing

`init()` currently does `await loadBangerMap()` and `loadUsedTitles()` **before** checking authentication. That only works because Firestore is world-open. Once those reads are gated they will 401 on a fresh visit, and the failure is silent: `loadBangerMap` swallows errors, so star buttons render unstarred, and `loadUsedTitles` swallows errors, so `usedTitles` is empty and `/api/generate` loses the 485-title duplicate guard.

**So the data loads must move to after a confirmed session,** in two places: `init()` when already authenticated, and the `auth-form` submit handler's success branch.

## File structure

```
db/songs/
├── schema.sql                  two tables, run once via wrangler d1 execute
└── import-from-firestore.mjs   reads the committed export, emits import.sql
functions/api/songs/
├── generations.js              GET list, POST save
└── bangers.js                  GET list, POST add, DELETE remove
public/daily-songs-x7k2/app.js  modified: no Firebase, fetch helpers, init reorder
```

---

### Task 1: Create the database and schema

- [ ] **Step 1: Create it**

```bash
cd ~ && wrangler d1 create ka-songs
```

Record the id in this table and in `docs/superpowers/HANDOFF.md`.

- [ ] **Step 2: Write `db/songs/schema.sql`**

Mirrors the Firestore documents. Arrays stay JSON text because SQL never looks inside them. `bangers.title` is UNIQUE because the client keys its `bangerMap` by title and the export confirmed zero duplicates, so this makes an existing assumption enforced rather than hoped for.

```sql
CREATE TABLE generations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  date          TEXT NOT NULL,
  lane          TEXT NOT NULL DEFAULT '',
  generated_at  TEXT NOT NULL,
  songs_json    TEXT NOT NULL DEFAULT '[]',
  firestore_id  TEXT
);
CREATE INDEX idx_generations_recent ON generations(generated_at DESC);

CREATE TABLE bangers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL UNIQUE,
  prompt        TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  tags_json     TEXT NOT NULL DEFAULT '[]',
  lane          TEXT NOT NULL DEFAULT '',
  date          TEXT NOT NULL DEFAULT '',
  marked_at     TEXT NOT NULL,
  firestore_id  TEXT
);
CREATE INDEX idx_bangers_recent ON bangers(marked_at DESC);
```

`firestore_id` is kept so the delta re-export in Task 6 can tell new records from already-imported ones without guessing.

- [ ] **Step 3: Apply and verify**

```bash
cd "D:/K & A Performance Site" && wrangler d1 execute ka-songs --remote --file=db/songs/schema.sql
cd "D:/K & A Performance Site" && wrangler d1 execute ka-songs --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

Expected: `generations`, `bangers`.

---

### Task 2: Import the exported data

- [ ] **Step 1: Write `db/songs/import-from-firestore.mjs`**

Reads the committed export and emits SQL. Requirements: escape single quotes by doubling; write `songs` and `tags` back as compact JSON; carry `firestoreId` into `firestore_id`; emit `INSERT OR IGNORE` so re-running is safe and the delta import in Task 6 reuses the same script unchanged.

- [ ] **Step 2: Generate and apply**

If `wrangler d1 execute --file` rejects the size, split into chunks of 25 statements and apply in sequence. Report the chunking rather than silently truncating.

- [ ] **Step 3: Verify counts and integrity**

```bash
cd "D:/K & A Performance Site" && wrangler d1 execute ka-songs --remote --command "SELECT (SELECT COUNT(*) FROM generations) AS gens, (SELECT COUNT(*) FROM bangers) AS bangers, (SELECT SUM(json_array_length(songs_json)) FROM generations) AS songs"
```

Expected exactly: `gens 89`, `bangers 3`, `songs 485`. A song total that differs means JSON was mangled in escaping, which is the one failure mode of this step.

---

### Task 3: The two endpoints

Both gated. Both return JSON. Shapes are the contract the client in Task 4 depends on.

**`functions/api/songs/generations.js`**

- `GET` → `{ entries: [{ id, date, lane, generatedAt, songs }] }`, newest first. `songs` is parsed from `songs_json`, so the client sees the same shape Firestore gave it.
- `POST` body `{ lane, songs }` → inserts with `date` = today and `generated_at` = now ISO → `{ id }`.

**`functions/api/songs/bangers.js`**

- `GET` → `{ bangers: [{ id, title, prompt, description, tags, lane, date, markedAt }] }`, newest first.
- `POST` body `{ title, prompt, description, tags, lane, date }` → `{ id }`. Uses `INSERT ... ON CONFLICT(title) DO UPDATE` then returns the row id, so double-clicking the star cannot 500 on the UNIQUE constraint.
- `DELETE` with `?id=N` → `{ ok: true }`.

Every handler returns **401** without a valid auth cookie, before touching D1.

- [ ] **Step 1: Write both files**
- [ ] **Step 2: Verify unauthenticated access is refused**

```bash
for p in /api/songs/generations /api/songs/bangers; do curl -s -o /dev/null -w "%{http_code} $p\n" "https://ka-performancefl.com$p"; done
```

Expected: `401` for both. Run again after deploy in Task 5.

---

### Task 4: Refactor the client

- [ ] **Step 1: Remove the Firebase imports and config block** (lines 1-21), and the `Timestamp` usage.
- [ ] **Step 2: Replace the five data functions** with fetch calls to the Task 3 contracts: `loadBangerMap`, `saveGeneration`, `fetchHistory`, `fetchBangers`, plus the `deleteDoc`/`addDoc` calls inside `toggleBanger` and `removeBanger`.
- [ ] **Step 3: Reorder `init()`** so authentication is checked first and the gated loads happen only when authenticated. Add the same loads to the `auth-form` success branch, awaited before `showView('generator')`.
- [ ] **Step 4: Confirm no Firebase references remain**

```bash
grep -cE "firebase|firestore|Timestamp" public/daily-songs-x7k2/app.js
```

Expected: `0`.

---

### Task 5: Alex's binding, then deploy and verify

- [ ] **Step 1: ALEX** — Workers & Pages → **kandadesigners** → Settings → Bindings → Add → D1 database → variable name **`SONGS_DB`**, database **`ka-songs`**. **Add it to Production AND Preview.** Production-only is the documented trap that made the Google reviews env silently empty in preview.
- [ ] **Step 2: Deploy** by pushing to `main`, which triggers the Cloudflare build. Confirm the site still serves 200 first, since this touches `public/` and `functions/` on the live site.
- [ ] **Step 3: Verify live**, logged in: history list populates with 89 entries, bangers list shows the three known titles (`Cloud Turnstile`, `Annual Report`, `Stakeholder`), starring and unstarring a song persists across reload, and a generation saves.
- [ ] **Step 4: Verify the gate** with the Task 3 curl loop: both endpoints `401` unauthenticated.

---

### Task 6: Delta import, then retire Firebase

- [ ] **Step 1: Re-export Firestore** to `docs/exports/daily-songs-firestore-<date>-delta.json` using the same script.
- [ ] **Step 2: Diff the counts.** If either collection grew since 2026-08-13, re-run the Task 2 import against the new export. `INSERT OR IGNORE` plus `firestore_id` means already-imported rows are skipped.
- [ ] **Step 3: ALEX** — Firebase console → `daily-songs-89174` → Firestore → Rules → `allow read, write: if false`. Confirm the app still works (it no longer touches Firestore). Then delete the project when comfortable.
- [ ] **Step 4: Update the handoff**: the `ka-songs` database and its binding, that daily-songs is now on D1 and gated, and that `public/internal/tracker.html` remains as a dead shell by Alex's decision.

## Out of scope, deliberately

- `public/internal/tracker.html` stays in place: Alex's explicit decision. Its Firebase (`team-tracker-bad55`) already denies all unauthenticated access and the page carries no auth SDK, so it is a non-functional shell rather than a leak. The only real residual risk is password reuse of the string in View Source.
- No change to `/api/generate`, `/api/remix`, `/api/remix-bangers`, which already work and are already gated.
