# Brief: Five contrast fixes you can make today

Slot: Tue 2026-09-29, 4:00 PM Eastern. Facebook and Instagram carousel, 7 slides, 1080x1350.
Pillar: tip. Companion to the 10:30 AM reel "Contrast is not a vibe" (folder 2026-09-29), which teaches one rule with amber and rust on cream. This carousel does not reuse that pair: it is a checklist of five different fixes, each a swatch card with a computed ratio.

## What the viewer gets
Five fixes they can make on their own site today, each with a real before and after color pair, the measured WCAG ratio, and why it costs them customers. Saveable, so it keeps sending people back to ka-performancefl.com.

## Hook
Your phone in the sun. Can anyone read your website? (Alex picked this hook 2026-09-25. The 1 in 12 men figure moved to the links slide, fix 5, where color vision applies; source in source/sources.md.)

## Slides
1. Hook: "Your phone in the sun. Can anyone read your website?", five numbered chips, "5 contrast fixes you can make today."
2. Fix 1, light gray body text: #A8A29E on #FFFFFF 2.52:1 fails; #57534E 7.62:1 passes (4.5:1).
3. Fix 2, text on photos: white on sky #C9DDEA 1.39:1 fails 3:1; a 60% #221C15 scrim gives #65696A, 5.55:1 passes.
4. Fix 3, brand buttons: white on #22C55E 2.27:1 fails; white on #15803D 5.01:1 passes.
5. Fix 4, placeholder as label: #C4C4C4 placeholder 1.74:1 fails; real label 16.86:1 and #6B6B6B placeholder 5.32:1 pass.
6. Fix 5, links by color only (carries "About 1 in 12 men see color differently", NEI): #134E4A link vs #221C15 text 1.78:1, under the 3:1 of technique G183, fails 1.4.1; underlined, 9.47:1 on white.
7. CTA: recap of the five passing ratios. "We check this on every site we build. ka-performancefl.com / Call Alex 904-210-1071"

Every slide: K&A logo top left, ka-performancefl.com and a swipe cue in the dark teal footer.

## Sources
- source/sources.md: NEI and Colour Blind Awareness for 1 in 12; WCAG 2.2 SC 1.4.3, SC 1.4.1, G183, F73.
- source/contrast-ratios.md: every ratio, computed by source/contrast.mjs from the hex values.
- Build: source/build.mjs (HTML slides in source/slides, rendered with Playwright Chromium from D:\kap-reel, then JPG via sharp). Contact sheet: source/contact-sheet.png.

## AI
No AI voice or visuals. Designed in code.

Approved: yes (week rework plan, Alex 2026-09-25)

## Questions for Alex
- Slide 3's photo is a flat sky-blue box, since we have no licensed photo. OK, or should we use a real photo?
