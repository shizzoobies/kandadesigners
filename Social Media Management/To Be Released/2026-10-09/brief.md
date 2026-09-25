# Brief: How we plan a week of posts (reel)

Slot: Fri 2026-10-09, 10:30 AM. Facebook REEL and Instagram REEL.
Pillar: behind-the-scenes. No client launch this week, so the plan's Friday fallback runs.

## What the viewer gets
A look at how K&A plans a week of its own posts, in five steps: a weekly plan Alex approves, a brief per post, every version built (reel, carousel, LinkedIn), one approval page (the Post Desk) where Alex approves each finished post or sends it back with a note, then scheduling and a weekly results check. It shows the work behind the social media pilot without asking again, and closes softly on how the pilot runs.

## Hook
"Every post we publish gets approved twice." Two Approved stamps land in the first second, then "Here's the week."

## Format
20.0 s vertical, 1080x1920, 30 fps, text led, no narration, music bed only. Remotion entry `D:\kap-reel\src\social\2026-10-09\index.ts` (composition `Social1009WeekVertical`), delivered by `D:\kap-reel\scripts\social\2026-10-09\deliver.ts`. K&A logo and ka-performancefl.com in the brand row on every frame, inside the safe area.

## Beats
- 0.0 to 3.0 s, hook: "Every post we publish gets approved twice." Stamps: 1. The plan, Alex approves it before anything is made; 2. Every post, Alex approves it before it is scheduled. "Here's the week." and the five-stop route (Plan, Brief, Build, Approve, Schedule; approval stops flagged).
- 3.0 to 5.4 s, step 1: "Plan the week. Alex approves it." Sample week plan, slots marked run or change, stamped Approval 1.
- 5.4 to 7.8 s, step 2: "A brief for every post." Sample brief: what the viewer gets, hook, slides, sources, a question for Alex.
- 7.8 to 10.2 s, step 3: "Build every version." Reel, carousel and LinkedIn document revealed in turn (K&A's own published contrast posts of Sept 29).
- 10.2 to 13.2 s, step 4: "Alex approves every post." The Post Desk on a phone with sample posts; Approve is tapped, the post turns Approved, stamped Approval 2. "Sample posts shown" under the phone.
- 13.2 to 16.2 s, step 5: "Schedule it. Check what worked." Sample week calendar, then the weekly results check (reach, engagement, clicks to the site; no numbers).
- 16.2 to 20.0 s, CTA holds: "This is how we run it for pilot businesses." You approve the month's plan once. We check every post before it goes out. A short monthly results report. "3 free months for 3 Gainesville businesses." Call Alex 904-210-1071, or message us. ka-performancefl.com.

## Sources and truth
- Process: README.md (Plan first, the day folder, the Post Desk section) and plans/2026-10-05.md. The weekly results check is Alex's description of the process (2026-09-25 brief).
- Offer wording: plans/2026-09-social-pilot.md (3 months free, 3 spots, Gainesville and Alachua County, plan approved before anything is made, monthly results report). No spots-left claim, no promised results.
- Post Desk: not a screenshot of live data. `To Be Released/2026-10-09-2/source/postdesk.mjs` loads the real page code (review/index.html, unchanged) with a sample queue, every title marked "Sample", and a stand-in for the decisions database. The page's own status line names the assistant that reads decisions, so the capture shows "Decisions save as you make them." instead. The shown post is K&A's own public carousel of Sept 25. No client data, no scheduling tool or AI tool named anywhere.
- Plan, brief, calendar and results screens: rebuilt in HTML with sample content and a SAMPLE tag (`2026-10-09-2/source/build.mjs`), styled after the real files. No numbers on the results card.
- Captures and screens used by the reel: `D:\kap-reel\assets\social\2026-10-09\`.

## Music
`music-w1009-r`: new ElevenLabs music_v2 track, upbeat happy Friday indie pop, about 122 bpm, surf-tinged clean electric riff with spring reverb, acoustic strums, upright piano stabs, big handclaps, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-09\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1009`) and `D:\kap-reel\LICENSING.md`. Passed the first-second, silence, clipping and ending checks; the vocal check transcribed zero words. Delivered reel: -14.0 LUFS integrated, -2.0 dBTP true peak.

## AI
No AI voice or visuals (ai false/false). The music is AI generated; both captions say so.

Contact sheet (0.5 s): source/contact-sheet.jpg.

Revision 2 (2026-09-25): approvals reworded as Alex's, close changed per the pilot decision below; reel re-rendered and re-delivered with the same bed.

## Pilot wording (Alex, 2026-09-25)
A pilot client's only approval is the monthly plan. They do not review or approve finished posts and there is no client-facing Post Desk; K&A checks every finished post internally before it is scheduled. Every approval in this post is Alex's, on K&A's own posts. The close reads: "This is how we run it for pilot businesses: you approve the month's plan once, and we check every post before it goes out."

Approved: yes (week plan plans/2026-10-05.md, Alex 2026-09-25)

## Questions for Alex
- If all 3 pilot spots are filled by Oct 9, should the close switch to "Want this for your business? Call Alex" instead of the free offer?
