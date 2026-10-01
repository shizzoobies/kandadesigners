import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.resolve(here, "..", "config", "metricool.json");
const TOKEN_VAR = "METRICOOL_USER_TOKEN";

/** userId, API base and the brand id of each site slug. No secrets live in this file. */
export function readMetricoolConfig(file = CONFIG_FILE) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** Read the user-scope METRICOOL_USER_TOKEN through PowerShell. Never log or persist the value. */
function defaultReadUser() {
  return execFileSync("powershell", ["-NoProfile", "-Command", `[Environment]::GetEnvironmentVariable('${TOKEN_VAR}','User')`], { encoding: "utf8" }).trim();
}

/**
 * The Metricool API token (Account Settings > API, Advanced plan and up). The
 * environment wins. On Windows, shells started by the desktop app inherit an
 * old environment, so fall back to the user scope variable through
 * PowerShell. Never log or persist the value.
 */
export function userToken(env = process.env, platform = process.platform, readUser = defaultReadUser) {
  if (env[TOKEN_VAR]) return env[TOKEN_VAR];
  if (platform === "win32") {
    try {
      const out = readUser();
      if (out) return out;
    } catch {
      // fall through to the error below
    }
  }
  throw new Error(`${TOKEN_VAR} is not set`);
}

/** The brand (blog) id for a site slug, from config. */
export function brandId(slug, config = readMetricoolConfig()) {
  const id = config.brands && config.brands[slug];
  if (!id) throw new Error(`no Metricool brand for "${slug}" in tools/config/metricool.json`);
  return String(id);
}

/**
 * GET a Metricool API path and return the parsed JSON. The token travels only
 * in the X-Mc-Auth header, never in the URL or in an error message. `blogId`
 * is added when a brand is given; `userId` always is.
 */
export async function metricoolGet(pathname, params = {}, { config = readMetricoolConfig(), token = userToken(), fetchImpl = fetch, blogId } = {}) {
  const url = new URL(config.base.replace(/\/$/, "") + "/" + String(pathname).replace(/^\//, ""));
  url.searchParams.set("userId", String(config.userId));
  if (blogId !== undefined) url.searchParams.set("blogId", String(blogId));
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  let res;
  try {
    res = await fetchImpl(url, { method: "GET", headers: { "X-Mc-Auth": token, "Content-Type": "application/json" } });
  } catch (err) {
    throw new Error(`Metricool ${url.pathname} could not be reached: ${err.message}`);
  }
  const text = await res.text();
  if (!res.ok) {
    const hint = res.status === 401 || res.status === 403 ? " (check the token in Account Settings > API and that the plan includes API access)" : "";
    throw new Error(`Metricool ${url.pathname} returned ${res.status}${hint}: ${text.slice(0, 200).split(token).join("<token>")}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Metricool ${url.pathname} did not return JSON`);
  }
}

const NETWORK_KEYS = ["facebook", "instagram", "linkedin", "youtube", "tiktok", "twitter", "threads", "pinterest", "bluesky", "gmb", "twitch"];

/** The networks a brand row has connected, whichever shape the API returns them in. */
function connectedNetworks(row) {
  const out = new Set();
  const data = row.networksData && typeof row.networksData === "object" ? row.networksData : {};
  for (const key of Object.keys(data)) {
    if (data[key]) out.add(key.replace(/Data$/, ""));
  }
  for (const key of NETWORK_KEYS) {
    const v = row[key] ?? row[`${key}Data`];
    if (v) out.add(key);
  }
  return [...out].sort();
}

/**
 * Every brand this account manages: `{ id, label, timezone, networks }`.
 * Uses /admin/simpleProfiles, the endpoint Metricool documents for finding a
 * brand's blogId.
 */
export async function listBrands(opts = {}) {
  const body = await metricoolGet("admin/simpleProfiles", {}, opts);
  const rows = Array.isArray(body) ? body : Array.isArray(body && body.data) ? body.data : null;
  if (!rows) throw new Error("Metricool admin/simpleProfiles returned an unexpected shape");
  return rows.map((row) => ({
    id: String(row.id ?? row.blogId ?? ""),
    label: String(row.label ?? row.name ?? ""),
    timezone: row.timezone ? String(row.timezone) : "",
    networks: connectedNetworks(row)
  }));
}
