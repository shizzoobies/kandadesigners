# Visual capability explorer

Replaces the three text-heavy capability columns on `/training/` with seven original SVG miniatures and a shared description panel. All deliverable descriptions still come from `src/data/training.js`; the three original grouping notes remain in the selected panel.

Desktop mouse hover previews a format and animates its illustration. Click and keyboard focus select the same content. Keyboard users have Left/Right, Home/End, and Tab access to the active description. Mouse hover does not override a keyboard-focused format. Small screens use a horizontally scrollable row with tap selection and hover disabled.

All descriptions render in the initial HTML. Without JavaScript the controls stay hidden and the complete descriptions remain visible. Initialization runs on Astro page navigation with a per-component binding guard. Reduced-motion styles disable illustration transitions and the description entrance animation. No dependencies or raster assets were added.

## Verification

- Astro build passed: 43 pages. SEO gate passed: 29 indexable pages and 14 excluded pages. No lint or unit-test scripts are configured.
- Local route: `http://127.0.0.1:62160/training/#capabilities-heading`.
- Visually inspected 360 x 800, 768 x 1024 and 1280 x 900. No horizontal page overflow. Phone scrolling is confined to the format row.
- Clicked every format and confirmed exactly one matching full description, including the original long titles. Results in `capability-explorer-qa/selection-checks.json`.
- Desktop mouse preview selected Content refresh while focus remained on the previously clicked Full courses button, confirming hover works after a click. Active illustrations and description transitions were visually inspected.
- Right Arrow moved Full courses to Modules. End selected Accessibility, Home returned to Full courses, and Tab focused its description panel.
- Phone horizontal scrolling reached the last options; clicking Accessibility displayed its complete description. Fresh route initialization returned to Full courses. Browser warning/error log was empty.
- Screenshots are in `capability-explorer-qa/`. Reduced-motion and JavaScript-disabled behavior were reviewed in source, not browser-emulated. No screen-reader certification is claimed.

Local preview only. This follow-up has not been published.
