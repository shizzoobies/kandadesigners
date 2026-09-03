# Training content section: build plan

**Date:** 2026-09-03 · **Brief:** `TAAS/extracted/ka-handoff/05-website-build/BRIEF.md` (read `README-HANDOFF.md` first) · **Owner:** Alex

## Decisions taken (Alex, 2026-09-03)

- **Nav:** "Training" takes a primary nav slot; "Free Course" leaves the primary nav and stays reachable from the Mentorship page, the home band, and the footer.
- **Samples:** one original construction-and-trades microlearning is built now, in this repo, so the samples page has something playable on day one. The three planned originals stay as marked placeholders.
- **URL:** `/training/` top level, with `/training/samples/`, `/training/samples/<slug>/`, `/training/team/`, `/training/capabilities/` (print-styled source of the PDF).

## The four hard constraints, enforced where

| Constraint | Enforced by |
|---|---|
| No pricing anywhere | `src/data/training.js` is the only fact source; a grep for `$`, `per hour`, `starting at`, `/hr` across `src/pages/training`, `src/data/training.js`, `public/training-samples` must return nothing before commit |
| No unaudited portfolio work | `samples[].status` gates rendering; the eleven `public/interactives/` pieces are listed as `'audit'` and render nowhere |
| No names without permission | `bench[].named` / `smes[].named` default false; placeholders render structure only. The three IDs already on `/artists/` are NOT linked (different permission) |
| Accessible, as acceptance criteria | axe + Lighthouse (from `D:/kap-reel/node_modules`, zero installs) on every new page, a scripted keyboard pass, an accessibility-tree read-through, and the sample viewer specifically checked for focus traps; results written into `/accessibility/` |

Also standing sitewide: no em dashes, no numbered eyebrow kickers, no chips, Earthen tokens only, `btn-draw` / `btn-accent` / `btn-ghost` / `.field` / `.glow-frame` from `global.css`, `data-animate="type-settle|frame-lift"` from `src/scripts/motion.js` (from-states only, so no-JS and reduced motion see the finished page).

## Work units

Shared prep (done before dispatch): `src/data/training.js`, `src/components/TrainingSubnav.astro`, `btn-draw` promoted to `global.css`, directories created.

| # | Unit | Files | Agent |
|---|---|---|---|
| A | Anchor page: hero, verticals, what we build, delivery, pipeline, accessibility, AI transparency, engagement models, inquiry modal (Web3Forms, subject stamped, intake questionnaire fields), Service + Breadcrumb schema | `src/pages/training/index.astro` | opus |
| B | Samples grid + viewer + the original sample (self-contained HTML, WCAG 2.1 AA, keyboard, reduced motion, no external deps) | `src/pages/training/samples/index.astro`, `src/pages/training/samples/[slug].astro`, `public/training-samples/rfi/` | opus |
| C | The bench + SME section, placeholders, combined-years headline, no endorsement framing | `src/pages/training/team/index.astro` | sonnet |
| D | Capabilities page (print-styled, single page) + PDF script using Playwright from `D:/kap-reel/node_modules` + committed PDF | `src/pages/training/capabilities/index.astro`, `scripts/capabilities-pdf.mjs`, `public/downloads/KA-Performance-Training-Capabilities.pdf` | opus |
| E | Wiring: Nav, Footer, services index card, `_headers` noindex for `/training-samples/*` and `/training/capabilities/*`, home not touched | `Nav.astro`, `Footer.astro`, `services/index.astro`, `public/_headers` | me |
| F | Verification: build, axe, Lighthouse, keyboard script, tree read-through, constraint greps; fix loop; then `/accessibility/` gets the training test log and the sample-viewer limitation | `src/pages/accessibility/index.astro` | me |

A, B, C, D run in parallel; they touch disjoint files and only read `training.js`. E and F follow.

## What Alex owes before this is "launched" (build around, do not block)

1. Provenance answers for the eleven `public/interactives/` pieces (and the free course, which came from the `UHU Stuff` folder)
2. Marketing-use elections for four IDs and two SMEs, approved bios, headshots or declines
3. The three planned originals
4. Confirmation of the combined-years figure (currently `combinedYears = 60`, rendered as "roughly")
5. Project Makeover naming permission (only reference; not used anywhere yet)

## Definition of done (from the brief)

- Builds and deploys clean
- Zero axe violations on every training page and the updated pages; keyboard and tree pass documented in `/accessibility/`
- No pricing in the repo (grep clean)
- No unaudited work published; no unelected names
- PDF generates from site content and downloads
- Lighthouse accessibility and best practices 100; mobile performance reasonable
