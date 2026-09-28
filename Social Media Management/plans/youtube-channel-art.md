# Brief: YouTube channel art

Part of `plans/youtube-channel.md`, build step 2. Written 2026-09-28.
Approved: yes (Alex, 2026-09-28, as written)

## What it is for
The first impression on the channel page, and the thumbnail look every video will share. These
options are made for you to pick from. Nothing gets uploaded to YouTube until you pick.

## Specs (checked against YouTube Help on 2026-09-28)
| Piece | Size we build | YouTube's rule |
|---|---|---|
| Banner | 2560x1440 PNG, under 6 MB | 16:9, 2048x1152 minimum, 6 MB max. Text and logo stay inside the center safe area (1235x338 at the minimum size, about 1546x423 at 2560) |
| Avatar | 800x800 PNG | Shown as a circle, as small as 98x98. Must still read at that size |
| Watermark | 300x300 PNG, transparent | Square, 150x150 minimum, under 1 MB |
| Thumbnail | Designed at 1280x720, exported at 3840x2160 JPG | YouTube now recommends 3840x2160 (640 wide minimum), JPG or PNG. The cap is 50 MB from a computer but only 2 MB from a phone, so we aim for under 2 MB. Needs the channel verified |

Change from the handoff: thumbnails now go up at 4K rather than 1280x720, which keeps them sharp.

## Brand in use
- Canvas #F8F5F2, rust #9A3412, teal #134E4A with #5EEAD4 on dark, amber #D97706 for one
  highlight at most (never small amber text on a light background). No purple, no cobalt.
- Headlines in Schibsted Grotesk 700 (dark, thick, large). Small-caps lines in Lenia Mono with
  interpuncts, no pills. The logo is the live lockup: `kandalogo2.0-performance.svg` for full
  resolution, and `site-logo-white.png` on teal.
- The promise: "Practical fixes for your business website, Google listing and everyday AI. A new
  walkthrough every week from a Gainesville web studio." On the banner it may shorten to its first
  sentence, with "New walkthrough every week" as the small-caps line.
- No em dashes; US English.

## Banner: three directions
- **A. Canvas.** Light canvas. The lockup on the left of the safe area, the promise in large
  Schibsted on the right, and a rust small-caps line underneath: `WEBSITES · GOOGLE LISTINGS ·
  PRACTICAL AI · EVERY WEEK`. Nothing outside the safe area except a thin rust rule. The quietest
  option, and the closest to the site.
- **B. Teal band.** The same layout on teal #134E4A, with the white lockup, canvas-colored type
  and a #5EEAD4 small-caps line. Stands out more in the YouTube interface, which is mostly white.
- **C. Work on show.** The canvas safe area as in A. On desktop and TV the wider edges show real
  4K captures of two K&A client sites in plain browser frames. These edges are hidden on phones,
  so no message lives there. It shows real work, but it's the busiest of the three.

## Avatar: three directions
- **A. Tight lockup.** The current lockup cropped close, with the browser frame and mouse dropped,
  so "K&A" fills the circle and "PERFORMANCE" sits under it.
- **B. Monogram on canvas.** Only "K&A" in the lockup's serif, with the ampersand in rust, large.
  The most readable at 98 px.
- **C. Monogram on teal.** The same as B on teal, with canvas letters and a #5EEAD4 ampersand.
  Pairs with banner B.

## Thumbnail system: two directions, each shown on topics 1 and 2
Every thumbnail: at most 5 words, a real screen capture (no stock, no AI imagery), the logo in the
same corner, and a small-caps pillar label. Quick fixes are marked in rust, Practical AI in teal,
so the two playlists look like a set.
- **A. Split card.** A canvas panel on the left with the big dark headline, and a real capture in a
  browser frame on the right, slightly cropped in on the part that matters. The pillar label sits
  on a thin colored bar along the bottom.
- **B. Capture first.** The capture fills the frame, and a solid pillar-color band on the left
  third carries the headline in canvas type. One amber outline marks the exact spot the video
  fixes (for topic 1, the missing focus ring).

## What you get
- PNG and JPG files in `Reels/youtube/channel-art/`, plus one review page that shows each banner
  cropped the way it appears on a phone, on desktop and on TV, and each avatar at 98 px and 800 px.
- Captures at deviceScaleFactor 2 or higher, so nothing is soft.

## After you pick
The picks get their final polish. Then I write the setup checklist (About text, links, upload
defaults, playlists) and you upload the art, or I walk you through it.

## Picks (Alex, 2026-09-28)
- Banner **A, canvas**; profile picture **B, monogram on canvas**; thumbnail system **B, capture first**
  (rust band for Quick fixes, teal band for Practical AI, `PILLAR · KA-PERFORMANCEFL.COM` line).
- Watermark: the canvas disc version, to match the profile picture.
- Upload-ready copies: `Reels/youtube/channel-art/final/`. Sources and `render.cjs` in `channel-art/src/`.
- Review fixes made before the picks: the mouse wheel drawn as a stroke, not a "0"; Osteen & Sons
  replaced by David's BBQ in banner C (purple and em dashes); site address on every thumbnail;
  the topic 2 email became a bakery order with no prices; no amber outline on topic 1 B.
