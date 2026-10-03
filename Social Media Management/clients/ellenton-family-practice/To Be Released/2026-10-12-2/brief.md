# Brief: Minor procedures, handled here

Slot: Mon 2026-10-12, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: family-medicine (one service on the card). The plan is `plans/2026-10-03-new-patients.md`, slot "Mon Oct 12. Sick visits", second post of the day.
Approved: yes (Alex in chat, 2026-10-02)

## What the viewer gets
Minor procedures are part of the care at the family practice in Ellenton, done in the office, and the way to ask about one is a phone call.

## Hook
"Minor procedures, handled here." On the card and as caption line 1.

## Call to action
New patients: call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-12-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
`card.html`, dark theme, from the shared templates, unchanged.
- Top: the EFPD logo, top center, on its shell plate.
- Eyebrow: "Family medicine in Ellenton".
- Headline: "Minor procedures, handled here".
- Moss rule, then "One of the services at Ellenton Family Practice Direct. Ask about it when you call."
- The amber "Call 941 417 7386" button; familypracticedirect.com at the foot.

## Sources and truth
- Minor procedures as a service, done in the office: `D:\Ellenton Family Practice Rebuild\src\data\services.ts` ("Minor in-office procedures"), shown on the live /family-medicine page.
- The site does not say how many procedures the practice handles or that patients avoid being sent elsewhere, so the caption names the service and asks people to call; it claims nothing more.
- Address and weekday hours: `src/data/site.ts` (`address`, `hoursDisplay`). Saturday hours, 9:00 AM to 2:00 PM: Alex's change request of 2026-10-02 (owner). Phone: `site.ts` `phone.display` (941 417 7386).
- Never said: any specific procedure, any outcome, any drug name, any price.

## AI
No AI voice or visuals. A card, so no music.

## Build
Shared `build.mjs`, `brand.css` and `card.html` copied to `source/`; `node build.mjs card card.json` from `source/` wrote `media/card.png` and `source/contrast.json` (lowest pair 5.26:1). Fonts: Lora and DM Sans from the site's Fontsource files, both loaded (the build checks every glyph).

## Questions for Alex
None.
