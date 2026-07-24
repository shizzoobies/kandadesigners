# K&A Performance — Session Handoff

**Date:** 2026-07-24 · **Branch: `main` (repo checked out here now)** · **Status: LIVE at ka-performancefl.com** — launched today, then heavily iterated. `rebuild/dark-cinematic` is merged and historical.

## DEPLOY RUNBOOK (critical, read first)

**Git-triggered Cloudflare builds FAIL** (unknown cause). Lockfile is synced (`npm ci` passes in a fresh local clone), imports are case-clean; the fix needs the build log from a **Failure** deployment (dashboard → Pages project `kandadesigners` → Deployments → click a Failure → copy log). Alex was asked to paste it; still pending.

Until fixed, EVERY change ships manually:
1. `node node_modules/astro/astro.js build` (never `npm run build` — the `&` in the repo path breaks cmd.exe)
2. `npx wrangler pages deploy dist --project-name kandadesigners --branch main --commit-dirty=true` (wrangler is already authed on this machine)
3. Still `git push origin main` for history (first push attempt often fails with "failed to push some refs"; an immediate retry always works)

Other deploy facts:
- `public/_headers` makes HTML always-revalidate and assets immutable. **Never remove it** — the old site's 7-day `s-maxage` once hid new deploys behind stale cache and also caused a mixed-version outage (cached HTML pointing at purged hashed CSS). If that ever recurs: union-deploy old hashed assets into dist (fetch them from prior `<id>.kandadesigners.pages.dev` deployment URLs).
- **Never verify a deploy by hitting only `/api/*`** — functions deploy even when the static build produced nothing. Check `/` content.
- Local wrangler dev: `npx wrangler pages dev dist --port 8788 --compatibility-date=2026-06-18`; restart it after builds that add/remove routes. No `.dev.vars` exists → AI endpoints 503 locally (they're guarded); production has all secrets.

## Design system (Alex's hard rules in memory: design-tastes-alex)

- **Palette "Earthen Sophisticate":** canvas `#F8F5F2`, ink `#221C15`, muted `#6C635A`, accent rust `#9A3412` (hot `#7C2D12`), amber `#D97706` = buttons/highlights ONLY with espresso text (amber fails AA as text on light). Dark band = teal (`#0B302D→#134E4A`, light-teal `#5EEAD4` accent). Tokens in `src/styles/global.css` `@theme`.
- **Type:** display = Schibsted Grotesk 700 (`--font-display`, base rule sets weight); body/UI = Atkinson Hyperlegible Next; kickers/caps labels = Lenia Mono (`font-mono`); Fraunces ONLY in the logo lockup. Retired: Grivon, Neutrix, Fraunces-as-display, New Black (flat W/V vertices Alex hated).
- **Logo:** `src/components/LogoLockup.astro` — serif crest: K & A (Fraunces, roman rust ampersand — NOT italic, that's the "Et" squiggle), italic *Performance*, rule+diamond (line-draws), Lenia caps descriptor. Nav = compact variant with shrink-on-scroll; footer = full crest. Old logo files kept in public/images.
- **Hard rules:** NO em dashes anywhere user-visible (AI prompts instruct against them too); no pill/chip UI; no numbered/redundant eyebrow headers; everything measured-AA.

## Kai (the one assistant name, everywhere)

- Corner FAB chat: `SiteGuide.astro` → `/api/guide` (claude-haiku-4-5-20251001).
- Services page demos: text chat modal (same `/api/guide`) + **custom voice stage**: NOT the ElevenLabs widget — `@elevenlabs/client` SDK, breathing amber orb pulsing with `getOutputVolume/getInputVolume` into `--amp` (see `docs/elevenlabs-agent/README.md`; agent id `agent_2101ky8y21nmeh5ah2ytbntetzhm`, voice qSeXEcewz7tA0Q0qk9fH).
- Scoping: `ScopeChat.astro` → `/api/scope` (claude-sonnet-5), on /contact/ (fixed-height card, internal scroll) AND inside `StartProjectModal.astro`.
- **StartProjectModal** intercepts every `/contact/`-bound conversion CTA site-wide (tabs: Scope with Kai / message form). Opt-out via `data-no-modal` (nav + footer Contact links). Not rendered on /contact/.
- Astro gotcha that bit twice: **runtime-created chat bubbles need `<style is:global>`** — scoped styles never reach them.
- Kai's ElevenLabs KB is STALE vs `docs/elevenlabs-agent/knowledge-base.md` (pending: no-stock rewording, no-job-too-small, free quotes, standalone artist commissions, em-dash ban). Re-upload needs a fresh ElevenLabs key (old one rotated): create KB doc from the md + PATCH agent.

## Google reviews

- `/api/reviews` (Places API New, 6h edge cache) — env `GOOGLE_MAPS_API_KEY` + `GOOGLE_PLACE_ID`=`ChIJ3fkKtTBqQykRtVwEZZwaY3M` set in **Production only** (Preview scope never added → preview tests return empty).
- `ReviewsRail.astro`: ≤4 reviews → static centered set (current state, 3 five-star reviews live); >4 → drifting rail whose halves repeat to overfill the viewport. `?revmax=N` on localhost simulates counts. "Leave a review" links to `https://g.page/r/CbVcBGWcGmNzEBM/review`.

## Home page structure (HeroGallery.astro is the beast)

Acts: sketch hero (line-drawn mac window) → scroll: 17-tile mosaic pops in (7 mains + 10 inner-page extras) → extras disperse, mains sweep into 3D ring (z-order set at sweep start; LIVE band progress 0.60–0.79; side arrows, dots, half-stage click zones; clicking a not-yet-live ring snaps scroll into the band via Lenis) → recede, overlapped by the a11y sketch section (`lg:-mt-[34vh]`, scrub-drawn so the canvas is never blank; text slides in after). Scroll cue falls left into a subtle rust glow rail tracking page depth. Then teal AI band → artists teaser → reviews → CTA. Services page has its own bespoke timelines (shots fan, SEO typing demo, audit ticks, process diamond rail).

## Artists

Bobbie (illustration), Jon Marc (digital/identity), Nicole (mixed media) — all "Portfolio coming soon" ribbons, cards de-linked, detail pages exist at real-name slugs but unreachable. When a portfolio arrives: replace art in `src/data/artists.js`, drop the ribbon, re-link card + home teaser. Placeholder art = Pixabay files in `public/images/art/`.

## Open items

1. **Fix git CI builds** (needs Alex's build log) — retires manual wrangler deploys.
2. **Re-upload Kai's ElevenLabs KB** (needs fresh key; content ready in repo).
3. **Artist portfolios** → de-ribbon flow above.
4. Preview-scope Google env vars (only if preview testing wanted).
5. Nice-to-haves: favicon + OG image from the new crest; standalone outlined-SVG logo for print; `/api/scope` WAF rate-limit rule (never done).

## Process notes

Alex iterates fast by feel: ship, show, expect tweaks; mid-turn asks are constant. Verify every visual in Playwright against the wrangler build (screenshots → `.superpowers/sdd/`). He pastes dashboard screenshots/logs when asked plainly. Bash quoting on this repo path is treacherous (trailing `\"` errors) — prefer node scripts for multi-file edits. Playwright MCP blocks `file://` — stage specimens into `dist/__name/` and view via wrangler (wiped on rebuild; re-stage after).
