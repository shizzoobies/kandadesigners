import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SafeZoneOverlay } from "../components/SafeZoneOverlay";
import { CallToAction } from "../scenes/CallToAction";
import { COLORS } from "../lib/brand";
import { type FormatKey } from "../lib/layout";
import { CONTRAST_TUTORIAL } from "./reels/contrast";
import { Caption } from "./scenes/Caption";
import { resolveScene } from "./scenes/registry";
import { TutorialHook } from "./scenes/TutorialHook";
import { tutorialTimeline } from "./timeline";
import type { TutorialContent, TutorialCut } from "./types";

export type TutorialProps = {
  /**
   * Which crop this scene tree is rendering. Every scene lays itself out from
   * safeArea(format) and formatMetrics(format), exactly as src/Reel.tsx does.
   */
  format?: FormatKey;
  /** Draws the reserved platform zones on top. Debug compositions only. */
  debugSafeZones?: boolean;
  cut?: TutorialCut;
  content?: TutorialContent;
};

/**
 * The tutorial scene tree.
 *
 * Separate from src/Reel.tsx, per the spec: the showcase reels are a fixed beat
 * map with content poured into it, and a tutorial is a narration with a picture
 * laid out around it. Sharing one tree would mean a beat map that is sometimes
 * a constant and sometimes computed, which is a fork wearing a prop.
 *
 * What it does share is everything below the beat: the drawn end card, the
 * kinetic treatment, the device frames, the layout helpers and the brand. A
 * tutorial and a showcase reel are the same studio.
 *
 * Audio. Each beat gets an <Audio> for its own voice file when one exists, so
 * Studio and a bare render can be watched with the narration on. That is a
 * preview convenience: the delivered files take their audio from the muxed mix
 * at assets/audio/mix-tut-<id>-<15|45>s.wav, which is the voice ducked under
 * the music bed and normalised, exactly as the two showcase reels take theirs
 * from mix-<variant>-<15|45>s.wav.
 */
export const Tutorial: React.FC<TutorialProps> = ({
  format = "vertical",
  debugSafeZones = false,
  cut = "short",
  content = CONTRAST_TUTORIAL,
}) => {
  const timeline = tutorialTimeline(content, cut);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      {timeline.entries.map((entry) => {
        const { beat } = entry;
        const durationInFrames = entry.end - entry.start;

        let picture: React.ReactNode;
        if (entry.kind === "hook") {
          picture = <TutorialHook format={format} content={content.hook} />;
        } else if (entry.kind === "cta") {
          picture = (
            <CallToAction
              format={format}
              cut={cut}
              closingLine={content.cta[cut].closingLine}
            />
          );
        } else {
          const Scene = resolveScene(beat.scene);
          picture = (
            <>
              <Scene format={format} cut={cut} beat={beat} />
              <Caption format={format} lines={beat.caption} />
            </>
          );
        }

        return (
          <Sequence
            key={beat.id}
            from={entry.start}
            durationInFrames={durationInFrames}
            name={beat.id}
            layout="none"
          >
            {picture}
            {entry.voiceFile ? (
              <Audio src={staticFile(entry.voiceFile.replace(/^assets\//, ""))} />
            ) : null}
          </Sequence>
        );
      })}

      {debugSafeZones ? <SafeZoneOverlay format={format} /> : null}
    </AbsoluteFill>
  );
};
