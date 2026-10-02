# Brief: Members can call or text their provider

Slot: Sat 2026-10-10, 5:30 PM Eastern. Facebook and Instagram feed POST, one static card at 1080x1350.
Pillar: direct primary care. The plan is `plans/2026-10-03-new-patients.md`, slot "Sat Oct 10", the evening card.
Approved: yes (Alex in chat, 2026-10-02)

## What the viewer gets
One Direct Primary Care membership benefit, said plainly: members can call or text their provider. The caption names the other benefits the site lists (longer visits, same or next day access, one flat monthly fee), with no prices. One ask: new patients call 941 417 7386.

## Hook
"Members can call or text their provider." Caption line 1 and the card headline.

## Call to action
"Ask us whether membership fits." New patients: call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-10-2`. Instagram says link in bio; hashtags under `## First comment`.

## The card
`card` template, dark theme. Logo top center on its light plate; eyebrow "Direct Primary Care"; headline "Members can call or text their provider." on three lines; moss rule; sub "One of the Direct Primary Care membership benefits."; the amber "Call 941 417 7386" button; familypracticedirect.com at the foot.

## Sources and truth
- Call or text your provider, longer visits, same or next day access, one flat monthly fee: `src/data/dpc.ts` (`dpcBenefits` and the comparison rows), `src/data/membership.ts` (`sharedInclusions`) and the live page https://familypracticedirect.com/direct-primary-care/.
- Phone 941 417 7386: `src/data/site.ts` (`phone.display`).
- Every benefit is framed as a membership benefit; "same or next day" is said only of members.
- Never said: membership prices, "same-day" for anyone but members, outcomes.

## AI
None. No AI voice or visuals. No video, so no music.

## Build
`node build.mjs card.json` from `source/` (the shared card template, unchanged). Output `media/card.png` 1080x1350; contrast report `source/contrast.json`, lowest pair 5.26:1. Fonts: Lora and DM Sans from the site's own Fontsource files.

## Questions for Alex
None.
