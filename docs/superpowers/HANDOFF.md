# K&A Performance — Session Handoff

**Date:** 2026-07-30 · **Branch: `main`** · **Status: LIVE at ka-performancefl.com.** CI works: `git push origin main` auto-builds and deploys. Latest work: Bobbie's page went live fronted by an interactive flipbook of the picture book she illustrated (112a85b), which makes all three artists live.

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
- **ALL THREE ARTISTS ARE NOW LIVE** (2026-07-30). No `coming-ribbon` remains anywhere; every card links. The `.coming-ribbon` CSS in global.css and the `live` flag branch in `artists/index.astro` are still there for a future fourth artist.
- **Bobbie: LIVE** (`/artists/bobbie/`). Discipline "Illustration & brand artwork". She trades as **Bobbie Draws**; surname is **Connor** (per the book's cover credit, not "Conner"). Portrait = same idiom as the others: headshot cropped to 0.8, saturation 0.5, 62% canvas wash, her own Bobbie Draws mark composited 'over' at top 900 (her mark has real alpha so 'over', NOT the multiply used for Jon Marc's white-background mark). **The mark's y position is load-bearing:** the 1600x2000 portrait also feeds a 4/3 teaser card, whose centred crop only keeps y 400..1600, so a mark placed lower gets guillotined on the artists index and home teaser. **She deliberately has NO inline `gallery`** — her six brand pieces live in `archive` (modal only) so the book is the last thing on the page instead of the middle of it (Alex's call, saved ~900px of scroll). All six are `fit: 'contain'` so CSS letterboxes them on the canvas colour rather than baking margins into the files; the archive modal honours `fit` for exactly this reason, since square cover-cropping destroys a 2.5:1 logotype like ChampiCraft. Sources in `Bobbie Images/` (untracked).
- **Bobbie's featured book = the `book` block + `BookFlip.astro`.** "Hope & Harry's Alaskan Adventure", illustrated by Bobbie and **written by Alex**, so it is genuinely an in-house project and the copy says so. 22 pages exported from the print file (uniform 2000x1545, numeric order IS story order, 01 front cover / 22 back cover) downscaled to 1200px webp in `public/images/art/book/hh-NN.webp` — whole book is only 1.68MB. Source zip lives in `Bobbie Images/Book/`. BookFlip pairs pages into 11 sheets (sheet i: front = page 2i, back = page 2i+1) and turns them with CSS 3D rotateY about the spine; state is `sheet` 0..11 where 0 is closed-on-cover and 11 is closed-on-back-cover. Two things to know before touching it: (1) turn length lives **only** in the `--leaf-dur` CSS var, which the script reads at runtime — the z-index reset has to land after the rotation ends, so do not reintroduce a hardcoded JS copy; changing the var alone is safe and the reduced-motion override rides along free. (2) **`.bookclip` uses `overflow-x: clip` deliberately** — the closed book translates ±25% to stay optically centred, which pushes its empty half past the container and horizontally scrolls the page. Clip the x axis only; `overflow: hidden` would also cut the drop shadow. Below 900px the 3D is hidden entirely for a scroll-snap page strip (a spread on a phone renders the body copy unreadable); the strip's imgs are `loading="lazy"` so the hidden set is not fetched on desktop. Any artist can now get a book by adding a `book` block; its eyebrow/title/blurb are centred over the spread.

**ArtistLayout block independence:** `gallery` (inline grid) and `archive` (button + modal) are now separate blocks, so an artist can have either, both, or neither. The archive control centres itself when there is no gallery above it and sits on the left margin when there is. Nicole's `sections` each carry their own per-section modal, wired generically by `data-archive-open`, so all three artists coexist in one layout.
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
3. ~~Bobbie + Nicole portfolios~~ — **DONE.** Nicole live 2026-07-28, Bobbie live 2026-07-30. Only remaining artist ask is the list of 20 source files Nicole still owes (see her entry) so her hotlinked tiles stop depending on her Netlify build.
4. ~~Preview-scope Google env vars~~ — Google reviews env is **working** (Alex confirmed). No action.
5. On hold: **`Logo Remake/`** ("K & A Memories", separate brand) still in progress — do not touch/integrate/commit (memory: logo-remake-on-hold).
6. Nice-to-haves: standalone outlined-SVG logo for print; `/api/scope` WAF rate-limit rule (never done).

## Process notes

**Never request a NEW asset URL on the bare path until you know it has propagated.** If you hit it during the deploy race, Cloudflare caches the 404 HTML page against that URL with `max-age=86400`, so it then serves `text/html` with a **200 status** for 24h at that edge even though the file deployed fine. Waiting for the HTML to flip is NOT sufficient — the asset can still 404 for a few seconds after the page updates (this bit twice: once mid-deploy, once by probing the asset in the same command as the "has the page updated yet" poll).

- **Diagnose:** compare plain vs cache-busted. `text/html` on the bare URL + `image/webp` on `?cb=123` = poisoned cache, NOT a missing file. Confirm origin is fine before touching anything.
- **First probe safely:** always cache-bust (`?cb=$RANDOM`) when checking a freshly deployed asset. A cache-busted request cannot poison the real key.
- **Fix:** append a version query to the reference in source (`/images/art/x.webp?v=1`) — a new cache key, no file rename, bump the number if it recurs. Renaming the file works too but leaves `-v2` noise on disk. Purging via Cloudflare dashboard (Caching → Purge by URL) also works but needs Alex — the wrangler OAuth token only has `zone (read)`.
- **Prevention (cheap, do this by default):** ship brand-new asset paths with `?v=1` already on them. This has now bitten three times (Nicole's portrait, then 4 of Bobbie's 22 book pages) and it is a rollout race, not a bad file: some PoPs serve the new HTML before they have the new assets. Versioning up front costs nothing. Also give a deploy ~60s of quiet after the HTML flips before letting a browser load the page, since the browser requesting bare URLs is itself what caches the bad entry.

Also note `npx` breaks on this repo path (the `&` in "K & A"): run `node ./node_modules/astro/astro.js dev|build` instead.

Alex iterates fast by feel: ship, show, expect tweaks; mid-turn asks are constant. Verify every visual in Playwright against the wrangler build (screenshots → `.superpowers/sdd/`). He pastes dashboard screenshots/logs when asked plainly. Bash quoting on this repo path is treacherous — prefer node scripts (or PowerShell) for multi-file edits. Playwright MCP blocks `file://` — stage specimens into `dist/__name/` and view via wrangler (wiped on rebuild; re-stage after).
