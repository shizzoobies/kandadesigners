# Brief: 2 of 3 spots left, free social media pilot

Slot: Thu 2026-10-01. Facebook slide video (POST, 19s, music bed `music-w1001-p`) and Instagram carousel (POST, 6 slides at 1080x1350) at 1:00 PM Eastern; LinkedIn company page DOCUMENT (the same 6 slides as one swipeable PDF) at 12:00 PM Eastern, through per-network `time`.
Pillar: offer. The follow-up to the pilot announcement (`Already Released/2026-09-26-4`, LinkedIn `2026-09-28-4`). The plan is `plans/2026-09-social-pilot.md`; the slot is "Pilot offer" in `plans/2026-10-12.md`.

## What the viewer gets
A plain update: one of the 3 pilot spots has filled and 2 are open, then the whole offer again with the same terms as the announcement, and how to claim one. Nothing names or hints at the business that took the filled spot: no industry, place, logo, photo, quote or date.

## Hook
"2 of 3 spots left." Slide 1 and caption line 1. Real scarcity, stated plainly (Alex, 2026-09-28: one spot has filled).

## Call to action
Call Alex at 904-210-1071, or message K&A Performance on Facebook or Instagram. No website form. Facebook line 2: "See our work: https://ka-performancefl.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-01-4". Instagram: "Link in bio", hashtags under `## First comment`. LinkedIn: the link in the first comment, tagged `utm_source=linkedin`. The page returned 200 on 2026-09-28.

## Look
The announcement's reserved-seat tickets, kept on purpose so followers read it as the same offer moving along (the pilot plan: "2 spots left", "same ticket look as the announcement"). What changed: slide 1's three tall tickets now show spot 1 grayed out with a rust "Filled" stamp and spots 2 and 3 open; every ticket band reads "2 of 3 spots left"; every stub shows seat 1 filled (solid rust) and seats 2 and 3 open. Every slide: K&A logo on cream top left, ka-performancefl.com top right, slide count and swipe cue at the bottom. Contrast is computed for every text pair in `source/contrast.json` (lowest 5.46:1, all at or above 4.5:1).

## Slides
1. Hook: "2 of 3 spots left." "Free social media management for 3 months." Three tickets: 1 filled, 2 and 3 open. "For businesses in Gainesville and Alachua County. Facebook and Instagram, planned, made and posted for you."
2. What you get, free for 3 months: 3 posts a week on Facebook and Instagram (2 reels or carousels, plus 1 tip or carousel); a monthly content plan you approve once, before anything is made; a short monthly results report (reach, engagement, clicks to your site); captions, music and scheduling, all handled.
3. What we ask in return: approve each month's plan within 2 business days; add us as a manager in Meta; send real photos or footage when we ask; permission to share results as a case study, and a short review if you are happy; an honest check-in at the end of month 3.
4. After 3 months: $600 a month, month to month. Pilot businesses keep $600 locked for as long as they stay. No auto-billing, no contract, cancel any time. You continue only if it is paying off.
5. What it is not: no paid ads (ad spend not included); no promised follower or sales numbers; you keep replying to comments and DMs.
6. How to claim (dark ticket): "Claim one of the last 2 spots." Call Alex 904-210-1071, or message K&A Performance on Facebook or Instagram. Alex picks the best fits. No contract. No card.

## Sources and truth
- Spots: Alex in chat, 2026-09-28 (one pilot spot has filled; `plans/2026-10-12.md`, "Pilot offer"). The filled business is not named anywhere in this folder.
- Terms: `plans/2026-09-social-pilot.md` and `Already Released/2026-09-26-4`, word for word where possible. Nothing added: no promised results, no numbers beyond the offer's own, no "no catch", no client names.

## Music
`music-w1001-p`: new ElevenLabs music_v2 track, bright and eager indie pop at about 116 bpm, a staccato light-fuzz electric guitar riff over a Nashville tuned acoustic sparkle, marimba answers, no vocals. Distinct from `plans/2026-09-28-music.md`, `music-history.json` and every bed in `D:\kap-reel\LICENSING.md` (including the announcement's `music-w0926-pilot`). Generator `D:\kap-reel\scripts\social\2026-10-01-4\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1001-p`) and `D:\kap-reel\LICENSING.md`. Take 1 was rejected for 0.52s of leading silence; take 2 passed every check and the vocal check transcribed zero words. Slide video: -14.0 LUFS integrated, -1.6 dBTP, 19.0s.

## AI
No AI voice or visuals (ai false/false). The music is AI generated and disclosed in the Facebook caption; Instagram gets still slides and LinkedIn a document, so no music line there.

## Build
HTML/CSS slides rendered with Playwright, JPG via sharp: `node source/build.mjs` (from `source/`), which also writes `source/contrast.json`. Facebook video: `node tools/slideshow.mjs 2026-10-01-4 --music "D:\kap-reel\out\candidates\music-w1001-p.mp3"`, then the slides are scoped to `["instagram","linkedin"]` (slideshow.mjs sets them to Instagram only). Contact sheets: `source/contact-sheet.png` (slides), `source/slideshow-contact-sheet.jpg` (video, 0.5 s).

Approved: yes (week plan plans/2026-10-12.md, Alex 2026-09-28)

## Questions for Alex
- If a second spot fills before Thu 10/1 at noon, should this be pulled, or rebuilt as "1 spot left"?
- I kept the announcement's ticket look (the pilot plan asks for it), although tickets are on this week's "already used" list. Keep it, or restyle?
