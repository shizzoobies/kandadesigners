# Brief: Read your reviews the way your next customer does (reel + YouTube Short)

Slot: Mon 2026-10-19. Facebook REEL and Instagram REEL at 10:30 AM Eastern; the same video as a YouTube SHORT at 12:00 PM (per-network `time`).
Pillar: tip (Monday: local search). Thursday 10/22 takes the AI side of reviews; this is the local search side.

## What the viewer gets
How a stranger reads a Google profile, shown on K&A's own real reviews: the date on the newest review, whether the owner replied, and one detail they can picture. Then a self check: open your own profile in a private window and check all three.

## Hook
"Read your reviews the way your next customer does." On frame 0, over K&A's profile on a clipboard (5.0, 8 reviews); "They check three things." lands at 1.0 s.

## Format
22.0 s vertical, 1080x1920, 30 fps, text led, no narration, music bed only. Look: a clipboard with a printout of our Google reviews and an amber highlighter that marks each thing as the beat names it (new to the reel list: not a planner grid, hand-in desk, search result card, drawn page on a stage, phone screens, redaction bars or clapper slate). Remotion entry `D:\kap-reel\src\social\2026-10-19\index.ts` (composition `Social1019ReviewsVertical`), delivered by `D:\kap-reel\scripts\social\2026-10-19\deliver.ts`. Logo and ka-performancefl.com in the brand row on every frame, inside the safe area. Every text pair computed in `source/contrast.json` (lowest text pair 5.42:1, the capture label on canvas; stars are graphics at 3.19:1 and the rating is also written as text).

## Beats
- 0.0 to 3.5 s, hook: headline, the profile card (K & A Performance, 5.0, 8 reviews, Website designer) with the newest review under it, "They check three things."
- 3.5 to 8.0 s, 1: "The newest review." S., 5 stars, "3 weeks ago" highlighted, NEW. "Is it recent? A fresh date says people still choose you."
- 8.0 to 12.5 s, 2: "Did the owner reply?" Lisa's review, "Response from the owner a month ago / Thank you so much." highlighted. "A reply shows someone reads them."
- 12.5 to 17.0 s, 3: "One detail they can picture." Bobby's review, "Within a matter of hours we had our first proposal and within days a working demo." highlighted. "A real detail says more than 'great service.'"
- 17.0 to 22.0 s, CTA holds: "Read your own profile like a stranger." "Open it in a private window. Check all three." The three, numbered. Local search is part of every site we build. ka-performancefl.com/services/seo-ai-search. Call Alex 904-210-1071.
- From 0 to 17 s every frame carries "Our real Google reviews, redrawn from our profile. Sept 30, 2026. Names shortened."

## YouTube Short
Same MP4, `youtube.md`, title "Read your Google reviews the way your next customer does" (56 characters), playlist "Quick fixes for your website", category HOWTO_STYLE, 12:00 PM, tags Google reviews, Google Business Profile, local SEO, online reviews, small business marketing, Gainesville web design. The thumbnail is scoped to Facebook and Instagram (a Short sends none).

## Sources and truth
`source/sources.md`. Captured on the build day, 2026-09-30, signed out and cookie free (`source/capture-reviews.mjs`). The Google search answered with its unusual-traffic check, which was not bypassed; the profile's own Google Maps page loaded normally and is the capture used (`source/captures/maps-2026-09-30-*`). Review text, stars, dates and the owner reply are verbatim; the cards are redrawn so names can be shortened (first name, or an initial for the one business reviewer) and profile photos left out (`source/reviews-2026-09-30-names-shortened.json`). The relative dates are as of Sept 30 and the captions say so. No ranking, click or results claims. The link returned 200 on 2026-09-30.

## Music
`music-w1019-r`: new ElevenLabs music_v2 bed, friendly country-tinged indie pop, about 108 bpm, a snappy chicken picking clean electric lead over boom chick acoustic strums, root-fifth picked bass and a brushed train beat, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-19\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1019`), `D:\kap-reel\LICENSING.md` and `music-history.json`. Passed the first-second, silence, clipping and ending checks on the first take; the vocal check transcribed zero words. The Short reuses it (same folder, one use). Delivered reel: -14.0 LUFS integrated, -2.4 dBTP true peak.

## AI
No AI voice or visuals (ai false/false). The music is AI generated; the Facebook, Instagram and YouTube captions say so.

Contact sheet (0.5 s): source/contact-sheet.jpg.

Approved: yes (week plan plans/2026-10-19.md, Alex 2026-09-30)

## Questions for Alex
- Our profile has enough reviews to make the point (5.0, 8 reviews), so the reel uses them, redrawn word for word with names shortened, and labeled on screen. Google's search page blocked the automated capture (not bypassed); the Maps page for the same profile loaded normally. Ship it this way?
- Our newest review (S., 3 weeks old on Sept 30) had no owner reply when captured. The reel does not point that out, but the same-day carousel's first tip is "Reply in public". Do you want to reply to it before Oct 19? The reel does not need a re-render either way.
