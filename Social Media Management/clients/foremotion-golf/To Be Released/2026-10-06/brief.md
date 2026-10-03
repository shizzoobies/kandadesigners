# Brief: Compete, leagues and events

Slot: Tue 2026-10-06, 10:30 AM Eastern. Facebook and Instagram REEL, 1080x1920, 24.0 s, 30 fps. Music muxed (`music-fmg-1006-r`).
Version: v3 (2026-10-02 late night, Alex's structure): one continuous take of owner Justin Myrick, one soft dissolve into one continuous 3D concept move through the bays, then the end card. No cutting back. v1 (real footage only) and v2 (the intercut) are kept as `source/reel-silent-v1.mp4`, `source/reel-silent-v2.mp4` and `media/reel-v2.mp4`.
Pillar: our story (phase 2). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Tue Oct 6", reel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Owner Justin Myrick in the real, empty room where the bays go; the shot dissolves into the interactive 3D venue concept, which moves past all four bays: spectator counters, couches, tee mats and screens. Leagues and events are on the way, and the Founders List gets early access to them. One ask: join the Founders List.

## Hook
Caption line 1: "Compete. Leagues and events are coming to Fore Motion Golf." On screen the reel opens on "Owner Justin Myrick walks the space."

## Call to action
Join the Founders List at foremotiongolf.com. The last 3 seconds are a closing card with "Join the Founders List." and the URL. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-06`. Instagram says link in bio; hashtags under `## First comment`.

## The cut

| Reel time | Source | What it shows | On screen (head / sub) |
|---|---|---|---|
| 0.0 to 6.0 | Walkthrough 2, 0:44.30 to 0:50.30, one continuous take | Real: Justin standing in the long carpeted room where the bays go, gesturing around it | "Owner Justin Myrick walks the space." |
| 5.0 to 6.0 | dissolve, 1.0 s crossfade | Justin fades into the 3D concept | the Justin beat holds; "Concept" tab on from 5.0 |
| 5.0 to 21.0 | 3D concept, `v3-bays-tour.mp4` 0.0 to 16.0 s, one continuous move, 1.1x crop | Concept: starts where the 10/4 move ends (above the green, looking into the bays), eases down to the spectator counters and tracks past all four bays, front to back | 6.0 to 11.0: "The bays." / "The 3D venue concept, as planned."; 11.0 to 21.0: "Four bays." / "Leagues and events, four bays." |
| 21.0 to 24.0 | end card | Deep forest card | the logo, "Join the Founders List.", "Early access to launch events and leagues.", foremotiongolf.com in a logo green block |

Text beats in Oswald Bold, each at least 5 seconds, in a full-width deep forest band at the bottom (from y 1240). The stacked `Secondary` logo sits top center on a deep forest tab on every frame (not recolored, no glow, no shadow) and foremotiongolf.com sits at the foot of every frame. The "Concept" tab (cream Oswald on deep forest, top left) is on every frame where the 3D shows, from the first frame of the dissolve (5.0 s) to the end card, and on no frame of Justin alone.
Cover: `media/reel-cover.jpg`, the frame at 1.5 s (Justin, real footage, not a render).

Justin footage progression across the four reels (no second is used twice):
- 10/4 Walkthrough 2, 0:31.75 to 0:37.75 (the walk in)
- 10/6 Walkthrough 2, 0:44.30 to 0:50.30 (further into the bay room, this reel)
- 10/8 Walkthrough 1, 0:00.00 to 0:05.30 (at the bar wall)
- 10/10 Walkthrough 1, 0:37.20 to 0:42.20 (walking the counter past the bar area, the latest clean stretch)
3D progression: 10/4 overview pushing toward the bays, 10/6 through the bays (this reel, starting where 10/4 ends), 10/8 the bar and lounge, 10/10 the site's own Tour.

What was cut and why:
- Source 0 to 31.5: the bays talk. Its burned-in captions name hardware and player counts that are not confirmed facts ("Eight Players", "Thirty-two Players At A Time"), and it carries concept insets.
- Source 40.7 to 44.2: a whip pan and a concept render of the putting area. Source 51.4 to the end: Hannah's concept renders (bays with TVs, the bar with signage) and the watch parties and facility rental segment.
- The take sits inside v1's frame-checked window (0:44.3 to 0:51.3) and carries Hannah's word-by-word captions at 73 to 95% of the height (room dimensions and a list of planned competitions). The deep forest band covers that whole zone on every frame of the take and through the dissolve.

## Sources and truth
- Leagues and events, as seasons and single-day events, in the future tense: content-facts ("Leagues and competitions"), the splash page trio (Compete) and list benefit ("Early access to launch events & leagues").
- Four TrackMan bays, six players per bay, 1518 Park Ave, the former DMV, early 2027: content-facts.
- Justin Myrick is the owner and the man on camera; Alex asked for him to be named (2026-10-02 night).
- The 3D move: the interactive 3D venue concept on foremotiongolf.com (foremotiongolf.com/golf-3d/v2/), captured 2026-10-02. It is a concept, labeled on screen and in the caption.
- Never said: watch parties, any league name, day or start date, an opening month, prices, a count of Founders, anything about the Founders Cup, testimonials, member counts.

## AI
No AI voice or AI visuals. The 3D move is a capture of the venue concept model, not AI generated. Music: `music-fmg-1006-r`, muxed 2026-10-02 late night: video copied from `source/reel-silent.mp4`, track trimmed to length with a 1.5 s fade-out, two-pass loudnorm to -14 LUFS (linear), alimiter 0.8, AAC 192k 48 kHz (reading -14.0 LUFS integrated, -1.9 dBTP). Mux script: `D:/kap-reel/out/fmg-3d/tools/mux.mjs`.

## Build
`node source/build.mjs` (from `source/`): renders the three beat overlays, the Concept tab and the closing card from `source/overlays.html` to PNG with Playwright (`source/overlays/`), joins the Justin take and the 3D move with one 1.0 s dissolve, overlays the beats and the tab by time, adds the closing card and encodes with ffmpeg into `source/reel-silent.mp4` (silent), pulls `media/reel-cover.jpg` (1.5 s) and writes `source/frames-contact-sheet.jpg` (one frame a second) and `source/contrast.json` (lowest pair 5.45:1, all text on solid deep forest or logo green). The 3D move is captured by `D:/kap-reel/out/fmg-3d/tools/capture3.mjs` (path in `tools/moves.mjs`). Fonts: Oswald Bold and Bahnschrift (Barlow is not installed on the build machine).

## Questions for Alex
- Want a specific Instagram sound on this reel? Write "Sound: title by artist" in a note here and we will set it before it posts. Sounds come from the Instagram library this account can use.
