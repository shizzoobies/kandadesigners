// Approval L3: copies METRICOOL_USER_TOKEN from Alex's Windows user
// environment into ka-analytics-sync's secret store, through wrangler's stdin.
// The value is never printed, logged, or written to disk, and never passes
// through chat. Run from D:\ka-site-admin\admin.
import { execFileSync, spawnSync } from "node:child_process";

const userVar = (name) => execFileSync("powershell", ["-NoProfile", "-Command", `[Environment]::GetEnvironmentVariable('${name}','User')`], { encoding: "utf8" }).trim();

const token = process.env.METRICOOL_USER_TOKEN || userVar("METRICOOL_USER_TOKEN");
if (!token) {
  console.error("METRICOOL_USER_TOKEN is not set in the user environment.");
  process.exit(1);
}
const cf = process.env.CLOUDFLARE_API_TOKEN || userVar("CLOUDFLARE_API_TOKEN");
const res = spawnSync(process.execPath, ["./node_modules/wrangler/bin/wrangler.js", "secret", "put", "METRICOOL_USER_TOKEN", "-c", "analytics-sync/wrangler.jsonc"], {
  input: token,
  encoding: "utf8",
  env: { ...process.env, CLOUDFLARE_API_TOKEN: cf, WRANGLER_SEND_METRICS: "false" },
});
const out = `${res.stdout ?? ""}${res.stderr ?? ""}`.split(token).join("<token>");
console.log(out.trim());
process.exit(res.status ?? 1);
