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

Section 14 item 9, the full rebuild number: **190.7 seconds**, which is
2.1 + 2.8 + 143.7 + 42.1. It is the sum of the seven "final build" rows above
and it assumes `node_modules` is installed and `assets/captures` and
`assets/plates` are already on disk. It does not include capture, Lighthouse
measurement, or any ElevenLabs generation, none of which a rebuild repeats, and
it does not include the 50.8 seconds the twenty four Gate 7 debug stills take,
which is a review step rather than part of the build.

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
reel is centred horizontally, in all six compositions and both cuts.

- `src/components/KineticText.tsx` takes an `align` prop. Centring is safe with
  the type-on because the reveal hides characters with `visibility` rather than
  slicing the string, so the line's box is its final width from frame 0. The
  line is centred once, as a finished line, and characters appear from the left
  of that fixed box rather than the box sliding as each one lands. Slam mode
  also swaps its `transformOrigin` to centre, or the punch would push a centred
  line sideways for four frames.
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

The bands keep their asymmetric padding, 72 on the left and 108 on the right at
1080 width, so copy centres between the left margin and the reserved right strip
rather than on the canvas. That is deliberate: centring on the canvas would push
the right edge of a long line into the platform UI zone in the vertical crop.
The `HowWeWork` lockup stays in the top left of its own row, because it is a
brand mark rather than a line, and centring it would make that beat read as a
title card.

Re-verified after the change against all six Debug compositions. Stills in
`out/gate7/`: frames 20, 120, 350 and 440 for the four short crops, and 100,
300, 1150 and 1300 for the two LinkedIn ones. No text and no logo enters a red
zone in any of the twenty four.

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
