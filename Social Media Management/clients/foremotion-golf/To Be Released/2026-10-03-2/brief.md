# Brief: Be first through the doors

Slot: Sat 2026-10-03, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: something new is coming (phase 1). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Sat Oct 3", card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
The five things the Founders List gets, exactly as the splash page lists them, and one ask: join it.

## Hook
"Be first through the doors." (Justin's splash kicker). On the card and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-03-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
The 2026-10-02 card's look: deep forest ground, cream type, logo green and lime accents, no amber.
- Top: the stacked `Secondary` logo, as delivered.
- Headline: "Be first through the doors.", "the doors." in logo green.
- A lime rule, then "The Founders List gets" and the five splash benefits, word for word, each with a logo green square: "First access to Founding Memberships", "Priority invitations to our Soft Opening", "Opening date + construction updates", "Early access to launch events & leagues", "Founders-only giveaways and previews".
- A logo green block: "Join the Founders List."
- Foot: foremotiongolf.com.

## Sources and truth
- The five benefits and the hook are the splash page's strings (`content-facts.md`, "Splash page copy"), quoted exactly on the card; the captions spell "+" and "&" as "and".
- Never said: an opening month or day, a count of Founders, any price, any membership name, anything about the Founders Cup.

## AI
No AI voice or visuals. No video, so no music.

## Build
HTML card rendered to PNG with Playwright: `node source/build.mjs` (from `source/`), copied from the 2026-10-02 script, which also writes `source/card.html`, the trimmed logo and `source/contrast.json` (lowest pair 5.45:1, all at or above 4.5:1). It fails if any benefit wraps to a second line. Fonts: Oswald Bold for the headline and button; Bahnschrift for the list and URL, standing in for Barlow, which is not installed on the build machine.

## Questions for Alex
None.
