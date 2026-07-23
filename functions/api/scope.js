/* =============================================
   K & A PERFORMANCE — AI Project Scoping API
   Cloudflare Pages Function — /api/scope
   Proxies to Anthropic, keeps API key server-side
   ============================================= */

const MAX_MESSAGES = 24;
const MAX_CHARS = 2000;

const SYSTEM_PROMPT = `You are the project-scoping assistant for K & A Performance, a two-person web design and AI integration studio run by Alex and Kristina Anderson (ka-performancefl.com). Web design and build is the primary offering; AI integration (assistants, automations, content tooling) is the second.

Interview the visitor about their project: what they do, what they need (new site, redesign, AI features), goals, rough timeline, and budget comfort (bands: under $2k, $2k-5k, $5k-10k, $10k+). Ask ONE question at a time, warm and concise — two or three sentences max per turn. After you have enough (usually 4-6 exchanges), produce a scope summary wrapped EXACTLY in <scope_summary> ... </scope_summary> tags containing, as short labeled lines: Project type, Goals, Suggested pages/features, Timeline, Budget band, and Suggested next step. Never quote a fixed price — scoping is per project. Never answer questions unrelated to hiring K & A Performance; politely steer back to their project.`;

export async function onRequestPost(context) {
  const { request, env } = context;

  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    const { messages } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
      return json({ error: 'Invalid conversation.' }, 400);
    }
    for (const m of messages) {
      if (
        !m ||
        (m.role !== 'user' && m.role !== 'assistant') ||
        typeof m.content !== 'string' ||
        m.content.length === 0 ||
        m.content.length > MAX_CHARS
      ) {
        return json({ error: 'Invalid message.' }, 400);
      }
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        thinking: { type: 'disabled' },
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!anthropicRes.ok) {
      return json({ error: 'Assistant unavailable right now — please use the form instead.' }, 502);
    }

    const data = await anthropicRes.json();
    if (data.stop_reason === 'refusal') {
      return json({ reply: "Let's keep this about your project — what are you looking to build?" });
    }
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');
    return json({ reply: text });
  } catch {
    return json({ error: 'Bad request.' }, 400);
  }
}
