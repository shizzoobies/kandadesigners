# Brief: Calibrate. Compete. Connect.

Slot: Mon 2026-10-05, 10:30 AM Eastern. Instagram feed POST, a 5-slide carousel at 1080x1350; Facebook feed POST, the same slides as a slide video.
Pillar: our story (phase 2). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Mon Oct 5", carousel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
The brand's three words, one slide each, and what each means at Fore Motion Golf: calibrate on TrackMan data, compete in leagues and events, connect at the bar and lounge with up to six to a bay. Then the one ask: join the Founders List.

## Hook
"Calibrate. Compete. Connect." On slide 1 and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-05`. Instagram says link in bio; hashtags under `## First comment`.

## The slides
Every slide: the stacked Aug 2 logo at the top (`Secondary` on deep forest, `Primary_Light` on cream, not recolored, no glow, no shadow), foremotiongolf.com at the foot with the slide count and a swipe cue. Dark slides are deep forest #152F0F with cream type and logo green accents; slides 2 and 4 are cream #FAF8F2 with deep forest and forest #1C4A12 type, for contrast between slides.
1. Hook (dark): "Calibrate. Compete. Connect." with Compete in logo green. "Three words, and what each one means at Fore Motion Golf."
2. Calibrate (cream): "Know your numbers." "TrackMan shows the ball and the club on every swing."
3. Compete (dark): "Leagues and events." "Season play and single-day events are on the way."
4. Connect (cream): "Six to a bay." "Up to six players per bay, and a bar and lounge between rounds. Come as a group."
5. Ask (dark): "Be first through the doors." "Opening early 2027 at 1518 Park Ave, Orange Park, FL." A logo green "Join the Founders List." block.

## Sources and truth
- Tagline "Calibrate. Compete. Connect." and "Be first through the doors.": the splash page (content-facts).
- Four TrackMan bays, six players per bay, bar and lounge, 1518 Park Ave, the former DMV, early 2027: content-facts.
- Leagues and events as seasons and single-day events, in the future tense: content-facts ("Leagues and competitions"). No league names, days or start dates.
- "TrackMan shows the ball and the club on every swing": the approved plan, Mon Oct 5 card.
- Never said: an opening month, prices, a count of Founders, watch parties, anything about the Founders Cup, testimonials, member counts. Justin's own background stays on /our-story.

## AI
No AI voice or visuals. The Facebook slide video's music: finisher (`music-fmg-1005-c`).

## Build
HTML slides rendered to PNG with Playwright, JPG via sharp: `node source/build.mjs` (from `source/`), which writes the masters to `source/png/`, the JPGs to `media/`, `source/slides.html`, the trimmed logos, `source/contact-sheet.png` and `source/contrast.json` (lowest pair 5.45:1, all at or above 4.5:1). Fonts: Oswald Bold for headlines, leads and the button; Bahnschrift for body, count and URL, standing in for Barlow, which is not installed on the build machine. Slides are scoped to `"platforms": ["instagram"]`.

Facebook slide video: finisher.

## Questions for Alex
None.
