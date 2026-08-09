# Local SEO rewrite — Gainesville-first, Jacksonville second

_Planning doc, 2026-08-09. Each phase below is written as a self-contained brief
for an executor agent. Read `docs/superpowers/HANDOFF.md` first — especially the
deploy-probe cache rule and the npm/emnapi lockfile warning. **No phase in this
plan requires an npm install; keep it that way.**_

## Goal & market reality

Rank for web-design and AI-integration searches in **Gainesville** (home market,
winnable in weeks–months) and **Jacksonville** (bigger, more competitive — a
longer climb that will ultimately need links, not just on-page work). The studio
is in Gainesville; Nicole (collaborating artist) is in Jacksonville — both real,
neither invented. FixAlways / client work gives statewide credibility.

The site currently contains **zero** mentions of Gainesville or Jacksonville and
its titles/H1s target no search intent at all. That's the gap.

**What this plan cannot do:** GBP optimization, reviews, and inbound links move
local rankings more than any on-page change. See "Off-site checklist" — that's
Alex's list, and it matters more than phases 1–3 combined for the map pack.

## Hard constraints (from HANDOFF + memory — do not violate)

- Copy must read like the site's existing voice: plain, confident, a little wry
  ("Built in Florida, performing everywhere"). **No SEO sludge.** If a sentence
  exists only for Google, cut it or rewrite until a human would keep it.
- No design changes: no new hero, no layout shifts, no section numbering. Copy
  edits live inside existing components/sections; new pages reuse existing
  layout primitives (BaseLayout, btn-accent, glow-frame, data-animate).
- Existing URLs do not change or break. `/services/` stays; its children are
  additive. The home a11y CTA links `/services/#svc-a11y` — that anchor must
  keep working (redirect the anchor's section or update the link in the same
  commit).
- Each phase: build clean → Playwright verify → push → confirm deploy Active →
  probe new URLs **cache-busted first** (see HANDOFF process note).

## Keyword map

| Page | Primary target | Secondary |
|---|---|---|
| `/` | web design Gainesville FL | web designer Gainesville, K & A Performance |
| `/services/` (hub) | web design & AI services Florida | (navigational) |
| `/services/web-design/` | custom website design Gainesville | small business web design Florida |
| `/services/ai-integration/` | AI integration services | AI chatbot for website, Claude/AI assistant for business |
| `/services/seo-ai-search/` | SEO services Gainesville | AI search optimization, get found by AI |
| `/services/accessibility/` | website accessibility audit | WCAG compliance Florida, ADA website Florida |
| `/locations/gainesville/` | web design Gainesville (reinforce) | Alachua, Newberry, High Springs, Ocala |
| `/locations/jacksonville/` | web design Jacksonville FL | Jax Beach, St. Augustine, Orange Park |
| `/artists/` | (not a target — fix thinness so it indexes) | commissioned brand artwork |

Titles ≤ 60 chars, descriptions 140–160, one H1 per page containing the target
phrased like a human wrote it.

## Phase 1 — Metadata, schema, NAP (low risk, do first)

1. **Titles + meta descriptions, every page.** Home becomes
   `Gainesville Web Design & AI Integration | K & A Performance`. Interior pages
   follow the keyword map. Keep the brand suffix.
2. **Schema upgrade** in `BaseLayout.astro`: `Organization` →
   `ProfessionalService` (subtype of LocalBusiness). Approved: `address` is
   city-level only (`addressLocality: Gainesville`, `addressRegion: FL`,
   `addressCountry: US` — **no streetAddress, no telephone**), `areaServed`
   is the nine-city list from Decisions, `hasMap` → the existing g.page URL,
   `sameAs` per Decisions item 3 (Facebook on the org, LinkedIn on Alex's
   founder Person node). No `aggregateRating` — our on-site reviews come
   from Google; marking them up violates their guidelines.
3. **Footer NAP**: "Built in Florida, performing everywhere." →
   "Built in Gainesville, FL — performing everywhere." plus service-area line.
   Same restraint, now with a city.
4. **Alt text pass**: the 12 empty-alt homepage images. Anything genuinely
   decorative keeps `alt=""` deliberately (note it in a comment); real content
   images get real descriptions.
5. Acceptance: build clean; JSON-LD parses (node check); titles verified in
   dist; no layout diffs (Playwright screenshot of home unchanged except text).

## Phase 2 — Split `/services/` into four pages

New routes, each 600–900 words, each reusing existing section components:

- `/services/web-design/` — pull the "Purpose-built websites" + hosting
  sections; add process, timeline, what a build includes, 2–3 client examples
  (mbsdoc, pbjsa, project-makeover with links).
- `/services/ai-integration/` — the flagship. Claude assistants, automations,
  AI audio; FixAlways as the case study. Least local, most differentiated —
  this one can rank nationally.
- `/services/seo-ai-search/` — "Found by Google, found by AI" content.
- `/services/accessibility/` — the audit offer; this section already has the
  strongest copy on the site (accessibility statement page backs it up —
  cross-link them). **Keep or redirect the `#svc-a11y` anchor.**

`/services/` itself becomes a short hub: intro, four cards linking down, the
"How it goes" process section stays on the hub. Nav keeps the single
"Services" item; footer gains the four child links. Each child page:
BreadcrumbList schema, cross-links to siblings, CTA to `/contact/`.
FAQ block (3–4 real questions) per page with FAQPage schema — low rich-result
value since 2023 but useful for AI-search answers, which is literally a
service we sell.

Acceptance: all four pages build, appear in generated sitemap, breadcrumbs
parse, `/services/#svc-a11y` still lands somewhere sensible, internal links
resolve, Playwright pass on desktop + mobile widths.

## Phase 3 — Location pages + local weave

1. `/locations/gainesville/` and `/locations/jacksonville/` — **two pages
   only.** These must not be doorway-page mad-libs: each is genuinely
   different. Gainesville: the studio, who Alex/Kristina are, local process
   (can meet in person), nearby towns served (text list: Alachua, Newberry,
   High Springs, Ocala — approved list in Decisions). Jacksonville:
   Nicole is Jacksonville-based (real tie — her page + portfolio say so),
   remote-first process, Fleming Island / Orange Park / St. Augustine
   service area (approved list in Decisions).
   700–900 words each, reviews rail embedded, CTA. LocalBusiness `areaServed`
   on each.
2. **Home weave**: one supporting line under the hero (not the H1 — keep its
   voice) anchoring Gainesville; "areas we serve" line in the footer or the
   contact band. Subtle. Two to three mentions total, not twenty.
3. **Contact**: add a short "where we work" block (Gainesville studio,
   Jacksonville + statewide remote). Fixes its 485-word thinness too.
4. **Artists index**: add a 120–180 word intro (what commissioning through
   K & A means; mention Nicole in Jacksonville naturally). This is the page
   Google still hasn't indexed at all — thinness is the likely reason.
5. Footer + services pages link to both location pages.

Acceptance: both pages in sitemap, indexable, no doorway-template smell (read
them aloud test), Playwright pass, home visual diff shows text-only changes.

## Phase 4 — Verify, submit, measure

1. Full-site Playwright sweep (desktop + mobile), zero console errors, CLS 0
   on changed pages.
2. Rich Results test on home + one service page + one location page.
3. GSC: resubmit sitemap (picks up new URLs automatically), Request Indexing
   on the 6 new URLs (respect ~10/day quota — split across two days:
   4 service pages day one, 2 location pages day two).
4. Baseline snapshot: GSC Performance queries + positions today, re-check at
   2 and 4 weeks. Target queries to watch: "web design gainesville",
   "web designer gainesville fl", "web design jacksonville", "ai integration
   services", "website accessibility audit".

## Off-site checklist (Alex — this outranks everything above for the map pack)

- **GBP**: confirm the profile's address/service-area matches "Gainesville +
  listed cities"; categories (Web designer, Marketing agency); add photos;
  post the new service pages as GBP posts; keep collecting reviews (the
  g.page review link already exists — put it in email signatures).
- **Client-site backlinks**: a "Site by K & A Performance" footer credit on
  mbsdoc.com, pbjsa.com, projectmakeover.org, fdaaf.org, fixalways.com —
  five real, relevant, Florida links. Cheapest meaningful boost available.
- **Citations**: Bing Places, Apple Business Connect, Yelp, Gainesville &
  Jacksonville chambers, Clutch/UpCity profiles. NAP identical everywhere.

## Decisions (resolved by Alex, 2026-08-09)

1. **Address**: city-only — "Gainesville, FL". No office yet, no street
   address anywhere on site or schema. **No phone published.**
2. **City list** (canonical spellings, use exactly these):
   Gainesville, Jacksonville, Fleming Island, Orange Park, Ocala,
   St. Augustine, High Springs, Alachua, Newberry.
3. **Socials**: Organization `sameAs` gets the Facebook business page
   `https://www.facebook.com/profile.php?id=61592711216301` (plus the
   existing g.page link). Founder Person node for Alex Anderson gets
   `https://www.linkedin.com/in/alexander-anderson-73a870252/`.
   Instagram/others pending — do not invent them.
4. **GBP**: confirmed registered as a service-area business in
   Gainesville, FL with the cities above pending review. Site NAP matches.

## Execution model

One executor agent (Opus) per phase, sequential, with review between phases.
Phases 1–3 are pure text/markup — no dependencies, no lockfile risk. Phase 4
is verification and can run in the main session. Each agent gets: this doc,
the HANDOFF, and the phase number. Ship each phase as one commit.
