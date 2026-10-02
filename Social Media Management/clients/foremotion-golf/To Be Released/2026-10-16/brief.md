# Brief: Limited. Prepaid. Before we open.

Slot: Fri 2026-10-16, 10:30 AM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: sales (phase 6), in its no-price form. The plan is `plans/2026-10-02-founders-funnel.md`, slot "Fri Oct 16"; the build brief is `plans/2026-10-02-founders-funnel-build-brief.md`, "Oct 15 and 16 (agent G), no-price form". The plan's "Founding Memberships are open" card waits for the sales date and a public Founders page; this card stands in for it.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
The three things that make a Founding Membership what it is, in three words: limited, prepaid, before the doors open. One ask: join the Founders List for first access. No prices, no sales date.

## Hook
"Limited. Prepaid. Before we open." On the card and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-16`. Instagram says link in bio; hashtags under `## First comment`. The Agreement line is the last body line of both captions.

## The card
One idea, one frame, the `2026-10-02` look. Deep forest ground (#152F0F), cream type (#FAF8F2), logo green (#73AF15) and lime (#6AA212) accents.
- Top: the stacked Aug 2 logo for dark backgrounds (`Secondary`), as delivered.
- Headline: "Limited. Prepaid. Before we open." in tall condensed capitals, "Before we open." in logo green.
- A short lime rule, then "Founding Memberships. First access on the Founders List."
- A logo green block: "Join the Founders List."
- "Limited availability. Benefits and terms governed by the Founding Membership Agreement."
- Foot: foremotiongolf.com.

## Sources and truth
- "Limited" and "prepaid" and "before Fore Motion Golf officially opens": Justin's FAQ answer "What is a Fore Motion Golf Founding Membership?" (Founders and Game documents, 2026-09-28). "Early 2027" and the four names: content-facts.md and the build brief.
- Never said: any price, a sales date, a total count of Founders, "open now" or anything that says sales have started, an opening month.

## AI
No AI voice or visuals. No video, so no music.

## Build
HTML card rendered to PNG with Playwright: `node source/build.mjs` (from `source/`), which also writes `source/card.html`, the trimmed logo and `source/contrast.json` (lowest pair 5.45:1, all at or above 4.5:1). Fonts: Oswald Bold for the headline and button; Bahnschrift for body, standing in for Barlow, which is not installed.
No-price form: when Justin confirms prices and the sales date, this day is rebuilt with prices by a later job.

## Questions for Alex
None.
