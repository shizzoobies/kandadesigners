# Brief: One module, one objective (carousel)

Slot: Wed 2026-10-14, 4:00 PM Eastern. Instagram carousel (POST, 7 slides at 1080x1350) and a Facebook slide video (POST, 22 s, music bed `music-w1014-c`).
Pillar: training. Second post of the day, after the 10:30 AM reel "Training everyone can take". L3 (the long YouTube video, folder 2026-10-14-4) runs at 11:00 AM and is not part of this build.

## What the viewer gets
A method a training manager or instructional designer can use on the next long course: four steps to split it into short modules that each teach one thing (start from the job, one objective per module written as one sentence, every screen serves it, the learner does the thing before the module ends), then order the modules the way the work happens. Shown on a real K&A sample course, with a three-question check to save. No statistics about attention spans or retention anywhere; the case for one objective is design logic only.

## Hook
"One module, one objective." Slide 1, over three paper pieces cut apart on a cutting mat.

## Look
A green self-healing cutting mat with its grid and ruler ticks, cream paper strips cut along dashed amber lines with drawn scissors, and real screens taped down with amber tape. A cream header strip carries the K&A logo and ka-performancefl.com on every slide; slide count and swipe cue on every slide. Distinct from every look used so far (index cards, exam paper, swatch cards, infographic, device mockups, checklist document, stopwatch, planner page, tickets, route map, trail map, split-flap board, magazine spread, chat window, year planner, and last week's wayfinding signs). No pill shapes.

Working colors suit the topic; the brand marks do not change. Every text pair is computed in `source/build.mjs` before rendering (it stops under 4.5:1), saved in `source/contrast.json`: cream on mat #1D4A3A 9.24:1, mint #BFE3D3 on mat 7.24:1, ink on paper 15.9:1, rust on paper 6.89:1, muted on paper 7.4:1, cream on rust 6.73:1, ink on the cream header 15.53:1. Amber is tape and highlight only, never text.

## Slides
1. Hook: "How to split a long course. One module, one objective." Three cut pieces, Module 1 to 3, one objective each. "Four steps to split a long course into short modules that each teach one thing, shown on one of our own sample courses."
2. Step 1, start from the job: "List what people must do after it. Not the chapter titles." Drawn example (labeled, a fictional course for a field engineer): a chapter list next to three actions. "Topics describe the course. Actions describe the job, and each action can become a module."
3. Step 2, one objective per module: "Write it as one sentence. If it needs an 'and', it's two modules." A drawn sentence cut at each "and" into three modules (labeled drawn example).
4. Here's one of ours: "Our RFI sample course has one objective. It's on the first screen." Real screen: the RFI sample's cover. Quote: "Turn a drawing conflict into a request the design team can act on." About 8 minutes. 9 screens. One objective.
5. Step 3, every screen serves it: "Three steps, all toward that one request." Real screen: "Your assignment" with Investigate, Make it answerable, Review before sending. "Anything that doesn't serve the objective goes to a job aid or another module."
6. Step 4, they do it before it ends: "The module ends with the objective done, not just explained." Real screen: "Build the request" with all four fields filled and the two distractions left on the desk.
7. Check every module (three questions), "Then put the modules in the order the work happens." CTA: "We build training one objective at a time. Try our sample courses, free on the site." ka-performancefl.com/training, Call Alex 904-210-1071.

## Sources and truth
- Real screens: live site, 2026-09-28, `D:\kap-reel\scripts\social\2026-10-14\capture.mjs` (Playwright, 1280x800 at 2x). Copies and `captures.json` (url, time, steps, facts read from the page) in `source/captures/`.
  - `rfi-cover.png`: https://ka-performancefl.com/training-samples/rfi/ as loaded. The objective, "About 8 minutes" and the 9 screen names are read from the page into `captures.json`.
  - `rfi-assignment.png`: the same course after clicking Start, screen 2 "Your assignment".
  - `rfi-build.png`: screen 7 "Build the request", reached with Next. The question, references, impact and proposal fragments were placed the way a learner does it (select the fragment, select its field); the page then reads "4 of 4 fields filled" and "2 fragments on the desk". Nothing on the page was edited.
- The course samples live at https://ka-performancefl.com/training/samples/ ; the RFI sample's viewer page is /training/samples/rfi-that-gets-answered/ (both return 200).
- Slides 2 and 3 are drawn examples and say so on the slide. The four steps are standard instructional design practice (task-based objectives, one objective per module, practice before the end); no numbers, no promised results.
- Link: https://ka-performancefl.com/training/ (200 on 2026-09-28).

## Music
`music-w1014-c`: new ElevenLabs music_v2 track, crafty and tidy indie folk pop, about 96 bpm, capo acoustic guitar riff with hammer-ons, fingerpicked banjo rolls, round electric bass, soft kick and rim, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-14\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1014`) and `D:\kap-reel\LICENSING.md`. Passed every take check on the first try (32.04 s, no leading or mid silence, no clipping, clean ending); the vocal check transcribed zero words. Slide video: -14.2 LUFS integrated, -1.6 dBTP true peak.

## Build
`node source/build.mjs` (from `source/`), then `node tools/slideshow.mjs 2026-10-14-2 --music "D:\kap-reel\out\candidates\music-w1014-c.mp3"`. Contact sheets: `source/contact-sheet.png` (slides), `source/slideshow-contact-sheet.jpg` (video at 0.5 s).

## AI
No AI voice or visuals (ai false/false). The music is AI generated and disclosed in the Facebook caption; Instagram gets still slides, no music line. No AI tool or model named.

Approved: yes (week plan plans/2026-10-12.md, Alex 2026-09-28)
