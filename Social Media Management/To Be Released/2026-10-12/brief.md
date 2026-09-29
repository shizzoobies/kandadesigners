# Brief: What Google shows before anyone clicks (reel and YouTube Short)

Slot: Mon 2026-10-12. Facebook REEL and Instagram REEL at 10:30 AM Eastern; the same video as a YouTube SHORT at 12:00 PM (per-network `time`).
Pillar: tip (Monday: local search). Wednesday's L3 covers the Google profile, so this takes the other angle: how you look in the results.

## What the viewer gets
K&A's own search result, line by line: the address says whose site it is, the title is your sign on the street (what you do, and where), the description is your pitch. Then the two lines of page code behind them, and what Google did with ours: it rewrote the title (moved our name to the front) and kept the description word for word. It ends with a self check: search your business name in a private window. Would you click?

## Hook
"What Google shows before anyone clicks." On frame 0, over K&A's result card; "Your title and description are your sign on the street." lands at 0.9 s.

## Format
21.0 s vertical, 1080x1920, 30 fps, text led, no narration, music bed only. Remotion entry `D:\kap-reel\src\social\2026-10-12\index.ts` (composition `Social1012SearchVertical`), delivered by `D:\kap-reel\scripts\social\2026-10-12\deliver.ts`. K&A logo and ka-performancefl.com in the brand row on every frame, inside the safe area. Cream canvas, white result card with an ink border, an amber ring that walks the three lines with a rust number, a dark teal code panel, and the CTA on dark teal. Every text pair computed for WCAG contrast (lowest: the "redrawn" label, #6C635A on #F8F5F2, 5.42:1).

## Beats
- 0.0 to 3.0 s, hook: headline and result card on frame 0; "Your title and description are your sign on the street."
- 3.0 to 6.0 s, 1: "The address. Whose site this is, before anyone clicks."
- 6.0 to 10.0 s, 2: "The title. What you do, and where." Then "Other businesses share our name. 'Gainesville Web Design' tells people which one is us."
- 10.0 to 13.0 s, 3: "The description. Your pitch: why click this one." Then "Ours ends with a reason to call: 'Quotes are always free.'"
- 13.0 to 17.0 s, code: "Behind it: two lines in your page's code." The real title tag, stamped "Rewritten by Google"; the real meta description, stamped "Used word for word". "Google moved our name to the front of the title. It kept our description as written."
- 17.0 to 21.0 s, CTA holds: "Search your own business name. Would you click?" A search box, "Try it in a private window." Local search is part of every site we build. ka-performancefl.com/services/seo-ai-search. Call Alex 904-210-1071.

## Sources and truth
`source/sources.md`. The result card is K&A's real result, **redrawn** from Google's live result data (fetched 2026-09-28 19:35 UTC for "K&A Performance Gainesville"), with the title and description word for word, and it says "Our real result, redrawn from Google's live data. Sept 28, 2026." on every frame it shows. A true screenshot was not possible: Google answered the automated incognito-equivalent search with its unusual-traffic reCAPTCHA, which was not bypassed (see the question below). The code panel is verbatim from the live page fetched the same minute. No other business is shown or named. Nothing about rankings or clicks is claimed. The link, /services/seo-ai-search/, returned 200 on 2026-09-28.

## YouTube Short
Same MP4 and captions, `youtube.md`, title "What Google shows before anyone clicks on your website" (54 characters), playlist "Quick fixes for your website", category HOWTO_STYLE, tags page title, meta description, Google search results, local SEO, small business website, Gainesville web design. No thumbnail goes to YouTube for a Short (the payload skips it).

## Music
`music-w1012-r`: new ElevenLabs music_v2 bed, fresh easygoing Monday morning indie pop, about 100 bpm, a glassy clean electric lead answered by steel pan over muted offbeat electric chords, warm picked bass, shaker and rimshot, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-12\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1012`) and `D:\kap-reel\LICENSING.md`. The raw take opens with a quiet 8 s intro and failed the first-second check by 0.5 dB, so the bed starts at 10.42 s, on the downbeat after the band comes in (`D:\kap-reel\out\social\music-w1012\music-w1012-r-from10.42.wav`, which passes every check); its natural ring-out closes the reel. Vocal check: zero words. The Short reuses the reel's track (same folder, one use). Delivered reel: -13.8 LUFS integrated, -2.1 dBTP true peak.

## AI
No AI voice or visuals (ai false/false). The music is AI generated; the Facebook, Instagram and YouTube captions say so.

Contact sheet (0.5 s): source/contact-sheet.jpg.

Approved: yes (week plan plans/2026-10-12.md, Alex 2026-09-28)

## Questions for Alex
- The brief asked for a real incognito screenshot of our result. Google blocked the automated search with its "unusual traffic" reCAPTCHA, which I did not bypass, so the reel shows our real result redrawn from Google's live data and labeled "redrawn" on screen and in every caption. Ship it that way, or would you take a phone screenshot of an incognito search for "K&A Performance Gainesville" and drop it in `source/captures/`? I would then swap it into the card beats and re-render (the ring positions need one pass).

## Decisions (Alex, 2026-09-28)
- Keep the labeled redraw of our search result (Google showed a CAPTCHA to the automated capture; nothing was bypassed).
