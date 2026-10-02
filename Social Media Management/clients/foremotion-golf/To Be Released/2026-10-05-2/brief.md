# Brief: Calibrate. Know your numbers.

Slot: Mon 2026-10-05, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: our story (phase 2). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Mon Oct 5", card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
The first of the three words, on its own: at Fore Motion Golf you see your numbers on every swing. One ask: join the Founders List.

## Hook
"Calibrate. Know your numbers." On the card and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-05-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
One idea, one frame, the 2026-10-02 look. Deep forest ground (#152F0F), cream type (#FAF8F2), logo green (#73AF15) and lime (#6AA212) accents, no amber.
- Top: the stacked Aug 2 logo for dark backgrounds (`Secondary`), as delivered: not recolored, no glow, no shadow.
- The tagline "Calibrate. Compete. Connect." with Calibrate in logo green and the other two words in a quiet sage.
- Headline: "Know your numbers." with "numbers." in logo green.
- A short lime rule, then "TrackMan shows the ball and the club on every swing."
- A logo green block: "Join the Founders List."
- Foot: foremotiongolf.com.

## Sources and truth
- "Calibrate. Know your numbers. TrackMan shows the ball and the club on every swing.": the approved plan, Mon Oct 5 card.
- Four TrackMan bays, 1518 Park Ave in Orange Park, early 2027: content-facts.
- Never said: an opening month, prices, a count of Founders, anything about the Founders Cup, testimonials, member counts.

## AI
No AI voice or visuals. No video, so no music.

## Build
HTML card rendered to PNG with Playwright: `node source/build.mjs` (from `source/`), copied from the 2026-10-02 card script; it also writes `source/card.html`, the trimmed logo and `source/contrast.json` (lowest pair 5.45:1, all at or above 4.5:1). Fonts: Oswald Bold for the tagline, headline and button; Bahnschrift for the sub line and URL, standing in for Barlow, which is not installed on the build machine.

## Questions for Alex
None.
