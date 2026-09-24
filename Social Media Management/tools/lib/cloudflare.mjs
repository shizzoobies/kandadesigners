import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const WRANGLER = path.resolve(here, "..", "node_modules", "wrangler", "bin", "wrangler.js");
const CONFIG_FILE = path.resolve(here, "..", "config", "r2.json");

export const CONTENT_TYPES = {
  ".mp4": "video/mp4", ".mov": "video/quicktime",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"
};

export function readR2Config(file = CONFIG_FILE) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * The Cloudflare API token. The environment wins. On Windows, shells started
 * by the desktop app inherit an old environment, so fall back to the user
 * scope variable through PowerShell. Never log or persist the value.
 */
export function apiToken(env = process.env, platform = process.platform) {
  if (env.CLOUDFLARE_API_TOKEN) return env.CLOUDFLARE_API_TOKEN;
  if (platform === "win32") {
    const out = execFileSync("powershell", ["-NoProfile", "-Command", "[Environment]::GetEnvironmentVariable('CLOUDFLARE_API_TOKEN','User')"], { encoding: "utf8" }).trim();
    if (out) return out;
  }
  throw new Error("CLOUDFLARE_API_TOKEN is not set");
}

/** Run wrangler and return stdout. The token travels only in the child environment. */
export function wrangler(args, { config = readR2Config(), token = apiToken(), run = spawnSync } = {}) {
  const res = run(process.execPath, [WRANGLER, ...args], {
    encoding: "utf8",
    env: { ...process.env, CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: config.accountId, WRANGLER_SEND_METRICS: "false" }
  });
  if (res.status !== 0) throw new Error(`wrangler ${args.slice(0, 3).join(" ")} failed: ${String(res.stderr || res.stdout || "").trim()}`);
  return res.stdout;
}

export function r2Put(key, file, opts = {}) {
  const config = opts.config || readR2Config();
  const ct = CONTENT_TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  return wrangler(["r2", "object", "put", `${config.bucket}/${key}`, "--file", file, "--content-type", ct, "--remote", "--force"], { ...opts, config });
}

export function r2Delete(key, opts = {}) {
  const config = opts.config || readR2Config();
  return wrangler(["r2", "object", "delete", `${config.bucket}/${key}`, "--remote", "--force"], { ...opts, config });
}

export function publicUrl(key, config = readR2Config()) {
  return `${config.publicBase}/${key}`;
}
