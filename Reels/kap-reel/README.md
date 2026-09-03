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

Note on both numbers: the bundle was already warm from the still-frame checks
run immediately before. A cold render adds roughly 25 to 30 seconds of bundling
plus about 20 seconds of copying the public dir (`assets/`, now 317 MB).

## Formats

Eight compositions, one scene tree. Section 8 forbids producing the crops with
an FFmpeg center crop of the vertical master, so each one renders `src/Reel.tsx`
with a different `format` prop and every scene re-lays itself out from
`safeArea(format)` and `formatMetrics(format)` in `src/lib/layout.ts`. All eight
run 450 frames at 30fps.

| Composition | Canvas | Safe area | `debugSafeZones` |
|---|---|---|---|
| `ReelVertical` | 1080x1920 | 972x1248 | off |
| `ReelFeed` | 1080x1350 | 1026x1134 | off |
| `ReelSquare` | 1080x1080 | 1026x972 | off |
| `ReelLandscape` | 1920x1080 | 1824x940 | off |
| `ReelVerticalDebug` | 1080x1920 | 972x1248 | on |
| `ReelFeedDebug` | 1080x1350 | 1026x1134 | on |
| `ReelSquareDebug` | 1080x1080 | 1026x972 | on |
| `ReelLandscapeDebug` | 1920x1080 | 1824x940 | on |

The Debug four draw the reserved zones as translucent red with a red border and
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
