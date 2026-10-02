# Build brief: Fore Motion Golf, Sat Oct 3 to Fri Oct 16 (read fully before building)

**Where to work**
- Working folder: `D:\K & A Performance Site\Social Media Management` (ROOT). This client's
  root is `ROOT\clients\foremotion-golf\` (CLIENT). Every `social.mjs` command for this client
  takes `--client foremotion-golf` first, e.g. `node tools/social.mjs --client foremotion-golf
  validate 2026-10-03`.
- The approved plan is `CLIENT\plans\2026-10-02-founders-funnel.md`. Read your days there
  first, plus "The shape of a day", "What the posts never say" and "Build notes".
- Several agents build different days in parallel. Touch only your own day folders under
  `CLIENT\To Be Released\`. Do not edit shared files, `tools/`, `client.json`, the plan, or
  any other folder. Do not push to the desk, release, schedule, or commit.
- Tonight's folder `2026-10-02` is finished and on the desk. Do not change it. Copy from it.

## Read first
- `ROOT\clients\README.md`: the client folder contract, captions, rule 9 (client-safe text:
  Hannah, the client's social manager, sees titles, hooks, captions, alt text and the
  "Questions for Alex" block exactly as written; no other clients, no K&A-internal notes, no
  tools or paths, no K&A prices, no comments about the client).
- `ROOT\README.md`: post.json, carousels (Instagram gets swipe slides, Facebook gets a slide
  video made by `tools/slideshow.mjs`), the 30-day music rule.
- `CLIENT\To Be Released\2026-10-02\`: the finished card. Its `source/build.mjs` renders an
  HTML card to PNG with Playwright and writes a contrast report. **Copy this script and its
  look** for every card and slide: the stacked Aug 2 logo (`Secondary` on dark, `Primary_Light`
  on cream), Oswald Bold headlines, Bahnschrift body (Barlow is not installed; do not download
  fonts), deep forest #152F0F ground, cream #FAF8F2 type, logo green #73AF15 and lime #6AA212
  accents, URL at the foot. Cream slides inside a carousel are fine for contrast between
  slides; cards stay dark.
- Carousel pattern: `ROOT\Already Released\2026-10-01-4` (slides as JPG in `media/`, PNG
  masters in `source/png/`, `slideshow.mp4` and `slideshow-cover.jpg` for Facebook, media
  entries scoped with `"platforms"`). Slides are 1080x1350.
- Brand: `D:\Foremotion Golf\Social Media Management\Branding\Brand Guide.md` and
  `Branding\Logos\`. Never the old concept logo. No recoloring, glow or shadow on the logo.
- Facts: `D:\Foremotion Golf\Website Build\foremotion-golf\docs\content-facts.md` and the
  plan. If a fact is not in one of those, it does not go on screen or in a caption.

## The slots

| Agent | Folders | What (from the plan) | Times |
|---|---|---|---|
| A | `2026-10-03`, `-2`, `2026-10-04`, `-2` | Sat: carousel "This isn't just a place to hit golf balls" + card "Be first through the doors". Sun: reel "Follow the build" (Walkthrough 2 cut) + card "Construction updates come to the list first" | Sat 12:00 + 17:30, Sun 12:00 + 17:30 |
| B | `2026-10-05`, `-2`, `2026-10-06`, `-2` | Mon: carousel "Calibrate. Compete. Connect." + card "Calibrate". Tue: reel "Compete" (Walkthrough 2 cut) + card "Connect" | 10:30 + 17:30 each day |
| C | `2026-10-07`, `-2`, `2026-10-08`, `-2` | Wed: carousel "Four bays. Six players each." + card "Rental clubs, reserved ahead". Thu: reel "The bar and lounge" (Walkthrough 1 cut) + card "Canned beer and seltzers at the bar" | 10:30 + 17:30 each day |
| D | `2026-10-09`, `-2`, `2026-10-10`, `-2` | Fri: carousel "Rain, heat or dark, it is 70 and sunny" + card "The putting area". Sat: reel "Walk the space" (both walkthroughs) + card "Coming early 2027" | Fri 10:30 + 17:30, Sat 12:00 + 17:30 |
| E | `2026-10-11`, `-2`, `2026-10-12`, `-2` | Sun: carousel "What it means to be a Founder" + card "The Founders Wall". Mon: card "Founding Practice" + card "Founding Club" | Sun 12:00 + 17:30, Mon 10:30 + 17:30 |
| F | `2026-10-13`, `-2`, `2026-10-14`, `-2` | Tue: card "Founding Tour, the premier individual membership" + card "Founding Corporate Partner". Wed: carousel "The four Founding Memberships, side by side" + card (see the Oct 14 note below) | 10:30 + 17:30 each day |
| G | `2026-10-15`, `-2`, `2026-10-16`, `-2` | **No-price form** (see below). Thu: carousel "What a Founding Membership is" (FAQ) + reel "The four Founding Memberships in motion". Fri: card "Limited. Prepaid. Before we open." + card "Five Founding Corporate Partnerships" | 10:30 + 17:30 each day |

Folder suffix: the first post of the day is `YYYY-MM-DD`, the second is `YYYY-MM-DD-2`.
`post.json` `time` is the post's own time; both networks share it.

**Oct 14 card (agent F):** the plan says "Tomorrow at 10:30: prices and the sales date." Justin
has not confirmed, so build it as "The four Founding Memberships. Limited. Get first access
on the Founders List." with no "tomorrow". If he confirms before release, it is re-cut.

**Oct 15 and 16 (agent G), no-price form:** Justin has not confirmed that prices show on Oct 15.
Build these without prices or a sales date:
- `2026-10-15` carousel, "What a Founding Membership is": five slides from Justin's own FAQ
  wording: a limited prepaid membership offered before Fore Motion Golf opens; it includes
  simulator hours, member benefits, early access, Founder recognition and priority
  opportunities during the term; four options, Practice, Club, Tour and Corporate Partner;
  first access goes to the Founders List; closing slide with the Agreement line.
- `2026-10-15-2` reel, 1080x1920, about 16 seconds: the four tier cards (name, hours, about
  per month, spots) one after another with a simple cut or crossfade, ending on the Founders
  List. Build it with ffmpeg from your rendered PNGs. Silent; the finisher adds music.
- `2026-10-16` card: "Limited. Prepaid. Before we open." sub line "Founding Memberships.
  First access on the Founders List."
- `2026-10-16-2` card: "Five Founding Corporate Partnerships." 12 months, 150 hours of reserved
  bay time, for local businesses; "Request corporate information: admin@foremotiongolf.com".
When Justin confirms, these two days are rebuilt with prices by a later job. Note that in each
brief's Build section.

## Tier facts (the only membership numbers allowed on screen)
- Founding Practice: 6 months, 24 hours of reserved bay time, about 4 a month, 25 spots.
- Founding Club: 6 months, 48 hours, about 8 a month, 25 spots.
- Founding Tour, the premier individual membership: 6 months, 84 hours, about 14 a month,
  10 spots. Never "Best Value".
- Founding Corporate Partner: 12 months, 150 hours, 5 partnerships.
- No prices. No total count of Founders (say "limited"). Hours are reserved bay time, not
  hours per golfer. Every membership card and the Founder carousel's closing slide carry:
  "Limited availability. Benefits and terms governed by the Founding Membership Agreement."

## Venue facts allowed
Four TrackMan bays, up to six players per bay; a bar and lounge; a putting area; canned beer
and seltzers; rental clubs, reservable ahead; 1518 Park Ave, Orange Park, FL 32073, the former
DMV; opening early 2027 (never a month or day); leagues and events (from the splash page);
"Calibrate. Compete. Connect."; "Where it's always 70 and sunny."
**Not allowed on screen or in captions:** "thirty-foot bar", "equipment repairs", "watch
parties", any opening month, any price, testimonials, member counts, Gold, Platinum, Diamond,
Elite, rollover, booking windows in days, named merchandise (only "Exclusive Founding Member
merchandise"), anything about the Founders Cup or the putting game, any other company's logo
(TrackMan is text only). No em dashes anywhere. US English.

## Reels from the walkthroughs (agents A, B, C, D)
- Sources: `D:\Foremotion Golf\Social Media Management\Photos and Video\` is empty; the two
  videos are in `D:\Foremotion Golf\Social Media Management\Content\` (search for
  `Walkthrough 1*.mov` and `Walkthrough 2*.mov` under `D:\Foremotion Golf`; frame sheets are
  in `CLIENT\reference\`). They are 2160x3840 at 60 fps with Hannah's captions burned in and
  concept renders cut in. ffmpeg is on PATH.
- Read the frame sheets and extract frames (one every 2 seconds) to see what each second
  shows. Pick 15 to 25 seconds of **real footage of the space**. Downscale to 1080x1920, 30 fps,
  H.264, silent (`-an`). The finisher adds the track.
- **Cut, do not keep:** the pro shop frames showing Nike or PING; any segment whose burned-in
  caption states something from the "not allowed" list (thirty-foot bar, repairs, watch
  parties). If a needed segment carries such a caption, cover the caption with a full-width
  band in deep forest and put your own line in it.
- **Concept renders:** every second a concept image is visible, a "Concept" label sits in a
  corner in cream on a deep forest tab, readable on a phone. If you cannot tell whether a shot
  is real or a render, treat it as a render and label it.
- The person on camera is not named. Prefer segments that show the space over segments that
  show the person.
- Overlay your own text beats (plan wording) in Oswald, with the logo top center and the URL at
  the foot on every frame. A text beat holds at least 2.5 seconds. End on "Join the Founders
  List" and the URL for the last 3 seconds. Thumbnail: a `media/*-cover.jpg` frame with
  `role: "thumbnail"`.
- Media `origin`: use `"kap-reel"` for anything rendered or cut by you (the allowed values
  are human, codex, elevenlabs, kap-reel; the finished example used kap-reel for the same
  method). Hannah's footage inside a cut still counts as `"kap-reel"` for the cut file.

## Carousels
- 4 to 6 slides, 1080x1350, JPG in `media/slide-NN.jpg`, PNG masters in `source/png/`. Slide 1
  is the hook, the last slide is the ask (the Founders List, the URL). Each slide has `alt`
  that reads the slide's words and describes the picture in one sentence.
- Do **not** run `tools/slideshow.mjs` yourself (it needs the track). Leave the Facebook slide
  video to the finisher. In `post.json`, scope each slide image to `"platforms": ["instagram"]`
  and leave a note in the brief's Build section: "Facebook slide video: finisher".

## Cards
- One 1080x1350 PNG as `media/card.png`, from the `2026-10-02` script. Both networks.

## Captions
- `facebook.md`: line 1 the hook; line 2
  `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=<folder>`;
  two to four short lines; close on "Join the Founders List:" and the same link.
- `instagram.md`: line 1 the hook; "Link in bio to join the Founders List."; the same body;
  close on "Join the Founders List at foremotiongolf.com, link in bio."; then `## First
  comment` with `#OrangeParkFL #ClayCountyFL #JacksonvilleGolf #IndoorGolf #GolfSimulator
  #TrackMan #FloridaGolf #ForeMotionGolf`.
- Membership posts add the Agreement line as the last body line.

## brief.md
Copy the `2026-10-02` brief's shape: Slot, Pillar (the plan's phase), `Approved: yes (Alex in
chat, 2026-10-02: build the whole plan)`, What the viewer gets, Hook, Call to action, The card
(or The slides, The cut), Sources and truth, AI (none; "music: finisher" for video), Build,
and `## Questions for Alex` with "None." or client-safe bullets only.

## post.json
Shape as `2026-10-02`: `id`, `date`, `time`, `timezone` "America/New_York", `status` "ready",
`pillar`, `title`, `platforms.facebook` and `platforms.instagram` (`type` POST for cards and
carousels, REEL for reels, `caption` file), `media` with `alt` on every image and thumbnail,
`generate: []`. **Do not set `music`**; the finisher does. No `ai` unless something is
AI-made (nothing should be).

## Music ids (reserved; the finisher applies them)

| Folder | Track id | Used on |
|---|---|---|
| `2026-10-03` | `music-fmg-1003-c` | Facebook slide video |
| `2026-10-04` | `music-fmg-1004-r` | reel |
| `2026-10-05` | `music-fmg-1005-c` | Facebook slide video |
| `2026-10-06` | `music-fmg-1006-r` | reel |
| `2026-10-07` | `music-fmg-1007-c` | Facebook slide video |
| `2026-10-08` | `music-fmg-1008-r` | reel |
| `2026-10-09` | `music-fmg-1009-c` | Facebook slide video |
| `2026-10-10` | `music-fmg-1010-r` | reel |
| `2026-10-11` | `music-fmg-1011-c` | Facebook slide video |
| `2026-10-14` | `music-fmg-1014-c` | Facebook slide video |
| `2026-10-15` | `music-fmg-1015-c` | Facebook slide video |
| `2026-10-15-2` | `music-fmg-1015-r` | reel |

## Finish (every builder)
Run `node tools/social.mjs --client foremotion-golf validate <folder>` on each of your folders
and fix what it reports. View every rendered PNG and at least three frames of every reel
yourself and fix anything cramped, clipped, low-contrast or mislabeled. Count em dashes in
every text file you wrote (none allowed). Report in under 250 words: folders, hooks, validate
output, what you cut from the walkthroughs and why, any fact you were unsure of and left out,
and questions for Alex (client-safe wording).
