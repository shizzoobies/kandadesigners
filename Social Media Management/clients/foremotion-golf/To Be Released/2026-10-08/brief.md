# Brief: The bar and lounge

Slot: Thu 2026-10-08, 10:30 AM Eastern. Facebook and Instagram REEL, 1080x1920, 22.7 seconds, 30 fps. v2 (2026-10-02 night): rebuilt as an intercut of owner Justin Myrick in the real space with the 3D venue concept, which replaces v1's still bar render (Alex's call: all four reels, name him, Concept tab on every 3D shot). Music muxed (`music-fmg-1008-r`).
Pillar: the experience (phase 3). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Thu Oct 8", lead.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Owner Justin Myrick at the real counter where the bar goes, a labeled shot of the bar and lounge in the interactive 3D venue concept, and the plain facts: a bar and lounge, canned beer and seltzers, opening early 2027 at 1518 Park Ave in Orange Park. One ask: join the Founders List.

## Hook
"The bar and lounge." Caption line 1; on screen the reel opens on "The bar goes here." with "Owner Justin Myrick walks the space." under it.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-08`. Instagram says link in bio; hashtags under `## First comment`. The reel's last 3 seconds are a "Join the Founders List" card with the URL.

## The cut
An intercut, hard cuts, 22.7 s. Real footage from Hannah's Walkthrough 1 (bar, coolers, retail and repairs; 72 s, 2160x3840, 60 fps, captions burned in) and one shot of the interactive 3D venue concept on foremotiongolf.com, captured 2026-10-02 (`D:kap-reeloutmg-3dar-lounge.mp4`), all at 1080x1920, 30 fps, H.264. Every frame: a deep forest header with the stacked `Secondary` logo top center, and a deep forest foot strip with foremotiongolf.com. Each text beat sits in a full-width deep forest band (lime top rule) in Oswald Bold.

| Reel time | Source | What it shows | On screen |
|---|---|---|---|
| 0.0 to 5.3 | W1 0.00 to 5.30 | Real: Justin at the front counter where the bar goes, gesturing across it | "The bar goes here." "Owner Justin Myrick walks the space." |
| 5.3 to 8.8 | 3D concept, bar-lounge 2.0 to 5.5 s, 1.1x crop | Concept: a glide down the cans-only bar, stools, stone counter, a bartender and a guest. "Concept" tab top left (under the header) the whole shot | "The bar and lounge." |
| 8.8 to 14.7 | W1 13.15 to 19.05, 1.1x crop | Real: Justin along the counter | "Canned beer and seltzers." |
| 14.7 to 19.7 | W1 37.20 to 42.20, 1.1x crop | Real: Justin walking the counter past the bar area | "Opening early 2027." "1518 Park Ave, Orange Park, FL" |
| 19.7 to 22.7 | none | Deep forest end card | "Join the Founders List." "Opening early 2027 in Orange Park, FL." |

Burned-in captions (real stretches unchanged from v1, checked on contact sheets at 4 to 5 frames a second): on the first segment they sit at about 70% of the height and the beat band covers them. On the last two they sit in the top quarter; a slight crop lifts them under the header. The "Concept" tab is on every frame of the 3D shot and on no real frame.
v1 (with Hannah's still bar render, 21.7 s) is kept as `source/reel-silent-v1.mp4`.

Cut, not kept: Hannah's bar render (now replaced by the 3D concept shot), the TV render (a TV size claim), the cooler render (a cooler maker's logo and branded cans are readable), the putting render, every pro shop and merchandise render (Nike, PING, Titleist and other brands), the talk about merchandise, equipment repairs and fittings, and the repair render that shows the old concept logo. The 3D shot is cropped so the bar counter fills the window; its TVs show generic game images with no text, and its only wall words are the concept's own "Cold cans / Good company" sign, mostly under the header. Nothing on screen says "thirty-foot", "repairs" or "watch parties".

Thumbnail: `media/reel-cover.jpg`, the frame at 2.0 s ("The bar goes here.", Justin, real footage, not a render).

## Sources and truth
- A bar and lounge, canned beer and seltzers, four TrackMan bays with up to six players each, 1518 Park Ave (the former DMV), Orange Park, opening early 2027: content-facts and the plan.
- The finished bar is shown only as a concept, labeled on screen and in the caption: the interactive 3D venue concept on foremotiongolf.com, captured 2026-10-02 (foremotiongolf.com/golf-3d/v2/).
- Justin Myrick is the owner and the man on camera; Alex asked for him to be named (2026-10-02 night).
- Never said: the bar's length, equipment repairs, watch parties, TV sizes, retail or merchandise, an opening month, prices, membership names, counts of Founders, the Founders Cup.

## AI
No AI voice or AI visuals. The bar and lounge shot is a capture of the 3D venue concept model, not AI generated, labeled "Concept" on screen and in the caption. Music: `music-fmg-1008-r`, muxed 2026-10-02 night: video copied from `source/reel-silent.mp4`, track trimmed to length with a 1.5 s fade-out, two-pass loudnorm to -14 LUFS (linear), alimiter 0.7, AAC 192k 48 kHz (reading -14.8 LUFS integrated, -2.1 dBTP; the 0.7 limiter takes the last 0.8 LU). Mux script: `D:kap-reeloutmg-3d	oolsmux.mjs`.

## Build
`node source/build.mjs` (from `source/`) renders the overlays (`source/overlays.html` to `source/overlays/*.png`) with Playwright, cuts and composites the reel (the four real stretches and the 3D shot) with ffmpeg into `source/reel-silent.mp4` (silent, `-an`), and grabs `media/reel-cover.jpg`. The 3D clips are captured by `D:kap-reeloutmg-3d	oolscapture.mjs`. `source/contrast.json`: lowest pair 5.45:1, all at or above 4.5:1. Fonts: Oswald Bold for beats and the Concept tab; Bahnschrift for the sub line and URL, standing in for Barlow. The source video stays where it is and is read only.

## Questions for Alex
- Want a specific Instagram sound on this reel? Write "Sound: title by artist" in a note here and we will set it before it posts. Sounds come from the Instagram library this account can use.
