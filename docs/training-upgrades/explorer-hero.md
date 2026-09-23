# Lead with What We Build

Replaced the training overview's headline and featured safety card with the approved What We Build explorer. The capability heading is now the page's sole H1, with H2 headings for each format description. The existing `#capabilities-heading` link remains valid.

The explorer appears once, at the top. The course gallery and inquiry actions sit immediately below it, followed by section navigation and course previews. The former capability section farther down the page and the obsolete hero styles were removed. Course content, descriptions, inquiry submission logic and metadata are unchanged.

## Verification

- Astro build: 43 pages passed. SEO gate: 29 indexable pages passed.
- Visually inspected the new opening at 360 x 800, 768 x 1024 and 1280 x 900; no horizontal page overflow. Evidence in `explorer-hero-qa/`.
- One H1 and one explorer; no old featured hero card remains.
- Keyboard ArrowRight selects Modules and shows Standard modules under its H2.
- The retained inquiry button opens the dialog with focus on the name field. Close restores focus to the opener. No submission was made.
- Browser warning/error log was empty. Explorer animation, touch selection and fallback behavior are unchanged from the previously verified component.

Local preview only; this layout change has not been published.
