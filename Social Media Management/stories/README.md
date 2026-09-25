# Stories, week of Sept 28

One Story per day, 1080x1920 PNG, posted the same day as that day's reel on
Instagram and Facebook. Instagram caption links do not click for business
accounts; a link sticker in a Story does.

## How to post

1. Upload the day's PNG as a Story.
2. Add a Link sticker. Paste the sticker URL below, set the sticker text below.
3. Drag the sticker over the dashed box marked "link sticker here" and size it
   to cover the box (about 700x220 in the image, lower third, centered).
4. Post. For Facebook, use the same image and URL (swap `utm_source=instagram`
   to `utm_source=facebook` if you want Facebook tracked separately).

The top 250 px and bottom 340 px carry no text, since the app UI covers them.

## Per day

| Date | Image | Sticker text | Sticker URL |
|---|---|---|---|
| Mon 2026-09-28 | `2026-09-28-story.png` | See how we do local search | https://ka-performancefl.com/?utm_source=instagram&utm_medium=story&utm_campaign=2026-09-28 |
| Tue 2026-09-29 | `2026-09-29-story.png` | Check your colors | https://ka-performancefl.com/?utm_source=instagram&utm_medium=story&utm_campaign=2026-09-29 |
| Wed 2026-09-30 | `2026-09-30-story.png` | See the sample courses | https://ka-performancefl.com/training/?utm_source=instagram&utm_medium=story&utm_campaign=2026-09-30 |
| Thu 2026-10-01 | `2026-10-01-story.png` | See the 90-Day AI Launch | https://ka-performancefl.com/ai-launch/?utm_source=instagram&utm_medium=story&utm_campaign=2026-10-01 |
| Fri 2026-10-02 | `2026-10-02-story.png` | See the site | https://ka-performancefl.com/?utm_source=instagram&utm_medium=story&utm_campaign=2026-10-02 |

The / and /training/ URLs returned 200 on 2026-09-25. Thu 10-01 moved from the free AI lessons page to the paid 90-Day AI Launch (/ai-launch/) on 2026-09-25 at Alex's direction.

Fri 10-02 is tentative like its reel: it goes out only when the Thrillers
domain is live.

## Rebuild

Each story uses one real frame from `To Be Released/<date>/media/reel-vertical.mp4`
(crop and time set in `build.mjs`). If a reel is re-rendered, rebuild:

```
node "D:\K & A Performance Site\Social Media Management\stories\build.mjs"
```

Add `--only 2026-10-01` to rebuild one day only. Add `--guides` to also write `frames/<date>-story-guides.png` with the app UI
zones shaded red. `contact-sheet.png` shows all five side by side.
If a reel's layout changes, check the crop box for that day in `build.mjs`.
