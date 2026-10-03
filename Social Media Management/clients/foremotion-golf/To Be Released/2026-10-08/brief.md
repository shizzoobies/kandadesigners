# Brief: The bar and lounge

Slot: Thu 2026-10-08, 10:30 AM Eastern. Facebook and Instagram REEL, 1080x1920, 24.0 s, 30 fps. Music muxed (`music-fmg-1008-r`).
Version: v3 (2026-10-02 late night, Alex's structure): one continuous take of owner Justin Myrick, one soft dissolve into one continuous 3D concept glide along the bar and lounge, then the end card. No cutting back. v1 (with Hannah's still bar render) and v2 (the intercut) are kept as `source/reel-silent-v1.mp4`, `source/reel-silent-v2.mp4` and `media/reel-v2.mp4`.
Pillar: the experience (phase 3). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Thu Oct 8", lead.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Owner Justin Myrick at the real front counter where the bar goes; the shot dissolves into the interactive 3D venue concept, gliding along the cans-only bar past the bartender and a guest and turning into the front lounge. The plain facts: a bar and lounge, canned beer and seltzers, opening early 2027 at 1518 Park Ave in Orange Park. One ask: join the Founders List.

## Hook
"The bar and lounge." Caption line 1. On screen the reel opens on "Owner Justin Myrick walks the space."

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-08`. Instagram says link in bio; hashtags under `## First comment`. The reel's last 3 seconds are a "Join the Founders List" card with the URL.

## The cut
Every frame: a deep forest header with the stacked `Secondary` logo top center, and a deep forest foot strip with foremotiongolf.com. Each text beat sits in a full-width deep forest band (lime top rule) in Oswald Bold.

| Reel time | Source | What it shows | On screen |
|---|---|---|---|
| 0.0 to 5.3 | Walkthrough 1, 0:00.00 to 0:05.30, one continuous take | Real: Justin at the front counter where the bar goes, gesturing across it | "Owner Justin Myrick walks the space." |
| 4.3 to 5.3 | dissolve, 1.0 s crossfade | Justin fades into the 3D concept | the Justin beat holds; "Concept" tab on from 4.3 |
| 4.3 to 21.0 | 3D concept, `v3-bar-glide.mp4` 0.0 to 16.7 s, one continuous move, 1.1x crop | Concept: from the back end of the cans-only bar, a glide forward along the stools and stone counter past the bartender and a guest, then a turn into the front lounge (sofa and coffee table) | 5.3 to 12.5: "Canned beer and seltzers."; 12.5 to 21.0: "The bar and lounge." |
| 21.0 to 24.0 | end card | Deep forest card | "Join the Founders List." "Opening early 2027 in Orange Park, FL." |

The two 3D beats run in this order so each sits on what it names: "Canned beer and seltzers." over the bar, "The bar and lounge." over the turn into the lounge.
The "Concept" tab (cream Oswald on deep forest, top left under the header) is on every frame where the 3D shows, from the first frame of the dissolve to the end card, and on no frame of Justin alone.
Burned-in captions in the take (v1's frame-checked window): at about 70% of the height, under the beat band (also through the dissolve); the few near the top sit under the header.
The 3D glide keeps the bar's TVs mostly under the header: the crop drops the top 250 px, and they show generic game images with no text. The concept's two wall signs ("Cold cans / Good company" and its Fore Motion Golf name sign) pass under the header too. The camera stays on the room side of the bar, so no sign is ever seen from behind (mirrored).
Thumbnail: `media/reel-cover.jpg`, the frame at 2.0 s (Justin, real footage, not a render).

Justin footage progression across the four reels (no second is used twice):
- 10/4 Walkthrough 2, 0:31.75 to 0:37.75 (the walk in)
- 10/6 Walkthrough 2, 0:44.30 to 0:50.30 (further into the bay room)
- 10/8 Walkthrough 1, 0:00.00 to 0:05.30 (at the bar wall, this reel)
- 10/10 Walkthrough 1, 0:37.20 to 0:42.20 (walking the counter past the bar area, the latest clean stretch)
3D progression: 10/4 overview pushing toward the bays, 10/6 through the bays (ends at the back bay), 10/8 the bar and lounge (this reel, starting at the back end of the bar), 10/10 the site's own Tour.

Cut, not used: all of Hannah's renders (bar, TV with a size claim, coolers with a maker's logo, putting, pro shop and merchandise with Nike, PING, Titleist and other brands, the repair bench with the old concept logo), and the merchandise, repairs and fitting talk. Nothing on screen says "thirty-foot", "repairs" or "watch parties".

## Sources and truth
- A bar and lounge, canned beer and seltzers, four TrackMan bays with up to six players each, 1518 Park Ave (the former DMV), Orange Park, opening early 2027: content-facts and the plan.
- The finished bar and lounge are shown only as a concept, labeled on screen and in the caption: the interactive 3D venue concept on foremotiongolf.com (foremotiongolf.com/golf-3d/v2/), captured 2026-10-02.
- Justin Myrick is the owner and the man on camera; Alex asked for him to be named (2026-10-02 night).
- Never said: the bar's length, equipment repairs, watch parties, TV sizes, retail or merchandise, an opening month, prices, membership names, counts of Founders, the Founders Cup.

## AI
No AI voice or AI visuals. The 3D move is a capture of the venue concept model, not AI generated, labeled "Concept" on screen and in the caption. Music: `music-fmg-1008-r`, muxed 2026-10-02 late night: video copied from `source/reel-silent.mp4`, track trimmed to length with a 1.5 s fade-out, two-pass loudnorm to -14 LUFS (linear), alimiter 0.7, AAC 192k 48 kHz (reading -14.75 LUFS integrated, -2.1 dBTP; the 0.7 limiter takes the last 0.75 LU). Mux script: `D:/kap-reel/out/fmg-3d/tools/mux.mjs`.

## Build
`node source/build.mjs` (from `source/`) renders the overlays (`source/overlays.html` to `source/overlays/*.png`) with Playwright, joins the Justin take and the 3D move with one 1.0 s dissolve, overlays the beats and the Concept tab by time, adds the end card, encodes with ffmpeg into `source/reel-silent.mp4` (silent, `-an`), grabs `media/reel-cover.jpg` and writes `source/frames-contact-sheet.jpg`. `source/contrast.json`: lowest pair 5.45:1, all at or above 4.5:1. The 3D move is captured by `D:/kap-reel/out/fmg-3d/tools/capture3.mjs` (path in `tools/moves.mjs`). Fonts: Oswald Bold for beats and the Concept tab; Bahnschrift for the URL, standing in for Barlow. The source video stays where it is and is read only.

## Questions for Alex
- Want a specific Instagram sound on this reel? Write "Sound: title by artist" in a note here and we will set it before it posts. Sounds come from the Instagram library this account can use.
