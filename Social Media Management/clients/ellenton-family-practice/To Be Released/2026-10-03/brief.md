# Brief: Modern medicine. Old fashioned doctors.

Slot: Sat 2026-10-03, 12:00 PM Eastern. Facebook and Instagram feed POST, a five slide carousel at 1080x1350.
Pillar: who we are (week 1: who, where, how). The plan is `plans/2026-10-03-new-patients.md`, slot "Sat Oct 3. Who we are".
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Who the practice is in five swipes: the practice's own line, family medicine for adults and children, the real roadside sign with the address and landmarks, the hours, and one ask: call to book.

## Hook
"Modern medicine. Old fashioned doctors." On slide 1 and as caption line 1.

## Call to action
New patients call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-03`. Instagram says link in bio; hashtags under `## First comment`.

## The slides
Five layouts in a row, none repeated next to each other; grounds alternate shell, sand, shell, deep moss, sand.
1. Hook (shell): eyebrow "Ellenton Family Practice Direct", "Modern medicine. Old fashioned doctors." with the second sentence in moss italic, "Healthcare the way it used to be.", Swipe.
2. List (sand): "Family medicine for every age": adults and children; physicals and sick visits; chronic disease management; one stop for the whole family.
3. Photo: the roadside sign (`hero-front-sign.png`, neighbors' panels already blurred, no person in frame, no phone number visible), "907 25th Dr East, on Highway 301", "About two miles from the Ellenton Outlet Mall and I 75."
4. List (deep moss): "When we are open": Monday to Friday, 9:00 AM to 5:00 PM; Saturday, 9:00 AM to 2:00 PM.
5. Closing (sand): "New patients, call to book.", "Insurance accepted. Uninsured patients welcome.", the amber Call 941 417 7386 button.

The plan lists the sign first; slide 1 must be the hook, so the sign carries the address on slide 3.

## Sources and truth
- Tagline and support line: `src/data/site.ts` (`tagline`, `taglineSupport`).
- Adults and children: `src/data/services.ts` (Family Medicine intro). Physicals, sick visits (acute care), chronic disease management, preventive screenings and vaccinations: `src/data/services.ts` and the live site's services list. "One stop for the whole family": the plan.
- Address, Highway 301, the two-mile landmarks, weekday hours, phone: `src/data/site.ts` (`address`, `directions`, `hoursDisplay`, `phone`). Saturday hours, 9:00 AM to 2:00 PM: Alex's change request of 2026-10-02 (owner).
- Insurance, uninsured, memberships: `src/data/membership.ts` (FAQ "Do you accept insurance?").
- Never said: prices, outcomes, "best", "same-day", the door sign's number, the chiropractor, any patient.

## AI
None. No AI voice or visuals.

## Build
Shared template `slide.html` via `source/build.mjs slides.json` (Playwright): PNG masters `source/png/slide-01.png` to `slide-05.png`, JPGs in `media/`, `source/contact-sheet.png`, `source/contrast.json` (lowest pair 4.91:1). Fonts: Lora and DM Sans, the site's own variable files. Slide images are scoped to Instagram. Facebook slide video: finisher (track `music-efp-1003-c`, applied by the finisher).

## Questions for Alex
None.
