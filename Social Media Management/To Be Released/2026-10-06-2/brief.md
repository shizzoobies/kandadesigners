# Brief: Above the fold: 4 things a visitor needs in 5 seconds

Slot: Tue 2026-10-06, 4:00 PM Eastern. Instagram carousel (POST, 7 slides at 1080x1350) and a Facebook slide video (POST, 22s, music bed `music-w1006-c`).
Pillar: tip (web design day). Second post of the day.

## What the viewer gets
The four things a first screen has to say before anyone scrolls (what you do, where, proof, the next step). Each is shown marked up on a real phone capture of K&A's own homepage, where all four now fit above the fold. It ends with a test they can run on their own site today: look at your homepage on your phone for 5 seconds, then look away; could a stranger name all four?

## History
- The first capture (2026-09-25) had no proof on the first screen: the "5.0 stars across 8 Google reviews" line sat 11,090 px down.
- Alex then added a hero proof line (five stars, "5.0 on Google, 8 reviews"; screen readers hear "Rated 5.0 on Google, 8 reviews"). At first it sat 34 px below the iPhone 13 fold.
- Alex chose to lift it (site commit e3dba5e). The line now sits between the intro and the buttons, with tighter spacing on phones.
- Re-captured from the live site with a cache-busting query, 390 x 664, the whole first screen now holds all four:
  - proof: 566 to 589 px
  - "Start a project": 613 to 660 px
  - "Call" (header): 18 to 62 px
  - the intro paragraph: 404 to 550 px
- The post says 4 of 4.

## Hook
"Above the fold: 4 things a visitor needs in 5 seconds." with "Ours has all 4. Swipe to see where each one sits."

## Look
A designer's redline sheet: a faint rust grid on cream and crop marks around the flat phone capture (no device frame, unlike last week's device mockups). Rust boxes with square number tags mark each item, and a dashed rust fold line is labeled "The fold: 664 px on an iPhone 13". Verdicts sit in a dark teal bar. Amber is used only for highlights. Every slide carries the K&A logo, ka-performancefl.com, the slide count and a swipe cue.

## Slides
1. Hook: the marked-up capture with all four boxed, the list of four, and "Ours has all 4."
2. What you do: on the first screen, under the headline. "crafts fast, animated, AI-ready websites" is boxed 1.
3. Where: on the first screen. "Gainesville, Florida" is boxed 2.
4. Proof: on the first screen. Five stars and "5.0 on Google, 8 reviews", between the intro and the buttons, are boxed 3.
5. The next step: on the first screen. "Call" in the header and "Start a project" (613 to 660 px, inside the 664 px fold) are boxed 4.
6. Score: 4 of 4, plus the 5-second test.
7. CTA: "Want a first screen that does all four?" ka-performancefl.com/services/web-design, Call Alex 904-210-1071.

## Sources
- Capture: `source/capture.mjs` (Playwright `devices["iPhone 13"]`: 390 x 664 CSS px, device scale 3).
  - It loads the live https://ka-performancefl.com/ with a cache-busting query (`?v=<timestamp>`, recorded as `fetched` in capture.json), status 200.
  - Outputs: `source/captures/home-fold.png`, `home-fold-plus.png` and `capture.json`.
  - capture.json holds every position used: the hero proof line `.hero-proof`, the exact text boxes of "crafts fast, animated, AI-ready websites" and "Gainesville, Florida" (measured with DOM ranges), the headline, Call and Start a project.
  - The build reads every number from capture.json and decides 4 of 4 from it. Nothing is typed by hand.
- `source/captures/home-scroll-1.png` (one scroll down) is kept for reference only and is not used: it shows a client site in the homepage's project carousel.
- "5 seconds" refers to the five-second test, a standard usability method (show a page for five seconds, then ask what it was about). It is presented as a test to run, not as a measured attention span.
- The CTA link https://ka-performancefl.com/services/web-design/ returned 200 on 2026-09-25 (capture.json, ctaStatus).
- No client site appears. No AI voice or AI visuals. The Facebook video's music is AI generated and disclosed in facebook.md. Instagram gets still slides with no music, so it has no music line.

## Music
`music-w1006-c`: a new ElevenLabs music_v2 track, airy and bright with light percussion (open tuned acoustic with harmonics, kalimba counter melody, shaker, rim clicks, soft cajon, about 98 bpm, no vocals).
- Generator: `D:\kap-reel\scripts\social\2026-10-06\music.ts gen c`.
- Logged in `D:\kap-reel\config\audio.json` (set `social-w1006`) and `D:\kap-reel\LICENSING.md`.
- It passed the first second, silence, clipping and ending checks. The vocal check transcribed zero words.
- Slide video: -14.0 LUFS integrated, -1.5 dBTP.

## Build
From `source/`, run `node capture.mjs` and then `node build.mjs`. Then run `node tools/slideshow.mjs 2026-10-06-2 --music "D:\kap-reel\out\candidates\music-w1006-c.mp3"`. Contact sheets: `source/contact-sheet.png` (slides) and `source/slideshow-contact-sheet.jpg` (video at 0.5 s).

Approved: yes (week plan plans/2026-10-05.md, Alex 2026-09-25)
