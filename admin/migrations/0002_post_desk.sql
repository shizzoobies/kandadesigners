-- 0002: the Post Desk. Holds social posts, Stories and asks waiting on Alex,
-- plus his decisions and Story ticks, until they are published (then purged).
-- Media lives in the private R2 bucket ka-social-desk, not here.

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
