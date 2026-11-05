-- Suggested activity never enters approved/billable totals without review.
CREATE TABLE time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Removing a person revokes access without deleting history or reassigning it
  -- if SQLite later reuses that person's integer ID.
  user_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
  workstream TEXT NOT NULL CHECK(workstream IN ('aec-punch','aec-finance')),
  site_id INTEGER REFERENCES sites(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK(source IN ('manual','codex')),
  source_key TEXT NOT NULL,
  observed_start TEXT NOT NULL,
  observed_end TEXT NOT NULL CHECK(observed_end > observed_start),
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL CHECK(ended_at > started_at),
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','excluded')),
  billable INTEGER NOT NULL DEFAULT 0 CHECK(billable IN (0,1)),
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, source, source_key),
  CHECK(status = 'approved' OR billable = 0)
);
CREATE INDEX idx_time_owner_start ON time_entries(user_id, started_at);
CREATE TABLE time_entry_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL REFERENCES time_entries(id),
  revision INTEGER NOT NULL,
  snapshot TEXT NOT NULL,
  changed_at TEXT NOT NULL
);
-- Enforced in SQLite as well as the UI: concurrent approvals cannot double count.
CREATE TRIGGER time_overlap_insert BEFORE INSERT ON time_entries
WHEN NEW.status = 'approved' AND EXISTS (
 SELECT 1 FROM time_entries WHERE user_id = NEW.user_id AND status = 'approved'
 AND started_at < NEW.ended_at AND ended_at > NEW.started_at
) BEGIN SELECT RAISE(ABORT, 'time_overlap'); END;
CREATE TRIGGER time_overlap_update BEFORE UPDATE ON time_entries
WHEN NEW.status = 'approved' AND EXISTS (
 SELECT 1 FROM time_entries WHERE user_id = NEW.user_id AND status = 'approved' AND id != NEW.id
 AND started_at < NEW.ended_at AND ended_at > NEW.started_at
) BEGIN SELECT RAISE(ABORT, 'time_overlap'); END;
CREATE TRIGGER time_source_immutable BEFORE UPDATE ON time_entries
WHEN NEW.user_id != OLD.user_id OR NEW.source != OLD.source OR NEW.source_key != OLD.source_key
 OR NEW.observed_start != OLD.observed_start OR NEW.observed_end != OLD.observed_end
BEGIN SELECT RAISE(ABORT, 'time_source_immutable'); END;
CREATE TRIGGER time_history_insert AFTER INSERT ON time_entries BEGIN
 INSERT INTO time_entry_history(entry_id, revision, snapshot, changed_at)
 VALUES(NEW.id, NEW.revision, json_object('workstream',NEW.workstream,'site_id',NEW.site_id,
 'started_at',NEW.started_at,'ended_at',NEW.ended_at,'description',NEW.description,
 'status',NEW.status,'billable',NEW.billable), NEW.updated_at);
END;
CREATE TRIGGER time_history_update AFTER UPDATE ON time_entries BEGIN
 INSERT INTO time_entry_history(entry_id, revision, snapshot, changed_at)
 VALUES(NEW.id, NEW.revision, json_object('workstream',NEW.workstream,'site_id',NEW.site_id,
 'started_at',NEW.started_at,'ended_at',NEW.ended_at,'description',NEW.description,
 'status',NEW.status,'billable',NEW.billable), NEW.updated_at);
END;
