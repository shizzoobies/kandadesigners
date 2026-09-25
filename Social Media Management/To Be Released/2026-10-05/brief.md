# Brief: 5 Google Business Profile settings most businesses forget

Slot: Mon 2026-10-05, 10:30 AM Eastern. Facebook and Instagram, REEL.
Pillar: tip (Monday: local search).

## What the viewer gets
Five settings to check on their Google Business Profile this month (primary category,
hours and holiday hours, services, photos, review replies), each one from Google's own
help pages, in 17 seconds. The full version with Google's wording is today's 4 PM
carousel (2026-10-05-2).

## Hook
"Your Google profile has 5 settings most businesses forget." Full text on frame 0.

## Format
17.0 s vertical, 1080x1920, 30 fps. Text led, no narration, music bed only. Built in
Remotion from `D:\kap-reel\src\social\2026-10-05` (own entry, Root.tsx untouched), reusing
the carousel's route map and evidence cards (`D:\kap-reel\assets\social\2026-10-05`,
exported by the carousel's `source/build.mjs`). Same look as the carousel: dark teal street
map, rust pins, amber route. K&A logo and ka-performancefl.com in a brand row inside the
safe area on every frame; a progress route of five pins ticks along the bottom.

## Beats
- 0.0 to 2.4 s, hook: headline on frame 0, the route map with the five stops slides in.
- 2.4 to 4.6 s, stop 1: "Pick the most specific primary category." Real crop of K&A's own
  profile with "Website designer" ringed, plus Google's own Salon vs Nail salon example (drawn).
- 4.6 to 6.8 s, stop 2: "Confirm your hours. Add holiday hours now." K&A's real weekly
  hours, plus a drawn special hours card (Veterans Day Nov 11, Thanksgiving Nov 26).
- 6.8 to 9.0 s, stop 3: "List the services you actually sell." Drawn, Google's plumbing example.
- 9.0 to 11.2 s, stop 4: "Add fresh photos of the real thing." Drawn photo types grid.
- 11.2 to 13.4 s, stop 5: "Reply to reviews, the good and the bad." Drawn review and reply.
- 13.4 to 17.0 s, CTA holds: "Local search is part of every site we build.", K&A's real
  listing (5.0, 8 reviews, Website designer), ka-performancefl.com/services/seo-ai-search,
  Call Alex 904-210-1071.

## Sources
Every tip and both real captures: `To Be Released/2026-10-05-2/source/sources.md`
(Google Business Profile Help URLs with paraphrases; K&A's Google Maps listing captured
2026-09-25 by that folder's `source/capture.mjs`). The link, /services/seo-ai-search/,
returned 200 on 2026-09-25.

## Music
`music-w1005-r`: new ElevenLabs music_v2 bed, steady and confident, about 88 bpm half time,
a melodic fingerstyle electric bass leading, clean chorused guitar double stops, rimshot
backbeat, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-05\music.ts`, logged in
`config/audio.json` (set `social-w1005-mon`) and `LICENSING.md`. The raw take had 0.67 s of
leading silence; the first 0.70 s was trimmed and the trimmed bed passed every check (vocal
check: zero words). Delivered reel: -14.0 LUFS integrated, -1.4 dBTP.

## Build
Render: `node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-10-05/index.ts Mon1005GbpVertical out/social/2026-10-05/render-vertical.mp4 --concurrency 3`,
then `node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-05/deliver.ts` (mix, encode,
SRT, thumbnail, copies to media/). Contact sheet at 0.5 s: `source/contact-sheet.jpg`.

## AI
No AI voice, no AI visuals. The music is AI generated and both captions say so.

Approved: yes (week plan plans/2026-10-05.md, Alex 2026-09-25)

## Questions for Alex
- Stop 2 tells people to set holiday hours. Our own profile shows no special hours for November in the public view. Worth adding Veterans Day and Thanksgiving to the K&A profile before Oct 5 so we pass our own check?
- The reel and carousel show our profile's Saturday hours as 8 AM to 2:30 PM, exactly as Google lists them. Are those the hours you want public?
- Stop 3 is about services; our services list is not visible in the signed-out view. Are the Business Profile services from the August local SEO work filled in?
