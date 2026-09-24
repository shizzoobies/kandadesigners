import fs from "node:fs";
import path from "node:path";
import { dayDir } from "./paths.mjs";
import { writeManifest } from "./manifest.mjs";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Create a planned day folder. Returns its path. */
export function createDay({ root, date, pillar, title, type = "REEL", time = "09:00", from = null, ai = { voice: false, visuals: false } }) {
  if (!DATE.test(date)) throw new Error(`bad date: ${date}`);
  const dir = dayDir(root, date);
  if (fs.existsSync(dir)) throw new Error(`folder already exists: ${date}`);
  fs.mkdirSync(path.join(dir, "media"), { recursive: true });

  const media = from ? copyReel(from, dir) : [];

  writeManifest(dir, {
    id: date,
    date,
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
  return dir;
}

/** Copy the vertical cut, its SRT, and the thumbnail from <from>/Facebook into media/. */
function copyReel(from, dir) {
  const src = path.join(from, "Facebook");
  const files = fs.existsSync(src) ? fs.readdirSync(src) : [];
  const pick = (test) => files.find(test);
  const mp4 = pick((f) => f.endsWith(".mp4"));
  const srt = pick((f) => f.endsWith(".srt"));
  const jpg = pick((f) => /^thumbnail.*\.jpg$/i.test(f));
  if (!mp4) throw new Error(`no .mp4 in ${src}`);
  if (!srt) throw new Error(`no .srt in ${src}`);
  if (!jpg) throw new Error(`no thumbnail*.jpg in ${src}`);
  fs.copyFileSync(path.join(src, mp4), path.join(dir, "media", "reel-vertical.mp4"));
  fs.copyFileSync(path.join(src, srt), path.join(dir, "media", "reel-vertical.srt"));
  fs.copyFileSync(path.join(src, jpg), path.join(dir, "media", "thumbnail.jpg"));
  return [
    { file: "media/reel-vertical.mp4", role: "video", origin: "kap-reel", alt: "" },
    { file: "media/thumbnail.jpg", role: "thumbnail", origin: "kap-reel", alt: "" },
    { file: "media/reel-vertical.srt", role: "captions", origin: "kap-reel" }
  ];
}
