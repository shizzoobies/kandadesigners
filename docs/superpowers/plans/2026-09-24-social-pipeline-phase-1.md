# Social Pipeline Phase 1: Contract and Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the day-folder contract, the `plan`, `validate`, and `calendar` commands, and populate To Be Released with the two native placeholders and the four finished reels for the week of 2026-09-28.

**Architecture:** A dependency-free Node toolset in `Social Media Management/tools/` reads and writes `post.json` manifests in day folders. Pure library modules under `tools/lib/` take a folder path and return data or a list of problems; `tools/social.mjs` is the only file that parses argv and prints. Tests run against temporary folders created per test, never against the real calendar.

**Tech Stack:** Node 24 (ES modules, `node:fs`, `node:path`, `node:test` is NOT used), vitest ^2.1.0 (matching the admin project), no other dependencies.

Spec: `docs/superpowers/specs/2026-09-24-social-media-pipeline-design.md`.

## Global Constraints

- No em dashes (U+2014) in any file this plan creates: code comments, README, captions, manifests, test strings.
- US English: color, center, gray.
- "K&A" is written "K and A" in any text sent to a voice model. On screen and in captions it stays K&A.
- Any post with `ai.voice` or `ai.visuals` true has a disclosure line in both captions.
- Real clients only. The four reels package only content already cleared in `Reels/`.
- Media files (mp4, jpg, srt) are never committed to git. Manifests and captions are.
- The project path contains an ampersand, which breaks `node_modules/.bin/*.cmd` shims. Always run vitest as `node node_modules/vitest/vitest.mjs run` from `tools/`, never `npx vitest`.
- Stage files by name. Never `git add -A` or `git add .` in this repo; sibling sessions commit at the same time.
- Commit messages: imperative, no type prefix (matches `git log`), ending with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Timezone for every date in this plan is `America/New_York`.

## File Structure

```
Social Media Management/
  .gitignore                          media, source, node_modules
  README.md                           the folder contract, written for Codex and humans
  SOCIAL_HANDOFF.md                   exists, untouched
  tools/
    package.json
    social.mjs                        CLI: argv parsing and printing only
    lib/
      paths.mjs                       root resolution, folder constants
      manifest.mjs                    read/write post.json, statuses, transitions, listing
      captions.mjs                    read caption files, split Instagram first comment
      validate.mjs                    validateFolder(folder, opts) -> string[]
      plan.mjs                        createDay(opts) -> folderPath
      calendar.mjs                    buildCalendar(opts) -> rows, formatCalendar(rows) -> string
    test/
      helpers.mjs                     makeTempRoot(), makeDay() fixture builders
      manifest.test.mjs
      captions.test.mjs
      validate.test.mjs
      plan.test.mjs
      calendar.test.mjs
  To Be Released/
    2026-09-25/post.json              native
    2026-09-26/post.json              native
    2026-09-28/                       web showcase reel
    2026-09-29/                       contrast tutorial
    2026-09-30/                       training showcase reel
    2026-10-01/                       hero tutorial
  Already Released/                   empty, kept with a .gitkeep
```

Responsibilities: `paths.mjs` is the only place that knows where the calendar lives. `manifest.mjs` is the only file that reads or writes `post.json`. `validate.mjs` never writes. `plan.mjs` and `calendar.mjs` use `manifest.mjs` and never touch JSON directly. `social.mjs` has no logic beyond argv and `console.log`.

---

### Task 1: Tool scaffold, gitignore, and root resolution

**Files:**
- Create: `Social Media Management/.gitignore`
- Create: `Social Media Management/tools/package.json`
- Create: `Social Media Management/tools/lib/paths.mjs`
- Create: `Social Media Management/tools/test/helpers.mjs`
- Create: `Social Media Management/tools/test/paths.test.mjs`
- Create: `Social Media Management/Already Released/.gitkeep`

**Interfaces:**
- Produces: `resolveRoot(env = process.env) -> string` (absolute path of Social Media Management), `TO_BE_RELEASED = "To Be Released"`, `ALREADY_RELEASED = "Already Released"`, `dayDir(root, name) -> string`.
- Produces (test helper): `makeTempRoot() -> string` creates a temp dir with both release folders; `makeDay(root, name, manifest, files = {}) -> string` writes `post.json` plus any `{ "relative/path": content }` files and returns the day folder path.

- [ ] **Step 1: Create the gitignore**

`Social Media Management/.gitignore`:

```
tools/node_modules/
To Be Released/*/media/
To Be Released/*/source/
Already Released/*/media/
Already Released/*/source/
.omc/
```

- [ ] **Step 2: Create package.json and install vitest**

`Social Media Management/tools/package.json`:

```json
{
  "name": "ka-social-tools",
  "private": true,
  "type": "module",
  "version": "0.1.0",
  "description": "Day folder tooling for K&A Performance social posts",
  "scripts": {
    "test": "node node_modules/vitest/vitest.mjs run"
  },
  "devDependencies": {
    "vitest": "^2.1.0"
  }
}
```

Run from PowerShell (npm install works from the real path; only the generated shims break):

```powershell
Set-Location "D:\K & A Performance Site\Social Media Management\tools"; npm install
```

Expected: `added N packages`, a `node_modules/` folder, and `package-lock.json`.

- [ ] **Step 3: Create the junction so npm scripts work**

```powershell
New-Item -ItemType Junction -Path "D:\ka-social" -Target "D:\K & A Performance Site\Social Media Management"
```

Expected: a `D:\ka-social` directory listing that matches the real folder. Skip if it already exists.

- [ ] **Step 4: Write the failing test for root resolution**

`Social Media Management/tools/test/paths.test.mjs`:

```js
import { describe, it, expect } from "vitest";
import path from "node:path";
import { resolveRoot, dayDir, TO_BE_RELEASED, ALREADY_RELEASED } from "../lib/paths.mjs";

describe("paths", () => {
  it("defaults to the folder above tools", () => {
    const root = resolveRoot({});
    expect(path.basename(root)).toBe("Social Media Management");
  });

  it("honors SOCIAL_ROOT", () => {
    expect(resolveRoot({ SOCIAL_ROOT: "D:\\tmp\\x" })).toBe(path.resolve("D:\\tmp\\x"));
  });

  it("builds a day folder path under To Be Released", () => {
    expect(dayDir("D:\\r", "2026-09-28")).toBe(path.join("D:\\r", TO_BE_RELEASED, "2026-09-28"));
    expect(ALREADY_RELEASED).toBe("Already Released");
  });
});
```

- [ ] **Step 5: Run it to confirm it fails**

```powershell
Set-Location "D:\K & A Performance Site\Social Media Management\tools"; node node_modules/vitest/vitest.mjs run test/paths.test.mjs
```

Expected: FAIL, `Cannot find module '../lib/paths.mjs'`.

- [ ] **Step 6: Implement paths.mjs**

`Social Media Management/tools/lib/paths.mjs`:

```js
import path from "node:path";
import { fileURLToPath } from "node:url";

export const TO_BE_RELEASED = "To Be Released";
export const ALREADY_RELEASED = "Already Released";

const here = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path of the Social Media Management folder. SOCIAL_ROOT overrides it (tests, junction). */
export function resolveRoot(env = process.env) {
  if (env.SOCIAL_ROOT) return path.resolve(env.SOCIAL_ROOT);
  return path.resolve(here, "..", "..");
}

export function dayDir(root, name, bucket = TO_BE_RELEASED) {
  return path.join(root, bucket, name);
}
```

- [ ] **Step 7: Write the test helper**

`Social Media Management/tools/test/helpers.mjs`:

```js
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { TO_BE_RELEASED, ALREADY_RELEASED } from "../lib/paths.mjs";

/** A fresh temp root with both release folders. Caller removes it in afterEach. */
export function makeTempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ka-social-"));
  fs.mkdirSync(path.join(root, TO_BE_RELEASED));
  fs.mkdirSync(path.join(root, ALREADY_RELEASED));
  return root;
}

/**
 * Write a day folder. `files` maps relative paths to string or Buffer content,
 * e.g. { "facebook.md": "Hi", "media/reel.mp4": Buffer.alloc(16) }.
 */
export function makeDay(root, name, manifest, files = {}, bucket = TO_BE_RELEASED) {
  const dir = path.join(root, bucket, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "post.json"), JSON.stringify(manifest, null, 2) + "\n");
  for (const [rel, content] of Object.entries(files)) {
    const target = path.join(dir, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return dir;
}

/** A complete, valid manifest for a Reel on both networks. Override fields as needed. */
export function baseManifest(overrides = {}) {
  return {
    id: "2026-01-05",
    date: "2026-01-05",
    time: "09:00",
    timezone: "America/New_York",
    status: "planned",
    pillar: "client-spotlight",
    title: "Fixture post",
    platforms: {
      facebook: { type: "REEL", caption: "facebook.md" },
      instagram: { type: "REEL", caption: "instagram.md" }
    },
    media: [
      { file: "media/reel-vertical.mp4", role: "video", origin: "kap-reel", alt: "" },
      { file: "media/thumbnail.jpg", role: "thumbnail", origin: "kap-reel", alt: "A phone showing a website" },
      { file: "media/reel-vertical.srt", role: "captions", origin: "kap-reel" }
    ],
    ai: { voice: false, visuals: false },
    generate: [],
    r2: {},
    metricool: {},
    published: {},
    credits: {},
    lastError: null,
    ...overrides
  };
}

/** Files that satisfy baseManifest(). */
export function baseFiles(overrides = {}) {
  return {
    "facebook.md": "Five real websites in fifteen seconds. ka-performancefl.com\n",
    "instagram.md": "Five real websites in fifteen seconds. Link in bio.\n\n## First comment\n\n#GainesvilleFL #WebDesign\n",
    "media/reel-vertical.mp4": Buffer.alloc(32),
    "media/thumbnail.jpg": Buffer.alloc(32),
    "media/reel-vertical.srt": "1\n00:00:00,000 --> 00:00:01,000\nHello\n",
    ...overrides
  };
}
```

- [ ] **Step 8: Run the test to confirm it passes**

```powershell
Set-Location "D:\K & A Performance Site\Social Media Management\tools"; node node_modules/vitest/vitest.mjs run test/paths.test.mjs
```

Expected: `3 passed`.

- [ ] **Step 9: Add the Already Released keep file and commit**

```powershell
New-Item -ItemType File "D:\K & A Performance Site\Social Media Management\Already Released\.gitkeep"
```

```bash
cd "/d/K & A Performance Site"
git add "Social Media Management/.gitignore" "Social Media Management/tools/package.json" "Social Media Management/tools/package-lock.json" "Social Media Management/tools/lib/paths.mjs" "Social Media Management/tools/test/helpers.mjs" "Social Media Management/tools/test/paths.test.mjs" "Social Media Management/Already Released/.gitkeep" "Social Media Management/SOCIAL_HANDOFF.md"
git commit -m "Scaffold social pipeline tools with root resolution

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Manifest read, write, statuses, and listing

**Files:**
- Create: `Social Media Management/tools/lib/manifest.mjs`
- Create: `Social Media Management/tools/test/manifest.test.mjs`

**Interfaces:**
- Consumes: `TO_BE_RELEASED`, `ALREADY_RELEASED` from `paths.mjs`.
- Produces: `STATUSES` (ordered array), `readManifest(dir) -> object`, `writeManifest(dir, manifest) -> void`, `assertTransition(from, to) -> void` (throws on backward or unknown), `listDayFolders(root, bucket = TO_BE_RELEASED) -> string[]` (absolute paths, sorted by folder name, only folders containing `post.json`), `DAY_NAME = /^\d{4}-\d{2}-\d{2}(-\d+)?$/`.

- [ ] **Step 1: Write the failing tests**

`Social Media Management/tools/test/manifest.test.mjs`:

```js
import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { makeTempRoot, makeDay, baseManifest } from "./helpers.mjs";
import { STATUSES, readManifest, writeManifest, assertTransition, listDayFolders, DAY_NAME } from "../lib/manifest.mjs";
import { TO_BE_RELEASED } from "../lib/paths.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

describe("manifest", () => {
  it("orders statuses and treats native as terminal", () => {
    expect(STATUSES).toEqual(["planned", "generating", "ready", "approved", "scheduled", "published", "native"]);
  });

  it("round trips post.json with two space indent and trailing newline", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-01-05", baseManifest());
    const m = readManifest(dir);
    m.status = "ready";
    writeManifest(dir, m);
    const raw = fs.readFileSync(path.join(dir, "post.json"), "utf8");
    expect(raw.endsWith("}\n")).toBe(true);
    expect(raw).toContain('  "status": "ready"');
    expect(readManifest(dir).status).toBe("ready");
  });

  it("allows forward transitions and rejects backward or unknown ones", () => {
    expect(() => assertTransition("planned", "generating")).not.toThrow();
    expect(() => assertTransition("ready", "approved")).not.toThrow();
    expect(() => assertTransition("approved", "ready")).toThrow(/backward/);
    expect(() => assertTransition("native", "planned")).toThrow(/native/);
    expect(() => assertTransition("planned", "bogus")).toThrow(/unknown/);
  });

  it("lists day folders sorted, skipping folders without post.json", () => {
    root = makeTempRoot();
    makeDay(root, "2026-01-07", baseManifest({ id: "2026-01-07", date: "2026-01-07" }));
    makeDay(root, "2026-01-05", baseManifest());
    fs.mkdirSync(path.join(root, TO_BE_RELEASED, "2026-01-06"));
    const names = listDayFolders(root).map((p) => path.basename(p));
    expect(names).toEqual(["2026-01-05", "2026-01-07"]);
  });

  it("matches day folder names", () => {
    expect(DAY_NAME.test("2026-09-28")).toBe(true);
    expect(DAY_NAME.test("2026-09-28-2")).toBe(true);
    expect(DAY_NAME.test("sept-28")).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```powershell
Set-Location "D:\K & A Performance Site\Social Media Management\tools"; node node_modules/vitest/vitest.mjs run test/manifest.test.mjs
```

Expected: FAIL, `Cannot find module '../lib/manifest.mjs'`.

- [ ] **Step 3: Implement manifest.mjs**

`Social Media Management/tools/lib/manifest.mjs`:

```js
import fs from "node:fs";
import path from "node:path";
import { TO_BE_RELEASED } from "./paths.mjs";

/** One way order. native is terminal and set by hand. */
export const STATUSES = ["planned", "generating", "ready", "approved", "scheduled", "published", "native"];

export const DAY_NAME = /^\d{4}-\d{2}-\d{2}(-\d+)?$/;

export function readManifest(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, "post.json"), "utf8"));
}

export function writeManifest(dir, manifest) {
  fs.writeFileSync(path.join(dir, "post.json"), JSON.stringify(manifest, null, 2) + "\n");
}

export function assertTransition(from, to) {
  if (!STATUSES.includes(to)) throw new Error(`unknown status "${to}"`);
  if (from === "native") throw new Error("native folders never change status");
  const a = STATUSES.indexOf(from);
  const b = STATUSES.indexOf(to);
  if (b <= a) throw new Error(`backward transition ${from} -> ${to}`);
}

/** Absolute paths of day folders that contain post.json, sorted by name. */
export function listDayFolders(root, bucket = TO_BE_RELEASED) {
  const base = path.join(root, bucket);
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(base, d.name, "post.json")))
    .map((d) => path.join(base, d.name))
    .sort();
}
```

- [ ] **Step 4: Run to confirm pass**

Same command. Expected: `5 passed`.

- [ ] **Step 5: Commit**

```bash
cd "/d/K & A Performance Site"
git add "Social Media Management/tools/lib/manifest.mjs" "Social Media Management/tools/test/manifest.test.mjs"
git commit -m "Add manifest read, write, and status transitions

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Caption reading and the Instagram first comment split

**Files:**
- Create: `Social Media Management/tools/lib/captions.mjs`
- Create: `Social Media Management/tools/test/captions.test.mjs`

**Interfaces:**
- Produces: `readCaption(dir, file) -> string | null` (trimmed text, null when the file is missing), `splitInstagram(text) -> { caption: string, firstComment: string }` (split on a line matching `/^## First comment\s*$/i`; both parts trimmed; `firstComment` is `""` when the heading is absent).

- [ ] **Step 1: Write the failing tests**

`Social Media Management/tools/test/captions.test.mjs`:

```js
import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import { makeTempRoot, makeDay, baseManifest } from "./helpers.mjs";
import { readCaption, splitInstagram } from "../lib/captions.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

describe("captions", () => {
  it("reads and trims a caption file, null when missing", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-01-05", baseManifest(), { "facebook.md": "  Hello there.\n\n" });
    expect(readCaption(dir, "facebook.md")).toBe("Hello there.");
    expect(readCaption(dir, "linkedin.md")).toBeNull();
  });

  it("splits the Instagram caption from the first comment", () => {
    const out = splitInstagram("Line one.\nLine two.\n\n## First comment\n\n#GainesvilleFL #WebDesign\n");
    expect(out.caption).toBe("Line one.\nLine two.");
    expect(out.firstComment).toBe("#GainesvilleFL #WebDesign");
  });

  it("returns an empty first comment when the heading is absent", () => {
    const out = splitInstagram("Just a caption.");
    expect(out).toEqual({ caption: "Just a caption.", firstComment: "" });
  });

  it("matches the heading case insensitively", () => {
    expect(splitInstagram("A\n## first Comment\nB").firstComment).toBe("B");
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```powershell
Set-Location "D:\K & A Performance Site\Social Media Management\tools"; node node_modules/vitest/vitest.mjs run test/captions.test.mjs
```

Expected: FAIL, module not found.

- [ ] **Step 3: Implement captions.mjs**

`Social Media Management/tools/lib/captions.mjs`:

```js
import fs from "node:fs";
import path from "node:path";

const FIRST_COMMENT = /^## First comment\s*$/im;

export function readCaption(dir, file) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8").trim();
}

/** Instagram caption text above the "## First comment" heading, first comment below it. */
export function splitInstagram(text) {
  const m = FIRST_COMMENT.exec(text);
  if (!m) return { caption: text.trim(), firstComment: "" };
  return {
    caption: text.slice(0, m.index).trim(),
    firstComment: text.slice(m.index + m[0].length).trim()
  };
}
```

- [ ] **Step 4: Run to confirm pass**

Same command. Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
cd "/d/K & A Performance Site"
git add "Social Media Management/tools/lib/captions.mjs" "Social Media Management/tools/test/captions.test.mjs"
git commit -m "Add caption reading and Instagram first comment split

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: The validator

**Files:**
- Create: `Social Media Management/tools/lib/validate.mjs`
- Create: `Social Media Management/tools/test/validate.test.mjs`

**Interfaces:**
- Consumes: `readManifest`, `STATUSES`, `DAY_NAME` from `manifest.mjs`; `readCaption`, `splitInstagram` from `captions.mjs`.
- Produces: `validateFolder(dir, { now = new Date() } = {}) -> string[]` where each string is one problem prefixed with the folder name, e.g. `2026-09-28: instagram needs an image or video`. An empty array means valid. Also `LIMITS = { facebook: 63206, instagram: 2200, firstComment: 2200 }` and `AI_DISCLOSURE = /AI (narrated|voice|generated|assisted)/i`.

Rules, in the order the tests exercise them:

1. `post.json` parses; otherwise the single problem `cannot parse post.json`.
2. Folder name matches `DAY_NAME`, `manifest.id` equals the folder name, and `manifest.date` equals the first ten characters of the id.
3. `status` is in `STATUSES`.
4. Native: no `media`, no `platforms.*.caption` files required. Every other rule is skipped for native.
5. `time` matches `/^\d{2}:\d{2}$/` with valid hour and minute. For `approved`, the local datetime is after `now`.
6. Every non-manual platform names a caption file that exists and is non-empty.
7. Every `media[]` entry with role `image` or `thumbnail` has a non-empty `alt`.
8. When status is `ready` or later, every `media[].file` exists.
9. Instagram present requires at least one media entry with role `image` or `video`. A `REEL` on either network requires a `video` role. A `STORY` type whose caption file is non-empty is a problem (`stories carry no caption`).
10. Facebook caption length is at most `LIMITS.facebook`; Instagram caption (above the heading) at most `LIMITS.instagram`; first comment at most `LIMITS.firstComment`.
11. No U+2014 in any `.md`, `.json`, or `.srt` file anywhere in the folder, including `source/`.
12. Instagram caption body (above the heading) contains no `#word` hashtag.
13. When `ai.voice` or `ai.visuals` is true, every non-manual platform caption matches `AI_DISCLOSURE`.
14. Any `source/*.md` file whose name contains `script` or `narration` must not contain `K&A`.

- [ ] **Step 1: Write the failing tests**

`Social Media Management/tools/test/validate.test.mjs`:

```js
import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { makeTempRoot, makeDay, baseManifest, baseFiles } from "./helpers.mjs";
import { validateFolder } from "../lib/validate.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

function day(overrides = {}, files = baseFiles(), name = "2026-01-05") {
  root = makeTempRoot();
  return makeDay(root, name, baseManifest(overrides), files);
}

describe("validateFolder", () => {
  it("accepts the fixture", () => {
    expect(validateFolder(day())).toEqual([]);
  });

  it("reports unparseable post.json as the only problem", () => {
    root = makeTempRoot();
    const dir = path.join(root, "To Be Released", "2026-01-05");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "post.json"), "{ not json");
    expect(validateFolder(dir)).toEqual(["2026-01-05: cannot parse post.json"]);
  });

  it("requires folder name, id, and date to agree", () => {
    const problems = validateFolder(day({ id: "2026-01-06" }));
    expect(problems).toContain("2026-01-05: id \"2026-01-06\" does not match folder name");
    const p2 = validateFolder(day({ date: "2026-01-09" }));
    expect(p2).toContain("2026-01-05: date \"2026-01-09\" does not match id");
  });

  it("rejects unknown status", () => {
    expect(validateFolder(day({ status: "done" }))).toContain("2026-01-05: unknown status \"done\"");
  });

  it("accepts a native placeholder with no media or captions", () => {
    root = makeTempRoot();
    const dir = makeDay(root, "2026-09-25", {
      id: "2026-09-25", date: "2026-09-25", time: "09:00", timezone: "America/New_York",
      status: "native", title: "Job aids video, scheduled in Facebook",
      platforms: { facebook: { type: "REEL" } }
    });
    expect(validateFolder(dir)).toEqual([]);
  });

  it("rejects media on a native placeholder", () => {
    const problems = validateFolder(day({ status: "native" }));
    expect(problems).toEqual(["2026-01-05: native folders carry no media"]);
  });

  it("checks the time format and future time for approved posts", () => {
    expect(validateFolder(day({ time: "9am" }))).toContain("2026-01-05: time \"9am\" is not HH:MM");
    expect(validateFolder(day({ time: "25:00" }))).toContain("2026-01-05: time \"25:00\" is not HH:MM");
    const past = validateFolder(day({ status: "approved" }), { now: new Date("2027-01-01T00:00:00Z") });
    expect(past).toContain("2026-01-05: approved post time 2026-01-05 09:00 America/New_York is in the past");
    const future = validateFolder(day({ status: "approved" }), { now: new Date("2025-12-01T00:00:00Z") });
    expect(future).toEqual([]);
  });

  it("requires caption files for non manual platforms", () => {
    const files = baseFiles(); delete files["instagram.md"];
    expect(validateFolder(day({}, files))).toContain("2026-01-05: instagram caption file instagram.md is missing or empty");
    const manual = validateFolder(day({ platforms: { facebook: { type: "REEL", caption: "facebook.md" }, linkedin: { manual: true, caption: "linkedin.md" } } }));
    expect(manual).toEqual([]);
  });

  it("requires alt text on images and thumbnails", () => {
    const m = baseManifest(); m.media[1].alt = "";
    expect(validateFolder(day(m))).toContain("2026-01-05: media/thumbnail.jpg needs alt text");
  });

  it("requires media files to exist once ready", () => {
    const files = baseFiles(); delete files["media/reel-vertical.mp4"];
    expect(validateFolder(day({ status: "planned" }, files))).toEqual([]);
    expect(validateFolder(day({ status: "ready" }, files))).toContain("2026-01-05: media/reel-vertical.mp4 does not exist");
  });

  it("enforces Metricool media rules", () => {
    const noVideo = baseManifest(); noVideo.media = [noVideo.media[1]];
    expect(validateFolder(day(noVideo))).toContain("2026-01-05: facebook REEL needs a video");
    expect(validateFolder(day(noVideo))).toContain("2026-01-05: instagram REEL needs a video");
    const igNoMedia = baseManifest(); igNoMedia.media = [];
    expect(validateFolder(day(igNoMedia))).toContain("2026-01-05: instagram needs an image or video");
    const story = baseManifest(); story.platforms.facebook.type = "STORY";
    expect(validateFolder(day(story))).toContain("2026-01-05: facebook STORY carries no caption");
  });

  it("enforces caption length limits", () => {
    const files = baseFiles({ "instagram.md": "x".repeat(2201) + "\n\n## First comment\n\n#a\n" });
    expect(validateFolder(day({}, files))).toContain("2026-01-05: instagram caption is 2201 characters, limit 2200");
  });

  it("rejects em dashes in any text file", () => {
    const files = baseFiles({ "source/script.md": "Measure every color \u2014 always.\n" });
    expect(validateFolder(day({}, files))).toContain("2026-01-05: source/script.md contains an em dash");
  });

  it("keeps Instagram hashtags in the first comment", () => {
    const files = baseFiles({ "instagram.md": "Great site #WebDesign\n\n## First comment\n\n#a\n" });
    expect(validateFolder(day({}, files))).toContain("2026-01-05: instagram caption has hashtags above the first comment");
  });

  it("requires an AI disclosure when voice or visuals are AI", () => {
    const problems = validateFolder(day({ ai: { voice: true, visuals: false } }));
    expect(problems).toContain("2026-01-05: facebook caption needs an AI disclosure line");
    expect(problems).toContain("2026-01-05: instagram caption needs an AI disclosure line");
    const ok = validateFolder(day({ ai: { voice: true, visuals: false } }, baseFiles({
      "facebook.md": "The voice is AI narrated.\n",
      "instagram.md": "Narration is an AI voice.\n\n## First comment\n\n#a\n"
    })));
    expect(ok).toEqual([]);
  });

  it("requires K and A spelled out in narration scripts", () => {
    const files = baseFiles({ "source/narration-script.md": "K&A builds websites.\n" });
    expect(validateFolder(day({}, files))).toContain("2026-01-05: source/narration-script.md must spell K and A for the voice model");
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```powershell
Set-Location "D:\K & A Performance Site\Social Media Management\tools"; node node_modules/vitest/vitest.mjs run test/validate.test.mjs
```

Expected: FAIL, module not found.

- [ ] **Step 3: Implement validate.mjs**

`Social Media Management/tools/lib/validate.mjs`:

```js
import fs from "node:fs";
import path from "node:path";
import { STATUSES, DAY_NAME } from "./manifest.mjs";
import { readCaption, splitInstagram } from "./captions.mjs";

export const LIMITS = { facebook: 63206, instagram: 2200, firstComment: 2200 };
export const AI_DISCLOSURE = /AI (narrated|voice|generated|assisted)/i;
const EM_DASH = "\u2014";
const TEXT_EXT = new Set([".md", ".json", ".srt"]);
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Every problem in one folder, or [] when it is valid. Never writes. */
export function validateFolder(dir, { now = new Date() } = {}) {
  const name = path.basename(dir);
  const problems = [];
  const add = (msg) => problems.push(`${name}: ${msg}`);

  let m;
  try {
    m = JSON.parse(fs.readFileSync(path.join(dir, "post.json"), "utf8"));
  } catch {
    return [`${name}: cannot parse post.json`];
  }

  if (!DAY_NAME.test(name)) add(`folder name "${name}" is not YYYY-MM-DD`);
  if (m.id !== name) add(`id "${m.id}" does not match folder name`);
  if (m.date !== String(m.id).slice(0, 10)) add(`date "${m.date}" does not match id`);
  if (!STATUSES.includes(m.status)) add(`unknown status "${m.status}"`);

  if (m.status === "native") {
    if (Array.isArray(m.media) && m.media.length > 0) add("native folders carry no media");
    return problems;
  }

  if (!TIME.test(m.time)) add(`time "${m.time}" is not HH:MM`);
  else if (m.status === "approved" && localToUtc(m.date, m.time, m.timezone) <= now) {
    add(`approved post time ${m.date} ${m.time} ${m.timezone} is in the past`);
  }

  const media = Array.isArray(m.media) ? m.media : [];
  const roles = new Set(media.map((x) => x.role));
  const statusIndex = STATUSES.indexOf(m.status);
  const readyOrLater = statusIndex >= STATUSES.indexOf("ready");

  for (const entry of media) {
    if ((entry.role === "image" || entry.role === "thumbnail") && !String(entry.alt || "").trim()) {
      add(`${entry.file} needs alt text`);
    }
    if (readyOrLater && !fs.existsSync(path.join(dir, entry.file))) add(`${entry.file} does not exist`);
  }

  const aiFlag = Boolean(m.ai && (m.ai.voice || m.ai.visuals));
  const platforms = m.platforms || {};
  for (const [network, cfg] of Object.entries(platforms)) {
    if (cfg.manual) continue;
    const raw = cfg.caption ? readCaption(dir, cfg.caption) : null;
    const text = raw === null ? null : (network === "instagram" ? splitInstagram(raw).caption : raw);
    if (!text) {
      add(`${network} caption file ${cfg.caption || "(none)"} is missing or empty`);
      continue;
    }
    const type = cfg.type || "POST";
    if (type === "REEL" && !roles.has("video")) add(`${network} REEL needs a video`);
    if (type === "STORY" && text) add(`${network} STORY carries no caption`);
    if (network === "instagram") {
      if (!roles.has("image") && !roles.has("video")) add("instagram needs an image or video");
      const { caption, firstComment } = splitInstagram(raw);
      if (caption.length > LIMITS.instagram) add(`instagram caption is ${caption.length} characters, limit ${LIMITS.instagram}`);
      if (firstComment.length > LIMITS.firstComment) add(`instagram first comment is ${firstComment.length} characters, limit ${LIMITS.firstComment}`);
      if (/(^|\s)#\w/.test(caption)) add("instagram caption has hashtags above the first comment");
      if (aiFlag && !AI_DISCLOSURE.test(caption)) add("instagram caption needs an AI disclosure line");
    } else {
      const limit = LIMITS[network];
      if (limit && text.length > limit) add(`${network} caption is ${text.length} characters, limit ${limit}`);
      if (aiFlag && !AI_DISCLOSURE.test(text)) add(`${network} caption needs an AI disclosure line`);
    }
  }

  for (const rel of walkText(dir)) {
    const content = fs.readFileSync(path.join(dir, rel), "utf8");
    if (content.includes(EM_DASH)) add(`${rel} contains an em dash`);
    if (rel.startsWith("source/") && /script|narration/i.test(rel) && rel.endsWith(".md") && content.includes("K&A")) {
      add(`${rel} must spell K and A for the voice model`);
    }
  }

  return problems;
}

/** Relative paths of .md, .json, .srt files under dir, forward slashes. */
function walkText(dir, prefix = "") {
  const out = [];
  for (const d of fs.readdirSync(path.join(dir, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${d.name}` : d.name;
    if (d.isDirectory()) out.push(...walkText(dir, rel));
    else if (TEXT_EXT.has(path.extname(d.name))) out.push(rel);
  }
  return out;
}

/** Local wall time in an IANA zone to a UTC Date, using Intl only. */
export function localToUtc(date, time, timezone) {
  const [h, min] = time.split(":").map(Number);
  const [y, mo, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, min);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
  }).formatToParts(new Date(guess)).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  const asIfUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(guess - (asIfUtc - guess));
}
```

- [ ] **Step 4: Run to confirm pass**

Same command. Expected: `16 passed`. If the future-time case fails, check `localToUtc` against a known value: `localToUtc("2026-01-05", "09:00", "America/New_York").toISOString()` must be `2026-01-05T14:00:00.000Z`.

- [ ] **Step 5: Commit**

```bash
cd "/d/K & A Performance Site"
git add "Social Media Management/tools/lib/validate.mjs" "Social Media Management/tools/test/validate.test.mjs"
git commit -m "Add day folder validator with contract, Metricool, and house rules

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: The plan command

**Files:**
- Create: `Social Media Management/tools/lib/plan.mjs`
- Create: `Social Media Management/tools/test/plan.test.mjs`

**Interfaces:**
- Consumes: `dayDir` from `paths.mjs`; `writeManifest`, `DAY_NAME` from `manifest.mjs`.
- Produces: `createDay({ root, date, pillar, title, type = "REEL", time = "09:00", from = null, ai = { voice: false, visuals: false } }) -> string` (the new folder path). Throws `Error("folder already exists: <name>")` when the folder exists and `Error("bad date: <date>")` when the date is not `YYYY-MM-DD`. With `from`, copies the single `.mp4`, `.srt`, and `thumbnail*.jpg` from `<from>/Facebook/` into `media/` as `reel-vertical.mp4`, `reel-vertical.srt`, `thumbnail.jpg`, and fills `media[]` with origin `kap-reel`; the thumbnail alt is left empty for the author to fill, so a freshly planned reel fails validation until alt is written, which is intended.

The manifest written matches the spec's `post.json` example exactly in field order. Caption files are created empty except `instagram.md`, which is created as `"\n## First comment\n\n"` so the heading is already in place.

- [ ] **Step 1: Write the failing tests**

`Social Media Management/tools/test/plan.test.mjs`:

```js
import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { makeTempRoot } from "./helpers.mjs";
import { createDay } from "../lib/plan.mjs";
import { readManifest } from "../lib/manifest.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

describe("createDay", () => {
  it("creates a planned folder with manifest and caption files", () => {
    root = makeTempRoot();
    const dir = createDay({ root, date: "2026-10-05", pillar: "tip", title: "Tab through your site" });
    const m = readManifest(dir);
    expect(m).toMatchObject({
      id: "2026-10-05", date: "2026-10-05", time: "09:00", timezone: "America/New_York",
      status: "planned", pillar: "tip", title: "Tab through your site",
      platforms: { facebook: { type: "REEL", caption: "facebook.md" }, instagram: { type: "REEL", caption: "instagram.md" } },
      media: [], ai: { voice: false, visuals: false }, generate: [], r2: {}, metricool: {}, published: {}, credits: {}, lastError: null
    });
    expect(Object.keys(m)[0]).toBe("id");
    expect(fs.readFileSync(path.join(dir, "facebook.md"), "utf8")).toBe("");
    expect(fs.readFileSync(path.join(dir, "instagram.md"), "utf8")).toBe("\n## First comment\n\n");
    expect(fs.existsSync(path.join(dir, "media"))).toBe(true);
  });

  it("refuses to overwrite an existing folder", () => {
    root = makeTempRoot();
    createDay({ root, date: "2026-10-05", pillar: "tip", title: "x" });
    expect(() => createDay({ root, date: "2026-10-05", pillar: "tip", title: "y" })).toThrow("folder already exists: 2026-10-05");
  });

  it("rejects a bad date", () => {
    root = makeTempRoot();
    expect(() => createDay({ root, date: "Oct 5", pillar: "tip", title: "x" })).toThrow("bad date: Oct 5");
  });

  it("copies a finished reel from a Facebook folder", () => {
    root = makeTempRoot();
    const reel = path.join(root, "reel-src");
    fs.mkdirSync(path.join(reel, "Facebook"), { recursive: true });
    fs.writeFileSync(path.join(reel, "Facebook", "kap-reel-vertical-15s.mp4"), Buffer.alloc(8));
    fs.writeFileSync(path.join(reel, "Facebook", "kap-reel-vertical-15s.srt"), "1\n");
    fs.writeFileSync(path.join(reel, "Facebook", "thumbnail-vertical.jpg"), Buffer.alloc(8));
    const dir = createDay({ root, date: "2026-09-28", pillar: "client-spotlight", title: "Web reel", from: reel, ai: { voice: false, visuals: true } });
    const m = readManifest(dir);
    expect(m.media).toEqual([
      { file: "media/reel-vertical.mp4", role: "video", origin: "kap-reel", alt: "" },
      { file: "media/thumbnail.jpg", role: "thumbnail", origin: "kap-reel", alt: "" },
      { file: "media/reel-vertical.srt", role: "captions", origin: "kap-reel" }
    ]);
    expect(m.ai).toEqual({ voice: false, visuals: true });
    for (const f of ["reel-vertical.mp4", "reel-vertical.srt", "thumbnail.jpg"]) {
      expect(fs.existsSync(path.join(dir, "media", f))).toBe(true);
    }
  });

  it("fails clearly when the reel folder has no Facebook cut", () => {
    root = makeTempRoot();
    const reel = path.join(root, "empty-reel");
    fs.mkdirSync(reel);
    expect(() => createDay({ root, date: "2026-09-28", pillar: "x", title: "x", from: reel })).toThrow(/no \.mp4 in/);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```powershell
Set-Location "D:\K & A Performance Site\Social Media Management\tools"; node node_modules/vitest/vitest.mjs run test/plan.test.mjs
```

Expected: FAIL, module not found.

- [ ] **Step 3: Implement plan.mjs**

`Social Media Management/tools/lib/plan.mjs`:

```js
import fs from "node:fs";
import path from "node:path";
import { dayDir } from "./paths.mjs";
import { writeManifest } from "./manifest.mjs";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Create a planned day folder. Returns its path. */
export function createDay({ root, date, pillar, title, type = "REEL", time = "09:00", from = null, ai = { voice: false, visuals: false } }) {
  if (!DATE.test(date)) throw new Error(`bad date: ${date}`);
  const dir = dayDir(root, date);
  if (fs.existsSync(dir)) throw new Error(`folder already exists: ${date}`);
  fs.mkdirSync(path.join(dir, "media"), { recursive: true });

  const media = from ? copyReel(from, dir) : [];

  writeManifest(dir, {
    id: date,
    date,
    time,
    timezone: "America/New_York",
    status: "planned",
    pillar,
    title,
    platforms: {
      facebook: { type, caption: "facebook.md" },
      instagram: { type, caption: "instagram.md" }
    },
    media,
    ai,
    generate: [],
    r2: {},
    metricool: {},
    published: {},
    credits: {},
    lastError: null
  });
  fs.writeFileSync(path.join(dir, "facebook.md"), "");
  fs.writeFileSync(path.join(dir, "instagram.md"), "\n## First comment\n\n");
  return dir;
}

/** Copy the vertical cut, its SRT, and the thumbnail from <from>/Facebook into media/. */
function copyReel(from, dir) {
  const src = path.join(from, "Facebook");
  const files = fs.existsSync(src) ? fs.readdirSync(src) : [];
  const pick = (test) => files.find(test);
  const mp4 = pick((f) => f.endsWith(".mp4"));
  const srt = pick((f) => f.endsWith(".srt"));
  const jpg = pick((f) => /^thumbnail.*\.jpg$/i.test(f));
  if (!mp4) throw new Error(`no .mp4 in ${src}`);
  if (!srt) throw new Error(`no .srt in ${src}`);
  if (!jpg) throw new Error(`no thumbnail*.jpg in ${src}`);
  fs.copyFileSync(path.join(src, mp4), path.join(dir, "media", "reel-vertical.mp4"));
  fs.copyFileSync(path.join(src, srt), path.join(dir, "media", "reel-vertical.srt"));
  fs.copyFileSync(path.join(src, jpg), path.join(dir, "media", "thumbnail.jpg"));
  return [
    { file: "media/reel-vertical.mp4", role: "video", origin: "kap-reel", alt: "" },
    { file: "media/thumbnail.jpg", role: "thumbnail", origin: "kap-reel", alt: "" },
    { file: "media/reel-vertical.srt", role: "captions", origin: "kap-reel" }
  ];
}
```

- [ ] **Step 4: Run to confirm pass**

Same command. Expected: `5 passed`.

- [ ] **Step 5: Commit**

```bash
cd "/d/K & A Performance Site"
git add "Social Media Management/tools/lib/plan.mjs" "Social Media Management/tools/test/plan.test.mjs"
git commit -m "Add plan command that creates day folders and imports finished reels

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: The calendar view

**Files:**
- Create: `Social Media Management/tools/lib/calendar.mjs`
- Create: `Social Media Management/tools/test/calendar.test.mjs`

**Interfaces:**
- Consumes: `listDayFolders`, `readManifest` from `manifest.mjs`.
- Produces: `buildCalendar({ root, today, days = 14 }) -> Array<{ date, weekday, status, pillar, title, note }>` covering `today` through `today + days - 1`; a date with no folder gets `status: "gap"` on weekdays and `status: ""` on weekends, empty `pillar` and `title`; a native folder gets `note: "native"`; a `-2` folder appears as its own row right after its day. `formatCalendar(rows) -> string` renders one line per row: `YYYY-MM-DD  Mon  status      pillar             title  [note]` with columns padded to 11 and 18 characters.

- [ ] **Step 1: Write the failing tests**

`Social Media Management/tools/test/calendar.test.mjs`:

```js
import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import { makeTempRoot, makeDay, baseManifest } from "./helpers.mjs";
import { buildCalendar, formatCalendar } from "../lib/calendar.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

describe("calendar", () => {
  it("lists every day in the window with gaps on weekdays only", () => {
    root = makeTempRoot();
    makeDay(root, "2026-09-25", { id: "2026-09-25", date: "2026-09-25", time: "09:00", timezone: "America/New_York", status: "native", title: "Job aids video", platforms: { facebook: { type: "REEL" } } });
    makeDay(root, "2026-09-28", baseManifest({ id: "2026-09-28", date: "2026-09-28", status: "ready", title: "Web reel" }));
    makeDay(root, "2026-09-28-2", baseManifest({ id: "2026-09-28-2", date: "2026-09-28", status: "planned", title: "Second post" }));
    const rows = buildCalendar({ root, today: "2026-09-25", days: 4 });
    expect(rows.map((r) => [r.date, r.weekday, r.status, r.note])).toEqual([
      ["2026-09-25", "Fri", "native", "native"],
      ["2026-09-26", "Sat", "", ""],
      ["2026-09-27", "Sun", "", ""],
      ["2026-09-28", "Mon", "ready", ""],
      ["2026-09-28", "Mon", "planned", "second post 2026-09-28-2"]
    ]);
    expect(rows[3].title).toBe("Web reel");
  });

  it("formats aligned lines", () => {
    const text = formatCalendar([
      { date: "2026-09-28", weekday: "Mon", status: "ready", pillar: "client-spotlight", title: "Web reel", note: "" },
      { date: "2026-10-02", weekday: "Fri", status: "gap", pillar: "", title: "", note: "" }
    ]);
    expect(text.split("\n")).toEqual([
      "2026-09-28  Mon  ready        client-spotlight    Web reel",
      "2026-10-02  Fri  gap"
    ]);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```powershell
Set-Location "D:\K & A Performance Site\Social Media Management\tools"; node node_modules/vitest/vitest.mjs run test/calendar.test.mjs
```

Expected: FAIL, module not found.

- [ ] **Step 3: Implement calendar.mjs**

`Social Media Management/tools/lib/calendar.mjs`:

```js
import path from "node:path";
import { listDayFolders, readManifest } from "./manifest.mjs";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Rows for today through today + days - 1. Dates are YYYY-MM-DD strings, no timezone math. */
export function buildCalendar({ root, today, days = 14 }) {
  const byDate = new Map();
  for (const dir of listDayFolders(root)) {
    const name = path.basename(dir);
    const m = readManifest(dir);
    const list = byDate.get(m.date) || [];
    list.push({ name, m });
    byDate.set(m.date, list);
  }

  const rows = [];
  const start = new Date(`${today}T00:00:00Z`);
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const date = d.toISOString().slice(0, 10);
    const weekday = WEEKDAYS[d.getUTCDay()];
    const entries = byDate.get(date) || [];
    if (entries.length === 0) {
      const isWeekday = d.getUTCDay() >= 1 && d.getUTCDay() <= 5;
      rows.push({ date, weekday, status: isWeekday ? "gap" : "", pillar: "", title: "", note: "" });
      continue;
    }
    for (const { name, m } of entries) {
      let note = "";
      if (m.status === "native") note = "native";
      else if (name !== date) note = `second post ${name}`;
      rows.push({ date, weekday, status: m.status, pillar: m.pillar || "", title: m.title || "", note });
    }
  }
  return rows;
}

export function formatCalendar(rows) {
  return rows.map((r) => {
    const parts = [r.date, r.weekday, r.status.padEnd(11), r.pillar.padEnd(18), r.title];
    if (r.note) parts.push(`[${r.note}]`);
    return parts.join("  ").replace(/\s+$/, "");
  }).join("\n");
}
```

- [ ] **Step 4: Run to confirm pass**

Same command. Expected: `2 passed`.

- [ ] **Step 5: Commit**

```bash
cd "/d/K & A Performance Site"
git add "Social Media Management/tools/lib/calendar.mjs" "Social Media Management/tools/test/calendar.test.mjs"
git commit -m "Add calendar view over day folders

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: The CLI and the README contract

**Files:**
- Create: `Social Media Management/tools/social.mjs`
- Create: `Social Media Management/README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: `node tools/social.mjs plan <date> --pillar <p> --title "<t>" [--type REEL|POST] [--time HH:MM] [--from "<reel folder>"] [--ai-voice] [--ai-visuals]`, `node tools/social.mjs validate [<folder name>|--all]`, `node tools/social.mjs calendar [--days N] [--today YYYY-MM-DD]`. Exit code 1 on validation problems or errors. `--all` and a bare `validate` mean every folder under To Be Released.

- [ ] **Step 1: Write the CLI**

`Social Media Management/tools/social.mjs`:

```js
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
```

- [ ] **Step 2: Smoke test the CLI against a temp root**

```powershell
$env:SOCIAL_ROOT = (New-Item -ItemType Directory -Path (Join-Path $env:TEMP ("ka-social-smoke-" + [guid]::NewGuid()))).FullName; New-Item -ItemType Directory (Join-Path $env:SOCIAL_ROOT "To Be Released") | Out-Null; New-Item -ItemType Directory (Join-Path $env:SOCIAL_ROOT "Already Released") | Out-Null; Set-Location "D:\K & A Performance Site\Social Media Management"; node tools/social.mjs plan 2026-10-05 --pillar tip --title "Tab through your site"; node tools/social.mjs validate; node tools/social.mjs calendar --today 2026-10-01 --days 7; Remove-Item -Recurse -Force $env:SOCIAL_ROOT; Remove-Item Env:SOCIAL_ROOT
```

Expected: `created To Be Released\2026-10-05`, then two "still to fill in" lines about missing captions, then `validate` printing the same two problems and `2 problem(s) in 1 folder(s)`, then a seven line calendar with `2026-10-05  Mon  planned     tip                 Tab through your site`.

- [ ] **Step 3: Write the README contract**

`Social Media Management/README.md`:

```markdown
# Social Media Management

Facebook and Instagram posts for K&A Performance, one day folder per post.
This file is the contract. If a folder follows it, the tools accept it, no
matter who or what produced it: a person, Codex, or a script.

Business context and connected tools: `SOCIAL_HANDOFF.md`.
Design: `docs/superpowers/specs/2026-09-24-social-media-pipeline-design.md`.

## Rules that apply to every file here

- No em dashes. Use periods, commas, colons.
- US English.
- Real clients and real sites only, and only ones cleared for public showcase.
- No made up numbers. Any figure in a caption traces to a measured value in `source/`.
- If the voice or the visuals came from AI, say so in the caption in plain words
  (for example "The voice is AI narrated." or "The hands and rooms around the
  screens are AI assisted.") and set `ai.voice` or `ai.visuals` to true.
- Anything sent to a voice model spells "K and A". On screen and in captions it stays K&A.
- Nothing goes live until Alex sets `"status": "approved"` in `post.json`.

## The day folder

```
To Be Released/
  2026-09-28/
    post.json        the manifest
    facebook.md      Facebook caption, verbatim
    instagram.md     Instagram caption, then "## First comment" with the hashtags
    linkedin.md      optional, posted by hand
    media/           the files that get uploaded: video, thumbnail, SRT, images
    source/          optional working files: script, narration takes, captures
```

Folder name is the post date, `YYYY-MM-DD`. A second post on the same day
is `YYYY-MM-DD-2`. When a post has published, the whole folder moves to
`Already Released/`.

## post.json

```json
{
  "id": "2026-09-28",
  "date": "2026-09-28",
  "time": "09:00",
  "timezone": "America/New_York",
  "status": "planned",
  "pillar": "client-spotlight",
  "title": "Osteen and Sons address lookup",
  "platforms": {
    "facebook": { "type": "REEL", "caption": "facebook.md" },
    "instagram": { "type": "REEL", "caption": "instagram.md" },
    "linkedin": { "manual": true, "caption": "linkedin.md" }
  },
  "media": [
    { "file": "media/reel-vertical.mp4", "role": "video", "origin": "kap-reel", "alt": "" },
    { "file": "media/thumbnail.jpg", "role": "thumbnail", "origin": "kap-reel", "alt": "Phone frame showing the address lookup form" },
    { "file": "media/reel-vertical.srt", "role": "captions", "origin": "kap-reel" }
  ],
  "ai": { "voice": true, "visuals": false },
  "generate": [],
  "r2": {},
  "metricool": {},
  "published": {},
  "credits": {},
  "lastError": null
}
```

- `status` moves one way: `planned`, `generating`, `ready`, `approved`,
  `scheduled`, `published`. `native` marks a post that was scheduled directly
  in Facebook; it has no media and the tools leave it alone. Alex sets
  `approved`. Scripts set everything else.
- `time` is local to `timezone`. Weekday default is 09:00.
- `platforms.<network>.type`: Facebook `POST`, `REEL`, `STORY`. Instagram
  `POST`, `REEL`, `STORY`, `TRIAL_REEL`. LinkedIn is `"manual": true`.
- `media[].role`: `video`, `image`, `thumbnail`, `captions`. Every `image`
  and `thumbnail` needs `alt`.
- `media[].origin`: `human`, `codex`, `elevenlabs`, `kap-reel`.
- `r2`, `metricool`, `published`, `credits`, `lastError` are written by the
  tools. Leave them as they are.

## Captions

`facebook.md` is posted as written. `instagram.md` is the caption, then a line
`## First comment`, then the hashtags. Instagram gets "link in bio" style
wording; Facebook gets the direct link. Keep hashtags out of the Instagram
caption body.

## Commands

Run from `D:\ka-social` (a junction to this folder) or from here:

```
node tools/social.mjs plan 2026-10-05 --pillar tip --title "Tab through your site"
node tools/social.mjs plan 2026-09-28 --pillar client-spotlight --title "Web reel" --from "D:\K & A Performance Site\Reels\Posts 9-4-26\Web reel" --ai-visuals
node tools/social.mjs validate            all folders
node tools/social.mjs validate 2026-09-28
node tools/social.mjs calendar --days 14
```

`plan` creates the folder and tells you what is still missing. `validate`
lists every problem in every folder and exits 1 if there are any. `calendar`
shows the next two weeks, with `gap` on weekdays that have nothing planned.

Tests: from `tools/`, `node node_modules/vitest/vitest.mjs run`.

## For Codex

To fill a planned day: read `post.json`, write `facebook.md` and
`instagram.md`, put finished files in `media/` with `"origin": "codex"` entries
in `media[]`, write alt text for every image, and set `ai` honestly. Then run
`validate` on the folder. Do not change `status`.

## Pillars

`client-spotlight`, `tip`, `training`, `ai-launch`, `behind-the-scenes`.
```

- [ ] **Step 4: Run the full test suite**

```powershell
Set-Location "D:\K & A Performance Site\Social Media Management\tools"; node node_modules/vitest/vitest.mjs run
```

Expected: all six test files pass, `35 passed` in total (3 + 5 + 4 + 16 + 5 + 2).

- [ ] **Step 5: Commit**

```bash
cd "/d/K & A Performance Site"
git add "Social Media Management/tools/social.mjs" "Social Media Management/README.md"
git commit -m "Add social CLI and the day folder contract README

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Native placeholders and the week of September 28

**Files:**
- Create: `Social Media Management/To Be Released/2026-09-25/post.json`
- Create: `Social Media Management/To Be Released/2026-09-26/post.json`
- Create: `Social Media Management/To Be Released/2026-09-28/` (web showcase reel)
- Create: `Social Media Management/To Be Released/2026-09-29/` (contrast tutorial)
- Create: `Social Media Management/To Be Released/2026-09-30/` (training showcase reel)
- Create: `Social Media Management/To Be Released/2026-10-01/` (hero tutorial)

**Interfaces:**
- Consumes: the CLI from Task 7.
- Produces: six valid day folders. Media is copied, not committed. Manifests and captions are committed.

Captions below are adapted from the existing `post-copy.md` files in `Reels/`. Facebook text is the Facebook section as written there. Instagram text is the same message with the phone line replaced by "link in bio" wording and the hashtags moved to the first comment. Nothing is invented; every claim already exists in the cleared post copy.

- [ ] **Step 1: Write the two native placeholders**

`To Be Released/2026-09-25/post.json`:

```json
{
  "id": "2026-09-25",
  "date": "2026-09-25",
  "time": "09:00",
  "timezone": "America/New_York",
  "status": "native",
  "pillar": "training",
  "title": "Job aids that make sense (video, scheduled in Facebook)",
  "platforms": { "facebook": { "type": "REEL" } }
}
```

`To Be Released/2026-09-26/post.json`:

```json
{
  "id": "2026-09-26",
  "date": "2026-09-26",
  "time": "09:00",
  "timezone": "America/New_York",
  "status": "native",
  "pillar": "behind-the-scenes",
  "title": "Bobbie Connor highlight (scheduled in Facebook)",
  "platforms": { "facebook": { "type": "POST" } }
}
```

- [ ] **Step 2: Plan the four reel days from the finished reels**

```powershell
Set-Location "D:\K & A Performance Site\Social Media Management"
node tools/social.mjs plan 2026-09-28 --pillar client-spotlight --title "Five real websites in fifteen seconds" --from "D:\K & A Performance Site\Reels\Posts 9-4-26\Web reel" --ai-visuals
node tools/social.mjs plan 2026-09-29 --pillar tip --title "Contrast is not a vibe" --from "D:\K & A Performance Site\Reels\instructional reels\contrast" --ai-voice
node tools/social.mjs plan 2026-09-30 --pillar training --title "One designer or a whole bench" --from "D:\K & A Performance Site\Reels\Posts 9-4-26\Training reel" --ai-visuals
node tools/social.mjs plan 2026-10-01 --pillar tip --title "Your hero is a promise, not a photo" --from "D:\K & A Performance Site\Reels\instructional reels\hero" --ai-voice
```

Expected: four `created` lines, each followed by "still to fill in" naming the empty captions and the empty thumbnail alt.

- [ ] **Step 3: Fill 2026-09-28 (web showcase reel)**

Set the thumbnail alt in `To Be Released/2026-09-28/post.json` to:
`"Laptop and phone frames showing five live client websites"`.

`To Be Released/2026-09-28/facebook.md`:

```
Five real websites, five real Gainesville and Jacksonville businesses, fifteen seconds.

An indoor golf club taking founding members before the doors open. A nail studio that swaps its own staff and photos. A concrete contractor whose quotes come in from a phone on a job site.

No templates. No page builders. You own the domain and the code.

The websites are real and live right now. The hands and rooms around the screens are AI assisted, so go type in a URL and see the real thing.

Want a site that actually does something? Call Alex at 904-210-1071 or visit ka-performancefl.com. Quotes are always free.

#GainesvilleFL #GainesvilleSmallBusiness #JacksonvilleFL
```

`To Be Released/2026-09-28/instagram.md`:

```
Five real websites, five real Gainesville and Jacksonville businesses, fifteen seconds.

An indoor golf club taking founding members before the doors open. A nail studio that swaps its own staff and photos. A concrete contractor whose quotes come in from a phone on a job site.

No templates. No page builders. You own the domain and the code.

The websites are real and live right now. The hands and rooms around the screens are AI assisted, so go type in a URL and see the real thing.

Want a site that actually does something? Link in bio. Quotes are always free.

## First comment

#GainesvilleFL #GainesvilleSmallBusiness #JacksonvilleFL #WebDesign #SmallBusinessWebsite
```

- [ ] **Step 4: Fill 2026-09-29 (contrast tutorial)**

Thumbnail alt: `"Amber text on cream beside rust text on cream, with their contrast ratios"`.

`To Be Released/2026-09-29/facebook.md`:

```
Amber on cream looks fine. It measures 2.9 to 1, and that fails the accessibility line for text of any size.

Same palette, rust instead: 6.7 to 1. Passes. Nobody has to squint.

Fifteen seconds, one rule: measure every color you set text in. Your eye is a bad checker.

The voice is AI narrated. The numbers are computed from the real hex values, not eyeballed.

Want a site that looks warm and still reads at a glance? Call Alex at 904-210-1071 or visit ka-performancefl.com.

#GainesvilleFL #WebDesign #Accessibility
```

`To Be Released/2026-09-29/instagram.md`:

```
Amber on cream looks fine. It measures 2.9 to 1, and that fails the accessibility line for text of any size.

Same palette, rust instead: 6.7 to 1. Passes. Nobody has to squint.

Fifteen seconds, one rule: measure every color you set text in. Your eye is a bad checker.

The voice is AI narrated. The numbers are computed from the real hex values, not eyeballed.

Want a site that looks warm and still reads at a glance? Link in bio.

## First comment

#GainesvilleFL #WebDesign #Accessibility #WCAG #ColorContrast
```

- [ ] **Step 5: Fill 2026-09-30 (training showcase reel)**

Thumbnail alt: `"Tablet showing a jobsite safety module with a hazard hunt activity"`.

`To Be Released/2026-09-30/facebook.md`:

```
Need one instructional designer for a single module? Or a whole team for a full curriculum? Same people, same standard.

This is a nine minute jobsite safety module we built as a sample: a hazard hunt you can click or tab through, a controls sorter, and stop-or-go calls with real feedback. Keyboard and screen reader tested, packaged for any LMS.

The courses in this video are original samples we built to show the work, and the hands and rooms around the screens are AI assisted. Try the real thing at ka-performancefl.com/training.

Have a backlog of training that never gets built? Call Alex at 904-210-1071. Quotes are always free.

#GainesvilleFL #TrainingAndDevelopment #ConstructionSafety
```

`To Be Released/2026-09-30/instagram.md`:

```
Need one instructional designer for a single module? Or a whole team for a full curriculum? Same people, same standard.

This is a nine minute jobsite safety module we built as a sample: a hazard hunt you can click or tab through, a controls sorter, and stop-or-go calls with real feedback. Keyboard and screen reader tested, packaged for any LMS.

The courses in this video are original samples we built to show the work, and the hands and rooms around the screens are AI assisted. Try the real thing at the training link in bio.

Have a backlog of training that never gets built? Quotes are always free.

## First comment

#GainesvilleFL #TrainingAndDevelopment #ConstructionSafety #InstructionalDesign #eLearning
```

- [ ] **Step 6: Fill 2026-10-01 (hero tutorial)**

Thumbnail alt: `"Phone showing a homepage headline that reads Fresh sourdough, baked at five, gone by noon"`.

`To Be Released/2026-10-01/facebook.md`:

```
"Welcome to our website" says nothing. The first screen of your site has one job: tell a stranger what they get.

Fresh sourdough, baked at five, gone by noon. That is a hero. A logo over a stock photo is not.

Fifteen seconds on the line that decides whether anyone scrolls.

The bakery is made up. The three real sites at the end are clients of ours, live today. The voice is AI narrated.

Want a homepage that says what you do before anyone scrolls? Call Alex at 904-210-1071 or visit ka-performancefl.com.

#GainesvilleFL #WebDesign #SmallBusiness
```

`To Be Released/2026-10-01/instagram.md`:

```
"Welcome to our website" says nothing. The first screen of your site has one job: tell a stranger what they get.

Fresh sourdough, baked at five, gone by noon. That is a hero. A logo over a stock photo is not.

Fifteen seconds on the line that decides whether anyone scrolls.

The bakery is made up. The three real sites at the end are clients of ours, live today. The voice is AI narrated.

Want a homepage that says what you do before anyone scrolls? Link in bio.

## First comment

#GainesvilleFL #WebDesign #SmallBusiness #Copywriting #Homepage
```

- [ ] **Step 7: Mark the four reel days ready and validate everything**

The media is on disk and the captions are written, so set `"status": "ready"` in each of the four `post.json` files (2026-09-28, 09-29, 09-30, 10-01). Then:

```powershell
Set-Location "D:\K & A Performance Site\Social Media Management"; node tools/social.mjs validate; node tools/social.mjs calendar --today 2026-09-24 --days 10
```

Expected: `6 folder(s) valid`, then a calendar showing 09-25 and 09-26 as `native`, 09-28 through 10-01 as `ready`, and 10-02 as `gap`.

- [ ] **Step 8: Confirm media is ignored and commit**

```bash
cd "/d/K & A Performance Site"
git status --short "Social Media Management/To Be Released" | grep -c "media/" 
```

Expected: `0` (no media paths appear as untracked).

```bash
git add "Social Media Management/To Be Released/2026-09-25/post.json" "Social Media Management/To Be Released/2026-09-26/post.json"
for d in 2026-09-28 2026-09-29 2026-09-30 2026-10-01; do git add "Social Media Management/To Be Released/$d/post.json" "Social Media Management/To Be Released/$d/facebook.md" "Social Media Management/To Be Released/$d/instagram.md"; done
git commit -m "Add native placeholders and the four reel posts for the week of Sept 28

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## What phase 1 leaves for Alex

- Review the six folders. Approve any of the four reel days by changing `"status": "ready"` to `"status": "approved"` in its `post.json`. Nothing goes anywhere until phase 2 exists.
- Friday 2026-10-02 is a gap. The handoff's "Meet the owners" idea fits it, but it needs a photo or video that does not exist yet.
- The contrast 45 second LinkedIn cut still has a stand-in for the DevTools recording. The 15 second cut used here is complete.
