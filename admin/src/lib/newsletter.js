// Newsletter rendering and delivery, the Project Makeover admin's proven
// shape carried over: render once per recipient (each message carries its
// own unsubscribe link, in the footer AND the List-Unsubscribe header),
// send through Resend's batch endpoint 100 at a time, count failures
// rather than throw. Rendering is pure so it is testable like digest/render.

const SITE_URL = 'https://ka-performancefl.com';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Body is plain text: blank lines split paragraphs, single newlines break
// lines. No markdown engine on purpose; a newsletter that needs more than
// paragraphs and links should be a page on the site that the email links to.
function paragraphs(body) {
  return String(body)
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px 0;">${escapeHtml(p).replace(/\r?\n/g, '<br>')}</p>`)
    .join('\n');
}

export function unsubscribeUrl(token) {
  return `${SITE_URL}/api/unsubscribe?t=${encodeURIComponent(token)}`;
}

export function renderNewsletter({ subject, body, token }) {
  const unsub = unsubscribeUrl(token);
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F8F5F2;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;font-family:Georgia,'Times New Roman',serif;color:#221C15;font-size:16px;line-height:1.6;">
    <p style="margin:0 0 24px 0;font-family:Courier,monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9A3412;">K &amp; A Performance</p>
    <h1 style="margin:0 0 20px 0;font-size:24px;line-height:1.25;">${escapeHtml(subject)}</h1>
    ${paragraphs(body)}
    <hr style="border:none;border-top:1px solid #d8d2ca;margin:32px 0 16px 0;">
    <p style="margin:0;font-size:12px;color:#6C635A;">
      K &amp; A Performance, Gainesville, FL ·
      <a href="${SITE_URL}/" style="color:#9A3412;">ka-performancefl.com</a> ·
      <a href="${escapeHtml(unsub)}" style="color:#6C635A;">Unsubscribe</a>
    </p>
  </div>
</body></html>`;
  const text = `${body}\n\n---\nK & A Performance, Gainesville, FL\n${SITE_URL}/\nUnsubscribe: ${unsub}`;
  return { html, text };
}

/**
 * Sends to every lead through Resend's batch endpoint. Returns
 * { sent, failed }. A failed chunk counts its recipients and moves on.
 *
 * @param {object} env needs RESEND_API_KEY and NEWSLETTER_FROM
 * @param {{subject: string, body: string, leads: {email: string, unsubscribe_token: string}[]}} args
 */
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
        subject,
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

/** One message to one address, for the test send. */
export async function sendTest(env, { subject, body, to }) {
  const { html, text } = renderNewsletter({ subject, body, token: 'test-token' });
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.NEWSLETTER_FROM, to: [to], subject: `[Test] ${subject}`, html, text }),
  });
  return r.ok;
}
