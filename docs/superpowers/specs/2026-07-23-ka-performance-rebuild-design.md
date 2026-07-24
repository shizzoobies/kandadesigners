# K&A Performance Site Rebuild — Design Spec

**Date:** 2026-07-23
**Status:** Approved by Alex (in-session)
**Branch:** `rebuild/dark-cinematic` (fresh rebuild; `redesign/warm-editorial` and the v2 repo are superseded)

## 1. Goal

Ground-up rebuild of ka-performancefl.com as a dark, cinematic, scroll-choreographed **lead-generation site** for K&A Performance. Primary offering: **web design**. Secondary offering: **AI integration**, proven live by an on-site AI scoping assistant. A visiting prospect should think "I want my site to feel like this" within the first scroll.

All non-site apps in this repo (chess, tools, interactives, daily-songs-x7k2, mbsfeedback, mosslight-run, sky-raider-blitz, tdgame, voicecheck, portfolio, projects, internal, HTML Builds, lib, etc.) must keep working at their current URLs.

## 2. Pages & Information Architecture

Nav: **Home · Work · Services · Artists · Contact** + persistent "Start a project" CTA (routes to the scoping assistant on Contact).

| Route | Purpose |
|---|---|
| `/` | "Watch us build" scroll narrative (see §5) |
| `/work` | Portfolio: fdaaf, mbsdoc, pbjsa, pmbuild screenshots (existing WebPs in `images/`) as glowing framed screens + short case blurbs |
| `/services` | Web design packages (lead), AI integration capability (second), how-we-work process strip |
| `/artists/artist-one`, `/artists/artist-two` | Placeholder artist showcase pages from one shared template: portrait hero, bio, style statement, work gallery. **All CTAs route leads to K&A**, not the artist. Real names/bios/work swapped in later by Alex. |
| `/contact` | AI scoping assistant as hero path; classic form (existing Web3Forms key `7ad90fb9-bc88-411a-9442-c249b49c32f6`) as fallback |

An "Artists" nav item links to a small index/teaser (may live as a homepage section anchor or lightweight page — implementer's choice, whichever keeps nav honest).

## 3. Design System

- **Canvas:** near-black base; **one** electric accent color (chosen during design-system task; must pass AA on dark).
- **Type:** huge editorial display face + clean grotesk body; typographic scale does the luxury work.
- **Work presentation:** always clean framed screenshots with a subtle, consistent glow elevation. Never text over busy imagery.
- **One elevation/glow treatment** reused everywhere; generous spacing; no section numbering; restraint over gimmicks (standing user directive).
- Accessibility: AA contrast throughout, visible focus states, semantic landmarks.

## 4. Motion System

- **Engine:** Lenis smooth scroll + GSAP ScrollTrigger. No other animation libraries.
- **Named motion vocabulary** shared across all pages: `line-draw` (SVG stroke reveal), `type-settle` (staggered type reveal), `flood-in` (color/imagery fill), `frame-lift` (elevation on scroll/hover). Shared duration/easing tokens.
- Transform/opacity only (60fps target). Simplified choreography on mobile. `prefers-reduced-motion` → fully static site that still looks finished.

## 5. Homepage — "Watch us build"

Scroll story where the page constructs itself, demonstrating the craft:

1. **Hero:** wireframe lines draw the layout in; headline type sets itself.
2. **Craft sequence (pinned):** wireframe → typography → color → real work flooding into frames.
3. **Work preview:** 3–4 client screens, frame-lift treatment, link to `/work`.
4. **AI joins the build:** section introducing AI integration + the scoping assistant.
5. **Artists teaser:** the two collaborating artists, linking to their pages.
6. **Final CTA:** start a project → scoping assistant.

## 6. AI Scoping Assistant

- **Backend:** Cloudflare Pages Function `functions/api/scope` proxying the Claude API. API key stored as a Cloudflare secret; never exposed client-side.
- **Behavior:** interviews the lead (project type, goals, timeline, budget band), then produces a clean scope summary shown to the lead **and** emails it to Alex (via Web3Forms) as a captured lead.
- **Scope limit:** chat + summary + lead email. No accounts, no persistence beyond the lead email, basic abuse guard (message cap per session; Turnstile optional later).

## 7. Tech & Repo Layout

- **Astro 5** at repo root; Tailwind 4; GSAP + Lenis from npm; images optimized via Astro assets.
- Existing app folders **`git mv` into `public/`** — served URLs unchanged, git history preserved.
- Cloudflare Pages config change (one-time, by Alex in dashboard): build command `npm run build`, output dir `dist`. `functions/` stays at repo root.
- Regenerate `sitemap.xml`/`robots.txt` including preserved apps.
- Old site files at root (index.html, css/, js/, work/, services/, contact/, faq/) are replaced by the Astro build.

## 8. Orchestration & Model Usage

Fable orchestrates and owns the design-critical path: creative direction, homepage choreography, design system, final review. Opus/Sonnet subagents take mechanical tasks: folder migration, page scaffolds from established templates, artist pages, QA sweeps. Skills: frontend-design, taste-skill, ui-ux-pro-max (design), claude-api (Worker), web-perf + Playwright (verification).

## 9. Verification

- Playwright pass: every page, desktop + mobile viewports.
- Reduced-motion check renders static correctly.
- Lighthouse/web-perf audit (LCP/CLS/INP sane on mid-range mobile).
- End-to-end: contact form submission + AI assistant conversation (test key).
- Link-check: every preserved app URL resolves after the `public/` move.

## 10. Out of Scope

- Real artist content (placeholders only).
- Pricing figures (posture only, no hard numbers unless Alex supplies them).
- Porting to any other repo — this repo *is* production.
- Blog/CMS, analytics changes, payment flows.
