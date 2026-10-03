// Notification routing is server-owned. Never accept recipient or sender fields from a form.
export const LEAD_TO = 'alex@ka-performancefl.com';

export function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 &&
    /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

export async function readLeadRequest(request) {
  const origin = request.headers.get('Origin');
  if (origin !== new URL(request.url).origin) throw { status: 403 };
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    throw { status: 415 };
  }
  if (Number(request.headers.get('Content-Length')) > 24000) throw { status: 413 };
  // Bound streamed bodies as well as requests with a Content-Length header.
  const reader = request.body?.getReader();
  if (!reader) throw { status: 400 };
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 24000) {
      await reader.cancel();
      throw { status: 413 };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const body = JSON.parse(new TextDecoder().decode(bytes));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw { status: 400 };
  return body;
}

export function leadSource(request) {
  const value = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)ka_src=([^;]+)/)?.[1];
  if (!value) return 'direct';
  try { return decodeURIComponent(value).replace(/[\r\n]/g, ' ').slice(0, 60); }
  catch { return 'direct'; }
}

export async function sendLeadEmail(env, { email, subject, text, requestId }) {
  // Require an explicitly configured, verified business sender before rollout.
  if (!env.RESEND_API_KEY || !/^K & A Performance Website <[a-z0-9._+-]+@ka-performancefl\.com>$/.test(env.LEAD_FROM || '')) {
    throw new Error('lead_email_unconfigured');
  }
  if (!validEmail(email)) throw new Error('lead_email_invalid');
  const headers = {
    Authorization: `Bearer ${env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  };
  if (requestId) headers['Idempotency-Key'] = `website-lead/${requestId}`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers,
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ from: env.LEAD_FROM, to: [LEAD_TO], reply_to: email, subject, text }),
  });
  if (!response.ok) throw new Error('lead_email_delivery_failed');
  const result = await response.json();
  if (!result.id) throw new Error('lead_email_delivery_failed');
}
