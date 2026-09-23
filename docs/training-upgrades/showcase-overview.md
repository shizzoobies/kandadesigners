# Training section visual upgrade

Built from production commit `6048697` on `codex/training-showcase`.

## Overview

The training overview now leads with an illustrated course feature and three course preview links. The following sections show real activity and audio screenshots, the illustrated kitchen guide, grouped capabilities, the delivery process, LMS and accessibility information, the owners, engagement options and practical questions.

`TrainingOverview.astro` owns the presentation. The existing inquiry markup and three lifecycle/submission scripts stay in `src/pages/training/index.astro`. The inquiry close control has a visible label. Service facts and the course publication list remain in the established training data.

The activity and audio preview files in `public/images/training/showcase/` are optimized exports of the previously verified strength sorting screen and sauna notebook with audio open. They are course screenshots, not simulated interactive controls. The six course cover assets and generation prompts are documented in `showcase-gallery.md`.

The homepage AI orientation video and signup remain in place. New course previews appear beneath that experience. Course introductions and Open Graph images use the same cover system as the gallery. Team members awaiting content have a visible pending profile state.

## Verification

- Combined Astro build: 43 pages, passed.
- SEO gate: 29 indexable and 14 noindexed routes, passed.
- Local reference check: 587 links/assets across ten affected built routes, no missing references.
- Cover exports: six 1200 x 750 WebP files and six 1200 x 630 JPEG files. Course strip text contrast ranges from 7.35:1 to 11.50:1.
- All six cover illustrations visually inspected by the root task. Social crops also inspected by the cover agent.
- Independent source review confirmed the inquiry form and submission scripts match the previous implementation. No external form submission was made.

## Rendered verification

Verified on `http://127.0.0.1:62160/training/` at 360 x 800, 768 x 1024 and 1280 x 900. Screenshots are in `showcase-overview-qa/`.

- No horizontal overflow. All overview images loaded successfully after scrolling the page.
- Visually inspected the final desktop, tablet and phone hero, tablet course row, and desktop activity, guide and audio previews. Full-page captures were refreshed after lazy images loaded.
- New inquiry links open the existing dialog. Required-field validation, initial focus, labeled close, focus restoration and the `?inquire=1` entry point passed. No inquiry was submitted.
- FAQ disclosure opens correctly. Browser warning/error log was empty during the overview checks.
- Independent integrated checks covered the homepage video, gallery filters and navigation, all six course introductions, and team profile dialogs. See `showcase-gallery.md`, `showcase-previews.md` and `showcase-team.md` for their evidence and limits.
- Screen-reader and OS reduced-motion emulation were not performed. Native semantics, focus behavior and existing reduced-motion rules were reviewed; this is not an accessibility certification.

No production release is recorded here.
