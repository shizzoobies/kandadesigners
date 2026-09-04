// One composition per plate, for the Phase 4 gate. Registered only by
// src/plates-entry.ts, never by src/Root.tsx.

import { Composition } from "remotion";
import capturesIndex from "../assets/captures/captures.json";
import { PlateComposite } from "./components/PlateComposite";
import { listPlates } from "./lib/plates";

const FPS = 30;
/** A plate beat in the vertical master is about 1.6 seconds. */
const SHOT_FRAMES = 48;

/**
 * Stand-in captures, for a plate whose real clip has not been recorded yet.
 *
 * The training set binds to clips of the /training pages that are being
 * captured in a parallel run, and a gate still is worth rendering before they
 * land: it proves the quad, the seat, the spill and the crop, none of which
 * depend on which site is inside the screen. getCapture throws on an unknown
 * id, so without this the whole entry fails to register rather than one
 * composition failing to render.
 *
 * The stand-in matches the plate's viewport, because the crop is the one thing
 * the choice of clip does change: a desktop capture in a phone quad is a
 * different picture from a mobile one. Any still rendered against a stand-in is
 * called out as such in the gate report, and rerendering once the real clip
 * exists is the whole of the fix.
 */
const STAND_IN_DESKTOP = "fore-motion-golf-home-desktop";
const STAND_IN_MOBILE = "project-makeover-home-mobile";

const KNOWN_CAPTURE_IDS = new Set(
  (capturesIndex as { id: string }[]).map((c) => c.id),
);

function captureForPlate(captureId: string): string {
  if (KNOWN_CAPTURE_IDS.has(captureId)) return captureId;
  return captureId.endsWith("-mobile") ? STAND_IN_MOBILE : STAND_IN_DESKTOP;
}

export const PlatesRoot: React.FC = () => {
  return (
    <>
      {listPlates()
        .filter((plate) => plate.captureId)
        .map((plate) => (
          <Composition
            key={plate.id}
            id={`PlateCheck-${plate.id}`}
            component={PlateComposite}
            durationInFrames={SHOT_FRAMES}
            fps={FPS}
            width={1080}
            height={1920}
            defaultProps={{
              plateId: plate.id,
              captureId: captureForPlate(plate.captureId),
            }}
          />
        ))}
    </>
  );
};
