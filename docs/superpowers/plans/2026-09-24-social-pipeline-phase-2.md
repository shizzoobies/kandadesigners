# Social Pipeline Phase 2: Release Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take an approved day folder from disk to a scheduled Metricool post and back to Already Released once it publishes: R2 upload, Metricool payloads, the release record, and reconcile.

**Architecture:** Three new library modules under `tools/lib/` (upload, payload plus release, reconcile) sit on the phase 1 manifest and validator. A thin `cloudflare.mjs` wraps wrangler with the API token and lets tests inject a fake runner. Metricool is reached by Claude through the MCP in a session: `release` prints exact payload packets, Claude makes the calls, and `release --record` writes the IDs back. Every command is safe to rerun and never leaves a folder half-moved.

**Tech Stack:** Node 24 ES modules, vitest 3, wrangler 4 as a dev dependency of `tools/` (run through `node node_modules/wrangler/bin/wrangler.js`, never a `.cmd` shim), Cloudflare R2 with a custom hostname, Metricool MCP tools `createScheduledPost` and `getScheduledPosts`.

Spec: `docs/superpowers/specs/2026-09-24-social-media-pipeline-design.md`. Phase 1 plan and ledger: `docs/superpowers/plans/2026-09-24-social-pipeline-phase-1.md`, `.superpowers/sdd/progress.md`.

## Global Constraints

- No em dashes (U+2014) in any file this plan creates or edits. The validator's em dash constant stays the `"\u2014"` escape.
- US English: color, center, gray.
- Media files are never committed. `config/r2.json` is committed and holds no secret. The API token is never written to any file, manifest, log, or report.
- Run vitest as `node node_modules/vitest/vitest.mjs run` from `tools/`, never `npx vitest`. Run wrangler as `node node_modules/wrangler/bin/wrangler.js`, never `npx wrangler`.
- Stage files by name. Never `git add -A` or `git add .`.
- Commit messages: imperative, no type prefix, ending with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- `manifest.mjs` is the only file that reads or writes `post.json`. `validate.mjs` never writes. `social.mjs` holds only argv parsing, dispatch, and printing.
- Only `approved` folders are uploaded or released. Scripts never set `approved`.
- R2 bucket `ka-social`, account `c8f0f7697e2801ba2acabb700b5da793`, zone `1995b308676149e70185aa8f7f7ce96d` for `ka-performancefl.com`, hostname `media.ka-performancefl.com`. Object key `<date>/<sha8>-<basename>`.
- Metricool brand `7076479`, timezone `America/New_York`. One Metricool post per non-manual network, always (the spec's "identical captions share a post" case is dropped for a single record shape).
- A folder moves to `Already Released` only after its manifest has been written.

## File Structure

```
Social Media Management/
  README.md                     updated: upload, release, reconcile, the release handoff
  tools/
    package.json                vitest 3, wrangler 4 dev dependencies
    config/r2.json              accountId, bucket, zoneId, hostname, publicBase
    social.mjs                  adds upload, release, reconcile
    lib/
      manifest.mjs              FLOW, stricter assertTransition, atomic write, listAllDayDirs
      validate.mjs              deferred fixes from the phase 1 final review
      plan.mjs                  case-insensitive reel file match
      calendar.mjs              tolerant of a broken manifest
      cloudflare.mjs            token lookup, wrangler runner, r2Put, r2Delete, publicUrl
      upload.mjs                uploadFolder
      payload.mjs               isoWithOffset, buildPayloads (pure)
      release.mjs               prepareRelease, recordRelease
      reconcile.mjs             uuidsIn, reconcile
    test/
      cli.test.mjs              spawns the CLI against a temp root
      cloudflare.test.mjs
      upload.test.mjs
      payload.test.mjs
      release.test.mjs
      reconcile.test.mjs
```

Responsibilities: `cloudflare.mjs` is the only file that knows about wrangler or the token. `upload.mjs` is the only writer of `r2`. `release.mjs` is the only writer of `metricool`. `reconcile.mjs` is the only thing that moves folders or sets `published`. `payload.mjs` is pure: manifest in, Metricool JSON out.

---

### Task 1: Deferred manifest and validator fixes, atomic writes, vitest 3

**Files:**
- Modify: `Social Media Management/tools/package.json`
- Modify: `Social Media Management/tools/lib/manifest.mjs`
- Modify: `Social Media Management/tools/lib/validate.mjs`
- Modify: `Social Media Management/tools/test/manifest.test.mjs`
- Modify: `Social Media Management/tools/test/validate.test.mjs`

**Interfaces:**
- Produces: `FLOW = ["planned", "generating", "ready", "approved", "scheduled", "published"]`, `STATUSES = [...FLOW, "native"]`, `assertTransition(from, to)` now also throws `unknown status "<from>"`, `already <status>` on a same-status call, and refuses `to === "native"`. `writeManifest` writes `post.json.tmp` then renames. `listAllDayDirs(root, bucket) -> string[]` returns every subdirectory, with or without `post.json`.
- Validator messages later tasks rely on: `timezone is missing`, `platforms must name at least one non-manual network`, `${file} has no role`.

- [ ] **Step 1: Bump vitest**

```powershell
Set-Location "D:\K & A Performance Site\Social Media Management\tools"; npm install -D vitest@3
```

Expected: `package.json` shows `"vitest": "^3..."`. Run `node node_modules/vitest/vitest.mjs run`; expected 54 passed (no behavior change).

- [ ] **Step 2: Write the failing manifest tests**

Append to `describe("manifest", ...)` in `test/manifest.test.mjs` and extend the import line to include `FLOW`, `listAllDayDirs`:

```js
  it("keeps native out of the flow and rejects unknown or same-status transitions", () => {
    expect(FLOW).toEqual(["planned", "generating", "ready", "approved", "scheduled", "published"]);
    expect(STATUSES).toEqual([...FLOW, "native"]);
    expect(() => assertTransition("bogus", "ready")).toThrow(/unknown status "bogus"/);
    expect(() => assertTransition("ready", "ready")).toThrow(/already ready/);
    expect(() => assertTransition("published", "native")).toThrow(/native/);
    expect(() => assertTransition("planned", "approved")).not.toThrow();
  });

  it("writes post.json atomically and leaves no temp file", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-01-05", baseManifest());
    writeManifest(dir, { ...baseManifest(), status: "ready" });
    expect(fs.existsSync(path.join(dir, "post.json.tmp"))).toBe(false);
    expect(readManifest(dir).status).toBe("ready");
  });

  it("lists every day directory, with or without post.json", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", baseManifest());
    fs.mkdirSync(path.join(root, TO_BE_RELEASED, "2026-01-06"));
    expect(listAllDayDirs(root).map((p) => path.basename(p))).toEqual(["2026-01-05", "2026-01-06"]);
    expect(listDayFolders(root).map((p) => path.basename(p))).toEqual(["2026-01-05"]);
  });
```

- [ ] **Step 3: Run to confirm failure**

```powershell
node node_modules/vitest/vitest.mjs run test/manifest.test.mjs
```

Expected: FAIL, `FLOW` and `listAllDayDirs` undefined.

- [ ] **Step 4: Implement in manifest.mjs**

Replace the `STATUSES` line, `writeManifest`, and `assertTransition`, and add `listAllDayDirs`:

```js
/** One way order. native sits outside it: set by hand, never changed by a script. */
export const FLOW = ["planned", "generating", "ready", "approved", "scheduled", "published"];
export const STATUSES = [...FLOW, "native"];

export function writeManifest(dir, manifest) {
  const target = path.join(dir, "post.json");
  const tmp = target + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2) + "\n");
  fs.renameSync(tmp, target);
}

export function assertTransition(from, to) {
  if (!STATUSES.includes(to)) throw new Error(`unknown status "${to}"`);
  if (from === "native" || to === "native") throw new Error("native is set by hand and never changes");
  if (!FLOW.includes(from)) throw new Error(`unknown status "${from}"`);
  const a = FLOW.indexOf(from);
  const b = FLOW.indexOf(to);
  if (a === b) throw new Error(`already ${from}`);
  if (b < a) throw new Error(`backward transition ${from} -> ${to}`);
}

/** Every subdirectory of the bucket, sorted, whether or not it has post.json. */
export function listAllDayDirs(root, bucket = TO_BE_RELEASED) {
  const base = path.join(root, bucket);
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(base, d.name))
    .sort();
}
```

- [ ] **Step 5: Run manifest tests**

Expected: 8 passed.

- [ ] **Step 6: Write the failing validator tests**

Append inside `describe("validateFolder", ...)` in `test/validate.test.mjs`:

```js
  it("requires a timezone string", () => {
    const m = baseManifest(); delete m.timezone;
    expect(validateFolder(day(m))).toContain("2026-01-05: timezone is missing");
  });

  it("requires at least one non-manual network on non-native folders", () => {
    expect(validateFolder(day({ platforms: {} }))).toContain("2026-01-05: platforms must name at least one non-manual network");
    expect(validateFolder(day({ platforms: { linkedin: { manual: true, caption: "linkedin.md" } } }))).toContain("2026-01-05: platforms must name at least one non-manual network");
  });

  it("requires a role on every media entry", () => {
    const m = baseManifest(); delete m.media[0].role;
    expect(validateFolder(day(m))).toContain("2026-01-05: media/reel-vertical.mp4 has no role");
  });

  it("reports the missing video even when the caption is missing", () => {
    const m = baseManifest(); m.media = [m.media[1]];
    const files = baseFiles(); delete files["facebook.md"];
    const problems = validateFolder(day(m, files));
    expect(problems).toContain("2026-01-05: facebook caption file facebook.md is missing or empty");
    expect(problems).toContain("2026-01-05: facebook REEL needs a video");
  });

  it("accepts an Instagram Story whose file holds only the first comment heading", () => {
    const m = baseManifest();
    m.platforms = { instagram: { type: "STORY", caption: "instagram.md" } };
    m.media = [{ file: "media/thumbnail.jpg", role: "image", origin: "human", alt: "A phone" }];
    const files = baseFiles({ "instagram.md": "\n## First comment\n\n#a\n" });
    expect(validateFolder(day(m, files))).toEqual([]);
  });

  it("requires a word boundary before AI in the disclosure", () => {
    const files = baseFiles({ "facebook.md": "Our Thai voice actor.\n", "instagram.md": "Narration is an AI voice.\n\n## First comment\n\n#a\n" });
    expect(validateFolder(day({ ai: { voice: true, visuals: false } }, files))).toContain("2026-01-05: facebook caption needs an AI disclosure line");
  });
```

- [ ] **Step 7: Run to confirm failure**

Expected: the six new tests fail; the existing 31 pass.

- [ ] **Step 8: Implement in validate.mjs**

Read the whole file first. Make these edits, keeping every existing message unchanged:

1. `AI_DISCLOSURE` becomes `/\bAI (narrated|voice|generated|assisted)/i`.
2. Timezone: before the `Intl` check, `if (typeof m.timezone !== "string" || !m.timezone) { tzValid = false; add("timezone is missing"); } else { ...existing try/catch... }`.
3. Platforms: after the shape checks and before the per-network loop, compute `const active = Object.entries(platforms).filter(([, cfg]) => cfg && typeof cfg === "object" && !cfg.manual);` and `if (active.length === 0) add("platforms must name at least one non-manual network");`.
4. Role: in the media loop, `if (entry.role === undefined) add(`${entry.file} has no role`); else if (!ROLES.includes(entry.role)) ...existing unknown role message...`.
5. Order: move the media rules for a network (`REEL`/`TRIAL_REEL` needs a video; Instagram needs an image or video; Story needs an image or video) to run before the caption is read, so a missing caption no longer hides them. The Story caption check and the Instagram split still run after the caption is read.
6. Instagram Story: when `network === "instagram"` and `type === "STORY"`, test `splitInstagram(raw).caption` for emptiness instead of `raw`, so a file holding only the heading is accepted.

- [ ] **Step 9: Run the full suite**

```powershell
node node_modules/vitest/vitest.mjs run
```

Expected: 63 passed (54 + 3 manifest + 6 validator). Zero literal U+2014 in both lib files: `grep -c $'\xe2\x80\x94' lib/manifest.mjs lib/validate.mjs` from Git Bash prints 0 for each.

- [ ] **Step 10: Commit**

```bash
cd "/d/K & A Performance Site"
git add "Social Media Management/tools/package.json" "Social Media Management/tools/package-lock.json" "Social Media Management/tools/lib/manifest.mjs" "Social Media Management/tools/lib/validate.mjs" "Social Media Management/tools/test/manifest.test.mjs" "Social Media Management/tools/test/validate.test.mjs"
git commit -m "Close the phase 1 review minors in manifest and validator

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: CLI hardening and CLI tests

**Files:**
- Modify: `Social Media Management/tools/social.mjs`
- Modify: `Social Media Management/tools/lib/plan.mjs`
- Modify: `Social Media Management/tools/lib/calendar.mjs`
- Modify: `Social Media Management/tools/test/calendar.test.mjs`
- Create: `Social Media Management/tools/test/cli.test.mjs`

**Interfaces:**
- Produces: `parse(argv, flags)` in `social.mjs` where `flags` is the set of boolean flag names; every other `--key` consumes the next token as its value. `validate --all` and bare `validate` iterate `listAllDayDirs`. `calendar` rows for a broken manifest get `status: "broken"`, `note: "cannot parse post.json"`. `--days` must be a positive integer or usage is printed. `plan --from` matches `.mp4` and `.srt` case-insensitively.

- [ ] **Step 1: Write the failing calendar tests**

In `test/calendar.test.mjs`, change the first test's window to `days: 5` and its expected rows to include `["2026-09-29", "Tue", "gap", ""]` as the last row. Add:

```js
  it("marks a folder with a broken manifest instead of crashing", () => {
    root = makeTempRoot();
    const dir = path.join(root, "To Be Released", "2026-09-28");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "post.json"), "{ nope");
    const rows = buildCalendar({ root, today: "2026-09-28", days: 1 });
    expect(rows[0]).toMatchObject({ date: "2026-09-28", status: "broken", note: "cannot parse post.json" });
  });
```

Add `import path from "node:path";` at the top.

- [ ] **Step 2: Write the failing CLI tests**

`test/cli.test.mjs`:

```js
import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "social.mjs");
let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

function run(args) {
  const res = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", env: { ...process.env, SOCIAL_ROOT: root } });
  return { code: res.status, out: res.stdout, err: res.stderr };
}

describe("cli", () => {
  it("plans a folder and reports what is missing", () => {
    root = makeTempRoot();
    const r = run(["plan", "2026-10-05", "--pillar", "tip", "--title", "Tab through your site"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("created");
    expect(r.out).toContain("facebook caption file facebook.md is missing or empty");
    expect(fs.existsSync(path.join(root, "To Be Released", "2026-10-05", "post.json"))).toBe(true);
  });

  it("rejects a flag used as a value without creating anything", () => {
    root = makeTempRoot();
    const r = run(["plan", "2026-10-05", "--pillar", "tip", "--title", "--sneaky"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("usage:");
    expect(fs.existsSync(path.join(root, "To Be Released", "2026-10-05"))).toBe(false);
  });

  it("validates every directory, including one without post.json", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", baseManifest(), baseFiles());
    fs.mkdirSync(path.join(root, "To Be Released", "2026-01-06"));
    const r = run(["validate"]);
    expect(r.code).toBe(1);
    expect(r.out).toContain("2026-01-06: post.json is missing");
    expect(r.out).toContain("1 problem(s) in 2 folder(s)");
  });

  it("keeps a positional after a boolean flag", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", baseManifest(), baseFiles());
    const r = run(["validate", "--all", "2026-01-05"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("1 folder(s) valid");
  });

  it("rejects a bad --days", () => {
    root = makeTempRoot();
    const r = run(["calendar", "--days", "abc"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("usage:");
  });
});
```

- [ ] **Step 3: Run to confirm failure**

```powershell
node node_modules/vitest/vitest.mjs run test/calendar.test.mjs test/cli.test.mjs
```

Expected: the gap-row assertion, the broken-manifest test, the "every directory" test, the boolean-flag test, and the `--days` test fail.

- [ ] **Step 4: Implement**

`social.mjs`: replace `parse` and the affected branches.

```js
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
```

In the `validate` branch, import `listAllDayDirs` and use it: `const dirs = !target || args.all ? listAllDayDirs(root) : [dayDir(root, target)];` but when both `--all` and a positional are given, the positional wins: `const dirs = target ? [dayDir(root, target)] : listAllDayDirs(root);`.

In the `calendar` branch:

```js
    const days = args.days === undefined ? 14 : Number(args.days);
    if (!Number.isInteger(days) || days < 1) { console.error(USAGE); return 1; }
```

`lib/calendar.mjs`, in the folder loop: wrap `readManifest(dir)` in try/catch; on failure push `{ name, m: null }` and, when building rows, emit `{ date: name.slice(0, 10), weekday, status: "broken", pillar: "", title: "", note: "cannot parse post.json" }`. Group such entries under `name.slice(0, 10)`.

`lib/plan.mjs`: in `copyReel`, match with `f.toLowerCase().endsWith(".mp4")` and `.srt` likewise.

- [ ] **Step 5: Run the full suite**

Expected: 69 passed (63 + 1 calendar + 5 CLI).

- [ ] **Step 6: Commit**

```bash
cd "/d/K & A Performance Site"
git add "Social Media Management/tools/social.mjs" "Social Media Management/tools/lib/plan.mjs" "Social Media Management/tools/lib/calendar.mjs" "Social Media Management/tools/test/calendar.test.mjs" "Social Media Management/tools/test/cli.test.mjs"
git commit -m "Harden the social CLI and add CLI tests

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Cloudflare wrapper, R2 config, bucket and hostname

**Files:**
- Modify: `Social Media Management/tools/package.json` (wrangler dev dependency)
- Create: `Social Media Management/tools/config/r2.json`
- Create: `Social Media Management/tools/lib/cloudflare.mjs`
- Create: `Social Media Management/tools/test/cloudflare.test.mjs`

**Interfaces:**
- Produces: `readR2Config(file?) -> { accountId, bucket, zoneId, hostname, publicBase }`, `apiToken(env?, platform?) -> string` (env first, then the Windows user-scope variable through PowerShell; throws when absent), `wrangler(args, { config, token, run }) -> stdout` (throws with stderr on nonzero exit), `r2Put(key, file, opts)`, `r2Delete(key, opts)`, `publicUrl(key, config) -> string`, `CONTENT_TYPES`.
- The token is passed to wrangler only through the child's environment and never appears in argv, stdout, or any file.

- [ ] **Step 1: Install wrangler and write the config**

```powershell
Set-Location "D:\K & A Performance Site\Social Media Management\tools"; npm install -D wrangler@4
```

`tools/config/r2.json`:

```json
{
  "accountId": "c8f0f7697e2801ba2acabb700b5da793",
  "bucket": "ka-social",
  "zoneId": "1995b308676149e70185aa8f7f7ce96d",
  "hostname": "media.ka-performancefl.com",
  "publicBase": "https://media.ka-performancefl.com"
}
```

- [ ] **Step 2: Write the failing tests**

`test/cloudflare.test.mjs`:

```js
import { describe, it, expect } from "vitest";
import path from "node:path";
import { apiToken, wrangler, r2Put, r2Delete, publicUrl, CONTENT_TYPES } from "../lib/cloudflare.mjs";

const config = { accountId: "acct", bucket: "ka-social", zoneId: "zone", hostname: "media.example.com", publicBase: "https://media.example.com" };

function fakeRun(status = 0, stdout = "ok", stderr = "") {
  const calls = [];
  const run = (cmd, args, opts) => { calls.push({ cmd, args, opts }); return { status, stdout, stderr }; };
  return { run, calls };
}

describe("cloudflare", () => {
  it("reads the token from the environment first", () => {
    expect(apiToken({ CLOUDFLARE_API_TOKEN: "abc" }, "linux")).toBe("abc");
    expect(() => apiToken({}, "linux")).toThrow(/CLOUDFLARE_API_TOKEN/);
  });

  it("runs wrangler with the token and account only in the child environment", () => {
    const { run, calls } = fakeRun();
    const out = wrangler(["r2", "bucket", "list"], { config, token: "secret", run });
    expect(out).toBe("ok");
    expect(calls[0].args.slice(-3)).toEqual(["r2", "bucket", "list"]);
    expect(calls[0].args.join(" ")).not.toContain("secret");
    expect(calls[0].opts.env.CLOUDFLARE_API_TOKEN).toBe("secret");
    expect(calls[0].opts.env.CLOUDFLARE_ACCOUNT_ID).toBe("acct");
  });

  it("throws with stderr when wrangler fails", () => {
    const { run } = fakeRun(1, "", "No access");
    expect(() => wrangler(["r2", "bucket", "list"], { config, token: "t", run })).toThrow(/No access/);
  });

  it("puts an object with the right key, file, and content type", () => {
    const { run, calls } = fakeRun();
    r2Put("2026-09-28/abcd1234-reel-vertical.mp4", path.join("D:", "x", "reel-vertical.mp4"), { config, token: "t", run });
    const a = calls[0].args;
    expect(a).toContain("ka-social/2026-09-28/abcd1234-reel-vertical.mp4");
    expect(a[a.indexOf("--content-type") + 1]).toBe("video/mp4");
    expect(a).toContain("--remote");
    expect(CONTENT_TYPES[".jpg"]).toBe("image/jpeg");
  });

  it("deletes an object and builds public urls", () => {
    const { run, calls } = fakeRun();
    r2Delete("2026-09-28/abcd1234-thumbnail.jpg", { config, token: "t", run });
    expect(calls[0].args).toContain("ka-social/2026-09-28/abcd1234-thumbnail.jpg");
    expect(publicUrl("2026-09-28/abcd1234-thumbnail.jpg", config)).toBe("https://media.example.com/2026-09-28/abcd1234-thumbnail.jpg");
  });
});
```

- [ ] **Step 3: Run to confirm failure**

Expected: module not found.

- [ ] **Step 4: Implement cloudflare.mjs**

```js
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const WRANGLER = path.resolve(here, "..", "node_modules", "wrangler", "bin", "wrangler.js");
const CONFIG_FILE = path.resolve(here, "..", "config", "r2.json");

export const CONTENT_TYPES = {
  ".mp4": "video/mp4", ".mov": "video/quicktime",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"
};

export function readR2Config(file = CONFIG_FILE) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * The Cloudflare API token. The environment wins. On Windows, shells started
 * by the desktop app inherit an old environment, so fall back to the user
 * scope variable through PowerShell. Never log or persist the value.
 */
export function apiToken(env = process.env, platform = process.platform) {
  if (env.CLOUDFLARE_API_TOKEN) return env.CLOUDFLARE_API_TOKEN;
  if (platform === "win32") {
    const out = execFileSync("powershell", ["-NoProfile", "-Command", "[Environment]::GetEnvironmentVariable('CLOUDFLARE_API_TOKEN','User')"], { encoding: "utf8" }).trim();
    if (out) return out;
  }
  throw new Error("CLOUDFLARE_API_TOKEN is not set");
}

/** Run wrangler and return stdout. The token travels only in the child environment. */
export function wrangler(args, { config = readR2Config(), token = apiToken(), run = spawnSync } = {}) {
  const res = run(process.execPath, [WRANGLER, ...args], {
    encoding: "utf8",
    env: { ...process.env, CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: config.accountId, WRANGLER_SEND_METRICS: "false" }
  });
  if (res.status !== 0) throw new Error(`wrangler ${args.slice(0, 3).join(" ")} failed: ${String(res.stderr || res.stdout || "").trim()}`);
  return res.stdout;
}

export function r2Put(key, file, opts = {}) {
  const config = opts.config || readR2Config();
  const ct = CONTENT_TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  return wrangler(["r2", "object", "put", `${config.bucket}/${key}`, "--file", file, "--content-type", ct, "--remote", "--force"], { ...opts, config });
}

export function r2Delete(key, opts = {}) {
  const config = opts.config || readR2Config();
  return wrangler(["r2", "object", "delete", `${config.bucket}/${key}`, "--remote", "--force"], { ...opts, config });
}

export function publicUrl(key, config = readR2Config()) {
  return `${config.publicBase}/${key}`;
}
```

- [ ] **Step 5: Run the tests**

Expected: 5 passed; full suite 74 passed.

- [ ] **Step 6: Create the bucket and connect the hostname (live, one time)**

From `D:\K & A Performance Site\Social Media Management\tools` in PowerShell. The token is read from the user scope so this works in an app shell:

```powershell
$env:CLOUDFLARE_API_TOKEN = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN","User"); $env:CLOUDFLARE_ACCOUNT_ID = "c8f0f7697e2801ba2acabb700b5da793"; node node_modules/wrangler/bin/wrangler.js r2 bucket create ka-social
```

Expected: `Created bucket 'ka-social'`. If it says the bucket exists, continue.

```powershell
node node_modules/wrangler/bin/wrangler.js r2 bucket domain add ka-social --domain media.ka-performancefl.com --zone-id 1995b308676149e70185aa8f7f7ce96d --min-tls 1.2 --force
```

Expected: a line saying the domain was connected. Then confirm:

```powershell
node node_modules/wrangler/bin/wrangler.js r2 bucket domain list ka-social
```

Expected: `media.ka-performancefl.com` with enabled `true`. Its status may read `pending` for a few minutes while the certificate issues.

- [ ] **Step 7: Prove public read with a probe object**

```powershell
"hello" | Out-File -Encoding ascii probe.txt; node node_modules/wrangler/bin/wrangler.js r2 object put ka-social/probe/hello.txt --file probe.txt --content-type text/plain --remote --force; Remove-Item probe.txt
```

Then poll (up to ten minutes, every 60 seconds) until this returns 200:

```powershell
curl.exe -s -o NUL -w "%{http_code}" https://media.ka-performancefl.com/probe/hello.txt
```

If it is still not 200 after ten minutes, enable the fallback and record it:

```powershell
node node_modules/wrangler/bin/wrangler.js r2 bucket dev-url enable ka-social --force
```

Set `publicBase` in `config/r2.json` to the printed `https://pub-....r2.dev` value and note in the commit message that the custom hostname is pending. Either way, delete the probe afterward:

```powershell
node node_modules/wrangler/bin/wrangler.js r2 object delete ka-social/probe/hello.txt --remote --force
```

Record the final HTTP code and which base URL is live in the report.

- [ ] **Step 8: Commit**

```bash
cd "/d/K & A Performance Site"
git add "Social Media Management/tools/package.json" "Social Media Management/tools/package-lock.json" "Social Media Management/tools/config/r2.json" "Social Media Management/tools/lib/cloudflare.mjs" "Social Media Management/tools/test/cloudflare.test.mjs"
git commit -m "Add the Cloudflare wrapper and the ka-social R2 bucket config

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Upload

**Files:**
- Create: `Social Media Management/tools/lib/upload.mjs`
- Create: `Social Media Management/tools/test/upload.test.mjs`
- Modify: `Social Media Management/tools/social.mjs`

**Interfaces:**
- Consumes: `readManifest`, `writeManifest` from `manifest.mjs`; `validateFolder` from `validate.mjs`; `r2Put`, `publicUrl`, `readR2Config` from `cloudflare.mjs`.
- Produces: `UPLOAD_ROLES = new Set(["video", "image", "thumbnail"])`, `sha256(file) -> hex`, `objectKey(date, file, sha) -> "<date>/<sha8>-<basename>"`, `uploadFolder(dir, { put, config, now, dryRun }) -> { name, skipped?, problems?, uploaded: string[], unchanged: string[] }`. Writes `r2[file] = { key, url, sha256, uploadedAt }` after each successful put. Sets `lastError` to `upload: <message>` and rethrows on failure. Never changes `status`.
- CLI: `upload [<folder>|--all] [--dry-run]`.

- [ ] **Step 1: Write the failing tests**

`test/upload.test.mjs`:

```js
import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { uploadFolder, objectKey, sha256 } from "../lib/upload.mjs";
import { readManifest } from "../lib/manifest.mjs";

const config = { accountId: "a", bucket: "ka-social", zoneId: "z", hostname: "media.example.com", publicBase: "https://media.example.com" };
const now = new Date("2026-09-27T12:00:00Z");
let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

function approvedDay(overrides = {}, files = baseFiles()) {
  root = makeTempRoot();
  return makeDay(root, "2026-01-05", baseManifest({ status: "approved", ...overrides }), files);
}

describe("uploadFolder", () => {
  it("uploads video and thumbnail, skips the srt, and records urls", () => {
    const dir = approvedDay();
    const puts = [];
    const r = uploadFolder(dir, { put: (key, file) => puts.push({ key, file }), config, now: new Date("2025-12-01T00:00:00Z") });
    expect(r.uploaded).toEqual(["media/reel-vertical.mp4", "media/thumbnail.jpg"]);
    expect(puts.map((p) => p.key)).toEqual([
      objectKey("2026-01-05", "media/reel-vertical.mp4", sha256(path.join(dir, "media/reel-vertical.mp4"))),
      objectKey("2026-01-05", "media/thumbnail.jpg", sha256(path.join(dir, "media/thumbnail.jpg")))
    ]);
    const m = readManifest(dir);
    expect(m.r2["media/reel-vertical.mp4"].url).toMatch(/^https:\/\/media\.example\.com\/2026-01-05\/[0-9a-f]{8}-reel-vertical\.mp4$/);
    expect(m.r2["media/reel-vertical.srt"]).toBeUndefined();
    expect(m.status).toBe("approved");
  });

  it("skips unchanged files on a rerun and re-uploads a changed one", () => {
    const dir = approvedDay();
    const later = new Date("2025-12-01T00:00:00Z");
    uploadFolder(dir, { put: () => {}, config, now: later });
    const puts = [];
    fs.writeFileSync(path.join(dir, "media/thumbnail.jpg"), Buffer.alloc(64, 1));
    const r = uploadFolder(dir, { put: (key) => puts.push(key), config, now: later });
    expect(r.unchanged).toEqual(["media/reel-vertical.mp4"]);
    expect(r.uploaded).toEqual(["media/thumbnail.jpg"]);
    expect(puts).toHaveLength(1);
  });

  it("refuses folders that are not approved or not valid", () => {
    root = makeTempRoot();
    const ready = makeDay(root, "2026-01-05", baseManifest({ status: "ready" }), baseFiles());
    expect(uploadFolder(ready, { put: () => { throw new Error("should not upload"); }, config }).skipped).toBe("status ready");
    const m = baseManifest({ status: "approved" }); m.media[1].alt = "";
    const invalid = makeDay(root, "2026-01-06", { ...m, id: "2026-01-06", date: "2026-01-06" }, baseFiles());
    const r = uploadFolder(invalid, { put: () => { throw new Error("should not upload"); }, config, now: new Date("2025-01-01T00:00:00Z") });
    expect(r.skipped).toBe("invalid");
    expect(r.problems[0]).toContain("needs alt text");
  });

  it("records the error and keeps what was uploaded before the failure", () => {
    const dir = approvedDay();
    let n = 0;
    expect(() => uploadFolder(dir, { put: () => { if (++n === 2) throw new Error("No access"); }, config, now: new Date("2025-12-01T00:00:00Z") })).toThrow(/No access/);
    const m = readManifest(dir);
    expect(m.lastError).toBe("upload: No access");
    expect(m.r2["media/reel-vertical.mp4"]).toBeDefined();
    expect(m.r2["media/thumbnail.jpg"]).toBeUndefined();
  });

  it("dry run uploads nothing and writes nothing", () => {
    const dir = approvedDay();
    const r = uploadFolder(dir, { put: () => { throw new Error("should not upload"); }, config, now: new Date("2025-12-01T00:00:00Z"), dryRun: true });
    expect(r.uploaded).toEqual(["media/reel-vertical.mp4", "media/thumbnail.jpg"]);
    expect(readManifest(dir).r2).toEqual({});
  });
});
```

Note: `baseManifest` uses date 2026-01-05, so an `approved` folder is "in the past" unless `now` is earlier. Every test passes a `now` in 2025 for that reason.

- [ ] **Step 2: Run to confirm failure**

Expected: module not found.

- [ ] **Step 3: Implement upload.mjs**

```js
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { readManifest, writeManifest } from "./manifest.mjs";
import { validateFolder } from "./validate.mjs";
import { r2Put, publicUrl, readR2Config } from "./cloudflare.mjs";

/** Roles that go to R2. Caption sidecars stay on disk; Metricool has no field for them. */
export const UPLOAD_ROLES = new Set(["video", "image", "thumbnail"]);

export function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

export function objectKey(date, file, sha) {
  return `${date}/${sha.slice(0, 8)}-${path.basename(file)}`;
}

/**
 * Push one approved folder's media to R2 and record the urls. Safe to rerun:
 * a file whose sha256 matches its record is skipped. put(key, absFile) is
 * injectable so tests never touch the network.
 */
export function uploadFolder(dir, { put = (key, file) => r2Put(key, file), config = readR2Config(), now = new Date(), dryRun = false } = {}) {
  const name = path.basename(dir);
  const problems = validateFolder(dir, { now });
  if (problems.length) return { name, skipped: "invalid", problems, uploaded: [], unchanged: [] };
  const m = readManifest(dir);
  if (m.status !== "approved") return { name, skipped: `status ${m.status}`, uploaded: [], unchanged: [] };

  m.r2 = m.r2 || {};
  const uploaded = [];
  const unchanged = [];
  for (const entry of m.media) {
    if (!UPLOAD_ROLES.has(entry.role)) continue;
    const abs = path.join(dir, entry.file);
    const sha = sha256(abs);
    const existing = m.r2[entry.file];
    if (existing && existing.sha256 === sha && !existing.deletedAt) { unchanged.push(entry.file); continue; }
    const key = objectKey(m.date, entry.file, sha);
    if (!dryRun) {
      try {
        put(key, abs);
      } catch (err) {
        m.lastError = `upload: ${err.message}`;
        writeManifest(dir, m);
        throw err;
      }
      m.r2[entry.file] = { key, url: publicUrl(key, config), sha256: sha, uploadedAt: now.toISOString() };
      m.lastError = null;
      writeManifest(dir, m);
    }
    uploaded.push(entry.file);
  }
  return { name, uploaded, unchanged };
}
```

- [ ] **Step 4: Add the CLI branch**

In `social.mjs`, import `uploadFolder` and add to `USAGE`:

```
  node tools/social.mjs upload [<folder name>|--all] [--dry-run]
```

Branch:

```js
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
```

- [ ] **Step 5: Run the full suite**

Expected: 79 passed.

- [ ] **Step 6: Commit**

```bash
cd "/d/K & A Performance Site"
git add "Social Media Management/tools/lib/upload.mjs" "Social Media Management/tools/test/upload.test.mjs" "Social Media Management/tools/social.mjs"
git commit -m "Add upload: approved media to R2 with content-addressed keys

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Metricool payloads (pure)

**Files:**
- Create: `Social Media Management/tools/lib/payload.mjs`
- Create: `Social Media Management/tools/test/payload.test.mjs`

**Interfaces:**
- Consumes: `readManifest`; `readCaption`, `splitInstagram`; `localToUtc` from `validate.mjs`.
- Produces: `isoWithOffset(date, time, timezone) -> "YYYY-MM-DDTHH:MM:SS+HH:MM"`, `buildPayloads(dir, { draft }) -> { [network]: { date, info } }` for every non-manual network. `info` follows the Metricool MCP `createScheduledPost` contract exactly: `autoPublish: true`, `descendants: []`, `draft`, `firstCommentText`, `hasNotReadNotes: false`, `media` (public urls of `video` and `image` roles, in manifest order), `mediaAltText` (same order), `providers: [{ network }]`, `publicationDate: { dateTime, timezone }`, `shortener: false`, `smartLinkData: { ids: [] }`, `text`, plus `facebookData: { type }` or `instagramData: { type, isAiGenerated }`. `videoThumbnailUrl` is set only when a video and a thumbnail exist and the type is Facebook `POST`/`REEL` or Instagram `REEL`/`TRIAL_REEL`. A Story sends no `text` and no `firstCommentText`. Throws `<file> has no R2 url; run upload first` when a needed url is missing.

- [ ] **Step 1: Write the failing tests**

`test/payload.test.mjs`:

```js
import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { buildPayloads, isoWithOffset } from "../lib/payload.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

const r2 = {
  "media/reel-vertical.mp4": { key: "k1", url: "https://media.example.com/2026-01-05/aaaaaaaa-reel-vertical.mp4", sha256: "x", uploadedAt: "t" },
  "media/thumbnail.jpg": { key: "k2", url: "https://media.example.com/2026-01-05/bbbbbbbb-thumbnail.jpg", sha256: "y", uploadedAt: "t" }
};

function uploadedDay(overrides = {}, files = baseFiles()) {
  root = makeTempRoot();
  return makeDay(root, "2026-01-05", baseManifest({ status: "approved", r2, ai: { voice: true, visuals: false }, ...overrides }), files);
}

describe("payload", () => {
  it("formats the date with the New York offset", () => {
    expect(isoWithOffset("2026-09-28", "09:00", "America/New_York")).toBe("2026-09-28T09:00:00-04:00");
    expect(isoWithOffset("2026-12-15", "09:00", "America/New_York")).toBe("2026-12-15T09:00:00-05:00");
  });

  it("builds one payload per network with the right media, text, and flags", () => {
    const p = buildPayloads(uploadedDay(), { draft: true });
    expect(Object.keys(p)).toEqual(["facebook", "instagram"]);
    expect(p.facebook.date).toBe("2026-01-05T09:00:00-05:00");
    expect(p.facebook.info).toMatchObject({
      autoPublish: true, draft: true, firstCommentText: "", hasNotReadNotes: false,
      media: ["https://media.example.com/2026-01-05/aaaaaaaa-reel-vertical.mp4"],
      mediaAltText: [""],
      providers: [{ network: "facebook" }],
      publicationDate: { dateTime: "2026-01-05T09:00:00", timezone: "America/New_York" },
      shortener: false, smartLinkData: { ids: [] },
      text: "Five real websites in fifteen seconds. ka-performancefl.com",
      videoThumbnailUrl: "https://media.example.com/2026-01-05/bbbbbbbb-thumbnail.jpg",
      facebookData: { type: "REEL" }
    });
    expect(p.facebook.info.instagramData).toBeUndefined();
    expect(p.instagram.info).toMatchObject({
      text: "Five real websites in fifteen seconds. Link in bio.",
      firstCommentText: "#GainesvilleFL #WebDesign",
      providers: [{ network: "instagram" }],
      instagramData: { type: "REEL", isAiGenerated: true }
    });
    expect(p.instagram.info.facebookData).toBeUndefined();
  });

  it("skips manual networks and the thumbnail when the type does not take one", () => {
    const m = baseManifest({ status: "approved", r2 });
    m.platforms = { facebook: { type: "STORY", caption: "facebook.md" }, linkedin: { manual: true, caption: "linkedin.md" } };
    const files = baseFiles(); delete files["facebook.md"];
    const p = buildPayloads(uploadedDay(m, files));
    expect(Object.keys(p)).toEqual(["facebook"]);
    expect(p.facebook.info.text).toBeUndefined();
    expect(p.facebook.info.firstCommentText).toBeUndefined();
    expect(p.facebook.info.videoThumbnailUrl).toBeUndefined();
    expect(p.facebook.info.facebookData).toEqual({ type: "STORY" });
  });

  it("fails clearly when a url is missing", () => {
    expect(() => buildPayloads(uploadedDay({ r2: {} }))).toThrow("media/reel-vertical.mp4 has no R2 url; run upload first");
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Expected: module not found.

- [ ] **Step 3: Implement payload.mjs**

```js
import { readManifest } from "./manifest.mjs";
import { readCaption, splitInstagram } from "./captions.mjs";
import { localToUtc } from "./validate.mjs";

/** Network and type pairs where Metricool accepts a custom video cover. */
const THUMB_TYPES = { facebook: ["POST", "REEL"], instagram: ["REEL", "TRIAL_REEL"] };

/** Local wall time as ISO 8601 with the zone's offset, the format Metricool's date parameter wants. */
export function isoWithOffset(date, time, timezone) {
  const utc = localToUtc(date, time, timezone);
  const asIfUtc = new Date(`${date}T${time}:00Z`);
  const offsetMin = Math.round((asIfUtc - utc) / 60000);
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${date}T${time}:00${sign}${hh}:${mm}`;
}

/** One Metricool createScheduledPost payload per non-manual network. Pure: reads the folder, calls nothing. */
export function buildPayloads(dir, { draft = false } = {}) {
  const m = readManifest(dir);
  const r2 = m.r2 || {};
  const urlOf = (entry) => {
    const rec = r2[entry.file];
    if (!rec || !rec.url) throw new Error(`${entry.file} has no R2 url; run upload first`);
    return rec.url;
  };
  const shown = m.media.filter((e) => e.role === "video" || e.role === "image");
  const thumb = m.media.find((e) => e.role === "thumbnail");
  const media = shown.map(urlOf);
  const mediaAltText = shown.map((e) => e.alt || "");
  const hasVideo = shown.some((e) => e.role === "video");
  const aiFlag = Boolean(m.ai && (m.ai.voice || m.ai.visuals));

  const out = {};
  for (const [network, cfg] of Object.entries(m.platforms)) {
    if (cfg.manual) continue;
    const type = cfg.type || "POST";
    const raw = cfg.caption ? readCaption(dir, cfg.caption) || "" : "";
    let text = raw;
    let firstCommentText = "";
    if (network === "instagram") ({ caption: text, firstComment: firstCommentText } = splitInstagram(raw));

    const info = {
      autoPublish: true,
      descendants: [],
      draft,
      firstCommentText,
      hasNotReadNotes: false,
      media,
      mediaAltText,
      providers: [{ network }],
      publicationDate: { dateTime: `${m.date}T${m.time}:00`, timezone: m.timezone },
      shortener: false,
      smartLinkData: { ids: [] },
      text
    };
    if (type === "STORY") { delete info.text; delete info.firstCommentText; }
    if (hasVideo && thumb && THUMB_TYPES[network].includes(type)) info.videoThumbnailUrl = urlOf(thumb);
    if (network === "facebook") info.facebookData = { type };
    if (network === "instagram") info.instagramData = { type, isAiGenerated: aiFlag };
    out[network] = { date: isoWithOffset(m.date, m.time, m.timezone), info };
  }
  return out;
}
```

- [ ] **Step 4: Run the tests**

Expected: 4 passed; full suite 83 passed.

- [ ] **Step 5: Commit**

```bash
cd "/d/K & A Performance Site"
git add "Social Media Management/tools/lib/payload.mjs" "Social Media Management/tools/test/payload.test.mjs"
git commit -m "Add the Metricool payload builder

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Release packets and the record step

**Files:**
- Create: `Social Media Management/tools/lib/release.mjs`
- Create: `Social Media Management/tools/test/release.test.mjs`
- Modify: `Social Media Management/tools/social.mjs`

**Interfaces:**
- Consumes: `readManifest`, `writeManifest`, `assertTransition`; `validateFolder`; `buildPayloads`; `UPLOAD_ROLES` from `upload.mjs`.
- Produces: `prepareRelease(dir, { draft, now }) -> { name, skipped?, problems?, packets: [{ folder, network, date, info }] }`. Requires status `approved` and an `r2` record for every uploadable media entry (else `skipped: "media not uploaded"`). Writes `metricool[network] = { ...existing, payload: { date, info }, draft }` for every non-manual network and returns packets only for networks without an `id`. `recordRelease(dir, { network, id, uuid, now }) -> { name, status }`: throws if `metricool[network].payload` is absent; sets `id`, `uuid`, `scheduledAt`; when every non-manual network has an `id`, moves status to `scheduled` through `assertTransition`.
- CLI: `release [<folder>|--all] [--draft] [--dry-run]` prints one JSON packet per line after a header; `release --record <folder> --network <n> --id <id> --uuid <uuid>`.

- [ ] **Step 1: Write the failing tests**

`test/release.test.mjs`:

```js
import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { prepareRelease, recordRelease } from "../lib/release.mjs";
import { readManifest } from "../lib/manifest.mjs";

const r2 = {
  "media/reel-vertical.mp4": { key: "k1", url: "https://media.example.com/a.mp4", sha256: "x", uploadedAt: "t" },
  "media/thumbnail.jpg": { key: "k2", url: "https://media.example.com/b.jpg", sha256: "y", uploadedAt: "t" }
};
const early = new Date("2025-01-01T00:00:00Z");
let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

function uploadedDay(overrides = {}) {
  root = makeTempRoot();
  return makeDay(root, "2026-01-05", baseManifest({ status: "approved", r2, ...overrides }), baseFiles());
}

describe("release", () => {
  it("writes payloads and returns a packet per network", () => {
    const dir = uploadedDay();
    const r = prepareRelease(dir, { draft: true, now: early });
    expect(r.packets.map((p) => p.network)).toEqual(["facebook", "instagram"]);
    expect(r.packets[0]).toMatchObject({ folder: "2026-01-05", network: "facebook", date: "2026-01-05T09:00:00-05:00" });
    expect(r.packets[0].info.draft).toBe(true);
    const m = readManifest(dir);
    expect(m.metricool.facebook.payload.info.providers).toEqual([{ network: "facebook" }]);
    expect(m.metricool.instagram.draft).toBe(true);
    expect(m.status).toBe("approved");
  });

  it("skips folders that are not approved or not uploaded", () => {
    expect(prepareRelease(uploadedDay({ status: "ready" }), { now: early }).skipped).toBe("status ready");
    expect(prepareRelease(uploadedDay({ r2: {} }), { now: early }).skipped).toBe("media not uploaded");
  });

  it("records ids per network and schedules once every network is recorded", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { now: early });
    const now = new Date("2025-12-01T10:00:00Z");
    let r = recordRelease(dir, { network: "facebook", id: "111", uuid: "u-111", now });
    expect(r.status).toBe("approved");
    expect(readManifest(dir).metricool.facebook).toMatchObject({ id: "111", uuid: "u-111", scheduledAt: "2025-12-01T10:00:00.000Z" });
    r = recordRelease(dir, { network: "instagram", id: "222", uuid: "u-222", now });
    expect(r.status).toBe("scheduled");
    expect(readManifest(dir).status).toBe("scheduled");
    expect(prepareRelease(dir, { now: early }).skipped).toBe("status scheduled");
  });

  it("returns packets only for networks still without an id", () => {
    const dir = uploadedDay();
    prepareRelease(dir, { now: early });
    recordRelease(dir, { network: "facebook", id: "111", uuid: "u-111" });
    const r = prepareRelease(dir, { now: early });
    expect(r.packets.map((p) => p.network)).toEqual(["instagram"]);
  });

  it("refuses to record a network with no prepared payload", () => {
    const dir = uploadedDay();
    expect(() => recordRelease(dir, { network: "facebook", id: "1", uuid: "u" })).toThrow(/no prepared payload/);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Expected: module not found.

- [ ] **Step 3: Implement release.mjs**

```js
import path from "node:path";
import { readManifest, writeManifest, assertTransition } from "./manifest.mjs";
import { validateFolder } from "./validate.mjs";
import { buildPayloads } from "./payload.mjs";
import { UPLOAD_ROLES } from "./upload.mjs";

function activeNetworks(m) {
  return Object.entries(m.platforms).filter(([, cfg]) => !cfg.manual).map(([n]) => n);
}

/** Build and store the Metricool payloads for one approved, uploaded folder. Returns the packets Claude still has to send. */
export function prepareRelease(dir, { draft = false, now = new Date() } = {}) {
  const name = path.basename(dir);
  const problems = validateFolder(dir, { now });
  if (problems.length) return { name, skipped: "invalid", problems, packets: [] };
  const m = readManifest(dir);
  if (m.status !== "approved") return { name, skipped: `status ${m.status}`, packets: [] };
  const r2 = m.r2 || {};
  const missing = m.media.filter((e) => UPLOAD_ROLES.has(e.role) && !(r2[e.file] && r2[e.file].url));
  if (missing.length) return { name, skipped: "media not uploaded", packets: [] };

  const payloads = buildPayloads(dir, { draft });
  m.metricool = m.metricool || {};
  const packets = [];
  for (const network of activeNetworks(m)) {
    const existing = m.metricool[network] || {};
    m.metricool[network] = { ...existing, payload: payloads[network], draft };
    if (!existing.id) packets.push({ folder: name, network, ...payloads[network] });
  }
  m.lastError = null;
  writeManifest(dir, m);
  return { name, packets };
}

/** Write the Metricool id and uuid Claude got back for one network. Schedules the folder once every network has one. */
export function recordRelease(dir, { network, id, uuid, now = new Date() }) {
  const name = path.basename(dir);
  const m = readManifest(dir);
  const rec = m.metricool && m.metricool[network];
  if (!rec || !rec.payload) throw new Error(`${name}: ${network} has no prepared payload; run release first`);
  m.metricool[network] = { ...rec, id: String(id), uuid: String(uuid), scheduledAt: now.toISOString() };
  const done = activeNetworks(m).every((n) => m.metricool[n] && m.metricool[n].id);
  if (done && m.status !== "scheduled") {
    assertTransition(m.status, "scheduled");
    m.status = "scheduled";
  }
  m.lastError = null;
  writeManifest(dir, m);
  return { name, status: m.status };
}
```

- [ ] **Step 4: Add the CLI branches**

Add to `USAGE`:

```
  node tools/social.mjs release [<folder name>|--all] [--draft] [--dry-run]
  node tools/social.mjs release --record <folder name> --network facebook|instagram --id <id> --uuid <uuid>
```

Branch (import `prepareRelease`, `recordRelease`):

```js
  if (command === "release") {
    const isText = (v) => typeof v === "string" && v.length > 0;
    if (args.record !== undefined) {
      if (!isText(args.record) || !isText(args.network) || !isText(args.id) || !isText(args.uuid)) { console.error(USAGE); return 1; }
      const r = recordRelease(dayDir(root, args.record), { network: args.network, id: args.id, uuid: args.uuid });
      console.log(`${r.name}: recorded ${args.network}, status ${r.status}`);
      return 0;
    }
    const target = args._[0];
    const dirs = target ? [dayDir(root, target)] : listDayFolders(root);
    const packets = [];
    for (const dir of dirs) {
      const r = args["dry-run"]
        ? { name: path.basename(dir), packets: [], skipped: "dry run" }
        : prepareRelease(dir, { draft: Boolean(args.draft) });
      if (r.skipped) { console.log(`${r.name}: skipped (${r.skipped})`); for (const p of r.problems || []) console.log(`  ${p}`); continue; }
      packets.push(...r.packets);
    }
    console.log(`${packets.length} packet(s) to send through Metricool. For each one call createScheduledPost with blogId 7076479, the date, and info as a JSON string, then run release --record.`);
    for (const p of packets) console.log(JSON.stringify(p));
    return 0;
  }
```

Note that `--record` takes a value, so it is not in `FLAGS`; `--draft` and `--dry-run` are.

- [ ] **Step 5: Run the full suite**

Expected: 88 passed.

- [ ] **Step 6: Commit**

```bash
cd "/d/K & A Performance Site"
git add "Social Media Management/tools/lib/release.mjs" "Social Media Management/tools/test/release.test.mjs" "Social Media Management/tools/social.mjs"
git commit -m "Add release: Metricool packets per network and the record step

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Reconcile

**Files:**
- Create: `Social Media Management/tools/lib/reconcile.mjs`
- Create: `Social Media Management/tools/test/reconcile.test.mjs`
- Modify: `Social Media Management/tools/social.mjs`

**Interfaces:**
- Consumes: `listDayFolders`, `readManifest`, `writeManifest`, `assertTransition`; `localToUtc`; `r2Delete`; `ALREADY_RELEASED`, `TO_BE_RELEASED`.
- Produces: `uuidsIn(response) -> Set<string>` collecting every top-level `uuid` and `id` string of each item in `response.data` (or of `response` when it is an array), `reconcile({ root, response, now, del, dryRun, retentionDays = 7 }) -> { published: string[], waiting: string[], deleted: [{ folder, key }] }`. A `scheduled` folder becomes `published` when its post time has passed and none of its recorded uuids is in the set; the manifest is written first, then the folder is renamed into Already Released (throws if the target exists). Then every Already Released folder whose `published.at` is older than `retentionDays` has its R2 objects deleted and each record gets `deletedAt`.
- CLI: `reconcile --from <file> [--dry-run] [--now YYYY-MM-DDTHH:MM:SSZ]`.

- [ ] **Step 1: Write the failing tests**

`test/reconcile.test.mjs`:

```js
import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { reconcile, uuidsIn } from "../lib/reconcile.mjs";
import { readManifest } from "../lib/manifest.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

function scheduledDay(name = "2026-01-05", extra = {}) {
  return baseManifest({
    id: name, date: name.slice(0, 10), status: "scheduled",
    r2: { "media/reel-vertical.mp4": { key: `${name}/aaaaaaaa-reel-vertical.mp4`, url: "u", sha256: "x", uploadedAt: "t" } },
    metricool: {
      facebook: { payload: {}, id: "1", uuid: "fb-1", scheduledAt: "t" },
      instagram: { payload: {}, id: "2", uuid: "ig-2", scheduledAt: "t" }
    },
    ...extra
  });
}

describe("reconcile", () => {
  it("collects uuids and ids from a Metricool response", () => {
    expect([...uuidsIn({ data: [{ id: 5, uuid: "a" }, { uuid: "b" }] })]).toEqual(["5", "a", "b"]);
    expect([...uuidsIn([{ id: "7" }])]).toEqual(["7"]);
  });

  it("publishes a folder whose posts are gone and whose time has passed", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", scheduledDay(), baseFiles());
    const r = reconcile({ root, response: { data: [] }, now: new Date("2026-01-05T15:00:00Z"), del: () => {} });
    expect(r.published).toEqual(["2026-01-05"]);
    const moved = path.join(root, "Already Released", "2026-01-05");
    expect(fs.existsSync(moved)).toBe(true);
    expect(fs.existsSync(path.join(root, "To Be Released", "2026-01-05"))).toBe(false);
    const m = readManifest(moved);
    expect(m.status).toBe("published");
    expect(m.published.at).toBe("2026-01-05T14:00:00.000Z");
  });

  it("waits while a post is still scheduled or the time has not passed", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", scheduledDay(), baseFiles());
    const still = reconcile({ root, response: { data: [{ uuid: "ig-2" }] }, now: new Date("2026-01-05T15:00:00Z"), del: () => {} });
    expect(still.waiting).toEqual(["2026-01-05"]);
    const early = reconcile({ root, response: { data: [] }, now: new Date("2026-01-05T13:00:00Z"), del: () => {} });
    expect(early.waiting).toEqual(["2026-01-05"]);
    expect(readManifest(path.join(root, "To Be Released", "2026-01-05")).status).toBe("scheduled");
  });

  it("deletes R2 objects a week after publishing, once", () => {
    root = makeTempRoot();
    const m = scheduledDay("2026-01-05", { status: "published", published: { at: "2026-01-05T14:00:00.000Z" } });
    makeDay(root, "2026-01-05", m, {}, "Already Released");
    const deleted = [];
    const del = (key) => deleted.push(key);
    let r = reconcile({ root, response: { data: [] }, now: new Date("2026-01-10T00:00:00Z"), del });
    expect(r.deleted).toEqual([]);
    r = reconcile({ root, response: { data: [] }, now: new Date("2026-01-13T00:00:00Z"), del });
    expect(r.deleted).toEqual([{ folder: "2026-01-05", key: "2026-01-05/aaaaaaaa-reel-vertical.mp4" }]);
    const rec = readManifest(path.join(root, "Already Released", "2026-01-05")).r2["media/reel-vertical.mp4"];
    expect(rec.deletedAt).toBe("2026-01-13T00:00:00.000Z");
    r = reconcile({ root, response: { data: [] }, now: new Date("2026-01-14T00:00:00Z"), del });
    expect(deleted).toHaveLength(1);
  });

  it("dry run moves and deletes nothing", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-05", scheduledDay(), baseFiles());
    const r = reconcile({ root, response: { data: [] }, now: new Date("2026-01-05T15:00:00Z"), del: () => { throw new Error("no"); }, dryRun: true });
    expect(r.published).toEqual(["2026-01-05"]);
    expect(fs.existsSync(path.join(root, "To Be Released", "2026-01-05"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Expected: module not found.

- [ ] **Step 3: Implement reconcile.mjs**

```js
import fs from "node:fs";
import path from "node:path";
import { TO_BE_RELEASED, ALREADY_RELEASED } from "./paths.mjs";
import { listDayFolders, readManifest, writeManifest, assertTransition } from "./manifest.mjs";
import { localToUtc } from "./validate.mjs";
import { r2Delete } from "./cloudflare.mjs";

/** Every top-level uuid and id of the items in a getScheduledPosts response. */
export function uuidsIn(response) {
  const items = Array.isArray(response) ? response : (response && Array.isArray(response.data) ? response.data : []);
  const out = new Set();
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    for (const k of ["id", "uuid"]) if (item[k] !== undefined && item[k] !== null) out.add(String(item[k]));
  }
  return out;
}

function recordedUuids(m) {
  return Object.values(m.metricool || {}).flatMap((rec) => [rec.uuid, rec.id]).filter(Boolean).map(String);
}

/**
 * Move scheduled folders that have published, then clean up old R2 objects.
 * response is the raw JSON Claude saved from getScheduledPosts. del(key) is injectable.
 */
export function reconcile({ root, response, now = new Date(), del = (key) => r2Delete(key), dryRun = false, retentionDays = 7 }) {
  const stillScheduled = uuidsIn(response);
  const published = [];
  const waiting = [];

  for (const dir of listDayFolders(root, TO_BE_RELEASED)) {
    const m = readManifest(dir);
    if (m.status !== "scheduled") continue;
    const name = path.basename(dir);
    const mine = recordedUuids(m);
    const postTime = localToUtc(m.date, m.time, m.timezone);
    const gone = mine.length > 0 && !mine.some((u) => stillScheduled.has(u));
    if (postTime > now || !gone) { waiting.push(name); continue; }
    published.push(name);
    if (dryRun) continue;
    assertTransition(m.status, "published");
    m.status = "published";
    m.published = { at: postTime.toISOString() };
    for (const n of Object.keys(m.metricool || {})) m.published[n] = { permalink: "" };
    m.lastError = null;
    writeManifest(dir, m);
    const target = path.join(root, ALREADY_RELEASED, name);
    if (fs.existsSync(target)) throw new Error(`${name}: already exists in ${ALREADY_RELEASED}`);
    fs.renameSync(dir, target);
  }

  const deleted = [];
  const cutoff = now.getTime() - retentionDays * 86400000;
  for (const dir of listDayFolders(root, ALREADY_RELEASED)) {
    const m = readManifest(dir);
    if (!m.published || !m.published.at || new Date(m.published.at).getTime() > cutoff) continue;
    const name = path.basename(dir);
    for (const [file, rec] of Object.entries(m.r2 || {})) {
      if (!rec.key || rec.deletedAt) continue;
      deleted.push({ folder: name, key: rec.key });
      if (dryRun) continue;
      del(rec.key);
      m.r2[file] = { ...rec, deletedAt: now.toISOString() };
      writeManifest(dir, m);
    }
  }

  return { published, waiting, deleted };
}
```

- [ ] **Step 4: Add the CLI branch**

Add to `USAGE`:

```
  node tools/social.mjs reconcile --from <getScheduledPosts.json> [--dry-run] [--now <ISO>]
```

Branch (import `reconcile`, and `fs`):

```js
  if (command === "reconcile") {
    if (typeof args.from !== "string") { console.error(USAGE); return 1; }
    const response = JSON.parse(fs.readFileSync(args.from, "utf8"));
    const now = typeof args.now === "string" ? new Date(args.now) : new Date();
    if (Number.isNaN(now.getTime())) { console.error(USAGE); return 1; }
    const r = reconcile({ root, response, now, dryRun: Boolean(args["dry-run"]) });
    const verb = args["dry-run"] ? "would publish" : "published";
    console.log(`${verb}: ${r.published.join(", ") || "none"}`);
    console.log(`waiting: ${r.waiting.join(", ") || "none"}`);
    console.log(`${args["dry-run"] ? "would delete" : "deleted"} ${r.deleted.length} R2 object(s)`);
    return 0;
  }
```

- [ ] **Step 5: Run the full suite**

Expected: 93 passed.

- [ ] **Step 6: Commit**

```bash
cd "/d/K & A Performance Site"
git add "Social Media Management/tools/lib/reconcile.mjs" "Social Media Management/tools/test/reconcile.test.mjs" "Social Media Management/tools/social.mjs"
git commit -m "Add reconcile: publish detection, archive move, and R2 cleanup

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: README, spec alignment, and the live draft test

This task is run by the controller (Claude in the session), not a subagent, because the Metricool calls go through the MCP.

**Files:**
- Modify: `Social Media Management/README.md`
- Modify: `docs/superpowers/specs/2026-09-24-social-media-pipeline-design.md`

- [ ] **Step 1: README**

Add a "Release path" section after Commands:

```markdown
## Release path

Once a folder is `approved`:

1. `node tools/social.mjs upload 2026-09-28` pushes its video and images to
   R2 and writes the public urls into `post.json`. Rerunning it skips files
   that have not changed.
2. `node tools/social.mjs release 2026-09-28 --draft` writes one Metricool
   payload per network into `post.json` and prints one packet per line.
   Claude sends each packet with the Metricool MCP (`createScheduledPost`,
   brand 7076479) and records what comes back:
   `node tools/social.mjs release --record 2026-09-28 --network facebook --id <id> --uuid <uuid>`.
   The folder becomes `scheduled` once every network is recorded. Drop
   `--draft` once the previews in Metricool have been checked.
3. After post time, Claude saves the `getScheduledPosts` response to a file
   and runs `node tools/social.mjs reconcile --from <file>`. Folders whose
   posts are no longer scheduled move to `Already Released/`. R2 objects are
   deleted a week after publishing.

`upload` and `release` take `--dry-run`. `reconcile` takes `--dry-run` and
`--now <ISO>` for testing.

R2 settings live in `tools/config/r2.json`. The Cloudflare token is read from
`CLOUDFLARE_API_TOKEN`, or on Windows from the user scope variable of that
name. It is never written anywhere.
```

Update the status bullet to say `scheduled` and `published` are set by `release --record` and `reconcile`.

- [ ] **Step 2: Spec alignment**

In the spec, change the release section to say one Metricool post per non-manual network, always (drop the identical-captions case), and note that caption sidecars are not uploaded. Check `grep -c "—"` prints 0.

- [ ] **Step 3: Live draft test**

Create a throwaway folder well ahead of the calendar:

```powershell
Set-Location "D:\K & A Performance Site\Social Media Management"; node tools/social.mjs plan 2026-12-15 --pillar tip --title "Pipeline draft test" --type POST
```

Put a real image in `To Be Released/2026-12-15/media/test.png` (any 1080x1080 PNG from `Reels/kap-reel/out/` works), set its manifest media to one `image` entry with alt text and origin `human`, and write one-line captions: Facebook `Pipeline test post. This is a draft and will be deleted.` and Instagram the same line plus the first-comment heading with `#test`. Ask Alex to set `status` to `approved` (scripts never do). Then:

```powershell
node tools/social.mjs validate 2026-12-15; node tools/social.mjs upload 2026-12-15; node tools/social.mjs release 2026-12-15 --draft
```

Send each printed packet through the MCP `createScheduledPost` with `blogId` `7076479`, `date` from the packet, and `info` as a JSON string. Record each returned `id` and `uuid` with `release --record`. Confirm the folder is `scheduled`. Call `getScheduledPosts` for December 2026, save the raw response to the scratchpad, and record its item shape (which keys hold the id and uuid) in the README's release section if it differs from `id`/`uuid`. Run `reconcile --from <file> --dry-run` and confirm the folder is listed under waiting. Ask Alex to delete the two drafts in Metricool's calendar. Re-pull, save, and run `reconcile --from <file> --now 2026-12-16T00:00:00Z`; the folder should move to Already Released. Then delete the throwaway folder from Already Released and its R2 objects by hand (`r2Delete` via a one-off `node -e` or `wrangler r2 object delete`), and confirm `git status` shows nothing to commit from it.

- [ ] **Step 4: Commit**

```bash
cd "/d/K & A Performance Site"
git add "Social Media Management/README.md" "docs/superpowers/specs/2026-09-24-social-media-pipeline-design.md"
git commit -m "Document the release path and align the spec with one post per network

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## What phase 2 leaves for Alex

- Approve the four reel days by changing `ready` to `approved` when you're happy with them. The first release goes in as Metricool drafts; check the previews there, then the next release runs without `--draft`.
- Decide whether to connect the LinkedIn company page to Metricool. Until then LinkedIn stays manual.
- Phase 3 (ElevenLabs narration, images, and reel renders into day folders) is the next plan.
