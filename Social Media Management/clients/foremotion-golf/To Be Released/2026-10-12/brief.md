# Brief: Founding Practice

Slot: Mon 2026-10-12, 10:30 AM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: what it means to be a Founder (phase 4, tiers by name). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Mon Oct 12", the 10:30 card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
The first Founding Membership by name, with its term, its reserved bay time and how many spots there are. No price. One ask: join the Founders List.

## Hook
"Founding Practice." On the card and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-12`. Instagram says link in bio; hashtags under `## First comment`. The Agreement line is the last body line of both captions.

## The card
One idea, one frame, in the `2026-10-02` look. Deep forest ground (#152F0F), cream type (#FAF8F2), logo green (#73AF15) and lime (#6AA212) accents, no amber.
- Top: the stacked Aug 2 logo for dark backgrounds (`Secondary`), as delivered: not recolored, no glow, no shadow.
- Headline: "Founding Practice." in tall condensed capitals, "Practice." in logo green.
- Three figures in logo green with cream labels, split by lime rules: 6 Months, 24 Hours, 25 Spots.
- "24 hours of reserved bay time, about 4 a month."
- A logo green block: "Join the Founders List."
- "Limited availability. Benefits and terms governed by the Founding Membership Agreement."
- Foot: foremotiongolf.com.

## Sources and truth
- Tier facts from the build brief only: Founding Practice, 6 months, 24 hours of reserved bay time, about 4 a month, 25 spots. Hours are reserved bay time, not hours per golfer.
- Caption: Founders Wall recognition and the permanent Founding Member designation, from the plan's Sun Oct 11 list (Justin's brief lists both for every individual tier).
- Never said: the price, a sales date, a total count of Founders, "Best Value", Gold, Platinum, Diamond, Elite, rollover, booking windows, member bay rates, named merchandise.

## AI
No AI voice or visuals. No video, so no music.

## Build
HTML card rendered to PNG with Playwright: `node source/build.mjs` (from `source/`), copied from the `2026-10-02` card script with a figures row and the Agreement line. It writes `media/card.png`, `source/card.html`, the trimmed logo and `source/contrast.json` (lowest pair 5.45:1, all at or above 4.5:1), and fails on an em or en dash, a price, an unloaded font, or blocks closer than 40px. Fonts: Oswald Bold; Bahnschrift standing in for Barlow, which is not installed. The Founding Club card (`2026-10-12-2`) is the same script with its own figures.

## Questions for Alex
None.
