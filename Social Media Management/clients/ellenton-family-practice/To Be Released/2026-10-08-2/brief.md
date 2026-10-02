# Brief: Review 3, Ap O.

Slot: Thu 2026-10-08, 5:30 PM Eastern. Facebook and Instagram feed POST, one card at 1080x1350.
Pillar: reviews (a real review every other evening). The plan is `plans/2026-10-03-new-patients.md`, slot "Thu Oct 8. The PA", the 5:30 card "Review 3".
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
A real patient's Google review, in their own words, whole.

## Hook
The review itself, from its first line: "Me and my husband moved to the area 4 years ago and started seeing Dr Kulawik." On the card and as caption line 1.

## Call to action
New patients: call 941 417 7386. The Facebook close carries `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-08-2` (returned 200 on 2026-10-02). Instagram says link in bio; hashtags under `## First comment`.

## The card
`review` template, sand theme, no stars. Logo top center, moss rule, the whole review in Lora (the template's quotation marks), the name line "Ap O.", the label "Google review", familypracticedirect.com at the foot. No button (the review template carries none).

## Sources and truth
- The review: `SITE/src/data/reviews.ts`, the third entry (author "Ap O."), quoted whole and exactly: spelling ("thru", "Dr Kulawik"), punctuation and "Best doctor ever." are the reviewer's own, unchanged. Checked character for character against the source file.
- Name line: "Ap O." as the site shows it.
- Nothing of our own comments on the review or echoes "best". No rating figure or review count.

## AI
None. No AI visuals, voice or music.

## Build
`source/build.mjs` with `source/card.json` (`node build.mjs review card.json` from `source/`), the shared template copied unchanged. Fonts Lora and DM Sans (the site's own variable Fontsource files), all glyphs checked. Contrast report `source/contrast.json`, lowest 4.91:1.

## Questions for Alex
None.
