/**
 * scripts/interactions/index.ts
 *
 * Registry of interaction scripts, keyed by the project id in
 * config/projects.json. A static map rather than a dynamic import so the whole
 * set is type-checked by `npx tsc -p tsconfig.scripts.json`.
 */

import type { Beat, InteractionScript } from "./types";
import safety from "./training-safety";
import rfi from "./training-rfi";
import finance from "./training-finance";

const SCRIPTS: InteractionScript[] = [safety, rfi, finance];

export function interactionScriptFor(projectId: string): InteractionScript | null {
  return SCRIPTS.find((s) => s.projectId === projectId) ?? null;
}

export function beatsFor(projectId: string): Beat[] {
  return interactionScriptFor(projectId)?.beats ?? [];
}

export { SCRIPTS };
