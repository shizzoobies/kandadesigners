# Brief: Ask AI to find the questions in your reviews (reel, plus the YouTube Short)

Slot: Thu 2026-10-22. Facebook REEL and Instagram REEL at 10:30 AM Eastern; the same
video as a YouTube SHORT at 12:00 PM (per-network `time`), playlist "Practical AI for
small business".
Pillar: ai-launch (Thursday is the AI day). Link: the paid 90-Day AI Launch,
https://ka-performancefl.com/ai-launch/ (Facebook line 2, Instagram link in bio,
YouTube line 2).

## What the viewer gets
A three-step way to find the questions hiding in their own reviews: paste the public
reviews into an AI tool, ask which questions they answer for someone deciding whether to
book, and get a list with the review words behind each one. Shown on a real AI run over
six fictional reviews of a fictional dog groomer, output quoted word for word. It ends on
the division of labor: each question is a line for their website FAQ; the AI finds the
questions, the owner writes the answers with their own facts. Monday (2026-10-19) covers
the local search side of reviews; this is the AI side. No long video is mentioned.

## Hook
"Ask AI to find the questions in your reviews." On screen from frame 0, over three review
cards; a loupe lights one phrase in each within the first two seconds.

## Format
26.7 s vertical, 1080x1920, 30 fps, text led, no narration, music bed only. Look: a
loupe over review cards (new; not the planner grid, hand-in desk, search result card,
drawn page on a stage, phone screens with a progress row, redaction bars or clapper
slate). Brand palette (canvas, ink, rust, amber highlights, dark teal CTA). K&A lockup and
ka-performancefl.com in the brand row on every frame, all text inside the vertical safe
area.

## Beats
- 0.0 to 3.3 s, hook: "Ask AI to find the questions in your reviews." "Each review answers
  something the next customer wants to know." Three review cards (Tom, Keisha R., Ben),
  labeled "Fictional business. Fictional reviews."; the loupe lights "Easy parking in the
  lot out back.", "they close at 4 on Saturdays", "no appointment".
- 3.3 to 6.7 s, step 1: "Paste your public reviews." "Public reviews only. Private messages
  stay out." The six reviews drop into "Your prompt".
- 6.7 to 10.7 s, step 2: "Ask for the questions." The prompt's instruction lines, word for
  word, then "[the six reviews]".
- 10.7 to 17.3 s, step 3: "Get the list." "Real AI run, word for word. 6 of 13 shown."
  Output lines 1, 5, 6, 8, 9 and 11, each with its quoted review words.
- 17.3 to 22.7 s: "Each one is a question for your FAQ." A drawn FAQ block (labeled "Drawn
  example") with questions 5, 6 and 8 and "Your answer. Your facts." under each. Then "AI
  finds the questions. You write the answers."
- 22.7 to 26.7 s, CTA holds: "Want help putting AI to work in your business?" The 90-Day AI
  Launch, ka-performancefl.com/ai-launch, Call Alex 904-210-1071. "Fictional business and
  reviews. The AI run is real."

## YouTube Short
- Title (53 characters): "Ask AI to find the questions in your customer reviews"
- Tags: AI for small business, customer reviews, website FAQ, practical AI, small business
  tips, Google reviews, Gainesville small business. No vendor names.
- `youtube.md`: hook, the tagged /ai-launch/ link, three plain sentences, the general
  guidance line, the AI music line, the channel footer from plans/youtube-setup.md.
- Same file, same music (`music-w1022-r`, one use, same day). The thumbnail is scoped to
  Facebook and Instagram, so YouTube gets exactly one video.

## Sources and truth
- `source/ai-run.md`: the prompt and the model's full first response, verbatim, run
  2026-09-30 about 13:48 Eastern in a fresh session with no history. No model or vendor is
  named anywhere. `deliver.ts` refuses to deliver unless every output line, prompt line
  and review shown is in that file word for word.
- The business (Juniper Street Grooming), the six reviews and the reviewers are fictional,
  written by K&A, and labeled on screen and in every caption. Reviewer names are a first
  name or an initial.
- Privacy is general guidance ("Public reviews only. Private messages stay out."), and the
  captions say "General guidance, not legal advice."
- No statistics, no promised results or time savings, nothing implying K&A supplies AI
  accounts. "13 questions" is the count in the saved output.
- Links checked 200: `source/link-check.md`. Text contrast computed, 13 pairs, lowest text
  pair 5.42:1 (muted footnote on canvas); stars are graphics at 3.14:1 against a 3:1 need:
  `source/contrast.json` (script `../2026-10-22-2/source/contrast.mjs`).

## Music
`music-w1022-r`: new ElevenLabs music_v2 track, curious and pleased with itself: a bright
Irish bouzouki hook, a staccato muted electric guitar counter riff, warm fretted bass,
handclaps and tambourine, about 110 bpm, no vocals. Generator
`D:\kap-reel\scripts\social\2026-10-22\music.ts`, logged in `D:\kap-reel\config\audio.json`
(set `social-w1022`), `D:\kap-reel\LICENSING.md` and `music-history.json`. Passed the
first-second, silence, clipping and ending checks on the first take; the vocal check
transcribed zero words. Delivered reel: -14.0 LUFS integrated, -1.8 dBTP true peak.

## AI
No AI voice or visuals (ai false/false). The list on screen is a real AI output, disclosed
as such on screen and in every caption. The music is AI generated; every caption says so.

## Build
Remotion entry `D:\kap-reel\src\social\2026-10-22\index.ts` (composition
`Social1022ReviewsVertical`, `ReviewsReel.tsx`, `timeline.ts`), delivered by
`D:\kap-reel\scripts\social\2026-10-22\deliver.ts`. Contact sheet (0.5 s):
`source/contact-sheet.jpg`.

Approved: yes (week plan plans/2026-10-19.md, Alex 2026-09-30)
