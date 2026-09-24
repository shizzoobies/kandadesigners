#!/usr/bin/env node
import path from "node:path";
import { resolveRoot, dayDir } from "./lib/paths.mjs";
import { listDayFolders } from "./lib/manifest.mjs";
import { validateFolder } from "./lib/validate.mjs";
import { createDay } from "./lib/plan.mjs";
import { buildCalendar, formatCalendar } from "./lib/calendar.mjs";

const USAGE = `usage:
  node tools/social.mjs plan <YYYY-MM-DD> --pillar <p> --title "<t>" [--type REEL|POST] [--time HH:MM] [--from "<reel folder>"] [--ai-voice] [--ai-visuals]
  node tools/social.mjs validate [<folder name>|--all]
  node tools/social.mjs calendar [--days N] [--today YYYY-MM-DD]`;

/** Minimal argv parser: positionals, --key value, and --flag. */
function parse(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) { out[key] = next; i++; }
      else out[key] = true;
    } else out._.push(a);
  }
  return out;
}

function todayLocal() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function main() {
  const root = resolveRoot();
  const [command, ...rest] = process.argv.slice(2);
  const args = parse(rest);

  if (command === "plan") {
    const date = args._[0];
    if (!date || !args.pillar || !args.title) { console.error(USAGE); return 1; }
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
    const dirs = !target || args.all ? listDayFolders(root) : [dayDir(root, target)];
    let count = 0;
    for (const dir of dirs) {
      const problems = validateFolder(dir);
      count += problems.length;
      for (const p of problems) console.log(p);
    }
    console.log(count === 0 ? `${dirs.length} folder(s) valid` : `${count} problem(s) in ${dirs.length} folder(s)`);
    return count === 0 ? 0 : 1;
  }

  if (command === "calendar") {
    const rows = buildCalendar({ root, today: args.today || todayLocal(), days: Number(args.days || 14) });
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
