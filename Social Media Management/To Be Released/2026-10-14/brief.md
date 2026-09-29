# Brief: Training everyone can take, 3 accessibility checks (reel + YouTube Short)

Slot: Wed 2026-10-14. Facebook REEL and Instagram REEL at 10:30 AM Eastern; the same video as a YouTube SHORT at 12:00 PM (per-network `time`), in this folder. L3, the long YouTube video at 11:00 AM (folder 2026-10-14-4), is someone else's build and is not touched here.
Pillar: training.

## What the viewer gets
Three accessibility checks anyone can run on a course today, each with a test to try: captions on every video and a transcript for all audio (turn the sound off), text you can read (measure the contrast; body text needs 4.5:1 for WCAG AA), and it works with a keyboard (put the mouse away, press Tab). Each check is proved on a real phone screen from one of K&A's sample courses. It closes on accessibility being part of how K&A builds training, with the real panel from the training page. No statistics about attention spans or retention.

## Hook
"Training everyone can take." with "3 checks for any course:" and all three numbered checks on screen by frame 10 (0.33 s).

## Format and look
23.2 s vertical, 1080x1920, 30 fps. Text led, no narration, music bed only. Cream canvas, ink type, rust numbers. Each check: a headline, a "Try it:" line on an amber rule, and a real phone screen on an ink stage; the camera moves in on the detail (the transcript, the body text, the focus ring). A three-cell progress row (Captions, Readable text, Keyboard) fills as each check passes. On check 3 a Tab key and then an Enter key are pressed over the screen. K&A logo and ka-performancefl.com in the brand row on every frame, inside the safe area. Distinct from last week's reels (planner grid, hand-in desk).

Text contrast, computed (WCAG relative luminance): ink on canvas 15.53:1, rust on canvas 6.73:1, muted on canvas 5.42:1, canvas on rust 6.73:1, canvas on ink 15.53:1, ink over the amber highlight 5.29:1. Amber is a rule and highlight only.

## Beats
- 0.0 to 3.2 s, hook: "Training everyone can take." "3 checks for any course:" 1 Captions on every video, 2 Text you can read, 3 It works with a keyboard. "Real screens from our sample courses".
- 3.2 to 8.2 s, check 1: "1. Captions on every video." "A transcript for all audio." "Try it: turn the sound off. Can you still follow?" Real screen: the RFI sample's cover with its audio introduction open; the camera moves in on the player and transcript. Credit: "Real screen: our RFI sample course. The audio intro comes with its transcript."
- 8.2 to 13.2 s, check 2: "2. Text you can read." "Try it: measure the contrast. Body text needs at least 4.5:1." Real screen: the strength sample's cover; the camera moves in and the body text is outlined. "Measured on this screen 10.3:1".
- 13.2 to 18.7 s, check 3: "3. It works with a keyboard." "Try it: put the mouse away. Press Tab. Can you see where you are?" Real screens: the safety sample's hazard hunt with keyboard focus on "Ladder access" (Tab key), then after Enter the ladder is marked found (Enter key). "Enter marks it found. No mouse needed."
- 18.7 to 23.2 s, CTA holds: "Accessibility is part of how we build training." The real "Accessibility throughout the build" panel from /training/. "Try our sample courses, free on the site." ka-performancefl.com/training, Call Alex 904-210-1071.

## Sources and truth
- Captures: live site, 2026-09-28, `D:\kap-reel\scripts\social\2026-10-14\capture.mjs` (Playwright, phone viewport 430x932 at 3x). Copies plus `captures.json` (url, time, steps, focus boxes) and `measurements.json` in `source/captures/`.
  - `rfi-transcript.png`: https://ka-performancefl.com/training-samples/rfi/ , "Play introduction (Audio + transcript)" clicked on the cover. The transcript text is saved in `captures.json`.
  - `strength-text.png`: https://ka-performancefl.com/training-samples/strength/ , the cover as loaded.
  - `safety-focus.png`, `safety-enter.png`: https://ka-performancefl.com/training-samples/safety/ , Next clicked 6 times to screen 7 "Hazard hunt", then Tab pressed 11 times until "Ladder access" in the inspection list had keyboard focus; then Enter. The counter went from "Found 0 of 6." to "Found 1 of 6."
  - `training-a11y.png`: https://ka-performancefl.com/training/ , the "Accessibility throughout the build" column with 28 px of the section around it. Its text ("Client delivery targets WCAG 2.1 AA, with checks in the environment your learners use.") is saved in `captures.json` and quoted in the captions.
  - Floating site chrome was hidden for the element shot only; nothing inside any screen was changed. The amber outline on the body text in check 2 is an annotation drawn over the capture.
- 10.3:1: `measurements.json`. The strength cover's body text (`#screen-1 .lede`, 17px at the phone width) computes #233D43 on #F7F2E8 = 10.34:1 from the computed styles, and 10.34:1 again from the rendered pixels. Shown rounded to 10.3:1.
- 4.5:1: WCAG 2.x success criterion 1.4.3, contrast minimum for body text at level AA.
- The samples have no video, so check 1 is shown on an audio introduction with its transcript, and the caption says so. The RFI sample's own page names "matching audio transcripts" (https://ka-performancefl.com/training/samples/rfi-that-gets-answered/).
- No numbers other than the measured ratio and the 4.5:1 criterion. No attention span or retention claims.

## YouTube Short
Title: "3 accessibility checks for any training course" (46 characters). Tags: accessible training, eLearning accessibility, instructional design, WCAG 2.1 AA, course design, corporate training. Category HOWTO_STYLE. No playlist (none fits training). `youtube.md` line 2 links /training/ with utm_source=youtube, utm_campaign=2026-10-14. The thumbnail is scoped to Facebook and Instagram; YouTube gets the video only. Same video and same track, one use under the 30-day rule.

## Music
`music-w1014-r`: new ElevenLabs music_v2 track, clear and quietly confident indie pop, about 104 bpm, a clean electric guitar ostinato through a dotted eighth delay, open ringing chords, warm picked bass, floor tom and snare, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-14\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1014`) and `D:\kap-reel\LICENSING.md`. The take came back 50 s long with 0.57 s of leading silence, so it failed the first-beat check; instead of paying for a regenerate, the silence was trimmed at 0.556 s (5 ms fade in) into `D:\kap-reel\out\candidates\music-w1014-r.mp3`, which passes every check. Zero words in the vocal check. Delivered reel: -14.0 LUFS integrated, -1.8 dBTP true peak.

## Build
`D:\kap-reel\src\social\2026-10-14` (own entry, composition Social1014ChecksVertical), rendered with `node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-10-14/index.ts Social1014ChecksVertical out/social/2026-10-14/render-vertical.mp4 --concurrency 3`, delivered with `scripts/social/2026-10-14/deliver.ts`. Contact sheet at 0.5 s: `source/contact-sheet.jpg`.

## AI
No AI voice or visuals (ai false/false). The music is AI generated, disclosed in the Facebook, Instagram and YouTube captions. No AI tool or model named.

Approved: yes (week plan plans/2026-10-12.md, Alex 2026-09-28)
