# Brief: The four Founding Memberships in motion

Slot: Thu 2026-10-15, 5:30 PM Eastern. Facebook and Instagram REEL, 1080x1920, 16.8 seconds, silent until the finisher adds the track.
Pillar: the reveal (phase 5), in its no-price form. The plan is `plans/2026-10-02-founders-funnel.md`, slot "Thu Oct 15"; the build brief is `plans/2026-10-02-founders-funnel-build-brief.md`, "Oct 15 and 16 (agent G), no-price form".
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
All four Founding Memberships one after another, each with its term, reserved bay time, hours a month and spots, ending on the Founders List. No prices, no sales date.

## Hook
"The four Founding Memberships." On each tier card as the label "The Founding Memberships · 1 of 4" (through 4 of 4) and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com: the last 3.6 seconds of the reel, Facebook line 2 and the closing line (`https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-15-2`). Instagram says link in bio; hashtags under `## First comment`. The Agreement line is the last body line of both captions.

## The cut
Five typographic frames on deep forest (#152F0F), each with the `Secondary` logo top center, the Agreement line and foremotiongolf.com, cut with 0.4 second crossfades. Each tier card holds 3.6 seconds (at least 2.8 seconds alone on screen); the Founders List frame holds the last 3.6 seconds.
1. Founding Practice: 6 months; 24 hours of reserved bay time; about 4 a month; 25 spots.
2. Founding Club: 6 months; 48 hours of reserved bay time; about 8 a month; 25 spots.
3. Founding Tour, "The premier individual membership": 6 months; 84 hours of reserved bay time; about 14 a month; 10 spots.
4. Founding Corporate Partner, "For local businesses": 12 months; 150 hours of reserved bay time; 5 partnerships.
5. "Join the Founders List." "First access to Founding Memberships." The URL in a logo green block.
Text sits clear of the Reels overlays: the URL is 330 px up from the bottom, the logo starts 150 px down. Thumbnail: `media/reel-cover.jpg`, the first card.

## Sources and truth
- Every number is from the build brief's tier facts (Justin's Sept 28 brief). Hours are reserved bay time, said on every card. Corporate has no per-month figure in the tier facts, so none is shown.
- "First access to Founding Memberships" is the first splash page list benefit (content-facts.md).
- Never said: any price, a sales date, a total count of Founders, "Best Value", Gold, Platinum, Diamond, Elite.

## AI
No AI voice or visuals. Music: finisher (`music-fmg-1015-r`). No narration.

## Build
`node source/build.mjs` (from `source/`): renders the five frames with Playwright to `source/png/frame-01.png` to `frame-05.png` (also `source/frames.html`, the trimmed logo and `source/contrast.json`, lowest pair 5.45:1), then cuts `media/reel.mp4` with ffmpeg (xfade, H.264 high, CRF 18, 30 fps, yuv420p, faststart, no audio track) and writes `media/reel-cover.jpg` from frame 1.
No-price form: when Justin confirms prices and the sales date, this day is rebuilt with prices by a later job.

## Questions for Alex
- Want a specific Instagram sound on this reel? Write "Sound: title by artist" in a note here and we will set it before it posts. Sounds come from the Instagram library this account can use.
