# Brief: Update these 5 things on your Google Business Profile this month

Slot: Mon 2026-10-05, 4:00 PM Eastern. Instagram carousel (POST, 7 slides at 1080x1350)
and a Facebook slide video (POST, 22 s, music bed `music-w1005-c`).
Pillar: tip (Monday: local search). Second post of the day, after the 10:30 reel.

## What the viewer gets
A monthly checklist for their Google Business Profile, five items, each paraphrased from
Google's own help pages with the source URL on the slide: the most specific primary
category, hours plus holiday hours before November, services, fresh photos, and replies
to reviews. Each stop says why it matters for their business. The CTA ties it to K&A:
local search is part of every site we build, with the /services/seo-ai-search/ link.

## Hook
"Update these 5 things on your Google Business Profile this month."

## Look
A route map. A dark teal street map (thin grid, two soft roads) carries an amber dashed
route through five rust map pins; each slide is one stop, in a teal band with the pin
number, the headline in cream and a one line "why" in mint. Below it, an evidence card,
then "Google's help page says" with a rust rule and the source URL. Amber only for the
route, the stop label on teal and highlights. Distinct from last week's index cards, exam
paper, swatch cards, infographic, device mockups, checklist document, stopwatch, planner
page and tickets. Every slide: K&A logo, ka-performancefl.com, slide count, swipe cue.

Evidence is labeled on every card: "Real capture: our own Google profile, Sept 25, 2026"
(teal label, solid card) or "Drawn example" (rust label, dashed card).

## Slides
1. Hook, and the route with the five stops. "Every tip from Google's own help pages.
   Checked on our profile."
2. Stop 1, primary category. Real: K&A's profile header, "Website designer" ringed. Drawn:
   Google's own example, Salon vs Nail salon.
3. Stop 2, hours and holiday hours. Real: K&A's weekly hours as Google shows them. Drawn:
   special hours for Veterans Day (Wed Nov 11, same hours) and Thanksgiving (Thu Nov 26, closed).
4. Stop 3, services. Drawn: Google's own plumbing example (Install faucet, Repair toilet),
   plus one more line and "Add a custom service".
5. Stop 4, fresh photos. Drawn: the photo types Google lists, plus its specs.
6. Stop 5, review replies. Drawn: a four star review and a short owner reply that thanks,
   apologizes and stays specific.
7. CTA: "Local search is part of every site we build." The site's own line (the profile
   should match the website exactly; we do the site side and hand you a short, honest list
   for the rest). Real: K&A's listing (5.0, 8 reviews, Website designer).
   ka-performancefl.com/services/seo-ai-search. Call Alex 904-210-1071.

## Sources
`source/sources.md`: every Google help page URL with a short paraphrase, the capture
details, and the site lines the CTA uses. Captures: `source/capture.mjs` (Playwright, signed
out Google Maps, 2026-09-25 2:25 PM Eastern); raw screens and text in `source/captures/`.
Only tight crops of K&A's own listing are used; the profile's cover photo and owner post
(client work) and other businesses are not. Services, photos and reviews are not visible in
the signed-out view, so those three slides are drawn examples. The link returned 200 on
2026-09-25.

## Music
`music-w1005-c`: new ElevenLabs music_v2 bed, light and optimistic, about 106 bpm, chiming
twelve string acoustic strums with a twangy clean electric lead, soft bass, rim clicks and
tambourine, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-05\music.ts`, logged in
`config/audio.json` (set `social-w1005-mon`) and `LICENSING.md`. Passed every check on the
first take; vocal check zero words. Slide video: -14.2 LUFS integrated, -1.9 dBTP.

## Build
`node source/build.mjs` (from `source/`, or `node build.mjs` inside it): HTML slides to PNG
with Playwright from D:\kap-reel\node_modules, JPG via sharp, plus the reel's pieces. Facebook
video: `node tools/slideshow.mjs 2026-10-05-2 --music "D:\kap-reel\out\candidates\music-w1005-c.mp3"`.
Contact sheet: `source/contact-sheet.png`. The same slides post to LinkedIn as a document
(folder 2026-10-05-3).

## AI
No AI voice, no AI visuals (drawn examples are coded HTML). The music is AI generated and the
Facebook caption says so; the Instagram still slides carry no music, so its caption does not.

Approved: yes (week plan plans/2026-10-05.md, Alex 2026-09-25)

## Questions for Alex
- Stop 2 tells people to set holiday hours, and our own profile shows no special hours for November in the public view. Add Veterans Day and Thanksgiving to the K&A profile before this posts?
- Slide 3 shows our profile's hours exactly as Google lists them, including Saturday 8 AM to 2:30 PM. Are those the hours you want public?
