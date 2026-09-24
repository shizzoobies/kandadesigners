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
