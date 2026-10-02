# Brief: What a Founding Membership is

Slot: Thu 2026-10-15, 10:30 AM Eastern. Instagram feed carousel (five swipe slides at 1080x1350); Facebook gets a slide video of the same slides, made by the finisher.
Pillar: the reveal (phase 5), in its no-price form. The plan is `plans/2026-10-02-founders-funnel.md`, slot "Thu Oct 15"; the build brief is `plans/2026-10-02-founders-funnel-build-brief.md`, "Oct 15 and 16 (agent G), no-price form".
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
A plain answer to "what is a Founding Membership", in Justin's own FAQ words: what it is, what it includes, the four options by name and term, and that the Founders List gets first access. No prices, no sales date.

## Hook
"What a Founding Membership is." On slide 1 and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-15`. Instagram says link in bio; hashtags under `## First comment`. The Agreement line is the last body line of both captions.

## The slides
Dark slides on deep forest (#152F0F) with the `Secondary` logo; cream slides (#FAF8F2) with the `Primary_Light` logo, alternating for contrast between slides. foremotiongolf.com at the foot of every slide.
1. (dark) "What a Founding Membership is." Sub: "A limited prepaid membership offered before Fore Motion Golf officially opens."
2. (cream) "What it includes." Simulator hours (reserved bay time); membership benefits; early access; Founder recognition; priority opportunities during the membership term.
3. (dark) "Four options." Founding Practice, 6 months; Founding Club, 6 months; Founding Tour, 6 months, the premier individual membership; Founding Corporate Partner, 12 months, for local businesses.
4. (cream) "First access goes to the Founders List." Sub: "Founding Memberships will be limited. The list gets access before the public."
5. (dark) "Be first through the doors." Button "Join the Founders List." Then "Limited availability. Benefits and terms governed by the Founding Membership Agreement."

## Sources and truth
- Slides 1 and 2: Justin's FAQ answer "What is a Fore Motion Golf Founding Membership?" (Founders and Game documents, 2026-09-28), word for word apart from the list layout. "Reserved bay time" under simulator hours is from the same document ("Simulator hours represent reserved bay time, not hours per individual golfer").
- Slide 3: tier names and terms from the build brief's tier facts. "For local businesses" is the build brief's wording for the Corporate Partner.
- Slide 4 sub line and slide 5 headline: approved splash page copy (content-facts.md).
- Never said: any price, a sales date, a total count of Founders, Gold, Platinum, Diamond, Elite, "Best Value", an opening month.

## AI
No AI voice or visuals. Music: finisher (Facebook slide video, `music-fmg-1015-c`).

## Build
HTML slides rendered to PNG with Playwright, JPG via sharp: `node source/build.mjs` (from `source/`), which writes `source/png/slide-01.png` to `slide-05.png`, `media/slide-01.jpg` to `slide-05.jpg`, `source/slides.html`, the two trimmed logos and `source/contrast.json` (lowest pair 5.01:1, primary green #357A16 on cream for the cream slides' accent words; all at or above 4.5:1). Contact sheet: `source/contact-sheet.png`. Fonts: Oswald Bold for headlines; Bahnschrift for body, standing in for Barlow, which is not installed.
Facebook slide video: finisher. The slides are scoped to `["instagram"]` in post.json until `tools/slideshow.mjs` runs with the track.
No-price form: when Justin confirms prices and the sales date, this day is rebuilt with prices by a later job.

## Questions for Alex
None.
