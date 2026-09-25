// Own entry for the Monday 2026-10-05 reel, so src/Root.tsx is never edited.
//
//   node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-10-05/index.ts \
//     Mon1005GbpVertical out/social/2026-10-05/render-vertical.mp4 --concurrency 3
//   node node_modules/tsx/dist/cli.mjs scripts/social/2026-10-05/deliver.ts

import { registerRoot } from "remotion";
// Side effect: registers the brand fonts.
import "../../lib/fonts";
import { Mon1005Root } from "./Reel";

registerRoot(Mon1005Root);
