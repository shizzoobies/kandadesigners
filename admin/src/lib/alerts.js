// Red and recovery emails. One email when a site turns red, one when it gets
// back to green, nothing in between: amber or gray after red does not count as
// recovered, so a flapping site cannot fill the inbox.
// Sent through Resend, which already sends mail for ka-performancefl.com.

export function decideAlert(lastAlertLevel, level) {
  if (level === 'red' && lastAlertLevel !== 'red') return 'down';
  if (level === 'green' && lastAlertLevel === 'red') return 'recovered';
  return null;
}

export function alertEmail(kind, site, reason, adminUrl) {
  const link = `${adminUrl}/sites/${site.slug}`;
  if (kind === 'down') {
    return {
      subject: `${site.name} is red: ${reason}`,
      text: `${site.name} turned red.\n\nReason: ${reason}\nLive site: ${site.live_url}\nDashboard: ${link}\n\nYou will get one more email when it is back to green.`,
    };
  }
  return {
    subject: `${site.name} is back to green`,
    text: `${site.name} is back to green.\n\nLive site: ${site.live_url}\nDashboard: ${link}`,
  };
}

export async function sendEmail({ apiKey, from, to, subject, text }, fetchImpl = fetch) {
  const res = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!res.ok) throw new Error(`resend_${res.status}`);
}
