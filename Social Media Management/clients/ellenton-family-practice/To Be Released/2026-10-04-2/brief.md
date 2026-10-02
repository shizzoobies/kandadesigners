# Brief: Saturday appointments, by request

Slot: Sun 2026-10-04, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: how to get seen (week 1: who, where and how). The plan is `plans/2026-10-03-new-patients.md`, slot "Sun Oct 4", the evening card.
Approved: yes (Alex in chat, 2026-10-02)

## What the viewer gets
Established patients can ask for a Saturday appointment by calling during the week; the office is open Monday to Friday, 9:00 AM to 5:00 PM. One ask: new patients call 941 417 7386.

## Hook
"Saturday appointments, by request." Caption line 1 and the card headline.

## Call to action
New patients: call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-04-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
`card` template, light theme. Logo top center; eyebrow "Hours"; headline "Saturday appointments, by request." on three lines; moss rule; sub "For established patients. Call during the week to ask."; the amber "Call 941 417 7386" button; familypracticedirect.com at the foot.

## Sources and truth
- Hours Monday to Friday, 9:00 AM to 5:00 PM: `src/data/site.ts` (`hoursDisplay`) and the live contact page https://familypracticedirect.com/contact/.
- Saturday appointments on request for established patients: `src/data/site.ts` (`hoursNote`) and the live contact page https://familypracticedirect.com/contact/.
- Phone 941 417 7386: `src/data/site.ts` (`phone.display`).
- Never said: Saturday as regular opening hours, Saturday for new patients, "same-day", the door sign's number.

## AI
None. No AI voice or visuals. No video, so no music.

## Build
`node build.mjs card.json` from `source/` (the shared card template, unchanged). Output `media/card.png` 1080x1350; contrast report `source/contrast.json`, lowest pair 5.26:1. Fonts: Lora and DM Sans from the site's own Fontsource files.

## Questions for Alex
None.
