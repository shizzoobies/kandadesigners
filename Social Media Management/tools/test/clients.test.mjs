import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "social.mjs");
const REVIEW = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "review.mjs");

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

function run(cli, args) {
  const res = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", env: { ...process.env, SOCIAL_ROOT: root } });
  return { code: res.status, out: res.stdout, err: res.stderr };
}

/** A minimal davids-bbq-style client root under a fresh SOCIAL_ROOT. */
function makeClientRoot(slug = "davids-bbq", clientJson = {}) {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "ka-social-"));
  const clientRoot = path.join(root, "clients", slug);
  fs.mkdirSync(path.join(clientRoot, "To Be Released"), { recursive: true });
  fs.mkdirSync(path.join(clientRoot, "Already Released"), { recursive: true });
  fs.writeFileSync(path.join(clientRoot, "client.json"), JSON.stringify({
    slug, name: "David's BBQ", site: "https://davidsbbq.com", sitePath: "D:/x",
    publish: "owner", networks: ["facebook", "instagram"], timezone: "America/New_York",
    handoff: { drive: "K & A Social > Clients > David's BBQ > Ready to post", driveFolderId: "abc123" },
    ...clientJson
  }));
  return clientRoot;
}

function makeApprovedDay(clientRoot, name = "2026-10-06") {
  const dir = path.join(clientRoot, "To Be Released", name);
  fs.mkdirSync(path.join(dir, "media"), { recursive: true });
  fs.writeFileSync(path.join(dir, "post.json"), JSON.stringify({
    id: name, date: name, time: "11:30", timezone: "America/New_York",
    status: "approved", pillar: "menu", title: "Brisket Saturday",
    platforms: { facebook: { type: "POST", caption: "facebook.md" }, instagram: { type: "POST", caption: "instagram.md" } },
    media: [{ file: "media/1.jpg", role: "image", origin: "human", alt: "Brisket plate" }],
    ai: { voice: false, visuals: false }, generate: [], r2: {}, metricool: {}, published: {}, credits: {}, lastError: null
  }));
  fs.writeFileSync(path.join(dir, "facebook.md"), "Brisket Saturday is back. https://davidsbbq.com/?utm_source=facebook&utm_medium=social&utm_campaign=" + name);
  fs.writeFileSync(path.join(dir, "instagram.md"), "Brisket Saturday is back. Link in bio.\n\n## First comment\n\n#Gainesville #BBQ");
  fs.writeFileSync(path.join(dir, "brief.md"), "# Brief: Brisket Saturday\n\nApproved: yes\n");
  fs.writeFileSync(path.join(dir, "media", "1.jpg"), Buffer.alloc(16));
  return dir;
}

describe("--client resolution errors", () => {
  it("fails clearly for an unknown client slug", () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "ka-social-"));
    const r = run(CLI, ["--client", "nope", "validate"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain('unknown client "nope"');
  });

  it("fails clearly when client.json's slug disagrees with the folder", () => {
    const clientRoot = makeClientRoot("davids-bbq", {});
    fs.writeFileSync(path.join(clientRoot, "client.json"), JSON.stringify({ slug: "someone-else" }));
    const r = run(CLI, ["--client", "davids-bbq", "validate"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain('client.json slug is "someone-else"');
  });
});

describe("--client validate", () => {
  it("validates an approved client folder clean against its own network rules", () => {
    const clientRoot = makeClientRoot();
    makeApprovedDay(clientRoot);
    const r = run(CLI, ["--client", "davids-bbq", "validate"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("1 folder(s) valid");
  });

  it("rejects a network the client does not carry", () => {
    const clientRoot = makeClientRoot();
    const dir = makeApprovedDay(clientRoot);
    const m = JSON.parse(fs.readFileSync(path.join(dir, "post.json"), "utf8"));
    m.platforms.linkedin = { type: "POST", caption: "facebook.md" };
    fs.writeFileSync(path.join(dir, "post.json"), JSON.stringify(m));
    const r = run(CLI, ["--client", "davids-bbq", "validate"]);
    expect(r.code).toBe(1);
    expect(r.out).toContain('davids-bbq does not post to "linkedin"');
  });
});

describe("--client upload/release refusal", () => {
  it("refuses upload and release for an owner-published client, with a clear message", () => {
    makeClientRoot();
    for (const command of ["upload", "release"]) {
      const r = run(CLI, ["--client", "davids-bbq", command]);
      expect(r.code).toBe(1);
      expect(r.err).toContain("davids-bbq is published by the owner: use handoff");
    }
  });

  it("refuses reconcile for an owner-published client too", () => {
    makeClientRoot();
    const r = run(CLI, ["--client", "davids-bbq", "reconcile", "--window"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("davids-bbq is published by the owner: nothing to reconcile");
  });
});

describe("desk --site isolation", () => {
  it("refuses a --site other than the client's own slug in --client mode", () => {
    makeClientRoot();
    const r = run(CLI, ["--client", "davids-bbq", "desk", "pull", "--site", "ka-performance"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain('--site must be "davids-bbq"');
  });

  it("refuses a --site other than ka-performance with no --client", () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "ka-social-"));
    fs.mkdirSync(path.join(root, "To Be Released"), { recursive: true });
    const r = run(CLI, ["desk", "pull", "--site", "davids-bbq"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain('--site "davids-bbq" is not ka-performance');
  });
});

describe("--client parsing at the CLI", () => {
  it("accepts --client=<slug>", () => {
    makeClientRoot();
    const r = run(CLI, ["--client=davids-bbq", "validate"]);
    expect(r.code).toBe(0);
  });

  it("refuses a second --client", () => {
    makeClientRoot();
    const r = run(CLI, ["--client", "davids-bbq", "validate", "--client", "davids-bbq"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("--client may only be given once");
  });
});

describe("--client handoff", () => {
  it("needs --client", () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "ka-social-"));
    fs.mkdirSync(path.join(root, "To Be Released"), { recursive: true });
    const r = run(CLI, ["handoff"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("handoff needs --client");
  });

  it("refuses a client that is not published by the owner", () => {
    makeClientRoot("davids-bbq", { publish: "metricool" });
    const r = run(CLI, ["--client", "davids-bbq", "handoff"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("davids-bbq is not published by the owner: handoff does not apply");
  });

  it("hands off an approved folder and skips one that is not, with dry-run writing nothing", () => {
    const clientRoot = makeClientRoot();
    makeApprovedDay(clientRoot, "2026-10-06");
    const readyDir = path.join(clientRoot, "To Be Released", "2026-10-07");
    fs.mkdirSync(readyDir, { recursive: true });
    fs.writeFileSync(path.join(readyDir, "post.json"), JSON.stringify({ id: "2026-10-07", date: "2026-10-07", status: "ready" }));

    const dry = run(CLI, ["--client", "davids-bbq", "handoff", "--dry-run"]);
    expect(dry.code).toBe(0);
    expect(dry.out).toContain("2026-10-06: would hand off");
    expect(dry.out).toContain("Drive folder: \"2026-10-06 Brisket Saturday\"");
    expect(dry.out).toContain("2026-10-07: skipped (status ready)");
    expect(fs.existsSync(path.join(clientRoot, "To Be Released", "2026-10-06"))).toBe(true);
    expect(fs.existsSync(path.join(clientRoot, "Handed Off"))).toBe(false);

    const real = run(CLI, ["--client", "davids-bbq", "handoff"]);
    expect(real.code).toBe(0);
    expect(real.out).toContain("2026-10-06: handed off");
    expect(fs.existsSync(path.join(clientRoot, "To Be Released", "2026-10-06"))).toBe(false);
    expect(fs.existsSync(path.join(clientRoot, "Handed Off", "2026-10-06", "handoff", "Facebook caption.txt"))).toBe(true);
  });
});

describe("--client review", () => {
  it("builds clients/<slug>/review/data.json and files.json from the client's own To Be Released", () => {
    const clientRoot = makeClientRoot();
    makeApprovedDay(clientRoot, "2026-10-06"); // approved: dropped from the desk
    const readyDir = path.join(clientRoot, "To Be Released", "2026-10-07", "media");
    fs.mkdirSync(readyDir, { recursive: true });
    fs.writeFileSync(path.join(clientRoot, "To Be Released", "2026-10-07", "post.json"), JSON.stringify({
      id: "2026-10-07", date: "2026-10-07", time: "10:00", status: "ready", title: "Ribs Sunday",
      platforms: { facebook: { type: "POST", caption: "facebook.md" }, instagram: { type: "POST", caption: "instagram.md" } },
      media: [{ file: "media/1.jpg", role: "image", alt: "Ribs" }]
    }));
    fs.writeFileSync(path.join(clientRoot, "To Be Released", "2026-10-07", "facebook.md"), "Ribs Sunday.");
    fs.writeFileSync(path.join(clientRoot, "To Be Released", "2026-10-07", "instagram.md"), "Ribs Sunday.\n\n## First comment\n\n#BBQ");
    fs.writeFileSync(path.join(readyDir, "1.jpg"), Buffer.alloc(8));

    const r = run(REVIEW, ["--client", "davids-bbq"]);
    expect(r.code).toBe(0);
    const data = JSON.parse(fs.readFileSync(path.join(clientRoot, "review", "data.json"), "utf8"));
    expect(data.posts).toHaveLength(1);
    expect(data.posts[0].id).toBe("2026-10-07");
    expect(data.posts[0].networks).toEqual(["facebook", "instagram"]);
    expect(data.stories).toEqual([]);
    expect(fs.existsSync(path.join(clientRoot, "stories"))).toBe(false);
  });
});
