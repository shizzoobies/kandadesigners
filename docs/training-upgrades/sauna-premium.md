# Heat, done well

The nine-lesson course uses a cedar-and-cream editorial direction with a custom illustrated room, a clothed wellness educator, local body fonts and system Georgia headings. It retains the traditional/infrared, physiology, check-first, session, warning-sign and planning coverage while removing decorative lesson numbers and multiple-choice safety judgments.

## Course and media

- Course: `public/training-samples/sauna/index.html`
- Complete static reference: `public/training-samples/sauna/workbook.html`
- Transcript source: `public/training-samples/sauna/narration.js`
- Art: `assets/img/cedar-room.webp` and `assets/img/wellness-guide.webp`
- Audio: `assets/audio/screen-1.mp3` through `screen-9.mp3`
- Generator: `scripts/generate-sauna-narration.mjs`
- Completion contract: `ka-sample-complete`, slug `heat-done-well`. Activity fields are `path`, `situations`, `evidence`. Completion is not clinical clearance or a qualification.

The two illustrations were generated with the built-in image tool and optimized with the existing Sharp installation. The final prompts are in `sauna-art-prompts.md`. The guide indicator follows actual media events; there is no simulated lip sync. All nine introductions were generated with the existing ElevenLabs Bella voice (`hpp4J3VqNfWAUOO0d1Us`), `eleven_multilingual_v2`, MP3 44.1 kHz/128 kbps. The script reads an ignored local environment file via `KA_ENV_FILE`; no key is shipped in the course.

## Learning interactions

- Traditional/infrared tabs change the diagram as well as the copy. Body-response tabs highlight circulation, fluid loss or relaxation.
- Six pre-visit considerations show one focused detail at a time.
- Five session cards can be reordered using pointer or keyboard controls. Editing an already reviewed path invalidates its prior feedback.
- Four situational observations reveal additional context. Immediate response guidance is always visible, including calling 911, beginning cooling and withholding drinks when a person is confused.
- Three evidence notes distinguish an association, a comfort experience and an unproven universal routine.
- An optional private notebook creates a downloadable plain-text reminder. Entries are escaped on rendering, bounded to 300 characters per field, kept only in page memory and cleared on restart/reload.
- Custom play/pause, replay, mute and seeking controls. The full transcript occupies its own grid row below the lesson, never a modal overlay. Navigation pauses narration and does not autoplay a new clip. Failed media can be retried using `audio.load()`.

## Content review

Removed universal safe duration/temperature/round recommendations, the suggestion that feeling fine guarantees safety, the instruction that cold plunge tolerance establishes suitability, and overconfident recovery or hydration claims. Children are not asked to follow this adult module. Check-first factors are conversation prompts, not medical screening or clearance.

Reviewed September 23, 2026 against:

- [Mayo Clinic: infrared sauna](https://www.mayoclinic.org/healthy-lifestyle/consumer-health/expert-answers/infrared-sauna/faq-20057954)
- [CDC: heat illnesses and first aid](https://www.cdc.gov/niosh/heat-stress/about/illnesses.html)
- [CDC: heat illness response chart](https://www.cdc.gov/natural-disasters/media/pdfs/2026/09/Heat_Related_Illness-NEWLOGO.pdf)
- [CDC: heat and medicines](https://www.cdc.gov/heat-health/hcp/clinical-guidance/heat-and-medications-guidance-for-clinicians.html)
- [CDC: heat and pregnancy](https://www.cdc.gov/heat-health/hcp/clinical-overview/heat-and-pregnant-women.html)
- [Dry sauna systematic review](https://pmc.ncbi.nlm.nih.gov/articles/PMC5941775/)

General heat first-aid guidance supports symptom response, not a personalized sauna prescription.

## Verification

Local preview: `http://127.0.0.1:62142/training-samples/sauna/`. In-app browser used throughout; screenshots were opened and visually inspected. Actual viewport dimensions were recorded, because concurrent agent browser testing can change viewport settings.

- All nine lessons: no horizontal overflow or broken images at 360x800, 768x1024 and 1280x900.
- All nine lessons: no internal vertical overflow at 1280x900, 768x1024 and 1280x720 with the audio dock closed.
- Phone content stays in one scrollable lesson pane with navigation fixed below. The session-path lesson was compacted from 334px extra height to 25px. Other text-heavy phone lessons retain ordinary vertical scrolling, up to 259px in the notebook before audio opens.
- All nine MP3s reached `readyState=4`, played with advancing time and valid durations (23 to 32 seconds). The dock did not overlap lesson content.
- Initial desktop audio-fit measurements found 65px extra height in the path lesson and 5px in the notebook. The CSS was compacted; the path was rechecked at zero overflow and visually inspected with the guide/transcript shown. The final integrated pass is owned by the parent task.
- Keyboard tab arrows, itinerary move controls, incorrect/correct review, score invalidation after a move, evidence reveals, symptom detail, optional note retention, mute, seek, Escape, completion dialog and restart exercised.
- The local fault proxy `scripts/verify-sauna-media-proxy.mjs` returned an intentional HTTP 503 for the first media request. Clicking Retry loaded the real clip, reached ready state 4 and Speaking, and cleared the error. The expected 503 is excluded from the normal course console check.
- Normal course browser console: no warnings or errors.
- `node --check` run on course app, narration and generator. The parent task owns the combined Astro build and website wrapper completion test.
- Static workbook contains all teaching content and activity explanations. It was inspected as static source, not represented as a screen-reader certification. Reduced-motion CSS removes transitions; the guide uses text state rather than animation.

Evidence is in `docs/training-upgrades/sauna-qa/`. The raw initial audio measurements are retained to show the defect found, with the final correction noted above. No deployment was performed by this agent.
