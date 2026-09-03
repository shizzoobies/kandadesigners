import { AbsoluteFill, Sequence } from "remotion";
import { CallToAction } from "./scenes/CallToAction";
import { CapabilityMontage } from "./scenes/CapabilityMontage";
import { Hook } from "./scenes/Hook";
import { ProjectShowcase, WHIP_FRAMES } from "./scenes/ProjectShowcase";
import { COLORS, projectAccent } from "./lib/brand";
import { type FormatKey } from "./lib/layout";
import {
  CALL_TO_ACTION,
  CAPABILITY_MONTAGE,
  HOOK,
  PROJECT_BEATS,
} from "./lib/timing";

export type ReelProps = {
  /**
   * Which crop this scene tree is rendering. Only "vertical" is registered
   * today; feed, square and landscape reuse this same tree in a later phase.
   */
  format?: FormatKey;
};

/**
 * The three projects featured in the 15 second cut, in order, with the plate
 * that will replace each grey rectangle in Phase 4. Ids must exist in
 * config/projects.json with cleared_for_public_showcase true.
 */
const FEATURED = [
  {
    projectId: "fore-motion-golf",
    displayName: "Fore Motion Golf",
    plateId: "plate-laptop-shoulder",
    claim: "AI caddie built in",
  },
  {
    projectId: "project-makeover",
    displayName: "Project Makeover",
    plateId: "plate-phone-hands",
    claim: "Accessibility score 100",
  },
  {
    projectId: "southern-legacy-contractors",
    displayName: "Southern Legacy Contractors",
    plateId: "plate-ipad-lap",
    claim: "Custom code. No page builder.",
  },
];

export const Reel: React.FC<ReelProps> = ({ format = "vertical" }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <Sequence
        from={HOOK.start}
        durationInFrames={HOOK.end - HOOK.start}
        name="Hook"
        layout="none"
      >
        <Hook format={format} />
      </Sequence>

      {FEATURED.map((project, i) => {
        const beat = PROJECT_BEATS[i];
        // Every beat but the last runs six frames long so the incoming beat can
        // whip across it. Later siblings paint on top, so the outgoing beat
        // slides out underneath the one arriving.
        const whipOut = i < FEATURED.length - 1;
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
              claim={project.claim}
              accent={projectAccent(i)}
              whipIn={i > 0}
              whipOut={whipOut}
            />
          </Sequence>
        );
      })}

      <Sequence
        from={CAPABILITY_MONTAGE.start}
        durationInFrames={CAPABILITY_MONTAGE.end - CAPABILITY_MONTAGE.start}
        name="Capability montage"
        layout="none"
      >
        <CapabilityMontage />
      </Sequence>

      <Sequence
        from={CALL_TO_ACTION.start}
        durationInFrames={CALL_TO_ACTION.end - CALL_TO_ACTION.start}
        name="Call to action"
        layout="none"
      >
        <CallToAction format={format} />
      </Sequence>
    </AbsoluteFill>
  );
};
