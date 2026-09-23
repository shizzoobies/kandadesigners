# Training team page QA

- Astro production build: PASS with `ASTRO_TELEMETRY_DISABLED=1 node D:/K & A Performance Site/node_modules/astro/astro.js build`.
- SEO check: PASS, 43 routes checked and 29 indexable routes retained in the sitemap.
- Generated HTML: five profile dialogs and five training Person nodes, matching the five entries with both a portrait and bio. All three incomplete profiles render `Profile coming soon`, and none has a dialog. The site layout's existing two owner Person nodes are separate from the page's conditional profile graph.
- Generated copy: visible `Read profile` and `Close profile` cues; no bio drafting or sign-off placeholder text.
- Browser checks at 360x800, 768x1024, and 1280x900: pending access to the shared browser.
