#!/usr/bin/env node
// Builds the approval page's data from the day folders. The logic lives in
// lib/review.mjs (buildReview), testable without touching the filesystem's
// real root; this file is the thin CLI.
//
//   node tools/review.mjs                     writes review/data.json and review/files.json
//   node tools/review.mjs --client <slug>      same, for clients/<slug> instead
//
// Alex's decisions live in the page's db (or, for the admin Post Desk, D1),
// not here; Claude reads them back and applies them with the normal commands.
import fs from "node:fs";
import path from "node:path";
import { resolveRoot, extractClientFlag } from "./lib/paths.mjs";
import { buildReview } from "./lib/review.mjs";

function main() {
  const { client: clientSlug } = extractClientFlag(process.argv.slice(2));
  const root = resolveRoot(process.env, clientSlug);
  const { data, files } = buildReview({ root });

  fs.mkdirSync(path.join(root, "review"), { recursive: true });
  fs.writeFileSync(path.join(root, "review", "data.json"), JSON.stringify(data, null, 2));
  fs.writeFileSync(path.join(root, "review", "files.json"), JSON.stringify(files, null, 2));
  console.log(`${data.posts.length} posts, ${data.storiesPaused ? "Stories paused (stories/PAUSED.md)" : `${data.stories.length} stories, ${data.storyChecklist.length} on the Stories checklist`}, ${Object.keys(files).length} media files`);
  return 0;
}

try {
  process.exitCode = main();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
