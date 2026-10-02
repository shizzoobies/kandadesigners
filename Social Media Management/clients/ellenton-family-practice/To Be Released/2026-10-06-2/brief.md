# Brief: Review, Kim M.

Slot: Tue 2026-10-06, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: reviews. The plan is `plans/2026-10-03-new-patients.md`, slot "Tue Oct 6", card "Review 2".
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
A real patient's Google review, in their own words, whole. One ask: new patients call 941 417 7386.

## Hook
The review itself, caption line 1, in quotation marks.

## Call to action
New patients: call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-06-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
`review` template, sand theme. Logo top center; short moss rule; the whole review in Lora (the template stepped it down to fit, nothing cut); the name line "Kim M."; five stars and "Google review"; familypracticedirect.com at the foot. No booking button (the template's review layout).

## Sources and truth
- The review, the name line and the five star rating: `src/data/reviews.ts`, review 2 of 5 (author "Kim M.", rating 5), quoted character for character, spelling and punctuation untouched ("can not" stays as written). The live homepage shows the same review with five stars.
- No commentary on the review in the caption; nothing of ours echoes it. It mentions a Saturday visit; the caption adds no Saturday or "same-day" claim.

## AI
None. No AI voice or visuals. No video, so no music.

## Build
`node build.mjs card.json` from `source/` (the shared review template, unchanged). Output `media/card.png` 1080x1350; contrast report `source/contrast.json`, lowest pair 4.91:1.

## Questions for Alex
None.
