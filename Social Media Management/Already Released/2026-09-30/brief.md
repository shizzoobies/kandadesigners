# Brief: One screen, one decision

Slot: Wed 2026-09-30, 10:30 AM. Facebook and Instagram.
Pillar: training (instructional design).

## What the viewer gets
How we think when we build a course: every screen asks the learner for exactly one thing.

## Hook
If a screen asks the learner to do two things, it does neither.

## Format
15 second vertical reel: screen captures from a real sample module (safety or RFI), narrated in the new voice, new music. Carousel of four stills as the alternate if the captures do not read at phone size.

## Needs
- Script, about 45 words, in the brand voice. Drafted below for Alex before anything is generated.
- Captures from the sample module at 1080x1920.
- Voice (v3, tags), music, render, captions, thumbnail.

## Script draft

Trimmed to fit 20s, approved by Alex 2026-09-24.

Beat 1 (hook): If a screen asks the learner to do two things, it does neither.
Beat 2: Read this, click that, answer this. Three screens pretending to be one.
Beat 3: We build one decision per screen. The learner acts, gets feedback, moves on.
Beat 4: Fewer clicks. More learning. That is the whole trick.
CTA: Free sample courses, link in the caption.

Word count: 54. The url is on the end card only (ka-performancefl.com/training), not spoken. On screen: a real sample module, one screen per beat, the cluttered version labeled "example" (an invented mock).

Final duration: 23.0 seconds (690 frames). The standard 600 frame (20 second) cap does not fit this script, by about 3 seconds even on the fastest clean reads; Alex kept the trimmed words, so the reel runs as long as they take.

## AI
Voice is AI narrated; disclose. Set ai.voice true. Captures are real.

Approved: yes for the slot; the script needs an ok from Alex before generation.

## Revision 2 (2026-09-25)

Rebuilt after Alex's rework direction (plans/2026-09-28-rework.md). Text led, no narration (voice on hold, no ElevenLabs). Editorial magazine style: cream paper, big rust numerals, pull-quote type, real course screens set like photos, rust rule system. K&A logo (masthead) and ka-performancefl.com/training plus Call 904-210-1071 (footer) on every frame, inside the safe area. 19.0 seconds, 570 frames, music-i-c (licensed) at -14 LUFS.

Beats:
- 0.0 to 3.2s, hook: pull quote "If a screen asks the learner to do two things, it does neither." Whole on frame 0. Under it: "One screen, one decision. How K&A builds every course, shown in a real one."
- 3.2 to 7.2s, 01 The map: "The board: every location in view." Real screen: audit-idle (the inspection board). Dek: "Learners see the whole job first."
- 7.2 to 11.2s, 02 One decision: "Tap one. It asks one thing: hold or go." Real screens: audit-open, the tap on Place hold marker, audit-hold. Dek: "One clear call. Your team knows what to do."
- 11.2 to 15.2s, 03 Feedback: "Feedback on that one decision, right away." Real screen: hunt-feedback (the ladder feedback). Dek: "Act, get feedback, move on. It sticks."
- 15.2 to 19.0s, end card (holds to the last frame): "We design training people finish." Try a free sample course, ka-performancefl.com/training, Call Alex 904-210-1071.

Every screen is a real capture from the live safety sample (src/tutorial/onescreen/captures.json). The invented cluttered mock from the voiced cut is gone. The three beats show how we design, not a before and after: the map of the whole job, then one decision per screen, then feedback on that decision. None of it presents K&A's own course as a bad example. Captions: music disclosed as AI generated; ai.voice is now false. The voiced cut is kept in source/cut-v3-voice/.

Build: D:\kap-reel\src\social\2026-09-30\ (entry index.ts, composition Wed0930OneScreen), delivery scripts/social/2026-09-30/deliver.ts.

## Questions for Alex
- The course screens are small on a phone, so they read as pictures and the headlines carry the message. OK?
