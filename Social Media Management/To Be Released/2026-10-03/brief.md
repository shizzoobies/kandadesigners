# Brief: Tab through your website

Slot: Sat 2026-10-03, 12:00 PM Eastern. Instagram carousel (POST, 7 slides at 1080x1350) and a Facebook slide video (POST, 22s, music bed `music-w1003`). Carousel only that day, no reel, no LinkedIn.
Pillar: tip (web design, accessibility).

## What the viewer gets
Five keyboard checks a business owner can run on their own site in a few minutes, one per slide: what to do right now, what failing looks like, and why it costs customers. Each check is illustrated with a real keyboard-focus capture of ka-performancefl.com (Playwright pressing Tab, Enter and Esc; never a click). The CTA points to the accessibility audit page and a call with Alex.

## Hook
Put your mouse away. Can you still reach us? (Alex, 2026-09-25: changed from "book with us", since our button says Start a project.)

## Look
Keycaps. Each check is led by the physical key you press (Tab, Tab with a focus ring around the keycap, Tab then Enter, Enter, Esc), drawn as cream keycaps with an ink base, over a real capture in a thin ink frame, then a three-row table (Do it now / Failing looks like / Why it costs customers). A row of five small keycaps in the footer tracks progress. Rust for focus and labels, dark teal for the stat panel and CTA card, amber only as the highlighter. Distinct from last week's index cards, exam paper, swatch cards, infographic, device mockups, checklist document, stopwatch, planner page and tickets. Every slide: K&A logo, ka-performancefl.com, slide count, swipe cue.

## Slides
1. Hook: "Put your mouse away. Can you still reach us?" Capture: one press of Tab on our home page shows Skip to content. Tab, Enter, Esc keycaps. "5 keyboard checks to run on your own website."
2. Check 1, Tab reaches every link and button. Capture: home page header after 9 presses of Tab, stops 3 to 9 numbered, focus on Start a project. Stat: 0 links or buttons skipped on 7 pages, at desktop and at phone width.
3. Check 2, You can always see where you are. Capture: accessibility page FAQ, focused question outlined in rust.
4. Check 3, The menu opens from the keyboard. Captures at phone width: menu button focused, then Enter opens the menu (close button visible in the header) and Tab lands on Home.
5. Check 4, Forms submit with Enter. Capture: contact form with test data, email field focused. Enter fired the form's submit event (intercepted, nothing sent).
6. Check 5, Nothing traps you. Capture: Start a project window opened with Enter, focus on its close button. Esc closed it and focus went back to the button that opened it.
7. CTA: "We build every site to work without a mouse." "Our own site passes all five. Retested on the live site." The five checks recapped, each marked Pass. ka-performancefl.com/services/accessibility/ and Call Alex 904-210-1071.

## Sources (all in source/)
- `capture.mjs` makes every slide capture; `captures/captures.json` logs the page, viewport, keys pressed and the focused element for each shot, plus the Enter submit and Esc results. Captured 2026-09-25 from the live site; all captures redone after the site fix went live.
- `audit.mjs` Tabs through each page until focus wraps and compares the stops with every visible link, button and field: `audit-1280.json` and `audit-390.json` (the same 7 pages at each width: /, /services/, /services/accessibility/, /contact/, /services/web-design/, /training/, /ai-launch/). Re-run on the live site after the site fix (commit 2bfced7): 0 missed, every stop draws an outline, 0 stops covered by another element, at both widths. This is the "0 skipped, 7 pages" stat on slide 2 and the Pass marks on slide 7.
- `checks.mjs` runs the phone menu, the contact form Enter test and the dialog Esc test; `menu-peek.mjs` checks the open phone menu. All scripts load the live site with a cache-busting query. `evidence/` holds the before screenshots of the three check 2 gaps (the undated files) and the after screenshots (`after-fix-*`).
- Safety: every script aborts any non-GET request and cancels submit events before the site's handler runs, so the contact form test never reached the form service.
- Page claims: `src/pages/services/accessibility.astro` line 93 (the full keyboard path, a focus outline you can see) and line 49 ("New builds ship measured against AA").

## Music
`music-w1003`: new ElevenLabs music_v2 track, bright Saturday midday, jangly clean electric open-chord arpeggios with an answering clean electric melody, tambourine, about 94 bpm, no vocals, no claps, no twelve string, no keys (kept apart from music-i-a, music-w0926-pilot, music-w1005-c, music-w0925-sat and music-w1009-r). Generator `D:\kap-reel\scripts\social\2026-10-03\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1003`). Take 1 passed the first-second, silence, clipping and ending checks; the vocal check transcribed zero words. Slide video: -14.0 LUFS integrated, -1.8 dBTP true peak, 22.0s.

## Constraints
K&A's own site only. No numbers except the measured audit counts. No promised results. No em dashes, US English. No AI voice or visuals (ai false/false); the music is AI generated and disclosed in the Facebook caption only.

## Build
`node source/capture.mjs` (captures), `node source/build.mjs` (slides, from `source/`), then `node tools/slideshow.mjs 2026-10-03 --music "D:\kap-reel\out\candidates\music-w1003.mp3"`. Contact sheets: `source/contact-sheet.png` (slides), `source/slideshow-contact-sheet.png` (video at 0.5s).

Approved: yes (week plan plans/2026-10-05.md, Alex 2026-09-25)

## Site fix (resolved 2026-09-25)
The first run found three check 2 gaps on our own site. Alex had them fixed (branch site/proof-and-focus, commit 2bfced7, live 2026-09-25), and the re-run on the live site confirms each one:
- Home page, desktop: The message, Find the details and The working brief used to take focus under the fixed header. Now they scroll clear of it (`evidence/after-fix-desktop-home-the-message.png`; audit: 0 covered).
- /ai-launch/: the hidden "Ask about a session" link inside a closed FAQ answer took Tab focus. Now Tab goes from the last FAQ question to the contact page link (45 stops, was 46).
- Phone menu: the close button was covered and Esc did nothing. Now after Enter, focus is on a visible close button. Tab cycles through the menu links, the header logo, Call and close without going behind the menu. Esc closes the menu and returns focus to the menu button (`evidence/after-fix-phone-menu-*.png`).
With all five checks passing on the live site, slide 7 and both captions say our site passes all five.

## Questions for Alex
None open.
