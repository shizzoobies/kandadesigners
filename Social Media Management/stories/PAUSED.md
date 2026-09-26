# Stories are paused (since 2026-09-26)

Alex paused the hand-posted Stories (link sticker, 10:35 AM weekdays) on
2026-09-26: no time to keep on top of them that week. He may add them back later.

While this file exists:
- `node tools/review.mjs` leaves every Story off the Post Desk (no approvals, no
  checklist rows); the Stories tab says they are paused.
- `SCHEDULE.md` and `README.md` stay as the record of what was planned. Nothing
  here is scheduled or expected.

Nothing Story-related was ever in Metricool, and no caption points to a Story,
so pausing changes no scheduled post.

To turn them back on: delete this file, update the dates in `SCHEDULE.md` and
`README.md` (and rebuild images with `build.mjs` for new days), run
`node tools/review.mjs`, and republish the Post Desk. The ten built images
(Sep 28 to Oct 9) are still here and in Google Drive, K & A Social > Stories.
