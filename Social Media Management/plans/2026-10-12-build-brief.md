# Build brief: Oct 10 to 16, plus the "2 spots left" post on Thu 10/1 (read fully before building)

**Where to work**
- Working folder: `D:\K & A Performance Site\Social Media Management`.
- The approved plan is `plans/2026-10-12.md`. Read your slot there first.
- Several agents build different days in parallel. Touch only your own day's folders and your
  own files in `D:\kap-reel` (your own entry at `src\social\<folder>\` and
  `scripts\social\<folder>\`). Never edit `Root.tsx` or shared files.
- L3 (`2026-10-14-4`) and L2 (`2026-10-07-4`) belong to other builders. Don't touch them.

## Read first
- `README.md`: the folder contract, per-network media, `slideshow.mjs`, the LinkedIn
  DOCUMENT, the 30-day music rule, Post Desk questions, and **the YouTube section**.
- `plans/2026-09-28-rework.md` (brand and the every-frame rules) and
  `plans/2026-10-05-build-brief.md` (last week's brief; everything there still applies unless
  changed below).
- **Patterns to copy:**
  - Reel: `To Be Released/2026-10-09` and its Remotion build at `D:\kap-reel\src\social\2026-10-09`,
    with `scripts\social\2026-10-09\deliver.ts`.
  - Carousel: `To Be Released/2026-10-09-2`. Its `source/build.mjs` renders HTML slides to JPG
    with Playwright from `D:\kap-reel\node_modules`.
  - LinkedIn: `To Be Released/2026-10-09-3` (`linkedin.md`, `repost.md`, DOCUMENT type).
  - Pilot announcement: `Already Released/2026-09-26-4`.
  - Music generation: `D:\kap-reel\scripts\social\music-week-0928.ts`. Log each track to
    `config/audio.json` and `LICENSING.md`.
  - A YouTube Short companion, for the youtube block only: `To Be Released/2026-10-09-5`.

## The slots

| Agent | Folders | What (from the plan) | Times |
|---|---|---|---|
| P | `2026-10-01-4` | **2 spots left** carousel, pilot offer | FB and IG 13:00, LinkedIn 12:00 (per-network `time`) |
| W | `2026-10-10`, `2026-10-11` | Sat: Photos that work on a small business website. Sun: Find your website's voice in ten minutes | Sat 12:00, Sun 18:00 |
| M | `2026-10-12`, `-2`, `-3` | Local search. Reel: What Google shows before anyone clicks. Carousel: 5 places your address and phone must match | reel 10:30 + Short 12:00, carousel 16:00, LinkedIn 08:00 |
| T | `2026-10-13`, `-2`, `-3` | Web design. Reel: Three fonts, max. Carousel: Buttons that get clicked | same as M |
| E | `2026-10-14`, `-2`, `-3` | Training. Reel: Training everyone can take (3 accessibility checks). Carousel: One module, one objective | same as M |
| H | `2026-10-15`, `-2`, `-3` | AI. Reel: What not to paste into an AI tool. Carousel: Keep a "best replies" file | reel 10:30 + Short 12:00, carousel **18:00**, LinkedIn 08:00 |
| F | `2026-10-16`, `-2`, `-3` | Behind the scenes: how we build a YouTube video in three days | same as M |

Music ids (new ElevenLabs tracks, no vocals, about 30 s, indie pop with a guitar-led family
feel; each distinct from the others and from everything in `music-history.json` and
`plans/2026-09-28-music.md`):

| Folder | Track id |
|---|---|
| `2026-10-01-4` | `music-w1001-p` |
| `2026-10-10`, `2026-10-11` | `music-w1010`, `music-w1011` |
| weekday reel | `music-w10DD-r` (for example `music-w1012-r`) |
| weekday carousel slide video | `music-w10DD-c` |

A Short reuses its own reel's track: same day, one use.

## What changed from last week

1. **YouTube Short in every weekday reel folder** (not the weekend or pilot folders). Add to the
   reel's `post.json`:
   - `platforms.youtube = {type: "SHORT", caption: "youtube.md", title, tags, category:
     "HOWTO_STYLE", time: "12:00"}`
   - plus `playlist` when one fits: "Quick fixes for your website" for web and local search
     tips, "Practical AI for small business" for AI. There's none for training or behind the
     scenes.
   - **Title:** 70 characters or fewer, the idea rather than a slogan, no AI vendor names.
   - **`youtube.md`:**
     - line 1: the hook
     - line 2: the right ka-performancefl.com page with
       `?utm_source=youtube&utm_medium=social&utm_campaign=<folder>`
     - two or three plain sentences
     - the AI line ("The music is AI generated.")
     - the footer from `plans/youtube-setup.md`
   - YouTube gets exactly one video. If `validate` complains about the thumbnail or other
     files, scope them with `"platforms": ["facebook","instagram"]` on the media entry
     (README, "YouTube").
2. **Captions may point to our YouTube** (Alex, 2026-09-28). The tagged site link stays on line
   2. Add one line where a post is a short version of a long video:
   - Facebook and LinkedIn: "Full walkthrough on our YouTube channel:
     https://www.youtube.com/@KAPerformancefl"
   - Instagram: "Full walkthrough on our YouTube: @KAPerformancefl" (Instagram captions can't
     link)
   - **Where it applies:**
     - Sun 10/11 (voice guide): L2
     - Tue 10/13 carousel (buttons): L1
     - Thu 10/15 reel (what not to paste): L2
     - Thu 10/15 carousel (best replies): L2
     - Fri 10/16: the channel itself
3. **Colors:** the brand marks never change. That means the K&A logo lockup
   (`D:\kap-reel\assets\brand\logo\logo-lockup.webp`), ka-performancefl.com on every frame and
   slide, and our type. Working colors may suit the topic; they don't have to be rust, amber and
   teal (Alex, 2026-09-28). Never purple, never cobalt, and every text pair passes WCAG
   contrast. Compute it; don't eyeball it.
4. **Look different from recent carousels.** Already used: index cards, exam paper, swatch
   cards, infographic, device mockups, checklist document, stopwatch, planner page, tickets,
   route map, trail map, split-flap board, magazine spread, chat window, year planner.

## Slot notes

- **P, 2 spots left:**
  - One pilot spot has filled. **Never name or hint at who took it.**
  - Terms (from `plans/2026-09-social-pilot.md` and `Already Released/2026-09-26-4`):
    - 3 free months: 3 posts a week on Facebook and Instagram, a monthly plan they approve
      once, a monthly results report
    - then $600 a month, locked for pilot businesses, month to month, no contract
    - Gainesville and Alachua County
    - apply by calling Alex at 904-210-1071 or messaging K&A
  - No "no catch" (there are asks), and no promised results.
  - The hook is real scarcity, stated plainly: "2 of 3 spots left".
  - Facebook link on line 2: `https://ka-performancefl.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-01-4`.
  - LinkedIn is a document with the link in the first comment.
  - Build this one first. It must reach the Post Desk by Wednesday 9/30.
- **W, Sunday (voice guide):** the prompt and its output must come from a real AI run. You
  write the prompt, run it through a model, and save the prompt and the output verbatim in
  `source/ai-run.md`. On screen, say "written by an AI model" and name no vendor. Use a
  fictional business, and label it fictional. Link: https://ka-performancefl.com/ai-launch/ .
- **W, Saturday (photos):** show K&A's own site as the real example. Any bad example is drawn
  and labeled "Drawn example". No stock-photo sites, no client sites. Link: /services/web-design/.
- **M, Monday:**
  - The search-result reel uses a fresh, real capture of K&A's own search result: an incognito
    search for "K&A Performance Gainesville" or "web design Gainesville". Save it in `source/`
    with the date and query. If our result isn't there, use the brand query and say so.
    Nothing edited.
  - The listings carousel shows only places where K&A really has a listing: the website,
    Google Business Profile, Facebook, and Apple Business if it's live. Check each. Anything
    else is drawn and labeled. Link: /services/seo-ai-search/.
- **T, Tuesday:** the "three fonts" reel shows K&A's real type set: Schibsted Grotesk display,
  Atkinson Hyperlegible Next body, Lenia Mono labels. The "too many fonts" page is drawn and
  labeled. The button rules are true of our own site: check the 44px size and contrast on
  ka-performancefl.com and save the numbers.
- **E, Wednesday:** use real screens from K&A's sample courses (`/training/samples/`). No
  statistics about attention spans or retention. Link: /training/.
- **H, Thursday:** the privacy list is general guidance, not legal advice; say so in the
  caption. The "best replies" example is fictional and labeled. No AI vendor names.
  Link: /ai-launch/.
- **F, Friday:**
  - Show real screens from how L1 was built:
    - the plan (`plans/youtube-2026-09-28/SPEC.md`) and the brief (`To Be Released/2026-10-02-4/brief.md`)
    - the script and the per-beat voice files list (`D:\kap-reel\public\youtube\l1\audio\README.md`)
    - a capture still (`D:\kap-reel\public\youtube\l1\captures\stills\`)
    - the style-frame contact sheet (`D:\kap-reel\out\youtube\l1\style-frames\contact-b.png`)
    - the Post Desk approval
    - L1's thumbnail
  - Say plainly that the voice is AI narrated and that Alex approves every step.
  - No client data on screen. Link: https://www.youtube.com/@KAPerformancefl plus the site
    link on line 2.

## Every post (unchanged from last week)

- **On every frame and slide:** the logo and ka-performancefl.com, the hook in the first second
  or on slide 1, and a CTA.
- **Built to work muted:** no narration, no text-to-speech. No pill shapes, no em dashes, US
  English.
- **Truth:** real sites, screens and numbers saved in `source/`. No promised results, time
  savings or ROI. AI posts link /ai-launch/ (the paid 90-Day AI Launch, never "free lessons").
- **Links:**
  - Facebook, line 2: `"<short lead>: https://ka-performancefl.com/<page>?utm_source=facebook&utm_medium=social&utm_campaign=<folder>"`
  - Instagram: "Link in bio", with hashtags under `## First comment`
  - LinkedIn: the link under `## First comment`, with `utm_source=linkedin`
  - Check that every page returns 200.
- **Music captions:** Facebook and video captions say "The music is AI generated."; Instagram
  still-slide captions don't.
- **`post.json`:**
  - `status: "ready"`, with the times from the slot table
  - `music` set on every video post
  - the carousel's Facebook video comes from
    `node tools/slideshow.mjs <folder> --music <mp3>`
- **`brief.md`:** what the viewer gets, the hook, beats or slides, sources, a
  `## Questions for Alex` section only for real decisions, and
  `Approved: yes (week plan plans/2026-10-12.md, Alex 2026-09-28)`.
- **Reels:** render with `node node_modules/@remotion/cli/remotion-cli.js ... --concurrency 3`
  from `D:\kap-reel`, with your own entry at `src/social/<folder>/index.ts`. `npx` breaks on the
  ampersand in the path.

## Verify before reporting

1. Look at every slide yourself, and at a 0.5 s contact sheet of every reel.
2. Loudness: -14 LUFS, true peak at or under -1 dBTP.
3. Run `node tools/social.mjs validate` (the full run) until your folders are clean.
4. **No git commits, no uploads, no Metricool calls, no desk push.** The main session does those.

Report in under 200 words: your folders, the hooks, the music ids with loudness, the
Short titles, the `validate` output, contact sheet paths, questions for Alex, and ElevenLabs
credits spent.
