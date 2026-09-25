# Brief: What a month of posts looks like

Slot: Sun 2026-10-04, 6:00 PM Eastern. Instagram carousel (POST, 7 slides at 1080x1350) and a Facebook slide video (POST, 22s, music bed `music-w1004`).
Pillar: offer (behind the scenes of the product). Follow-up to the pilot announcement (`2026-09-26-4`): it shows what a pilot business gets instead of asking again. The pilot plan is `plans/2026-09-social-pilot.md`.

## What the viewer gets
A real sample content calendar they can copy: 12 posts over four weeks, each with one job (proof, tip, behind the scenes, offer), and the point that only 3 of the 12 ask for the sale. Then the four steps of how we run it, taken from how K&A runs its own posting: we plan the month, you approve the month's plan once (run, change, or drop; the client's only approval), we build and schedule (brief, build, our own check of every post, queue), you get a short report that shapes next month's plan.

## Hook
12 posts. One month. Here's what each one is for.

## Call to action
"Want this for your business? 3 free months for 3 Gainesville businesses." Call Alex at 904-210-1071 or message us (Facebook: "message us here"; Instagram: "send us a DM", "link in bio"). Facebook line 2: `See our work: https://ka-performancefl.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-04` (the site has no social media page; home returns 200). No spot counts, no "spots left", no promised results.

## Look
A color-coded month. Each job has its own color and its own shape, so the code reads without color: proof is a teal square, tip a rust triangle, behind the scenes an ink-outlined circle, offer an amber diamond. Slide 1 is the month as tinted tiles under a boxed "Sample month" label; slide 2 is the full calendar (cells with a colored top rule, job, topic, format) with a legend; slides 4 to 6 share a four-step rail with the current step in rust. The plan sheet has square Run / Change / Drop boxes (no pills), the report card has empty "Your number" boxes (no figures). The CTA is a dark teal panel under the cream header. Distinct from the recent index card, exam paper, swatch, infographic, device, checklist, stopwatch, planner and ticket carousels. Every slide: K&A logo on cream top left, ka-performancefl.com top right, slide count and swipe cue at the bottom.

## Slides
1. Hook: "12 posts. One month." "Here's what each one is for." Sample month grid, Week 1 to 4 by Mon, Wed, Fri, each tile a job.
2. Sample month: a local business, 3 posts a week on Facebook and Instagram. All 12 posts with job, topic and format. Legend.
3. "Only 3 of the 12 ask for the sale." Proof, tip, behind the scenes, offer: 3 of 12 each, and what each one does.
4. Steps 1 and 2: We plan the month (every post on one page: day, format, what it's for). You approve the plan once (mark each post run, change, or drop; it's the only approval you give, and nothing is made until then). A plan sheet with Run checked on four posts, "and 8 more". Real line from our own weekly plan: "Mark each slot: run, change, or drop."
5. Step 3: We build and schedule. "You approve the month's plan once. We take it from there." Brief, Build, Check (we check every finished post before it goes out), Schedule (queued on Facebook and Instagram for the month). "This is how we run K&A's own Facebook and Instagram, every week."
6. Step 4: You get a short report: reach, engagement, clicks to your site. Then: next month's plan starts from what the report shows.
7. CTA: "Want this for your business?" "3 free months for 3 Gainesville businesses." "3 posts a week on Facebook and Instagram. You approve the plan before anything is made." Call Alex 904-210-1071, or message us on Facebook or Instagram.

## Approval (Alex, 2026-09-25)
The month's plan is the pilot client's only approval. K&A checks every finished post internally (the Post Desk) before it is scheduled. No slide, caption or alt text says the client reviews finished posts.

## Sources
`source/facts.md` traces every line: the sample month (made up, labeled, shaped to the pilot's 3 posts a week), the steps (README.md, plans/2026-10-05.md, the Post Desk, the release path), and the offer (plans/2026-09-social-pilot.md). No client names or data, no invented numbers, no AI vendor names, no em dashes, US English.

## Music
`music-w1004`: new ElevenLabs music_v2 track, mellow Sunday evening, a warm steel string acoustic melody in a swaying 6/8 over light acoustic strums, a soft Wurlitzer electric piano, round bass and brushed snare, about 84 bpm, no vocals. Distinct from every bed in `plans/2026-09-28-music.md`, `music-history.json` and the weekend beds in `config/audio.json` (no felt piano, capo strums or upright bass like the Sept 27 Sunday bed). Generator `D:\kap-reel\scripts\social\2026-10-04\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1004`) and `D:\kap-reel\LICENSING.md`. Passed the first-second, silence, clipping and ending checks; the vocal check transcribed zero words. Slide video measured -14.1 LUFS integrated, -1.5 dBTP, 22.0s, no gap under -45 dB.

## AI
No AI voice or visuals (ai false/false). The music is AI generated and disclosed in the Facebook caption; Instagram gets still slides, no music.

## Build
HTML/CSS slides rendered with Playwright, JPG via sharp: `node source/build.mjs` (from `source/`). Facebook video: `node tools/slideshow.mjs 2026-10-04 --music "D:\kap-reel\out\candidates\music-w1004.mp3"`. Contact sheets: `source/contact-sheet.png` (slides), `source/contact-sheet-video.png` (video at 0.5s).

## Questions for Alex
- The plan says the last slide mentions the pilot "only if spots remain." It carries the pilot line with no spot count. If all 3 spots fill before Oct 4, swap slide 7 for a plain "Call Alex" CTA before release.

Approved: yes (week plan plans/2026-10-05.md, Alex 2026-09-25)
