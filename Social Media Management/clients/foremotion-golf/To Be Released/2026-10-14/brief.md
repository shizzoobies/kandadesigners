# Brief: The four Founding Memberships, side by side

Slot: Wed 2026-10-14, 10:30 AM Eastern. Instagram carousel (POST, 5 slides at 1080x1350) and a Facebook slide video of the same slides (POST), both at 10:30.
Pillar: countdown. The plan is `plans/2026-10-02-founders-funnel.md`, slot "Wed Oct 14", carousel. Built in the lineup-only form: prices and the sales date are not confirmed, so nothing says "revealed tomorrow".
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
All four Founding Memberships compared in one place: term, hours of reserved bay time and spots, then the hours as bars and the spots as tiles. No prices. One ask: join the Founders List for first access.

## Hook
"The four Founding Memberships, side by side." Slide 1 and caption line 1.

## Call to action
Slide 5 and both captions: join the Founders List. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-14`. Instagram says link in bio; hashtags under `## First comment`. The Agreement line is the last body line of both captions.

## The slides
The `2026-10-02` look, alternating deep forest and cream slides for contrast between swipes. Deep forest slides carry the `Secondary` logo, cream slides the `Primary_Light` logo, both as delivered. Every slide carries the Agreement line and foremotiongolf.com at the foot.
1. Hook (deep forest): "Founding Memberships". "The four Founding Memberships, side by side." "Hours of reserved bay time and spots, all in one place." "Swipe to compare".
2. The table (cream): "Side by side." Membership, term, reserved bay time, spots: Founding Practice 6 months, 24 hours, 25 spots; Founding Club 6 months, 48 hours, 25 spots; Founding Tour 6 months, 84 hours, 10 spots; Founding Corporate Partner 12 months, 150 hours, 5 partnerships.
3. Hours (deep forest): "Reserved bay time." Four bars to scale, each with its term, and the about-per-month figure for the three individual tiers.
4. Spots (cream): "Limited spots." Four tiles: 25, 25, 10 spots and 5 partnerships. "Individual Founding Memberships are not reopened once they fill."
5. The ask (deep forest): "First access goes to the Founders List." "Founding Practice, Club, Tour and Corporate Partner." A logo green block: "Join the Founders List."

## Sources and truth
- Tier facts from the build brief and the plan only. "Not reopened once they fill" is content-facts ("individual Founding Memberships (limited; once the allocation is filled they are not reopened)").
- Never said: a price, "revealed tomorrow" or any reveal date, "Best Value", a total count of Founders, a per-month figure for Corporate Partner, Gold, Platinum, Diamond or Elite.

## AI
None. Music: finisher (Facebook slide video, `music-fmg-1014-c`).

## Build
HTML slides rendered with Playwright to PNG masters in `source/png/`, JPG via sharp in `media/`: `node source/build.mjs` (from `source/`), on the `2026-10-02` card script. It writes `source/slides.html`, the trimmed logos, `source/contact-sheet.png` and `source/contrast.json` (lowest pair 5.45:1, all at or above 4.5:1), and stops on an unloaded font, an em or en dash, a price, "Best Value", "tomorrow" or "reveal", or anything outside the 48px safe frame or crowding the logo or footer. Fonts: Oswald Bold and Bahnschrift (standing in for Barlow). Slides are scoped to `"platforms": ["instagram"]`.
Facebook slide video: finisher.
If Justin confirms prices and the sales date before release, slide 1 and the captions can add the plan's "Revealed tomorrow."

## Questions for Alex
None.
