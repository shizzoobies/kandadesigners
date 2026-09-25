# Brief: When a job aid beats a course

Slot: Wed 2026-10-07, 10:30 AM Eastern. Facebook REEL and Instagram REEL.
Pillar: training. Builds on the Sept 25 job aids video.

## What the viewer gets
A rule a training manager or owner can use this week: if people need something once a quarter, at the moment of the task, a job aid beats a course. Save courses for judgment people need to practice. Then two real job aids from K&A's own sample courses, and where to ask which one a topic needs.

## Hook
"If they need it once a quarter, don't teach it. Hand it to them." (first two lines on frame 0, the third stamps in at 0.5 s).

## Format and look
19 s vertical, 1080x1920, 30 fps. Text led, no narration, music bed only. A year planner of 52 work weeks (4 quarter rows of 13) with one rust week per quarter, then real screens handed in from the right onto a dark teal work surface. K&A logo and ka-performancefl.com in the brand row on every frame, inside the safe area. Distinct from last week's carousel looks and from the Sept 30 editorial reel.

## Beats
- 0.0 to 3.2 s, hook: "If they need it once a quarter, don't teach it. Hand it to them." Planner: "52 work weeks. The task comes up in 4." The four task weeks fill one per quarter.
- 3.2 to 6.2 s: "A course asks them to remember it for 13 weeks." then "A job aid only has to be there on the day." (13 weeks is one quarter row of the planner.)
- 6.2 to 10.2 s: "Four checks before the RFI goes out." Real screen: the "Before you send" checklist from the RFI sample course.
- 10.2 to 14.2 s: "One card, carried on the site walk." Real screen: a learner's finished walk-through card from the safety sample course.
- 14.2 to 19.0 s, CTA holds: "We build courses and job aids. Not sure which it needs? Ask us." Real /training/ panel "Job aids and performance support", ka-performancefl.com/training, Call Alex 904-210-1071.

## Sources
- Captures: live site, 2026-09-25, `D:\kap-reel\scripts\social\2026-10-07\capture.mjs` (Playwright, 430x932 at 3x). Copies and `captures.json` (url, time, size) in `source/captures/`.
  - `rfi-checklist.png`: https://ka-performancefl.com/training-samples/rfi/ , reached by clicking Next to screen 9, "Before you send".
  - `safety-card.png`: https://ka-performancefl.com/training-samples/safety/ , reached by clicking Next (finding the hunt's hotspots to unlock it) to screen 10, ticking one real check per zone, then the "My card" tab.
  - `training-jobaid.png`: https://ka-performancefl.com/training/ , the "Job aids" tab of the capability panel. Also captured, not used: `safety-picker.png`, `training-micro.png`.
  - Floating site chrome (the chat launcher) was hidden for the shots; nothing inside a captured element was changed.
- "Checklists, decision trees, and reference pieces that live next to the work": the /training/ panel copy, `src/data/training.js` deliverables.
- "Keep the four-part check beside your RFI log": the RFI sample's own closing dialog.
- 52 and 13: work weeks in a year and in a quarter. No other numbers.

## Music
`music-w1007-r`: new ElevenLabs music_v2 track, calm and focused, Travis picked clean electric guitar, baritone guitar melody, upright bass, brushes, about 90 bpm, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-07\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1007`) and `D:\kap-reel\LICENSING.md`. Passed the first-second, silence, clipping and ending checks; the vocal check transcribed zero words. Delivered reel: -14.0 LUFS integrated, -2.4 dBTP true peak.

## Build
`D:\kap-reel\src\social\2026-10-07` (own entry, composition Social1007JobAidVertical), delivered with `scripts/social/2026-10-07/deliver.ts`. Contact sheet at 0.5 s: `source/contact-sheet.jpg`.

## AI
No AI voice or visuals (ai false/false). The music is AI generated, disclosed in both captions.

Approved: yes (week plan plans/2026-10-05.md, Alex 2026-09-25)
