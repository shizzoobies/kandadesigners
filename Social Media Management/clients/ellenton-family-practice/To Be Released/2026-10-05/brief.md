# Brief: How to get seen

Slot: Mon 2026-10-05, 10:30 AM Eastern. Instagram carousel POST (five slides, 1080x1350); Facebook POST as a slide video made by the finisher.
Pillar: how to book (week 1: who, where and how). The plan is `plans/2026-10-03-new-patients.md`, slot "Mon Oct 5. How to book", carousel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Everything a new or current patient needs before calling: what to bring to a first visit, where the office is and when it is open, how existing patients reach the portal and ask for a Saturday appointment. One ask: new patients call 941 417 7386.

## Hook
"How to get seen." Slide 1; caption line 1 "How to get seen at Ellenton Family Practice Direct."

## Call to action
New patients: call 941 417 7386 (slide 5 button and the caption close). Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-05`. Instagram says link in bio; hashtags under `## First comment`.

## The slides
1. Hook, light: eyebrow "New and current patients", "How to get seen.", sub "What to bring, when we are open, and who to call.", Swipe.
2. List, sand: "What to bring to your first visit": a photo ID; your insurance card, if you have one; a list of your medications.
3. Photo, light: the roadside sign (`hero-front-sign.png`, neighbors' panels already blurred, no person in frame, the door sign's number not shown), "Find us on Highway 301 in Ellenton", "Open Monday to Friday, 9:00 AM to 5:00 PM."
4. List, dark: "Already a patient?": the portal is the fastest route for records and refills; the portal link is at the top of familypracticedirect.com; Saturday appointments on request.
5. Closing, sand: "New patients start with a call.", "Ask us anything about membership, or book a visit.", amber "Call 941 417 7386".

## Sources and truth
- Hours, the Saturday note (established patients only), Highway 301, the address, the phone: `src/data/site.ts` (`hoursDisplay`, `hoursNote`, `directions`, `address`, `phone`) and the live https://familypracticedirect.com/contact/.
- "The portal is the fastest route for records and refills" and "Ask us anything about membership, or book a visit": `src/sections/Contact.astro`, live on /contact/.
- The portal link at the top of every page: `src/components/UtilityBar.astro` (shown at every width); `src/pages/accessibility.astro` says the same.
- What to bring (photo ID, insurance card, medication list): the approved plan's Mon Oct 5 slot. Not stated on the site; worded "if you have one" for the insurance card because the practice also sees uninsured patients.
- The sign photo: `src/assets/images/hero-front-sign.png`, as the build brief names it.
- Never said: "same-day", prices, the door sign's number, Saturday as regular hours.

## AI
None. No AI voice or visuals.

## Build
`node build.mjs slides.json` from `source/` (the shared slide template, unchanged): PNG masters `source/png/slide-01.png` to `-05`, JPGs `media/slide-01.jpg` to `-05`, `source/contact-sheet.png`, contrast `source/contrast.json` (lowest 4.91:1). Layouts vary hook, list, photo, list, closing; grounds light, sand, light, dark, sand. The clinic photo list had not been published when this was built (waited 25 minutes), so the only photo is the sign. Slide images are scoped to Instagram. Facebook slide video: finisher (track `music-efp-1005-c`).

## Questions for Alex
- What to bring to a first visit is listed as a photo ID, an insurance card if you have one, and a medication list. Is that what the front desk asks for?
