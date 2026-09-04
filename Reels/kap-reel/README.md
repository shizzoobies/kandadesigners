# kap-reel

Remotion project for the K&A Performance web design showcase reel. See
`../kap-reel-handoff.md` for the full build spec.

## Run everything through D:kap-reel

This project lives under `D:K & A Performance SiteReelskap-reel`. The
ampersand in that path breaks npm's generated `.cmd` shims on Windows, so
`npx remotion ...` and `npm run ...` fail from the real path.

Fix in use: a directory junction at `D:kap-reel` points at the real folder.
Open a shell there and every normal command works. Recreate it if it is
missing:

```
New-Item -ItemType Junction -Path "D:kap-reel" -Target "D:K & A Performance SiteReelskap-reel"
```

## Commands

Run from `D:kap-reel`.

**Start studio**

```
npx remotion studio
```

**Render a still frame** (the debug loop; do not full-render to check a text
position)

```
npx remotion still src/index.ts ReelVertical out/preview.png --frame=0
```

**Render the full video**

```
npx remotion render src/index.ts ReelVertical out/kap-reel-vertical.mp4
```

**List compositions**

```
npx remotion compositions src/index.ts
```

If you must run from the real path, invoke the CLI directly:
`node node_modules/@remotion/cli/remotion-cli.js <args>`.

## Render time log

| Date | Composition | Output | Rendered | Wall clock |
|---|---|---|---|---|
| 2026-09-03 | ReelVertical | `out/greyrender.mp4` (Phase 2 grey render) | 450 frames, 1080x1920, 30fps, 15.0s | 12.8s |
| 2026-09-03 | ReelVertical | `out/phase3-vertical.mp4` (Phase 3, real copy) | 450 frames, 1080x1920, 30fps, 15.0s, 18.2 MB | 13.3s |
| 2026-09-03 | ReelVertical | `out/phase4-vertical.mp4` (Phase 4, plates composited) | 450 frames, 1080x1920, 30fps, 15.0s, 21.9 MB | 26.6s |
| 2026-09-03 | ReelLandscape | `out/phase4-landscape.mp4` (Phase 4, plates composited) | 450 frames, 1920x1080, 30fps, 15.0s, 11.8 MB | 31.6s |
| 2026-09-03 | ReelLinkedIn | `out/phase6-linkedin-45s.mp4` (Phase 6, 45 second cut) | 1350 frames, 1080x1350, 30fps, 45.0s, 19.2 MB | 41.4s |
| 2026-09-03 | ReelLinkedInLandscape | `out/phase6-landscape-45s.mp4` (Phase 6, 45 second cut) | 1350 frames, 1920x1080, 30fps, 45.0s, 19.6 MB | 52.6s |
| 2026-09-03 | bundle | `out/bundle` (final build, `npx remotion bundle`) | webpack bundle, public dir linked not copied | 2.1s |
| 2026-09-03 | mix 15s | `assets/audio/mix-a-15s.wav` (final build, music only) | 15.0s, 48 kHz stereo | 2.8s |
| 2026-09-03 | ReelVertical | `out/render-vertical-15s.mp4` (final build) | 450 frames, 1080x1920, 30fps, 15.0s | 20.3s |
| 2026-09-03 | ReelFeed | `out/render-feed-15s.mp4` (final build) | 450 frames, 1080x1350, 30fps, 15.0s | 18.3s |
| 2026-09-03 | ReelSquare | `out/render-square-15s.mp4` (final build) | 450 frames, 1080x1080, 30fps, 15.0s | 19.7s |
| 2026-09-03 | ReelLinkedIn | `out/render-linkedin-45s.mp4` (final build) | 1350 frames, 1080x1350, 30fps, 45.0s | 37.1s |
| 2026-09-03 | ReelLinkedInLandscape | `out/render-landscape-45s.mp4` (final build) | 1350 frames, 1920x1080, 30fps, 45.0s | 48.3s |
| 2026-09-03 | deliver | five MP4s, five SRTs, two thumbnails, six stills, acceptance | `npx tsx scripts/deliver.ts --variant a --remix` | 42.1s |
| 2026-09-03 | **Full rebuild** | **everything above from a warm node_modules** | **bundle + mix + five renders + delivery** | **190.7s (3m 11s)** |
| 2026-09-04 | bundle | `out/bundle` (canvas centring rebuild) | webpack bundle, public dir linked not copied | 2.4s |
| 2026-09-04 | ReelVertical | `out/render-vertical-15s.mp4` | 450 frames, 1080x1920, 30fps, 15.0s | 22.2s |
| 2026-09-04 | ReelFeed | `out/render-feed-15s.mp4` | 450 frames, 1080x1350, 30fps, 15.0s | 19.9s |
| 2026-09-04 | ReelSquare | `out/render-square-15s.mp4` | 450 frames, 1080x1080, 30fps, 15.0s | 20.7s |
| 2026-09-04 | ReelLinkedIn | `out/render-linkedin-45s.mp4` | 1350 frames, 1080x1350, 30fps, 45.0s | 38.3s |
| 2026-09-04 | ReelLinkedInLandscape | `out/render-landscape-45s.mp4` | 1350 frames, 1920x1080, 30fps, 45.0s | 54.0s |
| 2026-09-04 | TrainingVertical | `out/render-training-vertical-15s.mp4` | 450 frames, 1080x1920, 30fps, 15.0s | 22.4s |
| 2026-09-04 | TrainingFeed | `out/render-training-feed-15s.mp4` | 450 frames, 1080x1350, 30fps, 15.0s | 24.6s |
| 2026-09-04 | TrainingSquare | `out/render-training-square-15s.mp4` | 450 frames, 1080x1080, 30fps, 15.0s | 21.4s |
| 2026-09-04 | TrainingLinkedIn | `out/render-training-linkedin-45s.mp4` | 1350 frames, 1080x1350, 30fps, 45.0s | 53.6s |
| 2026-09-04 | TrainingLinkedInLandscape | `out/render-training-landscape-45s.mp4` | 1350 frames, 1920x1080, 30fps, 45.0s | 62.5s |
| 2026-09-04 | deliver web | five MP4s, five SRTs, two thumbnails, six stills, acceptance | `npx tsx scripts/deliver.ts --reel web --variant a` | 40.5s |
| 2026-09-04 | deliver training | five MP4s, five SRTs, two thumbnails, six stills, acceptance | `npx tsx scripts/deliver.ts --reel training --variant t-a` | 38.6s |
| 2026-09-04 | **Both reels re-delivered** | **the canvas centring fix, everything above** | **bundle + ten renders + two deliveries** | **421.1s (7m 1s)** |

Section 14 item 9, the full rebuild number: **190.7 seconds**, which is
2.1 + 2.8 + 143.7 + 42.1. It is the sum of the seven "final build" rows above
and it assumes `node_modules` is installed and `assets/captures` and
`assets/plates` are already on disk. It does not include capture, Lighthouse
measurement, or any ElevenLabs generation, none of which a rebuild repeats, and
it does not include the 50.8 seconds the twenty four Gate 7 debug stills take,
which is a review step rather than part of the build.

The 2026-09-04 number, **421.1 seconds**, is the same measurement for both reels
at once after the canvas centring fix: one bundle, ten renders and two
deliveries. It does not include the music mixes, which were already on disk and
did not change, or the 36 seconds the 56 alignment stills take, which is a
review step rather than part of the build.

Two things make this much faster than the Phase 4 numbers suggest. Rendering
from a prebuilt bundle rather than from `src/index.ts` skips the public dir copy
on every invocation, and the bundle links the 600 MB public dir rather than
copying it, which is why the bundle row reads 2.1 seconds.

Note on the Phase 2 and Phase 3 numbers: the bundle was already warm from the
still-frame checks run immediately before. A cold render adds roughly 25 to 30
seconds of bundling plus about 20 seconds of copying the public dir.

The two Phase 4 numbers are cold, start to finish: bundle, public dir copy,
render and encode, from `npx remotion render src/index.ts ...`. The public dir
is now 529 MB with the plates in it, and copying it is most of the difference
between these numbers and the Phase 3 one. Frame throughput itself did not
change much: the plate composite is only on screen for 132 of the 450 frames.

## Formats

Twelve compositions, one scene tree. Section 8 forbids producing the crops with
an FFmpeg center crop of the vertical master, so each one renders `src/Reel.tsx`
with a different `format` prop and every scene re-lays itself out from
`safeArea(format)` and `formatMetrics(format)` in `src/lib/layout.ts`. A second
prop, `cut`, chooses the beat map: `"short"` is the 450 frame vertical master,
`"linkedin"` is the 1350 frame cut described further down.

| Composition | Canvas | Safe area | Frames | `cut` | `debugSafeZones` |
|---|---|---|---|---|---|
| `ReelVertical` | 1080x1920 | 972x1248 | 450 | short | off |
| `ReelFeed` | 1080x1350 | 1026x1134 | 450 | short | off |
| `ReelSquare` | 1080x1080 | 1026x972 | 450 | short | off |
| `ReelLandscape` | 1920x1080 | 1824x940 | 450 | short | off |
| `ReelVerticalDebug` | 1080x1920 | 972x1248 | 450 | short | on |
| `ReelFeedDebug` | 1080x1350 | 1026x1134 | 450 | short | on |
| `ReelSquareDebug` | 1080x1080 | 1026x972 | 450 | short | on |
| `ReelLandscapeDebug` | 1920x1080 | 1824x940 | 450 | short | on |
| `ReelLinkedIn` | 1080x1350 | 1026x1134 | 1350 | linkedin | off |
| `ReelLinkedInLandscape` | 1920x1080 | 1824x940 | 1350 | linkedin | off |
| `ReelLinkedInDebug` | 1080x1350 | 1026x1134 | 1350 | linkedin | on |
| `ReelLinkedInLandscapeDebug` | 1920x1080 | 1824x940 | 1350 | linkedin | on |

The Debug six draw the reserved zones as translucent red with a red border and
a label, plus a green outline on the safe area. Never ship one.

### What changes per format

**Type scale.** Section 7's "48px minimum at 1080 width" is a relative rule, so
every size and padding is authored against a 1080 wide canvas and multiplied by
`typeScale` (canvas width / 1080). The three 1080 wide crops render at 1.0;
landscape renders at 1.778, which puts its body copy at 85px and its hook at
185px.

**Hook capture.** Vertical and feed use the mobile capture full bleed. Square
and landscape use the desktop capture instead: a 780x1688 mobile clip cropped to
cover a 16:9 canvas throws away most of the page. Both cover the canvas, so
nothing is ever letterboxed.

**The project beat**, chosen by `formatMetrics().showcase`:

- `overlay` (vertical). The phone frame runs at native size, nearly the full
  canvas height, and the lower third sits on top of its lower part.
- `stack` (feed, square). The phone frame shrinks to fit the space above a full
  width band, so no text ever lands on the capture. Feed lands near half scale,
  square near two fifths. The surround is brand ink, not black bars.
- `split` (landscape). A 9:16 phone at full height plus a band underneath cannot
  both fit in 1080 pixels, so the phone sits left of center and the lower third
  becomes a panel beside it, bleeding off the right edge with its text stopping
  at `safe.right`.

**Bands.** The hook band is anchored 28 percent down the safe area in every
crop. The lower third and the surfaces tour word are anchored to
`formatMetrics().bandBottom`, which clears the reserved bottom plus 6 percent of
the safe height.

**Horizontal centring.** Everything centred is centred on the CANVAS, not on
the safe area and not inside an asymmetric band. The scrims still run edge to
edge; the copy box inside them takes the symmetric padding
`centeredPadding(format, scale)` returns, which is the larger of the authored 72
and the width of the reserved right strip. Where a box has a width of its own,
`centeredBox(format, boxWidth)` centres it and then, if its right edge would
pass `safe.right`, shifts it left by exactly that overflow and no further than
`safe.left`. Both are in `src/lib/layout.ts` and nothing in `src/scenes` is
allowed to centre by hand. See "Centred on the canvas" below for the
measurements.

**The CTA lockup** is capped against the safe area in both axes, not just by
type scale. At 1.778 the lockup filled the landscape safe area top to bottom and
crushed the url and phone underneath it.

The device frame and the site capture are allowed to run into a reserved zone,
because a platform overlay covering part of a screenshot costs nothing. Text and
the logo are not.

## The 15 second master

Re-paced on 2026-09-03 after the owner watched the first cut: three projects
plus a four cut tour meant eight hard cuts in fifteen seconds and nothing held
long enough to read. The fix keeps the fifteen seconds and spends them on fewer
things. The beat map lives in `src/lib/timing.ts`.

| Frames | Length | Beat |
|---|---|---|
| 0-54 | 1.8s | Hook. Both halves of the line slam on frame 0 and hold to the cut. |
| 54-194 | 4.7s | Fore Motion Golf. Plate 54-78, clean capture 78-194. |
| 194-334 | 4.7s | Project Makeover. Plate 194-218, clean capture 218-334. |
| 334-388 | 1.8s | Surfaces tour. Three cuts of 18 frames. |
| 388-450 | 2.1s | Call to action. |

**What changed, and why.** The hook went from 36 frames to 54. The project
beats went from 96 to 140, all of the extra going to the clean capture, so the
claim holds 104 frames instead of 60. The tour went from four cuts of 15 to
three of 18. Southern Legacy Contractors left the featured list in this cut and
took the third tour slot instead, so its site and its "No page builder" line are
both still on screen. The 45 second cut was not re-paced and is unchanged.

The CTA beat lost four frames, from 66 to 62, so it was checked against Section
6's 36 frame minimum hold: the phone is the last thing to arrive at relative
frame 22, which leaves 40 frames of finished card. `LOGO_SETTLE_FRAMES`,
`URL_IN` and `PHONE_IN` did not have to move.

### Keeping the clean capture moving for 116 frames

Same problem as the LinkedIn cut and a gentler answer. The captures are 180
source frames of an easeInOutCubic scroll, so both ends are nearly stationary.
Rate 1 from source frame 54, which is what the old 72 frame shot used, would run
to source 170 across 116 output frames, where the ease derivative is about one
percent of its peak and the page has stopped.

The shot plays at rate 0.8 from source frame 40, which consumes 92.8 source
frames and ends on source 132.8. Normalised that is t 0.22 to 0.74, straddling
the midpoint of the ease: it opens at about 20 percent of peak speed, runs
through the peak, and still carries about 26 percent at the cut. The plate shot
runs at the same rate from source frame 21, so it arrives at source 40 on the
frame the clean capture takes over and the scroll velocity matches across the
cut.

Verified by measuring PSNR between consecutive frames at the end of each clean
shot in `out/render-vertical-15s.mp4`. Frames 191 to 192 differ at 16.6 dB, 192
to 193 at 16.7, 331 to 332 at 19.2 and 332 to 333 at 19.0. Two static frames of
the CTA card, 440 to 441, measure 78.1 dB for comparison, so the metric is
reading real motion and not encoder noise. Everything is far under the 40 dB
line that would mean a frozen shot.

At rate 0.8 the source index advances on four output frames in five, so the
scroll steps at about 24Hz rather than 30. That is a much smaller penalty than
the 18Hz the LinkedIn cut pays at rate 0.6.

## Centred copy

Owner decision 2026-09-03: the left hung copy read badly, so every line in the
reel is centred horizontally, in every composition and both cuts.

- `src/components/KineticText.tsx` takes an `align` prop. Centring is safe with
  the type-on because the reveal hides characters with `visibility` rather than
  slicing the string, so the line's box is its final width from frame 0. The
  line is centred once, as a finished line, and characters appear from the left
  of that fixed box rather than the box sliding as each one lands. Slam mode
  also swaps its `transformOrigin` to centre, or the punch would push a centred
  line sideways for four frames. A centred line centres on its containing box,
  and that box is forced to the container's full width, so the axis is always
  the container's axis.
- `src/components/ClaimLine.tsx` moved its rule from beside the text to a short
  centred bar above it. A dash hung off the left of a centred line reads as a
  stray mark, and a rule to the left of centred text pulls the optical centre
  off axis. The rule makes the claim taller than a plain body line, so
  `bandHeight()` in `ProjectShowcase` takes the larger of the two.
- `src/scenes/Hook.tsx`, `ProjectShowcase.tsx` (both the full width band and the
  landscape panel), `SurfacesTour.tsx`, `HowWeWork.tsx` and
  `AccessibilityBeat.tsx` all centre their copy. `CallToAction.tsx` already was.
  The `HowWeWork` and `AccessibilityBeat` rules are centred over their blocks
  with auto margins.

That first pass centred every block on the safe area and left the bands their
asymmetric padding, 72 on the left and 108 on the right at 1080 width. Both of
those centre a line left of the canvas, and the errors add: the reserved right
strip puts the safe area's middle 54 pixels left of the canvas middle in the
vertical crop and 27 in the others, and the asymmetric padding takes another 18.
Measured on rendered stills, every text block in the reel sat 15 to 54 pixels
left of centre, and the `HowWeWork` beat sat as much as 152 left because its
lockup hung off the left of the column. The owner saw it, because it was there.

### Centred on the canvas, 2026-09-04

The rule now, everywhere anything is horizontally centred: **centre on the
canvas.** The reserved strip still matters, so after centring, a box whose right
edge would pass `safe.right` shifts left by exactly that overflow, and never
past `safe.left`. Both halves of that live in `src/lib/layout.ts`:

- `centeredPadding(format, scale)` is the symmetric side padding a full width
  band or column takes: the larger of the authored 72 and the reserved strip's
  own width. That makes the copy box the widest box that is both on the canvas
  axis and clear of the strip. In the vertical crop it is exactly 108 to 972,
  whose right edge is `safe.right`, so a line too long for it wraps inside the
  box instead of running into the platform UI. `Hook`, `SurfacesTour` and the
  `ProjectShowcase` lower third use it, and `BAND_PAD_LEFT` and
  `BAND_PAD_RIGHT` are gone.
- `centeredBox(format, boxWidth)` centres a box of a known width on the canvas
  and applies the shift left rule. The CTA card and the `HowWeWork` and
  `AccessibilityBeat` columns are laid out with it.

The clamp did not engage anywhere in either delivered reel. The widest ink
measured is 895 pixels, the training lower third at 1080 width, against a 972
wide copy box in the feed and square crops; the vertical crop's 864 wide box
wraps that project name to the two lines its `nameLines` already reserved.

Two things changed shape. The `HowWeWork` lockup is centred over the column
instead of hanging off its left, which is both what the owner asked for and what
the frame measurement needs. The landscape split panel still centres its copy
inside the panel rather than on the canvas, because there the canvas is shared
with the device, but its padding is now symmetric inside the visible panel: the
right padding absorbs the reserved strip and then matches the left, so the copy
sits in the middle of the panel rather than 6 pixels right of it.

Verified by measurement rather than by eye, on 56 rendered stills covering all
twelve delivery compositions: frames 20, 120, 350 and 440 for the eight short
crops, and 100, 300, 700, 1030, 1150 and 1300 for the four LinkedIn ones. The
ink bounding box of every text block is now within 3 pixels of the canvas centre
in the six 1080 wide compositions and within 5 in landscape. The two frames that
measure over 4, both the surfaces tour word in landscape at +5 and +4.5, are the
type's own side bearings and the trailing letter space of a negative tracking,
not the layout: that word measured +5 against its own box before the change and
+5 after it, and the offset scales with the 1.778 type scale.

Safe zones re-checked on Debug stills for all twelve compositions at frames 120
and 440, or 120 and 1300 for the LinkedIn cuts. No text and no logo enters a red
zone. Captures, device frames and the landscape panel's scrim do, which Section
8 allows. The closest any text now comes to the reserved strip is 17 pixels, the
training hook line in the vertical crop.

The stills and the numbers behind all of that are in `out/_align/`: `before/`
and `after/` hold the 56 frames each with a `measurements.json`, `debug/` holds
the 24 safe zone stills, and the two throwaway scripts that produced them are
beside those. `out/` is ignored, so none of it is tracked.

## The 45 second LinkedIn cut

`cut="linkedin"` on the same scene tree. Section 6 of the handoff asks for the
two cuts to be separate compositions sharing scene components rather than a
fork, so every scene below is the same file the 15 second master renders.
`src/lib/timing.ts` exports both beat maps and `src/Reel.tsx` picks one.

1350 frames at 30fps.

| Frames | Length | Beat |
|---|---|---|
| 0-36 | 1.2s | Hook. Identical to the 15 second cut. |
| 36-156 | 4.0s | How we work. Three lines on the brand canvas. |
| 156-366 | 7.0s | Fore Motion Golf |
| 366-576 | 7.0s | Project Makeover |
| 576-786 | 7.0s | Southern Legacy Contractors |
| 786-996 | 7.0s | MBS Medicine |
| 996-1076 | 2.7s | Surfaces tour. Four cuts of 20 frames. |
| 1076-1226 | 5.0s | Accessibility. Dark teal band. |
| 1226-1350 | 4.1s | Call to action, closing on "Taking new projects." |

**What is different from the master, beat by beat.**

*How we work* (`src/scenes/HowWeWork.tsx`) is the only beat in either cut with
no site capture in it. Three sentences type on 30 frames apart and all three
hold to the cut. The lockup sits small in the top left of the safe area in its
own row, not centred and not floated over the copy: floating it and centring
the block on the whole safe area put the accent rule straight through the
lockup at landscape's 1.778 type scale.

*Project beats* run 210 frames instead of 96. The plate shot stays at the
Section 6b cap of 24 frames, so the whole extra 114 frames goes to the clean
capture. The name still types on over the plate. Below it, one slot carries
first a sentence on what the business needed, fully typed on by relative frame
40 and cut at 120, then the claim from the master, in at 126 and held to the
end of the beat. The slot reserves two body lines from the first frame of the
beat, so the band does not change height when one line swaps for the other.
They are never on screen together, and there is a deliberate six frame gap
between them.

*Surfaces tour* runs four cuts of 20 frames rather than the master's three of
18, and over a different set: MBS Medicine and Southern Legacy Contractors both
have their own project beats here, so neither takes a tour slot, and Ellenton
Family Practice, PB&J Strategic Accounting and Synovial Marketing fill the
places they leave. The fourth cut reuses
`plate-phone-hands`, which project 2 also uses, with a different site and a
different drift seed 24 seconds later on the timeline.

*Accessibility* (`src/scenes/AccessibilityBeat.tsx`) is the only beat on the
dark teal band from `config/brand.json`. Three lines, at frames 0, 45 and 90,
all held to the cut. The count in the middle line is derived at build time from
`config/metrics.json` through `src/lib/metrics.ts`, per Section 14 item 2: it
counts the measured results scoring 100 on Lighthouse accessibility, and the
line is not rendered at all below three. It currently reads five.

*Call to action* is the master's card with one line above the url. A four
element card gets a smaller share of the safe height for the lockup than a
three element one: at the master's cap the landscape block grew past the safe
area and put the top of the lockup inside the reserved top zone.

### Keeping the clean capture moving for 186 frames

The captures are 180 source frames of an easeInOutCubic scroll, so both ends of
the source are nearly stationary and only the middle carries real velocity. A
186 frame shot cannot play a 180 frame source at rate 1, and slowing to 0.8
from source frame 24 lands on source frame 173, where the ease derivative is
under one percent of its peak and the page has visibly stopped.

The shot plays at rate 0.6 from source frame 34, which consumes 111.6 source
frames and puts the last output frame of the beat on source frame 145.
Normalised that is t 0.19 to 0.81, symmetric about the midpoint of the ease, so
the shot starts and ends at the same speed, about 4.5 source pixels per source
frame, and runs through the ease's peak of about 31 in the middle. Verified by
rendering the last three frames of a beat and comparing them: consecutive
frames differ at roughly 22dB PSNR, so nothing is frozen and nothing loops.

The plate shot runs at the same rate from source frame 20, so it arrives at
source frame 34 on the frame the clean capture takes over and the scroll
velocity matches across the cut.

The cost is duplicated frames. At rate 0.6 the source index advances on three
output frames in five, so the scroll steps at about 18Hz rather than 30. That
is unavoidable: the source carries roughly 135 frames of real motion and the
beat asks for 186. Slowing further to fit a wider source window makes the
stepping worse, not better.

### Gate 6 checks

- Stills at 20, 60, 100, 150, 200, 300, 360, 500, 700, 800, 900, 1000, 1030,
  1045, 1060, 1100, 1150, 1200, 1300 and 1349 for `ReelLinkedIn`, and at 100,
  300, 900, 1030, 1150 and 1300 for `ReelLinkedInLandscape`, in
  `out/gate6/stills/`.
- Debug stills at 100, 300, 1150 and 1300 for both debug compositions. No text
  and no logo enters a red zone in either crop.
- Frame sheets, 4x4 every 90 frames from 0: `out/gate6/linkedin-sheet.png` and
  `out/gate6/landscape-sheet.png`. The sixteenth tile is blank because 1350
  frames sampled every 90 gives fifteen frames.

Render stills against a prebuilt bundle rather than the entry point. The public
dir is over 600 MB and `npx remotion still src/index.ts ...` recopies it every
invocation:

```
npx remotion bundle src/index.ts --out-dir=out/bundle
npx remotion still out/bundle ReelLinkedIn out/preview.png --frame=300
```

That takes a still from about 40 seconds to about 2.4.

## Audio

`scripts/audio.ts` generates the music beds and sound effects with the
ElevenLabs API and builds the preview mixes with FFmpeg. It never touches
Remotion. FFmpeg and FFprobe must be on `PATH`, and `ELEVENLABS_API_KEY` must be
in `.env`.

```
npx tsx scripts/audio.ts music --variant a|b|c --length 20|50
npx tsx scripts/audio.ts sfx --name whoosh-transition|ui-click|impact-low
npx tsx scripts/audio.ts all
npx tsx scripts/audio.ts mix [--variant a|b|c]
npx tsx scripts/audio.ts usage
```

`music` regenerates once by itself if the take fails Section 9's first second
energy test, which compares the mean volume of the first 1000 ms against the
mean volume of the whole track and rejects anything more than 6 dB down. `sfx`
regenerates once if a take comes back silent or distorted. `usage` prints the
current ElevenLabs credit spend per product bucket.

Every billable call is logged to `config/audio.json`, including the rejected
ones, with the full prompt, the model, the length and the credits it actually
cost. Credits are measured as a before and after delta on the usage endpoint
because neither audio endpoint reports a cost. Two guards are wired in: a hard
cap of 12 generations per phase, and a stop if any single generation costs more
than 5,000 credits. The cap is real and it fired once during Phase 5.

`mix` builds `assets/audio/preview-{a,b,c}.mp4`, which is
`out/phase4-vertical.mp4` with the finished audio muxed in, plus
`assets/audio/mix-{a,b,c}-15s.wav`, the bare 48 kHz stereo mix ready for
Remotion. It trims the bed to 15.0s with a 400 ms fade at the tail, then
normalises to -14 LUFS integrated using a two pass loudnorm. A limiter sits
between the mix and loudnorm with a ceiling solved per variant: loudnorm caps
its own gain to protect the peak ceiling and will silently miss the loudness
target rather than say so, which it did on two of the three variants before the
limiter was added. The wav is then measured again, so the numbers reported are
measurements and not loudnorm's prediction.

### No sound effects

Owner decision 2026-09-03: both mixes are the music bed alone. The owner
listened to the mix with a whoosh on each cut, a click on each claim and a low
impact on the hook slam, and did not want any of them. `SFX_CUES` in
`scripts/audio.ts` and `SFX_CUES_45S` in `scripts/deliver.ts` are now empty
arrays, with the rejected cue sheets kept in the comment above each one so
restoring them is a one line edit.

This is a deliberate departure from Section 9, which asks for all three effects.
Everything else Section 9 wants is unchanged. The takes themselves were still
generated and are still logged in `config/audio.json` and `LICENSING.md`,
because the credits were spent whether or not they ship, and both files mark
them "generated, not used in the final mixes, owner decision 2026-09-03".

### True peak and the encode

The loudness target is -14 LUFS integrated and -1 dBTP true peak on the file
that ships, which is the MP4, not the wav.

Lossy encoding does not preserve a true peak ceiling. Measured on 2026-09-03: a
wav normalised to -1.01 dBTP came back out of `scripts/encode.sh` at -0.88 dBTP
in the delivered MP4, over the line, and the 45 second mix moved 0.19 dB the
same way. Both scripts therefore normalise to
`DELIVERED_TRUE_PEAK - ENCODE_TRUE_PEAK_HEADROOM_DB`, which is -1.5 dBTP, and
half a decibel covers the largest movement seen with room to spare. The loudness
target is untouched: only the peaks sit lower.

Delivered, measured off the five MP4s with loudnorm in analysis mode:

| File | Integrated | True peak | LRA |
|---|---|---|---|
| `kap-reel-vertical-15s.mp4` | -14.04 LUFS | -1.42 dBTP | 0.70 |
| `kap-reel-feed-15s.mp4` | -14.04 LUFS | -1.42 dBTP | 0.70 |
| `kap-reel-square-15s.mp4` | -14.04 LUFS | -1.42 dBTP | 0.70 |
| `kap-reel-linkedin-45s.mp4` | -14.04 LUFS | -1.75 dBTP | 0.60 |
| `kap-reel-landscape-45s.mp4` | -14.04 LUFS | -1.75 dBTP | 0.60 |

Licensing, the exact commercial rights wording, the credit spend and the one
open eligibility question are all in `LICENSING.md`.

### Second reel: training content variants

The second showcase reel, about instructional design and training content,
needed its own music brief instead of reel one's product launch feel: warm,
steady, confident, unhurried but still moving, a bright morning workshop. It
shares the same hard requirement that the track start at full energy with no
intro build or fade in, since the 15 second cut still cuts in hard on frame 0.

```
npx tsx scripts/audio.ts music --variant t-a|t-b|t-c --length 20 --set training
npx tsx scripts/audio.ts mix --set training [--variant t-a|t-b|t-c]
```

`--set training` is additive: it does not change what `music` or `mix` do
without it. It routes the new `t-a`, `t-b` and `t-c` variant ids to the
training brief instead of reel one's, and it counts generations against their
own six-generation cap in `config/audio.json` (keyed `"set": "training"`)
rather than the original 12-generation cap Phase 5 already reached, so this
run is not blocked by that earlier cap.

`mix --set training` has no picture to mux against yet, since the owner has
not picked a variant, so it writes an audio-only preview instead of
`preview-{variant}.mp4`: `out/gate-t5/preview-{t-a,t-b,t-c}.mp3`, each the 20
second take trimmed to 15.0s with the same 400 ms tail fade, limiter and
two-pass loudnorm to -14 LUFS at a -1.5 dBTP ceiling that `mix` uses for reel
one. It also writes the same bare wav `mix` always writes,
`assets/audio/mix-t-{a,b,c}-15s.wav`, music only, ready to drop into the reel
once a variant is chosen. All three variants passed the first-second energy
test on the first take. Full prompts, the energy test results and the
measured credits are in `config/audio.json` and `LICENSING.md`.

## Delivery

Phase 6 lives in three files. `scripts/deliver.ts` is the one to run.

```
npx tsx scripts/deliver.ts --variant a
npm run deliver -- --variant a
```

`--variant` is the music bed the owner picked, `a`, `b` or `c`. Other flags:
`--remix` rebuilds the 45 second mix from scratch, `--skip-encode` does the
captions, stills and checks only, and `--only vertical` encodes one target.

It expects the renders under these exact names, and skips any that are missing
with a message rather than failing:

| Render | Canvas | Frames | Delivers |
|---|---|---|---|
| `out/render-vertical-15s.mp4` | 1080x1920 | 450 | `out/kap-reel-vertical-15s.mp4` |
| `out/render-feed-15s.mp4` | 1080x1350 | 450 | `out/kap-reel-feed-15s.mp4` |
| `out/render-square-15s.mp4` | 1080x1080 | 450 | `out/kap-reel-square-15s.mp4` |
| `out/render-linkedin-45s.mp4` | 1080x1350 | 1350 | `out/kap-reel-linkedin-45s.mp4` |
| `out/render-landscape-45s.mp4` | 1920x1080 | 1350 | `out/kap-reel-landscape-45s.mp4` |

In one run it builds the 45 second music mix, encodes every render it finds,
writes all five SRTs, extracts the two thumbnails and the six carousel stills,
and prints the Section 14 acceptance checklist.

### Encoding

`scripts/encode.sh` does one file at a time and `deliver.ts` calls it five
times. It is a bash script, so from PowerShell either go through `deliver.ts`,
which locates Git's `bash.exe` on its own, or run it from Git Bash:

```
bash scripts/encode.sh --input out/render-vertical-15s.mp4 \
                       --output out/kap-reel-vertical-15s.mp4 \
                       --audio assets/audio/mix-a-15s.wav
```

`npm run encode -- --input ...` works too, but only where `bash` is on `PATH`.
The Git for Windows installer does not put it there by default.

Settings, per Section 11: H.264 High profile at level 4.2, `yuv420p`, two pass
at 12 Mbps for 1080x1920 and 1920x1080 and 10 Mbps for 1080x1350 and
1080x1080, capped at 1.5x the target with a 2x buffer, 30fps, a two second
keyframe interval, AAC 256 kbps at 48 kHz stereo, and `-movflags +faststart`.
The bitrate is picked from the canvas, so there is nothing to pass.

Two colour conversions happen on the way through, both deliberate:

- **Range.** Remotion writes `yuvj420p` tagged full range. Section 11 wants
  limited. Retagging alone would crush the levels, so the range is converted in
  swscale and the output is tagged `tv` to match.
- **Matrix.** The render is tagged `bt470bg`, and that tag is honest: decoding
  the render back returns the brand canvas colour to within one code value. But
  platforms assume `bt709` for HD and some of them ignore the tag, so the
  matrix is converted rather than carried through. The canvas colour lands
  within three code values of the source after the round trip through limited
  range, which is the cost of a compliant file.

An ffprobe summary prints after every encode: codec, profile, pixel format,
colour range, canvas, fps, frame count, duration, bitrate and audio.

### Captions

`scripts/srt.ts` writes `out/kap-reel-{format}-{duration}.srt` for all five
deliveries from two typed tables at the top of the file. One row per on-screen
line, with the absolute frames it appears and disappears and a comment naming
the scene those frames were read from, so a timing change in a scene is a one
line edit here. The 15 second table covers vertical, feed and square, which
share a beat map. The 45 second table covers linkedin and landscape.

```
npx tsx scripts/srt.ts            write all five
npx tsx scripts/srt.ts --check    validate without writing
npx tsx scripts/srt.ts --print vertical-15s
```

Rows overlap because the picture overlaps: the three "how we work" lines stack
up and hold together, and a project name sits over a context line and then over
a claim. An SRT with overlapping cues is not valid, so the file slices the
timeline at every row boundary and emits one cue per distinct set of lines on
screen. Slices under the 24 frame minimum that are only a subset of a
neighbour, such as the six frames where a context line has been cut and the
claim has not arrived, are folded into that neighbour, preferring the earlier
one so a caption never announces a line before the viewer can see it. The
surfaces tour cuts are exempt: 18 frames in the 15 second cut and 20 frames in
the 45 second one is the picture, not a caption
fault.

Validation refuses to write on an overlap, an em dash, a cue under the minimum
that is not a tour cut, or a row that outlives the picture.

### Thumbnails and stills

`out/thumbnail-vertical.jpg` and `out/thumbnail-landscape.jpg` come from a
plate frame, where a real site is on a real device in real hands. The brand
lockup is composited in, because no frame in the cut carries both: the lockup
only appears on the CTA card, and Section 11 rules a text card out. It goes on
a canvas coloured plate inside the safe area, in the bottom left where the
frame has no full width band and in the top left where it does, because sitting
it above a band puts it straight across the device screen.

Both frames were re-picked on 2026-09-03. Vertical takes frame 75, inside the
Fore Motion Golf plate of the re-paced cut, which runs 54 to 78 with the name
fully typed on at 72. Landscape takes frame 387 of the 45 second cut, inside the
Project Makeover plate, which runs 366 to 390 with the name fully typed on at
384. The previous landscape frame, 380, caught the panel mid word and read as
"Project Make".

`out/frames/` gets six 1080x1350 carousel stills from the vertical render: the
two featured projects on their clean captures with the claim up, two surfaces
tour cuts, one context plate, and the CTA card. Four distinct cleared sites
across the six. The 4:5 crop is centred on the safe area rather than on the
canvas, so the reserved strips are what gets thrown away and every band survives
intact.

### The 45 second mix

The 15 second mixes come from `scripts/audio.ts`. `deliver.ts` builds the 45
second one itself, to `assets/audio/mix-{variant}-45s.wav`, and caches it:
rerunning does not rebuild unless `--remix` is passed.

It takes the 50 second take for the variant from `config/audio.json`, honours
any `usableFromSeconds` trim logged against it, and cuts 45.0 seconds with a
600 ms fade at the tail. Since the owner's 2026-09-03 decision it places no
sound effects, so that is the whole mix.

Then a limiter with a ceiling solved per variant, then a two pass loudnorm to
-14 LUFS integrated and the encode-headroom true peak described under Audio
above. The wav is measured again afterwards, because loudnorm's own pass 2
output is a prediction and Phase 5 proved it can be wrong on these beds.

### Acceptance

The run ends with the Section 14 checklist. Items 1, 2, 5, 6 and 8 are checked
mechanically and print PASS or FAIL with the evidence. Items 3, 4, 7 and 9 are
human judgements or already closed in an earlier phase and print MANUAL with a
note on what to do.

## The training content reel

Added 2026-09-04. The second reel is a second content configuration of this
same scene tree, not a fork. Section 6 of the handoff says the two cuts of one
reel are separate compositions sharing scene components; the same argument
applies to two reels, so the strings and ids came out of `src/Reel.tsx` and the
scenes and moved into `src/reels/`.

### The content config

`src/reels/types.ts` is the contract. A `ReelContent` carries:

| Field | What it is |
|---|---|
| `id` | Short identifier, for Sequence names and debugging. |
| `hook` | Two slammed halves of one line, plus the full bleed shot behind them. The shot is either a project's home page capture (the crop picks mobile or desktop) or one named clip, optionally with a zoom region. |
| `featured` | Project beats, keyed by cut: two in `short`, four in `linkedin`. |
| `tour` | Surfaces tour cuts, keyed by cut: three of 18 frames in `short`, four of 20 in `linkedin`. |
| `cleanCapture` | Trim and playback rate of the clean shot, keyed by cut. |
| `howWeWorkLines` | The three lines of the LinkedIn-only "how we work" beat. |
| `accessibilityLines` | The three lines of the LinkedIn-only accessibility beat. An empty string is a slot deliberately left unrendered. |
| `ctaClosingLine` | The line above the url, keyed by cut. Undefined means no line. |
| `accents` | Accent rotation across project beats and tour cuts. |

A `FeaturedBeat` is `{ projectId, plateId, plateCaptureId?, cleanCaptureId?,
cleanFrame, zoom?, name, nameLines?, contextLine?, claim }`. `cleanFrame` is
`"phone"` or `"browser"`. `zoom` is a rectangle in the capture's own pixels.
`nameLines` only tells the lower third how tall to expect to be, so the device
above it is sized against the right box; it defaults to 1, which is what every
web reel name assumes.

`src/reels/web.ts` is the web design showcase reel, moved across verbatim.
`src/reels/training.ts` is the training content line. `src/Reel.tsx` takes a
`content` prop and defaults to the web reel, so nothing that rendered before
the lift renders differently after it.

### Compositions

`src/Root.tsx` registers both reels from one function. Twelve ids per reel:
four crops of the 15 second cut, two of the 45 second cut, and a safe-zone
debug twin of each.

| 15 second cut | 45 second cut |
|---|---|
| `TrainingVertical` 1080x1920 | `TrainingLinkedIn` 1080x1350 |
| `TrainingFeed` 1080x1350 | `TrainingLinkedInLandscape` 1920x1080 |
| `TrainingSquare` 1080x1080 | |
| `TrainingLandscape` 1920x1080 | |

Plus `TrainingVerticalDebug` and the other five.

### Two rendering additions

`src/components/BrowserFrame.tsx` is the desktop twin of `DeviceFrame`: a thin
sketched window in the manner of the K&A lockup, with a hairline ink border on
canvas and three small dots top left in rust, teal and ink. The training
captures are 2880x1800 module screens and have nowhere sensible to sit inside a
phone body. Every dimension is derived from the screen width, so the window
looks like the same drawing at 970 canvas pixels wide in the vertical crop and
at 1500 in landscape.

A 16:10 window cannot run the full canvas height the way a 9:16 phone can, so
in the vertical crop a browser beat takes the stacked arrangement instead of
the overlay one: the window spans the safe width and the lower third sits under
it rather than across it. In landscape it takes a wider strip left of the copy
panel than a phone does, because width rather than height is the axis it runs
out of.

`src/components/ZoomShot.tsx` is the zoom mode. A 2880x1800 module screen
scaled into a 1080 wide frame renders its body text about four pixels tall,
which proves only that a page exists. Where a beat declares a `zoom`, the shot
picks the scale that makes that region cover its box, lays the whole capture
out at that scale, translates so the region's centre lands on the box's centre,
and pushes in three percent across the shot with the transform origin at the
box centre. No new dependency, and it never reaches for the video's own pixels.

### Training reel stand-ins

Interaction captures and training plates are produced by two other agents. Any
capture id not in `assets/captures/captures.json` and any plate id not in
`config/plates.json` renders a labelled grey stand-in (`src/components/StandIn.tsx`)
instead of the shot. Filling in the real asset is the only change needed.

Every capture and plate the training reel names had landed by the last render,
so nothing in it currently renders a stand-in. Every zoom region in
`src/reels/training.ts` was measured off the clip itself. If a clip is
re-recorded at a different scroll position, its region is the only thing that
has to change.

One trap, recorded because it cost a render to find. Tailwind's preflight sets
`video { max-width: 100% }`, which silently clamps a zoomed video's width to its
box and leaves the height alone. The video then shows the wrong part of the
capture at the wrong scale, and it does not look like a bug, it looks like a
badly chosen crop. `ZoomShot` sets `maxWidth: none` for exactly this reason.

### Render time log, training reel

| Date | Composition | Output | Rendered | Wall clock |
|---|---|---|---|---|
| 2026-09-04 | bundle | `out/bundle` (cold, after the content lift) | rspack bundle, public dir linked not copied | 17.7s |
| 2026-09-04 | bundle | `out/bundle` (warm rebuild) | same | 2.3s |
| 2026-09-04 | ReelVertical | `out/psnr-before` and `out/psnr-after`, frames 60, 250, 350, 440 | 4 stills each, 1080x1920 | 8.9s per set |
| 2026-09-04 | TrainingVertical | `out/gate-t2/tv-*.png` | 9 stills, 1080x1920 | 19.3s |
| 2026-09-04 | TrainingLinkedIn | `out/gate-t2/tl-*.png` | 8 stills, 1080x1350 | 15.9s |
| 2026-09-04 | Training*Debug | `out/gate-t2/dbg-*.png` | 6 stills, three crops at two frames | 11.0s |
| 2026-09-04 | TrainingVertical | `out/training-grey-vertical.mp4` | 450 frames, 1080x1920, 30fps, 15.0s, 6.9 MB | 26.1s |
| 2026-09-04 | sheet | `out/gate-t2/training-vertical-sheet.png` | 4x3 tile of 12 frames, ffmpeg | under 1s |
| 2026-09-04 | bundle | `out/bundle` (final build) | rspack bundle, public dir linked not copied | 2.4s |
| 2026-09-04 | mix 15s | `assets/audio/mix-t-a-15s.wav` (final build, music only) | 15.0s, 48 kHz stereo | 2.6s |
| 2026-09-04 | TrainingVertical | `out/render-training-vertical-15s.mp4` (final build) | 450 frames, 1080x1920, 30fps, 15.0s | 22.9s |
| 2026-09-04 | TrainingFeed | `out/render-training-feed-15s.mp4` (final build) | 450 frames, 1080x1350, 30fps, 15.0s | 21.1s |
| 2026-09-04 | TrainingSquare | `out/render-training-square-15s.mp4` (final build) | 450 frames, 1080x1080, 30fps, 15.0s | 20.0s |
| 2026-09-04 | TrainingLinkedIn | `out/render-training-linkedin-45s.mp4` (final build) | 1350 frames, 1080x1350, 30fps, 45.0s | 54.8s |
| 2026-09-04 | TrainingLinkedInLandscape | `out/render-training-landscape-45s.mp4` (final build) | 1350 frames, 1920x1080, 30fps, 45.0s | 66.1s |
| 2026-09-04 | deliver | five MP4s, five SRTs, two thumbnails, six stills, the 45s mix, acceptance | `npx tsx scripts/deliver.ts --reel training --variant t-a` | 42.0s |
| 2026-09-04 | **Training full rebuild** | **everything in the final build rows above** | **bundle + 15s mix + five renders + delivery** | **231.9s (3m 52s)** |

Section 14 item 9 for the training reel: **231.9 seconds**, which is
2.4 + 2.6 + 184.9 + 42.0. It is the sum of the nine "final build" rows above and
it assumes `node_modules` is installed and `assets/captures` and `assets/plates`
are already on disk. It does not include capture, plate generation or any
ElevenLabs call, none of which a rebuild repeats, and it does not include the
72.9 seconds the twenty eight safe zone debug stills take, which is a review
step rather than part of the build.

It is 41 seconds longer than the web reel's 190.7, and all of the difference is
in the two 45 second renders. Every training project beat is a zoomed shot, so
each frame lays a 2880x1800 video out at scale inside a clipping box rather than
scaling one to fit, and the 45 second cut spends 744 of its 1350 frames doing
that. The 15 second renders are within two seconds of the web reel's.

The rebuild is reproducible: rerunning the 15 second mix produces a byte
identical wav, which was checked rather than assumed, because the corrective
loudness pass described under Audio would be worth nothing if it were not.

The 26.1 second grey render row above sits between the web reel's Phase 4 and
final numbers. Every capture and plate landed while this was being built, so the
whole cut is a real composite: two plate shots, three tour plate composites, and
two zoomed browser shots. There is no audio on it and no delivery step, which is
the rest of the web reel's 20.3.

### The final training timeline

Rebuilt 2026-09-04 after the grey render review. Five things changed, all of
them in `src/reels/training.ts` except the one noted.

**The hook is the mobile hazard hunt, full bleed.** It was the desktop clip
pushed in on the illustration, and that did not read: a desktop module screen is
a content column inside wide dark margins, so a 9:16 crop of a region of it kept
half a sentence cut off at both edges and an empty grey rectangle where the
picture was. The mobile capture is the same lesson laid out for a 390 wide
screen, so the heading, the instructions, the found counter and the whole
illustration all sit inside the crop. Vertical and feed keep almost the entire
page, square keeps the counter and the picture, and landscape keeps a band of it
either side of the hook band, which is all a 16:9 hook was ever going to show of
a phone. It plays from source frame 0 at rate 1 and stops short of source 57,
where a second hazard is found, the first list item wraps, and the item under it
is clipped by the page's own bottom rule on the live build.

Because the mobile clip reads, the `hook.bandPosition` field the fallback plan
called for was not added. The band is where it always was, 28 percent down the
safe area, in both reels. If the hook shot is ever changed to something that
needs the band lower, that field is the way to do it and not a hardcoded
position in `Hook.tsx`.

**Beat 1 is the walk-through in a browser window**, pushed in on the tab row and
the four zone cards, and it starts on source frame 33 rather than 0. The clip is
named for what it does: it opens on the hero screen and scrolls to the zones
over source 20 to 32. Starting at 0 put the hero screen behind a zoom region
measured on the zones, and frame 100 of the cut showed learning objectives
through a window cropped for a tab row. The scroll is not lost, because the
plate shot runs at the same rate and `ProjectShowcase` backs its capture up by
`round(24 * rate)` frames, so the plate plays source 19 to 33 and hands over on
the exact frame the scroll finishes. Section 6b's "cut on the scroll", for free.

**Beat 2 is the same course on a phone**, so the two safety beats are two
surfaces rather than the same browser window twice. It is the stop-or-go
decision: the call counter, the prompt, the STOP and GO buttons and the feedback
paragraph under them.

That beat needed one change outside the content config. At the phone's native
780x1688 the vertical crop's lower third cuts the shot at capture row 1039,
which is the top edge of the STOP button, so the buttons and the whole feedback
line sit behind the scrim. That is arithmetic rather than tuning: the device is
centred on the canvas, the band is anchored near the bottom of it, so an
overlaid band always covers the lower third or so of the device, and this clip
keeps the thing worth seeing exactly there. A 9:16 site capture can afford it
because what is behind the band is page it has already scrolled past.

So the beat declares a zoom region, 780 by 1040 with the decision centred in it,
and `ProjectShowcase` now picks the stacked arrangement for any shot wider than
the canvas rather than only for a browser window. The rule already existed and
already said the right thing about browser windows; it was written as
`cleanFrame === "browser"` and is now written as the aspect test it always
meant. Nothing in the web reel changes: its clean shots are 780x1688 mobile
captures at 0.462, narrower than the vertical canvas at 0.5625, so they still
overlay. The other half of the trade is that at 780 by 1040 the shot renders one
to one in the vertical crop, so the module's own body type is the size it is on
a real phone rather than two thirds of it.

**Playback is per beat, not per cut.** `FeaturedBeat.cleanPlayback` is new and
every training project beat sets it. See the next section.

**The RFI beat in the 45 second cut is pushed in** on the two option cards and
the feedback panel. At full frame it is a wall of blueprint paper with two
paragraphs on it, and the claim underneath says the module scores the decision.

### Keeping five different interaction clips moving

The web reel's clean shots are all the same thing: a 180 frame easeInOutCubic
scroll of a home page. One trim and one rate per cut is correct for all of them,
because the motion curve is identical and only the page behind it changes.

The training reel's are five different interaction recordings of four different
lengths, and each one is a person doing something, pausing, and doing the next
thing. Where the motion sits is a property of the clip. Every clip was measured
frame by frame, by running ffmpeg's `psnr` filter over the clip against itself
delayed one frame, which gives the difference between every pair of consecutive
source frames. The last frame that moves is source 100 for hero-to-zones, 132
for hazard-hunt, 160 for the P&L simulator, 90 for the RFI branch, and past 145
for stop-or-go. A single rate per cut cannot land five different numbers, and a
shot that overruns its clip's last movement does not merely look slow: it stops,
and the cut lands on a photograph.

So `FeaturedBeat.cleanPlayback` overrides the cut's default per beat. Every rate
below was solved to put the shot's last output frame on the clip's last moving
source frame. All five trims are 0, because an interaction recording has no
eased ramp to start inside and starting late would cut into an interaction only
a few seconds long, except beat 1 of the 15 second cut for the reason above.

| Cut | Beat | Clip | Trim | Rate | Last source frame |
|---|---|---|---|---|---|
| 15s | 1 | hero-to-zones | 33 | 0.587 | 100, the second tab click |
| 15s | 2 | stop-or-go mobile | 0 | 1 | 115, the next prompt arriving |
| 45s | 1 | hero-to-zones | 0 | 0.543 | 100, the second tab click |
| 45s | 2 | hazard-hunt desktop | 0 | 0.716 | 132, the sixth hazard found |
| 45s | 3 | P&L simulator | 0 | 0.867 | 160, inside the fourth slider drag |
| 45s | 4 | RFI branch | 0 | 0.489 | 90, option B marked correct |

Verified by measuring PSNR between the last two frames of each clean shot in the
delivered renders, the same test the web reel used:

| Shot | Frames | PSNR |
|---|---|---|
| 15s beat 1 | 192 to 193 | 22.7 dB |
| 15s beat 2 | 332 to 333 | 33.2 dB |
| 45s beat 1 | 364 to 365 | 20.7 dB |
| 45s beat 2 | 574 to 575 | 18.9 dB |
| 45s beat 3 | 784 to 785 | 35.9 dB |
| 45s beat 4 | 994 to 995 | 25.3 dB |
| 15s CTA card, static control | 440 to 441 | 80.1 dB |
| 45s CTA card, static control | 1340 to 1341 | 88.5 dB |

All six shots are far under the 40 dB line that would mean a frozen shot, and
the two static controls at 80 and 88 dB show the metric is reading real motion
rather than encoder noise.

One number worth recording because it looks like a failure and is not. Frames
191 to 192 of the 15 second cut measure 47.3 dB, over the line, and they are
consecutive frames inside beat 1. At rate 0.587 the source index advances on
roughly three output frames in five, so some consecutive output pairs carry the
same source frame and differ only by the shot's three percent push in. That is
the documented cost of any rate under 1, the same cost the web reel's LinkedIn
cut pays at 0.6. The test that matters is the last pair before the cut, because
a shot that is still moving when it is cut cannot read as frozen, and every one
of those is under 36 dB.

### Delivering the training reel

`scripts/deliver.ts` takes a `--reel` flag. It defaults to `web`, so every
command that worked before the flag existed still does exactly what it did.

```
npx tsx scripts/deliver.ts --reel training --variant t-a
```

Same pipeline over a different set of names. Renders come from
`out/render-training-{format}-{duration}.mp4`, deliveries go to
`out/kap-reel-training-{format}-{duration}.mp4` with matching SRTs, thumbnails
are `out/thumbnail-training-{vertical,landscape}.jpg`, and the six carousel
stills land in `out/frames-training/`. Both reels' outputs sit in one `out/`
directory and neither can overwrite the other.

The music variants are `t-a`, `t-b` and `t-c` for this reel and `a`, `b` and `c`
for the web one, and passing the wrong reel's variant is refused rather than
silently muxing the wrong bed.

`scripts/srt.ts` gained the same flag and a second pair of tables,
`CUE_ROWS_TRAINING_15S` and `CUE_ROWS_TRAINING_45S`, written the same way as the
web ones: one row per on-screen line, with the absolute frames it appears and
disappears and a comment naming the scene those frames were read from. Both
reels share the beat map from `src/lib/timing.ts`, so the frame arithmetic is
identical and only the lines differ.

```
npx tsx scripts/srt.ts --reel training           write all five
npx tsx scripts/srt.ts --reel training --check   validate without writing
```

**The web reel's captions were checked rather than assumed.** All five web SRTs
were hashed before the change and after it and are byte identical, as are its
two thumbnails and its six carousel stills, which a `--skip-encode` run
regenerates from the same renders.

One acceptance check had to be fixed on the way through. Item 1, the manifest,
read project ids out of `src/Reel.tsx` and capture ids out of
`src/scenes/SurfacesTour.tsx`. The 2026-09-04 content lift moved every id into
`src/reels/{web,training}.ts`, so it had been greping two files that no longer
contain any ids and passing by finding nothing, which is worse than failing. It
now reads the content config for the reel being delivered, resolves each capture
id back to its project, and fails when a config yields no ids at all.

### Audio for the training reel

The owner chose variant t-a. The 15 second bed is the 20 second take trimmed to
15.0s; the 45 second bed is a 50 second take of the same prompt, generated on
2026-09-04 and logged in `config/audio.json` and `LICENSING.md` with its
measured cost of 1,368 credits. It passed Section 9's first second energy test
on the first generation, so exactly one billable call was made.

Both mixes are music alone, per the owner's 2026-09-03 decision carried across
from reel one. No sound effects were generated for this reel.

**A third loudness pass was added.** loudnorm's pass 2 output is a prediction,
which this project already knew and already worked around by measuring the
finished file. On the t-a bed it predicted -13.98 LUFS and the file measured
-13.71, a 0.27 dB error on the one bed of the six with real dynamic range in it,
LRA 2.9 against 0.6 to 0.8 for the rest. `correctLoudness` in `scripts/audio.ts`
and its twin in `scripts/deliver.ts` measure the file and shift the whole thing
by the difference. A flat gain is the right instrument for a residual: it is
linear, so integrated loudness and true peak move by exactly the amount applied
and there is nothing left for a limiter to do. It has a 0.15 dB deadband so a
file already on target is never re-encoded, which is what keeps reel one's mixes
untouched, and it refuses rather than breach the true peak ceiling. Applied here
at -0.29 dB, which moved the true peak from -1.84 to -2.13 dBTP, further inside
the ceiling rather than nearer it.

Delivered, measured off the five MP4s with loudnorm in analysis mode:

| File | Integrated | True peak | LRA |
|---|---|---|---|
| `kap-reel-training-vertical-15s.mp4` | -14.01 LUFS | -2.14 dBTP | 2.90 |
| `kap-reel-training-feed-15s.mp4` | -14.01 LUFS | -2.14 dBTP | 2.90 |
| `kap-reel-training-square-15s.mp4` | -14.01 LUFS | -2.14 dBTP | 2.90 |
| `kap-reel-training-linkedin-45s.mp4` | -14.06 LUFS | -2.17 dBTP | 1.70 |
| `kap-reel-training-landscape-45s.mp4` | -14.06 LUFS | -2.17 dBTP | 1.70 |

### Training reel gates

- Safe zones: `out/gate-t7/`. Debug stills at 20, 120, 350 and 440 for
  `TrainingVerticalDebug`, `TrainingFeedDebug`, `TrainingSquareDebug` and
  `TrainingLandscapeDebug`, and at 100, 300, 700, 1030, 1150 and 1300 for
  `TrainingLinkedInDebug` and `TrainingLinkedInLandscapeDebug`. Twenty eight
  stills, plus six contact sheets built from them. No text and no logo enters a
  red zone in any of them. Captures and device frames do, which Section 8
  allows.
- Shot checks: `out/gate-t6/`, including the source frames every zoom region was
  measured off.
- Frame sheets of the delivered files: `out/final-training/vertical-sheet.png`,
  4x3 every 40 frames, and `linkedin-sheet.png` and `landscape-sheet.png`, 4x4
  every 84 frames. 1350 frames sampled every 84 gives 17 frames and a 4x4 holds
  16, so the sheets run 0 to 1260 and the last sample at 1344 is dropped. Frame
  1260 is inside the CTA beat, so nothing in the cut goes unrepresented.
