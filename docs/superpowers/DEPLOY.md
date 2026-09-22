# Deploying the Rebuild (branch `rebuild/dark-cinematic`)

## One-time Cloudflare Pages dashboard changes (Alex)

The repo used to deploy with no build step. The rebuild is an Astro project, so the Pages project config must change **before** merging to `main`:

1. Cloudflare dashboard → Pages project for ka-performancefl.com → **Settings → Builds & deployments**
2. **Build command:** `npm run build`
3. **Build output directory:** `dist`
4. Root directory: leave as `/` (repo root)
5. **Environment variables / secrets:** `ANTHROPIC_API_KEY` already exists (used by the old chat function) — nothing to add. The scoping assistant reuses it.
6. **Rate-limit the assistant (recommended before launch):** dashboard → Security → WAF → Rate limiting rules → new rule matching URI path `/api/scope`, e.g. max 10 requests per minute per IP, action Block. This caps what a scripted abuser can spend of your Anthropic quota; no code change needed.

**Sitemap scope (deliberate call):** the sitemap lists only the 7 marketing routes. The spec said "including preserved apps," but listing games/tools in the marketing sitemap dilutes what search engines see as the site's purpose — the apps remain crawlable and linked. Override by editing `public/sitemap.xml` if you want them indexed.

Recommended order: push `rebuild/dark-cinematic`, point a **preview deployment** at it, verify, then merge to `main`.

## Post-deploy smoke test (5 minutes)

- [ ] `/` loads; hero wireframe draws in; craft sequence scrubs while scrolling
- [ ] `/chess/`, `/voicecheck/`, `/daily-songs-x7k2/`, `/tools/` still work (preserved apps)
- [ ] `/contact/` — send ONE test message to the AI assistant; expect a scoping question back
- [ ] Contact form — one labeled test submission; check inbox
- [ ] `https://ka-performancefl.com/sitemap.xml` and `/robots.txt` show the new content

## Content-swap checklist (placeholders → real content)

| What | Where |
|---|---|
| Artist names, bios, statements, portraits, galleries | `src/data/artists.js` (one file drives all artist pages) |
| Work project titles/blurbs (verify my corrected versions) | `src/data/work.js` |
| Artists teaser images on homepage | `src/pages/index.astro` (Artists teaser section) |

After editing: commit + push; Cloudflare rebuilds automatically.

## Local development (Windows note)

`npm run build` / `npm run dev` fail on this machine because cmd.exe chokes on the `&` in the repo path. Use:

```bash
node node_modules/astro/astro.js dev --port 4321
```

```bash
node node_modules/astro/astro.js build
```

Full local run with functions (uses your system `ANTHROPIC_API_KEY`):

```bash
npx wrangler pages dev dist --port 8788 --compatibility-date=2026-06-18
```

## The SEO gate (`scripts/seo-check.mjs`)

A build gate that reads `dist/` and fails on the metadata rules the plan had already written down but nothing enforced. It is wired as npm's `postbuild`, so Cloudflare's `npm run build` fails the deploy rather than shipping a page that breaks them.

What it enforces:

- Every URL in the generated `dist/sitemap-0.xml` must have a `<title>` of **60 characters or fewer**, a `<meta name="description">` of **140 to 160 characters**, a canonical equal to its own sitemap URL, and **no** `noindex` robots meta (a page cannot both ask to be indexed and refuse).
- Every other Astro route the build emits (`index.html` / `404.html`) must carry a `noindex` robots meta. Pass `noindex` to `BaseLayout` to get one.
- Whether a page is an Astro route is decided from `src/pages`, so a routed page under a `NOINDEX` path (the course pages, the capabilities page) is still checked. Static files under a `NOINDEX` path are skipped: they live in `public/`, are already noindexed by `public/_headers`, and never pass through the layout. A static file outside every `NOINDEX` path fails, because nothing is keeping it out of the index. The script parses the `NOINDEX` array out of `astro.config.mjs` rather than keeping its own copy, so the two cannot drift.

Lengths are counted on decoded text, not raw HTML, so the `&` in "K & A Performance" counts as one character rather than the five of `&#38;`.

Because local builds bypass npm (see the Windows note above), run it by hand after a build:

```bash
node node_modules/astro/astro.js build
node scripts/seo-check.mjs
```

It prints a row per page with both lengths and exits 1 on any failure. `npm run seo-check` does the same thing where npm works.

## Fonts licensing note

Grivon + Neutrix are self-hosted woff2 in `public/fonts/`, converted from your Envato Elements downloads (originals in `fonts-drop/`, git-ignored). Licensed to your Envato account — keep the subscription record.
