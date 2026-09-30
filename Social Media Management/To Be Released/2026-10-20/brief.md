# Brief: Ask for less on your form (reel, plus YouTube Short)

Slot: Tue 2026-10-20. Facebook REEL and Instagram REEL at 10:30 AM Eastern; the same video as a YouTube SHORT at 12:00 PM (per-network `time`).
Pillar: tip (web design day). Link: https://ka-performancefl.com/services/web-design/ (200 on 2026-09-30, `source/link-check.md`).

## What the viewer gets
One rule for their own contact form: ask for three things (name, email or phone, the message) and ask the rest in the reply. They watch a drawn twelve-field form lose nine fields, see it next to K&A's real three-field contact form, and see where the other questions go: a short reply once the customer has already written.

## Hook
"Ask for less on your form." on frame 0, "Every extra field is one more reason to stop." by 0.5 s, over the drawn twelve-field form labeled "Drawn example" and a counter reading 12.

## Format
24.0 s vertical, 1080x1920, 30 fps, text led, no narration, music bed only. Look: a tear-off pad. The drawn form's extra fields are perforated strips that tear off one by one while the counter drops from 12 to 3. Working colors: pad paper on a deep green-black desk, with the cream brand band on top; logo lockup, ka-performancefl.com and brand type unchanged. Distinct from recent reels (planner grid, hand-in desk, search result card, drawn page on a stage, phone screens with a progress row, redaction bars, clapper slate). Remotion entry `D:\kap-reel\src\social\2026-10-20\index.ts` (composition `Social1020FormVertical`), delivered by `D:\kap-reel\scripts\social\2026-10-20\deliver.ts`. Logo and URL in the brand row on every frame, everything inside the safe area.

## Beats
- 0.0 to 3.2 s, hook: "Ask for less on your form." / "Every extra field is one more reason to stop." Drawn form (Name, Email, Phone, Company, Street address, City, ZIP code, Website, Budget, How did you find us?, Best time to call, Message), labeled "Drawn example". Counter: 12 fields to fill in.
- 3.2 to 10.0 s: "Keep three." / "Name. Email or phone. The message." Nine strips tear off; the counter drops to 3; ticks on the kept three. "Everything else can wait for the reply."
- 10.0 to 15.2 s: "Ours asks for three." / "Our real contact page, captured Sept 30, 2026." The drawn form ("Drawn example: 12 fields", "Twelve boxes for one question.") beside the real capture ("Real capture: 3 fields", ka-performancefl.com/contact).
- 15.2 to 19.0 s: "Ask the rest in your reply." / "Budget, timeline, address: once they've written, just ask." A drawn reply labeled "Drawn example" and "Not a real business." (Hi Dana ... what's the address, and when would you like it done? Jo).
- 19.0 to 24.0 s, CTA holds: "Want a form that asks for less?" / "Web design from Gainesville." Name / Email or phone / Message, then Call Alex 904-210-1071, ka-performancefl.com.

## Sources and truth
- K&A's contact form: captured 2026-09-30 by `2026-10-20-2/source/check-contact.mjs` at phone width (390 x 844 CSS px, 3x) from https://ka-performancefl.com/contact/ (200). File: `source/captures/contact-form-phone.png` (copy of `2026-10-20-2/source/captures/contact-form-phone.png`, also in `D:\kap-reel\assets\social\2026-10-20\`). Not edited; the floating header and chat button were hidden for the element shot only. The count (3 visible fields: Name, Email, Message; hidden fields and the honeypot not counted) is in `2026-10-20-2/source/contact-check.json`.
- The twelve-field form and the reply are drawn, labeled "Drawn example" on every frame they appear, and named as drawn in every caption. Dana, Jo and the patio job are fictional.
- No statistics. "Every extra field is one more reason to stop" is stated as advice, with no number or result claimed.
- Contrast: 12 text pairs computed in `source/contrast.json` (script `2026-10-20-2/source/contrast.mjs`), lowest 6.36:1.
- No AI voice or visuals, no AI vendor named.

## YouTube Short
Same file, same music (one use under the 30-day rule), 12:00 PM. Title "Your contact form only needs three fields" (41 characters). Playlist "Quick fixes for your website". Tags: contact form, website form fields, small business website, website design tips, Gainesville web design. `youtube.md`: hook, the tagged /services/web-design/ link on line 2, three sentences, the drawn-example line, "The music is AI generated." and the footer from `plans/youtube-setup.md`. The thumbnail entry is scoped to Facebook and Instagram, so YouTube gets the video only.

## Music
`music-w1020-r`: new ElevenLabs music_v2 track, light and tidy indie pop, about 114 bpm, a snappy chicken-picked clean electric guitar riff over muted sixteenth-note strums, bouncy electric bass and a dry tight kit, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-20\music.ts gen r`, logged in `D:\kap-reel\config\audio.json` (set `social-w1020`) and `D:\kap-reel\LICENSING.md`. Passed the first-second, silence, clipping and ending checks; the vocal check transcribed zero words. Delivered reel: -14.0 LUFS integrated, -1.6 dBTP true peak.

## Build
Render: `node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-10-20/index.ts Social1020FormVertical out/social/2026-10-20/render-vertical.mp4 --concurrency 3`, then `node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-20/deliver.ts` (mix, encode, SRT from the on-screen text, thumbnail at frame 70, copies to media/). Contact sheet at 0.5 s: `source/contact-sheet.jpg`.

Approved: yes (week plan plans/2026-10-19.md, Alex 2026-09-30)
