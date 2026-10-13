-- 0005: per-device Post Desk push preferences (additive). Quiet hours hold
-- new-item pushes and send one morning summary; the Stories reminder pings
-- once per Eastern day when today's Story isn't ticked. Times are HH:MM
-- Eastern, or NULL for off.

ALTER TABLE desk_push_subs ADD COLUMN quiet_start TEXT;
ALTER TABLE desk_push_subs ADD COLUMN quiet_end TEXT;
ALTER TABLE desk_push_subs ADD COLUMN held_since TEXT;      -- ISO; a push was held for quiet hours
ALTER TABLE desk_push_subs ADD COLUMN stories_at TEXT;
ALTER TABLE desk_push_subs ADD COLUMN stories_sent_on TEXT; -- YYYY-MM-DD, Eastern
