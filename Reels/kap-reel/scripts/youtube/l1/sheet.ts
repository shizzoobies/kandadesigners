/**
 * scripts/youtube/l1/sheet.ts
 *
 * A contact sheet: 1920x1080 stills in a grid of four, each captioned, under a
 * title line and optional color swatches. Used by style-frames.ts (stills from
 * the composition) and deliver.ts (stills pulled from the finished file).
 */

import sharp from "sharp";

export type SheetTile = { file: string; what: string };

export async function contactSheet(opts: {
  title: string;
  subtitle: string;
  tiles: SheetTile[];
  out: string;
  swatches?: Record<string, string>;
}): Promise<string> {
  const cols = 4;
  const cw = 720;
  const ch = 405;
  const gap = 24;
  const caption = 44;
  const header = 120;
  const rows = Math.ceil(opts.tiles.length / cols);
  const width = cols * cw + (cols + 1) * gap;
  const height = header + rows * (ch + caption + gap) + gap;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

  const entries = Object.entries(opts.swatches ?? {});
  const swatches = entries
    .map(([k, hex], i) => {
      const x = width - gap - (entries.length - i) * 150;
      return `<rect x="${x}" y="34" width="36" height="36" rx="4" fill="${hex}" stroke="#888" stroke-width="1"/>
        <text x="${x + 46}" y="50" font-family="Arial" font-size="15" fill="#222">${esc(k)}</text>
        <text x="${x + 46}" y="68" font-family="Consolas, monospace" font-size="14" fill="#555">${hex}</text>`;
    })
    .join("");
  const labels = opts.tiles
    .map(({ what }, i) => {
      const x = gap + (i % cols) * (cw + gap);
      const y = header + Math.floor(i / cols) * (ch + caption + gap) + ch + 28;
      return `<text x="${x}" y="${y}" font-family="Arial" font-size="18" fill="#222">${String(i + 1).padStart(2, "0")}  ${esc(what)}</text>`;
    })
    .join("");
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#FFFFFF"/>
      <text x="${gap}" y="62" font-family="Arial" font-weight="bold" font-size="34" fill="#111">${esc(opts.title)}</text>
      <text x="${gap}" y="96" font-family="Arial" font-size="18" fill="#555">${esc(opts.subtitle)}</text>
      ${swatches}${labels}
    </svg>`,
  );
  const composites = await Promise.all(
    opts.tiles.map(async ({ file }, i) => ({
      input: await sharp(file).resize(cw, ch).png().toBuffer(),
      left: gap + (i % cols) * (cw + gap),
      top: header + Math.floor(i / cols) * (ch + caption + gap),
    })),
  );
  await sharp(svg).composite(composites).png().toFile(opts.out);
  return opts.out;
}
