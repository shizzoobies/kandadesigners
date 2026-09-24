# Accent color preview

Implemented on `codex/site-accent-color`, based on the local training hero reorder (`1218933`). Neither that reorder nor this accent pass has been published.

## Changes

- Added pale amber and teal surface tokens while retaining cream reading areas and rust text accents.
- Added amber illustration details and selected tabs to the training explorer, with a pale teal illustration stage.
- Added four decorative SVG illustrations to service cards, restrained alternating tints, and hover/focus details.
- Extended accents into homepage project tabs, preview frames, mentorship deliverables, video controls, artwork framing, and owner portraits.
- Added teal portrait rings and amber pending-profile badges on the training team page.
- Retained existing copy, links, scripts, forms, video behavior, and dark section palette.

## Verification

- Astro production build passed: 43 pages.
- SEO check passed: 29 indexable pages and 14 excluded pages. No lint or unit test scripts are defined.
- `git diff --check` passed.
- Inspected actual browser screenshots of `/`, `/training/`, `/services/`, and `/training/team/` at 360, 768, and 1280 CSS pixels. No horizontal page overflow was observed. Evidence is in `accent-color-qa/`.
- Tested homepage project selection, contrast demo toggle, video play/pause, and team profile open/close. Browser warning/error logs were empty in the final homepage and team checks.
- Independent code review found no actionable regressions. New text/background combinations tested between 4.98:1 and 8.02:1; dark text on amber was 5.29:1.
- New decorative SVGs are hidden from assistive technology. Focus styling and reduced-motion handling were reviewed in source. No external forms were submitted, and reduced-motion behavior was not separately emulated in the browser.

Preview base: `http://127.0.0.1:62160`.
