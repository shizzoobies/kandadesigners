# Brief: Preventive screenings and vaccinations

Slot: Sun 2026-10-11, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: services (week 2, one service a day). The plan is `plans/2026-10-03-new-patients.md`, slot "Sun Oct 11. Flu season", card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
The service, one frame: preventive screenings and vaccinations are part of everyday care at the practice, for adults and children. It sits beside the noon flu reel without repeating it.

## Hook
"Preventive screenings and vaccinations, close to home." Caption line 1; the card headline is the service name.

## Call to action
New patients call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-11-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
`card.html`, light theme: logo top center, eyebrow "Family medicine", headline "Preventive screenings and vaccinations" (Lora), moss rule, sub "Part of everyday care for adults and children in Ellenton.", the amber "Call 941 417 7386" button, familypracticedirect.com at the foot. No photo.

## Sources and truth
- "Preventive screenings and vaccinations": `D:\Ellenton Family Practice Rebuild\src\data\services.ts` and the live https://familypracticedirect.com/family-medicine list (checked 2026-10-02).
- "Adults and children": the Family Medicine intro in `services.ts` ("Everyday primary care for adults and children").
- Insurance, uninsured, DPC memberships, address, weekday hours, phone: the brief's allowed facts, from `src/data/site.ts` and the live site. Saturday hours, 9:00 AM to 2:00 PM: Alex's change request of 2026-10-02 (owner).
- Never said: any specific vaccine or screening by name, flu vaccine availability (plan question 2 is open), timing advice, outcomes, prices.
- Disclaimer line carried in both captions because the subject is vaccinations.

## AI
None. No AI visuals, no AI voice. No video, so no music.

## Build
`source/card.json` rendered with the shared template: `node build.mjs card.json` from `source/`. Fonts: Lora and DM Sans (the site's own Fontsource files). Contrast lowest 5.26:1 (`source/contrast.json`).

## Questions for Alex
None.
