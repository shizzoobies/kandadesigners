-- 0007: app_state. A tiny key/value store for screens that hold one JSON blob
-- rather than a set of rows. The parked Launch Book is the only user: it was
-- written against a `window.storage` API that never existed in this app, so
-- every save threw. Rather than model its clients, payments and statements as
-- three tables for an artifact that is meant to be replaced, it stores its
-- whole book under one key and the real module can migrate it later.
--
-- Keys are whitelisted in src/pages/api/state.js, so this is not an open
-- staff-writable KV.
CREATE TABLE app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL DEFAULT ''
);
