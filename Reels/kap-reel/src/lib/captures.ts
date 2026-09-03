// Index of the Playwright captures in assets/captures. Scene code must look a
// clip up by id through getCapture(), never by hardcoding a file path.

import { staticFile } from "remotion";
import capturesIndex from "../../assets/captures/captures.json";

export type CaptureViewport = "mobile" | "desktop";

export type CaptureEntry = {
  id: string;
  project: string;
  route: string;
  viewport: string;
  /** Repo-relative path as written by scripts/capture.ts. */
  path: string;
  stillPath: string;
  width: number;
  height: number;
  fps: number;
  durationFrames: number;
  durationSec: number;
};

const CAPTURES = capturesIndex as CaptureEntry[];

/**
 * Turns the repo-relative capture path into a Remotion static file URL.
 * remotion.config.ts sets the public dir to ./assets, so the "assets/" prefix
 * is stripped here.
 */
export function captureSrc(entry: CaptureEntry): string {
  return staticFile(entry.path.replace(/^assets\//, ""));
}

/** Looks a capture up by id. Throws if the id is not in captures.json. */
export function getCapture(id: string): CaptureEntry {
  const found = CAPTURES.find((c) => c.id === id);
  if (!found) {
    throw new Error(
      `No capture with id "${id}" in captures.json. Known ids: ${CAPTURES.map(
        (c) => c.id,
      ).join(", ")}`,
    );
  }
  return found;
}

/** Convenience for the common "home page, one viewport" lookup. */
export function getHomeCapture(
  projectId: string,
  viewport: CaptureViewport,
): CaptureEntry {
  return getCapture(`${projectId}-home-${viewport}`);
}
