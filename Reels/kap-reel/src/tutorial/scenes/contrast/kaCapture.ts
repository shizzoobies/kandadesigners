// The K&A home page shot the 45 second cut's "real" beat is built on.
//
// The spec asks for "the K&A home page desktop capture". There is no such entry
// in assets/captures/captures.json: scripts/capture.ts indexes the cleared
// client sites from config/projects.json, and the owner's own site is not one of
// them. What that script does have is --self-test, which captures
// ka-performancefl.com into assets/captures/selftest/ and, by design, "does not
// touch captures.json". It was run on 2026-09-03 and the artifact is on disk.
//
// So this resolves the shot in that order: the indexed capture if it ever
// exists, and the self-test artifact otherwise. The self-test path is the one
// hardcoded file path in this tutorial, and it is hardcoded because there is no
// index to look it up in; adding a hand written row to captures.json would put a
// permanent entry in a file every capture run regenerates.
//
// It is the owner's own site rather than a client's, which matters twice. The
// non-negotiables forbid attributing a weak example to a real client, and this
// beat re-sets a block of the page in amber to show it failing. And
// scripts/deliver.ts reads this tutorial's content file for capture ids to check
// against config/projects.json; there is no client id to check, and its note
// that "the contrast tutorial shows no client site at all" stays true.

import { staticFile } from "remotion";
import { captureSrc, findCapture } from "../../../lib/captures";
import type { ZoomRegion } from "../../../reels/types";

/** The id an indexed K&A home capture would take, if one is ever recorded. */
export const KA_HOME_CAPTURE_ID = "ka-performance-home-desktop";

/** What scripts/capture.ts --self-test writes. Both viewports, 30fps, 6 seconds. */
const SELF_TEST_PATH = "assets/captures/selftest/selftest-home-desktop.mp4";
const SELF_TEST_WIDTH = 2880;
const SELF_TEST_HEIGHT = 1800;

export type KaHomeShot = {
  src: string;
  width: number;
  height: number;
  /** True when it came from captures.json rather than the self-test folder. */
  indexed: boolean;
};

export function kaHomeDesktop(): KaHomeShot {
  const indexed = findCapture(KA_HOME_CAPTURE_ID);
  if (indexed) {
    return {
      src: captureSrc(indexed),
      width: indexed.width,
      height: indexed.height,
      indexed: true,
    };
  }
  return {
    src: staticFile(SELF_TEST_PATH.replace(/^assets\//, "")),
    width: SELF_TEST_WIDTH,
    height: SELF_TEST_HEIGHT,
    indexed: false,
  };
}

/**
 * The region of the capture the beat pushes into: the hero's text block.
 *
 * 16:10, matching the laptop screen, so ZoomShot's cover throws nothing away. It
 * holds the second half of the headline in rust, the paragraph in ink, and the
 * amber call to action, which is the whole argument of the tutorial standing
 * there on the owner's own page: amber on a button, dark words on the page.
 */
export const KA_HERO_TEXT_BLOCK: ZoomRegion = {
  x: 120,
  y: 835,
  w: 1440,
  h: 900,
};

/**
 * Nearly a still.
 *
 * The capture is a six second scroll: scripts/capture.ts settles for 800ms and
 * then drives the page down more than two viewports, so the hero is gone by the
 * end of the first second and the client work grid is on screen by the third.
 * This beat runs 325 frames and is about one text block, so the clip is played
 * at a twentieth of speed, which spends sixteen source frames over the whole
 * beat and never leaves the settle. The movement in the shot is ZoomShot's push
 * in, which is what the spec asks for anyway.
 */
export const KA_PLAYBACK_RATE = 0.05;

/**
 * The line from that block, re-set in amber in the card beside the laptop.
 *
 * Shortened from the page's own paragraph so it fits a card at a third of the
 * frame. On screen the ampersand is right; only the narration says "K and A".
 */
export const KA_RESET_LINE = "Websites for businesses that refuse to blend in.";
