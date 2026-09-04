// The web design showcase reel: the content that used to live inside
// src/Reel.tsx and the scene components, lifted out unchanged on 2026-09-04.
//
// Every string, id and number below was moved verbatim, and the compositions
// ReelVertical, ReelFeed, ReelSquare, ReelLandscape, ReelLinkedIn and
// ReelLinkedInLandscape render byte for byte what they rendered before the
// lift. If you are editing this file to change the reel, that is fine. If you
// are editing it while refactoring, it is not.

import { PROJECT_ACCENTS } from "../lib/brand";
import { numberWord, perfectAccessibilityCount } from "../lib/metrics";
import { LINKEDIN_CLEAN_CAPTURE, SHORT_CLEAN_CAPTURE } from "../lib/timing";
import type { FeaturedBeat, ReelContent, TourCut } from "./types";

/** The project beats both cuts draw from. Neither cut uses all of them. */
const FORE_MOTION_GOLF: FeaturedBeat = {
  projectId: "fore-motion-golf",
  name: "Fore Motion Golf",
  plateId: "plate-laptop-shoulder",
  cleanFrame: "phone",
  claim: "AI caddie built in",
};

const PROJECT_MAKEOVER: FeaturedBeat = {
  projectId: "project-makeover",
  name: "Project Makeover",
  plateId: "plate-phone-hands",
  cleanFrame: "phone",
  claim: "Accessibility score 100",
};

const SOUTHERN_LEGACY: FeaturedBeat = {
  // Owner decision 2026-09-03: the claim shortens to "No page builder."
  // "Custom code." was doing the hook line's job a second time.
  projectId: "southern-legacy-contractors",
  name: "Southern Legacy Contractors",
  plateId: "plate-ipad-lap",
  cleanFrame: "phone",
  claim: "No page builder.",
};

const MBS_MEDICINE: FeaturedBeat = {
  projectId: "mbs-medicine",
  name: "MBS Medicine",
  plateId: "plate-desktop-wide",
  plateCaptureId: "mbs-medicine-home-desktop",
  cleanFrame: "phone",
  claim: "Booking built in",
};

/**
 * The projects featured in the 15 second cut, in order, with the plate that
 * fills each one's first shot. Ids must exist in config/projects.json with
 * cleared_for_public_showcase true.
 *
 * Owner decision 2026-09-03: two, not three. See the re-pace note at the top of
 * src/lib/timing.ts. Southern Legacy Contractors keeps its site on screen as
 * the third surfaces tour cut, so no cleared project drops out of the cut
 * entirely, and nothing changes for it in the 45 second cut below.
 */
const FEATURED: FeaturedBeat[] = [FORE_MOTION_GOLF, PROJECT_MAKEOVER];

/**
 * The four projects in the 45 second cut, unchanged by the 15 second re-pace.
 * The first three are the ones the master used to carry, plus a context line
 * each. MBS Medicine is the fourth, which the 15 second cut has never had room
 * for: it takes plate-desktop-wide, whose screen carries the MBS desktop
 * scroll, and cuts to the MBS mobile capture.
 *
 * Every context line says what the business needed before the site existed,
 * which is the question a LinkedIn viewer is actually asking. None of them
 * claims a result, so none of them needs a measurement behind it.
 */
const FEATURED_LINKEDIN: FeaturedBeat[] = [
  {
    ...FORE_MOTION_GOLF,
    contextLine: "Needed a waitlist before the doors opened.",
  },
  {
    ...PROJECT_MAKEOVER,
    contextLine: "Needed donations and a gallery that grows.",
  },
  {
    ...SOUTHERN_LEGACY,
    contextLine: "Needed quotes from a phone on a job site.",
  },
  {
    ...MBS_MEDICINE,
    contextLine: "Needed same-week booking and a patient portal.",
  },
];

/**
 * Frames 318 to 372. Three cuts of 18 frames, one cleared site each, each on a
 * different device held by a different person. Owner decision 2026-09-03,
 * replacing the capability montage: the point is that one studio ships across
 * these surfaces, not that a list of features exists.
 *
 * Re-paced 2026-09-03 with the rest of the 15 second cut, from four cuts of 15
 * to three of 18. The Memberships and "Booking a call" cuts came out, and the
 * third slot now carries Southern Legacy Contractors, which left the featured
 * list in this cut: "No page builder" is the claim that beat was making, and
 * putting it here keeps that site and that argument on screen.
 */
const SHORT_CUTS: TourCut[] = [
  {
    captureId: "mbs-medicine-home-desktop",
    plateId: "plate-desktop-wide",
    word: "Booking",
    captureFrameOffset: 24,
    driftSeed: "surfaces-booking",
  },
  {
    captureId: "onlynails-dashboard-sitephotos-clean",
    plateId: "plate-handoff",
    word: "Yours to edit",
    captureFrameOffset: 42,
    driftSeed: "surfaces-yours-to-edit",
  },
  {
    // plate-tablet-b is bound to the PB&J capture in config/plates.json. The
    // captureId here overrides that binding, which is what the field is for.
    captureId: "southern-legacy-contractors-home-desktop",
    plateId: "plate-tablet-b",
    word: "No page builder",
    captureFrameOffset: 60,
    driftSeed: "surfaces-no-page-builder",
  },
];

/**
 * Frames 996 to 1076 of the LinkedIn cut. Four cuts of 20 frames.
 *
 * MBS Medicine is a full project beat in this cut, so its "Booking" tour cut
 * would be the second time in forty seconds that the same site made the same
 * point. Synovial Marketing takes the slot instead, which also puts a fourth
 * cleared site on screen rather than repeating one.
 *
 * The fourth cut reuses plate-phone-hands, which project 2 also uses in this
 * cut. It carries a different site and a different drift seed, and it is 24
 * seconds later on the timeline, so the two do not read as the same shot.
 */
const LINKEDIN_CUTS: TourCut[] = [
  {
    captureId: "onlynails-dashboard-sitephotos-clean",
    plateId: "plate-handoff",
    word: "Yours to edit",
    captureFrameOffset: 42,
    driftSeed: "linkedin-yours-to-edit",
  },
  {
    captureId: "ellenton-family-practice-home-mobile",
    plateId: "plate-phone-hands-b",
    word: "Memberships",
    captureFrameOffset: 60,
    driftSeed: "linkedin-memberships",
  },
  {
    captureId: "pbj-strategic-accounting-home-desktop",
    plateId: "plate-tablet-b",
    word: "Booking a call",
    captureFrameOffset: 78,
    driftSeed: "linkedin-booking-a-call",
  },
  {
    captureId: "synovial-marketing-home-mobile",
    plateId: "plate-phone-hands",
    word: "Discovery calls",
    captureFrameOffset: 96,
    driftSeed: "linkedin-discovery-calls",
  },
];

/**
 * Below this many perfect scores the middle accessibility line does not go on
 * screen at all. Two sites is not a pattern and Section 0 forbids dressing one
 * up as one.
 */
const MIN_PERFECT_SCORES = 3;

/**
 * Section 14 item 2: every on-screen number traces to config/metrics.json. The
 * count of perfect accessibility scores is derived from the measured Lighthouse
 * results at build time, never typed as a literal, so a re-measure that drops a
 * site below 100 changes this line rather than leaving a stale claim in the
 * video. Below MIN_PERFECT_SCORES the slot is an empty string and the beat
 * renders nothing in it.
 */
function accessibilityLines(): string[] {
  const perfect = perfectAccessibilityCount();
  return [
    "Built to WCAG 2.2 AA.",
    perfect >= MIN_PERFECT_SCORES
      ? `${numberWord(perfect)} of these sites score 100 on accessibility.`
      : "",
    "Measured, not promised.",
  ];
}

export const WEB_REEL: ReelContent = {
  id: "web",
  hook: {
    /**
     * Picked from the Section 7 copy bank and confirmed by the owner on
     * 2026-09-03. Five words across two halves, both slammed on frame 0.
     */
    lines: ["Custom built.", "Not a template."],
    shot: {
      kind: "projectHome",
      projectId: "fore-motion-golf",
      /**
       * The capture scroll is eased in and out across 180 frames, so source
       * frame 0 is stationary and Section 6 demands the first frame already be
       * moving. Frame 54 is about 30 percent in, where the ease already carries
       * real velocity.
       */
      trimBefore: 54,
      playbackRate: 2,
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
  cleanCapture: {
    short: SHORT_CLEAN_CAPTURE,
    linkedin: LINKEDIN_CLEAN_CAPTURE,
  },
  howWeWorkLines: ["A real person.", "A direct number.", "No ticket queue."],
  accessibilityLines: accessibilityLines(),
  ctaClosingLine: {
    short: undefined,
    linkedin: "Taking new projects.",
  },
  accents: PROJECT_ACCENTS,
};
