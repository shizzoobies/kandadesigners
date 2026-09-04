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
 * Measured off training-safety-stop-or-go-mobile, 780x1688.
 *
 * The interaction is the bottom two thirds of the phone screen: the call
 * counter at 620, the answered tally, the prompt sentence, the STOP and GO
 * buttons at 1066 to 1170, and the feedback paragraph under them ending at
 * 1324. Everything above 590 is the module header and the standing
 * instructions, which the beat before it already showed, and everything below
 * 1360 is empty card.
 *
 * The region is the full capture width, so no word is ever cut horizontally,
 * and 1040 tall with the interaction centred inside it. The height is what the
 * geometry needs rather than what the content needs: at 780 by 1040 the shot is
 * wider than a 9:16 canvas, so ProjectShowcase gives it the stacked
 * arrangement, the device sits above the lower third instead of under it, and
 * every part of the decision is visible. At the phone's native 780 by 1688 the
 * vertical crop's band would cut the shot at capture row 1039, which is the top
 * edge of the STOP button: the buttons and the whole feedback line would be
 * behind the scrim. That is not a tuning problem, it is arithmetic. The device
 * is centred on the canvas and the band is anchored near the bottom of it, so
 * an overlaid band always covers the lower third of the device, and this clip
 * keeps the thing worth seeing exactly there.
 *
 * The other half of the trade is that at 780 by 1040 the shot renders one to
 * one in the vertical crop, so the module's own body type is the size it is on
 * a real phone rather than two thirds of it.
 */
const ZOOM_SAFETY_STOP_OR_GO_MOBILE: ZoomRegion = {
  x: 0,
  y: 452,
  w: 780,
  h: 1040,
};

/**
 * Measured off training-safety-hero-to-zones-desktop, on source frame 100.
 *
 * The region Section 6b's readable shot has to hold is the tab row at 320, the
 * intro sentence, and the four zone cards, which end at 958. The content column
 * runs 399 to 2483, and neither the page margins outside it nor the empty card
 * below the four zones is worth a pixel of a shot this short.
 *
 * The width is not negotiable and it is what fixes the scale: the two card
 * columns and the sentence above them run the full content column, so cropping
 * narrower cuts words in half. At a browser width of about 967 canvas pixels
 * that is 0.45, which puts the card body type near nine canvas pixels against
 * six and a half for the same shot at full frame. Trimming the dead height is
 * what the crop is really for: without it the window is half empty card and the
 * beat looks like it is showing a page rather than a lesson.
 *
 * Checked against the second tab as well, which the shot cuts to on source
 * frame 60: its content ends at 799, comfortably inside the same box.
 */
const ZOOM_SAFETY_HERO_TO_ZONES: ZoomRegion = { x: 370, y: 295, w: 2145, h: 695 };

/**
 * Measured off training-rfi-scenario-branch-desktop, on source frames 30 and
 * 90, which are the two states the beat shows: option A chosen and marked not
 * quite, then option B chosen and marked correct.
 *
 * The two option cards sit at 439 to 864 and the feedback panel under them runs
 * to 1037 in the longer of the two states. The scenario paragraph above is
 * eleven lines of setup that no viewer is going to read in seven seconds, and
 * the sheet below the feedback is blueprint paper. So the shot is the two
 * options and the verdict, which is the whole argument of the beat: the claim
 * on screen is "scores the decision, not the recall".
 */
const ZOOM_RFI_OPTIONS: ZoomRegion = { x: 420, y: 414, w: 2040, h: 655 };

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
    // A 16:10 module screen in a browser window, cropped to the tab row and the
    // four zone cards. The spec allows this beat either way; the tabs and the
    // cards do read better pushed in.
    cleanFrame: "browser",
    zoom: ZOOM_SAFETY_HERO_TO_ZONES,
    // Source 33 to 100 across 108 output frames, which is rate 0.629.
    //
    // The clip is named for what it does: it opens on the module's hero screen,
    // scrolls to the zones screen over source 20 to 32, then sits on the zones
    // with a tab click on source 60 and another on 100. Measured frame by frame
    // with ffmpeg psnr, those are the only three places anything moves, and
    // after 100 it is a still page.
    //
    // So the shot starts at 33, the frame the scroll lands on. Starting at 0
    // was the first attempt and it put the hero screen behind a zoom region
    // measured on the zones: frame 100 of the cut showed learning objectives
    // through a window cropped for a tab row. The 15 second cut has 3.6 seconds
    // for this beat and cannot spend the first second arriving.
    //
    // Re-solved on 2026-09-04, when the drawn end card took eight frames off
    // every project beat: the clean shot is 108 output frames rather than 116
    // and the rate has to come up to land the last one on source 100 again.
    // 33 + 107 * 0.629 is 100.3 and 33 + 106 * 0.629 is 99.7, so the last two
    // output frames are source 99 and source 100, which is the tab click
    // itself. Rate is solved rather than rounded: anything from 0.627 to 0.632
    // lands that pair, and 0.629 sits in the middle of it, so no rounding in
    // the player can push either frame onto the wrong source frame.
    //
    // The scroll is not lost. The plate shot runs at the same rate and
    // ProjectShowcase backs its capture up by round(24 * 0.629) frames, so the
    // plate plays source 18 to 32 and hands over on the exact frame the scroll
    // finishes. That is Section 6b's "cut on the scroll", and here it is free.
    //
    // The last output frame is source 100, the second tab click. Measured on
    // the zoom region with ffmpeg psnr, source 99 to 100 is 13.3 dB, against
    // 34.4 dB for the still pair before it.
    cleanPlayback: { trimBefore: 33, scrollPlaybackRate: 0.629 },
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
    // The phone, deliberately, so the two safety beats are two surfaces rather
    // than the same browser window twice: a laptop walk-through, then the same
    // course being answered on a phone. Pushed in on the decision itself, see
    // ZOOM_SAFETY_STOP_OR_GO_MOBILE for why the region is shaped the way it is.
    cleanCaptureId: "training-safety-stop-or-go-mobile",
    cleanFrame: "phone",
    zoom: ZOOM_SAFETY_STOP_OR_GO_MOBILE,
    // Rate 1 from source frame 0, unchanged by the 2026-09-04 end card
    // re-time: the shot is 108 output frames rather than 116, so the window
    // simply ends eight frames earlier on source 107 rather than source 115.
    //
    // This clip is answered calls one after another, so the shot is a run of
    // decisions with a beat of reading between each. Measured on the zoom
    // region with ffmpeg psnr across all 107 consecutive pairs of the window,
    // the moving pairs run from 16.8 dB up, and about a third of the window is
    // a viewer reading a prompt, which is a person taking a moment rather than
    // a shot that has stopped. What matters at the cut is the last pair, and
    // source 106 to 107 measures 20.4 dB, well under the 40 dB line. Nothing is
    // stepped either, because at rate 1 the source plays at its own speed, and
    // ZoomShot's three percent push in is running under all of it.
    cleanPlayback: { trimBefore: 0, scrollPlaybackRate: 1 },
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
    // Same window as the 15 second cut, over 186 output frames instead of 116,
    // so the rate has to come down to land the last frame on the same source
    // frame 100. 185 * 0.543 is 100.5. The cost is the one the web reel's
    // LinkedIn cut pays: the source index advances on about one output frame in
    // two, so the two tab switches step rather than cut. On a still page with
    // two clicks in it that is much less visible than it is on a scroll.
    cleanPlayback: { trimBefore: 0, scrollPlaybackRate: 0.543 },
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
    // Four hotspot clicks, on source frames 22, 57, 92 and 132, with the page
    // still between them. 185 * 0.716 is 132.5, so the shot plays all four and
    // its last frame is the fourth, which is also the frame the counter reads
    // six of six and the module opens the next screen. That is the best ending
    // this clip has. Everything past 133 is a finished page.
    cleanPlayback: { trimBefore: 0, scrollPlaybackRate: 0.716 },
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
    // The only training clip with continuous motion in it: four slider drags,
    // over source 27 to 40, 67 to 80, 107 to 120 and 147 to 160, each of them
    // thirteen frames of the statement and the margin figure moving together.
    // 185 * 0.867 is 160.4, so the shot ends inside the fourth drag rather than
    // in the pause after it. Measured 37.6 dB between the last two source
    // frames, which is motion by the Section 6b test with room to spare.
    cleanPlayback: { trimBefore: 0, scrollPlaybackRate: 0.867 },
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
    // Pushed in on the two option cards and the feedback panel. At full frame
    // this beat is a wall of blueprint paper with two paragraphs on it, and the
    // claim underneath says the module scores the decision: the decision is the
    // part that has to be on screen.
    zoom: ZOOM_RFI_OPTIONS,
    // The shortest clip in the reel at 150 frames, and only the first 91 of
    // them carry anything: option A is chosen on source 28, option B on 90, and
    // the rest is the finished sheet. 185 * 0.489 is 90.5, so the last frame is
    // the moment option B is marked correct, which is the beat's own punchline.
    cleanPlayback: { trimBefore: 0, scrollPlaybackRate: 0.489 },
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
    /**
     * The mobile hazard hunt, full bleed, exactly the way the web reel hooks on
     * a mobile capture: no device frame, no push in, the clip cover cropped to
     * whatever canvas is rendering.
     *
     * It replaced the desktop clip pushed in on the illustration, which was the
     * first attempt and did not read. A desktop module screen is a content
     * column inside wide dark margins, and a 9:16 crop of a region of it keeps
     * only the middle: the first still showed half a sentence cut off at both
     * edges and an empty grey rectangle where the picture was. The mobile
     * capture is the same lesson laid out for a 390 wide screen, so the
     * heading, the instructions, the found counter and the whole illustration
     * are stacked inside the crop instead of falling out of the sides of it,
     * and the vertical and feed crops keep almost the entire page. The square
     * crop keeps the counter and the picture, and landscape keeps a band of it
     * either side of the hook band, which is all a 16:9 hook was ever going to
     * show of a phone.
     *
     * An interaction recording, not the eased 180 frame scroll the web reel
     * hooks on, so it plays from its first frame at native speed: the clip is
     * already moving on frame 0 because a person is working in it, which is
     * what Section 6 asks of the first frame. 54 output frames consume source 0
     * to 53 in the 15 second cut and 0 to 35 in the 45 second one. Both stop
     * short of source 57, where the second hazard is found, the first list item
     * wraps to two lines, and the item under it is clipped by the page's own
     * bottom rule on the live build. That clipping is the site's, not the
     * reel's, and the fix is to not be there.
     */
    shot: {
      kind: "capture",
      captureId: "training-safety-hazard-hunt-mobile",
      trimBefore: 0,
      playbackRate: 1,
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
   * The fallback for a beat that does not name its own playback. Every project
   * beat in this reel does, in `cleanPlayback` above, and the reason is worth
   * writing down because it is the one structural difference between the two
   * reels' shots.
   *
   * The web reel's clean shots are all the same thing: a 180 frame
   * easeInOutCubic scroll of a home page. One trim and one rate per cut is
   * correct for all of them, because the motion curve is identical and only the
   * page behind it changes.
   *
   * The training reel's are five different interaction recordings of four
   * different lengths, and each one is a person doing something, pausing, and
   * doing the next thing. Where the motion sits is a property of the clip, not
   * of the cut. Measured frame by frame with ffmpeg psnr, the last frame that
   * moves is source 100 for hero-to-zones, 132 for hazard-hunt, 160 for the
   * P&L simulator, 90 for the RFI branch, and 145 for stop-or-go. A single rate
   * per cut cannot land five different numbers, and a shot that overruns its
   * clip's last movement does not merely look slow: it stops, and the cut lands
   * on a photograph.
   *
   * Interaction captures all play from their first frame, so trimBefore is 0
   * everywhere: there is no eased ramp to start inside, and starting late would
   * cut into an interaction only a few seconds long.
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
