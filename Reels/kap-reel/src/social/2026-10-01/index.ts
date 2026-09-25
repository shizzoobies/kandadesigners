// Standalone Remotion entry for the Thu 2026-10-01 reel, revision 2.
// Own registerRoot so src/Root.tsx is never edited.
//
//   node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-10-01/index.ts \
//     BriefChatVertical out/social/2026-10-01/render.mp4 --concurrency 3
//   node node_modules/@remotion/cli/remotion-cli.js still src/social/2026-10-01/index.ts \
//     BriefChatThumb out/social/2026-10-01/thumb.png

import { registerRoot } from "remotion";
import { BriefChatRoot } from "./Root";

registerRoot(BriefChatRoot);
