-- 0002: the coaching module. The 90-Day AI Launch delivery cockpit plus the
-- member-facing portal's data. Same conventions as 0001: TEXT dates
-- (YYYY-MM-DD), ISO-8601 UTC timestamps, CHECK enums, no PRAGMAs.

-- One row per coaching enrollment, linked to a client. The 12-week arc's
-- milestones are fixed columns rather than a generic checklist table: the
-- arc is the product (quick win, main workflow, the member's own build,
-- handoff) and fixed columns keep the dashboard rules one query each.
-- state_of_play is the one-page per-member note the business plan names as
-- the antidote to shallow attention at roster scale; it lives here, not in
-- notes, because it is a living document that gets replaced, not a log.
CREATE TABLE members (
  id INTEGER PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('launch', 'launch_site', 'core', 'advisory')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'ended')),
  started_on TEXT NOT NULL,
  state_of_play TEXT NOT NULL DEFAULT '',
  state_updated_at TEXT,
  quick_win TEXT NOT NULL DEFAULT '',
  quick_win_on TEXT,
  main_workflow TEXT NOT NULL DEFAULT '',
  workflow_shipped_on TEXT,
  own_build TEXT NOT NULL DEFAULT '',
  own_build_on TEXT,
  handoff_sent_on TEXT,
  week10_offered_on TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_members_client ON members(client_id);
CREATE INDEX idx_members_status ON members(status);

-- The weekly working sessions: the delivery log. week_no is 1-12 for Launch
-- arcs and NULL for membership calls, where weeks stop meaning anything.
CREATE TABLE coaching_sessions (
  id INTEGER PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  held_on TEXT NOT NULL,
  week_no INTEGER,
  summary TEXT NOT NULL DEFAULT '',
  next_plan TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_sessions_member ON coaching_sessions(member_id, held_on);

-- What the member sees in their portal: session recordings, resources,
-- homework. Separate from client_links on purpose; those are internal
-- bookkeeping, these are member-facing and member-scoped.
CREATE TABLE member_resources (
  id INTEGER PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'resource' CHECK (kind IN ('recording', 'resource', 'homework')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_resources_member ON member_resources(member_id, sort_order, created_at);
