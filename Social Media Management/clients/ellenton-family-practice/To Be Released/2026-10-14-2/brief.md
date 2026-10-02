# Brief: Lab work on site

Slot: Wed 2026-10-14, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: services (week 2, one service a day). The plan is `plans/2026-10-03-new-patients.md`, slot "Wed Oct 14. Chronic care", card "Labs".
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Lab work is one of the services at the practice, so it can be asked about on the same call that books the visit.

## Hook
"Lab work on site." On the card and as caption line 1.

## Call to action
New patients: call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-14-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
`card.html`, dark theme (deep moss ground; the logo on its shell plate), from the shared templates, unchanged.
- Eyebrow: "Family medicine in Ellenton".
- Headline: "Lab work on site".
- Moss rule, then "One of the services at Ellenton Family Practice Direct. Ask about it when you call."
- The amber "Call 941 417 7386" button; familypracticedirect.com at the foot.

## Sources and truth
- Lab work as a service: `D:\Ellenton Family Practice Rebuild\src\data\services.ts` ("Lab work at wholesale pricing"), shown on /family-medicine. Built as "Lab work on site", not "wholesale", per the build brief's lab card note; the plan's question 5 decides whether this wording stands, changes, or the card drops.
- Physicals, chronic disease management, preventive screenings and vaccinations: `services.ts`.
- Insurance, uninsured patients, DPC memberships: the plan and the build brief's allowed facts. Phone: `site.ts`.
- Never said: "wholesale", any price, which tests are run, turnaround times.

## AI
No AI voice or visuals. A card, so no music.

## Build
Shared templates copied to `source/`; `node build.mjs card card.json` from `source/` wrote `media/card.png` and `source/contrast.json` (lowest pair 5.26:1). Fonts: Lora and DM Sans from the site's Fontsource files, both loaded. Holds for the practice's answer on the lab wording (plan question 5): swap or drop at release if the answer is not "lab work on site".

## Questions for Alex
- Is "Lab work on site" the right wording for this card? The website's service list says "Lab work at wholesale pricing". If the practice prefers other wording, the card changes before it posts, or comes out.
