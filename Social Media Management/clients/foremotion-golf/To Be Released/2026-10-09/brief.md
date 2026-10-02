# Brief: Rain, heat or dark, it is 70 and sunny

Slot: Fri 2026-10-09, 10:30 AM Eastern. Carousel, five slides at 1080x1350: swipe slides on Instagram, a slide video on Facebook.
Pillar: the experience (phase 3). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Fri Oct 9".
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Florida weather set against an indoor round: summer heat, afternoon storms, early winter sunsets. Whatever it is doing outside, the round goes on inside on four TrackMan bays. One ask: join the Founders List.

## Hook
"Rain, heat or dark, it is 70 and sunny." On slide 1 and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-09`. Instagram says link in bio; hashtags under `## First comment`.

## The slides
Same look as the 2026-10-02 card: deep forest (#152F0F) slides with the `Secondary` stacked logo, cream (#FAF8F2) slides with the `Primary_Light` stacked logo, Oswald Bold headlines, Bahnschrift body, logo green and lime accents on dark, website primary green (#357A16) accents on cream. Simple line weather icons drawn for this post. Count and "Swipe" at the foot beside foremotiongolf.com.
1. Dark. Storm, sun and moon icons. "Rain, heat or dark, it is 70 and sunny."
2. Cream. Sun. "Summer afternoons." "Leave the heat outside. Inside, it is always 70 and sunny."
3. Dark. Storm cloud. "Afternoon storms." "The storm rolls in. Your round keeps going, indoors on four TrackMan bays."
4. Cream. Moon. "After work in winter." "The sun sets early. Inside, the round is still 70 and sunny."
5. Dark. "Where it's always 70 and sunny." "Opening early 2027 at 1518 Park Ave, Orange Park, FL." Button: "Join the Founders List."

## Sources and truth
- Facts used: four TrackMan bays, a putting area, a bar and lounge, 1518 Park Ave in Orange Park, opening early 2027, "Where it's always 70 and sunny." All in content-facts and the plan.
- Never said: an opening month or day, opening hours, any price, a count of Founders, anything about the Founders Cup. The weather lines are general Florida weather, not claims about the venue.

## AI
No AI voice or visuals. Music: finisher (Facebook slide video only).

## Build
HTML slides rendered to PNG with Playwright: `node source/build.mjs` (from `source/`), the 2026-10-02 card script extended to five slides. Writes PNG masters to `source/png/`, JPGs to `media/slide-NN.jpg`, `source/slides.html`, both trimmed logos, `source/contact-sheet.png` and `source/contrast.json` (lowest pair 5.01:1, primary green on cream; all at or above 4.5:1). Each slide image is scoped to `"platforms": ["instagram"]`.
Facebook slide video: finisher (`tools/slideshow.mjs` with track `music-fmg-1009-c`, which also writes the `music` field and the Facebook media entries).

## Questions for Alex
None.
