# Brief: 6 questions to ask before you hire a web designer

Slot: Fri 2026-09-25, 6:30 PM Eastern. Instagram carousel (POST, 8 slides at 1080x1350) and a Facebook slide video (POST, 25s, music bed `music-w0925-fri`).
Pillar: tip. Second post of the day.

## What the viewer gets
A checklist a small business owner can take into any web designer meeting: six questions that show what a quote really covers (ownership, scope, monthly costs, phone speed, local search, changes after launch). Each slide says why the question matters for their business and how K&A answers it, using only what K&A's own site already says. The CTA invites them to ask K&A all six: ka-performancefl.com or a call with Alex, 904-210-1071.

## Hook
Before you sign with a web designer, ask these 6 questions.

## Look
A hiring checklist on paper: a cream document sheet with a double rust margin rule, a heavy ink rule under the header, and square checkboxes that tick one per slide (a progress row of six boxes in the corner fills as you swipe). The K&A answer sits in a dark teal panel; amber only for highlights and the panel label. Distinct from this week's index card, exam paper, swatch cards, infographic and device mockups. Every slide: K&A logo, ka-performancefl.com, slide count, swipe cue.

## Slides
1. Hook: "Before you sign with a web designer, ask these 6 questions." Checklist with six empty boxes. Owner's initials line.
2. Q1: Who owns the site and the domain when we are done? K&A: we hand over the code on every website we build. Domain ownership: get it in writing.
3. Q2: What exactly does the price include? K&A: every project is scoped to fit; you know the number before we start; the quote is always free.
4. Q3: What will I pay every month after launch? K&A: no monthly hosting bill; every build ships on modern global infrastructure for little to nothing a month.
5. Q4: Will it load fast on a phone? K&A: static builds served from a global network, pages arrive in well under a second, even when traffic spikes.
6. Q5: Will it show up when locals search? K&A: search foundations from day one; we do the on-site half properly and hand you a short, honest list for the rest. Nobody can promise number one.
7. Q6: After launch, who makes changes, and what do they cost? K&A: the site does not disappear into an inbox after launch; you are asking a neighbor, not opening a support case. Cost of changes: ask for it in writing.
8. CTA: "Ask us all six." All six boxes ticked. ka-performancefl.com. Call Alex 904-210-1071. Free quote.

Questions not used: "Can I update it myself?" (the site says nothing concrete) and "Who hosts it and what if it goes down?" (the site covers the cost, not downtime; folded into Q3 as the monthly cost question). "How do I reach you after launch?" is folded into Q6.

## Sources (every "How K&A answers" line)
- Q1: `src/pages/ai-launch.astro` line 316, "the same way we hand over the code on every website we build"; line 414, "a custom site, built and handed over the way we hand over every build". Domain: nothing on the site; `src/pages/terms/index.astro` line 52 says the signed agreement governs ownership. Neutral line used.
- Q2: `src/pages/services/web-design.astro` FAQ "What does a website cost?": "Every project is scoped to fit the business ... you will always know the number before we start. The quote itself is always free."
- Q3: `src/pages/services/web-design.astro` hosting section: "A well-built site runs on modern global infrastructure for little to nothing a month, and that's how we ship every build"; page description "no monthly hosting bill".
- Q4: `src/pages/services/web-design.astro` includes list: "Static builds served from a global network, so pages arrive in well under a second and stay that way when traffic spikes"; intro "loads fast on a phone in a parking lot".
- Q5: `src/pages/services/web-design.astro` includes list, "Search foundations from day one"; `src/pages/services/seo-ai-search.astro` "Local search is its own game": "We work the on-site half properly and hand you a short, honest list for the rest"; FAQ "Can you guarantee I will rank number one? No, and neither can anyone else." The "why" line paraphrases the site's own blurb, "A beautiful site nobody can find is a very expensive business card."
- Q6: `src/pages/locations/gainesville.astro` lines 92 to 94: "the site does not disappear into an inbox after launch ... you are asking a neighbour rather than opening a support case" (spelled neighbor on the slide, US English). Cost and turnaround of changes: nothing on the site. Neutral line used.
- CTA "Free quote": `src/pages/services/web-design.astro`, "The quote itself is always free."

## Music
`music-w0925-fri`: new ElevenLabs music_v2 track (warm, confident Friday evening indie pop, about 96 bpm, hollow body electric riff, tremolo guitar, electric piano, no vocals). Generator `D:\kap-reel\scripts\social\2026-09-25-2\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w0925`) and `D:\kap-reel\LICENSING.md`. Passed the first-second, silence, clipping and ending checks; the vocal check transcribed zero words. Slide video measured -14.2 LUFS integrated, -1.7 dBTP.

## Constraints
No invented prices, turnaround times or guarantees. No em dashes. US English. No AI voice or AI visuals (ai false/false); the music is AI generated and disclosed in the Facebook caption (Instagram gets still slides, no music).

## Build
HTML/CSS slides rendered with Playwright, JPG via sharp: `node source/build.mjs` (from `source/`). Facebook video: `node tools/slideshow.mjs 2026-09-25-2 --music "D:\kap-reel\out\candidates\music-w0925-fri.mp3"`. Contact sheet: `source/contact-sheet.png`.

Approved: yes (Alex picked this idea in chat, 2026-09-25)

## Questions for Alex
- Q1 domain: whose name is a client's domain registered in, and do clients get the registrar login at handoff? If the answer is "you own it", slide 2 can say so instead of "get it in writing".
- Q6 changes after launch: what does a change cost after launch (hourly, per request, a care plan, or included for a period), and what turnaround do you promise? The site only says clients are "asking a neighbour rather than opening a support case", so slide 7 says "ask for it in writing".
- Q3 monthly cost: "little to nothing a month" is the site's wording. Who pays the domain renewal and any infrastructure cost, the client directly or K&A? Worth saying on the slide if you want it sharper.
- "Can I update it myself?" was left out because the site has no answer. If clients can edit their own hours or menus, that could replace a question in a later post.
