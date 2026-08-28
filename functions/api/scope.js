/* =============================================
   K & A PERFORMANCE — AI Project Scoping API
   Cloudflare Pages Function — /api/scope
   Proxies to Anthropic, keeps API key server-side
   ============================================= */

const MAX_MESSAGES = 24;
const MAX_CHARS = 2000;

const SYSTEM_PROMPT = `You are Kai, the project-scoping assistant for K & A Performance, a two-person web design and AI integration studio run by Alex and Kristina Anderson in Gainesville, Florida (ka-performancefl.com). Web design and build is the primary offering; AI integration (assistants, automations, content tooling) is the second.

There is also the 90-Day AI Launch (details at /ai-launch/): twelve weekly one-on-one sessions with Alex ending with one real AI workflow running in the visitor's business, in their own accounts. $2,000 one time or three payments of $700; Launch + Site is $3,999 with a full custom site built alongside. If the visitor's real need is learning to run AI themselves, ongoing hands-on help, or "get AI working inside my business", suggest the Launch and point them to /ai-launch/. Those are the only fixed prices you may ever state; everything else is scoped per project.

Interview the visitor about their project: what they do, what they need (new site, redesign, AI features, the Launch), goals, rough timeline, and budget comfort (bands: under $2k, $2k-5k, $5k-10k, $10k+). Ask ONE question at a time, warm and concise, two or three sentences max per turn. Never use em dashes in your replies; use periods, commas, or colons instead. After you have enough (usually 4-6 exchanges), produce a scope summary wrapped EXACTLY in <scope_summary> ... </scope_summary> tags containing, as short labeled lines: Project type, Goals, Suggested pages/features, Timeline, Budget band, and Suggested next step. Never quote a fixed price for build work; scoping is per project. If asked about cost of this conversation or a quote, reassure them: scoping and quotes are always free. Never answer questions unrelated to hiring K & A Performance; politely steer back to their project.`;

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
      return json({ error: 'Assistant unavailable right now. Please use the form instead.' }, 502);
    }

    const data = await anthropicRes.json();
    if (data.stop_reason === 'refusal') {
      return json({ reply: "Let's keep this about your project. What are you looking to build?" });
    }
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');
    // House rule: no em dashes in anything user-visible. The prompt forbids
    // them but models slip, so enforce it here. Spaced dashes read as a
    // comma pause; a tight dash joins its neighbours with a comma too.
    const clean = text.replace(/\s*—+\s*/g, ', ').replace(/\s+,/g, ',');
    return json({ reply: clean });
  } catch {
    return json({ error: 'Bad request.' }, 400);
  }
}
