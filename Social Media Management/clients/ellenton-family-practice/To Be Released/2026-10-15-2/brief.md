# Brief: Men's health

Slot: Thu 2026-10-15, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: services (week 2, one service a day). The plan is `plans/2026-10-03-new-patients.md`, slot "Thu Oct 15. Kids", card "Men's health".
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
A plain nudge toward the annual physical, with men's health named as a service at the practice. One ask: call to book.

## Hook
"The checkup that's easy to put off." On the card and as caption line 1.

## Call to action
Call 941 417 7386 (the amber button on the card and the caption close). Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-15-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
`card` template, dark theme. Logo on its shell plate at the top; eyebrow "Men's health"; headline "The checkup that's / easy to put off."; moss rule; sub "Annual physicals and men's health care, / at your family practice in Ellenton."; amber "Call 941 417 7386"; familypracticedirect.com at the foot. No photo, no person.

## Sources and truth
- Services (men's health, annual physicals, preventive screenings and vaccinations, chronic condition management naming blood pressure and cholesterol): `D:\Ellenton Family Practice Rebuild\src\data\services.ts` and the live https://familypracticedirect.com/family-medicine ("Womens and mens health", "Annual physicals and wellness exams").
- Insurance accepted, uninsured seen, DPC memberships: the build brief's allowed facts and the plan ("Three ways to be seen").
- Phone 941 417 7386 and hours Monday to Friday 9:00 AM to 5:00 PM: `src/data/site.ts` and the live /contact page. Saturday hours, 9:00 AM to 2:00 PM: Alex's change request of 2026-10-02 (owner).
- "Easy to put off" is a soft framing of the plan's "the annual physical men skip"; no statistic, no outcome, no claim about what a physical finds.
- Never said: outcomes, "best", drug names, prices, same-day, the door sign's number.

## AI
None. No AI visuals or voice. No video, so no music.

## Build
`source/build.mjs` from the shared templates: `node build.mjs card card.json` in `source/`, writing `media/card.png` and `source/contrast.json` (lowest pair 5.26:1, all at or above 4.5:1). Fonts: Lora and DM Sans, the site's self-hosted Fontsource variable files.

## Questions for Alex
None.
