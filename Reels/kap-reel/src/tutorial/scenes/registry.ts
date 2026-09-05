// The scene registry.
//
// A beat in src/tutorial/reels/*.ts names its picture with a string key, and
// this file is the only place a key becomes a React component. That is what
// keeps the two Phase B agents out of each other's way: the contrast agent adds
// its scenes under scenes/contrast/ and registers its keys here, the hero agent
// does the same under scenes/hero/, and the only shared file either of them
// edits is the SCENES table below, one block each.
//
// It is also what lets scripts/voice.ts, scripts/srt.ts and scripts/deliver.ts
// read a content file: nothing in src/tutorial/types.ts or src/tutorial/reels
// imports React, so a script can walk the beats without pulling in the bundle.

import type { FormatKey } from "../../lib/layout";
import type { TutorialBeat, TutorialCut } from "../types";
import {
  ContrastFails,
  ContrastFine,
  ContrastFix,
} from "./contrast/CardBeats";
import { ContrastFixWide } from "./contrast/FixWide";
import { ContrastReal } from "./contrast/Real";
import { ContrastRule } from "./contrast/Rule";
import { HeroFold } from "./hero/HeroFold";
import { HeroPromise } from "./hero/HeroPromise";
import { HeroReal } from "./hero/HeroReal";
import { HeroRewrite } from "./hero/HeroRewrite";
import { HeroRule } from "./hero/HeroRule";
import { HeroTest } from "./hero/HeroTest";
import { HeroWeak } from "./hero/HeroWeak";
import { JamClip } from "./JamClip";
import { Placeholder } from "./Placeholder";

/** What every registered scene is handed. */
export type TutorialSceneProps = {
  format: FormatKey;
  cut: TutorialCut;
  /** The beat being drawn, including its props and its id. */
  beat: TutorialBeat;
};

export type TutorialScene = React.FC<TutorialSceneProps>;

/**
 * Every scene a beat may name.
 *
 * Phase A registers two: the placeholder both content files currently use, and
 * the Jam clip player, which the contrast tutorial's "inspect" beat switches to
 * once Alex's DevTools recording lands.
 *
 * Phase B adds one line per scene. Keys are namespaced by tutorial so the two
 * agents cannot collide on a name: "contrast-*" and "hero-*".
 */
export const SCENES: Record<string, TutorialScene> = {
  placeholder: Placeholder,
  jam: JamClip,

  // Tutorial 1: contrast. Added in Phase B; see src/tutorial/scenes/contrast/.
  // "contrast-fine", "-fails" and "-fix" are one card in three states and share
  // CardBeats.tsx; "-fix-wide" is the 45 second cut's two column version of the
  // same card, and the "inspect" beat takes the shared "jam" scene above.
  "contrast-fine": ContrastFine,
  "contrast-fails": ContrastFails,
  "contrast-fix": ContrastFix,
  "contrast-real": ContrastReal,
  "contrast-fix-wide": ContrastFixWide,
  "contrast-rule": ContrastRule,

  // Tutorial 2: hero. Added in Phase B; see src/tutorial/scenes/hero/.
  // "-weak", "-promise", "-fold", "-rewrite" and "-test" are the one invented
  // bakery page in five states and share RiversidePhone.tsx. "-real" is the
  // only beat that shows real client work and takes a different shot per cut:
  // three phones across in the 15 second cut, one at a time in the 45 second
  // one. "-rule" is the hook's own treatment on teal.
  "hero-weak": HeroWeak,
  "hero-promise": HeroPromise,
  "hero-fold": HeroFold,
  "hero-rewrite": HeroRewrite,
  "hero-test": HeroTest,
  "hero-real": HeroReal,
  "hero-rule": HeroRule,
};

/**
 * Looks a scene up. Throws if the key is not registered, and says what is.
 *
 * Loudly, rather than falling back to the placeholder: a typo in a scene key
 * that quietly rendered a gray rectangle would look exactly like a beat that
 * had not been built yet, and the two need to be told apart.
 */
export function resolveScene(key: string): TutorialScene {
  const scene = SCENES[key];
  if (!scene) {
    throw new Error(
      `No tutorial scene registered under "${key}". Registered keys: ` +
        `${Object.keys(SCENES).join(", ")}. Register it in ` +
        `src/tutorial/scenes/registry.ts.`,
    );
  }
  return scene;
}
