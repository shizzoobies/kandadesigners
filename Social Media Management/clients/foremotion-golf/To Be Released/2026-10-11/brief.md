# Brief: What it means to be a Founder

Slot: Sun 2026-10-11, 12:00 PM Eastern. Instagram feed POST, a six-slide carousel at 1080x1350; Facebook gets the same slides as a slide video.
Pillar: what it means to be a Founder (phase 4). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Sun Oct 11", the carousel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
What a Founding Membership means beyond bay time: belonging, access, recognition and community. Founders are first through the doors, have a name on the Founders Wall, keep a permanent Founding Member designation, and get priority invitations and exclusive Founding Member merchandise. One ask: join the Founders List.

## Hook
"What it means to be a Founder." On slide 1 and as caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-11`. Instagram says link in bio; hashtags under `## First comment`. The Agreement line is the last body line of both captions.

## The slides
Alternating deep forest (#152F0F) and cream (#FAF8F2) slides. The stacked Aug 2 logo at the top of every slide (`Secondary` on deep forest, `Primary_Light` on cream), as delivered: not recolored, no glow, no shadow. Oswald Bold headlines, Bahnschrift body, foremotiongolf.com at the foot of every slide. Accent words in logo green (#73AF15) on dark and primary green (#357A16) on cream; lime (#6AA212) rules.
1. Hook (dark): "What it means to be a Founder." Sub: "Belonging, access, recognition and community." Then "Swipe".
2. Cream: "First through the doors." "A Founding Membership is joining before Fore Motion Golf opens in early 2027."
3. Dark: "A name on the Founders Wall." "Founders are recognized on the Founders Wall, from the beginning."
4. Cream: "Founding Member, permanently." "Your membership runs for its term. Your Founding Member designation stays."
5. Dark: "Priority invitations." "Priority access to leagues and events, and exclusive Founding Member merchandise."
6. Ask (cream): "Founding Memberships are limited." "First access goes to the Founders List." A logo green "Join the Founders List." block, then "Limited availability. Benefits and terms governed by the Founding Membership Agreement."
Slides 2 to 5 carry the small label "Being a Founder".

## Sources and truth
- The five benefits are the plan's Sun Oct 11 list: first through the doors, a name on the Founders Wall, permanent Founding Member designation, priority invitations, exclusive Founding Member merchandise. Wording checked against Justin's Founding Membership brief (Sept 28): Founders Wall recognition, a designation that remains after the term, priority access to competitions, leagues and events, and "Exclusive Founding Member merchandise" as the only merchandise phrase.
- Opening: "early 2027" only. Leagues and events: allowed by the build brief (splash page).
- Never said: any price, a count of Founders (only "limited"), tier names or hours (those run Mon to Wed), named merchandise, Gold, Platinum, Diamond, Elite, rollover, booking windows, the Founders Cup.

## AI
No AI voice or visuals. Music: finisher (Facebook slide video only).

## Build
HTML slides rendered with Playwright: `node source/build.mjs` (from `source/`), copied from the `2026-10-02` card script. It writes PNG masters to `source/png/`, JPGs to `media/slide-01.jpg` through `slide-06.jpg`, `source/slides.html`, the trimmed logos, `source/contact-sheet.png` and `source/contrast.json` (lowest pair 5.01:1, primary green on cream; all at or above 4.5:1). Fonts: Oswald Bold; Bahnschrift standing in for Barlow, which is not installed.
Each slide is scoped `"platforms": ["instagram"]` in `post.json`.
Facebook slide video: finisher (`tools/slideshow.mjs` with track `music-fmg-1011-c` adds `media/slideshow.mp4` and its cover for Facebook). `music` is not set here.

## Questions for Alex
None.
