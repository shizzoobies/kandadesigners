# Brief: What your contact page owes a visitor (carousel)

Slot: Tue 2026-10-20, 4:00 PM Eastern. Instagram carousel (POST, 7 slides at 1080x1350)
and a Facebook slide video (POST, 22 s, music bed `music-w1020-c`).
Pillar: tip (web design day). Second post of the day; the reel (2026-10-20) runs at 10:30 AM
and its YouTube Short at noon. Link: https://ka-performancefl.com/services/web-design/
(Facebook line 2, Instagram link in bio; 200 on 2026-09-30, `../2026-10-20/source/link-check.md`).

## What the viewer gets
Five things a contact page owes a visitor, each one checked against K&A's own contact page
with the result shown honestly: a phone number that dials on tap, an address that opens the
map (or the towns you serve plus your Google profile), hours, one short form, and what
happens after they send (who replies, roughly when). Our page scores 3 of 5, and the two
misses say "We're fixing this too."

## Hook
Slide 1: "What your contact page owes a visitor." Under the kicker "Five things, checked on
our own page", with "Checked on ka-performancefl.com/contact, Sept 30, 2026."

## Look
Rolodex cards (the plan's format idea). Every slide is a desk Rolodex: the front card with a
rust index tab, the next cards' tabs peeking behind, two slots on the rail and the black base
with chrome knobs. Slide 1 is the "Contact" card, slides 2 to 6 one card per item, slide 7
the "Score" card with the CTA. Distinct from every recent carousel in the build brief's list.
Every slide: K&A logo, ka-performancefl.com, slide count, swipe cue.

## Slides
1. Hook, as above. Back tabs: 1 Phone, 2 Map; 3 Hours, 4 Form, 5 After.
2. Card 1, Phone: "A phone number that dials on tap." Our page: Yes. 904-210-1071 is a tel:
   link. Real crop: "Rather talk it through? Call 904-210-1071."
3. Card 2, Map: "An address that opens the map." No storefront? Name the towns you serve and
   link your Google profile. Our page: Not yet. Towns listed, no street address, no map
   link. "We're fixing this too." Real crop: "A Gainesville studio with an Ellenton office."
4. Card 3, Hours: "Hours, or when you pick up." Our page: Not yet. Messages get a reply
   within 24 hours, but no phone hours. "We're fixing this too." Dashed box: Hours, Not on
   our page.
5. Card 4, Form: "One short form." Our page: Yes, 3 fields: name, email, message. Real crop of
   the three fields.
6. Card 5, After: "What happens after they send." Our page: Yes. "We read every word and
   reply within 24 hours," from Alex & Kristina; the thank-you message says it again. Real
   crop of the intro with the avatars.
7. Score: 3 of 5 (ticks for phone, form, after; crosses marked "fixing" for map and hours).
   Want a contact page that does all five? Call Alex 904-210-1071.
   ka-performancefl.com/services/web-design.

## Sources and truth
- The check: `source/check-contact.mjs` loaded https://ka-performancefl.com/contact/ (200) on
  2026-09-30 at phone (390 x 844, 3x) and desktop (1280 x 900, 2x) widths and wrote
  `source/contact-check.json`:
  - tel: links `tel:+19042101071` in the page body ("904-210-1071"), the header ("Call") and
    the footer ("Call 904-210-1071").
  - no street address and no map link anywhere on the page (the g.page link exists only in
    the structured data, which a visitor never sees). K&A publishes city only by Alex's
    2026-08-09 decision (docs/seo/LOCAL-SEO-PLAN.md), so the card asks for the towns plus a
    Google profile link rather than a street address.
  - no hours: the only matches are "reply within 24 hours" and "meetings there are by
    appointment" (the Ellenton office), neither of which says when the phone is answered.
  - 3 visible fields in #contact-form (Name, Email, Message); the hidden access key,
    subject, from name and the honeypot are not counted.
  - after sending: "We read every word and reply within 24 hours.", "You'll hear back from
    Alex & Kristina, the two of us, not a ticket queue.", and the success message "Thanks
    for reaching out. We'll be in touch within 24 hours."
- The slide verdicts are read from `contact-check.json` by `source/build.mjs`, not typed.
- Evidence crops: `source/crops.mjs` into `source/captures/crop-*.png` (with `source/crops.json`),
  unedited; the fixed header and chat button were hidden for the element shots only. Full
  captures: `source/captures/contact-*.png`.
- The AI scoping chat on the same page is not counted or shown; the post is about the form.
- Text contrast computed, 15 pairs, lowest 5.68:1: `source/contrast.json` (script
  `source/contrast.mjs`, which also writes the reel's pairs).
- No promised results. No statistics.

## Music
`music-w1020-c`: new ElevenLabs music_v2 track, warm and easygoing indie pop, about 92 bpm, a
sweet fingerpicked acoustic guitar melody over shimmering autoharp strums, soft picked
electric bass, gentle kick and shaker, no vocals. Generator
`D:\kap-reel\scripts\social\2026-10-20\music.ts gen c`, logged in
`D:\kap-reel\config\audio.json` (set `social-w1020`) and `D:\kap-reel\LICENSING.md`. Passed
every take check; zero words in the vocal check. Slide video: -14.1 LUFS integrated,
-1.2 dBTP true peak.

## Constraints
No em dashes. US English. No AI voice or visuals (ai false/false). The music is AI generated
and disclosed in the Facebook caption; Instagram gets still slides, no music line.

## Build
`node source/check-contact.mjs`, `node source/crops.mjs`, `node source/build.mjs` (slides,
contact sheet), `node source/contrast.mjs`, then
`node tools/slideshow.mjs 2026-10-20-2 --music "D:\kap-reel\out\candidates\music-w1020-c.mp3"`.
Contact sheets: `source/contact-sheet.png` (slides), `source/slideshow-contact-sheet.jpg`
(video, 0.5 s).

Approved: yes (week plan plans/2026-10-19.md, Alex 2026-09-30)

## Questions for Alex
- The carousel says "We're fixing this too" for two things our own contact page is missing:
  a map link (our Google profile, since we publish no street address) and hours (when the
  phone gets answered). Both are small site edits on /contact/. Should we make them before
  this posts on Oct 20, and what hours should the page show? If you'd rather not commit,
  the wording can change to "Not on our page yet."
