# Brief: Healthcare the way it used to be (the plan's "A look inside")

Slot: Sun 2026-10-04, 12:00 PM Eastern. Facebook and Instagram REEL, 16.7 seconds, 1080x1920, silent until the finisher adds the track.
Pillar: who we are (week 1: who, where, how). The plan is `plans/2026-10-03-new-patients.md`, slot "Sun Oct 4. A look inside", the reel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
The practice's own line, who they will see, that new patients are welcome, and the number to call, over slow moves on the real roadside sign.

## Hook
"Healthcare the way it used to be." The first beat and caption line 1.

## Call to action
New patients call 941 417 7386 (the last five seconds, with the button). Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-04`. Instagram says link in bio; hashtags under `## First comment`.

## The cut
Every frame: the logo top center on a shell band, the photo in the middle, a deep moss band below with the beat, familypracticedirect.com at the foot. Four beats, 0.5 second crossfades, each beat clear for at least 2.9 seconds.
1. 0.0 to 4.4: slow zoom in on the sign. "Our roadside sign" / "Healthcare the way it used to be."
2. 3.9 to 8.3: slow pan across the sign. "Ellenton Family Practice Direct" / "Doctors who know you." / "Longer visits for members."
3. 7.8 to 12.2: closer zoom on the sign's face. "907 25th Dr East, Ellenton" / "New patients welcome."
4. 11.7 to 16.7: slow zoom out on the sign. "Monday to Friday, 9 to 5" / "Call to book." / Call 941 417 7386 button.
Cover: `media/reel-cover.jpg`, the frame at 2.0 seconds.

The plan called for empty-room interior shots. The reviewed clinic set (`reference/photos-allowlist.json`, complete, 92 reviewed) cleared none: every photo has a person in it. As the build brief directs, the reel uses the sign photo only, and the title and hook move from "A look inside" to the practice's own line so the frame stays honest (no interior is shown or claimed). The plan's beat "Longer visits. Doctors who know you." became "Doctors who know you." with "Longer visits for members." because the site ties longer visits to the membership.

## Sources and truth
- Photo: `src/assets/images/hero-front-sign.png` (the site's own; neighbors' panels already blurred; no person, no phone number visible).
- "Healthcare the way it used to be.": `src/data/site.ts` (`taglineSupport`).
- "Doctors who know you" and "a small team": the live /providers page ("You get to know your provider, and they get to know you."). "Longer visits for members": `/direct-primary-care` page and the build brief's allowed facts.
- Address, Highway 301, hours, phone: `src/data/site.ts`. Insurance, uninsured, memberships: `src/data/membership.ts`.
- Never said: prices, outcomes, "best", "same-day", the door sign's number, the chiropractor, any patient.

## AI
None. No AI voice or visuals.

## Build
`source/overlays.mjs` renders the four text layers (`source/overlays/shot-01.png` to `shot-04.png`) with Playwright from `source/reel.html` and `source/brand.css` (Lora and DM Sans, the site's own variable files; fails on a missing font, spilled text, a dash, an arrow or the door sign's number). `source/reel.mjs` builds `media/reel.mp4` with ffmpeg from `source/beats.json`: zoompan at 2x for smooth motion, overlays, xfade; H.264 High, yuv420p, 30 fps, CRF 18, no audio stream; then `media/reel-cover.jpg`. Music: none set here; the finisher adds track `music-efp-1004-r`.

## Questions for Alex
- No interior photo without a person in it was available, so this reel shows the roadside sign only. Once empty-room photos of the front desk, waiting room and an exam room are taken, the reel can be rebuilt as "A look inside".
