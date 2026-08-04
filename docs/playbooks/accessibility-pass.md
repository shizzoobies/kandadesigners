# Accessibility pass and statement page: client playbook

A repeatable process for auditing a client site and publishing an accessibility
statement that holds up. Written from the pass done on ka-performancefl.com,
which is the worked example throughout.

The organising principle: **verify everything, claim only what you verified.**
A statement is a public commitment. Anything in it that is not true is worse
than saying nothing, because it converts a technical gap into a written claim.

---

## 0. Before you touch anything

Get two things straight with the client first, because they change the work:

1. **Is there a legal driver?** A demand letter or a procurement requirement
   means the target is fixed and probably needs an independent audit. Absent
   that, you are aiming at WCAG 2.2 Level AA and self-assessing, which is
   normal and defensible as long as you say so.
2. **Who owns the content?** You can fix markup. You usually cannot rewrite
   their copy, re-shoot their photography, or re-license artwork. Scope the
   pass to what you control and list the rest.

---

## 1. Audit: verify, never assume

The failure mode here is grepping for a feature name and treating a hit as
proof. On this project a search for "origin" across the API functions returned
matches and I nearly reported that origin checks existed. They did not. Every
hit was the word "origin" inside prompt prose. **A grep proves a string exists,
not that a behaviour does.**

Run these against the built output and the live site, not the source.

### Structure and semantics

```bash
# Does a real 404 exist, or does every bad path return 200?
curl -s -o /dev/null -w '%{http_code}\n' https://example.com/definitely-not-real

# lang, landmarks, heading order, link names, focusable count
```

In the browser console or via Playwright:

```js
{
  lang: document.documentElement.lang,
  hasMain: !!document.querySelector('main'),
  headingLevels: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]),
  linksWithoutName: [...document.querySelectorAll('a')]
    .filter(a => !(a.textContent.trim() || a.getAttribute('aria-label')))
    .map(a => a.getAttribute('href')),
  imagesWithoutAlt: [...document.querySelectorAll('img')]
    .filter(i => !i.hasAttribute('alt')).length,
}
```

Heading levels should never skip (1,2,2,3 is fine; 1,3 is not). Every link and
button needs an accessible name. Every `img` needs an `alt` attribute, even if
empty for decoration.

### Keyboard

Do not eyeball this. Drive it:

- Tab from page load. Is the first stop a skip link? Does focus ever land on
  something with no visible indicator? Does it ever get trapped?
- Open every modal, dialog and menu by keyboard. Can you close it with Escape?
  Does focus return sensibly?
- Check `:focus-visible` styling actually exists in CSS rather than assuming
  the browser default survived a reset.

### Motion

```js
window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

Then actually set the OS preference and reload. Scroll animations, carousels,
autoplaying video and page-turn effects must stop, not just slow down.

### Contrast

Measure, do not judge by eye. Sample the rendered pixels, not the CSS values,
because opacity, gradients and images all change the real result. Pull the most
common colour inside a text block (that is the background between the glyphs)
and compute the ratio against the text colour. AA is 4.5:1 for normal text and
3:1 for large text.

This matters most for text sitting **over an image**, which is the case people
get wrong. See section 3.

---

## 2. The fixes that are nearly always needed

### Skip link

Most implementations are subtly broken. The trap: without `tabindex="-1"` on
the target, browsers scroll but leave focus in the navigation, so the next Tab
dumps the user straight back where they started.

```html
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  ...
  <main id="main-content" tabindex="-1">
```

```css
.skip-link {
  position: fixed;            /* fixed, not absolute: must work when scrolled */
  top: 0.75rem; left: 0.75rem;
  z-index: 100;               /* must clear a sticky/fixed header */
  transform: translateY(calc(-100% - 1.5rem));  /* moved, not display:none, */
  transition: transform 150ms ease;             /* or it leaves the tab order */
}
.skip-link:focus { transform: translateY(0); }
@media (prefers-reduced-motion: reduce) { .skip-link { transition: none; } }
```

Verify by keyboard: Tab shows it, Enter moves focus **onto** `main`, the next
Tab lands on the first control inside main and not back in the nav.

### A real 404 page

Worth doing even though it looks unrelated. On a static host, a missing 404
page can mean every unmatched path returns **200 with an HTML body**. Combine
that with long-lived cache headers on a hashed-asset directory and a missing
asset gets a 404 page pinned in cache under the stylesheet's own URL. That took
this site's CSS down completely for a while. Check it explicitly.

### Other standing items

- `<html lang>` set, and `lang` on any passage in another language.
- Visible `:focus-visible` styling with a contrasting outline and offset.
- Form inputs with real `<label>`s, errors announced, not colour-only.
- Touch targets and reflow down to 320px with no horizontal scrolling.

---

## 3. Artwork and images of text

This is where most statements either overclaim or needlessly confess. Get the
reasoning right and the copy writes itself.

### The exceptions are real

**1.4.5 Images of Text** excepts cases where "a particular presentation of text
is essential to the information being conveyed." Essential means removing it
would fundamentally change the information and it cannot be achieved another
way. Hand-lettering inside an illustration, or type that is part of a painting's
composition, qualifies by any sane reading. It is the same provision that
exempts logotypes.

**1.4.3 Contrast** has an incidental exception covering "text or images of text
that are part of a picture that contains significant other visual content."
Artwork is exactly that.

So a portfolio piece with lettering baked into it is not a failure on either.

### 1.1.1 has no artwork exception

Non-text Content still applies. For images that are largely words, the text
alternative must **describe the work and convey the words in it**. Generic
per-item boilerplate does not clear that bar. On this project twenty picture
book pages all carried the identical alt "an illustrated scene with story
text", which neither described the page nor carried a single word from it.

### The best outcome: remove the question

If you can get the **untexted artwork** and set the words as live HTML over it,
you are done. The text then selects, resizes, reflows and is read natively, and
1.4.5 never enters the conversation. Always ask the client whether the
illustrator's pre-typeset files exist. On this project they did, and it turned
a defensible argument into a non-issue.

Two things to watch when you do it:

- **Live text over an image gets no contrast exception.** Put a scrim behind
  it. Invisible on pages that left white space, load-bearing on the ones that
  do not. Measure the result: we got 18.2:1 on paper and 16.2:1 over artwork.
- **Do not trust file order.** The raw files here were not in reading order,
  and shipping them by filename would have printed the story out of sequence.
  Map by content.

### Stating an exception does not create it

The exception exists because of what the content is. If an expert disagrees
about whether a presentation was essential, the statement is your argument, not
a waiver. What it does buy you is evidence that you evaluated the criterion
rather than ignored it, so document the reasoning.

And the exception covers the artwork only. **Titles, artist names, captions,
prices, navigation and buttons are interface text and fully bound by 1.4.5 and
1.4.3.** If any of that is baked into image files, that is a genuine failure and
a far more common one.

### The privacy carve-out

Judgement call, and worth agreeing with the client in writing.

Where a piece is largely words, transcribe them. But **do not transcribe third
parties' personal data.** On this project the portfolio contained club flyers
printing coaches' mobile numbers and a private Gmail address, and wedding and
baby shower invitations printing a couple's full names, a home address and an
RSVP phone number. Moving those into alt text would make them machine-readable
to scrapers in a way the pixels never were.

Convey the design content, omit the personal data, and grep the built HTML
afterwards to prove none leaked:

```bash
grep -cE '[0-9]{3}[.-][0-9]{3}[.-][0-9]{4}|[a-z]+@gmail\.com' dist/**/*.html
```

Flag to the client that this material is on their site at all. They often have
not realised what is legible in their own portfolio.

---

## 4. The statement page

Structure that works:

1. **Intro:** one short paragraph. What the page is for.
2. **The standard we build to:** name WCAG 2.2 Level AA, link it, and say
   plainly whether this is self-assessed or independently audited. If
   self-assessed, describe the site as *aiming at* AA, not certified.
3. **What is in place:** a real list of measures, not aspirations.
4. **How we handle artwork:** only if the site is artwork-heavy. Cite the
   exceptions, then state the alternative-text obligation that survives them,
   and note that interface text around the artwork is held to full AA.
5. **Known limitations:** short and true. One honest item beats five vague
   ones.
6. **Third-party content:** anything embedded you do not control, and an
   invitation to report it anyway.
7. **How to reach us:** see below.

### Rules for the copy

- **Never claim perfection.** A statement claiming full conformance with no
  audit is the easiest thing in the world to disprove.
- **Do not list gaps you could just fix.** If the page says "we have not added
  a skip link yet", add the skip link. Ours said exactly that for about an hour
  before we fixed it and rewrote the line.
- Give a real contact route and a specific ask: the page, what they were
  trying to do, and the browser or assistive technology. Say rough notes are
  fine.
- Offer the same address for accessibility requests generally, including
  content in another format or bypassing a form.
- Date it, and re-date it when the substance changes.

### The contact route must work without JavaScript

Check this. Cloudflare's **Email Address Obfuscation** (Scrape Shield) silently
rewrites every `mailto:` into a `/cdn-cgi/l/email-protection` link with the
visible text `[email protected]`, restored by its own JavaScript at runtime.
It looks perfect in a browser and is completely broken with scripts disabled,
on the one page whose entire job is being reachable when something else has
already failed the user.

It is also why grepping the served HTML for an email address returns nothing
while the page is fine. Diagnose with:

```bash
curl -s https://example.com/accessibility/ | grep -c 'email-protection'
```

Non-zero means it is on. Turn it off in the dashboard.

**Verify the address actually routes** before publishing it. A published
address that bounces is worse than no address.

---

## 5. Verification discipline

The habits that caught real defects on this project:

- **Drive it, do not read it.** The skip link looked right in source and only
  proved correct once Tab, Enter, Tab confirmed focus moved into main.
- **Measure contrast from rendered pixels.** CSS values lie once opacity,
  gradients or images are involved.
- **Read back rather than trust a success code.** After any write to a
  third-party service, GET it again and confirm the content. A 200 means the
  request was accepted, not that the result is right.
- **Check the served HTML, not the source.** The email obfuscation only exists
  at the edge. So did the cache poisoning.
- **Look at the images.** Alt text written from a filename or a listing is
  guesswork. Fetching the twenty hotlinked images on this project found one
  labelled as a food truck flyer that was actually a website mockup. Wrong alt
  is worse than vague alt, because it actively misinforms.
- **Watch where CSS lands.** Text styles for a component were pasted inside a
  `max-width: 899px` media query, so they applied on mobile only and the
  desktop view silently rendered with no text at all.

---

## 6. Deliverables checklist

- [ ] Audit notes: what was checked, what passed, what failed, with evidence
- [ ] Skip link, verified by keyboard
- [ ] Real 404 page returning a 404 status
- [ ] Focus-visible styling
- [ ] Reduced-motion support, verified with the OS setting on
- [ ] Heading order with no skips; landmarks present; `lang` set
- [ ] Alt text pass, with words carried on text-heavy images
- [ ] Personal data deliberately excluded, and grep-proven
- [ ] Contrast measured, including any text over imagery
- [ ] Statement page published and linked in the footer
- [ ] Contact address verified to route, and working without JavaScript
- [ ] Client told what is theirs to fix and what is outstanding
