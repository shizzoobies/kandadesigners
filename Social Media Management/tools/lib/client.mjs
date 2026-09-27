import fs from "node:fs";
import path from "node:path";

/**
 * Reads `<root>/client.json`. Returns null when root has no client.json (the
 * K&A root itself, or any folder that is not a client's own root).
 * `resolveRoot` already checked the folder exists and its slug agrees when a
 * client slug was requested, so this does no further validation.
 */
export function loadClient(root) {
  const file = path.join(root, "client.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** True when K&A has no social logins for this client and the owner posts by hand. */
export function isOwnerPublished(client) {
  return Boolean(client && client.publish === "owner");
}
