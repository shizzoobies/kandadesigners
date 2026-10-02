# Brief: Meet Julie Vera Rivas, MSN, APRN, FNP-C

Slot: Fri 2026-10-09, 5:30 PM Eastern. Facebook and Instagram feed POST, one card at 1080x1350.
Pillar: providers (week 1: who, where and how). The plan is `plans/2026-10-03-new-patients.md`, slot "Fri Oct 9", card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
A face and a name: the practice's Nurse Practitioner, with her credentials as the practice publishes them, and how to book.

## Hook
"Meet Julie Vera Rivas, MSN, APRN, FNP-C." Caption line 1; the card carries the name, the credentials and the role.

## Call to action
New patients call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-09-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
`provider.html`, `photo` variant, light theme. Logo top center; the headshot left; on the right the eyebrow "Nurse Practitioner", the name "Julie Vera Rivas" in Lora, the credentials "MSN, APRN, FNP-C". No fact line (her bio is pending her approval). The amber "Call 941 417 7386" button; familypracticedirect.com at the foot.

## Sources and truth
- Name, credentials and role: `D:\Ellenton Family Practice Rebuild\src\data\providers.ts` (`name`, `credentials`, `role`) and the live https://familypracticedirect.com/providers/ (shows "Nurse Practitioner", "Julie Vera Rivas", "MSN, APRN, FNP-C"; checked 2026-10-02).
- Headshot: `D:\Ellenton Family Practice Rebuild\src\assets\images\providers\julie-vera-rivas.jpg` (800 x 800), the file the live /providers page imports. Tested at 1080 wide: shown at 420 x 520 on the card, so it is downscaled and holds sharp; photo variant kept.
- "One of three providers": the three provider entries in `providers.ts` and on the live /providers page.
- Address and Highway 301: `src/data/site.ts` (`address`, `directions`).
- Insurance, uninsured, memberships: `src/data/membership.ts` (FAQ "Do you accept insurance?").
- Left out on purpose: everything from her bio (pending her approval), including years in healthcare and areas of focus; any schedule or availability for her.

## AI
None. No AI voice or visuals. No video, so no music.

## Build
Template card rendered to PNG with Playwright: `node build.mjs card.json` from `source/` (template copied from `templates/`, text in `source/card.json`), writing `media/card.png` and `source/contrast.json` (lowest pair 5.26:1). Fonts: Lora and DM Sans, the site's own Fontsource files.

## Questions for Alex
- Is the headshot published on the website cleared for use on social too? This card uses it as it appears on the providers page.
