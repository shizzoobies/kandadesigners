-- 0004: the site's Metricool brand id, for social analytics (attribution
-- Layer 1). Digits only, NULL for a site with no brand. ka-analytics-sync
-- reads it and keeps ka-attribution's sites_map in step.
ALTER TABLE sites ADD COLUMN metricool_brand_id TEXT;
