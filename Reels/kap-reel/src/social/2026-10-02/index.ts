// Own entry for the Friday 2026-10-02 reel, so src/Root.tsx is never edited.
//   node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-10-02/index.ts \
//     Social1002ThrillersVertical out/social/2026-10-02/render-vertical.mp4 --concurrency 3
//   node node_modules/@remotion/cli/remotion-cli.js still src/social/2026-10-02/index.ts \
//     Social1002ThrillersThumb out/social/2026-10-02/thumbnail.png

import { registerRoot } from "remotion";
import { Root } from "./Root";

registerRoot(Root);
