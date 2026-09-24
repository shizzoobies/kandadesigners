import fs from "node:fs";
import path from "node:path";

const FIRST_COMMENT = /^## First comment\s*$/im;

export function readCaption(dir, file) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8").trim();
}

/** Instagram caption text above the "## First comment" heading, first comment below it. */
export function splitInstagram(text) {
  const m = FIRST_COMMENT.exec(text);
  if (!m) return { caption: text.trim(), firstComment: "" };
  return {
    caption: text.slice(0, m.index).trim(),
    firstComment: text.slice(m.index + m[0].length).trim()
  };
}
