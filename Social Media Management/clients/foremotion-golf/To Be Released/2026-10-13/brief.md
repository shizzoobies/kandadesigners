# Brief: Founding Tour, the premier individual membership

Slot: Tue 2026-10-13, 10:30 AM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: what it means to be a Founder (phase 4, tiers by name). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Tue Oct 13", first card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
The premier individual Founding Membership by name, with its term, hours of reserved bay time and spots, and no price. One ask: join the Founders List, where first access to Founding Memberships goes.

## Hook
"Founding Tour, the premier individual membership." On the card (kicker and headline) and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-13`. Instagram says link in bio; hashtags under `## First comment`. The Agreement line is the last body line of both captions.

## The card
The `2026-10-02` look: deep forest ground (#152F0F), cream type (#FAF8F2), logo green (#73AF15) and lime (#6AA212) accents, no amber.
- Top: the stacked Aug 2 logo for dark backgrounds (`Secondary`), as delivered.
- Kicker in logo green: "The premier individual membership".
- Headline: "Founding Tour", "Tour" in logo green.
- Three figures between lime rules: "6 months", "84 hours of reserved bay time" with "About 14 a month", "10 spots".
- "Limited availability. Benefits and terms governed by the Founding Membership Agreement."
- A logo green block: "Join the Founders List."
- Foot: foremotiongolf.com.

## Sources and truth
- Tier facts from the build brief and the plan: Founding Tour, 6 months, 84 hours of reserved bay time, about 14 a month, 10 spots. Venue facts in the caption (four TrackMan bays, 1518 Park Ave in Orange Park, opening early 2027) and "First access to Founding Memberships" (a Founders List benefit on the splash page) are in the plan.
- Never said: a price, "Best Value", a total count of Founders, an opening month, Gold, Platinum, Diamond or Elite, rollover, booking windows, member counts.

## AI
None. No video, so no music.

## Build
HTML card rendered to PNG with Playwright: `node source/build.mjs` (from `source/`), copied from the `2026-10-02` script. It writes `source/card.html`, the trimmed logo `source/fmg-secondary-trimmed.png` and `source/contrast.json` (lowest pair 5.45:1, all at or above 4.5:1), and stops on an unloaded font, an em or en dash, a price, "Best Value", or anything outside the 48px safe frame. Fonts: Oswald Bold for the headline, figures and button; Bahnschrift for body text, standing in for Barlow, which is not installed on the build machine.

## Questions for Alex
None.
