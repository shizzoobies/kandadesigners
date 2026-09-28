// Own entry for the long-form YouTube videos, so src/Root.tsx is never edited
// (the same arrangement as src/social/*/index.ts). From D:\kap-reel, with node,
// never npx, L1 is built in this order:
//   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/stage.ts     media and word timings
//   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/mix.ts       the mastered mix
//   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/deliver.ts   render, encode, check, QA
//   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/srt.ts       media/video.srt
// Studio: node node_modules/@remotion/cli/remotion-cli.js studio src/youtube/index.ts

import { registerRoot } from "remotion";
import { Root } from "./Root";

registerRoot(Root);
