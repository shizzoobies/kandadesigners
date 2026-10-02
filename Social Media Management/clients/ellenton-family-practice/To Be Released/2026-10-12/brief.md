# Brief: Sick today?

Slot: Mon 2026-10-12, 10:30 AM Eastern. Facebook and Instagram feed POST, a five slide carousel at 1080x1350.
Pillar: education (week 2 lead). The plan is `plans/2026-10-03-new-patients.md`, slot "Mon Oct 12. Sick visits", carousel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Acute care at a family practice, said plainly: what a sick visit covers (colds and the flu, infections, minor injuries), what is a 911 call instead, and to call the office first. No promise of same-day access.

## Hook
"Sick today?" Slide 1 and caption line 1.

## Call to action
Call the office first; New patients call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-12`. Instagram says link in bio; hashtags under `## First comment`. The disclaimer line sits before the close in both captions.

## The slides
`slide.html`, five layouts that never repeat side by side:
1. Hook, deep moss: "Sick visits" / "Sick today?" / "Your family practice treats acute illness and injury." / Swipe.
2. List, sand: "What a sick visit covers": Colds and the flu; Infections; Minor injuries.
3. Photo, light: the roadside sign (`hero-front-sign.png`, position 8% 50%): "Sick visits, right here on Highway 301" / "907 25th Dr East, Ellenton, FL 34222".
4. List, deep moss: "Call 911 for these": Severe chest pain or pressure; Trouble breathing; Suddenly unable to speak, see, walk or move; Heavy bleeding.
5. Closing, sand: "Sick today? Call the office first." / "Monday to Friday, 9:00 AM to 5:00 PM." / amber "Call 941 417 7386".

## Sources and truth
- "Acute illness and injury care": `D:\Ellenton Family Practice Rebuild\src\data\services.ts` and the live /family-medicine page (checked 2026-10-02).
- "Colds, flu, infections, minor injuries": the approved plan's slot text for Mon Oct 12.
- The 911 list, general information only, from MedlinePlus (U.S. National Library of Medicine), "When to use the emergency room - adult", https://medlineplus.gov/ency/patientinstructions/000593.htm (reviewed 9/4/2024; read 2026-10-02): "Severe chest pain or pressure", "Trouble breathing", "Suddenly not able to speak, see, walk, or move", "Heavy bleeding". Worded on the slide as "Suddenly unable to speak, see, walk or move".
- Address, Highway 301, hours, phone: `src/data/site.ts` and the live site.
- Photo: `D:\Ellenton Family Practice Rebuild\src\assets\images\hero-front-sign.png`, the sign named in the build brief (neighbors' panels already blurred; no person in frame). `reference\photos-allowlist.json` existed when this was built but listed no allowed clinic photos yet ("complete": false), so the sign is the only photo used.
- Never said: same-day for anyone, wait times, walk-ins, outcomes, drug names, prices, a full emergency list (four signs only, with the disclaimer).

## AI
None. No AI visuals, no AI voice.

## Build
`source/slides.json` rendered with the shared template: `node build.mjs slides.json` from `source/`. PNG masters `source/png/slide-01.png` to `slide-05.png`, JPGs `media/slide-01.jpg` to `slide-05.jpg`, `source/contact-sheet.png`, contrast lowest 4.91:1 (`source/contrast.json`). Fonts: Lora and DM Sans (the site's own Fontsource files). Each slide image is scoped to Instagram. Facebook slide video: finisher (track `music-efp-1012-c`).

## Questions for Alex
None.
