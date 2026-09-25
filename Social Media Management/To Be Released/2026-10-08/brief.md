# Brief: AI drafts, you decide

Slot: Thu 2026-10-08, 10:30 AM Eastern. Facebook REEL and Instagram REEL.
Pillar: ai-launch (Thursday is the AI day). Link: the paid 90-Day AI Launch,
https://ka-performancefl.com/ai-launch/ (Facebook line 2, Instagram link in bio).

## What the viewer gets
A real before and after: one AI first draft of a customer reply, then the three
edits a person makes before it goes out (tone made personal, a wrong fact fixed,
an over-promise removed). The habit to take away: AI writes the first draft,
you keep the facts, the promises and the send button.

## Hook
AI drafts. You decide. (Both lines on screen from frame 0.)

## Format
19.8 s vertical reel, 1080x1920, 30 fps, text led, no narration, its own new
music bed. Look: one tall sheet of paper on a light desk, a reply document
with tracked changes (struck rust text = the AI's words, underlined teal text =
a person's). Deliberately the opposite of last week's Thursday reel (a dark
teal chat window). K&A lockup and ka-performancefl.com at the top of every
frame; a rust strip with "The 90-Day AI Launch, ka-performancefl.com/ai-launch"
at the bottom of every frame. All text inside the vertical safe area.

## Beats
1. 0.0 to 2.4 s, hook: "AI drafts. You decide." and "One real AI first draft
   of a customer reply, and the three edits a person made."
2. 2.4 to 5.7 s: document "Reply to Dana", labeled "Example: a bike repair
   shop". Dana asks: "Can you promise it will be ready by Friday?" Then "The
   AI's first draft, word for word. The parts we edit:" and only the sentences
   that get edited, at 44 px, quoted exactly with ellipses between them (Alex,
   2026-09-25). The full draft stays verbatim in source/ai-run.md.
3. 5.7 to 8.7 s, edit 1 of 3, Tone: "Thanks for bringing your bike in!" struck,
   "Thanks for trusting us with your race bike." added; "[Your Name]" struck,
   "Luis" added. Note: "Make it sound like you. A real thanks, a real name."
4. 8.7 to 12.1 s, edit 2 of 3, Fact: the AI's sentence saying the 20% off
   applies is struck; "Our 20% off deal ran through September, so it won't
   apply this time. Sorry for the mix-up." added. Note: "The deal ended in
   September. The AI had no way to know."
5. 12.1 to 15.5 s, edit 3 of 3, Promise: "we'll have it ready for you by
   Friday" sentence struck; "Tune-ups take 3 to 5 business days, so I can't
   promise Friday, but yours is first in line." added; "in plenty of time to
   prep" struck. Note: "It promised Friday. Only the shop can promise that."
6. 15.5 to 17.4 s, rule: "AI drafts. You decide." Make it sound like you.
   Check every fact. Cut promises you can't keep.
7. 17.4 to 19.8 s, end card holds: "Put AI to work in your business", "The
   90-Day AI Launch", ka-performancefl.com/ai-launch, "K&A Performance. Web
   design and AI integration, Gainesville, FL.", "Or call Alex: 904-210-1071".

## Sources
- source/ai-run.md: the one prompt and the model's full first response,
  verbatim, run 2026-09-25 14:22 Eastern. No model or vendor is named anywhere.
  The AI text on screen is quoted exactly; the only trims are marked with
  ellipses. deliver.ts refuses to deliver if content.ts and ai-run.md differ.
- The shop's facts (deal ended in September, 3 to 5 business days, owner Luis)
  are fictional and written down in ai-run.md as what the owner knows. They
  were not in the prompt, which is the point.
- No K&A numbers, no promised outcomes or time savings, nothing implying K&A
  supplies AI accounts.

## Build
D:\kap-reel\src\social\2026-10-08 (own entry index.ts, TrackedDraft.tsx,
content.ts), delivered by scripts\social\2026-10-08\deliver.ts. Contact sheet
at 0.5 s: source/contact-sheet.jpg.

## Music
music-w1008-r (new, ElevenLabs music_v2, curious and light: pizzicato strings,
clean electric guitar melody, upright bass, about 98 bpm). Generator
D:\kap-reel\scripts\social\2026-10-08\music.ts, logged in config/audio.json
(set social-w1008) and LICENSING.md. Vocal check: zero words. Delivered mix
-13.9 LUFS integrated, -1.5 dBTP true peak, 1.0 s fade out.

## AI
No AI voice, no AI visuals (ai false/false). The draft on screen is AI text and
the caption says so. The music is AI generated and the captions say so.

Approved: yes (week plan plans/2026-10-05.md, Alex 2026-09-25)
