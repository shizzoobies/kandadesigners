// Renders the daily digest from a dashboard board object.
//
// Pure on purpose: no D1, no bindings, no clock. That makes it unit-testable and
// means the email is provably built from the same board the screen renders, since
// both come from lib/dashboard.js getDashboard().
//
// House rules apply to this copy as much as to the site: no em dashes.

import { money } from '../src/lib/format.js';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * Decides whether the digest is worth sending at all.
 *
 * Only arrived items count. A daily email that fires when nothing has actually
 * come due is one you learn to ignore inside a fortnight, and then it is worse
 * than no email. Upcoming items and soft signals live on the screen, not here.
 */
export function shouldSend(board) {
  return board.stream.length > 0;
}

export function buildSubject(board) {
  const moneyRows = board.stream.filter((s) => s.group === 'money');
  const promiseRows = board.stream.filter((s) => s.group === 'promises');

  const parts = [];
  if (board.money.overdue_cents > 0) parts.push(`${money(board.money.overdue_cents)} overdue`);
  if (moneyRows.length > 0) parts.push(`${plural(moneyRows.length, 'money item')}`);
  if (promiseRows.length > 0) parts.push(`${plural(promiseRows.length, 'promise')} due`);

  return parts.length > 0 ? `K & A today: ${parts.join(', ')}` : 'K & A today';
}

function textRow(s) {
  const amount = s.amountCents === null ? '' : `${money(s.amountCents)}  `;
  return `  ${amount}${s.title}\n      ${s.tag}. ${s.detail}\n`;
}

export function buildText(board, adminUrl) {
  const moneyRows = board.stream.filter((s) => s.group === 'money');
  const promiseRows = board.stream.filter((s) => s.group === 'promises');
  const lines = [];

  lines.push(`Outstanding ${money(board.money.outstanding_cents)}`);
  lines.push(`Overdue ${money(board.money.overdue_cents)}`);
  lines.push(`Not yet invoiced ${money(board.money.not_invoiced_cents)}`);
  lines.push('');

  if (moneyRows.length > 0) {
    lines.push('MONEY, ACT FIRST');
    moneyRows.forEach((s) => lines.push(textRow(s)));
  }
  if (promiseRows.length > 0) {
    lines.push('PROMISES COMING DUE');
    promiseRows.forEach((s) => lines.push(textRow(s)));
  }
  if (board.overflow > 0) {
    lines.push(`And ${board.overflow} more, not listed here.`);
    lines.push('');
  }

  lines.push(`Open the admin: ${adminUrl}`);
  return lines.join('\n');
}

function htmlRow(s, adminUrl) {
  const amount = s.amountCents === null
    ? ''
    : `<td align="right" style="padding:6px 0 6px 14px;font-weight:700;white-space:nowrap">${esc(money(s.amountCents))}</td>`;
  return `<tr>
  <td style="padding:6px 0;border-left:2px solid ${s.group === 'money' ? '#9A3412' : '#D97706'};padding-left:10px">
    <a href="${esc(adminUrl)}${esc(s.href)}" style="color:#221C15;text-decoration:none;font-weight:600">${esc(s.title)}</a>
    <div style="color:#6C635A;font-size:13px">${esc(s.tag)}. ${esc(s.detail)}</div>
  </td>${amount}
</tr>`;
}

export function buildHtml(board, adminUrl) {
  const moneyRows = board.stream.filter((s) => s.group === 'money');
  const promiseRows = board.stream.filter((s) => s.group === 'promises');

  const section = (label, rows) => (rows.length === 0 ? '' : `
    <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6C635A;margin:22px 0 6px">${esc(label)}</p>
    <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
      ${rows.map((s) => htmlRow(s, adminUrl)).join('')}
    </table>`);

  const figure = (label, value, bad = false) => `
    <td style="padding:10px 12px;border:1px solid rgba(34,28,21,.11)">
      <div style="font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#6C635A">${esc(label)}</div>
      <div style="font-size:21px;font-weight:700;${bad ? 'color:#7C2D12' : ''}">${esc(value)}</div>
    </td>`;

  return `<!doctype html>
<html><body style="margin:0;padding:20px;background:#F8F5F2;color:#221C15;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5">
<div style="max-width:620px;margin:0 auto">
  <p style="font-size:18px;font-weight:700;margin:0 0 14px">What needs you today</p>
  <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>
    ${figure('Outstanding', money(board.money.outstanding_cents))}
    ${figure('Overdue', money(board.money.overdue_cents), board.money.overdue_cents > 0)}
    ${figure('Not yet invoiced', money(board.money.not_invoiced_cents), board.money.not_invoiced_cents > 0)}
  </tr></table>
  ${section('Money, act first', moneyRows)}
  ${section('Promises coming due', promiseRows)}
  ${board.overflow > 0 ? `<p style="color:#6C635A;font-size:13px">And ${board.overflow} more, not listed here.</p>` : ''}
  <p style="margin:26px 0 0">
    <a href="${esc(adminUrl)}" style="background:#D97706;color:#3B1F04;font-weight:700;font-size:13px;padding:9px 14px;text-decoration:none;display:inline-block">Open the admin</a>
  </p>
  <p style="color:#6C635A;font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin-top:24px">
    K &amp; A Performance. This only arrives on days something has come due.
  </p>
</div>
</body></html>`;
}

export function renderDigest(board, adminUrl) {
  return {
    subject: buildSubject(board),
    text: buildText(board, adminUrl),
    html: buildHtml(board, adminUrl),
  };
}
