PHOTOGRAPHY SLOTS
The profit and loss module, public/training-samples/finance/

Four slots, all four filled. Every image is decorative: each fact, figure and
instruction in the module is carried in text, and none of these files is
referenced from index.html or app.js. They are CSS background-images in
style.css and nothing else, which keeps them out of the accessibility tree
by construction and means an absent file paints nothing rather than showing
a broken image. The module ships correctly with the folder emptied.


THE FOUR SLOTS

  hero.jpg          Screen 1, the cover, mounted beside the label.
                    Delivered at 1600 x 1115, 189KB. Invoices on a wooden
                    desk.
                    On the cover the panel gives up its ratio and fills
                    the height of the board, so the crop is tighter there
                    than 16:11.
                    This is the only treated slot: a 160 degree ink navy
                    gradient, 72 to 92 percent, sits over it on multiply.
                    No text is placed over it, so there is no contrast
                    obligation against the treatment. If text is ever put
                    on top of this panel, it must be measured against the
                    darkest and lightest points of the image under the
                    overlay, not against the overlay alone.

  ledger.jpg        Screen 3, side column, beside the statement.
                    Delivered at 900 x 600, 41KB. A young business owner in
                    an apron working through the finances.
                    Panel ratio 3:2, matching the file. Untreated.

  storefront.jpg    Screen 4, side column, beside the margin comparison.
                    Delivered at 900 x 1350, 125KB. A bakery window display
                    of breads.
                    Panel ratio 2:3, matching the file. Untreated.

  owner.jpg         Screen 7, side column, beside profit versus cash.
                    Delivered at 900 x 600, 62KB. A baker standing in an
                    artisan bakery.
                    Panel ratio 3:2, matching the file. Untreated.


REPLACING ONE

Keep the filename and the ratio and nothing needs editing. Change the shape
of an image and the matching aspect-ratio in style.css has to change with
it, or background-size: cover will crop half the frame away instead of
trimming the edges. The three ratios live together in one block in
style.css, under the comment that says so.

Sizing        The panels are at most 304px wide on screen, so 900px on the
              short edge already covers a 2x display. Keep replacements
              under about 250KB.

Cropping      All four use background-size: cover and background-position:
              center. Leave air around the subject.

Licensing     Decorative slots in a demonstration piece that is published
              publicly. Use imagery the studio owns or has a licence for
              that covers web display in a portfolio context.

Alt text      None of these need alt text and none of them should have it.
              If a photograph ever has to carry meaning, it stops being a
              background and becomes an <img> with a real alt attribute, and
              the text around it has to change too.
