# K&A Performance Dark-Cinematic Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild ka-performancefl.com as a dark, cinematic, scroll-choreographed lead-gen site (Home, Work, Services, Contact, 2 artist pages) with a live AI scoping assistant, while preserving every existing app URL in this repo.

**Architecture:** Astro 5 static build at repo root; all existing app folders move to `public/` (URLs unchanged); `functions/` + `lib/` stay at root (Cloudflare Pages Functions import `../../lib/`). One motion engine (Lenis + GSAP ScrollTrigger) with a named motion vocabulary. AI assistant = new Pages Function `functions/api/scope.js` proxying the Claude API.

**Tech Stack:** Astro 5, Tailwind 4 (`@tailwindcss/vite`, CSS-first `@theme`), GSAP 3, Lenis 1, Fontsource variable fonts (Fraunces, Space Grotesk, Inter), Cloudflare Pages + Functions, Web3Forms.

**Spec:** `docs/superpowers/specs/2026-07-23-ka-performance-rebuild-design.md`

## Global Constraints

- Branch: `rebuild/dark-cinematic`. Commit after every task.
- **`functions/` and `lib/` never move** — `functions/api/*.js` import `../../lib/auth-cookie.js` and `../../lib/system-prompt.js`.
- Existing functions (`analysis, auth, chat, commentary, generate, hint, planner, remix, remix-bangers, voiceanalyze`) must not be modified.
- Every current public URL must still resolve after the move (apps live under `public/<same-name>/`).
- Design tokens (exact values, defined once in Task 2): canvas `#0B0B10`, surface `#14141C`, ink `#EDEDF2`, muted `#9A9AAB`, accent `#8A7CFF`, accent-hot `#B9AFFF`. Fonts: Fraunces (display), Space Grotesk (headings/UI), Inter (body).
- Motion vocabulary names (exact, used as `data-animate` values): `line-draw`, `type-settle`, `flood-in`, `frame-lift`.
- Transform/opacity animations only; full `prefers-reduced-motion` static fallback; no section numbering in copy; AA contrast; never text over busy imagery.
- Web3Forms access key: `7ad90fb9-bc88-411a-9442-c249b49c32f6`. Site URL: `https://ka-performancefl.com`.
- Claude model for the assistant: `claude-sonnet-5`. Executor MUST load the `claude-api` skill before writing API code (Task 9).
- Windows host: shell commands below are Git Bash syntax; quote all paths (`"D:\K & A Performance Site"` contains spaces & `&`).
- **Model routing (owner's directive):** Tasks marked **[Fable]** are design-critical — orchestrator implements directly. Tasks marked **[Opus]** delegate to an Opus subagent. QA sweeps may use Sonnet.

---

### Task 1: Scaffold Astro at root, migrate apps to `public/` **[Opus]**

**Files:**
- Create: `package.json`, `astro.config.mjs`, `src/pages/index.astro` (temp stub), `public/` (via git mv)
- Modify: `.gitignore`
- Delete: root `index.html`, `css/`, `js/`, `work/`, `services/`, `contact/`, `faq/`, `tailwind-build/` (old site, superseded; content stays in git history)

**Interfaces:**
- Produces: working `npm run build` → `dist/` containing all preserved apps + Astro pages. All later tasks assume this layout.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "ka-performance-site",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "gsap": "^3.12.0",
    "lenis": "^1.1.0",
    "@fontsource-variable/fraunces": "^5.0.0",
    "@fontsource-variable/space-grotesk": "^5.0.0",
    "@fontsource-variable/inter": "^5.0.0"
  }
}
```

- [ ] **Step 2: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ka-performancefl.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 3: Temp stub page `src/pages/index.astro`** (replaced in Task 4)

```astro
---
---
<html lang="en"><head><title>K &amp; A Performance</title></head>
<body><h1>Rebuild in progress</h1></body></html>
```

- [ ] **Step 4: `npm install`** (run_in_background OK). Expected: lockfile created, no errors.

- [ ] **Step 5: Migrate apps with git mv** (from repo root, Git Bash):

```bash
mkdir -p public
git mv "HTML Builds" chess daily-songs-x7k2 interactives internal mbsfeedback mosslight-run portfolio projects sky-raider-blitz tdgame tools voicecheck images public/
git mv voicecheck-logo.jpeg voicecheck-logo.png robots.txt sitemap.xml public/
git rm -r --cached index.html css js work services contact faq tailwind-build
rm -rf index.html css js work services contact faq tailwind-build
```

Note: `lib/`, `functions/`, `.env.example`, `docs/` stay at root. The dirty working-tree edits on the abandoned warm-editorial files are superseded by these deletions.

- [ ] **Step 6: Update `.gitignore`** — add lines:

```
dist/
.astro/
.dev.vars
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: `dist/index.html` exists; `dist/chess/index.html`, `dist/voicecheck/`, `dist/images/work-fdaaf.webp` all present (public/ passthrough).

- [ ] **Step 8: Verify functions untouched**

Run: `git status --short functions lib`
Expected: no changes.

- [ ] **Step 9: Commit** — `feat: scaffold Astro at root, move apps to public/ (URLs preserved)`

---

### Task 2: Design system, global styles, base layout, nav, footer **[Fable]**

**Files:**
- Create: `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`

**Interfaces:**
- Produces: `BaseLayout` props `{ title: string, description: string }` with `<slot />`; CSS custom properties `--color-canvas, --color-surface, --color-ink, --color-muted, --color-accent, --color-accent-hot`; utility classes via Tailwind `@theme` (colors `canvas, surface, ink, muted, accent, accent-hot`; fonts `display` = Fraunces, `heading` = Space Grotesk, `body` = Inter); `.glow-frame` class = THE single elevation treatment (border 1px rgba accent .25, border-radius 12px, box-shadow 0 0 60px -20px rgba(138,124,255,.35), background surface).

- [ ] **Step 1: `src/styles/global.css`** — `@import "tailwindcss";` + `@theme` block with the exact token values from Global Constraints + font imports (Fontsource) + base styles (canvas bg, ink text, selection color accent, focus-visible outline accent 2px) + `.glow-frame` + motion CSS vars `--dur-fast: 0.4s; --dur-base: 0.8s; --dur-slow: 1.4s; --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`.
- [ ] **Step 2: `BaseLayout.astro`** — html/head (meta, OG tags with `images/site-logo.png`, favicon `/images/favicon.svg`, canonical from `Astro.url`), imports global.css, renders Nav, `<slot/>`, Footer, and `<script>import '../scripts/motion.js'</script>` (file exists after Task 3; create empty `src/scripts/motion.js` now so build passes).
- [ ] **Step 3: `Nav.astro`** — fixed top, transparent→canvas blur on scroll (CSS only, `animation-timeline` NOT used; toggle class from motion.js later; ship with solid blur fallback). Links: Home `/`, Work `/work/`, Services `/services/`, Artists `/artists/`, Contact `/contact/` + accent-filled "Start a project" → `/contact/#scope`. Logo: `/images/kandalogo2.0-performance.svg`, white treatment. Mobile: hamburger → full-screen overlay menu (details/summary or minimal JS inline).
- [ ] **Step 4: `Footer.astro`** — logo, nav links repeat, email `alex@ka-performancefl.com`, small print. Calm, generous spacing.
- [ ] **Step 5: Point stub `index.astro` at `BaseLayout`** with an empty hero section so the layout is visible.
- [ ] **Step 6: Verify** — `npm run build` passes; `npm run dev` + Playwright: screenshot `/`, assert nav links present, fonts loaded (no FOUT of system serif), AA contrast spot-check ink/canvas & accent/canvas.
- [ ] **Step 7: Commit** — `feat: dark-cinematic design system, base layout, nav, footer`

---

### Task 3: Motion engine **[Fable]**

**Files:**
- Create/Replace: `src/scripts/motion.js`

**Interfaces:**
- Produces: auto-initializing module. Declarative API used by ALL pages: elements opt in via `data-animate="type-settle" | "flood-in" | "frame-lift"`, SVGs via `data-animate="line-draw"`; optional `data-animate-delay="0.2"`. Pinned sequences: container `data-pin-sequence` with children `data-pin-step`. Exposes `window.__motion = { reduced: boolean }` for other scripts (ScopeChat) to query.

- [ ] **Step 1: Implement `motion.js`:**

```js
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
window.__motion = { reduced };

if (!reduced) {
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({ lerp: 0.12 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  const EASE = 'expo.out';

  document.querySelectorAll('[data-animate="type-settle"]').forEach((el) => {
    gsap.from(el, {
      yPercent: 60, opacity: 0, duration: 0.8, ease: EASE,
      delay: parseFloat(el.dataset.animateDelay || 0),
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  document.querySelectorAll('[data-animate="flood-in"]').forEach((el) => {
    gsap.from(el, {
      opacity: 0, scale: 0.96, duration: 1.4, ease: EASE,
      scrollTrigger: { trigger: el, start: 'top 80%' },
    });
  });

  document.querySelectorAll('[data-animate="frame-lift"]').forEach((el) => {
    gsap.from(el, {
      y: 40, opacity: 0, duration: 0.8, ease: EASE,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  document.querySelectorAll('svg[data-animate="line-draw"]').forEach((svg) => {
    const paths = svg.querySelectorAll('path, line, rect, circle');
    paths.forEach((p) => {
      const len = p.getTotalLength ? p.getTotalLength() : 1000;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    gsap.to(paths, {
      strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.08,
      scrollTrigger: { trigger: svg, start: 'top 80%' },
    });
  });

  document.querySelectorAll('[data-pin-sequence]').forEach((seq) => {
    const steps = seq.querySelectorAll('[data-pin-step]');
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: seq, start: 'top top', end: `+=${steps.length * 100}%`,
        pin: true, scrub: 0.6,
      },
    });
    steps.forEach((step, i) => {
      if (i > 0) tl.from(step, { opacity: 0, y: 30, duration: 1 });
      if (i < steps.length - 1) tl.to(step, { opacity: 0, y: -30, duration: 1 }, '+=1');
    });
  });

  const nav = document.querySelector('[data-nav]');
  if (nav) ScrollTrigger.create({
    start: 'top -80', onUpdate: (s) => nav.classList.toggle('nav-scrolled', s.progress > 0),
  });
} else {
  // Reduced motion: everything visible & static.
  document.documentElement.classList.add('motion-reduced');
}
```

Also add to `global.css`: `.motion-reduced [data-animate], .motion-reduced [data-pin-step] { opacity: 1 !important; transform: none !important; }` and stroke-dash reset for `line-draw` under `.motion-reduced`.

- [ ] **Step 2: Verify** — add a temporary `data-animate="type-settle"` element to the stub index; `npm run dev`; Playwright: no console errors, element animates in (opacity transitions), then emulate `prefers-reduced-motion: reduce` and assert element fully visible with no transform. Remove temp element.
- [ ] **Step 3: Commit** — `feat: motion engine (Lenis + GSAP) with named motion vocabulary`

---

### Task 4: Homepage — "watch us build" **[Fable]**

**Files:**
- Create: `src/pages/index.astro` (replace stub), `src/components/WireframeHero.astro`, `src/components/WorkFrame.astro`, `src/data/work.js`

**Interfaces:**
- Consumes: BaseLayout, motion vocabulary, `.glow-frame`.
- Produces: `WorkFrame.astro` props `{ title: string, blurb: string, img: string, href?: string }` (reused by Task 5); `src/data/work.js` exports `export const projects = [{ slug, title, blurb, img }]` — four entries using `/images/work-fdaaf.webp`, `/images/work-mbsdoc.webp`, `/images/work-pbjsa.webp`, `/images/work-pmbuild.webp`. Titles ship as "FDAAF", "MBS Documentation", "PBJ San Antonio", "PM Build 2026" — **flag to Alex for correction in the handoff notes (Task 11)**.

**Executor note:** Load `frontend-design:frontend-design` and `taste-skill` before implementing. This page is the pitch; it must read as one system — restraint directive applies.

- [ ] **Step 1: Hero (`WireframeHero.astro`)** — full-viewport. Inline SVG wireframe (strokes only, muted color, `data-animate="line-draw"`): rectangles sketching a browser frame, nav bar, hero block, two cards. Overlaid headline (Fraunces, clamp ~9vw): "Built to perform." + sub (Inter, muted): "K & A Performance crafts fast, animated, AI-ready websites for businesses that refuse to blend in." + CTA pair: accent "Start a project" (`/contact/#scope`), ghost "See the work" (`/work/`). Headline/sub/CTAs use `type-settle` with staggered `data-animate-delay`.
- [ ] **Step 2: Craft sequence** — section `data-pin-sequence`, four `data-pin-step` slides sharing one centered browser frame graphic that gains fidelity: (1) "Structure" wireframe strokes, (2) "Type" real typography drops in, (3) "Color" accent + surfaces flood (`flood-in` inside step), (4) "Motion & intelligence" frame shows `work-fdaaf.webp` inside `.glow-frame` + one-line: "Then we make it move — and think." Step labels in Space Grotesk caps, no numbering.
- [ ] **Step 3: Work preview** — heading "Recent builds" + 2×2 grid of `WorkFrame` (all four from `work.js`), `frame-lift`, link row "All work →" `/work/`.
- [ ] **Step 4: AI section** — dark-on-darker band. Heading "Sites that think." Copy: "We integrate AI where it earns its place — assistants that qualify leads, content engines, smart search. Ours is live right now:" + accent CTA "Scope your project with our AI" → `/contact/#scope`.
- [ ] **Step 5: Artists teaser** — "In-house artistry." Two portrait cards (placeholder images `/images/museum.webp`, `/images/abstract-geometric-art.webp`) → `/artists/artist-one/`, `/artists/artist-two/`. One line: "Original illustration and artwork through our collaborating artists — no stock, ever."
- [ ] **Step 6: Final CTA** — huge Fraunces line "Your site should work this hard." + "Start a project" button.
- [ ] **Step 7: Verify** — build passes; Playwright desktop 1440×900 & mobile 390×844: full-page screenshots, scroll through pin sequence, no console errors, no horizontal overflow, reduced-motion pass shows all content.
- [ ] **Step 8: Commit** — `feat: homepage 'watch us build' scroll narrative`

---

### Task 5: Work page **[Opus]**

**Files:**
- Create: `src/pages/work/index.astro`

**Interfaces:**
- Consumes: `WorkFrame`, `projects` from `src/data/work.js`, motion vocabulary.

- [ ] **Step 1:** Page: BaseLayout (title "Work — K & A Performance"), editorial header ("Work that works."), then one full-width `WorkFrame` per project alternating left/right text column with `blurb` + a "What we did" line ("Design, build, launch" default), `frame-lift` on each.
- [ ] **Step 2: Verify** — build; Playwright: 4 projects render, images load (no 404s), mobile stack correct.
- [ ] **Step 3: Commit** — `feat: work page`

---

### Task 6: Services page **[Opus]**

**Files:**
- Create: `src/pages/services/index.astro`

- [ ] **Step 1:** Sections: (a) header "What we build"; (b) primary offering card **Web design & build** — copy: custom design, motion, performance, SEO-ready, launch on modern hosting; (c) secondary card **AI integration** — assistants, automations, content tooling, "try ours on the contact page"; (d) process strip (Discover → Design → Build → Launch) rendered as a single `line-draw` SVG connector with `type-settle` labels — no numbering; (e) CTA band → `/contact/`. No prices (posture copy: "Scoped per project — most builds land between a focused landing page and a full multi-page platform.").
- [ ] **Step 2: Verify** — build + Playwright desktop/mobile screenshot, no console errors.
- [ ] **Step 3: Commit** — `feat: services page`

---

### Task 7: Artist template + two artist pages + artists index **[Opus]**

**Files:**
- Create: `src/layouts/ArtistLayout.astro`, `src/data/artists.js`, `src/pages/artists/index.astro`, `src/pages/artists/artist-one.astro`, `src/pages/artists/artist-two.astro`

**Interfaces:**
- Produces: `src/data/artists.js` exports `export const artists = [{ slug: 'artist-one', name: 'Artist One', discipline: 'Illustration & brand artwork', bio: <2-3 sentence placeholder>, portrait: '/images/museum.webp', gallery: ['/images/abstract-geometric-art.webp', '/images/museum.webp', '/images/header-placeholder.jpg'] }, { slug: 'artist-two', name: 'Artist Two', discipline: 'Digital art & visual identity', ... portrait: '/images/abstract-geometric-art.webp' }]`. `ArtistLayout` props `{ artist }`.

- [ ] **Step 1:** `ArtistLayout` — portrait hero (image in `.glow-frame`, name huge in Fraunces, discipline in Space Grotesk caps), bio block, style statement pull-quote, gallery grid (`flood-in`), then CTA band: "Commission through K & A" — copy makes clear **all engagement goes through K&A**, button → `/contact/` (never artist contact info).
- [ ] **Step 2:** Two pages consume the data entries; `/artists/` index = short intro + two large cards.
- [ ] **Step 3: Verify** — build; Playwright: all 3 routes render, CTAs point to `/contact/`, mobile pass.
- [ ] **Step 4: Commit** — `feat: artist showcase template and placeholder pages`

---

### Task 8: Contact page with Web3Forms fallback form **[Opus]**

**Files:**
- Create: `src/pages/contact/index.astro`

**Interfaces:**
- Produces: section `id="scope"` (assistant mounts here in Task 9 — leave a clearly marked container `<div id="scope-chat-root"></div>` inside it); form posts to Web3Forms.

- [ ] **Step 1:** Layout: header "Let's build yours." Two paths side-by-side (stack on mobile): (a) `#scope` panel titled "Scope it with our AI" with the empty chat root + one line "Answer a few questions, get a project scope in minutes."; (b) classic form (name, email, message, hidden `access_key` = Web3Forms key from Global Constraints, hidden `subject` = "New lead — ka-performancefl.com") POST `https://api.web3forms.com/submit`, JS fetch submit with success/error inline states (match existing pattern in git history `contact/index.html` if helpful).
- [ ] **Step 2: Verify** — build; Playwright: submit form with test data, assert success state (Web3Forms returns 200 JSON `success: true`); mobile pass.
- [ ] **Step 3: Commit** — `feat: contact page with Web3Forms form and scope anchor`

---

### Task 9: AI scoping assistant (function + chat UI) **[Fable]**

**Files:**
- Create: `functions/api/scope.js`, `src/components/ScopeChat.astro`
- Modify: `src/pages/contact/index.astro` (mount ScopeChat in `#scope-chat-root`)

**Interfaces:**
- Consumes: `window.__motion.reduced` (skip chat animations when reduced).
- Produces: `POST /api/scope` accepting `{ messages: [{ role: 'user'|'assistant', content: string }] }`, returns `{ reply: string }` or `{ error: string }` with 4xx/5xx. Requires Cloudflare env secret `ANTHROPIC_API_KEY`.

**Executor note:** Load the `claude-api` skill BEFORE writing this task's code; verify model id and Messages API shape against it.

- [ ] **Step 1: `functions/api/scope.js`** (plain JS, matches existing functions' style):

```js
const MAX_MESSAGES = 24;
const MAX_CHARS = 2000;

const SYSTEM = `You are the project-scoping assistant for K & A Performance, a two-person web design and AI integration studio (ka-performancefl.com). Interview the visitor about their project: what they do, what they need (new site, redesign, AI features), goals, rough timeline, and budget comfort (bands: under $2k, $2k-5k, $5k-10k, $10k+). Ask ONE question at a time, warm and concise. After you have enough (usually 4-6 exchanges), produce a scope summary wrapped EXACTLY in <scope_summary> ... </scope_summary> tags: project type, goals, suggested pages/features, timeline, budget band, and a suggested next step. Never quote a fixed price. Never answer questions unrelated to hiring K & A Performance — politely steer back.`;

export async function onRequestPost({ request, env }) {
  try {
    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES)
      return json({ error: 'Invalid conversation.' }, 400);
    for (const m of messages) {
      if (!m || (m.role !== 'user' && m.role !== 'assistant') ||
          typeof m.content !== 'string' || m.content.length > MAX_CHARS)
        return json({ error: 'Invalid message.' }, 400);
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: SYSTEM,
        messages,
      }),
    });
    if (!res.ok) return json({ error: 'Assistant unavailable.' }, 502);
    const data = await res.json();
    return json({ reply: data.content?.[0]?.text ?? '' });
  } catch {
    return json({ error: 'Bad request.' }, 400);
  }
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
```

- [ ] **Step 2: `ScopeChat.astro`** — inline script + scoped styles, no framework. Behavior: message list (user right/accent, assistant left/surface), input + send, typing indicator, maintains `messages` array in memory (cap 24 → then shows "Let's take it from here — use the form or email us."). On each assistant reply: if it contains `<scope_summary>`, render the summary in a `.glow-frame` card with two buttons: **"Send to K & A"** (prompts for name+email inline, then POSTs summary+contact to Web3Forms with `subject` = "AI-scoped lead — ka-performancefl.com") and "Copy summary". Opening assistant message is hardcoded client-side (no API call on load): "Hi — I'm K & A's scoping assistant. What are you looking to build?"
- [ ] **Step 3: Local E2E** — create `.dev.vars` with `ANTHROPIC_API_KEY=<Alex's key — request via chat if not in env>`; run `npm run build && npx wrangler pages dev dist`; curl `POST http://127.0.0.1:8788/api/scope` with `{"messages":[{"role":"user","content":"I need a site for my bakery"}]}` → expect JSON `reply` asking a follow-up question. Then Playwright: full conversation through the UI to a `<scope_summary>`, click "Send to K & A", assert Web3Forms success.
- [ ] **Step 4: Commit** — `feat: AI scoping assistant (Pages Function + chat UI)` (ensure `.dev.vars` NOT committed)

---

### Task 10: SEO — sitemap, robots, meta **[Opus]**

**Files:**
- Modify: `public/robots.txt`, `public/sitemap.xml`, `src/layouts/BaseLayout.astro` (verify OG/canonical complete)

- [ ] **Step 1:** `robots.txt`: keep `Disallow: /mbsfeedback/`, add `Disallow: /internal/`, sitemap line unchanged.
- [ ] **Step 2:** `sitemap.xml`: exactly these URLs: `/`, `/work/`, `/services/`, `/artists/`, `/artists/artist-one/`, `/artists/artist-two/`, `/contact/` (artist pages priority 0.5 until real content).
- [ ] **Step 3:** Per-page unique `<title>`/`description` audit; OG image present on all pages.
- [ ] **Step 4: Verify** — build; `dist/robots.txt` + `dist/sitemap.xml` correct; commit — `feat: seo pass (sitemap, robots, meta)`

---

### Task 11: Full QA sweep + deploy handoff doc **[Fable orchestrates; Sonnet/Opus subagents execute]**

**Files:**
- Create: `docs/superpowers/DEPLOY.md`

- [ ] **Step 1: Link-check preserved apps** — `npm run build && npx wrangler pages dev dist`; script or Playwright loop over: `/chess/`, `/daily-songs-x7k2/`, `/tools/`, `/interactives/`, `/portfolio/`, `/projects/`, `/voicecheck/`, `/tdgame/`, `/sky-raider-blitz/`, `/mosslight-run/`, `/mbsfeedback/`, `/internal/tracker.html` — all 200, page renders (not blank).
- [ ] **Step 2: Site QA** — Playwright: all 7 new routes, desktop+mobile, console-error-free, no horizontal overflow, reduced-motion pass, keyboard-tab through nav and both contact paths.
- [ ] **Step 3: Perf** — load `web-perf` skill; audit `/` on throttled mobile profile; fix anything with LCP > 3s / CLS > 0.05 (typical: preload display font, `fetchpriority=high` on hero assets, lazy-load below-fold work images).
- [ ] **Step 4: `DEPLOY.md`** — exact Cloudflare dashboard steps for Alex: build command `npm run build`, output `dist`, add secret `ANTHROPIC_API_KEY`, note that functions deploy automatically from `functions/`; content-swap checklist: artist names/bios/images (`src/data/artists.js`), work titles/blurbs (`src/data/work.js`).
- [ ] **Step 5: Commit** — `chore: QA fixes and deploy handoff`. **Do NOT merge to main or push without Alex's go-ahead.**

---

## Self-Review Notes

- Spec coverage: §2 pages → Tasks 4-8; §3 system → Task 2; §4 motion → Task 3; §5 home → Task 4; §6 assistant → Task 9; §7 repo/tech → Task 1; §8 routing noted per-task; §9 verification → per-task verify steps + Task 11; §10 exclusions honored (placeholders, no prices, no external port).
- Type consistency: motion names, token names, `WorkFrame` props, `work.js`/`artists.js` shapes, and `/api/scope` contract each defined once and referenced identically.
- Known intentional deviation: design-critical pages (Tasks 4-7) specify structure, exact copy, and acceptance criteria rather than full final markup — final visual authoring happens in-task with the design skills loaded, per the owner's orchestration directive.
