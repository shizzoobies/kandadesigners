# Brief: Follow the build

Slot: Sun 2026-10-04, 12:00 PM Eastern. Facebook and Instagram REEL, 1080x1920, 19.4 s, 30 fps. v2 (2026-10-02 night): rebuilt as an intercut of owner Justin Myrick in the real space with the 3D venue concept (Alex's call: all four reels, name him, Concept tab on every 3D shot). Music muxed (`music-fmg-1004-r`).
Pillar: something new is coming (phase 1). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Sun Oct 4", reel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Owner Justin Myrick walks the empty building as it is today and points out the long counter wall where the four bays go; a cut to the interactive 3D venue concept shows the bays as planned; back to Justin in the open hall, with the opening window and one ask: follow the build on the Founders List.

## Hook
"Four bays go here." The first on-screen line (with the kicker "Owner Justin Myrick walks the space.") and caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com, the last 3 seconds on screen. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-04`. Instagram says link in bio; hashtags under `## First comment`.

## The cut
An intercut, hard cuts, 19.4 s. Real footage from Hannah's Walkthrough 2 (2160x3840, 60 fps) and one shot of the interactive 3D venue concept on foremotiongolf.com, captured 2026-10-02 (`D:kap-reeloutmg-3days-push.mp4`), all at 1080x1920, 30 fps:

| Reel time | Source | What it shows | On screen (kicker / line) |
|---|---|---|---|
| 0.00 to 4.50 | W2 0:31.75 to 0:36.25 | Real: Justin walks the counter wall where the bays go, arm out at the wall | "Owner Justin Myrick walks the space." / "Four bays go here." |
| 4.50 to 8.00 | 3D concept, bays-push 5.0 to 8.5 s | Concept: a push into a bay, a golfer on the tee mat, the course on the screen. "Concept" tab top left the whole shot | "Four TrackMan bays" / "The bays, as planned." |
| 8.00 to 12.00 | W2 0:36.25 to 0:40.25 | Real: Justin on along the wall into the hall | "1518 Park Ave, Orange Park, FL" / "Opening early 2027." |
| 12.00 to 16.35 | W2 0:44.25 to 0:48.60 | Real: the hall from the far end, Justin gesturing | "The former DMV, being built out now" / "Follow the build." |
| 16.35 to 19.35 | W2 0:48.60 to 0:51.60 | Real: the same shot | "Follow the build" / "Join the Founders List." |

Every frame: the stacked `Secondary` logo top center on a deep forest tab, and a deep forest panel over the lower 31% of the frame with a lime top rule, our line (Oswald Bold, two lines, second in logo green; Bahnschrift kicker above), and foremotiongolf.com. The "Concept" tab (cream Oswald on deep forest, top left) is on every frame of the 3D shot and on no real frame.
Cover: `media/reel-cover.jpg`, the frame at 2.5 s (Justin at the counter wall, real footage, not a render).
v1 (real footage only, 16.6 s) is kept as `source/reel-silent-v1.mp4`.

What was left out of the walkthrough, and why:
- The panel covers Hannah's burned-in word captions in every real stretch (they sit between 74% and 88% of the frame height; all real stretches sit inside v1's frame-checked windows 0:31.75 to 0:41.40 and 0:44.25 to 0:51.60). They include a bay width and a length of bays in feet and named competitions, none of which are confirmed facts. Nothing of them shows above the panel.
- Not used: the opening minute of close shots (captions with an eight and thirty-two player count), Hannah's concept renders, the TV, watch party and facility rental stretches.
- The only concept image is the 3D venue concept shot, labeled "Concept" for its whole length.

## Sources and truth
- Four TrackMan bays, up to six players per bay, 1518 Park Ave in Orange Park, the former DMV, opening early 2027: `content-facts.md` and the plan. "Being built out now" and "follow the build": content-facts ("Demo began September 2026 and the build is public: Follow us as we build FMG"). "Construction updates" go to the list: the splash page's list benefits.
- "Four bays go here." is the plan's own line for this cut; the captions say only that four TrackMan bays are coming, not where in the building they sit.
- Justin Myrick is the owner and the man on camera; Alex asked for him to be named (2026-10-02 night).
- The 3D shot: the interactive 3D venue concept on foremotiongolf.com, captured 2026-10-02 (foremotiongolf.com/golf-3d/v2/). It is a concept, labeled on screen and in the caption.
- Never said: an opening month or day, a count of Founders, any price, any membership name, the Founders Cup, the bar's length, repairs, watch parties, bay sizes.

## AI
No AI voice or AI visuals. The 3D shot is a capture of the venue concept model, not AI generated. Music: `music-fmg-1004-r`, muxed 2026-10-02 night: video copied from `source/reel-silent.mp4`, track trimmed to length with a 1.5 s fade-out, two-pass loudnorm to -14 LUFS (linear), alimiter 0.8, AAC 192k 48 kHz (reading -14.0 LUFS integrated, -2.1 dBTP). Mux script: `D:kap-reeloutmg-3d	oolsmux.mjs`.

## Build
`node source/build.mjs` (from `source/`): renders the five beat overlays (HTML to transparent PNG with Playwright, in `source/overlays/`), cuts the four real stretches and the 3D shot, overlays and encodes with ffmpeg (H.264 High, CRF 19, yuv420p, 30 fps, faststart, no audio) to `source/reel-silent.mp4`, grabs `media/reel-cover.jpg`, and writes `source/frames-contact-sheet.jpg` (one frame a second) and `source/contrast.json` (lowest pair 5.45:1). The 3D clips are captured by `D:kap-reeloutmg-3d	oolscapture.mjs` (headless Chromium, camera stepped at 30 fps). The source video stays where it is and is read only. Fonts: Oswald Bold and Bahnschrift (Barlow is not installed on the build machine). All on-screen text keeps clear of the Reels button rail on the right.

## Questions for Alex
- Want a specific Instagram sound on this reel? Write "Sound: title by artist" in a note here and we will set it before it posts. Sounds come from the Instagram library this account can use.
