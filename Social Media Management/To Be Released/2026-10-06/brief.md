# Brief: Your hero is a promise, not a photo

Slot: Tue 2026-10-06, 10:30 AM Eastern. Facebook REEL and Instagram REEL.
Pillar: tip (web design day).

## What the viewer gets
One rule and one test for their homepage's first screen. The rule: say what you do, where, proof, and the next step before anyone scrolls. The test: cover the photo; if the words still tell a stranger what they get, it works.

## Hook
"Your hero is a promise, not a photo." on frame 0, over a drawn phone showing the weak first screen.

## Format
19 s vertical reel, 1080x1920, 30 fps, text led, no narration, music bed only. The parked hero tutorial (Reels/instructional reels/hero, 2026-09-05, narrated, three client sites at the end) rebuilt from scratch in Remotion at `D:\kap-reel\src\social\2026-10-06` (own entry, Root.tsx untouched). No client site appears: the old cut's PB&J, MBS and Southern Legacy beat is gone. The weak and strong screens are one drawn phone, labeled on screen on every frame it appears: "Drawn example. Not a real business."

Look: cream canvas, brand row (logo, ka-performancefl.com, rust rule) on every frame, a dark teal stage holding the phone and a four-row list ("In the first screen") that crosses, then ticks, each item as it lands on the phone.

## Beats
- 0.0 to 2.5 s, hook: "Your hero is a promise, not a photo." Weak screen: a drawn stock photo (tagged STOCK PHOTO), "Welcome to our website", "Quality. Passion. Excellence."
- 2.5 to 6.5 s: "A photo and a welcome tell a stranger nothing." All four rows cross out.
- 6.5 to 12.5 s: "Say it before they scroll." The photo shrinks to a strip; the four items land one at a time, each with a numbered marker, and tick: "Fresh sourdough, baked daily." / "Gainesville. Open at 6 a.m." / five stars "5-star Google reviews" / an "Order ahead" button (plus Call in the nav).
- 12.5 to 15.0 s: "Cover the photo. Still clear? It works." The photo is covered; the words still carry it.
- 15.0 to 19.0 s, CTA holds: "Want a first screen that makes the promise?" ka-performancefl.com, Web design from Gainesville, Call Alex 904-210-1071.

## Sources and truth
- The bakery is invented and labeled on screen and in both captions. Its "5-star Google reviews" line is part of the drawn example, carries no count, and is not a claim about any real business. Alex confirmed this is fine (2026-09-25).
- Nothing is claimed about K&A's own results. Link: https://ka-performancefl.com/services/web-design/ (returned 200 on 2026-09-25, see 2026-10-06-2/source/captures/capture.json).
- No AI voice, no AI visuals. Music is AI generated and disclosed in both captions.

## Music
`music-w1006-r`: new ElevenLabs music_v2 track, funky clean guitar, upbeat (tight sixteenth note scratch rhythm, bluesy double stop hook, round bass, about 106 bpm, no vocals). Generator `D:\kap-reel\scripts\social\2026-10-06\music.ts gen r`, logged in `D:\kap-reel\config\audio.json` (set `social-w1006`) and `D:\kap-reel\LICENSING.md`. Passed the first second, silence, clipping and ending checks; the vocal check transcribed zero words. Delivered reel: -14.3 LUFS integrated, -1.4 dBTP true peak.

## Build
Render: `node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-10-06/index.ts Social1006HeroVertical out/social/2026-10-06/render-vertical.mp4 --concurrency 3`, then `node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-06/deliver.ts` (mix, encode, SRT from the on-screen text, thumbnail at frame 357, copies to media/). Contact sheet at 0.5 s: source/contact-sheet.jpg.

Approved: yes (week plan plans/2026-10-05.md, Alex 2026-09-25)

