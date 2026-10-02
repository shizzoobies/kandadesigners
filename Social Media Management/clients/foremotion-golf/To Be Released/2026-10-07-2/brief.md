# Brief: Rental clubs, reserved ahead

Slot: Wed 2026-10-07, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: the experience (phase 3). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Wed Oct 7", card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
One practical answer: no clubs needed. Rental club sets are available and can be reserved ahead of time. One ask: join the Founders List.

## Hook
"Rental clubs, reserved ahead." On the card and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-07-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
One idea, one frame, the same look as the 2026-10-02 card. Deep forest ground (#152F0F), cream type (#FAF8F2), logo green (#73AF15) and lime (#6AA212) accents, no amber.
- Top: the stacked Aug 2 logo for dark backgrounds (`Secondary`), as delivered.
- Headline: "Rental clubs, reserved ahead." in tall condensed capitals, "reserved ahead." in logo green.
- A short lime rule, then "Bring nothing but yourself."
- A logo green block: "Join the Founders List."
- Foot: foremotiongolf.com.

## Sources and truth
- Rental club sets, reservable ahead of time; four TrackMan bays, six players per bay; Orange Park; early 2027: content-facts and the plan. "Bring nothing but yourself": the plan.
- Never said: a rental price, a booking window, club brands, an opening month, anything about memberships or the Founders Cup.

## AI
No AI voice or visuals. No video, so no music.

## Build
HTML card rendered to PNG with Playwright: `node source/build.mjs` (from `source/`), a copy of the 2026-10-02 script with new words. It writes `source/card.html`, the trimmed logo and `source/contrast.json` (lowest pair 5.45:1, all at or above 4.5:1). Fonts: Oswald Bold for the headline and button; Bahnschrift for the sub line and URL, standing in for Barlow.

## Questions for Alex
None.
