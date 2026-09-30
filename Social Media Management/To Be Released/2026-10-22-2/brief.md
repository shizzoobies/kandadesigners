# Brief: From review to FAQ answer in 4 steps (carousel)

Slot: Thu 2026-10-22, 6:00 PM Eastern. Instagram carousel (POST, 8 slides at 1080x1350)
and a Facebook slide video (POST, 25 s, music bed `music-w1022-c`).
Pillar: ai-launch. Second post of the day; the reel (2026-10-22) runs at 10:30 AM and
its YouTube Short at noon. Link: the paid 90-Day AI Launch,
https://ka-performancefl.com/ai-launch/ (Facebook line 2, Instagram link in bio).

## What the viewer gets
A recipe for turning reviews into website FAQ answers: collect the public reviews, pull
the questions, draft each answer in your voice from your own facts, and check every claim
before it goes live, then publish it on the page where the question comes up. Step 4 is
the point: every sentence in the draft must trace to a fact on the owner's list. The
caption says it plainly: the AI drafts, the owner decides.

## Hook
Slide 1: "From review to FAQ answer in 4 steps." under the kicker "Using AI with your
reviews?", with the card fields Serves: your next customer; Makes: answers to the
questions they already ask; Secret: you check every claim.

## Look
A recipe card on a butcher block counter (the plan's format idea): Lenia Mono card labels
over a double rust rule, faint ruled lines, ingredients with checkboxes, the method one
step per card, "To serve" and a "Chef's note" CTA. Distinct from every carousel on the
used list (including cookbook page and index cards: no book spread, no plain index card
stack). Every slide: K&A logo, ka-performancefl.com, slide count, swipe cue.

## Slides
1. Hook, as above.
2. Ingredients: your public reviews; your own facts (hours, prices, parking, policies); an
   AI tool; one prompt; you, to check every claim before it goes live.
3. Step 1, Collect your reviews. Public reviews only; private messages and anything told
   in confidence stay out. Three fictional reviews. "General guidance, not legal advice."
4. Step 2, Pull the questions. A prompt excerpt, word for word, and output lines 5, 6 and
   8 of the real run ("Real AI run, word for word. 3 of 13 shown.").
5. Step 3, Draft each answer in your voice. The owner's five facts (fictional) and the
   real AI draft for "Can I get a price before I book?", word for word.
6. Step 4, Check every claim. Five claims from the draft, each ticked against its fact
   number. "Can't point to the fact? Cut the sentence." "This draft passed: all five
   claims match. It also left out the nail trims, which don't answer this question. The AI
   drafts. You decide."
7. To serve: publish it on the page where the question comes up. A drawn prices page with
   the checked answer (labeled "Drawn example: a fictional business").
8. CTA: "The AI drafts. You decide." Then: Want help putting AI to work in your business?
   The 90-Day AI Launch. A twelve-week build, one on one with Alex.
   ka-performancefl.com/ai-launch. Call Alex 904-210-1071.

## Sources and truth
- Both AI runs are real, first responses, fresh sessions, no vendor named:
  `source/ai-run.md` (run 2, the draft) and `../2026-10-22/source/ai-run.md` (run 1, the
  questions). `build.mjs` refuses to build unless every AI line, prompt excerpt, review
  and fact shown is in those files word for word.
- Step 4's check was done by K&A and is recorded in `source/ai-run.md`: all five claims
  trace to the facts list. The slide says this draft passed; it does not claim AI drafts
  are always right. The model's note to the owner (why it left out the nail trims) is not
  part of the published answer; slide 7 shows the first paragraph only.
- The business, reviews, facts and the (352) 555 phone number are fictional (555 numbers
  are reserved for fiction) and labeled on every slide that shows them.
- Privacy remarks are general guidance, not legal advice (slide 3 and both captions).
- No statistics, no promised outcomes or time savings. No mention of a long video or L4.
- Offer line checked against the live /ai-launch/ page ("A twelve-week build, one on one
  with Alex"); no price shown. Links checked 200: `../2026-10-22/source/link-check.md`.
- Text contrast computed, 21 pairs, lowest text pair 6.27:1 (rust on the prompt block);
  stars are graphics at 3.19:1 against a 3:1 need: `source/contrast.json` (script
  `source/contrast.mjs`).

## Music
`music-w1022-c`: new ElevenLabs music_v2 track, warm and homey Thursday evening: a clean
archtop jazz guitar chord melody in a gentle bossa groove, soft flute answers, round
upright bass, shaker and rim clicks, about 92 bpm, no vocals. Generator
`D:\kap-reel\scripts\social\2026-10-22\music.ts`, logged in `D:\kap-reel\config\audio.json`
(set `social-w1022`), `D:\kap-reel\LICENSING.md` and `music-history.json`. Passed every take
check on the first take; zero words in the vocal check. Slide video: -14.0 LUFS
integrated, -1.6 dBTP.

## Constraints
No em dashes. US English. No AI voice or visuals (ai false/false). The music is AI
generated and disclosed in the Facebook caption; Instagram gets still slides, no music
line. Both captions carry "General guidance, not legal advice." No YouTube pointer (the
plan puts none on Thursday).

## Build
`node source/build.mjs` (slides, contact sheet), `node source/contrast.mjs`, then
`node tools/slideshow.mjs 2026-10-22-2 --music "D:\kap-reel\out\candidates\music-w1022-c.mp3"`.
Contact sheets: `source/contact-sheet.png` (slides), `source/slideshow-contact-sheet.jpg`
(video, 0.5 s).

Approved: yes (week plan plans/2026-10-19.md, Alex 2026-09-30)
