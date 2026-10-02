# Brief: Hours

Slot: Mon 2026-10-05, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: how to book (week 1: who, where and how). The plan is `plans/2026-10-03-new-patients.md`, slot "Mon Oct 5. How to book", card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
When the office is open, in one frame: Monday to Friday, 9:00 AM to 5:00 PM, with Saturday appointments on request for established patients. One ask: new patients call 941 417 7386.

## Hook
"Our hours: Monday to Friday, 9:00 AM to 5:00 PM." Caption line 1; the card leads with the hours themselves under the eyebrow "Office hours".

## Call to action
New patients: call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-05-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
`card` template, light theme. Logo top center; eyebrow "Office hours"; headline "Monday to Friday, 9:00 AM to 5:00 PM" on two lines; moss rule; sub "Saturday appointments on request for established patients."; the amber "Call 941 417 7386" button; familypracticedirect.com at the foot.

## Sources and truth
- Hours and the Saturday note: `src/data/site.ts` (`hoursDisplay`, `hoursNote`) and the live contact page https://familypracticedirect.com/contact/.
- Address and Highway 301: `src/data/site.ts` (`address`, `directions`).
- Phone 941 417 7386: `src/data/site.ts` (`phone.display`).
- Never said: Saturday as regular opening hours, "same-day", the door sign's number.

## AI
None. No AI voice or visuals. No video, so no music.

## Build
`node build.mjs card.json` from `source/` (the shared card template, unchanged). Output `media/card.png` 1080x1350; contrast report `source/contrast.json`, lowest pair 5.26:1. Fonts: Lora and DM Sans from the site's own Fontsource files.

## Questions for Alex
None.
