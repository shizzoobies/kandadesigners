# Brief: Three fonts, max (reel, plus YouTube Short)

Slot: Tue 2026-10-13. Facebook REEL and Instagram REEL at 10:30 AM Eastern; the same video as a YouTube SHORT at 12:00 PM (per-network `time`).
Pillar: tip (web design day). Link: https://ka-performancefl.com/services/web-design/ (returned 200 on 2026-09-28).

## What the viewer gets
One type rule for their own site: three fonts, max. One for headings, one for body text, maybe one for labels, and size and weight for everything else. They see why (a drawn page in seven fonts where nothing leads), watch the same page drop to three with a live count, and then see K&A's own site doing it.

## Hook
"Three fonts, max." on frame 0, with "One for headings. One for body text. Maybe one for labels." under it, over the drawn seven-font page and its counter reading 7.

## Format
21.0 s vertical, 1080x1920, 30 fps, text led, no narration, music bed only. Remotion entry `D:\kap-reel\src\social\2026-10-13\index.ts` (composition `Social1013FontsVertical`), delivered by `D:\kap-reel\scripts\social\2026-10-13\deliver.ts`. K&A logo and ka-performancefl.com in the brand row on every frame, inside the safe area.

Look: cream canvas with the brand row and headline, an espresso stage below. The drawn page sits on the stage with a tag naming the font on every line and a count, "Fonts on this page", computed from the lines on screen (not typed).

## Beats
- 0.0 to 2.8 s, hook: "Three fonts, max." The drawn page in seven fonts (Courier New, Impact, Brush Script MT, Times New Roman, Georgia, Comic Sans MS, Papyrus), each named as its tag lands. Count: 7.
- 2.8 to 5.6 s: "Seven fonts. Nothing leads." / "Every line competes for attention."
- 5.6 to 9.4 s: "Give each font one job." Heading, body and label lines switch to Schibsted Grotesk, Atkinson Hyperlegible Next and Lenia Mono, tagged Headings, Body text, Labels. Count stays 7 while the new fonts arrive.
- 9.4 to 12.4 s: "Size and weight do the rest." The other four lines follow (subhead in the heading font, hours and button in the body font at 700, footer in the label font). Count: 6, 5, 4, 3. "Same page. Three fonts."
- 12.4 to 17.2 s: "Our own site uses three." A real capture of ka-performancefl.com/services/web-design/ on a phone, with its label, heading and body called out: Lenia Mono, Schibsted Grotesk, Atkinson Hyperlegible Next. Count: 3. "Your logo is artwork. It doesn't count."
- 17.2 to 21.0 s, CTA holds: "Want a site that speaks with one voice?" Headings / Body text / LABELS in the three fonts, ka-performancefl.com, Web design from Gainesville, Call Alex 904-210-1071.

## Sources and truth
- K&A's type set, measured on the live site 2026-09-28 by `2026-10-13-2/source/measure-site.mjs` into `source/site-fonts.json` (every font family rendering text, per page). /services/web-design/, /services/accessibility/ and /contact/ render exactly three families: Schibsted Grotesk, Atkinson Hyperlegible Next, Lenia Mono. The home page also draws its big K & A lockup in live text with two logo-only subsets (KA Playfair and KA Poppins, only the logo's letters), which is why the reel says the logo is artwork and doesn't count (see the question below).
- The capture on screen: `source/captures/type-webdesign-phone.png` (390 x 844 CSS px at 3x), made by `source/capture-type.mjs`; the label, heading and body positions and their computed fonts are in `source/type-captures.json`. Not edited; cropped to the label, heading and first lines of the body. No client work on screen.
- The seven-font page is drawn, uses a fictional dog groomer with no name, price or number, and is labeled "Drawn example. Not a real business." on every frame it appears and in every caption. Its seven faces are system fonts rendered in the drawing only.
- Contrast: every text pair in the reel is computed in `source/contrast.json` (`source/contrast.mjs`); the lowest is amber on espresso at 5.29:1.
- No AI voice, no AI visuals. No results, time savings or statistics claimed.

## YouTube Short
Same file, same music (one use under the 30-day rule), posted at 12:00 PM. Title "How many fonts should your website use? Three, max" (51 characters). Playlist "Quick fixes for your website". Description `youtube.md`: hook, the tagged /services/web-design/ link on line 2, three sentences, the drawn-example line, the AI music line and the channel footer from `plans/youtube-setup.md`. The thumbnail entry is scoped to Facebook and Instagram, so YouTube gets the video only.

## Music
`music-w1013-r`: new ElevenLabs music_v2 track, tidy and confident indie pop, about 110 bpm, percussive fingerstyle acoustic guitar with body taps, a slapback clean electric three-note hook, picked bass, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-13\music.ts gen r`, logged in `D:\kap-reel\config\audio.json` (set `social-w1013`) and `D:\kap-reel\LICENSING.md`. The raw take opened with about 9 s of quiet intro, so it was cut at the full band entry (9.015 s, 5 ms fade in) into `D:\kap-reel\out\social\music-w1013\music-w1013-r.wav`, which passes every check; its final chord rings out under the CTA. The vocal check transcribed zero words. Delivered reel: -13.8 LUFS integrated, -1.3 dBTP true peak.

## Build
Render: `node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-10-13/index.ts Social1013FontsVertical out/social/2026-10-13/render-vertical.mp4 --concurrency 3`, then `node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-13/deliver.ts` (mix, encode, SRT from the on-screen text, thumbnail at frame 78, copies to media/). Contact sheet at 0.5 s: `source/contact-sheet.jpg`.

Approved: yes (week plan plans/2026-10-12.md, Alex 2026-09-28)

## Questions for Alex
- The home page draws its big K & A lockup with two tiny logo-only font files, so a strict count there is five files; every inner page renders exactly three. The reel says "Our own site uses three" over the web design page and adds "Your logo is artwork. It doesn't count." Keep that wording, or say "Our pages use three"?
