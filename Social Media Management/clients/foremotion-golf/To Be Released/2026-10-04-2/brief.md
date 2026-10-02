# Brief: Construction updates come to the list first

Slot: Sun 2026-10-04, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: something new is coming (phase 1). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Sun Oct 4", card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
One idea after the midday walkthrough reel: the build is underway, and the Founders List hears about it first. One ask: join it.

## Hook
"Construction updates come to the list first." On the card and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-04-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
The 2026-10-02 card's look: deep forest ground, cream type, logo green and lime accents, no amber.
- Top: the stacked `Secondary` logo, as delivered.
- Headline: "Construction updates come to the list first.", "first." in logo green.
- A lime rule, then "Follow the build in Orange Park, FL."
- A logo green block: "Join the Founders List."
- Foot: foremotiongolf.com.

## Sources and truth
- "Opening date + construction updates" is one of the splash page's list benefits (`content-facts.md`, "Splash page copy"). "Being built out now" and "follow the build": content-facts ("Demo began September 2026 and the build is public"). 1518 Park Ave, the former DMV, early 2027: content-facts.
- Never said: an opening month or day, how often updates go out, a count of Founders, any price, any membership name, anything about the Founders Cup.

## AI
No AI voice or visuals. No video, so no music.

## Build
HTML card rendered to PNG with Playwright: `node source/build.mjs` (from `source/`), copied from the 2026-10-02 script with the headline, sub line and spacing changed, which also writes `source/card.html`, the trimmed logo and `source/contrast.json` (lowest pair 5.45:1, all at or above 4.5:1). Fonts: Oswald Bold for the headline and button; Bahnschrift for the sub line and URL, standing in for Barlow, which is not installed on the build machine.

## Questions for Alex
None.
