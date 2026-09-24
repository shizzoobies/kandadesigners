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

  it("prints usage for a bare --days", () => {
    root = makeTempRoot();
    const r = run(["calendar", "--days"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("usage:");
  });

  it("exits 1 when a named folder is skipped as invalid", () => {
    root = makeTempRoot();
    const m = baseManifest({ id: "2030-01-07", date: "2030-01-07", status: "approved" }); m.media[1].alt = "";
    makeDay(root, "2030-01-07", m, baseFiles());
    for (const command of ["upload", "release"]) {
      const r = run([command, "2030-01-07"]);
      expect(r.code).toBe(1);
      expect(r.out).toContain("2030-01-07: skipped (invalid)");
    }
  });

  it("walks a draft from release through rejection, record, and promotion", () => {
    root = makeTempRoot();
    const r2 = {
      "media/reel-vertical.mp4": { key: "k1", url: "https://media.example.com/a.mp4", sha256: "x", uploadedAt: "t" },
      "media/thumbnail.jpg": { key: "k2", url: "https://media.example.com/b.jpg", sha256: "y", uploadedAt: "t" }
    };
    const dir = makeDay(root, "2030-01-07", baseManifest({ id: "2030-01-07", date: "2030-01-07", status: "approved", r2 }), baseFiles());
    const read = () => JSON.parse(fs.readFileSync(path.join(dir, "post.json"), "utf8"));

    let r = run(["release", "2030-01-07", "--draft"]);
    expect(r.code).toBe(0);
    expect(r.out).not.toContain("warning:");
    expect(r.out).toContain("2 packet(s) to send");
    r = run(["release", "2030-01-07", "--draft"]);
    expect(r.out).toMatch(/^warning: 2030-01-07 facebook was prepared before at \S+; check getScheduledPosts for that date before sending again$/m);

    r = run(["release", "--record", "2030-01-07", "--network", "instagram", "--error", "VIDEO_THUMBNAIL_NOT_APPLICABLE"]);
    expect(r.code).toBe(0);
    expect(read().lastError).toBe("instagram: VIDEO_THUMBNAIL_NOT_APPLICABLE");
    expect(read().status).toBe("approved");

    expect(run(["release", "--record", "2030-01-07", "--network", "facebook", "--id", "1", "--uuid", "u-1"]).code).toBe(0);
    expect(run(["release", "--record", "2030-01-07", "--network", "instagram", "--id", "2", "--uuid", "u-2"]).code).toBe(0);
    expect(read().status).toBe("scheduled");

    r = run(["release", "--promote", "2030-01-07"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("2 draft(s) to promote through Metricool. For each one call updateScheduledPost with blogId 7076479, the id, the uuid, and info as a JSON string, then run release --promoted.");
    const packets = r.out.trim().split("\n").slice(1).map((l) => JSON.parse(l));
    expect(packets.map((p) => [p.network, p.id, p.uuid, p.info.draft])).toEqual([["facebook", "1", "u-1", false], ["instagram", "2", "u-2", false]]);

    r = run(["release", "--promoted", "2030-01-07", "--network", "facebook", "--id", "9"]);
    expect(r.code).toBe(0);
    expect(read().metricool.facebook).toMatchObject({ draft: false, id: "9", uuid: "u-1" });
    expect(run(["release", "--promoted", "2030-01-07", "--network", "instagram"]).code).toBe(1);
  });

  it("prints the reconcile window as JSON", () => {
    root = makeTempRoot();
    makeDay(root, "2030-01-07", baseManifest({ id: "2030-01-07", date: "2030-01-07", status: "scheduled" }), baseFiles());
    const r = run(["reconcile", "--window", "--now", "2030-01-06T12:00:00Z"]);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.out)).toEqual({ fromDate: "2030-01-07T00:00:00-05:00", toDate: "2030-01-07T23:59:59-05:00", timezone: "America/New_York", extendedRange: true });
  });

  it("reports a folder reconcile cannot move, keeps going, and exits 1", () => {
    root = makeTempRoot();
    const published = baseManifest({ status: "published", published: { at: "2026-01-05T14:00:00.000Z" } });
    makeDay(root, "2026-01-05", published, baseFiles());
    makeDay(root, "2026-01-05", published, {}, "Already Released");
    const file = path.join(root, "scheduled.json");
    fs.writeFileSync(file, JSON.stringify({ data: [] }));
    const r = run(["reconcile", "--from", file, "--dry-run", "--now", "2026-01-05T15:00:00Z"]);
    expect(r.code).toBe(1);
    expect(r.out).toContain("2026-01-05: failed: 2026-01-05: already exists in Already Released");
    expect(r.out).toContain("waiting: none");
  });
});
