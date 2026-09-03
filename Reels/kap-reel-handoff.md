# Claude Code Handoff: K&A Performance Web Design Showcase Reel

**Owner:** Alex Anderson, K&A Performance LLC
**Deliverable:** Short-form video showcasing recent custom web design work, for Facebook business page and LinkedIn company page. Two cuts: a 15 second vertical master and a 45 second LinkedIn cut, from one shared codebase.
**Status:** Ready to build once the Clearance Gate (Section 1) is signed off

---

## 0. Read this first

You are building a real video file, not a description of one. The final output is a rendered MP4 on disk in four aspect ratios, plus caption files, a thumbnail, and post copy.

The video content is **real screen capture of real live websites**, composited and animated. Do not use generic stock footage of laptops on desks, hands typing, or coffee shop coding. The entire persuasive value of this post is that a viewer can go type the URL and see the real thing.

AI generated visuals from ElevenLabs Image & Video are available and permitted, but only in the scoped roles defined in Section 9b. They never stand in for a website, a client's premises, a product, or a person.

Hard rules:
- No em dashes anywhere in on-screen text, captions, post copy, or any written output. This is a locked style rule for this client.
- No footage or screenshots of any site not listed in the approved manifest (Section 1).
- No fabricated metrics. Every number on screen must be measured and reproducible.
- No client logos, names, or testimonials that are not in the approved manifest.

---

## 1. Clearance Gate (blocking)

Before writing any code, read `config/projects.json`. If it does not exist, stop and ask the owner to fill it in. Do not guess at which projects to feature.

Create the file with this shape:

```json
{
  "approved": [
    {
      "id": "fore-motion-golf",
      "display_name": "Fore Motion Golf",
      "url": "https://foremotiongolf.com",
      "cleared_for_public_showcase": true,
      "credit_allowed": true,
      "one_liner": "Indoor golf club. Booking, memberships, and payments built in.",
      "proof_points": [
        "Custom membership tiers with hour banking",
        "Stripe checkout on the client's own account",
        "Built-in leaderboard game for pre-launch email capture"
      ],
      "capture_routes": ["/", "/memberships", "/book"]
    }
  ],
  "excluded_do_not_show": [
    "Any site built under a white-label or silent-partner agreement",
    "Any former client where the engagement ended",
    "Any prospect or spec demo that never became a paying client"
  ]
}
```

Target three to four approved projects. Two is workable. One is not enough for a showcase reel and you should tell the owner so rather than padding with filler.

If a site is not yet publicly live, it does not go in the reel.

---

## 2. Stack

| Layer | Tool | Why |
|---|---|---|
| Site capture | Playwright (Chromium, headless) | Deterministic scripted scrolls at exact viewports, repeatable |
| Composition and animation | Remotion (React + TypeScript) | Code-defined video, renders identical output every run, one timeline exports every aspect ratio |
| Encode and crop | FFmpeg | Platform-specific encodes and safe-zone crops |
| Music, SFX, generated stills | ElevenLabs (Eleven Music, SFX, Image & Video) | Music bed, sound design, and the AI generated context plates and backplates. Use the image models, not the video models, for the reasons in Section 4b. Image & Video wraps third-party models with per-generation credit costs that vary widely, and as of mid-2026 video generation was still flagged beta on paid plans. Check the account's current tier, model access, and credit balance before designing any shot around it. |
| Fonts, device frames, backup music | Envato Elements (owner's subscription) | Licensed assets, and the fallback for both music (if ElevenLabs commercial terms do not cover this use) and context plates (if the generated set will not come out clean) |

Install:

```bash
npm create video@latest kap-reel -- --template blank-typescript
cd kap-reel
npm i @remotion/media-utils @remotion/transitions @remotion/google-fonts zod
npm i -D playwright
npx playwright install chromium
```

Remotion renders headlessly. Use `npx remotion still` to check individual frames while iterating instead of rendering the full video every time. Full renders are the last step, not the debug loop.

---

## 3. Project structure

```
kap-reel/
  config/
    projects.json          # approved manifest, owner-supplied
    brand.json             # colors, fonts, logo paths, contact info
  scripts/
    capture.ts             # Playwright site recordings
    measure.ts             # Lighthouse runs, produces metrics.json
    audio.ts               # ElevenLabs music + SFX generation
    encode.sh              # FFmpeg passes for each platform
  assets/
    captures/              # webm/mp4 out of Playwright, gitignored
    plates/                # owner-shot human context footage, permanent studio assets
    audio/                 # generated tracks, gitignored
    brand/                 # logo SVG/PNG, licensed fonts, device frames
  src/
    Root.tsx               # composition registrations
    Reel.tsx               # master timeline
    scenes/
      Hook.tsx
      ProjectShowcase.tsx
      CapabilityMontage.tsx
      CallToAction.tsx
    components/
      DeviceFrame.tsx
      KineticText.tsx
      StatChip.tsx
      Captions.tsx
    lib/
      layout.ts            # safe zones per platform
      timing.ts            # beat map
  out/                     # final deliverables
```

---

## 4. Capture (scripts/capture.ts)

For each approved project, for each `capture_routes` entry:

1. Launch Chromium at device scale factor 2.
2. Two viewport passes:
   - Mobile: 390 x 844
   - Desktop: 1440 x 900
3. Navigate, wait for `networkidle`, then wait an additional 800ms for fonts and hero animations to settle.
4. Dismiss cookie banners, chat bubbles, and any modal before recording. Take a still first and check it. A cookie banner in the hero shot kills the whole shot.
5. Record a smooth scripted scroll using `requestAnimationFrame` easing, not `scrollIntoView` jumps. Target 6 seconds of scroll covering hero through the first two content sections, at 60fps.
6. For interaction beats, record short clips: opening a booking calendar, a Stripe test checkout, an AI chat widget responding, an admin panel edit. Three seconds each is plenty.
7. Output to `assets/captures/{project_id}-{route}-{viewport}.webm`, then transcode to MP4 H.264 for Remotion.

Save a `captures.json` index with duration and dimensions per clip so the composition can reference clips by ID rather than hardcoded paths.

---

## 4b. Context plates (AI generated stills, real site composited)

The reel alternates between a human context shot and a clean straight-on capture. The context shots are AI generated via ElevenLabs Image & Video. The screen content in every one of them is a real capture of a real site from Section 4, composited in. Nothing about the website is generated.

### Generate stills, not video

Use the **image** models, not the video models. This is the load-bearing decision in this section.

Generated video has no frame-to-frame geometric stability. The laptop lid drifts, the phone rotates a few degrees, the screen quad breathes. Corner-pinning a site capture onto a moving quad requires per-frame motion tracking, which is not something this pipeline does. A generated still gives you one fixed four-corner quad, forever. It also costs a small fraction of the credits, so you can generate thirty candidates and pick three instead of nursing two expensive video generations.

The motion comes from Remotion, applied to the composite:
- A slow scale ramp, 2 to 4 percent over the shot. Not more. More reads as a Ken Burns slideshow.
- A low-amplitude drift on X and Y driven by a noise function, roughly 3 to 6 pixels, to simulate a handheld operator.
- The site capture scrolling inside the screen quad. This is the real motion and it is what sells the shot as footage.

A dead-static composite reads as a product mockup. A composite with a hint of camera life reads as a filmed plate.

### Prompting

Generate all plates in one session with a shared style reference so the three shots read as one shoot rather than three stock photos. Use the start frame and style reference support to hold lighting, color temperature, and room consistent across the set.

Ask explicitly for the screen to be **off, dark, or a solid flat color.** The models will otherwise render a gibberish interface, and while you are covering that region anyway, a dark screen gives cleaner edges and a usable glow to sample.

Prompt for framing that avoids the tells:
- No faces. Shoot from behind the shoulder, or crop above the shoulder line, or frame hands only.
- Hands relaxed and partially out of frame or partially occluded by the device. Fingers spread flat near a screen edge is where hand artifacts live.
- Shallow depth of field with the human soft and the screen sharp. This hides generation artifacts and points the eye at the work, which is the point of the shot.
- Neutral, uncluttered environment. Window light. No overhead fluorescent look.

Reject any candidate with a visible face, a sixth finger, warped device geometry, or text anywhere in frame. Generate more rather than trying to fix one in post.

### Plate set

Generate one plate per device type so the reel does not repeat a setup:

| ID | Description |
|---|---|
| `plate-laptop-shoulder` | Over the shoulder from behind, laptop open on a desk, screen in the upper third of frame |
| `plate-phone-hands` | Hands holding a phone, slightly angled, no face, thumb near the screen edge |
| `plate-ipad-lap` | Tablet propped or held at waist level, off axis, one hand at the frame edge |
| `plate-desktop-wide` | Large monitor as the bright anchor of a wider room, person at the edge of frame or absent |
| `plate-handoff` | Two people, one turning a laptop toward the other, both seen from behind or cropped above the shoulders |

`plate-handoff` is the strongest shot for a services ad because it depicts the actual sale, showing someone the work. It is also the hardest to generate without a face problem. Budget extra candidates for it and drop it without hesitation if none are clean.

### Compositing pipeline

Write `scripts/plates.ts` to build a `plates.json` index recording, per plate: the image path, the generating model, the prompt, and the four screen-corner coordinates in pixels.

Corner coordinates are found once per plate, by hand or by a small helper script, and never change. That is the entire advantage of using stills.

Composite in Remotion in this layer order:
1. The generated plate as the base image.
2. The site capture from Section 4, transformed into the screen quad with a `matrix3d` CSS transform derived from the four corner points. The quad must fully cover the generated screen region with a pixel or two of overlap, so no generated screen content survives at the edges.
3. A soft inner shadow or vignette at the screen border, so the composite is seated in the device rather than pasted on it.
4. A screen glow spill onto the surrounding bezel and the nearest hand or surface, sampled from the plate's own color, at low opacity.
5. Any reflection or glare highlight that existed in the plate, blended back on top at 10 to 25 percent.

Skip layers 3 through 5 and the site will float above the device like a sticker. This is the difference between a convincing plate and an obvious one, and it is worth more iteration time than the generation step itself.

Render a still of every composite and inspect it at full size before putting any of them in the timeline.

### Disclosure

Meta detects C2PA and IPTC provenance metadata and may automatically apply an AI info label to the post, and Meta's policy asks people to disclose photorealistic AI generated video themselves. Assume the label appears and do not treat it as a failure.

Two consequences for this build:
- Do not strip provenance metadata from the generated assets to avoid the label. That is the one move here that turns a defensible creative choice into a bad one.
- The site captures, the claims, and the metrics are all real, so the label costs nothing. If anything, put a plain line in the post copy: the visuals are AI assisted, the websites are real, go look at them. Owning it in your own words beats having a platform label be the first thing a viewer learns about the video.

Store plates and their composites in `assets/plates/`. They are reusable studio assets for future reels and proposals.

---

## 5. Metrics (scripts/measure.ts)

Any number that appears on screen gets measured here and written to `metrics.json`. Run Lighthouse against each approved URL and record performance score, LCP, and accessibility score.

Only surface a metric if it is genuinely strong. A 74 performance score does not go on screen. If a site does not have a number worth showing, that project gets a capability claim instead of a stat.

Claims that are safe because they are structural, not measured:
- "Custom code, no page builder"
- "Booking and payments built in"
- "Client owns the domain and the code"
- "Built to WCAG 2.1 AA"

Only use the WCAG claim on sites that have actually been audited. If none have, use "Accessibility built in from the start."

---

## 6. Timeline: vertical master (9:16, 15 seconds, 30fps)

450 frames total. Cut on the beat. Every scene transition should land on a musical accent.

Fifteen seconds is a hard constraint and it is unforgiving. Three projects plus a hook plus a CTA means roughly 3.2 seconds per project. That is enough for a device scroll, a project name, and exactly one claim. It is not enough for two stat chips, a second text line, or a leisurely transition. Cut ruthlessly and do not try to fit more in by shortening hold times below the minimums in Section 7.

| Frames | Time | Scene | Content |
|---|---|---|---|
| 0-36 | 0.0-1.2s | Hook | Hard cut in on a mobile site scrolling at speed. One kinetic line slams in: "Custom built. Not a template." No logo yet. No fade in. The first frame must already be moving. |
| 36-132 | 1.2-4.4s | Project 1 | Device frame slides in with the mobile capture playing. Project name lower third. One stat chip, in by frame 60 and held to the cut. |
| 132-228 | 4.4-7.6s | Project 2 | Whip transition. Same structure, different accent color from the brand palette. |
| 228-324 | 7.6-10.8s | Project 3 | Same structure. If only two projects cleared, give each project 4.8s instead and keep everything else identical. |
| 324-384 | 10.8-12.8s | Capability montage | Four cuts at 15 frames each: booking calendar opening, Stripe checkout completing, AI chat responding, admin panel text edit. One word per cut: "Booking" / "Payments" / "AI" / "Yours to edit" |
| 384-450 | 12.8-15.0s | Call to action | Logo settles center. "K&A Performance" and "ka-performancefl.com" appear together, not sequentially. Phone number under it. Hold the finished card for a minimum of 36 frames so a screenshot of the end frame is readable. |

Drop from the 15 second cut, and do not try to sneak them back in: the "Gainesville, FL" line (put it in the post copy instead), the Lighthouse score dial, and any sequential reveal of more than two text elements in one scene.

### 6b. Shot structure inside each project beat

Each 96-frame project beat splits into two shots. This is what makes the human plates work without costing legibility.

| Frames (relative) | Length | Shot |
|---|---|---|
| 0-24 | 0.8s | Human plate from Section 4b. Real person, real device, site visible on screen but not expected to be readable. Project name types on during this shot. |
| 24-96 | 2.4s | Hard cut to the clean capture. Device frame or full-bleed, straight on, site scrolling. The one claim chip appears here. This is the shot that has to be readable. |

Rules for this structure:
- Rotate the plate per project. Laptop for one, phone for the next, iPad for the third. Repeating the same plate three times makes it obvious there was one shoot day.
- Cut on the scroll. Match the scroll direction and rough velocity between the plate and the clean capture so the cut feels like a camera move rather than a jump.
- No text lives only on a human plate. If the viewer blinks through the 0.8s, they must lose nothing.
- If a plate is weak, drop it and give the project the full 3.2 seconds of clean capture. A missing plate costs warmth. A bad plate costs credibility, and a generated plate with a visible artifact costs more than either.
- Keep every plate shot at or under 24 frames. The shorter a generated image is on screen, the less time a viewer has to interrogate it, and 0.8 seconds is enough to register "a person is using this" without inviting a second look.

### Timeline: LinkedIn cut (45 seconds)

Same composition, `durationInFrames` extended, with these inserts:
- After the hook, a 4 second "how we work" beat: real person, direct number, no ticket queue.
- Per project, extend to 7 seconds and add one line of context on what the business needed.
- Add a 5 second accessibility beat before the CTA. This is a differentiator on LinkedIn in a way it is not on Facebook.
- CTA closes on "Taking new projects" rather than a hard sales line.

Register both as separate Remotion compositions sharing scene components. Do not fork the codebase.

---

## 7. On-screen text

Every text element must be readable with sound off, on a phone, in one pass. Rules:

- Minimum type size 48px at 1080 width for body, 96px+ for hook lines.
- Maximum 6 words per text card in the vertical cut.
- Type on, hold, cut. No slow crossfades. Hold time minimum 24 frames per line.
- No em dashes. Use periods and line breaks.
- Contrast ratio 4.5:1 minimum against whatever is behind it. If a capture is busy, put a scrim behind the text, not a drop shadow.

Copy bank for the hook, pick one and stick with it:
- "Custom built. Not a template."
- "Real sites. Real businesses. Built from scratch."
- "This is not Squarespace."

Avoid the last one if any approved client is currently on a platform you are naming.

---

## 8. Safe zones (src/lib/layout.ts)

Facebook Reels and LinkedIn vertical both overlay UI. Keep all text and the logo inside the safe area.

| Format | Canvas | Top reserved | Bottom reserved | Right reserved |
|---|---|---|---|---|
| Vertical (Reels, LinkedIn vertical) | 1080 x 1920 | 15% | 20% | 10% |
| Feed vertical | 1080 x 1350 | 8% | 8% | 5% |
| Square | 1080 x 1080 | 5% | 5% | 5% |
| Landscape (LinkedIn desktop) | 1920 x 1080 | 5% | 8% | 5% |

Build the crops as separate Remotion compositions with a shared scene tree and a `format` prop, not as an FFmpeg center crop of the vertical master. A center crop will decapitate your text.

Render a debug overlay composition that draws the reserved zones in red so you can visually verify before final render.

---

## 9. Audio (scripts/audio.ts)

**Before generating anything, verify commercial usage rights on the owner's current ElevenLabs plan and record the answer in `LICENSING.md`.** Music rights differ by tier and this is going on a commercial business page. If rights are unclear, fall back to an Envato Elements track and log the license ID.

Generate with ElevenLabs Music:
- Prompt direction: modern, confident, forward-moving electronic. Clean synth pulse, light percussion, no vocals, no heavy drops. Should feel like a product launch, not a nightclub.
- Target 20 seconds for the vertical cut and 50 seconds for the LinkedIn cut, so you have trim room on both ends.
- The 15 second cut needs a track that establishes itself in under a second. Reject any generation with a long intro ramp, no matter how good the back half is.
- Generate three variants. Render a still-frame preview reel and let the owner pick.

Sound effects, generated or from Envato:
- Whoosh on each project transition
- Soft UI click on each stat chip appearance
- One low impact on the hook text slam
- Nothing on the CTA except the music resolving

Keep SFX at least 12dB under the music bed. Normalize the final mix to -14 LUFS integrated, true peak -1dBFS.

**Voiceover: skip it by default.** Around 80 percent of feed video plays muted. A VO track makes the video incomprehensible to most of the audience unless the captions carry the full message, at which point the VO is redundant. If the owner wants one for the LinkedIn cut specifically, generate it, but the video must still work with zero audio.

---

## 9b. Generated visuals: scope rules (ElevenLabs Image & Video)

Image & Video is available and you should use it, but only where a generated visual cannot be mistaken for a claim about reality.

**Approved uses:**
- Abstract or textural backplates behind text cards. Slow-moving gradient fields, light sweeps, particulate drift, out-of-focus color. These sit behind the hook line and the CTA card and give the reel production value that flat color cannot.
- Transition texture. A one-frame to four-frame generated flash, ink bleed, or light streak between project scenes, used as a wipe.
- Generated still images for the thumbnail background, with the real device capture composited on top.
- Upscaling. If any real capture needs resolution help, use the platform's upscale rather than regenerating.

**Prohibited uses, without exception:**
- Any generated footage of a physical place, storefront, office, gym, clinic, restaurant, or golf venue. This is not a stylistic preference. The owner has a standing honesty rule on the Fore Motion Golf project specifically: no footage may be presented as the venue until the real buildout is filmed. A generated interior that reads as a real room breaks that rule and the rule exists for good reason.
- Any generated face, and any generated person presented as a client, customer, or team member. Anonymous hands and over-the-shoulder figures in the context plates are permitted per Section 4b, because they are set dressing around the real product. A recognizable face is different: it implies a specific real person endorsing or using the work. No AI spokesperson, no lip-synced presenter, no talking head. K&A Performance sells "there is a real person on the phone," and an AI presenter contradicts that pitch inside the same fifteen seconds it makes it.
- Any generated screen, UI, browser window, or dashboard content. Generated devices are fine and expected. Generated screen *content* is not. Every pixel of website in this video is a real capture of a real live site, composited into the screen quad per Section 4b, with full coverage so no generated interface survives at the edges.
- Any generated logo, brand mark, or client asset.

**Cost discipline:** the premium video models bill a large credit cost per generation. This build should need close to zero video generations. Context plates are stills (Section 4b), backplates are stills or short loops, and all motion is added in Remotion. If you find yourself generating video, stop and check whether a still plus a Remotion transform gets the same shot for a fraction of the credits. Log the credit spend in `LICENSING.md`.

**Ambiguity test:** ask what a paused frame would be *claiming*. A generic hand holding a generic phone claims nothing, so it ships. A specific storefront, a named product, an identifiable person, or a website interface all make factual claims about the world, so they must be real or they do not ship.



---

## 10. Captions

Burn readable text into the video as the primary channel. Additionally produce a sidecar `.srt` for every cut, matched frame-accurately to any spoken or on-screen line. LinkedIn accepts SRT upload. Facebook auto-generates but gets names and jargon wrong, so upload yours.

Caption file naming: `out/kap-reel-{format}-{duration}.srt`

---

## 11. Encode targets (scripts/encode.sh)

All output H.264 High profile, AAC audio 48kHz stereo, 30fps, `-movflags +faststart`, yuv420p pixel format.

| File | Canvas | Duration | Target bitrate | Use |
|---|---|---|---|---|
| `kap-reel-vertical-15s.mp4` | 1080x1920 | 15s | 12 Mbps | Facebook Reels, LinkedIn vertical |
| `kap-reel-feed-15s.mp4` | 1080x1350 | 15s | 10 Mbps | Facebook feed, LinkedIn feed |
| `kap-reel-square-15s.mp4` | 1080x1080 | 15s | 10 Mbps | Cross-post flexibility |
| `kap-reel-linkedin-45s.mp4` | 1080x1350 | 45s | 10 Mbps | LinkedIn company page primary |
| `kap-reel-landscape-45s.mp4` | 1920x1080 | 45s | 12 Mbps | LinkedIn desktop-first audience |

Keep every file well under 1GB. Facebook Reels enforces a tighter file cap than feed video, and schedulers reject edge-case files more aggressively than direct app uploads do.

Also export:
- `out/thumbnail-vertical.jpg` (1080x1920) and `out/thumbnail-landscape.jpg` (1920x1080), pulled from a frame where a real site is on screen and the brand mark is visible. Not a text card.
- `out/frames/` with six stills for use as a carousel post later.

---

## 12. Post copy

Write both, save to `out/post-copy.md`. Do not use em dashes. Do not use hashtag walls.

**Facebook business page.** Conversational, local, benefit-first. Three to five short lines. Lead with the outcome, not the technology. Include the city. End with a direct ask and the phone number, because Facebook viewers will not hunt for contact info. Two or three hashtags maximum, local ones.

**LinkedIn company page.** First two lines must land before the "see more" fold. Lead with a specific problem you solved rather than a capability list. Two short paragraphs, then a plain closing line. No hashtag spam, three maximum. No "excited to announce."

Draft both, then present them to the owner for edit before anything gets posted. Do not post anything.

---

## 13. Licensing record

Create `LICENSING.md` and log every asset used:
- Envato Elements: item name, item URL, license ID from the download, date
- ElevenLabs: plan tier, commercial rights confirmation, generation prompt and date
- ElevenLabs Image & Video: for each generated visual, the underlying model used, the full prompt, the credit cost, and where it appears in the timeline. The underlying models carry their own commercial terms, so record which one produced each asset rather than logging it all as "ElevenLabs"
- Provenance metadata: note whether each generated asset carries C2PA or IPTC credentials, and confirm none were stripped during compositing or encode. If FFmpeg drops the metadata as a side effect of transcoding, that is fine and worth noting, but do not remove it deliberately
- Fonts: source and whether the license covers embedding in video
- Any client asset (logo, photo): who granted permission and when

This exists because the video is a commercial promotion for a business carrying E&O coverage. If someone questions an asset later, the answer needs to be in a file, not in memory.

---

## 14. Acceptance criteria

The build is done when all of these pass:

1. Every project shown appears in `config/projects.json` with `cleared_for_public_showcase: true`.
2. Every on-screen number traces to `metrics.json`.
3. The vertical cut is fully comprehensible with audio muted. Test this literally.
4. No text or logo intrudes into a reserved safe zone in any format. Verify with the debug overlay render.
5. All five MP4s render without error and play in QuickTime and VLC.
6. Zero em dashes in any on-screen text, caption file, or post copy. Grep for them: `grep -rn "—" out/ src/`
7. Every context plate composite has been inspected as a full-size still. No visible face, no hand artifact, no warped device, no generated text, no generated screen content visible at the quad edges.
8. `LICENSING.md` is complete, including which model generated each plate.
9. Total render time for a full rebuild is documented in the README so future rebuilds are predictable.

---

## 15. Things that will make this look cheap. Avoid.

- Stock footage of someone typing on a MacBook
- Neon gradient text with a glow
- The word "elevate"
- Fake before-and-after where the "before" is a strawman
- Countdown timers or fake urgency
- A logo animation longer than one second
- Text that fades in slowly. Cut, do not fade
- Showing a site you do not have written permission to show
