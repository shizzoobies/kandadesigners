FONTS
Build the plate, skip the diet (training-samples/nutrition)

Nothing is in this folder yet. Both families below are being licensed on
Envato Elements. Drop the files in under exactly these names and they take
over with no code change.

Expected, not here yet:

  display.woff2           (font-weight: 400 700, one variable or one file
                           declared across the range)
    Declared as 'Site Display'. A friendly hand-lettered marker or chunky
    brush face. It carries the module title, every card heading, the corner
    numerals, the tabbed divider labels, the food names, the Nutrition Facts
    heading and the large figure on the panel, the pager buttons, and the
    scores in the ending.

  body-regular.woff2      (font-weight: 400)
  body-medium.woff2       (font-weight: 500)
  body-bold.woff2         (font-weight: 700)
    Declared as 'Site Body'. A rounded humanist sans. Body copy, bullets,
    counters, feedback, the printed panel rows, and the small controls.

Until those arrive, two fallback stacks carry the whole module:

  'Site Display', 'Trebuchet MS', 'Segoe UI', sans-serif
  'Site Body', 'Segoe UI', system-ui, sans-serif

The display stack is deliberate rather than accidental. Trebuchet MS at 700
is warm, round and a little informal, which is the register this module wants,
and every display rule sets it with slightly negative tracking (about -0.02em
on the headings) and a line height near 1.0 so it reads as a chosen face and
not as a browser default. It is never asked to be a script: no italic, no all
caps on a heading, no letter spacing that would expose the joins.

Do not add 'Segoe Print', 'Bradley Hand', 'Comic Sans MS' or any cursive to
the display stack. A failed handwriting substitute reads as a mistake, and a
solid rounded sans does not.

After dropping the real display face in, check these four places first,
because they are where different metrics will show up hardest:

  1. The masthead title, which is clamped and sits beside the progress meter.
  2. The corner numerals on each card, which are sized off the viewport.
  3. The tabbed divider labels on cards 2 and 8, which must stay on one row
     of the tab strip at 1100px wide.
  4. The zone buttons on card 3 (Veg, Protein, Grains, Beside), which are
     set in the body face but sit in a row that must not wrap at 900px wide.

A wider display face will also change the Nutrition Facts panel on card 4,
where the word Calories and the figure beside it share a fixed column.


PLACEHOLDER NOTE (2026-09-04)
The @font-face block in style.css is commented out until these files exist,
because a missing font file is a console 404 and the site accessibility gate
counts it as a failure. Drop the files in, remove the comment markers around
the block, done.
