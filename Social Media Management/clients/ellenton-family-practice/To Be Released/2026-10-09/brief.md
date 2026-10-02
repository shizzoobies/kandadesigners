# Brief: What Direct Primary Care means here

Slot: Fri 2026-10-09, 10:30 AM Eastern. Instagram carousel (five slides, 1080x1350) and a Facebook POST that gets the slide video.
Pillar: how to be seen (week 1: who, where and how). The plan is `plans/2026-10-03-new-patients.md`, slot "Fri Oct 9", carousel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
What the membership option is, in plain terms: one flat monthly fee, month to month with no contract, longer visits, same or next day access for members, and calling or texting your provider. That it sits beside insurance and care for uninsured patients. No prices anywhere.

## Hook
"What Direct Primary Care means here." Slide 1 and caption line 1.

## Call to action
"Ask us whether it fits." New patients call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-09`. Instagram says link in bio; hashtags under `## First comment`.

## The slides
1. Hook, light: eyebrow "Direct Primary Care", "What Direct Primary Care means here", "One of three ways to be seen at our practice."
2. List, sand: "How the membership works": One flat monthly fee. Month to month. No contract.
3. Photo, light: the roadside sign on Highway 301 across the top, "The same practice on Highway 301." "907 25th Dr East, Ellenton."
4. List, dark: "For members": Longer visits. Same or next day access. Call or text your provider.
5. Closing, sand: "Ask us whether it fits." "Insurance accepted. Uninsured patients welcome." The amber "Call 941 417 7386" button.

## Sources and truth
- One flat monthly fee, longer visits, same or next day access, call or text your provider: `D:\Ellenton Family Practice Rebuild\src\data\dpc.ts` (`dpcBenefits`) and `src\data\membership.ts` (`sharedInclusions`, "Longer office visits, without the rush").
- Month to month, no contract: `src\data\membership.ts` (FAQ "Is there a contract?").
- Insurance accepted, uninsured patients seen, memberships offered ("three ways to be seen"): `src\data\membership.ts` (FAQ "Do you accept insurance?") and the plan's Wed Oct 7 slot.
- "Same or next day" is said for members only, as the plan requires.
- Left out on purpose: every price, the enrollment and add-on rates, billing terms and discounts (unconfirmed, from 2016); wholesale pricing on prescriptions and labs; home or workplace visits; whether membership replaces insurance (the site's answer is pending a physician's review).
- Photo: `D:\Ellenton Family Practice Rebuild\src\assets\images\hero-front-sign.png`, the roadside sign with the neighbors' panels already blurred, no person in frame and no door-sign phone number. The clinic photo allowlist had not been published after a 25 minute wait, so this carousel uses the sign only, as the build brief directs.

## AI
None. No AI voice or visuals.

## Build
Template carousel rendered to PNG with Playwright: `node build.mjs slides.json` from `source/` (templates copied from `templates/`, text in `source/slides.json`), writing PNG masters to `source/png/`, JPGs to `media/slide-01.jpg` to `media/slide-05.jpg`, `source/contact-sheet.png` and `source/contrast.json` (lowest pair 4.91:1). Fonts: Lora and DM Sans, the site's own Fontsource files. Slide images are scoped to Instagram.
Facebook slide video: finisher (music id `music-efp-1009-c`, applied by the finisher).

## Questions for Alex
None.
