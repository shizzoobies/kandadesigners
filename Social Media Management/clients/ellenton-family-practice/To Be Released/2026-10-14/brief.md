# Brief: Living with a chronic condition

Slot: Wed 2026-10-14, 10:30 AM Eastern. Facebook and Instagram feed POST, a five-slide carousel at 1080x1350.
Pillar: services (week 2 lead, education: chronic care). The plan is `plans/2026-10-03-new-patients.md`, slot "Wed Oct 14. Chronic care", carousel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Blood pressure, diabetes and cholesterol are managed at the family practice: regular visits, a plan you understand, a provider who knows your history, what to bring, and one ask: start with a call.

## Hook
"Living with a chronic condition." On slide 1 and as caption line 1.

## Call to action
New patients: call 941 417 7386 (slide 5 and the caption close). Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-14`. Instagram says link in bio; hashtags under `## First comment`. The caption carries the disclaimer line before the close.

## The slides
Shared `slide.html`, unchanged; no two neighbors share a layout or a ground.
1. Hook, deep green: eyebrow "Chronic care"; "Living with a chronic condition"; "Blood pressure, diabetes, cholesterol."; Swipe.
2. List, sand: "What steady care looks like": Regular visits. A plan you understand. A provider who knows your history.
3. Photo, cream: the practice's roadside sign (`hero-front-sign.png`, framed on the sign); "Chronic disease management, close to home"; "907 25th Dr East, Ellenton, on Highway 301."
4. List, deep green: "What to bring to your visit": Your ID and insurance card. A list of your medications. Your questions, written down.
5. Closing, cream: "Start with a call"; Monday to Friday, 9:00 AM to 5:00 PM; Saturday, 9:00 AM to 2:00 PM; the amber Call 941 417 7386 button.

## Sources and truth
- Chronic condition management for diabetes, blood pressure and cholesterol: `D:\Ellenton Family Practice Rebuild\src\data\services.ts` ("Chronic condition management (diabetes, blood pressure, thyroid, cholesterol)"), shown on /family-medicine. "Regular visits, a plan you understand, a provider who knows your history": the plan, slot Wed Oct 14.
- What to bring (ID, insurance card, medication list): the plan, slot Mon Oct 5.
- Insurance, uninsured patients, DPC memberships: the plan and the build brief's allowed facts.
- Address and Highway 301: `src/data/site.ts` (`address`, `directions`). Weekday hours: `site.ts` `hoursDisplay`. Saturday hours, 9:00 AM to 2:00 PM: Alex's change request of 2026-10-02 (owner). Phone: `site.ts` `phone.display`.
- Photo: `D:\Ellenton Family Practice Rebuild\src\assets\images\hero-front-sign.png` (the real sign, neighbors' panels already blurred, no person in frame, no phone number on it). The clinic photo allowlist was not yet available when this was built, so the sign is the only photo used.
- Never said: any drug or drug class, any target number or reading, any outcome, any price.

## AI
No AI voice or visuals.

## Build
Shared templates copied to `source/`; `node build.mjs slides.json` from `source/` wrote PNG masters `source/png/slide-01.png` to `slide-05.png`, JPGs `media/slide-01.jpg` to `slide-05.jpg`, `source/contact-sheet.png` and `source/contrast.json`. Fonts: Lora and DM Sans from the site's Fontsource files, both loaded. Each slide image is scoped to Instagram. Facebook slide video: finisher (music id `music-efp-1014-c`, applied by the finisher; not set here).

## Questions for Alex
None.
