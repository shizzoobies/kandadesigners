import "../../lib/fonts";
import { Composition, Still } from "remotion";
import { BriefChat, BriefChatThumb } from "./BriefChat";
import { FPS, TOTAL_FRAMES } from "./content";

export const BriefChatRoot: React.FC = () => (
  <>
    <Composition
      id="BriefChatVertical"
      component={BriefChat}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Still id="BriefChatThumb" component={BriefChatThumb} width={1080} height={1920} />
  </>
);
