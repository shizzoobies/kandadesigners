FONTS
Strong is a skill (training-samples/strength)

Nothing is in this folder yet. Three families are declared in style.css under
exactly these names, so the licensed files drop in here and take over with no
code change anywhere.

Expected, not here yet:

  display-bold.woff2      (font-weight: 700)
  display-black.woff2     (font-weight: 900)
    Declared as 'Site Display'. A heavy condensed grotesk, an athletic block
    face: the kind of thing painted on a gym wall. It sets the course title,
    the screen headings, the tab labels, the pattern names, the dial labels,
    the card titles and the pager buttons. 900 carries the title and the
    screen headings; 700 carries everything smaller.
    Fallback in use until it arrives:
      'Arial Narrow', 'Helvetica Neue', Impact, sans-serif
    Everything set in this family is uppercase with letter-spacing between
    0.08em and 0.14em, and a line height near 1, so Arial Narrow already
    reads as a deliberate athletic face rather than a substitution. Check the
    course title and the tab row first after dropping the real face in: a
    wider face changes those metrics most, and the tab row is the one place
    where an extra half line would cost a screen its fit.

  body-regular.woff2      (font-weight: 400)
  body-semibold.woff2     (font-weight: 600)
    Declared as 'Site Body'. A sturdy geometric sans for running text,
    options, checkbox and radio labels, and the feedback paragraphs.
    Fallback in use until it arrives:
      'Segoe UI', system-ui, sans-serif

  mono.woff2              (font-weight: 500)
    Declared as 'Site Mono'. Tabular numerals, used for every counter and
    every number that changes: the screen counter under the barbell, the big
    screen numeral in the corner, the two dial readouts, the score values in
    the ending, and the small labelling above each field on the week card.
    Fallback in use until it arrives:
      'Consolas', 'SF Mono', monospace
    It must have tabular figures. Every place it is used also sets
    font-variant-numeric: tabular-nums, so numbers do not jog sideways while
    a counter ticks up.

Licensing note: these are placeholders for faces licensed on Envato Elements
or equivalent. Web font licences are separate from desktop licences on most
marketplaces, so confirm the web licence covers embedding before shipping.


PLACEHOLDER NOTE (2026-09-04), SUPERSEDED the same evening: the licensed files are in this folder and the @font-face block is live.
The @font-face block in style.css is commented out until these files exist,
because a missing font file is a console 404 and the site accessibility gate
counts it as a failure. Drop the files in, remove the comment markers around
the block, done.
