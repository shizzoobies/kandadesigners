# Brief: The four Founding Memberships. Limited.

Slot: Wed 2026-10-14, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: countdown. The plan is `plans/2026-10-02-founders-funnel.md`, slot "Wed Oct 14", card. The plan's card reads "Tomorrow at 10:30: prices and the sales date."; neither is confirmed yet, so per the build brief it runs as the lineup only, with no "tomorrow".
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
The four Founding Memberships by name, the fact that they are limited, and where first access goes: the Founders List.

## Hook
"The four Founding Memberships. Limited." On the card and as caption line 1.

## Call to action
"Get first access on the Founders List." on the card. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-14-2`. Instagram says link in bio; hashtags under `## First comment`. The Agreement line is the last body line of both captions.

## The card
The `2026-10-02` look: deep forest ground (#152F0F), cream type (#FAF8F2), logo green (#73AF15) and lime (#6AA212) accents, no amber.
- Top: the stacked Aug 2 logo for dark backgrounds (`Secondary`), as delivered.
- Headline: "The four Founding Memberships." then "Limited." in logo green.
- The four names between lime rules: Practice, Club, Tour, Corporate Partner.
- "Limited availability. Benefits and terms governed by the Founding Membership Agreement."
- A logo green block: "Get first access on the Founders List."
- Foot: foremotiongolf.com.

## Sources and truth
- The four names are the brand guide's exact names. "Not reopened once they fill" (caption) is content-facts. "First access to Founding Memberships" is a Founders List benefit in the plan.
- Never said: a price, "tomorrow", a sales date, "Best Value", a total count of Founders.

## AI
None. No video, so no music.

## Build
HTML card rendered to PNG with Playwright: `node source/build.mjs` (from `source/`), copied from the `2026-10-02` script. It writes `source/card.html`, the trimmed logo `source/fmg-secondary-trimmed.png` and `source/contrast.json` (lowest pair 5.45:1, all at or above 4.5:1), and stops on an unloaded font, an em or en dash, a price, "Best Value", "tomorrow" or "reveal", or anything outside the 48px safe frame. Fonts: Oswald Bold for the headline and button; Bahnschrift for body text, standing in for Barlow, which is not installed on the build machine.
If Justin confirms prices and the sales date before release, this card is re-cut to the plan's "Tomorrow at 10:30: prices and the sales date."

## Questions for Alex
None.
