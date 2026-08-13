// The six dashboard rules, plus the two forward-looking variants that fill the
// panels. This module is imported by BOTH the dashboard page and (in Phase 5) the
// digest Worker, so the screen and the email cannot disagree. If they ever do, it
// is a bug here, not a difference of configuration.
//
// Promotion rule: dated and arrived goes in the stream, future or soft-signal goes
// in the panels. "Today" is always the Eastern date, passed in rather than read,
// so this is testable and so both callers agree on what day it is.

import { addDays, daysBetween } from './format.js';

const QUIET_DAYS = 14;

// ── The rules, one query each ─────────────

async function overdueInvoices(db, today) {
  const { results } = await db.prepare(
    `SELECT i.id, i.ref, i.kind, i.amount_cents, i.due_on, i.client_id, c.name AS client_name
       FROM invoices i JOIN clients c ON c.id = i.client_id
      WHERE i.status = 'sent' AND i.due_on IS NOT NULL AND i.due_on < ?
      ORDER BY i.due_on`
  ).bind(today).all();
  return results ?? [];
}

// Delivered work whose quote is not yet fully accounted for by any invoice.
//
// Two different sums matter here and conflating them is a real bug:
//   invoiced_cents = sent + paid          (money actually billed)
//   covered_cents  = sent + paid + expected (money billed OR already flagged)
//
// The rule fires on UNCOVERED money only, meaning quote minus covered. If a
// balance has already been recorded as an `expected` invoice, the invoice list is
// already nagging about it, so the project must not nag a second time, and more
// importantly the money strip must not count it twice: once as `expected` and
// again as a project shortfall.
export async function needsInvoicing(db) {
  const { results } = await db.prepare(
    `SELECT p.id, p.name, p.client_id, p.total_quoted_cents, p.delivered_on,
            c.name AS client_name,
            (SELECT COALESCE(SUM(amount_cents), 0) FROM invoices i
              WHERE i.project_id = p.id AND i.status IN ('sent','paid')) AS invoiced_cents,
            (SELECT COALESCE(SUM(amount_cents), 0) FROM invoices i
              WHERE i.project_id = p.id AND i.status IN ('sent','paid','expected')) AS covered_cents
       FROM projects p JOIN clients c ON c.id = p.client_id
      WHERE p.archived_at IS NULL
        AND p.delivered_on IS NOT NULL
        AND p.status <> 'cancelled'
        AND p.total_quoted_cents > 0
      ORDER BY p.delivered_on`
  ).all();
  return (results ?? [])
    .map((p) => ({ ...p, uncovered_cents: p.total_quoted_cents - p.covered_cents }))
    .filter((p) => p.uncovered_cents > 0);
}

// Active, quoted work where no deposit was ever raised. Requires a quoted total,
// so a project with no number attached does not nag.
async function depositNeverBilled(db) {
  const { results } = await db.prepare(
    `SELECT p.id, p.name, p.client_id, p.total_quoted_cents, p.started_on, c.name AS client_name
       FROM projects p JOIN clients c ON c.id = p.client_id
      WHERE p.archived_at IS NULL
        AND p.status = 'active'
        AND p.total_quoted_cents > 0
        AND NOT EXISTS (
          SELECT 1 FROM invoices i
           WHERE i.project_id = p.id AND i.kind = 'deposit' AND i.status <> 'void'
        )
      ORDER BY COALESCE(p.started_on, '9999-12-31')`
  ).all();
  return results ?? [];
}

// Active retainers with no kind='retainer' invoice recorded in this YYYY-MM.
// The substr comparison is why issued_on must stay YYYY-MM-DD: another format
// would match nothing and report every retainer unbilled forever.
async function unbilledRetainers(db, period) {
  const { results } = await db.prepare(
    `SELECT r.id, r.client_id, r.label, r.amount_cents, r.day_of_month, c.name AS client_name
       FROM retainers r JOIN clients c ON c.id = r.client_id
      WHERE r.active = 1
        AND (r.started_on IS NULL OR substr(r.started_on, 1, 7) <= ?)
        AND (r.ended_on IS NULL OR substr(r.ended_on, 1, 7) >= ?)
        AND NOT EXISTS (
          SELECT 1 FROM invoices i
           WHERE i.client_id = r.client_id AND i.kind = 'retainer' AND i.status <> 'void'
             AND substr(COALESCE(i.issued_on, i.due_on), 1, 7) = ?
        )
      ORDER BY r.day_of_month`
  ).bind(period, period, period).all();
  return results ?? [];
}

async function followupsDue(db, today) {
  const { results } = await db.prepare(
    `SELECT f.id, f.title, f.detail, f.due_on, f.client_id, f.project_id,
            c.name AS client_name, p.name AS project_name
       FROM followups f
       LEFT JOIN clients c ON c.id = f.client_id
       LEFT JOIN projects p ON p.id = f.project_id
      WHERE f.done_at IS NULL AND f.due_on IS NOT NULL AND f.due_on <= ?
      ORDER BY f.due_on`
  ).bind(today).all();
  return results ?? [];
}

async function followupsUpcoming(db, today) {
  const { results } = await db.prepare(
    `SELECT f.id, f.title, f.due_on, f.client_id, c.name AS client_name
       FROM followups f LEFT JOIN clients c ON c.id = f.client_id
      WHERE f.done_at IS NULL AND f.due_on IS NOT NULL
        AND f.due_on > ? AND f.due_on <= ?
      ORDER BY f.due_on`
  ).bind(today, addDays(today, 7)).all();
  return results ?? [];
}

// Undated open follow-ups: neither arrived nor upcoming, but they should not
// disappear entirely or the list becomes a place things go to be forgotten.
async function followupsUndated(db) {
  const { results } = await db.prepare(
    `SELECT f.id, f.title, f.client_id, c.name AS client_name
       FROM followups f LEFT JOIN clients c ON c.id = f.client_id
      WHERE f.done_at IS NULL AND f.due_on IS NULL
      ORDER BY f.created_at DESC`
  ).all();
  return results ?? [];
}

// Active projects with no note, no follow-up and no creation inside QUIET_DAYS.
// created_at counts as activity so a project added yesterday is not instantly
// called quiet, which would be noise rather than signal.
async function goneQuiet(db, today) {
  const cutoff = `${addDays(today, -QUIET_DAYS)}T00:00:00.000Z`;
  const { results } = await db.prepare(
    `SELECT p.id, p.name, p.client_id, p.waiting_on, c.name AS client_name,
            MAX(
              COALESCE((SELECT MAX(created_at) FROM notes n
                         WHERE n.entity_type = 'project' AND n.entity_id = p.id), ''),
              COALESCE((SELECT MAX(created_at) FROM followups f WHERE f.project_id = p.id), ''),
              p.created_at
            ) AS last_activity
       FROM projects p JOIN clients c ON c.id = p.client_id
      WHERE p.archived_at IS NULL AND p.status = 'active'
      ORDER BY last_activity`
  ).all();
  return (results ?? [])
    .filter((p) => p.last_activity < cutoff)
    .map((p) => ({ ...p, quiet_days: daysBetween(p.last_activity.slice(0, 10), today) }));
}

// The money strip. Overdue is a strict subset of outstanding. `expected` is money
// not yet billed, counted separately rather than folded into either.
async function moneyTotals(db, today) {
  return db.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'sent' THEN amount_cents END), 0) AS outstanding_cents,
       COALESCE(SUM(CASE WHEN status = 'sent' AND due_on IS NOT NULL AND due_on < ? THEN amount_cents END), 0) AS overdue_cents,
       COALESCE(SUM(CASE WHEN status = 'sent' AND due_on IS NOT NULL AND due_on < ? THEN 1 END), 0) AS overdue_count,
       COALESCE(SUM(CASE WHEN status = 'expected' THEN amount_cents END), 0) AS expected_cents,
       COALESCE(SUM(CASE WHEN status = 'expected' THEN 1 END), 0) AS expected_count
     FROM invoices`
  ).bind(today, today).first();
}

// ── Assembly ──────────────────────────────

export const STREAM_CAP = 20;

/**
 * Builds everything the dashboard and the digest need.
 *
 * @param {D1Database} db
 * @param {string} today YYYY-MM-DD in America/New_York
 * @returns {Promise<{money: object, stream: object[], overflow: number, panels: object, isQuiet: boolean}>}
 */
export async function getDashboard(db, today) {
  const period = today.slice(0, 7);
  const dayOfMonth = Number(today.slice(8, 10));

  const [money, overdue, needsInv, noDeposit, retainers, due, upcoming, undated, quiet] =
    await Promise.all([
      moneyTotals(db, today),
      overdueInvoices(db, today),
      needsInvoicing(db),
      depositNeverBilled(db),
      unbilledRetainers(db, period),
      followupsDue(db, today),
      followupsUpcoming(db, today),
      followupsUndated(db),
      goneQuiet(db, today),
    ]);

  // A retainer whose bill day has passed has arrived; one later this month has not.
  const retainersArrived = retainers.filter((r) => r.day_of_month <= dayOfMonth);
  const retainersLater = retainers.filter((r) => r.day_of_month > dayOfMonth);

  const stream = [
    ...overdue.map((i) => ({
      group: 'money',
      severity: 'money',
      tag: `Overdue ${daysBetween(i.due_on, today)}d`,
      title: i.client_name,
      detail: `${i.ref ? `${i.ref}, ` : ''}${i.kind} invoice, due ${i.due_on}`,
      amountCents: i.amount_cents,
      note: 'chase',
      href: `/invoices/${i.id}`,
      sortKey: `1-${i.due_on}`,
    })),
    ...needsInv.map((p) => ({
      group: 'money',
      severity: 'money',
      tag: 'Never billed',
      title: p.client_name,
      detail: `${p.name}, delivered ${p.delivered_on}`,
      amountCents: p.uncovered_cents,
      note: 'invoice it',
      href: `/projects/${p.id}`,
      sortKey: `2-${p.delivered_on}`,
    })),
    ...noDeposit.map((p) => ({
      group: 'money',
      severity: 'money',
      tag: 'No deposit',
      title: p.client_name,
      detail: `${p.name}, active with no deposit raised`,
      amountCents: p.total_quoted_cents,
      note: 'deposit',
      href: `/projects/${p.id}`,
      sortKey: `3-${p.started_on ?? ''}`,
    })),
    ...retainersArrived.map((r) => ({
      group: 'money',
      severity: 'money',
      tag: `Day ${r.day_of_month}`,
      title: r.client_name,
      detail: `${r.label}, unbilled for ${period}`,
      amountCents: r.amount_cents,
      note: 'bill it',
      href: `/clients/${r.client_id}`,
      sortKey: `4-${String(r.day_of_month).padStart(2, '0')}`,
    })),
    ...due.map((f) => ({
      group: 'promises',
      severity: 'soon',
      tag: f.due_on < today ? `${daysBetween(f.due_on, today)}d late` : 'Today',
      title: f.title,
      detail: [f.client_name, f.project_name].filter(Boolean).join(' · ') || 'No client attached',
      amountCents: null,
      note: 'follow up',
      href: '/followups',
      sortKey: `5-${f.due_on}`,
      followupId: f.id,
    })),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // "Not yet invoiced" is expected invoices PLUS delivered work no invoice covers.
  // needsInvoicing already excludes anything an `expected` invoice covers, so these
  // two cannot overlap. Showing only expected_cents here was wrong: it read $0.00
  // directly above a stream listing thousands of dollars of unbilled work.
  const notInvoicedCents = money.expected_cents
    + needsInv.reduce((n, p) => n + p.uncovered_cents, 0);
  const notInvoicedCount = money.expected_count + needsInv.length;

  return {
    money: { ...money, not_invoiced_cents: notInvoicedCents, not_invoiced_count: notInvoicedCount },
    stream: stream.slice(0, STREAM_CAP),
    overflow: Math.max(0, stream.length - STREAM_CAP),
    panels: {
      followupsUpcoming: upcoming,
      followupsUndated: undated,
      retainersLater,
      goneQuiet: quiet,
    },
    isQuiet: stream.length === 0,
    period,
  };
}
