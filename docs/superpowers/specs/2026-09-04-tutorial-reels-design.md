# Tutorial reels: design

Date: 2026-09-04. Owner: Alex. Orchestrated by Fable, executed by Opus subagents.

## What this is

A third content line in `Reels/kap-reel`, next to the web showcase and the training showcase: short narrated tutorials. Each tutorial ships as a pair.

- A 15 second cut for Facebook Reels (1080x1920 master, plus 1080x1350 and 1080x1080 like the other reels). The tip and the punchline, one visual.
- A 45 second cut for LinkedIn (1080x1350 and 1920x1080). The same tip with the actual work shown.

Both cuts are narrated with an ElevenLabs text-to-speech voice, captioned on screen, and carry a music bed under the voice. Finals land in `Reels/instructional reels/<tutorial>/`, one folder per tutorial, same layout as `Reels/Posts 9-4-26`.

The first two tutorials are built together:

1. `contrast`: Contrast is not a vibe.
2. `hero`: Your hero is a promise, not a photo.

## Non negotiables carried from the other reels

- No em dashes anywhere: scripts, captions, SRTs, post copy, on screen. Use periods, commas, colons.
- No pill or chip UI. Labels are small caps interpunct lines or plain text.
- Brand fonts and colours from `config/brand.json`. Amber is never small text on light.
- Real sites only, and only projects with `cleared_for_public_showcase` true. Never attribute a weak example to a real client; weak examples are fictional and labelled as such.
- No fabricated metrics. Every contrast ratio on screen is computed by code from the actual hex values (WCAG 2.x relative luminance) and asserted in a test.
- Every ElevenLabs call is logged with measured credits, the way `scripts/audio.ts` does it. Report spend.
- Nothing is posted. Files are delivered to disk.
- "K&A" is written "K and A" in anything sent to the voice model so it is spoken correctly. On screen it stays K&A.

## Architecture

### Content contract

`src/tutorial/types.ts` defines `TutorialContent`:

- `id`: "contrast" or "hero".
- `hook`: two kinetic lines, same treatment as the showcase Hook (first line canvas, second amber, slammed on frame 0), over a full bleed shot or a flat brand field.
- `beats[cut]`: an ordered list of beats per cut. A beat is `{ id, scene, narration, caption, minFrames, props }`. `scene` names a React component from a registry in `src/tutorial/scenes`. `narration` is the exact text sent to the voice model. `caption` is the on screen caption lines (usually the narration split into short lines, at most two lines of about 32 characters at 1080 wide).
- `cta`: the closing narration line and the existing drawn end card (`scenes/CallToAction`), per cut.
- `music`: which existing music take to bed under the voice, per cut ("a" for both tutorials to start; a new bed is a later decision).

### Timeline from the voice

Beat lengths are driven by the narration, not the other way round.

1. `scripts/voice.ts` generates one audio file per beat (and one for the hook and one for the CTA) per tutorial per cut, into `assets/audio/voice/<tutorial>/<cut>/<beatId>.mp3`, and writes `config/voice.json` with the measured duration of each file, the model, the voice id, the text, and the credits measured from the usage endpoint. It refuses to regenerate a beat whose text and voice have not changed.
2. `src/tutorial/timeline.ts` reads `config/voice.json` and lays the beats out: each beat gets `max(minFrames, ceil(durationSec * 30) + 12)` frames, so the voice never runs past its picture, with a 12 frame tail before the next line. The hook holds at least 54 frames (short) or 36 (linkedin). The CTA holds 78 frames, as the end card draw needs.
3. The composition total is exactly 450 (short) or 1350 (linkedin). If the laid out beats come in short, the slack is added to the beat marked `stretch: true` (the demonstration beat). If they come in long, the build fails with a message saying which beat to cut or which line to shorten. Speed is not touched to make a script fit; the script is edited.

### Audio

- Voice: ElevenLabs text to speech. Draft voice is a premade library voice chosen by the executor for a calm, clear, mid register read; the final voice is Kai's, once Alex supplies the voice id. Model per the current ElevenLabs docs (check `eleven_multilingual_v2` vs `eleven_v3` availability and pricing on the Pro plan before the first call). Output `mp3_44100_128` is enough for a voice stem; it is resampled to 48 kHz in the mix.
- Mix: `scripts/voice.ts --mix` builds `assets/audio/mix-tut-<tutorial>-<15|45>s.wav`: the chosen music bed ducked under the voice with `sidechaincompress`, voice around -16 LUFS integrated with the bed about 18 dB under it while speech is present, whole mix through the existing loudnorm and limiter path in `audio.ts` (reuse its functions, do not copy them). `scripts/deliver.ts --reel tutorial-contrast` muxes that mix exactly as it does for the showcase reels.
- Captions: burned in, plus the SRT sidecar from `scripts/srt.ts` extended with the tutorial cue lists. Burned captions sit in the bottom safe area, Atkinson at about 44px at 1080 wide, ink on a canvas card with 8px radius (a card, not a pill), one or two lines, fading with the beat.

### Scenes

Shared, in `src/tutorial/scenes`:

- `TutorialHook`: the showcase Hook with a flat teal or canvas field option, since not every tutorial opens on a capture.
- `Caption`: the burned caption card.
- `FlatDemo`: a canvas coloured card centred in the safe area that a tutorial scene draws inside. Phone shaped in the vertical crops, laptop shaped in landscape, using `DeviceFrame` and `LaptopFrame` where a device makes sense.
- `JamClip`: plays a Jam screen recording from `assets/captures/jam/<id>.mp4` inside `LaptopFrame`, or renders `StandIn` labelled with the id when the file is missing. Same rule as the showcase: a stand in must be impossible to mistake for a finished shot.

Per tutorial scenes live in `src/tutorial/scenes/contrast/` and `src/tutorial/scenes/hero/`.

### Registration and delivery

`Root.tsx` registers `TutorialContrast{Vertical,Feed,Square,Landscape}` (short) and `TutorialContrast{LinkedIn,LinkedInLandscape}` (linkedin), and the same for `TutorialHero`, plus the debug twins, through a `tutorialRegistrations(prefix, content)` that mirrors `registrations`. `Tutorial.tsx` is a separate scene tree from `Reel.tsx`.

`deliver.ts` takes `--reel tutorial-contrast | tutorial-hero`. Render names are `out/render-tutorial-<id>-<format>-<15|45>s.mp4`, deliveries `out/kap-tut-<id>-<format>-<15|45>s.mp4`, thumbnails and stills follow the existing pattern. A final step copies the deliverables into `Reels/instructional reels/<id>/` with `Facebook/`, `LinkedIn/`, `Other formats/`, `Carousel stills/`, `post-copy.md`, and a README the way `Posts 9-4-26` is laid out.

## Tutorial 1: contrast

Facts, computed and asserted: amber `#D97706` on canvas `#F8F5F2` is 2.9 to 1 (fails AA for any text size). Rust `#9A3412` on canvas is 6.7 to 1 (passes AA for all text). Espresso ink `#221C15` on amber passes AA for button text. The executor's test computes these from `brand.json` and the scene reads the computed values; nothing is typed by hand.

### 15 second script (Facebook)

| Beat | Narration | Picture |
|---|---|---|
| hook | Contrast is not a vibe. | Kinetic lines "Contrast" / "is not a vibe." on the teal band |
| fine | This amber on cream looks fine. | A canvas card with a headline and a paragraph set in amber. It looks like a real page |
| fails | It measures two point nine to one. That fails. | The ratio types on in Lenia Mono under the card, "2.9 : 1", then the small caps line "fails AA". Nothing turns red; the number is the verdict |
| fix | Same palette, rust instead. Six point seven. Passes. | The text on the card cross fades from amber to rust. "6.7 : 1", "passes AA". Amber stays on the card's one button, with ink text on it |
| cta | Measure every colour you set text in. | The drawn end card |

Hook first line slams on frame 0. "fix" is the stretch beat.

### 45 second script (LinkedIn)

| Beat | Narration | Picture |
|---|---|---|
| hook | Contrast is not a vibe. | As above |
| real | Here's a real page. The amber reads as bold, so your eye says it's fine. The checker says two point nine to one. Body text needs four and a half. | The K&A home page desktop capture in the laptop frame, pushed in on a text block; a version of that block re-set in amber sits beside it in a card, with the ratio typed under it |
| inspect | Open the inspector, click the colour swatch, and the ratio is right there with the pass marks under it. | `JamClip` id `contrast-devtools`: Alex's recording of Chrome DevTools on ka-performancefl.com showing the colour picker's contrast ratio. Stand in until it lands |
| fix | The fix is not a new palette. Amber stays on buttons, with dark text on top. Words on the page get the rust from the same family. Six point seven to one. Passes. | Split: the card from the 15s cut, amber text crossfading to rust; the button keeps amber with ink text. Both ratios shown |
| rule | Every colour that carries text gets measured, not eyeballed. | Kinetic line "Measured, not eyeballed." on teal |
| cta | K and A Performance. Web design and AI integration, built in Gainesville. | The drawn end card |

"inspect" is the stretch beat.

## Tutorial 2: hero

The weak example is a fictional bakery, Riverside Bakery, consistent with the fictional bakery in the training P&L sample. It is labelled "example" on screen. The good examples are three cleared client sites whose live hero copy states what the visitor gets, checked against the live pages on 2026-09-04: PB&J Strategic Accounting (pbjsa.com, "Strategic Accounting & Bookkeeping for Growing Businesses"), MBS Medicine (mbsdoc.com, "Healthcare that treats the whole person", subhead "One consistent provider. No insurance required. Same-week appointments across Florida"), and Southern Legacy Contractors (southernlegacycontractors.com, "Poured today. Standing for generations.", subhead naming residential, commercial and industrial concrete across Northeast Florida). Fore Motion Golf and Project Makeover were checked and rejected: their heroes are mood and mission lines, not promises. The reel shows the existing mobile home captures held on the hero; those three stills were confirmed to match the live copy on 2026-09-04. Headlines are never paraphrased on screen; the capture shows them as they are.

### 15 second script (Facebook)

| Beat | Narration | Picture |
|---|---|---|
| hook | Your hero is a promise, not a photo. | Kinetic lines "Your hero is a promise," / "not a photo." on teal |
| weak | Welcome to our website says nothing. | A phone frame showing a hero: a stock looking neutral gradient, a small logo, "Welcome to Riverside Bakery". Small caps "example" label |
| promise | Say what they get, in the first six words. | The headline on the same phone rewrites itself by type on to "Fresh sourdough, baked at five, gone by noon." |
| real | These three do. | Three phone frames, fast cut, each a real client mobile home capture held on its hero, name under each |
| cta | Write the promise. Then pick the photo. | The drawn end card |

"promise" is the stretch beat.

### 45 second script (LinkedIn)

| Beat | Narration | Picture |
|---|---|---|
| hook | Your hero is a promise, not a photo. | As above |
| fold | The first screen decides whether anyone scrolls. On a phone that is about six hundred pixels. A photo and a logo spend it on nothing. | Phone frame, the Riverside example, a thin rule marking the fold with a small caps "the fold" label |
| rewrite | Take a weak line. Welcome to our website. Rewrite it: who it is for, what they get, why you. | The headline retypes in three passes, one per clause, each pass a fuller line, landing on the sourdough line |
| real | Three real ones. P B and J Accounting, M B S Medicine, Southern Legacy. Each tells you what you get before you scroll. | Three phones, each held about three seconds on its hero, name under each |
| rule | Write the promise. Then pick the photo. | Kinetic line on teal |
| cta | K and A Performance. Web design and AI integration, built in Gainesville. | The drawn end card |

"real" is the stretch beat.

## Assets Alex supplies

1. Jam recording `contrast-devtools`: Chrome on ka-performancefl.com, DevTools open, inspect a paragraph, click the colour swatch in Styles, show the Contrast ratio line and the AA and AAA marks, then change the hex to amber `#D97706` so it fails, then back. 30 to 40 seconds, browser window 1440x900 or larger, no bookmarks bar, no other tabs visible, highest quality Jam allows. Landscape.
2. Kai's ElevenLabs voice id, for the final narration pass.
3. Approval of the two scripts above, or edits. Drafts render with a premade voice so the timing and the read can be judged before Kai's pass.

## Build phases and gates

- Phase A: foundation. Types, timeline, voice script, mix, captions, Tutorial.tsx, registrations with both content files present, deliver support. Gate: a grey render of each cut with stand ins and a draft voice, typecheck clean.
- Phase B: the two tutorials in parallel, one executor each, touching only their own scene and content files. Gate: still frames of every beat in the vertical and landscape crops, and one full render per cut.
- Phase C: delivery to `Reels/instructional reels/`, post copy, README, LICENSING addendum for the voice, credit report.

## Testing

- `scripts/voice.ts` has a dry run that prints the beat list, character counts, and a credit estimate without calling the API.
- A unit test asserts the three contrast ratios from `brand.json` and that the on screen strings are derived from them.
- The timeline test asserts each cut totals exactly its frame count and no beat is shorter than its narration.
- Delivery acceptance reuses `deliver.ts` checks: bitrate, range, duration, SRT validity, and a scan of every string for an em dash.
