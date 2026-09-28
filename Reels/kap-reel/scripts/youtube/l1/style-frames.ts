/**
 * scripts/youtube/l1/style-frames.ts
 *
 * The A4 gate for YouTube L1: ten stills of the shared youtube/ set in each of
 * the two proposed working themes, and a contact sheet per theme, so Alex can
 * pick a theme and approve the set before the full cut is rendered.
 * No video is rendered here.
 *
 * Out:  out/youtube/l1/style-frames/{a,b}/NN-name.png   1920x1080
 *       out/youtube/l1/style-frames/contact-{a,b}.png
 *
 * Also prints each theme's contrast table and the projected runtime with the
 * beat starts (the chapter times, before any change at the gate).
 *
 * Run from D:\kap-reel after stage.ts (never npx):
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/style-frames.ts
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/style-frames.ts qa
 * `qa` renders 27 checking stills across the whole cut instead (theme A only)
 * to out/youtube/l1/qa/, with their own contact sheet.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import {
  ensureBrowser,
  openBrowser,
  renderStill,
  selectComposition,
} from "@remotion/renderer";
import sharp from "sharp";
import { L1_THEMES, type L1ThemeId } from "../../../src/youtube/l1/themes";
import {
  CHAPTERS,
  L1_LAYOUT,
  L1_TOTAL_FRAMES,
  cue,
  slotOf,
} from "../../../src/youtube/l1/timeline";
import { themeContrast } from "../../../src/youtube/theme";
import { timecode } from "../../../src/youtube/timeline";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const OUT = path.join(ROOT, "out", "youtube", "l1", "style-frames");
const QA_OUT = path.join(ROOT, "out", "youtube", "l1", "qa");
const FPS = 30;

/** A still: a beat and a time inside it, seconds from the beat's start. */
type Still = { name: string; what: string; beat: number; t: number };

const STILLS: Still[] = [
  {
    name: "hook",
    what: "Hook: the test page, Tab pressed, nothing visible",
    beat: 1,
    t: cue(1, "Tab") + 1.6 + 0.25,
  },
  {
    name: "focus-zoom",
    what: "Our site: Tab onto Start a project, zoomed on the rust ring",
    beat: 6,
    t: cue(6, "Keep tabbing") + 0.3 + 0.3,
  },
  {
    name: "check-card",
    what: "CheckCard: Check 3 · Tab order",
    beat: 7,
    t: 1.3,
  },
  {
    name: "lower-third",
    what: "Lower third over our home page",
    beat: 2,
    t: cue(2, "Gainesville") + 0.4,
  },
  {
    name: "safari",
    what: "The redrawn Safari setting in context",
    beat: 4,
    t: cue(4, "Advanced") + 0.6,
  },
  {
    name: "invisible-focus",
    what: "Test page: focus is there but invisible, marked",
    beat: 6,
    t: cue(6, "invisible") + 0.5,
  },
  {
    name: "trap",
    what: "The trap (D3): Escape pressed, focus stays in the box",
    beat: 9,
    t: cue(9, "Escape") + 0.25,
  },
  {
    name: "checklist",
    what: "Beat 11: the five asks, held for pausing",
    beat: 11,
    t: cue(11, "Three") + 0.6,
  },
  {
    name: "recap",
    what: "Recap: the checks ticking off",
    beat: 12,
    t: cue(12, "no traps") + 0.6,
  },
  {
    name: "end-screen",
    what: "End screen: subscribe and video slots left for YouTube",
    beat: 13,
    t: 3.0,
  },
];

/** Extra stills for checking the cut between the style frames (`qa` argument, theme A only). */
const QA: Still[] = [
  {
    name: "b1-cut-to-site",
    what: "Hook: cut to our nav",
    beat: 1,
    t: cue(1, "some of your customers") + 0.6,
  },
  {
    name: "b2-agenda",
    what: "Agenda card",
    beat: 2,
    t: cue(2, "just one key") + 0.5,
  },
  {
    name: "b3-focus-sap",
    what: "That spot is called focus",
    beat: 3,
    t: cue(3, "That spot") + 1.4,
  },
  {
    name: "b3-who",
    what: "Who needs it",
    beat: 3,
    t: cue(3, "plenty of people") + 0.8,
  },
  {
    name: "b3-standard",
    what: "WCAG card",
    beat: 3,
    t: cue(3, "say everything") + 1.0,
  },
  {
    name: "b4-keys",
    what: "Keys card",
    beat: 4,
    t: cue(4, "On a button") + 1.0,
  },
  {
    name: "b4-safari-zoom",
    what: "Safari zoomed",
    beat: 4,
    t: cue(4, "webpage") + 0.3,
  },
  {
    name: "b5-skip",
    what: "Skip link zoom",
    beat: 5,
    t: cue(5, "Skip to content") + 0.3,
  },
  {
    name: "b5-enter",
    what: "After Enter, next Tab",
    beat: 5,
    t: cue(5, "straight to the page") + 1.0,
  },
  {
    name: "b5-menu-items",
    what: "Tabs through every menu item",
    beat: 5,
    t: cue(5, "every menu item") + 0.3,
  },
  {
    name: "b6-custom",
    what: "Inline link ring",
    beat: 6,
    t: cue(6, "Keep tabbing") + 0.3 + 2.4 + 0.4,
  },
  {
    name: "b6-test-lt",
    what: "Test page lower third",
    beat: 6,
    t: cue(6, "we built") + 0.2,
  },
  {
    name: "b6-back",
    what: "Easier fixes, our ring",
    beat: 6,
    t: cue(6, "easier fixes"),
  },
  {
    name: "b7-phone",
    what: "Order: phone number",
    beat: 7,
    t: cue(7, "phone number") + 0.4,
  },
  {
    name: "b7-sap",
    what: "Order: Start a project",
    beat: 7,
    t: cue(7, "then the button") + 0.8,
  },
  {
    name: "b7-footer",
    what: "Test page jumps to the footer",
    beat: 7,
    t: cue(7, "footer") + 0.1,
  },
  {
    name: "b8-open",
    what: "Menu open",
    beat: 8,
    t: cue(8, "The menu opens") + 0.3,
  },
  {
    name: "b8-inside",
    what: "Next Tab inside",
    beat: 8,
    t: cue(8, "takes you inside") + 0.3,
  },
  {
    name: "b8-back",
    what: "Back on the button",
    beat: 8,
    t: cue(8, "right back on") + 1.0,
  },
  {
    name: "b8-kai",
    what: "Chat bubble open",
    beat: 8,
    t: cue(8, "same way") + 1.4,
  },
  {
    name: "b9-setup",
    what: "Trap setup",
    beat: 9,
    t: cue(9, "grabs focus") + 0.3,
  },
  {
    name: "b10-labels",
    what: "Contact labels",
    beat: 10,
    t: cue(10, "message") + 0.3,
  },
  {
    name: "b10-hints",
    what: "Placeholder typing",
    beat: 10,
    t: cue(10, "when you type") + 0.3,
  },
  {
    name: "b10-send",
    what: "Send button",
    beat: 10,
    t: cue(10, "tab", 2) + 0.9,
  },
  {
    name: "b11-refs",
    what: "WCAG references",
    beat: 11,
    t: cue(11, "labels or instructions") + 1.0,
  },
  {
    name: "b12-cta",
    what: "Audit page with lower third",
    beat: 12,
    t: cue(12, "accessibility audits") + 0.5,
  },
  {
    name: "b12-end",
    what: "Audit page, end of scroll",
    beat: 12,
    t: slotOf(12).frames / FPS - 0.2,
  },
];

function printContrast(): void {
  for (const theme of Object.values(L1_THEMES)) {
    console.log(`\nTheme ${theme.id.toUpperCase()}: ${theme.name}`);
    for (const r of themeContrast(theme)) {
      console.log(
        `  ${r.pass ? "pass" : "FAIL"}  ${r.ratio.toFixed(2).padStart(5)}:1  (needs ${r.needs})  ${r.pair}  ${r.fg} on ${r.bg}`,
      );
    }
  }
}

function printTimeline(): void {
  console.log(
    `\nProjected runtime ${timecode(L1_TOTAL_FRAMES)} (${L1_TOTAL_FRAMES} frames, ${(L1_TOTAL_FRAMES / FPS).toFixed(1)} s)`,
  );
  for (const s of L1_LAYOUT.slots) {
    console.log(
      `  ${timecode(s.from).padStart(5)}  beat ${String(s.beat).padStart(2)}  ${CHAPTERS[s.beat]}  (${(s.frames / FPS).toFixed(1)} s)`,
    );
  }
}

async function contactSheet(
  themeId: L1ThemeId,
  files: { file: string; still: Still }[],
  out = path.join(OUT, `contact-${themeId}.png`),
): Promise<string> {
  const theme = L1_THEMES[themeId];
  const cols = 4;
  const cw = 720;
  const ch = 405;
  const gap = 24;
  const caption = 44;
  const header = 120;
  const rows = Math.ceil(files.length / cols);
  const width = cols * cw + (cols + 1) * gap;
  const height = header + rows * (ch + caption + gap) + gap;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

  const swatches = (
    ["bg", "surface", "ink", "muted", "accent", "line"] as const
  )
    .map((k, i) => {
      const x = width - gap - (6 - i) * 150;
      return `<rect x="${x}" y="34" width="36" height="36" rx="4" fill="${theme[k]}" stroke="#888" stroke-width="1"/>
        <text x="${x + 46}" y="50" font-family="Arial" font-size="15" fill="#222">${k}</text>
        <text x="${x + 46}" y="68" font-family="Consolas, monospace" font-size="14" fill="#555">${theme[k]}</text>`;
    })
    .join("");
  const labels = files
    .map(({ still }, i) => {
      const x = gap + (i % cols) * (cw + gap);
      const y = header + Math.floor(i / cols) * (ch + caption + gap) + ch + 28;
      return `<text x="${x}" y="${y}" font-family="Arial" font-size="18" fill="#222">${String(i + 1).padStart(2, "0")}  ${esc(still.what)}</text>`;
    })
    .join("");
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#FFFFFF"/>
      <text x="${gap}" y="62" font-family="Arial" font-weight="bold" font-size="34" fill="#111">L1 style frames · Theme ${themeId.toUpperCase()}: ${esc(theme.name)}</text>
      <text x="${gap}" y="96" font-family="Arial" font-size="18" fill="#555">Test your website with one key · 1920x1080 · stills from the youtube/ set, not a render of the cut</text>
      ${swatches}${labels}
    </svg>`,
  );
  const tiles = await Promise.all(
    files.map(async ({ file }, i) => ({
      input: await sharp(file).resize(cw, ch).png().toBuffer(),
      left: gap + (i % cols) * (cw + gap),
      top: header + Math.floor(i / cols) * (ch + caption + gap),
    })),
  );
  await sharp(svg).composite(tiles).png().toFile(out);
  return out;
}

async function main(): Promise<void> {
  printContrast();
  printTimeline();

  console.log("\nBundling src/youtube/index.ts ...");
  const serveUrl = await bundle({
    entryPoint: path.join(ROOT, "src", "youtube", "index.ts"),
    outDir: path.join(ROOT, "out", "youtube", "bundle"),
    publicDir: path.join(ROOT, "assets"),
    rspack: true,
    symlinkPublicDir: true,
  });

  await ensureBrowser();
  const browser = await openBrowser("chrome", { logLevel: "error" });
  try {
    const qa = process.argv.includes("qa");
    const themes: L1ThemeId[] = qa
      ? ["a"]
      : (Object.keys(L1_THEMES) as L1ThemeId[]);
    for (const themeId of themes) {
      const inputProps = { theme: themeId, withAudio: false };
      const composition = await selectComposition({
        serveUrl,
        id: "YouTubeL1",
        inputProps,
        puppeteerInstance: browser,
      });
      const dir = qa ? QA_OUT : path.join(OUT, themeId);
      fs.mkdirSync(dir, { recursive: true });
      const files: { file: string; still: Still }[] = [];
      for (const [i, still] of (qa ? QA : STILLS).entries()) {
        const frame = slotOf(still.beat).from + Math.round(still.t * FPS);
        const file = path.join(
          dir,
          `${String(i + 1).padStart(2, "0")}-${still.name}.png`,
        );
        await renderStill({
          composition,
          serveUrl,
          output: file,
          frame,
          imageFormat: "png",
          overwrite: true,
          puppeteerInstance: browser,
          logLevel: "error",
          inputProps,
        });
        files.push({ file, still });
        console.log(
          `  ${themeId} ${path.basename(file)}  frame ${frame} (${timecode(frame)})`,
        );
      }
      const sheet = await contactSheet(
        themeId,
        files,
        qa ? path.join(QA_OUT, "contact-qa.png") : undefined,
      );
      console.log(`  contact sheet ${path.relative(ROOT, sheet)}`);
    }
  } finally {
    await browser.close({ silent: true });
  }
}

main().catch((err) => {
  console.error(
    err instanceof Error ? (err.stack ?? err.message) : String(err),
  );
  process.exit(1);
});
