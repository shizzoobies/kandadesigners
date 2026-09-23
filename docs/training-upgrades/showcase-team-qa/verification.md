# Training team page QA

- Astro production build: PASS with `ASTRO_TELEMETRY_DISABLED=1 node D:/K & A Performance Site/node_modules/astro/astro.js build`.
- SEO check: PASS, 43 routes checked and 29 indexable routes retained in the sitemap.
- Generated HTML: five profile dialogs and five training Person nodes, matching the five entries with both a portrait and bio. All three incomplete profiles render `Profile coming soon`, and none has a dialog. The site layout's existing two owner Person nodes are separate from the page's conditional profile graph.
- Generated copy: visible `Read profile` and `Close profile` cues; no bio drafting or sign-off placeholder text.
- Visual QA: full-page screenshots at 360x800, 768x1024, and 1280x900 were saved here and visually inspected. Each has no horizontal overflow (`scrollWidth` equals `clientWidth`). Team tiers, portraits, monogram placeholders, labels, and lower page sections render at all three widths.
- Interaction QA: at 360px, Enter on Alex's profile button opens the native dialog, focus moves to its heading, Escape closes it and returns focus to the opener. At 1280px, pointer open and the labeled `Close profile` control close the dialog and restore opener focus. The three pending entries are static non-button elements without dialogs. Browser console error log was empty.
- Reduced-motion emulation was not checked.
- Final integrated bench artwork: four current covers loaded, and separate image/title tiles were visually inspected at 360, 768 and 1280 pixels with no horizontal overflow. Section captures are `bench-360.png`, `bench-768.png` and `bench-1280.png`; earlier full-page captures document the profile changes before this last artwork polish. Combined Astro build and SEO gate passed again after integration.
