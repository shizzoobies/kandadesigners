// Own entry for the long-form YouTube videos, so src/Root.tsx is never edited
// (the same arrangement as src/social/*/index.ts). Render from D:\kap-reel with
// node, never npx:
//   node node_modules/@remotion/cli/remotion-cli.js render src/youtube/index.ts YouTubeL1 out/youtube/l1/l1.mp4 --props="{\"theme\":\"a\",\"withAudio\":true}"
// Stage the media and the mix first: scripts/youtube/l1/stage.ts, then mix.ts.

import { registerRoot } from "remotion";
import { Root } from "./Root";

registerRoot(Root);
