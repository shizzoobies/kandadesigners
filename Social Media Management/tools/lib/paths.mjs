import path from "node:path";
import { fileURLToPath } from "node:url";

export const TO_BE_RELEASED = "To Be Released";
export const ALREADY_RELEASED = "Already Released";

const here = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path of the Social Media Management folder. SOCIAL_ROOT overrides it (tests, junction). */
export function resolveRoot(env = process.env) {
  if (env.SOCIAL_ROOT) return path.resolve(env.SOCIAL_ROOT);
  return path.resolve(here, "..", "..");
}

export function dayDir(root, name, bucket = TO_BE_RELEASED) {
  return path.join(root, bucket, name);
}
