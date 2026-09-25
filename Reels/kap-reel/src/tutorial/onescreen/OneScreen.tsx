import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { COLORS } from "../../lib/brand";
import { Caption } from "../scenes/Caption";
import { TutorialHook } from "../scenes/TutorialHook";
import { beatProps, ONESCREEN_TUTORIAL } from "./content";
import { OnescreenEndCard } from "./EndCard";
import { onescreenTimeline } from "./layout";
import { ONESCREEN_SCENES } from "./scenes";
import { wordFrame } from "./words";

/**
 * "One screen, one decision": the Wednesday 2026-09-30 reel, 1080 by 1920.
 *
 * The tutorial scene tree of src/tutorial/Tutorial.tsx, beat for beat: the
 * kinetic hook on teal, one scene per beat with the burned caption card, the
 * drawn end card. Its own tree rather than a content file handed to Tutorial,
 * for two reasons: its scenes live in src/tutorial/onescreen/ rather than in the
 * shared registry, and a beat's caption changes on the word the voice reaches
 * (content.ts, captions[].from) rather than holding one card for the beat.
 *
 * The per beat voice files play here so Studio and a bare render can be
 * watched with the narration. The delivered file takes its audio from the
 * mix, assets/audio/mix-tut-onescreen-15s-v3.wav, muxed by scripts/encode.sh.
 */
export const OneScreen: React.FC = () => {
  const timeline = onescreenTimeline();
  const format = "vertical" as const;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      {timeline.entries.map((entry) => {
        const { beat } = entry;
        const frames = entry.end - entry.start;
        let picture: React.ReactNode;
        if (entry.kind === "hook") {
          picture = <TutorialHook format={format} content={ONESCREEN_TUTORIAL.hook} />;
        } else if (entry.kind === "cta") {
          picture = <OnescreenEndCard format={format} closingLine={ONESCREEN_TUTORIAL.cta.short.closingLine} />;
        } else {
          const Scene = ONESCREEN_SCENES[beat.scene];
          if (!Scene) throw new Error(`No onescreen scene "${beat.scene}".`);
          const phases = beatProps(beat).captions;
          const starts = phases.map((p) => (p.from === 0 ? 0 : wordFrame(beat, p.from, frames)));
          picture = (
            <>
              <Scene format={format} cut="short" beat={beat} />
              {phases.map((p, i) => (
                <Sequence key={i} from={starts[i]} durationInFrames={(starts[i + 1] ?? frames) - starts[i]} layout="none">
                  <Caption format={format} lines={p.lines} />
                </Sequence>
              ))}
            </>
          );
        }
        return (
          <Sequence key={beat.id} from={entry.start} durationInFrames={frames} name={beat.id} layout="none">
            {picture}
            {entry.voiceFile ? <Audio src={staticFile(entry.voiceFile.replace(/^assets\//, ""))} /> : null}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/** The composition's length, for Root.tsx. */
export const ONESCREEN_FRAMES = onescreenTimeline().totalFrames;
