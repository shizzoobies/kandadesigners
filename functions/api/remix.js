import { verifyAuthCookie } from '../../lib/auth-cookie.js';

const REMIX_PROMPT = `You are a specialist in repackaging ElevenLabs Music Marketplace listings. You receive existing song packages and create fresh marketplace presentations for the same tracks.

YOUR JOB
For each song provided, generate a new title, marketplace description, and tags. Keep the "prompt" field exactly as given: it defines the music. Change only the marketplace-facing fields.

REPACKAGING RULES
- Give each song a completely different title: different angle, different use case, different emotional framing.
- Write a fresh description that pitches the track to a different buyer type or context than the original.
- Generate a new tag set targeting different search terms the original listing may have missed.
- Do not repeat any titles, descriptions, or tag strings from the input.
- Treat each song as if you are a different music supervisor pitching the same track to a new client.

FIELD RULES
- title: 2 to 4 words. Title case. No quotation marks. Professional production music catalog style.
- description: 2 to 4 sentences. Lead with the feel. Close with 4 to 6 specific use cases.
- tags: 12 to 20 lowercase comma-separated tags. Mix genre, mood, BPM, duration, and use-case tags.
- prompt: copy word-for-word from the input. Do not change a single character.

OUTPUT FORMAT
Respond ONLY with valid JSON in this exact shape, no preamble, no markdown fences, no commentary:

{
  "lane": "<lane name as provided>",
  "songs": [
    {
      "title": "...",
      "prompt": "...",
      "description": "...",
      "tags": "..."
    }
  ]
}

ABSOLUTE RULES
- NEVER use em dashes (—) anywhere in any field. Use periods, commas, colons, semicolons, or "and" instead.
- NEVER include markdown, code fences, or any text outside the JSON object.
- Return exactly the same number of songs as provided in the input.
- Every "prompt" field must be copied word-for-word from the input with zero changes.`;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function callClaude(apiKey, model, songs, lane) {
  const userMsg = `Remix these marketplace listings for the lane "${lane}". Keep every generation prompt identical. Create fresh titles, descriptions, and tags for each:\n\n${JSON.stringify(songs, null, 2)}`;

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
      system: REMIX_PROMPT,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });

  if (!res.ok) throw new Error(`api_error:${res.status}`);
  const data = await res.json();
  return data.content[0].text;
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

  const { songs, lane } = body;
  if (!Array.isArray(songs) || songs.length === 0 || !lane) {
    return jsonResponse({ error: 'Songs and lane are required.' }, 400);
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  // Remix uses Haiku by default: lighter repackaging task, lower cost.
  // Override with REMIX_MODEL_NAME secret if needed.
  const model = env.REMIX_MODEL_NAME || 'claude-haiku-4-5-20251001';

  let rawText;
  try {
    rawText = await callClaude(apiKey, model, songs, lane);
  } catch {
    return jsonResponse({ error: 'Remix failed. Please try again.' }, 502);
  }

  let result;
  try {
    result = JSON.parse(rawText);
  } catch {
    try {
      rawText = await callClaude(apiKey, model, songs, lane);
      result = JSON.parse(rawText);
    } catch {
      return jsonResponse({ error: 'Remix failed. Please try again.' }, 502);
    }
  }

  return jsonResponse(result);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
