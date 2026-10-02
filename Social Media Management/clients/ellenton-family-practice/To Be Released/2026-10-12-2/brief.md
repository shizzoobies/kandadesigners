# Brief: Review 5, Chris

Slot: Mon 2026-10-12, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: reviews (a real review every other evening). The plan is `plans/2026-10-03-new-patients.md`, slot "Mon Oct 12. Sick visits", card "Review 5".
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
The fifth of the five Google reviews published on the site, whole, in the reviewer's own words, with the name line as the site shows it.

## Hook
The review itself, whole, as caption line 1 and on the card.

## Call to action
New patients call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-12-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
`review.html`, sand theme, five stars (matching Reviews 1 to 4): logo top center, the review in Lora with the template's curly quotation marks, the name line "Chris", the stars and the "Google review" label, familypracticedirect.com at the foot. No commentary of ours on the card.

## Sources and truth
- Review text and name line: `D:\Ellenton Family Practice Rebuild\src\data\reviews.ts`, the fifth entry, quoted whole and exactly (no closing period, as written). The name line is "Chris" with no initial, exactly as the live homepage shows it (checked 2026-10-02). Rating 5 from the same entry.
- The review names "Stephanie", a staff member; that is the reviewer's wording, quoted whole, and nothing of ours repeats or expands on it.
- Caption: the review, the name line, "Read more on our Google listing." and the close. No commentary.

## AI
None. No AI visuals, no AI voice. No video, so no music.

## Build
`source/card.json` rendered with the shared template: `node build.mjs card.json` from `source/`. Fonts: Lora and DM Sans (the site's own Fontsource files). Contrast lowest 4.91:1 (`source/contrast.json`).

## Questions for Alex
None.
