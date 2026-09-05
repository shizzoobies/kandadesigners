// Where a device screen takes its pixels from when the capture inside it is a
// page framed on a backdrop rather than a page that fills its viewport.
//
// Pure geometry, no imports. src/components/PlateComposite.tsx renders from it
// and scripts/composite-check.ts checks against it, and neither can drift from
// the other while the arithmetic lives in one place.

/** A rectangle in a capture's own pixels. Written by scripts/capture.ts. */
export type ContentBox = { x: number; y: number; w: number; h: number };

/** A rectangle of the capture to show. Same units. */
export type FillRegion = { x: number; y: number; w: number; h: number };

/**
 * True when the box is the whole frame, which is what a page filling its
 * viewport measures as.
 *
 * This is the case that must render exactly the way it rendered before content
 * boxes existed. Every clip in the web reel measures this way, and so does
 * every mobile capture in the training reel, so the fill rule below is reached
 * only by the five safety desktop clips, whose deck really is a fixed width
 * sheet on a black stage.
 */
export function isFullFrame(
  box: ContentBox,
  frameWidth: number,
  frameHeight: number,
): boolean {
  return box.x === 0 && box.y === 0 && box.w === frameWidth && box.h === frameHeight;
}

/**
 * True when a capture is a phone capture, which is the one fact that decides
 * which way a cover crop is anchored.
 *
 * Portrait or landscape is the whole test, because in this project a portrait
 * capture is a phone capture: every mobile clip is 780x1688 and every desktop
 * one is 2880x1800 or 980x628.
 */
export function isPortraitCapture(
  frameWidth: number,
  frameHeight: number,
): boolean {
  return frameHeight > frameWidth;
}

/**
 * The region of a capture that a cover crop shows inside a quad of the given
 * aspect, for a capture whose page fills its own frame.
 *
 * This is the arithmetic behind PlateComposite's objectFit cover, written out
 * so scripts/composite-check.ts can trace a rendered ring point back to the
 * capture pixel it came from. The two would otherwise state the anchoring
 * twice, and the ring check's off page figure is only meaningful while they
 * agree.
 *
 * Top anchored either way, because a page starts at its top. Horizontally a
 * desktop page is anchored left, so the crop comes off the right margin and the
 * logo, the nav and the headline survive; a phone page is centred, so the crop
 * comes off both edges evenly and a centred mobile column keeps the buttons on
 * its right hand side. Owner fix 2026-09-05, and the numbers are in the note on
 * CAPTURE_ANCHOR in src/components/PlateComposite.tsx.
 */
export function coverRegion(
  frameWidth: number,
  frameHeight: number,
  quadAspect: number,
): FillRegion {
  const frameAspect = frameWidth / frameHeight;
  const w = frameAspect > quadAspect ? frameHeight * quadAspect : frameWidth;
  const h = frameAspect > quadAspect ? frameHeight : frameWidth / quadAspect;
  const x = isPortraitCapture(frameWidth, frameHeight) ? (frameWidth - w) / 2 : 0;
  return { x, y: 0, w, h };
}

/**
 * The region of the capture that fills a screen quad of the given aspect, for a
 * capture whose page is a sheet on a backdrop.
 *
 * The rule, and the one decision in it:
 *
 * The region has the quad's aspect, so nothing is letterboxed and nothing is
 * stretched. It is anchored at the content box's top, so the page's own top
 * edge lands on the panel's top edge, and centred horizontally on the box, so a
 * centred sheet stays centred. The remaining question is which way the aspect
 * is reconciled, and the answer is that the region is always a CROP of the
 * content box, never an expansion of it.
 *
 * Expanding is the other reading of "fill", and it is wrong here. The safety
 * deck's box is 2184x1756, an aspect of 1.24, against a laptop quad of about
 * 1.51. Widening 1756 rows to 1.51 needs 2653 columns, which is 469 more than
 * the page has: the composite would put a quarter of a thousand pixels of the
 * black stage back inside the device, which is the exact fault this exists to
 * fix. Cropping instead takes 2184x1449 from the top of the sheet, which is the
 * module header, the interaction and its feedback, and no backdrop at all.
 *
 * Because the region is a crop, it is always inside the content box, so the
 * "content box is too narrow to fill and has to be centred" case cannot arise.
 * The cost is the bottom of the page, and on a 24 frame plate shot of a deck
 * whose lower fifth is a footer bar that is the right thing to spend.
 */
export function fillRegion(
  box: ContentBox,
  frameWidth: number,
  frameHeight: number,
  quadAspect: number,
): FillRegion {
  const boxAspect = box.w / box.h;

  const w = boxAspect > quadAspect ? box.h * quadAspect : box.w;
  const h = boxAspect > quadAspect ? box.h : box.w / quadAspect;

  // Top anchored, centred horizontally on the box. The clamps cannot bite while
  // the region is a crop of a box that is itself inside the frame; they are
  // here so a future change to the anchoring cannot walk off the capture.
  const x = Math.max(0, Math.min(frameWidth - w, box.x + (box.w - w) / 2));
  const y = Math.max(0, Math.min(frameHeight - h, box.y));

  return { x, y, w, h };
}
