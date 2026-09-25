// Own entry for the Wednesday 2026-09-30 reel, so src/Root.tsx is never edited.
//
//   node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-09-30/index.ts \
//     Wed0930OneScreen out/social/2026-09-30/render.mp4 --concurrency 3
//   node node_modules/tsx/dist/cli.mjs scripts/social/2026-09-30/deliver.ts

import { registerRoot } from "remotion";
// Side effect: registers the brand fonts.
import "../../lib/fonts";
import { Wed0930Root } from "./Reel";

registerRoot(Wed0930Root);
