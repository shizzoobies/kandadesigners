# Brief: Follow the build

Slot: Sun 2026-10-04, 12:00 PM Eastern. Facebook and Instagram REEL, 1080x1920, 20.0 s, 30 fps. Music muxed (`music-fmg-1004-r`).
Version: v4 (2026-10-03): the v3 structure (one continuous take of owner Justin Myrick, one dissolve into one continuous 3D concept move, then the end card; no cutting back) with a smoothed join: the dissolve is 2.0 s and eased (smoothstep), the Concept tab eases in over 0.6 s from the first frame of the dissolve, the lines crossfade between beats over 0.6 s while the band stays constant, the end card eases in over 0.6 s, and the real take is trimmed after decode at 60 fps and decimated by frame index (every second frame), so the take keeps an even cadence into the dissolve. Earlier versions: `source/reel-silent-v1.mp4` (real footage only), `-v2.mp4` (the intercut), `-v3.mp4` (one dissolve, 1.0 s, linear), with `media/reel-v2.mp4` and `media/reel-v3.mp4`.
Pillar: something new is coming (phase 1). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Sun Oct 4", reel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Owner Justin Myrick walking into the empty building as it is today, along the long counter wall where the four bays go; the shot dissolves into the interactive 3D venue concept, which starts high over the whole plan and pushes slowly down toward the bays. One ask: follow the build on the Founders List.

## Hook
"Four bays go here." Caption line 1. On screen the reel opens on "Owner Justin Myrick walks the space."

## Call to action
Join the Founders List at foremotiongolf.com, the 3 s end card. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-04`. Instagram says link in bio; hashtags under `## First comment`.

## The cut

| Reel time | Source | What it shows | On screen (kicker / line) |
|---|---|---|---|
| 0.0 to 5.0 | Walkthrough 2, 0:31.617 to 0:36.617, one continuous take | Real: Justin walks into the long room where the bays go, arm out along the counter wall | "1518 Park Ave, Orange Park, FL" / "Owner Justin Myrick walks the space." |
| 3.0 to 5.0 | dissolve, 2.0 s, eased (smoothstep) | Justin eases into the 3D concept | the Justin line holds; the "Concept" tab eases in 3.0 to 3.6 |
| 3.0 to 17.0 | 3D concept, `v3-overview-to-bays.mp4` 0.0 to 14.0 s (the v3 path, recaptured 2026-10-03 at 14 s), one continuous move | Concept: from the high roof-cutaway overview of the whole venue, a slow push down toward the four bays, ending above the putting green looking into a bay with a golfer on the tee mat | the lines crossfade 4.7 to 5.3 into "The 3D venue concept" / "The space, as planned." |
| 16.4 to 20.0 | end card, eased in 16.4 to 17.0 | Deep forest card | logo, "Join the Founders List.", "Follow the build. Opening early 2027.", foremotiongolf.com |

Every frame: the stacked `Secondary` logo top center on a deep forest tab and foremotiongolf.com at the foot; on Justin and the 3D, a deep forest panel over the lower 31% of the frame (from y 1320, lime top rule) carries the line. The "Concept" tab (cream Oswald on deep forest, top left) eases in from the first frame of the dissolve (3.0 s) and stays until the end card covers it; it is on no frame of Justin alone.
Cover: `media/reel-cover.jpg`, the frame at 2.5 s (Justin on the walk in, real footage, not a render).

Justin footage progression across the four reels (no second is used twice; each take checked frame by frame for source hitches at 60 fps):
- 10/4 Walkthrough 2, 0:31.617 to 0:36.617 (the walk in; ends one frame before a hitch in Hannah's master at 0:36.62, a repeated frame then a jump, which read as the jump at 4.9 s in v3)
- 10/6 Walkthrough 2, 0:44.30 to 0:51.30 (further into the bay room)
- 10/8 Walkthrough 1, 0:00.00 to 0:06.30 (at the bar wall)
- 10/10 Walkthrough 1, 0:37.20 to 0:43.20 (walking the counter past the bar area, the latest clean stretch; a whip blur starts at 0:43.7)
3D progression: 10/4 overview pushing toward the bays (this reel), 10/6 starts where this move ends and goes through the bays, 10/8 the bar and lounge, 10/10 the site's own Tour.

What was left out of the walkthrough, and why:
- The panel covers Hannah's burned-in word captions in the take (they sit between 74% and 88% of the frame height; the take sits inside the earlier builders' frame-checked windows, 0:31.6 to 0:41.40), through the dissolve as well. They include a bay width and a length of bays in feet and named competitions, none of which are confirmed facts.
- Not used: the opening minute of close shots (captions with an eight and thirty-two player count), Hannah's concept renders, the TV, watch party and facility rental stretches.

## Sources and truth
- Four TrackMan bays, up to six players per bay, 1518 Park Ave in Orange Park, the former DMV, opening early 2027: `content-facts.md` and the plan. "Being built out now" and "follow the build": content-facts ("Demo began September 2026 and the build is public: Follow us as we build FMG"). "Construction updates" go to the list: the splash page's list benefits.
- "Four bays go here." is the plan's own line for this cut, kept as the caption hook.
- Justin Myrick is the owner and the man on camera; Alex asked for him to be named (2026-10-02 night).
- The 3D move: the interactive 3D venue concept on foremotiongolf.com (foremotiongolf.com/golf-3d/v2/), captured 2026-10-02. It is a concept, labeled on screen and in the caption.
- Never said: an opening month or day, a count of Founders, any price, any membership name, the Founders Cup, the bar's length, repairs, watch parties, bay sizes.

## AI
No AI voice or AI visuals. The 3D move is a capture of the venue concept model, not AI generated. Music: `music-fmg-1004-r`, muxed 2026-10-02 late night: video copied from `source/reel-silent.mp4`, track trimmed to length with a 1.5 s fade-out, two-pass loudnorm to -14 LUFS (linear), alimiter 0.8, AAC 192k 48 kHz (reading -14.0 LUFS integrated, -1.9 dBTP). Mux script: `D:/kap-reel/out/fmg-3d/tools/mux.mjs`.

## Build
`node source/build.mjs` (from `source/`): renders the two beat overlays, the Concept tab and the end card (HTML to PNG with Playwright, in `source/overlays/`), joins the Justin take and the 3D move with one eased 2.0 s dissolve, overlays the constant chrome, the beat lines (eased 0.6 s crossfades) and the tab (eased in) as layers with eased alpha, eases into the end card and encodes with ffmpeg (H.264 High, CRF 19, yuv420p, 30 fps, faststart, no audio) to `source/reel-silent.mp4`, grabs `media/reel-cover.jpg`, and writes `source/frames-contact-sheet.jpg` (one frame a second) and `source/contrast.json` (lowest pair 5.45:1). The 3D move is captured by `D:/kap-reel/out/fmg-3d/tools/capture3.mjs` (headless Chromium, camera stepped at 30 fps; path in `tools/moves.mjs`); the compositing is `D:/kap-reel/out/fmg-3d/tools/compose.mjs`, shared by the four reels. The source video stays where it is and is read only. Fonts: Oswald Bold and Bahnschrift (Barlow is not installed on the build machine). All on-screen text keeps clear of the Reels button rail on the right.

## Questions for Alex
- Want a specific Instagram sound on this reel? Write "Sound: title by artist" in a note here and we will set it before it posts. Sounds come from the Instagram library this account can use.
