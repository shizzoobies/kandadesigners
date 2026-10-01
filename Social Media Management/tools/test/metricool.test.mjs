import { describe, it, expect } from "vitest";
import { userToken, brandId, metricoolGet, listBrands, readMetricoolConfig } from "../lib/metricool.mjs";

const config = { base: "https://app.metricool.com/api/", userId: "42", brands: { "ka-performance": "7076479" } };

function fakeFetch(status, body) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    return { ok: status >= 200 && status < 300, status, text: async () => (typeof body === "string" ? body : JSON.stringify(body)) };
  };
  return { fetchImpl, calls };
}

describe("metricool", () => {
  it("reads the token from the environment first", () => {
    expect(userToken({ METRICOOL_USER_TOKEN: "abc" }, "linux")).toBe("abc");
    expect(() => userToken({}, "linux")).toThrow(/METRICOOL_USER_TOKEN is not set/);
  });

  it("falls back to the user scope reader on Windows and to a clear error when that fails", () => {
    expect(userToken({}, "win32", () => "from-registry")).toBe("from-registry");
    expect(() => userToken({}, "win32", () => { throw new Error("spawn powershell ENOENT"); })).toThrow("METRICOOL_USER_TOKEN is not set");
    expect(() => userToken({}, "win32", () => "")).toThrow("METRICOOL_USER_TOKEN is not set");
  });

  it("keeps no secret in the config file and knows the K&A brand", () => {
    const real = readMetricoolConfig();
    expect(Object.keys(real).sort()).toEqual(["base", "brands", "userId"]);
    expect(brandId("ka-performance", real)).toBe("7076479");
    expect(() => brandId("nobody", config)).toThrow(/no Metricool brand for "nobody"/);
  });

  it("sends the token only in the header, with userId and blogId in the query", async () => {
    const { fetchImpl, calls } = fakeFetch(200, { ok: true });
    const out = await metricoolGet("/v2/scheduler/posts", { start: "2026-10-01", skip: undefined }, { config, token: "secret-token", fetchImpl, blogId: "7076479" });
    expect(out).toEqual({ ok: true });
    const url = new URL(calls[0].url);
    expect(url.origin + url.pathname).toBe("https://app.metricool.com/api/v2/scheduler/posts");
    expect(url.searchParams.get("userId")).toBe("42");
    expect(url.searchParams.get("blogId")).toBe("7076479");
    expect(url.searchParams.get("start")).toBe("2026-10-01");
    expect(url.searchParams.has("skip")).toBe(false);
    expect(calls[0].url).not.toContain("secret-token");
    expect(calls[0].init.method).toBe("GET");
    expect(calls[0].init.headers["X-Mc-Auth"]).toBe("secret-token");
  });

  it("leaves blogId out when no brand is given", async () => {
    const { fetchImpl, calls } = fakeFetch(200, []);
    await metricoolGet("admin/simpleProfiles", {}, { config, token: "t", fetchImpl });
    expect(new URL(calls[0].url).searchParams.has("blogId")).toBe(false);
  });

  it("reports a rejected token without echoing it", async () => {
    const { fetchImpl } = fakeFetch(401, "bad token secret-token");
    await expect(metricoolGet("admin/simpleProfiles", {}, { config, token: "secret-token", fetchImpl })).rejects.toThrow(/returned 401 \(check the token/);
    await expect(metricoolGet("admin/simpleProfiles", {}, { config, token: "secret-token", fetchImpl })).rejects.not.toThrow(/secret-token/);
  });

  it("reports a network failure and a non-JSON reply clearly", async () => {
    const down = async () => { throw new Error("getaddrinfo ENOTFOUND"); };
    await expect(metricoolGet("x", {}, { config, token: "t", fetchImpl: down })).rejects.toThrow(/could not be reached: getaddrinfo ENOTFOUND/);
    const { fetchImpl } = fakeFetch(200, "<html>");
    await expect(metricoolGet("x", {}, { config, token: "t", fetchImpl })).rejects.toThrow(/did not return JSON/);
  });

  it("lists brands from either response shape, with their connected networks", async () => {
    const wrapped = fakeFetch(200, { data: [{ id: 7076479, label: "K & A Performance", timezone: "America/New_York", networksData: { facebookData: "123", instagramData: "kaperformancefl", linkedinData: "", youtubeData: "UC1" } }] });
    expect(await listBrands({ config, token: "t", fetchImpl: wrapped.fetchImpl })).toEqual([
      { id: "7076479", label: "K & A Performance", timezone: "America/New_York", networks: ["facebook", "instagram", "youtube"] }
    ]);
    // The flat REST shape, as the live API returned it on 2026-10-01: unconnected networks are null,
    // and a LinkedIn company page is `linkedinCompany`.
    const flat = fakeFetch(200, [
      { id: 7076479, label: "K & A Performance", timezone: "America/New_York", facebook: "123", facebookPageId: "123", instagram: "kaperformancefl", linkedinCompany: "urn:li:organization:1", youtube: "UC1", tiktok: null, gmb: null, linkedInTokenExpiration: null },
      { id: 99, label: "Fore Motion Golf", facebook: null, instagram: null, linkedinCompany: null, youtube: null }
    ]);
    expect(await listBrands({ config, token: "t", fetchImpl: flat.fetchImpl })).toEqual([
      { id: "7076479", label: "K & A Performance", timezone: "America/New_York", networks: ["facebook", "instagram", "linkedin", "youtube"] },
      { id: "99", label: "Fore Motion Golf", timezone: "", networks: [] }
    ]);
    const odd = fakeFetch(200, { message: "nope" });
    await expect(listBrands({ config, token: "t", fetchImpl: odd.fetchImpl })).rejects.toThrow(/unexpected shape/);
  });
});
