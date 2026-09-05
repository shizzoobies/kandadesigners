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
};

/**
 * Looks a scene up. Throws if the key is not registered, and says what is.
 *
 * Loudly, rather than falling back to the placeholder: a typo in a scene key
 * that quietly rendered a grey rectangle would look exactly like a beat that
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
