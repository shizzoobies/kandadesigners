# Brief: Insurance accepted. Uninsured welcome. Membership available.

Slot: Wed 2026-10-07, 10:30 AM Eastern. Instagram carousel of five slides at 1080x1350; Facebook gets the slide video the finisher makes from the same slides.
Pillar: how to be seen (week 1: who, where and how). The plan is `plans/2026-10-03-new-patients.md`, slot "Wed Oct 7. Three ways to be seen", the 10:30 carousel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
The three ways to be seen at the practice, said plainly: insurance accepted, uninsured patients still seen, or a Direct Primary Care membership. Whichever fits, the first step is a call.

## Hook
"Insurance accepted. Uninsured welcome. Membership available." Slide 1 and caption line 1. On the slide, the first two phrases are the headline and "Membership available." is the line under it: all three phrases as one headline run six lines at the template's hook size, and the limit is four.

## Call to action
New patients: call 941 417 7386 (the button on slide 5). Facebook line 2 and the close carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-07` (returned 200 on 2026-10-02). Instagram says link in bio; hashtags under `## First comment`.

## The slides
`slide` template, layouts varied: hook, list, photo, list, closing; grounds dark, sand, light, dark, sand.
1. Hook (dark): eyebrow "Three ways to be seen", "Insurance accepted. Uninsured welcome.", "Membership available.", Swipe.
2. List (sand): "We accept insurance." Physicals, sick visits and chronic care; bring your insurance card and a photo ID; call to ask how your plan works here.
3. Photo: the roadside sign (`SITE/src/assets/images/hero-front-sign.png`, neighbors' panels already blurred, nobody in frame), "No insurance? You are still seen." and "Call and we will explain how it works."
4. List (dark): "Or a membership, if it suits you." One flat monthly fee; longer visits; same or next day access for members; month to month, no contract. No prices.
5. Closing (sand): "Whichever fits, start with a call.", Monday to Friday, 9:00 AM to 5:00 PM, the amber Call 941 417 7386 button.

## Sources and truth
- Insurance accepted, uninsured patients seen, memberships offered, "call us and we will explain": `SITE/src/data/membership.ts` (FAQ "Do you accept insurance?") and `SITE/src/pages/index.astro` ("We also accept insurance and see patients who have none").
- Membership points: `SITE/src/data/dpc.ts` (one transparent monthly fee, more time, same or next day access) and `membership.ts` (month to month, no contract); same or next day is said for members only.
- Services line: the build brief's allowed services list (physicals, acute care, chronic disease management).
- What to bring (insurance card, photo ID): the plan's Mon Oct 5 carousel ("ID, insurance card, medication list").
- Hours and phone: `SITE/src/data/site.ts`.
- Left out as unsure: "self-pay" (the plan's word; the site never uses it, so the slide says "call and we will explain"); membership prices; any claim that every insurance plan is accepted.

## AI
None. No AI visuals or voice. Music: the finisher adds `music-efp-1007-c` to the Facebook slide video.

## Build
`source/build.mjs` with `source/slides.json` (`node build.mjs slides.json` from `source/`), the shared template copied unchanged. PNG masters in `source/png/`, JPGs in `media/`, `source/contact-sheet.png`. Fonts Lora and DM Sans (the site's own variable Fontsource files), all glyphs checked. Contrast report `source/contrast.json`, lowest 4.91:1. Photo slide uses the sign only: the clinic photo allowlist (`reference/photos-allowlist.json`) had not appeared after 25 minutes of checking, as the build brief directs.
Facebook slide video: finisher.

## Questions for Alex
None.
