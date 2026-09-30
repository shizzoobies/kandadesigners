# Brief: Wrong answer? Say why, not just "incorrect" (carousel)

Slot: Wed 2026-10-21, 4:00 PM Eastern. Instagram carousel (POST, 7 slides at 1080x1350) and a Facebook slide video (POST, 22 s, music bed `music-w1021-c`).
Pillar: training. Second post of the day, after the 10:30 AM reel "Show it, then let them try it" and its noon Short. Link: https://ka-performancefl.com/training/ (Facebook line 2, Instagram link in bio).

## What the viewer gets
Five rules for feedback that teaches, each shown on a real wrong answer in one of K&A's five sample courses and the feedback that course gives it: name what went wrong, point at the rule, show the right move, let them retry, keep it short. A training manager or instructional designer can hold their next quiz up against the list. No statistics about retention or attention; the case for each rule is design logic only.

## Hook
Slide 1: "Wrong answer? Say why, not just “incorrect.”" Under it, "Incorrect." struck through in red marker, and the real feedback from our nutrition course magneted to the board, with the marker note "Say what to try, and why."

## Look
A classroom whiteboard with marker notes: an aluminum frame with a marker tray (black, red and green markers and an eraser), marker-color headings in our type, real course screens held on with two magnets. A cream header strip carries the K&A logo and ka-performancefl.com on every slide; slide count and swipe cue on every slide. Distinct from every carousel look used so far (the list in the build brief). No pill shapes.

Text contrast computed in `source/contrast.json` (script `source/contrast.mjs`): 12 pairs, lowest 6.73:1 (rust swipe cue on the canvas). Text inside the real screens is the live site, unedited.

## Slides
1. Hook, as above. "5 rules, each shown on a real wrong answer in one of our sample courses."
2. Rule 1, Name what went wrong: "Not just that it is wrong, but which part. Then the learner fixes the right thing." The RFI that gets answered, screen 7: a complaint placed in References and a lobby paint question in Proposal; "Needs another pass: References, Proposal. Match each field to its job. Complaints and unrelated questions stay out of this request." Note: "It names the two fields that need another pass."
3. Rule 2, Point at the rule: "Send them back to the idea that decides the answer, so the next try comes from the rule, not a guess." Strong is a skill, screen 5: "Rising from a low chair" placed in Hinge; "Try a different station. Notice whether the task lowers and rises, moves mainly at the hips, pushes, pulls or travels with a load." Note: "It points at the five movement patterns."
4. Rule 3, Show the right move: "When the method is the lesson, show the working, so they can see where their number went off." The P&L, read like an owner, desk check 3 of 3: 5000 entered; "Recheck the figures. $80,000 less $36,000 COGS less $43,000 operating expenses leaves $1,000." Note: "It shows the working, step by step."
5. Rule 4, Let them retry: "Mark the miss, leave it open, and ask for another go. The full explanation comes once they get it." Spot it before it hurts someone, screen 8: protective equipment placed at the open second-floor edge; "Revisit this placement. Read the situation and try a different control." Note: "The control can be moved. Try a different one."
6. Rule 5, Keep it short: "What to try, then why, in a line or two. Then get out of the way." Build the plate, skip the diet, screen 4: brown rice placed on the protein quarter; "Try another part of the plate. Brown rice is a whole grain. It retains its bran and germ." Note: "Brown rice on the protein quarter: three short sentences."
7. Recap of the five rules, then CTA: "We write this kind of feedback into the courses we build. Try our sample courses, free on the site." ka-performancefl.com/training, Call Alex 904-210-1071.

## Sources and truth
- Captures: live site, 2026-09-30, `D:\kap-reel\scripts\social\2026-10-21\capture.mjs` (Playwright, 430x932 at 3x, reduced motion). Copies plus `captures.json` (url, time, every step, and each feedback line read from the page) in `source/captures/`. Every wrong answer was given the way a learner gives it (picking up and placing, typing, pressing Check); the feedback is the course's own text. Crops are by css coordinates in `source/build.mjs`; nothing inside a screen was changed.
  - `fb-rfi.png`: https://ka-performancefl.com/training-samples/rfi/ screen 7, then "Send to practice review".
  - `fb-strength.png`: https://ka-performancefl.com/training-samples/strength/ screen 5, task 1 of 10 placed on Hinge.
  - `fb-finance.png`: https://ka-performancefl.com/training-samples/finance/ screen 8, calculation 3 of 3, 5000 typed (the answer with production cost left at 40%), then "Check calculation".
  - `fb-safety.png`: https://ka-performancefl.com/training-samples/safety/ screen 7 hazard hunt completed (Next is held until then), screen 8 Control workbench, all six controls placed with two swapped, then "Review my plan" ("4 of 6 controls matched.").
  - `fb-nutrition.png`: https://ka-performancefl.com/training-samples/nutrition/ screen 4, food 3 of 8 (brown rice) placed on the protein quarter.
- Rule 4's "the full explanation comes once they get it": in the safety course, a matched placement opens "Why this control works" with the reason (`safety` activity code, "Matched. ..." feedback); a miss gets the retry prompt.
- Course names from https://ka-performancefl.com/training/samples/ . Links checked 200: `../2026-10-21/source/link-check.md`.
- The five rules come from the approved plan. No numbers beyond those on the course screens, no promised results.

## Music
`music-w1021-c`: new ElevenLabs music_v2 track, reassuring and unhurried indie pop, about 92 bpm, a hollow-body clean electric guitar melody with soft slides over Hammond organ chords with a slow rotary, fingerpicked acoustic, melodic electric bass, soft kick and cross-stick, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-21\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1021`) and `D:\kap-reel\LICENSING.md`. Passed every take check on the first try; zero words in the vocal check. Slide video: -14.3 LUFS integrated, -2.0 dBTP true peak.

## Build
`node source/build.mjs` (from `source/`), `node source/contrast.mjs`, then `node tools/slideshow.mjs 2026-10-21-2 --music "D:\kap-reel\out\candidates\music-w1021-c.mp3"`. Contact sheets: `source/contact-sheet.png` (slides), `source/slideshow-contact-sheet.jpg` (video at 0.5 s).

## AI
No AI voice or visuals (ai false/false). The music is AI generated and disclosed in the Facebook caption; Instagram gets still slides, no music line. No AI tool or model named.

## Questions for Alex
- Possible site bug found while capturing (not in this post): in the finance sample's desk check, calculation 1's feedback rendered as "$48,000 $80,000 100 = 60%", with the division and multiplication signs missing, in our capture browser (Chromium). It may be the page font lacking those two glyphs. This post uses calculation 3 instead. Worth a look in a normal browser, and a site fix if it shows there too?

Approved: yes (week plan plans/2026-10-19.md, Alex 2026-09-30)
