# Brief: Connect. Six to a bay.

Slot: Tue 2026-10-06, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: our story (phase 2). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Tue Oct 6", card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
The third of the three words, on its own: Fore Motion Golf is built for groups, up to six to a bay, with a bar and lounge. One ask: join the Founders List.

## Hook
"Connect. Six to a bay." On the card and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-06-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
One idea, one frame, the 2026-10-02 look. Deep forest ground (#152F0F), cream type (#FAF8F2), logo green (#73AF15) and lime (#6AA212) accents, no amber.
- Top: the stacked Aug 2 logo for dark backgrounds (`Secondary`), as delivered: not recolored, no glow, no shadow.
- The tagline "Calibrate. Compete. Connect." with Connect in logo green and the other two words in a quiet sage.
- Headline: "Six to a bay." with "bay." in logo green.
- A short lime rule, then "Up to six players per bay. Come as a group, stay for the bar and lounge."
- A logo green block: "Join the Founders List."
- Foot: foremotiongolf.com.

## Sources and truth
- "Connect. Six players to a bay. Come as a group.": the approved plan, Tue Oct 6 card.
- Six players per bay, a bar and lounge, 1518 Park Ave in Orange Park, early 2027: content-facts.
- Never said: an opening month, prices, a count of Founders, watch parties, anything about the Founders Cup, testimonials, member counts.

## AI
No AI voice or visuals. No video, so no music.

## Build
HTML card rendered to PNG with Playwright: `node source/build.mjs` (from `source/`), copied from the 2026-10-02 card script; it also writes `source/card.html`, the trimmed logo and `source/contrast.json` (lowest pair 5.45:1, all at or above 4.5:1). Fonts: Oswald Bold for the tagline, headline and button; Bahnschrift for the sub line and URL, standing in for Barlow, which is not installed on the build machine.

## Questions for Alex
None.
