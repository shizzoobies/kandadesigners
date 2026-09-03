import { AbsoluteFill, Sequence } from "remotion";
import { SafeZoneOverlay } from "./components/SafeZoneOverlay";
import { AccessibilityBeat } from "./scenes/AccessibilityBeat";
import { CallToAction } from "./scenes/CallToAction";
import { Hook } from "./scenes/Hook";
import { HowWeWork } from "./scenes/HowWeWork";
import { ProjectShowcase, WHIP_FRAMES } from "./scenes/ProjectShowcase";
import { SurfacesTour } from "./scenes/SurfacesTour";
import { COLORS, projectAccent } from "./lib/brand";
import { type FormatKey } from "./lib/layout";
import {
  LINKEDIN_BEATS,
  LINKEDIN_CLEAN_CAPTURE,
  LINKEDIN_PROJECT_BEAT_SHOTS,
  SHORT_BEATS,
  SHORT_CLEAN_CAPTURE,
} from "./lib/timing";

/**
 * Which cut this scene tree is rendering.
 *
 * "short" is the 15 second vertical master from Section 6. "linkedin" is the
 * 45 second cut from the "Timeline: LinkedIn cut" subsection: the same
 * composition and the same scene components, with the duration extended, two
 * extra beats inserted, and every project beat opened up to seven seconds with
 * a line of context on what the business needed.
 *
 * Section 6 is explicit that the two cuts are separate compositions sharing
 * scene components, not a fork, so everything below branches on this prop and
 * nothing below is duplicated per cut.
 */
export type ReelCut = "short" | "linkedin";

export type ReelProps = {
  /**
   * Which crop this scene tree is rendering. All twelve registered compositions
   * share this tree; every scene lays itself out from safeArea(format) and
   * formatMetrics(format) rather than from fixed pixel positions.
   */
  format?: FormatKey;
  /**
   * Draws the reserved platform zones and the safe area on top of everything.
   * On for the Debug compositions only. Never on in a delivered render.
   */
  debugSafeZones?: boolean;
  cut?: ReelCut;
};

type FeaturedProject = {
  projectId: string;
  displayName: string;
  plateId: string;
  claim: string;
  /** Named explicitly where the spec names it, rather than left to plates.json. */
  plateCaptureId?: string;
  /** One line on what the business needed. LinkedIn cut only. */
  contextLine?: string;
};

/** The project beats both cuts draw from. Neither cut uses all of them. */
const FORE_MOTION_GOLF: FeaturedProject = {
  projectId: "fore-motion-golf",
  displayName: "Fore Motion Golf",
  plateId: "plate-laptop-shoulder",
  claim: "AI caddie built in",
};

const PROJECT_MAKEOVER: FeaturedProject = {
  projectId: "project-makeover",
  displayName: "Project Makeover",
  plateId: "plate-phone-hands",
  claim: "Accessibility score 100",
};

const SOUTHERN_LEGACY: FeaturedProject = {
  // Owner decision 2026-09-03: the claim shortens to "No page builder."
  // "Custom code." was doing the hook line's job a second time.
  projectId: "southern-legacy-contractors",
  displayName: "Southern Legacy Contractors",
  plateId: "plate-ipad-lap",
  claim: "No page builder.",
};

const MBS_MEDICINE: FeaturedProject = {
  projectId: "mbs-medicine",
  displayName: "MBS Medicine",
  plateId: "plate-desktop-wide",
  plateCaptureId: "mbs-medicine-home-desktop",
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
const FEATURED: FeaturedProject[] = [FORE_MOTION_GOLF, PROJECT_MAKEOVER];

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
const FEATURED_LINKEDIN: FeaturedProject[] = [
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

/** Length of a LinkedIn project beat, in frames. Seven seconds at 30fps. */
const LINKEDIN_BEAT_FRAMES =
  LINKEDIN_PROJECT_BEAT_SHOTS.cleanCapture.end -
  LINKEDIN_PROJECT_BEAT_SHOTS.plate.start;

export const Reel: React.FC<ReelProps> = ({
  format = "vertical",
  debugSafeZones = false,
  cut = "short",
}) => {
  const linkedin = cut === "linkedin";
  const beats = linkedin ? LINKEDIN_BEATS : SHORT_BEATS;
  const featured = linkedin ? FEATURED_LINKEDIN : FEATURED;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <Sequence
        from={beats.hook.start}
        durationInFrames={beats.hook.end - beats.hook.start}
        name="Hook"
        layout="none"
      >
        <Hook format={format} />
      </Sequence>

      {/* LinkedIn only: four seconds on how the studio works, before any work
          is shown. Hard cut in and hard cut out, no whip: it is a different
          register from the project beats and a transition would blur that. */}
      {beats.howWeWork ? (
        <Sequence
          from={beats.howWeWork.start}
          durationInFrames={beats.howWeWork.end - beats.howWeWork.start}
          name="How we work"
          layout="none"
        >
          <HowWeWork format={format} />
        </Sequence>
      ) : null}

      {featured.map((project, i) => {
        const beat = beats.projects[i];
        // Every beat but the last runs six frames long so the incoming beat can
        // whip across it. Later siblings paint on top, so the outgoing beat
        // slides out underneath the one arriving.
        const whipOut = i < featured.length - 1;
        return (
          <Sequence
            key={project.projectId}
            from={beat.start}
            durationInFrames={beat.end - beat.start + (whipOut ? WHIP_FRAMES : 0)}
            name={project.displayName}
            layout="none"
          >
            <ProjectShowcase
              format={format}
              projectId={project.projectId}
              displayName={project.displayName}
              plateId={project.plateId}
              plateCaptureId={project.plateCaptureId}
              claim={project.claim}
              contextLine={project.contextLine}
              accent={projectAccent(i)}
              whipIn={i > 0}
              whipOut={whipOut}
              durationInFrames={linkedin ? LINKEDIN_BEAT_FRAMES : undefined}
              cleanTrimBefore={
                (linkedin ? LINKEDIN_CLEAN_CAPTURE : SHORT_CLEAN_CAPTURE)
                  .trimBefore
              }
              scrollPlaybackRate={
                (linkedin ? LINKEDIN_CLEAN_CAPTURE : SHORT_CLEAN_CAPTURE)
                  .scrollPlaybackRate
              }
            />
          </Sequence>
        );
      })}

      <Sequence
        from={beats.surfacesTour.start}
        durationInFrames={beats.surfacesTour.end - beats.surfacesTour.start}
        name="Surfaces tour"
        layout="none"
      >
        <SurfacesTour format={format} cut={cut} />
      </Sequence>

      {/* LinkedIn only: five seconds on the dark teal band, before the CTA. */}
      {beats.accessibility ? (
        <Sequence
          from={beats.accessibility.start}
          durationInFrames={
            beats.accessibility.end - beats.accessibility.start
          }
          name="Accessibility"
          layout="none"
        >
          <AccessibilityBeat format={format} />
        </Sequence>
      ) : null}

      <Sequence
        from={beats.callToAction.start}
        durationInFrames={beats.callToAction.end - beats.callToAction.start}
        name="Call to action"
        layout="none"
      >
        <CallToAction
          format={format}
          closingLine={linkedin ? "Taking new projects." : undefined}
        />
      </Sequence>

      {debugSafeZones ? <SafeZoneOverlay format={format} /> : null}
    </AbsoluteFill>
  );
};
