# Brief: This isn't just a place to hit golf balls

Slot: Sat 2026-10-03, 12:00 PM Eastern. Instagram carousel POST, 5 slides at 1080x1350; Facebook POST as a slide video (finisher).
Pillar: something new is coming (phase 1). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Sat Oct 3", carousel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
A swipe through what is coming to Orange Park: the address, four TrackMan bays, a bar and lounge and a putting area, then one ask: join the Founders List.

## Hook
"This isn't just a place to hit golf balls." (the splash page's lead line). Slide 1 and caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-03`. Instagram says link in bio; hashtags under `## First comment`.

## The slides
The look of the 2026-10-02 card: deep forest slides with the stacked `Secondary` logo, cream slides with the stacked `Primary_Light` logo, Oswald Bold headlines, Bahnschrift body, logo green and lime accents on dark, primary green #357A16 accents on cream (logo green is too light on cream). URL and a slide count at the foot of every slide.
1. Dark. Kicker "Coming early 2027". "This isn't just a place to hit golf balls." "Here is what is coming to Orange Park, FL." Swipe cue.
2. Cream. Kicker "Where". "1518 Park Ave, Orange Park." "The former DMV, being built out now."
3. Dark. Kicker "Play". "Four TrackMan bays." "Up to six players per bay."
4. Cream. Kicker "Stay a while". "A bar and lounge. A putting area." "Canned beer and seltzers at the bar."
5. Dark. Kicker "Be first through the doors". "Join the Founders List." "Founding Memberships will be limited. The list gets access before the public." (splash copy). Button: foremotiongolf.com.

The plan lists six items for five slides; the bar and lounge and the putting area share slide 4.

## Sources and truth
- Every fact is in `content-facts.md` or the plan: 1518 Park Ave, Orange Park, the former DMV; four TrackMan bays, up to six players per bay; a bar and lounge; a putting area; canned beer and seltzers; opening early 2027. "Being built out now" rests on content-facts ("Demo began September 2026 and the build is public").
- The hook and the slide 5 line are splash page copy, quoted as written.
- Never said: an opening month, a count of Founders, any price, any membership name, anything about the Founders Cup, the bar's length, repairs, watch parties.

## AI
No AI voice or visuals. Music: finisher (Facebook slide video, `music-fmg-1003-c`).

## Build
HTML slides rendered to PNG with Playwright, JPG via sharp: `node source/build.mjs` (from `source/`), which writes `source/png/slide-NN.png` (masters), `media/slide-NN.jpg`, `source/slides.html`, both trimmed logos, `source/contact-sheet.png` and `source/contrast.json` (lowest pair 5.01:1, all at or above 4.5:1). Fonts: Oswald Bold for headlines and the button; Bahnschrift for body, kickers and URL, standing in for Barlow, which is not installed on the build machine.
Facebook slide video: finisher. The slides are scoped to `["instagram"]` until then.

## Questions for Alex
None.
