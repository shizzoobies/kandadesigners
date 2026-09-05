FONTS
The RFI that gets answered, public/training-samples/rfi/

In the folder now, licensed and in use:

  lettering.woff2         declared as 'Sheet Lettering', font-weight 400
  lettering-bold.woff2    declared as 'Sheet Lettering', font-weight 700

    The hand-lettering face. Two real weights, declared separately, so no
    bold is synthesized from a single file.

    It sets the title block, the sheet counter, every screen heading, the
    revision tab labels, the detail callout, the choice tags, the sort
    buttons, the pager, the verdict words and the approval stamp. Everything
    that uses it is uppercased with wide tracking, the way lettering is
    drawn on a sheet.

Each weight also names a truetype and an opentype source after the woff2:

  lettering.ttf / lettering.otf
  lettering-bold.ttf / lettering-bold.otf

Those are not here, and nothing fetches them: a browser only reaches the
second source in a src list when the first one fails. They are declared so
that a later drop-in under either name takes over with no code change.

Body copy takes no file at all. It is a system stack:

  system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif

That is deliberate. This folder has to work as a package inside an LMS where
an absolute /fonts/ path on the studio site does not resolve, so the piece
carries no dependency it cannot see from its own directory.

Figures, sheet numbers, detail numbers and specification sections are set in
a monospace stack, again with no file:

  'Courier New', ui-monospace, monospace


IF THE LETTERING FILES ARE EVER REMOVED

Every display line falls back to:

  'Sheet Lettering', 'Segoe UI', 'Trebuchet MS', 'DejaVu Sans', sans-serif

sized, uppercased and tracked so the substitution still reads as a deliberate
drawing sheet rather than a missing font. The piece stays usable and stays
within its fixed stage; it just loses the hand.


AFTER ANY FONT CHANGE

Check these three places first, because they are where a wider or narrower
face changes the metrics most:

  1. The course title in the title block. It must stay on one line, and the
     block must stay at two rows. The whole fixed stage is measured against
     that height.
  2. The revision tab labels on screens 3 and 4. Four tabs have to sit on
     one row at 900px wide.
  3. The stamp word on the ending, "RFI ANSWERED". It is set at up to
     2.35rem with 0.12em tracking and must not wrap.

Then run the fit check from the repository root:

  node scripts/sample-fit-check.mjs rfi

It walks every screen at three desktop sizes and a phone, opens every tab and
every sub-step, and fails if anything scrolls that should not.
