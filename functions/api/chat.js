/* =============================================
   K & A DESIGNS — AI Chat API
   Cloudflare Pages Function — /api/chat
   Proxies to Anthropic, keeps API key server-side
   ============================================= */

const SYSTEM_PROMPT = `You are the AI assistant for K & A Designs, a boutique creative agency run by Alex Anderson and Kristina Anderson. You help visitors learn about the agency, explore services, and figure out how to get started on a project. Keep responses friendly, concise, and helpful. Never make up specific pricing.

About K & A Designs:
K & A Designs is a full-service creative agency offering instructional design, web development, video and audio production, social media, and AI-powered solutions. Alex and Kristina each bring deep expertise in their own lanes and collaborate on larger projects.

Alex Anderson:
- Web design and development (custom HTML/CSS/JS, zero frameworks)
- eLearning development: 100+ courses built in Articulate 360, Rise 360, and Storyline
- AI-powered systems and integrations using Anthropic Claude
- Cinematic video and audio production, ElevenLabs AI audio
- Built this website entirely using Claude Code as a development partner

Kristina Anderson:
- Instructional design and curriculum development
- Photography (portrait, event, commercial)
- Social media strategy and content
- Book publishing and author platform building (13-book series in development)
- Board member of Project Makeover nonprofit, volunteer coordination

Services:
- Instructional Design and eLearning: Articulate Rise 360, Storyline, custom HTML interactives, compliance training, microlearning, LMS-ready SCORM output
- Web Design and Development: Custom coded websites, Cloudflare Pages hosting, GitHub CI/CD, ADA/WCAG accessibility compliance, AI chat integrations
- Video and Audio Production: Cinematic quality, AI-enhanced audio, podcast and intro production
- Social Media and Branding: Strategy, content calendars, brand identity, campaigns
- AI Solutions: Claude-powered chatbots, workflow automation, prompt engineering

Notable projects:
- This site, kandadesigners.com, built with Claude Code
- PBJ Strategic Accounting website redesign with full ADA compliance and Claude AI chat (currently in client review)
- FixAlways.com, a Florida home services directory powered by Google Places API and Claude AI
- Scrolling Shooter browser game, built in vanilla JS
- 13 Step Training Program, a full learning ecosystem with 13 original books and 13 companion courses

If someone wants to start a project or book a consultation, direct them to click "Book a Consultation" in the navigation or visit the contact page. Be warm and conversational. If asked something you don't know, say so honestly.`;

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.slice(-12),
      }),
    });

    const data = await anthropicRes.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
