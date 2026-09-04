// Standalone Remotion entry for the drawn logo lockup.
//
// The LogoDraw gate is checked through here, not through src/Root.tsx, so this
// work never touches the timeline file another phase owns. Same arrangement as
// src/plates-entry.ts.
//
//   npx remotion still src/logo-entry.ts LogoDraw72 out/gate-logo/x.png --frame=36
//   npx remotion render src/logo-entry.ts LogoDraw72 out/gate-logo/logo-draw-72.mp4

import { registerRoot } from "remotion";
import { LogoRoot } from "./LogoCheck";

registerRoot(LogoRoot);
