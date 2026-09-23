# Strong is a skill: premium production

Nine-lesson upgrade of the existing strength course. Existing public folder and host completion slug `strong-is-a-skill` are preserved. The parent site receives `ka-sample-complete` only when Finish is selected. It contains practice counts, not health data or the private note.

## Experience

- Warm ivory, ink and terracotta studio with an original inclusive coach and scene.
- Five movement patterns with keyboard arrow-key tabs and schematic diagrams.
- Ten everyday/gym tasks on a sorting bench. Pick-and-place buttons are the keyboard/touch equivalent of drag and drop. Wrong placements remain editable.
- Subjective effort dial and progression explorer. Removed the old false arithmetic equating effort to a precise number of repetitions left.
- Six coaching observations with distinct observation/adjusted diagram geometry. The breathing example changes a hold symbol to breathing arrows. These are explicitly schematics, not form assessment.
- Weekly calendar, movement collection, private local note and downloadable text practice card.
- Nine real Bella narration clips with the exact spoken scripts in narration.js. Inline audio and transcript reserve space below the lesson. SVG play/pause, seek, mute and labeled Hide audio control; no native controls or overlay.
- Complete workbook.html is readable without JavaScript, with all lesson coverage, ten activity reference answers, six coaching responses and planning prompts.

## Content and sources

Reviewed September 2026 against primary guidance:

- https://www.cdc.gov/physical-activity-basics/guidelines/adults.html
- https://www.cdc.gov/physical-activity-basics/health-benefits/adults.html
- https://www.nia.nih.gov/health/four-types-exercise-can-improve-your-health-and-physical-ability

The five-pattern taxonomy is described as a teaching framework, not an official exhaustive standard. The draft week does not claim to be a complete personal program and explicitly includes all major muscle groups, including the abdomen, in the planning discussion. Physical-activity benefits are distinguished from claims specific to resistance work. Removed guaranteed bone/tendon adaptations, a fixed beginner weekly ceiling, and universal technique prescriptions. No automatic training load recommendation or health assessment is made.

## Production assets

- public/training-samples/strength/assets/img/studio.webp: 1536 x 1024 original editorial illustration.
- public/training-samples/strength/assets/img/coach.webp: 720 x 864, verified four-channel WebP with alpha.
- public/training-samples/strength/assets/audio/screen-1.mp3 through screen-9.mp3: approximately 226 seconds combined, ElevenLabs Bella, eleven_multilingual_v2, mp3_44100_128.
- Existing project Parson Regular and Bold fonts, local to the course. System Georgia headings.

Built-in image generation was used. Final prompts are recorded in strength-art-prompts.md. Original PNGs remain in the generated-images folder, optimized project assets are checked in. Credentials were read from the authorized ignored root .dev.vars via KA_ENV_FILE; no credential copy was made. Generator skips existing clips.

## Verification

Local server: http://127.0.0.1:62141/training-samples/strength/ using the existing range-capable server.

In-app browser checks recorded actual innerWidth/innerHeight on every measurement. Evidence lives in strength-qa/:

- All nine lessons checked at 360 x 800, 768 x 1024, 1280 x 900 and 1280 x 720. No horizontal page overflow or broken images. At 1280 x 900 and 768 x 1024 all lessons fit with audio closed after refinements. Phone reading content uses the internal lesson scroll; fixed controls remain available.
- All nine at 1280 x 720 fit with audio closed: compact-final.json.
- All nine at 1280 x 900 fit with audio open after the final planner/takeaway trim: compact-final.json plus last-spacing.json supersede earlier overflow values.
- All nine actual MP3s played with readyState 4 and advancing currentTime. Transcript tray sits below main, not over it. audio.json records durations and bounding boxes.
- Keyboard pattern navigation; wrong placement and correction; all ten sorting answers; effort slider and progression; all six coaching responses; Sunday/Monday adjacency; day and movement selection; local note; completion dialog, Escape, restart; pause, seek, mute and audio Escape all exercised successfully.
- Simulated first-MP3 HTTP 503 on port62149: visible failure message, Play retry recovered to readyState4, paused false and advancing time. scripts/verify-strength-recovery.mjs is a loopback-only test fixture.
- Console warnings/errors were empty on normal course interactions. The deliberate 503 fixture is separate.
- Node syntax checks passed for app.js and narration generator. Integrated Astro build and wrapper completion are owned by root integration.

Screenshots of desktop cover/coaching/planner with audio, tablet planner and phone sorting were opened and visually inspected. No screen-reader certification or individualized exercise efficacy claim is made. Reduced-motion CSS is present; OS-level reduced-motion emulation was not performed in this browser pass.

## Release boundary

Only strength course assets, its narration/recovery scripts and documentation belong to this change. Shared catalog and deployment are handled by the root task. No deployment was performed by this agent.
