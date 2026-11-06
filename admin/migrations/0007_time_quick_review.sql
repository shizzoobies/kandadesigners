ALTER TABLE time_entries ADD COLUMN status_reason TEXT NOT NULL DEFAULT '';

DROP TRIGGER time_history_insert;
DROP TRIGGER time_history_update;
CREATE TRIGGER time_history_insert AFTER INSERT ON time_entries BEGIN
 INSERT INTO time_entry_history(entry_id, revision, snapshot, changed_at)
 VALUES(NEW.id, NEW.revision, json_object('workstream',NEW.workstream,'site_id',NEW.site_id,
 'started_at',NEW.started_at,'ended_at',NEW.ended_at,'description',NEW.description,
 'status',NEW.status,'status_reason',NEW.status_reason,'billable',NEW.billable), NEW.updated_at);
END;
CREATE TRIGGER time_history_update AFTER UPDATE ON time_entries BEGIN
 INSERT INTO time_entry_history(entry_id, revision, snapshot, changed_at)
 VALUES(NEW.id, NEW.revision, json_object('workstream',NEW.workstream,'site_id',NEW.site_id,
 'started_at',NEW.started_at,'ended_at',NEW.ended_at,'description',NEW.description,
 'status',NEW.status,'status_reason',NEW.status_reason,'billable',NEW.billable), NEW.updated_at);
END;

-- Integer milliseconds keep 14:59.999 below the threshold and exactly 15:00
-- reviewable. julianday subtraction can round an exact boundary down.
-- These guards also cover delivery by the previous Worker during rollout.
CREATE TRIGGER time_short_insert AFTER INSERT ON time_entries
WHEN NEW.status='pending' AND
 (unixepoch(NEW.ended_at)-unixepoch(NEW.started_at))*1000
 +CAST(substr(NEW.ended_at,21,3) AS INTEGER)-CAST(substr(NEW.started_at,21,3) AS INTEGER)<900000
BEGIN
 UPDATE time_entries SET status='excluded',billable=0,
 status_reason='Automatically skipped: under 15 minutes.',revision=revision+1 WHERE id=NEW.id;
END;
CREATE TRIGGER time_short_update AFTER UPDATE ON time_entries
WHEN NEW.status='pending' AND
 (unixepoch(NEW.ended_at)-unixepoch(NEW.started_at))*1000
 +CAST(substr(NEW.ended_at,21,3) AS INTEGER)-CAST(substr(NEW.started_at,21,3) AS INTEGER)<900000
BEGIN
 UPDATE time_entries SET status='excluded',billable=0,
 status_reason='Automatically skipped: under 15 minutes.',revision=revision+1 WHERE id=NEW.id;
END;
CREATE TRIGGER time_short_approve_insert BEFORE INSERT ON time_entries
WHEN NEW.status='approved' AND
 (unixepoch(NEW.ended_at)-unixepoch(NEW.started_at))*1000
 +CAST(substr(NEW.ended_at,21,3) AS INTEGER)-CAST(substr(NEW.started_at,21,3) AS INTEGER)<900000
BEGIN SELECT RAISE(ABORT,'time_under_minimum'); END;
CREATE TRIGGER time_short_approve_update BEFORE UPDATE ON time_entries
WHEN NEW.status='approved' AND (OLD.status!='approved' OR NEW.started_at!=OLD.started_at OR NEW.ended_at!=OLD.ended_at) AND
 (unixepoch(NEW.ended_at)-unixepoch(NEW.started_at))*1000
 +CAST(substr(NEW.ended_at,21,3) AS INTEGER)-CAST(substr(NEW.started_at,21,3) AS INTEGER)<900000
BEGIN SELECT RAISE(ABORT,'time_under_minimum'); END;

-- Only existing pending entries change. Original evidence, descriptions,
-- approved/billable records and prior history are preserved.
UPDATE time_entries SET status='excluded',billable=0,
 status_reason='Automatically skipped: under 15 minutes.',revision=revision+1,
 updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE status='pending' AND
 (unixepoch(ended_at)-unixepoch(started_at))*1000
 +CAST(substr(ended_at,21,3) AS INTEGER)-CAST(substr(started_at,21,3) AS INTEGER)<900000;
