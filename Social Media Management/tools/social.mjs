#!/usr/bin/env node
import path from "node:path";
import { resolveRoot, dayDir } from "./lib/paths.mjs";
import { listAllDayDirs, listDayFolders } from "./lib/manifest.mjs";
import { validateFolder } from "./lib/validate.mjs";
import { createDay } from "./lib/plan.mjs";
import { buildCalendar, formatCalendar, todayInNewYork } from "./lib/calendar.mjs";
import { uploadFolder } from "./lib/upload.mjs";

const USAGE = `usage:
  node tools/social.mjs plan <YYYY-MM-DD> --pillar <p> --title "<t>" [--type REEL|POST] [--time HH:MM] [--from "<reel folder>"] [--ai-voice] [--ai-visuals]
  node tools/social.mjs validate [<folder name>|--all]
  node tools/social.mjs calendar [--days N] [--today YYYY-MM-DD]
  node tools/social.mjs upload [<folder name>|--all] [--dry-run]`;

const FLAGS = new Set(["all", "draft", "dry-run", "ai-voice", "ai-visuals"]);

/** Positionals, --flag for names in FLAGS, and --key value for everything else. */
function parse(argv, flags = FLAGS) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { out._.push(a); continue; }
    const key = a.slice(2);
    if (flags.has(key)) { out[key] = true; continue; }
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

function main() {
  const root = resolveRoot();
  const [command, ...rest] = process.argv.slice(2);
  const args = parse(rest);

  if (command === "plan") {
    const date = args._[0];
    const isText = (v) => typeof v === "string" && v.length > 0;
    const optional = ["type", "time", "from"].every((k) => args[k] === undefined || isText(args[k]));
    if (!isText(date) || !isText(args.pillar) || !isText(args.title) || !optional) { console.error(USAGE); return 1; }
    const dir = createDay({
      root, date, pillar: args.pillar, title: args.title,
      type: args.type || "REEL", time: args.time || "09:00", from: args.from || null,
      ai: { voice: Boolean(args["ai-voice"]), visuals: Boolean(args["ai-visuals"]) }
    });
    console.log(`created ${path.relative(root, dir)}`);
    const problems = validateFolder(dir);
    if (problems.length) console.log(`still to fill in:\n  ${problems.join("\n  ")}`);
    return 0;
  }

  if (command === "validate") {
    const target = args._[0];
    const dirs = target ? [dayDir(root, target)] : listAllDayDirs(root);
    let count = 0;
    for (const dir of dirs) {
      const problems = validateFolder(dir);
      count += problems.length;
      for (const p of problems) console.log(p);
    }
    console.log(count === 0 ? `${dirs.length} folder(s) valid` : `${count} problem(s) in ${dirs.length} folder(s)`);
    return count === 0 ? 0 : 1;
  }

  if (command === "upload") {
    const target = args._[0];
    const dirs = target ? [dayDir(root, target)] : listDayFolders(root);
    let failed = 0;
    for (const dir of dirs) {
      try {
        const r = uploadFolder(dir, { dryRun: Boolean(args["dry-run"]) });
        if (r.skipped) { console.log(`${r.name}: skipped (${r.skipped})`); for (const p of r.problems || []) console.log(`  ${p}`); continue; }
        console.log(`${r.name}: ${args["dry-run"] ? "would upload" : "uploaded"} ${r.uploaded.length}, unchanged ${r.unchanged.length}`);
      } catch (err) {
        failed++;
        console.log(`${path.basename(dir)}: failed: ${err.message}`);
      }
    }
    return failed === 0 ? 0 : 1;
  }

  if (command === "calendar") {
    const days = args.days === undefined ? 14 : Number(args.days);
    if (!Number.isInteger(days) || days < 1) { console.error(USAGE); return 1; }
    const rows = buildCalendar({ root, today: args.today || todayInNewYork(), days });
    console.log(formatCalendar(rows));
    return 0;
  }

  console.error(USAGE);
  return 1;
}

try {
  process.exitCode = main();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
