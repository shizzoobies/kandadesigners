/**
 * scripts/youtube/l1/style-frames.ts
 *
 * The A4 gate for YouTube L1: ten stills of the shared youtube/ set and a
 * contact sheet, rendered from the composition (no video). At the gate on
 * 2026-09-28 Alex compared two themes and picked B, stone and evergreen, which
 * is now L1's only theme.
 *
 * Out:  out/youtube/l1/style-frames/<theme id>/NN-name.png   1920x1080
 *       out/youtube/l1/style-frames/contact-<theme id>.png
 *
 * Also prints the theme's contrast table and the projected runtime with the
 * beat starts (the chapter times, before any change at the gate).
 *
 * Run from D:\kap-reel after stage.ts (never npx):
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/style-frames.ts
 *   node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/style-frames.ts qa
 * `qa` renders 27 checking stills across the whole cut instead
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
import { L1_THEME } from "../../../src/youtube/l1/themes";
import {
  CHAPTERS,
  L1_LAYOUT,
  L1_TOTAL_FRAMES,
  cue,
  slotOf,
} from "../../../src/youtube/l1/timeline";
import { themeContrast } from "../../../src/youtube/theme";
import { timecode } from "../../../src/youtube/timeline";
import { contactSheet } from "./sheet";

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
  const theme = L1_THEME;
  console.log(`\nTheme ${theme.id.toUpperCase()}: ${theme.name}`);
  for (const r of themeContrast(theme)) {
    console.log(
      `  ${r.pass ? "pass" : "FAIL"}  ${r.ratio.toFixed(2).padStart(5)}:1  (needs ${r.needs})  ${r.pair}  ${r.fg} on ${r.bg}`,
    );
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
    const theme = L1_THEME;
    const inputProps = { withAudio: false };
    const composition = await selectComposition({
      serveUrl,
      id: "YouTubeL1",
      inputProps,
      puppeteerInstance: browser,
    });
    const dir = qa ? QA_OUT : path.join(OUT, theme.id);
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
        `  ${path.basename(file)}  frame ${frame} (${timecode(frame)})`,
      );
    }
    const sheet = await contactSheet({
      title: `L1 ${qa ? "QA stills" : "style frames"} · ${theme.name}`,
      subtitle:
        "Test your website with one key · 1920x1080 · stills from the composition",
      tiles: files.map(({ file, still }) => ({ file, what: still.what })),
      out: qa
        ? path.join(QA_OUT, "contact-qa.png")
        : path.join(OUT, `contact-${theme.id}.png`),
      swatches: {
        bg: theme.bg,
        surface: theme.surface,
        ink: theme.ink,
        muted: theme.muted,
        accent: theme.accent,
        line: theme.line,
      },
    });
    console.log(`  contact sheet ${path.relative(ROOT, sheet)}`);
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
