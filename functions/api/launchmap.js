/* =============================================
   K & A PERFORMANCE — AI Launch opportunity sketch
   Cloudflare Pages Function — /api/launchmap
   One-shot: takes "what eats your week", returns a
   three-line sketch of what the 90-Day Launch would
   build. This is week one's deliverable in miniature,
   which is the whole point of putting it on the page.
   ============================================= */

const MAX_CHARS = 600;
const MIN_CHARS = 3;

const SYSTEM_PROMPT = `You are Kai, the assistant for K & A Performance, a Gainesville, FL web design and AI integration studio. A visitor on the 90-Day AI Launch page has answered the question "What eats your week?" Your job is to sketch, honestly and concretely, what the Launch program would build for them. The program: twelve weekly working sessions with Alex; weeks 1-2 map the business and ship one quick win; weeks 3-8 build the highest-value workflow on their real data; weeks 9-12 they run it themselves with Alex watching.

Respond with STRICT JSON only, no code fences, exactly this shape:
{"fit": true, "workflow": "...", "quickWin": "...", "week9": "..."}
or, when the input is not a real business time-sink you can help with:
{"fit": false, "note": "..."}

Rules for the three strings (each one to two short sentences, plain-spoken, specific to what they wrote):
- "workflow": the AI workflow weeks 3-8 would build for this exact problem.
- "quickWin": something genuinely shippable in the first session.
- "week9": what running it themselves looks like by week nine.
- Be concrete but never promise outcomes, savings, revenue, or timelines beyond the program structure. No ROI numbers. No guarantees.
- Never suggest K & A provides, includes, or shares Claude accounts, seats, or licenses. Everything is built in the client's own accounts.
- Never use em dashes; use periods, commas, or colons.
- Never invent prices beyond $2,000 for the Launch and $3,999 for Launch + Site, and only mention price if they asked.
- If the input is hostile, off-topic, or not a business problem, use fit:false with a warm one-sentence note steering them to the intake form or /contact/.`;

export async function onRequestPost(context) {
  const { request, env } = context;

  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    // Local dev without .dev.vars has no key: fail cleanly, the page's
    // error state points people at the intake form instead.
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'Sketch unavailable right now.' }, 503);
    }

    const { week } = await request.json();
    if (typeof week !== 'string' || week.trim().length < MIN_CHARS || week.length > MAX_CHARS) {
      return json({ error: 'Tell us what eats your week first.' }, 400);
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: week.trim() }],
      }),
    });

    if (!anthropicRes.ok) {
      return json({ error: 'Sketch unavailable right now.' }, 502);
    }

    const data = await anthropicRes.json();
    if (data.stop_reason === 'refusal') {
      return json({ fit: false, note: 'That one is better as a conversation. The intake form below reaches Alex directly.' });
    }

    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .replace(/^```(?:json)?\s*|\s*```$/g, '');

    // The model is instructed to emit strict JSON; if it drifts, degrade to
    // the same soft failure the visitor would get from a network error.
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return json({ error: 'Sketch unavailable right now.' }, 502);
    }

    if (parsed.fit === false) {
      return json({ fit: false, note: String(parsed.note || 'The intake form below reaches Alex directly.').slice(0, 400) });
    }
    if (!parsed.workflow || !parsed.quickWin || !parsed.week9) {
      return json({ error: 'Sketch unavailable right now.' }, 502);
    }
    // Same em-dash scrub as guide/scope: the house rule is enforced in code,
    // not just in the prompt.
    const scrub = (v) => String(v).slice(0, 500).replace(/\s*—+\s*/g, ', ').replace(/\s+,/g, ',');
    return json({
      fit: true,
      workflow: scrub(parsed.workflow),
      quickWin: scrub(parsed.quickWin),
      week9: scrub(parsed.week9),
    });
  } catch {
    return json({ error: 'Sketch unavailable right now.' }, 500);
  }
}
