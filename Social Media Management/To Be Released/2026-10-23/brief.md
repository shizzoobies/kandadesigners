# Brief: What we check before a website goes live (reel + YouTube Short)

Slot: Fri 2026-10-23. Facebook REEL and Instagram REEL at 10:30 AM; the same video as a YouTube SHORT at 12:00 PM (per-network `time`).
Pillar: behind-the-scenes. Built as planned; if a client launch lands this week, Alex may swap these folders for the launch posts in the Thrillers format (plan question 1).

## What the viewer gets
Our pre-launch pass, seven checks, shown on a real site we built and already launched (thrillersvr.com): Tab through it, the 10-second phone test, contrast, every link returns 200, the form, the 404 page, and speed on a phone. They can run the first six on their own site today. Speed on a phone is the hand-off to next week: "More on that soon."

## Hook
"What we check before a website goes live." on the board from frame 0, with "7 checks, shown on a site we built." and thrillersvr.com beside the site's first phone screen.

## Format
30.0 s vertical, 1080x1920, 30 fps, text led, no narration, music bed only. Look: a go/no-go launch board. A graphite board names each check, the stone stage shows the real capture, and a row of seven lamps under it flips to PASS one check at a time; the speed lamp stays on NEXT. New for the reels (not planner grid, hand-in desk, search result card, drawn page on a stage, phone screens with a progress row, redaction bars or clapper slate). Working colors graphite, stone and signal green; logo lockup, ka-performancefl.com and brand type unchanged, in the brand row on every frame, inside the safe area. Every text pair computed in `source/contrast.json` (19 pairs, lowest text pair 5.64:1, muted on stone). Remotion entry `D:\kap-reel\src\social\2026-10-23\index.ts` (composition `Social1023ChecksVertical`), crops by `D:\kap-reel\scripts\social\2026-10-23\assets.mjs`, delivered by `D:\kap-reel\scripts\social\2026-10-23\deliver.ts`.

## Beats
- 0.0 to 3.2 s, hook: "What we check before a website goes live." "7 checks, shown on a site we built." thrillersvr.com, the seven checks listed, the home page on a phone.
- 3.2 to 6.2 s, check 1, "Tab through it.": "Every stop in order, with a focus ring you can see." Captures: press 1 on Skip to content, press 8 on Book the trailer. PASS.
- 6.2 to 9.2 s, check 2, "The 10-second phone test.": "A new visitor can say what it is and where." First phone screen; What: a mobile VR trailer; Where: Middleburg, FL. PASS.
- 9.2 to 12.2 s, check 3, "Contrast.": "Text colors measured, not eyeballed." Swatches in the site's colors: headline 17.23:1, body text 7.83:1, buttons 16.58:1, form hints 7.55:1. "WCAG asks for 4.5:1. Lowest found: 7.55:1." PASS.
- 12.2 to 15.2 s, check 4, "Every link returns 200.": six pages, each 200 OK. PASS.
- 15.2 to 18.2 s, check 5, "The form sends.": "Labels, required marks, a clear error. One test send before launch." The booking form empty, in focus, with an email error, and ready. "Field states only. Nothing was sent." PASS.
- 18.2 to 21.2 s, check 6, "The 404 page.": the site's 404 page, Status 404, two ways back. PASS.
- 21.2 to 24.2 s, check 7, "Speed on a phone.": four frames of the page loading on a simulated phone. "More on that soon." Lamp on NEXT.
- 24.2 to 30.0 s, CTA holds: "Launching a website? We run every check before it goes live." "Want a site built and checked? Call Alex 904-210-1071", ka-performancefl.com, "More quick fixes on YouTube: @KAPerformancefl".

## YouTube Short
Title: "What we check before a website goes live" (41 characters). Tags: website launch checklist, website accessibility, small business website, website testing, Gainesville web design. Category HOWTO_STYLE, 12:00 PM, playlist "Quick fixes for your website" (Friday). `youtube.md`: hook, the tagged /services/web-design/ link, three sentences, "The music is AI generated.", and the template footer. Same file and same track as the reel (one use under the 30-day rule).

## Sources and truth
All captures are real, taken on the live site on 2026-09-30 by `source/capture.mjs` (Playwright and Lighthouse from `D:\kap-reel\node_modules`), saved with the date in `source/captures/`. Crops only; nothing inside a capture is edited, and crops stop above the site's body copy.
- Tab: `captures/tab.json`, the whole home page tab order until focus leaves the page: 26 stops, each with a 2px solid focus outline. Press 1 is "Skip to content", press 8 is "Book the trailer".
- 10-second phone test: `captures/phone10.json` and `2026-09-30-phone-first-screen.png` (390x844 phone, no scrolling): "Middleburg, FL" and "Florida's first and only mobile virtual reality trailer" are on the first screen. The test is defined on screen as what it is and where.
- Contrast: `captures/contrast.json`, computed from the live page's own computed colors on / and /book, phone and desktop. Lowest pair 7.55:1 (form hints and footer text, #A5A2AD on #101018). The swatches on screen use those exact colors.
- Links: `captures/links.json`, every page reachable from the home page (6: /, /experiences, /pricing, /about, /book, /accessibility) and every http link on them: 6 unique URLs, 6 returned 200. The tel: and mailto: links are listed in the file but are not HTTP.
- Form: `captures/form.json`. **Never submitted.** The send button was never pressed and the capture page aborted every request that was not a GET (only the site's analytics beacon was blocked). Typed values are samples: "Sample Name", "sample@", then "sample@example.com", date 2026-12-12. The error state is the site's own invalid styling, triggered by the browser's validity check.
- 404: `captures/404.json`, https://www.thrillersvr.com/this-page-is-not-here returned status 404; the page offers "Back to the main road" (/) and "Book the trailer" (/book).
- Speed: `captures/speed.json` and the Lighthouse report (mobile form factor, simulated slow 4G). Only its filmstrip frames 1, 2, 3 and 8 are shown, with no times or score. The numbers stay in `source/` for L5; the post says only "More on that soon."
- No client data beyond the public site. No AI vendor named. No promised results.
- Links checked 200: `source/link-check.md`.

## Music
`music-w1023-r`: new ElevenLabs music_v2 track, upbeat indie pop, a punchy palm-muted clean electric guitar riff doubled by glockenspiel, ringing open chords, a driving eighth-note bass and claps on 2 and 4, about 120 bpm, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-23\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1023`), `D:\kap-reel\LICENSING.md` and `music-history.json`. The raw take had 0.50 s of leading silence; the bed starts at 0.49 s (`D:\kap-reel\out\social\2026-10-23\music-w1023-r.wav`) and then passes every check; the vocal check transcribed zero words. Delivered reel: -13.9 LUFS integrated, -1.3 dBTP true peak.

## AI
No AI voice or visuals (ai false/false). The music is AI generated and every caption says so.

Contact sheet (0.5 s): source/contact-sheet.jpg.

## Questions for Alex
- The form check says "one test send before launch." Did we send a test request through the Thrillers booking form before it went live? If not, the line changes to what we did check (labels, required marks, errors) and the PASS covers the field states only.
- Found while checking: on a phone, the Thrillers first screen shows the name, the place and the offer, but no Book button until you scroll (only the Menu). The 10-second test on screen asks what and where, so it passes honestly; a Book button on the first phone screen may be worth a small update to their site.

Approved: yes (week plan plans/2026-10-19.md, Alex 2026-09-30)
