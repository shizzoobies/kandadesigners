// Check (g), the plate review crops.
//
// This one does not pass or fail. Two of the faults the owner caught by eye are
// properties of a photograph rather than of a layout: a hand across the panel
// so the page paints over the fingers, and a face or a thumb on the screen
// face. Neither is a number. What a harness can do is put the evidence in front
// of a reviewer in seconds instead of minutes: the four corners of the screen
// quad at 2x, where an occluding finger has to cross the boundary, and every
// skin toned region that touches the quad, which is where a hand is if there is
// one.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { getPlate } from "../../src/lib/plates";
import { isSkin, maskRegions, quadBoundingRect, type Quad } from "./pixels";

export type PlateReview = {
  plateId: string;
  file: string;
  usedBy: string[];
  outputDir: string;
  cornerCrops: string[];
  skinCrops: { file: string; overlapsQuad: boolean; area: number }[];
  notes: string[];
};

/** Half width of the square cut around each quad corner, in plate pixels. */
const CORNER_HALF = 150;
/** Grid width the skin mask is computed on. Coarse on purpose. */
const MASK_WIDTH = 200;
/** Smallest skin region worth cropping, as a fraction of the mask's cells. */
const MIN_SKIN_FRACTION = 0.0025;
/** Most skin crops written per plate. */
const MAX_SKIN_CROPS = 6;

const CORNER_NAMES = ["top-left", "top-right", "bottom-right", "bottom-left"];

function clampBox(
  x: number,
  y: number,
  w: number,
  h: number,
  width: number,
  height: number,
): { left: number; top: number; width: number; height: number } {
  const left = Math.max(0, Math.min(width - 1, Math.round(x)));
  const top = Math.max(0, Math.min(height - 1, Math.round(y)));
  return {
    left,
    top,
    width: Math.max(1, Math.min(width - left, Math.round(w))),
    height: Math.max(1, Math.min(height - top, Math.round(h))),
  };
}

export async function reviewPlate(
  projectRoot: string,
  qaDir: string,
  plateId: string,
  usedBy: string[],
): Promise<PlateReview> {
  const plate = getPlate(plateId);
  const file = path.join(projectRoot, plate.file);
  const outputDir = path.join(qaDir, "plates", plateId);
  fs.mkdirSync(outputDir, { recursive: true });

  const review: PlateReview = {
    plateId,
    file: plate.file,
    usedBy,
    outputDir,
    cornerCrops: [],
    skinCrops: [],
    notes: [],
  };

  if (!fs.existsSync(file)) {
    review.notes.push(`plate file missing on disk: ${plate.file}`);
    return review;
  }
  if (plate.retired) {
    review.notes.push(
      `plates.json marks this plate retired: ${plate.retiredNote ?? "no note"}`,
    );
  }

  const image = sharp(file);
  const meta = await image.metadata();
  const width = meta.width as number;
  const height = meta.height as number;
  const quad = plate.quad as unknown as Quad;
  const bounds = quadBoundingRect(quad);

  // The four corners of the screen quad at 2x. A hand that occludes the panel
  // crosses one of these, and so does a quad whose corner has drifted off the
  // real screen edge, which is the other thing these crops are for.
  for (let i = 0; i < 4; i += 1) {
    const [cx, cy] = quad[i];
    const box = clampBox(
      cx - CORNER_HALF,
      cy - CORNER_HALF,
      CORNER_HALF * 2,
      CORNER_HALF * 2,
      width,
      height,
    );
    const name = `corner-${i + 1}-${CORNER_NAMES[i]}.png`;
    await sharp(file)
      .extract(box)
      .resize(box.width * 2, box.height * 2, { kernel: "nearest" })
      .png()
      .toFile(path.join(outputDir, name));
    review.cornerCrops.push(name);
  }

  // Skin toned regions. Computed on a coarse grid, because a hand is a large
  // smooth area and the point is to find it, not to trace it.
  const maskHeight = Math.max(1, Math.round((MASK_WIDTH * height) / width));
  const small = await sharp(file)
    .resize(MASK_WIDTH, maskHeight, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();

  const mask: boolean[] = new Array(MASK_WIDTH * maskHeight).fill(false);
  for (let i = 0; i < MASK_WIDTH * maskHeight; i += 1) {
    mask[i] = isSkin(small[i * 3], small[i * 3 + 1], small[i * 3 + 2]);
  }
  const minCells = Math.max(6, Math.round(MASK_WIDTH * maskHeight * MIN_SKIN_FRACTION));
  const regions = maskRegions(mask, MASK_WIDTH, maskHeight, minCells);

  const sx = width / MASK_WIDTH;
  const sy = height / maskHeight;
  let written = 0;
  for (const region of regions) {
    if (written >= MAX_SKIN_CROPS) break;
    const rx = region.x * sx;
    const ry = region.y * sy;
    const rw = region.w * sx;
    const rh = region.h * sy;
    // Touching the quad: the region's box overlaps the quad's box, which is
    // where an occlusion has to be to matter.
    const overlaps =
      rx < bounds.x + bounds.w &&
      bounds.x < rx + rw &&
      ry < bounds.y + bounds.h &&
      bounds.y < ry + rh;
    if (!overlaps) continue;
    const box = clampBox(rx - 20, ry - 20, rw + 40, rh + 40, width, height);
    // A 2x crop of half the plate helps nobody. Cap the crop and let the
    // reviewer open the plate itself if the region really is that big.
    const capped = clampBox(
      box.left,
      box.top,
      Math.min(box.width, 900),
      Math.min(box.height, 900),
      width,
      height,
    );
    const name = `skin-${written + 1}.png`;
    await sharp(file)
      .extract(capped)
      .resize(capped.width * 2, capped.height * 2, { kernel: "nearest" })
      .png()
      .toFile(path.join(outputDir, name));
    review.skinCrops.push({
      file: name,
      overlapsQuad: true,
      area: Math.round(rw * rh),
    });
    written += 1;
  }

  if (review.skinCrops.length === 0) {
    review.notes.push("no skin toned region touches the screen quad");
  }

  fs.writeFileSync(
    path.join(outputDir, "quad.json"),
    JSON.stringify(
      {
        plateId,
        file: plate.file,
        size: { width, height },
        quad,
        quadBounds: bounds,
        glareOpacity: plate.glareOpacity,
        captureId: plate.captureId,
        usedBy,
        notes: plate.notes,
      },
      null,
      2,
    ),
  );

  return review;
}
