# Brief: October: screening questions worth asking

Slot: Tue 2026-10-13, 10:30 AM Eastern. Facebook and Instagram feed POST, a five-slide carousel at 1080x1350.
Pillar: services (week 2 lead, education: Breast Cancer Awareness Month). The plan is `plans/2026-10-03-new-patients.md`, slot "Tue Oct 13. Breast cancer awareness month", carousel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
October is Breast Cancer Awareness Month. A short list of general questions worth asking a provider about mammogram timing, the plain point that timing depends on age and history, and that women's health is part of the care at the practice. One ask: book a visit and bring the questions.

## Hook
"October: screening questions worth asking." On slide 1 and as caption line 1.

## Call to action
New patients: call 941 417 7386 (slide 5 and the caption close). Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-13`. Instagram says link in bio; hashtags under `## First comment`. The caption carries the disclaimer line before the close.

## The slides
Shared `slide.html`, unchanged; no two neighbors share a layout or a ground.
1. Hook, cream: eyebrow "Breast Cancer Awareness Month"; "October: screening questions worth asking"; "General information to bring to your next visit."; Swipe.
2. List, sand: "Questions to ask your provider": When should I start mammograms? How often should I have one? Does my family history change that? What should I tell you about between visits?
3. Photo, cream: the practice's roadside sign (`hero-front-sign.png`, framed on the sign); "Timing depends on your age and history"; "Talk with your provider about what fits you."
4. List, deep green: "Women's health at the practice": Part of everyday family medicine here. Preventive screenings and vaccinations. Insurance accepted, uninsured patients seen.
5. Closing, sand: "Book a visit. Bring your questions."; Monday to Friday, 9:00 AM to 5:00 PM; the amber Call 941 417 7386 button.

## Sources and truth
- Breast Cancer Awareness Month in October, and the guidance to talk with a provider about mammogram timing based on age and history: the plan, slot Tue Oct 13, and the build brief's breast cancer awareness note. The build brief lists no CDC or ACS page, so the post carries no statistics and no age or interval figures; the questions are questions, not answers.
- Women's health, preventive screenings and vaccinations: `D:\Ellenton Family Practice Rebuild\src\data\services.ts`, shown on /family-medicine.
- Insurance accepted, uninsured patients seen: the plan ("Three ways to be seen") and the build brief's allowed facts.
- Hours: `src/data/site.ts` `hoursDisplay`. Phone: `site.ts` `phone.display`.
- Photo: `D:\Ellenton Family Practice Rebuild\src\assets\images\hero-front-sign.png` (the real sign, neighbors' panels already blurred, no person in frame, no phone number on it). The clinic photo allowlist was not yet available when this was built, so the sign is the only photo used.
- Never said: any statistic, a recommended starting age or interval, any test the practice performs on site, any outcome, any drug name, any price.

## AI
No AI voice or visuals.

## Build
Shared templates copied to `source/`; `node build.mjs slides.json` from `source/` wrote PNG masters `source/png/slide-01.png` to `slide-05.png`, JPGs `media/slide-01.jpg` to `slide-05.jpg`, `source/contact-sheet.png` and `source/contrast.json`. Fonts: Lora and DM Sans from the site's Fontsource files, both loaded. Each slide image is scoped to Instagram. Facebook slide video: finisher (music id `music-efp-1013-c`, applied by the finisher; not set here).

## Questions for Alex
None.
