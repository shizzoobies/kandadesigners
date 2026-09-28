/**
 * scripts/youtube/l1/capture.mjs
 *
 * Screen captures for YouTube L1, "Test your website with one key" (task A2).
 * Job spec: Social Media Management/plans/youtube-2026-09-28/video-1-tab-key.md, section 4.
 *
 * Run from D:\kap-reel with node directly (never npx; the ampersand in the real path breaks
 * the npm shims):
 *
 *   node scripts/youtube/l1/capture.mjs                  verify the live site, then everything
 *   node scripts/youtube/l1/capture.mjs --verify-only    only re-check the live site facts
 *   node scripts/youtube/l1/capture.mjs --only C2,D3     only these clips (ids below, plus STILLS and S1)
 *   node scripts/youtube/l1/capture.mjs --skip-verify    skip the live-site checks
 *   node scripts/youtube/l1/capture.mjs --force          record even if a live-site check fails
 *
 * Output: public/youtube/l1/captures/ (see the README.md there).
 *
 * Why a frame-stepped PNG sequence and not recordVideo
 * ----------------------------------------------------
 * Playwright's recordVideo is fed by the CDP screencast, which delivers frames at CSS-pixel size
 * (1440x810) even in a deviceScaleFactor 2 context. Asking for a 2880x1620 recordVideo only pads
 * that 1x image with gray, and the result is then VP8 at a 1 Mbps cap. Both were tested on
 * 2026-09-28. So every clip here is a sequence of real deviceScaleFactor 2 PNG screenshots
 * (2880x1620), one per video frame at 30 fps, piped into ffmpeg and written as H.264 CRF 12.
 *
 * A DSF 2 screenshot takes about 130 ms, so the page cannot be filmed in real time. Instead each
 * frame advances a virtual clock: every CSS animation and transition on the page is paused and
 * stepped forward exactly one frame (33.3 ms) before its screenshot. Key presses land on exact
 * frames, so the pacing in the clip (about 0.8 s between Tabs, the holds) is exact, and the skip
 * link slide, the menu and the Kai panel animate at their real speed in the finished clip.
 * The caret is hidden in every frame (Playwright's screenshot default), which keeps holds still.
 *
 * Safety rails: typing is only allowed on the local demo page, and Enter or Space is refused on
 * the contact form's submit button, the Kai inputs and any submit button on the live site.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const OUT = path.join(ROOT, "public", "youtube", "l1", "captures");
const STILLS = path.join(OUT, "stills");

const SITE = "https://ka-performancefl.com";
const HOME = `${SITE}/`;
const CONTACT = `${SITE}/contact/`;
const AUDIT = `${SITE}/services/accessibility/`;
const DEMO = pathToFileURL(path.join(HERE, "demo", "index.html")).href;
const DEMO_REVEAL = `${DEMO}?reveal=1`;
const SAFARI = pathToFileURL(path.join(HERE, "demo", "safari-advanced.html")).href;

const DESKTOP = { width: 1440, height: 810 };
const TABLET = { width: 960, height: 540 };
const DSF = 2;
const FPS = 30;
const FRAME_MS = 1000 / FPS;
const RUST = "rgb(154, 52, 18)";
const HOME_SETTLE_MS = 3000; // the hero illustration draws in on load
const TYPE_FRAMES_PER_CHAR = 3; // 10 characters a second

// ---------------------------------------------------------------------------
// In-page helpers (serialized into the page by page.evaluate)
// ---------------------------------------------------------------------------

/** Pause every running CSS animation or transition and step it forward one frame. */
function advanceVirtualClock(frameMs) {
  for (const a of document.getAnimations()) {
    if (a.timeline && typeof DocumentTimeline === "function" && !(a.timeline instanceof DocumentTimeline)) continue;
    if (a.__kapSkip) continue;
    if (!a.__kapClock) {
      // Leave alone anything the page itself paused or already finished.
      if (a.playState !== "running" && a.playState !== "pending") {
        a.__kapSkip = true;
        continue;
      }
      a.__kapClock = true;
      a.pause();
      continue; // a new animation shows its first frame now, then steps from the next frame
    }
    const end = a.effect ? a.effect.getComputedTiming().endTime : Infinity;
    const next = (a.currentTime || 0) + frameMs;
    if (next >= end) a.finish();
    else a.currentTime = next;
  }
}

/** Where focus is, in CSS px relative to the viewport. */
function focusInfo() {
  const r1 = (v) => Math.round(v * 10) / 10;
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) {
    return { tag: "body", id: null, label: "", box: null, ringBox: null, outline: "none", focusVisible: false, scrollY: r1(scrollY) };
  }
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const hasOutline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
  const grow = hasOutline ? parseFloat(cs.outlineWidth) + (parseFloat(cs.outlineOffset) || 0) : 0;
  const label = (
    el.getAttribute("aria-label") ||
    (el.labels && el.labels[0] ? el.labels[0].innerText : "") ||
    el.innerText ||
    el.getAttribute("placeholder") ||
    ""
  )
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 60);
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    label,
    expanded: el.getAttribute("aria-expanded"),
    box: { x: r1(r.x), y: r1(r.y), w: r1(r.width), h: r1(r.height) },
    ringBox: hasOutline ? { x: r1(r.x - grow), y: r1(r.y - grow), w: r1(r.width + 2 * grow), h: r1(r.height + 2 * grow) } : null,
    outline: hasOutline ? `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}, offset ${cs.outlineOffset}` : "none",
    focusVisible: el.matches(":focus-visible"),
    scrollY: r1(scrollY),
  };
}

/**
 * Put the sequential focus starting point just before `selector` without showing focus, so the
 * next real Tab lands on it. Focuses the element before it in DOM order, then blurs it.
 */
function startFocusBefore(selector) {
  const target = document.querySelector(selector);
  const all = [...document.querySelectorAll("a[href], button, input, textarea, select, [tabindex]")].filter(
    (e) => e.tabIndex >= 0 && !e.disabled && (e.offsetWidth || e.offsetHeight),
  );
  const prev = all[all.indexOf(target) - 1];
  if (!target || !prev) throw new Error(`startFocusBefore: nothing before ${selector}`);
  prev.focus({ preventScroll: true });
  prev.blur();
}

// ---------------------------------------------------------------------------
// Browser plumbing
// ---------------------------------------------------------------------------

async function newContext(browser, viewport, deviceScaleFactor = DSF) {
  return browser.newContext({ viewport, deviceScaleFactor, colorScheme: "light", reducedMotion: "no-preference" });
}

async function openPage(ctx, url, settleMs) {
  const page = await ctx.newPage();
  page.setDefaultNavigationTimeout(60_000);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.mouse.move(-60, -60); // parked off-screen: no hover state anywhere
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(settleMs);
  return page;
}

const NO_ACTIVATE = "#contact-submit, #chat-send, #chat-input, #sg-send, #sg-input, button[type=submit], input[type=submit]";

async function safePress(page, key) {
  if (!page.url().startsWith("file:") && ["Enter", " ", "Space"].includes(key)) {
    const blocked = await page.evaluate((sel) => {
      const a = document.activeElement;
      return Boolean(a && a.matches && a.matches(sel));
    }, NO_ACTIVATE);
    if (blocked) throw new Error(`Refusing to press ${key}: focus is on a submit or chat control on the live site`);
  }
  await page.keyboard.press(key);
}

async function safeType(page, text) {
  if (!page.url().startsWith("file:")) throw new Error("Typing is only allowed on the local demo page");
  await page.keyboard.type(text);
}

function startEncoder(outPath) {
  const args = [
    "-y", "-v", "error",
    "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
    "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-profile:v", "high", "-g", String(FPS),
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    "-movflags", "+faststart",
    outPath,
  ];
  const proc = spawn("ffmpeg", args, { stdio: ["pipe", "ignore", "pipe"] });
  let stderr = "";
  proc.stderr.on("data", (d) => (stderr += d));
  const done = new Promise((resolve, reject) => {
    proc.on("error", reject);
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr}`))));
  });
  return {
    write: (buf) =>
      new Promise((resolve) => {
        if (proc.stdin.write(buf)) resolve();
        else proc.stdin.once("drain", resolve);
      }),
    end: async () => {
      proc.stdin.end();
      await done;
    },
  };
}

// ---------------------------------------------------------------------------
// Clip definitions. Times are seconds from clip start. Beats refer to the outline's section 2.
// ---------------------------------------------------------------------------

const tabs = (start, count, gap = 0.8, expect = []) =>
  Array.from({ length: count }, (_, i) => ({ t: +(start + i * gap).toFixed(2), key: "Tab", expect: expect[i] }));

async function tabTimes(page, n) {
  for (let i = 0; i < n; i += 1) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(120);
  }
}

async function contactPrep(page) {
  // Frame the form: labels, three fields and Send message, with the sticky header clear.
  await page.evaluate(() => {
    const submit = document.getElementById("contact-submit").getBoundingClientRect();
    const y = Math.round(submit.bottom + scrollY - innerHeight + 64);
    window.scrollTo({ top: y, left: 0, behavior: "instant" });
  });
  await page.evaluate(startFocusBefore, "#name");
}

const CLIPS = [
  {
    id: "C1",
    url: HOME, viewport: DESKTOP, settleMs: HOME_SETTLE_MS, duration: 5.6,
    beats: "5 (also 2: the first second is the settled hero with no focus)",
    shows: "K&A home. Tab 1 slides in the Skip to content link top-left (rust pill and outline), hold, Enter moves focus to main, next Tab lands on the hero Start a project.",
    steps: [
      { t: 1.0, key: "Tab", expect: "Skip to content" },
      { t: 2.9, key: "Enter", expect: "main#main-content" },
      { t: 3.9, key: "Tab", expect: "Start a project" },
    ],
    stills: [
      { t: 0.5, name: "C1-home-hero-settled" },
      { t: 2.7, name: "C1-skip-link" },
      { t: 5.4, name: "C1-hero-start-a-project" },
    ],
  },
  {
    id: "C2",
    url: HOME, viewport: DESKTOP, settleMs: HOME_SETTLE_MS, duration: 11.0,
    beats: "1 (the hook cut to the rust outline moving), 3 (slow Tab through the nav), 4 (Shift+Tab moves back), 6 (visible focus), 7 (order: logo, menu, phone, Start a project)",
    shows: "K&A home. Nine Tabs at 0.8 s: skip link, logo, Home, Services, Mentorship, Training, Artists, phone, Start a project. Then Shift+Tab twice back to Artists.",
    steps: [
      ...tabs(1.0, 9, 0.8, ["Skip to content", "K & A Performance home", "Home", "Services", "Mentorship", "Training", "Artists", "904-210-1071", "Start a project"]),
      { t: 8.6, key: "Shift+Tab", expect: "904-210-1071" },
      { t: 9.4, key: "Shift+Tab", expect: "Artists" },
    ],
    stills: [
      { t: 2.5, name: "C2-logo" },
      { t: 4.1, name: "C2-nav-services" },
      { t: 7.3, name: "C2-phone" },
      { t: 8.4, name: "C2-header-start-a-project" },
    ],
  },
  {
    id: "C3",
    url: HOME, viewport: DESKTOP, settleMs: HOME_SETTLE_MS, duration: 7.4,
    beats: "6 (focus ring close-ups for zooms)",
    shows: "K&A home, starting with focus already on the header Start a project. Five slower Tabs: hero Start a project, What we do, then the inline links custom websites, useful AI integrations, training people can use.",
    prep: (page) => tabTimes(page, 9),
    steps: tabs(1.0, 5, 1.2, ["Start a project", "What we do", "custom websites", "useful AI integrations", "training people can use"]),
    stills: [
      { t: 2.0, name: "C3-hero-start-a-project" },
      { t: 3.2, name: "C3-what-we-do" },
      { t: 4.4, name: "C3-custom-websites" },
      { t: 5.6, name: "C3-ai-integrations" },
      { t: 7.2, name: "C3-training-link" },
    ],
  },
  {
    id: "C4",
    url: HOME, viewport: TABLET, settleMs: HOME_SETTLE_MS, duration: 10.4,
    beats: "8 (menus: opens with Enter, Escape closes, focus returns)",
    shows: "K&A home at 960x540 (the menu hides behind a button). Tabs to Open menu, Enter opens the overlay (the same button now reads Close menu), three Tabs through Home, Services, Mentorship, Escape closes and focus is back on the menu button.",
    steps: [
      ...tabs(1.0, 4, 0.8, ["Skip to content", "K & A Performance home", "Call 904-210-1071", "Open menu"]),
      { t: 4.6, key: "Enter", expect: "Close menu" },
      ...tabs(6.0, 3, 0.8, ["Home", "Services", "Mentorship"]),
      { t: 8.8, key: "Escape", expect: "Open menu" },
    ],
    stills: [
      { t: 4.4, name: "C4-menu-button-focus" },
      { t: 5.8, name: "C4-menu-open" },
      { t: 6.6, name: "C4-menu-home-focus" },
      { t: 10.2, name: "C4-menu-closed-focus-returned" },
    ],
  },
  {
    id: "C5",
    url: HOME, viewport: DESKTOP, settleMs: HOME_SETTLE_MS, duration: 6.0,
    beats: "8 (the chat bubble works the same way)",
    shows: "K&A home. Shift+Tab from a fresh load focuses the Chat with Kai bubble, Enter opens the panel with focus in the Ask about our services input, Escape closes it and focus is back on the bubble. Nothing is typed or sent.",
    steps: [
      { t: 1.0, key: "Shift+Tab", expect: "Chat with Kai" },
      { t: 2.4, key: "Enter", expect: "input#sg-input" },
      { t: 4.4, key: "Escape", expect: "Chat with Kai" },
    ],
    stills: [
      { t: 2.2, name: "C5-kai-bubble-focus" },
      { t: 4.2, name: "C5-kai-open" },
      { t: 5.8, name: "C5-kai-closed-focus-returned" },
    ],
  },
  {
    id: "C6",
    url: CONTACT, viewport: DESKTOP, settleMs: 2500, duration: 6.2,
    beats: "10 (labeled forms)",
    shows: "K&A /contact/, framed on the form. Visible labels NAME, EMAIL, MESSAGE. Tab to Name, Email, Message, then Send message. Nothing is typed and the form is not submitted.",
    prep: contactPrep,
    steps: tabs(1.0, 4, 1.07, ["input#name", "input#email", "textarea#message", "Send message"]),
    stills: [
      { t: 0.5, name: "C6-contact-labels" },
      { t: 2.0, name: "C6-name-focus" },
      { t: 6.0, name: "C6-send-message-focus" },
    ],
  },
  {
    id: "C7",
    url: AUDIT, viewport: DESKTOP, settleMs: 2500, duration: 8.5,
    beats: "12 (the CTA: /services/accessibility/)",
    shows: "K&A /services/accessibility/. Hold on the hero (H1 Website accessibility audit, measured not guessed), then a slow eased scroll down to What the audit covers.",
    prep: async (page) =>
      page.evaluate(() => {
        const h2 = [...document.querySelectorAll("h2")].find((h) => /what the audit covers/i.test(h.innerText));
        const top = h2 ? h2.getBoundingClientRect().top + scrollY : 700;
        const max = document.documentElement.scrollHeight - innerHeight;
        return { scrollTo: Math.round(Math.min(max, Math.max(0, top - 120))) };
      }),
    steps: (vars) => [{ t: 1.0, scroll: { from: 0, to: vars.scrollTo, dur: 6.0 } }],
    stills: [
      { t: 0.5, name: "C7-audit-hero" },
      { t: 8.3, name: "C7-what-the-audit-covers" },
    ],
  },
  {
    id: "D1",
    url: DEMO, viewport: DESKTOP, settleMs: 800, duration: 6.5,
    beats: "1 (hook: Tab pressed, nothing visible) and 6 (invisible focus)",
    shows: "Demo page. Six Tabs and nothing visible happens: focus really moves (Home, Services, Privacy, Terms, Sample Business, About) but *:focus{outline:none} hides it.",
    steps: tabs(1.0, 6, 0.8, ["Home", "Services", "Privacy", "Terms", "Sample Business", "About"]),
    stills: [
      { t: 0.5, name: "D1-demo-page" },
      { t: 4.0, name: "D1-invisible-focus" },
    ],
  },
  {
    id: "D2",
    url: DEMO_REVEAL, viewport: DESKTOP, settleMs: 800, duration: 6.5,
    beats: "7 (order jumps header, footer, header)",
    shows: "Demo page with ?reveal=1 (a plain dark outline and the label line says it was added). Tab order: Home, Services in the header, down to Privacy, Terms in the footer, back up to Sample Business, About.",
    steps: tabs(1.0, 6, 0.8, ["Home", "Services", "Privacy", "Terms", "Sample Business", "About"]),
    stills: [
      { t: 2.5, name: "D2-header" },
      { t: 4.1, name: "D2-footer" },
      { t: 5.7, name: "D2-back-to-header" },
    ],
  },
  {
    id: "D3",
    url: DEMO_REVEAL, viewport: DESKTOP, settleMs: 800, duration: 7.5,
    beats: "9 (no traps)",
    shows: "Demo page with ?reveal=1. Tab into the signup box email field, then Tab, Tab, Shift+Tab, Shift+Tab, Escape, Escape: focus never leaves the field.",
    prep: (page) => page.evaluate(startFocusBefore, "#signup-email"),
    steps: [
      { t: 1.0, key: "Tab", expect: "input#signup-email" },
      { t: 2.0, key: "Tab", expect: "input#signup-email" },
      { t: 2.8, key: "Tab", expect: "input#signup-email" },
      { t: 3.6, key: "Shift+Tab", expect: "input#signup-email" },
      { t: 4.4, key: "Shift+Tab", expect: "input#signup-email" },
      { t: 5.2, key: "Escape", expect: "input#signup-email" },
      { t: 6.0, key: "Escape", expect: "input#signup-email" },
    ],
    stills: [{ t: 6.8, name: "D3-trap" }],
  },
  {
    id: "D3-plain",
    url: DEMO, viewport: DESKTOP, settleMs: 800, duration: 7.5,
    beats: "9 (alternate: the same trap with the page's own invisible focus)",
    shows: "Same key presses as D3 without the reveal outline. Nothing visible changes; use only with an editor-drawn focus box from keys.json.",
    prep: (page) => page.evaluate(startFocusBefore, "#signup-email"),
    steps: [
      { t: 1.0, key: "Tab", expect: "input#signup-email" },
      { t: 2.0, key: "Tab", expect: "input#signup-email" },
      { t: 2.8, key: "Tab", expect: "input#signup-email" },
      { t: 3.6, key: "Shift+Tab", expect: "input#signup-email" },
      { t: 4.4, key: "Shift+Tab", expect: "input#signup-email" },
      { t: 5.2, key: "Escape", expect: "input#signup-email" },
      { t: 6.0, key: "Escape", expect: "input#signup-email" },
    ],
    stills: [],
  },
  {
    id: "D4",
    url: DEMO, viewport: DESKTOP, settleMs: 800, duration: 9.0,
    beats: "10 (contrast: a placeholder is not a label)",
    shows: "Demo page quote form with placeholder-only fields (Name, Phone, What do you need?). Tab in and type into each; every gray hint disappears and nothing says which box is which.",
    prep: (page) => page.evaluate(startFocusBefore, "#q-name"),
    steps: [
      { t: 1.0, key: "Tab", expect: "input#q-name" },
      { t: 1.4, type: "Jordan Lee" },
      { t: 2.9, key: "Tab", expect: "input#q-phone" },
      { t: 3.3, type: "555-555-0142" },
      { t: 4.9, key: "Tab", expect: "textarea#q-need" },
      { t: 5.3, type: "Fix a leaky faucet" },
    ],
    stills: [
      { t: 0.5, name: "D4-placeholder-hints" },
      { t: 8.8, name: "D4-filled-no-labels" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Recorder
// ---------------------------------------------------------------------------

function matchesExpect(info, expect) {
  if (!expect) return true;
  if (expect.includes("#")) {
    const [tag, id] = expect.split("#");
    return info.tag === tag && info.id === id;
  }
  return info.label === expect;
}

function buildSchedule(steps) {
  const at = new Map();
  const add = (frame, ev) => {
    if (!at.has(frame)) at.set(frame, []);
    at.get(frame).push(ev);
  };
  for (const s of steps) {
    const f0 = Math.round(s.t * FPS);
    if (s.key) add(f0, { kind: "key", key: s.key, expect: s.expect });
    if (s.type) {
      [...s.type].forEach((ch, i) => add(f0 + i * TYPE_FRAMES_PER_CHAR, { kind: "char", ch, text: s.type, first: i === 0, last: i === s.type.length - 1 }));
    }
    if (s.scroll) {
      const n = Math.round(s.scroll.dur * FPS);
      for (let i = 0; i <= n; i += 1) {
        const p = i / n;
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        add(f0 + i, { kind: "scroll", y: Math.round(s.scroll.from + (s.scroll.to - s.scroll.from) * e), spec: s.scroll, first: i === 0 });
      }
    }
  }
  return at;
}

async function recordClip(browser, clip) {
  const started = Date.now();
  const ctx = await newContext(browser, clip.viewport);
  const page = await openPage(ctx, clip.url, clip.settleMs);
  const vars = (clip.prep ? await clip.prep(page) : null) || {};
  await page.waitForTimeout(900); // let anything the prep started finish in real time
  const steps = typeof clip.steps === "function" ? clip.steps(vars) : clip.steps;
  const schedule = buildSchedule(steps);
  const stillAt = new Map(clip.stills.map((s) => [Math.round(s.t * FPS), s.name]));
  const total = Math.round(clip.duration * FPS);
  const file = `${clip.id}.mp4`;
  const enc = startEncoder(path.join(OUT, file));

  const keys = [];
  const typing = [];
  const warnings = [];
  let scroll = null;
  let pendingKey = null;
  let typingEntry = null;

  for (let f = 0; f < total; f += 1) {
    const tMs = Math.round(f * FRAME_MS);
    const events = schedule.get(f) || [];
    if (pendingKey && events.some((e) => e.kind === "key" || e.kind === "char")) {
      pendingKey.focus = await page.evaluate(focusInfo);
      pendingKey = null;
    }
    for (const ev of events) {
      if (ev.kind === "key") {
        await safePress(page, ev.key);
        const atPress = await page.evaluate(focusInfo);
        const entry = { key: ev.key, tMs, frame: f, focusAtPress: atPress, focus: null };
        if (!matchesExpect(atPress, ev.expect)) {
          const msg = `${clip.id} ${ev.key} at ${tMs} ms: expected ${ev.expect}, focus is on ${atPress.tag}#${atPress.id} "${atPress.label}"`;
          warnings.push(msg);
          console.warn(`  WARN ${msg}`);
        }
        keys.push(entry);
        pendingKey = entry;
      } else if (ev.kind === "char") {
        await safeType(page, ev.ch);
        if (ev.first) typingEntry = { text: ev.text, startMs: tMs, startFrame: f, field: await page.evaluate(focusInfo) };
        if (ev.last && typingEntry) {
          typingEntry.endMs = tMs;
          typingEntry.endFrame = f;
          typing.push(typingEntry);
          typingEntry = null;
        }
      } else if (ev.kind === "scroll") {
        await page.evaluate((y) => window.scrollTo({ top: y, left: 0, behavior: "instant" }), ev.y);
        if (ev.first) scroll = { fromY: ev.spec.from, toY: ev.spec.to, startMs: tMs, endMs: tMs + Math.round(ev.spec.dur * 1000), easing: "easeInOutCubic" };
      }
    }
    await page.evaluate(advanceVirtualClock, FRAME_MS);
    const png = await page.screenshot({ type: "png" });
    await enc.write(png);
    if (stillAt.has(f)) fs.writeFileSync(path.join(STILLS, `${stillAt.get(f)}.png`), png);
  }
  if (pendingKey) pendingKey.focus = await page.evaluate(focusInfo);
  await enc.end();
  await ctx.close();

  const log = {
    clip: clip.id,
    file,
    url: clip.url.startsWith("file:") ? `demo/index.html${clip.url.includes("?") ? clip.url.slice(clip.url.indexOf("?")) : ""}` : clip.url,
    viewport: { ...clip.viewport, deviceScaleFactor: DSF },
    video: { width: clip.viewport.width * DSF, height: clip.viewport.height * DSF, fps: FPS, frames: total, durationMs: Math.round(total * FRAME_MS) },
    coordinates: `CSS px relative to the viewport (${clip.viewport.width}x${clip.viewport.height}). Multiply by ${DSF} for video pixels.`,
    fields: {
      tMs: "ms from clip start; the key lands on this frame",
      focusAtPress: "focused element measured right after the press (transitions not yet run)",
      focus: "focused element once settled, measured just before the next key or at clip end; use this for overlays and zooms",
      ringBox: "box plus outline width and offset: the visible focus ring. null when the page draws no outline",
    },
    keys,
    typing,
    scroll,
    stills: clip.stills.map((s) => ({ file: `stills/${s.name}.png`, tMs: Math.round(Math.round(s.t * FPS) * FRAME_MS), frame: Math.round(s.t * FPS) })),
    warnings,
    capturedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(OUT, `${clip.id}.keys.json`), JSON.stringify(log, null, 2) + "\n");
  console.log(`  ${clip.id}: ${total} frames, ${(total / FPS).toFixed(2)} s, ${((Date.now() - started) / 1000).toFixed(0)} s wall, ${warnings.length} warnings`);
  return { id: clip.id, file, keysFile: `${clip.id}.keys.json`, durationSec: +(total / FPS).toFixed(3), frames: total, width: log.video.width, height: log.video.height, url: log.url, beats: clip.beats, shows: clip.shows, stills: log.stills.map((s) => s.file), warnings };
}

// ---------------------------------------------------------------------------
// High-resolution stills (deviceScaleFactor 4) for tight zooms
// ---------------------------------------------------------------------------

const T = (n) => Array(n).fill("Tab");
const STILLS_4X = [
  { name: "home-skip-link", url: HOME, vp: DESKTOP, settle: HOME_SETTLE_MS, keys: T(1) },
  { name: "home-nav-services", url: HOME, vp: DESKTOP, settle: HOME_SETTLE_MS, keys: T(4) },
  { name: "home-header-start-a-project", url: HOME, vp: DESKTOP, settle: HOME_SETTLE_MS, keys: T(9) },
  { name: "home-hero-custom-websites", url: HOME, vp: DESKTOP, settle: HOME_SETTLE_MS, keys: T(12) },
  { name: "home-kai-open", url: HOME, vp: DESKTOP, settle: HOME_SETTLE_MS, keys: ["Shift+Tab", "Enter"] },
  { name: "contact-name-label", url: CONTACT, vp: DESKTOP, settle: 2500, prep: contactPrep, keys: T(1) },
  { name: "contact-send-message", url: CONTACT, vp: DESKTOP, settle: 2500, prep: contactPrep, keys: T(4) },
  { name: "menu-open", url: HOME, vp: TABLET, settle: HOME_SETTLE_MS, keys: [...T(4), "Enter"] },
  { name: "menu-home-focus", url: HOME, vp: TABLET, settle: HOME_SETTLE_MS, keys: [...T(4), "Enter", "Tab"] },
  { name: "demo-invisible-focus", url: DEMO, vp: DESKTOP, settle: 800, keys: T(3) },
  { name: "demo-order-footer", url: DEMO_REVEAL, vp: DESKTOP, settle: 800, keys: T(3) },
  { name: "demo-trap", url: DEMO_REVEAL, vp: DESKTOP, settle: 800, prep: (p) => p.evaluate(startFocusBefore, "#signup-email"), keys: ["Tab", "Tab", "Shift+Tab", "Escape"] },
  {
    name: "demo-placeholder-filled", url: DEMO, vp: DESKTOP, settle: 800,
    prep: (p) => p.evaluate(startFocusBefore, "#q-name"),
    keys: ["Tab", { type: "Jordan Lee" }, "Tab", { type: "555-555-0142" }, "Tab", { type: "Fix a leaky faucet" }],
  },
];

async function captureStills4x(browser) {
  const out = [];
  for (const s of STILLS_4X) {
    const ctx = await newContext(browser, s.vp, 4);
    const page = await openPage(ctx, s.url, s.settle);
    if (s.prep) await s.prep(page);
    await page.waitForTimeout(400);
    for (const k of s.keys) {
      if (typeof k === "string") await safePress(page, k);
      else await safeType(page, k.type);
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(1000);
    const focus = await page.evaluate(focusInfo);
    const file = `stills/${s.name}@4x.png`;
    await page.screenshot({ path: path.join(OUT, file), type: "png" });
    await ctx.close();
    console.log(`  ${file} (${s.vp.width * 4}x${s.vp.height * 4}) focus: ${focus.tag}#${focus.id || ""} "${focus.label}"`);
    out.push({ file, width: s.vp.width * 4, height: s.vp.height * 4, focus });
  }
  return out;
}

// ---------------------------------------------------------------------------
// S1: the redrawn Safari settings still
// ---------------------------------------------------------------------------

async function renderSafari(browser) {
  const ctx = await newContext(browser, DESKTOP, 2);
  const page = await ctx.newPage();
  await page.goto(SAFARI, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, "safari-advanced.png"), type: "png" });
  const boxes = await page.evaluate(() => {
    const b = (el) => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return {
      window: b(document.getElementById("window")),
      accessibilityRow: b(document.getElementById("row-accessibility")),
      targetSetting: b(document.getElementById("target")),
      checkbox: b(document.querySelector("#target .box")),
      font: getComputedStyle(document.body).fontFamily,
      interLoaded: document.fonts.check("14px Inter"),
    };
  });
  await page.goto(`${SAFARI}?cutout=1`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const pad = 64;
  const w = boxes.window;
  const clip = { x: w.x - pad, y: w.y - pad, width: w.w + pad * 2, height: w.h + pad * 2 };
  await page.screenshot({ path: path.join(OUT, "safari-advanced-window.png"), type: "png", omitBackground: true, clip });
  await ctx.close();
  const meta = {
    files: {
      "safari-advanced.png": "2880x1620, the pane centered on a neutral gray 1440x810 frame at 2x",
      "safari-advanced-window.png": `${clip.width * 2}x${clip.height * 2}, transparent background, window plus shadow room (${pad} CSS px each side)`,
    },
    coordinates: "CSS px in the 1440x810 frame (safari-advanced.png). Multiply by 2 for image pixels.",
    boxes,
    source: "scripts/youtube/l1/demo/safari-advanced.html",
  };
  fs.writeFileSync(path.join(OUT, "safari-advanced.json"), JSON.stringify(meta, null, 2) + "\n");
  console.log(`  safari-advanced.png and safari-advanced-window.png (Inter loaded: ${boxes.interLoaded})`);
  return meta;
}

// ---------------------------------------------------------------------------
// Live-site verification (section 4 facts), run before recording
// ---------------------------------------------------------------------------

async function verifyLiveSite(browser) {
  const checks = [];
  const check = (name, expected, actual, pass) => {
    checks.push({ name, expected, actual, pass: Boolean(pass) });
    console.log(`  ${pass ? "ok  " : "FAIL"} ${name}`);
    if (!pass) console.log(`       expected: ${JSON.stringify(expected)}\n       actual:   ${JSON.stringify(actual)}`);
  };
  const press = async (page, key, wait = 450) => {
    await safePress(page, key);
    await page.waitForTimeout(wait);
    return page.evaluate(focusInfo);
  };

  // Home at 1440: skip link, Enter, order, outline color.
  let ctx = await newContext(browser, DESKTOP);
  let page = await openPage(ctx, HOME, HOME_SETTLE_MS);
  let f = await press(page, "Tab", 700);
  check("Tab 1 on load is the Skip to content link, top-left, rust outline", { label: "Skip to content", outline: RUST, topLeft: true }, f,
    f.label === "Skip to content" && f.outline.includes(RUST) && f.box.x < 60 && f.box.y >= 0 && f.box.y < 60);
  const skipHref = await page.evaluate(() => document.activeElement.getAttribute("href"));
  check("Skip link targets #main-content", "#main-content", skipHref, skipHref === "#main-content");
  f = await press(page, "Enter", 600);
  check("Enter on the skip link moves focus to main#main-content", "main#main-content", `${f.tag}#${f.id}`, f.tag === "main" && f.id === "main-content");
  f = await press(page, "Tab");
  check("Next Tab after the skip is the hero Start a project", "Start a project (hero)", f, f.label === "Start a project" && f.box.y > 300);

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(HOME_SETTLE_MS);
  const expectedOrder = ["Skip to content", "K & A Performance home", "Home", "Services", "Mentorship", "Training", "Artists", "904-210-1071", "Start a project", "Start a project", "What we do", "custom websites"];
  const order = [];
  const outlines = new Set();
  let allVisible = true;
  for (let i = 0; i < expectedOrder.length; i += 1) {
    f = await press(page, "Tab", 300);
    order.push(f.label);
    outlines.add(f.outline);
    if (!f.focusVisible || f.outline === "none") allVisible = false;
  }
  check("Home tab order: skip, logo, nav, phone, Start a project, hero buttons, inline links", expectedOrder, order, JSON.stringify(order) === JSON.stringify(expectedOrder));
  check("Every one of those stops shows a :focus-visible rust outline", `2px solid ${RUST}`, [...outlines], allVisible && [...outlines].every((o) => o.includes(RUST)));

  // Kai bubble.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(HOME_SETTLE_MS);
  f = await press(page, "Shift+Tab");
  check("Shift+Tab from a fresh load focuses the Chat with Kai bubble", "button#sg-open", f, f.id === "sg-open" && f.label === "Chat with Kai");
  f = await press(page, "Enter", 800);
  check("Enter opens Kai with focus in the input", "input#sg-input", f, f.id === "sg-input");
  f = await press(page, "Tab");
  check("Tab from the Kai input goes to Send (not trapped)", "button#sg-send", f, f.id === "sg-send");
  await press(page, "Shift+Tab");
  f = await press(page, "Escape", 800);
  check("Escape closes Kai and focus returns to the bubble", "button#sg-open", f, f.id === "sg-open");
  await ctx.close();

  // Contact form.
  ctx = await newContext(browser, DESKTOP);
  page = await openPage(ctx, CONTACT, 2500);
  const fields = await page.evaluate(() =>
    ["name", "email", "message"].map((id) => {
      const el = document.getElementById(id);
      const label = el && el.labels && el.labels[0];
      return { id, label: label ? label.innerText.trim() : null, labelVisible: Boolean(label && label.offsetHeight > 0) };
    }),
  );
  check("Contact fields have visible labels NAME, EMAIL, MESSAGE", ["NAME", "EMAIL", "MESSAGE"], fields,
    fields.every((x, i) => x.labelVisible && x.label && x.label.toUpperCase() === ["NAME", "EMAIL", "MESSAGE"][i]));
  const honeypot = await page.evaluate(() => {
    const b = document.querySelector("[name=botcheck]");
    return b ? { tabIndex: b.tabIndex, display: getComputedStyle(b).display } : null;
  });
  check("Honeypot botcheck is out of the tab order", { tabIndex: -1 }, honeypot, !honeypot || honeypot.tabIndex === -1);
  await contactPrep(page);
  const contactOrder = [];
  for (let i = 0; i < 4; i += 1) {
    f = await press(page, "Tab", 300);
    contactOrder.push(`${f.tag}#${f.id}`);
    outlines.add(f.outline);
  }
  check("Contact tab order: name, email, message, Send message (rust outline)", ["input#name", "input#email", "textarea#message", "button#contact-submit"], contactOrder,
    JSON.stringify(contactOrder) === JSON.stringify(["input#name", "input#email", "textarea#message", "button#contact-submit"]) && f.outline.includes(RUST));
  await ctx.close();

  // Mobile menu at 960.
  ctx = await newContext(browser, TABLET);
  page = await openPage(ctx, HOME, HOME_SETTLE_MS);
  for (let i = 0; i < 4; i += 1) f = await press(page, "Tab", 300);
  check("At 960 the fourth Tab reaches the Open menu button (aria-expanded false)", "button#nav-toggle Open menu", f, f.id === "nav-toggle" && f.label === "Open menu" && f.expanded === "false");
  f = await press(page, "Enter", 800);
  check("Enter opens the menu (aria-expanded true, button reads Close menu)", "Close menu, expanded true", f, f.expanded === "true" && f.label === "Close menu");
  f = await press(page, "Tab");
  check("Next Tab goes into the overlay (Home)", "Home", f, f.label === "Home");
  f = await press(page, "Escape", 800);
  check("Escape closes the menu and focus returns to the toggle", "button#nav-toggle Open menu, expanded false", f, f.id === "nav-toggle" && f.expanded === "false");
  await ctx.close();

  // CTA pages.
  ctx = await newContext(browser, DESKTOP);
  page = await ctx.newPage();
  const res = await page.goto(AUDIT, { waitUntil: "domcontentloaded" });
  const h1 = await page.evaluate(() => document.querySelector("h1")?.innerText.trim().replace(/\s+/g, " "));
  check("/services/accessibility/ returns 200 with the audit H1", "200, Website accessibility audit, measured not guessed", { status: res.status(), h1 }, res.status() === 200 && /accessibility audit/i.test(h1 || ""));
  const res2 = await page.request.get(`${SITE}/accessibility/`);
  check("/accessibility/ returns 200", 200, res2.status(), res2.status() === 200);
  await ctx.close();

  const result = { checkedAt: new Date().toISOString(), site: SITE, allPass: checks.every((c) => c.pass), outlinesSeen: [...outlines], checks };
  fs.writeFileSync(path.join(OUT, "preflight.json"), JSON.stringify(result, null, 2) + "\n");
  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const out = { only: null, verifyOnly: false, skipVerify: false, force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--only") out.only = new Set(argv[++i].split(",").map((s) => s.trim()));
    else if (a === "--verify-only") out.verifyOnly = true;
    else if (a === "--skip-verify") out.skipVerify = true;
    else if (a === "--force") out.force = true;
    else throw new Error(`Unknown flag ${a}`);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(STILLS, { recursive: true });
  const browser = await chromium.launch({ channel: "chromium" }); // new headless: DSF 2 PNGs in about 130 ms
  try {
    if (!args.skipVerify) {
      console.log("Verifying the live site against the outline's section 4");
      const v = await verifyLiveSite(browser);
      if (!v.allPass && !args.force) {
        console.error("A live-site check failed; see preflight.json. Nothing recorded. Use --force to record anyway.");
        process.exitCode = 1;
        return;
      }
    }
    if (args.verifyOnly) return;

    const want = (id) => !args.only || args.only.has(id);
    const manifestPath = path.join(OUT, "manifest.json");
    const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { clips: [] };
    for (const clip of CLIPS) {
      if (!want(clip.id)) continue;
      console.log(`Recording ${clip.id}`);
      const entry = await recordClip(browser, clip);
      manifest.clips = [...manifest.clips.filter((c) => c.id !== clip.id), entry].sort(
        (a, b) => CLIPS.findIndex((c) => c.id === a.id) - CLIPS.findIndex((c) => c.id === b.id),
      );
    }
    if (want("STILLS")) {
      console.log("High-resolution stills at deviceScaleFactor 4");
      manifest.stills4x = await captureStills4x(browser);
    }
    if (want("S1")) {
      console.log("S1: Safari Advanced mock-up");
      manifest.s1 = await renderSafari(browser);
    }
    manifest.method = "Frame-stepped DSF 2 PNG screenshots at 30 fps with a virtual clock for CSS animations, encoded H.264 CRF 12 yuv420p BT.709. See the header of scripts/youtube/l1/capture.mjs.";
    manifest.updatedAt = new Date().toISOString();
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
