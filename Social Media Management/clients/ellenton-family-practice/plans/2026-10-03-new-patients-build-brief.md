# Build brief: Ellenton Family Practice Direct, Sat Oct 3 to Fri Oct 16 (read fully before building)

**Where to work**
- ROOT is `D:\K & A Performance Site\Social Media Management`. CLIENT is
  `ROOT\clients\ellenton-family-practice\`. Every `social.mjs` command for this client takes
  `--client ellenton-family-practice` first.
- SITE is `D:\Ellenton Family Practice Rebuild` (the practice's website source; read only).
- The approved plan is `CLIENT\plans\2026-10-03-new-patients.md`. Read your days there first,
  plus "The shape of a day", "What the posts never say" and "Build notes". Then `CLIENT\README.md`
  (the healthcare rules) and `ROOT\clients\README.md` (the folder contract and rule 9: the
  client may see the desk, so hooks, captions, alt text and "Questions for Alex" carry no other
  client, no internal notes, no tools, paths or K&A prices).
- Several agents build different days in parallel. Touch only your own day folders under
  `CLIENT\To Be Released\`. Do not edit shared files, `tools/`, `client.json`, the plan, the
  templates, or any other folder. Do not push to the desk, release, schedule, or commit.

## Shared pieces (made before you start; use them, do not remake them)
- **Templates:** `CLIENT\templates\` holds `build.mjs` (HTML to PNG with Playwright, the same
  method as the finished K&A and Fore Motion cards) and the HTML templates: `card.html` (one
  idea, one frame), `slide.html` (carousel slide, with a hook variant and a closing variant),
  `review.html` (a whole review with the name line), `provider.html` (headshot card), and
  `photo.html` (a card or slide with a real photo). Copy `templates\` into your folder's
  `source\` and fill the text; do not change the type scale, logo placement, colors or the foot.
  `templates\README.md` says how to run it.
- **Photos:** `CLIENT\reference\photos-allowlist.json` lists the clinic photos cleared for use
  (no person in frame) with a one-line description each, plus `reference\contact-sheet.jpg`.
  **Use only files on that list.** Nothing from `SITE\Images\ai_website_variations\`.
  Headshots: the files the live /providers page publishes, in
  `SITE\src\assets\images\providers\`: `david-hervig.jpg` (800 px), `julie-vera-rivas.jpg`
  (800 px), `raphael-kulawik.jpg` (350 px, a little soft; use the `photo` variant and check it,
  fall back to `type` if it looks blocky). Not the 175 px files in `SITE\Images\`. The sign:
  `SITE\src\assets\images\hero-front-sign.png`.
  **If `reference\photos-allowlist.json` does not exist yet when you start,** build every post
  that needs no clinic photo first, then check for the file every 60 seconds for up to 25
  minutes before building the photo posts. If it still has not appeared, build those posts with
  the sign photo only and say so.
- **Facts:** `SITE\src\data\*.ts` and the live site https://familypracticedirect.com. If a fact
  is not there or in the plan, it does not go on screen or in a caption.

## The slots

| Agent | Folders | What (from the plan) | Times |
|---|---|---|---|
| A | `2026-10-03`, `-2`, `2026-10-04`, `-2` | Sat: carousel "Modern medicine. Old fashioned doctors." + card "Where to find us". Sun: reel "A look inside" (photos) + card Review 1 | Sat 12:00 + 17:30, Sun 12:00 + 17:30 |
| B | `2026-10-05`, `-2`, `2026-10-06`, `-2` | Mon: carousel "How to get seen" + card "Hours". Tue: card "Meet Dr. Raphael Kulawik, D.O." + card Review 2 | 10:30 + 17:30 |
| C | `2026-10-07`, `-2`, `2026-10-08`, `-2` | Wed: carousel "Insurance accepted. Uninsured welcome. Membership available." + card "Already a patient? The portal". Thu: card "Meet David Hervig, PA-C" + card Review 3 | 10:30 + 17:30 |
| D | `2026-10-09`, `-2`, `2026-10-10`, `-2` | Fri: carousel "What Direct Primary Care means here" (no prices) + card "Meet Julie Vera Rivas, MSN, APRN, FNP-C" (name and credentials only). Sat: carousel "Sports and school physicals" + card Review 4 | Fri 10:30 + 17:30, Sat 12:00 + 17:30 |
| E | `2026-10-11`, `-2`, `2026-10-12`, `-2` | Sun: reel "Flu shots, this season" (general, CDC-sourced) + card "Preventive screenings and vaccinations". Mon: carousel "Sick today?" + card Review 5 | Sun 12:00 + 17:30, Mon 10:30 + 17:30 |
| F | `2026-10-13`, `-2`, `2026-10-14`, `-2` | Tue: carousel "October: screening questions worth asking" + card "Women's health". Wed: carousel "Living with a chronic condition" + card "Lab work on site" (see note) | 10:30 + 17:30 |
| G | `2026-10-15`, `-2`, `2026-10-16`, `-2` | Thu: carousel "Pediatric visits" + card "Men's health". Fri: carousel "Your annual physical: what to expect" + card "New patients welcome" | 10:30 + 17:30 |

Folder suffix: the first post of the day is `YYYY-MM-DD`, the second is `YYYY-MM-DD-2`.

**Reviews (A, B, C, D, E):** the five reviews are in `SITE\src\data\reviews.ts`, in that order,
review 1 to review 5. Quote each whole, exactly as written there, with the name line exactly as
the site shows it (first name and initial). Add nothing, cut nothing, fix no spelling. Two of
them contain the word "Best"; that is the reviewer's own wording, quoted whole, and it stays (the
no-superlatives rule is about the practice's own claims). Put nothing of our own near it that
echoes it.
**Provider cards (B, C, D):** name, credentials and role exactly as `SITE\src\data\providers.ts`
and the live /providers page state them. Nothing from the bio text (the bios are pending the
providers' approval). Test each headshot at 1080 wide; if it does not hold (soft, blocky), use
the typographic variant of `provider.html` with the name only, and say so in your report.
**Flu reel (E):** if the plan's question 2 is still open when you build, build the flu reel as
written; it is cut or swapped at release if the practice says no. Beats are general, no
brand names, no "we have doses"; "Ask about availability when you call."
**Lab card (F):** build it as "Lab work on site" (not "wholesale"); it swaps or drops per the
plan's question 5.
**Breast cancer awareness (F):** no statistics unless you can cite the CDC or ACS page in the
brief's Sources section; otherwise none. Guidance stays "talk with your provider about timing".

## Allowed facts (the whole list)
Tagline "Modern medicine. Old fashioned doctors." and "Healthcare the way it used to be."
907 25th Dr East, Ellenton, FL 34222; on Highway 301, about two miles from Palmetto and about
two miles from the Ellenton Outlet Mall and I 75. Phone 941 417 7386. Hours Monday to Friday
9:00 AM to 5:00 PM, and Saturday 9:00 AM to 2:00 PM (Alex's change request, 2026-10-02; the
old "Saturday on request for established patients" line is retired). Patient portal
(link in captions only: https://13889.portal.athenahealth.com/). Accepts insurance; sees
uninsured patients; offers Direct Primary Care memberships (one flat monthly fee, longer visits,
same or next day access for members, call or text your provider, month to month, no contract).
Services as the live site lists them: physicals, acute care (sick visits), chronic disease
management, preventive screenings and vaccinations, women's and men's health, pediatric visits,
minor procedures, sports and school physicals, lab work. Providers: Dr. Raphael Kulawik, D.O.,
Medical Director, board certified in Family Medicine; David Hervig, PA-C, US Army trained, 12
years of service; Julie Vera Rivas, MSN, APRN, FNP-C, primary care and weight management.

## Never (on screen, in captions, in alt text)
Any patient, or any image with a person in it other than the two headshots. Outcomes,
guarantees, "best", "#1", before and after, weight results. Personal medical advice. Prescription
drug names. Membership prices. A combined years figure. The chiropractor. "Same-day" for
anyone but members. The phone number 7586. Statistics without a CDC or ACS source. Em dashes.
Decorative "01 02 03" numbering, arrows on every button, the same layout repeated slide after
slide (the client's visual standards call these AI tells and has caught them before). US English.

Education posts (every week-2 lead, the flu reel, the sick-visit and chronic-care carousels, the
breast cancer post) end the caption with: "General information, not medical advice. Call the
office with questions, or 911 in an emergency."

## Reels (A, E)
15 to 20 seconds, 1080x1920, 30 fps, H.264, **silent** (the finisher adds the track). Built with
ffmpeg from allowlisted photos (A) or from rendered PNGs (E): slow zoom or pan, each beat at
least 2.5 seconds, logo top center and familypracticedirect.com at the foot on every frame, the
last 3 seconds on the booking line and the phone. Thumbnail `media/reel-cover.jpg` with
`role: "thumbnail"`. Media `origin: "kap-reel"`. Keep the frame honest: a photo of an empty room
is captioned as the room, nothing staged.

## Carousels
4 to 6 slides, 1080x1350, JPG in `media/slide-NN.jpg`, PNG masters in `source/png/`. Slide 1 is
the hook, the last slide is the ask (call 941 417 7386, the URL). Vary the slide layouts within a
carousel (hook, photo slide, list slide, closing) rather than one layout repeated. Each slide has
`alt` that reads its words and describes any photo in one sentence. Scope each slide image to
`"platforms": ["instagram"]`. Do **not** run `tools/slideshow.mjs`; the finisher does, with the
track. Note in the brief's Build section: "Facebook slide video: finisher".

## Cards
One 1080x1350 PNG as `media/card.png`, both networks, from the template.

## Captions
- `facebook.md`: line 1 the hook; line 2
  `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=<folder>`
  (for the portal card, the portal link goes in the body as well); two to four short lines; close
  on "New patients: call 941 417 7386." and the same tagged link. Education posts add the
  disclaimer line before the close.
- `instagram.md`: line 1 the hook; "Link in bio for familypracticedirect.com."; the same body;
  close on "New patients: call 941 417 7386."; then `## First comment` with
  `#EllentonFL #PalmettoFL #BradentonFL #ManateeCounty #FamilyMedicine #PrimaryCare
  #FamilyDoctor #DirectPrimaryCare`.
- Review posts: the caption is the review, whole, then the name line, then "Read more on our
  Google listing." and the close. No commentary on the review.

## brief.md and post.json
Copy the shapes of `ROOT\clients\foremotion-golf\To Be Released\2026-10-02\brief.md` and
`post.json` (Slot, Pillar, `Approved: yes (Alex in chat, 2026-10-02: build the whole plan)`,
What the viewer gets, Hook, Call to action, The card or The slides or The cut, Sources and
truth with the exact file or page each fact came from, AI (none), Build, `## Questions for Alex`
with "None." or client-safe bullets). `post.json`: `id`, `date`, `time`, `timezone`
"America/New_York", `status` "ready", `pillar`, `title`, `platforms.facebook` and
`platforms.instagram` (`type` POST for cards and carousels, REEL for reels, `caption` file),
`media` with `alt` on every image and thumbnail, `generate: []`. **Do not set `music`.** No `ai`.

## Music ids (reserved; the finisher applies them)

| Folder | Track id | Used on |
|---|---|---|
| `2026-10-03` | `music-efp-1003-c` | Facebook slide video |
| `2026-10-04` | `music-efp-1004-r` | reel |
| `2026-10-05` | `music-efp-1005-c` | Facebook slide video |
| `2026-10-07` | `music-efp-1007-c` | Facebook slide video |
| `2026-10-09` | `music-efp-1009-c` | Facebook slide video |
| `2026-10-10` | `music-efp-1010-c` | Facebook slide video |
| `2026-10-11` | `music-efp-1011-r` | reel |
| `2026-10-12` | `music-efp-1012-c` | Facebook slide video |
| `2026-10-13` | `music-efp-1013-c` | Facebook slide video |
| `2026-10-14` | `music-efp-1014-c` | Facebook slide video |
| `2026-10-15` | `music-efp-1015-c` | Facebook slide video |
| `2026-10-16` | `music-efp-1016-c` | Facebook slide video |

## Finish (every builder)
Run `node tools/social.mjs --client ellenton-family-practice validate <folder>` on each folder
and fix what it reports. View every rendered PNG and at least three frames of any reel yourself;
check every photo you used is on the allowlist; count em dashes in every text file (none).
Report in under 250 words: folders, hooks, validate output, photos used (file names), headshot
test result, any fact you left out as unsure, and questions for Alex in client-safe wording.
