# Build the plate, skip the diet

Premium course upgrade, September 23, 2026. No production deployment.

## Design and learning

- Warm ivory, forest green and terracotta kitchen palette with the existing licensed course fonts.
- Bespoke illustrated kitchen guide and overhead meal artwork, generated using the built-in image tool and optimized to WebP.
- Nine concise lessons retain the plate guide, eight-food placement, six key label details, protein and fiber, eating cues, six swaps and a personal takeaway.
- Conventional hunger classification questions were replaced with six reflective clue investigations. The original quiz inferred thirst or tiredness from nonspecific symptoms. The new exercise explores context without claiming a diagnosis or requiring people to justify hunger.
- Plate practice supports pointer placement, native keyboard buttons and optional drag. Placed foods appear in their chosen section. The mobile workspace is reordered to keep food, plate and feedback together.
- The fictional label is explicitly abbreviated. Its serving slider updates energy, added sugars and fiber together.
- Saved swaps and optional reflection notes live only in page memory. No requests send learner input.
- Footer narration uses nine prerecorded ElevenLabs clips and verbatim transcripts. The inline tray reserves layout space. The guide's small activity indicator follows actual audio events; there is no simulated mouth synchronization or autoplay.
- Existing completion integration retained: `ka-sample-complete`, slug `build-the-plate`, score keys `plate`, `label`, `cues`, `swaps`. The `cues` value now records moments explored, not diagnostic quiz accuracy.

## Assets and generation

Final assets: `public/training-samples/nutrition/assets/img/kitchen-guide.webp`, `balanced-plate.webp`, and `assets/audio/screen-1.mp3` through `screen-9.mp3`.

Guide prompt (built-in image tool):

> Use case: illustration-story. Create a premium editorial illustrated guide for an adult everyday nutrition course by K & A Performance. Friendly woman around 40 with short curly dark hair, warm brown skin, confident approachable expression, natural proportions, cream shirt and dark forest-green apron with a small terracotta pocket, holding a wooden serving spoon. Waist-up portrait, hands fully visible, isolated on solid warm ivory #f5f0e7. Hand-painted gouache with refined pencil detailing and soft dimensional shading, sophisticated food magazine illustration, not childish, not corporate clipart, no photorealism. Centered composition with generous room around silhouette. No text, no lettering, no logo. Landscape square artwork, high craft quality.

Meal prompt (built-in image tool):

> Use case: photorealistic-natural. Premium food editorial overhead photograph, wide 3:2 crop. A cream ceramic dinner plate on a warm ivory linen tabletop, half filled with roasted broccoli and sliced tomatoes, quarter with grilled salmon, quarter with fluffy brown rice. Beside the plate a small glass of water, fork, and a loosely folded terracotta napkin. Honest everyday balanced meal, elegant but achievable home cooking, soft window light, natural appetizing textures, restrained styling. Plate on center right, no text or labels, no diagram lines, no hands. Camera perfectly overhead, premium independent food magazine quality.

Narration regeneration: `node scripts/generate-nutrition-narration.mjs`. The script reads the existing ignored local environment file without logging credentials, skips existing clips and uses the same approved Bella voice ID and multilingual model as safety. Set `NUTRITION_VARS_PATH` to override the local file path. Regeneration requires the account key and credits. No key is included in the course or scripts.

## Content references checked

- [Health Canada: using the food-guide plate](https://www.canada.ca/en/health-canada/services/food-guide/eating-support/cooking/make-healthy-meals-plate.html), current page dated May 20, 2026.
- [FDA: understanding the Nutrition Facts label](https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label).
- [FDA: Daily Value reference](https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels).

The workshop clearly identifies its plate as a practical adaptation, since starch grouping varies across guides. Individualized dietary advice and medical diagnosis are outside its scope.

## Verification

In-app browser used at `http://127.0.0.1:62121/training-samples/nutrition/`.

- Viewed and inspected at 360x800, 768x1024 and 1280x900; no document horizontal overflow.
- Phone plate practice after correction: lesson scrollHeight and clientHeight both 671px. Desktop plate with transcript open: both 574px.
- Opening, tablet and desktop plate screenshots, plus label investigation screenshot inspected. Artifacts are in `nutrition-qa/`.
- Real local MP3 playback: readyState 4, paused false, currentTime advancing. Navigation and tray collapse pause playback; transcripts change with the lesson.
- Plate wrong placement and keyboard correction tested. Tabs support arrow keys, Home and End in implementation; ArrowRight was exercised.
- All six label hotspots explored. Slider End produced two servings, 320 calories, 18g added sugars and 6g fiber.
- Reflection survives moving between moments. Saved swaps appear in the takeaway and completion summary.
- Finish opens the native completion dialog. Escape closes it and focus returns to Finish.
- Browser console check returned no errors or warnings during these interactions.
- `node --check` passed for course logic, transcripts and generation script.
- Nine audio files were generated successfully, approximately 3.4MB total. Actual browser playback was tested on the welcome and plate lesson clips.

The root agent owns the integrated Astro build and catalog metadata review. No production or wrapper-page verification was claimed in this isolated course pass. The no-JavaScript fallback links to the complete static reference workbook described below. Interactive practice and narration require JavaScript. Reduced-motion styling suppresses animated indicators and transitions.

## Follow-up: static coverage and audio recovery

- Added `workbook.html`, linked from the no-script course view. It contains the full plate guide, all eight food explanations, all six label details and four serving calculations, protein/fiber guidance, all six eating moments, every swap, reflection fields, a takeaway and primary sources.
- The workbook has no JavaScript dependency, external asset paths or network submission. Native disclosure sections and checkboxes work without scripts. It is also printable.
- When the media element has an error, pressing Listen now calls `load()` before retrying playback so a transient failed request can recover.
- Confirmed that local course assets use relative paths and the audio element does not expose the generic native control bar.
- `node --check public/training-samples/nutrition/app.js` and `git diff --check` passed after these changes.
- Follow-up rendered checks could not run: the existing in-app browser reported `Browser is not available: 1`, and fresh discovery reported `No browser is available`. No installed Playwright package resolved from this worktree. The earlier interactive-course screenshot checks remain valid; the new workbook layout and retry recovery need a browser recheck when available.
