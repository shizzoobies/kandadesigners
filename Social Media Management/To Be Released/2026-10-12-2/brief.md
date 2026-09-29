# Brief: 5 places your address and phone must match (carousel)

Slot: Mon 2026-10-12, 4:00 PM Eastern. Instagram carousel (POST, 7 slides at 1080x1350) and a Facebook slide video (POST, 22 s, music bed `music-w1012-c`).
Pillar: tip (Monday: local search). Second post of the day, after the 10:30 AM reel and the 12:00 PM Short (2026-10-12).

## What the viewer gets
One master record (name, phone, address, written one way) and the five places it has to match: the website, the Google Business Profile, the Facebook Page, Apple Maps and Bing Places. Each place gets one practical tip. K&A's own three live listings are checked against its own master record, gap included, and the close says why a mismatch costs you on the map, in Google's own words.

## Hook
"5 places your address and phone must match." Slide 1, with K&A's master label and "We checked our own on Sept 28."

## Look
Shipping labels on kraft paper. Slide 1 is the master label (name, phone, address, website, a drawn barcode, "Ship to: every listing"). Each place slide tapes the evidence onto a paper card (a real capture with a green "Real capture" label, or a drawn card with a dashed rust border and "Drawn example"), then a packing slip checks name, phone and address against the master label with MATCH or MISSING stamps. Cream bands top and bottom carry the logo, ka-performancefl.com, the slide count and the swipe cue. Fonts: Schibsted Grotesk, Atkinson Hyperlegible Next, Lenia Mono for the label fields. Distinct from every format on the used list (index cards through year planner). Every text pair computed for WCAG contrast (lowest: ok green on paper, 6.31:1; ink on kraft is 8.60:1).

## Slides
1. Hook. Master label: K & A Performance / 904-210-1071 / Gainesville, FL. Service area, no street address. / ka-performancefl.com. The five places as labels.
2. Place 1, your website: "Put your name, phone and city in the footer, so every page carries them." Real capture of K&A's footer. Name, phone, city: Match.
3. Place 2, your Google Business Profile: "No storefront? Google says to remove your address and set a service area." Real capture. Name, phone: Match; address hidden, service area set: Match.
4. Place 3, your Facebook Page: "Found on our own Page: no phone, no city. The fix is two fields in the Page's contact info." Real capture. Name: Match; phone and address: Missing.
5. Place 4, Apple Maps: "Claim your place card in Apple Business Connect and copy the master label into it." Drawn example, fictional business. "K&A has no Apple Maps card: Apple's place cards show a street address, and we don't publish ours." Check list: same name, same number, same street, suite and ZIP.
6. Place 5, Bing Places: "Bing Places can import your Google profile, so the two start out matching. Recheck it after any change." Drawn example, fictional business. "We imported ours from our Google profile on Sept 22." Same check list.
7. Why it matters on the map: Google's line ("Businesses with complete and accurate info are more likely to show up in local search results.") and "An old number on one listing is a call that never reaches you." "This week: check all five. Fix the one that's different." CTA: Local search is part of every site we build. ka-performancefl.com/services/seo-ai-search. Call Alex 904-210-1071.

## Sources and truth
`source/sources.md`: every capture (signed out, no cookies, 2026-09-28), the master record from the live site, the three Google help pages, and why Apple and Bing are drawn. Only K&A's own details are cropped; no other businesses, reviewer names or client photos. The Apple and Bing cards are a fictional business with a reserved 555-01xx number, labeled "Drawn example" on the slide and in both captions. No ranking or call numbers are claimed. The link, /services/seo-ai-search/, returned 200 on 2026-09-28.

## Music
`music-w1012-c`: new ElevenLabs music_v2 bed, tidy and gently bouncy, about 94 bpm, a resonator guitar slide melody doubled by toy piano over a bouncing strummed acoustic, round picked bass, soft kick and shaker, no vocals. Generator `D:\kap-reel\scripts\social\2026-10-12\music.ts`, logged in `D:\kap-reel\config\audio.json` (set `social-w1012`) and `D:\kap-reel\LICENSING.md`. Passed every take check on the first try; vocal check zero words. Slide video: -14.1 LUFS integrated, -1.8 dBTP.

## Build
`node capture-listings.mjs && node capture-crops.mjs && node build.mjs` (from `source/`), then `node tools/slideshow.mjs 2026-10-12-2 --music "D:\kap-reel\out\candidates\music-w1012-c.mp3"`. Contact sheets: `source/contact-sheet.png` (slides), `source/slideshow-contact-sheet.jpg` (video, 0.5 s). The same slides post to LinkedIn as a document (2026-10-12-3).

## AI
No AI voice or visuals (ai false/false); the drawn cards are coded HTML. The music is AI generated and the Facebook caption says so; the Instagram still slides carry no music, so its caption does not.

Approved: yes (week plan plans/2026-10-12.md, Alex 2026-09-28)

## Questions for Alex
- Our own Facebook Page shows no phone and no city to signed-out visitors (checked Sept 28). Slide 4 says so and stamps them Missing. Do you want to add 904-210-1071 and the Gainesville service area to the Page before Oct 12? If you do, I recapture and slide 4 (and both captions) switch to Match; if not, the slide ships as an honest "we found a gap".
- Is the Bing Places listing live on your side (Bing Places dashboard)? A signed-out Bing Maps search did not show it, so slide 6 is drawn and only says "we imported ours on Sept 22".

## Decisions (Alex, 2026-09-28)
- Facebook: Alex is adding the phone and city to the Page. Before this posts, recapture the Facebook slide signed out; if they show, change its stamp from Missing to matching and rebuild slides, slide video and the LinkedIn document (2026-10-12-3). If not added by Fri 10/9, it stays Missing (an honest example).
- Bing: no live listing known, so Bing stays a drawn, labeled example.
