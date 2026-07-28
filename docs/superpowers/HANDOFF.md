# K&A Performance — Session Handoff

**Date:** 2026-07-24 (evening update) · **Branch: `main`** · **Status: LIVE at ka-performancefl.com** — launched today. CI is FIXED: `git push origin main` now auto-builds and deploys. Latest commit: Berkseth badge swap in Jon Marc's gallery (94c7c4e).

## DEPLOY RUNBOOK (critical, read first)

**Git-triggered Cloudflare builds WORK** (fixed 2026-07-24, commit 45c0aa7): normal flow is build locally to verify, then `git push origin main` and Cloudflare builds + deploys automatically (~2-3 min). Verify at ka-performancefl.com (check page content, never just `/api/*`).

**Root cause was npm version skew, and it can RECUR:** CI runs npm 10.9.2, this machine runs npm 11.6.2. The lockfile needs top-level entries for `@emnapi/core` + `@emnapi/runtime` @1.11.2 (deps of platform-skipped wasm32 optionals of sharp/tailwind/rolldown). npm 10 refuses `npm ci` without them; **npm 11's `npm install` silently strips them** (even `--package-lock-only`). So: after ANY local `npm install`, grep `package-lock.json` for `"node_modules/@emnapi/core"` — if gone, re-add both entries (exact blocks in commit 45c0aa7) before pushing. Permanent fix Alex can make once: Pages dashboard → kandadesigners → Settings → Variables → build env var `NPM_VERSION` = `11`. (Not done yet as of this writing.)

Manual deploy (fallback only):
1. `node node_modules/astro/astro.js build` (never `npm run build` — the `&` in the repo path breaks cmd.exe)
2. `npx wrangler pages deploy dist --project-name kandadesigners --branch main --commit-dirty=true` (wrangler is authed, but Claude's deploy/skill runs get auto-blocked by the permission classifier — hand Alex the command in a bash-fenced block, he runs it. Read-only wrangler commands like `pages deployment list` are allowed.)
3. `git push origin main` for history (first push sometimes fails; immediate retry works)

Local preview: `npx wrangler pages dev dist --port 8788 --compatibility-date=2026-06-18`. NOTE: these background dev servers on this machine get externally terminated after a while (exit 1, clean log) — just restart, it's not a code problem. No `.dev.vars` → AI endpoints 503 locally; production has all secrets.

## Design system (Alex's hard rules in memory: design-tastes-alex)

- **Palette "Earthen Sophisticate":** canvas `#F8F5F2`, ink `#221C15`, muted `#6C635A`, accent rust `#9A3412` (hot `#7C2D12`), amber `#D97706` = buttons/highlights ONLY with espresso text (amber fails AA as text on light). Dark band = teal (`#0B302D→#134E4A`, light-teal `#5EEAD4` accent). Tokens in `src/styles/global.css` `@theme`.
- **Type:** display = Schibsted Grotesk 700 (`--font-display`); body/UI = Atkinson Hyperlegible Next; kickers/caps labels = Lenia Mono (`font-mono`); Fraunces ONLY in the logo lockup. Retired: Grivon, Neutrix, Fraunces-as-display, New Black.
- **Logo:** `src/components/LogoLockup.astro` — serif crest: K & A (Fraunces, roman rust ampersand — NOT italic), italic *Performance*, rule+diamond, Lenia caps descriptor. Nav = compact shrink-on-scroll; footer = full crest.
- **Brand assets (new):** favicon = rust Fraunces ampersand on canvas (`public/images/favicon-32/192/512.png` + `apple-touch-icon.png`); share card = full crest with warm washes (`public/images/og-card.png`, 1200x630) wired in BaseLayout with og/twitter meta. Rendered from a browser specimen (dist/__brand trick), NOT hand-drawn SVG. Old favicon.svg + site-logo.png left in repo, unreferenced.
- **Hard rules:** NO em dashes anywhere user-visible; no pill/chip UI; no numbered/redundant eyebrow headers; everything measured-AA.

## Kai (the one assistant name, everywhere)

- Corner FAB chat: `SiteGuide.astro` → `/api/guide` (claude-haiku-4-5-20251001).
- Services page demos: text chat modal (same `/api/guide`) + **custom voice stage**: NOT the ElevenLabs widget — `@elevenlabs/client` SDK, breathing amber orb pulsing with `getOutputVolume/getInputVolume` into `--amp` (see `docs/elevenlabs-agent/README.md`; agent id `agent_2101ky8y21nmeh5ah2ytbntetzhm`, voice qSeXEcewz7tA0Q0qk9fH).
- Scoping: `ScopeChat.astro` → `/api/scope` (claude-sonnet-5), on /contact/ AND inside `StartProjectModal.astro`.
- **StartProjectModal** intercepts every `/contact/`-bound conversion CTA site-wide (tabs: Scope with Kai / message form). Opt-out via `data-no-modal` (nav + footer Contact links). Not rendered on /contact/.
- Astro gotcha that bit twice: **runtime-created chat bubbles need `<style is:global>`** — scoped styles never reach them.
- Kai's ElevenLabs KB is STALE vs `docs/elevenlabs-agent/knowledge-base.md`. Re-upload needs a fresh ElevenLabs key (old one rotated): create KB doc from the md + PATCH agent. ALSO stale now: Kai's KB predates Jon Marc's live portfolio.

## Google reviews

- `/api/reviews` (Places API New, 6h edge cache) — env `GOOGLE_MAPS_API_KEY` + `GOOGLE_PLACE_ID`=`ChIJ3fkKtTBqQykRtVwEZZwaY3M` set in **Production only** (Preview scope never added → preview tests return empty).
- `ReviewsRail.astro`: ≤4 reviews → static centered set; >4 → drifting rail with repeated halves. `?revmax=N` on localhost simulates counts. "Leave a review" → `https://g.page/r/CbVcBGWcGmNzEBM/review`.

## Home page structure (HeroGallery.astro is the beast)

Acts: sketch hero (line-drawn mac window) → scroll: 17-tile mosaic pops in (7 mains + 10 inner-page extras) → extras disperse, mains sweep into 3D ring (LIVE band progress 0.60–0.79; arrows, dots, half-stage click zones; Lenis snap) → recede into a11y sketch section (`lg:-mt-[34vh]`) → teal AI band → artists teaser → reviews → CTA. Services page has its own bespoke timelines. Full-page screenshots of animated pages need a scroll-through first (data-animate elements stay opacity-0 until scrolled into view).

## Artists

- **Jon Marc: LIVE** (`/artists/jon-marc/`, linked from home teaser + artists index, no ribbon). Discipline "Graphic design & visual identity". Portrait = composite Alex art-directed: suit photo ghosted (sat 0.45, 78% canvas wash) with JMO caricature mark multiplied on top (`jm-portrait.jpg`). Gallery = curated six (`gallery` in `src/data/artists.js`): Hope for Humanity, Home Improvement, **Berkseth landscaping badge** (newest, replaced Incarnate at Jon Marc's request), Anti-Running club, SLOW series, heel typography. Below: "+ See more of Jon Marc's work" button → site-idiom `<dialog>` modal (`archive` array, 22 square tiles incl. Incarnate; X/backdrop/Esc close). Source drops in `Jon Marc Images/` (untracked); the other original portfolio pulls live in the session scratchpad (gone after cleanup) but originals are at https://jonmarcostrom.myportfolio.com/graphic-design-work (Adobe Portfolio; srcset up to 3840, scrape via browser DOM).
- **Bobbie + Nicole: still ribboned** ("Portfolio coming soon", cards de-linked). To go live: set `live: true` in artists.js, replace `portrait`/`gallery` (+ optional `archive` — modal renders automatically), drop nothing else — index + teaser render from the flag. Teaser on home (`src/pages/index.astro`) is still hardcoded per-artist though — update Bobbie/Nicole cards there manually like Jon Marc's.
- **Nicole: page is BUILT but deliberately NOT live** (2026-07-28). Waiting on Alex to supply a proper **profile picture** — until then `portrait` is a placeholder (the East Bay Legends 10U coin); her own site's headshot is 156x262 and unusable. Real discipline is **"Brand identity & merchandise design"** (coins, apparel, stationery, team identity) — the old placeholder data called her "Mixed media & fine art", which was wrong. Her page uses a **new `sections` shape** (not `gallery`): six categories mirroring nicolecruzdesign.com/work — Team identity, Coins & pins, Invitations, Apparel, Digital, Logos & brand systems — plus a `caseStudy` block. `ArtistLayout` renders `sections`+`caseStudy` when present and falls back to `gallery`/`archive` otherwise, so Jon Marc and Bobbie are untouched. Per-item `fit: 'contain'` letterboxes wide pieces (wordmarks, front+back tee layouts, flyers) on `#F8F5F2` instead of cover-cropping them. **Her site numbers its sections ("01 · TEAM IDENTITY"); we deliberately do not** (house rule) and her AI-ish headline stack was collapsed to a plain title + one line.
- **Nicole images are MIXED-SOURCE — see the big comment at the top of her entry in artists.js.** 33 tiles are local `/images/art/nc-*.webp` (built from `Nicole Images/`, untracked, 68MB of hi-res originals; ffmpeg longest-side 900px libwebp q78 → 3.7MB total). **20 tiles are still HOTLINKED** off her Netlify site because we have no source file — and those filenames are content hashes, so any rebuild on her end renames them and the tiles go blank. Still needed from Nicole: 8 apparel (Truman front/back, Mustangs black+coyote, WRNMMC, USS Detroit Chief's Mess, Vets Helping Vets, Neptune Beach cap, cap+tumbler), 5 digital (3 Tsunami IG posts, BestBet flyer, Pool web hero), 3 invitations, 2 branding (Full Count 32 logo, Tsunami stickers), 2 case-study stationery shots. Her Instagram/Behance/LinkedIn links are `href="#"` on her own site, so there are no socials to link yet.
- Gallery tiles: 4/5 (1200x1500), archive tiles square 1200; logos get `contain` on canvas `#F8F5F2` with 70-80px margin, full-bleed art gets `cover`. sharp scripts pattern: `createRequire('file:///D:/K%20&%20A%20Performance%20Site/package.json')('sharp')` from any scratch dir.

## Other state from 2026-07-24 evening session

- **Google Business Profile images:** `Google Profile Images/` (untracked, repo root) — 23 upload-ready JPGs: 17 client-site captures (converted from site webps), 5 K&A page screenshots, 1 brand card. GBP takes JPG/PNG only, max 5MB.
- **`Logo Remake/Logo.png`** (untracked) = "K & A Memories" crest, a SEPARATE brand, artist still working on it — Alex said HOLD OFF, don't touch/integrate/commit (also in memory: logo-remake-on-hold).
- Claude's PowerShell/Bash deploy + config-skill calls get auto-denied by the permission classifier in this environment; read-only wrangler is fine. Hand Alex runnable bash blocks for anything blocked.

## Open items

_Status synced with Alex 2026-07-25:_

1. ~~Set `NPM_VERSION=11` in Pages build env~~ — **DONE** (Alex, 2026-07-25). Lockfile-skew recurrence risk is closed. (The post-`npm install` emnapi grep is now belt-and-suspenders, not required.)
2. **Re-upload Kai's ElevenLabs KB** — fresh key is now available/good to go (blocker cleared). Still TODO: create KB doc from `docs/elevenlabs-agent/knowledge-base.md` + PATCH agent, adding Jon Marc live-portfolio facts. _(Confirm with Alex whether the re-upload itself has been run.)_
3. **Bobbie + Nicole portfolios** — still in progress (artists working); go-live flow in Artists section above. Not ready yet.
4. ~~Preview-scope Google env vars~~ — Google reviews env is **working** (Alex confirmed). No action.
5. On hold: **`Logo Remake/`** ("K & A Memories", separate brand) still in progress — do not touch/integrate/commit (memory: logo-remake-on-hold).
6. Nice-to-haves: standalone outlined-SVG logo for print; `/api/scope` WAF rate-limit rule (never done).

## Process notes

**Never request a NEW asset URL on the bare path until you know it has propagated.** If you hit it during the deploy race, Cloudflare caches the 404 HTML page against that URL with `max-age=86400`, so it then serves `text/html` with a **200 status** for 24h at that edge even though the file deployed fine. Waiting for the HTML to flip is NOT sufficient — the asset can still 404 for a few seconds after the page updates (this bit twice: once mid-deploy, once by probing the asset in the same command as the "has the page updated yet" poll).

- **Diagnose:** compare plain vs cache-busted. `text/html` on the bare URL + `image/webp` on `?cb=123` = poisoned cache, NOT a missing file. Confirm origin is fine before touching anything.
- **First probe safely:** always cache-bust (`?cb=$RANDOM`) when checking a freshly deployed asset. A cache-busted request cannot poison the real key.
- **Fix:** append a version query to the reference in source (`/images/art/x.webp?v=1`) — a new cache key, no file rename, bump the number if it recurs. Renaming the file works too but leaves `-v2` noise on disk. Purging via Cloudflare dashboard (Caching → Purge by URL) also works but needs Alex — the wrangler OAuth token only has `zone (read)`.

Also note `npx` breaks on this repo path (the `&` in "K & A"): run `node ./node_modules/astro/astro.js dev|build` instead.

Alex iterates fast by feel: ship, show, expect tweaks; mid-turn asks are constant. Verify every visual in Playwright against the wrangler build (screenshots → `.superpowers/sdd/`). He pastes dashboard screenshots/logs when asked plainly. Bash quoting on this repo path is treacherous — prefer node scripts (or PowerShell) for multi-file edits. Playwright MCP blocks `file://` — stage specimens into `dist/__name/` and view via wrangler (wiped on rebuild; re-stage after).
