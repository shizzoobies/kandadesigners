# Brief: The bar and lounge

Slot: Thu 2026-10-08, 10:30 AM Eastern. Facebook and Instagram REEL, 1080x1920, 21.7 seconds, silent master (the finisher adds the track).
Pillar: the experience (phase 3). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Thu Oct 8", lead.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
A look at the real space where the bar goes, a labeled concept of a finished bar, and the plain facts: a bar and lounge, canned beer and seltzers, opening early 2027 at 1518 Park Ave in Orange Park. One ask: join the Founders List.

## Hook
"The bar and lounge." Caption line 1; on screen the reel opens on "The bar goes here."

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-08`. Instagram says link in bio; hashtags under `## First comment`. The reel's last 3 seconds are a "Join the Founders List" card with the URL.

## The cut
From Hannah's Walkthrough 1 (bar, coolers, retail and repairs; 72 s, 2160x3840, 60 fps, captions burned in), downscaled to 1080x1920, 30 fps, H.264, no audio. Every frame: a deep forest header with the stacked `Secondary` logo top center, and a deep forest foot strip with foremotiongolf.com. Each text beat sits in a full-width deep forest band (lime top rule) in Oswald Bold.

| Reel time | Source | What it shows | On screen |
|---|---|---|---|
| 0.0 to 5.3 | 0.00 to 5.30 | Real: the front counter where the bar goes | "The bar goes here." |
| 5.3 to 7.8 | 8.45 to 9.95, at 0.6x, cropped | Concept render of a finished bar (bar top and stools) | "A bar and lounge." plus a "Concept" tab, top left |
| 7.8 to 13.7 | 13.15 to 19.05, 1.1x crop | Real: along the counter | "Canned beer and seltzers." |
| 13.7 to 18.7 | 37.20 to 42.20, 1.1x crop | Real: walking the counter past the bar area | "Opening early 2027." "1518 Park Ave, Orange Park, FL" |
| 18.7 to 21.7 | none | Deep forest end card | "Join the Founders List." "Opening early 2027 in Orange Park, FL." |

Burned-in captions: on the first two segments they sit at about 70% of the height and the beat band covers them (this hides the "About a thirty-foot" caption on the bar render). On the last two they sit in the top quarter; a slight crop lifts them under the header. Checked on contact sheets at 4 to 5 frames a second.

Cut, not kept: the TV render (a TV size claim), the cooler render (a cooler maker's logo and branded cans are readable), the putting render, every pro shop and merchandise render (Nike, PING, Titleist and other brands), the talk about merchandise, equipment repairs and fittings, and the repair render that shows the old concept logo. The bar render is cropped so its TVs and its "watch sports" wall sign stay out of frame. Nothing on screen says "thirty-foot", "repairs" or "watch parties". The person on camera is not named.

Thumbnail: `media/reel-cover.jpg`, the frame at 2.0 s ("The bar goes here.", real footage).

## Sources and truth
- A bar and lounge, canned beer and seltzers, four TrackMan bays with up to six players each, 1518 Park Ave (the former DMV), Orange Park, opening early 2027: content-facts and the plan.
- The finished bar is shown only as a concept, labeled on screen and in the caption.
- Never said: the bar's length, equipment repairs, watch parties, TV sizes, retail or merchandise, an opening month, prices, membership names, counts of Founders, the Founders Cup.

## AI
No AI voice. The bar render is Hannah's concept image, labeled "Concept" on screen and in the caption. Music: finisher (track `music-fmg-1008-r`).

## Build
`node source/build.mjs` (from `source/`) renders the overlays (`source/overlays.html` to `source/overlays/*.png`) with Playwright, cuts and composites the reel with ffmpeg into `media/reel.mp4` (silent, `-an`), and grabs `media/reel-cover.jpg`. `source/contrast.json`: lowest pair 5.45:1, all at or above 4.5:1. Fonts: Oswald Bold for beats and the Concept tab; Bahnschrift for the sub line and URL, standing in for Barlow. The source video stays where it is and is read only.

## Questions for Alex
- Want a specific Instagram sound on this reel? Write "Sound: title by artist" in a note here and we will set it before it posts. Sounds come from the Instagram library this account can use.
