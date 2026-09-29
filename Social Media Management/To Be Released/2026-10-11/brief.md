# Brief: Find your website's voice in ten minutes (carousel)

Slot: Sun 2026-10-11, 6:00 PM Eastern. Instagram carousel (POST, 8 slides at 1080x1350) and a Facebook slide video (POST, 25.0 s, music bed `music-w1011`). No LinkedIn, no YouTube Short (weekend).
Pillar: ai-launch. Link: the 90-Day AI Launch (https://ka-performancefl.com/ai-launch/). Captions carry the L2 line (Alex, 2026-09-28): this is the short version of L2, "Let AI draft it. Make it sound like you."

## What the viewer gets
One copy-and-paste prompt that turns three things they already have (a customer email they were proud to send, their About text as it is now, three words for how they want to sound) into a short voice guide: how they sound, 5 words to use, 5 to avoid, 3 sentence rules, and their About opening rewritten. Then a real run on a fictional business, shown word for word, and the check they make themselves: read it out loud, check every fact, keep only promises they'll keep. The Sunday-night prompt format that worked on 9/27.

## Hook
"Find your website's voice in ten minutes." Slide 1, as a recipe: makes a one-page voice guide, about 10 minutes, 3 things you have and 1 prompt. "Save this for Sunday night."

## Look
A cookbook page: a warm sheet with a double rule under the K&A header, recipe sections in Lenia Mono (A Sunday night recipe, Ingredients, Method, We tried it, What came back, The taste test), big rust quantities, the prompt as a typed card with the brackets highlighted. Distinct from the recent index card, exam paper, swatch, infographic, device mockup, checklist, stopwatch, planner, ticket, route map, trail map, split-flap, magazine, chat window and year planner carousels (full pages, no small cards, no chat window). Working colors: herb green #24452F and #1B3324 with the brand cream, ink and rust. No purple, no cobalt, no pills, no em dashes. Contrast computed from the rendered slides (`source/contrast.json`): 118 text runs, lowest 6.73:1, no failures. Every slide: K&A logo and ka-performancefl.com at the top, slide count and swipe cue at the bottom.

## Slides
1. Hook, recipe card: makes, time, you need; three ingredient cards.
2. Ingredients: "You already have all three." 1 customer email, 1 About text, 3 words, each with why.
3. Method: "Paste this into the AI tool you already use." The prompt as a template. "Screenshot this. Fill in the brackets."
4. "A real run, on a made-up garden nursery." Tag: "Fictional business, made up for this example." The three inputs.
5. What came back, 1 of 2. Tags: "Written by an AI model. Word for word." and fictional. How we sound, Use, Avoid.
6. What came back, 2 of 2. Sentence rules; About opening before and after.
7. The taste test: "Then check it yourself." Read it out loud; check every fact; keep only promises you'll keep, with the model's own note about the photo offer. Keep the guide and paste it in when you ask AI to write.
8. CTA: "The 90-Day AI Launch." One part of your business running on AI, twelve weeks, one on one; the three "you end with" lines from the /ai-launch/ page; ka-performancefl.com/ai-launch; Call Alex 904-210-1071; "The first call is twenty minutes and free." (also from the page).

## Sources and truth
- The real AI run: `source/ai-run.md`. K&A wrote the prompt and the fictional inputs, sent them as one message to a general purpose AI model in a fresh session on 2026-09-28 at 15:38 Eastern, and saved the prompt and the first response verbatim. The session carried the account's standing writing preferences, which the reply's last line shows; that is recorded in the file. `source/build.mjs` reads `ai-run.md` and refuses to build if any line shown as the model's words is not in the output verbatim (22 strings checked).
- On screen: "Written by an AI model" and "Fictional business". No vendor, product or model name anywhere (slides, captions, alt text, file names).
- The check on slide 7 is real: the rewrite really does move the email's photo offer onto the website, and the model really did flag it. Nothing in the output was corrected.
- CTA lines come from the /ai-launch/ page source (the "you end with" list and "The first call is twenty minutes and free.") and the home page ("one part of your business running on AI", "a twelve-week build, one on one"). The program is paid; nothing calls it free. No promised results or time savings. "Ten minutes" is the length of the exercise, as in the approved plan title.
- Links, checked 2026-09-28, all 200: https://ka-performancefl.com/ai-launch/ (and with the Facebook utm tag), https://www.youtube.com/@KAPerformancefl.

## Music
`music-w1011`: new ElevenLabs music_v2 track, warm, unhurried Sunday evening indie folk pop, about 88 bpm, strummed parlor acoustic with a simple melody, cello counter melody, soft harmonium chords, round bass, rim clicks, light tambourine, no vocals. Distinct from every bed in `plans/2026-09-28-music.md`, `music-history.json` and `config/audio.json` (checked 2026-09-28): no felt piano or capo strums (Sept 27), no 6/8 Wurlitzer (Oct 4), no nylon guitar (L2), and no electric volume swells (this week's Oct 15 carousel bed). Generator `D:\kap-reel\scripts\social\2026-10-11\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1011`) and `D:\kap-reel\LICENSING.md`. Passed the first-second, silence, clipping and ending checks; the vocal check transcribed zero words. Slide video: -14.1 LUFS integrated, -1.6 dBTP, 25.0 s.

## AI
ai.voice false, ai.visuals false. The guide text on slides 5 to 7 is AI written and labeled on every slide it appears on, and the captions say so. The music is AI generated and disclosed in the Facebook caption; Instagram gets still slides, no music line.

## Build
From `source/`: `node build.mjs` (reads `ai-run.md`). Then `node tools/slideshow.mjs 2026-10-11 --music "D:\kap-reel\out\candidates\music-w1011.mp3"`. Contact sheets: `source/contact-sheet.png` (slides), `source/slideshow-contact-sheet.jpg` (video at 0.5 s).

Approved: yes (week plan plans/2026-10-12.md, Alex 2026-09-28)
