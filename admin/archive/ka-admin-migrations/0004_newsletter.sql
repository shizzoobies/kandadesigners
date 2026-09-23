-- 0004: newsletter. Mirrors the Project Makeover admin's proven shape:
-- a per-lead unsubscribe token (the token IS the secret, no HMAC dance),
-- an unsubscribed_at flag the send query respects, and a history table so
-- "what did we send and when" is answerable from the database.

ALTER TABLE course_leads ADD COLUMN unsubscribe_token TEXT;
ALTER TABLE course_leads ADD COLUMN unsubscribed_at TEXT;

-- Backfill tokens for any lead captured before this migration.
UPDATE course_leads SET unsubscribe_token = lower(hex(randomblob(16)))
 WHERE unsubscribe_token IS NULL;

CREATE UNIQUE INDEX idx_course_leads_unsub ON course_leads(unsubscribe_token);

CREATE TABLE newsletters (
  id INTEGER PRIMARY KEY,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  sent_by TEXT NOT NULL DEFAULT '',
  sent_at TEXT NOT NULL
);
CREATE INDEX idx_newsletters_sent ON newsletters(sent_at);
