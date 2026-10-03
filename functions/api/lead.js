import { leadSource, readLeadRequest, sendLeadEmail, validEmail } from '../../lib/lead-email.js';

const forms = {
  contact: { subject: 'New lead', required: ['message'] },
  popup: { subject: 'New lead', required: ['message'] },
  scope: { subject: 'AI-scoped lead', required: ['message'] },
  launch: { subject: 'New AI Launch lead', required: ['business', 'phone', 'what_eats_your_week'] },
  training: { subject: 'New training inquiry', required: ['organization', 'need'] },
};
const fields = {
  name: 80, email: 254, message: 8000, business: 200, phone: 80,
  what_eats_your_week: 5000, current_website: 2000, interested_in: 150,
  how_did_you_hear: 300, organization: 200, need: 5000, role: 200,
  deadline: 300, audience: 500, scope: 1000, lms: 300,
  source_readiness: 300, sme_availability: 300, accessibility_requirement: 300,
};
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

export async function onRequestPost({ request, env }) {
  // The production zone's WAF does not cover Pages preview/alias hostnames.
  // Keep the new mail endpoint on the hosts protected by that zone's rules.
  if (!['ka-performancefl.com', 'www.ka-performancefl.com'].includes(new URL(request.url).hostname)) {
    return json({ success: false, error: 'Use the form at ka-performancefl.com.' }, 403);
  }
  let body;
  try { body = await readLeadRequest(request); }
  catch (error) { return json({ success: false, error: 'Invalid request.' }, error.status || 400); }
  if (body.botcheck) return json({ success: true });
  const form = typeof body.form_type === 'string' && Object.hasOwn(forms, body.form_type) ? forms[body.form_type] : null;
  if (!form || typeof body.request_id !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(body.request_id)) {
    return json({ success: false, error: 'Invalid form.' }, 400);
  }
  const data = {};
  for (const [key, max] of Object.entries(fields)) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== 'string' || body[key].length > max) {
      return json({ success: false, error: 'Please shorten the form fields.' }, 400);
    }
    data[key] = body[key].trim();
  }
  if (!data.name || !validEmail(data.email) || form.required.some(key => !data[key])) {
    return json({ success: false, error: 'Please complete the required fields.' }, 400);
  }
  const subject = body.form_type === 'launch' && data.interested_in && data.interested_in !== 'Not sure yet'
    ? `New lead: ${data.interested_in.replace(/[\r\n]/g, ' ')}` : form.subject;
  // Plain text keeps visitor markup inert. Only allowlisted fields enter the notification.
  const text = [
    `Form: ${body.form_type}`,
    ...Object.entries(data).map(([key, value]) => `${key}: ${value}`),
    `source: ${leadSource(request)}`,
    ...(['launch', 'training'].includes(body.form_type) ? ['sms_consent: No'] : []),
  ].join('\n\n');
  try {
    await sendLeadEmail(env, { email: data.email, subject: `${subject} | ka-performancefl.com`, text, requestId: body.request_id });
    return json({ success: true });
  } catch {
    // Do not log visitor data, provider response bodies, or credentials.
    console.error('lead_notification_failed');
    return json({ success: false, error: 'Please try again or email alex@ka-performancefl.com.' }, 502);
  }
}

export function onRequest() {
  return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
}
