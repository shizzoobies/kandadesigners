# K&A Performance Rebuild — Session Handoff

**Date:** 2026-07-23 · **Branch:** `rebuild/dark-cinematic` (pushed to `shizzoobies/kandadesigners`, NOT merged — production `main` still serves the old site) · **Status:** build complete, reviewed, verified; awaiting Alex's Cloudflare config + merge.

## What this is

Full rebuild of ka-performancefl.com as an Astro 5 static site at repo root. Warm-light editorial theme ("ivory/espresso/violet"), licensed Grivon + Neutrix VF fonts (Envato, self-hosted woff2 in `public/fonts/`), Lenis+GSAP motion. Lead-gen focus: web design primary, AI integration secondary (live AI scoping assistant). All other apps in this repo (chess, voicecheck, daily-songs, tools…) were `git mv`'d to `public/` — URLs unchanged; `functions/` + `lib/` stayed at root (existing functions import `../../lib/`).

**Pages:** `/` (hero+gallery one scroll piece), `/services/`, `/artists/` (+ two placeholder artist pages), `/contact/`. The Work page was **removed** (work is showcased on home); `/work/` 301s home via `public/_redirects`.

## The homepage scroll piece (`src/components/HeroGallery.astro`)

Three acts, one pinned 420vh section, ScrollTrigger scrub:
1. **Stack** — seven client-site browser windows (mixed macOS/Windows chrome) blanket the entire hero as an overlapping mosaic; headline sits in a near-solid glass panel; nav rides a near-solid scrim band.
2. **Horseshoe** — scrolling sweeps every tile into a 3D arc (GSAP-owned transforms, per-card `transformPerspective: 1600`, painter's z-index — **no preserve-3d**, which is what fixed cards clipping through each other; 36° steps, R=520 desktop/260 mobile, rear slots past 90° hidden via backface+opacity 0). Interactive band at scrub progress 0.5–0.78: autoplay, arrows, dots, side-card click rotates. Cards are divs, not links.
3. **Recede** — continuing to scroll sends tiles flying back into the depths (z −680, fade out) before the dark AI band arrives.

Gallery data: `src/data/work.js` — 7 entries (FDAAF, MBS Medicine, PB&J, Project Makeover, FixAlways, Fore Motion Golf, Ellenton Family Practice Direct). Tiles are 1800px webp (recaptured live at 2× DPR from fdaaf.org, projectmakeover.org, fixalways.com, foremotiongolf.com, familypracticedirect.com); MBS + PB&J are 1360px from best-available originals (their sites weren't reachable: mbsmedicine.com blocked, PB&J domain unknown — **ask Alex for URLs to recapture**).

## Design system & accessibility (Alex's non-negotiable)

Tokens in `src/styles/global.css` `@theme`: canvas `#F7F3EC`, surface `#FFFDF9`, ink `#221C15`, muted `#6C635A`, accent `#5B4BD8`, accent-hot `#4A3BC7`. Accent/muted were **darkened specifically to pass AA** — measured in-browser: ink 15.25:1, accent 5.51:1, muted 5.32:1, button text 6.0:1 (all ≥4.5 normal-text AA). Keep any new colors AA — Alex sells accessibility. `.dark-band` locally re-overrides tokens for the one dark section. `.glow-frame` = the single elevation treatment. `.ai-alive` (+`-dark`) = breathing orbs + `.ai-pulse` word glow on every AI surface (services AI card, home dark band, contact scope panel). Reduced-motion: every loop/scrub disabled, content fully visible (`.motion-reduced` rules + per-script guards). Keyboard: logical tab order, visible focus rings, aria-live captions on gallery.

## AI scoping assistant

`functions/api/scope.js` (claude-sonnet-5, thinking disabled, validation caps 24 msgs/2000 chars, refusal handled) + `src/components/ScopeChat.astro` on /contact/ (summary card → Web3Forms lead email, key `7ad90fb9-bc88-411a-9442-c249b49c32f6`). `ANTHROPIC_API_KEY` secret already exists in Cloudflare (old chat function uses it). Verified with a real API round trip locally (wrangler picks up the system env key). Unit harness: 13/13 (scratchpad, rerunnable).

## Local dev (Windows quirks — important)

- `npm run build`/`dev` **fail** (cmd.exe chokes on `&` in the repo path). Use: `node node_modules/astro/astro.js build` / `... dev --port 4321`
- Full local with functions: `npx wrangler pages dev dist --port 8788 --compatibility-date=2026-06-18` (compat date must be pinned; **restart wrangler after builds that add/remove routes — it serves a stale asset manifest otherwise**, which once faked a broken redirect).
- Astro dev server under-scans Tailwind for brand-new files; verify styling against a build, not dev.

## Remaining work (in order)

1. **Alex: Cloudflare dashboard (was "Step 2" of a click-by-click walkthrough that kept getting deferred for design iterations):** Pages project → build command `npm run build`, output `dist`; add WAF rate-limit rule for `/api/scope` (~10 req/min/IP). Full steps in `docs/superpowers/DEPLOY.md`.
2. Preview-deploy the branch, run DEPLOY.md's smoke test (includes one live AI message + one labeled form submission).
3. Merge to `main` → live.
4. Content swaps (documented in DEPLOY.md): artist placeholders (`src/data/artists.js`), verify my work blurbs (`src/data/work.js`), MBS/PB&J hi-res recaptures when URLs known.
5. Optional polish backlog (all reviewed-as-Minor): gallery alt-text variety on artist galleries, `ol` ordinal announcement on services process, focus-visible ring on programmatic focus targets.

## Where things live

- Progress ledger (every task + review verdict): `.superpowers/sdd/progress.md`
- Spec/plan: `docs/superpowers/specs/2026-07-23-…design.md`, `docs/superpowers/plans/2026-07-23-…rebuild.md`
- Deploy runbook: `docs/superpowers/DEPLOY.md`
- Review evidence & screenshots: `.superpowers/sdd/*.png`, task briefs/reports/review diffs alongside
- Font source zips (licensed, git-ignored): `fonts-drop/`
- Old warm-editorial WIP: git stash "warm-editorial WIP (abandoned direction, pre-rebuild safety)"

## Process notes for the next session

Fable orchestrates design-critical work directly; Opus subagents for mechanical tasks, Sonnet for task-scoped reviews (per Alex's cost directive). Every visual change gets verified in Playwright against the wrangler build before committing — screenshots into `.superpowers/sdd/`. Alex iterates fast and by feel: ship the change, show it, expect the next tweak. Design bar: "elevated, not templated" — asymmetry, real content, motion with meaning; never text over busy imagery without a solid backdrop; measured AA always.
