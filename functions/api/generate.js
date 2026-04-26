import { verifyAuthCookie } from '../../lib/auth-cookie.js';
import { SYSTEM_PROMPT } from '../../lib/system-prompt.js';

// In-memory rate limit store. Best-effort: resets on isolate cold start.
const ipRequests = new Map();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const record = ipRequests.get(ip);
  if (!record || now >= record.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (record.count >= RATE_LIMIT_MAX) return true;
  record.count++;
  return false;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function callClaude(apiKey, model, lane, duration, usedTitles = [], strict = false) {
  const durationLine = duration === 'varied'
    ? 'Vary the duration across the 5 songs: use a mix of short (30s), medium (60s), and longer (up to 2 minutes) lengths. No more than 2 songs should share the same duration.'
    : `All 5 songs must target exactly ${duration}.`;

  const titleBlock = usedTitles.length > 0
    ? ` The following titles already exist in this creator's catalog and must not be reused or closely echoed: ${usedTitles.join(', ')}.`
    : '';

  const baseMsg = `Generate 5 song packages for the lane: ${lane}. ${durationLine}${titleBlock}`;
  const userMsg = strict
    ? `${baseMsg} IMPORTANT: Return ONLY the raw JSON object. Start with { and end with }. No markdown, no preamble, no explanation.`
    : baseMsg;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });

  if (res.status === 429 || res.status === 529) {
    const err = new Error('rate_limited');
    err.status = res.status;
    throw err;
  }
  if (!res.ok) {
    throw new Error(`anthropic_error:${res.status}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

// GET /api/generate: auth check used by the frontend on page load.
// Returns { authenticated: true/false } without triggering generation.
export async function onRequestGet(context) {
  const { request, env } = context;
  const authed = await verifyAuthCookie(
    request.headers.get('Cookie'),
    env.COOKIE_SIGNING_SECRET
  );
  return jsonResponse({ authenticated: authed });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const authed = await verifyAuthCookie(
    request.headers.get('Cookie'),
    env.COOKIE_SIGNING_SECRET
  );
  if (!authed) return jsonResponse({ error: 'Unauthorized.' }, 401);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (isRateLimited(ip)) {
    return jsonResponse({ error: 'Rate limit reached. Try again in an hour.' }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, 400);
  }

  const { lane, duration = 'varied', usedTitles = [] } = body;
  if (!lane || typeof lane !== 'string') {
    return jsonResponse({ error: 'Lane is required.' }, 400);
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  const model = env.MODEL_NAME || 'claude-sonnet-4-6';
  const titles = Array.isArray(usedTitles) ? usedTitles.slice(0, 300) : [];

  let rawText;

  try {
    rawText = await callClaude(apiKey, model, lane, duration, titles);
  } catch (err) {
    if (err.message === 'rate_limited') {
      // Anthropic rate limit: retry once with Haiku
      try {
        rawText = await callClaude(apiKey, 'claude-haiku-4-5-20251001', lane, duration, titles);
      } catch {
        return jsonResponse({ error: 'Generation failed. Please try again.' }, 502);
      }
    } else {
      return jsonResponse({ error: 'Generation failed. Please try again.' }, 502);
    }
  }

  let result;
  try {
    result = JSON.parse(rawText);
  } catch {
    // Malformed JSON: retry once with a stricter prompt
    try {
      const retryText = await callClaude(apiKey, model, lane, duration, titles, true);
      result = JSON.parse(retryText);
    } catch {
      return jsonResponse({ error: 'Generation failed. Please try again.' }, 502);
    }
  }

  return jsonResponse(result);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
