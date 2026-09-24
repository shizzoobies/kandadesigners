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
