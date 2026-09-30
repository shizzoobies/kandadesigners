# Brief: What we check before a website goes live (carousel)

Slot: Fri 2026-10-23, 4:00 PM Eastern. Instagram carousel (POST, 8 slides at 1080x1350)
and a Facebook slide video (POST, 25 s, music bed `music-w1023-c`).
Pillar: behind-the-scenes. Second post of the day; the reel (2026-10-23) runs at 10:30 AM
and its YouTube Short at noon. Link: https://ka-performancefl.com/services/web-design/
(Facebook line 2, Instagram link in bio), plus the YouTube channel in both captions.

## What the viewer gets
The same seven pre-launch checks as the reel, one slide each, to save and run on their own
site: Tab through it, the 10-second phone test, contrast, every link returns 200, the form,
the 404 page, and speed on a phone ("More on that soon"). Every check is shown on
thrillersvr.com, a site we built, with the real capture and what we found.

## Hook
Slide 1: "What we check before a website goes live." under the kicker "Behind the scenes",
then "7 checks, shown on a site we built." and the seven empty checkboxes.

## Look
An inspection tag with PASS stamps (the plan's format idea). A white hang tag on a string,
clipped corners and an eyelet, a printed rust band (Inspection tag, Check n of 7) and form
rows typed in Lenia Mono (Site, Date, Check). Slides 2 to 7 are one filled-in tag per check,
each stamped PASS in green; slide 8 is check 7 stamped "More soon" in rust, above the CTA
panel. Distinct from every recent carousel (index cards through production slate). Every
slide: K&A logo, ka-performancefl.com, slide count, swipe cue.

## Slides
1. Hook, as above. Tag band "Pre-launch", Site thrillersvr.com, Date Sept 30, 2026.
2. Check 1, Tab through it: "Every stop in order, with a focus ring you can see." Captures:
   Skip to content and Book the trailer, each with its focus ring. Found: "Press 1: Skip to
   content. Press 8: Book the trailer." PASS.
3. Check 2, the 10-second phone test: "Can a new visitor say what it is and where?" The
   first phone screen; What: A mobile VR trailer; Where: Middleburg, FL. Found: "Both answers
   are on the first screen." PASS.
4. Check 3, Contrast: "Text colors measured, not eyeballed." Swatches in the site's own
   colors: Headline 17.23:1, Body text 7.83:1, Buttons 16.58:1, Form hints 7.55:1. Found:
   "WCAG asks for 4.5:1. Lowest found: 7.55:1." PASS.
5. Check 4, Every link returns 200: "Every page on the site, every link on each page." Six
   URLs, each 200 OK. Found: "6 pages. 6 returned 200." PASS.
6. Check 5, The form sends: "Labels, required marks, a clear error." The name and email
   fields in four states: Empty, Focus, Error, Ready. Found: "Nothing was sent here. We send
   one test before launch." PASS.
7. Check 6, The 404 page: "A wrong address gets a real 404 and a way back." The 404 page's
   heading and its two buttons; Status 404. Found: "A real 404 status, not a blank page." PASS.
8. Check 7, Speed on a phone, stamped "More soon": Lighthouse filmstrip frames 1, 2, 3 and 8,
   "The page loading on a simulated phone. More on that soon." CTA panel: "Launching a
   website? We run every check before it goes live." Call Alex 904-210-1071.
   ka-performancefl.com. "More quick fixes on YouTube: @KAPerformancefl".

## Sources and truth
- Every capture and number: `../2026-10-23/source/captures/` (2026-09-30, `capture.mjs`),
  explained in `../2026-10-23/brief.md` under Sources and truth. Crops by
  `D:\kap-reel\scripts\social\2026-10-23\assets.mjs` into `D:\kap-reel\assets\social\2026-10-23\`;
  nothing inside a capture is edited.
- The booking form was never submitted: the button was never pressed, every non-GET request
  was aborted, and the typed values are samples ("Sample Name", "sample@", "sample@example.com").
- Speed shows no time or score; the numbers stay in `source/` for L5.
- Text contrast of our own design computed, 14 pairs, lowest 5.93:1 (swipe cue, rust on the
  canvas): `source/contrast.json` (script `source/contrast.mjs`, which also writes the reel's).
- Links checked 200: `../2026-10-23/source/link-check.md`. No client data beyond the public
  site, no AI vendor, no promised results.

## Music
`music-w1023-c`: new ElevenLabs music_v2 track, warm easygoing indie pop, a clean electric
guitar melody with gentle bends, soft accordion answers, a strummed acoustic and a brushed
snare, about 96 bpm, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-23\music.ts`,
logged in `D:\kap-reel\config\audio.json` (set `social-w1023`), `D:\kap-reel\LICENSING.md` and
`music-history.json`. Passed every take check; zero words in the vocal check. Slide video:
-14.0 LUFS integrated, -1.7 dBTP.

## Constraints
No em dashes. US English. No AI voice or visuals (ai false/false). The music is AI generated
and disclosed in the Facebook caption; Instagram gets still slides, no music line.

## Build
`node source/build.mjs` (slides, contact sheet), `node source/contrast.mjs`, then
`node tools/slideshow.mjs 2026-10-23-2 --music "D:\kap-reel\out\candidates\music-w1023-c.mp3"`.
Contact sheets: `source/contact-sheet.png` (slides), `source/slideshow-contact-sheet.jpg`
(video, 0.5 s).

## Questions for Alex
- Same as the reel: confirm we sent a test request through the Thrillers booking form before
  launch, since slide 6 says "We send one test before launch."

Approved: yes (week plan plans/2026-10-19.md, Alex 2026-09-30)
