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

## Fonts licensing note

Grivon + Neutrix are self-hosted woff2 in `public/fonts/`, converted from your Envato Elements downloads (originals in `fonts-drop/`, git-ignored). Licensed to your Envato account — keep the subscription record.
