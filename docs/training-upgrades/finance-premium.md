# Reading the P&L premium production

Local preview: http://127.0.0.1:62128/training-samples/finance/

The nine-screen module is rebuilt around the fictional bakery owner's desk. Bottle green, cream paper, brass details and the existing licensed typefaces connect it to the finished safety production without copying the safety setting.

## Deliverables

- Bespoke bakery hero illustration: public/training-samples/finance/assets/img/bakery-desk.webp
- Bespoke illustrated finance guide: public/training-samples/finance/assets/img/finance-guide.webp
- Nine prerecorded Bella introductions: assets/audio/screen-1.mp3 through screen-9.mp3, approximately 4 minutes 35 seconds combined.
- Exact transcript source: narration.js. The generation script reads this same source.
- Bottom audio dock with reserved transcript space, native seeking/volume controls and an activity indicator driven by actual media playing/waiting/pause/end events. No simulated lip sync or browser speech.
- Interactive statement explorer, price/volume/production-cost model, ten receipt filing tasks, cash reconciliation, evidence-based expansion brief and numeric calculation practice.
- Keyboard equivalent for receipt drag and drop.
- Downloadable personal review card. The free-text question remains local and is escaped when redisplayed.
- Full readable reference workbook at workbook.html, linked from the no-JavaScript fallback.
- Existing completion message retained: type ka-sample-complete, slug reading-the-pnl, classify/decision/reads score fields. Sent only when Finish review is pressed, once per run.

No shared catalog files were changed. No deployment was performed. No credentials are present in public assets. The narration generator reads the existing root .dev.vars file by default or KA_ENV_FILE.

## Verification

Browser used: Codex in-app browser. The browser skill was read and its documented connection succeeded; no Playwright fallback was needed.

- All nine screens checked at 360x800, 768x1024 and 1280x900. No horizontal overflow or broken images in the 27 checks. Desktop screens fit without lesson scrolling. Tablet has 19px of internal scroll on the decision brief. Phone screens use one contained vertical lesson scroll; footer and audio remain available.
- Screenshots saved and visually inspected for the desktop cover, statement, cash bridge and decision brief, tablet receipts and phone receipts. Saved evidence is in finance-qa/.
- Real playback verified for all nine MP3 files: readyState 4, paused false, valid duration. An advancing currentTime was observed during the cover introduction.
- Transcript opening measured: lesson bottom and audio dock top both 571px at 1280x900. The tray reserves space and does not overlay the lesson.
- Five keyboard ArrowRight presses moved production cost from 40% to 45%, giving $1,000 operating income.
- Incorrect receipt filing produced corrective feedback; all ten then filed correctly.
- Incorrect cash reconciliation produced feedback; $9,000 / $6,000 / $6,600 produced a $17,500 cash decrease.
- Empty decision brief produced corrective feedback; margin trend, cash forecast and build-out schedule produced a complete brief.
- Wrong margin answer produced corrective feedback; all three correct calculations gave 3 of 3.
- Completion dialog displayed 10 of 10 receipts, 3 of 3 calculations and completed evidence brief. Escape dismissed it.
- Browser error/warning log inspection returned an empty list after the full activity run.
- node --check passed for app.js, narration.js and scripts/generate-finance-narration.mjs.
- Root agent owns the integrated Astro build and wrapper verification.

Fixes found during QA: corrected the receipt tray closing markup and selected-control hover contrast. Both were rechecked in the browser.

Limits: no deployment; host postMessage receipt not exercised in an iframe here; download content generation reviewed but the saved download was not inspected; reduced-motion CSS is implemented but OS emulation was not exercised. No full-file audio decoding or professional accounting certification is claimed.

## Image production

Built-in imagegen was used. Generated originals remain in the Codex generated_images folder; optimized project copies above are the consumed assets.

Hero prompt:

Use case: illustration-story. Asset: wide premium educational course hero illustration for K&A Performance, reading a bakery profit and loss statement. Beautiful editorial hand painted digital illustration with restrained fine outlines, sophisticated warm cream, bottle green, muted brass and terracotta palette. Wide landscape composition, warmly lit independent bakery interior with a wood counter in foreground containing an open ledger with abstract simple ink lines (no readable text), brass calculator, paper receipts, croissant on ceramic plate and a small vase. Background bread shelves and softly sunlit arched window. Calm sophisticated professional magazine illustration, tactile paper grain, rich dimensional shadows, deliberate composition, no text, no typography, no numbers, no logos, no photo realism, no 3D plastic. Landscape 1536x1024.

Guide prompt:

Use case: illustration-story. Asset: premium illustrated course guide portrait for K&A Performance finance training. Character is a friendly confident professional woman in her late 30s with warm medium brown skin, expressive brown eyes, dark curly hair tied up, cream collared shirt under a deep bottle green cardigan, small brass earrings, holding a slim ledger folder. Elegant editorial hand painted digital illustration, fine outlines, tactile paper grain, sophisticated restrained shading. Bust portrait from waist up, centered, both hands visible naturally resting on folder, calm welcoming smile, looking at viewer. Solid warm cream background #f8f3e7, no scene objects. Not childish, not anime, not 3D plastic. Square composition 1024x1024, generous room around silhouette, no lettering, no text, no logos. Brand mark will be added separately in HTML.
