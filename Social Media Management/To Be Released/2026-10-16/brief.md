# Brief: How we build a YouTube video in three days or less (reel + YouTube Short)

Slot: Fri 2026-10-16. Facebook REEL and Instagram REEL at 10:30 AM; the same video as a YouTube SHORT at 12:00 PM (per-network `time`).
Pillar: behind-the-scenes. No client launch this week (plan question 1), so Friday is the behind-the-scenes YouTube build.

## What the viewer gets
A look at how K&A made its first long YouTube video, L1 "Test your website with one key", from the real files: a plan and a brief Alex approves before day 1, then captures, voice and music (day 1), the edit (day 2), and render plus Alex's approval on the Post Desk (day 3). It says plainly that the voice is AI narrated and that Alex approves every step, and sends people to the channel and the site. It doubles as proof of how we work.

## Hook
"How we build a YouTube video in three days or less." on the slate from frame 0, over L1's thumbnail, then "Alex approves every step." The clapper shuts in the first four frames.

## Format
24.0 s vertical, 1080x1920, 30 fps, text led, no narration, music bed only. Look: a production slate (striped clapper sticks that shut at every beat, a chalk-lined slate with DAY / SCENE / FILE fields, the real screen on a stone table). Working colors are L1's own "stone and evergreen" palette; logo lockup, ka-performancefl.com and brand type unchanged. Every text pair computed in `2026-10-16-2/source/contrast.json` (lowest 4.91:1, evergreen on stone). Remotion entry `D:\kap-reel\src\social\2026-10-16\index.ts` (composition `Social1016BuildVertical`), delivered by `D:\kap-reel\scripts\social\2026-10-16\deliver.ts`. Logo and URL in the brand row on every frame, inside the safe area.

## Beats
- 0.0 to 3.2 s, hook: "How we build a YouTube video in three days or less." Slate: Prod. Test your website with one key, Runs 5:43, Take 1. L1 thumbnail, "Our first long video / On YouTube: @KAPerformancefl", then "Alex approves every step."
- 3.2 to 6.2 s: "Before day 1: a plan and a brief." "Alex approves both before anything is made." SPEC.md (L1 section, lines 163 to 175) and L1's brief.md (lines 1 to 10), stamped Approved.
- 6.2 to 9.4 s: "Day 1: the voice is AI narrated." "One file per beat, each take checked against the script." L1's script.md, then the narration table from the audio README (13 beats, durations, takes).
- 9.4 to 12.2 s: "Real captures of our own site." "Bad examples only on a test page we built." Capture C1-skip-link.png, with D3-trap.png as "Test page built for the video".
- 12.2 to 15.0 s: "Day 2: style frames, then the cut." "Our logo and web address on every frame." The L1 style-frame contact sheet (contact-b.png).
- 15.0 to 18.6 s: "Day 3: Alex approves it." "On our Post Desk. Then it's scheduled." The Post Desk with L1 approved, Sep 28, 2:08 PM; stamped Approved.
- 18.6 to 24.0 s, CTA holds: "Watch the finished video." youtube.com/@KAPerformancefl, "A new walkthrough every week." "The voice is AI narrated. Alex approves every step." "Want help with your own website? Call Alex 904-210-1071", ka-performancefl.com.

## YouTube Short
Title: "How we build a YouTube tutorial in three days or less" (53 characters). Tags: behind the scenes, how we make YouTube videos, small business video, video production workflow, Gainesville web design. Category HOWTO_STYLE, 12:00 PM, no playlist (none fits behind the scenes). `youtube.md`: hook, the tagged home page link, three sentences, "The voice in our long videos is AI narrated. The music is AI generated.", and the template footer. Same file and same track as the reel (one use under the 30-day rule).

## Sources and truth
- Three days or less: the L1 schedule in `plans/youtube-2026-09-28/SPEC.md` (lines 168 to 175) and L1's brief: brief to Alex first, then Tue captures, voice and music; Wed the composition and the cut; Thu render, Post Desk approval, schedule. The post names the days by number, with no dates, and says "three days or less" because L1 itself finished ahead of that schedule (see the decision below).
- File screens (`D:\kap-reel\assets\social\2026-10-16\screen-*.png`, rendered by `2026-10-16-2/source/build.mjs`): each file's own lines, verbatim, with their real line numbers; skipped lines show as a jump. Script beat 2 is skipped because its voice text spells the name for the voice model; on screen the name stays K&A. The narration table shows the README's first five columns. No AI vendor or voice model is named on screen.
- Capture stills, style-frame contact sheet and thumbnail: L1's own files, unedited (`D:\kap-reel\public\youtube\l1\captures\stills\`, `D:\kap-reel\out\youtube\l1\style-frames\contact-b.png`, `2026-10-02-4/media/thumbnail.jpg`). Bad examples appear only on the test page, which labels itself on screen.
- "Every take is checked against the script": `D:\kap-reel\public\youtube\l1\audio\README.md` (every take transcribed and compared word for word). "Logo and web address on every frame": SPEC.md step 5 and the contact sheet.
- Post Desk: not a screenshot of the signed-in live page. `2026-10-16-2/source/postdesk.mjs` runs the desk's real built page code (D:\ka-site-admin\admin\dist, commit 14095ae) with L1's real desk item, built from its folder by `tools/lib/review.mjs`, and Alex's real decision from `review/desk-log.jsonl` (approved 2026-09-28T18:08:23Z, answers "keep." and the Safari caption note). The page's status line names the assistant that reads decisions, so it shows "Decisions save as you make them." (same as the Oct 9 posts). The queue holds L1 only; no client data, no scheduling tool named.
- Runs 5:43: `2026-10-02-4/media/video.mp4` measures 343.0 s.
- "A new walkthrough every week": the approved channel About text (`plans/youtube-setup.md`).
- Links (checked 200 on 2026-09-28): https://ka-performancefl.com/ and https://www.youtube.com/@KAPerformancefl .

## Music
`music-w1016-r`: new ElevenLabs music_v2 track, bright driving indie pop, about 118 bpm, twin harmonized clean electric guitar leads over a crunchy, lightly overdriven rhythm guitar, bouncing picked bass, four on the floor kick with open hi-hats, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-16\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1016`) and `D:\kap-reel\LICENSING.md`. Passed the first-second, silence, clipping and ending checks; the vocal check transcribed zero words. Delivered reel: -14.0 LUFS integrated, -1.7 dBTP true peak.

## AI
No AI voice or visuals in this post (ai false/false). The post is about L1, whose voice is AI narrated; every caption says so. The music is AI generated and every caption says so.

Contact sheet (0.5 s): source/contact-sheet.jpg.

Approved: yes (week plan plans/2026-10-12.md, Alex 2026-09-28)

## Decision (Alex, 2026-09-28)
The claim reads "in three days or less": it is true whether a video takes one day or three (L1 itself finished ahead of its three-day schedule, all dated Sept 28). Changed everywhere in 2026-10-16, -2 and -3; the reel, slides, slide video and LinkedIn document were re-rendered.
