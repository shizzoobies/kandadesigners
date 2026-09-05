import type { TutorialSceneProps } from "../registry";
import { RiversidePhone } from "./RiversidePhone";
import { exampleLabel, WEAK_HEADLINE } from "./riverside";

/**
 * "Welcome to our website says nothing."
 *
 * The invented bakery's hero as most of them are built: a photo that has not
 * been chosen yet, a logo, and a greeting where the promise should be. Nothing
 * moves. The beat is 74 frames and the picture's whole job is to be recognised,
 * because every viewer has shipped this page.
 */
export const HeroWeak: React.FC<TutorialSceneProps> = ({ format, beat }) => {
  return (
    <RiversidePhone
      format={format}
      headline={WEAK_HEADLINE}
      label={exampleLabel(beat.props)}
    />
  );
};
