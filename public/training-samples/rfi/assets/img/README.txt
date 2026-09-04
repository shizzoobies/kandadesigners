PHOTOGRAPHY SLOTS
The RFI that gets answered, public/training-samples/rfi/

Four slots, all four filled. Every image is decorative: every fact, figure and
instruction in the piece is carried in text, and no file named below is
referenced from index.html or app.js. They are CSS background-images in
style.css and nothing else, which keeps them out of the accessibility tree by
construction and means an absent file paints the fallback rather than showing
a broken image. The piece ships correctly with this folder emptied.


THE FALLBACK, IF A FILE IS EVER REMOVED

Every slot sits on a blue plate: a cyanotype gradient over the same fine
drafting grid the sheet uses, inside a linework blue rule with a white
hairline. With the folder empty the piece reads as a finished drawing set
with blue plates where the photographs go. Nothing looks broken and nothing
shifts.


THE FOUR SLOTS

  hero.jpg        Screen 1, the cover sheet, full bleed behind the text.
                  Delivered at 1400 x 1050, 71KB. Drawings on a jobsite
                  table.
                  This is the only slot with text over it, and the only one
                  with a heavy treatment: a deep blue wash running 82 to 94
                  percent sits on top of it. The wash was measured against
                  the worst case, a pure white pixel in the photograph: even
                  there the sheet white body copy holds 7.0:1 and the muted
                  blue holds 4.9:1. A replacement must keep nothing legible
                  in frame, no signage, no plate, no logo, no identifiable
                  face, and should read as shape rather than detail, because
                  shape is all that survives the wash.

  detail.jpg      Screen 2 side plate, beside "What an RFI actually is".
                  Delivered at 900 x 1045, 54KB. A drawing detail close up.

  review.jpg      Screen 3 side plate, beside "Why RFIs come back slow".
                  Delivered at 900 x 1350, 86KB. A set under review.

  rolls.jpg       Screen 4 side plate, beside the four parts.
                  Delivered at 900 x 600, 40KB. Rolled drawings.

The three side plates run the full height of the drawing border and are about
170px wide on screen, so they crop hard to a tall column. 900px on the short
edge already covers a 2x display. Keep replacements under about 250KB, and
the hero under about 400KB.


TREATMENT

All four are duotoned in CSS, not in the file. A cyanotype gradient sits over
each side plate at 62 to 86 percent, and the heavier wash described above
sits over the hero. Supply ordinary colour photographs; the stylesheet turns
them blue. Do not pre-tint a replacement or the two treatments stack.


REPLACING ONE

Keep the filename. All four crop with background-size: cover and centre
themselves, so leave air around the subject and nothing needs editing when a
file changes shape. The side plates are much taller than they are wide, so a
landscape file will be cropped to its middle third.

Licensing     Decorative slots in a demonstration piece that is published
              publicly. Use imagery the studio owns or has a licence for
              that covers web display in a portfolio context. No client
              site, no employer material, and no identifiable person
              without a release.

Alt text      None of these need alt text and none of them should have it.
              If a photograph ever has to carry meaning it stops being a
              background and becomes an <img> with a real alt attribute,
              and the text around it has to change too.
