import { describe, it, expect } from 'vitest';
import { deskCopy } from '../src/lib/desk-copy.js';

// Words a client must never see on their desk: K&A's tools, its build
// assistant, its folders and files.
const INTERNAL = /Claude|Metricool|README|To Be Released|stories\/|\.md\b|folder/i;
const all = (c) => [
  c.conn(false), c.conn(true), c.emptyDetail(false), c.emptyDetail(true), c.storiesPaused, c.noStories,
  c.noteNeeded, c.stickerFallback, c.noMedia,
];

describe('deskCopy for a client', () => {
  const c = deskCopy({ client: true, canWrite: true });

  it('says plainly that decisions save, with no K&A internals', () => {
    expect(c.conn(false)).toBe('Your decisions save as you make them. K&A sees them right away.');
    expect(c.conn(true)).toBe('Your decisions and Story ticks save as you make them. K&A sees them right away.');
    for (const t of all(c)) expect(t, t).not.toMatch(INTERNAL);
  });

  it('hides the folder and Metricool facts', () => {
    expect(c.showInternalFacts).toBe(false);
  });

  it('keeps the view-only note for a view client', () => {
    const v = deskCopy({ client: true, canWrite: false });
    expect(v.conn(false)).toMatch(/view only/);
    for (const t of all(v)) expect(t, t).not.toMatch(INTERNAL);
  });
});

describe('deskCopy for the owner', () => {
  const c = deskCopy({ client: false, canWrite: true });

  it('keeps the lines Alex relies on', () => {
    expect(c.conn(false)).toBe('Decisions save as you make them. Claude reads them from here.');
    expect(c.conn(true)).toBe('Decisions and Story ticks save as you make them. Claude reads them from here.');
    expect(c.emptyDetail(false)).toMatch(/after Claude builds them/);
    expect(c.storiesPaused).toMatch(/Ask Claude/);
    expect(c.stickerFallback).toBe('See stories/README.md');
    expect(c.noMedia).toBe('No media in this folder.');
    expect(c.showInternalFacts).toBe(true);
  });
});
