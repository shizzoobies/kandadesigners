# Claude Code Kickoff: K&A Performance Showcase Reel

Drop this file and `kap-reel-handoff.md` in the repo root. Paste the block below into Claude Code to start.

---

## Paste this first

```
Read kap-reel-handoff.md in full before doing anything. It is the spec for this build. Do not
summarize it back to me.

You are building a 15 second vertical showcase reel plus a 45 second LinkedIn cut for K&A
Performance, from real screen captures of real client websites, composited with AI generated
context plates.

Work in the phases in kap-reel-kickoff.md. Stop at every gate marked STOP and show me the
artifact named there before continuing. Do not run ahead to the next phase because the current
one looks fine to you.

Two standing rules for this repo:
1. No em dashes in any file you write, any on-screen text, any caption, or any post copy.
2. Never add a project to the reel that is not in config/projects.json with
   cleared_for_public_showcase true.

Start with Phase 0. Tell me exactly what you need from me before you can proceed.
```

---

## What Claude Code needs from me

It cannot start Phase 1 without these. Expect it to ask.

| Input | Where it goes | Notes |
|---|---|---|
| `ELEVENLABS_API_KEY` | `.env` | Music, SFX, Image & Video |
| Approved project list | `config/projects.json` | Schema is in Section 1 of the spec. This is the blocking gate |
| K&A logo | `assets/brand/` | SVG preferred, plus a transparent PNG at 2400px |
| Brand palette and fonts | `config/brand.json` | Hex values, font files from Envato Elements |
| Business phone and URL | `config/brand.json` | 904-210-1071, ka-performancefl.com |

Envato assets can be fetched mid-build. Claude Code should tell me the exact item type it needs rather than guessing, and I download and drop it in `assets/brand/`.

---

## Phase plan

The order is deliberate: prove the pipeline end to end on ugly placeholders before spending any time or credits on polish. A rough render on day one is worth more than a beautiful hero shot with no timeline behind it.

### Phase 0. Scaffold and gate check
- Read the spec. List every input you need from me.
- Scaffold the Remotion project, install dependencies, verify `npx remotion studio` opens.
- Create `config/projects.json` as an empty template for me to fill in.

**STOP.** Show me the input list and the empty template. Do not proceed until I have filled in the project manifest.

### Phase 1. Capture
- Build `scripts/capture.ts` per Section 4.
- Capture every approved project at both viewports, plus the interaction beats.
- Build `captures.json`.

**STOP.** Show me one still frame per project per viewport. I am checking for cookie banners, chat bubbles, half-loaded hero images, and wrong scroll positions. Fix and recapture before moving on.

### Phase 2. Grey render
- Build the full 15 second timeline with real captures and grey placeholder rectangles where the context plates will go. Placeholder text, no music, no plates.
- Render `out/greyrender.mp4`.

**STOP.** Show me the grey render. This is the most important gate in the build. We are checking pacing, cut points, and whether the structure works at all. Everything after this is decoration and should not start until the skeleton is right.

### Phase 3. Text and safe zones
- Real on-screen copy per Section 7. Kinetic text, project names, claim chips.
- Build the safe zone debug overlay composition and render all four aspect ratios with it on.

**STOP.** Show me the four debug overlay stills plus a vertical render with real text. Checking legibility at phone size and nothing intruding into reserved zones.

### Phase 4. Context plates
- Generate the plate set per Section 4b. Stills only, one session, shared style reference.
- Find the screen quads, build the five-layer composite.
- Render one full-size still per composite.

**STOP.** Show me every composite still at full size before any of them enter the timeline. Reject and regenerate rather than accepting a plate with an artifact. Budget for throwing most candidates away.

### Phase 5. Audio
- Confirm commercial rights on the current ElevenLabs plan, write `LICENSING.md`.
- Generate three music variants, 20 seconds, no long intro ramp.
- Layer SFX, mix to spec.

**STOP.** Give me the three music options as audio files against the current picture lock. I pick one.

### Phase 6. Final renders and copy
- Render all five MP4s per Section 11.
- Generate SRT files, thumbnails, and the six carousel stills.
- Draft Facebook and LinkedIn post copy to `out/post-copy.md`.
- Complete `LICENSING.md`.
- Run the full acceptance checklist in Section 14 and report each item pass or fail.

**STOP.** Deliver everything. Do not post anything anywhere. I review the copy and publish myself.

---

## How I want you to work

- Iterate with `npx remotion still` on single frames. Do not do a full render to check a text position.
- One phase per session where possible. Commit at every gate so a bad direction costs one phase, not the build.
- If something in the spec is wrong once you are in the code, say so and propose the change. Do not silently work around it and do not follow it off a cliff.
- If a phase reveals that a project is weak material for a 3.2 second beat, tell me. Cutting to two strong projects beats padding with three where one is thin.
- Tell me the credit spend on ElevenLabs as you go.

## Definition of done

Five MP4s, matching SRT files, two thumbnails, six stills, post copy for both platforms, a complete licensing record, and every item in Section 14 passing. Nothing published.
