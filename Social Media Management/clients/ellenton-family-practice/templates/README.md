# Ellenton Family Practice Direct: social templates

One look for every card and carousel slide, so parallel builders produce the same frame. You
change the words; the type scale, logo placement, colors, margins and foot are fixed.

## What is here

| File | What it is |
|---|---|
| `build.mjs` | Renders a template to 1080x1350 PNG with Playwright (from `D:\kap-reel\node_modules`, read only), checks every font and glyph, writes a contrast report, and refuses anything clipped, cramped or off-brand. |
| `brand.css` | Tokens from the site's `src/styles/global.css`, the fonts, the logo sizes, the button and the foot. Do not edit. |
| `card.html` | One idea, one frame. Logo top center, Lora headline, DM Sans sub line, optional moss rule, the amber booking button, the URL. `theme`: `light` or `dark`. |
| `slide.html` | Carousel slide. `variant`: `hook`, `list`, `photo`, `closing`. `theme`: `light`, `sand`, `dark`. Counter "2 / 5" at the foot right. |
| `review.html` | A whole Google review in Lora, the name line, a small "Google review" label, stars only if `stars` is passed. |
| `provider.html` | `variant`: `photo` (headshot left, name right) or `type` (no photo, the name set large). |
| `photo.html` | A real photo across the top 60%, one line below, logo and URL in the foot. For the sign and empty rooms. |
| `samples/` | One render of every template and variant with placeholder text, and the field files that made them (`samples/fields/*.json`). Copy a field file as a starting point. |

Fonts: the site's own self-hosted Fontsource files, loaded from the site repo (nothing
downloaded): `D:\Ellenton Family Practice Rebuild\node_modules\@fontsource-variable\lora\files\lora-latin-wght-normal.woff2`
(and `-italic`), and `...\@fontsource-variable\dm-sans\files\dm-sans-latin-wght-normal.woff2`.
Both are variable, so every weight exists. Logo: the site's `src/assets/images/efpd-logo.svg`,
as delivered (on the dark ground it sits on a small shell plate so the green wordmark holds).

## How a builder uses it

1. Copy the templates into your day folder's `source\` (not the samples):

   ```powershell
   $t = "D:\K & A Performance Site\Social Media Management\clients\ellenton-family-practice\templates"
   $s = "D:\K & A Performance Site\Social Media Management\clients\ellenton-family-practice\To Be Released\2026-10-03-2\source"
   New-Item -ItemType Directory -Force $s | Out-Null
   Copy-Item "$t\build.mjs","$t\brand.css","$t\*.html" $s
   ```

2. Write the words in a JSON file in `source\` (fields below). Text accepts `<br>` and `<em>`
   only. Photo paths are absolute (or relative to `source\`).
3. Run it from `source\`:

   ```powershell
   cd "<day folder>\source"
   node build.mjs card card.json        # a card, any template: card, review, provider, photo
   node build.mjs slides.json           # a carousel
   ```

   Where the files land:
   - One frame: `..\media\card.png` (the brief's name for every card post, whatever the
     template), and `source\contrast.json`.
   - A carousel: PNG masters `source\png\slide-01.png` ..., JPGs `..\media\slide-01.jpg` ...,
     `source\contact-sheet.png`, and `source\contrast.json`.

4. Open the PNGs and look at them. If the build stops with `ERROR`, change the words, not the
   template: shorten the headline, cut a list line, split the idea into two slides.

`--out <dir>` writes the PNGs somewhere else (no JPGs; the name becomes the JSON's file name),
`--name <n>` sets the output name, `--placeholder-ok` lets the "goes here" text through
(samples only). The template name can also go inside the JSON as `"template": "card"`.

## Fields

**card** (`node build.mjs card card.json`)
```json
{ "theme": "light", "eyebrow": "Optional, one short line", "headline": "Two to three lines<br>at most",
  "sub": "One short sentence.", "rule": true, "cta": "Call 941 417 7386" }
```
`theme` light (default) or dark. `rule` and `cta` default on; `"rule": false` drops the moss
rule. Keep the `cta` as "Call 941 417 7386" unless the brief says otherwise.

**slides.json** (a carousel; each slide uses `slide.html` unless it names another `template`)
```json
{ "slides": [
  { "variant": "hook", "eyebrow": "Optional", "headline": "Up to four lines, large", "sub": "Optional" },
  { "variant": "list", "theme": "sand", "heading": "Up to two lines", "items": ["Two to four", "short lines"] },
  { "variant": "photo", "photo": "D:/Ellenton Family Practice Rebuild/src/assets/images/hero-front-sign.png",
    "photoPosition": "8% 50%", "caption": "Up to two lines", "sub": "Optional" },
  { "variant": "closing", "headline": "The ask", "sub": "Optional, e.g. the hours", "cta": "Call 941 417 7386" }
] }
```
The hook shows the word "Swipe" (`"swipe": false` drops it). The counter fills itself
("3 / 5"). Rules the build enforces: slide 1 is a `hook`, the last is a `closing`, and no two
neighbors share a layout. Change `theme` between slides too (light, sand, dark); photo slides
are light. `photoPosition` is a CSS object-position: `8% 50%` centers the roadside sign.

**review**
```json
{ "theme": "sand", "quote": "The whole review, exactly as on the site", "name": "Chris C.", "stars": 5 }
```
The build adds the curly quotation marks; do not type them. The quote steps down in size
(64 to 40px) to fit the longest of the five site reviews; it is never cut. Omit `stars` for
none. `theme` light, sand (default) or dark. `label` defaults to "Google review".

**provider**
```json
{ "variant": "photo", "photo": "D:/Ellenton Family Practice Rebuild/Images/Kulawick.jpg",
  "role": "Medical Director", "name": "Dr. Raphael<br>Kulawik", "credentials": "D.O.",
  "line": "Optional, one fact the site states" }
```
`variant` photo (default) or type (drop `photo`). `cta` defaults on; `"cta": ""` drops it.
The build prints a NOTE when a photo is shown larger than its pixels; look at it at full size.

**photo**
```json
{ "photo": "<absolute path>", "photoPosition": "50% 50%", "line": "Up to two lines", "sub": "Optional" }
```

## What the build refuses

A missing or unknown field; a font that did not load, or any glyph drawn by a fallback font;
text past its line limit (card headline 3, hook 4, list heading 2, list lines 2 each, at most 4
lines); anything outside the safe frame (64px sides, 48px top and bottom) or spilling out of its
box; two blocks closer than 12px, or anything within 40 to 48px of the foot; a second amber
element (amber is the booking button only); any text under 4.5:1 contrast; em or en dashes;
arrow glyphs; emoji; decorative "01 02" numbering; a price; the door sign's 7586; and the
templates' placeholder text.

It cannot judge words. The plan's rules still apply: facts only from the site and the plan,
reviews whole, no outcomes, no "best" of our own, no drug names, US English.

## Samples

Rebuild them from this folder:

```bash
for f in samples/fields/*.json; do node build.mjs "$f" --out samples --placeholder-ok; done
```

`samples/<name>.png` and `samples/<name>.contrast.json` for each field file; the carousel
sample writes `carousel-01.png` to `carousel-05.png` and `carousel-contact-sheet.png`.
