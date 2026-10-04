import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost as lead, onRequest } from '../functions/api/lead.js';
import { onRequestPost as course } from '../functions/api/course-lead.js';
import { sendLeadEmail } from '../lib/lead-email.js';

const env = { RESEND_API_KEY: 'mock-only', LEAD_FROM: 'K & A Performance Website <leads@ka-performancefl.com>' };
const sample = { form_type: 'popup', name: 'Example Visitor', email: 'visitor@example.com', message: 'A website enquiry', request_id: '12345678-1234-4234-8234-123456789012' };
let calls;
const originalFetch = globalThis.fetch;
beforeEach(() => {
  calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    return Response.json({ id: 'mock-email-id' });
  };
});
afterEach(() => { globalThis.fetch = originalFetch; });
function request(body, headers = {}, path = '/api/lead') {
  return new Request(`https://ka-performancefl.com${path}`, {
    method: 'POST', headers: { Origin: 'https://ka-performancefl.com', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
}
test('popup sends only to business inbox and replies to visitor, ignoring routing overrides', async () => {
  const response = await lead({ env, request: request({ ...sample, to: 'attacker@example.com', from: 'attacker@example.com', reply_to: 'attacker@example.com', subject: 'override' }) });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.deepEqual(calls[0].body.to, ['alex@ka-performancefl.com']);
  assert.equal(calls[0].body.reply_to, sample.email);
  assert.equal(calls[0].body.from, env.LEAD_FROM);
  assert.equal(calls[0].body.subject, 'New lead | ka-performancefl.com');
  assert.equal(calls[0].options.headers['Idempotency-Key'], `website-lead/${sample.request_id}`);
  assert.ok(!calls[0].body.text.includes('attacker'));
});
for (const [form_type, extra, subject] of [
  ['contact', {}, 'New lead'], ['scope', {}, 'AI-scoped lead'],
  ['launch', { business: 'Example', phone: '5550100', what_eats_your_week: 'Admin', interested_in: 'One session with Alex' }, 'New lead: One session with Alex'],
  ['training', { organization: 'Example', need: 'Onboarding', lms: 'Example LMS', accessibility_requirement: 'WCAG AA' }, 'New training inquiry'],
]) {
  test(`${form_type} preserves intake and subject`, async () => {
    assert.equal((await lead({ env, request: request({ ...sample, form_type, ...extra }, { Cookie: 'ka_privacy=v1.a0.m1; ka_src=referral' }) })).status, 200);
    assert.equal(calls[0].body.subject, `${subject} | ka-performancefl.com`);
    for (const [key, value] of Object.entries(extra)) assert.ok(calls[0].body.text.includes(`${key}: ${value}`));
    assert.ok(calls[0].body.text.includes('source: referral'));
    if (['launch', 'training'].includes(form_type)) assert.ok(calls[0].body.text.includes('sms_consent: No'));
  });
}
test('honeypot returns harmless success without delivery', async () => {
  assert.equal((await lead({ env, request: request({ ...sample, botcheck: 'yes' }) })).status, 200);
  assert.equal(calls.length, 0);
});
test('invalid and header-injection inputs never send', async () => {
  for (const invalid of [{ email: 'a@example.com\r\nBcc: b@example.com' }, { name: '' }, { message: '' }, { form_type: 'constructor' }, { form_type: {} }, { request_id: '' }, { message: 'x'.repeat(8001) }, { name: {} }, { form_type: 'training' }, { form_type: 'launch' }]) {
    assert.equal((await lead({ env, request: request({ ...sample, ...invalid }) })).status, 400);
  }
  assert.equal(calls.length, 0);
});
test('cross-origin, absent origin and wrong content type never send', async () => {
  for (const [headers, status] of [[{ Origin: 'https://other.example' }, 403], [{ Origin: '' }, 403], [{ 'Content-Type': 'text/plain' }, 415]]) {
    assert.equal((await lead({ env, request: request(sample, headers) })).status, status);
  }
  assert.equal(calls.length, 0);
});
test('oversize streamed payload and malformed JSON never send', async () => {
  assert.equal((await lead({ env, request: request({ ...sample, message: 'x'.repeat(25000) }) })).status, 413);
  const malformed = new Request('https://ka-performancefl.com/api/lead', { method: 'POST', headers: { Origin: 'https://ka-performancefl.com', 'Content-Type': 'application/json' }, body: '{' });
  assert.equal((await lead({ env, request: malformed })).status, 400);
  assert.equal(calls.length, 0);
});
test('missing configuration fails visibly and never falls back to personal-inbox provider', async () => {
  assert.equal((await lead({ env: {}, request: request(sample) })).status, 502);
  assert.equal(calls.length, 0);
});
test('provider rejection, invalid success and timeout fail visibly', async () => {
  for (const response of [() => Response.json({ message: 'failure' }, { status: 429 }), () => Response.json({}), () => { throw new Error('timeout'); }]) {
    globalThis.fetch = async () => response();
    assert.equal((await lead({ env, request: request(sample) })).status, 502);
  }
});
test('GET and other methods cannot send', () => {
  assert.equal(onRequest().status, 405);
  assert.equal(calls.length, 0);
});
test('Pages aliases cannot bypass the production WAF through the new endpoint', async () => {
  for (const host of ['kandadesigners.pages.dev', 'preview.kandadesigners.pages.dev', 'unrelated.example']) {
    const req = new Request(`https://${host}/api/lead`, { method: 'POST', headers: { Origin: `https://${host}`, 'Content-Type': 'application/json' }, body: JSON.stringify(sample) });
    assert.equal((await lead({ env, request: req })).status, 403);
  }
  assert.equal(calls.length, 0);
  assert.equal((await lead({ env, request: request(sample) })).status, 200);
  assert.equal(calls.length, 1);
});
test('business-domain sender is required', async () => {
  await assert.rejects(sendLeadEmail({ ...env, LEAD_FROM: 'Visitor <visitor@example.com>' }, { email: sample.email, subject: 'Lead', text: 'test' }));
  assert.equal(calls.length, 0);
});
function database({ fail = false } = {}) {
  const queries = [];
  return { queries, prepare(sql) {
    const item = { sql }; queries.push(item);
    return { bind(...values) { item.values = values; return this; }, async run() { if (fail) throw new Error('mock db failure'); }, async first() { return { t: 'existing-unsubscribe-token' }; } };
  } };
}
test('course preserves D1 upsert and original token and sends business notification', async () => {
  const db = database();
  const response = await course({ env: { ...env, ADMIN_DB: db }, request: request({ name: 'Visitor', email: sample.email }, { Cookie: 'ka_privacy=v1.a0.m1; ka_src=partner' }, '/api/course-lead') });
  assert.deepEqual(await response.json(), { ok: true, t: 'existing-unsubscribe-token' });
  assert.match(db.queries[0].sql, /ON CONFLICT\(email\) DO UPDATE/);
  assert.match(db.queries[0].sql, /times = course_leads.times \+ 1/);
  assert.equal(db.queries[0].values[2], 'partner');
  assert.deepEqual(calls[0].body.to, ['alex@ka-performancefl.com']);
  assert.equal(calls[0].body.reply_to, sample.email);
});
test('course still succeeds when D1 saves but notification fails', async () => {
  globalThis.fetch = async () => { throw new Error('mock outage'); };
  const response = await course({ env: { ...env, ADMIN_DB: database() }, request: request({ email: sample.email }) });
  assert.deepEqual(await response.json(), { ok: true, t: 'existing-unsubscribe-token' });
});
test('course retains email-only fallback when D1 unavailable', async () => {
  for (const ADMIN_DB of [undefined, database({ fail: true })]) {
    const response = await course({ env: { ...env, ADMIN_DB }, request: request({ email: sample.email }) });
    assert.deepEqual(await response.json(), { ok: true });
  }
});
test('course fails when neither storage nor delivery succeeds', async () => {
  assert.equal((await course({ env: {}, request: request({ email: sample.email }) })).status, 502);
});
test('course honeypot and invalid email do not write or send', async () => {
  const db = database();
  assert.equal((await course({ env: { ...env, ADMIN_DB: db }, request: request({ email: sample.email, botcheck: true }) })).status, 200);
  assert.equal((await course({ env: { ...env, ADMIN_DB: db }, request: request({ email: 'bad\r\nemail' }) })).status, 400);
  assert.equal(db.queries.length, 0);
  assert.equal(calls.length, 0);
});
