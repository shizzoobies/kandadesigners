import { describe, it, expect } from 'vitest';
import { shouldSend, buildSubject, buildText, buildHtml } from '../digest/render.js';

const URL_BASE = 'https://admin.ka-performancefl.com';

function board({ stream = [], overdue = 0, outstanding = 0, notInvoiced = 0, overflow = 0 } = {}) {
  return {
    money: {
      outstanding_cents: outstanding,
      overdue_cents: overdue,
      overdue_count: overdue > 0 ? 1 : 0,
      not_invoiced_cents: notInvoiced,
      not_invoiced_count: notInvoiced > 0 ? 1 : 0,
    },
    stream,
    overflow,
    panels: { followupsUpcoming: [], followupsUndated: [], retainersLater: [], goneQuiet: [] },
    isQuiet: stream.length === 0,
    period: '2026-08',
  };
}

const moneyRow = (over = {}) => ({
  group: 'money',
  tag: 'Overdue 12d',
  title: 'Fore Motion Golf',
  detail: 'INV-012, other invoice, due 2026-08-01',
  amountCents: 240000,
  note: 'chase',
  href: '/invoices/3',
  ...over,
});

const promiseRow = (over = {}) => ({
  group: 'promises',
  tag: 'Today',
  title: 'Send Berkseth revisions',
  detail: 'Fore Motion Golf',
  amountCents: null,
  note: 'follow up',
  href: '/followups',
  ...over,
});

describe('shouldSend', () => {
  // The whole point: a daily email that fires on quiet days gets ignored, and an
  // ignored digest is worse than none.
  it('does not send when nothing has arrived', () => {
    expect(shouldSend(board())).toBe(false);
  });
  it('sends when money has arrived', () => {
    expect(shouldSend(board({ stream: [moneyRow()] }))).toBe(true);
  });
  it('sends when only a promise is due', () => {
    expect(shouldSend(board({ stream: [promiseRow()] }))).toBe(true);
  });
  it('does not send merely because panels have content', () => {
    const b = board();
    b.panels.followupsUpcoming = [{ id: 1, title: 'Later thing', due_on: '2026-08-20' }];
    b.panels.goneQuiet = [{ id: 2, name: 'Quiet project' }];
    expect(shouldSend(b)).toBe(false);
  });
});

describe('buildSubject', () => {
  it('leads with the overdue amount when there is one', () => {
    const s = buildSubject(board({ stream: [moneyRow()], overdue: 240000 }));
    expect(s).toBe('K & A today: $2,400.00 overdue, 1 money item');
  });
  it('counts money items and promises', () => {
    const s = buildSubject(board({ stream: [moneyRow(), moneyRow(), promiseRow()] }));
    expect(s).toBe('K & A today: 2 money items, 1 promise due');
  });
  it('pluralises promises', () => {
    const s = buildSubject(board({ stream: [promiseRow(), promiseRow()] }));
    expect(s).toContain('2 promises due');
  });
  it('has no em dashes, per the house rule', () => {
    const s = buildSubject(board({ stream: [moneyRow()], overdue: 240000 }));
    expect(s).not.toContain('—');
  });
  it('degrades gracefully with an empty board', () => {
    expect(buildSubject(board())).toBe('K & A today');
  });
});

describe('buildText', () => {
  const text = buildText(board({
    stream: [moneyRow(), promiseRow()],
    overdue: 240000, outstanding: 550000, notInvoiced: 300000, overflow: 3,
  }), URL_BASE);

  it('states all three money figures', () => {
    expect(text).toContain('Outstanding $5,500.00');
    expect(text).toContain('Overdue $2,400.00');
    expect(text).toContain('Not yet invoiced $3,000.00');
  });
  it('puts money before promises', () => {
    expect(text.indexOf('MONEY, ACT FIRST')).toBeLessThan(text.indexOf('PROMISES COMING DUE'));
  });
  it('includes the row detail', () => {
    expect(text).toContain('Fore Motion Golf');
    expect(text).toContain('INV-012, other invoice, due 2026-08-01');
  });
  it('omits an amount for rows that have none', () => {
    expect(text).toMatch(/ {2}Send Berkseth revisions/);
  });
  it('mentions the overflow', () => expect(text).toContain('And 3 more'));
  it('links back to the admin', () => expect(text).toContain(URL_BASE));
  it('has no em dashes', () => expect(text).not.toContain('—'));
});

describe('buildHtml', () => {
  it('escapes client names so a stray angle bracket cannot inject markup', () => {
    const html = buildHtml(board({
      stream: [moneyRow({ title: '<script>alert(1)</script>', detail: 'a & b' })],
    }), URL_BASE);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('a &amp; b');
  });

  it('renders absolute links, since an email has no origin to be relative to', () => {
    const html = buildHtml(board({ stream: [moneyRow()] }), URL_BASE);
    expect(html).toContain(`${URL_BASE}/invoices/3`);
  });

  it('colours the overdue figure only when there is something overdue', () => {
    const withOverdue = buildHtml(board({ stream: [moneyRow()], overdue: 100 }), URL_BASE);
    const without = buildHtml(board({ stream: [moneyRow()] }), URL_BASE);
    expect(withOverdue).toContain('#7C2D12');
    // The accent still appears as a row rule, so count occurrences rather than presence.
    expect(without.split('#7C2D12').length).toBeLessThan(withOverdue.split('#7C2D12').length);
  });

  it('omits a section that has no rows', () => {
    const html = buildHtml(board({ stream: [moneyRow()] }), URL_BASE);
    expect(html).toContain('Money, act first');
    expect(html).not.toContain('Promises coming due');
  });
});
