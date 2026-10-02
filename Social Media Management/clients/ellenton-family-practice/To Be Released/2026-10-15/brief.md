# Brief: Pediatric visits

Slot: Thu 2026-10-15, 10:30 AM Eastern. Facebook and Instagram feed POST, a five-slide carousel at 1080x1350.
Pillar: services (week 2, one service a day; an education lead, so the caption carries the disclaimer line). The plan is `plans/2026-10-03-new-patients.md`, slot "Thu Oct 15. Kids", carousel "Pediatric visits".
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Parents learn their children can be seen at the same family practice: checkups, sick visits, and sports and school physicals, one stop for the whole family. One ask: call to book.

## Hook
"Kids are seen here too." Slide 1 and caption line 1.

## Call to action
Call 941 417 7386 (the amber button on the last slide and the caption close). Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-15`. Instagram says link in bio; hashtags under `## First comment`. Disclaimer line before the close.

## The slides
1. Hook, cream: eyebrow "Pediatric visits"; "Kids are seen here too."; "Children see the same practice as their parents."; Swipe.
2. List, sand: "What we see children for": well child checkups; sick visits; sports and school physicals.
3. Photo, cream: the roadside sign (`hero-front-sign.png`, neighbors' panels already blurred, no person, no door number); "Our sign on Highway 301"; "One stop for the whole family."
4. List, deep green: "One practice for the whole family": insurance accepted, uninsured patients seen; Monday to Friday, 9:00 AM to 5:00 PM; Saturday appointments on request for established patients.
5. Closing, sand: "Book for the whole family."; "907 25th Dr East, Ellenton"; amber "Call 941 417 7386".

## Sources and truth
- "Everyday primary care for adults and children", "Pediatric and well child visits", "Acute illness and injury care", "Sports and school physicals", "Care for the whole household": `D:\Ellenton Family Practice Rebuild\src\data\services.ts` and the live https://familypracticedirect.com/family-medicine.
- "Children seen at the same practice as their parents", "checkups, sick visits, school forms", "one stop for the whole family": the plan, Thu Oct 15. "Bring the school's form": the plan, Sat Oct 10.
- Hours, Saturday note, address, phone: `src/data/site.ts` and the live /contact page. Insurance accepted, uninsured seen, DPC memberships: the build brief's allowed facts.
- Left out as not stated anywhere: an age range for children, pediatric vaccines specifically, newborn care, same-day visits.
- Photo: the sign only. The clinic photo allowlist (`reference/photos-allowlist.json`) had not appeared after the 25-minute wait, so the photo slide uses the sign, per the build brief.

## AI
None. No AI visuals or voice.

## Build
Shared templates copied to `source/`; `node build.mjs slides.json` from `source/` wrote PNG masters `source/png/slide-01.png` to `slide-05.png`, JPGs `media/slide-01.jpg` to `slide-05.jpg`, `source/contact-sheet.png` and `source/contrast.json` (lowest pair 4.91:1). Fonts: Lora and DM Sans from the site's Fontsource files, both loaded. Each slide image is scoped to Instagram. Facebook slide video: finisher (music id `music-efp-1015-c`, applied by the finisher; not set here).

## Questions for Alex
- Is there an age the practice starts seeing children (newborns, toddlers, school age)? The post names no ages until the office confirms.
