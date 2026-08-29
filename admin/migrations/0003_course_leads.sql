-- 0003: course leads. The free course is gated by an email, and this is the
-- list. Written by the PUBLIC site's Pages Function (/api/course-lead via an
-- ADMIN_DB binding on the kandadesigners Pages project), read by the admin's
-- coaching page. Upsert by email: the same person re-entering the funnel
-- bumps the counter and timestamp instead of duplicating the row.
CREATE TABLE course_leads (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'direct',
  times INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
CREATE INDEX idx_course_leads_created ON course_leads(created_at);
