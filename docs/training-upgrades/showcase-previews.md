# Shared course previews

## Scope

- Homepage keeps the existing AI orientation video, transcript, playback controls and signup links. Three course cards now make the custom training work visible below that experience.
- Sample introductions use the same course cover and summary as the gallery. The course action appears before optional design and accessibility details.
- Every introduction includes a labeled Close introduction control. View the course, Escape, backdrop dismissal and About this sample remain available.
- Each sample supplies its matching social image to BaseLayout and its LearningResource metadata.
- Course URLs, iframe content, sample navigation, completion hooks and inquiry query parameters are preserved.

## Shared dependency

`src/data/trainingPresentation.js`, `src/components/TrainingCourseCard.astro` and the six cover/social image pairs are owned by the gallery change. Integrate that change before this one.

## Verification

- Astro build passed with the shared gallery component and data dependencies copied into the preview checkout.
- SEO gate passed: 43 routes, 29 indexable pages and 14 intentionally noindexed routes.
- The integrated build contains the matching cover and social image metadata on all six sample routes, plus the labeled close control, primary course action and existing iframe.
- Browser checks used the integrated preview at `http://127.0.0.1:62160/`.
- All six sample introductions at 360 x 800 loaded their cover, had no horizontal overflow or default internal dialog scroll, and kept the primary action visible. The action's bottom edge was between 577 and 605 pixels.
- Visually inspected the strength introduction at 360 x 800 and 768 x 1024, and the finance introduction at 1280 x 900. All three were readable and contained within the viewport.
- Close introduction, About this sample, the production-details disclosure and Escape worked. Closing restored focus to the iframe and released the page scroll lock.
- Visually inspected the homepage course cards at 360 x 800, 768 x 1024 and 1280 x 900. All images loaded; there was no horizontal overflow.
- The retained homepage orientation video reached readyState 4 and actual playback, then paused with the existing button. Signup and lesson links remain present.
- At a steady phone viewport, homepage to gallery to nutrition course navigation and View the course passed with an empty warning/error console. An automated click issued before an earlier Astro transition settled was swallowed; the settled interaction passed. No transition-abort console error reproduced.
- Reduced-motion behavior was checked in source, not through browser emulation. No production deployment is included.

Screenshots and `preview-checks.json` are saved in the preview checkout at `output/playwright/`: `home-courses-{360,768,1280}.png`, `strength-intro-{360,768}.png` and `finance-intro-1280.png`.
