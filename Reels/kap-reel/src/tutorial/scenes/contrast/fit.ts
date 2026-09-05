// Keeping a one line label on one line.
//
// Every secondary line in these scenes is small caps set across a box whose
// width is decided by the crop, and every one of them is measured before it is
// drawn: the layout reserves exactly one line of height for it, so a line that
// wrapped would push the picture out of demoBox() and off the top of the frame.
// That is what the first landscape stills did, in three places at once.
//
// Rather than reserve two lines everywhere and leave a hole in the tall crops,
// the size is solved against the width. Nothing here measures real text: it
// estimates from the average advance of the face, which is enough because the
// caller also sets whiteSpace: nowrap and because being a little small is a
// worse outcome than being a little wrong.

/**
 * Average advance of Atkinson Hyperlegible Next at semibold, as a fraction of
 * the type size, for a line of capitals.
 *
 * Capitals run wider than the mixed case average, and every line this is used on
 * is set with textTransform: uppercase, so this is the caps figure and not the
 * usual 0.52.
 */
export const CAPS_ADVANCE = 0.66;

/**
 * The largest size at which `text` fits `width` on one line, capped at `max`.
 *
 * `letterSpacing` is in pixels and is added per character, because it is set as
 * an absolute value everywhere in this project rather than in em.
 */
export function fitOneLine(
  text: string,
  width: number,
  max: number,
  letterSpacing = 0,
  advance = CAPS_ADVANCE,
): number {
  const chars = Math.max(1, text.length);
  const room = width - letterSpacing * chars;
  const size = room / (chars * advance);
  return Math.max(1, Math.floor(Math.min(max, size)));
}
