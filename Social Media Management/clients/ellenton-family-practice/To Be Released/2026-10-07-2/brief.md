# Brief: Already a patient? The portal

Slot: Wed 2026-10-07, 5:30 PM Eastern. Facebook and Instagram feed POST, one card at 1080x1350.
Pillar: how to be seen (week 1: who, where and how). The plan is `plans/2026-10-03-new-patients.md`, slot "Wed Oct 7. Three ways to be seen", the card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Existing patients learn the portal is the quickest way to records and refills; Facebook gives the portal link itself. New patients still get the phone number.

## Hook
"Already a patient? Start with the portal." On the card and as caption line 1.

## Call to action
Existing patients: the patient portal (Facebook carries https://13889.portal.athenahealth.com/ in the body; Instagram points to the Patient Portal link at the top of every page on the site). New patients: call 941 417 7386. Facebook line 2 and the close carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-07-2` (returned 200 on 2026-10-02; the portal URL also returned 200). Instagram says link in bio; hashtags under `## First comment`.

## The card
`card` template, dark theme. Logo top center on its shell plate, eyebrow "Patient portal", headline "Already a patient? / Start with the portal.", moss rule, sub "The fastest route for records and refills.", the amber Call 941 417 7386 button, familypracticedirect.com at the foot.

## Sources and truth
- Portal URL: `SITE/src/data/site.ts` `patientPortal`.
- "The fastest route for records and refills": `SITE/src/sections/Contact.astro` ("the portal is the fastest route for records and refills").
- "Messages" (captions only): the plan's Wed Oct 7 card line ("Records, refills, messages").
- Portal link at the top of every page: `SITE/src/components/UtilityBar.astro` and `SITE/src/pages/accessibility.astro`.
- Hours: `SITE/src/data/site.ts` `hoursDisplay`. Phone: `site.ts` `phone.display`.
- Never said: anything about portal features beyond records, refills and messages; same day promises; prices.

## AI
None. No AI visuals, voice or music.

## Build
`source/build.mjs` with `source/card.json` (`node build.mjs card card.json` from `source/`), the shared template copied unchanged. Fonts Lora and DM Sans (the site's own variable Fontsource files), all glyphs checked. Contrast report `source/contrast.json`, lowest 5.26:1.

## Questions for Alex
None.
