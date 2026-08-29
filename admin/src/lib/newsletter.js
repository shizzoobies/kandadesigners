// Newsletter rendering, the Opus polish pass, and delivery. The renderer
// takes either plain text (paragraphs on blank lines) or a JSON array of
// blocks; polish produces blocks. Rendering stays pure and testable, the
// unsubscribe footer is enforced here rather than trusted to any author,
// and the house no-em-dash rule is applied to everything outbound.

const SITE_URL = 'https://ka-performancefl.com';

// Earthen Sophisticate, flattened to email-safe inline styles.
const C = {
  canvas: '#F8F5F2',
  ink: '#221C15',
  muted: '#6C635A',
  accent: '#9A3412',
  amber: '#D97706',
  rule: '#d8d2ca',
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const deDash = (s) => String(s).replace(/\s*—+\s*/g, ', ').replace(/\s+,/g, ',');

/**
 * body is either plain text or a JSON array of blocks:
 *   { type: 'heading', text }
 *   { type: 'paragraph', text }
 *   { type: 'button', text, url }
 *   { type: 'divider' }
 * Anything unrecognized renders as a paragraph rather than vanishing.
 */
export function parseBlocks(body) {
  const raw = String(body ?? '').trim();
  if (raw.startsWith('[')) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr
          .filter((b) => b && typeof b === 'object')
          .map((b) => ({
            type: ['heading', 'paragraph', 'button', 'divider'].includes(b.type) ? b.type : 'paragraph',
            text: deDash(String(b.text ?? '')),
            url: b.url ? String(b.url) : '',
          }))
          .filter((b) => b.type === 'divider' || b.text);
      }
    } catch {
      /* fall through to plain text */
    }
  }
  return raw
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ type: 'paragraph', text: deDash(p), url: '' }));
}

function blockHtml(b) {
  if (b.type === 'heading') {
    return `<h2 style="margin:28px 0 12px 0;font-size:19px;line-height:1.3;color:${C.ink};">${escapeHtml(b.text)}</h2>`;
  }
  if (b.type === 'divider') {
    return `<hr style="border:none;border-top:1px solid ${C.rule};margin:28px 0;">`;
  }
  if (b.type === 'button' && b.url) {
    return `<p style="margin:24px 0;"><a href="${escapeHtml(b.url)}" style="display:inline-block;background:${C.amber};color:${C.ink};font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:999px;">${escapeHtml(b.text)}</a></p>`;
  }
  return `<p style="margin:0 0 16px 0;">${escapeHtml(b.text).replace(/\r?\n/g, '<br>')}</p>`;
}

function blockText(b) {
  if (b.type === 'divider') return '---';
  if (b.type === 'button' && b.url) return `${b.text}: ${b.url}`;
  return b.text;
}

export function unsubscribeUrl(token) {
  return `${SITE_URL}/api/unsubscribe?t=${encodeURIComponent(token)}`;
}

export function renderNewsletter({ subject, body, token }) {
  const blocks = parseBlocks(body);
  const unsub = unsubscribeUrl(token);
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:${C.canvas};">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;font-family:Georgia,'Times New Roman',serif;color:${C.ink};font-size:16px;line-height:1.6;">
    <p style="margin:0 0 24px 0;font-family:Courier,monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${C.accent};">K &amp; A Performance</p>
    <h1 style="margin:0 0 20px 0;font-size:24px;line-height:1.25;">${escapeHtml(deDash(subject))}</h1>
    ${blocks.map(blockHtml).join('\n')}
    <hr style="border:none;border-top:1px solid ${C.rule};margin:32px 0 16px 0;">
    <p style="margin:0;font-size:12px;color:${C.muted};">
      K &amp; A Performance, Gainesville, FL ·
      <a href="${SITE_URL}/" style="color:${C.accent};">ka-performancefl.com</a> ·
      <a href="${escapeHtml(unsub)}" style="color:${C.muted};">Unsubscribe</a>
    </p>
  </div>
</body></html>`;
  const text = `${blocks.map(blockText).join('\n\n')}\n\n---\nK & A Performance, Gainesville, FL\n${SITE_URL}/\nUnsubscribe: ${unsub}`;
  return { html, text };
}

/* ---- the Opus polish pass ---- */

const POLISH_SYSTEM = `You turn Alex's rough notes into a short email newsletter for K & A Performance, a two-person web design and AI integration studio in Gainesville, Florida. The list is people who took the free hands-on AI course; they are AI-curious owner-operators, not developers.

Respond with STRICT JSON only, no code fences:
{"subject": "...", "blocks": [{"type": "heading", "text": "..."}, {"type": "paragraph", "text": "..."}, {"type": "button", "text": "...", "url": "https://..."}, {"type": "divider"}]}

Rules:
- Plain-spoken, warm, useful. Sounds like a person named Alex, never a brand. Sign-offs are fine ("Alex" or "Alex & Kristina").
- Short: usually 3 to 8 blocks. One idea per email.
- Never use em dashes; use periods, commas, or colons.
- Buttons only for real destinations on ka-performancefl.com (the free course is /free-course/, the coaching program is /ai-launch/, contact is /contact/). Never invent other URLs.
- Never promise outcomes, savings, or ROI figures. Never suggest K & A provides or shares Claude accounts; people use their own.
- The only prices that exist: the 90-Day AI Launch at $2,000 (or three payments of $700) and Launch + Site at $3,999. Mention prices only when the notes ask you to.
- Do not add an unsubscribe line or footer; the template appends those.`;

export function parsePolish(text) {
  const cleaned = String(text).replace(/^```(?:json)?\s*|\s*```$/g, '');
  const parsed = JSON.parse(cleaned);
  const subject = deDash(String(parsed.subject ?? '').trim()).slice(0, 150);
  const blocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
  if (!subject || blocks.length === 0) throw new Error('polish shape');
  return { subject, body: JSON.stringify(parseBlocks(JSON.stringify(blocks))) };
}

export async function polishWithOpus(env, { notes, subject, body }) {
  const user = [
    subject ? `Current subject: ${subject}` : '',
    body ? `Current draft (JSON blocks or plain text):\n${String(body).slice(0, 6000)}` : '',
    `Alex's notes for this email:\n${String(notes).slice(0, 4000)}`,
  ].filter(Boolean).join('\n\n');

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': String(env.ANTHROPIC_API_KEY || '').replace(/[^\x21-\x7e]/g, ''),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-5',
      max_tokens: 2000,
      system: POLISH_SYSTEM,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!r.ok) throw new Error('anthropic ' + r.status);
  const data = await r.json();
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  return parsePolish(text);
}

/* ---- delivery, unchanged in spirit from 0004 ---- */

export async function sendNewsletter(env, { subject, body, leads }) {
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < leads.length; i += 100) {
    const chunk = leads.slice(i, i + 100);
    const messages = chunk.map((l) => {
      const { html, text } = renderNewsletter({ subject, body, token: l.unsubscribe_token });
      return {
        from: env.NEWSLETTER_FROM,
        to: [l.email],
        subject: deDash(subject),
        html,
        text,
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl(l.unsubscribe_token)}>` },
      };
    });
    try {
      const r = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
      if (r.ok) sent += chunk.length;
      else {
        failed += chunk.length;
        console.log('newsletter_chunk_failed', r.status, String(await r.text()).slice(0, 160));
      }
    } catch (e) {
      failed += chunk.length;
      console.log('newsletter_chunk_error', String(e).slice(0, 120));
    }
  }
  return { sent, failed };
}

export async function sendTest(env, { subject, body, to }) {
  const { html, text } = renderNewsletter({ subject, body, token: 'test-token' });
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.NEWSLETTER_FROM, to: [to], subject: `[Test] ${deDash(subject)}`, html, text }),
  });
  return r.ok;
}
