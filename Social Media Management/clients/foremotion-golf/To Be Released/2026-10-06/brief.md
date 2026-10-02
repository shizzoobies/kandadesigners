# Brief: Compete, leagues and events

Slot: Tue 2026-10-06, 10:30 AM Eastern. Facebook and Instagram REEL, 1080x1920, 19 seconds, silent until the finisher adds the track.
Pillar: our story (phase 2). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Tue Oct 6", reel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
A walk through the real, empty space where the bays go, with the second of the three words: compete. Leagues and events are on the way, and the Founders List gets early access to them. One ask: join the Founders List.

## Hook
"Compete." On screen for the first 3 seconds, and caption line 1: "Compete. Leagues and events are coming to Fore Motion Golf."

## Call to action
Join the Founders List at foremotiongolf.com. The last 3 seconds are a closing card with "Join the Founders List." and the URL. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-06`. Instagram says link in bio; hashtags under `## First comment`.

## The cut
Source: Hannah's Walkthrough 2 (69 s, 2160x3840 at 60 fps), downscaled to 1080x1920 at 30 fps, H.264, no audio.
- 0.0 to 9.0: source 31.6 to 40.6, walking into the long carpeted room where the bays go (real footage).
- 9.0 to 16.0: source 44.3 to 51.3, further along the same room (real footage).
- 16.0 to 19.0: closing card on deep forest: the logo, "Join the Founders List.", "Early access to launch events and leagues.", foremotiongolf.com in a logo green block.

Text beats in Oswald Bold, each at least 3 seconds, in a full-width deep forest band at the bottom: "Compete." / "Leagues and events at Fore Motion Golf." (0 to 3); "Leagues." / "Season play and single-day events, on the way." (3 to 6); "Four bays." / "Four TrackMan bays, up to six players per bay." (6 to 9); "Events." / "Bring your group and make a night of it." (9 to 12.5); "First access." / "The Founders List gets early access to launch events and leagues." (12.5 to 16). The stacked `Secondary` logo sits top center on a deep forest tab on every frame (not recolored, no glow, no shadow) and foremotiongolf.com sits at the foot of every frame.

What was cut and why:
- Source 0 to 31.5: the bays talk. Its burned-in captions name hardware and player counts that are not confirmed facts ("Eight Players", "Thirty-two Players At A Time"), and it carries concept insets.
- Source 40.7 to 44.2: a whip pan and a concept render of the putting area.
- Source 51.4 to the end: concept renders (bays with TVs, the bar with signage) and the watch parties and facility rental segment.
- The kept segments carry Hannah's word-by-word captions in the lower part of the frame (room dimensions and a list of planned competitions). The deep forest band covers that whole zone on every footage frame; a frame-by-frame check at 4 per second shows no caption edge above the band.
- No concept image is visible in the cut, so no "Concept" label is needed. The person on camera is not named.

## Sources and truth
- Leagues and events, as seasons and single-day events, in the future tense: content-facts ("Leagues and competitions"), the splash page trio (Compete) and list benefit ("Early access to launch events & leagues").
- Four TrackMan bays, six players per bay, 1518 Park Ave, the former DMV, early 2027: content-facts.
- Never said: watch parties, any league name, day or start date, an opening month, prices, a count of Founders, anything about the Founders Cup, testimonials, member counts.

## AI
No AI voice or visuals. Music: finisher (`music-fmg-1006-r`); the file is silent and `music` is not set here.

## Build
`node source/build.mjs` (from `source/`): renders the five beat overlays and the closing card from `source/overlays.html` to PNG with Playwright (`source/overlays/`), then cuts, scales, overlays and encodes with ffmpeg into `media/reel.mp4`, pulls `media/reel-cover.jpg` (1.5 s, the first beat) and writes `source/frames-contact-sheet.jpg` (one frame a second) and `source/contrast.json` (lowest pair 5.45:1, all text on solid deep forest or logo green). Fonts: Oswald Bold and Bahnschrift (Barlow is not installed on the build machine).

## Questions for Alex
- The reel shows the host of the walkthrough video on camera, not named. Is he happy to appear, or should a later cut keep him out of frame?
- Want a specific Instagram sound on this reel? Write "Sound: title by artist" in a note here and we will set it before it posts. Sounds come from the Instagram library this account can use.
