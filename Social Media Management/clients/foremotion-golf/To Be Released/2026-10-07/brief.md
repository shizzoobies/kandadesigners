# Brief: Four bays. Six players each.

Slot: Wed 2026-10-07, 10:30 AM Eastern. Instagram feed carousel of five 1080x1350 slides; Facebook gets the same slides as a slide video (made by the finisher).
Pillar: the experience (phase 3). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Wed Oct 7", lead.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
How a visit works: four TrackMan bays, what TrackMan shows on every swing, up to six players sharing a bay and playing a round together, and rental clubs for anyone who needs them. One ask: join the Founders List.

## Hook
"Four bays. Six players each." On slide 1 and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-07`. Instagram says link in bio; hashtags under `## First comment`.

## The slides
Dark slides on deep forest (#152F0F) with the `Secondary` logo; cream slides (#FAF8F2) with the `Primary_Light` logo, alternating for contrast between slides. Logo green (#73AF15) and lime (#6AA212) accents on dark; on cream the text accent is the website's primary green (#357A16, 5.01:1) and lime is used for the rule only. URL at the foot of every slide.
1. Dark. "Four bays. Six players each." A plain diagram: four outlined boxes, Bay 1 to Bay 4, six dots in each. "Indoor golf on TrackMan simulators, coming early 2027 to Orange Park, FL." "Swipe for how it works."
2. Cream. The bay: "Every bay runs on TrackMan." "TrackMan shows the ball and the club on every swing, so you know your numbers."
3. Dark. The group: "Six players. One bay." "Up to six players share a bay. Take turns and play a round together, where it's always 70 and sunny."
4. Cream. The clubs: "No clubs? No problem." "Rental club sets are available. Reserve them ahead of time and bring nothing but yourself."
5. Dark. "Be first through the doors." "Opening early 2027 at 1518 Park Ave, Orange Park, the former DMV." Button: "Join the Founders List."

## Sources and truth
- Four TrackMan bays, six players at a time per bay, rental club sets reservable ahead of time, 1518 Park Ave (the former DMV), opening early 2027: content-facts and the plan.
- "TrackMan shows the ball and the club on every swing" and "know your numbers": the plan (Mon Oct 5 card wording). No specific TrackMan measurements are named, since content-facts lists none.
- "Where it's always 70 and sunny" and "Be first through the doors": the splash page.
- Never said: an opening month, prices, membership names, counts of Founders, the Founders Cup, bay rates, booking windows, other companies' logos (TrackMan is text only).

## AI
No AI voice or visuals. Music: finisher (Facebook slide video only, track `music-fmg-1007-c`).

## Build
`node source/build.mjs` (from `source/`) renders `source/slides.html` to PNG masters in `source/png/` and JPGs in `media/slide-NN.jpg` with Playwright, trims both logos, and writes `source/contrast.json` (lowest pair 5.01:1, all at or above 4.5:1). Fonts: Oswald Bold for headlines and the button; Bahnschrift for labels, body and URL, standing in for Barlow, which is not installed. Each slide is scoped `"platforms": ["instagram"]`.
Facebook slide video: finisher.

## Questions for Alex
None.
