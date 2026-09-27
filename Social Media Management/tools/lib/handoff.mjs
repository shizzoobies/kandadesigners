// Hands an approved, owner-published client post to the owner: a plain
// folder of renamed media and caption files the owner pastes by hand, moved
// out of To Be Released/ into Handed Off/. See clients/README.md.
import fs from "node:fs";
import path from "node:path";
import { readManifest, writeManifest, mediaFor } from "./manifest.mjs";
import { readCaption, splitInstagram } from "./captions.mjs";
import { validateFolder } from "./validate.mjs";
import { HANDED_OFF } from "./paths.mjs";

// A folder about to be handed off is often approved for a time that has
// since passed (that is normal - it is late, not invalid); every other
// validateFolder problem still blocks the hand-off.
const PAST_TIME = / is in the past$/;

/** Media the owner actually needs: never a caption sidecar/SRT or a thumbnail, unless it is the only visual there is. */
export function selectHandoffMedia(media) {
  const keep = (media || []).filter((m) => m.role !== "captions" && m.role !== "thumbnail");
  if (keep.length) return keep;
  const thumbnails = (media || []).filter((m) => m.role === "thumbnail");
  return thumbnails.length === 1 ? thumbnails : [];
}

/**
 * Each kept entry gets its hand-off file name. Images are numbered 1, 2, 3...
 * in order, keeping their own extension. A video scoped to exactly one
 * network (`platforms: ["facebook"]`) is named `video-facebook.<ext>`; every
 * other video (unscoped, or scoped to more than one network) is `video.<ext>`
 * for the first one and `video-2.<ext>`, `video-3.<ext>`... after that.
 */
export function planMediaNames(mediaEntries) {
  let imageIndex = 0;
  let genericVideoIndex = 0;
  return mediaEntries.map((entry) => {
    const ext = path.extname(entry.file);
    if (entry.role === "video") {
      if (Array.isArray(entry.platforms) && entry.platforms.length === 1) {
        return { ...entry, handoffName: `video-${entry.platforms[0]}${ext}` };
      }
      genericVideoIndex++;
      return { ...entry, handoffName: genericVideoIndex === 1 ? `video${ext}` : `video-${genericVideoIndex}${ext}` };
    }
    imageIndex++;
    return { ...entry, handoffName: `${imageIndex}${ext}` };
  });
}

/** "Tuesday, October 6 at 11:30 AM": the suggested day and time exactly as the owner should read it, no timezone math. */
export function formatSuggestedTime(date, time) {
  const [y, mo, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const asUtc = new Date(Date.UTC(y, mo - 1, d, hh, mm));
  const weekday = asUtc.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const month = asUtc.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const hour12 = (hh % 12) || 12;
  const ampm = hh < 12 ? "AM" : "PM";
  return `${weekday}, ${month} ${asUtc.getUTCDate()} at ${hour12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

/** The caption file's own content: the caption alone, or with the first-comment block only when there is one to paste. */
function formatInstagramFile(raw) {
  const { caption, firstComment } = splitInstagram(raw || "");
  if (!firstComment) return `${caption}\n`;
  return `${caption}\n\nFirst comment (paste right after posting):\n${firstComment}\n`;
}

/** "video.mp4 as a Reel" / "1.jpg to 7.jpg as a carousel, in order" / "1.jpg as a single image", for one network's own media. */
function describeNetworkMedia(items) {
  if (!items.length) return "no media";
  const video = items.find((m) => m.role === "video");
  if (video) return `${video.handoffName} as a Reel`;
  if (items.length === 1) return `${items[0].handoffName} as a single image`;
  return `${items[0].handoffName} to ${items[items.length - 1].handoffName} as a carousel, in order`;
}

function howToPostText({ post, hasFacebook, hasInstagram, namedMedia }) {
  const lines = [post.title, "", `Post: ${formatSuggestedTime(post.date, post.time)}`, ""];
  const forNetwork = (network) => namedMedia.filter((m) => mediaFor(m, network));
  const perNetwork = [];
  if (hasFacebook) perNetwork.push(`Facebook: ${describeNetworkMedia(forNetwork("facebook"))}`);
  if (hasInstagram) perNetwork.push(`Instagram: ${describeNetworkMedia(forNetwork("instagram"))}`);
  if (perNetwork.length) lines.push(perNetwork.join("; "), "");
  if (hasFacebook) lines.push(`Facebook: paste "Facebook caption.txt" as the post text.`);
  if (hasInstagram) lines.push(`Instagram: paste the top of "Instagram caption.txt" as the post text, then the rest as the first comment right after posting.`);
  return lines.join("\n") + "\n";
}

/**
 * Builds `<dir>/handoff/` for one folder and moves it to `<root>/Handed
 * Off/<name>`. Only a folder with status "approved" is handed off (or one
 * already "handed-off" but still stuck in To Be Released - a previous run's
 * rename step failed or was interrupted; this finishes it). Anything else is
 * reported and left untouched, as is a folder that fails `validateFolder`
 * (except the "approved post time ... is in the past" rule: an approved post
 * may legitimately be handed off late).
 *
 * Order matters: the rename to Handed Off/ happens first; only once the
 * folder is actually there does post.json get `status: "handed-off"` and its
 * `handoff` record. If the rename fails, post.json (still "approved", or
 * already "handed-off" if this is completing a stuck recovery) is untouched,
 * so a retry is always safe.
 *
 * `--dry-run` (dryRun: true) still runs the collision check and reports the
 * real destination and file list; it just does not write or move anything.
 */
export function buildHandoff(dir, { root, client = null, dryRun = false, now = new Date(), rename = fs.renameSync } = {}) {
  const name = path.basename(dir);
  const m = readManifest(dir);
  const recovering = m.status === "handed-off";
  if (m.status !== "approved" && !recovering) return { name, skipped: `status ${m.status}` };

  const problems = validateFolder(dir, { now, client }).filter((p) => !PAST_TIME.test(p));
  if (problems.length) return { name, skipped: `invalid: ${problems.join("; ")}` };

  const target = path.join(root, HANDED_OFF, name);
  const handoffPath = path.join(target, "handoff");
  if (fs.existsSync(target)) throw new Error(`${name}: already exists in ${HANDED_OFF}`);

  const networks = Object.keys(m.platforms || {});
  const namedMedia = planMediaNames(selectHandoffMedia(m.media));
  const written = namedMedia.map((entry) => entry.handoffName);

  const hasFacebook = networks.includes("facebook");
  const facebookText = hasFacebook ? readCaption(dir, m.platforms.facebook.caption) : null;
  if (facebookText !== null) written.push("Facebook caption.txt");

  const hasInstagram = networks.includes("instagram");
  const instagramRaw = hasInstagram ? readCaption(dir, m.platforms.instagram.caption) : null;
  const instagramText = instagramRaw !== null ? formatInstagramFile(instagramRaw) : null;
  if (instagramText !== null) written.push("Instagram caption.txt");

  const howTo = howToPostText({
    post: m, namedMedia,
    hasFacebook: facebookText !== null,
    hasInstagram: instagramText !== null
  });
  written.push("How to post.txt");

  if (!dryRun) {
    const outDir = path.join(dir, "handoff");
    fs.mkdirSync(outDir, { recursive: true });
    for (const entry of namedMedia) fs.copyFileSync(path.join(dir, entry.file), path.join(outDir, entry.handoffName));
    if (facebookText !== null) fs.writeFileSync(path.join(outDir, "Facebook caption.txt"), facebookText + "\n");
    if (instagramText !== null) fs.writeFileSync(path.join(outDir, "Instagram caption.txt"), instagramText);
    fs.writeFileSync(path.join(outDir, "How to post.txt"), howTo);

    fs.mkdirSync(path.join(root, HANDED_OFF), { recursive: true });
    rename(dir, target);

    const moved = readManifest(target);
    moved.status = "handed-off";
    moved.handoff = { at: now.toISOString(), files: written };
    writeManifest(target, moved);
  }

  return { name, files: written, driveFolder: `${m.date} ${m.title}`, handoffPath, recovered: recovering };
}
