FONTS
Spot it before it hurts someone (training-samples/safety)

In the folder now, licensed and in use:

  Parson-Regular.woff2
  Parson-SemiBold.woff2
  Parson-Bold.woff2
    Declared as 'Parson' at weights 400, 600 and 700. Body copy, buttons and
    running text. Fallback: system-ui, sans-serif.

Expected, not here yet:

  display-bold.woff2      (font-weight: 700)
  display-regular.woff2   (font-weight: 400)
    Declared as 'Site Display'. Headings, the screen numerals, the stop and go
    calls, and the pager buttons. The condensed industrial face being licensed
    goes here under exactly these names, with no code change needed.

Until those two arrive the fallback stack carries every display line:

  'Site Display', 'Arial Narrow', 'Helvetica Neue', Impact, sans-serif

The headings are set in all caps with tight tracking and a line height near 1,
sized so Arial Narrow reads as a deliberate stencil rather than a substitution.
Check the screen numerals and the STOP and GO buttons first after dropping the
real face in: those are the two places where a wider face will change the
metrics most.
