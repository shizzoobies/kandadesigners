# Training gallery and cover system

The gallery now opens directly into six playable courses. Illustrated artwork sits above real-text course titles, a short summary, duration and a clear course action. An industry-only filter counts playable courses; the accessibility example is a separate Coming next item. Filters appear only when JavaScript initializes, so the complete gallery remains usable without it.

`TrainingCourseCard.astro` accepts `sample`, optional `headingLevel` (2 or 3) and `eager`. `trainingPresentation.js` contains only cover/short presentation content. The existing training data remains responsible for publication status and course facts.

## Assets

All final assets are in `public/images/training/covers/`: six 1200 x 750 WebP covers and six 1200 x 630 JPEG social images. WebP files range from 129 KB to 212 KB. North-aligned crops preserve faces. Original course guides and scene assets were inspected before generation.

Five covers were generated with the built-in image generation tool, using each existing scene and guide as explicit composition and identity references. The strength studio illustration already contains the correct coach and learners, so it is reused with the shared export dimensions. `scripts/build-training-covers.mjs` produces the deterministic optimized exports from the reviewed originals. No new dependency was installed.

## Prompt set

Shared specification: premium landscape course-cover editorial illustration, 8:5 ratio, no title/UI/borders, preserve the supplied illustrated guide's face and identity. Important subjects within the central 80% for thumbnail/social crops. Every call used the scene and guide as two local image references.

- RFI: cream architectural review desk at left, marked-up drawing with rust revision cloud, red pen and detail model. Exact navy-shirt construction guide with yellow K&A hardhat at right, gesturing toward the drawing. Warm cream, navy and rust.
- Safety: existing jobsite left, blocked green exit and cable across floor, receding construction beams. Exact orange-vest hardhat guide at right. Warm concrete and dark green palette. Preserve EXIT and helmet branding; no added text.
- Finance: exact green-cardigan finance guide seated at a sunlit bakery counter with large ledger, neat receipts, brass calculator and croissant. Bakery shelves and arched window. Forest green and warm gold. No readable document copy.
- Nutrition: large balanced plate of salmon, grains, broccoli and tomatoes at left, exact cream-shirt and green-apron guide behind the counter at right. Warm linen, sage and rust, painterly kitchen daylight. No dieting imagery.
- Sauna: existing cedar room left, glass door and cream cooling lounge right. Exact sage-shirt guide stands fully clothed outside the sauna holding a white towel. Warm cedar, sage and cream. No health symbols or added text.

## Verification

- Astro build: PASS, 43 pages.
- SEO gate: PASS, 29 indexable and 14 noindexed routes.
- All six optimized WebP covers visually inspected at export size.
- Browser check on the integrated preview at `http://127.0.0.1:62160/training/samples/`: 1280 x 900, 768 x 1024 and 360 x 800. Grids render 3, 2 and 1 columns respectively, without horizontal overflow. All six covers load. Full-page screenshots and phone filtered-card screenshot inspected in `showcase-gallery-qa/`.
- Construction, finance and wellness filters show 2, 1 and 3 playable courses. The Coming next item remains separate. Enter activates a filter; keyboard focus has a visible 2px outline. Nutrition card opens its matching course; returning to the gallery reinitializes working filters.
- Console was clean before course navigation. One browser view-transition abort was recorded during the responsive/navigation run: `Viewport size changed`. This is retained in `checks.json` for the final integration pass to distinguish from a repeatable application failure. No course/filter failure was observed.
- All six social JPEG crops visually inspected. All export dimensions and cover file sizes checked from actual metadata. Export script syntax and `git diff --check` pass.

Not deployed by this change.
