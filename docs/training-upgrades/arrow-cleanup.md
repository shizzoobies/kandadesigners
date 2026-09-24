# Decorative arrow cleanup

Removed decorative arrow suffixes from training, service, location, team, portfolio, project and interactive-library links. Course cards now use their text and existing hover/focus treatment without a redundant arrow or play symbol. The training inquiry Close button uses its label alone. Removed the decorative mentorship hover arrow pointing at Kai. Existing carousel controls, real audio/video controls and explanatory diagrams remain.

## Checks

- Astro build: passed, 45 pages. SEO: passed, 29 indexable pages.
- JavaScript syntax checks passed for both changed lesson scripts.
- Compared all 24 changed source files against the release baseline: hrefs, IDs, aria-labels, aria-controls and action hooks are unchanged.
- Inspected training at 1280 and 360 pixels, catalog cards at 768 pixels, and service cards at 768 and 360 pixels. Screenshots are in `arrow-cleanup-qa/`. No horizontal overflow was observed in checked mobile layouts.
- Keyboard Enter on Explore all six courses opened the catalog. Opening and closing the training inquiry restored focus to its trigger. No form submission or paid chat session was started.
- Browser checks confirmed no arrow text in links/buttons on thirteen additional routes; results are in `arrow-cleanup-qa/route-checks.json`. These routes were checked for content, not exhaustively reviewed at every viewport.
- Training, services and mentorship console checks were empty. The mentorship chat button remains present and the decorative fixed SVG is gone.
- Existing focus styling and reduced-motion handling are retained. No new animation was introduced.

User authorized publishing this cleanup after verification.
