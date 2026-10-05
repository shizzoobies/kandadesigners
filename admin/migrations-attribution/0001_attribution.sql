-- 0001: social analytics (attribution Layer 1). ka-attribution is its own
-- database; the admin and ka-analytics-sync both bind it as ATTRIBUTION_DB.
-- Every number here is Metricool's, never mixed with K&A's own counts.
-- Layer 2's ledger tables come later in their own migration.

-- Sites with a Metricool brand, kept in step with ka-sites.sites by the sync.
-- networks: the networks Metricool has connected, comma separated, from the
-- last run's /admin/simpleProfiles.
CREATE TABLE sites_map (
  site_slug TEXT PRIMARY KEY,
  metricool_brand_id TEXT NOT NULL,
  timezone TEXT NOT NULL,
  networks TEXT,
  connected_on TEXT,
  created_at TEXT NOT NULL
);

-- One row per day folder and network the pipeline scheduled (analytics push).
CREATE TABLE publications (
  site_slug TEXT NOT NULL,
  campaign_id TEXT NOT NULL,      -- the day folder name, e.g. 2026-10-05-6
  network TEXT NOT NULL,
  metricool_id TEXT NOT NULL,
  kind TEXT NOT NULL,             -- reel, carousel, post, linkedin, youtube, native
  pillar TEXT,
  title TEXT,
  scheduled_at TEXT,              -- ISO with offset, the folder's local time
  PRIMARY KEY (site_slug, campaign_id, network)
);
CREATE INDEX publications_metricool ON publications (site_slug, network, metricool_id);

-- Every post Metricool reports, pipeline-made or native.
CREATE TABLE posts (
  site_slug TEXT NOT NULL,
  network TEXT NOT NULL,
  native_id TEXT NOT NULL,
  metricool_id TEXT,
  campaign_id TEXT,               -- NULL for a native post
  type TEXT,
  url TEXT,
  published_at TEXT,              -- UTC ISO
  title TEXT,                     -- first line only, 120 characters at most
  PRIMARY KEY (site_slug, network, native_id)
);
CREATE INDEX posts_published ON posts (site_slug, published_at);

-- One snapshot per post per night; a re-run the same day replaces it.
CREATE TABLE post_metrics (
  site_slug TEXT NOT NULL,
  network TEXT NOT NULL,
  native_id TEXT NOT NULL,
  as_of TEXT NOT NULL,            -- YYYY-MM-DD in the site's timezone
  reach INTEGER,
  impressions INTEGER,
  views INTEGER,
  interactions INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  saves INTEGER,
  clicks INTEGER,
  watch_seconds REAL,
  engagement REAL,
  PRIMARY KEY (site_slug, network, native_id, as_of)
);

CREATE TABLE account_daily (
  site_slug TEXT NOT NULL,
  network TEXT NOT NULL,
  day TEXT NOT NULL,
  followers INTEGER,
  followers_delta INTEGER,
  reach INTEGER,
  impressions INTEGER,
  views INTEGER,
  interactions INTEGER,
  PRIMARY KEY (site_slug, network, day)
);

-- errors: NULL, or a JSON object keyed by network, 'site' or 'scheduler'.
CREATE TABLE sync_runs (
  id INTEGER PRIMARY KEY,
  site_slug TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  trigger TEXT NOT NULL,          -- 'cron' | 'manual'
  ok INTEGER,
  posts_seen INTEGER NOT NULL DEFAULT 0,
  metrics_written INTEGER NOT NULL DEFAULT 0,
  errors TEXT
);
CREATE INDEX sync_runs_site ON sync_runs (site_slug, started_at DESC);
