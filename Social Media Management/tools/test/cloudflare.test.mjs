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
