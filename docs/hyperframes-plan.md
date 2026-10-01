# HyperFrames in the social and YouTube pipeline: assessment and plan

Written 2026-10-01 in answer to the HyperFrames handoff. Nothing has been installed and nothing
in the pipeline has changed. This is the plan to approve or change.

Approved: yes, the pilot (Alex, in chat 2026-10-01: "approve and I'm just trying to add
capability for future work not change what we've done"). The pilot ran the same day; results
are in section 8. Nothing already built or scheduled was changed.

## Bottom line

**Add HyperFrames next to Remotion for three specific jobs. Do not move the existing video work
onto it.**

The pipeline already renders video from code. Every reel and all three long YouTube videos are
built in Remotion (React), with a shared branded component set, captions, a capture pipeline and
loudness checks. HyperFrames does the same job from plain HTML and CSS. It does not unlock video
we cannot make today. What it does offer is a shorter path for work that already starts as HTML,
for edited real footage, and for templates that re-render from a data file.

The three jobs, in order:

1. **Animate the carousels.** Every carousel is already an HTML page. Today its Facebook video is
   a plain slide show. HyperFrames can turn the same HTML into a video with motion.
2. **Client templates that fill from data.** Fore Motion's leaderboard update and "founders
   remaining" Stories are the model: one design, new numbers each week, rendered in a batch.
3. **Captions and recuts for real footage.** Fore Motion's two walkthrough videos need labeled,
   captioned, branded cuts. The pipeline has no path for that today.

## 1. What the pipeline makes today (audit)

| Output | How it is built | Count so far |
|---|---|---|
| Reels and YouTube Shorts, 9:16, 21 to 24 s, text-led, music bed, no narration | Remotion, one entry per post in `D:\kap-reel\src\social\<folder>` | 32 reels |
| Carousels, 4:5, 7 to 8 slides | An HTML page per carousel (`source/slides.html`), rendered to JPG with Playwright | 31 |
| Facebook slide video for each carousel, 1080x1350, 22 s | `tools/slideshow.mjs`: the JPGs crossfaded by ffmpeg over a music bed | 31 |
| LinkedIn documents | The carousel JPGs sent as a PDF | one per weekday |
| Long YouTube videos, 16:9, 7 to 8 min, narrated | Remotion, shared set in `src\youtube` (frame, lower thirds, chapter cards, key overlay, end screen), Playwright screen captures, ElevenLabs voice and music | L1, L2, L3 |
| Stories | Paused | none |

Skipped today because it costs too much to make: edited real footage, client site tours beyond
the one Thrillers launch, anything driven by weekly numbers, and Stories.

A day of posts (reel, carousel, LinkedIn document, Short) takes one builder agent 18 to 29
minutes of wall time. The machine is not the limit; authoring and review are.

## 2. What HyperFrames is, checked against its own docs

Verified in the repository and docs on 2026-10-01:

- Apache 2.0 license. No seats, no render credits. Renders locally.
- Needs Node.js 22 or newer and FFmpeg. It drives headless Chrome through Puppeteer.
- A composition is an HTML file. The root carries `data-composition-id`, `data-width` and
  `data-height`. Timed elements carry `data-start`, `data-duration` and `data-track-index`.
  Animation must be seekable: GSAP, CSS keyframes, Lottie, Three.js, Anime.js or WAAPI.
- Frame rate defaults to 30. The default output is MP4 at 1920x1080.
- CLI: `init`, `preview`, `render`, `lint`, `transcribe`, `tts`, `doctor`, `benchmark`.
  `render` takes `--resolution` presets (landscape, portrait, square, landscape-4k),
  `--workers` 1 to 24, `--gpu` for hardware encoding, `--variables`, `--variables-file` and
  `--batch`.
- Variables are declared on the root and can be overridden at render time. `--batch rows.json`
  renders one output per data row. Variables cannot change the viewport size, the duration, the
  frame rate or the output format.
- Transcription runs locally through Whisper or Parakeet and gives word-level timestamps. The
  built-in `tts` command uses a local model (Kokoro).
- Skills in the repository: `/hyperframes` (router), `product-launch-video`,
  `faceless-explainer`, `pr-to-video`, `embedded-captions`, `talking-head-recut`,
  `motion-graphics`, `music-to-video`, `slideshow`, `general-video`, `remotion-to-hyperframes`,
  `website-to-hyperframes`, plus domain skills for core, animation, keyframes, CLI, audio and
  media.
- HyperFrames' own comparison page says Remotion "is older and much more established" and that
  teams already writing React should stay on it. It also ships a porting skill that it says
  translates "roughly 80% of a typical composition" mechanically.

Not stated in the docs, so not assumed here: any limit or guidance for long videos, Windows
notes, render speed per minute of video, and whether one project can output several aspect
ratios. One benchmark is given: 300 frames at 1080p in 9.8 to 25 seconds.

Two corrections to the handoff: the site tour skill is named `website-to-hyperframes`, and the
docs also offer a plugin install (`claude plugin install hyperframes@hyperframes`) alongside
`npx skills add`.

## 3. Answers to the eight questions

### 3.1 Where it fits, ranked by value against effort

| Rank | Content type | Value | Effort | Verdict |
|---|---|---|---|---|
| 1 | Animated carousel video (replaces the plain Facebook slide video, and gives Instagram a Reel version) | High: 31 made so far, one more every post day | Low: the HTML already exists | Do it. This is the pilot. |
| 2 | Data-filled client templates (Fore Motion leaderboard update, founders remaining, pilot "spots left", monthly results cards) | High for client work | Low to medium: one design, a JSON file, a batch render | Do it second. |
| 3 | Captioned, labeled cuts of real footage (`embedded-captions`, `talking-head-recut`) | Medium now, growing with clients | Medium | Do it third. Fore Motion's walkthroughs are the first case. |
| 4 | Client site spotlight or launch reel (`website-to-hyperframes`) | Medium | Medium: a gated seven-step flow, and only for cleared clients | Try once after the pilot. |
| 5 | New text-led reels | Low: Remotion already does these well | Medium: port the templates | Leave on Remotion. |
| 6 | YouTube inserts: chapter cards, lower thirds, end screens | None: they exist and are approved | Medium | Leave on Remotion. |
| 7 | Full narrated explainers (`faceless-explainer`) | Low, and it conflicts with a standing rule | Medium | Do not use as shipped. See below. |

`faceless-explainer` invents a visual for each scene. The standing rule is real sites, real
screens and real numbers, with anything drawn labeled as drawn. Its output would need the same
labels and the same source folder, at which point it is our current process with a different
renderer.

### 3.2 YouTube

- **Long-form:** technically possible, since the docs set no length limit. They also give no
  guidance for it. A 7.5 minute video at 30 fps is about 13,500 frames, captured one at a time.
  The L-series already works in Remotion with an approved theme system, and moving it buys
  nothing. Keep long-form on Remotion.
- **Shorts:** yes. A Short is the reel file today. An animated carousel adds a second kind of
  Short at no extra authoring cost.
- **Intros, chapter cards, lower thirds, B-roll inserts:** it can make them, and they already
  exist in the shared Remotion set. No reason to rebuild.
- **Where it would break down:** long narrated videos timed to voice across dozens of screen
  captures. That needs the capture, staging and mix scripts the L-series already has.

### 3.3 Repurposing one source to 16:9, 9:16 and 1:1

Not from a single composition. The viewport is fixed on the root element, and variables cannot
change it. The structure that works:

- One root composition per aspect ratio, each with its own `data-width` and `data-height`.
- Scenes written once as nested compositions and shared by all roots.
- Layout in CSS that adapts to the container, so text-led scenes reflow. Scenes built around a
  screen capture need a crop per ratio.

That is the same cost as in Remotion. Our formats are 9:16 (reels, Shorts, Stories), 4:5
(carousels and their video) and 16:9 (long YouTube). 4:5 is not a preset, so the root sets
1080x1350 directly. That needs confirming in the pilot.

### 3.4 Pipeline shape and approval gates

```
weekly plan (Alex approves)            GATE 1
  -> build brief
  -> source: carousel HTML, client data file, footage, or a cleared client URL
  -> script and beats in brief.md
  -> ElevenLabs: music bed always; voice only for long YouTube
  -> composition (HTML) in the HyperFrames project
  -> hyperframes lint, then render
  -> QA: contact sheet, contrast, loudness at -14 LUFS, validate
  -> Post Desk (Alex approves each post)  GATE 2
  -> upload to R2, release, Metricool
```

Rendered files land where they do today: `To Be Released/<folder>/media/`, listed in
`post.json`. The Metricool step does not change. One small tools change is needed: `validate`
accepts media origins `human`, `codex`, `elevenlabs` and `kap-reel` only, so `hyperframes` has
to be added with a test.

Voice: ElevenLabs stays the voice and music source, as the handoff asks. The narration file is
generated first, transcribed for word timings, and the composition times its beats to it.
HyperFrames' built-in voice is not used.

### 3.5 Templates worth building

Each is one branded composition with variables, so a copy or brand change regenerates every
output.

1. **Carousel to video.** Takes a carousel's slides and animates them. Used on every post day.
2. **Numbered list reel.** Hook, three to five numbered beats, call to action. This is the shape
   of most reels already.
3. **Client leaderboard or counter update.** Names and numbers from a JSON file. Fore Motion's
   leaderboard and founders-remaining Stories are the first two.
4. **Client site spotlight.** Real captures of a cleared client site, with the K&A brand row.
5. **Before and after.** Two captures and a wipe, for site rebuilds.
6. **Captioned footage.** Real video with burned-in captions, a "Concept" label slot and the
   client's logo.
7. **Monthly results card.** For pilot clients' reports, filled from the month's numbers.

A brand base sits under all of them: logo and URL on every frame, licensed fonts loaded from
local files, safe areas, and the computed contrast check.

### 3.6 Instagram Edits and trending audio

That work has not started. Its handoff file is untracked and nothing is built.

- **Trending audio cannot be baked into a rendered file.** It is licensed inside Instagram and
  attached when the post is scheduled, through Metricool's audio setting, on Reels only. A
  video that will carry it must be rendered silent or with a quiet bed, and flagged so the two
  never play together.
- **`music-to-video` cannot use a trending track as its source.** It cuts to a file we supply.
  We have no licensed file of a platform track. It works with our own ElevenLabs music.
- **Edits is a phone app with no API.** HyperFrames does not replace it and does not feed it
  without a person in the middle.
- **No overlap otherwise.** HyperFrames is the renderer. The audio work is a scheduling-time
  step. The one shared rule: a post.json field that says whether music is already in the file.

### 3.7 Render environment

| Need | This machine | Status |
|---|---|---|
| Node.js 22 or newer | 24.12 | OK |
| FFmpeg and ffprobe | 8.1 | OK |
| Headless Chrome | Puppeteer downloads its own on install, about 200 to 300 MB | OK |
| CPU for parallel capture | 20 cores | OK, room for `--workers` near 20 |
| Memory | 63 GB | OK |
| GPU for encoding | RTX 5080 | OK, `--gpu` can use NVENC |
| Disk | C: 147 GB free, D: 1,421 GB free | OK |

Render time is an estimate until measured. The docs' one benchmark is 10 seconds of 1080p
video in 9.8 to 25 seconds. An outside review measured 35 to 50 seconds for the same length on
an M2 Pro laptop. So expect roughly one to five times real time: a 22 second video in about
half a minute to two minutes, a 7.5 minute video in 8 to 40 minutes. `hyperframes benchmark` gives
this machine's real number, and the pilot runs it.

**Two things to settle before installing:**

1. **The ampersand in the repo path.** `npx` fails inside `D:\K & A Performance Site`. That is
   why the Remotion work lives at `D:\kap-reel`. The HyperFrames project needs its own folder
   outside that path, for example `D:\kap-hf`, and the install has to run from a path without
   an ampersand.
2. **Where the skills load.** Skills load for the folder a session runs in. Installing the whole
   set adds about twenty slash commands to every session here, beside the ones already loaded.
   Install only the ones the three jobs need.

The docs say nothing specific about Windows. `hyperframes doctor` is the first command of the
pilot, and its output decides whether anything else runs.

### 3.8 Risks

- **Two renderers to maintain.** Brand rules live in two places unless the base is kept small.
  This is the real cost of adding it.
- **A young project.** HyperFrames is months old and moves weekly. Pin a version and do not
  update mid-week.
- **Third-party skills.** They are instructions written by someone else. Read them before use,
  and keep our rules (plan first, real sources, labels, no vendor names, no em dashes) above
  theirs.
- **Music.** Use only ElevenLabs tracks under our plan, logged as today, with the 30-day
  no-repeat rule. Do not use a HyperFrames music generator.
- **Fonts.** Our licensed fonts load from local files. Confirm each license covers video.
- **GSAP.** The animation library has its own license. Since Webflow acquired it, GSAP and all
  its plugins are free, including for commercial work. Read the standard license once before
  the first client video.
- **Speed on one machine.** An outside review calls HyperFrames' single-machine render speed
  "not competitive" with Remotion, and says of long videos, "technically yes; practically no
  one would". That matches keeping long-form where it is.
- **Quality ceiling.** Code-rendered motion is clean and consistent, and it is not a hand
  edit. Real footage still needs a person's eye on cuts and pacing.
- **Remotion licensing, for context.** Remotion is free for companies of up to three people.
  K&A qualifies. If the team grows past three, that becomes a paid license and the balance
  between the two tools shifts.
- **A different approach is better for part of this.** For everything Remotion already does
  here, Remotion is the better choice. That is HyperFrames' own advice for teams with working
  React compositions.

## 4. Recommended pilot

**One video, one format: an animated version of the Tuesday Oct 20 carousel, "What your contact
page owes a visitor".**

Why this one:
- The HTML exists (`To Be Released/2026-10-20-2/source/slides.html`), and so does the plain
  slide video it would replace (1080x1350, 22 seconds). That gives a direct side by side.
- It is already approved and scheduled, so the pilot touches nothing live. The new file sits
  beside the old one.
- It tests the highest-value job, the 4:5 custom size, the brand base and the render time, all
  in one small video.

Steps:
1. Create `D:\kap-hf`. Run `hyperframes doctor` and `hyperframes benchmark` there. Stop if
   doctor fails.
2. Install only the needed skills: the router, core, CLI, animation and slideshow.
3. Build the brand base, then the carousel composition from the existing slides, with the
   existing music track `music-w1020-c`.
4. Lint, render, and run the usual QA: contact sheet, contrast, loudness.
5. Report: authoring time, render time, the side by side, and anything that broke.

Not part of the pilot: scheduling it. If you prefer the animated version, it goes back on the
Post Desk for a fresh approval and then replaces the scheduled Facebook video.

**Effort:** about half a day.

## 5. Effort to productionize after the pilot

| Piece | Effort |
|---|---|
| `hyperframes` media origin in the tools, with tests | 1 to 2 hours |
| Brand base composition (logo row, URL, fonts, safe areas, contrast check) | half a day |
| Carousel-to-video template wired into the day build | half a day |
| Data-filled client template with batch render (Fore Motion first) | half a day |
| Captioned footage flow (transcribe, captions, labels) | half a day |
| README, build brief and client README updates | 2 hours |

About two and a half working days in total, done in that order, each piece usable on its own.

## 6. What needs your approval

1. The pilot as described in section 4.
2. A new folder `D:\kap-hf` and the HyperFrames install there, including its Chrome download.
3. Which skills to install. The plan assumes five for the pilot, not the full set.
4. Which clients are cleared for public use in site spotlights and footage cuts.
5. After the pilot: whether the animated carousel replaces the plain slide video going forward.

## 8. Pilot results (2026-10-01)

**It works on this machine, and it is installed as a second tool beside Remotion.**

| Measure | Result |
|---|---|
| Install | `hyperframes` 0.8.105, pinned, in `D:\kap-hf`. Five skills, in that folder only. |
| Environment check | Passes on Node, FFmpeg, Chrome, CPU, memory, disk |
| Output | 1080x1350, 30 fps, 26.0 s, H.264 and AAC, 5.2 MB |
| Render time | 25.3 s for the 26 s video, about real time. Benchmark best: 23.4 s |
| Checks | Lint 0 errors. Contrast 54 of 54 text checks pass. Layout 0 errors |
| Loudness after the delivery pass | -14.2 LUFS, peak -1.1 dBFS |
| Wall time, install to delivered file | About ten minutes |

What the pilot is: the Tuesday Oct 20 carousel as one continuous Rolodex. Each card writes
itself in, the check or cross draws, the evidence slides up, and the card tips back into the
base to reveal the next one. The logo and URL sit on every frame. A progress row replaces the
carousel's swipe cues, which make no sense in a video. Copy is verbatim from the approved
carousel.

Files, in `D:\kap-hf\projects\carousel-2026-10-20-2\renders\`:
- `animated.mp4`: the pilot video
- `side-by-side.mp4`: the current slide video next to it
- `contact-sheet.jpg`: a frame every half second

It is not scheduled. The Oct 20 post still carries the original slide video.

**What went wrong, and what it says about the tool**

- The first card flip tipped toward the camera and ballooned across the frame. The snapshot
  step caught it before any render. That step is worth keeping in the flow.
- npm listed a version published two minutes earlier whose download did not exist yet. The
  project shipped eight releases that day. Pinning is not optional.
- The render does not normalize loudness. It needs the same delivery pass as everything else.
- The scaffold loads its animation library from a CDN. The pilot uses a local copy.
- Usage telemetry is on by default. It is now off.
- Lint wants every scene in its own file, and the layout check flags the card tabs. Both are
  housekeeping for the reusable template, not faults in the video.

**Differences from the plain slide video to weigh**

- 26 seconds instead of 22, because animated entrances need reading time after them.
- It no longer shows "Swipe for card 2". For Facebook that is a fix.

**Corrections to this plan from the pilot**

- The fifth skill installed is `general-video`, not `slideshow`. `slideshow` turned out to be
  for live presentation decks.
- 4:5 works by setting the size on the root. Confirmed.
- Render speed on this machine is about real time, at the fast end of the estimate.

**Still to do, only if you want this in regular use (section 5)**

The `hyperframes` media origin in the tools, the shared brand base, and turning this one-off
into a carousel-to-video template. None of that is started.

## 7. Sources

- HyperFrames repository: https://github.com/heygen-com/hyperframes
- Docs index: https://hyperframes.heygen.com/llms.txt
- CLI reference: https://hyperframes.heygen.com/packages/cli
- Compositions: https://hyperframes.heygen.com/concepts/compositions
- Variables and batch rendering: https://hyperframes.heygen.com/concepts/variables
- Rendering and output: https://hyperframes.heygen.com/prompting/rendering-and-output
- Performance: https://hyperframes.heygen.com/guides/performance
- Voice, audio and captions: https://hyperframes.heygen.com/guides/voice-and-audio
- HyperFrames or Remotion: https://hyperframes.heygen.com/guides/hyperframes-vs-remotion
- Outside review with a render timing: https://andrew.ooo/posts/hyperframes-heygen-html-video-agents-review/
- GSAP license change: https://webflow.com/updates/gsap-becomes-free and https://gsap.com/community/standard-license/
