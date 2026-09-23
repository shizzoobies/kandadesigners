import { describe, it, expect } from 'vitest';
import { decideAlert, alertEmail, sendEmail } from '../src/lib/alerts.js';

describe('decideAlert', () => {
  it('fires once on turning red and once on getting back to green', () => {
    expect(decideAlert(null, 'red')).toBe('down');
    expect(decideAlert('green', 'red')).toBe('down');
    expect(decideAlert('red', 'red')).toBeNull();
    expect(decideAlert('red', 'amber')).toBeNull();
    expect(decideAlert('red', 'gray')).toBeNull();
    expect(decideAlert('red', 'green')).toBe('recovered');
    expect(decideAlert(null, 'green')).toBeNull();
    expect(decideAlert('green', 'amber')).toBeNull();
  });
});

describe('alertEmail', () => {
  const site = { name: 'MBS Medicine', slug: 'mbs-medicine', live_url: 'https://mbsdoc.com' };
  it('says what is wrong and links to the dashboard', () => {
    const m = alertEmail('down', site, 'Down since 2:05 PM', 'https://admin.ka-performancefl.com');
    expect(m.subject).toBe('MBS Medicine is red: Down since 2:05 PM');
    expect(m.text).toContain('https://admin.ka-performancefl.com/sites/mbs-medicine');
    expect(m.text).not.toContain('—');
  });
  it('says when it is back', () => {
    expect(alertEmail('recovered', site, 'Up', 'https://a').subject).toBe('MBS Medicine is back to green');
  });
});

describe('sendEmail', () => {
  it('posts to Resend and throws on failure', async () => {
    let sent;
    const ok = async (url, init) => { sent = { url, init }; return new Response('{}', { status: 200 }); };
    await sendEmail({ apiKey: 'k', from: 'f@x', to: 't@x', subject: 's', text: 'b' }, ok);
    expect(sent.url).toBe('https://api.resend.com/emails');
    expect(sent.init.headers.Authorization).toBe('Bearer k');
    expect(JSON.parse(sent.init.body)).toEqual({ from: 'f@x', to: ['t@x'], subject: 's', text: 'b' });
    await expect(sendEmail({ apiKey: 'k', from: 'f', to: 't', subject: 's', text: 'b' }, async () => new Response('{}', { status: 422 })))
      .rejects.toThrow('resend_422');
  });
});
