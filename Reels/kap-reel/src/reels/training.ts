// The training content reel: the second configuration of the same scene tree.
//
// Everything here is bound by the four hard limits at the top of the live
// site's src/data/training.js, which the owner carried into this reel in the
// 2026-09-04 decisions in config/projects.json:
//
//   1. No pricing. No rate, fee, range or "starting at" anywhere on screen.
//   2. No throughput counts. The claim is "never the bottleneck", not a number
//      of courses per week or per month.
//   3. No bench or SME names. Their marketing-use election is not filled in.
//   4. The roughly sixty combined years figure is unconfirmed and never shown.
//
// Nothing below carries a number at all except "WCAG 2.1 AA" and the phone
// number on the CTA card, which comes from config/brand.json. The three
// samples are K&A originals rather than client work, and that disclosure lives
// in the post copy (out/post-copy-training.md), not on screen.
//
// STAND-INS: the captures and plates named below are produced by two other
// agents and arrived while this file was being written. Until a capture id is
// in assets/captures/captures.json and a plate id is in config/plates.json, the
// shot renders a labelled grey stand-in instead, and filling in the real file
// is the only change this file needs. As of the last render every id below had
// landed and nothing renders a stand-in. See the README section "Training reel
// stand-ins" for what happens when one has not.

import { PROJECT_ACCENTS } from "../lib/brand";
import type { FeaturedBeat, ReelContent, TourCut, ZoomRegion } from "./types";

/**
 * Zoom regions, in the capture's own pixels.
 *
 * The interaction captures are recorded at the same 1440x900 at 2x that
 * scripts/capture.ts uses for a desktop clip, so the coordinate space is
 * 2880x1800, confirmed with ffprobe against the clips themselves.
 *
 * Every region below was measured off the clip itself: pull a frame out of the
 * capture, read the interaction's bounding box off it, and write the numbers
 * here. If a clip is ever re-recorded at a different scroll position, this is
 * the only place that has to change.
 */

/**
 * Measured off training-safety-hazard-hunt-desktop. The illustration, the part
 * of the screen the learner clicks, sits at 435,546 to 1485,1134 in capture
 * pixels. Rounded to a 16:9 rectangle around it, which is close enough to a
 * browser window's own shape that the window does not read as letterboxed, and
 * at a browser width of about 970 canvas pixels it renders at very nearly one
 * to one, so nothing is softened.
 */
const ZOOM_SAFETY_HAZARD_HUNT: ZoomRegion = { x: 435, y: 540, w: 1055, h: 600 };

/**
 * Measured, and sized for a full bleed 9:16 frame rather than for a window.
 *
 * The hook has no device frame around it, so its region is cover cropped to
 * whatever canvas is rendering, and a 9:16 canvas keeps only the middle 1080 of
 * whatever width the region has. A tight box on the illustration would
 * therefore show a narrow vertical slice of it at three times scale. This
 * rectangle is wide and tall enough to survive that crop: the vertical crop
 * lands on capture x 538 to 1382, which is most of the illustration at 1.28x,
 * and the wider crops keep the list beside it as well.
 */
const ZOOM_HOOK_HAZARD_HUNT: ZoomRegion = { x: 110, y: 150, w: 1700, h: 1500 };

/**
 * Measured off training-safety-stop-or-go-desktop. The decision sits in a band
 * across the top of the content card: the call counter, the prompt sentence,
 * the STOP and GO buttons, and the feedback under them, from 430 down to about
 * 1330. Everything below that is empty card.
 *
 * The prompt and the feedback run the full width of the card, so the region
 * cannot be narrowed without cutting words in half, and the magnification is
 * therefore only about a third. What the crop buys is the dead lower half of
 * the screen: the same shot at full frame spends half its height on nothing.
 */
const ZOOM_SAFETY_STOP_OR_GO: ZoomRegion = { x: 370, y: 430, w: 2170, h: 1050 };

/**
 * Measured off training-safety-hero-to-zones-desktop. Same shape of crop and
 * for the same reason: the header, the two zone tabs, the intro sentence and
 * the four zone cards all sit above 1150, and the rest of the screen is empty.
 * Section 6b's readable shot is the one that has to earn its 116 frames, and a
 * third more type is the difference between reading it on a phone and not.
 */
const ZOOM_SAFETY_HERO_TO_ZONES: ZoomRegion = { x: 345, y: 150, w: 2190, h: 1000 };

/**
 * Measured off training-finance-pnl-simulator-desktop. The "Move the levers"
 * band: the four sliders on the left, the statement in the middle, and the
 * gross margin and operating income figures on the right, from 330 down to
 * about 1140. Below that the folio is ruled paper and nothing else.
 *
 * The beat's context line is "Move a slider. Watch the margin move.", so the
 * crop has to hold the sliders and the margin in the same frame. That fixes
 * the width at the full content column and the magnification at about a third,
 * the same trade the safety crops make.
 */
const ZOOM_FINANCE_SLIDERS: ZoomRegion = { x: 375, y: 330, w: 2130, h: 810 };

/**
 * The 15 second cut's two project beats, both on the safety module.
 *
 * The safety sample leads on the owner's 2026-09-04 decision, and fifteen
 * seconds is two beats, so both of them are it: the walk-through first, then
 * the interactions inside it. Finance and the RFI microlearning carry the
 * surfaces tour, which is where the "we do more than one subject" argument
 * belongs in a cut this short.
 *
 * Both names run to two lines at 1080 width, so nameLines is 2 and the lower
 * third is sized for the band it will actually draw.
 */
const FEATURED: FeaturedBeat[] = [
  {
    projectId: "training-safety",
    plateId: "t-laptop-shoulder",
    plateCaptureId: "training-safety-hero-to-zones-desktop",
    cleanCaptureId: "training-safety-hero-to-zones-desktop",
    // A 16:10 module screen in a browser window, cropped to the half of the
    // screen the content is actually on. The spec allows this beat either way;
    // the tabs and the four zone cards do read better pushed in.
    cleanFrame: "browser",
    zoom: ZOOM_SAFETY_HERO_TO_ZONES,
    name: "Spot it before it hurts someone",
    nameLines: 2,
    claim: "Keyboard and screen reader tested",
  },
  {
    projectId: "training-safety",
    // The mobile sorter is the one clip in this reel that shows a training
    // module working at 390 wide, which is the argument the phone plate makes.
    // If training-safety-hierarchy-sorter-mobile never lands, this beat falls
    // back to t-laptop-two with training-safety-hierarchy-sorter-desktop.
    plateId: "t-phone-hands",
    plateCaptureId: "training-safety-hierarchy-sorter-mobile",
    cleanCaptureId: "training-safety-stop-or-go-desktop",
    cleanFrame: "browser",
    zoom: ZOOM_SAFETY_STOP_OR_GO,
    name: "Hazard recognition module",
    nameLines: 2,
    claim: "Built for your LMS",
  },
];

/**
 * The four project beats of the 45 second cut: two on the safety module, one on
 * finance, one on the RFI microlearning. Every context line says what the
 * learner is actually doing, which is the question a training buyer asks, and
 * none of them claims a result, so none of them needs a measurement behind it.
 */
const FEATURED_LINKEDIN: FeaturedBeat[] = [
  {
    projectId: "training-safety",
    plateId: "t-laptop-shoulder",
    plateCaptureId: "training-safety-hero-to-zones-desktop",
    cleanCaptureId: "training-safety-hero-to-zones-desktop",
    cleanFrame: "browser",
    zoom: ZOOM_SAFETY_HERO_TO_ZONES,
    name: "Spot it before it hurts someone",
    nameLines: 2,
    contextLine: "A jobsite walk-through you can tab through.",
    claim: "Keyboard and screen reader tested",
  },
  {
    projectId: "training-safety",
    plateId: "t-phone-hands",
    plateCaptureId: "training-safety-hierarchy-sorter-mobile",
    cleanCaptureId: "training-safety-hazard-hunt-desktop",
    cleanFrame: "browser",
    zoom: ZOOM_SAFETY_HAZARD_HUNT,
    name: "Hazard recognition module",
    nameLines: 2,
    contextLine: "Six hazards. Click them or list them.",
    claim: "Hotspots read aloud as a list",
  },
  {
    projectId: "training-finance",
    plateId: "t-tablet-desk",
    plateCaptureId: "training-finance-pnl-simulator-desktop",
    cleanCaptureId: "training-finance-pnl-simulator-desktop",
    cleanFrame: "browser",
    zoom: ZOOM_FINANCE_SLIDERS,
    name: "The P&L, read like an owner",
    nameLines: 2,
    contextLine: "Move a slider. Watch the margin move.",
    claim: "Built for non-finance managers",
  },
  {
    projectId: "training-rfi",
    plateId: "t-desktop-wide",
    plateCaptureId: "training-rfi-scenario-branch-desktop",
    cleanCaptureId: "training-rfi-scenario-branch-desktop",
    cleanFrame: "browser",
    name: "The RFI that gets answered",
    nameLines: 2,
    contextLine: "A six minute microlearning for the trades.",
    claim: "Scores the decision, not the recall",
  },
];

/**
 * Three cuts of 18 frames. The two samples the featured beats had no room for,
 * then the delivery format, which is the question every LMS owner asks second.
 *
 * The captures are interaction recordings rather than the 180 frame scripted
 * scroll the web reel uses, so every offset is 0: there is no eased ramp to
 * start inside, and starting late would cut into an interaction that is only a
 * few seconds long. The drift seeds still differ, so three hard cuts do not
 * share one camera wobble.
 */
const SHORT_CUTS: TourCut[] = [
  {
    captureId: "training-finance-pnl-simulator-desktop",
    plateId: "t-tablet-desk",
    word: "Finance",
    captureFrameOffset: 0,
    driftSeed: "training-surfaces-finance",
  },
  {
    captureId: "training-rfi-scenario-branch-desktop",
    plateId: "t-desktop-wide",
    word: "Microlearning",
    captureFrameOffset: 0,
    driftSeed: "training-surfaces-microlearning",
  },
  {
    captureId: "training-safety-walkthrough-card-desktop",
    plateId: "t-laptop-two",
    word: "SCORM and xAPI",
    captureFrameOffset: 0,
    driftSeed: "training-surfaces-scorm-xapi",
  },
];

/**
 * Four cuts of 20 frames. Every plate here is one the four project beats did
 * not use, except t-desktop-wide on the last cut, which is 30 seconds after the
 * RFI beat used it and carries a different sample.
 *
 * "Your LMS, not ours" is the closing argument of the tour: K&A never hosts the
 * content and never sees the learner data, which is in the post copy at length
 * and gets four words here.
 */
const LINKEDIN_CUTS: TourCut[] = [
  {
    captureId: "training-finance-waterfall-desktop",
    plateId: "t-laptop-cafe-free",
    word: "Finance",
    captureFrameOffset: 0,
    driftSeed: "training-linkedin-finance",
  },
  {
    // The mobile RFI hero if it landed, the desktop one if it did not.
    captureId: "training-rfi-hero-mobile",
    plateId: "t-phone-hands-b",
    word: "Microlearning",
    captureFrameOffset: 0,
    driftSeed: "training-linkedin-microlearning",
  },
  {
    captureId: "training-safety-walkthrough-card-desktop",
    plateId: "t-laptop-two",
    word: "SCORM and xAPI",
    captureFrameOffset: 0,
    driftSeed: "training-linkedin-scorm-xapi",
  },
  {
    captureId: "training-safety-stop-or-go-desktop",
    plateId: "t-desktop-wide",
    word: "Your LMS, not ours",
    captureFrameOffset: 0,
    driftSeed: "training-linkedin-your-lms",
  },
];

export const TRAINING_REEL: ReelContent = {
  id: "training",
  hook: {
    /**
     * Owner decision 2026-09-04. It is the engagement model in five words: one
     * designer for a module, a whole bench for a curriculum, no hiring either
     * way. It states no count and no price, so it clears limits 1 and 2.
     */
    lines: ["One designer.", "Or a whole team."],
    shot: {
      kind: "capture",
      captureId: "training-safety-hazard-hunt-desktop",
      // An interaction recording, not the eased 180 frame scroll the web reel
      // hooks on, so it plays from its first frame at speed: the clip is
      // already moving because a person is clicking in it.
      trimBefore: 0,
      playbackRate: 1,
      zoom: ZOOM_HOOK_HAZARD_HUNT,
    },
  },
  featured: {
    short: FEATURED,
    linkedin: FEATURED_LINKEDIN,
  },
  tour: {
    short: SHORT_CUTS,
    linkedin: LINKEDIN_CUTS,
  },
  /**
   * Interaction captures play from their first frame: there is no eased ramp to
   * start inside, and the clip is already moving because a person is clicking
   * in it.
   *
   * The 15 second cut plays them at native speed. Its clean shot is 116 frames
   * and the shortest clip behind one is 150, so nothing runs out.
   *
   * The 45 second cut cannot. Its clean shot is 186 frames and the interaction
   * clips run 120 to 180, so at rate 1 every one of them would reach its last
   * frame and freeze there for the rest of the beat. Rate 0.8 consumes 148.8
   * source frames, which fits inside the shortest clip a project beat uses
   * (training-rfi-scenario-branch-desktop, 150 frames) with a frame to spare.
   * The cost is the same one the web reel pays at 0.8: the source index
   * advances on four output frames in five, so the motion steps at about 24Hz
   * rather than 30, and it reads as what it is, a screen recording.
   */
  cleanCapture: {
    short: { trimBefore: 0, scrollPlaybackRate: 1 },
    linkedin: { trimBefore: 0, scrollPlaybackRate: 0.8 },
  },
  /**
   * Owner decision 2026-09-04. The first two lines are the two shapes of the
   * engagement, by shape and never by headcount or price, and the third is the
   * promise the whole service line is built on. No count anywhere.
   */
  howWeWorkLines: [
    "One designer for a module.",
    "A full bench for a curriculum.",
    "Never the bottleneck.",
  ],
  /**
   * No numbers, per the spec, so unlike the web reel this beat derives nothing
   * from config/metrics.json. "WCAG 2.1 AA" is the standard the samples are
   * built to, per the proof points in config/projects.json, and it is a name
   * rather than a measurement. The web reel says 2.2 AA because the client
   * sites were measured against 2.2; the training samples were written to 2.1,
   * so this reel says 2.1 and the two are both correct.
   */
  accessibilityLines: [
    "Built to WCAG 2.1 AA.",
    "Tested with a keyboard and a screen reader.",
    "In your LMS, not a preview.",
  ],
  ctaClosingLine: {
    short: "Never the bottleneck.",
    linkedin: "Taking new projects.",
  },
  accents: PROJECT_ACCENTS,
};
