// out/qa/report.md, out/qa/findings.json and out/qa/sheets/<composition>.png.

import fs from "node:fs";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";
import { CHECK_NAMES, type CheckId, type Finding, type Verdict } from "./checks";
import {
  ASPECT_TOLERANCE,
  BACKDROP_TOLERANCE,
  CENTRE_TOLERANCE_PX,
  CONTINUITY_REVIEW_DB,
  DEAD_RING_FRACTION,
  DEVICE_CENTRE_TOLERANCE_PX,
  FROZEN_DB,
  LOGO_MIN_PIXELS,
  MIN_INK_COVERAGE,
  RETIRED_CREST_BLOB_PX,
  RING_INSET_PX,
  SCREEN_FILL_TOLERANCE,
  ZONE_INK_ALLOWANCE_PX,
} from "./checks";
import type { PlateReview } from "./plates";
import type { Shot } from "./shots";

export type RunSummary = {
  startedAt: string;
  finishedAt: string;
  bundleBuiltAt: string;
  bundleReused: boolean;
  mode: "full" | "fast";
  reels: string[];
  compositions: string[];
  stills: number;
  debugStills: number;
  /** How many clips check (d) resolved a real backdrop colour for. */
  backdrops: string;
  seconds: number;
};

const VERDICT_ORDER: Verdict[] = ["FAIL", "REVIEW", "PASS", "SKIP"];

function escapePipes(text: string): string {
  return text.replace(/\|/g, "\\|");
}

export function writeFindings(
  qaDir: string,
  summary: RunSummary,
  findings: Finding[],
  plates: PlateReview[],
): void {
  fs.mkdirSync(qaDir, { recursive: true });
  fs.writeFileSync(
    path.join(qaDir, "findings.json"),
    JSON.stringify(
      {
        summary,
        thresholds: {
          centreTolerancePx: CENTRE_TOLERANCE_PX,
          zoneInkAllowancePx: ZONE_INK_ALLOWANCE_PX,
          aspectTolerance: ASPECT_TOLERANCE,
          deviceCentreTolerancePx: DEVICE_CENTRE_TOLERANCE_PX,
          screenFillTolerance: SCREEN_FILL_TOLERANCE,
          ringInsetPx: RING_INSET_PX,
          backdropTolerance: BACKDROP_TOLERANCE,
          minInkCoverage: MIN_INK_COVERAGE,
          logoMinPixels: LOGO_MIN_PIXELS,
          retiredCrestBlobPx: RETIRED_CREST_BLOB_PX,
          deadRingFraction: DEAD_RING_FRACTION,
          continuityReviewDb: CONTINUITY_REVIEW_DB,
          frozenDb: FROZEN_DB,
        },
        counts: countBy(findings),
        findings,
        plates: plates.map((p) => ({
          plateId: p.plateId,
          file: p.file,
          usedBy: p.usedBy,
          cornerCrops: p.cornerCrops,
          skinCrops: p.skinCrops,
          notes: p.notes,
        })),
      },
      null,
      2,
    ),
  );
}

export function countBy(findings: Finding[]): Record<Verdict, number> {
  const counts: Record<Verdict, number> = { PASS: 0, FAIL: 0, REVIEW: 0, SKIP: 0 };
  for (const f of findings) counts[f.verdict] += 1;
  return counts;
}

export function writeReport(
  qaDir: string,
  summary: RunSummary,
  shots: Shot[],
  findings: Finding[],
  plates: PlateReview[],
): void {
  const byComposition = new Map<string, Finding[]>();
  for (const f of findings) {
    const list = byComposition.get(f.composition) ?? [];
    list.push(f);
    byComposition.set(f.composition, list);
  }
  const shotByKey = new Map(shots.map((s) => [s.key, s]));
  const totals = countBy(findings);

  const lines: string[] = [];
  lines.push("# Reel QA report");
  lines.push("");
  lines.push(
    `Run ${summary.startedAt} to ${summary.finishedAt}, ${summary.seconds.toFixed(1)} seconds.`,
  );
  lines.push("");
  lines.push("| | |");
  lines.push("|---|---|");
  lines.push(`| Mode | ${summary.mode} |`);
  lines.push(`| Reels | ${summary.reels.join(", ")} |`);
  lines.push(`| Compositions | ${summary.compositions.length} |`);
  lines.push(`| Stills rendered | ${summary.stills} plus ${summary.debugStills} debug |`);
  lines.push(`| Check (d) backdrops | ${summary.backdrops} |`);
  lines.push(
    `| Bundle | \`out/qa/bundle\` built ${summary.bundleBuiltAt}${summary.bundleReused ? " (reused from an earlier run)" : ""} |`,
  );
  lines.push(
    `| Result | ${totals.FAIL} FAIL, ${totals.REVIEW} REVIEW, ${totals.PASS} PASS, ${totals.SKIP} not applicable |`,
  );
  lines.push("");

  lines.push("## What each check measures");
  lines.push("");
  lines.push("| Check | Measures | Fails at |");
  lines.push("|---|---|---|");
  lines.push(
    `| a ${CHECK_NAMES.a} | ink centre of the copy block against the canvas centre, or the panel centre in the landscape split | more than ${CENTRE_TOLERANCE_PX} px at 1080 canvas width, scaled by typeScale, so ${(CENTRE_TOLERANCE_PX * (1920 / 1080)).toFixed(1)} px in landscape |`,
  );
  lines.push(
    `| b ${CHECK_NAMES.b} | copy pixels inside the reserved rectangles safeArea() derives | more than ${ZONE_INK_ALLOWANCE_PX} px |`,
  );
  lines.push(
    `| c ${CHECK_NAMES.c} | the #100D0A device body's centre line, and the aspect of the screen hole inside it | body missing, centre off by more than ${DEVICE_CENTRE_TOLERANCE_PX} px, or aspect off by more than ${(ASPECT_TOLERANCE * 100).toFixed(0)} percent |`,
  );
  lines.push(
    `| d ${CHECK_NAMES.d} | a ring ${RING_INSET_PX} px inside the screen hole or the plate quad, against a flat page backdrop | ${(DEAD_RING_FRACTION * 100).toFixed(0)} percent of the ring or more, which is a screen with nothing in it. Over the ${(SCREEN_FILL_TOLERANCE * 100).toFixed(0)} percent line and under that is REVIEW |`,
  );
  lines.push(
    `| e ${CHECK_NAMES.e} | ink coverage against the frame's own dominant colour | under ${(MIN_INK_COVERAGE * 100).toFixed(1)} percent |`,
  );
  lines.push(
    `| f ${CHECK_NAMES.f} | drawn lockup colours present, retired gold crest absent | under ${LOGO_MIN_PIXELS} px of either lockup colour, or ${RETIRED_CREST_BLOB_PX} px or more of gold |`,
  );
  lines.push(
    `| g ${CHECK_NAMES.g} | 2x crops of each plate's quad corners and of skin touching the quad | never fails, always REVIEW |`,
  );
  lines.push(
    `| h ${CHECK_NAMES.h} | PSNR across the hard cut from the plate to the clean shot | never fails, REVIEW under ${CONTINUITY_REVIEW_DB} dB |`,
  );
  lines.push(
    `| i ${CHECK_NAMES.i} | PSNR between the last two frames of every clean shot | ${FROZEN_DB} dB or over, which is a frozen shot |`,
  );
  lines.push("");
  lines.push(
    "Check (d) is a screening check on this content rather than a gate, and the " +
      "two numbers say why. Colour alone cannot separate a page's own margin " +
      "from the page: the training safety modules are dark themed, so the sheet " +
      "inside their content box is within 12 of the backdrop outside it. So the " +
      "check reports the ring fraction and the four per edge fractions on every " +
      "shot, calls anything over the 2 percent line REVIEW, and fails only where " +
      "the ring is almost entirely one flat colour, which is a screen with " +
      "nothing in it. Rows in precise mode match the one colour that clip's own " +
      "margin is made of, read off its first frame by scripts/capture.ts; rows " +
      "in screening mode match near black and near white.",
  );
  lines.push("");
  lines.push(
    "Check (a) only runs where every line on screen has finished arriving. " +
      "KineticText hides characters with visibility while it types, so a half " +
      "typed line inks only the left of its own box by design and its ink centre " +
      "is not its box centre. Those frames are reported as not applicable rather " +
      "than measured.",
  );
  lines.push("");
  lines.push(
    "Check (c) measures the screen aspect only in the stacked and split " +
      "arrangements. In the overlay arrangement the lower third sits on top of " +
      "the device's lower part, so the visible screen is clipped and its aspect " +
      "is not the device's. The centre line and whether a device body exists at " +
      "all are measured everywhere. No laptop beat is ever in the overlay " +
      "arrangement, because a 16:10 screen is wider than any of these canvases, " +
      "so the 16:10 rule is enforced on every laptop shot in both reels.",
  );
  lines.push("");

  const failures = findings.filter((f) => f.verdict === "FAIL");
  lines.push("## Failures");
  lines.push("");
  if (failures.length === 0) {
    lines.push("None.");
  } else {
    lines.push("| Composition | Frame | Shot | Check | Numbers |");
    lines.push("|---|---|---|---|---|");
    for (const f of failures) {
      lines.push(
        `| ${f.composition} | ${f.frame} | ${escapePipes(f.label)} | ${f.check} ${CHECK_NAMES[f.check]} | ${escapePipes(f.detail)} |`,
      );
    }
  }
  lines.push("");

  const reviews = findings.filter((f) => f.verdict === "REVIEW");
  lines.push("## Review");
  lines.push("");
  if (reviews.length === 0) {
    lines.push("None.");
  } else {
    lines.push("| Composition | Frame | Shot | Check | Numbers |");
    lines.push("|---|---|---|---|---|");
    for (const f of reviews) {
      lines.push(
        `| ${f.composition} | ${f.frame} | ${escapePipes(f.label)} | ${f.check} ${CHECK_NAMES[f.check]} | ${escapePipes(f.detail)} |`,
      );
    }
  }
  lines.push("");

  lines.push("## Per composition");
  lines.push("");
  for (const composition of summary.compositions) {
    const rows = (byComposition.get(composition) ?? []).slice();
    const counts = countBy(rows);
    const shown = rows.filter((r) => r.verdict !== "SKIP");
    shown.sort(
      (a, b) =>
        a.frame - b.frame ||
        VERDICT_ORDER.indexOf(a.verdict) - VERDICT_ORDER.indexOf(b.verdict) ||
        a.check.localeCompare(b.check),
    );
    lines.push(`### ${composition}`);
    lines.push("");
    lines.push(
      `${counts.FAIL} FAIL, ${counts.REVIEW} REVIEW, ${counts.PASS} PASS, ${counts.SKIP} not applicable. ` +
        `Contact sheet: \`out/qa/sheets/${composition}.png\`.`,
    );
    lines.push("");
    lines.push("| Frame | Shot | Check | Verdict | Numbers |");
    lines.push("|---|---|---|---|---|");
    for (const r of shown) {
      const shot = shotByKey.get(r.shot);
      lines.push(
        `| ${r.frame} | ${escapePipes(shot ? shot.label : r.label)} | ${r.check} ${CHECK_NAMES[r.check]} | ${r.verdict} | ${escapePipes(r.detail)} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Plates, check g");
  lines.push("");
  lines.push(
    "Crops for a reviewer, not a verdict. Each directory holds the four quad " +
      "corners at 2x and every skin toned region that touches the quad, which " +
      "is where a hand occluding the panel or a thumb across the screen face " +
      "would be.",
  );
  lines.push("");
  lines.push("| Plate | Corner crops | Skin crops touching the quad | Notes |");
  lines.push("|---|---|---|---|");
  for (const p of plates) {
    lines.push(
      `| \`${p.plateId}\` | ${p.cornerCrops.length} | ${p.skinCrops.length} | ${escapePipes(p.notes.join("; ") || "none")} |`,
    );
  }
  lines.push("");
  lines.push("Used by:");
  lines.push("");
  for (const p of plates) {
    lines.push(`- \`${p.plateId}\`: ${p.usedBy.join(", ")}`);
  }
  lines.push("");

  fs.writeFileSync(path.join(qaDir, "report.md"), lines.join("\n"));
}

// ---------------------------------------------------------------------------
// Contact sheets
// ---------------------------------------------------------------------------

const TILE_WIDTH = 220;
const LABEL_HEIGHT = 38;
const GAP = 8;
const MAX_COLUMNS = 6;

function svgEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * One sheet per composition: every tested still, in frame order, with a red
 * FAIL badge over the ones that failed a check and the failing check letters
 * under the frame number.
 */
export async function writeContactSheet(
  qaDir: string,
  composition: string,
  shots: Shot[],
  findings: Finding[],
  stillPath: (shot: Shot) => string,
): Promise<string | null> {
  const mine = shots
    .filter((s) => s.composition === composition)
    .sort((a, b) => a.frame - b.frame)
    .filter((s) => fs.existsSync(stillPath(s)));
  if (mine.length === 0) return null;

  const first = await sharp(stillPath(mine[0])).metadata();
  const ratio = (first.height as number) / (first.width as number);
  const tileHeight = Math.round(TILE_WIDTH * ratio);
  const columns = Math.min(MAX_COLUMNS, mine.length);
  const rows = Math.ceil(mine.length / columns);
  const cellHeight = tileHeight + LABEL_HEIGHT;
  const width = columns * TILE_WIDTH + (columns + 1) * GAP;
  const height = rows * cellHeight + (rows + 1) * GAP + 34;

  const failByShot = new Map<string, CheckId[]>();
  const reviewByShot = new Map<string, CheckId[]>();
  for (const f of findings) {
    if (f.composition !== composition) continue;
    if (f.verdict === "FAIL") {
      failByShot.set(f.shot, [...(failByShot.get(f.shot) ?? []), f.check]);
    } else if (f.verdict === "REVIEW") {
      reviewByShot.set(f.shot, [...(reviewByShot.get(f.shot) ?? []), f.check]);
    }
  }

  const layers: OverlayOptions[] = [];
  const svgParts: string[] = [];
  svgParts.push(
    `<text x="${GAP}" y="22" font-family="sans-serif" font-size="18" font-weight="700" fill="#F8F5F2">${svgEscape(
      composition,
    )}</text>`,
  );

  for (let i = 0; i < mine.length; i += 1) {
    const shot = mine[i];
    const col = i % columns;
    const row = Math.floor(i / columns);
    const left = GAP + col * (TILE_WIDTH + GAP);
    const top = 34 + GAP + row * (cellHeight + GAP);

    const buffer = await sharp(stillPath(shot))
      .resize(TILE_WIDTH, tileHeight, { fit: "fill" })
      .png()
      .toBuffer();
    layers.push({ input: buffer, left, top });

    const fails = failByShot.get(shot.key) ?? [];
    const reviews = reviewByShot.get(shot.key) ?? [];
    const colour = fails.length > 0 ? "#FF2D2D" : reviews.length > 0 ? "#D97706" : "#9FBEB8";
    svgParts.push(
      `<text x="${left}" y="${top + tileHeight + 15}" font-family="sans-serif" font-size="12" fill="${colour}">${svgEscape(
        `${shot.frame}  ${shot.phase}`,
      )}</text>`,
    );
    svgParts.push(
      `<text x="${left}" y="${top + tileHeight + 30}" font-family="sans-serif" font-size="11" fill="#9FBEB8">${svgEscape(
        shot.label.length > 34 ? `${shot.label.slice(0, 33)}...` : shot.label,
      )}</text>`,
    );
    if (fails.length > 0) {
      const badge = `FAIL ${[...new Set(fails)].sort().join("")}`;
      svgParts.push(
        `<rect x="${left + 4}" y="${top + 4}" width="${8 + badge.length * 9}" height="26" rx="4" fill="#FF2D2D"/>`,
        `<text x="${left + 8}" y="${top + 22}" font-family="sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">${svgEscape(
          badge,
        )}</text>`,
        `<rect x="${left}" y="${top}" width="${TILE_WIDTH}" height="${tileHeight}" fill="none" stroke="#FF2D2D" stroke-width="3"/>`,
      );
    } else if (reviews.length > 0) {
      svgParts.push(
        `<rect x="${left}" y="${top}" width="${TILE_WIDTH}" height="${tileHeight}" fill="none" stroke="#D97706" stroke-width="2"/>`,
      );
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${svgParts.join(
    "",
  )}</svg>`;
  layers.push({ input: Buffer.from(svg), left: 0, top: 0 });

  const dir = path.join(qaDir, "sheets");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${composition}.png`);
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 20, g: 18, b: 16 },
    },
  })
    .composite(layers)
    .png()
    .toFile(out);
  return out;
}
