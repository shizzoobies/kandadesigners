FONTS
Heat, done well (training-samples/sauna)

Nothing in this folder yet. Two families are declared in style.css under
exactly these filenames, so dropping the licensed files in here makes them
live with no code change anywhere.

Expected:

  display-regular.woff2   (font-weight: 400)
  display-medium.woff2    (font-weight: 500)
    Declared as 'Site Display'. A refined editorial serif, Nordic in
    temperament: high contrast between thick and thin, calm, a little
    formal, nothing decorative. It carries the masthead title, every
    screen heading, the step and situation titles, the card titles, the
    numeral in the corner of each screen, the verdict word in the
    feedback, and the score figures in the ending. Weight 500 does most
    of the work; 400 sets the numeral only.

  body-regular.woff2      (font-weight: 400)
  body-medium.woff2       (font-weight: 500)
    Declared as 'Site Body'. An elegant humanist sans: open apertures,
    a generous x-height, warm rather than neutral. Running text,
    buttons, tab labels, list copy, the labels inside the dial, and the
    small uppercase counters.

Until they arrive the fallback stacks carry everything:

  display: 'Site Display', Georgia, 'Times New Roman', serif
  body:    'Site Body', 'Segoe UI', system-ui, sans-serif

Those fallbacks are tuned rather than accepted. Headings are set at
weight 500 with letter-spacing near -0.015em and a line height around
1.08, which stops Georgia from reading as a word processor default and
holds the tighter, more deliberate colour a licensed serif will have.
The body stack leads with Segoe UI rather than system-ui so the running
text keeps a humanist shape on Windows instead of falling to a
neo-grotesque.

Check these three places first after dropping the real faces in, because
they are where a change in metrics shows up soonest:

  1. The masthead title beside the mark, which is set on one line and
     has the progress gauge to its right.
  2. The screen numeral in the top right corner. It is positioned
     absolutely and sized in vw, so a wider face can crowd the heading
     beside it. The heading reserves 4.5rem of right padding for it.
  3. The step and situation titles on screens four and five, which are
     the largest running type in the module and set the vertical rhythm
     for both of those screens.

Both families are placeholders for licensed faces. No web font service
and no CDN: the files sit here and are served from here.


PLACEHOLDER NOTE (2026-09-04)
The @font-face block in style.css is commented out until these files exist,
because a missing font file is a console 404 and the site accessibility gate
counts it as a failure. Drop the files in, remove the comment markers around
the block, done.
