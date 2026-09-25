# Brief: How we plan a week of posts, 5 steps (carousel)

Slot: Fri 2026-10-09, 4:00 PM Eastern. Instagram carousel (POST, 7 slides at 1080x1350) and a Facebook slide video (POST, 22 s, music bed `music-w1009-c`).
Pillar: behind-the-scenes. Second post of the day; the reel (2026-10-09) runs at 10:30 AM.

## What the viewer gets
The five steps behind every K&A post, one per slide, each with the real screen for that step rebuilt with sample content: plan the week (approval 1), write a brief, build every version, approve on one page (approval 2, the Post Desk), schedule and check what worked. Every approval shown is Alex's, on K&A's own posts. The close ties it to the pilot without a second hard ask: this is how we run it for pilot businesses.

## Hook
"Every post we publish gets approved twice." Slide 1, with the five-stop route and two Approved stamps (the plan, every post).

## Look
A route map: five square stops on a line (Plan, Brief, Build, Approve, Schedule), the current stop in rust, finished stops ticked in ink, the two approval stops flagged in green. Each step slide carries a window or screen marked SAMPLE. Distinct from last week's index cards, exam paper, swatches, infographic, device mockups, checklist document, stopwatch, planner page and tickets. Every slide: K&A logo, ka-performancefl.com, slide count, swipe cue.

## Slides
1. Hook: "Every post we publish gets approved twice." "Here's how we plan a week of our own posts, in five steps." Route; stamps 1. The plan, Alex approves it before anything is made. 2. Every post, Alex approves it before it is scheduled.
2. Step 1, Approval 1: "Plan the week." Sample week plan: slots marked run or change, "Approved: yes".
3. Step 2: "Write a brief for every post." Sample brief: what the viewer gets, hook, slides, sources, question for Alex.
4. Step 3: "Build every version." K&A's own Sept 29 contrast post as a reel, carousel and LinkedIn document. Logo and web address on every frame; works with the sound off.
5. Step 4, Approval 2: "Alex approves every post." The Post Desk with sample posts (real page code, sample queue).
6. Step 5: "Schedule it. Then check what worked." Sample week calendar and a weekly results card (reach, engagement, clicks to the site; no numbers).
7. CTA: "This is how we run it for pilot businesses." You approve the month's plan once. We check every post before it goes out. A short results report every month. "3 free months for 3 Gainesville businesses." Call Alex 904-210-1071 or message K&A Performance on Facebook or Instagram. ka-performancefl.com.

## Sources and truth
- Process: README.md (Plan first, the day folder, the Post Desk), plans/2026-10-05.md; weekly results check per Alex's 2026-09-25 brief.
- Offer: plans/2026-09-social-pilot.md. No spots-left claim, no promised results, no prices on the slides.
- Post Desk (slide 5): `source/postdesk.mjs` runs the real review/index.html unchanged with a sample queue (every title "Sample", header "Sample week. Sample posts. Not live data.") and a stand-in decisions database. The page's status line names the assistant that reads decisions, so the capture shows "Decisions save as you make them." The one post shown is K&A's own public carousel of Sept 25. Captures: `source/captures/`.
- Plan, brief, calendar and results windows are HTML rebuilds with sample content and a SAMPLE tag (`source/build.mjs`). The build slide uses K&A's own published Sept 29 reel thumbnail and carousel slides.
- No client data. No scheduling tool, AI tool or model is named.

## Music
`music-w1009-c`: new ElevenLabs music_v2 track, groovy feel-good indie pop, about 108 bpm, round melodic bass with octave jumps, bright clean guitar hook with a light phaser, congas and shaker, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-09\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1009`) and `D:\kap-reel\LICENSING.md`. Passed every take check; zero words in the vocal check. The raw take's slide video hit -1.0 dBTP, so the bed was premastered (-3 dB, peak limiter) to `D:\kap-reel\out\social\music-w1009\mastered\music-w1009-c.wav` (same track id). Slide video: -13.9 LUFS integrated, -1.3 dBTP.

## Constraints
No em dashes. US English. No AI voice or visuals (ai false/false). The music is AI generated and disclosed in the Facebook caption; Instagram gets still slides, no music line.

## Build
`node source/postdesk.mjs && node source/build.mjs` (from `source/`), then `node tools/slideshow.mjs 2026-10-09-2 --music "D:\kap-reel\out\social\music-w1009\mastered\music-w1009-c.wav"`. Contact sheets: `source/contact-sheet.png` (slides), `source/slideshow-contact-sheet.jpg` (video, 0.5 s).

Revision 2 (2026-09-25): approvals reworded as Alex's (slides 1, 2, 3, 5), slide 7 rewritten per the pilot decision below; slides, slide video and alt text rebuilt.

## Pilot wording (Alex, 2026-09-25)
A pilot client's only approval is the monthly plan. They do not review or approve finished posts and there is no client-facing Post Desk; K&A checks every finished post internally before it is scheduled. Every approval in this post is Alex's, on K&A's own posts. The close reads: "This is how we run it for pilot businesses: you approve the month's plan once, and we check every post before it goes out."

Approved: yes (week plan plans/2026-10-05.md, Alex 2026-09-25)

## Questions for Alex
- If all 3 pilot spots are filled by Oct 9, swap the offer box for "Want this for your business? Call Alex 904-210-1071"?
