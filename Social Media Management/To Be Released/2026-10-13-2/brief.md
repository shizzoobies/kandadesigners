# Brief: Buttons that get clicked, 5 rules (carousel)

Slot: Tue 2026-10-13, 4:00 PM Eastern. Instagram carousel (POST, 7 slides at 1080x1350) and a Facebook slide video (POST, 22 s, music bed `music-w1013-c`).
Pillar: tip (web design day). Second post of the day; the reel (2026-10-13) runs at 10:30 AM.
Link: https://ka-performancefl.com/services/accessibility/ (returned 200 on 2026-09-28); the CTA is the audit that page sells.

## What the viewer gets
Five rules for a button people actually click, each shown on K&A's own site with the real number: the label says what happens, one main button per screen, at least 44 by 44 px, label contrast of 4.5:1 or more, and reachable by keyboard. Rule 5 ties back to L1, the Tab key video, with the YouTube line in every caption.

## Hook
Slide 1: "Buttons that get clicked." "Five rules, each one checked on our own site with real numbers." Under it, the real Start a project button with dimension lines (148.7 px by 47 px), 5.29:1, Tab stop 5.

## Look
A technical drawing sheet: warm drafting paper with a faint grid, a double sheet border, rust dimension lines, drawing notes in Lenia Mono, and a title block along the bottom (drawing name, rule, sheet number, swipe cue). Not used before (the used list runs from index cards to year planner). Logo and ka-performancefl.com at the top of every slide. Three fonts only: Schibsted Grotesk, Atkinson Hyperlegible Next, Lenia Mono. Pass marks in green, fail marks in ink, no pill shapes in anything drawn (the site's own pill buttons appear only in real captures).

## Slides
1. Hook, the measured Start a project button, and the five rules as drawing notes.
2. Rule 1, the label says what happens: drawn vague labels (Submit, Click here, Learn more) against specific ones (Book a table, Get a free quote, See this week's menu); our real button, "It says what you are starting."
3. Rule 2, one main button per screen: a drawn phone with three loud buttons against a real capture of our home page's first screen on a phone (one filled, one outline).
4. Rule 3, big enough to tap: a 44 px target beside our real button at 3 : 1; the WCAG 2.5.8 (24 px minimum) and 2.5.5 (44 px) note; a table measured on our home page on a phone: Start a project 148.7 x 47, What we do 127.4 x 47, Menu button 44 x 44, Chat with Kai 56 x 56.
5. Rule 4, it passes contrast: a drawn amber button with a white label (3.19:1, fails) and an ink label (5.29:1, passes), the luminance calculation, and ours: ink #221C15 on amber #D97706, 5.29:1.
6. Rule 5, reach it by keyboard: two real captures, before and after 5 Tab presses, with the focus outline (2 px solid rust, 3 px gap, 6.73:1 against the page). "The full Tab key test is on our YouTube: @KAPerformancefl".
7. CTA: "Want your buttons checked?" We audit real pages with real numbers and fix what fails, or your developer does (wording from /services/accessibility/). Recap of the five rules. ka-performancefl.com, Call Alex 904-210-1071.

## Sources and truth
- Every number on the slides is read from files, not typed: `source/site-buttons.json` (`source/measure-site.mjs`: every button-styled control on /, /services/web-design/, /services/accessibility/ and /contact/ at 390 and 1440 px wide, with size, colors and computed contrast, plus a 40-stop Tab walk with each focus outline) and `source/captures/buttons.json` (`source/capture-buttons.mjs`: the button row, before and after Tab, at 3x). Both run on the live site 2026-09-28; nothing was clicked or submitted. `build.mjs` stops if Start a project is under 44 px or 4.5:1.
- Captures in `source/captures/` are unedited and cropped: the button row and the first screen of the home page on a phone (no client showcase in frame).
- The vague and specific buttons, the three-button phone and the white-label button are drawn and labeled "Drawn example". The white-on-amber label fails on purpose, labeled "Fails" on the slide, like the Sept 29 contrast post; it is the only failing pair and is marked as deliberate in `source/contrast.json`. Every other text pair is computed there and passes (lowest: ink on amber, 5.29:1).
- WCAG references: 1.4.3 Contrast (Minimum), 2.5.5 Target Size (Enhanced), 2.5.8 Target Size (Minimum). No statistics, no promised results.
- No AI voice or visuals (ai false/false). The music is AI generated and disclosed in the Facebook caption; Instagram gets still slides and no music line.

## Music
`music-w1013-c`: new ElevenLabs music_v2 track, playful and clicky indie pop, about 118 bpm, envelope filter clean electric on the offbeats, a high plucked acoustic melody, claves and cowbell, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-13\music.ts gen c`, logged in `D:\kap-reel\config\audio.json` (set `social-w1013`) and `D:\kap-reel\LICENSING.md`. Passed every take check; zero words in the vocal check. The raw bed's slide video hit -0.9 dBTP, so its peaks were limited into `D:\kap-reel\out\social\music-w1013\mastered\music-w1013-c.wav` (same track id). Slide video: -14.6 LUFS integrated, -1.7 dBTP.

## Build
`node measure-site.mjs && node capture-buttons.mjs && node build.mjs` (from `source/`), then `node tools/slideshow.mjs 2026-10-13-2 --music "D:\kap-reel\out\social\music-w1013\mastered\music-w1013-c.wav"`. Contact sheets: `source/contact-sheet.png` (slides), `source/slideshow-contact-sheet.jpg` (video, 0.5 s). Slide alt text: `source/slide-alts.json`.

Approved: yes (week plan plans/2026-10-12.md, Alex 2026-09-28)

## Questions for Alex
- Our own site has a few small controls the post does not show: the project showcase dots are 8.8 to 11.9 px (inactive dots 1.44:1 against the page), "Play 30-second sample" is 40 px tall, and the skip link is 43.4 px tall (numbers in `source/site-buttons.json`). The Previous and Next project arrows next to the dots are 44 px, and the post only claims the buttons it measures. Want a site fix queued to bring those to 44 px?
