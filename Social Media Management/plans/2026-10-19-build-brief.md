# Build brief: Oct 17 to 23 (read fully before building)

**Where to work**
- Working folder: `D:\K & A Performance Site\Social Media Management`.
- The approved plan is `plans/2026-10-19.md`. Read your slot there first.
- Several agents build different days in parallel. Touch only your own day's folders and your
  own files in `D:\kap-reel` (your own entry at `src\social\<folder>\` and
  `scripts\social\<folder>\`). Never edit `Root.tsx` or shared files.
- **L4 is on hold (Alex, 2026-09-30).** `2026-10-21-4` stays reserved and empty. Don't create it.
  L3 (`2026-10-14-4`) belongs to another builder. Don't touch it.

## Read first
- `README.md`: the folder contract, per-network media, `slideshow.mjs`, the LinkedIn
  DOCUMENT, the 30-day music rule, Post Desk questions, and the YouTube section.
- `plans/2026-09-28-rework.md` (brand and the every-frame rules) and
  `plans/2026-10-12-build-brief.md` (last week's brief; everything there still applies unless
  changed below).
- **Patterns to copy (the week of Oct 12 is the newest finished work):**
  - Reel with its YouTube Short: `To Be Released/2026-10-16` (`post.json` with the `youtube`
    block, `youtube.md`) and its Remotion build at `D:\kap-reel\src\social\2026-10-16`, with
    `scripts\social\2026-10-16\deliver.ts`.
  - Carousel: `To Be Released/2026-10-15-2`. Its `source/build.mjs` renders HTML slides to JPG
    with Playwright from `D:\kap-reel\node_modules`.
  - LinkedIn: `To Be Released/2026-10-15-3` (`linkedin.md`, `repost.md`, DOCUMENT type).
  - Music generation: `D:\kap-reel\scripts\social\music-week-0928.ts`. Log each track to
    `config/audio.json` and `LICENSING.md`, and to `music-history.json` here.

## The slots

| Agent | Folders | What (from the plan) | Times |
|---|---|---|---|
| W | `2026-10-17`, `2026-10-18` | Sat: Alt text, describe the picture in one sentence. Sun: Let AI proofread, not rewrite | Sat 12:00, Sun 18:00 |
| M | `2026-10-19`, `-2`, `-3` | Local search. Reel: Read your reviews the way your next customer does. Carousel: 5 things to do with a Google review after you say thanks | reel 10:30 + Short 12:00, carousel 16:00, LinkedIn 08:00 |
| T | `2026-10-20`, `-2`, `-3` | Web design. Reel: Ask for less on your form. Carousel: What your contact page owes a visitor | same as M |
| E | `2026-10-21`, `-2`, `-3` | Training. Reel: Show it, then let them try it. Carousel: Wrong answer? Say why, not just "incorrect" | same as M |
| H | `2026-10-22`, `-2`, `-3` | AI. Reel: Ask AI to find the questions in your reviews. Carousel: From review to FAQ answer in 4 steps | reel 10:30 + Short 12:00, carousel **18:00**, LinkedIn 08:00 |
| F | `2026-10-23`, `-2`, `-3` | Behind the scenes: What we check before a website goes live (on Thrillers) | same as M |

Music ids (new ElevenLabs tracks, no vocals, about 30 s, indie pop with a guitar-led family
feel; each distinct from the others and from everything in `music-history.json`,
`D:\kap-reel\config\audio.json` and `plans/2026-09-28-music.md`):

| Folder | Track id |
|---|---|
| `2026-10-17`, `2026-10-18` | `music-w1017`, `music-w1018` |
| weekday reel | `music-w10DD-r` (for example `music-w1019-r`) |
| weekday carousel slide video | `music-w10DD-c` |

A Short reuses its own reel's track: same day, one use.

## Rules carried over from last week (in force)

1. **YouTube Short in every weekday reel folder** (not the weekend folders). In the reel's
   `post.json`:
   - `platforms.youtube = {type: "SHORT", caption: "youtube.md", title, tags, category:
     "HOWTO_STYLE", time: "12:00"}`
   - `playlist`: "Quick fixes for your website" on Mon, Tue and Fri; "Practical AI for small
     business" on Thu; none on Wed.
   - **Title:** 70 characters or fewer, the idea rather than a slogan, no AI vendor names.
   - **`youtube.md`:** line 1 the hook; line 2 the right ka-performancefl.com page with
     `?utm_source=youtube&utm_medium=social&utm_campaign=<folder>`; two or three plain
     sentences; "The music is AI generated."; the footer from `plans/youtube-setup.md`.
   - YouTube gets exactly one video. Scope other files with
     `"platforms": ["facebook","instagram"]` on the media entry (README, "YouTube").
2. **Captions that point to our YouTube:** only where the plan says.
   - Sun 10/18 (proofreading): L2. Facebook and LinkedIn: "Full walkthrough on our YouTube
     channel: https://www.youtube.com/@KAPerformancefl". Instagram: "Full walkthrough on our
     YouTube: @KAPerformancefl".
   - Fri 10/23: the channel itself.
   - **No caption anywhere mentions L4 or a coming video about reviews.** L4 is on hold.
3. **Colors:** the brand marks never change: the K&A logo lockup
   (`D:\kap-reel\assets\brand\logo\logo-lockup.webp`), ka-performancefl.com on every frame and
   slide, and our type (Schibsted Grotesk display, Atkinson Hyperlegible Next body, Lenia Mono
   labels). Working colors may suit the topic. Never purple, never cobalt, and every text pair
   passes WCAG contrast. Compute it into `source/contrast.json`; don't eyeball it.
4. **Look different from recent carousels.** Already used: index cards, exam paper, swatch
   cards, infographic, device mockups, checklist document, stopwatch, planner page, tickets,
   route map, trail map, split-flap board, magazine spread, chat window, year planner, photo lab
   contact sheet, cookbook page, shipping labels, technical drawing sheet, cutting mat, manila
   file folder, production slate. Reels: planner grid, hand-in desk, search result card, drawn
   page on a stage, phone screens with a progress row, redaction bars, clapper slate. The plan
   gives a format idea per slot; use it or something equally new.

## Slot notes

- **W, Saturday (alt text):** show K&A's own site images with their real alt text (read it from
  the live page source and save it in `source/`). The bad examples ("image of", a paragraph, the
  file name) are drawn and labeled "Drawn example". Decorative images get empty alt; say so
  once, plainly. Link: /services/web-design/.
- **W, Sunday (proofread, not rewrite):** the prompt and its output must come from a real AI
  run. You write the prompt, run it through a model, and save the prompt and the output
  verbatim in `source/ai-run.md`. On screen, say "checked by an AI model" and name no vendor.
  The paragraph being checked belongs to a fictional business, labeled fictional. The prompt
  must forbid rewrites and ask only for errors, unclear sentences and facts to check. Link:
  https://ka-performancefl.com/ai-launch/ .
- **M, Monday (reviews):**
  - Check K&A's live Google Business Profile first (an incognito search for "K&A Performance
    Gainesville"). If it has reviews, capture them fresh on the build day, save the capture and
    the date in `source/`, and shorten reviewer names to a first name or an initial. If it has
    none or too few to make the point, draw a profile, label it "Drawn example", and say so in
    `## Questions for Alex`.
  - Never bypass a CAPTCHA. If Google blocks the capture, redraw from live data and label it.
  - The carousel's five things are advice, not promises: no claims about rankings or results.
    "Quote it on your site" carries "ask first".
  - Link: /services/seo-ai-search/.
- **T, Tuesday (forms and the contact page):**
  - The reel shows K&A's real contact form (capture it) next to a drawn twelve-field form
    labeled "Drawn example".
  - The carousel's five items are checked against ka-performancefl.com/contact/ (or wherever
    the contact page lives; confirm the URL returns 200): does the phone number dial on tap
    (`tel:` link), does the address open a map, are hours shown, how many fields, and what the
    page says happens after sending. Save what you found in `source/`. If our own page misses
    one, show it honestly as "we're fixing this too" rather than pretending.
  - Link: /services/web-design/.
- **E, Wednesday (training):** real screens from K&A's sample courses (`/training/samples/`).
  No statistics about retention or attention. Feedback examples come from the sample courses
  or are drawn and labeled. Link: /training/.
- **H, Thursday (reviews to FAQ):**
  - The reel's prompt run is real: fictional reviews (labeled) for a fictional business, the
    prompt and output saved verbatim in `source/ai-run.md`, no vendor named on screen or in
    captions.
  - The carousel's step 4, "check every claim", is the point; the caption says the AI drafts
    and the owner decides.
  - Link: /ai-launch/. General guidance, not legal advice, where privacy comes up.
- **F, Friday (pre-launch checklist):**
  - Alex may have a client launch this week; if he does, these folders get replaced by the
    launch posts in the Thrillers format (`To Be Released/2026-10-02`, `-2`, `-3`). Build the
    checklist as planned regardless.
  - Show the checks on https://thrillersvr.com (a site we built, already public): Tab through it,
    the 10-second phone test, contrast, every link returns 200, the form sends (do not actually
    submit the client's form; show the field states), the 404 page, and the phone speed check.
    Real captures, saved in `source/` with dates. No client data beyond what the public site
    shows.
  - The last check (speed on a phone) is the hand-off to L5 the following week; say "more on
    that soon", nothing more specific.
  - Link: /services/web-design/ plus https://www.youtube.com/@KAPerformancefl in the caption.

## Every post (unchanged)

- **On every frame and slide:** the logo and ka-performancefl.com, the hook in the first second
  or on slide 1, and a CTA.
- **Built to work muted:** no narration, no text-to-speech. No pill shapes, no em dashes, US
  English.
- **Truth:** real sites, screens and numbers saved in `source/`. No promised results, time
  savings or ROI. AI posts link /ai-launch/ (the paid 90-Day AI Launch, never "free lessons").
  Social posts name no AI vendors.
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
  `Approved: yes (week plan plans/2026-10-19.md, Alex 2026-09-30)`.
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
