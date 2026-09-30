# Brief: Alt text: describe the picture in one sentence (carousel)

Slot: Sat 2026-10-17, 12:00 PM Eastern. Instagram carousel (POST, 7 slides at 1080x1350) and a Facebook slide video (POST, 22.0 s, music bed `music-w1017`). No LinkedIn, no YouTube Short (weekend).
Pillar: tip (web design, accessibility). Link: https://ka-performancefl.com/services/web-design/ (Facebook line 2, Instagram link in bio).

## What the viewer gets
How to write alt text for the pictures on their own site, in five short "galleries": what it's for (a screen reader reads it, and it shows when the picture fails to load), the one-sentence rule (who or what, and what's happening), what not to write ("image of", a file name, a paragraph), when to leave it empty (decoration, or a picture that repeats the words beside it: `alt=""`), and where to type it in a typical site editor. Shown on K&A's own site pictures with their real alt text.

## Hook
Slide 1: "Alt text: describe the picture in one sentence." A framed artwork from our home page with a museum wall label beside it that carries its real alt text. "Every picture on your website needs a label like this one."

## Look
Museum wall labels (the plan's format idea): a warm stone gallery wall with a spotlight wash, walnut frames with white mats, white wall labels in Schibsted and Atkinson with Lenia Mono field names ("Alt text"), numbered gallery signs (Gallery 1 to 5, then Exit), and a dark walnut floor that carries the slide count and swipe cue. Bad examples are marked with an X, the good one with a check (the shapes carry the meaning, not only the color). Distinct from every carousel in the used list. Every slide: K&A logo and ka-performancefl.com at the top. Working colors: wall #E6DFD3, walnut #3B2A1E, floor #2B231D, gallery green #0B5D4B, with the brand ink, rust, cream and dark teal. No purple, no cobalt, no pills, no em dashes. Contrast computed from the rendered slides (`source/contrast.json`): 111 text runs, 22 distinct pairs, lowest 5.52:1 (rust kicker on the wall, large text), no failures.

## Slides
1. Hook. Jon Marc's dance-lettering heel from our home page, framed, with its label: `alt="A high heel composed of black dance lettering, including spins, right turn, and all night."` Tag "Real: our site".
2. Gallery 1, what it's for: "Two times the words are all anyone gets." Screen reader; picture fails to load. Real: our home page with pictures turned off, the empty box showing the course cover's alt text.
3. Gallery 2, the one-sentence rule: "Say who or what is in it, and what's happening." Bobbie Connor's Hope & Harry moose illustration from /artists/bobbie/ with its real alt text highlighted in three parts (who, what's happening, the detail), plus the story line printed beside it on the page. "The page tells the story. The alt text only says what a sighted visitor sees."
4. Gallery 3, what not to write: drawn pie and coffee. Crossed out: `alt="Image of food"`, `alt="IMG_2041.jpg"`, a paragraph. Checked: `alt="A slice of cherry pie beside a mug of black coffee."` All labeled "Drawn examples".
5. Gallery 4, when to leave it empty: `alt=""`, said once, plainly: decoration, or a picture that only repeats the words next to it. Real: our team page, where each portrait sits right above the printed name with an empty alt. "Don't delete the alt entirely."
6. Gallery 5, where to type it: a drawn, simplified site editor with the Alt text box, labeled "Drawn example", and four steps.
7. CTA, the Exit sign: "Want a website everyone can use?" Alt text in four lines; "We design and build websites in Gainesville, Florida, and measure our pages against WCAG 2.2 AA before launch. Quotes are always free." Call Alex 904-210-1071. ka-performancefl.com/services/web-design.

## Sources and truth
- `source/facts.md` traces every real picture, alt text and CTA line. Captures (2026-09-30, read-only): `source/survey.mjs` (the live page source of all 31 sitemap pages, `captures/html/`, `captures/alt-survey.json`), `source/capture.mjs` (the art files as served, the images-off home page, the team page row, `captures/facts.json`). `build.mjs` refuses to build if any quoted alt text or the story line no longer matches the saved source.
- The artwork on slides 1 and 3 is by K&A's artists (Jon Marc, Bobbie Connor), shown as served on our site. The home page's course covers use the course guide art, which is AI generated (`docs/training-upgrades/course-guide-concept.md` in the site repo), so slide 2 shows that card only with images turned off (its alt text, no picture); no AI visuals appear in the post.
- No client site is shown. The drawn pie, coffee, bad alts and site editor are labeled.
- No promised results. The screen reader lines are general practice; "some screen readers" is hedged on purpose.
- Link: https://ka-performancefl.com/services/web-design/ returns 200 (checked 2026-09-30, with the Facebook utm tag).

## Music
`music-w1017`: new ElevenLabs music_v2 track, a light, curious Saturday gallery stroll: strummed Irish bouzouki rhythm, a clean electric guitar melody, walking electric bass, brushed snare and tambourine, about 102 bpm, no vocals. Distinct from every bed in `plans/2026-09-28-music.md`, `music-history.json` and `D:\kap-reel\config\audio.json` (checked 2026-09-30; no bouzouki anywhere yet). Generator `D:\kap-reel\scripts\social\2026-10-17\music.ts`, logged in `config/audio.json` (set `social-w1017`), `LICENSING.md` and `music-history.json`. Passed the first-second, silence, clipping and ending checks; the vocal check transcribed zero words. Slide video: -14.2 LUFS integrated, -1.4 dBTP, 22.0 s.

## AI
ai.voice false, ai.visuals false. The music is AI generated and disclosed in the Facebook caption; Instagram gets still slides, no music line.

## Build
From `source/`: `node survey.mjs && node capture.mjs && node build.mjs`. Then `node tools/slideshow.mjs 2026-10-17 --music "D:\kap-reel\out\candidates\music-w1017.mp3"`. Contact sheets: `source/contact-sheet.png` (slides), `source/slideshow-contact-sheet.jpg` (video at 0.5 s).

Approved: yes (week plan plans/2026-10-19.md, Alex 2026-09-30)

## Questions for Alex
- Our /training/team/ profile portraits use alt text that starts "Portrait of Alex Anderson, ..." which sits close to the "image of" pattern this post warns against. Want those trimmed on the site (for example "Alex Anderson, managing member, design and development") before this runs? The post doesn't show them either way.
