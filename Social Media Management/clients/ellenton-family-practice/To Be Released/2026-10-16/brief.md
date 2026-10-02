# Brief: Your annual physical: what to expect

Slot: Fri 2026-10-16, 10:30 AM Eastern. Facebook and Instagram feed POST, a five-slide carousel at 1080x1350.
Pillar: services (week 2, one service a day; an education lead, so the caption carries the disclaimer line). The plan is `plans/2026-10-03-new-patients.md`, slot "Fri Oct 16. The annual physical", carousel "Your annual physical: what to expect".
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
A plain picture of the visit before booking it: what gets covered, what to bring, and why once a year. One ask: call to book.

## Hook
"Your annual physical: what to expect." Slide 1 and caption line 1.

## Call to action
Call 941 417 7386 (the amber button on the last slide and the caption close). Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-16`. Instagram says link in bio; hashtags under `## First comment`. Disclaimer line before the close.

## The slides
1. Hook, deep green: eyebrow "The annual physical"; "Your annual physical: what to expect"; "What we go over, what to bring, and why once a year."; Swipe.
2. List, sand: "What we go over": your health history and medications; screenings and vaccinations you may need; any ongoing condition, like blood pressure or cholesterol; the questions you have been saving.
3. Photo, cream: the roadside sign (`hero-front-sign.png`, no person, no door number); "Our sign on Highway 301"; "907 25th Dr East, Ellenton".
4. List, deep green: "What to bring": a photo ID; your insurance card, if you have one; a list of your medications.
5. Closing, cream: "Once a year keeps your history current."; "Book your annual physical. Mon to Fri 9 to 5, Sat 9 to 2."; amber "Call 941 417 7386".

## Sources and truth
- "Annual physicals and wellness exams", "Preventive screenings and vaccinations", "Chronic condition management (diabetes, blood pressure, thyroid, cholesterol)": `D:\Ellenton Family Practice Rebuild\src\data\services.ts` and the live https://familypracticedirect.com/family-medicine.
- What to bring (ID, insurance card, medication list): the plan, Mon Oct 5 slot. Note: the plan says this is on the live contact page; it is not there as of 2026-10-02, so the plan is the source.
- "Why once a year" is kept to continuity (history current, a set time to talk), not an outcome. The caption adds that frequency depends on age and health, matching MedlinePlus "Physical exam frequency" (medlineplus.gov/ency/article/002125.htm: "Talk with your provider about how often you should have checkups"). No statistics.
- Weekday hours, address, phone: `src/data/site.ts` and the live /contact page. Saturday hours, 9:00 AM to 2:00 PM: Alex's change request of 2026-10-02 (owner). Insurance, uninsured, DPC memberships: the build brief's allowed facts.
- Left out as not stated anywhere: how long the visit takes (the plan asks for it; neither the site nor the plan gives a time, and longer visits are stated only as a membership benefit), and any specific test or lab (lab wording is pending the practice).
- Photo: the sign only. The clinic photo allowlist had not appeared after the 25-minute wait, so the photo slide uses the sign, per the build brief.

## AI
None. No AI visuals or voice.

## Build
Shared templates copied to `source/`; `node build.mjs slides.json` from `source/` wrote PNG masters `source/png/slide-01.png` to `slide-05.png`, JPGs `media/slide-01.jpg` to `slide-05.jpg`, `source/contact-sheet.png` and `source/contrast.json` (lowest pair 4.91:1). Fonts: Lora and DM Sans from the site's Fontsource files, both loaded. Each slide image is scoped to Instagram. Facebook slide video: finisher (music id `music-efp-1016-c`, applied by the finisher; not set here).

## Questions for Alex
- How long should a new patient plan for an annual physical? The post leaves visit length out until the office confirms it.
