-- daily-songs, moved off Google Firestore onto Cloudflare D1 (2026-08-13).
-- Mirrors the two Firestore collections faithfully. Applied with:
--   wrangler d1 execute ka-songs --remote --file=db/songs/schema.sql
-- There is no wrangler.toml at the repo root on purpose: the site's Pages
-- project is dashboard-configured, and adding one would change how Cloudflare
-- builds a live site. So this is applied by database name, not via bindings.
--
-- Arrays (a generation's songs, a banger's tags) stay as JSON text because SQL
-- never needs to look inside them. firestore_id is retained so a later delta
-- import can distinguish new records from already-imported ones.

CREATE TABLE generations (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  date         TEXT NOT NULL,
  lane         TEXT NOT NULL DEFAULT '',
  generated_at TEXT NOT NULL,
  songs_json   TEXT NOT NULL DEFAULT '[]',
  firestore_id TEXT
);
CREATE INDEX idx_generations_recent ON generations(generated_at DESC);
CREATE UNIQUE INDEX idx_generations_firestore ON generations(firestore_id);

-- title is UNIQUE because the client keys its bangerMap by title and the
-- 2026-08-13 export confirmed zero duplicates. This makes an assumption the
-- client already relied on actually enforced.
--
-- `tags` is a plain comma-separated STRING, not a JSON array. Verified against
-- all 485 exported songs and all 3 bangers. The client does tags.split(',') in
-- buildTagsField, so storing JSON here would hand it a quoted string and render
-- a stray double quote on the first and last pill.
CREATE TABLE bangers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL UNIQUE,
  prompt       TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  tags         TEXT NOT NULL DEFAULT '',
  lane         TEXT NOT NULL DEFAULT '',
  date         TEXT NOT NULL DEFAULT '',
  marked_at    TEXT NOT NULL,
  firestore_id TEXT
);
CREATE INDEX idx_bangers_recent ON bangers(marked_at DESC);
