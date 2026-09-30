# Brief: Show it, then let them try it (reel + YouTube Short)

Slot: Wed 2026-10-21. Facebook REEL and Instagram REEL at 10:30 AM Eastern; the same video as a YouTube SHORT at 12:00 PM (per-network `time`), in this folder. L4 is on hold; `2026-10-21-4` is not created and nothing here mentions a long video.
Pillar: training.

## What the viewer gets
The worked-example-then-practice pattern for teaching any skill, in three steps: watch one done (a finished example and why each part is there), do one with hints (build one with the pieces and labels in front of you), do one alone (a new problem, nothing to lean on). All three steps are shown on real screens from one K&A sample course, "The RFI that gets answered", which runs in exactly that order. It closes on how we build a module, quoted from our training page, and the six free sample courses. No statistics about retention or attention.

## Hook
"Show it, then let them try it." on screen from frame 0; the three ruled rows (1 Watch one done, 2 Do one with hints, 3 Do one alone) finish writing in by frame 24 (0.8 s).

## Format and look
24.5 s vertical, 1080x1920, 30 fps. Text led, no narration, music bed only. A handwriting practice sheet: cream paper, a rust margin line, ruled rows with a dashed midline. The three steps are written the way a practice sheet teaches letters: step 1 in solid ink (shown in full), step 2 in gray letters with a perforated edge (to trace), step 3 in the learner's own teal ink. Each step writes itself onto its row, then its real screen opens in a plain window and pans slowly down it. K&A logo and ka-performancefl.com in the brand row on every frame, inside the safe area. Distinct from the recent reels (planner grid, hand-in desk, search result card, drawn page on a stage, phone screens with a progress row, redaction bars, clapper slate). No pill shapes.

Text contrast computed in `source/contrast.json` (script `../2026-10-21-2/source/contrast.mjs`): 9 pairs, lowest 6.67:1 (muted on the window title bar); the step 2 guide gray on paper is 7.4:1.

## Beats
- 0.0 to 3.6 s, hook: "Show it, then let them try it." Rows 1 Watch one done. 2 Do one with hints. 3 Do one alone. "Real screens from our sample course, The RFI that gets answered".
- 3.6 to 9.0 s, step 1 of 3: "Watch one done." "A finished example, and why each part is there." Screen 5 "Give the answer somewhere to land": the four parts of a practice request, the Question part open ("Make one decision possible."). Caption: "Screen 5: the four parts of a finished request, each with its reason."
- 9.0 to 14.4 s, step 2 of 3: "Do one with hints." "Then they build one, with the pieces and labels in front of them." Screen 7 "A place for every useful detail": a fragment picked up, two of four labeled fields filled. Caption: "Screen 7: pick up a fragment, place it in its field. Distractions stay on the desk."
- 14.4 to 19.2 s, step 3 of 3: "Do one alone." "Then a new problem. No pieces, no labels." Screen 8 "Try the method on a different issue": a duct that does not fit above the corridor ceiling, and an empty box. Caption: "Screen 8: a different issue and an empty box."
- 19.2 to 24.5 s, CTA holds: "Show it, then let them try it." with the three rows; the quote "A single topic taught properly: objectives, teaching, practice, check." (How we build a module, from our training page); panel "Six original courses. Open them and try the work." ka-performancefl.com/training, Call Alex 904-210-1071.

## Sources and truth
- Captures: live site, 2026-09-30, `D:\kap-reel\scripts\social\2026-10-21\capture.mjs` (Playwright, 430x932 at 3x, reduced motion). Copies plus `captures.json` (url, time, every step taken, text read from the page) in `source/captures/`.
  - `rfi-worked.png`: https://ka-performancefl.com/training-samples/rfi/ , Next 4 times to screen 5, as it opens (Question part selected).
  - `rfi-hints.png`: screen 7, the question and references fragments placed in their fields, then the impact fragment picked up. The page reads "Picked up. Choose the field where this fragment belongs." and "2 of 4 fields filled."
  - `rfi-alone.png`: screen 8, "Try the method on a different issue" opened; the box is empty (its placeholder reads "Please confirm...").
  - Floating site chrome was hidden for the shots only; nothing inside any screen was changed.
- The screen numbers (5, 7, 8 of 9) are the course's own order, so the reel shows the pattern as the course runs it.
- CTA lines: https://ka-performancefl.com/training/ , saved in `source/training-page.md` ("Standard modules: A single topic taught properly: objectives, teaching, practice, check." and "Six original courses. Open them and try the work.").
- The three-step pattern is standard instructional design practice (worked example, guided practice, independent practice). No numbers, no promised results, no retention or attention claims.
- Links checked 200 on 2026-09-30: `source/link-check.md`.

## YouTube Short
Title: "Teach any skill: watch one done, do one with hints, then one alone" (66 characters). Tags: instructional design, worked examples, practice activities, eLearning design, corporate training, course design. Category HOWTO_STYLE, 12:00 PM, no playlist (Wednesday). `youtube.md`: hook, the tagged /training/ link (utm_source=youtube, utm_campaign=2026-10-21), two sentences, "The music is AI generated.", and the template footer. The thumbnail is scoped to Facebook and Instagram; YouTube gets the video only. Same video and same track, one use under the 30-day rule.

## Music
`music-w1021-r`: new ElevenLabs music_v2 track, patient and encouraging indie pop, about 100 bpm, call and response: a clean electric guitar with amp tremolo plays a short phrase and a soft harmonica plays it back, strummed acoustic, round electric bass, tambourine on the backbeat, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-21\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1021`) and `D:\kap-reel\LICENSING.md`. Passed every take check on the first try (32.04 s, no leading or mid silence, clean ending); the vocal check transcribed zero words. Delivered reel: -13.9 LUFS integrated, -1.4 dBTP true peak.

## Build
`D:\kap-reel\src\social\2026-10-21` (own entry, composition Social1021ShowVertical), rendered with `node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-10-21/index.ts Social1021ShowVertical out/social/2026-10-21/render-vertical.mp4 --concurrency 3`, delivered with `node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-21/deliver.ts`. Contact sheet at 0.5 s: `source/contact-sheet.jpg`.

## AI
No AI voice or visuals (ai false/false). The music is AI generated, disclosed in the Facebook, Instagram and YouTube captions. No AI tool or model named.

Approved: yes (week plan plans/2026-10-19.md, Alex 2026-09-30)
