import "../../lib/fonts";
import { Composition, Still } from "remotion";
import { TrackedDraft, TrackedDraftThumb } from "./TrackedDraft";
import { FPS, TOTAL_FRAMES } from "./content";

export const TrackedDraftRoot: React.FC = () => (
  <>
    <Composition
      id="TrackedDraftVertical"
      component={TrackedDraft}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Still id="TrackedDraftThumb" component={TrackedDraftThumb} width={1080} height={1920} />
  </>
);
