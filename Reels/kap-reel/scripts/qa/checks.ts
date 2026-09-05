// The nine measured checks.
//
// Every one of them answers with a number. A check that cannot take its
// measurement says so and returns SKIP rather than passing quietly, because a
// harness that reports PASS when it looked at nothing is worse than no harness.

import capturesIndex from "../../assets/captures/captures.json";
import {
  DEVICE_BODY,
  DEVICE_TOL,
  FLAT_DARK,
  FLAT_LIGHT,
  LOGO_FRAME,
  LOGO_RUST,
  RETIRED_GOLD,
  SCRIM,
  SCRIM_TOL,
  canvasCentre,
  deviceCentreTarget,
  expectedScreenAspect,
  formatMetrics,
  plateQuadOnCanvas,
  reservedZones,
  safeArea,
  type FormatKey,
} from "./geometry";
import {
  colourDistance,
  countNear,
  countNonBackground,
  dominantColour,
  findFlatBlock,
  inkBox,
  inkCoverage,
  longestRun,
  near,
  pixelAt,
  psnr,
  quadRingSamples,
  rectToQuad,
  type InkBox,
  type Point,
  type Quad,
  type Raw,
  type Rect,
  type RGB,
} from "./pixels";
import type { Shot } from "./shots";

export type Verdict = "PASS" | "FAIL" | "REVIEW" | "SKIP";

export type CheckId = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i";

export const CHECK_NAMES: Record<CheckId, string> = {
  a: "text centring",
  b: "safe zones",
  c: "device geometry",
  d: "screen fill",
  e: "blank frame",
  f: "logo",
  g: "plate review",
  h: "cut continuity",
  i: "motion",
};

export type Finding = {
  composition: string;
  shot: string;
  frame: number;
  label: string;
  check: CheckId;
  verdict: Verdict;
  detail: string;
  metrics: Record<string, number | string | boolean | null>;
};

// ---------------------------------------------------------------------------
// Thresholds. Every one of them is quoted in the README QA section.
// ---------------------------------------------------------------------------

/**
 * Check (a). Pixels a text block may sit off its centre line, authored at 1080
 * canvas width and scaled by typeScale like every other number in this project.
 *
 * The scaling is not slack, it is the same relative rule Section 7 states for
 * type size. What this tolerance is actually absorbing is the type's own side
 * bearings and the trailing letter space of a negative tracking, and both of
 * those are drawn at the type's size. The landscape crop renders at 1.778, so
 * they are 1.778 times as wide there. The centring pass on 2026-09-04 measured
 * exactly that: the surfaces tour word in landscape sat +5 against its own box
 * before the change and +5 after it, which is the type and not the layout.
 *
 * At 1080 width the line is 4 px. In landscape it is 7.1.
 */
export const CENTRE_TOLERANCE_PX = 4;

export function centreTolerance(format: FormatKey): number {
  return CENTRE_TOLERANCE_PX * formatMetrics(format).typeScale;
}
/** Check (b). Text pixels allowed inside a reserved zone, for antialiasing. */
export const ZONE_INK_ALLOWANCE_PX = 120;
/** Check (c). Fractional error allowed on a screen's aspect ratio. */
export const ASPECT_TOLERANCE = 0.01;
/** Check (c). Pixels a device box may sit off its centre line. */
export const DEVICE_CENTRE_TOLERANCE_PX = 4;
/** Check (d). Fraction of the ring that may read as a flat page backdrop. */
export const SCREEN_FILL_TOLERANCE = 0.02;
/** Check (d). How far inside the edge the ring is sampled. */
export const RING_INSET_PX = 6;
/** Check (d). How close a ring pixel has to be to a backdrop colour to count. */
export const BACKDROP_TOLERANCE = 12;
/**
 * Check (d). The whole ring this flat is not a page with content in it. It is
 * dead space, a blank screen, or a shot that has been cropped until nothing is
 * left, and it is the one reading on this check that no reviewer would argue
 * with. Everything from the 2 percent line up to here is reported as REVIEW
 * with its per edge numbers. See the long note in checkScreenFill.
 */
export const DEAD_RING_FRACTION = 0.95;
/** Check (e). Fraction of the frame that has to differ from the background. */
export const MIN_INK_COVERAGE = 0.002;
/** Check (f). Pixels of each drawn lockup colour the end card must carry. */
export const LOGO_MIN_PIXELS = 200;
/** Check (f). Pixels of the retired gold crest that count as a blob. */
export const RETIRED_CREST_BLOB_PX = 3000;
/** Check (h). Below this the cut is a hard scene change, which is expected. */
export const CONTINUITY_REVIEW_DB = 8;
/** Check (i). At or over this the shot is frozen at the cut. */
export const FROZEN_DB = 40;

/** How far a pixel has to be from the background to count as ink. */
const INK_TOLERANCE = 60;

// ---------------------------------------------------------------------------
// Capture backdrops
// ---------------------------------------------------------------------------

type CaptureRecord = {
  id: string;
  width: number;
  height: number;
  contentBox?: { x: number; y: number; w: number; h: number } | null;
};

const CAPTURES = capturesIndex as unknown as CaptureRecord[];

/**
 * The backdrop colour of each clip, keyed by capture id.
 *
 * scripts/capture.ts exports clipBackgroundColor() for exactly this, and says
 * so: the ring check measures a backdrop the same way the content box that
 * hides it was measured. qa.ts fills this in before measuring; if ffmpeg is not
 * on PATH, or capture.ts cannot be loaded, it stays empty and the check says it
 * is in screening mode.
 */
const CLIP_BACKDROPS = new Map<string, RGB>();

export function setClipBackdrops(map: Map<string, RGB>): void {
  CLIP_BACKDROPS.clear();
  for (const [id, rgb] of map) CLIP_BACKDROPS.set(id, rgb);
}

/**
 * The colours a page paints its own dead space with, and whether matching them
 * is a verdict or a screening.
 *
 * Precise needs two facts about the clip, not one. The first is the backdrop
 * colour, read off the clip's first frame by scripts/capture.ts. The second is
 * that the clip has a margin at all, which is what its content box says: a box
 * inset from the frame means the page is a content column inside a backdrop, and
 * then backdrop colour inside the screen is that margin showing where the shot
 * should have cropped it out. A content box that is the whole frame means the
 * page fills its own viewport and its background legitimately reaches the screen
 * edge, and matching that colour proves nothing.
 *
 * Getting that wrong the first way round is instructive and is why it is
 * written down here. Matching the backdrop on every clip put 226 frames in the
 * fail column, almost all of them dark pages whose hero simply is the backdrop
 * colour: 33 of the 38 clips have a content box that is the whole frame.
 */
export function backdropColours(captureId: string | null): {
  colours: { name: string; rgb: RGB }[];
  source: string;
  precise: boolean;
} {
  const measured = captureId ? CLIP_BACKDROPS.get(captureId) : undefined;
  const record = captureId ? CAPTURES.find((c) => c.id === captureId) : undefined;
  const box = record?.contentBox;
  const inset =
    !!box &&
    !!record &&
    (box.x > 0 || box.y > 0 || box.w < record.width || box.h < record.height);

  if (measured && inset && box) {
    return {
      colours: [{ name: `rgb(${measured.join(", ")})`, rgb: measured }],
      source:
        `the clip's own backdrop rgb(${measured.join(", ")}), content box ` +
        `${box.w}x${box.h} at ${box.x},${box.y} inside ${record.width}x${record.height}`,
      precise: true,
    };
  }
  return {
    colours: [
      { name: "near black", rgb: FLAT_DARK },
      { name: "near white", rgb: FLAT_LIGHT },
    ],
    source: measured
      ? "near black and near white, because this clip's content box is the whole frame"
      : "near black and near white",
    precise: false,
  };
}

/** Every capture id captures.json knows about, with the clip's path. */
export function captureClips(): { id: string; path: string }[] {
  return CAPTURES.map((c) => ({
    id: c.id,
    path: (c as unknown as { path: string }).path,
  }));
}

// ---------------------------------------------------------------------------
// Shared per frame measurement
// ---------------------------------------------------------------------------

export type CopyMeasurement = {
  region: Rect;
  background: RGB;
  ink: InkBox | null;
  /** What the ink's horizontal centre is compared against. */
  target: number;
  targetNote: string;
};

/**
 * Finds the region a frame's copy lives in and measures the ink inside it.
 *
 * Two regions, decided by the beat. Where a capture is on screen the copy sits
 * on an opaque scrim, so the scrim is found first and the ink is measured
 * against it, which is what out/_align/measure.mts did. Where the whole canvas
 * is flat brand colour, the corner pixel is the background and the whole frame
 * is the region.
 */
export function measureCopy(raw: Raw, shot: Shot): CopyMeasurement | null {
  const safe = safeArea(shot.format);
  const centre = canvasCentre(shot.format);

  if (shot.copyRegion === "band" || shot.copyRegion === "panel") {
    const scrim = findFlatBlock(raw, SCRIM, SCRIM_TOL);
    if (!scrim) return null;
    const ink = inkBox(raw, SCRIM, INK_TOLERANCE, scrim);
    if (shot.copyRegion === "panel") {
      // The panel bleeds off the canvas right edge, so the copy centres on the
      // middle of the visible panel rather than on the canvas.
      const target = (scrim.x + safe.right) / 2;
      return { region: scrim, background: SCRIM, ink, target, targetNote: "panel centre" };
    }
    return { region: scrim, background: SCRIM, ink, target: centre, targetNote: "canvas centre" };
  }

  const background = pixelAt(raw, 0, 0);
  const region: Rect = { x: 0, y: 0, w: raw.width, h: raw.height };
  const ink = inkBox(raw, background, INK_TOLERANCE, region);
  return { region, background, ink, target: centre, targetNote: "canvas centre" };
}

export type DeviceMeasurement = {
  body: Rect;
  screen: Rect | null;
  centre: number;
  target: number;
  targetNote: string;
};

/**
 * Finds the device body and the screen hole inside it.
 *
 * The body is the only #100D0A in the frame, and it is searched for above the
 * lower third or left of the copy panel, which is where the device is and where
 * the scrim is not. The scrim is 5.4 apart from the body in RGB, so a search
 * that included it would measure the band as a device.
 *
 * The screen is the longest run of rows, and then of columns, in which most of
 * the body's own bounding box is not body. That finds the hole rather than the
 * bezel, and on a laptop it finds the lid's screen rather than the deck, which
 * has no hole in it, or the deck's overhang, which is a shorter run than the
 * screen.
 */
export function measureDevice(raw: Raw, shot: Shot): DeviceMeasurement | null {
  const safe = safeArea(shot.format);
  const split = formatMetrics(shot.format).showcase === "split";
  const scrim = findFlatBlock(raw, SCRIM, SCRIM_TOL);

  let box: Rect;
  if (split) {
    if (!scrim) return null;
    box = {
      x: 0,
      y: safe.top,
      w: Math.max(1, scrim.x - 4),
      h: safe.bottom - safe.top,
    };
  } else {
    box = { x: 0, y: 0, w: raw.width, h: Math.max(1, (scrim?.y ?? raw.height) - 12) };
  }

  const cols = new Array<number>(box.w).fill(0);
  const rows = new Array<number>(box.h).fill(0);
  for (let y = 0; y < box.h; y += 1) {
    for (let x = 0; x < box.w; x += 1) {
      if (near(raw, box.x + x, box.y + y, DEVICE_BODY, DEVICE_TOL)) {
        cols[x] += 1;
        rows[y] += 1;
      }
    }
  }
  const minCol = Math.max(3, Math.round(box.h * 0.01));
  const minRow = Math.max(3, Math.round(box.w * 0.01));
  let left = -1;
  let right = -1;
  for (let x = 0; x < box.w; x += 1) {
    if (cols[x] > minCol) {
      if (left < 0) left = x;
      right = x;
    }
  }
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < box.h; y += 1) {
    if (rows[y] > minRow) {
      if (top < 0) top = y;
      bottom = y;
    }
  }
  if (left < 0 || top < 0) return null;

  const body: Rect = {
    x: box.x + left,
    y: box.y + top,
    w: right - left + 1,
    h: bottom - top + 1,
  };

  const rowFlags: boolean[] = [];
  for (let y = body.y; y < body.y + body.h; y += 1) {
    let n = 0;
    for (let x = body.x; x < body.x + body.w; x += 1) {
      if (!near(raw, x, y, DEVICE_BODY, DEVICE_TOL)) n += 1;
    }
    rowFlags.push(n > body.w * 0.5);
  }
  const screenRows = longestRun(rowFlags);
  let screen: Rect | null = null;
  if (screenRows && screenRows.end - screenRows.start > 4) {
    const y0 = body.y + screenRows.start;
    const y1 = body.y + screenRows.end;
    const colFlags: boolean[] = [];
    for (let x = body.x; x < body.x + body.w; x += 1) {
      let n = 0;
      for (let y = y0; y < y1; y += 1) {
        if (!near(raw, x, y, DEVICE_BODY, DEVICE_TOL)) n += 1;
      }
      colFlags.push(n > (y1 - y0) * 0.5);
    }
    const screenCols = longestRun(colFlags);
    if (screenCols && screenCols.end - screenCols.start > 4) {
      screen = {
        x: body.x + screenCols.start,
        y: y0,
        w: screenCols.end - screenCols.start,
        h: y1 - y0,
      };
    }
  }

  const laptop = shot.device?.laptop ?? false;
  const { target, note } = deviceCentreTarget(shot.format, laptop);
  return {
    body,
    screen,
    centre: body.x + (body.w - 1) / 2,
    target,
    targetNote: note,
  };
}

// ---------------------------------------------------------------------------
// The checks
// ---------------------------------------------------------------------------

function finding(
  shot: Shot,
  check: CheckId,
  verdict: Verdict,
  detail: string,
  metrics: Record<string, number | string | boolean | null> = {},
): Finding {
  return {
    composition: shot.composition,
    shot: shot.key,
    frame: shot.frame,
    label: shot.label,
    check,
    verdict,
    detail,
    metrics,
  };
}

/** (a) Text centring: the ink centre of a copy block against its centre line. */
export function checkTextCentring(shot: Shot, copy: CopyMeasurement | null): Finding {
  if (!shot.copySettled) {
    return finding(
      shot,
      "a",
      "SKIP",
      "copy is still arriving on this frame. A half typed line inks only the " +
        "left of its own box by design, so its ink centre is not its box centre " +
        "and there is nothing here to measure.",
    );
  }
  if (!copy) {
    return finding(shot, "a", "SKIP", "no copy region found in this frame");
  }
  if (!copy.ink) {
    return finding(shot, "a", "SKIP", "no ink found in the copy region");
  }
  const offset = copy.ink.centerX - copy.target;
  const tolerance = centreTolerance(shot.format);
  const pass = Math.abs(offset) <= tolerance;
  return finding(
    shot,
    "a",
    pass ? "PASS" : "FAIL",
    `ink ${copy.ink.left} to ${copy.ink.right}, centre ${copy.ink.centerX.toFixed(1)}, ` +
      `${copy.targetNote} ${copy.target.toFixed(1)}, offset ${offset >= 0 ? "+" : ""}${offset.toFixed(1)} px, ` +
      `line ${tolerance.toFixed(1)} px`,
    {
      inkLeft: copy.ink.left,
      inkRight: copy.ink.right,
      inkCentre: Number(copy.ink.centerX.toFixed(1)),
      target: Number(copy.target.toFixed(1)),
      targetNote: copy.targetNote,
      offsetPx: Number(offset.toFixed(1)),
      tolerancePx: Number(tolerance.toFixed(1)),
    },
  );
}

/**
 * (b) Safe zones: text or logo inside a reserved platform rectangle.
 *
 * Measured inside the copy region only, where the background is a known flat
 * colour and anything else is a glyph, a rule or the drawn lockup. Device
 * frames and captures are outside that region by construction, which is the
 * mechanical form of Section 8's "the capture may enter a reserved zone, text
 * may not". The report also carries how close the copy came to each zone, which
 * is the number that says whether a layout change is heading for trouble.
 */
export function checkSafeZones(
  raw: Raw,
  shot: Shot,
  copy: CopyMeasurement | null,
): Finding {
  if (!copy) {
    return finding(shot, "b", "SKIP", "no copy region found in this frame");
  }
  const zones = reservedZones(shot.format);
  const safe = safeArea(shot.format);
  let worstName = "";
  let worstCount = 0;
  const perZone: Record<string, number> = {};

  for (const zone of zones) {
    const x0 = Math.max(zone.rect.x, copy.region.x);
    const y0 = Math.max(zone.rect.y, copy.region.y);
    const x1 = Math.min(zone.rect.x + zone.rect.w, copy.region.x + copy.region.w);
    const y1 = Math.min(zone.rect.y + zone.rect.h, copy.region.y + copy.region.h);
    if (x1 <= x0 || y1 <= y0) {
      perZone[zone.name] = 0;
      continue;
    }
    const count = countNonBackground(raw, copy.background, INK_TOLERANCE, {
      x: x0,
      y: y0,
      w: x1 - x0,
      h: y1 - y0,
    });
    perZone[zone.name] = count;
    if (count > worstCount) {
      worstCount = count;
      worstName = zone.name;
    }
  }

  const margins: Record<string, number> = {};
  if (copy.ink) {
    margins.right = safe.right - copy.ink.right;
    margins.top = copy.ink.top - safe.top;
    margins.bottom = safe.bottom - copy.ink.bottom;
  }
  const closest = copy.ink
    ? Math.min(margins.right, margins.top, margins.bottom)
    : null;

  const clean = worstCount <= ZONE_INK_ALLOWANCE_PX;
  const verdict: Verdict = clean ? "PASS" : shot.inTransit ? "REVIEW" : "FAIL";
  const zoneText = zones
    .map((z) => `${z.name} ${perZone[z.name] ?? 0}`)
    .join(", ");
  return finding(
    shot,
    "b",
    verdict,
    `copy pixels in reserved zones: ${zoneText}` +
      (closest === null ? "" : `; closest approach ${closest} px`) +
      (clean ? "" : `; worst zone "${worstName}"`) +
      (clean || !shot.inTransit
        ? ""
        : ". The beat is mid whip on this frame and the whole scene is part way " +
          "off the canvas by design, so this is where the copy is passing " +
          "through, not where it was laid out."),
    {
      inTransit: shot.inTransit,
      ...Object.fromEntries(
        Object.entries(perZone).map(([k, v]) => [`zone_${k}_px`, v]),
      ),
      closestApproachPx: closest,
      marginRightPx: copy.ink ? margins.right : null,
      marginTopPx: copy.ink ? margins.top : null,
      marginBottomPx: copy.ink ? margins.bottom : null,
      allowancePx: ZONE_INK_ALLOWANCE_PX,
    },
  );
}

/** (c) Device geometry: the body's centre line and the screen hole's aspect. */
export function checkDeviceGeometry(shot: Shot, device: DeviceMeasurement | null): Finding {
  if (!shot.device) {
    return finding(shot, "c", "SKIP", "no device expected in this frame");
  }
  if (!device) {
    return finding(
      shot,
      "c",
      "FAIL",
      "no device body found: nothing in this frame is the #100D0A body colour, " +
        "so the shot is floating rather than sitting in a phone or a laptop",
      { bodyFound: false },
    );
  }
  const expected = expectedScreenAspect(
    shot.device.laptop,
    shot.device.shotWidth,
    shot.device.shotHeight,
  );
  const offset = device.centre - device.target;
  const centred = Math.abs(offset) <= DEVICE_CENTRE_TOLERANCE_PX;

  if (!device.screen) {
    return finding(
      shot,
      "c",
      "FAIL",
      `device body ${device.body.w}x${device.body.h} at ${device.body.x},${device.body.y} ` +
        "but no screen hole found inside it",
      { bodyFound: true, screenFound: false, offsetPx: Number(offset.toFixed(1)) },
    );
  }

  const aspect = device.screen.w / device.screen.h;
  const error = aspect / expected.aspect - 1;

  /**
   * The overlay arrangement puts the lower third on top of the device's lower
   * part, so the screen the camera can see is a clipped one and its aspect is
   * not the device's aspect. The centre line is still measurable there, and so
   * is whether a device exists at all, which is the fault that matters.
   *
   * No laptop beat is ever in the overlay arrangement, so the 16:10 rule is
   * enforced on every laptop shot in both reels.
   */
  const aspectMeasurable = shot.device.arrangement !== "overlay";
  const aspectOk = !aspectMeasurable || Math.abs(error) <= ASPECT_TOLERANCE;
  const pass = aspectOk && centred;

  const aspectText = aspectMeasurable
    ? `screen ${device.screen.w}x${device.screen.h}, aspect ${aspect.toFixed(4)} ` +
      `against ${expected.label} ${expected.aspect.toFixed(4)} ` +
      `(${(error * 100).toFixed(2)} percent)`
    : `screen ${device.screen.w} wide, ${device.screen.h} of it above the lower ` +
      `third, so the aspect is not measurable in the overlay arrangement`;

  return finding(
    shot,
    "c",
    pass ? "PASS" : "FAIL",
    `${aspectText}; body ${device.body.w} wide, centre ` +
      `${device.centre.toFixed(1)} against ${device.targetNote} ${device.target.toFixed(1)}, ` +
      `offset ${offset >= 0 ? "+" : ""}${offset.toFixed(1)} px`,
    {
      bodyFound: true,
      screenFound: true,
      arrangement: shot.device.arrangement,
      aspectMeasurable,
      screenWidth: device.screen.w,
      screenHeight: device.screen.h,
      aspect: Number(aspect.toFixed(4)),
      expectedAspect: Number(expected.aspect.toFixed(4)),
      expectedLabel: expected.label,
      aspectErrorPct: aspectMeasurable ? Number((error * 100).toFixed(2)) : null,
      bodyWidth: device.body.w,
      deviceCentre: Number(device.centre.toFixed(1)),
      target: Number(device.target.toFixed(1)),
      targetNote: device.targetNote,
      offsetPx: Number(offset.toFixed(1)),
    },
  );
}

/**
 * (d) Screen fill: how much of a ring just inside the screen edge reads as the
 * page's own flat backdrop rather than as content.
 *
 * On a clean shot the ring runs inside the detected screen hole. On a plate the
 * ring runs inside the screen quad, mapped from plate pixels onto the canvas
 * through the same transform PlateComposite and PlateShot apply, drift and
 * scale ramp included.
 */
export function checkScreenFill(
  raw: Raw,
  shot: Shot,
  device: DeviceMeasurement | null,
  copy: CopyMeasurement | null,
): Finding {
  let quad: Quad | null = null;
  let where = "";
  let captureId: string | null = null;

  if (shot.plate) {
    const mapped = plateQuadOnCanvas(
      shot.plate.plateId,
      raw.width,
      raw.height,
      shot.plate.relativeFrame,
      shot.plate.shotDurationFrames,
      shot.plate.driftSeed,
    );
    quad = mapped.quad;
    where = `plate quad ${shot.plate.plateId}`;
    captureId = shot.plate.captureId ?? mapped.plate.captureId;
  } else if (shot.device) {
    if (!device || !device.screen) {
      return finding(shot, "d", "SKIP", "no screen hole to sample");
    }
    quad = rectToQuad(device.screen);
    where = `screen hole ${device.screen.w}x${device.screen.h}`;
    captureId = shot.device.captureId;
  } else {
    return finding(shot, "d", "SKIP", "no screen in this frame");
  }

  const backdrops = backdropColours(captureId);
  const perEdge = 120;
  const samples: Point[] = quadRingSamples(quad, RING_INSET_PX, perEdge);
  const edgeIn = [0, 0, 0, 0];
  const edgeFlat = [0, 0, 0, 0];
  let inCanvas = 0;
  let flat = 0;
  let behindBand = 0;

  /**
   * The lower third and the landscape copy panel are drawn over the shot, so
   * part of the ring can land on the scrim rather than on the screen. That
   * matters more than it looks: the scrim is #14100C and the training safety
   * clips' backdrop is rgb(17, 16, 19), which are 7.6 apart, inside the 12 this
   * check matches on. Left in, the band read as the page's own margin and
   * failed three perfectly good landscape plates. Samples under the band are
   * not screen and are not counted either way.
   */
  const band = copy && copy.region.w < raw.width * 1.01 ? copy.region : null;
  const underBand = (x: number, y: number) =>
    band !== null &&
    x >= band.x &&
    x < band.x + band.w &&
    y >= band.y &&
    y < band.y + band.h;

  for (let i = 0; i < samples.length; i += 1) {
    const edge = Math.floor(i / perEdge);
    const x = Math.round(samples[i][0]);
    const y = Math.round(samples[i][1]);
    if (x < 0 || y < 0 || x >= raw.width || y >= raw.height) continue;
    if (underBand(x, y)) {
      behindBand += 1;
      continue;
    }
    inCanvas += 1;
    edgeIn[edge] += 1;
    const p = pixelAt(raw, x, y);
    for (const backdrop of backdrops.colours) {
      if (colourDistance(p, backdrop.rgb) <= BACKDROP_TOLERANCE) {
        flat += 1;
        edgeFlat[edge] += 1;
        break;
      }
    }
  }
  if (inCanvas === 0) {
    return finding(
      shot,
      "d",
      "SKIP",
      "the whole ring falls outside the canvas or behind the lower third",
    );
  }
  const fraction = flat / inCanvas;
  const edgeFractions = edgeIn.map((n, i) => (n === 0 ? 0 : edgeFlat[i] / n));
  const opposite = Math.max(
    Math.min(edgeFractions[0], edgeFractions[2]),
    Math.min(edgeFractions[1], edgeFractions[3]),
  );

  /**
   * The 2 percent line is the number the check reports. The verdict comes from
   * the shape, and that is a decision worth writing down, because the obvious
   * version of this check does not work.
   *
   * Colour alone cannot separate dead space from a page. The first version
   * matched near black and near white and failed 226 frames, almost all of them
   * dark pages whose hero simply is dark at the screen edge. The second version
   * matched each clip's own backdrop colour, read off its first frame by
   * scripts/capture.ts, and still failed 80: the training safety modules are
   * dark themed, so the sheet inside their content box is within 12 of the
   * backdrop outside it, and no tolerance separates a margin from the page it
   * surrounds.
   *
   * A shape test on opposite edges was tried next and is not sound either: on
   * these clips the dark chrome runs along the top and bottom as readily as
   * down the sides, so it flagged 28 frames of perfectly good picture.
   *
   * So the check asserts only what it can prove. A ring that is almost entirely
   * one flat colour is not a page with content in it: it is dead space, a blank
   * screen, or a crop with nothing left in it, and that fails. Everything from
   * the 2 percent line up to there is REVIEW, carrying the ring fraction, the
   * four per edge fractions and the colour matched, which is the form a reviewer
   * settles in one look. Check (d) is therefore a screening check on this
   * content rather than a gate, and the report says so.
   *
   * What would make it a gate is a clip whose margin colour differs from its own
   * sheet. The web reel's light pages already do; the training safety modules,
   * which are dark themed, do not, and that is a property of the courseware
   * rather than of the reel.
   *
   * Precise mode does not change the rule. It narrows the colour matched from
   * near black and near white to the one colour the clip's own margin is made
   * of, which makes every number sharper, and the report says which mode each
   * row is in.
   */
  const precise = backdrops.precise;
  const overLine = fraction > SCREEN_FILL_TOLERANCE;
  const dead = fraction >= DEAD_RING_FRACTION;
  const verdict: Verdict = dead ? "FAIL" : overLine ? "REVIEW" : "PASS";

  const edgeText = ["top", "right", "bottom", "left"]
    .map((n, i) => `${n} ${(edgeFractions[i] * 100).toFixed(0)}`)
    .join(", ");

  return finding(
    shot,
    "d",
    verdict,
    `${where}: ${flat} of ${inCanvas} ring samples within ${BACKDROP_TOLERANCE} of ` +
      `${backdrops.source}, ${(fraction * 100).toFixed(2)} percent ` +
      `(per edge, percent: ${edgeText}); line ${(SCREEN_FILL_TOLERANCE * 100).toFixed(0)} percent` +
      (behindBand > 0 ? `; ${behindBand} samples behind the lower third, not counted` : "") +
      (precise ? ", precise mode" : ", screening mode"),
    {
      where,
      ringSamples: inCanvas,
      samplesBehindBand: behindBand,
      flatSamples: flat,
      flatFraction: Number(fraction.toFixed(4)),
      edgeTop: Number(edgeFractions[0].toFixed(3)),
      edgeRight: Number(edgeFractions[1].toFixed(3)),
      edgeBottom: Number(edgeFractions[2].toFixed(3)),
      edgeLeft: Number(edgeFractions[3].toFixed(3)),
      oppositePairFraction: Number(opposite.toFixed(3)),
      backdropSource: backdrops.source,
      preciseMode: precise,
      tolerance: SCREEN_FILL_TOLERANCE,
      deadRingFraction: DEAD_RING_FRACTION,
    },
  );
}

/** (e) Blank frames: ink coverage against the frame's own dominant colour. */
export function checkBlankFrame(raw: Raw, shot: Shot): Finding {
  const background = dominantColour(raw);
  const coverage = inkCoverage(raw, background, 30);
  if (shot.intentionalBlank) {
    return finding(
      shot,
      "e",
      "SKIP",
      `marked as an intentional blank, coverage ${(coverage * 100).toFixed(3)} percent`,
      { coverage: Number(coverage.toFixed(5)) },
    );
  }
  const pass = coverage >= MIN_INK_COVERAGE;
  return finding(
    shot,
    "e",
    pass ? "PASS" : "FAIL",
    `ink coverage ${(coverage * 100).toFixed(3)} percent against background ` +
      `rgb(${background.join(", ")}), floor ${(MIN_INK_COVERAGE * 100).toFixed(1)} percent`,
    {
      coverage: Number(coverage.toFixed(5)),
      backgroundR: background[0],
      backgroundG: background[1],
      backgroundB: background[2],
      floor: MIN_INK_COVERAGE,
    },
  );
}

/**
 * (f) Logo: the end card carries the drawn lockup and not the retired crest.
 *
 * The drawn mark is the only rust and the only taupe on a canvas coloured card,
 * so counting those two colours is a direct test that the lockup is there and
 * finished. The gold count is the other half: config/brand.json says the
 * "K&A Designs" crest in approved-logo-transparent.png is the retired brand,
 * and a blob of it anywhere on the card fails.
 */
export function checkLogo(raw: Raw, shot: Shot): Finding {
  if (!shot.logo) {
    return finding(shot, "f", "SKIP", "not an end card frame with the mark finished");
  }
  const rust = countNear(raw, LOGO_RUST, 30);
  const frameColour = countNear(raw, LOGO_FRAME, 30);
  const gold = countNear(raw, RETIRED_GOLD, 25);
  const problems: string[] = [];
  if (rust < LOGO_MIN_PIXELS) problems.push("no drawn ampersand rust");
  if (frameColour < LOGO_MIN_PIXELS) problems.push("no drawn browser frame taupe");
  if (gold >= RETIRED_CREST_BLOB_PX) problems.push("retired gold crest present");
  const pass = problems.length === 0;
  return finding(
    shot,
    "f",
    pass ? "PASS" : "FAIL",
    `rust #a93c1c ${rust} px, frame #8b6f5c ${frameColour} px, retired gold #C09A5E ` +
      `${gold} px` + (pass ? "" : `; ${problems.join(", ")}`),
    {
      rustPx: rust,
      framePx: frameColour,
      retiredGoldPx: gold,
      minPx: LOGO_MIN_PIXELS,
      crestBlobPx: RETIRED_CREST_BLOB_PX,
    },
  );
}

/** (h) Cut continuity: PSNR across the hard cut from the plate to the clean shot. */
export function checkContinuity(shot: Shot, before: Raw, after: Raw): Finding {
  const value = psnr(before, after);
  const review = value < CONTINUITY_REVIEW_DB;
  return finding(
    shot,
    "h",
    review ? "REVIEW" : "PASS",
    `last plate frame against first clean frame: ${value.toFixed(1)} dB` +
      (review
        ? `, under ${CONTINUITY_REVIEW_DB} dB. A hard scene change is expected here, ` +
          "so this is informational: it says the two shots share almost nothing, " +
          "not that anything is wrong."
        : ""),
    { psnrDb: Number(value.toFixed(2)), reviewBelowDb: CONTINUITY_REVIEW_DB },
  );
}

/** (i) Motion: the last two frames of a clean shot must still differ. */
export function checkMotion(shot: Shot, a: Raw, b: Raw): Finding {
  const value = psnr(a, b);
  const pass = value < FROZEN_DB;
  return finding(
    shot,
    "i",
    pass ? "PASS" : "FAIL",
    `last two frames of the clean shot: ${value.toFixed(1)} dB, line ${FROZEN_DB} dB` +
      (pass ? "" : ". The shot has stopped and the cut lands on a photograph."),
    { psnrDb: Number(value.toFixed(2)), frozenAtDb: FROZEN_DB },
  );
}

// ---------------------------------------------------------------------------
// Per frame driver
// ---------------------------------------------------------------------------

export type FrameChecks = {
  findings: Finding[];
  copy: CopyMeasurement | null;
  device: DeviceMeasurement | null;
};

export function runFrameChecks(raw: Raw, shot: Shot): FrameChecks {
  const copy = measureCopy(raw, shot);
  const device = shot.device ? measureDevice(raw, shot) : null;
  const findings: Finding[] = [
    checkTextCentring(shot, copy),
    checkSafeZones(raw, shot, copy),
    checkDeviceGeometry(shot, device),
    checkScreenFill(raw, shot, device, copy),
    checkBlankFrame(raw, shot),
    checkLogo(raw, shot),
  ];
  return { findings, copy, device };
}

/** Rectangles from layout.ts, for the report's own record of what was tested. */
export function reservedZoneSummary(shot: Shot): string {
  return reservedZones(shot.format)
    .map((z) => `${z.name} ${z.rect.w}x${z.rect.h} at ${z.rect.x},${z.rect.y}`)
    .join("; ");
}

