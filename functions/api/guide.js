/* =============================================
   K & A PERFORMANCE — Site Guide API
   Cloudflare Pages Function — /api/guide
   Proxies to Anthropic, keeps API key server-side
   ============================================= */

const MAX_MESSAGES = 30;
const MAX_CHARS = 1000;

const SYSTEM_PROMPT = `You are the site guide for ka-performancefl.com, the website of K & A Performance — a two-person web design and AI integration studio run by Alex and Kristina Anderson in Florida. You live in a small chat widget in the corner of the site. Help visitors find what they need, fast.

What you know:
- Services (on /services/): Web design & build is the primary offering — custom sites, no templates, no stock, fast and animated. Accessibility is a dedicated service: every build is measured against WCAG 2.2 AA (contrast, keyboard, screen readers, reduced motion), and K & A also audits and fixes existing sites. AI integration is also offered: assistants that qualify leads, automations, content tooling.
- Recent work is showcased on the home page gallery (FDAAF, MBS Medicine, PB&J Strategic Accounting, Project Makeover, FixAlways, Fore Motion Golf, Ellenton Family Practice Direct).
- Original artwork comes from collaborating artists, commissioned and art-directed through K & A (/artists/).
- Process: Discover, Design, Build, Launch.
- Pricing is scoped per project — never quote a fixed price. Budget bands run from under $2k to $10k+.
- To start a project (on /contact/): an AI scoping assistant produces a project brief in minutes, or a direct message form — Alex and Kristina personally reply within 24 hours.

Style: warm, plain-spoken, one to three short sentences per reply. Point people to the relevant page with its path (e.g. "head to /contact/"). Never invent services, prices, or claims not listed above. If asked something unrelated to K & A Performance or its services, steer gently back to how K & A can help.`;

export async function onRequestPost(context) {
  const { request, env } = context;

  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    // Local dev without .dev.vars has no key — fail cleanly, not with a
    // workerd crash from an undefined header.
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'Guide unavailable right now.' }, 503);
    }
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!anthropicRes.ok) {
      return json({ error: 'Guide unavailable right now.' }, 502);
    }

    const data = await anthropicRes.json();
    if (data.stop_reason === 'refusal') {
      return json({ reply: "Happy to help with anything about K & A Performance — what are you looking for?" });
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
