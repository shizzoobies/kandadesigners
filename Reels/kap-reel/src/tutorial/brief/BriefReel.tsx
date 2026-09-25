import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SafeZoneOverlay } from "../../components/SafeZoneOverlay";
import { COLORS } from "../../lib/brand";
import type { FormatKey } from "../../lib/layout";
import { Caption } from "../scenes/Caption";
import { TutorialHook } from "../scenes/TutorialHook";
import { BriefCta } from "./BriefCta";
import { BriefRule } from "./BriefRule";
import { BRIEF_TUTORIAL, BRIEF_URL } from "./content";
import { PromptBoard } from "./PromptBoard";
import { briefTimeline } from "./voice-data";

export type BriefReelProps = {
  format?: FormatKey;
  debugSafeZones?: boolean;
};

/**
 * "Give the AI the brief, not the task", the 15 second vertical cut.
 *
 * The same shape as src/tutorial/Tutorial.tsx (a Sequence per laid out beat,
 * the shared hook, the burned in caption card, an <Audio> per beat for Studio
 * and a bare render), with two differences. The timeline is laid out from the
 * brief tutorial's own kept reads in config/voice.json (briefV3), handed to
 * tutorialTimeline() explicitly. And the beats are drawn by this folder's
 * scenes directly rather than through the shared registry, and the end card is
 * BriefCta, which points at the free AI lessons page rather than the home page.
 *
 * The delivered audio is the muxed mix, assets/audio/mix-tut-brief-15s-v3.wav,
 * as for every other reel.
 */
export const BriefReel: React.FC<BriefReelProps> = ({ format = "vertical", debugSafeZones = false }) => {
  const timeline = briefTimeline();
  const content = BRIEF_TUTORIAL;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      {timeline.entries.map((entry) => {
        const { beat } = entry;
        let picture: React.ReactNode;
        if (entry.kind === "hook") {
          picture = <TutorialHook format={format} content={content.hook} />;
        } else if (entry.kind === "cta") {
          picture = (
            <BriefCta format={format} closingLine={content.cta.short.closingLine ?? ""} url={BRIEF_URL} />
          );
        } else if (beat.scene === "brief-rule") {
          picture = (
            <>
              <BriefRule format={format} />
              <Caption format={format} lines={beat.caption} />
            </>
          );
        } else {
          const stage = beat.props?.stage === "good" ? "good" : "weak";
          const label = typeof beat.props?.label === "string" ? beat.props.label : undefined;
          picture = (
            <>
              <PromptBoard format={format} stage={stage} label={label} />
              <Caption format={format} lines={beat.caption} />
            </>
          );
        }
        return (
          <Sequence
            key={beat.id}
            from={entry.start}
            durationInFrames={entry.end - entry.start}
            name={beat.id}
            layout="none"
          >
            {picture}
            {entry.voiceFile ? <Audio src={staticFile(entry.voiceFile.replace(/^assets\//, ""))} /> : null}
          </Sequence>
        );
      })}
      {debugSafeZones ? <SafeZoneOverlay format={format} /> : null}
    </AbsoluteFill>
  );
};

/**
 * Frames the composition runs, from the kept reads.
 *
 * Evaluated when Root.tsx loads, which every composition in the project shares,
 * so a read that does not fit the cut must not throw here and take the other
 * reels' renders down with it. It falls back to the nominal 450 and says why;
 * the composition itself still throws the timeline's own error when rendered.
 */
export const BRIEF_FRAMES = (() => {
  try {
    return briefTimeline().totalFrames;
  } catch (err) {
    console.warn(`[brief] ${err instanceof Error ? err.message.split("\n")[0] : String(err)}`);
    return 450;
  }
})();
