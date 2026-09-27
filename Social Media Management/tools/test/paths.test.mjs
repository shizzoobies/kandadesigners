import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveRoot, dayDir, extractClientFlag, TO_BE_RELEASED, ALREADY_RELEASED, HANDED_OFF, CLIENTS } from "../lib/paths.mjs";

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
    expect(HANDED_OFF).toBe("Handed Off");
  });
});

describe("extractClientFlag", () => {
  it("pulls --client <slug> out from anywhere and leaves the rest untouched", () => {
    expect(extractClientFlag(["--client", "davids-bbq", "validate"])).toEqual({ client: "davids-bbq", rest: ["validate"] });
    expect(extractClientFlag(["validate", "--client", "davids-bbq"])).toEqual({ client: "davids-bbq", rest: ["validate"] });
    expect(extractClientFlag(["validate", "--all"])).toEqual({ client: undefined, rest: ["validate", "--all"] });
  });

  it("accepts --client=<slug>", () => {
    expect(extractClientFlag(["--client=davids-bbq", "validate"])).toEqual({ client: "davids-bbq", rest: ["validate"] });
  });

  it("throws on --client with no value, or another flag right after", () => {
    expect(() => extractClientFlag(["--client"])).toThrow(/--client needs a value/);
    expect(() => extractClientFlag(["--client", "--dry-run"])).toThrow(/--client needs a value/);
    expect(() => extractClientFlag(["--client="])).toThrow(/not a valid slug/);
  });

  it("throws on a slug that is not lowercase letters, digits and hyphens", () => {
    expect(() => extractClientFlag(["--client", "Davids_BBQ"])).toThrow(/not a valid slug/);
    expect(() => extractClientFlag(["--client", "davids bbq"])).toThrow(/not a valid slug/);
  });

  it("throws on a second --client, in either form", () => {
    expect(() => extractClientFlag(["--client", "a", "--client", "b"])).toThrow(/--client may only be given once/);
    expect(() => extractClientFlag(["--client", "a", "--client=b"])).toThrow(/--client may only be given once/);
    expect(() => extractClientFlag(["--client=a", "--client=a"])).toThrow(/--client may only be given once/);
  });
});

describe("paths client root", () => {
  let base;
  afterEach(() => { if (base) fs.rmSync(base, { recursive: true, force: true }); });

  function withClient(slug, clientJson) {
    base = fs.mkdtempSync(path.join(os.tmpdir(), "ka-social-"));
    const clientRoot = path.join(base, CLIENTS, slug);
    fs.mkdirSync(clientRoot, { recursive: true });
    if (clientJson !== null) fs.writeFileSync(path.join(clientRoot, "client.json"), JSON.stringify(clientJson));
    return clientRoot;
  }

  it("resolves clients/<slug> under SOCIAL_ROOT when client.json's slug agrees", () => {
    const clientRoot = withClient("davids-bbq", { slug: "davids-bbq", name: "David's BBQ" });
    expect(resolveRoot({ SOCIAL_ROOT: base }, "davids-bbq")).toBe(clientRoot);
  });

  it("errors when the client folder does not exist", () => {
    base = fs.mkdtempSync(path.join(os.tmpdir(), "ka-social-"));
    expect(() => resolveRoot({ SOCIAL_ROOT: base }, "nope")).toThrow(/unknown client "nope"/);
  });

  it("errors when the folder exists but client.json is missing", () => {
    withClient("davids-bbq", null);
    expect(() => resolveRoot({ SOCIAL_ROOT: base }, "davids-bbq")).toThrow(/has no client\.json/);
  });

  it("errors when client.json's own slug disagrees with the folder name", () => {
    withClient("davids-bbq", { slug: "someone-else" });
    expect(() => resolveRoot({ SOCIAL_ROOT: base }, "davids-bbq")).toThrow(/client\.json slug is "someone-else"/);
  });
});
