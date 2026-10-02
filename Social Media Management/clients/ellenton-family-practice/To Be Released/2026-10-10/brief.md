# Brief: Sports and school physicals

Slot: Sat 2026-10-10, 12:00 PM Eastern. Instagram carousel (five slides, 1080x1350) and a Facebook POST that gets the slide video.
Pillar: services (week 2: one service a day). The plan is `plans/2026-10-03-new-patients.md`, slot "Sat Oct 10", carousel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
That sports and school physicals are done at the practice, what the visit is, what to bring (the school's form first), and to book by phone. Education post: the caption carries the disclaimer line.

## Hook
"Got the school's form? Book the physical." Slide 1 (eyebrow "Sports and school physicals"); caption line 1 is "Sports and school physicals."

## Call to action
Book by phone, 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-10`. Instagram says link in bio; hashtags under `## First comment`. Disclaimer line before the close.

## The slides
1. Hook, dark: eyebrow "Sports and school physicals", "Got the school's form? Book the physical.", "At your family practice in Ellenton."
2. List, sand: "What the visit covers": A physical with one of our providers. The school's form, filled in by your provider.
3. Photo, light: the roadside sign on Highway 301 across the top, "907 25th Dr East, on Highway 301." "One stop for the whole family."
4. List, dark: "What to bring": The school's form. An ID. Your insurance card, if you have one. A list of any medications.
5. Closing, light: "Book by phone." "Monday to Friday, 9:00 AM to 5:00 PM." "Saturday, 9:00 AM to 2:00 PM." The amber "Call 941 417 7386" button.

## Sources and truth
- Sports and school physicals as a service: `D:\Ellenton Family Practice Rebuild\src\data\services.ts` and the live /family-medicine page.
- What to bring: the school's form from the plan's Sat Oct 10 slot; ID, insurance card and medication list from the plan's Mon Oct 5 slot ("what to bring").
- "If you have one": the practice sees uninsured patients (`src\data\membership.ts`, FAQ "Do you accept insurance?").
- Children seen at the same practice as their parents, one stop for the whole family: the plan's Thu Oct 15 and Sat Oct 3 slots; pediatric visits in `services.ts`.
- Weekday hours: `src\data\site.ts` (`hoursDisplay`). Saturday hours, 9:00 AM to 2:00 PM: Alex's change request of 2026-10-02 (owner).
- "What the visit covers" is kept to the physical exam and the school's form, because the site does not itemize the visit; no vision, heart or other specific checks are named.
- Left out on purpose: any price or insurance coverage claim for physicals, any turnaround promise, same-day booking, any age range.
- Photo: `D:\Ellenton Family Practice Rebuild\src\assets\images\hero-front-sign.png`, the roadside sign with the neighbors' panels already blurred, no person in frame and no door-sign phone number. The clinic photo allowlist had not been published after a 25 minute wait, so this carousel uses the sign only, as the build brief directs.

## AI
None. No AI voice or visuals.

## Build
Template carousel rendered to PNG with Playwright: `node build.mjs slides.json` from `source/` (templates copied from `templates/`, text in `source/slides.json`), writing PNG masters to `source/png/`, JPGs to `media/slide-01.jpg` to `media/slide-05.jpg`, `source/contact-sheet.png` and `source/contrast.json` (lowest pair 4.91:1). Fonts: Lora and DM Sans, the site's own Fontsource files. Slide images are scoped to Instagram.
Facebook slide video: finisher (music id `music-efp-1010-c`, applied by the finisher).

## Questions for Alex
- Sports and school physicals: is there anything families should know before the visit, such as dropping the form off ahead of time or anything the exam includes that we should name? This post keeps to the physical and the school's form.
