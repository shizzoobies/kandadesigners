// Ellenton Family Practice Direct: render the shared social templates to 1080x1350 PNG.
// The FMG method (To Be Released/2026-10-02 and 2026-10-11 under clients/foremotion-golf): HTML
// rendered with Playwright from D:\kap-reel\node_modules (read only), every font face checked,
// a WCAG contrast report, and guards for margins, clipping and collisions. Here the HTML is a
// fixed template (card, slide, review, provider, photo) and the builder supplies only the words.
//
//   node build.mjs card card.json             one frame  -> ../media/card.png
//   node build.mjs card.json                  the same, with "template": "card" inside the JSON
//   node build.mjs card '{"headline":"..."}'  fields inline
//   node build.mjs slides.json                a carousel -> png/slide-NN.png and ../media/slide-NN.jpg
//   add --out <dir>   write <dir>/<name>.png (or <name>-NN.png) instead, no JPG; name = the JSON's basename
//   add --name <n>    the output name (default "card" for one frame, "slide" for a carousel)
//   add --placeholder-ok   allow the templates' "goes here" text (samples only)
//
// Fields are documented in a comment at the top of each template and in README.md. Text fields
// accept <br> and <em> only. Everything fails loudly: a missing or unknown field, a font that
// did not load or a glyph drawn by a fallback font, text past its line limit, out of its box or
// the safe frame, two blocks touching, a second amber element, any text under 4.5:1, an em or
// en dash, an arrow glyph, decorative 01 02 numbering, a price, or the door sign's 7586.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire("D:/kap-reel/package.json");
const { chromium } = require("playwright");
const sharp = require("sharp");

for (const ev of ["uncaughtException", "unhandledRejection"]) process.on(ev, (e) => { console.error(`ERROR ${e?.message ?? e}`); process.exit(1); });

const here = path.dirname(fileURLToPath(import.meta.url));
const W = 1080, H = 1350;
const SAFE = { side: 64, top: 48, bottom: 48 };
const COMMON = new Set(["template", "variant", "theme", "counter"]);

// ---- arguments ----
const argv = process.argv.slice(2);
const flag = (n) => { const i = argv.indexOf(n); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const bool = (n) => { const i = argv.indexOf(n); if (i < 0) return false; argv.splice(i, 1); return true; };
const outArg = flag("--out"), nameArg = flag("--name"), placeholderOk = bool("--placeholder-ok");
if (!argv.length) { console.error("usage: node build.mjs [template] <fields.json | slides.json | '{json}'> [--out dir] [--name n]"); process.exit(1); }
let templateArg = null, src = argv[0];
if (argv.length > 1) [templateArg, src] = argv;
const readJson = (s) => s.trim().startsWith("{") || s.trim().startsWith("[") ? JSON.parse(s) : JSON.parse(fs.readFileSync(path.resolve(s), "utf8"));
const job = readJson(src);
const jsonName = /^[\[{]/.test(src.trim()) ? null : path.basename(src, ".json");
const items = Array.isArray(job) ? job : job.slides ? job.slides : [job];
const isSet = Array.isArray(job) || Array.isArray(job.slides);
for (const it of items) it.template ??= templateArg ?? (isSet ? "slide" : null);
if (items.some((it) => !it.template)) throw new Error("name the template: node build.mjs card fields.json, or put \"template\" in the JSON");
// A carousel opens on the hook, closes on the ask, and never shows one layout twice in a row.
if (isSet) {
  const v = (it) => `${it.template}:${it.variant ?? (it.template === "slide" ? "hook" : "")}`;
  if (items.length < 2) throw new Error("a carousel needs at least two slides");
  if (v(items[0]) !== "slide:hook") throw new Error("slide 1 must be the hook (variant \"hook\")");
  if (v(items.at(-1)) !== "slide:closing") throw new Error("the last slide must be the ask (variant \"closing\")");
  items.forEach((it, i) => { if (i && v(it) === v(items[i - 1])) throw new Error(`slides ${i} and ${i + 1} repeat the same layout (${v(it)}); vary them`); });
}
const outDir = outArg ? path.resolve(outArg) : path.join(here, "..", "media");
const name = nameArg ?? (outArg && jsonName ? jsonName : isSet ? "slide" : "card");
fs.mkdirSync(outDir, { recursive: true });

// ---- text rules (on every field before render) ----
const allowedTags = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/&lt;br\s*\/?&gt;/g, "<br>").replace(/&lt;(\/?)em&gt;/g, "<$1em>");
const textOf = (v) => (Array.isArray(v) ? v.join(" ") : typeof v === "string" ? v : "");
function checkWords(it, label) {
  const t = Object.entries(it).filter(([k]) => !["photo", "photoPosition", "template", "variant", "theme"].includes(k)).map(([, v]) => textOf(v)).join("\n");
  const bad = [];
  if (/[\u2013\u2014]/.test(t)) bad.push("an em or en dash");
  if (/[\u2190-\u21ff\u2794-\u27bf\u2b05-\u2b07\u2192\u203a\u00bb]|->|=>/.test(t)) bad.push("an arrow");
  if (/\p{Extended_Pictographic}/u.test(t)) bad.push("an emoji");
  if (/(^|[\s>])0\d(?=[\s.):]|$)/m.test(t)) bad.push("decorative 01 02 numbering");
  if (/\$\s?\d/.test(t)) bad.push("a price");
  if (/7586/.test(t)) bad.push("the door sign's 7586 (the number is 941 417 7386)");
  if (!placeholderOk && /goes here|go here/i.test(t)) bad.push("placeholder text");
  if (bad.length) throw new Error(`${label}: ${bad.join(", ")}`);
}

// ---- contrast (WCAG 2.x) ----
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const rgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
const toHex = (a) => "#" + a.map((n) => Math.round(n).toString(16).padStart(2, "0")).join("");

// ---- in-page steps ----
function fill({ fields, extra }) {
  const f = document.querySelector(".frame");
  const known = new Set(extra);
  for (const e of document.querySelectorAll("[data-field],[data-if],[data-list],[data-src],[data-pos],[data-stars]"))
    for (const a of ["field", "if", "list", "src", "pos", "stars"]) if (e.dataset[a]) known.add(e.dataset[a]);
  const unknown = Object.keys(fields).filter((k) => !known.has(k));
  if (unknown.length) return { error: `unknown field(s) for ${f.dataset.template}: ${unknown.join(", ")}` };
  const pick = (list, v, def, what) => {
    const all = (list || "").split(" ").filter(Boolean);
    if (!all.length) return v ? `${what} "${v}" not offered` : null;
    if (!all.includes(v ?? def)) return `${what} "${v}" not one of ${all.join(", ")}`;
    return null;
  };
  const variant = fields.variant ?? f.dataset.defaultVariant, theme = fields.theme ?? f.dataset.defaultTheme;
  const pe = pick(f.dataset.variants, fields.variant, f.dataset.defaultVariant, "variant") || pick(f.dataset.themes, fields.theme, f.dataset.defaultTheme, "theme");
  if (pe) return { error: pe };
  if (variant) f.classList.add(`v-${variant}`);
  f.classList.add(`t-${theme}`);
  for (const e of [...document.querySelectorAll("[data-variant]")]) if (!e.dataset.variant.split(" ").includes(variant)) e.remove();
  for (const e of [...document.querySelectorAll("[data-if]")]) {
    const v = fields[e.dataset.if];
    if (!(v === undefined ? e.hasAttribute("data-default-on") : v !== false && v !== "" && v !== null && v !== 0)) e.remove();
  }
  const missing = [];
  for (const e of document.querySelectorAll("[data-field]")) {
    const v = fields[e.dataset.field];
    if (v === undefined || v === true) { if (!e.closest("[data-default-on]")) missing.push(e.dataset.field); continue; }
    e.innerHTML = e.hasAttribute("data-quote") ? `\u201C${v}\u201D` : String(v);
  }
  for (const e of document.querySelectorAll("[data-list]")) {
    const v = fields[e.dataset.list];
    if (!Array.isArray(v) || !v.length) { missing.push(e.dataset.list); continue; }
    const max = +e.dataset.maxItems || 99;
    if (v.length > max) return { error: `${e.dataset.list}: ${v.length} lines, the limit is ${max}` };
    const proto = e.firstElementChild; e.innerHTML = "";
    for (const t of v) { const c = proto.cloneNode(false); c.innerHTML = t; e.append(c); }
  }
  for (const e of document.querySelectorAll("[data-src]")) {
    const v = fields[e.dataset.src];
    if (!v) { missing.push(e.dataset.src); continue; }
    e.src = v;
  }
  for (const e of document.querySelectorAll("[data-pos]")) if (fields[e.dataset.pos]) e.style.objectPosition = fields[e.dataset.pos];
  for (const e of document.querySelectorAll("[data-stars]")) {
    const n = Number(fields[e.dataset.stars]);
    if (!Number.isInteger(n) || n < 1 || n > 5) return { error: "stars must be a whole number from 1 to 5" };
    const star = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"/></svg>';
    e.innerHTML = star.repeat(n);
  }
  if (missing.length) return { error: `missing field(s) for ${f.dataset.template}${variant ? ` (${variant})` : ""}: ${[...new Set(missing)].join(", ")}` };
  return { variant, theme };
}

function lineCount(e) {
  const r = document.createRange(); r.selectNodeContents(e);
  const tops = [];
  for (const q of r.getClientRects()) if (q.width > 1 && !tops.some((t) => Math.abs(t - q.top) < q.height / 2)) tops.push(q.top);
  return tops.length;
}

function fit() {
  // data-fit="64 58 52": the first size at which the element keeps its line limit and its region holds.
  for (const e of document.querySelectorAll("[data-fit]")) {
    const sizes = e.dataset.fit.split(" ").map(Number), max = +e.dataset.maxLines || 99;
    const region = e.closest("[data-region]");
    for (const s of sizes) {
      e.style.fontSize = `${s}px`;
      const rb = region?.getBoundingClientRect();
      const kids = region ? [...region.querySelectorAll("*")].map((k) => k.getBoundingClientRect()) : [];
      const holds = !region || kids.every((k) => k.top >= rb.top - 1 && k.bottom <= rb.bottom + 1);
      if (lineCount(e) <= max && holds) break;
    }
  }
}

function guard({ W, H, SAFE }) {
  const probs = [], warn = [];
  const f = document.querySelector(".frame"), fr = f.getBoundingClientRect();
  const label = (e) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/).join(".") : ""}`;
  const hasText = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const texts = [...f.querySelectorAll("*")].filter(hasText);
  texts.forEach((e, i) => e.setAttribute("data-t", i));
  const blocks = [...f.querySelectorAll("img, .rule, .button, .stars, .swipe")].concat(texts.filter((e) => !e.closest(".button, .swipe")))
    .filter((e, i, a) => a.indexOf(e) === i && !e.classList.contains("photo"));
  if (Math.round(fr.width) !== W || Math.round(fr.height) !== H) probs.push(`frame is ${fr.width}x${fr.height}`);
  for (const e of blocks) {
    const r = e.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.left < fr.left + SAFE.side || r.right > fr.right - SAFE.side || r.top < fr.top + SAFE.top || r.bottom > fr.bottom - SAFE.bottom)
      probs.push(`${label(e)} outside the safe frame`);
  }
  for (const e of texts) {
    if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== "inline") probs.push(`${label(e)} text runs past its box`);
    const max = +e.dataset.maxLines;
    if (max) { const n = lineCount(e); if (n > max) probs.push(`${label(e)} runs ${n} lines, the limit is ${max}`); }
  }
  for (const e of f.querySelectorAll("li[data-max-lines]")) { const n = lineCount(e); if (n > +e.dataset.maxLines) probs.push(`list line runs ${n} lines, the limit is ${e.dataset.maxLines}`); }
  for (const reg of f.querySelectorAll("[data-region]")) {
    const rb = reg.getBoundingClientRect();
    for (const k of reg.querySelectorAll("*")) { const r = k.getBoundingClientRect(); if (r.height && (r.top < rb.top - 1 || r.bottom > rb.bottom + 1)) probs.push(`${label(k)} spills out of its box (shorten the text)`); }
  }
  // Two blocks must not touch: 12px clearance everywhere, more where data-clear asks for it.
  const box = (e) => e.getBoundingClientRect();
  for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) {
    const a = blocks[i], b = blocks[j];
    if (a.contains(b) || b.contains(a)) continue;
    if (a.parentElement === b.parentElement && a.parentElement.hasAttribute("data-list")) continue; // ruled list lines meet by design
    const ra = box(a), rb = box(b);
    const ca = a.closest("[data-clear]"), cb = b.closest("[data-clear]");
    const need = ca === cb ? 12 : Math.max(12, +(ca?.dataset.clear || 0), +(cb?.dataset.clear || 0));
    const hOverlap = ra.left < rb.right + 12 && rb.left < ra.right + 12;
    const vGap = Math.max(rb.top - ra.bottom, ra.top - rb.bottom);
    const hGap = Math.max(rb.left - ra.right, ra.left - rb.right);
    if (hOverlap && vGap < need && hGap < 12) probs.push(`${label(a)} within ${Math.round(vGap)}px of ${label(b)} (needs ${need})`);
  }
  // Amber is conversion only: one amber element per frame.
  const amber = new Set(["161,90,28", "207,124,51", "138,75,23", "227,154,85"]);
  const groups = new Set();
  for (const e of f.querySelectorAll("*")) {
    const s = getComputedStyle(e);
    const hit = [s.color, s.backgroundColor].some((c) => amber.has((c.match(/\d+/g) || []).slice(0, 3).join(",")) && !/, 0\)$/.test(c));
    if (hit && (hasText(e) || s.backgroundColor !== "rgba(0, 0, 0, 0)" || e.tagName === "svg" || e.closest("[data-amber]"))) groups.add(e.closest("[data-amber]") || e);
  }
  if (groups.size > 1) probs.push(`${groups.size} amber elements; amber is the booking button only`);
  // Pictures shown larger than their pixels.
  for (const img of f.querySelectorAll("img")) {
    if (!img.complete || !img.naturalWidth) { probs.push(`${label(img)} did not load`); continue; }
    if (/\.svg/i.test(img.src)) continue;
    const r = img.getBoundingClientRect();
    const cover = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
    if (cover > 1.15) warn.push(`${label(img)} is shown at ${cover.toFixed(2)}x its pixels (${img.naturalWidth}x${img.naturalHeight} source in a ${Math.round(r.width)}x${Math.round(r.height)} box): look at it for softness`);
  }
  // Contrast: every text element against the ground it actually sits on.
  const pairs = [];
  for (const e of texts) {
    let bgEl = e, bg = "rgba(0, 0, 0, 0)";
    while (bgEl) { bg = getComputedStyle(bgEl).backgroundColor; if (!/rgba\(.*, 0\)$/.test(bg) && bg !== "transparent") break; bgEl = bgEl.parentElement; }
    const s = getComputedStyle(e);
    pairs.push({ where: label(e), text: e.textContent.trim().slice(0, 40), fg: s.color, bg, size: s.fontSize, weight: s.fontWeight });
  }
  return { probs, warn, pairs, faces: [...document.fonts].map((x) => `${x.family} ${x.style} ${x.weight}: ${x.status}`) };
}

// ---- render ----
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const report = [], outs = [], notes = [];
try {
  for (let i = 0; i < items.length; i++) {
    const { template, ...fields } = items[i];
    const label = isSet ? `slide ${i + 1} (${template}${fields.variant ? " " + fields.variant : ""})` : template;
    const tpl = path.join(here, `${template}.html`);
    if (!fs.existsSync(tpl)) throw new Error(`${label}: no template ${template}.html next to build.mjs`);
    checkWords(fields, label);
    const f = {};
    for (const [k, v] of Object.entries(fields)) {
      if (k === "photo") {
        const p = path.isAbsolute(v) ? v : path.resolve(here, v);
        if (!fs.existsSync(p)) throw new Error(`${label}: photo not found: ${p}`);
        f[k] = pathToFileURL(p).href;
      } else f[k] = typeof v === "string" ? allowedTags(v) : Array.isArray(v) ? v.map((x) => allowedTags(String(x))) : v;
    }
    if (isSet && f.counter === undefined) f.counter = `${i + 1} / ${items.length}`;
    if (f.counter === undefined) f.counter = false;
    if (template !== "slide" && f.counter === `${i + 1} / ${items.length}`) delete f.counter;

    await page.goto(pathToFileURL(tpl).href);
    await page.evaluate(`window.lineCount = ${lineCount.toString()}`);
    await page.evaluate(() => Promise.all([...document.fonts].map((x) => x.load())));
    const filled = await page.evaluate(fill, { fields: f, extra: [...COMMON] });
    if (filled.error) throw new Error(`${label}: ${filled.error}`);
    await page.evaluate(() => Promise.all([...document.images].map((im) => im.decode().catch(() => null))));
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(fit);
    await page.waitForTimeout(150);
    const g = await page.evaluate(guard, { W, H, SAFE });
    const unloaded = g.faces.filter((x) => !x.endsWith(": loaded"));
    if (unloaded.length) throw new Error(`${label}: fonts not loaded: ${unloaded.join("; ")}`);
    // Every glyph must come from Lora or DM Sans, not a system fallback.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("DOM.enable"); await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: "[data-t]" });
    const used = new Set();
    for (const id of nodeIds) {
      const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId: id });
      for (const x of fonts) { used.add(x.familyName); if (!x.isCustomFont || !/^(Lora|DM Sans)/i.test(x.familyName)) g.probs.push(`a glyph drawn in fallback font ${x.familyName}`); }
    }
    await cdp.detach();
    if (g.probs.length) throw new Error(`${label}: ${[...new Set(g.probs)].join("; ")}`);
    for (const w of g.warn) notes.push(`${label}: ${w}`);
    const seen = new Set();
    for (const p of g.pairs) {
      const fg = toHex(rgb(p.fg)), bg = toHex(rgb(p.bg)), key = `${p.where}|${fg}|${bg}`;
      if (seen.has(key)) continue; seen.add(key);
      report.push({ frame: label, where: p.where, text: p.text, fg, bg, size: p.size, weight: p.weight, ratio: Math.round(ratio(rgb(p.fg), rgb(p.bg)) * 100) / 100 });
    }
    const n = String(i + 1).padStart(2, "0");
    const pngPath = isSet ? (outArg ? path.join(outDir, `${name}-${n}.png`) : path.join(here, "png", `${name}-${n}.png`)) : path.join(outDir, `${name}.png`);
    fs.mkdirSync(path.dirname(pngPath), { recursive: true });
    await page.locator(".frame").screenshot({ path: pngPath });
    if (isSet && !outArg) await sharp(pngPath).jpeg({ quality: 92, mozjpeg: true }).toFile(path.join(outDir, `${name}-${n}.jpg`));
    outs.push(pngPath);
    console.log(`  ${label}: fonts ${[...used].join(", ")}`);
  }
} finally {
  await browser.close();
}

const low = report.filter((r) => r.ratio < 4.5);
const reportPath = outArg ? path.join(outDir, `${name}.contrast.json`) : path.join(here, "contrast.json");
fs.writeFileSync(reportPath, JSON.stringify({ standard: "WCAG 2.x, 4.5:1 for all text", lowest: Math.min(...report.map((r) => r.ratio)), pairs: report }, null, 2) + "\n");
if (low.length) { console.error("CONTRAST under 4.5:1", low); process.exit(1); }

if (isSet) {
  const w = 360, h = 450, gap = 20, cols = Math.min(3, outs.length), rows = Math.ceil(outs.length / cols);
  const comps = await Promise.all(outs.map(async (p, i) => ({ input: await sharp(p).resize(w, h).toBuffer(), left: gap + (i % cols) * (w + gap), top: gap + Math.floor(i / cols) * (h + gap) })));
  const sheet = outArg ? path.join(outDir, `${name}-contact-sheet.png`) : path.join(here, "contact-sheet.png");
  await sharp({ create: { width: gap + cols * (w + gap), height: gap + rows * (h + gap), channels: 3, background: "#777777" } }).composite(comps).png().toFile(sheet);
}
for (const n of notes) console.warn(`NOTE ${n}`);
const metas = await Promise.all(outs.map((p) => sharp(p).metadata()));
console.log(`rendered ${outs.length} ${[...new Set(metas.map((m) => `${m.width}x${m.height}`))].join(", ")} -> ${path.relative(process.cwd(), outs.length > 1 ? path.dirname(outs[0]) : outs[0]) || "."}; lowest contrast ${Math.min(...report.map((r) => r.ratio))}:1 (${path.relative(process.cwd(), reportPath)})`);
