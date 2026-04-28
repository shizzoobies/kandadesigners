import { verifyAuthCookie } from '../../lib/auth-cookie.js';
import { SYSTEM_PROMPT } from '../../lib/system-prompt.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const authed = await verifyAuthCookie(
    request.headers.get('Cookie'),
    env.COOKIE_SIGNING_SECRET
  );
  if (!authed) return jsonResponse({ error: 'Unauthorized.' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, 400);
  }

  const { songs, minDuration, maxDuration, usedTitles = [] } = body;

  if (!Array.isArray(songs) || songs.length === 0) {
    return jsonResponse({ error: 'No banger songs provided.' }, 400);
  }
  if (!minDuration || !maxDuration) {
    return jsonResponse({ error: 'Duration range is required.' }, 400);
  }

  // Sample up to 10 bangers as creative reference
  const sample = shuffle(songs).slice(0, 10);
  const catalogText = sample
    .map(s => `Title: ${s.title}\nLane: ${s.lane || 'unknown'}\nPrompt: ${s.prompt}`)
    .join('\n\n');

  const titleBlock = usedTitles.length > 0
    ? ` These titles already exist and must not be reused: ${usedTitles.slice(0, 300).join(', ')}.`
    : '';

  const userMsg = `Create 5 new song packages inspired by the styles, moods, genres, and energy of this creator's top performers listed below. Each of the 5 songs must have a different duration, and every duration must fall between ${minDuration} and ${maxDuration}. Do not repeat any existing titles.${titleBlock} Draw on the musical DNA of these bangers but produce fresh, distinct packages.

Top performers:
${catalogText}`;

  const apiKey = env.ANTHROPIC_API_KEY;
  const model  = env.REMIX_MODEL_NAME || 'claude-haiku-4-5-20251001';

  async function callClaude(strict = false) {
    const content = strict
      ? `${userMsg} IMPORTANT: Return ONLY the raw JSON object. Start with { and end with }. No markdown, no preamble, no explanation.`
      : userMsg;

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
        messages: [{ role: 'user', content }],
      }),
    });
    if (!res.ok) throw new Error(`anthropic_error:${res.status}`);
    const data = await res.json();
    return data.content[0].text;
  }

  let rawText;
  try {
    rawText = await callClaude();
  } catch {
    return jsonResponse({ error: 'Generation failed. Please try again.' }, 502);
  }

  let result;
  try {
    result = JSON.parse(rawText);
  } catch {
    try {
      const retryText = await callClaude(true);
      result = JSON.parse(retryText);
    } catch {
      return jsonResponse({ error: 'Generation failed. Please try again.' }, 502);
    }
  }

  result.lane = 'Banger Remix';
  return jsonResponse(result);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
