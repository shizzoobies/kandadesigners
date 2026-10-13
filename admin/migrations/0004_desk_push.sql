-- 0004: Post Desk push notifications. Subscriptions are per device (endpoint)
-- for a person who can write the desk; desk_push_sent tracks which waiting
-- items we have already announced, so a cron can announce once per wait.

CREATE TABLE desk_push_subs (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  label TEXT,
  created_at TEXT NOT NULL,
  last_ok_at TEXT,
  fail_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE desk_push_sent (
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  PRIMARY KEY (site_id, item_id)
);
