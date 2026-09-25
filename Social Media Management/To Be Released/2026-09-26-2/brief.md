# Brief: The 10-second phone test for your website

Slot: Sat 2026-09-26, 4:00 PM Eastern. Instagram swipe carousel (7 slides, 1080x1350) and a 22s Facebook slide video (`media/slideshow.mp4`) with the music bed `music-w0925-sat`. Pillar: tip. The 2026-09-26 folder is a separate native Facebook post and is untouched.

## What the viewer gets
A test they can run on their own site right now, on the phone in their hand, in about 10 seconds: five checks, each with what to do, what failing looks like, and why it costs them customers. Saveable for later. Every slide points back to ka-performancefl.com, and the last slide says K&A fixes these, with the URL and Alex's number. There is no offer of a free website check anywhere.

## Hook
"Grab your phone. Open your website. You have 10 seconds." Written for weekend scrollers who already have the phone in hand.

## Look
A stopwatch counts down across the post: 0:10 on the hook, then 10, 8, 6, 4, 2 seconds left on the five checks, and 0:00, "Time's up", on the CTA. A five-segment progress track sits at the bottom of each check slide. Unlike this week's index card, exam paper, swatch card, infographic, device mockup and document carousels. The K&A logo sits top left and ka-performancefl.com in the dark teal footer, with a slide counter (n / 7) and a swipe cue on every slide. Brand fonts, rust, ink, cream and dark teal, with amber only where it appears in the site screenshot. No pill shapes, no em dashes.

## Slides
1. Hook, stopwatch 0:10, "5 checks. 2 seconds each.", with five empty checkboxes.
2. Check 1, it loads fast. Real phone capture of the K&A homepage headline. **1.8 s** is the headline paint time: the median of 5 cold loads on a throttled Slow 4G phone profile.
3. Check 2, tap to call. A code-drawn example layout labeled "EXAMPLE LAYOUT, NOT A REAL SITE", showing a Tap to call bar. The fix is a tel: link.
4. Check 3, hours easy to find. The same kind of drawn example, with an "Open today, until 5:00 PM" box near the top.
5. Check 4, readable in the sun. Real capture of the K&A intro paragraph: **15.53:1** contrast, 20px body text. WCAG 2.2 SC 1.4.3 asks for 4.5:1.
6. Check 5, the button is obvious. Real capture of the K&A first screen, with "Start a project" outlined in rust. It is visible with no scrolling (top at 627 of 844 px) and has **5.29:1** text contrast.
7. CTA: "Failed one? We fix these." Five empty checkboxes, "Web design and local search for Gainesville businesses.", ka-performancefl.com, "Call Alex 904-210-1071".

Slides 3 and 4 do not show K&A's site, and nothing in the post says K&A's own site passes checks 2 and 3 (see the question below).

## Measurements and sources
- `source/sources.md` lists every figure and its source.
- `source/timing.json`: 5 throttled and 5 unthrottled cold loads (LCP, FCP, TTFB, load). The slide quotes only the throttled LCP median.
- `source/measurements.json`: computed colors, font size and button box, with the contrast ratios.
- `source/captures/`: home-top.png (1170x2532, 390x844 at 3x) and home-full.png. Crops in `source/crops/` stop at 740 CSS px, so the client showcase and the chat button below that point stay out of the post. No other business's site is shown or named.
- Standard: WCAG 2.2 SC 1.4.3, fetched 2026-09-25. No industry statistics.
- Build: `source/capture.mjs`, `source/build.mjs` (HTML in source/slides, PNG in source/png, JPG in media/). Contact sheet: `source/contact-sheet.png`.

## Music
`music-w0925-sat` is new: a lap steel melody over offbeat acoustic strums, walking bass, a light shuffle at about 104 bpm, no vocals. It came from `D:\kap-reel\scripts\social\music-w0925-sat.ts` and is logged in config/audio.json (set `social-w0925-sat`) and LICENSING.md. Take 1 passed every check but was too close to Friday's `music-w0925-fri` (electric, tremolo guitar, electric piano, 96 bpm), so it was not used. The bed is premastered with a limiter (`out/social/music-w0925-sat/mastered/`). The slide video measures -14.4 LUFS integrated and -1.1 dBTP true peak, 22.0s long.

## AI
No AI voice or visuals; the slides are designed in code from real captures. The music is AI generated (ElevenLabs), and the Facebook caption says so.

Approved: yes (Alex picked this idea in chat, 2026-09-25)

## Questions for Alex
- ka-performancefl.com has no tap-to-call link and no posted hours: no tel: link and no 904-210-1071 on /, /contact/, /services/ or /locations/gainesville/ (checked live 2026-09-25), and none in src/ either. The site has left the phone number off before, per the note in D:\kap-reel\config\brand.json. Do you want a tel: link (and hours, if you keep set hours) added before this posts? Anyone who runs this test on our own site would fail checks 2 and 3. For now, those two slides use a drawn example labeled "not a real site".
- The 1.8 s figure is measured under emulated Slow 4G (Lighthouse's mobile profile), not on a real phone on a cell network. OK to quote as "median of 5 cold loads on a throttled Slow 4G phone profile"?
