# Brief: New patients welcome

Slot: Fri 2026-10-16, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: new patients (the closing ask of the two weeks). The plan is `plans/2026-10-03-new-patients.md`, slot "Fri Oct 16. The annual physical", card "New patients welcome".
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Everything needed to become a patient in one frame: the address, the hours and the phone, under the practice's own tagline.

## Hook
"New patients welcome." On the card and as caption line 1.

## Call to action
Call 941 417 7386 (the amber button on the card and the caption close); existing patients use the portal (the link in the Facebook caption body only). Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-16-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
`card` template, light theme. Logo top center; eyebrow "Modern medicine. Old fashioned doctors."; headline "New patients / welcome."; moss rule; sub "907 25th Dr East, Ellenton / Monday to Friday, 9:00 AM to 5:00 PM"; amber "Call 941 417 7386"; familypracticedirect.com at the foot. No photo, no person.

## Sources and truth
- Tagline, address, landmarks, hours, Saturday note, phone, portal link: `D:\Ellenton Family Practice Rebuild\src\data\site.ts` and the live https://familypracticedirect.com/contact.
- Insurance accepted, uninsured seen, DPC memberships: the build brief's allowed facts and the plan ("Three ways to be seen").
- Never said: same-day for anyone, prices, the door sign's number, the chiropractor.

## AI
None. No AI visuals or voice. No video, so no music.

## Build
`source/build.mjs` from the shared templates: `node build.mjs card card.json` in `source/`, writing `media/card.png` and `source/contrast.json` (lowest pair 5.26:1, all at or above 4.5:1). Fonts: Lora and DM Sans, the site's self-hosted Fontsource variable files.

## Questions for Alex
None.
