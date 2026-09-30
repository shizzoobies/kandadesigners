# Brief: Let AI proofread, not rewrite (carousel)

Slot: Sun 2026-10-18, 6:00 PM Eastern. Instagram carousel (POST, 8 slides at 1080x1350) and a Facebook slide video (POST, 25.0 s, music bed `music-w1018`). No LinkedIn, no YouTube Short (weekend).
Pillar: ai-launch. Link: the paid 90-Day AI Launch, https://ka-performancefl.com/ai-launch/ (Facebook line 2, Instagram link in bio). Captions carry the L2 line (build brief rule 2): this extends L2, "Let AI draft it. Make it sound like you."

## What the viewer gets
One copy-and-paste prompt that asks an AI tool to proofread without rewriting: list errors with the smallest fix, unclear sentences and what a reader might misread, and every fact to check, and forbid a revised version so the text stays in the owner's voice. Then a real run on a fictional business paragraph, shown word for word, and the check they make themselves: did it rewrite anything, make the fixes in your own words, answer what only you know. The Sunday-night prompt habit from 9/27 and 10/11.

## Hook
Slide 1: "Let AI proofread, not rewrite." "One prompt that finds the mistakes and leaves your voice alone." A printed draft with two of the model's real notes stuck to it.

## Look
Sticky notes on a printed draft (the plan's format idea): a white printed About page on a dark leather desk, with the AI model's notes as yellow (errors), mint (unclear) and coral (facts) sticky notes, each quoting the reply word for word, numbered marks on the page where they point (wavy proof underline for errors, solid underline for unclear, so the line style carries the meaning, not only the color), and the owner's own fixes as pencil marks, labeled as drawn. The K&A header sits on a cream letterhead band with a rust rule. Distinct from every carousel in the used list (the chat window and cookbook page included: no chat bubbles, no recipe card). Working colors: desk #34302B, sticky yellow #FFE27A, mint #C6ECD5, coral #FFCDB8, proof red #B42318 (marks only), with the brand cream, ink, rust and dark teal. No purple, no cobalt, no pills, no em dashes. Contrast computed from the rendered slides, pencil fixes included (`source/contrast.json`): 153 text runs, 25 distinct pairs, lowest 5.29:1 (white letter on the green mark), no failures. Every slide: K&A logo and ka-performancefl.com at the top, slide count and swipe cue at the bottom.

## Slides
1. Hook, as above. Tags "Checked by an AI model. Word for word." and "Fictional business".
2. The prompt: "Copy this prompt. It asks for notes, not a new version." The whole prompt as a printed sheet, the paragraph replaced by "[paste your paragraph]". Sticky: "Screenshot this."
3. "A real run, on a made-up dog groomer." The fictional paragraph, word for word. Sticky from us: we wrote it with a few mistakes on purpose.
4. What came back, 1 of 3: errors. Five yellow notes, word for word (including the model's optional "towel-dry").
5. What came back, 2 of 3: unclear sentences. Two mint notes, word for word. "No rewrite. It says what's unclear and leaves the wording to you."
6. What came back, 3 of 3: facts only you can check. The founding year note (2014 vs "over fifteen years"), the promise note ("we never rush a nervous pup"), and the rest of its list.
7. Your part: "Then you make the fixes, in your words." Three checks, and the draft with the owner's pencil fixes (drawn, fictional).
8. CTA: the L2 walkthrough on our YouTube (youtube.com/@KAPerformancefl), then the 90-Day AI Launch: "Ninety days to one part of your business running on AI. A twelve-week build, one on one with Alex." ka-performancefl.com/ai-launch. Call Alex 904-210-1071. "The first call is twenty minutes and free."

## Sources and truth
- The real AI run: `source/ai-run.md`. K&A wrote the prompt and the fictional paragraph (with five mistakes planted on purpose, listed in the file), sent them as one message to a general purpose AI model in a fresh session on 2026-09-30 at 13:50 Eastern, and saved the prompt and the first response verbatim. `source/build.mjs` reads `ai-run.md` and refuses to build if any line shown as the model's words is not in the output verbatim (17 strings), and takes the paragraph and the prompt template straight from the saved prompt.
- On screen: "Checked by an AI model" and "Fictional business". No vendor, product or model name anywhere (slides, captions, alt text, file names).
- The owner's pencil fixes on slide 7 are ours, drawn, and labeled; the "twelve years" is the fictional owner's answer to the model's question, not the model's.
- CTA lines from the live /ai-launch/ page source (`source/captures/ai-launch.html`, fetched 2026-09-30): "Ninety days to one part of your business running on AI", "A twelve-week build, one on one with Alex", "The first call is twenty minutes and free." The program is paid; nothing calls it free. No promised results or time savings.
- The L2 description ("voice notes and a saved prompt for your customer replies") matches the Oct 11 captions, which point to the same video. No caption mentions L4 or any coming video.
- Links, checked 2026-09-30, all 200: https://ka-performancefl.com/ai-launch/ (and with the Facebook utm tag), https://www.youtube.com/@KAPerformancefl.

## Music
`music-w1018`: new ElevenLabs music_v2 track, a settled, quiet Sunday evening: fingerpicked steel string acoustic melody, a soft clarinet counter line, muted electric bass, brushed snare and shaker, about 80 bpm, no vocals. Distinct from every bed in `plans/2026-09-28-music.md`, `music-history.json` and `D:\kap-reel\config\audio.json` (checked 2026-09-30; no clarinet anywhere yet). Generator `D:\kap-reel\scripts\social\2026-10-18\music.ts`, logged in `config/audio.json` (set `social-w1018`), `LICENSING.md` and `music-history.json`. Passed the first-second, silence, clipping and ending checks; the vocal check transcribed zero words. Slide video: -14.1 LUFS integrated, -1.8 dBTP, 25.0 s.

## AI
ai.voice false, ai.visuals false. The notes on slides 1 and 4 to 6 are AI written and labeled on every slide they appear on, and the captions say so. The music is AI generated and disclosed in the Facebook caption; Instagram gets still slides, no music line.

## Build
From `source/`: `node build.mjs` (reads `ai-run.md`). Then `node tools/slideshow.mjs 2026-10-18 --music "D:\kap-reel\out\candidates\music-w1018.mp3"`. Contact sheets: `source/contact-sheet.png` (slides), `source/slideshow-contact-sheet.jpg` (video at 0.5 s).

Approved: yes (week plan plans/2026-10-19.md, Alex 2026-09-30)
