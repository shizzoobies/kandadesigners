# Ellenton office and the Tampa Bay market

Design agreed with Alex on 2026-09-28 and 2026-09-29. Implementation goes to a preview branch; Alex reads it locally and does his voice pass before it ships.

## What is true

- K & A Performance is getting its first physical office at 909 25th Dr, Ellenton, FL (ZIP 34222 to confirm, street suffix to confirm against the lease). The building belongs to a partner of Alex's; the lease is not signed yet but the address is certain.
- Gainesville stays the headquarters. Alex has not landed a physical space there; the Gainesville address stays city-only.
- From Ellenton the studio actively serves Sarasota, Bradenton, St. Petersburg, Tampa and Brandon. All five are in-person territory; meetings at either location are by appointment only; hours match the Google profile (not recorded in the repo; add to the schema when Alex supplies them).
- The first bay-area build already exists: Ellenton Family Practice Direct (familypracticedirect.com), built next door to the office. MBS Medicine is the studio's other medical build.

## Section 1: one source of truth for geography

New file `src/data/locations.js`, beside `contact.js`, read by everything that asserts geography.

```js
export const locations = {
  gainesville: { name: 'Gainesville', region: 'FL', role: 'headquarters', page: '/locations/gainesville/', published: true, street: null },
  ellenton: {
    name: 'Ellenton', region: 'FL', role: 'office', page: '/locations/ellenton/',
    // Flip to true the day the lease is signed. Until then nothing renders the
    // street, the postal code, a map or hours, and the build gate fails if the
    // street appears anywhere in dist/.
    published: false,
    street: '909 25th Dr', postalCode: '34222', mapUrl: null, hoursNote: 'By appointment',
  },
};
export const regions = [
  { key: 'north-central', label: 'North Central Florida', inPerson: true,  base: 'gainesville', cities: ['Gainesville', 'Alachua', 'Newberry', 'High Springs', 'Ocala'] },
  { key: 'northeast',     label: 'Northeast Florida',     inPerson: false, base: 'gainesville', cities: ['Jacksonville', 'Fleming Island', 'Orange Park', 'St. Augustine'] },
  { key: 'tampa-bay',     label: 'Tampa Bay',             inPerson: true,  base: 'ellenton',    cities: ['Ellenton', 'Bradenton', 'Sarasota', 'St. Petersburg', 'Tampa', 'Brandon'] },
];
export const citiesServed = regions.flatMap((r) => r.cities); // fifteen, fixed order
```

Consumers that change to read it: `BaseLayout.astro` (schema `areaServed`), `Footer.astro` (the serving line, grouped by region), `contact/index.astro` (Where we work), the new pages, and the kit's `nap.md` gains a second block for the office once published.

### Schema

- The `ProfessionalService` organization node keeps Gainesville, city-only, as its `address`, and its `areaServed` becomes the fifteen cities.
- A second node, `@type: ProfessionalService`, `@id: https://ka-performancefl.com/#ellenton`, `parentOrganization: { '@id': ORG_ID }`, `name: 'K & A Performance, Ellenton'`, `url` the office page, `areaServed` the Tampa Bay cities, `address` with `addressLocality: 'Ellenton'`, `addressRegion: 'FL'`, `addressCountry: 'US'` and, only when `published`, `streetAddress` and `postalCode`. No `openingHours` until the hours are known. This is the node the Google, Apple and Bing office listings will point at later.

### The gate

`scripts/seo-check.mjs` gains one rule: if `locations.ellenton.published` is false and any file under `dist/` contains the street string, fail with a message naming the file. Read the flag by parsing `src/data/locations.js` as text, the way the script already parses `NOINDEX` out of `astro.config.mjs`.

## Section 2: two new pages

Both hand-written in the site's voice, following the Gainesville page's structure (kicker, H1, body sections, a visible FAQ whose strings feed `FAQPage`, `BreadcrumbList` Home > page, `ReviewsRail`, closing CTA). Titles under 60 and descriptions 140 to 160, decoded. Facts only from this spec, `work.js`, and the existing location pages.

### `/locations/ellenton/`, the office page

- Says the studio has an office in Ellenton, in Manatee County, at the north end of the bay, and that it is the first place the studio can meet at its own table. Meetings by appointment. While `published` is false the page says the office is in Ellenton and the address follows when the doors open; when true it shows the street, ZIP and a map link.
- Proof: Ellenton Family Practice Direct, built next door (link, as `work.js` records it), and MBS Medicine as the other medical build.
- Lists the five bay cities as in-person territory and links the Tampa Bay page.
- FAQ (visible, four questions): Do you have an office in Ellenton? Can we meet in person? Is pricing different here? Do you build for medical practices?
- Title: `Web Design in Ellenton, FL | K & A Performance` (48). Breadcrumb Home > Ellenton, FL.

### `/locations/tampa-bay/`, the regional page

- One page for Sarasota, Bradenton, St. Petersburg, Tampa and Brandon, written by someone who lived there: that those five interact as one place, that the office sits at the north end in Ellenton, that any of them is an appointment away. Names each city in prose, not as a list of links to pages that do not exist.
- Says quotes are free and the bands are the same as everywhere (links the cost page), names Ellenton Family Practice Direct as the first bay build, and links the Ellenton office page.
- FAQ (visible, four questions): Where are you actually based? Will you come to us? Is pricing different in Tampa Bay? Can you help a business that already has a site?
- Title: `Tampa Bay Web Design & AI | K & A Performance` (45). Breadcrumb Home > Tampa Bay.

### Links in

Footer Locations column (Gainesville, Jacksonville, Ellenton, Tampa Bay); contact page Where we work (rewritten to two locations and three regions, from `locations.js`); home `HomeStudio` foot line ("Based in Gainesville, with an office in Ellenton..."); the Gainesville page's neighbouring-towns section gains one sentence pointing south; the Jacksonville page's "How remote actually runs" section is unchanged; the cost page's "How the local half runs" sentence adds the Ellenton page. Nav is untouched. The sitemap picks the pages up automatically.

## Section 3: what else changes, and what does not

- **Home title and description stay Gainesville-first.** Gainesville is the headquarters and the target of Direction A.
- **The Jacksonville page is untouched** beyond its footer; the Northeast stays remote.
- **No street address renders anywhere** until the flag flips, including the kit, the schema and the office page.
- **Listings are a follow-on, not this build.** After the lease: a second Google Business Profile location for the office (storefront, by appointment), an Apple Business Connect place card (now possible with a real address), Bing, and a second NAP block in the kit. Recorded in the handoff's citation item.
- **Testing:** build; `scripts/seo-check.mjs` PASS including the new street rule (tested both ways by flipping the flag locally); `scripts/a11y-check.mjs` on both new pages plus contact and home, zero violations; every href on the new pages resolves; JSON-LD on both pages and the layout parses; word counts roughly 700 to 900 per page.
- **Delivery:** branch `site/ellenton-tampa-bay`, local preview for Alex first (`node node_modules/astro/astro.js preview`), then the Cloudflare preview URL on push, then main on his approval.

## Out of scope

City pages for Bradenton, Sarasota, St. Petersburg, Tampa or Brandon; hours in the schema; the Gainesville street address; any listing work; changes to the home page order.
