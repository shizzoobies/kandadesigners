import path from "node:path";
import { readManifest, writeManifest, assertTransition } from "./manifest.mjs";
import { validateFolder } from "./validate.mjs";
import { buildPayloads } from "./payload.mjs";
import { UPLOAD_ROLES } from "./upload.mjs";

function activeNetworks(m) {
  return Object.entries(m.platforms).filter(([, cfg]) => !cfg.manual).map(([n]) => n);
}

/** Build and store the Metricool payloads for one approved, uploaded folder. Returns the packets Claude still has to send. */
export function prepareRelease(dir, { draft = false, now = new Date() } = {}) {
  const name = path.basename(dir);
  const problems = validateFolder(dir, { now });
  if (problems.length) return { name, skipped: "invalid", problems, packets: [] };
  const m = readManifest(dir);
  if (m.status !== "approved") return { name, skipped: `status ${m.status}`, packets: [] };
  const r2 = m.r2 || {};
  const missing = m.media.filter((e) => UPLOAD_ROLES.has(e.role) && !(r2[e.file] && r2[e.file].url));
  if (missing.length) return { name, skipped: "media not uploaded", packets: [] };

  const payloads = buildPayloads(dir, { draft });
  m.metricool = m.metricool || {};
  const packets = [];
  for (const network of activeNetworks(m)) {
    const existing = m.metricool[network] || {};
    m.metricool[network] = { ...existing, payload: payloads[network], draft };
    if (!existing.id) packets.push({ folder: name, network, ...payloads[network] });
  }
  m.lastError = null;
  writeManifest(dir, m);
  return { name, packets };
}

/** Write the Metricool id and uuid Claude got back for one network. Schedules the folder once every network has one. */
export function recordRelease(dir, { network, id, uuid, now = new Date() }) {
  const name = path.basename(dir);
  const m = readManifest(dir);
  const rec = m.metricool && m.metricool[network];
  if (!rec || !rec.payload) throw new Error(`${name}: ${network} has no prepared payload; run release first`);
  m.metricool[network] = { ...rec, id: String(id), uuid: String(uuid), scheduledAt: now.toISOString() };
  const done = activeNetworks(m).every((n) => m.metricool[n] && m.metricool[n].id);
  if (done && m.status !== "scheduled") {
    assertTransition(m.status, "scheduled");
    m.status = "scheduled";
  }
  m.lastError = null;
  writeManifest(dir, m);
  return { name, status: m.status };
}
