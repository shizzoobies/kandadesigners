# Brief: Meet David Hervig, PA-C

Slot: Thu 2026-10-08, 10:30 AM Eastern. Facebook and Instagram feed POST, one card at 1080x1350.
Pillar: providers (week 1: who, where and how). The plan is `plans/2026-10-03-new-patients.md`, slot "Thu Oct 8. The PA", the 10:30 card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
A face and a name before the first visit: David Hervig, PA-C, Physician Assistant, US Army trained with twelve years of military service.

## Hook
"Meet David Hervig, PA-C." Caption line 1; the card carries the name, role and credentials.

## Call to action
New patients: call 941 417 7386. Facebook line 2 and the close carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-08` (returned 200 on 2026-10-02). Instagram says link in bio; hashtags under `## First comment`.

## The card
`provider` template, `photo` variant, light theme. Headshot left (rounded), eyebrow "Physician Assistant", name "David Hervig" in Lora, "PA-C", the line "US Army trained, with twelve years of military service.", the amber Call 941 417 7386 button, familypracticedirect.com at the foot.

Headshot: `SITE/src/assets/images/providers/david-hervig.jpg`, the file the live /providers page publishes (800 px wide), shown at 420x520 in the frame, so it is downsampled, not enlarged. Viewed at full size on the 1080 render: sharp, no blocking. The photo variant holds; no fallback needed.

## Sources and truth
- Name, credentials, role: `SITE/src/data/providers.ts` (`name` David Hervig, `credentials` PA-C, `role` Physician Assistant) and the live https://familypracticedirect.com/providers (checked 2026-10-02: "Physician Assistant / David Hervig / PA-C").
- US Army trained, twelve years of military service: the build brief's allowed facts and the plan's Thu Oct 8 slot; the same line is the short card text on the live /providers page ("Army trained Physician Assistant with twelve years of military service").
- Insurance, uninsured, memberships: `SITE/src/data/membership.ts` (FAQ "Do you accept insurance?").
- Left out: everything else in the bio (office management, outreach), which is pending the provider's approval; any combined years figure.

## AI
None. No AI visuals, voice or music.

## Build
`source/build.mjs` with `source/card.json` (`node build.mjs provider card.json` from `source/`), the shared template copied unchanged. Fonts Lora and DM Sans (the site's own variable Fontsource files), all glyphs checked; no enlargement NOTE. Contrast report `source/contrast.json`, lowest 5.26:1.

## Questions for Alex
- Is the headshot on the website cleared for use on social as well? If not, this card switches to the name-only version before it posts.
