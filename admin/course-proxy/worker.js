/* ============================================================
   Claude Code Course - Optional Generation Proxy  (Cloudflare Worker)

   This is the OPTIONAL upgrade that makes s5 (website) and s6 (SCORM)
   generate real, unique content from the learner's typed request, using
   Claude Haiku. It is NOT required for the course to work: with no Worker
   deployed, every section falls back to its built-in deterministic output.

   WHY A WORKER: the Anthropic API key must never live in a course package.
   A Rise/Reach embed is downloadable HTML; anything inside it is exposed.
   The key lives here as a Cloudflare Secret. The embed calls this Worker;
   the Worker calls Claude and returns a small JSON model. The browser never
   sees the key.

   HARD RULES enforced below (see reach-360-ai-integration skill):
   - Key in a Secret, never in the course package.
   - CORS allowlist (your Reach/Articulate domain), never "*".
   - Rate limit per learner IP (Workers KV).
   - Validate and cap every input.
   - Do not log learner prompt content (metadata only).
   - Optional Cloudflare Turnstile to stop a leaked course link from
     draining your credits.

   DEPLOY: see README.md in this folder. TL;DR:
     wrangler secret put ANTHROPIC_API_KEY
     wrangler deploy
   then paste the Worker URL into CONFIG.workerUrl in s5/s6 index.html.
   ============================================================ */

const MODEL = "claude-haiku-4-5";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MAX_PROMPT_CHARS = 600;       // learner request cap
const DAILY_LIMIT_PER_IP = 300;     // calls per IP per day (a full chatty session is well under this)
const DAILY_LIMIT_GLOBAL = 1500;    // budget backstop: worst-case ~a few dollars/day even if a link leaks

/* ---- CORS allowlist. Override with the ALLOWED_ORIGINS env var
   (comma-separated). Wildcards like *.reach360.com are supported. ---- */
const DEFAULT_ALLOWED = [
  "https://*.reach360.com",
  "https://*.articulate.com",
  "https://*.articulateusercontent.com",  // Articulate often serves embedded HTML from here
  "https://*.riseusercontent.com",        // Rise serves published course content from here (e.g. learn.riseusercontent.com)
  "http://127.0.0.1:8731",   // local testing of the course
  "http://localhost:8731"
];

function allowedOrigins(env) {
  if (env && env.ALLOWED_ORIGINS) {
    return env.ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean);
  }
  return DEFAULT_ALLOWED;
}

function originAllowed(origin, list) {
  if (!origin) return false;
  for (const pat of list) {
    if (pat === origin) return true;
    if (pat.indexOf("*") >= 0) {
      // "*." means any subdomain depth (a.host or a.b.host); a bare "*" is one label.
      const rx = new RegExp("^" + pat
        .replace(/[.]/g, "\\.")
        .replace(/\*\\\./g, "(?:[^.]+\\.)+")
        .replace(/\*/g, "[^.]+") + "$");
      if (rx.test(origin)) return true;
    }
  }
  return false;
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(body, status, origin) {
  const h = { "Content-Type": "application/json" };
  if (origin) Object.assign(h, corsHeaders(origin));
  return new Response(JSON.stringify(body), { status: status || 200, headers: h });
}

/* ---- per-IP daily rate limit via Workers KV (binding: RATE_LIMIT) ---- */
async function rateLimited(env, ip) {
  if (!env || !env.RATE_LIMIT) return false; // KV not bound: skip (see README)
  const day = new Date().toISOString().slice(0, 10);
  const ttl = 60 * 60 * 36; // 36h so the daily keys expire on their own
  // global backstop first (protects the API budget if a link leaks)
  const gKey = "rl:global:" + day;
  const g = parseInt((await env.RATE_LIMIT.get(gKey)) || "0", 10);
  if (g >= DAILY_LIMIT_GLOBAL) return true;
  // per-IP cap
  const key = "rl:" + day + ":" + ip;
  const cur = parseInt((await env.RATE_LIMIT.get(key)) || "0", 10);
  if (cur >= DAILY_LIMIT_PER_IP) return true;
  await env.RATE_LIMIT.put(key, String(cur + 1), { expirationTtl: ttl });
  await env.RATE_LIMIT.put(gKey, String(g + 1), { expirationTtl: ttl });
  return false;
}

/* ---- optional Turnstile verification (set TURNSTILE_SECRET to enable) ---- */
async function turnstileOk(env, token, ip) {
  if (!env || !env.TURNSTILE_SECRET) return true; // disabled
  if (!token) return false;
  const form = new URLSearchParams();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body: form
    });
    const d = await r.json();
    return !!d.success;
  } catch (e) { return false; }
}

/* ============================================================
   JSON SCHEMAS (Anthropic structured outputs).
   Kept within structured-output limits: no min/maxLength, no numeric
   min/max, additionalProperties:false on every object.
   ============================================================ */
const SITE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    kind: { type: "string", enum: ["coffee","restaurant","bakery","fitness","portfolio","tech","salon","consulting","generic"] },
    name: { type: "string" },
    theme: { type: "string", enum: ["light","dark"] },
    accent: { type: "string", description: "Hex color like #14b8a6" },
    tagline: { type: "string", description: "Short hero headline, 2 to 7 words" },
    subhead: { type: "string", description: "One sentence under the headline" },
    cta: { type: "string", description: "Call to action button text, 1 to 3 words" },
    sections: { type: "array", items: { type: "string",
      enum: ["hero","menu","pricing","gallery","services","features","about","testimonials","contact"] } },
    menu: { type: "array", items: { type: "object", additionalProperties: false,
      properties: { name: { type: "string" }, price: { type: "string" } }, required: ["name","price"] } },
    about: { type: "string", description: "Two sentences for an about section" },
    artMotif: { type: "string", enum: ["botanical","geometric","waves","dots","arches"], description: "Visual art style for the gallery and imagery" }
  },
  required: ["kind","name","theme","accent","tagline","subhead","cta","sections"]
};

const SCORM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    interaction: { type: "string", enum: ["quiz","dragdrop","matching","sequencing","flashcards"],
      description: "quiz = multiple choice; dragdrop = sort items into category groups; matching = match pairs; sequencing = put steps in correct order; flashcards = term and definition flip cards" },
    topic: { type: "string" },
    title: { type: "string", description: "A short title for the interaction" },
    instructions: { type: "string", description: "One short sentence telling the learner what to do" },
    reports: { type: "string", enum: ["completion","score"] },
    passing: { type: "integer", description: "Passing percent 1 to 100, or 0 for none" },
    questions: { type: "array", description: "Only for quiz. 3 to 6 questions.", items: { type: "object", additionalProperties: false,
      properties: {
        q: { type: "string" },
        options: { type: "array", items: { type: "string" } },
        answer: { type: "integer", description: "0-based index of the correct option" }
      }, required: ["q","options","answer"] } },
    buckets: { type: "array", description: "Only for dragdrop. 2 to 4 category names that items are sorted into.", items: { type: "string" } },
    items: { type: "array", description: "Only for dragdrop. Each item and the 0-based index of its correct bucket. 4 to 8 items.",
      items: { type: "object", additionalProperties: false, properties: {
        text: { type: "string" }, bucket: { type: "integer", description: "0-based index into buckets" }
      }, required: ["text","bucket"] } },
    pairs: { type: "array", description: "Only for matching. 3 to 6 left and right pairs that belong together.",
      items: { type: "object", additionalProperties: false, properties: {
        left: { type: "string" }, right: { type: "string" }
      }, required: ["left","right"] } },
    steps: { type: "array", description: "Only for sequencing. 3 to 6 steps written in the CORRECT order.", items: { type: "string" } },
    cards: { type: "array", description: "Only for flashcards. 3 to 8 cards, front prompt and back answer.",
      items: { type: "object", additionalProperties: false, properties: {
        front: { type: "string" }, back: { type: "string" }
      }, required: ["front","back"] } }
  },
  required: ["interaction","topic","reports"]
};

const SITE_SYSTEM =
  "You generate a compact JSON model for a single marketing website from a short request. " +
  "Pick a fitting kind, a real-sounding business name, a theme and an accent hex color, a punchy tagline and subhead, " +
  "a call to action, and the sections to include (always include hero and contact). " +
  "If the request implies a menu (coffee, restaurant, bakery), include 5 to 6 menu items with short prices. " +
  "Write an about line. Pick an artMotif that fits the brand: botanical for florals, spas, and gardens; arches for cafes and bakeries; waves for portfolios and calm brands; geometric for tech and fitness; dots otherwise. Keep all copy clean and professional. Never use em dashes. Respond with JSON only.";

const SCORM_SYSTEM =
  "You generate a compact JSON model for an interactive e-learning interaction from a short request, the kind a designer would build for a SCORM course. " +
  "FIRST choose the interaction type that best matches what the person asked for: " +
  "quiz (multiple choice questions); dragdrop (sort or categorize items into named groups, also covers 'drag and drop', 'sorting', 'categorize'); " +
  "matching (match pairs, connect terms to definitions, 'match the', 'pair'); sequencing (put steps in the correct order, 'order', 'sequence', 'arrange', 'timeline', 'process'); " +
  "flashcards (term and definition flip cards, 'flashcards', 'flip', 'study cards'). Honor the type the user names; only default to quiz if nothing fits. " +
  "Then fill ONLY the data array for that type with real, accurate, specific content about the topic (questions, or buckets+items, or pairs, or steps, or cards). Leave the other arrays out. " +
  "For dragdrop, each item's bucket is the 0-based index into buckets. For sequencing, write steps in the correct order (the app shuffles them). " +
  "Write a short title and a one-sentence instruction. Choose reports: 'score' for graded interactions, else 'completion'; flashcards are usually completion. Add an optional passing percent only if a score makes sense. " +
  "Keep text short and clean. Never use em dashes. Respond with JSON only.";

async function callClaude(env, system, schema, userText) {
  const body = {
    model: MODEL,
    max_tokens: 1500,
    system: system,
    output_config: { format: { type: "json_schema", schema: schema } },
    messages: [{ role: "user", content: userText }]
  };
  const r = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const detail = await r.text();
    throw new Error("anthropic " + r.status + ": " + detail.slice(0, 300));
  }
  const data = await r.json();
  // structured outputs put valid JSON in the first text block
  const textBlock = (data.content || []).find(b => b.type === "text");
  if (!textBlock) throw new Error("no text block in response");
  return JSON.parse(textBlock.text);
}

/* ---- plain-text completion (chat + feedback) ---- */
async function callClaudeText(env, system, messages, maxTokens) {
  const r = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens || 600, system: system, messages: messages })
  });
  if (!r.ok) { const detail = await r.text(); throw new Error("anthropic " + r.status + ": " + detail.slice(0, 300)); }
  const data = await r.json();
  const tb = (data.content || []).find(b => b.type === "text");
  return tb ? noEmDash(tb.text) : "";
}

const CHAT_SYSTEM_BASE =
  "You are Claude, talking with a creative-services teammate who is learning Claude Code inside a friendly training sandbox. " +
  "Be warm, encouraging, and concise: usually two to four short sentences. You can answer questions about Claude Code, the desktop app, " +
  "signing in, MCP connectors, and how to use Claude for real work. If asked to actually build or run something, explain this is a practice " +
  "chat and point them to the real app. Stay on topics related to Claude and their work. Never use em dashes.";

const FEEDBACK_SYSTEM =
  "A learner just built something in a training exercise. You are given a JSON model of their website or SCORM interaction. " +
  "Give one specific, genuine compliment about a choice they made, then one concrete, encouraging suggestion to try next. " +
  "Two or three short sentences, warm and plain. Address them by name if given. Never use em dashes.";

function whoLine(payload) {
  const bits = [];
  if (payload && typeof payload.name === "string" && payload.name.trim()) bits.push("Their name is " + payload.name.trim().slice(0, 40) + ".");
  if (payload && typeof payload.role === "string" && payload.role.trim()) bits.push("Their role is " + payload.role.trim().slice(0, 60) + ".");
  return bits.length ? (" " + bits.join(" ")) : "";
}

/* per-page context for the on-page assistant: tells the tutor which lesson
   the learner is looking at so answers are about the right screen. */
function contextLine(payload) {
  if (payload && typeof payload.context === "string" && payload.context.trim()) {
    return " The learner is currently on this course page, so keep answers about it: " + payload.context.trim().slice(0, 300);
  }
  return "";
}

function buildChatMessages(payload) {
  const msgs = [];
  const hist = Array.isArray(payload && payload.history) ? payload.history.slice(-8) : [];
  for (const h of hist) {
    if (!h || typeof h.text !== "string") continue;
    msgs.push({ role: h.role === "assistant" ? "assistant" : "user", content: String(h.text).slice(0, 1000) });
  }
  msgs.push({ role: "user", content: String(payload.prompt || "").slice(0, MAX_PROMPT_CHARS) });
  return msgs;
}

/* ---- hard guard: the course forbids em dashes, models occasionally emit them ---- */
function noEmDash(s) {
  return String(s)
    .replace(/(\d)\s*[—–]\s*(\d)/g, "$1 to $2")
    .replace(/\s*[—–]\s*/g, ", ")
    // spaced hyphen used as a dash ("Install - so" => "Install, so").
    // Requires whitespace on BOTH sides, so CLI flags (-v, -g) and
    // compound names (claude-code) are left alone.
    .replace(/(\S)\s+-\s+(\S)/g, "$1, $2");
}
function scrub(v) {
  if (typeof v === "string") return noEmDash(v);
  if (Array.isArray(v)) return v.map(scrub);
  if (v && typeof v === "object") { const o = {}; for (const k in v) o[k] = scrub(v[k]); return o; }
  return v;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const list = allowedOrigins(env);
    const okOrigin = originAllowed(origin, list);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: okOrigin ? 204 : 403, headers: okOrigin ? corsHeaders(origin) : {} });
    }
    if (request.method !== "POST") {
      return json({ error: "POST only" }, 405, okOrigin ? origin : null);
    }
    if (!okOrigin) {
      // Do not echo a CORS header for a disallowed origin. Log the origin only
      // (no prompt content) so a blocked embed domain can be identified via
      // `wrangler tail` and added to ALLOWED_ORIGINS.
      console.log("origin_rejected", origin || "(none)");
      return json({ error: "origin not allowed" }, 403, null);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: "server not configured" }, 500, origin);
    }

    const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";

    let payload;
    try { payload = await request.json(); }
    catch (e) { return json({ error: "bad json" }, 400, origin); }

    // lightweight health check for the status badge: confirms the origin is allowed
    // and the key is set, with no Claude call and no rate-limit cost.
    if (payload && payload.kind === "ping") {
      return json({ ok: true, pong: true }, 200, origin);
    }

    // ElevenLabs Conversational AI: mint a short-lived signed URL so the
    // ElevenLabs key stays server-side. The browser opens the audio WebSocket
    // straight to ElevenLabs with this URL (valid 15 min, one conversation).
    // Until ELEVENLABS_API_KEY + ELEVENLABS_AGENT_ID are set, returns a clean
    // not_configured so the bubble can fall back to the text assistant.
    if (payload && payload.kind === "convai_url") {
      if (await rateLimited(env, ip)) {
        return json({ error: "rate limit reached, try again tomorrow" }, 429, origin);
      }
      const agentId = (env && env.ELEVENLABS_AGENT_ID) ? String(env.ELEVENLABS_AGENT_ID).trim() : "";
      if (!env || !env.ELEVENLABS_API_KEY || !agentId) {
        return json({ ok: false, reason: "not_configured" }, 200, origin);
      }
      try {
        const u = "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=" + encodeURIComponent(agentId);
        const r = await fetch(u, { headers: { "xi-api-key": env.ELEVENLABS_API_KEY } });
        if (!r.ok) {
          console.log("convai_url_upstream", r.status);
          return json({ ok: false, reason: "upstream", status: r.status }, 200, origin);
        }
        const d = await r.json();
        if (!d || !d.signed_url) return json({ ok: false, reason: "no_url" }, 200, origin);
        return json({ ok: true, signedUrl: d.signed_url, agentId: agentId }, 200, origin);
      } catch (e) {
        console.log("convai_url_exception", String(e).slice(0, 120));
        return json({ ok: false, reason: "exception" }, 200, origin);
      }
    }

    // ---- validate inputs ----
    const kind = payload && payload.kind;
    const KINDS = { site: 1, scorm: 1, chat: 1, feedback: 1 };
    if (!KINDS[kind]) return json({ error: "unknown kind" }, 400, origin);

    // prompt required for site, scorm, chat (feedback supplies a model instead)
    let prompt = (payload && typeof payload.prompt === "string") ? payload.prompt.trim() : "";
    if (kind !== "feedback") {
      if (!prompt) return json({ error: "prompt required" }, 400, origin);
      if (prompt.length > MAX_PROMPT_CHARS) prompt = prompt.slice(0, MAX_PROMPT_CHARS);
      payload.prompt = prompt;
    }

    // optional Turnstile
    if (!(await turnstileOk(env, payload && payload.turnstileToken, ip))) {
      return json({ error: "verification failed" }, 403, origin);
    }
    // rate limit (metadata only; we never log prompt text)
    if (await rateLimited(env, ip)) {
      return json({ error: "rate limit reached, try again tomorrow" }, 429, origin);
    }

    // role tailoring for the build generators
    const roleHint = (payload && typeof payload.role === "string" && payload.role.trim())
      ? (" The person building this works as: " + payload.role.trim().slice(0, 60) + ". Lean the examples toward that world when it fits.")
      : "";
    // include prior model as context for follow-ups (kept small)
    let userText = prompt + roleHint;
    if (payload.prev && typeof payload.prev === "object") {
      try {
        const prevStr = JSON.stringify(payload.prev).slice(0, 1200);
        userText = "Current model (merge my request into it, keep what still applies):\n" +
          prevStr + "\n\nRequest: " + prompt + roleHint;
      } catch (e) {}
    }

    try {
      if (kind === "site") {
        return json({ ok: true, model: scrub(await callClaude(env, SITE_SYSTEM, SITE_SCHEMA, userText)) }, 200, origin);
      }
      if (kind === "scorm") {
        return json({ ok: true, model: scrub(await callClaude(env, SCORM_SYSTEM, SCORM_SCHEMA, userText)) }, 200, origin);
      }
      if (kind === "chat") {
        const text = await callClaudeText(env, CHAT_SYSTEM_BASE + whoLine(payload) + contextLine(payload), buildChatMessages(payload), 600);
        return json({ ok: true, text: text }, 200, origin);
      }
      if (kind === "feedback") {
        const target = (payload && payload.target === "scorm") ? "SCORM interaction" : "website";
        let modelStr = "";
        try { modelStr = JSON.stringify(payload.model).slice(0, 1500); } catch (e) {}
        if (!modelStr) return json({ error: "model required" }, 400, origin);
        const userMsg = "Here is the JSON model of the " + target + " I just built." + whoLine(payload) + "\n\n" + modelStr;
        return json({ ok: true, text: await callClaudeText(env, FEEDBACK_SYSTEM, [{ role: "user", content: userMsg }], 400) }, 200, origin);
      }
      return json({ error: "unknown kind" }, 400, origin);
    } catch (e) {
      // metadata-only log; no prompt content
      console.log("generation_error", kind, String(e).slice(0, 200));
      return json({ error: "generation failed" }, 502, origin);
    }
  }
};
