// Index of the Playwright captures in assets/captures. Scene code must look a
// clip up by id through getCapture(), never by hardcoding a file path.

import { staticFile } from "remotion";
import capturesIndex from "../../assets/captures/captures.json";
import type { ContentBox } from "./content-fill";

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
  /**
   * Where the captured page sits inside the frame, in capture pixels. Measured
   * by scripts/capture.ts off the clip's own first frame, and the whole frame
   * for every page that fills its viewport. See src/lib/content-fill.ts.
   */
  contentBox?: ContentBox;
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

/**
 * Looks a capture up by id and returns null if it is not there yet.
 *
 * Added 2026-09-04 for the training reel, whose interaction captures are being
 * recorded by another agent while this reel is being built. A scene that can
 * see the absence renders a labelled grey stand-in; getCapture() below still
 * throws, because a scene that cannot handle the absence should fail loudly.
 */
export function findCapture(id: string): CaptureEntry | null {
  return CAPTURES.find((c) => c.id === id) ?? null;
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
