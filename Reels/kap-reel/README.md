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

**Re-measure every capture's content box** (after any re-capture; see "Content
boxes, and filling the device from the page")

```
npx tsx scripts/capture.ts --content-boxes
```

**Check that no plate composite shows backdrop inside the device**

```
npx tsx scripts/composite-check.ts ring --out out/_fill/after
```

If you must run from the real path, invoke the CLI directly:
`node node_modules/@remotion/cli/remotion-cli.js <args>`. The same applies to
`npx tsx`: the real path carries an ampersand that `npx.cmd` splits, so
`node node_modules/tsx/dist/cli.mjs scripts/<name>.ts <args>` is the fallback.

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
| 2026-09-04 | bundle | `out/bundle` (drawn end card rebuild) | rspack bundle, public dir linked not copied | 2.3s |
| 2026-09-04 | ReelVertical | `out/render-vertical-15s.mp4` | 450 frames, 1080x1920, 30fps, 15.0s | 20.6s |
| 2026-09-04 | ReelFeed | `out/render-feed-15s.mp4` | 450 frames, 1080x1350, 30fps, 15.0s | 19.3s |
| 2026-09-04 | ReelSquare | `out/render-square-15s.mp4` | 450 frames, 1080x1080, 30fps, 15.0s | 20.7s |
| 2026-09-04 | ReelLinkedIn | `out/render-linkedin-45s.mp4` | 1350 frames, 1080x1350, 30fps, 45.0s | 38.6s |
| 2026-09-04 | ReelLinkedInLandscape | `out/render-landscape-45s.mp4` | 1350 frames, 1920x1080, 30fps, 45.0s | 50.1s |
| 2026-09-04 | TrainingVertical | `out/render-training-vertical-15s.mp4` | 450 frames, 1080x1920, 30fps, 15.0s | 22.0s |
| 2026-09-04 | TrainingFeed | `out/render-training-feed-15s.mp4` | 450 frames, 1080x1350, 30fps, 15.0s | 20.7s |
| 2026-09-04 | TrainingSquare | `out/render-training-square-15s.mp4` | 450 frames, 1080x1080, 30fps, 15.0s | 19.6s |
| 2026-09-04 | TrainingLinkedIn | `out/render-training-linkedin-45s.mp4` | 1350 frames, 1080x1350, 30fps, 45.0s | 53.5s |
| 2026-09-04 | TrainingLinkedInLandscape | `out/render-training-landscape-45s.mp4` | 1350 frames, 1920x1080, 30fps, 45.0s | 62.4s |
| 2026-09-04 | deliver web | five MP4s, five SRTs, two thumbnails, six stills, acceptance | `npx tsx scripts/deliver.ts --reel web --variant a` | 40.7s |
| 2026-09-04 | deliver training | five MP4s, five SRTs, two thumbnails, six stills, acceptance | `npx tsx scripts/deliver.ts --reel training --variant t-a` | 39.1s |
| 2026-09-04 | **Both reels re-delivered, drawn end card** | **the 2026-09-04 end card and the 15 second re-time** | **bundle + ten renders + two deliveries** | **409.6s (6m 50s)** |
| 2026-09-04 | bundle | `out/bundle` (laptop frame rebuild) | rspack bundle, public dir linked not copied | 2.4s |
| 2026-09-04 | ReelVertical | `out/render-vertical-15s.mp4` | 450 frames, 1080x1920, 30fps, 15.0s | 20.9s |
| 2026-09-04 | ReelFeed | `out/render-feed-15s.mp4` | 450 frames, 1080x1350, 30fps, 15.0s | 19.0s |
| 2026-09-04 | ReelSquare | `out/render-square-15s.mp4` | 450 frames, 1080x1080, 30fps, 15.0s | 20.5s |
| 2026-09-04 | ReelLinkedIn | `out/render-linkedin-45s.mp4` | 1350 frames, 1080x1350, 30fps, 45.0s | 40.3s |
| 2026-09-04 | ReelLinkedInLandscape | `out/render-landscape-45s.mp4` | 1350 frames, 1920x1080, 30fps, 45.0s | 52.1s |
| 2026-09-04 | TrainingVertical | `out/render-training-vertical-15s.mp4` | 450 frames, 1080x1920, 30fps, 15.0s | 21.3s |
| 2026-09-04 | TrainingFeed | `out/render-training-feed-15s.mp4` | 450 frames, 1080x1350, 30fps, 15.0s | 18.9s |
| 2026-09-04 | TrainingSquare | `out/render-training-square-15s.mp4` | 450 frames, 1080x1080, 30fps, 15.0s | 18.1s |
| 2026-09-04 | TrainingLinkedIn | `out/render-training-linkedin-45s.mp4` | 1350 frames, 1080x1350, 30fps, 45.0s | 53.0s |
| 2026-09-04 | TrainingLinkedInLandscape | `out/render-training-landscape-45s.mp4` | 1350 frames, 1920x1080, 30fps, 45.0s | 61.7s |
| 2026-09-04 | deliver web and training | ten MP4s, ten SRTs, four thumbnails, twelve stills, both acceptance runs | `--reel web --variant a` then `--reel training --variant t-a` | 77.1s |
| 2026-09-04 | **Both reels re-delivered, laptop frame** | **the laptop frame and the centred device box** | **bundle + ten renders + two deliveries** | **405.3s (6m 45s)** |
| 2026-09-04 | bundle | `out/bundle` (tutorial reels, Phase A) | rspack bundle, public dir linked not copied | 2.3s |
| 2026-09-04 | voice | 22 mp3s in `assets/audio/voice/`, 23 generations | ElevenLabs `eleven_multilingual_v2`, 1524 characters, 1524 credits measured | 87.2s |
| 2026-09-04 | mix tutorial | four `assets/audio/mix-tut-*.wav` | voice with `music-a` ducked under it, solved duck plus two pass loudnorm | 18.9s |
| 2026-09-04 | TutorialContrastVertical | `out/tut-grey-contrast-vertical.mp4` (Phase A grey render) | 450 frames, 1080x1920, 30fps, 15.0s, 1.0 MB | 10.4s |
| 2026-09-04 | TutorialContrastLinkedIn | `out/tut-grey-contrast-linkedin.mp4` (Phase A grey render) | 1350 frames, 1080x1350, 30fps, 45.0s, 2.5 MB | 19.1s |
| 2026-09-04 | TutorialHeroVertical | `out/tut-grey-hero-vertical.mp4` (Phase A grey render) | 450 frames, 1080x1920, 30fps, 15.0s, 1.0 MB | 8.4s |
| 2026-09-04 | TutorialHeroLinkedIn | `out/tut-grey-hero-linkedin.mp4` (Phase A grey render) | 1350 frames, 1080x1350, 30fps, 45.0s, 2.6 MB | 18.1s |
| 2026-09-04 | encode.sh x4 | `out/tut-grey-*-mixed.mp4` | the four grey renders with their mixes muxed in, 2.8 to 7.6 MB | 25.6s |
| 2026-09-04 | **Tutorial Phase A** | **foundation gate: voice, mixes, four grey renders, four muxes** | **bundle + voice + mixes + four renders + four muxes** | **190.0s (3m 10s)** |

The tutorial number, **190.0 seconds**, is the Phase A foundation gate end to
end: one bundle at 2.3s, the 23 voice generations at 87.2s, the four mixes at 18.9s,
four grey renders totalling 56.0s and four muxes totalling 25.6s. The voice
figure is measured off the `createdAt` stamps in `config/voice.json` rather than
with a stopwatch, because the run happened in three invocations; it averages 3.8
seconds a beat, most of which is the poll on the usage endpoint that measures the
credits rather than the generation itself. It is not a number a rebuild repeats:
`voice.ts` skips any beat whose text, voice, model and settings hash already
matches a file on disk, so a rebuild that changes no script pays 0 credits and no
seconds. The renders are fast because the pictures are stand-ins.

Section 14 item 9, the full rebuild number: **190.7 seconds**, which is
2.1 + 2.8 + 143.7 + 42.1. It is the sum of the seven "final build" rows above
and it assumes `node_modules` is installed and `assets/captures` and
`assets/plates` are already on disk. It does not include capture, Lighthouse
measurement, or any ElevenLabs generation, none of which a rebuild repeats, and
it does not include the 50.8 seconds the twenty four Gate 7 debug stills take,
which is a review step rather than part of the build.

The first 2026-09-04 number, **421.1 seconds**, is the same measurement for both
reels at once after the canvas centring fix: one bundle, ten renders and two
deliveries. It does not include the music mixes, which were already on disk and
did not change, or the 36 seconds the 56 alignment stills take, which is a
review step rather than part of the build.

The second, **409.6 seconds**, is the same measurement again after the drawn end
card and the 15 second re-time: one bundle at 2.3s, ten renders totalling 327.5s
and two deliveries at 40.7s and 39.1s. Again no music mixes, which did not
change, and it does not include the ten CTA safe zone debug stills or the six
frame sheets, both review steps. It is eleven seconds faster than the run before
it, which is run to run noise rather than the end card being cheaper to draw
than to composite: the draw is vector work on a flat canvas and costs less per
frame than the webp did, but only 78 frames of 450 are the end card.

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

A beat whose shot is wider than the canvas takes `stack` even where the format
asks for `overlay`, because an overlaid band would land across the middle of the
thing the shot exists to show. Every laptop beat is wider than the canvas, and
so is the training reel's stop-or-go phone beat, which is pushed in on a region
780 by 1040.

**The device box.** In `overlay` and `stack` the device is centred on the
CANVAS with `centeredBox(format, frameWidth)`, the same function and the same
shift-left clamp the copy uses. Its box is the canvas minus the reserved right
strip on both sides, which is the same box `centeredPadding()` gives the lower
third's copy, so the device and the text under it share one centre line and one
width. In `split` the device is placed inside the strip left of the copy panel
instead: there the canvas is shared, and centring on it would put the device
behind the panel.

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
crushed the url and phone underneath it. Since 2026-09-04 the lockup draws
itself rather than being an image, but the box it draws inside is sized by the
same three caps. See "The drawn end card".

The device frame and the site capture are allowed to run into a reserved zone,
because a platform overlay covering part of a screenshot costs nothing. Text and
the logo are not.

## The 15 second master

Re-paced on 2026-09-03 after the owner watched the first cut: three projects
plus a four cut tour meant eight hard cuts in fifteen seconds and nothing held
long enough to read. The fix keeps the fifteen seconds and spends them on fewer
things. The beat map lives in `src/lib/timing.ts`.

Re-timed again on 2026-09-04 for the drawn end card. See "The drawn end card"
below for what that is and why it needs 78 frames.

| Frames | Length | Beat |
|---|---|---|
| 0-54 | 1.8s | Hook. Both halves of the line slam on frame 0 and hold to the cut. |
| 54-186 | 4.4s | Fore Motion Golf. Plate 54-78, clean capture 78-186. |
| 186-318 | 4.4s | Project Makeover. Plate 186-210, clean capture 210-318. |
| 318-372 | 1.8s | Surfaces tour. Three cuts of 18 frames. |
| 372-450 | 2.6s | Call to action. The lockup draws itself. |

**What changed on 2026-09-03, and why.** The hook went from 36 frames to 54.
The project beats went from 96 to 140, all of the extra going to the clean
capture. The tour went from four cuts of 15 to three of 18. Southern Legacy
Contractors left the featured list in this cut and took the third tour slot
instead, so its site and its "No page builder" line are both still on screen.

**What changed on 2026-09-04, and why.** The end card went from 62 frames to
78, and the sixteen frames came out of the two project beats, eight from each,
so they are 132 frames rather than 140 and the claim holds 96 frames rather than
104. The hook was left alone, because the hook is the beat the 2026-09-03
re-pace existed to fix, and the tour was left alone at three cuts of 18, because
18 is already under the Section 7 minimum and taking anything off it would make
that worse. The tour simply starts sixteen frames earlier. The 45 second cut has
never been re-paced and its beat map is still the original one.

### Keeping the clean capture moving for 108 frames

Same problem as the LinkedIn cut and a gentler answer. The captures are 180
source frames of an easeInOutCubic scroll, so both ends are nearly stationary.
Rate 1 from source frame 54, which is what the old 72 frame shot used, would run
deep into the ease-out tail across a shot this long, where the ease derivative
is a few percent of its peak and the page has stopped.

The shot plays at rate 0.8 from source frame 40, which across 108 output frames
consumes 85.6 source frames and ends on source 125. Normalised that is t 0.22 to
0.70, straddling the midpoint of the ease: it opens at about 20 percent of peak
speed, runs through the peak, and still carries about 36 percent at the cut. The
plate shot runs at the same rate from source frame 21, so it arrives at source
40 on the frame the clean capture takes over and the scroll velocity matches
across the cut.

The 2026-09-04 re-time did not move either number. Eight fewer output frames at
the same trim and the same rate simply stop the shot seven source frames
earlier, which is further from the tail and therefore faster at the cut, not
slower.

Verified twice. On the captures themselves, the last two source frames of the
shot differ at 13.3 dB for Fore Motion Golf and 15.9 dB for Project Makeover. On
the delivered picture, PSNR between consecutive frames at the end of each clean
shot in `out/render-vertical-15s.mp4` reads 15.6 dB at frames 184 to 185 and
18.7 dB at 316 to 317, which are the last pair of each beat. Two static frames
of the finished CTA card, 440 to 441, measure 91.3 dB for comparison, so the
metric is reading real motion and not encoder noise. Both shots are far under
the 40 dB line that would mean a frozen shot.

At rate 0.8 the source index advances on four output frames in five, so the
scroll steps at about 24Hz rather than 30. That is a much smaller penalty than
the 18Hz the LinkedIn cut pays at rate 0.6. It also means some consecutive
output pairs carry the same source frame: 183 to 184 measures 56.5 dB and 315 to
316 measures 63.0 dB for that reason, which is the documented cost of any rate
under 1 and not a frozen shot. The pair that decides whether the cut lands on a
photograph is the last one, and those are the two above.

## The drawn end card

Owner decision 2026-09-04: the K&A lockup on the end card of both reels and both
cuts draws itself instead of fading in as a finished picture.

`src/components/LogoDraw.tsx` is the live site's intro animation ported frame
for frame off the same `render(T)` function, driven by Remotion's frame rather
than by a GSAP clock. A mouse drags the browser frame into being, the three
window dots pop as the pointer passes them, K and A land, the ampersand scales
in, and only then does PERFORMANCE type on underneath. The authored piece is
seven seconds and compresses uniformly: `durationFrames` is how many frames that
seven seconds is squeezed into. The gate at `out/gate-logo` established where
that stops working. At 36 frames it strobes, 72 is the floor at which it still
reads as a sweep, and 144 is comfortable.

| | 15 second cut | 45 second cut |
|---|---|---|
| Beat | 372-450, 78 frames | 1226-1350, 124 frames |
| Draw | 66 frames | 84 frames |
| Wordmark starts, T 5.2 | relative 49 | relative 62 |
| Copy arrives | relative 50, absolute 422 | relative 64, absolute 1290 |
| Last movement, the final glyph | relative 60 | relative 77 |
| Frozen finished card | relative 61 to 78, 17 frames | relative 78 to 124, 46 frames |

The 15 second cut breaks `CTA_HOLD_MIN_FRAMES`, and the owner took that trade
with the number in front of them. Section 6 asks for 36 frames of finished card
so a screenshot of the end frame reads. This card gives 22 frames from the
moment every element is on screen, 17 of them completely static. The argument
for allowing it is that the minimum was written for a card that cuts in: a
viewer who has watched a mark assemble for two seconds has already read it by
the time it finishes, where a viewer shown a finished card needs the whole hold.
The 45 second cut clears the minimum without a note.

Everything else about the card is unchanged. It is centred on the canvas by
`centeredBox()`, the logo box is the 720 at 1080 width the static lockup used
and is still capped against the safe area in both axes, and the closing line,
the url and the phone are still the same three lines in the same order.

Two things did change underneath. The logo box's aspect is now LogoDraw's
authored stage, 1340 by 548 or 0.409, where `logo-lockup.webp` was 800 by 303 or
0.379, so in landscape, where the height cap is the one that binds, the box
lands at the same height and takes the difference out of its width: 735 pixels
rather than 793. And the phone no longer trails the url by eight frames, because
the draw is the card's stagger now and a third arrival after it would have eaten
most of a 22 frame hold.

The drawn artwork inside that 1340 by 548 stage measures 1243 by 467 units,
which is 0.376 and therefore the same shape the webp always was, sitting very
nearly on the stage's own centre: 44 units of padding left against 52 right, 42
above against 38 below. That is why the column needs no manual re-balance to
stay vertically centred in the safe area. It centres the box, and the box
centres the mark. The one visible consequence is that the mark reads about seven
percent smaller than the webp did at the same box width, because the webp was
cropped tight and the stage is not.

The three subset faces the drawn lockup sets its letters in, "KA Playfair" in
two styles and "KA Poppins", are registered in `src/lib/fonts.ts` and recorded
in `LICENSING.md`.

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

### The device box, 2026-09-04

The copy moved onto the canvas axis on 2026-09-04 and the device did not, which
is what the owner saw next: the training reel's laptop sat left of the copy
under it. The device box was `[0, safe.right]`, so the device centred on the
safe area, and the safe area is not centred on the canvas.

It now takes the same box the copy does, `width - 2 * (width - safe.right)`, and
the same `centeredBox()` clamp. The clamp does not engage anywhere: the widest
device in either reel is 972, which is exactly the box in the feed, square and
LinkedIn crops.

`ProjectShowcase` is shared, so this moved the web reel's phone as well and both
reels were re-rendered and re-delivered. Measured on the device's own ink
against the brand ink ground, in the rows above the lower third:

| Still | Before | After |
|---|---|---|
| `TrainingVertical` 100, 130, 180 | -54 | +0.5 |
| `TrainingFeed` 100, 130 | -27 | 0 |
| `TrainingSquare` 100, 130 | -27 | 0 |
| `TrainingLinkedIn` 250, 700, 900 | -27 | 0 |
| `TrainingLinkedIn` 500 | -27 | -0.5 |
| `ReelVertical` 100 | -54.5 | -0.5 |
| `ReelFeed` 100 | -27.5 | -0.5 |

Landscape is the exception and stays one: the device is inside the strip left of
the copy panel, at 65 to 607 against a canvas centre of 960. It moved 3 pixels
right of where the browser window sat, because the laptop is 24 pixels narrower
in that strip, and it centres in the same place the phone does.

The stills, the measurements and the throwaway script are in `out/_laptop/`.

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

Five of the six moved on 2026-09-04 with the re-timed cut, keeping the visual
moment rather than the frame number: 260 to 252 and 214 to 206 inside beats that
shifted eight and sixteen frames, 344 to 328 and 380 to 364 for the tour, and
430 to 440 for the CTA card, which now has to be sampled after the drawn
lockup's last wordmark glyph lands at 432 rather than after a twelve frame
settle. Frame 120 did not move, because the first project beat did not. Neither
thumbnail moved: frame 75 is inside the first project's plate, which still runs
54 to 78, and frame 387 is in the 45 second cut, which was not re-timed.

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
`"phone"` or `"laptop"`. `zoom` is a rectangle in the capture's own pixels.
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

`src/components/LaptopFrame.tsx` is the desktop twin of `DeviceFrame`. The
training captures are 2880x1800 module screens and have nowhere sensible to sit
inside a phone body, so they sit on a laptop instead. See "The laptop frame"
below for what it draws and what it replaced.

A 16:10 screen cannot run the full canvas height the way a 9:16 phone can, so
in the vertical crop a laptop beat takes the stacked arrangement instead of the
overlay one: the laptop spans the safe width and the lower third sits under it
rather than across it. In landscape it takes a wider strip left of the copy
panel than a phone does, because width rather than height is the axis it runs
out of.

`src/components/ZoomShot.tsx` is the zoom mode. A 2880x1800 module screen
scaled into a 1080 wide frame renders its body text about four pixels tall,
which proves only that a page exists. Where a beat declares a `zoom`, the shot
picks the scale that makes that region cover its box, lays the whole capture
out at that scale, translates so the region's centre lands on the box's centre,
and pushes in three percent across the shot with the transform origin at the
box centre. No new dependency, and it never reaches for the video's own pixels.

### The laptop frame, 2026-09-04

`cleanFrame: "laptop"` replaced `cleanFrame: "browser"` after the owner watched
the training reel's first project beat: "it's off to the left and it's just a
floating mac browser, no device or anything with it like the others, seems very
out of place." Two faults in one shot, and both of them real.

`BrowserFrame` drew a sketched window, which is the K&A lockup's drawing at
video scale: a hairline ink border on canvas with three dots top left. That is
the right drawing for the end card, where a mouse builds the lockup, and the
wrong one for a project beat, where every other shot in both reels is a device.
The web reel's clean shots sit in `DeviceFrame`'s dark phone body, the plates
are photographs of real hardware, and in the middle of that a line drawing of a
window with nothing behind it reads as a missing asset rather than as a style.
`BrowserFrame.tsx` is deleted; nothing imports it.

`src/components/LaptopFrame.tsx` is the replacement, and it is deliberately the
phone with a hinge rather than a new idea:

- the same `#100D0A` body and the same `0 40px 90px rgba(0, 0, 0, 0.45)` drop
  shadow as `DeviceFrame`;
- a bezel of 1.8 percent of the screen width, a floor of 8, around a screen with
  a small corner radius, so the lid is a thin frame rather than a slab;
- a hairline lighter edge along the top of the lid, stopping short of the
  corners, which is the only lighting in the drawing;
- a camera dot of about a quarter of the bezel, centred in the top bezel;
- a base under the lid: a flat rounded slab 4.5 percent of the screen height and
  6 percent wider than the lid, in the same body tone, with a hairline highlight
  along its top edge for the hinge. Rounded harder on its bottom corners than
  its top ones, which is what makes it read as a deck seen head on rather than
  as a second panel.

No branding, no text, no keyboard detail, no gloss. At the sizes these render,
anything more is noise.

`laptopGeometry(screenWidth, screenHeight)` returns the outer size, and
`ProjectShowcase` solves its screen width against that with a proportional
shrink rather than restating the ratios, which is what the browser window's
geometry did and what made it two hand-written passes.

### The screen is 16:10, whatever is on it, 2026-09-04

The first laptop took its screen's shape from the zoom region it was handed, and
the regions were wide strips: hero-to-zones was 2145 x 695, close to 3:1. The
frame then drew an 885 x 287 screen, and the owner read the result as a
letterbox with a hinge rather than as a laptop. A laptop is not a container that
takes the shape of its contents.

`LAPTOP_SCREEN_ASPECT` in `src/components/LaptopFrame.tsx` is 16:10 and
`ProjectShowcase` sizes every laptop screen against it, so the region and the
screen are now two separate decisions:

- **the box decides the shape.** The screen is 16:10 and is solved by width
  against the box the device has to fit, the same proportional shrink as before.
- **the region decides what is in it.** `ZoomShot` already covers the box with
  the region, so the region says what is centred on the screen and how tight the
  crop is, and nothing else.

The four regions in `src/reels/training.ts` are authored 16:10 as well, so cover
throws nothing away and the numbers in that file are exactly what a viewer sees.
Nothing depends on that: hand the frame a 4:3 region and it still draws a 16:10
screen, with the region covering it.

**Screen sizes, measured on the delivered stills** with `out/_1610/measure.mjs`,
which finds the body colour and reads the hole in it. The lid is the screen plus
two bezels and the base is six percent wider than the lid; both are centred on
the same axis.

| Format | Box the device fits | Screen | Ratio | Lid | Base | Frame |
|---|---|---|---|---|---|---|
| `TrainingVertical` | 864 x 843 | 786 x 491 | 1.6008 | 814 x 519 | 863 x 22 | 863 x 541 |
| `TrainingFeed` | 972 x 736 | 885 x 553 | 1.6004 | 917 x 585 | 972 x 25 | 972 x 610 |
| `TrainingSquare` | 972 x 584 | 847 x 529 | 1.6011 | 877 x 559 | 930 x 24 | 930 x 583 |
| `TrainingLinkedIn` | 972 x 703 | 885 x 553 | 1.6004 | 917 x 585 | 972 x 25 | 972 x 610 |
| `TrainingLandscape` | 576 x 869 | 525 x 328 | 1.6006 | 543 x 346 | 576 x 15 | 576 x 361 |
| `TrainingLinkedInLandscape` | 576 x 869 | 525 x 328 | 1.6006 | 543 x 346 | 576 x 15 | 576 x 361 |

Every ratio is within 0.07 percent of 1.6, which is under half a pixel at these
sizes: the height is `round(screenWidth / 1.6)` and the rounding is the whole of
the error. Vertical, feed and LinkedIn are still width limited, so the screen is
as wide as the symmetric safe box allows.

**Square is the one crop the taller screen cost something.** Its box is 972 x
584: the safe top above it, the band below it, and the 24 pixel gap the stacked
arrangement always keeps. A 16:10 screen at the full 885 width needs a 610 pixel
frame, which does not fit, so the shrink loop reduces the width until it does
and the screen lands at 847 x 529 in a 583 pixel frame. That leaves 25 pixels
clear between the deck and the band, one more than the 24 the box reserves. It
is 4 percent narrower than the other 1080 wide crops and nothing else changed.

The loop measures the screen it is going to draw, not a screen half a pixel away
from it: both the loop and the final frame use the rounded width and the height
solved from that rounded width. Solving the height from the unrounded width put
the drawn frame one pixel taller than the frame the loop had just accepted,
which in square is one pixel out of the band's gap.

**The four regions, re-cut 16:10 on the same subjects.** All four decks lay one
content column across a 2880 x 1800 page, and in every one of them that column
is about 2080 capture pixels wide: cropping narrower cuts words out of a card, a
list item or a statement row. So the width is not negotiable, it is the width
that fixes the height at 1340, and every region starts at capture row 0 because
the content on all four decks sits in the top three quarters of the page.

| Beat | Region | What it holds |
|---|---|---|
| hero to zones | 369, 0, 2144 x 1340 | Module header, the tab row, the intro sentence, all four zone cards. From row 0 the LinkedIn cut's first second is the whole hero screen rather than a band of a paragraph. |
| hazard hunt | 369, 0, 2144 x 1340 | The illustration, the found counter, all six spot cards and the feedback panel. The old region was the illustration alone, and the claim on this beat is about the list. |
| P&L simulator | 368, 0, 2144 x 1340 | The four levers, the statement rows, the gross margin and operating income figures, the prompt tabs and the prompt line. |
| RFI branch | 362, 0, 2144 x 1340 | The sheet header, the scenario, both option cards side by side and the verdict panel. |

No beat fell back to the full 2880 x 1800 deck. 2144 is a third more
magnification than the whole page, and at an 885 pixel screen that is a scale of
0.41, which puts the module's body type near eight canvas pixels. Hero to zones
is unchanged on that count, because it was already 2145 wide and the width is
what sets the scale; only its height moved, from 695 to 1340.

Every laptop clean shot still ends on a frame that moves. Measured with ffmpeg
psnr on the new region, the last consecutive source pair of each beat is 16.1 dB
for hero to zones (99 to 100), 17.1 dB for the hazard hunt (131 to 132), 32.0 dB
for the P&L simulator (159 to 160) and 21.7 dB for the RFI branch (89 to 90).
The Section 6b line is 40 dB.

### Content boxes, and filling the device from the page, 2026-09-04

The owner's note on the safety deck inside the laptop plate was that it is "off
on the actual laptop screen". It was. The training samples are authored as a
fixed width sheet on a near black stage, so a 2880 x 1800 capture of one carries
348 pixels of backdrop down the left, 348 down the right and 30 across the top.
`PlateComposite` cover cropped the whole viewport anchored top left, so inside
the panel the page sat off centre with dead black around three of its sides.

**The measurement.** `scripts/capture.ts` writes a `contentBox` onto every entry
in `assets/captures/captures.json`. It is taken from the clip's own first frame,
pulled with ffmpeg, and not from the checked still beside it, because an
interaction clip can start on a different screen from the still. The box is the
bounding box of every pixel more than 60 from the frame's top left pixel, summed
across the three channels, padded outward by 4 and clamped to the frame. Both
capture paths write it as they record, and
`npx tsx scripts/capture.ts --content-boxes` backfills the whole index without
re-recording anything.

**That bounding box on its own is not the answer, and the web reel is why.**
Fore Motion Golf lays a logo, a headline and one card on a flat dark green
field. Its ink stops at 1562 x 1439 of 2880 x 1800, and filling a device screen
from that box would crop a website nobody asked to crop. Synovial does the same
on cream, at 2723 x 1734. Pixel statistics inside the box cannot separate those
two from the safety deck, because the safety deck is itself near black: 69 to 94
percent of what is inside its box is within 60 of the stage colour, which is
worse than Fore Motion's 92. The margin can be separated, on two tests, and both
are in `contentBoxForClip()`:

- **flatness.** A backdrop is one CSS colour, and at crf 16 it decodes back
  almost exactly: 0.1 to 0.5 percent of the safety decks' margin pixels sit more
  than 12 from the corner colour. The same figure across the eight client sites
  runs 8 to 89 percent, because a page's own background is photographed,
  gradiented or textured.
- **materiality.** Several sites' first ink starts a few rows down, which makes
  a 25 row "margin" that is not a margin. A real frame takes at least a
  twentieth of one axis.

Fail either and the box is recorded as the full frame, which is what "this page
fills its viewport" means. All seventeen web clips come out full frame, and so
does every training mobile clip, every finance clip and every RFI clip. Five
clips have a real box, and all five are the safety deck on desktop.

| Training clip | Content box | Frame |
|---|---|---|
| `training-finance-hero-desktop` | 0, 0, 2880 x 1800 | full frame |
| `training-finance-hero-mobile` | 0, 0, 780 x 1688 | full frame |
| `training-finance-line-item-sorter-desktop` | 0, 0, 2880 x 1800 | full frame |
| `training-finance-line-item-sorter-mobile` | 0, 0, 780 x 1688 | full frame |
| `training-finance-pnl-simulator-desktop` | 0, 0, 2880 x 1800 | full frame |
| `training-finance-waterfall-desktop` | 0, 0, 2880 x 1800 | full frame |
| `training-finance-waterfall-mobile` | 0, 0, 780 x 1688 | full frame |
| `training-rfi-hero-desktop` | 0, 0, 2880 x 1800 | full frame |
| `training-rfi-hero-mobile` | 0, 0, 780 x 1688 | full frame |
| `training-rfi-knowledge-check-desktop` | 0, 0, 2880 x 1800 | full frame |
| `training-rfi-scenario-branch-desktop` | 0, 0, 2880 x 1800 | full frame |
| `training-safety-hazard-hunt-desktop` | 352, 30, 2180 x 1756 | 2880 x 1800 |
| `training-safety-hazard-hunt-mobile` | 0, 0, 780 x 1688 | full frame |
| `training-safety-hero-to-zones-desktop` | 348, 30, 2184 x 1756 | 2880 x 1800 |
| `training-safety-hero-to-zones-mobile` | 0, 0, 780 x 1688 | full frame |
| `training-safety-hierarchy-sorter-desktop` | 348, 30, 2184 x 1756 | 2880 x 1800 |
| `training-safety-hierarchy-sorter-mobile` | 0, 0, 780 x 1688 | full frame |
| `training-safety-stop-or-go-desktop` | 348, 30, 2184 x 1756 | 2880 x 1800 |
| `training-safety-stop-or-go-mobile` | 0, 0, 780 x 1688 | full frame |
| `training-safety-walkthrough-card-desktop` | 348, 30, 2184 x 1756 | 2880 x 1800 |
| `training-safety-walkthrough-card-mobile` | 0, 0, 780 x 1688 | full frame |

The finance folio and the RFI drawing set do fill their viewports, which is
worth saying because the brief expected them not to. Only the safety deck is
mounted on a stage. The mobile safety clips fill theirs too: the deck is laid
out for a 390 wide screen and runs edge to edge there, and the 34 row inset the
raw bounding box finds at the top is only where the header type starts.

**The fill rule**, in `src/lib/content-fill.ts` so `PlateComposite` and the ring
check cannot drift apart. A capture whose box is the full frame keeps the cover
crop anchored top left it has always had, which is what keeps the web reel and
every phone shot byte identical. A capture with a real box takes a region of
itself instead:

- the region has the quad's aspect, so nothing is letterboxed or stretched. The
  aspect is `quadSourceSize()`'s, which is already the average of the two
  horizontal edges over the average of the two vertical ones.
- it is anchored at the content box's top, so the page's top edge lands on the
  panel's top edge, and centred horizontally on the box, so a centred sheet
  stays centred.
- it is always a **crop** of the content box, never an expansion of it.

That last one is the only real decision, and the arithmetic makes it. The safety
box is 2184 x 1756, an aspect of 1.24, against `t-laptop-shoulder`'s quad at
1.50. Widening 1756 rows to 1.50 needs 2640 columns, 456 more than the page has,
so expanding would put a quarter of a thousand pixels of the black stage back
inside the device, which is the fault this exists to fix. Cropping takes 2184 x
1452 from the top of the sheet: the module header, the interaction and its
feedback, and no backdrop at all. Because the region is always inside the box,
the "content box too narrow to fill, centre it instead" case cannot arise.

| Plate | Capture | Quad | Region | Scale |
|---|---|---|---|---|
| `t-laptop-shoulder` | hero to zones | 832 x 553, 1.5045 | 348, 30, 2184 x 1452 | 0.381 |
| `t-laptop-two` | walk-through card | 816 x 519, 1.5723 | 348, 30, 2184 x 1389 | 0.374 |
| `t-desktop-wide` | stop or go | 1115 x 646, 1.7260 | 348, 30, 2184 x 1265 | 0.511 |

Those are the three composites in the reel that changed. Everything else is a
full frame capture and renders as it did.

**The check is mechanical.** `npx tsx scripts/composite-check.ts ring` renders
all thirteen live plate composites at 1080x1920 through `src/plates-entry.ts`,
maps each quad through the same layer 1 transform `PlateComposite` applies,
drift and scale ramp included, and walks a ring 6 canvas pixels inside the quad
edge along each edge's own inward normal. It reports three numbers per
composite:

- **rendered**, the fraction of ring pixels within 12 of the capture's backdrop
  colour. This is the number the brief asked for, and on its own it is not
  enough: the safety deck's page background is the same near black as its stage,
  so a panel filled entirely with page still reads about a third backdrop.
- **source**, the same test run on the capture pixel each ring point traces back
  to through the inverse warp. This is the floor the rendered figure cannot go
  below while the page's own edge is that colour.
- **offpage**, the fraction of ring points tracing back outside the content box.
  This is the one that means dead backdrop inside the device, and the one that
  has to be under 2 percent.

| Plate | Rendered, before | Rendered, after | Source | Off page, after |
|---|---|---|---|---|
| `plate-laptop-shoulder` | 67.76% | 67.76% | 61.78% | 0.09% |
| `plate-ipad-lap` | 6.98% | 6.98% | 29.05% | 0.19% |
| `plate-desktop-wide` | 14.67% | 14.67% | 0.98% | 0.09% |
| `plate-handoff` | 0.00% | 0.00% | 56.42% | 0.05% |
| `plate-tablet-b` | 0.00% | 0.00% | 0.05% | 0.05% |
| `plate-phone-hands-b` | 0.12% | 0.12% | 20.12% | 0.18% |
| `plate-phone-hands` | 16.04% | 16.04% | 24.05% | 0.11% |
| `t-laptop-shoulder` | 95.80% | 34.09% | 29.64% | 0.10% |
| `t-phone-hands` | 37.66% | 37.66% | 37.66% | 0.21% |
| `t-laptop-cafe-free` | 0.14% | 0.14% | 0.09% | 0.05% |
| `t-phone-hands-b` | 0.00% | 0.00% | 1.29% | 0.07% |
| `t-laptop-two` | 96.22% | 34.84% | 30.01% | 0.10% |
| `t-desktop-wide` | 0.00% | 0.00% | 2.03% | 0.08% |

The two plates the fix reaches went from 95.80 and 96.22 percent backdrop on
that ring to 34.09 and 34.84, against a floor of 29.64 and 30.01. What is left
is the deck's own dark edge plus the layer 3 seat shadow darkening it further,
not the stage. Every composite is under 0.21 percent off page, and the residue
there is rounding at the quad corners where a sampled point lands a pixel
outside the clip.

`plate-laptop-shoulder` reads 67.76 percent on the rendered column and always
did: Fore Motion's page background is the corner colour the box was measured
from, its content box is the whole frame, and a clip with no backdrop cannot
show any. Its off page figure is 0.09 percent.

**Safe zones are untouched by all of this.** Nothing in the layout moved. The
change is the source rectangle of one video inside a warped div; the quad, the
plate's placement, `PlateShot`'s crop to the delivery canvas, and every line of
copy and its box come from the same `safeArea()` and `formatMetrics()` numbers
they came from before. There is no code path from a capture's content box to a
text position.

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
| 2026-09-04 | stills | `out/_laptop/before` and `out/_laptop/after` | 17 stills each, six crops of both reels | 15.4s per set |
| 2026-09-04 | Training*Debug | `out/_laptop/debug` | 8 safe zone stills, six crops | 7.1s |
| 2026-09-04 | TrainingVertical | `out/render-training-vertical-15s.mp4` (laptop frame) | 450 frames, 1080x1920, 30fps, 15.0s | 21.3s |
| 2026-09-04 | TrainingFeed | `out/render-training-feed-15s.mp4` (laptop frame) | 450 frames, 1080x1350, 30fps, 15.0s | 18.9s |
| 2026-09-04 | TrainingSquare | `out/render-training-square-15s.mp4` (laptop frame) | 450 frames, 1080x1080, 30fps, 15.0s | 18.1s |
| 2026-09-04 | TrainingLinkedIn | `out/render-training-linkedin-45s.mp4` (laptop frame) | 1350 frames, 1080x1350, 30fps, 45.0s | 53.0s |
| 2026-09-04 | TrainingLinkedInLandscape | `out/render-training-landscape-45s.mp4` (laptop frame) | 1350 frames, 1920x1080, 30fps, 45.0s | 61.7s |
| 2026-09-04 | sheet | `out/final-training/vertical-sheet.png` (laptop frame) | 4x3 tile of 12 frames, ffmpeg | under 1s |
| 2026-09-04 | bundle | `out/bundle` (16:10 laptop screen) | rspack bundle, public dir linked not copied | 14.4s cold, 2.2s warm |
| 2026-09-04 | Training stills | `out/_1610/stills` | 22 stills, six crops plus six debug twins | 52.4s |
| 2026-09-04 | TrainingVertical | `out/render-training-vertical-15s.mp4` (16:10 screen) | 450 frames, 1080x1920, 30fps, 15.0s | 20.8s |
| 2026-09-04 | TrainingFeed | `out/render-training-feed-15s.mp4` (16:10 screen) | 450 frames, 1080x1350, 30fps, 15.0s | 18.7s |
| 2026-09-04 | TrainingSquare | `out/render-training-square-15s.mp4` (16:10 screen) | 450 frames, 1080x1080, 30fps, 15.0s | 17.8s |
| 2026-09-04 | TrainingLinkedIn | `out/render-training-linkedin-45s.mp4` (16:10 screen) | 1350 frames, 1080x1350, 30fps, 45.0s | 52.5s |
| 2026-09-04 | TrainingLinkedInLandscape | `out/render-training-landscape-45s.mp4` (16:10 screen) | 1350 frames, 1920x1080, 30fps, 45.0s | 58.8s |
| 2026-09-04 | deliver | five MP4s, five SRTs, two thumbnails, six stills, acceptance | `npx tsx scripts/deliver.ts --reel training --variant t-a` | 36.7s |
| 2026-09-04 | sheet | `out/final-training/vertical-sheet.png` (16:10 screen) | 4x3 tile of 12 frames, ffmpeg | 0.4s |
| 2026-09-04 | **Training re-delivered, 16:10 laptop screen** | **the 16:10 screen rule and the four re-cut zoom regions** | **warm bundle + five renders + delivery + sheet** | **207.9s (3m 28s)** |
| 2026-09-04 | content boxes | `assets/captures/captures.json` (content box fill) | 38 clips, first frame pulled with ffmpeg and scanned | 9.2s |
| 2026-09-04 | ring check | `out/_fill/before` and `out/_fill/after` | 13 plate composites at 1080x1920, rendered and measured | 46.9s per set |
| 2026-09-04 | ReelVertical | `out/_fill/psnr`, frames 60 and 200 | 2 stills each, 1080x1920, the web reel PSNR control | under 20s per set |
| 2026-09-04 | bundle | `out/bundle` (content box fill) | rspack bundle, public dir linked not copied | 1.9s warm |
| 2026-09-04 | TrainingVertical | `out/render-training-vertical-15s.mp4` (content box fill) | 450 frames, 1080x1920, 30fps, 15.0s | 22.5s |
| 2026-09-04 | TrainingFeed | `out/render-training-feed-15s.mp4` (content box fill) | 450 frames, 1080x1350, 30fps, 15.0s | 20.4s |
| 2026-09-04 | TrainingSquare | `out/render-training-square-15s.mp4` (content box fill) | 450 frames, 1080x1080, 30fps, 15.0s | 19.4s |
| 2026-09-04 | TrainingLinkedIn | `out/render-training-linkedin-45s.mp4` (content box fill) | 1350 frames, 1080x1350, 30fps, 45.0s | 56.6s |
| 2026-09-04 | TrainingLinkedInLandscape | `out/render-training-landscape-45s.mp4` (content box fill) | 1350 frames, 1920x1080, 30fps, 45.0s | 64.0s |
| 2026-09-04 | deliver | five MP4s, five SRTs, two thumbnails, six stills, acceptance | `npx tsx scripts/deliver.ts --reel training --variant t-a` | 38.3s |
| 2026-09-04 | stills | `out/_fill/stills` | 15 stills, TrainingVertical and TrainingLinkedIn | 25.5s |
| 2026-09-04 | sheet | `out/final-training/vertical-sheet.png` (content box fill) | 4x3 tile of 12 frames, ffmpeg | 0.4s |
| 2026-09-04 | **Training re-delivered, content box fill** | **the plate fills from the page rather than from the viewport** | **warm bundle + five renders + delivery + sheet** | **223.6s (3m 44s)** |

The 16:10 re-delivery touched the training reel only. The web reel has no beat
with `cleanFrame: "laptop"`, so nothing in it changed and its five delivered
MP4s were not re-rendered or re-encoded.

The content box re-delivery is the training reel only for a different reason.
Every web capture measures as a full frame content box and so takes the same
cover crop it always took, which makes its plate composites byte identical:
`ReelVertical` frames 60 and 200 rendered before and after the change come back
at infinite PSNR and compare equal with `cmp`. Its five delivered MP4s were not
re-rendered or re-encoded either.

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
two zoomed laptop shots. There is no audio on it and no delivery step, which is
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

**Beat 1 is the walk-through on a laptop**, pushed in on the tab row and
the four zone cards, and it starts on source frame 33 rather than 0. The clip is
named for what it does: it opens on the hero screen and scrolls to the zones
over source 20 to 32. Starting at 0 put the hero screen behind a zoom region
measured on the zones, and frame 100 of the cut showed learning objectives
through a screen cropped for a tab row. The scroll is not lost, because the
plate shot runs at the same rate and `ProjectShowcase` backs its capture up by
`round(24 * rate)` frames, so the plate plays source 19 to 33 and hands over on
the exact frame the scroll finishes. Section 6b's "cut on the scroll", for free.

**Beat 2 is the same course on a phone**, so the two safety beats are two
surfaces rather than the same laptop twice. It is the stop-or-go
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
the canvas rather than only for a laptop. The rule already existed and
already said the right thing about laptop screens; it was written as
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

The two 15 second rates were re-solved on 2026-09-04, when the drawn end card
took each project beat from 140 frames to 132 and each clean shot from 116
output frames to 108. Beat 1's rate had to come up to land its last output frame
on source 100 again; beat 2 plays at rate 1, so its window simply ends eight
frames earlier. The 45 second cut was not re-timed and none of its four rates
moved.

| Cut | Beat | Clip | Trim | Rate | Last source frame |
|---|---|---|---|---|---|
| 15s | 1 | hero-to-zones | 33 | 0.629 | 100, the second tab click |
| 15s | 2 | stop-or-go mobile | 0 | 1 | 107, mid answer |
| 45s | 1 | hero-to-zones | 0 | 0.543 | 100, the second tab click |
| 45s | 2 | hazard-hunt desktop | 0 | 0.716 | 132, the sixth hazard found |
| 45s | 3 | P&L simulator | 0 | 0.867 | 160, inside the fourth slider drag |
| 45s | 4 | RFI branch | 0 | 0.489 | 90, option B marked correct |

Beat 1's rate is solved rather than rounded. `33 + 107 * 0.629` is 100.3 and
`33 + 106 * 0.629` is 99.7, so the last two output frames sit on source 99 and
source 100, which is the tab click itself. Anything from 0.627 to 0.632 lands
that pair and 0.629 is the middle of the interval, so no rounding inside the
player can push either frame onto the wrong source frame.

Verified by measuring PSNR between the last two frames of each clean shot in the
delivered renders, the same test the web reel used:

| Shot | Frames | PSNR |
|---|---|---|
| 15s beat 1 | 184 to 185 | 22.7 dB |
| 15s beat 2 | 316 to 317 | 25.1 dB |
| 45s beat 1 | 364 to 365 | 20.7 dB |
| 45s beat 2 | 574 to 575 | 18.9 dB |
| 45s beat 3 | 784 to 785 | 35.9 dB |
| 45s beat 4 | 994 to 995 | 25.3 dB |
| 15s CTA card, static control | 440 to 441 | 87.6 dB |
| 45s CTA card, static control | 1340 to 1341 | 79.2 dB |

All six shots are far under the 40 dB line that would mean a frozen shot, and
the two static controls at 88 and 79 dB show the metric is reading real motion
rather than encoder noise. The same pairs measured on the captures themselves,
before any encode and through each beat's own zoom region, read 13.3 dB for
hero-to-zones at source 99 to 100 and 20.4 dB for stop-or-go at source 106 to
107.

One number worth recording because it looks like a failure and is not. Frames
183 to 184 of the 15 second cut measure 46.2 dB, over the line, and they are
consecutive frames inside beat 1. At rate 0.629 the source index advances on
roughly two output frames in three, so some consecutive output pairs carry the
same source frame and differ only by the shot's three percent push in. That is
the documented cost of any rate under 1, the same cost the web reel's LinkedIn
cut pays at 0.6 and the same one its 15 second cut pays at 0.8, where frames 183
to 184 measure 56.5 dB for exactly the same reason. The test that matters is the
last pair before the cut, because a shot that is still moving when it is cut
cannot read as frozen, and every one of those is under 36 dB.

Also worth recording: the stop-or-go clip is not continuous motion. Measured
across all 107 consecutive pairs of its 108 frame window on its zoom region, 32
of them sit above 40 dB. Those are the beats where a learner is reading a prompt
before answering, which is a person taking a moment rather than a shot that has
stopped, and the shot's own three percent push in is running under all of them.
What the Section 6b test asks is that the cut does not land on a photograph, and
that is about the last pair, which is 20.4 dB.

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

## The tutorial reels

Added 2026-09-04, Phase A. A third content line next to the two showcase reels:
short narrated tutorials, each shipping as a 15 second Facebook cut and a 45
second LinkedIn cut. The first two are `contrast` ("Contrast is not a vibe.") and
`hero` ("Your hero is a promise, not a photo."). The design is in
`../../docs/superpowers/specs/2026-09-04-tutorial-reels-design.md`.

`Tutorial.tsx` is a separate scene tree from `Reel.tsx`, deliberately. A showcase
reel is a fixed beat map in `src/lib/timing.ts` with content poured into it. A
tutorial is a narration with a picture laid out around it, so its beat map is
computed. Sharing one tree would have meant a beat map that is sometimes a
constant and sometimes a function, which is a fork wearing a prop. Everything
below the beat is shared: the drawn end card, the kinetic treatment, the device
frames, `src/lib/layout.ts` and the brand.

### The timeline is driven by the voice

`scripts/voice.ts` generates one ElevenLabs file per beat, including the hook and
the end card, and writes its measured duration into `config/voice.json`.
`src/tutorial/timeline.ts` reads those durations and lays the cut out:

- Each beat gets `max(minFrames, ceil(durationSec * 30) + 12)`, so the voice
  never runs past its picture and there is a 12 frame tail before the next line.
- The hook holds at least 54 frames in the short cut and 36 in the LinkedIn one,
  the two numbers `src/lib/timing.ts` already uses. The end card holds at least
  78 and 124, which is what its draw in `src/scenes/CallToAction.tsx` needs.
- The total is exactly 450 or 1350. Slack goes to the one beat marked `stretch`.
  An overrun on measured beats is a hard error naming every beat and its frames,
  because the answer is to shorten a line: the speed of the read is never
  adjusted to make a script fit.

A beat with no voice file yet is laid out from an estimate of 2.6 words a second
and named in a console warning at bundle time, so a grey render exists before a
credit is spent. The draft read measured nearer 3.9 words a second, so the
estimate overstates every beat by about half; where that pushes a 15 second cut
past 450 frames the estimated beats are squeezed back to their own `minFrames`
rather than failing, and the warning already says the timing is provisional.

Where the four cuts landed, all measured:

| Cut | Beats, frames each | Slack to the stretch beat |
|---|---|---|
| contrast 15s | hook 54, fine 64, fails 89, **fix 165**, cta 78 | 55 to `fix` |
| contrast 45s | hook 53, real 325, **inspect 378**, fix 355, rule 104, cta 135 | 216 to `inspect` |
| hero 15s | hook 71, weak 74, **promise 167**, real 60, cta 78 | 89 to `promise` |
| hero 45s | hook 72, fold 283, rewrite 177, **real 597**, rule 71, cta 150 | 327 to `real` |

The hero 45 second cut is the one to watch. Its script is 491 characters of
narration for 45 seconds, which lays out to 1023 frames and leaves 327 of slack,
so the `real` beat runs 597 frames: three client heroes at about 6.6 seconds each
rather than the three the spec sketches. That is readable, and arguably right for
a headline the viewer is being asked to read, but it is a lot of screen time for
one beat and it is there because the script under-fills the cut rather than
because anyone chose it. Either a beat is added or Phase B holds each phone
longer on purpose.

### Voice and mix

```
npx tsx scripts/voice.ts voices [--search calm]
npx tsx scripts/voice.ts --reel contrast|hero|both --cut short|linkedin|both [--dry-run]
npx tsx scripts/voice.ts --mix --reel both --cut both
npx tsx scripts/voice.ts usage
```

Model `eleven_multilingual_v2`, not `eleven_v3`. v3 is on the API at the same one
credit a character, but the ElevenLabs text to speech best practices page
describes it as at a "research preview stage" and says its library voices "may
produce more variable results compared to the v2 and v2.5 models". This timeline
is laid out from the measured duration of each file, so a model that reads the
same sentence differently on each call would move the picture every time
anything was regenerated. The same page notes multilingual v2 "can better
generalize the reading out of numbers", which is the whole subject of the
contrast tutorial. The full argument is at the top of `scripts/voice.ts`.

Draft voice is the premade library voice "Eric", a smooth tenor from a man in his
40s, American, at stability 0.5, similarity 0.75, style 0, speed 1.0. Kai's voice
id replaces it for the final pass; every beat regenerates on its own when it
does, because the voice is part of the hash a skip is decided on.

Every call is logged in `config/voice.json` with the exact text, the settings,
the measured duration and the credits measured as a before and after delta on the
usage endpoint, the same way `config/audio.json` logs the music. The draft pass
cost **1406 credits**: contrast 189 and 565, hero 168 and 484. The hero 45 second
"real" line was then re-cut when the spec changed its three example sites on
2026-09-04, which cost another **118 credits** and regenerated that one beat and
nothing else, because the hash a skip is decided on covers the text. **1524
credits** in total.

`--mix` builds `assets/audio/mix-tut-<id>-<15|45>s.wav`: the music take named in
the content file, gained so it sits 8 dB under the voice peak, then sidechained
under the voice bus, then through the same limiter and two pass loudnorm path
`scripts/audio.ts` uses, and measured off the file afterwards. The sidechain
threshold is solved rather than guessed: the bed is measured with the duck
bypassed and again with it in, over a window inside the longest line, and the
threshold is refined until the reduction lands on 10 dB. Delivered:

| Mix | Integrated | True peak | Bed under the voice while it speaks |
|---|---|---|---|
| `mix-tut-contrast-15s.wav` | -13.90 LUFS | -1.52 dBTP | 17.4 dB |
| `mix-tut-contrast-45s.wav` | -14.02 LUFS | -1.96 dBTP | 15.9 dB |
| `mix-tut-hero-15s.wav` | -14.01 LUFS | -1.49 dBTP | 17.1 dB |
| `mix-tut-hero-45s.wav` | -13.99 LUFS | -1.81 dBTP | 17.3 dB |

`Tutorial.tsx` also drops an `<Audio>` per beat so Studio and a bare render carry
the narration, but the delivered audio comes from the muxed mix, exactly as it
does for the other two reels.

### Scenes, and the Phase B split

A beat names its scene with a string key that
`src/tutorial/scenes/registry.ts` resolves. Nothing in `src/tutorial/types.ts` or
`src/tutorial/reels/` imports React, which is what lets `voice.ts`, `srt.ts` and
`deliver.ts` read a content file without pulling the bundle in, and what lets the
two Phase B agents add their scenes by registering one key each rather than by
editing a shared file.

Phase A ships five shared scenes: `TutorialHook` (the showcase hook's kinetic
treatment plus a flat teal or canvas field option, since neither of these
tutorials opens on a capture), `Caption` (the burned in card, ink on canvas with
an 8px radius, in the bottom safe area), `FlatDemo` (the canvas card a tutorial
scene draws inside, phone shaped in the tall crops and laptop shaped in
landscape), `JamClip` (a Jam recording in the laptop frame, `StandIn` when it is
missing) and `Placeholder`, which is what both content files use until Phase B
replaces them.

Jam recordings are listed in `config/jam.json` and the mp4s live in
`assets/captures/jam/`. The manifest is in `config/` rather than beside the files
because `assets/captures/` is gitignored: everything in there is regenerated by
`scripts/capture.ts`, and a hand kept list of recordings a person made is not.

`src/lib/contrast.ts` computes WCAG 2.x contrast from two hex values. Nothing in
a scene may carry a ratio as a literal: it reads `config/brand.json`, passes the
hexes through the helper, and formats what comes back.
`scripts/qa/tutorial.ts` asserts amber `#D97706` on canvas `#F8F5F2` at 2.933,
rust `#9A3412` on canvas at 6.728, ink `#221C15` on amber at 5.295, and that
every ratio quoted in a caption is one of those three.

### Registration and delivery

`Root.tsx` registers `TutorialContrast{Vertical,Feed,Square,Landscape,LinkedIn,LinkedInLandscape}`
and the same six for `TutorialHero`, plus a Debug twin of each: twenty four
compositions, through `tutorialRegistrations(prefix, content)`, which mirrors
`registrations()`.

```
npx tsx scripts/qa/tutorial.ts                       120 checks, no picture needed
npx tsx scripts/srt.ts --reel tutorial-contrast      five sidecars from the timeline
npx tsx scripts/deliver.ts --reel tutorial-contrast  the usual pipeline
```

Renders are `out/render-tutorial-<id>-<format>-<duration>.mp4`, deliveries
`out/kap-tut-<id>-<format>-<duration>.mp4`, with matching SRTs. Two things differ
from the showcase pipeline. There is no `--variant`: a tutorial's mix is voice
with a bed under it and is built by `voice.ts`, and which take beds it is a field
in the content file. And the frames the thumbnails and carousel stills come from
are derived from the timeline rather than hand picked, because a hand picked
frame number would go stale the first time a line was regenerated.

The SRT cues are generated too, one per beat, carrying the full narration rather
than the burned in caption. The captions are deliberately shorter than the lines
they caption, so a viewer reading rather than listening gets the whole thing.

### Phase A gate

`npx tsc --noEmit` and `npx eslint src` clean, all twenty four compositions list,
`scripts/qa/tutorial.ts` 120 of 120, and four grey renders with the draft voice
against the placeholders:

| File | Canvas | Frames |
|---|---|---|
| `out/tut-grey-contrast-vertical-mixed.mp4` | 1080x1920 | 450 |
| `out/tut-grey-contrast-linkedin-mixed.mp4` | 1080x1350 | 1350 |
| `out/tut-grey-hero-vertical-mixed.mp4` | 1080x1920 | 450 |
| `out/tut-grey-hero-linkedin-mixed.mp4` | 1080x1350 | 1350 |

## QA

Added 2026-09-04. Owner's brief, in his words: "we really wanna get everything
pixel perfect, any way we can really QA this in a meaningful way so I don't keep
finding stuff like that."

Every alignment and composition fault the owner has caught so far was findable
by measurement. Text blocks centred on the safe area rather than the canvas, a
device box off centre, a bare browser window where a device belonged, a laptop
screen at 3:1 instead of 16:10, a blank first frame on the end card: all of them
are numbers, and all of them were found by eye first. `scripts/qa.ts` renders
stills off its own bundle and measures them, so the next one is found by the
harness.

```
npx tsx scripts/qa.ts                       both reels, every frame
npx tsx scripts/qa.ts --reel training       one reel
npx tsx scripts/qa.ts --fast                fewer frames per beat
npm run qa -- --reel web
```

| Flag | What it does |
|---|---|
| `--reel web\|training\|all` | Which reel. Default `all`. |
| `--fast` | Samples fewer frames per beat. Keeps every frame a PASS or FAIL check needs. |
| `--only <ids>` | Comma separated composition ids, for one crop at a time. |
| `--rebundle` | Forces a rebuild of `out/qa/bundle`. |
| `--concurrency <n>` | Browsers rendering stills at once. Default 6. |
| `--skip-render` | Re-measures the stills already on disk. |

It exits 1 if anything failed. **No delivery goes into the Posts folder until
`npx tsx scripts/qa.ts` exits 0.** Read the REVIEW rows before shipping as well:
they are the checks that can measure a thing but cannot judge it, and there are
never many.

### What it renders, and from where

The harness builds its own bundle at `out/qa/bundle` and never touches
`out/bundle`, so it can run while a delivery render is in flight and a report
can name the bundle it measured. The bundle is rebuilt whenever anything under
`src`, `config` or `assets/captures/captures.json` is newer than the last build,
which takes about a second because the public dir is linked rather than copied.

The Node API does not read `remotion.config.ts`, so `scripts/qa/render.ts`
passes the two settings that change what renders: `publicDir` is `./assets`, not
`./public`, and Tailwind is enabled. That second one is load bearing rather than
cosmetic. `ZoomShot` only sets `maxWidth: none` because Tailwind's preflight
clamps a zoomed video, so a bundle built without Tailwind renders a different
picture from the one that ships and every measurement taken off it would be
worthless.

The shot list comes from the beat maps in `src/lib/timing.ts` and the content
configs in `src/reels`, so a re-timed cut or a re-cast project beat changes which
frames get tested without anyone editing the harness. Per composition:

| Beat | Frames tested |
|---|---|
| Hook | start + 1, middle, end - 1 |
| Project beat | plate + 1, plate middle, last plate frame, first clean frame, clean + 1, claim in + 2, end - 2, end - 1 |
| Surfaces tour | start + 1, middle, end - 1 of every cut |
| How we work, accessibility | each line in + 2, section end - 1 |
| Call to action | start, start + 1, middle of the draw, copy in + 1, end - 1 |

That is 33 frames for each of the eight 15 second compositions and 60 for each of
the four 45 second ones, 504 in all, plus two safe zone Debug stills per
composition as visual evidence. `--fast` cuts it to roughly half.

The two frames the brief does not name are there because two checks need a pair:
the last plate frame against the first clean frame for check (h), and the second
to last frame of each clean shot against the last for check (i).

### The nine checks

| | Measures | Fails at |
|---|---|---|
| a | text centring: the ink centre of the copy block against the canvas centre, or the panel centre in the landscape split | more than 4 px at 1080 canvas width, scaled by `typeScale`, so 7.1 px in landscape |
| b | safe zones: copy pixels inside the reserved rectangles `safeArea()` derives | more than 120 px, which is the antialiasing allowance, and REVIEW rather than FAIL on a frame that is mid whip |
| c | device geometry: the `#100D0A` body's centre line, and the aspect of the screen hole inside it | body missing, centre off by more than 4 px, or aspect off by more than 1 percent |
| d | screen fill: a ring 6 px inside the screen hole or the plate quad, against a flat page backdrop | 95 percent of the ring or more, which is a screen with nothing in it. Over the 2 percent line and under that is REVIEW |
| e | blank frames: ink coverage against the frame's own dominant colour | under 0.2 percent |
| f | logo: the drawn lockup's colours present, the retired gold crest absent | under 200 px of `#a93c1c` or `#8b6f5c`, or 3000 px or more of `#C09A5E` |
| g | plate review: 2x crops of each plate's quad corners and of skin touching the quad | never fails, always REVIEW |
| h | cut continuity: PSNR across the hard cut from the plate to the clean shot | never fails, REVIEW under 8 dB |
| i | motion: PSNR between the last two frames of every clean shot | 40 dB or over, which is a frozen shot |

**How (a) and (b) find the copy.** Where a capture is on screen the copy sits on
the opaque `#14100C` scrim, so the scrim block is found first and the ink is
measured against it, which is what the throwaway `out/_align/measure.mts` did
during the centring pass. Where the whole canvas is flat brand colour, the corner
pixel is the background and the whole frame is the region. Check (b) then counts
copy pixels inside the reserved rectangles and reports the closest approach in
pixels, which is the number that says whether a layout change is heading for
trouble before it arrives.

Doing it that way, rather than colour matching the whole frame, is deliberate.
A site capture contains plenty of near ink and near canvas pixels, and a check
that flagged them would fire on every crop with a device in a reserved zone,
which Section 8 explicitly allows. Measuring inside the copy region only is the
mechanical form of "the capture may enter a reserved zone, text may not".

**Check (a) only runs on settled frames.** `KineticText` hides characters with
`visibility` while it types, so a half typed line lays out at its final width but
inks only the left of it. Its ink centre is not its box centre, by design. Those
frames are reported as not applicable rather than measured, and the shot list
knows which they are: a project name is settled at relative frame 18, a LinkedIn
context sentence at 40, and the end card only on its last frame, because the
wordmark is still typing at copy in.

**The (a) tolerance scales with the type, and that is not slack.** What 4 px is
absorbing is the type's own side bearings and the trailing letter space of a
negative tracking, and both of those are drawn at the type's size. The centring
pass on 2026-09-04 measured exactly that: the surfaces tour word in landscape sat
+5 against its own box before the change and +5 after it, which is the type and
not the layout. Landscape renders at 1.778, so its line is 7.1 px. The six 1080
wide compositions keep the 4.

**Check (b) reports rather than judges on a whipped frame.** Every project beat
after the first slides in from the right over `WHIP_FRAMES`, so on those frames
the whole scene, band and copy included, is deliberately part way off the canvas
and its copy is passing through the reserved right strip. The measurement is
taken and the numbers are printed, as REVIEW: a line mid slide is not a line laid
out inside a reserved zone, and failing on it would bury a real fault under six
frames of transition per beat.

**Check (c) measures the aspect only where the whole device is visible.** In the
overlay arrangement the lower third sits on top of the device's lower part, so
the visible screen is clipped and its aspect is not the device's. The centre line
and whether a device body exists at all are measured everywhere, which is what
catches a device off centre and a bare browser window. No laptop beat is ever in
the overlay arrangement, because a 16:10 screen is wider than any of these
canvases and `ProjectShowcase` sends it to `stack`, so the 16:10 rule is enforced
on every laptop shot in both reels.

The body tolerance is near exact, 3 in RGB. The scrim is 5.4 away from the body
colour and several of these sites open on a near black hero that runs within a
few code values of it, and a loose tolerance turned the band into a device and a
dark page into bezel. The first pass read the Fore Motion phone's screen as
732x209 for exactly that reason. These are PNG stills of a flat CSS fill, so
nothing has to be forgiven.

**Check (d) is a screening check on this content, not a gate, and the reason is
worth recording so nobody retries the two versions that do not work.**

Matching near black and near white failed 226 frames, almost all of them dark
pages whose hero simply is dark at the screen edge. Matching each clip's own
backdrop colour, read off its first frame by `clipBackgroundColor()` in
`scripts/capture.ts`, still failed 80: the training safety modules are dark
themed, so the sheet inside their content box is within 12 of the backdrop
outside it, and no tolerance separates a margin from the page it surrounds. A
shape test on opposite edges is not sound either, because on these clips the dark
chrome runs along the top and bottom as readily as down the sides.

So the check reports the ring fraction and the four per edge fractions on every
shot, calls anything over the 2 percent line REVIEW, and fails only where the
ring is almost entirely one flat colour, which is a screen with nothing in it.
That last case is real and it found one: the `t-desktop-wide` tour plate in
`TrainingLinkedInLandscape` reads 96 percent, because in that crop `plateCrop()`
scales the composite until the monitor, the desk and the room are all off canvas
and the shot is a full bleed page. The same plate in `TrainingLinkedIn` is a
monitor on a desk with a hand at the bottom of the frame.

Precise mode does not change that rule. It narrows the colour matched from near
black and near white to the one colour that clip's own margin is made of, which
makes every number sharper, and the report says which mode each row is in. A clip
qualifies when its `contentBox` is inset from its own frame, which is what says
the page has a margin at all; 5 of the 38 clips do.

Ring samples that land behind the lower third or the landscape copy panel are not
counted either way. That is not a nicety: the scrim is `#14100C` and the training
safety clips' backdrop is `rgb(17, 16, 19)`, 7.6 apart and inside the 12 this
check matches on, so leaving them in failed three good landscape plates.

Resolving the backdrops needs FFmpeg on `PATH`, the same requirement
`scripts/audio.ts` and `scripts/deliver.ts` already have. The import of
`scripts/capture.ts` is dynamic and guarded, so a run without FFmpeg screens with
a note in the report rather than failing.

**The plate quad is mapped, not guessed.** `PlateShot` offsets `PlateComposite`
by the quad's own centre and scales about the canvas centre, and `PlateComposite`
lays the plate out at its own pixel size with `translate(drift) scale(cover *
ramp)` about the plate's centre. `plateQuadOnCanvas()` in `scripts/qa/geometry.ts`
composes those, drift curve and scale ramp included, so the ring follows the real
screen on the real frame. If either component ever changes how it places the
plate, that function has to change with it and check (d) will report nonsense
until it does. That is the intended failure mode: a silent pass would be worse.

### Output

| Path | What it is |
|---|---|
| `out/qa/report.md` | A table per composition, one row per still per check, with the numbers. Failures and reviews are also listed together at the top. |
| `out/qa/findings.json` | The same thing for machines, with every metric as a field and the thresholds the run used. |
| `out/qa/sheets/<composition>.png` | Contact sheet of every tested still, with a red FAIL badge and border on failing frames and an amber border on review frames. |
| `out/qa/stills/<composition>/<frame>.png` | The stills themselves, kept so `--skip-render` can re-measure without rendering. |
| `out/qa/debug/<composition>Debug/<frame>.png` | Two Debug stills per composition, the red reserved zones over the same picture. |
| `out/qa/plates/<plate id>/` | Check (g): the four quad corners at 2x, every skin toned region touching the quad at 2x, and `quad.json`. |
| `out/qa/bundle` | The harness's own bundle. Never `out/bundle`. |

### What it still cannot do

Worth writing down, because a harness whose limits are not recorded gets trusted
further than it should be.

- **It cannot say whether a photograph is good.** Check (g) puts the quad corners
  and any skin near them in front of a reviewer in seconds instead of minutes,
  but whether a hand reads as occluding the panel, or whether a face is in shot,
  is a look rather than a number.
- **It cannot judge type.** A word that measures 5 px right of centre because of
  its own side bearings and a word that is 5 px off because the layout is wrong
  measure the same. The landscape surfaces tour word is the known example.
- **It cannot read the copy.** Nothing here knows whether the claim on screen is
  the claim that beat is meant to carry.
- **It samples frames, not the video.** A fault that exists only between two
  sampled frames is not tested. The sample list is dense at the ends of beats,
  which is where the faults have been.
- **Check (d) cannot separate a page's own background at the screen edge from
  real dead space** on a dark themed page, in either mode. See above. It fails
  only on a screen with nothing in it and screens everything else.
- **It does not know about `scripts/qa/tutorial.ts`.** That file arrived in this
  directory from the tutorial reel work and has its own entry point,
  `npm run qa:tutorial`. The twelve compositions this harness tests are the two
  delivery reels.
