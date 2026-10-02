-- 0003: client access to Post Desks. people.role is now 'owner' or 'client';
-- an owner sees everything and needs no rows here, a client sees only the
-- desks granted below. settings holds the Cloudflare Access group id and the
-- last sign-in list sync (access_group_id, access_sync_at, access_sync_error).

CREATE TABLE desk_access (
  person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  level TEXT NOT NULL,            -- 'approve' | 'view'
  granted_at TEXT NOT NULL,
  PRIMARY KEY (person_id, site_id)
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
