import { AbsoluteFill, Sequence } from "remotion";
import { SafeZoneOverlay } from "./components/SafeZoneOverlay";
import { AccessibilityBeat } from "./scenes/AccessibilityBeat";
import { CallToAction } from "./scenes/CallToAction";
import { Hook } from "./scenes/Hook";
import { HowWeWork } from "./scenes/HowWeWork";
import { ProjectShowcase, WHIP_FRAMES } from "./scenes/ProjectShowcase";
import { SurfacesTour } from "./scenes/SurfacesTour";
import { COLORS } from "./lib/brand";
import { type FormatKey } from "./lib/layout";
import { LINKEDIN_BEATS, LINKEDIN_PROJECT_BEAT_SHOTS, SHORT_BEATS } from "./lib/timing";
import { contentAccent, type ReelContent, type ReelCut } from "./reels/types";
import { WEB_REEL } from "./reels/web";

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
export type { ReelCut };

export type ReelProps = {
  /**
   * Which crop this scene tree is rendering. All the registered compositions
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
  /**
   * Which reel's content this tree is rendering: the web design showcase or the
   * training content line. Added 2026-09-04, when the second reel arrived. The
   * same argument Section 6 makes about the two cuts applies to the two reels:
   * one scene tree, two content configs, never a fork. Everything that differs
   * between them lives in src/reels; everything that does not is here and in
   * src/scenes.
   */
  content?: ReelContent;
};

/** Length of a LinkedIn project beat, in frames. Seven seconds at 30fps. */
const LINKEDIN_BEAT_FRAMES =
  LINKEDIN_PROJECT_BEAT_SHOTS.cleanCapture.end -
  LINKEDIN_PROJECT_BEAT_SHOTS.plate.start;

export const Reel: React.FC<ReelProps> = ({
  format = "vertical",
  debugSafeZones = false,
  cut = "short",
  content = WEB_REEL,
}) => {
  const linkedin = cut === "linkedin";
  const beats = linkedin ? LINKEDIN_BEATS : SHORT_BEATS;
  const featured = content.featured[cut];
  const cleanCapture = content.cleanCapture[cut];

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <Sequence
        from={beats.hook.start}
        durationInFrames={beats.hook.end - beats.hook.start}
        name="Hook"
        layout="none"
      >
        <Hook format={format} content={content.hook} />
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
          <HowWeWork format={format} lines={content.howWeWorkLines} />
        </Sequence>
      ) : null}

      {featured.map((project, i) => {
        const beat = beats.projects[i];
        // The cut's playback is the default; a beat overrides it where its own
        // clip needs a different window. See FeaturedBeat.cleanPlayback.
        const playback = project.cleanPlayback ?? cleanCapture;
        // Every beat but the last runs six frames long so the incoming beat can
        // whip across it. Later siblings paint on top, so the outgoing beat
        // slides out underneath the one arriving.
        const whipOut = i < featured.length - 1;
        return (
          <Sequence
            key={`${project.projectId}-${i}`}
            from={beat.start}
            durationInFrames={beat.end - beat.start + (whipOut ? WHIP_FRAMES : 0)}
            name={project.name}
            layout="none"
          >
            <ProjectShowcase
              format={format}
              projectId={project.projectId}
              displayName={project.name}
              plateId={project.plateId}
              plateCaptureId={project.plateCaptureId}
              cleanCaptureId={project.cleanCaptureId}
              cleanFrame={project.cleanFrame}
              zoom={project.zoom}
              nameLines={project.nameLines}
              claim={project.claim}
              contextLine={project.contextLine}
              accent={contentAccent(content, i)}
              whipIn={i > 0}
              whipOut={whipOut}
              durationInFrames={linkedin ? LINKEDIN_BEAT_FRAMES : undefined}
              cleanTrimBefore={playback.trimBefore}
              scrollPlaybackRate={playback.scrollPlaybackRate}
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
        <SurfacesTour
          format={format}
          cut={cut}
          cuts={content.tour[cut]}
          accents={content.accents}
        />
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
          <AccessibilityBeat
            format={format}
            lines={content.accessibilityLines}
          />
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
          closingLine={content.ctaClosingLine[cut]}
        />
      </Sequence>

      {debugSafeZones ? <SafeZoneOverlay format={format} /> : null}
    </AbsoluteFill>
  );
};
