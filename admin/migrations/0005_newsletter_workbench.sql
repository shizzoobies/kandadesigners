-- 0005: the newsletter grows a lifecycle: draft first, sent forever after.
-- The 0004 table was insert-on-send only; nothing real has been sent yet,
-- so recreating it with the right shape costs nothing. body holds either
-- plain text (paragraphs on blank lines) or a JSON array of branded blocks
-- produced by the Opus polish pass; the renderer detects which.
DROP TABLE newsletters;
CREATE TABLE newsletters (
  id INTEGER PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  subject TEXT NOT NULL DEFAULT '',
  -- The jotted idea that seeded the draft, kept so a re-polish can start
  -- from intent rather than from its own previous output.
  notes TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  sent_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  sent_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sent_at TEXT
);
CREATE INDEX idx_newsletters_status ON newsletters(status, updated_at);
