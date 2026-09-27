import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadClient, isOwnerPublished } from "../lib/client.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

describe("loadClient", () => {
  it("returns null when there is no client.json", () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "ka-social-"));
    expect(loadClient(root)).toBeNull();
  });

  it("parses client.json when present", () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "ka-social-"));
    const client = { slug: "davids-bbq", name: "David's BBQ", publish: "owner", networks: ["facebook", "instagram"] };
    fs.writeFileSync(path.join(root, "client.json"), JSON.stringify(client));
    expect(loadClient(root)).toEqual(client);
  });
});

describe("isOwnerPublished", () => {
  it("is true only for publish: owner, and false for no client at all", () => {
    expect(isOwnerPublished({ publish: "owner" })).toBe(true);
    expect(isOwnerPublished({ publish: "metricool" })).toBe(false);
    expect(isOwnerPublished(null)).toBe(false);
  });
});
