-- 0001: the sites dashboard. A fresh database (ka-sites); the old ka-admin
-- database is an archive and is not touched by this app.

CREATE TABLE people (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TEXT NOT NULL
);

CREATE TABLE sites (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  live_url TEXT NOT NULL,
  logo_key TEXT,
  favicon_key TEXT,
  repo TEXT,
  local_path TEXT,
  hosting TEXT NOT NULL DEFAULT 'other',
  deploy_command TEXT,
  maintainer_id INTEGER REFERENCES people(id),
  project_status TEXT NOT NULL DEFAULT 'live',
  status_note TEXT NOT NULL DEFAULT '',
  a11y_audited_on TEXT,
  a11y_open_issues INTEGER,
  a11y_statement_url TEXT,
  domain TEXT,
  domain_expires_on TEXT,
  cert_expires_on TEXT,
  github_synced_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE checks (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  checked_at TEXT NOT NULL,
  ok INTEGER NOT NULL,
  http_status INTEGER,
  ms INTEGER,
  error TEXT
);
CREATE INDEX checks_site_time ON checks (site_id, checked_at DESC);

CREATE TABLE work_items (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  text TEXT NOT NULL,
  url TEXT,
  github_key TEXT,
  done_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (site_id, github_key)
);

CREATE TABLE log_entries (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  entry_date TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE alert_state (
  site_id INTEGER PRIMARY KEY REFERENCES sites(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  since TEXT NOT NULL,
  last_alert_level TEXT,
  last_alert_at TEXT
);
