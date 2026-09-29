# Brief: How we build a YouTube video in three days or less (carousel)

Slot: Fri 2026-10-16, 4:00 PM Eastern. Instagram carousel (POST, 8 slides at 1080x1350) and a Facebook slide video (POST, 25 s, music bed `music-w1016-c`).
Pillar: behind-the-scenes. Second post of the day; the reel (2026-10-16) runs at 10:30 AM and its YouTube Short at 12:00 PM.

## What the viewer gets
The six steps behind K&A's first long YouTube video, L1 "Test your website with one key", one per slide, each on the real file or screen for that step: the plan, the brief and script, the AI narrated voice, the screen captures, the edit, and Alex's approval on the Post Desk. It says plainly that the voice is AI narrated and that Alex approves every step, points to the channel, and closes on a call to Alex.

## Hook
"How we build a YouTube video in three days or less." Slide 1, on an open clapper slate (Prod. Test your website with one key, Runs 5:43, Take 1), over L1's thumbnail and a four-part strip: Before day 1, Day 1, Day 2, Day 3.

## Look
A production slate: striped clapper sticks, a chalk-lined slate with DAY / SCENE / FILE fields and the headline, then the real screen on a stone table. Working colors are L1's own "stone and evergreen" style-frame palette (Alex, 2026-09-28: colors may suit the topic); the logo lockup, ka-performancefl.com and Schibsted / Atkinson / Lenia Mono are unchanged. No purple, no cobalt. Every text pair is computed in `source/contrast.json` (lowest 4.91:1, evergreen on stone; chalk on slate 14.26:1). Distinct from every recent carousel (index cards, exam paper, swatch cards, infographic, device mockups, checklist document, stopwatch, planner page, tickets, route map, trail map, split-flap board, magazine spread, chat window, year planner). Every slide: K&A logo, ka-performancefl.com, slide count, "Alex approves every step.", swipe cue. No pill shapes.

## Slides
1. Hook: "How we build a YouTube video in three days or less." "Behind the scenes of our first long video, from the plan to the approval." L1 thumbnail; "On YouTube: @KAPerformancefl"; the four-part day strip.
2. Before day 1, the plan: "It starts with a plan Alex approves." SPEC.md lines 163 to 175 (L1 section and its three-day schedule table). Stamped Approved.
3. Before day 1, brief and script: "Then a brief, and a script written for the ear." L1's brief.md lines 1 to 10 and script.md lines 1 to 12 (beat 2 skipped, see sources).
4. Day 1, the voice: "The voice is AI narrated." One file per beat, every take checked word for word against the script. The narration table from the audio README.
5. Day 1, the captures: "Real captures of our own site." C1-skip-link.png (our home page, Tab once, the skip link) and D3-trap.png (the test page, labeled on screen).
6. Day 2, the edit: "Style frames first, then the cut." The L1 style-frame contact sheet (contact-b.png).
7. Day 3, the approval: "Alex approves the finished video." The Post Desk with L1 approved, Sep 28, 2:08 PM, and Alex's two answers. Stamped Approved.
8. CTA: "Watch the finished video." youtube.com/@KAPerformancefl, "A new walkthrough every week." "The voice in our videos is AI narrated. Alex approves every step." "Want help with your own website? Call Alex 904-210-1071", ka-performancefl.com.

## Sources and truth
- File views are each file's own lines, verbatim, with their real line numbers; skipped lines show as a jump in the numbering. `build.mjs` checks the line numbers still match before it renders. Script beat 2 is skipped because its voice text spells the name for the voice model; on screen the name stays K&A. The narration table shows the README's first five columns (Beat, Title, Duration, Takes, Kept). No AI vendor or voice model is named on any slide.
- Capture stills, the contact sheet and the thumbnail are L1's own files, unedited: `D:\kap-reel\public\youtube\l1\captures\stills\C1-skip-link.png` and `D3-trap.png`, `D:\kap-reel\out\youtube\l1\style-frames\contact-b.png`, `To Be Released/2026-10-02-4/media/thumbnail.jpg`.
- Post Desk (slide 7): `source/postdesk.mjs` runs the desk's real built page code (`D:\ka-site-admin\admin\dist`, commit 14095ae, unchanged) with L1's real desk item (built from its folder by `tools/lib/review.mjs`) and Alex's real decision from `review/desk-log.jsonl` (approved 2026-09-28T18:08:23Z; answers "keep." and the Safari caption note). It is not a screenshot of the signed-in page. One change: the status line names the assistant that reads decisions, so it shows "Decisions save as you make them." The queue holds L1 only; no client data; no scheduling tool named. Captures and the data used: `source/captures/`.
- Three days or less: the L1 schedule in `plans/youtube-2026-09-28/SPEC.md` lines 168 to 175 (L1 itself finished ahead of it). "Every take checked word for word": the audio README. "Logo and web address on every frame": SPEC.md step 5 and the contact sheet. "Runs 5:43": L1's video.mp4 measures 343.0 s. "A new walkthrough every week": the approved channel About text.
- Links (checked 200 on 2026-09-28): https://ka-performancefl.com/ and https://www.youtube.com/@KAPerformancefl . No client data, no promised results.

## Music
`music-w1016-c`: new ElevenLabs music_v2 track, warm unhurried indie pop, about 100 bpm, a clean round electric guitar melody in octaves, muted trumpet answers, gentle strummed open chords, cross-stick drums with a light swing, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-16\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1016`) and `D:\kap-reel\LICENSING.md`. Passed every take check; zero words in the vocal check. It came back at 50.0 s (32 s asked); the slide video uses the first 25 s. Slide video: -14.2 LUFS integrated, -1.4 dBTP true peak.

## Constraints
No em dashes. US English. No AI voice or visuals in this post (ai false/false). The Facebook caption carries "The voice in the video is AI narrated. The music is AI generated."; Instagram gets still slides, so its caption keeps the voice line and drops the music line.

## Build
`node source/postdesk.mjs && node source/build.mjs` (from `source/`), then `node tools/slideshow.mjs 2026-10-16-2 --music "D:\kap-reel\out\candidates\music-w1016-c.mp3"`. Contact sheets: `source/contact-sheet.png` (slides), `source/slideshow-contact-sheet.jpg` (video, 0.5 s).

Approved: yes (week plan plans/2026-10-12.md, Alex 2026-09-28)

## Decision (Alex, 2026-09-28)
The claim reads "in three days or less": it is true whether a video takes one day or three (L1 itself finished ahead of its three-day schedule, all dated Sept 28). Changed everywhere in 2026-10-16, -2 and -3; the reel, slides, slide video and LinkedIn document were re-rendered.
