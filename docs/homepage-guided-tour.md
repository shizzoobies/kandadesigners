# Homepage guided tour

September 23, 2026.

The homepage keeps its animated hero and replaces the long text sections
with seven composed sections: featured client work, a prepared AI walkthrough,
an accessibility demonstration, the AI Launch progression, original artwork,
a short training preview, and the two studio owners.

## Boundaries

Existing typography, palette, logo, favicon, metadata, inquiry dialog, and
service routes are preserved. Project claims and owner details come from
existing site content. Artwork comes from the artists' published portfolios.
The AI example is explicitly fictional and makes no API requests.

The public training preview is a separate 30-second H.264/AAC video with
English captions and a transcript. It does not autoplay. Complete lessons
retain their existing signup route. Native video controls are available
without JavaScript. The custom playback control appears after initialization.

No new dependencies. The normal hero animation is unchanged. Desktop users
who prefer reduced motion receive a normal-flow hero instead of the existing
420vh sticky frame.

## Verification

- Astro build passed: 43 routes.
- SEO check passed: 29 indexable pages and 14 noindexed routes.
- Checked all 106 local references in homepage HTML: none missing.
- One H1 and no duplicate element IDs.
- Git whitespace check passed.
- Browser inspection at 360 x 800, 768 x 1024, and 1280 x 900.
- No horizontal overflow at tested widths.
- Project tabs: pointer, arrows, End, and Space tested.
- AI example: all three stages tested.
- Launch progression: pointer, Home, and arrow keys tested.
- Phone panel heights remain constant: projects 723px, Launch 690px,
  AI example 555px. Inactive panels use inert and aria-hidden.
- Contrast switch and visible keyboard focus tested.
- Training playback, 30-second completion, replay, and pause tested.
- Navigation to training and back leaves the homepage examples functional.
- Existing project dialog opens and dismisses with Escape; no message sent.
- Tested preview console logs contained no warnings or errors.
- Video decode and component compilation also checked by implementation agent.
- Reduced-motion and no-JavaScript fallbacks reviewed in source; these were
  not separately emulated in the browser. Source/video error handlers were
  reviewed, but network failure was not injected.

Local preview review cards are existing localhost-only placeholders. Real
reviews remain controlled by the unchanged production ReviewsRail component.
Screenshots are saved outside the release tree under Explainer Videos/homepage-qa.
