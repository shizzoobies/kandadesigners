# Brief: Founding Corporate Partner

Slot: Tue 2026-10-13, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: what it means to be a Founder (phase 4, tiers by name). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Tue Oct 13", second card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
The Founding Membership for local businesses: its term, hours of reserved bay time and the number of partnerships, no price, and how to ask about it. The caption still closes on the Founders List.

## Hook
"Founding Corporate Partner." On the card and as caption line 1.

## Call to action
On the card and in the captions: "Request corporate information: admin@foremotiongolf.com". The captions close on the Founders List: Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-13-2`; Instagram says link in bio, hashtags under `## First comment`. The Agreement line is the last body line of both captions.

## The card
The `2026-10-02` look: deep forest ground (#152F0F), cream type (#FAF8F2), logo green (#73AF15) and lime (#6AA212) accents, no amber.
- Top: the stacked Aug 2 logo for dark backgrounds (`Secondary`), as delivered.
- Kicker in logo green: "For local businesses".
- Headline: "Founding Corporate Partner", "Corporate Partner" in logo green.
- Three figures between lime rules: "12 months", "150 hours of reserved bay time", "5 partnerships".
- "Limited availability. Benefits and terms governed by the Founding Membership Agreement."
- A logo green block: "Request corporate information: admin@foremotiongolf.com".
- Foot: foremotiongolf.com.

## Sources and truth
- Tier facts from the build brief and the plan: Founding Corporate Partner, 12 months, 150 hours of reserved bay time, 5 partnerships, for local businesses (plan, Fri Oct 16). The email is the contact in content-facts and the plan. Venue facts in the caption (four TrackMan bays, six players each, Orange Park, opening early 2027) are in the plan.
- Left out: a per-month figure for this tier (not among the allowed tier facts), any price, sponsorship or recognition details, a total count of Founders.

## AI
None. No video, so no music.

## Build
HTML card rendered to PNG with Playwright: `node source/build.mjs` (from `source/`), copied from the `2026-10-02` script. It writes `source/card.html`, the trimmed logo `source/fmg-secondary-trimmed.png` and `source/contrast.json` (lowest pair 5.45:1, all at or above 4.5:1), and stops on an unloaded font, an em or en dash, a price, or anything outside the 48px safe frame. Fonts: Oswald Bold for the headline, figures and request line; Bahnschrift for body text and the email, standing in for Barlow, which is not installed on the build machine.

## Questions for Alex
None.
