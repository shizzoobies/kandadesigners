// How a phone is drawn in the hero tutorial, in one place.
//
// Every beat of this tutorial is a phone: the invented bakery in five of them
// and three real client home pages in the sixth. They have to be the same shape
// at the same size, because the whole argument is a comparison, and a cut from
// a fictional page to a real one that also changed the framing would be
// comparing two different things.
//
// Why this is not FlatDemo. FlatDemo fits a whole device inside demoBox(), and
// for a phone that means the entire 780 by 1688 page squeezed into about 950
// canvas pixels of height. At that size the page's own headline lands at 34
// pixels on a 1080 wide canvas, and this tutorial is about a headline: the one
// thing that has to be readable is the one thing that is not. So the phone is
// sized by the crop instead. It is as wide as it can be while still showing the
// page down past the fold, and the frame cuts its bottom off, which is what a
// phone in a reel does anyway.
//
// demoBox() is still where the box comes from. That is what it is exported for:
// a Phase B scene that places something against the demo computes the same
// rectangle rather than centering anything by hand.

import type { DemoBox } from "../FlatDemo";

/**
 * The mobile captures' own pixel size, and therefore the fictional page's.
 *
 * assets/captures/captures.json records every mobile capture as 780 by 1688,
 * which is a 390 point viewport at 2x. Drawing the invented bakery at the same
 * size is what makes it comparable with the real ones: the same type sizes mean
 * the same thing on both.
 */
export const PAGE_WIDTH = 780;
export const PAGE_HEIGHT = 1688;

/**
 * Page pixels a cropped phone must still show.
 *
 * The fold sits at 1240 page pixels, so a crop that stopped short of it would
 * have nothing to mark. 1400 clears the fold with a little page under it, which
 * is what makes the rule read as a line across a page rather than as the bottom
 * edge of one.
 */
export const VISIBLE_PAGE = 1400;

export type PhoneGeometry = {
  bezel: number;
  radius: number;
  /** The screen's full size, before the frame crops it. */
  screenWidth: number;
  screenHeight: number;
  /** The device as it is drawn: cropped at the bottom when it has to be. */
  frameWidth: number;
  frameHeight: number;
  /** Canvas pixels per page pixel, for anything drawn against the page. */
  pageScale: number;
};

export type PhoneGeometryOptions = {
  box: DemoBox;
  /** Width the phone may take. The whole box, or one column of a row. */
  columnWidth: number;
  /** Height it may take. The whole box unless something sits under it. */
  maxHeight?: number;
  /** Page pixels the crop must reach. PAGE_HEIGHT shows the whole page. */
  visiblePage?: number;
  pageWidth?: number;
  pageHeight?: number;
  /** Bezel authored at 1080 canvas width. */
  bezelAt1080?: number;
};

/**
 * Solves the phone against its column: as wide as it can be, and no wider than
 * the width at which the crop still reaches `visiblePage`.
 */
export function phoneGeometry(options: PhoneGeometryOptions): PhoneGeometry {
  const {
    box,
    columnWidth,
    maxHeight,
    visiblePage = VISIBLE_PAGE,
    pageWidth = PAGE_WIDTH,
    pageHeight = PAGE_HEIGHT,
    bezelAt1080 = 18,
  } = options;

  const bezel = Math.max(4, Math.round(bezelAt1080 * box.scale));
  const height = maxHeight ?? box.height;

  const byWidth = columnWidth - bezel * 2;
  // Only the top bezel is inside the crop; the bottom one is below it whenever
  // the phone runs off the frame.
  const byPage = Math.round(((height - bezel) * pageWidth) / visiblePage);
  const screenWidth = Math.max(1, Math.min(byWidth, byPage));
  const screenHeight = Math.round((screenWidth * pageHeight) / pageWidth);

  return {
    bezel,
    // A phone's corner is about seven and a half percent of its width, and
    // scaling the radius with the device rather than with the canvas is what
    // keeps three small phones in a row from looking like three round cards.
    radius: Math.max(8, Math.round(screenWidth * 0.075)),
    screenWidth,
    screenHeight,
    frameWidth: screenWidth + bezel * 2,
    frameHeight: Math.min(screenHeight + bezel * 2, height),
    pageScale: screenWidth / pageWidth,
  };
}

/**
 * Width the phone column takes in the landscape crop.
 *
 * Landscape gives demoBox about five hundred pixels of height against sixteen
 * hundred of width, so a phone that fits the height leaves a third of the frame
 * empty. The showcase reels answer the same shape with formatMetrics().showcase
 * === "split": device on the left, copy in a panel beside it. This tutorial
 * does the same, and the fraction is small because the phone is height bound
 * anyway and the panel is where the words are read.
 */
export const SPLIT_PHONE_FRACTION = 0.22;

/** Gutter between the phone and the panel in the landscape crop. */
export const SPLIT_GUTTER = 64;
