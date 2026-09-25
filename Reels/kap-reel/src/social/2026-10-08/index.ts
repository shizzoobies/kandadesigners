// Standalone Remotion entry for the Thu 2026-10-08 reel, "AI drafts, you decide."
// Own registerRoot so src/Root.tsx is never edited.
//
//   node node_modules/@remotion/cli/remotion-cli.js render src/social/2026-10-08/index.ts \
//     TrackedDraftVertical out/social/2026-10-08/render.mp4 --concurrency 3
//   node node_modules/@remotion/cli/remotion-cli.js still src/social/2026-10-08/index.ts \
//     TrackedDraftThumb out/social/2026-10-08/thumb.png

import { registerRoot } from "remotion";
import { TrackedDraftRoot } from "./Root";

registerRoot(TrackedDraftRoot);
