# Brief: The Founders Wall

Slot: Sun 2026-10-11, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: what it means to be a Founder (phase 4). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Sun Oct 11", the card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
One Founder benefit, close up: Founders are recognized on the Founders Wall at Fore Motion Golf, their name there from the beginning. One ask: join the Founders List.

## Hook
"The Founders Wall." On the card and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-11-2`. Instagram says link in bio; hashtags under `## First comment`. The Agreement line is the last body line of both captions.

## The card
One idea, one frame, in the `2026-10-02` look. Deep forest ground (#152F0F), cream type (#FAF8F2), logo green (#73AF15) and lime (#6AA212) accents, no amber.
- Top: the stacked Aug 2 logo for dark backgrounds (`Secondary`), as delivered: not recolored, no glow, no shadow.
- Headline: "The Founders Wall." in tall condensed capitals, "Wall." in logo green.
- A short lime rule, then "Your name at the beginning."
- A logo green block: "Join the Founders List."
- "Limited availability. Benefits and terms governed by the Founding Membership Agreement." (a Founder benefit, so it carries the membership line).
- Foot: foremotiongolf.com.

## Sources and truth
- The Founders Wall and "Your name at the beginning." are the plan's Sun Oct 11 card. Recognition on the Founders Wall is in Justin's Founding Membership brief (Sept 28) for individual Founders.
- Never said: any price, a count of Founders (only "limited"), what the wall looks like or where it hangs, an opening month (only "early 2027"), the Founders Cup.

## AI
No AI voice or visuals. No video, so no music.

## Build
HTML card rendered to PNG with Playwright: `node source/build.mjs` (from `source/`), copied from the `2026-10-02` card script with the Agreement line added above the URL. It writes `media/card.png`, `source/card.html`, the trimmed logo and `source/contrast.json` (lowest pair 5.45:1, all at or above 4.5:1), and fails on an em or en dash, a price, an unloaded font, or blocks closer than 40px. Fonts: Oswald Bold; Bahnschrift standing in for Barlow, which is not installed.

## Questions for Alex
None.
