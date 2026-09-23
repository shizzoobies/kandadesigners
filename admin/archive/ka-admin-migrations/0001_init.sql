-- K & A admin, initial schema.
--
-- Conventions, enforced by these definitions rather than by convention alone:
--   * money is integer cents, columns named *_cents
--   * dates are TEXT 'YYYY-MM-DD' (sortable as strings)
--   * timestamps are ISO-8601 UTC TEXT
--   * "today" is computed in America/New_York by the application, never here
--
-- No PRAGMA statements: D1 manages foreign key enforcement itself and rejects
-- some pragmas in migrations. `clients` is created before `users` so the
-- users.client_id foreign key has no forward reference.

CREATE TABLE clients (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  company     TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('lead','active','past')),
  source      TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  archived_at TEXT
);
CREATE INDEX idx_clients_status ON clients(status, archived_at);

-- Access authenticates; this table authorises. client_id is the client-portal
-- growth path: a 'client' role user may only see rows for their own client.
CREATE TABLE users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL DEFAULT '',
  role         TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner','staff','client')),
  client_id    INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  active       INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at   TEXT NOT NULL,
  last_seen_at TEXT
);

CREATE TABLE client_links (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id  INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  url        TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'other'
             CHECK (kind IN ('live','staging','repo','drive','gbp','social','dashboard','other')),
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_links_client ON client_links(client_id, sort_order);

-- waiting_on is deliberately separate from status: "waiting on the client" is
-- not a lifecycle stage, and folding it in is how status enums rot into fifteen
-- values.
CREATE TABLE projects (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id          INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('quoted','active','on_hold','delivered','complete','cancelled')),
  waiting_on         TEXT CHECK (waiting_on IS NULL OR waiting_on IN ('us','client','artist')),
  total_quoted_cents INTEGER NOT NULL DEFAULT 0,
  started_on         TEXT,
  due_on             TEXT,
  delivered_on       TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL,
  archived_at        TEXT
);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status, archived_at);

-- status 'expected' is load-bearing: money known to be owed but not yet billed.
-- That is the leak this whole application exists to catch. external_url points
-- at the real invoice wherever it was generated, keeping this track-only.
CREATE TABLE invoices (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id    INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id   INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  ref          TEXT NOT NULL DEFAULT '',
  kind         TEXT NOT NULL DEFAULT 'other'
               CHECK (kind IN ('deposit','balance','retainer','other')),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  issued_on    TEXT,
  due_on       TEXT,
  paid_on      TEXT,
  status       TEXT NOT NULL DEFAULT 'expected'
               CHECK (status IN ('expected','sent','paid','void')),
  external_url TEXT NOT NULL DEFAULT '',
  notes        TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_invoices_status ON invoices(status, due_on);
CREATE INDEX idx_invoices_client ON invoices(client_id);

-- Capped at day 28 so a monthly charge cannot silently skip February.
CREATE TABLE retainers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id    INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  day_of_month INTEGER NOT NULL DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 28),
  active       INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  started_on   TEXT,
  ended_on     TEXT
);
CREATE INDEX idx_retainers_active ON retainers(active);

CREATE TABLE followups (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  detail     TEXT NOT NULL DEFAULT '',
  client_id  INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  due_on     TEXT,
  done_at    TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_followups_open ON followups(done_at, due_on);

-- entity_type NULL means a standalone note, so a scratch thought does not need
-- a home before it can be written down.
CREATE TABLE notes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type  TEXT CHECK (entity_type IS NULL OR entity_type IN ('client','project','invoice')),
  entity_id    INTEGER,
  body         TEXT NOT NULL,
  author_email TEXT NOT NULL DEFAULT '',
  pinned       INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0,1)),
  created_at   TEXT NOT NULL
);
CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id, created_at);

-- Records data brought in from elsewhere, so provenance is obvious later. The
-- first row will be the Firebase tracker import in Phase 2.
CREATE TABLE imports (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  source     TEXT NOT NULL,
  note       TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

-- Seed the one user. The email must match the Access identity exactly, and
-- identity.js lowercases before lookup, so store it lowercased.
INSERT INTO users (email, name, role, active, created_at)
VALUES ('alex@ka-performancefl.com', 'Alex Anderson', 'owner', 1, '2026-08-13T00:00:00.000Z');
