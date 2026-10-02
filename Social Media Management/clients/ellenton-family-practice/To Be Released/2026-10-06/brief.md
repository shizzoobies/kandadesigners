# Brief: Meet Dr. Raphael Kulawik, D.O.

Slot: Tue 2026-10-06, 10:30 AM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: the providers (week 1: who, where and how). The plan is `plans/2026-10-03-new-patients.md`, slot "Tue Oct 6. The medical director", lead card.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
A face and a name for the practice's Medical Director: Dr. Raphael Kulawik, D.O., board certified in Family Medicine. One ask: new patients call 941 417 7386.

## Hook
"Meet Dr. Raphael Kulawik, D.O." Caption line 1; on the card as the role, name and credentials.

## Call to action
New patients: call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-06`. Instagram says link in bio; hashtags under `## First comment`.

## The card
`provider` template, `photo` variant, sand theme. Logo top center; the headshot left (rounded rectangle); right: eyebrow "Medical Director", name "Dr. Raphael Kulawik", credentials "D.O.", line "Board certified in Family Medicine."; the amber "Call 941 417 7386" button; familypracticedirect.com at the foot.

## Sources and truth
- Name, credentials, role: `src/data/providers.ts` (`name`, `credentials`, `role`) and the live https://familypracticedirect.com/providers/ ("Medical Director", "Dr. Raphael Kulawik D.O.").
- "Board certified in Family Medicine": `src/data/providers.ts` (`focus`: Board Certified Family Medicine) and the live /providers card.
- Headshot: `src/assets/images/providers/raphael-kulawik.jpg` (350 px), the file the live /providers page publishes. Not the 175 px file in `Images/`.
- "All three of our providers": the live /providers page lists three.
- Nothing from the bio text (education, years), which is pending the practice's approval. No combined years figure.

## AI
None. No AI voice or visuals. No video, so no music.

## Build
`node build.mjs card.json` from `source/` (the shared provider template, unchanged). Output `media/card.png` 1080x1350; contrast report `source/contrast.json`, lowest pair 5.26:1. Headshot test at 1080 wide: the 350 px source is shown at 1.49x in the 420x520 frame. Viewed at full size it is a little soft, with no blocking or visible JPEG steps, and it reads cleanly at feed size, so the photo variant stays (fallback would be the `type` variant).

## Questions for Alex
- Is Dr. Kulawik's headshot, as it appears on the website, cleared for use on social? A sharper original would improve this card.
