# Brief: Where it's always 70 and sunny

Slot: Fri 2026-10-02, 7:00 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: something new is coming (phase 1). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Fri Oct 2 (tonight)".
Approved: yes (Alex in chat, 2026-10-02: build tonight's post only, hold the rest)

## What the viewer gets
A first look at what is coming to Orange Park: an indoor golf lounge on TrackMan simulators where the weather is always right, opening early 2027. One ask: join the Founders List.

## Hook
"Where it's always 70 and sunny." On the card and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-02` (returned 200 on 2026-10-02). Instagram says link in bio; hashtags under `## First comment`.

## The card
One idea, one frame. Deep forest ground (#152F0F), cream type (#FAF8F2), logo green (#73AF15) and lime (#6AA212) accents, no amber.
- Top: the stacked Aug 2 logo for dark backgrounds (`Secondary`), as delivered: not recolored, no glow, no shadow.
- Headline: "Where it's always 70 and sunny." in tall condensed capitals, "70" and "sunny." in logo green.
- A short lime rule, then "Coming early 2027 to Orange Park, FL."
- A logo green block: "Join the Founders List."
- Foot: foremotiongolf.com.

## Sources and truth
- Facts in the captions: four TrackMan bays, up to six players per bay, a bar and lounge, a putting area, 1518 Park Ave in Orange Park (the former DMV), opening early 2027. All on foremotiongolf.com and in the plan.
- Never said: an opening month, a count of Founders, any price, any membership name, anything about the Founders Cup, testimonials, member counts.

## AI
No AI voice or visuals. No video, so no music.

## Build
HTML card rendered to PNG with Playwright: `node source/build.mjs` (from `source/`), which also writes `source/card.html`, the trimmed logo `source/fmg-secondary-trimmed.png` and `source/contrast.json` (lowest pair 5.45:1, all at or above 4.5:1). Fonts: Oswald Bold for the headline and button; Bahnschrift for the sub line and URL, standing in for Barlow, which is not installed on the build machine.

## Questions for Alex
None.
