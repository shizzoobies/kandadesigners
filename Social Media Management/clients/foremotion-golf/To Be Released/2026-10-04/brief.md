# Brief: Follow the build

Slot: Sun 2026-10-04, 12:00 PM Eastern. Facebook and Instagram REEL, 1080x1920, 16.6 s, 30 fps, silent until the finisher adds the track.
Pillar: something new is coming (phase 1). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Sun Oct 4", reel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
A look inside the empty building as it is today: the long counter wall where the four bays go and the open hall, with the opening window and one ask: follow the build on the Founders List.

## Hook
"Four bays go here." The first on-screen line and caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com, the last 3 seconds on screen. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-04`. Instagram says link in bio; hashtags under `## First comment`.

## The cut
Real footage only, from Hannah's Walkthrough 2 (2160x3840, 60 fps), downscaled to 1080x1920 at 30 fps:
- 0.0 to 9.65 s: source 0:31.75 to 0:41.40, the walk along the counter wall where the bays go, then the hall.
- 0.4 s crossfade.
- 9.25 to 16.6 s: source 0:44.25 to 0:51.60, the same hall from the far end.
Every frame: the stacked `Secondary` logo top center on a deep forest tab, and a deep forest panel over the lower 31% of the frame with a lime top rule, our line, and foremotiongolf.com.
Text beats (Oswald Bold, two lines each, second line in logo green; Bahnschrift kicker above):
1. 0.0 to 4.8 s: "1518 Park Ave, Orange Park, FL" / "Four bays go here."
2. 4.8 to 9.45 s: "1518 Park Ave, Orange Park, FL" / "Opening early 2027."
3. 9.45 to 13.6 s: "The former DMV, being built out now" / "Follow the build."
4. 13.6 to 16.6 s: "Follow the build" / "Join the Founders List."
Cover: `media/reel-cover.jpg`, the frame at 2.5 s.

What was left out of the walkthrough, and why:
- The panel covers Hannah's burned-in word captions in both stretches (they sit between 74% and 88% of the frame height). In these stretches they include a bay width and a length of bays in feet and named competitions, none of which are confirmed facts. Checked frame by frame: nothing of them shows above the panel.
- Not used: the opening minute of close shots of the person talking (captions with an eight and thirty-two player count, cap logo close up), every concept render (a bay render, the putting area render, the bar render), the TV, watch party and facility rental stretches. So no concept image appears and no "Concept" label is needed.
- The person on camera is not named and is mostly small in the frame or seen from behind.

## Sources and truth
- Four TrackMan bays, up to six players per bay, 1518 Park Ave in Orange Park, the former DMV, opening early 2027: `content-facts.md` and the plan. "Being built out now" and "follow the build": content-facts ("Demo began September 2026 and the build is public: Follow us as we build FMG"). "Construction updates" go to the list: the splash page's list benefits.
- "Four bays go here." is the plan's own line for this cut; the captions say only that four TrackMan bays are coming, not where in the building they sit.
- Never said: an opening month or day, a count of Founders, any price, any membership name, the Founders Cup, the bar's length, repairs, watch parties, bay sizes.

## AI
No AI voice or visuals. Music: finisher (`music-fmg-1004-r`). The cut is silent (`-an`).

## Build
`node source/build.mjs` (from `source/`): renders the four beat overlays (HTML to transparent PNG with Playwright, in `source/overlays/`), then cuts, crossfades, overlays and encodes with ffmpeg (H.264 High, CRF 19, yuv420p, 30 fps, faststart, no audio) to `media/reel.mp4`, grabs `media/reel-cover.jpg`, and writes `source/frames-contact-sheet.jpg` (one frame a second) and `source/contrast.json` (lowest pair 5.45:1). The source video stays where it is and is read only. Fonts: Oswald Bold and Bahnschrift (Barlow is not installed on the build machine). All on-screen text keeps clear of the Reels button rail on the right.

## Questions for Alex
- Want a specific Instagram sound on this reel? Write "Sound: title by artist" in a note here and we will set it before it posts. Sounds come from the Instagram library this account can use.
