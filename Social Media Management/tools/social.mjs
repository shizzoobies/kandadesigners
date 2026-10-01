#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { resolveRoot, dayDir, extractClientFlag, ALREADY_RELEASED } from "./lib/paths.mjs";
import { listAllDayDirs, listDayFolders } from "./lib/manifest.mjs";
import { validateFolder } from "./lib/validate.mjs";
import { musicConflicts } from "./lib/music.mjs";
import { createDay } from "./lib/plan.mjs";
import { buildCalendar, formatCalendar, todayInNewYork } from "./lib/calendar.mjs";
import { uploadFolder } from "./lib/upload.mjs";
import { prepareRelease, recordRelease, recordError, promotePackets, recordPromotion, recordStudioDone } from "./lib/release.mjs";
import { reconcile, reconcileWindow } from "./lib/reconcile.mjs";
import { pullDesk, pushDesk } from "./lib/desk.mjs";
import { loadClient, isOwnerPublished } from "./lib/client.mjs";
import { buildHandoff } from "./lib/handoff.mjs";
import { listBrands, readMetricoolConfig } from "./lib/metricool.mjs";

const USAGE = `usage: (any command takes a global --client <slug> first, to work in clients/<slug>)
  node tools/social.mjs plan <YYYY-MM-DD> --pillar <p> --title "<t>" [--type REEL|POST] [--time HH:MM] [--from "<reel folder>"] [--ai-voice] [--ai-visuals]
  node tools/social.mjs validate [<folder name>|--all]
  node tools/social.mjs calendar [--days N] [--today YYYY-MM-DD]
  node tools/social.mjs upload [<folder name>|--all] [--dry-run]
  node tools/social.mjs release [<folder name>|--all] [--draft] [--dry-run]
  node tools/social.mjs release --record <folder name> --network facebook|instagram|linkedin|youtube --id <id> --uuid <uuid>
  node tools/social.mjs release --record <folder name> --network facebook|instagram|linkedin|youtube --error "<message>"
  node tools/social.mjs release --promote <folder name>
  node tools/social.mjs release --promoted <folder name> --network facebook|instagram|linkedin|youtube --id <new id>
  node tools/social.mjs release --studio-done <folder name>
  node tools/social.mjs reconcile --window [--now <ISO>]
  node tools/social.mjs reconcile --from <getScheduledPosts.json> [--dry-run] [--now <ISO>]
  node tools/social.mjs desk pull
  node tools/social.mjs desk push [--dry-run]
  node tools/social.mjs --client <slug> desk pull
  node tools/social.mjs --client <slug> desk push [--dry-run]
  node tools/social.mjs --client <slug> handoff [<folder name>|--all] [--dry-run]
  node tools/social.mjs metricool brands`;

const FLAGS = new Set(["all", "draft", "dry-run", "ai-voice", "ai-visuals", "window"]);

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
  const { client: clientSlug, rest: argv } = extractClientFlag(process.argv.slice(2));
  const root = resolveRoot(process.env, clientSlug);
  const client = loadClient(root);
  const [command, ...rest] = argv;
  const args = parse(rest);

  if ((command === "upload" || command === "release") && isOwnerPublished(client)) {
    console.error(`${client.slug} is published by the owner: use handoff`);
    return 1;
  }

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
    const problems = validateFolder(dir, { client });
    if (problems.length) console.log(`still to fill in:\n  ${problems.join("\n  ")}`);
    return 0;
  }

  if (command === "validate") {
    const target = args._[0];
    const dirs = target ? [dayDir(root, target)] : listAllDayDirs(root);
    let count = 0;
    for (const dir of dirs) {
      const warnings = [];
      const problems = validateFolder(dir, { client, warnings });
      count += problems.length;
      for (const p of problems) console.log(p);
      // Advice only: printed, never counted.
      for (const w of warnings) console.log(`warning: ${w}`);
    }
    if (!target) {
      const music = musicConflicts(root);
      count += music.length;
      for (const p of music) console.log(p);
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
        if (r.skipped) {
          if (target && r.skipped === "invalid") failed++;
          console.log(`${r.name}: skipped (${r.skipped})`); for (const p of r.problems || []) console.log(`  ${p}`); continue;
        }
        console.log(`${r.name}: ${args["dry-run"] ? "would upload" : "uploaded"} ${r.uploaded.length}, unchanged ${r.unchanged.length}`);
      } catch (err) {
        failed++;
        console.log(`${path.basename(dir)}: failed: ${err.message}`);
      }
    }
    return failed === 0 ? 0 : 1;
  }

  if (command === "release") {
    const isText = (v) => typeof v === "string" && v.length > 0;
    if (args.record !== undefined) {
      if (!isText(args.record) || !isText(args.network)) { console.error(USAGE); return 1; }
      if (args.error !== undefined) {
        if (!isText(args.error)) { console.error(USAGE); return 1; }
        const r = recordError(dayDir(root, args.record), { network: args.network, message: args.error });
        console.log(`${r.name}: recorded error for ${args.network}`);
        return 0;
      }
      if (!isText(args.id) || !isText(args.uuid)) { console.error(USAGE); return 1; }
      const r = recordRelease(dayDir(root, args.record), { network: args.network, id: args.id, uuid: args.uuid });
      console.log(`${r.name}: recorded ${args.network}, status ${r.status}`);
      return 0;
    }
    if (args.promote !== undefined) {
      if (!isText(args.promote)) { console.error(USAGE); return 1; }
      const r = promotePackets(dayDir(root, args.promote));
      console.log(`${r.packets.length} draft(s) to promote through Metricool. For each one call updateScheduledPost with blogId 7076479, the id, the uuid, and info as a JSON string, then run release --promoted.`);
      for (const p of r.packets) console.log(JSON.stringify(p));
      return 0;
    }
    if (args.promoted !== undefined) {
      if (!isText(args.promoted) || !isText(args.network) || !isText(args.id)) { console.error(USAGE); return 1; }
      const r = recordPromotion(dayDir(root, args.promoted), { network: args.network, id: args.id });
      console.log(`${r.name}: promoted ${args.network}, id ${args.id}`);
      return 0;
    }
    if (args["studio-done"] !== undefined) {
      const folder = args["studio-done"];
      if (!isText(folder)) { console.error(USAGE); return 1; }
      // A published folder has usually moved to Already Released by the time Studio is done.
      const queued = dayDir(root, folder);
      const r = recordStudioDone(fs.existsSync(queued) ? queued : dayDir(root, folder, ALREADY_RELEASED));
      console.log(`${r.name}: Studio checklist marked done`);
      return 0;
    }
    const target = args._[0];
    const dirs = target ? [dayDir(root, target)] : listDayFolders(root);
    const packets = [];
    let failed = 0;
    for (const dir of dirs) {
      const r = prepareRelease(dir, { draft: Boolean(args.draft), dryRun: Boolean(args["dry-run"]) });
      if (r.skipped) {
        if (target && r.skipped === "invalid") failed++;
        console.log(`${r.name}: skipped (${r.skipped})`); for (const p of r.problems || []) console.log(`  ${p}`); continue;
      }
      for (const rep of r.repeated) {
        console.log(`warning: ${r.name} ${rep.network} was prepared before at ${rep.preparedAt}; check getScheduledPosts for that date before sending again`);
      }
      if (r.studio.length) {
        console.log(`${r.name} youtube: after it publishes, finish in Studio, then run release --studio-done ${r.name}:`);
        for (const line of r.studio) console.log(`  - ${line}`);
      }
      packets.push(...r.packets);
    }
    const verb = args["dry-run"] ? "would send" : "to send";
    console.log(`${packets.length} packet(s) ${verb} through Metricool. For each one call createScheduledPost with blogId 7076479, the date, and info as a JSON string, then run release --record.`);
    for (const p of packets) console.log(JSON.stringify(p));
    return failed === 0 ? 0 : 1;
  }

  if (command === "reconcile") {
    if (isOwnerPublished(client)) { console.error(`${client.slug} is published by the owner: nothing to reconcile (no Metricool schedule)`); return 1; }
    if (args.now !== undefined && typeof args.now !== "string") { console.error(USAGE); return 1; }
    const now = typeof args.now === "string" ? new Date(args.now) : new Date();
    if (Number.isNaN(now.getTime())) { console.error(USAGE); return 1; }
    if (args.window) {
      console.log(JSON.stringify(reconcileWindow(root, now)));
      return 0;
    }
    if (typeof args.from !== "string") { console.error(USAGE); return 1; }
    const response = JSON.parse(fs.readFileSync(args.from, "utf8"));
    const r = reconcile({ root, response, now, dryRun: Boolean(args["dry-run"]) });
    const verb = args["dry-run"] ? "would publish" : "published";
    console.log(`${verb}: ${r.published.join(", ") || "none"}`);
    console.log(`waiting: ${r.waiting.join(", ") || "none"}`);
    if (r.drafts.length) console.log(`drafts waiting for promotion: ${r.drafts.join(", ")}`);
    for (const f of r.failed) console.log(`${f.folder}: Metricool reports a failed post on ${f.networks.join(", ")}; check Metricool, then resend it`);
    if (r.studio.length) {
      console.log(`Studio checklist still open (run release --studio-done <folder> when done): ${r.studio.join(", ")} (assumes the Metricool post published; check YouTube if unsure)`);
    }
    console.log(`${args["dry-run"] ? "would delete" : "deleted"} ${r.deleted.length} R2 object(s)`);
    for (const e of r.errors) console.log(`${e.folder}: failed: ${e.message}`);
    return r.errors.length === 0 && r.failed.length === 0 ? 0 : 1;
  }

  if (command === "calendar") {
    if (args.days !== undefined && typeof args.days !== "string") { console.error(USAGE); return 1; }
    const days = args.days === undefined ? 14 : Number(args.days);
    if (!Number.isInteger(days) || days < 1) { console.error(USAGE); return 1; }
    const rows = buildCalendar({ root, today: args.today || todayInNewYork(), days });
    console.log(formatCalendar(rows));
    return 0;
  }

  if (command === "desk") {
    const sub = args._[0];
    if (client && args.site !== undefined && args.site !== client.slug) {
      console.error(`--site must be "${client.slug}" in --client mode (got "${args.site}")`);
      return 1;
    }
    if (!client && args.site !== undefined && args.site !== "ka-performance") {
      console.error(`--site "${args.site}" is not ka-performance; pass --client <slug> for a client's own desk instead`);
      return 1;
    }
    const site = client ? client.slug : (args.site || "ka-performance");
    if (sub === "pull") {
      printDeskPull(pullDesk({ site, root }));
      return 0;
    }
    if (sub === "push") {
      printDeskPush(pushDesk({ site, root, dryRun: Boolean(args["dry-run"]) }), Boolean(args["dry-run"]));
      return 0;
    }
    console.error(USAGE);
    return 1;
  }

  if (command === "handoff") {
    if (!client) { console.error("handoff needs --client <slug>"); return 1; }
    if (!isOwnerPublished(client)) { console.error(`${client.slug} is not published by the owner: handoff does not apply`); return 1; }
    const target = args._[0];
    const dirs = target ? [dayDir(root, target)] : listDayFolders(root);
    let failed = 0;
    for (const dir of dirs) {
      try {
        const r = buildHandoff(dir, { root, client, dryRun: Boolean(args["dry-run"]) });
        if (r.skipped) { console.log(`${r.name}: skipped (${r.skipped})`); continue; }
        const verb = args["dry-run"] ? "would hand off" : "handed off";
        const recovered = r.recovered ? " (recovered: was stuck already handed-off in To Be Released)" : "";
        console.log(`${r.name}: ${verb} -> ${path.relative(root, r.handoffPath)} (Drive folder: "${r.driveFolder}")${recovered}`);
      } catch (err) {
        failed++;
        console.log(`${path.basename(dir)}: failed: ${err.message}`);
      }
    }
    return failed === 0 ? 0 : 1;
  }

  if (command === "metricool") {
    if (args._[0] !== "brands") { console.error(USAGE); return 1; }
    return printBrands();
  }

  console.error(USAGE);
  return 1;
}

/**
 * `metricool brands`: a read-only check that the API token works. Lists every
 * brand on the account with its id and connected networks, and marks which
 * site slug in tools/config/metricool.json each one is mapped to.
 */
async function printBrands() {
  const config = readMetricoolConfig();
  const slugOf = new Map(Object.entries(config.brands || {}).map(([slug, id]) => [String(id), slug]));
  const brands = await listBrands({ config });
  if (!brands.length) { console.log("no brands on this account"); return 0; }
  for (const b of brands) {
    const slug = slugOf.get(b.id);
    console.log(`${b.id}  ${b.label}  [${b.networks.join(", ") || "no networks connected"}]${b.timezone ? `  ${b.timezone}` : ""}  ${slug ? `-> ${slug}` : "(not in tools/config/metricool.json)"}`);
  }
  return 0;
}

/** One line per decision or story check read, or "nothing new". Shared by `desk pull` and `desk push`. */
function printPulledSummary({ decisions, checks }) {
  if (!decisions.length && !checks.length) { console.log("nothing new"); return; }
  for (const d of decisions) {
    console.log(`${d.item_id}: ${d.decision}${d.who ? ` by ${d.who}` : ""} (decided ${d.decided_at})`);
    if (d.note) console.log(`  note: ${d.note}`);
    if (d.answer) console.log(`  answer: ${d.answer}`);
    if (Object.keys(d.answers || {}).length) console.log(`  answers: ${JSON.stringify(d.answers)}`);
  }
  for (const c of checks) {
    console.log(`${c.item_id}: ${c.posted ? "posted" : "not posted"}${c.who ? ` by ${c.who}` : ""} (checked ${c.checked_at})`);
  }
}

/** `desk pull`. */
function printDeskPull(result) {
  printPulledSummary(result);
}

/** `desk push`: the full pull summary (push always pulls first), plus any skips, resets, and counts. */
function printDeskPush({ uploads, deletes, rows, pulled, skipped, reset }, dryRun) {
  if (dryRun) {
    console.log(`would upload ${uploads.length} file(s), would delete ${deletes.length} object(s), would push ${rows} row(s)`);
    return;
  }
  for (const id of skipped) console.log(`${id}: already settled on the desk (approved or answered); apply it locally (post status approved, or drop the ask from review/asks.json) before pushing again`);
  printPulledSummary(pulled);
  for (const id of reset) console.log(`${id}: content changed since the last push, decision reset to waiting`);
  console.log(`uploaded ${uploads.length} file(s), deleted ${deletes.length} object(s), pushed ${rows} row(s)`);
}

// main() returns an exit code, or a promise of one for the commands that call an API.
try {
  process.exitCode = await main();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
