import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const TO_BE_RELEASED = "To Be Released";
export const ALREADY_RELEASED = "Already Released";
export const HANDED_OFF = "Handed Off";
export const CLIENTS = "clients";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Absolute path of the working root. With no `clientSlug`, this is the
 * Social Media Management folder (SOCIAL_ROOT overrides it, for tests and
 * the junction). With a `clientSlug`, it is that client's own folder,
 * `<Social Media Management>/clients/<slug>`: an error if that folder or its
 * `client.json` is missing, or if `client.json`'s own `slug` disagrees.
 */
export function resolveRoot(env = process.env, clientSlug) {
  const base = env.SOCIAL_ROOT ? path.resolve(env.SOCIAL_ROOT) : path.resolve(here, "..", "..");
  if (!clientSlug) return base;
  const clientRoot = path.join(base, CLIENTS, clientSlug);
  if (!fs.existsSync(clientRoot)) throw new Error(`unknown client "${clientSlug}": ${clientRoot} does not exist`);
  const clientJsonPath = path.join(clientRoot, "client.json");
  if (!fs.existsSync(clientJsonPath)) throw new Error(`client "${clientSlug}" has no client.json`);
  let client;
  try {
    client = JSON.parse(fs.readFileSync(clientJsonPath, "utf8"));
  } catch {
    throw new Error(`client "${clientSlug}": client.json is not valid JSON`);
  }
  if (client.slug !== clientSlug) throw new Error(`client "${clientSlug}": client.json slug is "${client.slug}"`);
  return clientRoot;
}

export function dayDir(root, name, bucket = TO_BE_RELEASED) {
  return path.join(root, bucket, name);
}

const CLIENT_SLUG = /^[a-z0-9-]+$/;

/**
 * Pulls a global `--client <slug>` (or `--client=<slug>`) out of argv,
 * wherever it sits (before or after the command), for social.mjs and
 * review.mjs alike. Returns the slug and the remaining argv with that token
 * (or pair) removed. Throws on a missing value, a value that looks like
 * another flag, a slug that is not `[a-z0-9-]+`, or a second `--client`.
 */
export function extractClientFlag(argv) {
  const out = [];
  let client;
  let seen = false;
  const takeSlug = (raw) => {
    if (seen) throw new Error("--client may only be given once");
    seen = true;
    if (!CLIENT_SLUG.test(raw)) throw new Error(`--client "${raw}" is not a valid slug (lowercase letters, digits, hyphens only)`);
    client = raw;
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--client") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) throw new Error("--client needs a value");
      takeSlug(value);
      i++;
      continue;
    }
    if (a.startsWith("--client=")) {
      takeSlug(a.slice("--client=".length));
      continue;
    }
    out.push(a);
  }
  return { client, rest: out };
}
