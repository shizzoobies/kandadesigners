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

(leave empty until the first real render, then log date, composition,
duration rendered, and wall-clock render time here)
