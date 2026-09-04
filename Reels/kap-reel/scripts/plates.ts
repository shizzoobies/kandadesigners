/**
 * scripts/plates.ts
 *
 * Context plate generation for the K&A Performance reels.
 * See kap-reel-handoff.md Section 4b and 9b.
 *
 * Run:
 *   npx tsx scripts/plates.ts smoke [--model <id>]
 *   npx tsx scripts/plates.ts generate --plate <id> --count N [--model <id>]
 *                                      [--set showcase|training]
 *                                      [--ref <path>] [--ref-gen <generationId>]
 *                                      [--resolution 1K|2K] [--seed N]
 *   npx tsx scripts/plates.ts list [--set showcase|training]
 *
 * Plate sets. A set is one shoot: one room, one light, one cast. The showcase
 * set is the original seven plates for the projects reel. The training set is a
 * second seven for the training content reel, deliberately a different room and
 * a different day so the two reels never look like the same afternoon. The two
 * sets share the RULES block and the model, and nothing else. Everything the
 * set changes lives in PLATE_SETS, so adding a third shoot is one entry there
 * plus its framings. --set defaults to showcase, which is what every command
 * written before the training set did.
 *
 * API contract, confirmed against the live docs on 2026-09-03:
 *
 *   POST https://api.elevenlabs.io/v1/flows/image
 *     header: xi-api-key
 *     body:  { model_id, prompt, aspect_ratio?, resolution?, seed?, images?, webhook? }
 *     200:   { id, status }   status of a new generation is always "pending"
 *
 *   GET  https://api.elevenlabs.io/v1/flows/image/{generation_id}
 *     status: pending | generating | completed | failed
 *     completed: { id, status, content_url, content_mime_type }
 *       content_url is a signed download URL that expires about an hour later.
 *     failed:    { id, status, error_message, failure_reason }
 *       failure_reason: timeout | model_error | moderated | invalid_parameters
 *                       | dependency_failed | charging_failed | internal_error
 *
 *   GET  https://api.elevenlabs.io/v1/flows/image?page_size=&cursor=&status=&model_id=
 *     { generations: [...], next_cursor, has_more }
 *
 * No endpoint in the flows image API reports a credit cost. The docs only say
 * failed generations are not charged. Cost is therefore logged as
 * "not reported by API" plus a pricing page estimate.
 *
 * Reference images take one of three shapes inside `images`:
 *   { type: "asset",         asset_id }
 *   { type: "generation",    generation_id }
 *   { type: "inline_base64", content_base64, mime_type }
 *
 * The API key is read from .env and never printed, never written to
 * config/plates.json, never sent anywhere but api.elevenlabs.io.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const ENV_FILE = path.join(ROOT, ".env");
const PLATES_DIR = path.join(ROOT, "assets", "plates");
const PLATES_JSON = path.join(ROOT, "config", "plates.json");

const API_BASE = "https://api.elevenlabs.io";

// ---------------------------------------------------------------------------
// Model choice
// ---------------------------------------------------------------------------
//
// Primary: gemini-3-pro-image (Nano Banana Pro).
//   The first pick was bytedance-seedream-5-pro, because it was the only
//   photoreal model in the list offering 9:16, a seed AND reference images at
//   once. It is unusable here: POST returns 403 model_access_denied,
//   "ByteDance models are disabled by default and require explicit approval
//   before use." No credits were charged. Both seedream ids are therefore out
//   until the owner asks ElevenLabs support to enable them.
//
//   Of what is left:
//     - gpt-image-1, gpt-image-1.5 and gpt-image-2 only offer 3:2, 1:1 and
//       2:3. They cannot produce the 9:16 vertical framing at all, so the
//       whole GPT family is out regardless of how photoreal it is.
//     - gemini-3-pro-image does 9:16 at 1K, 2K or 4K and accepts reference
//       images, which is what carries one room and one light across the set.
//       It is the strongest remaining photoreal option.
//
//   Cost of the fallback: gemini-3-pro-image exposes no seed, so the set is
//   not bit-reproducible. Style consistency rests entirely on the reference
//   image instead. Recorded as seed null. This is the one Section 4b
//   instruction ("use a seed") that the available models cannot honour.
//
// Smoke:  gemini-3.1-flash-lite-image.
//   Cheapest model on the list, fixed 1K, supports 9:16. It exists only to
//   learn the response shape for one small charge.

const PRIMARY_MODEL = "gemini-3-pro-image";
const SMOKE_MODEL = "gemini-3.1-flash-lite-image";

// Used only by models that accept a seed. None of the models this workspace
// can reach currently do, so this is kept for the day seedream is enabled.
const BASE_SEED = 41127;

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

/**
 * Every prompt is framing + STYLE + RULES. The shared halves are what make the
 * seven plates read as one shoot rather than seven stock photos. The rules
 * half is Section 4b verbatim in prompt form and is not negotiable.
 *
 * STYLE is per set: it is the room, the light and the grade, which is exactly
 * what has to differ between one shoot and the next. RULES is shared, because
 * the screen-off, no-face, no-finger-on-the-panel constraints come from
 * Section 4b and apply to every plate this pipeline will ever produce.
 */
const STYLE =
  "Photograph. Soft natural window light from the left, late morning, warm and " +
  "diffused. A calm uncluttered interior: cream and warm grey walls, pale oak " +
  "surfaces, one small terracotta or rust colored object well out of focus. " +
  "Muted warm neutral color grade, cream, rust and espresso brown. Shallow " +
  "depth of field, wide aperture, the person soft and the device sharp.";

const RULES =
  "The device screen is completely off: a flat dark charcoal rectangle, evenly " +
  "dark, showing no image, no interface, no icons, no windows, no wallpaper and " +
  "no reflection of any content. No face is visible anywhere in the frame. " +
  "Hands are relaxed with fingers together, partly out of frame or partly " +
  "hidden behind the device, never spread flat against the screen. No finger " +
  "and no thumb crosses, touches or rests on the front face of the screen: " +
  "every finger grips the outer edge, the frame or the back of the device, and " +
  "the whole screen face stays unobstructed. Exactly five " +
  "fingers per hand, correct human anatomy. Device geometry straight and " +
  "undistorted. No text anywhere in the frame, no writing, no numbers, no " +
  "labels, no signage, no logos, no brand marks, no stickers. No overhead " +
  "fluorescent light. Real photography, shot on a full frame camera with a 50mm " +
  "lens. Not an illustration, not a 3D render, not a digital painting.";

/**
 * The training set's own room. A different building, a different day, a
 * different cast: overcast north light through a big window on the RIGHT
 * instead of warm sun from the left, pale grey and light oak instead of cream
 * and rust, one plant for the only colour. Set beside the showcase plates it
 * has to read as a second shoot, not a second angle on the first one.
 */
const TRAINING_STYLE =
  "Photograph. Flat cool overcast daylight through a large window on the " +
  "right, soft and directionless, an ordinary grey afternoon. A calm " +
  "uncluttered workspace: pale grey walls, light oak surfaces, the leaves of " +
  "one green plant well out of focus. Cool neutral color grade, pale grey, " +
  "light oak and muted green, no warm cast and no golden light. Shallow depth " +
  "of field, wide aperture, the person soft and the device sharp.";

/**
 * Extra rules for the training set only. The training reel sells course
 * content for construction teams, and a generated hard hat or a generated job
 * site would be a generated claim about a real place, which Section 9b
 * prohibits outright. The room in these plates is an ordinary office and
 * nothing in it may suggest otherwise.
 */
const TRAINING_EXTRA_RULES =
  "No hard hat, no safety vest, no high visibility clothing, no tools, no " +
  "machinery, no construction or industrial props and no vehicle anywhere in " +
  "the frame. The room is an ordinary quiet office or home workspace and must " +
  "not read as a specific business, venue, site office or job site. No " +
  "clutter: the surfaces are close to bare.";

export type PlateSetName = "showcase" | "training";

type PlateSpec = {
  id: string;
  framing: string;
  /** Which capture goes in the screen, for the gate stills. */
  captureId: string;
  usedFor: string;
  /** Which shoot this plate belongs to. Selects the STYLE and extra rules. */
  set: PlateSetName;
};

const PLATE_SETS: Record<PlateSetName, { style: string; extraRules: string }> = {
  showcase: { style: STYLE, extraRules: "" },
  training: { style: TRAINING_STYLE, extraRules: TRAINING_EXTRA_RULES },
};

const PLATE_SPECS: PlateSpec[] = [
  {
    id: "plate-laptop-shoulder",
    framing:
      "Vertical portrait photograph taken from directly behind a seated person, " +
      "over their right shoulder. Their head and shoulder are a dark soft " +
      "silhouette across the lower left, cropped so no face or profile is " +
      "visible. An open laptop sits on a pale oak desk ahead of them, tilted " +
      "slightly away, the closed dark screen filling the upper third of the " +
      "frame and squarely facing the camera. One hand rests loosely on the desk " +
      "beside the trackpad.",
    captureId: "fore-motion-golf-home-desktop",
    usedFor: "project 1",
    set: "showcase",
  },
  {
    id: "plate-phone-hands",
    framing:
      "Vertical portrait photograph of two hands holding a modern smartphone " +
      "upright, angled about ten degrees away from the camera, framed from the " +
      "forearms down so no body and no face appear. The dark blank screen faces " +
      "the camera and fills the middle of the frame. Both thumbs rest on the " +
      "phone's outer side rails below the screen, clear of the screen face. A " +
      "softly blurred warm room behind.",
    captureId: "project-makeover-home-mobile",
    usedFor: "project 2",
    set: "showcase",
  },
  {
    id: "plate-ipad-lap",
    framing:
      "Vertical portrait photograph of a tablet held at waist level by a person " +
      "cropped at the chest so no face appears, seen slightly off axis from " +
      "above. The tablet's dark blank screen faces up and toward the camera, " +
      "filling the center of the frame at a gentle angle. One hand supports the " +
      "tablet at the left edge of the frame, half out of frame. A pale oak table " +
      "and a soft window beyond.",
    captureId: "southern-legacy-contractors-home-desktop",
    usedFor: "project 3",
    set: "showcase",
  },
  {
    id: "plate-desktop-wide",
    framing:
      "Vertical portrait photograph of a wider quiet studio room, empty of " +
      "people, with a large widescreen monitor on a pale oak desk as the bright " +
      "anchor of the frame. The monitor is turned squarely toward the camera and " +
      "its dark blank screen sits in the upper middle of the frame. An empty " +
      "chair is turned away at the left edge. Warm window light rakes across the " +
      "desk.",
    captureId: "mbs-medicine-home-desktop",
    usedFor: "tour cut 1",
    set: "showcase",
  },
  {
    id: "plate-handoff",
    framing:
      "Vertical portrait photograph of two people at a pale oak table, both seen " +
      "from behind and cropped above the shoulder line so neither head nor face " +
      "is in frame. The person on the left is turning an open laptop toward the " +
      "person on the right, one hand on the laptop's edge. The laptop's dark " +
      "blank screen is turned toward the camera in the upper middle of the " +
      "frame. Warm window light, deep background blur.",
    captureId: "onlynails-dashboard-sitephotos-clean",
    usedFor: "tour cut 2",
    set: "showcase",
  },
  {
    id: "plate-phone-hands-b",
    framing:
      "Vertical portrait photograph of one hand holding a smartphone at a low " +
      "angle near a bright window, the arm entering from the lower right, framed " +
      "from the wrist down so no body and no face appear. The phone is tilted " +
      "about fifteen degrees, its dark blank screen facing the camera in the " +
      "upper right of the frame. A different room corner from earlier frames, " +
      "with a linen curtain softly blurred behind.",
    captureId: "ellenton-family-practice-home-mobile",
    usedFor: "tour cut 3",
    set: "showcase",
  },
  {
    id: "plate-tablet-b",
    framing:
      "Vertical portrait photograph of a tablet propped upright in a low stand " +
      "on a pale oak table, turned squarely toward the camera with its dark " +
      "blank screen in the middle of the frame. A single relaxed hand enters " +
      "from the right edge of the frame and rests on the table beside it, " +
      "fingers together. A coffee cup far out of focus in the foreground corner. " +
      "Warm window light from the left.",
    captureId: "pbj-strategic-accounting-home-desktop",
    usedFor: "tour cut 4",
    set: "showcase",
  },
];

/**
 * The training reel's seven. Same seven jobs as the showcase set does for the
 * projects reel, shot in the training room instead: window on the right, flat
 * overcast light, and a cast with different sleeves and different hair from
 * the first shoot so the two reels never look cast from the same afternoon.
 *
 * Two framings are new rather than restaged. t-laptop-two replaces the
 * showcase handoff with a pointing gesture, which is the harder ask because a
 * pointing finger wants to land on the panel, and the composite would paint
 * the site straight over it. t-laptop-cafe-free has no person at all, which
 * makes it the safest plate in the set and the one to fall back on.
 */
const TRAINING_PLATE_SPECS: PlateSpec[] = [
  {
    id: "t-laptop-shoulder",
    framing:
      "Vertical portrait photograph taken from directly behind a seated " +
      "person, over their left shoulder. Their head and shoulder are a soft " +
      "out of focus shape across the lower right, cropped so no face and no " +
      "profile is visible. They wear a light grey marl knit sleeve and have " +
      "short sandy blond hair. An open laptop sits on a light oak desk ahead " +
      "of them, tilted slightly away, its dark blank screen filling the upper " +
      "third of the frame and squarely facing the camera. One hand rests " +
      "loosely on the desk beside the trackpad.",
    captureId: "training-safety-hero-to-zones-desktop",
    usedFor: "safety beat 1",
    set: "training",
  },
  {
    id: "t-phone-hands",
    framing:
      "Vertical portrait photograph of two hands holding a modern smartphone " +
      "upright, angled about eight degrees away from the camera, framed from " +
      "the forearms down so no body and no face appear. The cuffs are a soft " +
      "sage green sweatshirt. The dark blank screen faces the camera and " +
      "fills the middle of the frame. Both thumbs rest on the phone's outer " +
      "side rails below the screen, well clear of the screen face. A cool " +
      "grey room softly blurred behind.",
    captureId: "training-safety-hierarchy-sorter-mobile",
    usedFor: "safety beat 2",
    set: "training",
  },
  {
    id: "t-tablet-desk",
    framing:
      "Vertical portrait photograph looking down at a shallow angle onto a " +
      "tablet lying nearly flat on a light oak desk, raised at a low angle on " +
      "a slim stand so its dark blank screen tilts up and toward the camera " +
      "and fills the middle of the frame at a gentle off axis angle. One hand " +
      "rests on the desk at the outer left edge of the tablet, fingers " +
      "together and flat on the desk beside the device, a navy shirt cuff at " +
      "the wrist. No other object on the desk.",
    captureId: "training-finance-pnl-simulator-desktop",
    usedFor: "tour: finance",
    set: "training",
  },
  {
    id: "t-desktop-wide",
    // Second framing. The first one put a person at the right edge and asked
    // for them to be cut off below the head, and the model read that as
    // permission to include the head: c02 came back with a lit profile at the
    // top right corner, which is the one thing this set can never ship. c01
    // failed differently, with a hand gripping the panel and a thumb on the
    // screen face. So the person is now reduced to a forearm entering from
    // outside the frame, and the hand is given somewhere to be that is not the
    // monitor.
    framing:
      "Vertical portrait photograph of a wider quiet office room with a large " +
      "widescreen monitor standing on its own stand on a light oak desk and " +
      "anchoring the frame, the monitor turned squarely toward the camera and " +
      "its dark blank screen sitting in the upper middle of the frame, the " +
      "stand clearly joined to the panel and resting on the desk. No person " +
      "is in the frame except one forearm in a charcoal grey sleeve that " +
      "enters from the right edge at desk height, ending in a relaxed hand " +
      "that rests flat on the desk well to the right of the monitor and never " +
      "touches the monitor. The rest of that person, all of their head, hair, " +
      "face, neck and shoulders, is entirely outside the frame and no part of " +
      "a head appears anywhere in the picture, including in the corners and " +
      "including any reflection. A tall green plant is softly out of focus at " +
      "the left.",
    captureId: "training-rfi-scenario-branch-desktop",
    usedFor: "tour: rfi",
    set: "training",
  },
  {
    id: "t-laptop-two",
    // Second framing. Both first candidates failed the same two ways: the
    // gesturing hand was raised into the air and its fingers crossed the lower
    // screen, and one candidate put a lit profile at the top left. Asking for
    // a hand "in the air just above the table" was the mistake, because the
    // model reads a raised open hand as the gesture and a raised hand in this
    // camera position lands in front of the panel. So the hand is now on the
    // table, and the crop is described by what is in the frame rather than by
    // where the cut falls.
    framing:
      "Vertical portrait photograph of two people sitting side by side at a " +
      "light oak table, both seen from behind. Only their shoulders, upper " +
      "backs and arms are in the picture, entering along the bottom left and " +
      "bottom right corners. No head, no hair, no ear, no neck, no profile " +
      "and no face of either person is anywhere in the frame, and neither is " +
      "reflected in the screen or the window. One wears a light grey " +
      "sweatshirt, the other a sage green shirt. An open laptop sits on the " +
      "table between them with its dark blank screen turned toward the camera " +
      "in the upper middle of the frame, the whole screen clear and " +
      "unobstructed. The person on the right rests a relaxed open hand palm " +
      "down on the table top in front of the laptop, angled toward it, the " +
      "whole hand flat on the table and lower in the frame than the laptop " +
      "keyboard. No finger is raised and no part of either hand appears in " +
      "front of the screen or overlaps its outline from the camera's point of " +
      "view. Deep background blur.",
    captureId: "training-safety-walkthrough-card-desktop",
    usedFor: "tour: safety card",
    set: "training",
  },
  {
    id: "t-laptop-cafe-free",
    framing:
      "Vertical portrait photograph of an open laptop alone on a plain light " +
      "oak table beside a large window, with no person and no hand anywhere " +
      "in the frame. The laptop is turned squarely toward the camera and its " +
      "dark blank screen fills the upper middle of the frame. A plain " +
      "unmarked stoneware mug sits at the near left edge of the table, softly " +
      "out of focus. A pale grey wall beyond.",
    captureId: "training-finance-waterfall-desktop",
    usedFor: "45s spare",
    set: "training",
  },
  {
    id: "t-phone-hands-b",
    framing:
      "Vertical portrait photograph of one hand holding a smartphone from " +
      "below at a low angle, the forearm entering from the lower left, framed " +
      "from the wrist down so no body and no face appear, a cream ribbed cuff " +
      "at the wrist. The phone is tilted about twelve degrees, its dark blank " +
      "screen facing the camera in the upper middle of the frame. The fingers " +
      "are behind the phone supporting it and the thumb is on the left side " +
      "rail. A different corner of the room, with the leaves of a green plant " +
      "softly blurred behind.",
    captureId: "training-rfi-hero-mobile",
    usedFor: "45s spare",
    set: "training",
  },
];

/** Every spec across every set, for lookups that do not care which shoot. */
export function allSpecs(): PlateSpec[] {
  return [...PLATE_SPECS, ...TRAINING_PLATE_SPECS];
}

export function specsForSet(set: PlateSetName): PlateSpec[] {
  return allSpecs().filter((s) => s.set === set);
}

/**
 * Appended when a reference image is attached. Without it Nano Banana Pro
 * treats a reference as content to reproduce and hands back a near copy of the
 * anchor plate. The set needs its room and its light, not its subject.
 *
 * The light adjective is per set. The showcase wording is left exactly as it
 * was sent, so the prompts already logged in config/plates.json stay
 * reproducible from this file; "warm window light" in a training prompt would
 * pull the training room back toward the shoot it is supposed to differ from.
 */
function referenceClauseFor(set: PlateSetName): string {
  const light = set === "training" ? "its cool overcast window light" : "its warm window light";
  return (
    `Use the attached image as a style reference only. Match its room, ${light}, ` +
    "its color grade, its depth of field and its lens character " +
    "exactly, as if shot minutes later in the same space on the same camera. Do " +
    "not copy its subject, its device or its composition. The framing described " +
    "above is what to shoot."
  );
}

export function promptFor(spec: PlateSpec, withReference = false): string {
  const { style, extraRules } = PLATE_SETS[spec.set];
  const base = `${spec.framing} ${style} ${RULES}${extraRules ? ` ${extraRules}` : ""}`;
  return withReference ? `${base} ${referenceClauseFor(spec.set)}` : base;
}

// ---------------------------------------------------------------------------
// plates.json
// ---------------------------------------------------------------------------

export type Quad = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
];

export type PlateRecord = {
  id: string;
  /** Which shoot. Absent on the seven showcase records written before sets. */
  set?: PlateSetName;
  file: string;
  model: string;
  prompt: string;
  seed: number | null;
  resolution: string;
  width: number;
  height: number;
  quad: Quad;
  glareOpacity: number;
  notes: string;
  captureId: string;
  usedFor: string;
};

export type GenerationRecord = {
  generationId: string;
  plateId: string;
  /** Which shoot. Absent on the showcase records written before sets. */
  set?: PlateSetName;
  candidate: number;
  model: string;
  prompt: string;
  seed: number | null;
  aspectRatio: string;
  resolution: string;
  referenceGenerationId: string | null;
  referenceFile: string | null;
  file: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  status: string;
  failureReason?: string;
  errorMessage?: string;
  creditCost: string;
  accepted: boolean | null;
  verdict: string;
};

export type PlatesFile = {
  _note: string;
  generatedWith: {
    primaryModel: string;
    smokeModel: string;
    aspectRatio: string;
    resolution: string;
    baseSeed: number;
  };
  plates: PlateRecord[];
  generations: GenerationRecord[];
};

const EMPTY_PLATES_FILE: PlatesFile = {
  _note:
    "Phase 4 context plates. quad is the screen corner order top-left, " +
    "top-right, bottom-right, bottom-left in plate pixels, already expanded " +
    "2px outward. Written by scripts/plates.ts and scripts/find-quad.ts.",
  generatedWith: {
    primaryModel: PRIMARY_MODEL,
    smokeModel: SMOKE_MODEL,
    aspectRatio: "9:16",
    resolution: "2K",
    baseSeed: BASE_SEED,
  },
  plates: [],
  generations: [],
};

export function readPlatesFile(): PlatesFile {
  if (!fs.existsSync(PLATES_JSON)) return structuredClone(EMPTY_PLATES_FILE);
  const parsed = JSON.parse(fs.readFileSync(PLATES_JSON, "utf8")) as PlatesFile;
  parsed.plates ??= [];
  parsed.generations ??= [];
  return parsed;
}

export function writePlatesFile(data: PlatesFile): void {
  fs.mkdirSync(path.dirname(PLATES_JSON), { recursive: true });
  fs.writeFileSync(PLATES_JSON, JSON.stringify(data, null, 2) + "\n", "utf8");
}

// ---------------------------------------------------------------------------
// API key
// ---------------------------------------------------------------------------

function loadApiKey(): string {
  // .env wins over the shell environment on purpose. This machine has a stale
  // ELEVENLABS_API_KEY exported into the shell that the API rejects with
  // 401 invalid_api_key, and the repo's .env is the key of record.
  if (fs.existsSync(ENV_FILE)) {
    for (const rawLine of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      if (line.slice(0, eq).trim() !== "ELEVENLABS_API_KEY") continue;
      const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (value) return value;
    }
  }
  const fromEnv = process.env.ELEVENLABS_API_KEY;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  throw new Error(
    `No ELEVENLABS_API_KEY in ${ENV_FILE} and none in the environment.`,
  );
}

/** Strips anything that looks like the key out of text before it is printed. */
function redact(text: string, key: string): string {
  if (!key) return text;
  return text.split(key).join("<redacted>");
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

type ImageRef =
  | { type: "asset"; asset_id: string }
  | { type: "generation"; generation_id: string }
  | { type: "inline_base64"; content_base64: string; mime_type: string };

type CreateBody = {
  model_id: string;
  prompt: string;
  aspect_ratio?: string;
  resolution?: string;
  seed?: number;
  images?: ImageRef[];
};

/**
 * fetch with a small retry. A bare "fetch failed" killed a generation run
 * mid-set once, which wastes the credits already spent on that batch.
 * Transport errors only: an HTTP error status is returned to the caller.
 */
async function fetchRetry(url: string, init: RequestInit, attempts = 4): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetch(url, init);
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        const wait = 1500 * (i + 1);
        console.log(`    network error, retrying in ${wait}ms (${i + 1}/${attempts - 1})`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastError;
}

async function apiPost(
  key: string,
  route: string,
  body: unknown,
): Promise<{ status: number; text: string; json: unknown }> {
  const res = await fetchRetry(`${API_BASE}${route}`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, text, json };
}

async function apiGet(
  key: string,
  route: string,
): Promise<{ status: number; text: string; json: unknown }> {
  const res = await fetchRetry(`${API_BASE}${route}`, {
    headers: { "xi-api-key": key },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, text, json };
}

/**
 * Credits actually spent, read back from the usage endpoint.
 *
 * The flows image API reports no cost on create, poll or list. But
 * GET /v1/usage/character-stats works on this restricted key (it does NOT
 * need user_read, unlike /v1/user and /v1/user/subscription) and
 * breakdown_type=product_type buckets spend under "Image Generation". Sampling
 * that total either side of a generation gives the exact credit cost.
 */
async function imageCreditsUsed(key: string): Promise<number | null> {
  const end = Date.now() + 3_600_000;
  const start = end - 72 * 3_600_000;
  const { status, json } = await apiGet(
    key,
    `/v1/usage/character-stats?start_unix=${start}&end_unix=${end}&breakdown_type=product_type`,
  );
  if (status !== 200 || !json) return null;
  const usage = (json as { usage?: Record<string, number[]> }).usage;
  if (!usage) return null;
  const series = usage["Image Generation"];
  if (!series) return 0;
  return series.reduce((a, b) => a + (Number(b) || 0), 0);
}

type GenerationState = {
  id: string;
  status: "pending" | "generating" | "completed" | "failed" | string;
  content_url?: string;
  content_mime_type?: string;
  error_message?: string;
  failure_reason?: string;
  [k: string]: unknown;
};

async function createGeneration(key: string, body: CreateBody): Promise<GenerationState> {
  const { status, text, json } = await apiPost(key, "/v1/flows/image", body);
  if (status !== 200 && status !== 201) {
    throw new Error(`POST /v1/flows/image returned ${status}: ${redact(text, key)}`);
  }
  return json as GenerationState;
}

async function pollGeneration(
  key: string,
  id: string,
  opts: { timeoutMs?: number; intervalMs?: number; quiet?: boolean } = {},
): Promise<GenerationState> {
  const timeoutMs = opts.timeoutMs ?? 6 * 60_000;
  const intervalMs = opts.intervalMs ?? 3_000;
  const deadline = Date.now() + timeoutMs;
  let last = "";

  for (;;) {
    const { status, text, json } = await apiGet(key, `/v1/flows/image/${id}`);
    if (status !== 200) {
      throw new Error(`GET /v1/flows/image/${id} returned ${status}: ${redact(text, key)}`);
    }
    const state = json as GenerationState;
    if (state.status !== last && !opts.quiet) {
      process.stdout.write(`    ${id} -> ${state.status}\n`);
      last = state.status;
    }
    if (state.status === "completed" || state.status === "failed") return state;
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for generation ${id}, last status ${state.status}.`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

function extForMime(mime: string | undefined): string {
  switch (mime) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/jpeg":
      return ".jpg";
    default:
      return ".png";
  }
}

async function downloadTo(url: string, dest: string): Promise<number> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status} for ${dest}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return buf.length;
}

/** Reads a PNG or JPEG header for pixel size without pulling in sharp. */
export function imageSize(file: string): { width: number; height: number } | null {
  const buf = fs.readFileSync(file);
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): Record<string, string | true> {
  const out: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const name = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out[name] = next;
      i += 1;
    } else {
      out[name] = true;
    }
  }
  return out;
}

/** --set, defaulting to the original shoot so old command lines still work. */
function parseSet(value: string | true | undefined): PlateSetName {
  if (value === undefined) return "showcase";
  if (value === "showcase" || value === "training") return value;
  throw new Error(`--set must be showcase or training, got "${String(value)}".`);
}

async function cmdSmoke(args: Record<string, string | true>): Promise<void> {
  const key = loadApiKey();
  const model = typeof args.model === "string" ? args.model : SMOKE_MODEL;

  console.log("SMOKE TEST");
  console.log(`  model: ${model}`);
  console.log("  This spends real credits. One 1K image at 9:16.\n");

  // Probe the usage endpoints first. The key has no user_read scope so these
  // are expected to 401, but the exact shape is worth recording once.
  for (const route of ["/v1/user/subscription", "/v1/usage/character-stats"]) {
    const { status, text } = await apiGet(key, route);
    console.log(`  probe GET ${route} -> ${status} ${redact(text, key).slice(0, 200)}`);
  }
  console.log("");

  const prompt =
    "Vertical portrait photograph of a smartphone lying face up on a pale oak " +
    "table beside a linen napkin. " +
    STYLE +
    " " +
    RULES;

  const body: CreateBody = {
    model_id: model,
    prompt,
    aspect_ratio: "9:16",
    resolution: "1K",
  };

  console.log("  POST /v1/flows/image body:");
  console.log(indent(JSON.stringify({ ...body, prompt: `${prompt.slice(0, 90)}...` }, null, 2), 4));

  const created = await createGeneration(key, body);
  console.log("\n  RAW create response:");
  console.log(indent(JSON.stringify(created, null, 2), 4));

  const final = await pollGeneration(key, created.id);
  const shown = { ...final } as Record<string, unknown>;
  if (typeof shown.content_url === "string") {
    shown.content_url = `${(shown.content_url as string).split("?")[0]}?<signature omitted>`;
  }
  console.log("\n  RAW final poll response (signed URL query trimmed):");
  console.log(indent(JSON.stringify(shown, null, 2), 4));
  console.log(`\n  Top level keys on the final response: ${Object.keys(final).join(", ")}`);
  console.log(
    `  Cost field present: ${
      Object.keys(final).some((k) => /cost|credit|price|usage|charge/i.test(k)) ? "YES" : "NO"
    }`,
  );

  const listed = await apiGet(key, "/v1/flows/image?page_size=1");
  console.log(`\n  GET /v1/flows/image?page_size=1 -> ${listed.status}`);
  console.log(indent(redact(listed.text, key).slice(0, 900), 4));

  if (final.status === "completed" && final.content_url) {
    const dest = path.join(PLATES_DIR, "smoke", `smoke-${final.id}${extForMime(final.content_mime_type)}`);
    const bytes = await downloadTo(final.content_url, dest);
    const size = imageSize(dest);
    console.log(
      `\n  Saved ${path.relative(ROOT, dest)} (${bytes} bytes${
        size ? `, ${size.width}x${size.height}` : ""
      })`,
    );
  } else {
    console.log(`\n  Generation did not complete: ${final.failure_reason ?? ""} ${final.error_message ?? ""}`);
  }
}

function indent(text: string, n: number): string {
  const pad = " ".repeat(n);
  return text
    .split("\n")
    .map((l) => pad + l)
    .join("\n");
}

async function cmdGenerate(args: Record<string, string | true>): Promise<void> {
  const setName = parseSet(args.set);
  const plateId = typeof args.plate === "string" ? args.plate : "";
  const pool = specsForSet(setName);
  const spec = pool.find((p) => p.id === plateId);
  if (!spec) {
    throw new Error(
      `--plate is required and must be one of the ${setName} set: ` +
        `${pool.map((p) => p.id).join(", ")}`,
    );
  }

  const key = loadApiKey();
  const count = Number(args.count ?? 2);
  if (!Number.isFinite(count) || count < 1) throw new Error("--count must be a positive integer.");
  const model = typeof args.model === "string" ? args.model : PRIMARY_MODEL;
  const resolution = typeof args.resolution === "string" ? args.resolution : "2K";
  const seedStart = args.seed !== undefined ? Number(args.seed) : null;

  const data = readPlatesFile();
  const already = data.generations.filter((g) => g.plateId === plateId).length;

  const images: ImageRef[] = [];
  let referenceGenerationId: string | null = null;
  let referenceFile: string | null = null;

  if (typeof args["ref-gen"] === "string") {
    referenceGenerationId = args["ref-gen"];
    images.push({ type: "generation", generation_id: referenceGenerationId });
  } else if (typeof args.ref === "string") {
    const refPath = path.isAbsolute(args.ref) ? args.ref : path.join(ROOT, args.ref);
    if (!fs.existsSync(refPath)) throw new Error(`--ref file not found: ${refPath}`);
    const mime = refPath.endsWith(".jpg") || refPath.endsWith(".jpeg") ? "image/jpeg" : "image/png";
    images.push({
      type: "inline_base64",
      content_base64: fs.readFileSync(refPath).toString("base64"),
      mime_type: mime,
    });
    referenceFile = path.relative(ROOT, refPath).split(path.sep).join("/");
  }

  const prompt = promptFor(spec, images.length > 0);

  console.log(`Generating ${count} candidate(s) for ${plateId}`);
  console.log(`  model ${model}, 9:16, ${resolution}`);
  if (referenceGenerationId) console.log(`  style reference generation ${referenceGenerationId}`);
  if (referenceFile) console.log(`  style reference file ${referenceFile}`);

  const modelTakesSeed = model.startsWith("bytedance-");

  for (let n = 0; n < count; n += 1) {
    const candidate = already + n + 1;
    const seed = modelTakesSeed ? (seedStart ?? BASE_SEED) + candidate : null;

    const body: CreateBody = {
      model_id: model,
      prompt,
      aspect_ratio: "9:16",
      resolution,
      ...(seed !== null ? { seed } : {}),
      ...(images.length ? { images } : {}),
    };

    console.log(`\n  [${candidate}] creating${seed !== null ? ` seed ${seed}` : ""}...`);
    const creditsBefore = await imageCreditsUsed(key);
    let created: GenerationState;
    try {
      created = await createGeneration(key, body);
    } catch (err) {
      console.log(`  [${candidate}] create failed: ${(err as Error).message}`);
      continue;
    }

    const record: GenerationRecord = {
      generationId: created.id,
      plateId,
      set: spec.set,
      candidate,
      model,
      prompt,
      seed,
      aspectRatio: "9:16",
      resolution,
      referenceGenerationId,
      referenceFile,
      file: null,
      mimeType: null,
      width: null,
      height: null,
      createdAt: new Date().toISOString(),
      status: created.status,
      creditCost: "not reported by API",
      accepted: null,
      verdict: "not yet graded",
    };

    let final: GenerationState;
    try {
      final = await pollGeneration(key, created.id);
    } catch (err) {
      record.status = "failed";
      record.errorMessage = (err as Error).message;
      data.generations.push(record);
      writePlatesFile(data);
      console.log(`  [${candidate}] poll failed: ${(err as Error).message}`);
      continue;
    }

    record.status = final.status;

    const creditsAfter = await imageCreditsUsed(key);
    if (creditsBefore !== null && creditsAfter !== null) {
      const delta = Math.round((creditsAfter - creditsBefore) * 100) / 100;
      record.creditCost = `${delta} credits (usage endpoint delta)`;
      console.log(`  [${candidate}] credits: ${delta}`);
    } else {
      record.creditCost = "not reported by API and usage endpoint unavailable";
    }

    if (final.status === "completed" && final.content_url) {
      const ext = extForMime(final.content_mime_type);
      const rel = `assets/plates/${plateId}-c${String(candidate).padStart(2, "0")}${ext}`;
      const bytes = await downloadTo(final.content_url, path.join(ROOT, rel));
      const size = imageSize(path.join(ROOT, rel));
      record.file = rel;
      record.mimeType = final.content_mime_type ?? null;
      record.width = size?.width ?? null;
      record.height = size?.height ?? null;
      console.log(
        `  [${candidate}] saved ${rel} (${bytes} bytes${size ? `, ${size.width}x${size.height}` : ""})`,
      );
    } else {
      record.failureReason = final.failure_reason;
      record.errorMessage = final.error_message;
      record.verdict = `generation failed: ${final.failure_reason ?? "unknown"}`;
      record.accepted = false;
      console.log(`  [${candidate}] FAILED ${final.failure_reason ?? ""} ${final.error_message ?? ""}`);
    }

    data.generations.push(record);
    writePlatesFile(data);
  }

  // Each shoot carries its own cap, because each was budgeted on its own:
  // 45 for the showcase set, 40 for the training set.
  const setIds = new Set(pool.map((p) => p.id));
  const inSet = data.generations.filter((g) => setIds.has(g.plateId)).length;
  const cap = setName === "training" ? 40 : 45;
  console.log(`\nGenerations logged for the ${setName} set: ${inSet} of a ${cap} cap.`);
  if (inSet > cap) console.log(`WARNING: over the ${cap} image hard cap for the ${setName} set.`);
}

/**
 * Records the eyes-on verdict for one candidate. Section 4b's whole method is
 * generate more and throw most away, so the reason a candidate was dropped has
 * to survive in the file, not in a chat log.
 */
function cmdGrade(args: Record<string, string | true>): void {
  const file = typeof args.file === "string" ? args.file : "";
  if (!file) throw new Error("--file <assets/plates/...> is required.");
  const why = typeof args.why === "string" ? args.why : "";
  if (!why) throw new Error('--why "reason" is required.');
  const accepted = args.accept === true ? true : args.reject === true ? false : null;
  if (accepted === null) throw new Error("Pass --accept or --reject.");

  const data = readPlatesFile();
  const rec = data.generations.find((g) => g.file === file);
  if (!rec) {
    throw new Error(
      `No generation in config/plates.json has file "${file}". Known: ${data.generations
        .map((g) => g.file)
        .filter(Boolean)
        .join(", ")}`,
    );
  }
  rec.accepted = accepted;
  rec.verdict = why;
  writePlatesFile(data);
  console.log(`${file}: ${accepted ? "ACCEPTED" : "rejected"} - ${why}`);
}

function cmdList(args: Record<string, string | true>): void {
  const data = readPlatesFile();
  const only = args.set === undefined ? null : parseSet(args.set);
  const specs = only ? specsForSet(only) : allSpecs();

  let shown: string | null = null;
  for (const spec of specs) {
    if (spec.set !== shown) {
      shown = spec.set;
      console.log(`\n${spec.set} set:`);
    }
    const gens = data.generations.filter((g) => g.plateId === spec.id);
    const accepted = gens.filter((g) => g.accepted === true).length;
    const rejected = gens.filter((g) => g.accepted === false).length;
    const plate = data.plates.find((p) => p.id === spec.id);
    console.log(
      `  ${spec.id.padEnd(24)} candidates ${String(gens.length).padStart(2)}  ` +
        `accepted ${accepted}  rejected ${rejected}  ` +
        `plate ${plate ? plate.file : "none"}  capture ${spec.captureId}`,
    );
  }

  for (const set of ["showcase", "training"] as PlateSetName[]) {
    if (only && only !== set) continue;
    const ids = new Set(specsForSet(set).map((s) => s.id));
    const gens = data.generations.filter((g) => ids.has(g.plateId));
    const plates = data.plates.filter((p) => ids.has(p.id));
    console.log(
      `\n${set}: ${gens.length} generations, ` +
        `${plates.length} of ${ids.size} plates finalised.`,
    );
  }
  console.log(`\nAll sets: ${data.generations.length} generations logged.`);
}

export {
  PLATE_SPECS,
  TRAINING_PLATE_SPECS,
  PRIMARY_MODEL,
  SMOKE_MODEL,
  BASE_SEED,
  ROOT,
  PLATES_DIR,
  PLATES_JSON,
};

async function main(): Promise<void> {
  const [, , cmd, ...rest] = process.argv;
  const args = parseArgs(rest);
  switch (cmd) {
    case "smoke":
      await cmdSmoke(args);
      break;
    case "generate":
      await cmdGenerate(args);
      break;
    case "grade":
      cmdGrade(args);
      break;
    case "list":
      cmdList(args);
      break;
    default:
      console.log("Usage: npx tsx scripts/plates.ts <smoke|generate|grade|list> [flags]");
      console.log("  smoke    [--model id]");
      console.log("  generate --plate <id> --count N [--set showcase|training]");
      console.log("           [--model id] [--ref path] [--ref-gen id]");
      console.log("           [--resolution 1K|2K] [--seed N]");
      console.log('  grade    --file <path> --accept|--reject --why "reason"');
      console.log("  list     [--set showcase|training]");
      process.exitCode = 1;
  }
}

// D:\kap-reel is a directory junction, so process.argv[1] and import.meta.url
// can disagree on the real path. Compare basenames instead.
const invokedDirectly =
  !!process.argv[1] &&
  path.basename(process.argv[1]) === path.basename(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
