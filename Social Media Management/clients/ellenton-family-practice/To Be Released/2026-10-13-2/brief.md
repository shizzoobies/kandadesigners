# Brief: Women's health

Slot: Tue 2026-10-13, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: services (week 2, one service a day). The plan is `plans/2026-10-03-new-patients.md`, slot "Tue Oct 13. Breast cancer awareness month", card "Women's health".
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Women's health is part of the care at the family practice in Ellenton, and the way to ask about it is one phone call.

## Hook
"Women's health, close to home." On the card and as caption line 1.

## Call to action
New patients: call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-13-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
`card.html`, light theme (shell ground), from the shared templates, unchanged.
- Top: the EFPD logo, top center.
- Eyebrow: "Family medicine in Ellenton".
- Headline: "Women's health, close to home." (curly apostrophe on the card).
- Moss rule, then "One of the services at Ellenton Family Practice Direct. Ask about it when you call."
- The amber "Call 941 417 7386" button; familypracticedirect.com at the foot.

## Sources and truth
- Women's health as a service, and physicals, preventive screenings and vaccinations: `D:\Ellenton Family Practice Rebuild\src\data\services.ts` ("Womens and mens health", "Annual physicals and wellness exams", "Preventive screenings and vaccinations"), shown on /family-medicine.
- Insurance, uninsured patients, DPC memberships: the plan ("Three ways to be seen") and the brief's allowed facts.
- Address and weekday hours: `src/data/site.ts` (`address`, `hoursDisplay`). Saturday hours, 9:00 AM to 2:00 PM: Alex's change request of 2026-10-02 (owner). Phone: `site.ts` `phone.display` (941 417 7386).
- Never said: any specific women's health test or screening the practice performs, any statistic, any outcome, any drug name, any price.

## AI
No AI voice or visuals. A card, so no music.

## Build
Shared templates copied to `source/`; `node build.mjs card card.json` from `source/` wrote `media/card.png` and `source/contrast.json` (lowest pair 5.26:1). Fonts: Lora and DM Sans from the site's Fontsource files, both loaded (the build checks every glyph).

## Questions for Alex
None.
