# Build brief: week of Oct 5 (read fully before building)

Working folder: D:\K & A Performance Site\Social Media Management. The approved plan
is plans/2026-10-05.md. Several agents build different days in parallel: touch
only your own day's folders and your own files in D:\kap-reel.

## Read first
- README.md (folder contract; per-network media; slideshow.mjs; LinkedIn DOCUMENT;
  30-day music rule; Post Desk questions).
- plans/2026-09-28-rework.md (brand, every-frame rules).
- Patterns to copy:
  - Reel: To Be Released/2026-09-29 (post.json, captions) and its Remotion build
    D:\kap-reel\src\social\2026-09-29 + scripts\social\2026-09-29\deliver.ts.
  - Carousel: To Be Released/2026-09-25-2 (source/build.mjs renders HTML slides to JPG
    with Playwright from D:\kap-reel\node_modules).
  - LinkedIn: To Be Released/2026-09-29-3 (linkedin.md, repost.md, DOCUMENT type).
  - Music generation: D:\kap-reel\scripts\social\music-week-0928.ts (log to
    config/audio.json and LICENSING.md).

## Every post
- K&A logo and ka-performancefl.com on every frame and slide; hook in the first second
  or on slide 1; a CTA; built to work muted. No narration, no text-to-speech.
- Brand: Schibsted Grotesk display + Atkinson Hyperlegible Next body (D:\kap-reel\assets\brand\fonts);
  rust #9A3412, ink #221C15, cream #F8F5F2, dark teal #0B302D, amber #D97706 for highlights only;
  logo D:\kap-reel\assets\brand\logo\logo-lockup.webp (dark ink, on a light surface).
  No pill shapes. No em dashes. US English. Look distinct from last week's carousels
  (index cards, exam paper, swatch cards, infographic, device mockups, checklist
  document, stopwatch, planner page, tickets).
- Truth: real sites, real screens, real numbers saved in source/. No client sites unless
  the plan says so (this week: K&A's own site only). No AI vendor/product/model names.
  No promised results, time savings or ROI.
- Links: Facebook line 2 = "<short lead>: https://ka-performancefl.com/<page>?utm_source=facebook&utm_medium=social&utm_campaign=<folder>";
  Instagram says "Link in bio" and puts hashtags under "## First comment";
  LinkedIn puts the link in "## First comment" with utm_source=linkedin.
  AI posts link https://ka-performancefl.com/ai-launch/ (the paid 90-Day AI Launch; never "free lessons").
  Training posts link https://ka-performancefl.com/training/ ; web/local search posts
  link the relevant /services/... page (check it returns 200).
- Music: generate a NEW ElevenLabs track per video with the id and mood you are given
  (indie pop, guitar-led family, no vocals, about 30s), distinct from plans/2026-09-28-music.md
  and music-history.json. Facebook/video captions say "The music is AI generated."; Instagram
  still-slide captions do not.
- post.json: status "ready", times per the plan (reel 10:30, carousel 16:00 or as given,
  LinkedIn 08:00), "music" set on every video post. The carousel's Facebook video comes
  from: node tools/slideshow.mjs <folder> --music <mp3>.
- brief.md: what the viewer gets, hook, beats or slides, sources, "## Questions for Alex"
  only for real decisions, and "Approved: yes (week plan plans/2026-10-05.md, Alex 2026-09-25)".
- Reels render with node node_modules/@remotion/cli/remotion-cli.js ... --concurrency 3
  from D:\kap-reel with your own entry at src/social/<date>/index.ts (never edit Root.tsx
  or shared files); npx breaks on the ampersand path.

## Verify before reporting
Look at every slide and a 0.5s contact sheet of every reel yourself. Loudness -14 LUFS,
true peak at or under -1 dBTP. Run node tools/social.mjs validate (full run) until your
folders are clean. No git commits, no uploads, no Metricool calls.
Report under 200 words: folders, hooks, music ids + loudness, validate output,
contact sheet paths, questions for Alex.
