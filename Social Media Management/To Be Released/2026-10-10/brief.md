# Brief: Photos that work on a small business website (carousel)

Slot: Sat 2026-10-10, 12:00 PM Eastern. Instagram carousel (POST, 7 slides at 1080x1350) and a Facebook slide video (POST, 22.0 s, music bed `music-w1010`). No LinkedIn, no YouTube Short (weekend).
Pillar: tip (web design).

## What the viewer gets
Five photo rules they can apply to their own site this weekend: use your own photos, not stock; every photo shows the product, the place or the people; size it for the space it fills; write alt text that says what's in it; keep words out of the picture. Each rule is shown on K&A's own live site where the site has a real example, and with a drawn example labeled "Drawn example" where it doesn't.

## Hook
"Stock photos make you look like everyone else." Slide 1, with a contact sheet: three stock clichés crossed out, three "could only be you" frames circled. "5 photo rules for a small business website."

## Look
A photo lab contact sheet (the plan's format idea): film strips of frames on cream photo paper, frame numbers in Lenia Mono on the film edge, red grease pencil marks (a circle keeps a frame, an X cuts it; the shapes carry the meaning, not only the color). Distinct from the recent index card, exam paper, swatch, infographic, device mockup, checklist, stopwatch, planner, ticket, route map, trail map, split-flap, magazine, chat window and year planner carousels. Every slide: K&A logo and ka-performancefl.com at the top, slide count and swipe cue at the bottom. Working colors: film black #1D1915, grease red #C8321E (marks only), edge amber #E9A23B, with the brand cream, ink, rust and dark teal. No purple, no cobalt, no pills, no em dashes. Contrast computed from the rendered slides (`source/contrast.json`): 112 text runs, lowest 6.73:1, no failures.

## Slides
1. Hook. Contact sheet, all frames drawn and labeled "Drawn examples": handshake, headset, office towers (X, "Could be anyone"); storefront, pie and mug, three people in aprons (circled, "Could only be you").
2. Rule 1: "Use your own photos, not stock." Two drawn page sketches as prints: handshake hero (X) vs storefront hero (circled). "A recent phone photo in good daylight is a fine place to start."
3. Rule 2: "Show the product, the place or the people." Drawn product and place frames; real: Alex and Kristina's portraits from ka-performancefl.com/training (fresh capture).
4. Rule 3: "Size it for the space it fills." Alex's real portrait file with 400 px dimension marks. Straight off one of our phones: 4,032 x 3,024 px, 3.2 MB. Our portrait: 400 x 400 px, 34 KB, shown 168 px wide on a phone. Bars to scale. Rule of thumb panel.
5. Rule 4: "Write alt text that says what's in it." Drawn storefront with a bad alt (`IMG_0412.jpg`, read out as the file name) and a good one. Real alt text from our site: `alt="Alex Anderson"` (team photo) and `alt="Project Makeover website designed by K & A Performance"` (work photo, quoted only).
6. Rule 5: "Keep words out of the picture." Drawn "GRAND OPENING SALE" banner (X) and the same banner at phone size. Real: our home page on a phone, the headline is live text (an H1), circled.
7. CTA: "Want a website that looks like your business?" Recap of the 5 rules. "We design and build websites in Gainesville, Florida. Quotes are free." Call Alex 904-210-1071. ka-performancefl.com/services/web-design.

## Sources and truth
- `source/facts.md` traces every number and real screen. Captures (2026-09-28, read-only, nothing edited, only cropped): `source/survey.mjs` (every image on 8 pages, `captures/survey.json`), `source/capture.mjs` (hero, portraits, `captures/facts.json`). `build.mjs` refuses to build if the portrait or headline facts change.
- The phone photo figures come from a personal photo file in the site repo; the photo is never shown.
- No stock-photo sites, no client sites shown. The only client name is inside one quoted alt text from our own home page.
- "Quotes are free" is the site's own line (home page meta description).
- Link: https://ka-performancefl.com/services/web-design/ returns 200 (checked 2026-09-28).
- No promised results, speeds or rankings. "Search engines use it too" and the screen reader lines are general practice, not measured claims.

## Music
`music-w1010`: new ElevenLabs music_v2 track, sunny Saturday midday indie pop with a light West African highlife feel, about 112 bpm, two clean electric guitars picking interlocking high lines, bouncy melodic bass, rimshot, shaker, soft cowbell, no vocals. Distinct from every bed in `plans/2026-09-28-music.md`, `music-history.json` and `config/audio.json` (checked 2026-09-28, including this week's w1001-p, w1015 and w1016 beds). Generator `D:\kap-reel\scripts\social\2026-10-10\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1010`) and `D:\kap-reel\LICENSING.md`. Passed the first-second, silence, clipping and ending checks; the vocal check transcribed zero words. Slide video: -14.0 LUFS integrated, -1.3 dBTP, 22.0 s.

## AI
No AI voice or visuals (ai false/false); the drawings are hand-built SVG. The music is AI generated and disclosed in the Facebook caption; Instagram gets still slides, no music line.

## Build
From `source/`: `node survey.mjs && node capture.mjs && node build.mjs`. Then `node tools/slideshow.mjs 2026-10-10 --music "D:\kap-reel\out\candidates\music-w1010.mp3"`. Contact sheets: `source/contact-sheet.png` (slides), `source/slideshow-contact-sheet.jpg` (video at 0.5 s).

Approved: yes (week plan plans/2026-10-12.md, Alex 2026-09-28)

## Questions for Alex
- Slide 4 quotes the size of a personal phone photo that sits in the site's public images folder (`public/images/img_4294.jpeg`, 4,032 x 3,024 px, 3.2 MB; the picture is never shown). OK to quote it, or swap in another phone photo's numbers?
