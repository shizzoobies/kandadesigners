# Brief: What not to paste into an AI tool (reel, plus the YouTube Short)

Slot: Thu 2026-10-15. Facebook REEL and Instagram REEL at 10:30 AM Eastern; the same
video as a YouTube SHORT at 12:00 PM (per-network `time`), playlist "Practical AI for
small business".
Pillar: ai-launch (Thursday is the AI day). Link: the paid 90-Day AI Launch,
https://ka-performancefl.com/ai-launch/ (Facebook line 2, Instagram link in bio,
YouTube line 2).

## What the viewer gets
Four things to take out of a customer email before pasting it into any AI tool (card
numbers, passwords and door codes, health details, anything told in confidence), shown
on one sample email, then proof that the reply still works without them (a real AI
draft, quoted word for word), and one more habit: check your AI tool's data settings.
It is the short version of L2's privacy section ("Keep private details out"), with no
vendor named. General guidance, not legal advice, said in every caption and on the end
card.

## Hook
"Before you paste an email into AI. Take these 4 things out." On screen from frame 0,
with the four parts marked on the sample email inside the first second.

## Format
23.0 s vertical, 1080x1920, 30 fps, text led, no narration, music bed only. Look: a
redaction. One email card (labeled "Sample email. Fictional customer.") stays on screen
while each sensitive part gets a black bar and the label that was pasted in its place.
Different from last Thursday's tracked-changes sheet and the chat window before it.
K&A lockup and ka-performancefl.com in the brand row on every frame, all text inside
the vertical safe area. Body text on the email is 36 px, the quoted AI draft 44 px.

## Beats
- 0.0 to 3.0 s, hook: "Before you paste an email into AI. Take these 4 things out."
  "A sample email. The marked parts stay with you." The email from Pat to Sam's house
  cleaning service (fictional), four parts marked 1 to 4.
- 3.0 to 5.4 s, 1 of 4: "Card numbers. No reply needs them." The card line (dots only,
  never digits) becomes [card number removed].
- 5.4 to 7.8 s, 2 of 4: "Passwords and door codes. Anything that opens a door or an
  account." The door code line becomes [door code removed].
- 7.8 to 10.2 s, 3 of 4: "Health details. Keep the request. Drop the reason." "I just
  had knee surgery." becomes [health detail removed]; "Please skip the upstairs this
  time." stays.
- 10.2 to 12.6 s, 4 of 4: "Anything told in confidence. If they asked you to keep it
  quiet, keep it out." The house sale line becomes [private detail removed].
- 12.6 to 16.0 s: "Then paste the rest. The reply still works." Real AI draft, word for
  word: "We'd be happy to do a deep clean this Thursday afternoon. We'll skip the
  upstairs this time ... We'll charge the card on file once we're done." Then "Still
  read every draft before you send it."
- 16.0 to 19.0 s: "One more check. Check your AI tool's data settings. See how your
  chats are stored and used." A generic settings panel (Save chat history, Use my chats
  to improve the service) labeled "Example. Yours will look different."
- 19.0 to 23.0 s, CTA holds: "Want help putting AI to work in your business?" The
  90-Day AI Launch, ka-performancefl.com/ai-launch, Call Alex 904-210-1071. "General
  guidance, not legal advice."

## YouTube Short
- Title (56 characters): "What to take out of an email before you paste it into AI"
- Tags: AI privacy, AI for small business, customer emails, small business tips,
  practical AI, data privacy, Gainesville small business. No vendor names.
- `youtube.md`: hook, the tagged /ai-launch/ link, three plain sentences, the AI music
  line, the channel footer from plans/youtube-setup.md.
- Same file, same music (`music-w1015-r`, one use, same day). The thumbnail is scoped to
  Facebook and Instagram, so YouTube gets exactly one video.

## Sources and truth
- `source/ai-run.md`: the prompt (the email with the four parts replaced by the labels
  shown on screen) and the model's full first response, verbatim, run 2026-09-28 about
  15:35 Eastern in a new session with no history. No model or vendor is named anywhere.
  The reel quotes two fragments exactly, trimmed only with ellipses, and `deliver.ts`
  refuses to deliver if they are not in the verbatim output.
- The business (Sam's house cleaning), Pat, Biscuit and every detail in the email are
  fictional and labeled on screen and in the captions. The card number is shown only as
  dots.
- The four categories follow the approved plan and L2's privacy section
  (`To Be Released/2026-10-07-4/source/script.md`, beat 9). The settings screen is a
  generic drawing labeled as an example; it does not show or describe any real product.
- No statistics, no promised outcomes, no time savings, nothing implying K&A supplies AI
  accounts.
- Links checked 200: `source/link-check.md`. Text contrast computed, 12 pairs, lowest
  5.42:1: `source/contrast.json`.

## Music
`music-w1015-r`: new ElevenLabs music_v2 track, curious and light on its feet: a bright
electric sitar hook over a staccato muted acoustic ticking on the eighth notes, round
picked bass, finger snaps, about 112 bpm, no vocals. Generator
`D:\kap-reel\scripts\social\2026-10-15\music.ts`, logged in `D:\kap-reel\config\audio.json`
(set `social-w1015`) and `D:\kap-reel\LICENSING.md`. Passed the first-second, silence,
clipping and ending checks; the vocal check transcribed zero words. Delivered reel:
-14.0 LUFS integrated, -2.1 dBTP true peak.

## AI
No AI voice or visuals (ai false/false). The draft text on screen is a real AI output,
disclosed as such on screen and in every caption. The music is AI generated; every
caption says so.

## Build
Remotion entry `D:\kap-reel\src\social\2026-10-15\index.ts` (composition
`Social1015PasteVertical`, `PasteReel.tsx`, `timeline.ts`), delivered by
`D:\kap-reel\scripts\social\2026-10-15\deliver.ts`. Contact sheet (0.5 s):
`source/contact-sheet.jpg`.

Approved: yes (week plan plans/2026-10-12.md, Alex 2026-09-28)
