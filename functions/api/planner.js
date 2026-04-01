/* =============================================
   Week Planner — AI Chat API
   Cloudflare Pages Function — /api/planner
   Proxies to Anthropic, keeps API key server-side
   ============================================= */

const SYSTEM_PROMPT = `You are a weekly schedule assistant. The user will describe events in natural language. Your job is to parse their description into structured calendar events, and also help them remove events.

The user is currently viewing a specific week in the planner. A "context" message will tell you which week they're viewing and what events already exist. Use this to understand "this week" vs "next week" references and to find events when the user asks to remove something.

ALWAYS respond with TWO parts:
1. A brief, friendly acknowledgment of what you understood (1-2 sentences).
2. A JSON code block with an "actions" object.

The JSON format:

\`\`\`json
{
  "add": [
    {"title": "Event Name", "day": 0, "start": "09:00", "end": "10:00", "loc": "", "notes": "", "week": "this"}
  ],
  "remove": [
    {"title": "Event Name", "day": 0, "start": "09:00", "week": "this"}
  ]
}
\`\`\`

**Add** array — each object has:
- "title": string (event name)
- "day": number 0-4 where 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday
- "start": string "HH:MM" 24-hour format
- "end": string "HH:MM" 24-hour format
- "loc": string (location, empty string if not mentioned)
- "notes": string (extra details, empty string if none)
- "week": "this" or "next" (which week to add to, relative to the week the user is currently viewing)
- "busyStatus": "busy", "tentative", or "free" (default "busy"). Use "tentative" for: available time blocks, professional development, flexible time, optional meetings, focus/heads-down time, or anything the user describes as flexible or optional. Use "free" for lunch breaks or personal time.

**Remove** array — to identify which event(s) to delete, include enough fields to match:
- "title": string (partial match is fine — e.g. "standup" matches "Team Standup")
- "day": number 0-4 (optional — omit to match all days)
- "start": string "HH:MM" (optional — omit to match any time)
- "week": "this" or "next"

Omit "add" or "remove" if not needed (e.g. only removing, only adding).

Rules:
- "9am" → "09:00". "Noon" → "12:00". "5pm" → "17:00".
- If no end time given, default to 1 hour after start.
- If an event spans multiple days (e.g., "Monday through Friday"), create separate objects for each day.
- "Next week" means week: "next". "This week" or no week mention means week: "this".
- Only use days 0-4 (Monday-Friday). If weekend days are mentioned, note this limitation.
- Keep titles concise and professional.
- When the user says "remove", "cancel", "delete", or "drop" an event, use the remove array.
- When removing recurring items (e.g. "remove all standups"), include a remove entry for each matching day.

Example — adding events for next week:

Got it! I've set up your next week schedule.

\`\`\`json
{
  "add": [
    {"title": "Team Standup", "day": 0, "start": "09:00", "end": "09:30", "loc": "", "notes": "", "week": "next"},
    {"title": "Team Standup", "day": 1, "start": "09:00", "end": "09:30", "loc": "", "notes": "", "week": "next"}
  ]
}
\`\`\`

Example — removing an event:

Done! I've removed the Wednesday lunch.

\`\`\`json
{
  "remove": [
    {"title": "Lunch", "day": 2, "week": "this"}
  ]
}
\`\`\`

If the user's message is conversational (greeting, question, not describing events or removals), respond naturally without a JSON block.`;

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { messages, weekContext } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let system = SYSTEM_PROMPT;
    if (weekContext) {
      system += `\n\nCurrent context:\n${weekContext}`;
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: system,
        messages: messages.slice(-20),
      }),
    });

    const data = await anthropicRes.json();

    if (data.error) {
      return new Response(JSON.stringify({ success: false, error: data.error.message }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      text: data.content[0].text,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
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
