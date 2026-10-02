# Brief: Where to find us

Slot: Sat 2026-10-03, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: where we are (week 1: who, where, how). The plan is `plans/2026-10-03-new-patients.md`, slot "Sat Oct 3. Who we are", the card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
The address, the landmarks people here navigate by, and the phone, in one frame.

## Hook
"Where to find us." The card's eyebrow and caption line 1.

## Call to action
New patients call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-03-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
Shared `card.html`, light (shell) ground. Logo top center; eyebrow "Where to find us"; headline "907 25th Dr East, Ellenton, FL 34222" in Lora; moss rule; "On Highway 301, about two miles from the Ellenton Outlet Mall and I 75."; the amber Call 941 417 7386 button; familypracticedirect.com at the foot.

## Sources and truth
- Address, Highway 301, the two-mile landmarks (Palmetto, the Ellenton Outlet Mall, I 75), hours, phone: `src/data/site.ts` (`address`, `directions`, `hoursDisplay`, `phone`), also on the live contact page.
- Never said: the door sign's number, any price, the chiropractor, "same-day".

## AI
None. No AI voice or visuals.

## Build
`source/build.mjs card.json` (Playwright, shared template): `media/card.png`, `source/contrast.json` (lowest pair 5.26:1). Fonts: Lora and DM Sans, the site's own variable files. No video, so no music.

## Questions for Alex
None.
