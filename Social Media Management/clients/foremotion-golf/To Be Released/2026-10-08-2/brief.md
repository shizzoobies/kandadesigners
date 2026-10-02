# Brief: Canned beer and seltzers at the bar

Slot: Thu 2026-10-08, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: the experience (phase 3). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Thu Oct 8", card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Short and simple: there is a bar, and it serves canned beer and seltzers. One ask: join the Founders List.

## Hook
"Canned beer and seltzers at the bar." On the card and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-08-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
One idea, one frame, the same look as the 2026-10-02 card. Deep forest ground (#152F0F), cream type (#FAF8F2), logo green (#73AF15) and lime (#6AA212) accents, no amber.
- Top: the stacked Aug 2 logo for dark backgrounds (`Secondary`), as delivered.
- Headline: "Canned beer and seltzers at the bar." in tall condensed capitals, "seltzers" and "bar." in logo green.
- A short lime rule, then "Coming early 2027 to Orange Park, FL."
- A logo green block: "Join the Founders List."
- Foot: foremotiongolf.com.

## Sources and truth
- Canned beer, seltzers and other canned drinks; a bar and lounge; four TrackMan bays, six players per bay; Orange Park; early 2027: content-facts and the plan.
- Never said: drink brands, drafts, drink prices, food items, the bar's length, watch parties, an opening month, anything about memberships or the Founders Cup.

## AI
No AI voice or visuals. No video, so no music.

## Build
HTML card rendered to PNG with Playwright: `node source/build.mjs` (from `source/`), a copy of the 2026-10-02 script with new words. It writes `source/card.html`, the trimmed logo and `source/contrast.json` (lowest pair 5.45:1, all at or above 4.5:1). Fonts: Oswald Bold for the headline and button; Bahnschrift for the sub line and URL, standing in for Barlow.

## Questions for Alex
None.
