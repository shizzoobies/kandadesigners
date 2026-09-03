// Standalone Remotion entry for Phase 4.
//
// The plate composites are checked through here, not through src/Root.tsx, so
// this phase never touches the timeline file another phase owns. Render a gate
// still with:
//
//   npx remotion still src/plates-entry.ts PlateCheck-<plateId> out/gate4/x.png
//
// or drive all of them with scripts/composite-check.ts gate.

import { registerRoot } from "remotion";
import { PlatesRoot } from "./PlateCheck";

registerRoot(PlatesRoot);
