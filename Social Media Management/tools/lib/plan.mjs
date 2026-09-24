import fs from "node:fs";
import path from "node:path";
import { dayDir } from "./paths.mjs";
import { writeManifest, DAY_NAME } from "./manifest.mjs";

/** Create a planned day folder. `date` is the folder name: YYYY-MM-DD or YYYY-MM-DD-N. Returns its path. */
export function createDay({ root, date, pillar, title, type = "REEL", time = "09:00", from = null, ai = { voice: false, visuals: false } }) {
  if (!DAY_NAME.test(date)) throw new Error(`bad date: ${date}`);
  const dir = dayDir(root, date);
  if (fs.existsSync(dir)) throw new Error(`folder already exists: ${date}`);

  try {
    fs.mkdirSync(path.join(dir, "media"), { recursive: true });

    const media = from ? copyReel(from, dir) : [];

    writeManifest(dir, {
      id: date,
      date: date.slice(0, 10),
      time,
      timezone: "America/New_York",
      status: "planned",
      pillar,
      title,
      platforms: {
        facebook: { type, caption: "facebook.md" },
        instagram: { type, caption: "instagram.md" }
      },
      media,
      ai,
      generate: [],
      r2: {},
      metricool: {},
      published: {},
      credits: {},
      lastError: null
    });
    fs.writeFileSync(path.join(dir, "facebook.md"), "");
    fs.writeFileSync(path.join(dir, "instagram.md"), "\n## First comment\n\n");
  } catch (err) {
    fs.rmSync(dir, { recursive: true, force: true });
    throw err;
  }
  return dir;
}

/** Return the single file in `files` matching `test`, or throw using `kind` in the error. */
function pickOne(files, test, kind, src) {
  const matches = files.filter(test);
  if (matches.length === 0) throw new Error(`no ${kind} in ${src}`);
  if (matches.length > 1) throw new Error(`more than one ${kind} in ${src}`);
  return matches[0];
}

/** Copy the vertical cut, its SRT, and the thumbnail from <from>/Facebook into media/. */
function copyReel(from, dir) {
  const src = path.join(from, "Facebook");
  const files = fs.existsSync(src) ? fs.readdirSync(src) : [];
  const mp4 = pickOne(files, (f) => f.toLowerCase().endsWith(".mp4"), ".mp4", src);
  const srt = pickOne(files, (f) => f.toLowerCase().endsWith(".srt"), ".srt", src);
  const jpg = pickOne(files, (f) => /^thumbnail.*\.jpg$/i.test(f), "thumbnail*.jpg", src);
  fs.copyFileSync(path.join(src, mp4), path.join(dir, "media", "reel-vertical.mp4"));
  fs.copyFileSync(path.join(src, srt), path.join(dir, "media", "reel-vertical.srt"));
  fs.copyFileSync(path.join(src, jpg), path.join(dir, "media", "thumbnail.jpg"));
  return [
    { file: "media/reel-vertical.mp4", role: "video", origin: "kap-reel", alt: "" },
    { file: "media/thumbnail.jpg", role: "thumbnail", origin: "kap-reel", alt: "" },
    { file: "media/reel-vertical.srt", role: "captions", origin: "kap-reel" }
  ];
}
