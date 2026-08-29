-- 0006: course analytics. One row per chapter view or completion from the
-- remastered native course. token matches course_leads.unsubscribe_token
-- when the visitor came through the email gate, "member" for portal
-- members, "1" for cookies set before tokens rode along.
CREATE TABLE course_events (
  id INTEGER PRIMARY KEY,
  token TEXT NOT NULL DEFAULT '',
  chapter TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('view', 'done')),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_course_events_chapter ON course_events(chapter, event);
CREATE INDEX idx_course_events_token ON course_events(token, created_at);
