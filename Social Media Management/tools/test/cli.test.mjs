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
