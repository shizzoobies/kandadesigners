# Brief: Compete, leagues and events

Slot: Tue 2026-10-06, 10:30 AM Eastern. Facebook and Instagram REEL, 1080x1920, 20 seconds, 30 fps. v2 (2026-10-02 night): rebuilt as an intercut of owner Justin Myrick in the real space with the 3D venue concept (Alex's call: all four reels, name him, Concept tab on every 3D shot). Music muxed (`music-fmg-1006-r`).
Pillar: our story (phase 2). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Tue Oct 6", reel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Owner Justin Myrick walks the real, empty space where the bays go, with the second of the three words: compete. A cut to the interactive 3D venue concept shows the spectator counters and bays as planned. Leagues and events are on the way, and the Founders List gets early access to them. One ask: join the Founders List.

## Hook
"Compete." On screen for the first 3.5 seconds, with "Owner Justin Myrick walks the space." under it, and caption line 1: "Compete. Leagues and events are coming to Fore Motion Golf."

## Call to action
Join the Founders List at foremotiongolf.com. The last 3 seconds are a closing card with "Join the Founders List." and the URL. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-06`. Instagram says link in bio; hashtags under `## First comment`.

## The cut
An intercut, hard cuts, 20 s. Real footage from Hannah's Walkthrough 2 (69 s, 2160x3840 at 60 fps) and one shot of the interactive 3D venue concept on foremotiongolf.com, captured 2026-10-02 (`D:kap-reeloutmg-3dspectator-counters.mp4`), all at 1080x1920, 30 fps, H.264.

| Reel time | Source | What it shows | On screen (head / sub) |
|---|---|---|---|
| 0.0 to 3.5 | W2 31.6 to 35.1 | Real: Justin walks into the long carpeted room where the bays go, arm out at the wall | "Compete." / "Owner Justin Myrick walks the space." |
| 3.5 to 6.5 | W2 35.1 to 38.1 | Real: the same walk | "Leagues." / "Season play and single-day events, on the way." |
| 6.5 to 10.0 | 3D concept, spectator-counters 2.0 to 5.5 s (1.1x crop) | Concept: the spectator counters and a bay with a golfer on the tee mat. "Concept" tab top left the whole shot | "Four bays." / "Leagues and events, four bays, as planned." |
| 10.0 to 13.5 | W2 44.3 to 47.8 | Real: Justin standing in the room, gesturing | "Events." / "Bring your group and make a night of it." |
| 13.5 to 17.0 | W2 47.8 to 51.3 | Real: the same shot | "First access." / "The Founders List gets early access to launch events and leagues." |
| 17.0 to 20.0 | none | Closing card on deep forest | the logo, "Join the Founders List.", "Early access to launch events and leagues.", foremotiongolf.com in a logo green block |

Text beats in Oswald Bold, each at least 3 seconds, in a full-width deep forest band at the bottom (from y 1240). The stacked `Secondary` logo sits top center on a deep forest tab on every frame (not recolored, no glow, no shadow) and foremotiongolf.com sits at the foot of every frame. The "Concept" tab (cream Oswald on deep forest, top left) is on every frame of the 3D shot and on no real frame.
Cover: `media/reel-cover.jpg`, the frame at 1.5 s (Justin, real footage, not a render).
v1 (real footage only, 19 s) is kept as `source/reel-silent-v1.mp4`.

What was cut and why:
- Source 0 to 31.5: the bays talk. Its burned-in captions name hardware and player counts that are not confirmed facts ("Eight Players", "Thirty-two Players At A Time"), and it carries concept insets.
- Source 38.1 to 44.2: the end of the first walk (dropped for length), a whip pan and a concept render of the putting area.
- Source 51.4 to the end: Hannah's concept renders (bays with TVs, the bar with signage) and the watch parties and facility rental segment.
- The kept real stretches are v1's frame-checked windows and carry Hannah's word-by-word captions in the lower part of the frame (room dimensions and a list of planned competitions). The deep forest band covers that whole zone on every real frame; v1's check at 4 frames a second shows no caption edge above the band.

## Sources and truth
- Leagues and events, as seasons and single-day events, in the future tense: content-facts ("Leagues and competitions"), the splash page trio (Compete) and list benefit ("Early access to launch events & leagues").
- Four TrackMan bays, six players per bay, 1518 Park Ave, the former DMV, early 2027: content-facts.
- Justin Myrick is the owner and the man on camera; Alex asked for him to be named (2026-10-02 night).
- The 3D shot: the interactive 3D venue concept on foremotiongolf.com, captured 2026-10-02 (foremotiongolf.com/golf-3d/v2/). It is a concept, labeled on screen and in the caption.
- Never said: watch parties, any league name, day or start date, an opening month, prices, a count of Founders, anything about the Founders Cup, testimonials, member counts.

## AI
No AI voice or AI visuals. The 3D shot is a capture of the venue concept model, not AI generated. Music: `music-fmg-1006-r`, muxed 2026-10-02 night: video copied from `source/reel-silent.mp4`, track trimmed to length with a 1.5 s fade-out, two-pass loudnorm to -14 LUFS (linear), alimiter 0.8, AAC 192k 48 kHz (reading -13.9 LUFS integrated, -1.8 dBTP). Mux script: `D:kap-reeloutmg-3d	oolsmux.mjs`.

## Build
`node source/build.mjs` (from `source/`): renders the five beat overlays and the closing card from `source/overlays.html` to PNG with Playwright (`source/overlays/`), then cuts the four real stretches and the 3D shot, scales, overlays and encodes with ffmpeg into `source/reel-silent.mp4` (silent), pulls `media/reel-cover.jpg` (1.5 s, the first beat) and writes `source/frames-contact-sheet.jpg` (one frame a second) and `source/contrast.json` (lowest pair 5.45:1, all text on solid deep forest or logo green). The 3D clips are captured by `D:kap-reeloutmg-3d	oolscapture.mjs`. Fonts: Oswald Bold and Bahnschrift (Barlow is not installed on the build machine).

## Questions for Alex
- Want a specific Instagram sound on this reel? Write "Sound: title by artist" in a note here and we will set it before it posts. Sounds come from the Instagram library this account can use.
